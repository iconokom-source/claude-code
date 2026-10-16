/* Bilans mensuels Évolution : le document présenté en visio se consulte et se télécharge à tout moment. node tests/bilans.js [dossier] */
const { chromium } = require('playwright'); const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, x) => R.push(`${v ? '✔' : '✘'} ${l}${!v && x ? ' → ' + x : ''}`);
(async () => { const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) }); const errs = [];
  const p = await (await br.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B); await p.fill('#em', 'hugo@huchet-demorge.fr'); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('#main'); await p.waitForTimeout(400); if (await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
  await p.evaluate(() => document.querySelector('[data-go=evolution]').click()); await p.waitForTimeout(400);
  const el = await p.$('.reports'); await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: OUT + '/bilans-liste.png' });
  ok('Chaque bilan a « Consulter » et « PDF », sans le déplier', (await p.locator('[data-act=doc-view]').count()) === 3 && (await p.locator('.rp-a a[download]').count()) === 3);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('.rp-a a[download]').first().click()]);
  ok('Téléchargement nommé « Bilan Septembre 2026 Huchet-Demorge.pdf »', dl.suggestedFilename() === 'Bilan Septembre 2026 Huchet-Demorge.pdf', dl.suggestedFilename());
  await p.locator('[data-act=doc-view]').first().click(); await p.waitForTimeout(1500); await p.screenshot({ path: OUT + '/bilans-consulter.png' });
  const st = await p.evaluate(async () => (await fetch(document.querySelector('.fview iframe').src)).status); ok('Le PDF s’ouvre dans la visionneuse', st === 200);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok('Échap ferme la visionneuse', !(await p.$('.fview'))); ok('Aucune erreur JavaScript', !errs.length, errs.join(' | ')); console.log(R.join('\n')); await br.close(); })();
