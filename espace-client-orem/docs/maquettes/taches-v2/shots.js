/* Captures de la maquette v2 dans le vrai cadre de l'app (serveur local, BASE ou 3123, données d'exemple). */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const DIR = __dirname, OUT = path.join(DIR, 'captures'); fs.mkdirSync(OUT, { recursive: true });
const css = fs.readFileSync(path.join(DIR, 'tk.css'), 'utf8'), js = fs.readFileSync(path.join(DIR, 'tk-render.js'), 'utf8');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM });
  async function shot(name, w, h, o = {}, theme) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, locale: 'fr-FR', bypassCSP: true, colorScheme: theme || 'light' });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(process.env.BASE || 'http://127.0.0.1:3123'); await p.fill('#em', 'louis@agence-orem.fr'); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
    await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
    await p.waitForSelector('#main'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('[data-go=taches]').click()); await p.waitForSelector('.tk-bar');
    await p.addStyleTag({ content: css }); await p.addScriptTag({ content: js });
    await p.evaluate(async (o) => {
      const H = { headers: { 'X-Orem': '1' } };
      const me = await (await fetch('/api/me', H)).json(), tasks = (await (await fetch('/api/tasks', H)).json()).tasks;
      if (o.theme) document.documentElement.setAttribute('data-theme', o.theme);
      const wrap = document.querySelector('#main .wrap'); wrap.classList.add('tk-wrap');
      wrap.innerHTML = window.tkMock({ me: me.user, team: me.team, tasks }, o);
      document.querySelectorAll('img').forEach((i) => { if (!i.complete) i.loading = 'eager'; });
    }, { ...o, theme });
    await p.waitForTimeout(500);
    if (!o.viewportOnly) { const hh = await p.evaluate(() => Math.max(document.querySelector('#main').scrollHeight, document.documentElement.scrollHeight) + 40); await p.setViewportSize({ width: w, height: hh }); await p.waitForTimeout(400); }
    await p.screenshot({ path: path.join(OUT, name + '.png') });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    console.log(name, sw ? 'ok largeur' : 'DÉBORDE', errs.join(' | '));
    await ctx.close();
  }
  await shot('1-bureau-mes-taches', 1440, 900);
  await shot('2-bureau-saisie-rapide', 1440, 900, { typing: 'Relancer le devis @théo demain #Lumen !', viewportOnly: true });
  await shot('3-bureau-panneau-modifier', 1440, 900, { drawer: true, viewportOnly: true });
  await shot('4-bureau-tableau-equipe', 1440, 900, { who: 'all', board: true, noBento: true });
  await shot('5-bureau-filtre-retard', 1440, 900, { when: 'late', viewportOnly: false, undo: 'Relancer les prospects du salon' });
  await shot('6-tablette', 1024, 1366, {});
  await shot('7-mobile', 390, 844, {});
  await shot('8-bureau-sombre', 1440, 900, { viewportOnly: true }, 'dark');
  await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
