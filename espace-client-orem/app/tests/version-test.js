/* Version de test en ligne, de bout en bout, avec un faux serveur SMTP local (STARTTLS) :
   codes de connexion reçus par e-mail, expéditeurs (contact@ ou l'adresse de la personne), envois limités aux adresses
   autorisées, bandeau, Réglages › Tester la version en ligne. node tests/version-test.js [dossier]
   Lance son propre serveur (port 3124, données temporaires) : indépendant du serveur des autres tests. */
const { chromium } = require('playwright');
const net = require('net'), tls = require('tls'), fs = require('fs'), os = require('os'), path = require('path'), { spawn, execFileSync } = require('child_process');
const OUT = process.argv[2] || os.tmpdir(), B = 'http://127.0.0.1:3124';
const R = []; const ok = (l, v, x) => R.push(`${v ? '✔' : '✘'} ${l}${!v && x ? ' → ' + x : ''}`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orem-vt-'));
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', tmp + '/k.pem', '-out', tmp + '/c.pem', '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });
const ctx = { key: fs.readFileSync(tmp + '/k.pem'), cert: fs.readFileSync(tmp + '/c.pem') };
const mails = [];
// Faux SMTP : STARTTLS, AUTH PLAIN, garde chaque message reçu.
const smtp = net.createServer((s) => {
  let sock = s, data = false, msg = '', rcpt = '';
  const w = (l) => sock.write(l + '\r\n');
  const on = (d) => {
    const t = d.toString();
    if (data) { msg += t; if (msg.endsWith('\r\n.\r\n')) { data = false; mails.push({ to: rcpt, raw: msg }); msg = ''; w('250 OK'); } return; }
    for (const line of t.split('\r\n').filter(Boolean)) {
      if (/^EHLO/.test(line)) w('250-fake\r\n250-STARTTLS\r\n250 AUTH PLAIN');
      else if (line === 'STARTTLS') { w('220 go'); sock.removeAllListeners('data'); sock = new tls.TLSSocket(sock, { isServer: true, ...ctx }); sock.on('data', on); }
      else if (/^AUTH PLAIN/.test(line)) w('235 ok');
      else if (/^RCPT TO/.test(line)) { rcpt = line.match(/<(.+)>/)[1]; w('250 ok'); }
      else if (/^MAIL FROM/.test(line)) w('250 ok');
      else if (line === 'DATA') { data = true; w('354 go'); } else if (line === 'QUIT') w('221 bye');
    }
  };
  s.on('data', on); w('220 fake');
}).listen(2526);
const html = (raw) => { const parts = raw.split(/--orem-[a-f0-9]+/); const h = parts.find((p) => /text\/html/.test(p)) || ''; return Buffer.from(h.split('\r\n\r\n')[1].replace(/\s/g, ''), 'base64').toString('utf8'); };
const fromOf = (raw) => (raw.match(/^From: .*<(.+)>/m) || [])[1];
const wait = async (pred, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { const m = mails.find(pred); if (m) return m; await new Promise((r) => setTimeout(r, 100)); } return null; };

(async () => {
  const srv = spawn('node', ['server.js'], { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: '3124', DATA_DIR: tmp + '/data', TEST_MODE: '1', MAIL_ENABLED: '1', MAIL_PROVIDER: 'smtp', SMTP_HOST: '127.0.0.1', SMTP_PORT: '2526', SMTP_USER: 'contact@agence-orem.fr', SMTP_PASSWORD: 'secret', MAIL_BATCH_MS: '300', NODE_TLS_REJECT_UNAUTHORIZED: '0', NODE_NO_WARNINGS: '1' } });
  let srvLog = ''; srv.stdout.on('data', (d) => (srvLog += d)); srv.stderr.on('data', (d) => (srvLog += d));
  for (let i = 0; i < 40; i++) { try { if ((await fetch(B + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 150)); }
  const health = await (await fetch(B + '/api/health')).json();
  ok('Santé : le service répond, version de test, e-mails activés', health.ok && health.test && health.mail, JSON.stringify(health));
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const errs = [];
  const p = await (await br.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', (e) => errs.push(e.message));
  // 1. Connexion : le code arrive par e-mail, de l'adresse générique
  await p.goto(B); await p.fill('#em', 'louis@agence-orem.fr'); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
  const cm = await wait((m) => m.to === 'louis@agence-orem.fr');
  ok('Le code de connexion part par e-mail, de contact@agence-orem.fr', cm && fromOf(cm.raw) === 'contact@agence-orem.fr', cm && fromOf(cm.raw));
  ok('Le code ne s’affiche plus à l’écran', !(await p.$('.devcode')));
  const code = cm && (html(cm.raw).match(/>(\d{6})</) || [])[1];
  await p.waitForSelector('#o1'); await p.fill('#o1', code || '000000'); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('#main'); await p.waitForTimeout(400);
  ok('Connexion avec le code reçu par e-mail', !!(await p.$('.side')));
  ok('Bandeau « Version de test » avec les adresses autorisées', /Version de test/i.test(await p.locator('.testbar').innerText().catch(() => '')) && /@agence-orem\.fr/.test(await p.locator('.testbar').innerText().catch(() => '')));
  // 2. Réglages › Tester la version en ligne
  await p.evaluate(() => document.querySelector('[data-go=reglages]').click()); await p.waitForSelector('#tst-h');
  await p.locator('#tst-h').scrollIntoViewIfNeeded(); await p.screenshot({ path: OUT + '/version-test-reglages.png' });
  mails.length = 0;
  await p.click('[data-act=testmail][data-id=generic]'); const g = await wait((m) => /générique/.test(html(m.raw)));
  ok('« M’envoyer un e-mail générique » : reçu de contact@', g && fromOf(g.raw) === 'contact@agence-orem.fr', g && fromOf(g.raw));
  await p.click('[data-act=testmail][data-id=personal]'); const pm = await wait((m) => /ton adresse/.test(html(m.raw)));
  ok('« M’envoyer un e-mail en mon nom » : reçu de louis@', pm && fromOf(pm.raw) === 'louis@agence-orem.fr', pm && fromOf(pm.raw));
  await p.click('[data-act=ccheck][data-id=mail]'); await p.waitForTimeout(500);
  ok('« Tester le compte d’envoi » donne un résultat', /SMTP 127\.0\.0\.1/.test(await p.locator('#toast, .toast').first().innerText().catch(() => '')));
  // 3. Invitations : l'adresse autorisée reçoit l'invitation de Louis ; un vrai client hors liste ne reçoit rien
  for (const [client, email] of [['Atelier Test', 'clement+test@agence-orem.fr'], ['Client réel', 'contact@client-reel.fr']]) {
    await p.evaluate(() => document.querySelector('[data-go=nouveau]').click()); await p.waitForSelector('#n-client');
    await p.fill('#n-client', client); await p.fill('#n-contact', 'Test'); await p.fill('#n-email', email); await p.check('[name=n-reg][value=vous]');
    await p.locator('#n-client').evaluate((i) => i.form.requestSubmit()); await p.waitForTimeout(700);
  }
  const inv = await wait((m) => m.to === 'clement+test@agence-orem.fr');
  ok('Invitation reçue à une adresse autorisée, envoyée de l’adresse de Louis', inv && fromOf(inv.raw) === 'louis@agence-orem.fr', inv && fromOf(inv.raw));
  await new Promise((r) => setTimeout(r, 800));
  ok('Version de test : aucun e-mail au vrai client (hors liste)', !mails.some((m) => m.to === 'contact@client-reel.fr'));
  const box = await p.evaluate(async () => (await (await fetch('/api/outbox', { headers: { 'X-Orem': '1' } })).json()).items);
  const blocked = box.find((m) => m.to === 'contact@client-reel.fr');
  ok('…mais il reste visible dans « E-mails envoyés », marqué non envoyé', blocked && !blocked.sent && /version de test/.test(blocked.note || ''), JSON.stringify(blocked && { sent: blocked.sent, note: blocked.note }));
  ok('Aucune erreur JavaScript', !errs.length, errs.join(' | '));
  await br.close(); srv.kill(); smtp.close(); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(R.join('\n'));
  if (R.some((x) => x.startsWith('✘'))) console.log(srvLog.split('\n').filter((l) => /error|Refus|mail\./.test(l)).slice(-10).join('\n'));
})().catch((e) => { console.error(e); process.exit(1); });
