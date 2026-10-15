/* Espace client Orem : serveur sans dépendance.
   Local :      node server.js  →  http://localhost:3000
   Production : voir docs/conception.md (BASE_URL en https, MAIL_ENABLED, HOST derrière un proxy HTTPS).
   Données : data/db.json · Fichiers déposés : data/uploads/<projet>/<fichier> */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const Core = require('./public/core.js');
const Connectors = require('./connectors.js');

/* ---------- Configuration ---------- */
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const LOOPBACK = ['127.0.0.1', 'localhost', '::1'].includes(HOST);
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const HTTPS = BASE_URL.startsWith('https://');
const MAIL_ENABLED = process.env.MAIL_ENABLED === '1' && !!process.env.BREVO_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'espace@agence-orem.fr';
// Le code de connexion n'est montré à l'écran qu'en local, sans envoi d'e-mail. Jamais quand le serveur est exposé.
// Il faut à la fois : écoute locale, adresse publique en http://localhost, aucun envoi d'e-mail. Derrière un proxy HTTPS, jamais.
const SHOW_CODES = LOOPBACK && !MAIL_ENABLED && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE_URL) && process.env.DEV_CODES !== '0';
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DB_FILE = path.join(DATA, 'db.json');
const UPLOADS = path.join(DATA, 'uploads');
const PUBLIC = path.join(__dirname, 'public');
const MAX_UPLOAD = 2 * 1024 ** 3;            // 2 Go par fichier
const PROJECT_QUOTA = 20 * 1024 ** 3;        // 20 Go par projet
const CODE_TTL = 15 * 60 * 1000;
const SESSION_TTL = 30 * 24 * 3600 * 1000;
const COOKIE = HTTPS ? '__Host-sid' : 'sid';
// En local (codes affichés à l'écran), les limites de connexion n'ont rien à protéger : on les relâche pour enchaîner les tests.
const AUTH_SCALE = SHOW_CODES ? 10 : 1;

if (!LOOPBACK && !HTTPS) { console.error('Refus de démarrer : un serveur exposé doit avoir BASE_URL en https://'); process.exit(1); }
if (HTTPS && !MAIL_ENABLED) { console.error('Refus de démarrer : en https, les codes doivent partir par e-mail (MAIL_ENABLED=1 et BREVO_API_KEY).'); process.exit(1); }
if (!LOOPBACK && !MAIL_ENABLED) { console.error('Refus de démarrer : un serveur exposé doit envoyer les codes par e-mail (MAIL_ENABLED=1 et BREVO_API_KEY).'); process.exit(1); }

fs.mkdirSync(UPLOADS, { recursive: true });

/* ---------- Coffre des accès (nom de domaine) ----------
   Les identifiants confiés par un client sont chiffrés (AES-256-GCM) avant d'être écrits sur le disque.
   Clé : VAULT_KEY (64 caractères hexadécimaux) ou, à défaut, data/vault.key créée au premier lancement (droits 600),
   à garder hors des sauvegardes de db.json. Jamais renvoyés dans un projet, un export, un e-mail ou une notification ;
   lisibles par l'équipe seulement, chaque lecture est inscrite dans l'historique du client ; effacés à la vérification
   de l'accès ou au bout de 30 jours. */
const VAULT_TTL = 30 * 864e5;
const VAULT_KEY = (() => {
  if (/^[0-9a-f]{64}$/i.test(process.env.VAULT_KEY || '')) return Buffer.from(process.env.VAULT_KEY, 'hex');
  const f = path.join(DATA, 'vault.key');
  try { const k = Buffer.from(fs.readFileSync(f, 'utf8').trim(), 'hex'); if (k.length === 32) return k; } catch {}
  fs.mkdirSync(DATA, { recursive: true }); const k = crypto.randomBytes(32); fs.writeFileSync(f, k.toString('hex'), { mode: 0o600 }); return k;
})();
function seal(obj, aad) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', VAULT_KEY, iv); c.setAAD(Buffer.from(aad));
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return { iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}
function unseal(box, aad) {
  const d = crypto.createDecipheriv('aes-256-gcm', VAULT_KEY, Buffer.from(box.iv, 'base64')); d.setAAD(Buffer.from(aad)); d.setAuthTag(Buffer.from(box.tag, 'base64'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(box.data, 'base64')), d.final()]).toString('utf8'));
}
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const log = (event, data = {}) => console.log(JSON.stringify({ at: new Date().toISOString(), event, ...data }));

/* ---------- Stockage ----------
   Écriture atomique (fichier temporaire puis renommage) au plus toutes les 250 ms, jamais repoussée indéfiniment. */
let db;
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
else { db = { ...Core.seed(), sessions: {}, codes: {} }; log('db.created', { file: DB_FILE }); }
db.sessions ||= {}; db.codes ||= {}; db.notifications ||= []; db.outbox ||= []; db.meta ||= {}; db.webhooks ||= [];
let saveTimer = null, dirty = false;
function flush() {
  saveTimer = null; if (!dirty) return; dirty = false;
  const tmp = DB_FILE + '.tmp';
  const fd = fs.openSync(tmp, 'w');
  try { fs.writeSync(fd, JSON.stringify(db)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, DB_FILE);
}
function save() { dirty = true; if (!saveTimer) saveTimer = setTimeout(flush, 250); }
save();
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { try { flush(); } finally { process.exit(0); } });

/* ---------- E-mails ---------- */
async function sendMail(m, secret) {
  // Les e-mails de connexion ne sont jamais gardés en clair : ni l'équipe ni une copie de la base n'y ont accès.
  const entry = { at: new Date().toISOString(), to: m.to, subject: secret ? 'Code de connexion (contenu masqué)' : m.subject, html: secret ? '<p>Contenu masqué : e-mail de connexion.</p>' : m.html, sent: false };
  db.outbox.unshift(entry); db.outbox.length = Math.min(db.outbox.length, 200); save();
  if (!MAIL_ENABLED) { log('mail.local', { to: m.to, subject: m.subject }); return; }
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: 'Orem', email: MAIL_FROM }, to: [{ email: m.to, name: m.name }], subject: m.subject, htmlContent: m.html, textContent: m.text }) });
    entry.sent = r.ok; if (!r.ok) log('mail.refused', { status: r.status }); save();
  } catch (e) { log('mail.error', { message: e.message }); }
}
/* Les e-mails « instantanés » sont regroupés par destinataire pendant 2 minutes : pas de rafale. */
const pending = new Map();
function deliver(notices) {
  if (!notices || !notices.length) return;
  for (const n of notices) {
    const list = pending.get(n.userId) || []; list.push(n); pending.set(n.userId, list);
    // Une validation annulée ou un fichier retiré entre-temps ne part pas par e-mail.
    if (list.length === 1) setTimeout(() => { const items = (pending.get(n.userId) || []).filter((x) => db.notifications.some((y) => y.id === x.id)); pending.delete(n.userId); if (items.length) Core.emailsFor(db, items, BASE_URL, true).forEach(sendMail); }, Math.max(Number(process.env.MAIL_BATCH_MS || 120000), n.act === 'val.approve' ? 15000 : 0)).unref();
  }
}
function sendDigests(force, onlyUser) {
  const today = new Date().toISOString().slice(0, 10);
  if (!force && (new Date().getHours() < 18 || db.meta.lastDigest === today)) return 0;
  let n = 0;
  for (const u of db.users.filter((x) => x.role === 'admin' && (onlyUser ? x.id === onlyUser.id : Core.prefsOf(x).email === 'digest'))) {
    const m = Core.digestFor(db, u, new Date(Date.now() - 864e5).toISOString(), BASE_URL); if (m) { sendMail(m); n++; }
  }
  if (!force) { db.meta.lastDigest = today; save(); }
  return n;
}
/* Tâches de fond : récap à 18 h, relances automatiques, purge des sessions et codes expirés. */
setInterval(() => { try { background(); } catch (e) { log('error', { where: 'background', message: e.message }); } }, 5 * 60 * 1000).unref();
function background() {
  sendDigests(false);
  const r = Core.runReminders(db, Date.now()); if (r.notices.length) { save(); deliver(r.notices); }
  // Synchronisations automatiques, seulement si les clés sont fournies : Qonto chaque heure, Abby toutes les 6 heures.
  for (const [name, every] of [['qonto', 3600e3], ['abby', 6 * 3600e3], ['google', 7 * 864e5]]) {
    const last = db.meta.connectors && db.meta.connectors[name] ? new Date(db.meta.connectors[name].at).getTime() : 0;
    if (Connectors.configured(name, process.env) && Date.now() - last > every) Connectors.sync(name, db, process.env, null, null, connectorCtx()).then((x) => { save(); if (x.notices) deliver(x.notices); if (x.error) log('sync.error', { name, message: x.error }); });
  }
  const now = Date.now(); let changed = false;
  for (const [k, v] of Object.entries(db.vault || {})) if (now - new Date(v.at).getTime() > VAULT_TTL) { delete db.vault[k]; changed = true; log('vault.expired', { project: k }); }
  for (const [k, s] of Object.entries(db.sessions)) if (s.exp < now) { delete db.sessions[k]; changed = true; }
  for (const [k, c] of Object.entries(db.codes)) if (c.exp < now) { delete db.codes[k]; changed = true; }
  for (const [k, c] of Object.entries(db.invites || {})) if (c.exp < now) { delete db.invites[k]; changed = true; }
  for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  if (changed) save();
}

/* ---------- Limitation de débit ---------- */
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); const h = hits.get(key) || { n: 0, reset: now + windowMs };
  if (h.reset < now) { h.n = 0; h.reset = now + windowMs; }
  h.n++; hits.set(key, h); return h.n > max;
}
const ipOf = (req) => (process.env.TRUST_PROXY === '1' && String(req.headers['x-forwarded-for'] || '').split(',').pop().trim()) || req.socket.remoteAddress || '?';

/* ---------- HTTP ---------- */
const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY', 'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self' https://www.loom.com https://www.figma.com https://embed.figma.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'",
  ...(HTTPS ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {})
};
function send(res, status, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...SEC_HEADERS, ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
function readJson(req, max = 256 * 1024) {
  return new Promise((resolve, reject) => {
    if (Number(req.headers['content-length'] || 0) > max) { req.resume(); req.on('error', () => {}); return reject(new HttpError(413, 'Requête trop lourde.')); }
    let raw = '', over = false;
    req.on('data', (c) => { if (over) return; raw += c; if (raw.length > max) { over = true; raw = ''; reject(new HttpError(413, 'Requête trop lourde.')); setTimeout(() => req.destroy(), 50); } });
    req.on('end', () => {
      if (over) return reject(new HttpError(413, 'Requête trop lourde.'));
      try { const v = raw ? JSON.parse(raw) : {}; if (!v || typeof v !== 'object' || Array.isArray(v)) throw 0; resolve(v); }
      catch { reject(new HttpError(400, 'Requête invalide.')); }
    });
    req.on('error', () => reject(new HttpError(400, 'Requête interrompue.')));
  });
}
function cookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('='); if (i < 0) continue;
    if (part.slice(0, i).trim() !== name) continue;
    const v = part.slice(i + 1).trim(); try { return decodeURIComponent(v); } catch { return v; }
  }
  return null;
}
/* Jetons d'API de l'équipe (serveur MCP, Claude Code) : créés par « node jeton.js <e-mail> », stockés hachés
   dans data/api-tokens.json, relus à chaque changement du fichier. Réservés aux comptes de l'agence. */
const TOKENS_FILE = path.join(DATA, 'api-tokens.json');
let tokens = { mtime: 0, map: {} };
function tokenUser(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer\s+(orem_[A-Za-z0-9_-]{20,})$/); if (!m) return null;
  try { const st = fs.statSync(TOKENS_FILE); if (st.mtimeMs !== tokens.mtime) tokens = { mtime: st.mtimeMs, map: JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8')) }; } catch { return null; }
  const t = tokens.map[sha(m[1])]; if (!t || (t.exp && new Date(t.exp) < new Date())) return null;
  const u = db.users.find((x) => x.id === t.uid); return u && u.role === 'admin' ? u : null;
}
function currentUser(req) {
  const tu = tokenUser(req); if (tu) return tu;
  const sid = cookie(req, COOKIE); if (!sid) return null;
  const s = db.sessions[sha(sid)];
  if (!s || s.exp < Date.now()) return null;
  return db.users.find((u) => u.id === s.uid) || null;
}
function openSession(res, user) {
  user.lastLoginAt = new Date().toISOString();
  const sid = crypto.randomBytes(32).toString('hex');
  db.sessions[sha(sid)] = { uid: user.id, exp: Date.now() + SESSION_TTL, at: Date.now() };
  save(); log('auth.session', { user: user.id });
  res.setHeader('Set-Cookie', `${COOKIE}=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}${HTTPS ? '; Secure' : ''}`);
}
const clearCookie = (res) => res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${HTTPS ? '; Secure' : ''}`);
/* Ce qu'on renvoie d'une personne : le client ne voit jamais les réglages internes de l'agence. */
const publicUser = (u, viewer) => u && { id: u.id, email: u.email, name: u.name, role: u.role, projectId: u.projectId, title: u.title, contact: u.contact, wa: u.wa, phone: u.phone, photo: u.photo, onboardedAt: u.onboardedAt,
  invitedAt: viewer && viewer.role === 'admin' ? u.invitedAt : undefined, lastLoginAt: viewer && viewer.role === 'admin' ? u.lastLoginAt : undefined, prefs: viewer && viewer.id === u.id ? u.prefs : undefined,
  notify: viewer && viewer.id === u.id && u.role === 'admin' ? Core.prefsOf(u) : undefined };
const team = (viewer) => db.users.filter((u) => u.role === 'admin').map((u) => publicUser(u, viewer));

/* ---------- Connexion par code ou lien ---------- */
function requestCode(email, ip) {
  if (limited('login-ip:' + ip, 20 * AUTH_SCALE, 15 * 60e3)) return { status: 429, error: 'Trop de demandes depuis cet appareil. Réessayez dans quelques minutes.' };
  if (limited('login-mail:' + email, 5 * AUTH_SCALE, 15 * 60e3)) return { status: 429, error: 'Trop de demandes pour cette adresse. Réessayez dans quelques minutes.' };
  const user = db.users.find((u) => u.email === email);
  if (!user) { log('auth.unknown', { ip }); return { ok: true }; } // même réponse : on ne révèle pas qui a un compte
  const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
  const token = crypto.randomBytes(24).toString('hex');
  const prev = db.codes[sha(email)];
  db.codes[sha(email)] = { code: sha(email + ':' + code), token: sha(token), exp: Date.now() + CODE_TTL, tries: {} };
  save(); log('auth.code', { user: user.id, ip });
  const link = `${BASE_URL}/auth/${token}`;
  if (SHOW_CODES) console.log(`\n✉️  Connexion de ${email}\n   Code : ${code}\n   Lien : ${link}\n`);
  if (MAIL_ENABLED) sendMail(Core.loginMail(user, code, link, (db.projects.find((p) => p.id === user.projectId) || {}).registre), true);
  return { ok: true, devCode: SHOW_CODES ? code : undefined };
}
/* Échecs comptés par adresse ET par appareil : un inconnu peut se bloquer lui-même, jamais le vrai titulaire. */
function failed(email, ip) {
  const k = 'fail:' + sha(email + '|' + ip), now = Date.now(); const f = (db.meta[k] || []).filter((t) => t > now - 864e5); f.push(now); db.meta[k] = f;
  if (f.length >= 10) { db.meta['lock:' + sha(email + '|' + ip)] = now + 3600e3; log('auth.locked', { email: sha(email).slice(0, 8) }); }
  save();
}
function verifyCode(email, code, ip) {
  if (limited('verify-ip:' + ip, 30 * AUTH_SCALE, 15 * 60e3)) return { status: 429, error: 'Trop d’essais depuis cet appareil. Réessayez dans quelques minutes.' };
  const lock = db.meta['lock:' + sha(email + '|' + ip)]; if (lock && lock > Date.now()) return { error: 'Trop d’essais depuis cet appareil. Réessayez dans une heure.' };
  const c = db.codes[sha(email)];
  if (!c || c.exp < Date.now()) return { error: 'Code incorrect ou expiré. Demandez-en un nouveau.' };
  if (typeof c.tries !== 'object' || !c.tries) c.tries = {};
  const mine = (c.tries[ip] = (c.tries[ip] || 0) + 1), total = Object.values(c.tries).reduce((a, b) => a + b, 0);
  if (mine > 5) { failed(email, ip); return { error: 'Trop d’essais avec ce code depuis cet appareil. Demandez-en un nouveau.' }; }
  if (total > 50) { delete db.codes[sha(email)]; save(); return { error: 'Code expiré. Demandez-en un nouveau.' }; }
  const given = Buffer.from(sha(email + ':' + String(code).replace(/\D/g, '').padStart(6, '0').slice(0, 6)));
  if (!crypto.timingSafeEqual(given, Buffer.from(c.code))) { failed(email, ip); save(); return { error: 'Code incorrect. Vérifiez les 6 chiffres reçus par e-mail.' }; }
  delete db.codes[sha(email)]; save();
  const u = db.users.find((x) => x.email === email);
  return u ? { user: u } : { error: 'Code incorrect ou expiré. Demandez-en un nouveau.' };
}
function verifyLink(token, ip) {
  if (limited('link-ip:' + ip, 30 * AUTH_SCALE, 15 * 60e3)) return null;
  const h = sha(String(token));
  const inv = db.invites && db.invites[h];
  if (inv) { delete db.invites[h]; save(); return inv.exp > Date.now() ? db.users.find((x) => x.id === inv.userId) || null : null; }
  const entry = Object.entries(db.codes).find(([, c]) => c.token === h && c.exp > Date.now());
  if (!entry) return null;
  delete db.codes[entry[0]]; save();
  return db.users.find((x) => sha(x.email) === entry[0]) || null;
}

/* ---------- Fichiers statiques (compressés, mis en cache) ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webp': 'image/webp' };
function serveStatic(req, res, pathname) {
  let rel; try { rel = decodeURIComponent(pathname === '/' ? 'index.html' : pathname.slice(1)); } catch { return send(res, 400, 'Requête invalide.'); }
  let file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 404, 'Introuvable.');
  let st = null; try { st = fs.statSync(file); } catch {}
  if (!st || !st.isFile()) {
    if (path.extname(rel)) return send(res, 404, 'Introuvable.');
    file = path.join(PUBLIC, 'index.html'); st = fs.statSync(file); // application d'une seule page
  }
  const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  const longCache = file.includes(path.sep + 'assets' + path.sep);
  const base = { ...SEC_HEADERS, ETag: etag, 'Cache-Control': longCache ? 'public, max-age=604800' : 'no-cache', Vary: 'Accept-Encoding' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, base); return res.end(); }
  const gz = /\bgzip\b/.test(req.headers['accept-encoding'] || '') && /\.(js|css|html|svg)$/.test(file);
  res.writeHead(200, { ...base, 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', ...(gz ? { 'Content-Encoding': 'gzip' } : { 'Content-Length': st.size }) });
  const stream = fs.createReadStream(file); stream.on('error', () => res.destroy());
  (gz ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
}

/* ---------- Routes ---------- */
const VIDT = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };
const IMGT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
const PDFT = { '.pdf': 'application/pdf' };
function filePath(f) {
  if (!f || !f.path) return null;
  const abs = path.resolve(DATA, f.path);
  return abs.startsWith(UPLOADS + path.sep) ? abs : null;
}
/* ---------- Export ZIP d'un espace (fin de projet) ----------
   Archive « stockée » (sans compression, les fichiers déposés le sont déjà souvent), écrite en flux :
   chaque fichier est lu une fois, son CRC est donné après les données (descripteur). Limite : 4 Go au total. */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = zlib.crc32 || ((buf, prev = 0) => { let c = ~prev >>> 0; for (let i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; });
async function sendZip(res, name, entries) {
  // entries : [{ name, data: Buffer } | { name, abs }]
  res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': 'application/zip', 'Cache-Control': 'no-store', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}` });
  const central = []; let offset = 0;
  const write = (b) => new Promise((ok) => { offset += b.length; if (res.write(b)) ok(); else res.once('drain', ok); });
  const dos = (d) => [((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff, (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff];
  const [tm, dt] = dos(new Date());
  const used = new Set();
  for (const e of entries) {
    let fname = e.name.split('/').map((seg) => seg.replace(/[\\:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+$/, '_')).join('/'); const base = fname; let i = 2;
    while (used.has(fname)) { const dot = base.lastIndexOf('.'); fname = dot > 0 ? `${base.slice(0, dot)} (${i})${base.slice(dot)}` : `${base} (${i})`; i++; }
    used.add(fname);
    const nameBuf = Buffer.from(fname, 'utf8'), start = offset;
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0808, 6); lh.writeUInt16LE(0, 8); lh.writeUInt16LE(tm, 10); lh.writeUInt16LE(dt, 12); lh.writeUInt16LE(nameBuf.length, 26);
    await write(lh); await write(nameBuf);
    let crc = 0, size = 0;
    if (e.data) { crc = crc32(e.data); size = e.data.length; await write(e.data); }
    else await new Promise((ok, ko) => { const st = fs.createReadStream(e.abs); st.on('data', (c) => { crc = crc32(c, crc); size += c.length; offset += c.length; if (!res.write(c)) { st.pause(); res.once('drain', () => st.resume()); } }); st.on('end', ok); st.on('error', ko); });
    const dd = Buffer.alloc(16); dd.writeUInt32LE(0x08074b50, 0); dd.writeUInt32LE(crc >>> 0, 4); dd.writeUInt32LE(size, 8); dd.writeUInt32LE(size, 12); await write(dd);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0808, 8); ch.writeUInt16LE(0, 10); ch.writeUInt16LE(tm, 12); ch.writeUInt16LE(dt, 14);
    ch.writeUInt32LE(crc >>> 0, 16); ch.writeUInt32LE(size, 20); ch.writeUInt32LE(size, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(start, 42);
    central.push(Buffer.concat([ch, nameBuf]));
  }
  const cd = Buffer.concat(central), cdStart = offset; await write(cd);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length, 8); end.writeUInt16LE(central.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(cdStart, 16);
  res.end(end);
}
function exportEntries(pr, user) {
  const people = Object.fromEntries(db.users.map((u) => [u.id, u.name]));
  const lines = [`${pr.client} · ${pr.projet}`, `Offre : ${Core.offerOf(pr)}`, `Export du ${new Date().toLocaleDateString('fr-FR')}`, '',
    'Étapes', ...pr.phases.map((ph) => `  ${ph.letter} · ${ph.t} (${Core.phaseState(pr, ph) === 'done' ? 'terminé' : Core.phaseState(pr, ph) === 'on' ? 'en cours' : 'à venir'})\n${ph.items.map((it) => `    - ${it.t} : ${{ done: 'fait', review: 'à valider', on: 'en cours', wait: 'prévu' }[Core.itemState(pr, it)]}`).join('\n')}`), '',
    'Validations', ...pr.validations.map((v) => `  - ${v.t} : ${{ wait: 'pas encore demandée', ready: 'en attente', approved: 'validée', changes: 'modifications demandées' }[v.status]}${v.history.filter((h) => h.action === 'approved').map((h) => ` le ${new Date(h.at).toLocaleString('fr-FR')} par ${people[h.by] || h.by}`).join('')}`), '',
    'Factures', ...pr.invoices.map((i) => `  - ${i.label} ${i.num || ''} : ${i.ttc} € TTC, ${{ paid: 'payée', due: 'à régler', future: 'à venir' }[i.status] || i.status}`), '',
    'Messages', ...pr.messages.slice().reverse().map((m) => `  [${new Date(m.at).toLocaleString('fr-FR')}] ${people[m.by] || (m.by === 'team' ? 'L’équipe Orem' : m.by)} : ${m.text}${m.loom ? ' (vidéo : ' + m.loom.url + ')' : ''}`)];
  const files = Core.forUser(pr, user).files.map((f) => ({ f: pr.files.find((x) => x.id === f.id) })).map(({ f }) => ({ f, abs: filePath(f) }))
    .filter(({ abs }) => { try { return abs && fs.statSync(abs).isFile(); } catch { return false; } })
    .map(({ f, abs }) => ({ name: (f.from === 'client' ? 'Fichiers déposés/' : f.cat === 'Bibliothèque' ? 'Bibliothèque/' : 'Documents de l’agence/') + f.name, abs, size: Number(f.size) || 0 }));
  return [{ name: 'Récapitulatif du projet.txt', data: Buffer.from('﻿' + lines.join('\n'), 'utf8') }, ...files];
}
/* Contexte donné aux connecteurs : enregistrer un PDF importé (Abby) comme un fichier déposé par l'agence. */
function connectorCtx() {
  return {
    fetch: globalThis.fetch, db,
    saveFile: async (projectId, name, buf, cat) => {
      const pr = db.projects.find((x) => x.id === projectId); if (!pr) return;
      const id = 'f_' + crypto.randomBytes(12).toString('hex'), dir = path.join(UPLOADS, pr.id); fs.mkdirSync(dir, { recursive: true });
      const dest = path.join(dir, id); await fs.promises.writeFile(dest, buf);
      const by = db.users.find((u) => u.id === (pr.team && pr.team.lead)) || db.users.find((u) => u.role === 'admin');
      const r = Core.addFile(db, pr.id, by, { id, name, size: buf.length, cat, path: path.relative(DATA, dest) });
      if (r.error) { fs.rm(dest, { force: true }, () => {}); return null; }
      return { id };
    }
  };
}
/* Copie vers le dossier Drive du client, en arrière-plan : un échec est journalisé, jamais bloquant pour le client. */
function driveCopy(pr, file) {
  if (!Connectors.configured('google', process.env) || !(pr.ext && pr.ext.drive)) return;
  const abs = filePath(file); if (!abs) return;
  fs.promises.readFile(abs).then((buf) => Connectors.copyToDrive(pr, file, buf, process.env, connectorCtx()))
    .then((r) => { if (r && r.ok) { file.drive = r.id; save(); log('drive.copy', { project: pr.id, file: file.id }); } })
    .catch((e) => log('drive.error', { project: pr.id, message: e.message }));
}
const activeUploads = new Map();
/* Invitation du client : e-mail de bienvenue dans son registre, signé par le chef de projet. */
function invite(projectId, userId) {
  if (!userId) return;
  const pr = db.projects.find((x) => x.id === projectId), u = db.users.find((x) => x.id === userId);
  if (!pr || !u) return;
  const lead = db.users.find((x) => x.id === (pr.team && pr.team.lead));
  // Lien d'invitation personnel : un clic suffit pour entrer (valable 7 jours, une seule fois). Ensuite, connexion par code ou lien.
  const token = crypto.randomBytes(24).toString('hex');
  db.invites ||= {}; db.invites[sha(token)] = { userId: u.id, exp: Date.now() + 7 * 864e5 }; save();
  sendMail(Core.inviteMail(u, pr, lead, BASE_URL, `${BASE_URL}/auth/${token}`)); log('invite', { project: pr.id, user: u.id });
}
function projectBytes(pr) { return pr.files.reduce((s, f) => s + (f.path ? Number(f.size) || 0 : 0), 0); }

async function handle(req, res) {
  let url; try { url = new URL(req.url, BASE_URL); } catch { return send(res, 400, { error: 'Requête invalide.' }); }
  const p = url.pathname, ip = ipOf(req);
  const mutating = req.method !== 'GET' && req.method !== 'HEAD';
  // Protection CSRF : toute écriture doit venir de notre propre interface (en-tête personnalisé, impossible depuis un autre site).
  if (p.startsWith('/api/') && mutating && req.headers['x-orem'] !== '1' && !p.startsWith('/api/hooks/')) return send(res, 403, { error: 'Requête refusée.' });

  /* Webhooks entrants (Pipedrive…) : signés par un secret partagé, sans session. */
  let m = p.match(/^\/api\/hooks\/([a-z]+)$/);
  if (m && req.method === 'POST') {
    const body = await readJson(req, 512 * 1024);
    if (limited('hook-ip:' + ip, 60, 60e3)) return send(res, 429, { error: 'Trop de requêtes.' });
    const r = await Connectors.webhook(m[1], body, req.headers, db, process.env, connectorCtx());
    if (r.error) { log('hook.refused', { source: m[1], reason: r.error }); return send(res, r.status || 400, { error: r.error }); }
    save(); deliver(r.notices); log('hook.ok', { source: m[1], result: r.summary });
    return send(res, 200, { ok: true });
  }

  if (p === '/api/login' && req.method === 'POST') {
    const { email } = await readJson(req);
    const r = requestCode(String(email || '').trim().toLowerCase().slice(0, 200), ip);
    return send(res, r.status || 200, r.status ? { error: r.error } : r);
  }
  if (p === '/api/verify' && req.method === 'POST') {
    const { email, code } = await readJson(req);
    const r = verifyCode(String(email || '').trim().toLowerCase().slice(0, 200), String(code || ''), ip);
    if (!r.user) return send(res, r.status || 401, { error: r.error });
    openSession(res, r.user);
    return send(res, 200, { ok: true });
  }
  // Le lien reçu par e-mail ouvre une page qui demande de confirmer : les antivirus de messagerie ne le « consomment » plus.
  if (p === '/api/auth/link' && req.method === 'POST') {
    const { token } = await readJson(req);
    const u = verifyLink(String(token || '').slice(0, 200), ip);
    if (!u) return send(res, 401, { error: 'Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.' });
    openSession(res, u); return send(res, 200, { ok: true });
  }
  if (p === '/api/logout' && req.method === 'POST') {
    const sid = cookie(req, COOKIE); if (sid) { delete db.sessions[sha(sid)]; save(); }
    if (req.headers['x-all'] === '1') { const u = currentUser(req); if (u) { for (const [k, s] of Object.entries(db.sessions)) if (s.uid === u.id) delete db.sessions[k]; save(); } }
    clearCookie(res); return send(res, 200, { ok: true });
  }

  if (!p.startsWith('/api/')) return serveStatic(req, res, p);
  const user = currentUser(req);
  if (!user) return send(res, 401, { error: 'Connectez-vous pour continuer.' });
  if (mutating && limited('act:' + user.id, 120, 60e3)) return send(res, 429, { error: 'Trop d’actions en peu de temps. Patientez une minute.' });
  if (mutating && user.role !== 'admin' && limited('actday:' + user.id, 3000, 864e5)) return send(res, 429, { error: 'Beaucoup d’actions aujourd’hui. Réessayez demain ou écrivez à l’équipe.' });

  if (p === '/api/me') return send(res, 200, { user: publicUser(user, user), team: team(user), config: { ...Core.publicConfig(db), assistant: Connectors.assistantReady(process.env) } });
  if (p === '/api/logout-all' && req.method === 'POST') { for (const [k, s] of Object.entries(db.sessions)) if (s.uid === user.id) delete db.sessions[k]; save(); clearCookie(res); return send(res, 200, { ok: true }); }
  if (p === '/api/inbox' && req.method === 'GET') return send(res, 200, { items: Core.inbox(db, user) });
  if (p === '/api/inbox/done' && req.method === 'POST') { if (user.role !== 'admin') return send(res, 403, { error: 'Réservé à l’équipe.' }); const b = await readJson(req); const r = Core.doneNotif(db, user, String(b.id || ''), !!b.undo); if (r.ok) save(); return send(res, r.error ? 400 : 200, r); }
  if (p === '/api/inbox/read' && req.method === 'POST') { const b = await readJson(req); Core.readNotif(db, user, typeof b.id === 'string' ? b.id : null, b.ids); save(); return send(res, 200, { ok: true }); }
  if (p === '/api/me/prefs' && req.method === 'POST') { const r = Core.setPrefs(db, user, await readJson(req)); if (r.ok) save(); return send(res, r.error ? 400 : 200, r); }
  if (p === '/api/outbox' && req.method === 'GET') { if (user.role !== 'admin') return send(res, 403, { error: 'Réservé à l’équipe.' }); return send(res, 200, { enabled: MAIL_ENABLED, items: db.outbox.filter((x) => x.to === user.email || db.users.some((u) => u.email === x.to && u.role !== 'admin')).slice(0, 50) }); }
  if (p === '/api/digest' && req.method === 'POST') { if (user.role !== 'admin') return send(res, 403, { error: 'Réservé à l’équipe.' }); return send(res, 200, { ok: true, sent: sendDigests(true, user) }); }
  if (p === '/api/settings' && req.method === 'POST') { const r = Core.setSettings(db, user, await readJson(req)); if (r.ok) save(); return send(res, r.error ? 400 : 200, r); }
  if (p === '/api/connectors' && req.method === 'GET') { if (user.role !== 'admin') return send(res, 403, { error: 'Réservé à l’équipe.' }); return send(res, 200, Connectors.status(process.env, db)); }
  m = p.match(/^\/api\/connectors\/([a-z]+)\/sync$/);
  if (m && req.method === 'POST') {
    if (user.role !== 'admin') return send(res, 403, { error: 'Réservé à l’équipe.' });
    const b = await readJson(req);
    const r = await Connectors.sync(m[1], db, process.env, typeof b.projectId === 'string' ? b.projectId : null, user, connectorCtx());
    if (r.error) return send(res, 400, { error: r.error });
    save(); deliver(r.notices); return send(res, 200, { ok: true, summary: r.summary });
  }

  if (p === '/api/projects' && req.method === 'GET') return send(res, 200, { projects: db.projects.filter((pr) => Core.canSee(user, pr)).map((x) => Core.summary(x, user)) });
  if (p === '/api/projects' && req.method === 'POST') { const b = await readJson(req); delete b.draft; const r = Core.createProject(db, user, b); if (r.ok) { save(); invite(r.id, r.invite); } return send(res, r.error ? 400 : 200, r); }

  m = p.match(/^\/api\/projects\/([\w-]+)$/);
  if (m && req.method === 'GET') {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    const access = user.role === 'admin' ? db.users.filter((u) => u.projectId === pr.id).map((u) => publicUser(u, user)) : undefined;
    const people = Object.fromEntries(db.users.filter((u) => u.role === 'admin' || u.projectId === pr.id).map((u) => [u.id, u.name]));
    const vault = db.vault && db.vault[pr.id] ? { at: db.vault[pr.id].at } : null;
    return send(res, 200, { project: Core.forUser(pr, user), access, people, vault });
  }

  m = p.match(/^\/api\/projects\/([\w-]+)\/action$/);
  if (m && req.method === 'POST') {
    const action = await readJson(req);
    const pr = db.projects.find((x) => x.id === m[1]);
    const doomed = action.type === 'file.remove' && pr && Core.canSee(user, pr) ? pr.files.find((f) => f.id === action.fid) : null;
    if (action && action.type === 'proposal.accept') action.proof = { ip: ipOf(req), ua: String(req.headers['user-agent'] || '') };
    const r = Core.apply(db, m[1], user, action, action && action.type === 'proposal.accept');
    if (r.ok) {
      save(); deliver(r.notices); invite(m[1], r.invite);
      if (r.accepted) Connectors.onAccept(db.projects.find((x) => x.id === m[1]), r.accepted, process.env, connectorCtx()).then((x) => { if (x && x.ok) log('pipedrive.won', { project: m[1] }); }).catch((e) => log('pipedrive.error', { message: e.message }));
      if (doomed) { const abs = filePath(doomed); if (abs) fs.rm(abs, { force: true }, () => {}); }
      if (r.purgeVault && db.vault && db.vault[m[1]]) { delete db.vault[m[1]]; save(); log('vault.erased', { project: m[1], user: user.id, why: 'checked' }); }
    }
    const { notices, ...pub } = r;
    return send(res, r.error ? 400 : 200, pub);
  }

  /* Signature d'un document : le serveur calcule l'empreinte SHA-256 du fichier signé et ajoute la preuve (IP, navigateur). */
  m = p.match(/^\/api\/projects\/([\w-]+)\/files\/([\w-]+)\/(sign|proof)$/);
  if (m) {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    const f = pr.files.find((x) => x.id === m[2]); if (!f) return send(res, 404, { error: 'Fichier introuvable.' });
    if (m[3] === 'sign' && req.method === 'POST') {
      if (user.role === 'admin') return send(res, 403, { error: 'C’est au client de signer.' });
      const b = await readJson(req, 300 * 1024), abs = filePath(f);
      let hash = ''; try { hash = abs ? crypto.createHash('sha256').update(await fs.promises.readFile(abs)).digest('hex') : ''; } catch {}
      const r = Core.apply(db, pr.id, user, { type: 'file.sign', fid: f.id, name: b.name, agree: !!b.agree, sig: b.sig, hash, ip: ipOf(req), ua: String(req.headers['user-agent'] || '') }, true);
      if (r.error) return send(res, 400, { error: r.error });
      save(); deliver(r.notices); log('file.signed', { project: pr.id, file: f.id, user: user.id });
      return send(res, 200, { ok: true });
    }
    if (m[3] === 'proof' && req.method === 'GET') {
      const sg = f.sign; if (!sg || sg.status !== 'signed') return send(res, 404, { error: 'Document non signé.' });
      const e = (x) => String(x || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const when = new Date(sg.signedAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Europe/Paris' });
      const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificat de signature : ${e(f.name)}</title>
<style>body{font:15px/1.55 Arial,Helvetica,sans-serif;color:#0b0b12;max-width:720px;margin:40px auto;padding:0 20px}h1{font-family:Georgia,serif;font-weight:400}dt{color:#585865;font-size:13px;margin-top:12px}dd{margin:2px 0 0;word-break:break-all}.sig{border:1px solid #e2e1dc;border-radius:12px;padding:12px;margin-top:6px;max-width:420px}.sig img{max-width:100%}.foot{margin-top:28px;color:#585865;font-size:13px}@media print{.no-print{display:none}}</style>
<h1>Certificat de signature électronique</h1><p>Espace client Orem · ${e(pr.client)}</p>
<dl><dt>Document</dt><dd>${e(f.name)}</dd><dt>Empreinte SHA-256 du fichier signé</dt><dd>${e(sg.hash || 'non disponible')}</dd>
<dt>Signataire</dt><dd>${e(sg.name)} (${e(sg.email)}), connecté à son espace par un code à usage unique envoyé à cette adresse</dd>
<dt>Date et heure</dt><dd>${e(when)}</dd><dt>Adresse IP</dt><dd>${e(sg.ip)}</dd><dt>Navigateur</dt><dd>${e(sg.ua)}</dd>
<dt>Consentement</dt><dd>« J’ai lu ce document et je le signe », coché par le signataire</dd>
${sg.sig ? `<dt>Signature tracée</dt><dd class="sig"><img src="${sg.sig}" alt="Signature de ${e(sg.name)}"></dd>` : ''}</dl>
<p class="foot">Signature électronique simple au sens du règlement eIDAS (article 25). Toute modification du fichier changerait son empreinte. Orem, marque d’ICONOKOM.</p><p class="no-print"><button onclick="print()">Imprimer ou enregistrer en PDF</button></p></html>`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'" });
      return res.end(html);
    }
  }

  m = p.match(/^\/api\/projects\/([\w-]+)\/vault$/);
  if (m) {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    db.vault = db.vault || {};
    if (req.method === 'POST') {
      if (limited('vault:' + user.id, 10, 60 * 60e3)) return send(res, 429, { error: 'Trop d’essais. Réessayez dans un moment.' });
      const b = await readJson(req), str = (v, n) => String(v || '').slice(0, n);
      if (!str(b.login, 200).trim() || !str(b.secret, 500)) return send(res, 400, { error: 'Indiquez l’identifiant et le mot de passe.' });
      const r = Core.apply(db, pr.id, user, { type: 'setup.domain', mode: 'vault', domain: b.domain, registrar: b.registrar }, true);
      if (r.error) return send(res, 400, { error: r.error });
      db.vault[pr.id] = { at: new Date().toISOString(), by: user.id, box: seal({ login: str(b.login, 200).trim(), secret: str(b.secret, 500), note: str(b.note, 500) }, pr.id) };
      save(); deliver(r.notices); log('vault.put', { project: pr.id, user: user.id });
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET') {
      if (user.role !== 'admin') return send(res, 403, { error: 'Réservé à l’équipe.' });
      const v = db.vault[pr.id]; if (!v) return send(res, 404, { error: 'Aucun accès dans le coffre.' });
      let content; try { content = unseal(v.box, pr.id); } catch { return send(res, 500, { error: 'Le coffre ne peut pas être ouvert avec la clé actuelle.' }); }
      Core.apply(db, pr.id, user, { type: 'vault.read' }, true); save(); log('vault.read', { project: pr.id, user: user.id });
      return send(res, 200, { ...content, at: v.at, expires: new Date(new Date(v.at).getTime() + VAULT_TTL).toISOString() });
    }
    if (req.method === 'DELETE') {
      if (db.vault[pr.id]) { delete db.vault[pr.id]; save(); log('vault.erased', { project: pr.id, user: user.id, why: 'asked' }); }
      return send(res, 200, { ok: true });
    }
  }

  m = p.match(/^\/api\/projects\/([\w-]+)\/export$/);
  if (m && req.method === 'GET') {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    if (limited('export:' + user.id, 10, 60 * 60e3)) return send(res, 429, { error: 'Trop d’exports en peu de temps. Réessayez dans un moment.' });
    const part = url.searchParams.get('part') === 'biblio' ? 'biblio' : null;
    const entries = part ? exportEntries(pr, user).filter((e) => e.name.startsWith('Bibliothèque/')) : exportEntries(pr, user);
    if (part && !entries.length) return send(res, 404, { error: 'Aucun visuel à télécharger pour l’instant.' });
    if (entries.reduce((s, e) => s + (e.size || 0), 0) > 4e9) return send(res, 413, { error: 'L’espace dépasse 4 Go : téléchargez les fichiers un par un.' });
    log('project.export', { user: user.id, project: pr.id });
    return sendZip(res, part ? `Visuels ${pr.client}.zip` : `Espace ${pr.client}.zip`, entries).catch(() => res.destroy());
  }

  m = p.match(/^\/api\/projects\/([\w-]+)\/ask$/);
  if (m && req.method === 'POST') {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    if (limited('ask:' + user.id, 20, 60 * 60e3)) return send(res, 429, { error: 'Vous avez posé beaucoup de questions. Réessayez dans un moment, ou écrivez à l’équipe.' });
    const { question } = await readJson(req);
    const r = await Connectors.ask(pr, user, String(question || '').slice(0, 600), process.env, db);
    return send(res, 200, r);
  }

  // Dépôt de fichier : corps brut, nom et catégorie en paramètres. L'enregistrement est créé par le serveur, jamais par le navigateur.
  m = p.match(/^\/api\/projects\/([\w-]+)\/files$/);
  if (m && req.method === 'POST') {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    if (limited('up:' + user.id, 60, 60e3)) return send(res, 429, { error: 'Trop d’envois en peu de temps. Patientez une minute.' });
    const name = path.basename(String(url.searchParams.get('name') || 'fichier')).replace(/[\u0000-\u001f<>"\\]/g, '').slice(0, 200) || 'fichier';
    const len = Number(req.headers['content-length'] || 0);
    if (len > MAX_UPLOAD) return send(res, 413, { error: 'Fichier trop lourd (2 Go maximum).' });
    if (projectBytes(pr) + len > PROJECT_QUOTA) return send(res, 413, { error: 'L’espace de ce projet est plein. Écrivez à l’équipe pour faire de la place.' });
    if ((activeUploads.get(user.id) || 0) >= 3) return send(res, 429, { error: 'Trois envois sont déjà en cours. Attendez qu’ils se terminent.' });
    activeUploads.set(user.id, (activeUploads.get(user.id) || 0) + 1);
    const release = () => { const n = (activeUploads.get(user.id) || 1) - 1; if (n > 0) activeUploads.set(user.id, n); else activeUploads.delete(user.id); };
    res.once('close', release);
    const base = projectBytes(pr);
    const id = 'f_' + crypto.randomBytes(12).toString('hex');
    const dir = path.join(UPLOADS, pr.id); fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, id);
    let size = 0, done = false;
    const out = fs.createWriteStream(dest);
    const fail = (status, msg) => { if (done) return; done = true; req.unpipe(out); out.destroy(); fs.rm(dest, { force: true }, () => {}); if (!res.headersSent) send(res, status, { error: msg }); };
    req.on('data', (c) => { size += c.length; if (size > MAX_UPLOAD) fail(413, 'Fichier trop lourd (2 Go maximum).'); else if (base + size > PROJECT_QUOTA) fail(413, 'L’espace de ce projet est plein. Écrivez à l’équipe pour faire de la place.'); });
    req.on('aborted', () => fail(400, 'Envoi interrompu.'));
    req.on('error', () => fail(400, 'Envoi interrompu.'));
    out.on('error', () => fail(500, 'Enregistrement impossible. Réessayez.'));
    req.pipe(out);
    out.on('finish', () => { try { finishUpload(); } catch (e) { log('error', { message: e.message }); fs.rm(dest, { force: true }, () => {}); if (!res.headersSent) send(res, 500, { error: 'Enregistrement impossible. Réessayez.' }); } });
    const finishUpload = () => {
      if (done) return; done = true;
      const r = Core.addFile(db, pr.id, user, { id, name, size, cat: url.searchParams.get('cat'), path: path.relative(DATA, dest) });
      if (r.error) { fs.rm(dest, { force: true }, () => {}); return send(res, 400, { error: r.error }); }
      // Un dépôt fait depuis « Ce qu'il nous manque » retire l'élément attendu.
      const mid = url.searchParams.get('missing'); if (mid) Core.apply(db, pr.id, user, { type: 'missing.done', mid: String(mid).slice(0, 60) }, true);
      save(); deliver(r.notices);
      if (user.role !== 'admin') driveCopy(pr, pr.files.find((x) => x.id === r.file.id));
      send(res, 200, { ok: true, file: Core.forUser({ files: [r.file], activity: [], invoices: [] }, user).files[0] });
    };
    return;
  }

  m = p.match(/^\/api\/files\/([\w-]+)$/);
  if (m && req.method === 'GET') {
    const pr = db.projects.find((x) => Core.canSee(user, x) && x.files.some((f) => f.id === m[1]));
    const f = pr && pr.files.find((x) => x.id === m[1]);
    const abs = filePath(f);
    let st = null; try { st = abs && fs.statSync(abs); } catch {}
    if (!f || !st || !st.isFile()) return send(res, 404, { error: f ? 'Fichier introuvable.' : 'Ce fichier d’exemple n’existe pas sur le disque.' });
    const ext = path.extname(f.name).toLowerCase();
    const viewType = IMGT[ext] || PDFT[ext] || VIDT[ext];
    const inline = url.searchParams.get('inline') === '1' && viewType;
    const rg = inline && VIDT[ext] && String(req.headers.range || '').match(/^bytes=(\d*)-(\d*)$/);
    if (rg) {
      const start = rg[1] ? Number(rg[1]) : Math.max(0, st.size - Number(rg[2])), end = rg[1] && rg[2] ? Math.min(Number(rg[2]), st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { ...SEC_HEADERS, 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...SEC_HEADERS, 'Content-Type': viewType, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' });
      const part = fs.createReadStream(abs, { start, end }); part.on('error', () => res.destroy()); return part.pipe(res);
    }
    res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': inline ? viewType : 'application/octet-stream', 'Content-Length': st.size, ...(inline && VIDT[ext] ? { 'Accept-Ranges': 'bytes' } : {}), 'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`, ...(inline === PDFT['.pdf'] ? { 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'self'" } : {}) });
    const stream = fs.createReadStream(abs); stream.on('error', () => res.destroy()); log('file.download', { user: user.id, file: f.id });
    return stream.pipe(res);
  }

  return send(res, 404, { error: 'Introuvable.' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    if (!(e instanceof HttpError)) log('error', { message: e.message, stack: String(e.stack).split('\n').slice(0, 3).join(' | ') });
    if (!res.headersSent) send(res, e.status || 500, { error: e instanceof HttpError ? e.message : 'Une erreur est survenue. Réessayez.' });
  });
});
server.requestTimeout = 2 * 3600 * 1000; // dépôts de gros fichiers sur une connexion lente
server.listen(PORT, HOST, () => {
  console.log(`\nEspace client Orem : ${BASE_URL}`);
  if (SHOW_CODES) console.log('Mode local : les codes de connexion s’affichent ici et à l’écran. Rien n’est envoyé par e-mail.\n');
});
