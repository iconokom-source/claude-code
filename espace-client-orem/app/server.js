/* Espace client Orem : serveur local, sans dépendance.
   node server.js  →  http://localhost:3000
   Données : data/db.json · Fichiers déposés : data/uploads/<projet>/<fichier> */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Core = require('./public/core.js');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const DEV = process.env.NODE_ENV !== 'production';
const DATA = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA, 'db.json');
const UPLOADS = path.join(DATA, 'uploads');
const PUBLIC = path.join(__dirname, 'public');
const MAX_UPLOAD = 2 * 1024 ** 3; // 2 Go
const CODE_TTL = 15 * 60 * 1000;
const SESSION_TTL = 30 * 24 * 3600 * 1000;

fs.mkdirSync(UPLOADS, { recursive: true });

/* ---------- Stockage ---------- */
let db;
let saveTimer = null;
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
else { db = { ...Core.seed(), sessions: {}, codes: {} }; save(); console.log('Base créée avec des données d’exemple : ' + DB_FILE); }
db.sessions ||= {}; db.codes ||= {};
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 1));
    fs.renameSync(tmp, DB_FILE);
  }, 50);
}
const publicStore = () => db; // users + projects vivent dans db

/* ---------- Utilitaires HTTP ---------- */
function send(res, status, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e6) { reject(new Error('Requête trop lourde.')); req.destroy(); } });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON invalide.')); } });
  });
}
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}
function currentUser(req) {
  const sid = cookies(req).sid;
  const s = sid && db.sessions[sid];
  if (!s || s.exp < Date.now()) return null;
  return db.users.find((u) => u.id === s.uid) || null;
}
function openSession(res, user) {
  const sid = crypto.randomBytes(32).toString('hex');
  db.sessions[sid] = { uid: user.id, exp: Date.now() + SESSION_TTL };
  save();
  res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}${DEV ? '' : '; Secure'}`);
}
const publicUser = (u) => u && { id: u.id, email: u.email, name: u.name, role: u.role, projectId: u.projectId, title: u.title, wa: u.wa, phone: u.phone, photo: u.photo };
const team = () => db.users.filter((u) => u.role === 'admin').map(publicUser);

/* ---------- Connexion par code / lien magique ---------- */
const attempts = new Map(); // limite les envois par adresse
function requestCode(email, origin) {
  const user = db.users.find((u) => u.email === email);
  const n = (attempts.get(email) || []).filter((t) => t > Date.now() - 15 * 60e3);
  if (n.length >= 5) return { error: 'Trop de demandes. Réessayez dans quelques minutes.' };
  attempts.set(email, [...n, Date.now()]);
  if (!user) return { ok: true }; // même réponse : on ne révèle pas qui a un compte
  const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
  const token = crypto.randomBytes(24).toString('hex');
  db.codes[email] = { code, token, exp: Date.now() + CODE_TTL, tries: 0 };
  save();
  const link = `${origin}/auth/${token}`;
  // En production : envoi de l'e-mail (Brevo / SMTP). En local : affiché dans le terminal.
  console.log(`\n✉️  Connexion de ${email}\n   Code : ${code}\n   Lien : ${link}\n`);
  return { ok: true, devCode: DEV ? code : undefined, devLink: DEV ? link : undefined };
}
function verifyCode(email, code) {
  const c = db.codes[email];
  if (!c || c.exp < Date.now()) return null;
  if (++c.tries > 5) { delete db.codes[email]; save(); return null; }
  if (!crypto.timingSafeEqual(Buffer.from(String(code).padStart(6, '0').slice(0, 6)), Buffer.from(c.code))) { save(); return null; }
  delete db.codes[email]; save();
  return db.users.find((u) => u.email === email) || null;
}

/* ---------- Fichiers statiques ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (path.extname(rel)) return send(res, 404, 'Introuvable.');
    res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-cache' }); // application d'une seule page
    return fs.createReadStream(path.join(PUBLIC, 'index.html')).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

/* ---------- Routes ---------- */
async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  const user = currentUser(req);
  const mutating = req.method !== 'GET' && req.method !== 'HEAD';
  // Protection CSRF simple : toute écriture doit venir de notre propre front.
  if (p.startsWith('/api/') && mutating && req.headers['x-orem'] !== '1') return send(res, 403, { error: 'Requête refusée.' });

  if (p.startsWith('/auth/') && req.method === 'GET') {
    const token = p.slice(6);
    const entry = Object.entries(db.codes).find(([, c]) => c.token === token && c.exp > Date.now());
    if (!entry) return send(res, 302, '', { Location: '/?lien=expire' });
    const u = db.users.find((x) => x.email === entry[0]);
    delete db.codes[entry[0]];
    openSession(res, u);
    return send(res, 302, '', { Location: '/' });
  }

  if (p === '/api/login' && req.method === 'POST') {
    const { email } = await readJson(req);
    const r = requestCode(String(email || '').trim().toLowerCase(), `http://${req.headers.host}`);
    return send(res, r.error ? 429 : 200, r);
  }
  if (p === '/api/verify' && req.method === 'POST') {
    const { email, code } = await readJson(req);
    const u = verifyCode(String(email || '').trim().toLowerCase(), String(code || ''));
    if (!u) return send(res, 401, { error: 'Code incorrect ou expiré. Demandez-en un nouveau.' });
    openSession(res, u);
    return send(res, 200, { ok: true, user: publicUser(u) });
  }
  if (p === '/api/logout' && req.method === 'POST') {
    const sid = cookies(req).sid; if (sid) { delete db.sessions[sid]; save(); }
    res.setHeader('Set-Cookie', 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return send(res, 200, { ok: true });
  }

  if (!p.startsWith('/api/')) return serveStatic(req, res, p);
  if (!user) return send(res, 401, { error: 'Connectez-vous pour continuer.' });

  if (p === '/api/me') return send(res, 200, { user: publicUser(user), team: team() });

  if (p === '/api/projects' && req.method === 'GET') {
    const list = db.projects.filter((pr) => Core.canSee(user, pr)).map(Core.summary);
    return send(res, 200, { projects: list });
  }
  if (p === '/api/projects' && req.method === 'POST') {
    const r = Core.createProject(publicStore(), user, await readJson(req));
    if (r.ok) save();
    return send(res, r.error ? 400 : 200, r);
  }

  let m = p.match(/^\/api\/projects\/([\w-]+)$/);
  if (m && req.method === 'GET') {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    const access = user.role === 'admin' ? db.users.filter((u) => u.projectId === pr.id).map(publicUser) : undefined;
    const people = Object.fromEntries(db.users.filter((u) => u.role === 'admin' || u.projectId === pr.id).map((u) => [u.id, u.name]));
    return send(res, 200, { project: Core.forUser(pr, user), access, people });
  }

  m = p.match(/^\/api\/projects\/([\w-]+)\/action$/);
  if (m && req.method === 'POST') {
    const r = Core.apply(publicStore(), m[1], user, await readJson(req));
    if (r.ok) save();
    return send(res, r.error ? 400 : 200, r);
  }

  // Dépôt de fichier : corps brut, nom et catégorie en paramètres (pas de multipart à décoder).
  m = p.match(/^\/api\/projects\/([\w-]+)\/files$/);
  if (m && req.method === 'POST') {
    const pr = db.projects.find((x) => x.id === m[1]);
    if (!pr || !Core.canSee(user, pr)) return send(res, 404, { error: 'Projet introuvable.' });
    const name = path.basename(String(url.searchParams.get('name') || 'fichier')).replace(/[\u0000-\u001f]/g, '').slice(0, 200) || 'fichier';
    const len = Number(req.headers['content-length'] || 0);
    if (len > MAX_UPLOAD) return send(res, 413, { error: 'Fichier trop lourd (2 Go maximum).' });
    const id = 'f_' + crypto.randomBytes(8).toString('hex');
    const dir = path.join(UPLOADS, pr.id); fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, id);
    let size = 0, aborted = false;
    const out = fs.createWriteStream(dest);
    req.on('data', (c) => { size += c.length; if (size > MAX_UPLOAD && !aborted) { aborted = true; req.unpipe(out); out.destroy(); fs.rmSync(dest, { force: true }); send(res, 413, { error: 'Fichier trop lourd (2 Go maximum).' }); } });
    req.pipe(out);
    out.on('finish', () => {
      if (aborted) return;
      const r = Core.apply(publicStore(), pr.id, user, { type: 'file.add', file: { id, name, size, cat: url.searchParams.get('cat'), path: path.relative(DATA, dest) } });
      if (r.error) { fs.rmSync(dest, { force: true }); return send(res, 400, r); }
      save(); send(res, 200, { ok: true, file: Core.forUser({ files: [r.file], activity: [] }, user).files[0] });
    });
    return;
  }

  m = p.match(/^\/api\/files\/([\w-]+)$/);
  if (m && req.method === 'GET') {
    const pr = db.projects.find((x) => Core.canSee(user, x) && x.files.some((f) => f.id === m[1]));
    const f = pr && pr.files.find((x) => x.id === m[1]);
    if (!f || !f.path) return send(res, 404, { error: 'Ce fichier d’exemple n’existe pas sur le disque.' });
    const abs = path.join(DATA, f.path);
    if (!abs.startsWith(UPLOADS) || !fs.existsSync(abs)) return send(res, 404, { error: 'Fichier introuvable.' });
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': fs.statSync(abs).size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`, 'X-Content-Type-Options': 'nosniff' });
    return fs.createReadStream(abs).pipe(res);
  }

  return send(res, 404, { error: 'Introuvable.' });
}

http.createServer((req, res) => {
  handle(req, res).catch((e) => { console.error(e); if (!res.headersSent) send(res, 400, { error: e.message || 'Erreur.' }); });
}).listen(PORT, HOST, () => {
  console.log(`\nEspace client Orem : http://localhost:${PORT}`);
  console.log('Comptes d’exemple : louis@agence-orem.fr (agence) · claire@maisonlumen.fr (client)');
  console.log('Les codes de connexion s’affichent ici, rien n’est envoyé par e-mail en local.\n');
});
