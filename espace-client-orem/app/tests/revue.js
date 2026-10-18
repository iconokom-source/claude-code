/* Revue experte en conditions réelles (18/10) : les défauts relevés écran par écran ne doivent pas revenir.
   Typographie française partout, pilule blanche sur « Équipe et aide » et Évolution, largeur et titres identiques
   entre écrans refondus et anciens, mode prospect cohérent, « Ensuite » juste, heures sans « 00 », dernier feu vert
   « Mise en ligne », focus clavier visible sur les tâches, Réglages à 320 px. node tests/revue.js [dossier] */
const { chromium } = require('playwright'); const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, x) => R.push(`${v ? '✔' : '✘'} ${l}${!v && x ? ' → ' + x : ''}`);
const errs = []; let br;
async function login(email, w = 1440, h = 900) {
  const p = await (await br.newContext({ viewport: { width: w, height: h }, locale: 'fr-FR', reducedMotion: 'reduce' })).newPage();
  p.on('pageerror', (e) => errs.push(email + ' : ' + e.message)); p.on('dialog', (d) => d.accept());
  await p.goto(B); await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('#main'); await p.waitForTimeout(400);
  for (let i = 0; i < 10 && await p.$('.ob'); i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  return p;
}
const go = async (p, v) => { await p.evaluate((g) => { const a = document.createElement('a'); a.dataset.go = g; document.body.appendChild(a); a.click(); a.remove(); }, v); await p.waitForTimeout(450); };
// Espace ordinaire (pas insécable) devant « : ; ! ? » dans le texte affiché
const badTypo = (p) => p.evaluate(() => { const out = []; const w = document.createTreeWalker(document.querySelector('#root') || document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.parentElement.closest('textarea,input,script,style,code,pre')) continue; if (/[^\s] [:;!?»](\s|$)/.test(n.nodeValue) || /« [^\s]/.test(n.nodeValue)) out.push(n.nodeValue.trim().slice(0, 60)); } return out; });
const white = 'rgb(244, 244, 246)';
(async () => { try {
  br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const claire = await login('claire@maisonlumen.fr');
  const bad = [];
  for (const v of ['accueil', 'equipe', 'outils', 'preferences', 'demarrer', 'messages', 'fichiers']) { await go(claire, v); (await badTypo(claire)).forEach((t) => bad.push(v + ' : ' + t)); }
  ok('Typographie : espace insécable avant « : ; ! ? » sur tous les écrans (pas seulement les refondus)', !bad.length, bad.slice(0, 5).join(' | '));
  await go(claire, 'equipe');
  ok('« Équipe et aide » actif : pilule blanche comme les autres rubriques', (await claire.locator('.side .help-link').evaluate((e) => getComputedStyle(e).backgroundColor)) === white);
  const geo = async (v) => { await go(claire, v); return claire.evaluate(() => { const w = document.querySelector('#main .wrap').getBoundingClientRect(), h = document.querySelector('#main h1'); return [Math.round(w.left), Math.round(w.width), getComputedStyle(h).fontSize]; }); };
  const g1 = await geo('accueil'), g2 = await geo('equipe'), g3 = await geo('outils');
  ok('Même largeur de page et même taille de titre sur les écrans refondus et les autres', JSON.stringify(g1) === JSON.stringify(g2) && JSON.stringify(g2) === JSON.stringify(g3), JSON.stringify([g1, g2, g3]));
  await go(claire, 'equipe');
  ok('Questions fréquentes : zone cliquable d’au moins 44 px', (await claire.locator('details summary').first().evaluate((e) => e.getBoundingClientRect().height)) >= 44);
  await go(claire, 'valider');
  ok('Dernier feu vert nommé « Mise en ligne » (plus « Réception du site »)', /Mise en ligne/.test(await claire.locator('#main').innerText()) && !/Réception du site/.test(await claire.locator('#main').innerText()));
  await go(claire, 'maquettes');
  ok('Lien Figma d’exemple : pas d’iframe Figma en erreur, un lien « Parcourir » à la place', !(await claire.$('.cx-hero iframe')) && !!(await claire.$('.cx-hero a.cx-shot')));
  // Julie : « Ensuite » = le vrai livrable suivant
  const julie = await login('julie@cabinet-varenne.fr');
  ok('Carte « prochaine action » : « Ensuite » montre le livrable suivant (plan du site), pas l’étape d’après', /Ensuite\s:\sPlan du site/.test(await julie.locator('.cx-ink').innerText()), await julie.locator('.cx-then').innerText().catch(() => ''));
  // Inès (avant signature)
  const ines = await login('ines@domaine-des-vergers.fr', 390, 800);
  const im = await ines.locator('#main').innerText();
  ok('Avant signature : « Le déroulé proposé », sans « livrables faits » ni « Où en est votre projet »', /Le déroulé proposé/.test(im) && !/livrables? faits?/.test(im) && !/Où en est votre projet/.test(im));
  ok('Avant signature (mobile) : barre du bas sans « Fichiers »', !(await ines.$('.tabbar [data-go=fichiers]')) && (await ines.locator('.tabbar a').count()) === 4);
  await ines.click('.tabbar [data-go=plus]'); await ines.waitForTimeout(300);
  const ip = await ines.locator('#main').innerText();
  ok('Avant signature : « Plus » propose la proposition et l’aide, pas les étapes ni les factures', /Proposition/.test(ip) && !/Étapes/.test(ip) && !/Devis et factures/.test(ip));
  // Hugo : Évolution
  const hugo = await login('hugo@huchet-demorge.fr');
  await go(hugo, 'evolution');
  ok('Évolution active : pilule blanche, sous-titre lisible', await hugo.locator('.side .nav-evo').evaluate((e) => getComputedStyle(e).backgroundColor === 'rgb(244, 244, 246)' && getComputedStyle(e.querySelector('small')).color !== 'rgb(244, 244, 246)'));
  ok('Heure ronde affichée « 11 h », jamais « 11 h 00 »', !/\d h 00\b/.test(await hugo.locator('#main').innerText()));
  await go(hugo, 'outils'); await hugo.click('[data-tool=request]'); await hugo.waitForTimeout(300);
  ok('Demandes : statut « Proposé » affiché « Devis envoyé »', /Devis envoyé/.test(await hugo.locator('#main').innerText()) && !/Proposé/.test(await hugo.locator('#main').innerText()));
  // Agence
  const louis = await login('louis@agence-orem.fr');
  await go(louis, 'taches');
  await louis.keyboard.press('Shift+N'); await louis.waitForTimeout(300);
  ok('Tâches : Maj + N ouvre le panneau avec le focus dans le titre', await louis.evaluate(() => document.activeElement && document.activeElement.id === 'tkd-t'));
  await louis.keyboard.press('Escape'); await louis.waitForTimeout(250);
  await louis.evaluate(() => document.activeElement && document.activeElement.blur());
  let ring = null; for (let i = 0; i < 40 && ring === null; i++) { await louis.keyboard.press('Tab'); ring = await louis.evaluate(() => { const e = document.activeElement; return e && e.classList.contains('b1') ? getComputedStyle(e).outlineStyle + ' ' + getComputedStyle(e).outlineWidth : null; }); }
  ok('Tâches : focus clavier visible sur « C’est fait » (bouton « all:unset »)', !!ring && !/^none/.test(ring), ring);
  ok('Par client : « 0 / 2 faites » (pluriel selon le total)', !/\d+ \/ [2-9]\d* faite\b/.test(await louis.locator('.tk-clients').innerText()));
  const narrow = await login('louis@agence-orem.fr', 320, 700);
  await go(narrow, 'reglages');
  ok('Réglages à 320 px : aucun défilement horizontal (clés des outils connectés)', await narrow.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await go(claire, 'equipe');
  ok('Équipe et aide : numéros de téléphone cliquables (tel:)', (await claire.locator('a.tel[href^="tel:+33"]').count()) === 3);
  const cm = await login('claire@maisonlumen.fr', 390, 800);
  await cm.click('.tabbar [data-go=plus]'); await cm.waitForTimeout(300);
  ok('Mobile « Plus » : flèches sur la ligne, « Mode sombre » et « Se déconnecter » sans bordure de bouton natif', await cm.evaluate(() => { const rows = [...document.querySelectorAll('#main .linkrow')]; return rows.length >= 8 && rows.every((r) => r.getBoundingClientRect().height < 70) && [...document.querySelectorAll('#main button.linkrow')].every((b) => getComputedStyle(b).borderTopStyle === 'none'); }));
  await louis.evaluate(() => { const a = document.createElement('button'); a.dataset.open = 'p_huchet'; document.body.appendChild(a); a.click(); a.remove(); }); await louis.waitForTimeout(500);
  ok('Fiche client : la proposition en attente apparaît dans « En attente du client »', /Proposition\s«\s.+\s»\sà accepter/.test(await louis.locator('.band').innerText()));
  ok('Fiche client : onglets entiers sur grand écran (aucun onglet coupé)', await louis.evaluate(() => { const t = document.querySelector('.tabs'); return t.scrollWidth <= t.clientWidth + 1; }));
  await louis.evaluate(() => { const a = document.createElement('button'); a.dataset.open = 'p_lumen'; document.body.appendChild(a); a.click(); a.remove(); }); await louis.waitForTimeout(500);
  await louis.click('[data-tab=validations]'); await louis.waitForTimeout(300);
  const hist = await louis.locator('#tabpanel').innerText();
  ok('Historique des validations : « a demandé la validation », heure « 11 h »', /a demandé la validation/.test(hist) && !/\d\d:\d\d/.test(hist), hist.slice(0, 200));
  const lm = await login('louis@agence-orem.fr', 390, 800);
  await lm.evaluate(() => { const a = document.createElement('button'); a.dataset.open = 'p_lumen'; document.body.appendChild(a); a.click(); a.remove(); }); await lm.waitForTimeout(500);
  ok('Mobile : la croix « Retirer » reste sur la ligne de l’action', await lm.evaluate(() => [...document.querySelectorAll('[data-act=task-remove]')].every((x) => { const r = x.closest('.row').querySelector('.grow').getBoundingClientRect(), b = x.getBoundingClientRect(); return Math.abs((r.top + r.bottom) / 2 - (b.top + b.bottom) / 2) < 20; })));
  ok('Aucune erreur JavaScript', !errs.length, errs.join(' | '));
  await br.close();
} catch (e) { R.push('✘ Erreur : ' + e.message); if (br) await br.close(); }
  console.log(R.join('\n')); console.log(`\n${R.filter((x) => x[0] === '✔').length} réussies, ${R.filter((x) => x[0] === '✘').length} échouées`);
  process.exit(R.some((x) => x[0] === '✘') ? 1 : 0);
})();
