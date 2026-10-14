/* Lot 3 : focus, dialogues, onglets, erreurs, mobile (serveur local sur le port 3123, données neuves) : node tests/a11y.js [dossier] */
const { chromium } = require('playwright');
const path = require('path');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
(async () => {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const errs = [];
  async function login(email, vp = { width: 1440, height: 900 }) {
    const p = await (await br.newContext({ viewport: vp, reducedMotion: 'reduce', isMobile: vp.width < 500, hasTouch: vp.width < 500 })).newPage();
    p.on('pageerror', (e) => errs.push(email + ' : ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.goto(B); await p.fill('#em', email); await p.click('form[data-form=login] button[type=submit]');
    await p.waitForSelector('.devcode b', { timeout: 8000 }); await p.fill('#o1', await p.textContent('.devcode b'));
    await p.click('form[data-form=verify] button[type=submit]'); await p.waitForSelector('#main'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
    return p;
  }
  const act = (p) => p.evaluate(() => { const a = document.activeElement; return a ? a.tagName + (a.id ? '#' + a.id : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}=${x.value}]`).join('') : 'null'; });
  const notBody = async (p) => !/^BODY/.test(await act(p));

  // Connexion : erreur sous le champ, un seul h1, landmark main
  { const p = await (await br.newContext()).newPage(); await p.goto(B);
    ok('Connexion : un seul titre h1 et un landmark main', (await p.locator('h1').count()) === 1 && (await p.locator('main').count()) === 1);
    await p.fill('#em', 'pas-une-adresse'); await p.click('form[data-form=login] button[type=submit]'); await p.waitForTimeout(150);
    ok('E-mail invalide : erreur sous le champ, reliée et focus dessus', (await p.getAttribute('#em', 'aria-invalid')) === 'true' && /valide/.test(await p.textContent('#em-err')) && (await act(p)) === 'INPUT#em' && /em-err/.test(await p.getAttribute('#em', 'aria-describedby')));
    await p.type('#em', 'x'); ok('L’erreur disparaît dès qu’on corrige', !(await p.$('#em-err')));
  }

  // Claire : focus après chaque action
  const c = await login('claire@maisonlumen.fr');
  ok('Accueil guidé : le focus est dans le dialogue, l’arrière-plan est inerte', (await c.evaluate(() => !!document.activeElement.closest('[role=dialog]'))) && (await c.evaluate(() => document.querySelector('.app').hasAttribute('inert'))));
  await c.keyboard.press('Tab'); await c.keyboard.press('Tab'); await c.keyboard.press('Tab'); await c.keyboard.press('Tab');
  ok('Tabulations : le focus reste dans l’accueil guidé', await c.evaluate(() => !!document.activeElement.closest('[role=dialog]')));
  await c.click('[data-act=ob-next]'); ok('Écran suivant de l’accueil guidé : focus conservé sur « Continuer »', /ob-next/.test(await act(c)));
  await c.keyboard.press('Escape'); await c.waitForTimeout(150);
  ok('Accueil guidé fermé : l’arrière-plan n’est plus inerte', !(await c.evaluate(() => document.querySelector('.app').hasAttribute('inert'))));
  await c.click('.side [data-go=fichiers]'); await c.waitForTimeout(150);
  ok('Changement de vue : focus sur le titre h1 et titre de page « Fichiers »', (await act(c)).startsWith('H1') && /^Fichiers · /.test(await c.title()));
  await c.click('[data-cat=Images]'); await c.waitForTimeout(150);
  ok('Filtre : le focus reste sur le bouton du filtre', /\[data-cat=Images\]/.test(await act(c)), await act(c));
  await c.click('.side [data-go=accueil]'); await c.waitForTimeout(150);
  await c.click('[data-act=qa][data-id=rdv]'); await c.waitForTimeout(150);
  ok('Réponse rapide : focus conservé sur la question', /data-id=rdv/.test(await act(c)), await act(c));
  await c.click('.side [data-go=messages]'); await c.fill('#msg-t', 'Bonjour !'); await c.click('form[data-form=msg] button'); await c.waitForTimeout(400);
  ok('Message envoyé : le focus ne retombe pas sur la page', await notBody(c), await act(c));
  await c.click('form[data-form=msg] button'); await c.waitForTimeout(150);
  ok('Message vide : erreur sous le champ au vouvoiement', /Écrivez votre message/.test(await c.textContent('#msg-t-err').catch(() => '')));
  await c.click('.side [data-go=biblio]').catch(() => {}); await c.click('.side [data-go=maquettes]'); await c.waitForTimeout(150);
  const t0 = Date.now(); await c.evaluate(() => document.querySelector('[data-act=copy], [data-act=copytxt]') || null);
  await c.click('.side [data-go=fichiers]'); await c.click('[data-ftab=docs]'); await c.click('[data-act=copy]'); await c.waitForTimeout(3500);
  ok('Toast encore visible après 3,5 s', await c.evaluate(() => document.getElementById('toast').classList.contains('show')));

  // Louis : onglets ARIA et dialogue « Ajouter »
  const l = await login('louis@agence-orem.fr');
  await l.click('.side [data-go=clients]'); await l.click('.cat[data-mine="0"]'); await l.click('[data-open=p_lumen]'); await l.waitForTimeout(200);
  ok('Onglets : tablist nommé, tabpanel relié', !!(await l.getAttribute('.tabs[role=tablist]', 'aria-label')) && (await l.getAttribute('[role=tabpanel]', 'aria-labelledby')) === 'tab-pilotage');
  await l.focus('#tab-pilotage'); await l.keyboard.press('ArrowRight'); await l.waitForTimeout(150);
  ok('Flèche droite : onglet suivant sélectionné et focus dessus', (await act(l)) === 'BUTTON#tab-messages[data-tab=messages]' && (await l.getAttribute('#tab-messages', 'aria-selected')) === 'true');
  await l.keyboard.press('End'); await l.waitForTimeout(150); ok('Fin : dernier onglet', /tab-activite/.test(await act(l)));
  ok('Tabindex itinérant : un seul onglet atteignable au clavier', (await l.locator('[role=tab][tabindex="0"]').count()) === 1);
  await l.click('.head-actions [data-act=compose]'); await l.waitForSelector('.compose-card'); await l.waitForTimeout(150);
  ok('« Ajouter » : focus dans le dialogue, arrière-plan inerte', (await l.evaluate(() => !!document.activeElement.closest('[role=dialog]'))) && (await l.evaluate(() => document.querySelector('.app').hasAttribute('inert'))));
  await l.keyboard.press('Escape'); await l.waitForTimeout(150);
  ok('Fermeture : le focus revient sur le bouton « Ajouter »', /\[data-act=compose\]/.test(await act(l)), await act(l));
  await l.click('.side [data-go=reglages]'); await l.waitForTimeout(150); await l.click('[data-act=digest]'); await l.waitForTimeout(300);
  await l.click('[data-mail="0"]'); await l.waitForTimeout(150);
  ok('Aperçu d’e-mail : focus dans le dialogue', await l.evaluate(() => !!document.activeElement.closest('[role=dialog]')));
  await l.keyboard.press('Escape'); await l.waitForTimeout(150);
  ok('… et retour sur la ligne de l’e-mail à la fermeture', /data-mail=0/.test(await act(l)), await act(l));

  // Mobile 320 px : aucun débordement, champs en 16 px
  const m = await login('hugo@huchet-demorge.fr', { width: 320, height: 640 });
  const wide = [];
  for (const v of ['accueil', 'projet', 'valider', 'maquettes', 'messages', 'fichiers', 'documents', 'outils', 'equipe', 'plus', 'preferences']) {
    await m.evaluate((v) => { const a = document.querySelector(`[data-go="${v}"]`); a && a.click(); }, v); await m.waitForTimeout(120);
    const w = await m.evaluate(() => document.documentElement.scrollWidth); if (w > 320) wide.push(v + ' (' + w + ' px)');
  }
  ok('320 px : aucun écran plus large que l’écran', !wide.length, wide.join(', '));
  await m.evaluate(() => document.querySelector('[data-go=messages]').click()); await m.waitForTimeout(120);
  ok('Mobile : champ de message en 16 px (pas de zoom iOS)', (await m.evaluate(() => getComputedStyle(document.getElementById('msg-t')).fontSize)) === '16px');
  await m.screenshot({ path: OUT + '/a11y-320.png' });

  // Démo autonome : mode standard, langue, viewport
  const d = await (await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
  await d.goto('file://' + path.join(__dirname, '..', 'dist', 'espace-client-demo.html')); await d.waitForSelector('#main');
  ok('Démo : mode standard, lang="fr", largeur mobile réelle', (await d.evaluate(() => document.compatMode)) === 'CSS1Compat' && (await d.evaluate(() => document.documentElement.lang)) === 'fr' && (await d.evaluate(() => innerWidth)) === 390);

  console.log(R.join('\n')); console.log('ERRS', JSON.stringify(errs)); await br.close();
  process.exitCode = R.some((x) => x.startsWith('✘')) || errs.length ? 1 : 0;
})();
