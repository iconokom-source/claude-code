/* Lot 8 : accueil épuré, navigation, fichiers, notifications client, validation annulable (port 3123, données neuves) : node tests/accueil.js [dossier] */
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
const errs = [];
(async () => { try {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  async function login(email, opts = {}) {
    const p = await (await br.newContext({ viewport: opts.vp || { width: 1440, height: 900 }, colorScheme: opts.dark ? 'dark' : 'light', reducedMotion: 'reduce' })).newPage();
    p.on('pageerror', (e) => errs.push(email + ' : ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.goto(B); await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
    await p.waitForSelector('.devcode b', { timeout: 8000 }); await p.fill('#o1', await p.textContent('.devcode b'));
    await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit()); await p.waitForSelector('#main'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
    if (await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
    return p;
  }
  const main = (p) => p.locator('#main').innerText();
  const claire = await login('claire@maisonlumen.fr');
  // Accueil
  const bottom = await claire.evaluate(() => Math.max(...[...document.querySelectorAll('#main .next, #main .grid2')].map((e) => e.getBoundingClientRect().bottom)));
  ok('1440×900 : prochaine étape, « À faire » et « Cette semaine » visibles sans défiler', bottom <= 900, Math.round(bottom) + ' px');
  ok('Plus de chiffres clés ni de frise répétée sur l’accueil', (await claire.locator('#main .kpis, #main .steps').count()) === 0);
  const todo = await claire.locator('#td').locator('xpath=../..').innerText();
  ok('« À faire » ne répète pas la prochaine étape', !/Valider : plan du site/.test(todo), todo.replace(/\n/g, ' '));
  ok('La prochaine étape porte le J-x et le temps O.R.E.M.', /J-\d+ avant la mise en ligne · O · Orienter/.test(await claire.locator('.next .meta').innerText()));
  await claire.screenshot({ path: OUT + '/accueil-1-claire.png' });
  // Navigation
  ok('Navigation client : 7 entrées au plus', (await claire.locator('.side .nav a').count()) <= 7, String(await claire.locator('.side .nav a').count()));
  const short = await login('claire@maisonlumen.fr', { vp: { width: 1280, height: 640 } });
  const fb = await short.evaluate(() => document.querySelector('.side-foot').getBoundingClientRect().bottom);
  ok('Écran bas (640 px) : pied de barre latérale jamais coupé', fb <= 640, Math.round(fb) + ' px');
  // Fichiers
  await claire.click('.side [data-go=fichiers]'); await claire.waitForTimeout(150);
  ok('Fichiers et factures : deux onglets', (await claire.locator('[data-ftab]').count()) === 2);
  await claire.setInputFiles('#file-in', { name: 'Photo vitrine.png', mimeType: 'image/png', buffer: require('fs').readFileSync(__dirname + '/../public/assets/logo-black.png') }); await claire.waitForTimeout(600);
  ok('Miniature de l’image déposée', (await claire.locator('.row', { hasText: 'Photo vitrine.png' }).locator('img.thumb').count()) === 1);
  await claire.locator('.row', { hasText: 'Photo vitrine.png' }).locator('[data-act=fview]').click(); await claire.waitForTimeout(300);
  ok('Aperçu intégré de l’image', await claire.evaluate(() => { const i = document.querySelector('.fview img'); return !!i && i.naturalWidth > 0; }));
  await claire.keyboard.press('Escape'); await claire.waitForTimeout(100);
  await claire.fill('#f-q', 'vitrine'); await claire.waitForTimeout(150);
  ok('Recherche dans les fichiers', (await claire.locator('#ft-panel .row').filter({ hasText: 'Charte graphique' }).count()) === 0 && (await claire.locator('.row', { hasText: 'Photo vitrine' }).count()) === 1);
  await claire.fill('#f-q', '');
  ok('Retrait possible pendant 24 h pour son propre fichier, pas pour un ancien', (await claire.locator('.row', { hasText: 'Photo vitrine.png' }).locator('[data-act=file-remove-own]').count()) === 1 && (await claire.locator('.row', { hasText: 'Charte graphique 2019' }).locator('[data-act=file-remove-own]').count()) === 0);
  await claire.locator('.row', { hasText: 'Photo vitrine.png' }).locator('[data-act=file-remove-own]').click(); await claire.waitForTimeout(400);
  ok('Fichier retiré', (await claire.locator('.row', { hasText: 'Photo vitrine.png' }).count()) === 0);
  await claire.click('[data-ftab=docs]'); await claire.waitForTimeout(150);
  ok('Onglet « Factures et documents » : factures et IBAN', /F-2026-0187/.test(await main(claire)) && /IBAN/.test(await main(claire)));
  // Bibliothèque dans Maquettes
  const hugo = await login('hugo@huchet-demorge.fr');
  await hugo.click('.side [data-go=maquettes]'); await hugo.waitForTimeout(150);
  ok('« Maquettes et visuels » contient la bibliothèque', /Bibliothèque/.test(await main(hugo)) && (await hugo.locator('.tile').count()) > 0);
  // Cloche et préférences
  const louis = await login('louis@agence-orem.fr');
  await louis.click('.side [data-go=clients]'); await louis.click('.cat[data-mine="0"]'); await louis.click('[data-open=p_lumen]'); await louis.click('#tab-messages');
  await louis.fill('#am-t', 'Claire, le compte rendu est prêt.'); await louis.locator('form[data-form=amsg]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(400);
  await claire.reload(); await claire.waitForSelector('#main'); await claire.waitForTimeout(250);
  ok('Cloche : badge de notification côté client', /\d/.test(await claire.locator('.side [data-act=bell] .badge').innerText().catch(() => '')));
  await claire.click('.side [data-act=bell]'); await claire.waitForTimeout(150);
  ok('Cloche ouverte : le message de Louis', /le compte rendu est prêt/.test(await claire.locator('#bell-pop').innerText()));
  await claire.locator('#bell-pop [data-cnotif]').first().click(); await claire.waitForTimeout(300);
  ok('Un clic mène à la bonne rubrique (Messages)', /^Messages/.test(await claire.title()));
  await claire.evaluate(() => document.querySelector('[data-go=preferences]') ? document.querySelector('[data-go=preferences]').click() : null);
  await claire.click('.side [data-act=bell]'); await claire.click('#bell-pop [data-go=preferences]'); await claire.waitForTimeout(200);
  await claire.uncheck('#cp-week'); await claire.locator('form[data-form=cprefs]').evaluate((f) => f.requestSubmit()); await claire.waitForTimeout(300);
  ok('Préférences du client enregistrées', (await claire.evaluate(async () => (await (await fetch('/api/me')).json()).user.prefs.weekly)) === false);
  // Validation : confirmation, puis annulation dans les 10 s
  await claire.click('.side [data-go=valider]'); await claire.click('[data-act=approve]'); await claire.waitForTimeout(150);
  ok('Confirmation avant de valider', /feu vert pour « Plan du site »/.test(await main(claire)));
  await claire.click('[data-act=approve-ok]'); await claire.waitForTimeout(300);
  ok('Barre « Annuler » avec compte à rebours', /Annuler\s*\d+\s*s/.test(await claire.locator('#undo').innerText()));
  await claire.click('#undo [data-act=val-undo]'); await claire.waitForTimeout(400);
  ok('Validation annulée : de nouveau « À valider »', (await claire.locator('[data-act=approve]').count()) === 1);
  await new Promise((r) => setTimeout(r, 600));
  const inb = await louis.evaluate(async () => (await (await fetch('/api/inbox')).json()).items.map((n) => n.text));
  const obx = await louis.evaluate(async () => (await (await fetch('/api/outbox')).json()).items.map((m) => m.subject));
  ok('Rien n’est parti à l’équipe pour cette validation annulée', !inb.some((t) => /Claire a validé/.test(t)) && !obx.some((t) => /a validé/.test(t)), JSON.stringify(obx.slice(0, 3)));
  await claire.click('[data-act=approve]'); await claire.click('[data-act=approve-ok]'); await claire.waitForTimeout(300);
  ok('« Validé par Claire le jj/mm à hh h mm »', /Validé par Claire le \d{2}\/\d{2} à \d{2} h \d{2}/.test(await main(claire)), (await main(claire)).match(/Validé[^\n]*/g));
  // Mode sombre : accent sémantique bleu, l'orange réservé aux alertes
  const dk = await login('julie@cabinet-varenne.fr', { dark: true });
  const hl = await dk.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--hl').trim());
  ok('Mode sombre : accent bleu clair, pas orange', hl.toLowerCase() === '#9fb2ff', hl);
  ok('Julie : aucun compteur à zéro sur l’accueil', !/\b0\s+(fichier|élément|validation)/.test(await main(dk)));
  await dk.screenshot({ path: OUT + '/accueil-2-julie-sombre.png' });
  await br.close();
} catch (e) { R.push('✘ Arrêt : ' + e.message.split('\n')[0]); }
  console.log(R.join('\n')); console.log('ERRS', JSON.stringify(errs));
  process.exitCode = R.some((x) => x.startsWith('✘')) || errs.length ? 1 : 0;
})();
