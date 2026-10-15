/* Parcours d'arrivée d'un nouveau client, en captures (serveur local sur le port 3123, données neuves) :
   node tests/arrivee.js [dossier des captures]
   L'équipe crée l'espace, le client reçoit l'invitation, se connecte, fait la visite guidée et arrive sur son accueil. */
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
(async () => {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const errs = [];
  const page = async (w, h) => { const p = await (await br.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', deviceScaleFactor: 2 })).newPage(); p.on('pageerror', (e) => errs.push(e.message)); return p; };
  const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });
  // 1. Louis crée l'espace et invite la cliente
  const louis = await page(1440, 900);
  await louis.goto(B); await louis.fill('#em', 'louis@agence-orem.fr'); await louis.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
  await louis.waitForSelector('.devcode b'); await louis.fill('#o1', await louis.textContent('.devcode b')); await louis.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
  await louis.waitForSelector('#main'); await louis.waitForTimeout(300);
  await louis.evaluate(() => document.querySelector('[data-go=nouveau]').click()); await louis.waitForSelector('#n-client');
  await louis.fill('#n-client', 'Atelier Méridien'); await louis.fill('#n-projet', 'Refonte du site atelier-meridien.fr');
  await louis.fill('#n-contact', 'Sophie'); await louis.fill('#n-email', 'sophie@atelier-meridien.fr'); await louis.fill('#n-ht', '7200');
  await louis.check('[name=n-reg][value=vous]');
  await shot(louis, '00-equipe-cree-l-espace');
  await louis.locator('#n-client').evaluate((i) => i.form.requestSubmit()); await louis.waitForTimeout(800);
  const box = await louis.evaluate(async () => (await (await fetch('/api/outbox', { headers: { 'X-Orem': '1' } })).json()).items);
  const inv = box.find((m) => m.to === 'sophie@atelier-meridien.fr');
  ok('L’invitation part à Sophie, au vouvoiement', inv && /Votre espace/.test(inv.subject), inv && inv.subject);
  // 2. L'e-mail d'invitation tel que Sophie le reçoit
  const mail = await page(720, 900);
  await mail.setContent(`<div style="font:13px Arial;color:#585865;padding:12px 16px;border-bottom:1px solid #e2e1dc;background:#fff"><b style="color:#000">${inv.subject}</b><br>De : Orem &lt;espace@agence-orem.fr&gt; · À : ${inv.to}</div>` + inv.html);
  await shot(mail, '01-email-invitation');
  const link = (inv.html.match(/href="([^"]+\/auth\/[^"]+)"/) || [])[1];
  ok('L’invitation contient un lien de connexion direct', !!link, inv.html.slice(0, 200));
  // 3. Sophie clique sur le bouton de l'e-mail : une confirmation, et elle est dans son espace
  const so = await page(1440, 900);
  await so.goto(link.replace(/^https?:\/\/[^/]+/, B)); await so.waitForSelector('form[data-form=linkauth]'); await so.waitForTimeout(200);
  await shot(so, '02-confirmation');
  await so.locator('form[data-form=linkauth]').evaluate((f) => f.requestSubmit());
  await so.waitForSelector('.ob'); await so.waitForTimeout(400);
  ok('Un clic dans l’e-mail suffit pour entrer (sans code)', true);
  for (let i = 0; i < 3; i++) { await shot(so, `0${4 + i}-visite-${i + 1}`); await so.click('[data-act=ob-next]'); await so.waitForTimeout(250); }
  ok('Dernier écran : prénom et nom pré-remplis', (await so.inputValue('#ob-n')) === 'Sophie');
  await so.fill('#ob-n', 'Sophie Laurent'); await so.fill('#ob-f', 'Gérante'); await so.fill('#ob-p', '06 12 34 56 78');
  await shot(so, '07-visite-4');
  await so.click('[data-act=ob-done]'); await so.waitForTimeout(1500);
  await shot(so, '08-accueil');
  ok('Accueil : « Bonjour Sophie »', /Bonjour Sophie/.test(await so.locator('#main').innerText()));
  // 4. Les fois suivantes : adresse e-mail, puis code ou lien reçu par e-mail (ici sur mobile)
  const mo = await page(390, 844);
  await mo.goto(B); await mo.waitForSelector('#em'); await mo.fill('#em', 'sophie@atelier-meridien.fr'); await shot(mo, '09-mobile-connexion');
  await mo.locator('form[data-form=login]').evaluate((f) => f.requestSubmit()); await mo.waitForSelector('.devcode b'); await mo.waitForTimeout(200); await shot(mo, '10-mobile-code');
  await mo.fill('#o1', await mo.textContent('.devcode b')); await mo.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit()); await mo.waitForSelector('#main'); await mo.waitForTimeout(600);
  ok('Pas de seconde visite guidée', !(await mo.$('.ob'))); await shot(mo, '11-mobile-accueil');
  const re = await page(1440, 900); await re.goto(link.replace(/^https?:\/\/[^/]+/, B)); await re.waitForSelector('form[data-form=linkauth]');
  await re.locator('form[data-form=linkauth]').evaluate((f) => f.requestSubmit()); await re.waitForTimeout(600);
  ok('Le lien d’invitation ne sert qu’une fois', !!(await re.$('#em')));
  // 5. L'équipe voit la présentation de Sophie
  await louis.reload(); await louis.waitForTimeout(500);
  const pid = await louis.evaluate(async () => (await (await fetch('/api/projects', { headers: { 'X-Orem': '1' } })).json()).projects.find((x) => x.client === 'Atelier Méridien').id);
  const acc = await louis.evaluate(async (id) => (await (await fetch('/api/projects/' + id, { headers: { 'X-Orem': '1' } })).json()).access, pid);
  ok('L’équipe reçoit le nom, la fonction et le téléphone', acc && acc.some((u) => u.name === 'Sophie Laurent' && u.title === 'Gérante' && u.phone === '06 12 34 56 78'), JSON.stringify(acc));
  ok('Aucune erreur JavaScript', !errs.length, errs.join(' | '));
  console.log(R.join('\n')); await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
