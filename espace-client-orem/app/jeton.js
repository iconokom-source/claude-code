/* Crée un jeton d'API personnel pour un membre de l'équipe (serveur MCP, Claude Code).
   node jeton.js theophile@agence-orem.fr [--jours 90]   ·   node jeton.js --liste   ·   node jeton.js --retirer <début du jeton>
   Le jeton n'est affiché qu'une fois : à ranger dans le coffre Notion, jamais dans le dépôt. Seule son empreinte est gardée. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const FILE = path.join(DATA, 'api-tokens.json'), DB = path.join(DATA, 'db.json');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } };
const write = (m) => { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(m, null, 2), { mode: 0o600 }); };
const args = process.argv.slice(2);
if (args[0] === '--liste') { for (const t of Object.values(read())) console.log(`${t.hint}…  ${t.email}  créé le ${t.at.slice(0, 10)}${t.exp ? '  expire le ' + t.exp.slice(0, 10) : ''}`); process.exit(0); }
if (args[0] === '--retirer') { const m = read(); const k = Object.keys(m).find((h) => m[h].hint === args[1]); if (!k) { console.error('Jeton introuvable.'); process.exit(1); } delete m[k]; write(m); console.log('Jeton retiré.'); process.exit(0); }
const email = String(args[0] || '').toLowerCase();
let users = []; try { users = JSON.parse(fs.readFileSync(DB, 'utf8')).users; } catch { console.error('Lancez d’abord le serveur une fois (data/db.json absent).'); process.exit(1); }
const u = users.find((x) => x.email === email && x.role === 'admin');
if (!u) { console.error('Adresse inconnue ou pas un compte de l’agence : ' + email); process.exit(1); }
const days = Number(args[args.indexOf('--jours') + 1]) || 90;
const token = 'orem_' + crypto.randomBytes(24).toString('base64url');
const m = read(); m[sha(token)] = { uid: u.id, email, at: new Date().toISOString(), exp: new Date(Date.now() + days * 864e5).toISOString(), hint: token.slice(0, 10) }; write(m);
console.log(`Jeton pour ${u.name}, valable ${days} jours (affiché une seule fois) :\n${token}`);
