/* Régressions de sécurité (réaudit du 14 octobre) : node tests/securite.js — lance ses propres serveurs sur 3193 et 3194. */
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const Core = require('../public/core.js');
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
async function start(port, env = {}) {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'orem-sec-'));
  const p = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: String(port), DATA_DIR: data, MAIL_ENABLED: '', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; p.stdout.on('data', (c) => (log += c)); p.stderr.on('data', (c) => (log += c));
  for (let i = 0; i < 40 && !/Espace client Orem|Refus/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
  await new Promise((r) => setTimeout(r, 200)); const exited = p.exitCode !== null;
  return { p, data, log: () => log, exited, stop: async () => { if (p.exitCode === null) { const g = new Promise((r) => p.once('exit', r)); p.kill(); await g; } fs.rmSync(data, { recursive: true, force: true, maxRetries: 5 }); } };
}
(async () => {
  // Logique : prototype, chemins, montants, statuts, plafonds
  const db = Core.seed(); const claire = db.users.find((u) => u.id === 'u_claire'), louis = db.users.find((u) => u.id === 'u_louis');
  const bad = JSON.parse('{"type":"file.add","__proto__":{"__internal":true},"file":{"id":"f_steal","name":"a.txt","path":"uploads/p_varenne/x"}}');
  ok('« __proto__ » ne donne pas accès à file.add', !!Core.apply(db, 'p_lumen', claire, bad).error);
  ok('file.add interne : chemin hors du dossier du projet refusé', !!Core.addFile(db, 'p_lumen', claire, { id: 'f_' + 'a'.repeat(24), name: 'x', path: 'uploads/p_varenne/f_x' }).error);
  ok('file.add interne : identifiant forgé refusé', !!Core.addFile(db, 'p_lumen', claire, { id: 'x" style="position:fixed', name: 'x', path: 'uploads/p_lumen/x' }).error);
  ok('Facture : statut libre refusé', !!Core.apply(db, 'p_lumen', louis, { type: 'invoice.add', ht: 100, status: '<b>x</b>' }).error);
  Core.apply(db, 'p_lumen', louis, { type: 'invoice.add', ht: -5000 });
  ok('Facture : montant négatif ramené à 0', db.projects.find((p) => p.id === 'p_lumen').invoices.slice(-1)[0].ht === 0);
  ok('Date de l’an 275760 refusée', !!Core.apply(db, 'p_lumen', louis, { type: 'meeting.set', when: '+275760-01-01T00:00:00Z' }).error);
  ok('Statut de demande libre refusé', !!Core.apply(db, 'p_huchet', louis, { type: 'request.status', rid: 'hr1', status: 'nimporte' }).error);
  for (let i = 0; i < 320; i++) Core.apply(db, 'p_huchet', db.users.find((u) => u.id === 'u_hugo'), { type: 'pin.add', img: 'assets/hd/cover.jpg', x: 1, y: 1, text: 'x' + i });
  ok('Commentaires plafonnés à 300', db.projects.find((p) => p.id === 'p_huchet').pins.length === 300);
  ok('Résumé pour un client : sans indicateurs internes', !('alerts' in Core.summary(db.projects[0], claire)) && 'alerts' in Core.summary(db.projects[0], louis));

  // Serveur exposé derrière un proxy HTTPS : jamais de code à l'écran
  const s1 = await start(3193, { BASE_URL: 'https://espace.agence-orem.fr', TRUST_PROXY: '1' });
  ok('https sans envoi d’e-mail : le serveur refuse de démarrer', s1.exited && /Refus de démarrer/.test(s1.log()), s1.log().slice(0, 200));
  await s1.stop();

  // Serveur local : blocage par appareil, pas du vrai titulaire ; corps trop gros
  const s2 = await start(3194, { TRUST_PROXY: '1' });
  const B = 'http://127.0.0.1:3194', h = { 'content-type': 'application/json', 'x-orem': '1' };
  try {
    const attacker = { ...h, 'x-forwarded-for': '203.0.113.9' }, owner = { ...h, 'x-forwarded-for': '198.51.100.7' };
    await fetch(B + '/api/login', { method: 'POST', headers: attacker, body: JSON.stringify({ email: 'hugo@huchet-demorge.fr' }) });
    for (let i = 0; i < 14; i++) await fetch(B + '/api/verify', { method: 'POST', headers: attacker, body: JSON.stringify({ email: 'hugo@huchet-demorge.fr', code: '000000' }) });
    const code = (await (await fetch(B + '/api/login', { method: 'POST', headers: owner, body: JSON.stringify({ email: 'hugo@huchet-demorge.fr' }) })).json()).devCode;
    const v = await fetch(B + '/api/verify', { method: 'POST', headers: owner, body: JSON.stringify({ email: 'hugo@huchet-demorge.fr', code }) });
    ok('14 faux codes d’un inconnu ne bloquent pas Hugo', v.status === 200, String(v.status));
    const spoof = await fetch(B + '/api/verify', { method: 'POST', headers: { ...attacker, 'x-forwarded-for': '1.2.3.4, 203.0.113.9' }, body: JSON.stringify({ email: 'hugo@huchet-demorge.fr', code: '000000' }) });
    ok('Adresse IP prise après le proxy (la dernière), pas celle choisie par le client', /appareil/.test((await spoof.json()).error || ''));
    const big = await fetch(B + '/api/login', { method: 'POST', headers: h, body: 'x'.repeat(5e6) }).then((r) => r.status).catch(() => 'coupé');
    ok('Corps de 5 Mo refusé d’emblée', big === 413 || big === 'coupé', String(big));
  } catch (e) { R.push('✘ Erreur : ' + e.message); }
  await s2.stop();
  console.log(R.join('\n'));
  process.exitCode = R.some((x) => x.startsWith('✘')) ? 1 : 0;
})();
