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
const calls = []; let qontoDown = false, gscCalls = 0, lastAsk = null, dealWon = null;
let hasSdk = true; try { require.resolve('@anthropic-ai/sdk'); } catch { hasSdk = false; }

/* ---------- Faux outils ---------- */
let figmaVersion = 1;
const mock = http.createServer((req, res) => {
  let body = []; req.on('data', (c) => body.push(c)); req.on('end', () => {
    body = Buffer.concat(body); calls.push({ method: req.method, url: req.url, headers: req.headers, body });
    const json = (o, st = 200) => { res.writeHead(st, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.url.startsWith('/pipedrive/deals/501') && req.method === 'PUT') { dealWon = JSON.parse(body).status; return json({ success: true }); }
    if (req.url.startsWith('/pipedrive/persons/77')) return req.headers['x-api-token'] === 'test-pipedrive' ? json({ data: { name: 'Marie Martin', first_name: 'Marie', email: [{ value: 'marie@boulangerie-martin.fr', primary: true }] } }) : json({}, 401);
    if (req.url.startsWith('/abby/v2/billings?customerId=C-42')) return json({ docs: [
      { id: 'b1', type: 'estimate', number: 'D-2026-0151', state: 'signed', signedAt: 1791730800000, totalAmountWithoutTaxAfterDiscount: 760000, totalAmountWithTaxAfterDiscount: 912000 },
      { id: 'b0', type: 'estimate', number: 'D-2026-0150', state: 'refused', totalAmountWithoutTaxAfterDiscount: 100 },
      { id: 'b2', type: 'advance', number: 'F-2026-0199', title: 'Facture d’acompte (50 %)', state: 'finalized', totalAmountWithoutTaxAfterDiscount: 380000, totalAmountWithTaxAfterDiscount: 456000, emittedAt: 1791882000 },
      { id: 'b3', type: 'invoice', number: 'F-2026-0204', title: 'Facture de solde (50 %)', state: 'draft', totalAmountWithoutTaxAfterDiscount: 380000, totalAmountWithTaxAfterDiscount: 456000 },
      { id: 'b5', type: 'invoice', number: 'F-2026-0210', title: 'Option maintenance', state: 'paid', paidAt: 1791900000, totalAmountWithoutTaxAfterDiscount: 50000, totalAmountWithTaxAfterDiscount: 60000, emittedAt: 1791800000 },
      { id: 'b4', type: 'invoice', number: 'F-2026-0100', state: 'paid', archivedAt: 1, totalAmountWithoutTaxAfterDiscount: 1 }], hasNextPage: false });
    if (/^\/abby\/v2\/billing\/b\d\/download/.test(req.url)) { res.writeHead(200, { 'content-type': 'application/pdf' }); return res.end('%PDF-1.4 test'); }
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
    if (req.url.startsWith('/ga4/properties/312345678:runReport')) { const b = JSON.parse(body); return req.headers.authorization === 'Bearer tok-test' && b.dateRanges.length === 2 ? json({ rows: [
      { dimensionValues: [{ value: 'date_range_0' }], metricValues: [{ value: '1250' }, { value: '1710' }, { value: '23' }] },
      { dimensionValues: [{ value: 'date_range_1' }], metricValues: [{ value: '1000' }, { value: '1500' }, { value: '20' }] }] }) : json({}, 400); }
    if (req.url.startsWith('/gsc/sites/' + encodeURIComponent('sc-domain:huchet-demorge.fr') + '/searchAnalytics/query')) { gscCalls++; return json({ rows: [gscCalls % 2 ? { clicks: 2100, impressions: 40000, position: 6.2 } : { clicks: 1800, impressions: 36000, position: 7.1 }] }); }
    if (req.url.startsWith('/v1/messages')) { lastAsk = JSON.parse(body); return json({ id: 'msg_test', type: 'message', role: 'assistant', model: lastAsk.model, content: [{ type: 'text', text: 'La mise en ligne est prévue vers le 7 novembre — on vous tient au courant.' }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }); }
    if (req.url.startsWith('/figma/')) {
      if (req.headers['x-figma-token'] !== 'test-figma' && !req.url.startsWith('/figma/img/')) return json({ err: 'Invalid token' }, 403);
      const box = (y, x = 0) => ({ x, y, width: 100, height: 100 });
      if (req.url.startsWith('/figma/files/irfVpJlJI85XG3Cv2h7cK5')) return json({ version: 'v-' + figmaVersion, document: { children: [
        { name: 'Archives', children: [{ id: '9:1', type: 'FRAME', name: 'vieux', absoluteBoundingBox: box(0) }] },
        { name: 'Bento reveal', children: [{ id: '1:1', type: 'FRAME', name: 'bento reveal', absoluteBoundingBox: box(0) }] },
        { name: 'Cas d’étude', children: [{ id: '2:2', type: 'FRAME', name: 'C 63', absoluteBoundingBox: box(500) }, { id: '2:1', type: 'FRAME', name: 'C 64', absoluteBoundingBox: box(100) }, { id: '2:3', type: 'TEXT', name: 'text', absoluteBoundingBox: box(0) }] }] } });
      if (req.url.startsWith('/figma/images/irfVpJlJI85XG3Cv2h7cK5')) { const ids = decodeURIComponent(req.url.split('ids=')[1].split('&')[0]).split(','); return json({ err: null, images: Object.fromEntries(ids.map((id) => [id, `http://127.0.0.1:${MOCK}/figma/img/${id.replace(':', '-')}.png`])) }); }
      if (req.url.startsWith('/figma/img/')) { res.writeHead(200, { 'content-type': 'image/png' }); return res.end('PNGFIGMA' + req.url); }
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
    GA4_API_URL: `http://127.0.0.1:${MOCK}/ga4`, GSC_API_URL: `http://127.0.0.1:${MOCK}/gsc`, FIGMA_TOKEN: 'test-figma', FIGMA_API_URL: `http://127.0.0.1:${MOCK}/figma`, ANTHROPIC_API_KEY: 'test-anthropic', ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK}`,
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
      return { cookie, call, act: (pid, a) => call(`/api/projects/${pid}/action`, { method: 'POST', body: JSON.stringify(a) }), project: async (pid) => (await call('/api/projects/' + pid)).body.project };
    }
    const louis = await session('louis@agence-orem.fr');
    const st = (await louis.call('/api/connectors')).body.connectors;
    ok('Réglages : Pipedrive, Abby, Qonto, Google et l’assistant se déclarent connectés', ['pipedrive', 'abby', 'qonto', 'google', 'claude'].every((k) => st.find((c) => c.id === k).configured));
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
    ok('Théophile est prévenu dans sa boîte de réception', (await (await session('theophile@agence-orem.fr')).call('/api/inbox')).body.items.some((n) => /Affaire gagnée dans Pipedrive\s: Boulangerie Martin/.test(n.text)));
    const draft = await louis.project(pid);
    ok('Contact récupéré dans Pipedrive (Marie, marie@boulangerie-martin.fr), pas encore d’accès client', draft.draft.email === 'marie@boulangerie-martin.fr' && draft.contactName === 'Marie' && draft.billing.totalHT === 5400);
    ok('Le registre n’est jamais deviné : ouverture refusée sans tu/vous', /tutoiement/.test((await louis.act(pid, { type: 'project.confirm', offer: 'site' })).body.error || ''));
    ok('Ouverture : offre Site web au tutoiement', (await louis.act(pid, { type: 'project.confirm', offer: 'site', registre: 'tu' })).status === 200);
    const inv = (await louis.call('/api/outbox')).body.items.find((m) => m.to === 'marie@boulangerie-martin.fr');
    ok('Invitation envoyée à Marie, au tutoiement', inv && /Ton espace Boulangerie Martin est prêt/.test(inv.subject), JSON.stringify(inv && inv.subject));
    const marie = await session('marie@boulangerie-martin.fr');
    await louis.act(pid, { type: 'proposal.save', title: 'Site de la boulangerie', lines: [{ t: 'Site vitrine', ht: 5400 }], depositPct: 50 });
    const prid = (await louis.project(pid)).proposals[0].id; await louis.act(pid, { type: 'proposal.send', prid });
    await marie.act(pid, { type: 'proposal.accept', prid, agree: true, name: 'Marie Martin' });
    for (let i = 0; i < 20 && !dealWon; i++) await new Promise((r) => setTimeout(r, 100));
    ok('Proposition acceptée dans l’espace : le deal Pipedrive passe en « gagné »', dealWon === 'won');
    const mp = await marie.project(pid);
    ok('Marie peut se connecter à son espace, au tutoiement, sans données internes', mp && mp.registre === 'tu' && !mp.draft && !mp.source && !mp.ext);

    // 2. Abby : devis signé, factures et PDF
    await louis.act('p_varenne', { type: 'project.ext', abby: 'C-42', drive: 'https://drive.google.com/drive/folders/DOSSIER-VARENNE' });
    const ab = await louis.call('/api/connectors/abby/sync', { method: 'POST', body: JSON.stringify({ projectId: 'p_varenne' }) });
    const v1 = await louis.project('p_varenne');
    ok('Abby : synchronisation faite', ab.status === 200 && /PDF/.test(ab.body.summary), JSON.stringify(ab.body));
    ok('Abby : facture de solde ajoutée (F-2026-0204, à venir)', v1.invoices.some((i) => i.num === 'F-2026-0204' && i.status === 'future'));
    ok('Abby : montants convertis des centimes en euros (devis 7 600 € HT, acompte 4 560 € TTC)', v1.billing.totalHT === 7600 && v1.invoices.some((i) => i.num === 'F-2026-0199' && i.ttc === 4560 && i.status === 'due'), JSON.stringify(v1.billing));
    ok('Abby : facture payée ajoutée avec son PDF', v1.invoices.some((i) => i.num === 'F-2026-0210' && i.status === 'paid' && i.ttc === 600) && v1.files.some((f) => f.name === 'Facture F-2026-0210.pdf'));
    ok('Abby : documents archivés et devis refusés ignorés', !v1.invoices.some((i) => i.num === 'F-2026-0100') && v1.billing.quote === 'D-2026-0151');
    ok('Abby : PDF téléchargés par l’API Abby, avec la clé, pas pour les brouillons', calls.some((c) => c.url.startsWith('/abby/v2/billing/b5/download') && c.headers.authorization === 'Bearer test-abby') && !calls.some((c) => c.url.startsWith('/abby/v2/billing/b3/download')));
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

    // 4 bis. Figma : visuels du fichier Huchet dans la bibliothèque de Hugo
    const fg = await louis.call('/api/connectors/figma/sync', { method: 'POST', body: JSON.stringify({ projectId: 'p_huchet' }) });
    const hpf = await louis.project('p_huchet'), fa = hpf.assets.filter((a) => a.figma);
    ok('Figma : 3 visuels importés (bento + 2 planches), pages hors sujet ignorées', fg.status === 200 && fa.length === 3 && !fa.some((a) => a.figma === '9:1'), JSON.stringify(fg.body));
    ok('Figma : planches dans l’ordre de lecture du fichier', fa.find((a) => a.title.endsWith('01')).figma === '2:1' && fa.find((a) => a.title.endsWith('02')).figma === '2:2');
    ok('Figma : images en PNG à 2x, jeton envoyé en en-tête', calls.some((c) => /\/figma\/images\/.*format=png&scale=2/.test(c.url) && c.headers['x-figma-token'] === 'test-figma'));
    ok('Figma : aucun visuel ne renvoie vers le site de l’agence', !hpf.assets.some((a) => /agence-orem\.fr/.test(a.url || '')));
    const n0 = calls.filter((c) => c.url.startsWith('/figma/img/')).length;
    await louis.call('/api/connectors/figma/sync', { method: 'POST', body: JSON.stringify({ projectId: 'p_huchet' }) });
    ok('Figma : fichier inchangé, rien n’est réimporté', calls.filter((c) => c.url.startsWith('/figma/img/')).length === n0 && (await louis.project('p_huchet')).assets.filter((a) => a.figma).length === 3);
    const hugoS = await session('hugo@huchet-demorge.fr');
    const zr = await fetch(B + '/api/projects/p_huchet/export?part=biblio', { headers: { cookie: hugoS.cookie } }), zb = Buffer.from(await zr.arrayBuffer());
    ok('Figma : Hugo télécharge tous les visuels en un ZIP', zr.status === 200 && zb.includes(Buffer.from('PNGFIGMA')) && zb.includes(Buffer.from('Bibliothèque/')) && !zb.includes(Buffer.from('Récapitulatif')));

    // 5. Bilan mensuel GA4 + Search Console
    await louis.act('p_huchet', { type: 'project.ext', ga4: '312345678', gsc: 'sc-domain:huchet-demorge.fr' });
    const gr = await louis.call('/api/connectors/google/sync', { method: 'POST', body: JSON.stringify({ projectId: 'p_huchet' }) });
    const hp = await louis.project('p_huchet'); const rp = (hp.reports || [])[0] || { stats: [] };
    ok('Bilan mensuel : synchronisation faite', gr.status === 200 && /1 bilan/.test(gr.body.summary), JSON.stringify(gr.body));
    ok('Bilan : visiteurs 1 250 contre 1 000, demandes 23, clics Google 2 100, position 6,2', JSON.stringify(rp.stats) === JSON.stringify([['Visiteurs', 1250, 1000], ['Visites', 1710, 1500], ['Demandes (conversions)', 23, 20], ['Clics depuis Google', 2100, 1800], ['Position moyenne', 6.2, 7.1]]), JSON.stringify(rp.stats));
    await louis.call('/api/connectors/google/sync', { method: 'POST', body: JSON.stringify({ projectId: 'p_huchet' }) });
    ok('Bilan : un seul par mois', (await louis.project('p_huchet')).reports.length === 1);

    // 6. Assistant (API Claude) contre un faux point d'accès local
    const hugo = await session('hugo@huchet-demorge.fr');
    const me = (await hugo.call('/api/me')).body;
    const ans = await hugo.call('/api/projects/p_huchet/ask', { method: 'POST', body: JSON.stringify({ question: 'Quand passe-t-on au bilan suivant ?' }) });
    if (hasSdk) {
      ok('Assistant : annoncé au client', me.config.assistant === true);
      ok('Assistant : réponse renvoyée, tiret long retiré', ans.status === 200 && ans.body.answer && !/[\u2014\u2013]/.test(ans.body.answer), JSON.stringify(ans.body));
      const sys = lastAsk && JSON.stringify(lastAsk.system);
      ok('Assistant : modèle par défaut, effort bas, repli serveur activé', lastAsk && lastAsk.model === 'claude-opus-5-5' && lastAsk.output_config.effort === 'low' && lastAsk.fallbacks === 'default');
      ok('Assistant : consignes au tutoiement pour Hugo, données du projet sans clés', /Tutoie le client/.test(sys) && /Huchet-Demorge/.test(sys) && !/test-anthropic|test-secret|C-42/.test(sys));
      const ju = await session('julie@cabinet-varenne.fr');
      ok('Assistant : Julie ne peut pas interroger le projet d’un autre client', (await ju.call('/api/projects/p_huchet/ask', { method: 'POST', body: JSON.stringify({ question: 'x' }) })).status === 404);
    } else ok('Assistant : SDK absent, repli sur les réponses rapides (npm install @anthropic-ai/sdk pour l’activer)', me.config.assistant === false && ans.body.fallback === true);

    // 7. Planning recalé et relances (logique, sans réseau)
    const Core = require('../public/core.js'); const db = Core.seed(); const lumen = db.projects.find((p) => p.id === 'p_lumen'); const g0 = lumen.golive;
    const rr = Core.runReminders(db, Date.now() + 9 * 864e5);
    ok('Planning : validation en retard, mise en ligne recalée et équipe prévenue', new Date(lumen.golive) > new Date(g0) && rr.notices.some((n) => n.act === 'replan' && n.userId === 'u_louis'));
    ok('Planning : pas de recalage d’un projet livré', Core.replan(db.projects.find((p) => p.id === 'p_huchet'), Date.now() + 30 * 864e5) === 0);

    ok('Aucun appel hors de la machine (tous les appels vers le faux serveur local)', calls.length > 0 && !/api\.pipedrive\.com|qonto\.com|googleapis|app-abby|api\.anthropic\.com/.test(log));
  } catch (e) { R.push('✘ Erreur : ' + e.stack + '\n' + log.split('\n').slice(-15).join('\n')); }
  finally { const gone = new Promise((r) => srv.once('exit', r)); srv.kill(); await gone; mock.close(); fs.rmSync(data, { recursive: true, force: true, maxRetries: 5 }); }
  console.log(R.join('\n'));
  process.exitCode = R.some((x) => x.startsWith('✘')) ? 1 : 0;
})();
