/* Connecteurs vers les outils de l'agence (Pipedrive, Abby, Qonto, Google, IA).
   Chaque connecteur ne s'active que si ses clés sont fournies en variables d'environnement.
   Aucune clé n'est écrite dans le dépôt : elles sont dans le coffre Notion de Louis.
   Les adresses des API sont réglables (…_API_URL) pour tester contre un faux serveur local :
   tests/connecteurs.js ne touche jamais aux vrais comptes. */
const crypto = require('node:crypto');
const Core = require('./public/core.js');

const CONNECTORS = {
  pipedrive: { label: 'Pipedrive', env: ['PIPEDRIVE_API_KEY', 'PIPEDRIVE_WEBHOOK_SECRET'], does: 'Deal gagné : l’espace client est préparé tout seul, il reste à choisir l’offre et le registre' },
  abby: { label: 'Abby', env: ['ABBY_API_KEY'], does: 'Import du devis signé et des factures, avec leur PDF' },
  qonto: { label: 'Qonto', env: ['QONTO_LOGIN', 'QONTO_SECRET_KEY'], does: 'Virements reçus : factures passées en « Payée » et client remercié' },
  google: { label: 'Google Drive', env: ['GOOGLE_SERVICE_ACCOUNT_JSON'], does: 'Copie des fichiers reçus dans le dossier Drive du client' },
  claude: { label: 'Assistant (API Claude)', env: ['ANTHROPIC_API_KEY'], does: 'Réponses aux questions des clients, à partir de leur projet' }
};
const configured = (name, env) => CONNECTORS[name].env.every((k) => !!env[k]);
const url = (env, key, def) => String(env[key] || def).replace(/\/$/, '');
const API = {
  pipedrive: (env) => url(env, 'PIPEDRIVE_API_URL', 'https://api.pipedrive.com/v1'),
  // Abby : chemins à confirmer avec la documentation de l'API Abby avant le premier branchement réel (avec l'accord de Louis).
  abby: (env) => url(env, 'ABBY_API_URL', 'https://api.app-abby.com'),
  qonto: (env) => url(env, 'QONTO_API_URL', 'https://thirdparty.qonto.com/v2'),
  googleToken: (env) => url(env, 'GOOGLE_TOKEN_URL', 'https://oauth2.googleapis.com/token'),
  drive: (env) => url(env, 'GOOGLE_DRIVE_UPLOAD_URL', 'https://www.googleapis.com/upload/drive/v3')
};

function status(env, db) {
  const last = (db && db.meta && db.meta.connectors) || {};
  return { connectors: Object.entries(CONNECTORS).map(([id, c]) => ({ id, label: c.label, does: c.does, configured: configured(id, env), missing: c.env.filter((k) => !env[k]), last: last[id] || null })) };
}
function stamp(db, name, summary) { db.meta = db.meta || {}; db.meta.connectors = db.meta.connectors || {}; db.meta.connectors[name] = { at: new Date().toISOString(), summary }; }
async function getJson(ctx, u, headers) {
  const r = await (ctx.fetch || fetch)(u, { headers: { accept: 'application/json', ...headers } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const lead = (db, p) => db.users.find((u) => u.id === (p && p.team && p.team.lead)) || db.users.find((u) => u.role === 'admin');

/* ---------- Pipedrive : webhook « deal mis à jour » ----------
   Dans Pipedrive : Réglages › Webhooks › Deal › Mis à jour, adresse https://…/api/hooks/pipedrive,
   authentification HTTP « orem » / PIPEDRIVE_WEBHOOK_SECRET. Formats v1 (current/previous) et v2 (data/previous) acceptés. */
async function pipedriveHook(body, headers, db, env, ctx) {
  const auth = String(headers.authorization || '');
  const given = auth.startsWith('Basic ') ? Buffer.from(auth.slice(6), 'base64').toString().split(':').slice(1).join(':') : '';
  if (!given || !same(given, env.PIPEDRIVE_WEBHOOK_SECRET)) return { status: 401, error: 'Signature invalide.' };
  const deal = body.current || body.data || {}, prev = body.previous || {};
  if (deal.status !== 'won' || prev.status === 'won') return { ok: true, summary: 'ignoré (pas un deal gagné)', notices: [] };
  const id = String(deal.id || '');
  if (!id) return { status: 400, error: 'Deal sans identifiant.' };
  if (db.projects.some((p) => p.source && String(p.source.pipedrive) === id)) return { ok: true, summary: 'déjà créé', notices: [] };
  const personId = typeof deal.person_id === 'object' && deal.person_id ? deal.person_id.value : deal.person_id;
  let person = {};
  if (personId) { try { person = (await getJson(ctx, `${API.pipedrive(env)}/persons/${encodeURIComponent(personId)}`, { 'x-api-token': env.PIPEDRIVE_API_KEY })).data || {}; } catch (e) { person = {}; } }
  const email = ((person.email || []).find((e) => e.primary) || (person.email || [])[0] || {}).value || '';
  const client = deal.org_name || (deal.org_id && deal.org_id.name) || person.org_name || deal.title || 'Nouveau client';
  const ownerName = norm(deal.owner_name || (deal.user_id && deal.user_id.name) || '').split(' ')[0];
  const owner = db.users.find((u) => u.role === 'admin' && ownerName && norm(u.name).startsWith(ownerName)) || db.users.find((u) => u.id === 'u_louis') || db.users.find((u) => u.role === 'admin');
  // L'offre et le registre ne sont jamais devinés : l'espace reste en brouillon tant que l'équipe ne les a pas choisis.
  const r = Core.createProject(db, owner, { client, projet: deal.title || '', contactName: person.first_name || '', amountHT: Number(deal.value) || 0 });
  if (r.error) return { status: 400, error: r.error };
  const p = db.projects.find((x) => x.id === r.id);
  p.source = { pipedrive: id }; p.draft = { from: 'Pipedrive', at: new Date().toISOString(), email: String(email).toLowerCase(), name: person.first_name || person.name || '' };
  const notices = db.users.filter((u) => u.role === 'admin').map((u) => ({ id: 'n_' + crypto.randomBytes(8).toString('hex'), userId: u.id, projectId: p.id, client: p.client, type: 'requests', act: 'pipedrive',
    text: `Deal gagné dans Pipedrive : ${p.client}. L’espace est prêt, il reste à choisir l’offre et le registre.`, by: owner.id, at: new Date().toISOString(), read: false, go: { view: 'admin', tab: 'pilotage' } }));
  db.notifications = db.notifications || []; db.notifications.unshift(...notices);
  stamp(db, 'pipedrive', `espace préparé : ${p.client}`);
  return { ok: true, summary: 'espace préparé : ' + p.client, projectId: p.id, notices };
}
async function webhook(source, body, headers, db, env, ctx = {}) {
  if (!CONNECTORS[source]) return { status: 404, error: 'Source inconnue.' };
  if (!configured(source, env)) return { status: 503, error: 'Connecteur non configuré.' };
  if (source === 'pipedrive') return pipedriveHook(body, headers, db, env, ctx);
  return { status: 501, error: 'Pas de webhook pour ce connecteur.' };
}

/* ---------- Abby : devis signé et factures ----------
   Le projet porte l'identifiant du client Abby (onglet « Accès et infos »). Réponse attendue, normalisée ici :
   { documents: [{ type: 'quote'|'invoice', number, label, amountHT, amountTTC, status, date, signedAt, pdfUrl }] } */
async function abbySync(db, env, projects, ctx) {
  const H = { authorization: 'Bearer ' + env.ABBY_API_KEY };
  let n = 0, pdf = 0; const notices = [];
  for (const p of projects) {
    const cid = p.ext && p.ext.abby; if (!cid) continue;
    const res = await getJson(ctx, `${API.abby(env)}/v2/customers/${encodeURIComponent(cid)}/documents`, H);
    for (const d of res.documents || res.data || []) {
      const num = String(d.number || d.reference || '').slice(0, 40); if (!num) continue;
      const ht = Number(d.amountHT ?? d.totalExclTax ?? 0), ttc = Number(d.amountTTC ?? d.totalInclTax ?? Math.round(ht * 120) / 100);
      if (d.type === 'quote') {
        if (d.signedAt || /sign|accept/i.test(d.status || '')) { p.billing.quote = num; p.billing.signedAt = d.signedAt || d.date || p.billing.signedAt; if (ht) { p.billing.totalHT = ht; p.billing.totalTTC = ttc; } n++; }
      } else {
        const status = /paid|pay[ée]e?/i.test(d.status || '') ? 'paid' : /draft|brouillon/i.test(d.status || '') ? 'future' : 'due';
        let inv = p.invoices.find((i) => i.num === num) || p.invoices.find((i) => !i.num && norm(i.label) === norm(d.label));
        if (!inv) { inv = { id: 'inv_' + crypto.randomBytes(6).toString('hex'), num, label: String(d.label || 'Facture').slice(0, 120), ht, ttc, status, date: d.date || new Date().toISOString() }; p.invoices.push(inv); n++; }
        else if (inv.num !== num || inv.status !== status) { inv.num = num; if (status === 'paid' && inv.status !== 'paid') inv.paidAt = d.paidAt || new Date().toISOString(); inv.status = status; inv.ht = ht || inv.ht; inv.ttc = ttc || inv.ttc; n++; }
      }
      const fname = (d.type === 'quote' ? `Devis ${num} signé` : `Facture ${num}`) + '.pdf';
      if (d.pdfUrl && ctx.saveFile && !p.files.some((f) => f.name === fname)) {
        const r = await (ctx.fetch || fetch)(d.pdfUrl, { headers: H });
        if (r.ok) { await ctx.saveFile(p.id, fname, Buffer.from(await r.arrayBuffer()), d.type === 'quote' ? 'Devis' : 'Facture'); pdf++; }
      }
    }
  }
  return { summary: `${n} document${n > 1 ? 's' : ''} mis à jour, ${pdf} PDF importé${pdf > 1 ? 's' : ''}`, notices };
}

/* ---------- Qonto : rapprochement des virements reçus ----------
   Un virement entrant du montant TTC d'une facture « À régler », dont le libellé ou la référence cite le numéro
   de facture ou le nom du client, la passe en « Payée » et remercie le client (une seule fois par virement). */
async function qontoSync(db, env, projects, ctx) {
  const H = { authorization: `${env.QONTO_LOGIN}:${env.QONTO_SECRET_KEY}` };
  const org = await getJson(ctx, `${API.qonto(env)}/organization`, H);
  const accounts = (org.organization && org.organization.bank_accounts) || [];
  const acc = accounts.find((a) => !env.QONTO_IBAN || a.iban === env.QONTO_IBAN) || accounts[0];
  if (!acc) return { error: 'Aucun compte Qonto trouvé.' };
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const tx = await getJson(ctx, `${API.qonto(env)}/transactions?bank_account_id=${encodeURIComponent(acc.id)}&side=credit&status[]=completed&settled_at_from=${encodeURIComponent(since)}`, H);
  db.meta.qontoSeen = db.meta.qontoSeen || [];
  let n = 0; const notices = [];
  for (const t of tx.transactions || []) {
    if (db.meta.qontoSeen.includes(t.transaction_id || t.id)) continue;
    const text = norm(`${t.label || ''} ${t.reference || ''} ${t.note || ''}`);
    for (const p of projects) {
      const inv = p.invoices.find((i) => i.status === 'due' && Math.abs(Number(i.ttc) - Number(t.amount)) < 0.01 && ((i.num && text.includes(norm(i.num))) || text.includes(norm(p.client))));
      if (!inv) continue;
      const who = lead(db, p);
      const r1 = Core.apply(db, p.id, who, { type: 'invoice.status', iid: inv.id, status: 'paid' });
      if (r1.error) continue;
      inv.paidTx = t.transaction_id || t.id;
      const tu = p.registre === 'tu', first = p.contactName ? ' ' + p.contactName : '';
      const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(inv.ttc).replace(/ | /g, ' ');
      const r2 = Core.apply(db, p.id, who, { type: 'msg.post', text: `Bonjour${first}, ${tu ? 'on a bien reçu ton' : 'nous avons bien reçu votre'} virement de ${amount} € pour la ${inv.label.toLowerCase()}${inv.num ? ' ' + inv.num : ''}. Merci !` });
      notices.push(...(r1.notices || []), ...(r2.notices || []));
      db.meta.qontoSeen.push(inv.paidTx); n++;
      break;
    }
  }
  if (db.meta.qontoSeen.length > 2000) db.meta.qontoSeen = db.meta.qontoSeen.slice(-2000);
  return { summary: `${n} paiement${n > 1 ? 's' : ''} rapproché${n > 1 ? 's' : ''}`, notices };
}

/* ---------- Google Drive : copie des fichiers reçus ----------
   Compte de service Google (JSON en variable d'environnement) ; le dossier Drive du client est partagé avec son adresse.
   Le projet porte l'identifiant (ou l'adresse) du dossier dans « Accès et infos ». */
let gToken = null;
async function googleToken(env, ctx) {
  if (gToken && gToken.exp > Date.now() + 60e3) return gToken.value;
  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/drive', aud: API.googleToken(env), iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await (ctx.fetch || fetch)(API.googleToken(env), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  if (!r.ok) throw new Error('Google refuse le compte de service (HTTP ' + r.status + ')');
  const j = await r.json(); gToken = { value: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return gToken.value;
}
const folderId = (v) => { const m = String(v || '').match(/folders\/([\w-]+)/); return m ? m[1] : String(v || '').trim(); };
async function copyToDrive(project, file, data, env, ctx = {}) {
  if (!configured('google', env)) return { skipped: 'non configuré' };
  const folder = folderId(project.ext && project.ext.drive); if (!folder) return { skipped: 'pas de dossier Drive' };
  const token = await googleToken(env, ctx);
  const boundary = 'orem' + crypto.randomBytes(8).toString('hex');
  const meta = JSON.stringify({ name: file.name, parents: [folder], description: `Déposé dans l’espace Orem le ${new Date(file.at).toLocaleDateString('fr-FR')}` });
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\ncontent-type: application/octet-stream\r\n\r\n`), data, Buffer.from(`\r\n--${boundary}--`)]);
  const r = await (ctx.fetch || fetch)(`${API.drive(env)}/files?uploadType=multipart&supportsAllDrives=true`, { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': `multipart/related; boundary=${boundary}` }, body });
  if (!r.ok) throw new Error('Copie Drive refusée (HTTP ' + r.status + ')');
  return { ok: true, id: (await r.json()).id };
}

async function sync(name, db, env, projectId, user, ctx = {}) {
  if (!CONNECTORS[name]) return { error: 'Connecteur inconnu.' };
  if (!configured(name, env)) return { error: `Connecteur non configuré : ajoutez ${CONNECTORS[name].env.join(', ')} au lancement du serveur.` };
  const projects = db.projects.filter((p) => !p.archivedAt && (!projectId || p.id === projectId));
  // Tout ou rien : si l'outil répond mal en cours de route, les projets reviennent à leur état d'avant.
  const snap = JSON.stringify(projects), seen = JSON.stringify((db.meta && db.meta.qontoSeen) || []), notifN = (db.notifications || []).length;
  try {
    const r = name === 'abby' ? await abbySync(db, env, projects, ctx) : name === 'qonto' ? await qontoSync(db, env, projects, ctx) : { error: 'Ce connecteur ne se synchronise pas à la demande.' };
    if (!r.error) stamp(db, name, r.summary);
    return r;
  } catch (e) {
    JSON.parse(snap).forEach((o, i) => { for (const k of Object.keys(projects[i])) delete projects[i][k]; Object.assign(projects[i], o); });
    if (db.meta) db.meta.qontoSeen = JSON.parse(seen); if (db.notifications) db.notifications.splice(0, db.notifications.length - notifN);
    return { error: `${CONNECTORS[name].label} ne répond pas comme prévu (${e.message}). Rien n’a été modifié.` };
  }
}

async function ask(project, user, question) {
  return { answer: null, fallback: true };
}

module.exports = { CONNECTORS, status, webhook, sync, ask, copyToDrive, configured };
