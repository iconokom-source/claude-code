/* Espace client v2 (bento) : accueil, carte « prochaine action », chiffres, « Reste à régler » seulement si une facture est due,
   bandes O.R.E.M., Étapes, À valider (valider, annuler, signer), Fichiers (dépôt, filtres, paiements), Messages, Maquettes et visuels,
   accueil Évolution, mobile 390 et 320 px sans défilement horizontal, mode sombre, aucune erreur JS. node tests/client-v2.js [dossier] */
const { chromium } = require('playwright'); const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, x) => R.push(`${v ? '✔' : '✘'} ${l}${!v && x ? ' → ' + x : ''}`);
const errs = []; let br;
async function login(email, w = 1440, h = 900, dark) {
  const p = await (await br.newContext({ viewport: { width: w, height: h }, locale: 'fr-FR', colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce', bypassCSP: true })).newPage();
  p.on('pageerror', (e) => errs.push(email + ' : ' + e.message)); p.on('dialog', (d) => d.accept());
  await p.goto(B); await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('#main'); await p.waitForTimeout(400);
  for (let i = 0; i < 10 && await p.$('.ob'); i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  return p;
}
const api = (p, path) => p.evaluate(async (path) => (await fetch(path, { headers: { 'X-Orem': '1' } })).json(), path);
const go = async (p, v) => { await p.evaluate((v) => { const a = document.querySelector(`.side [data-go="${v}"]`) || document.querySelector(`.tabbar [data-go="${v}"]`) || document.querySelector(`[data-go="${v}"]`); a && a.click(); }, v); await p.waitForTimeout(450); };
const noScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const kpiNum = (p, label) => p.evaluate((label) => { const k = [...document.querySelectorAll('.cx-kpi')].find((x) => x.querySelector('.cx-l').innerText.trim() === label); return k ? k.querySelector('.cx-num').innerText.replace(/\s+/g, ' ').trim() : null; }, label);
(async () => { try {
  br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const claire = await login('claire@maisonlumen.fr');
  const P = (await api(claire, '/api/projects/p_lumen')).project;
  // Accueil
  ok('Accueil : page portée sous .cx-wrap (bento)', await claire.evaluate(() => document.querySelector('#main .wrap').classList.contains('cx-wrap')) && !!(await claire.$('.cx-bento')));
  ok('Titre en Trykker, onglet actif en pilule blanche', /Trykker/.test(await claire.locator('.cx-head h1').evaluate((e) => getComputedStyle(e).fontFamily)) && (await claire.locator('.side [data-go=accueil]').evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgb(244, 244, 246)');
  const ink = await claire.locator('.cx-ink').innerText();
  ok('Carte « prochaine action » : titre, échéance, « Action 1 sur N », vidéo de Clément', /Valider le plan du site/.test(ink) && /Votre prochaine action · demain, 18 h/i.test(ink) && /Action 1 sur \d/.test(ink) && /Le plan du site expliqué/.test(ink), ink.replace(/\n/g, ' '));
  ok('Carte « prochaine action » : vrais boutons (Voir et valider, Regarder la vidéo dans Loom)', !!(await claire.$('.cx-ink a[data-go=valider]')) && /loom\.com/.test(await claire.locator('.cx-ink a[target=_blank]').first().getAttribute('href')));
  ok('4 chiffres : Mise en ligne, À valider, Fichiers reçus, Prochain point', (await claire.locator('.cx-kpi').count()) === 4 && /Mise en ligne[\s\S]*À valider[\s\S]*Fichiers reçus[\s\S]*Prochain point/.test(await claire.locator('.cx-kpis').innerText()));
  const files = P.files.filter((f) => f.from === 'client').length, dec = P.validations.filter((v) => v.status === 'ready').length + P.files.filter((f) => f.sign && f.sign.status === 'requested').length;
  ok('Chiffres exacts : décisions et fichiers reçus tirés du projet', (await kpiNum(claire, 'À valider')) === dec + ' décisions' && (await kpiNum(claire, 'Fichiers reçus')) === files + ' fichiers', (await kpiNum(claire, 'À valider')) + ' / ' + (await kpiNum(claire, 'Fichiers reçus')));
  ok('Aucune facture due : pas de carte « À régler »', (await kpiNum(claire, 'À régler')) === null);
  ok('Bandes O.R.E.M. : 4 temps, « Orienter » en cours, un losange par feu vert', (await claire.locator('.cx-band').count()) === 4 && /Orienter/.test(await claire.locator('.cx-band.on').innerText()) && (await claire.locator('.cx-mile').count()) === P.validations.length);
  ok('Ce qui arrive ensuite, Votre équipe (contact), Derniers messages (épinglé)', /Ce qui arrive ensuite/.test(await claire.locator('#main').innerText()) && /Votre contact/.test(await claire.locator('.cx-team').innerText()) && /Épinglé/.test(await claire.locator('#cx-msg-h >> xpath=../..').innerText()));
  await claire.screenshot({ path: OUT + '/client-v2-accueil.png', fullPage: true });
  await claire.click('.cx-kpi[data-go=valider]'); await claire.waitForTimeout(400);
  ok('Le chiffre « À valider » ouvre la page À valider', /À valider/.test(await claire.locator('#main h1').innerText()));
  // À valider
  ok('À valider : carte de décision avec « Décision 1 sur 2 » et le compte à rebours', /Décision 1 sur 2/.test(await claire.locator('.cx-val').innerText()) && /heures? pour répondre/.test(await claire.locator('.cx-val').innerText()));
  ok('Les feux verts du projet : une case par validation', (await claire.locator('.cx-step').count()) === P.validations.length);
  await claire.click('.cx-val [data-act=approve]'); await claire.waitForTimeout(200);
  await claire.click('[data-act=approve-ok]'); await claire.waitForTimeout(500);
  ok('Valider : enregistré, barre « Annuler » proposée', (await api(claire, '/api/projects/p_lumen')).project.validations.find((v) => v.key === 'plan').status === 'approved' && !!(await claire.$('#undo')));
  await claire.click('[data-act=val-undo]'); await claire.waitForTimeout(500);
  ok('Annuler : la décision revient', (await api(claire, '/api/projects/p_lumen')).project.validations.find((v) => v.key === 'plan').status === 'ready' && (await claire.locator('.cx-val [data-act=approve]').count()) === 1);
  await claire.click('.cx-val [data-act=changes]'); await claire.waitForTimeout(200);
  ok('Demander des modifications : formulaire et focus dans le champ', await claire.evaluate(() => /^chg-/.test(document.activeElement.id)));
  await claire.click('[data-act=valcancel]'); await claire.waitForTimeout(200);
  await claire.click('[data-act=sign-open]'); await claire.waitForTimeout(250);
  ok('Signer : le formulaire de signature s’ouvre dans la carte', !!(await claire.$('form[data-form=signdoc]')) && await claire.evaluate(() => /^sg-ok-/.test(document.activeElement.id)));
  await claire.check('[id^=sg-ok-]'); await claire.fill('[id^=sg-n-]', 'Claire Martin'); await claire.locator('form[data-form=signdoc]').evaluate((f) => f.requestSubmit()); await claire.waitForTimeout(700);
  ok('Document signé : enregistré, la décision disparaît', (await api(claire, '/api/projects/p_lumen')).project.files.some((f) => f.sign && f.sign.status === 'signed') && !(await claire.$('[data-act=sign-open]')));
  // Étapes
  await go(claire, 'projet');
  ok('Étapes : planning (4 lignes), étape en cours, Qui fait quoi, étapes suivantes', (await claire.locator('.cx-gantt .cx-lane').count()) === 4 && !!(await claire.$('.cx-phase-now')) && !!(await claire.$('.cx-whos')) && (await claire.locator('.cx-next-ph').count()) === 3);
  ok('Étapes : « Voir et valider » sur le livrable à valider', (await claire.locator('.cx-deliv li.review a[data-go=valider]').count()) === 1);
  // Fichiers
  await go(claire, 'fichiers');
  ok('Fichiers : dépôt (fichiers, dossier, éléments manquants), paiements, envois, déjà reçu, remis par l’agence', !!(await claire.$('#drop #file-in')) && !!(await claire.$('#drop #dir-in')) && (await claire.locator('#drop [data-missing]').count()) === P.missing.length && /Paiements[\s\S]*Vos envois[\s\S]*Déjà reçu[\s\S]*Remis par l’agence/.test(await claire.locator('#main').innerText()));
  ok('Paiements : 50 % réglé, IBAN à copier', /50 %/.test(await claire.locator('.cx-ring').innerText()) && /FR\d{2}/.test(await claire.locator('#iban').innerText()) && !!(await claire.$('.cx-pay [data-act=copy]')));
  await claire.setInputFiles('#file-in', { name: 'Photo vitrine.png', mimeType: 'image/png', buffer: require('fs').readFileSync(__dirname + '/../public/assets/logo-black.png') }); await claire.waitForTimeout(800);
  ok('Dépôt : la vignette du fichier apparaît, marquée « Envoyé », avec retrait possible', (await claire.locator('.cx-ft', { hasText: 'Photo vitrine' }).count()) === 1 && /Envoyé/.test(await claire.locator('.cx-ft', { hasText: 'Photo vitrine' }).innerText()) && (await claire.locator('.cx-ft', { hasText: 'Photo vitrine' }).locator('[data-act=file-remove-own]').count()) === 1);
  await claire.click('[data-cat=Vidéos]'); await claire.waitForTimeout(200);
  ok('Filtre « Vidéos » : seules les vidéos, le bouton garde le focus', (await claire.locator('.cx-ft').count()) === P.files.filter((f) => f.from === 'client' && f.cat === 'Vidéos').length && await claire.evaluate(() => document.activeElement.dataset.cat === 'Vidéos'));
  await claire.click('[data-cat=Tous]'); await claire.waitForTimeout(150);
  // Messages
  await go(claire, 'messages');
  ok('Messages : épinglé, séparateurs de jours, vidéo de Clément, feu vert attendu, À qui écrire', !!(await claire.$('.cx-pinned')) && (await claire.locator('.cx-day').count()) >= 1 && (await claire.locator('.cx-conv a.cx-vid[href*="loom"]').count()) >= 1 && !!(await claire.$('.cx-ctx a[data-go=valider]')) && (await claire.locator('.cx-wm').count()) === 3);
  await claire.fill('#msg-t', 'Merci, je regarde la vidéo ce soir !'); await claire.locator('form[data-form=msg]').evaluate((f) => f.requestSubmit()); await claire.waitForTimeout(600);
  ok('Envoyer un message : il apparaît dans la conversation', /je regarde la vidéo ce soir/.test(await claire.locator('.thread').innerText()));
  // Facture due : Julie
  const julie = await login('julie@cabinet-varenne.fr');
  ok('Facture due : la carte « À régler » remplace « Prochain point », montant exact', String(await kpiNum(julie, 'À régler')).replace(/[\s\u202f\u00a0]/g, '') === '4560€' && (await kpiNum(julie, 'Prochain point')) === null, await kpiNum(julie, 'À régler'));
  ok('Bien démarrer : acompte, Webflow, domaine, avec « Commencer »', (await julie.locator('.cx-su li').count()) === 3 && !!(await julie.$('.cx-setup a[data-go=demarrer]')));
  ok('Visio à réserver : lien de prise de rendez-vous dans la carte encre', !!(await julie.$('.cx-ink .cx-b-light[target=_blank]')));
  await julie.click('.cx-kpi[data-go=documents]'); await julie.waitForTimeout(500);
  ok('« À régler » ouvre Fichiers et factures sur les paiements', /Fichiers et factures/.test(await julie.locator('#main h1').innerText()) && await julie.evaluate(() => document.activeElement && document.activeElement.id === 'pay-h'));
  // Projet livré : Hugo (Évolution)
  const hugo = await login('hugo@huchet-demorge.fr');
  const hm = await hugo.locator('#main').innerText();
  ok('Accueil Évolution : devis à accepter, visio de pilotage, chiffres du mois, bilan, axes, résultats', !!(await hugo.$('.cx-ink a[data-go=proposition]')) && /Prochaine visio de pilotage/.test(hm) && /en chiffres/.test(hm) && (await hugo.locator('.cx-kpi').count()) === 4 && /Le bilan du mois/.test(hm) && /Les axes du mois/.test(hm) && !!(await hugo.$('.cx-dotm')));
  await hugo.click('[data-act=rs-open]'); await hugo.waitForTimeout(250);
  ok('« Demander un autre créneau » ouvre le formulaire', !!(await hugo.$('form[data-form=reschedule] #rs-t')));
  ok('L’avis sur le projet reste demandé sur l’accueil', !!(await hugo.$('.stars')));
  await go(hugo, 'maquettes');
  ok('Maquettes et visuels : maquette cliquable, versions, écrans, commentaires, bibliothèque, couleurs', !!(await hugo.$('.cx-hero a[href*="figma.com/proto"]')) && (await hugo.locator('.cx-vers li').count()) === 2 && (await hugo.locator('.cx-scr').count()) >= 1 && (await hugo.locator('.cx-gi').count()) >= 1 && (await hugo.locator('.cx-sw').count()) >= 1);
  await hugo.click('.cx-scr button[data-act=zoom] >> nth=0'); await hugo.waitForTimeout(300);
  ok('« Commenter » ouvre l’écran en grand avec la pose d’épingle', !!(await hugo.$('.lb .pin-area')));
  await hugo.keyboard.press('Escape'); await hugo.waitForTimeout(200);
  ok('Fermeture : le focus revient sur « Commenter »', await hugo.evaluate(() => document.activeElement && document.activeElement.dataset.act === 'zoom'));
  // Mobile 390 et 320
  for (const [email, w] of [['claire@maisonlumen.fr', 390], ['claire@maisonlumen.fr', 320], ['hugo@huchet-demorge.fr', 320]]) {
    const m = await login(email, w, 800); const bad = [];
    for (const v of ['accueil', 'projet', 'valider', 'fichiers', 'messages', 'maquettes']) { await go(m, v); if (!(await noScroll(m))) bad.push(v); }
    ok(`Mobile ${w} px (${email.split('@')[0]}) : aucun défilement horizontal sur les 6 écrans`, !bad.length, bad.join(', '));
    if (w === 390) { await go(m, 'accueil'); ok('Mobile 390 px : chiffres sur deux colonnes', await m.evaluate(() => { const k = [...document.querySelectorAll('.cx-kpi')]; return k.length === 4 && Math.abs(k[0].getBoundingClientRect().top - k[1].getBoundingClientRect().top) < 2; })); await m.screenshot({ path: OUT + '/client-v2-mobile.png', fullPage: true }); }
  }
  // Mode sombre
  const dark = await login('claire@maisonlumen.fr', 1440, 900, true);
  ok('Mode sombre : feuille sombre, titre clair, carte encre en dégradé nuit', await dark.evaluate(() => { const c = getComputedStyle(document.querySelector('.cx-head h1')).color, bg = getComputedStyle(document.querySelector('.cx-ink')).backgroundImage; return c === 'rgb(244, 244, 246)' && /linear-gradient/.test(bg); }));
  await dark.screenshot({ path: OUT + '/client-v2-sombre.png' });
  // Accessibilité (axe-core, WCAG A et AA) sur les écrans refondus, en clair (Hugo) et en sombre (Claire)
  const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'), viol = [];
  for (const [p, who] of [[dark, 'Claire sombre'], [hugo, 'Hugo']]) for (const v of ['accueil', 'projet', 'valider', 'fichiers', 'messages', 'maquettes']) {
    await go(p, v); await p.addScriptTag({ content: AXE });
    const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((x) => x.id + ' ' + (x.nodes[0] && x.nodes[0].target.join(' '))));
    r.forEach((x) => viol.push(who + ' / ' + v + ' : ' + x));
  }
  ok('Accessibilité (axe, WCAG AA) : aucune violation sur les 6 écrans, clair et sombre', !viol.length, viol.slice(0, 8).join(' | '));
  ok('Aucune erreur JavaScript', !errs.length, errs.join(' | '));
  await br.close();
} catch (e) { R.push('✘ Erreur : ' + e.message); if (br) await br.close(); }
  console.log(R.join('\n')); console.log(`\n${R.filter((x) => x[0] === '✔').length} réussies, ${R.filter((x) => x[0] === '✘').length} échouées`);
  process.exit(R.some((x) => x[0] === '✘') ? 1 : 0);
})();
