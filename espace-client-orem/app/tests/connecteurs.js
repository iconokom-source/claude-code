/* Lot 5 : connecteurs testés contre un faux serveur local (aucun appel aux vrais comptes, aucune vraie clé).
   node tests/connecteurs.js   (lance lui-même le faux serveur sur 3999 et l'app sur 3124, données temporaires) */
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
const MOCK = 3999, APP = 3124, B = `http://127.0.0.1:${APP}`;
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const calls = []; let qontoDown = false;

/* ---------- Faux outils ---------- */
const mock = http.createServer((req, res) => {
  let body = []; req.on('data', (c) => body.push(c)); req.on('end', () => {
    body = Buffer.concat(body); calls.push({ method: req.method, url: req.url, headers: req.headers, body });
    const json = (o, st = 200) => { res.writeHead(st, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.url.startsWith('/pipedrive/persons/77')) return req.headers['x-api-token'] === 'test-pipedrive' ? json({ data: { name: 'Marie Martin', first_name: 'Marie', email: [{ value: 'marie@boulangerie-martin.fr', primary: true }] } }) : json({}, 401);
    if (req.url.startsWith('/abby/v2/customers/C-42/documents')) return json({ documents: [
      { type: 'quote', number: 'D-2026-0151', status: 'signed', signedAt: '2026-10-11T15:00:00.000Z', amountHT: 7600, amountTTC: 9120, pdfUrl: `http://127.0.0.1:${MOCK}/abby/pdf/D-2026-0151` },
      { type: 'invoice', number: 'F-2026-0199', label: 'Facture d’acompte (50 %)', status: 'sent', amountHT: 3800, amountTTC: 4560, date: '2026-10-13T09:00:00.000Z', pdfUrl: `http://127.0.0.1:${MOCK}/abby/pdf/F-2026-0199` },
      { type: 'invoice', number: 'F-2026-0204', label: 'Facture de solde (50 %)', status: 'draft', amountHT: 3800, amountTTC: 4560 }] });
    if (req.url.startsWith('/abby/pdf/')) { res.writeHead(200, { 'content-type': 'application/pdf' }); return res.end('%PDF-1.4 test'); }
    if (req.url.startsWith('/qonto/')) {
      if (qontoDown) return json({ error: 'down' }, 500);
      if (req.headers.authorization !== 'test-login:test-secret') return json({}, 401);
      if (req.url.startsWith('/qonto/organization')) return json({ organization: { bank_accounts: [{ id: 'acc-1', iban: 'FR76TEST' }] } });
      if (req.url.startsWith('/qonto/transactions')) return json({ transactions: [
        { transaction_id: 'tx-1', amount: 4560, side: 'credit', label: 'VIR SEPA CABINET VARENNE', reference: 'Acompte F-2026-0199', settled_at: new Date().toISOString() },
        { transaction_id: 'tx-2', amount: 999, side: 'credit', label: 'Autre virement', reference: '', settled_at: new Date().toISOString() }] });
    }
    if (req.url === '/google/token') {
      const assertion = new URLSearchParams(body.toString()).get('assertion') || '';
      const [h, c, sig] = assertion.split('.');
      const valid = crypto.createVerify('RSA-SHA256').update(h + '.' + c).verify(publicKey, Buffer.from(sig || '', 'base64url'));
      return valid ? json({ access_token: 'tok-test', expires_in: 3600 }) : json({ error: 'invalid_grant' }, 400);
    }
    if (req.url.startsWith('/drive/files')) return req.headers.authorization === 'Bearer tok-test' ? json({ id: 'drive-file-1' }) : json({}, 401);
    json({ error: 'inconnu ' + req.url }, 404);
  });
});

(async () => {
  await new Promise((r) => mock.listen(MOCK, '127.0.0.1', r));
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'orem-connect-'));
  const env = { ...process.env, PORT: String(APP), DATA_DIR: data, MAIL_BATCH_MS: '200', MAIL_ENABLED: '',
    PIPEDRIVE_API_KEY: 'test-pipedrive', PIPEDRIVE_WEBHOOK_SECRET: 'test-hook-secret', PIPEDRIVE_API_URL: `http://127.0.0.1:${MOCK}/pipedrive`,
    ABBY_API_KEY: 'test-abby', ABBY_API_URL: `http://127.0.0.1:${MOCK}/abby`,
    QONTO_LOGIN: 'test-login', QONTO_SECRET_KEY: 'test-secret', QONTO_API_URL: `http://127.0.0.1:${MOCK}/qonto`,
    GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'espace@test.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) }),
    GOOGLE_TOKEN_URL: `http://127.0.0.1:${MOCK}/google/token`, GOOGLE_DRIVE_UPLOAD_URL: `http://127.0.0.1:${MOCK}/drive` };
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (c) => (log += c)); srv.stderr.on('data', (c) => (log += c));
  for (let i = 0; i < 50 && !/Espace client Orem/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
  try {
    // Session HTTP simple (cookie + en-tête de l'app)
    async function session(email) {
      const h = { 'content-type': 'application/json', 'x-orem': '1' };
      const code = (await (await fetch(B + '/api/login', { method: 'POST', headers: h, body: JSON.stringify({ email }) })).json()).devCode;
      const r = await fetch(B + '/api/verify', { method: 'POST', headers: h, body: JSON.stringify({ email, code }) });
      const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
      const call = async (u, o = {}) => { const x = await fetch(B + u, { ...o, headers: { ...h, cookie, ...(o.headers || {}) } }); return { status: x.status, body: await x.json().catch(() => ({})) }; };
      return { call, act: (pid, a) => call(`/api/projects/${pid}/action`, { method: 'POST', body: JSON.stringify(a) }), project: async (pid) => (await call('/api/projects/' + pid)).body.project };
    }
    const louis = await session('louis@agence-orem.fr');
    const st = (await louis.call('/api/connectors')).body.connectors;
    ok('Réglages : Pipedrive, Abby, Qonto et Google se déclarent connectés', ['pipedrive', 'abby', 'qonto', 'google'].every((k) => st.find((c) => c.id === k).configured) && !st.find((c) => c.id === 'claude').configured);
    ok('La réponse ne contient aucune clé', !JSON.stringify(st).includes('test-pipedrive') && !JSON.stringify(st).includes('test-secret'));

    // 1. Pipedrive : deal gagné → espace en brouillon
    const deal = { meta: { action: 'updated', object: 'deal' }, current: { id: 501, title: 'Site de la Boulangerie Martin', status: 'won', value: 5400, org_name: 'Boulangerie Martin', person_id: 77, owner_name: 'Théophile Lamouret' }, previous: { status: 'open' } };
    const hook = (auth, b = deal) => fetch(B + '/api/hooks/pipedrive', { method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: 'Basic ' + Buffer.from(auth).toString('base64') } : {}) }, body: JSON.stringify(b) });
    ok('Webhook sans authentification refusé (401)', (await hook(null)).status === 401);
    ok('Webhook avec un mauvais secret refusé (401)', (await hook('orem:faux')).status === 401);
    ok('Webhook signé accepté', (await hook('orem:test-hook-secret')).status === 200);
    ok('Le même deal ne crée pas deux espaces', (await hook('orem:test-hook-secret')).status === 200);
    const list = (await louis.call('/api/projects')).body.projects;
    const bm = list.filter((p) => p.client === 'Boulangerie Martin');
    ok('Un seul espace « Boulangerie Martin », en brouillon, chef de projet Théophile', bm.length === 1 && bm[0].draft && bm[0].team.lead === 'u_theo', JSON.stringify(bm.map((p) => [p.draft, p.team])));
    const pid = bm[0].id;
    ok('Théophile est prévenu dans sa boîte de réception', (await (await session('theophile@agence-orem.fr')).call('/api/inbox')).body.items.some((n) => /Deal gagné dans Pipedrive : Boulangerie Martin/.test(n.text)));
    const draft = await louis.project(pid);
    ok('Contact récupéré dans Pipedrive (Marie, marie@boulangerie-martin.fr), pas encore d’accès client', draft.draft.email === 'marie@boulangerie-martin.fr' && draft.contactName === 'Marie' && draft.billing.totalHT === 5400);
    ok('Le registre n’est jamais deviné : ouverture refusée sans tu/vous', /tutoiement/.test((await louis.act(pid, { type: 'project.confirm', offer: 'site' })).body.error || ''));
    ok('Ouverture : offre Site web au tutoiement', (await louis.act(pid, { type: 'project.confirm', offer: 'site', registre: 'tu' })).status === 200);
    const marie = await session('marie@boulangerie-martin.fr');
    const mp = await marie.project(pid);
    ok('Marie peut se connecter à son espace, au tutoiement, sans données internes', mp && mp.registre === 'tu' && !mp.draft && !mp.source && !mp.ext);

    // 2. Abby : devis signé, factures et PDF
    await louis.act('p_varenne', { type: 'project.ext', abby: 'C-42', drive: 'https://drive.google.com/drive/folders/DOSSIER-VARENNE' });
    const ab = await louis.call('/api/connectors/abby/sync', { method: 'POST', body: JSON.stringify({ projectId: 'p_varenne' }) });
    const v1 = await louis.project('p_varenne');
    ok('Abby : synchronisation faite', ab.status === 200 && /PDF/.test(ab.body.summary), JSON.stringify(ab.body));
    ok('Abby : facture de solde ajoutée (F-2026-0204, à venir)', v1.invoices.some((i) => i.num === 'F-2026-0204' && i.status === 'future'));
    ok('Abby : PDF du devis importé dans Documents', v1.files.some((f) => f.name === 'Devis D-2026-0151 signé.pdf' && f.cat === 'Devis' && f.from === 'agence'));
    await louis.call('/api/connectors/abby/sync', { method: 'POST', body: JSON.stringify({ projectId: 'p_varenne' }) });
    ok('Abby : une 2e synchronisation ne crée pas de doublon', (await louis.project('p_varenne')).files.filter((f) => /D-2026-0151 signé/.test(f.name)).length === 1);

    // 3. Qonto : virement rapproché
    qontoDown = true;
    const qd = await louis.call('/api/connectors/qonto/sync', { method: 'POST', body: '{}' });
    ok('Qonto en panne : message clair, rien de modifié', qd.status === 400 && /Rien n’a été modifié/.test(qd.body.error) && (await louis.project('p_varenne')).invoices.find((i) => i.num === 'F-2026-0199').status === 'due');
    qontoDown = false;
    const q = await louis.call('/api/connectors/qonto/sync', { method: 'POST', body: '{}' });
    const v2 = await louis.project('p_varenne');
    ok('Qonto : 1 paiement rapproché (le virement sans référence est ignoré)', q.status === 200 && /^1 paiement/.test(q.body.summary), JSON.stringify(q.body));
    ok('Qonto : acompte F-2026-0199 « Payée », action client cochée toute seule', v2.invoices.find((i) => i.num === 'F-2026-0199').status === 'paid' && v2.tasks.find((t) => t.auto === 'acompte').done);
    ok('Qonto : Julie est remerciée au vouvoiement', v2.messages.some((m) => /nous avons bien reçu votre virement de 4 560 €/.test(m.text)));
    await louis.call('/api/connectors/qonto/sync', { method: 'POST', body: '{}' });
    ok('Qonto : pas de deuxième remerciement pour le même virement', (await louis.project('p_varenne')).messages.filter((m) => /virement/.test(m.text)).length === 1);
    const julie = await session('julie@cabinet-varenne.fr');
    const jp = await julie.project('p_varenne');
    ok('Julie ne voit ni l’identifiant Abby, ni le dossier Drive, ni la référence du virement', !jp.ext && !jp.invoices.some((i) => i.paidTx));
    ok('Julie ne peut pas lancer une synchronisation', (await julie.call('/api/connectors/qonto/sync', { method: 'POST', body: '{}' })).status === 403);

    // 4. Google Drive : copie du fichier déposé par Julie
    const up = await fetch(B + '/api/projects/p_varenne/files?name=' + encodeURIComponent('Logo Varenne.png') + '&cat=Images', { method: 'POST', headers: { 'x-orem': '1', cookie: (await (async () => { const h = { 'content-type': 'application/json', 'x-orem': '1' }; const code = (await (await fetch(B + '/api/login', { method: 'POST', headers: h, body: JSON.stringify({ email: 'julie@cabinet-varenne.fr' }) })).json()).devCode; const r = await fetch(B + '/api/verify', { method: 'POST', headers: h, body: JSON.stringify({ email: 'julie@cabinet-varenne.fr', code }) }); return (r.headers.get('set-cookie') || '').split(';')[0]; })()) }, body: Buffer.from('PNGTEST') });
    for (let i = 0; i < 30 && !calls.some((c) => c.url.startsWith('/drive/files')); i++) await new Promise((r) => setTimeout(r, 100));
    const dc = calls.find((c) => c.url.startsWith('/drive/files'));
    ok('Drive : jeton obtenu avec un JWT signé par le compte de service', calls.some((c) => c.url === '/google/token') && up.status === 200);
    ok('Drive : fichier envoyé dans le dossier du client', dc && dc.body.toString().includes('"parents":["DOSSIER-VARENNE"]') && dc.body.toString().includes('Logo Varenne.png') && dc.body.toString().includes('PNGTEST'));

    // 5. Planning recalé et relances (logique, sans réseau)
    const Core = require('../public/core.js'); const db = Core.seed(); const lumen = db.projects.find((p) => p.id === 'p_lumen'); const g0 = lumen.golive;
    const rr = Core.runReminders(db, Date.now() + 9 * 864e5);
    ok('Planning : validation en retard, mise en ligne recalée et équipe prévenue', new Date(lumen.golive) > new Date(g0) && rr.notices.some((n) => n.act === 'replan' && n.userId === 'u_louis'));
    ok('Planning : pas de recalage d’un projet livré', Core.replan(db.projects.find((p) => p.id === 'p_huchet'), Date.now() + 30 * 864e5) === 0);

    ok('Aucun appel hors de la machine (tous les appels vers le faux serveur local)', calls.length > 0 && !/api\.pipedrive\.com|qonto\.com|googleapis|app-abby/.test(log));
  } catch (e) { R.push('✘ Erreur : ' + e.stack + '\n' + log.split('\n').slice(-15).join('\n')); }
  finally { srv.kill(); mock.close(); fs.rmSync(data, { recursive: true, force: true }); }
  console.log(R.join('\n'));
  process.exitCode = R.some((x) => x.startsWith('✘')) ? 1 : 0;
})();
