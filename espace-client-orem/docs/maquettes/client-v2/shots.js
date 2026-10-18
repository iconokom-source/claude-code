/* Captures de la maquette « Espace client » v2 dans le vrai cadre de l'app (serveur local, données d'exemple).
   Lancer : BASE=http://127.0.0.1:3123 NODE_PATH=$(npm root -g) CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node shots.js [filtre] */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const DIR = __dirname, OUT = path.join(DIR, 'captures'); fs.mkdirSync(OUT, { recursive: true });
const css = fs.readFileSync(path.join(DIR, 'cx.css'), 'utf8'), js = fs.readFileSync(path.join(DIR, 'cx-render.js'), 'utf8');
const only = process.argv[2], BASE = process.env.BASE || 'http://127.0.0.1:3123';
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM }); const SESS = {};
  async function shot(name, email, view, screen, w, h, theme) {
    if (only && !name.includes(only)) return;
    const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, locale: 'fr-FR', bypassCSP: true, colorScheme: theme || 'light', storageState: SESS[email] });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(BASE);
    if (!SESS[email]) { // une seule connexion par compte (limite de connexions du serveur)
      await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
      await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
      await p.waitForSelector('#main'); SESS[email] = await ctx.storageState();
    }
    await p.waitForSelector('#main'); await p.waitForTimeout(500);
    for (let i = 0; i < 4; i++) if (await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
    await p.evaluate((v) => { const a = document.querySelector(`[data-go=${v}]`); if (a) a.click(); }, view); await p.waitForTimeout(400);
    await p.addStyleTag({ content: css }); await p.addScriptTag({ content: js });
    await p.evaluate(async ({ screen, theme }) => {
      const H = { headers: { 'X-Orem': '1' } };
      const me = await (await fetch('/api/me', H)).json(), ps = (await (await fetch('/api/projects', H)).json()).projects;
      const pr = (await (await fetch('/api/projects/' + ps[0].id, H)).json()).project;
      if (theme) document.documentElement.setAttribute('data-theme', theme);
      document.body.classList.add('cx-on');
      const wrap = document.querySelector('#main .wrap'); wrap.className = 'wrap cx-wrap';
      wrap.innerHTML = window.cxMock({ me: me.user, team: me.team, p: pr }, { screen });
      document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; });
      window.scrollTo(0, 0);
    }, { screen, theme });
    await p.waitForTimeout(600);
    const hh = await p.evaluate(() => Math.max(document.querySelector('#main').scrollHeight, document.documentElement.scrollHeight) + (window.innerWidth < 860 ? 90 : 40));
    await p.setViewportSize({ width: w, height: Math.max(h, hh) }); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, name + '.png') });
    const sw = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, [...document.querySelectorAll('.cx-wrap *')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'visible' && e.clientWidth > 0).slice(0, 5).map((e) => e.className)]);
    console.log(name, sw[0] <= sw[1] ? 'ok largeur' : 'DÉBORDE ' + sw[0], JSON.stringify(sw[2]), errs.join(' | '));
    await ctx.close();
  }
  const L = 'claire@maisonlumen.fr', HU = 'hugo@huchet-demorge.fr';
  await shot('1-accueil-projet-bureau', L, 'accueil', 'accueil', 1440, 900);
  await shot('2-accueil-evolution-bureau', HU, 'accueil', 'evolution', 1440, 900);
  await shot('3-etapes-bureau', L, 'projet', 'etapes', 1440, 900);
  await shot('4-a-valider-bureau', L, 'valider', 'valider', 1440, 900);
  await shot('5-fichiers-factures-bureau', L, 'fichiers', 'fichiers', 1440, 900);
  await shot('6-accueil-projet-mobile', L, 'accueil', 'accueil', 390, 844);
  await shot('7-a-valider-mobile', L, 'valider', 'valider', 390, 844);
  await shot('8-accueil-projet-sombre', L, 'accueil', 'accueil', 1440, 900, 'dark');
  await shot('9-messages-bureau', L, 'messages', 'messages', 1440, 900);
  await shot('10-maquettes-visuels-bureau', HU, 'maquettes', 'maquettes', 1440, 900);
  await shot('11-messages-mobile', L, 'messages', 'messages', 390, 844);
  await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
