/* Lot 6 : poste de travail de l'agence (serveur local sur le port 3123, données neuves) : node tests/agence.js [dossier] */
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
const errs = [];
(async () => { try {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  async function login(email, vp = { width: 1440, height: 900 }) {
    const p = await (await br.newContext({ viewport: vp, reducedMotion: 'reduce', isMobile: vp.width < 500, hasTouch: vp.width < 500 })).newPage();
    p.on('pageerror', (e) => errs.push(email + ' : ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.goto(B); await p.fill('#em', email); await p.click('form[data-form=login] button[type=submit]');
    await p.waitForSelector('.devcode b', { timeout: 8000 }); await p.fill('#o1', await p.textContent('.devcode b'));
    await p.click('form[data-form=verify] button[type=submit]'); await p.waitForSelector('#main'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
    if (await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(120); }
    return p;
  }
  const main = (p) => p.locator('#main').innerText();
  // Claire écrit, Hugo demande une évolution (déjà dans les données), Claire dépose un fichier
  const claire = await login('claire@maisonlumen.fr');
  await claire.click('.side [data-go=messages]'); await claire.fill('#msg-t', 'Pouvez-vous ajouter une page Presse ?'); await claire.click('form[data-form=msg] button'); await claire.waitForTimeout(300);

  const hugo0 = await login('hugo@huchet-demorge.fr');
  await hugo0.click('.side [data-go=messages]'); await hugo0.fill('#msg-t', 'Peut-on ajouter le logo du cabinet en pied de page ?'); await hugo0.click('form[data-form=msg] button'); await hugo0.waitForTimeout(300);
  const louis = await login('louis@agence-orem.fr');
  const todo = await louis.locator('[data-inbox=todo] .num').innerText(), badge = await louis.locator('.side [data-go=inbox] .badge').innerText();
  ok('Boîte de réception : « À traiter » par défaut, badge = nombre à traiter', (await louis.getAttribute('[data-inbox=todo]', 'aria-pressed')) === 'true' && badge.replace(/\D/g, '') === todo, `${badge} / ${todo}`);
  ok('« À traiter » : les messages de Claire et de Hugo, pas l’activité des collègues', /Claire : « Pouvez-vous ajouter une page Presse/.test(await main(louis)) && /Hugo : « Peut-on ajouter le logo/.test(await main(louis)) && !/Louis a demandé la validation/.test(await main(louis)));
  await louis.selectOption('#ib-c', 'p_huchet'); await louis.waitForTimeout(150);
  ok('Filtre par client : seulement Huchet-Demorge', !/Claire/.test(await louis.locator('.panel').last().innerText()) && /Hugo/.test(await main(louis)));
  await louis.selectOption('#ib-c', ''); await louis.waitForTimeout(150);
  ok('Filtre par type : seulement les fichiers', (await louis.selectOption('#ib-t', 'files'), await louis.waitForTimeout(150), !/Pouvez-vous/.test(await main(louis)) && /a déposé/.test(await main(louis))));
  await louis.selectOption('#ib-t', '');
  // Répondre directement
  await louis.locator('.inbox-item', { hasText: 'Pouvez-vous ajouter' }).locator('[data-act=reply]').click(); await louis.waitForTimeout(100);
  const rp = await louis.locator('form[data-form=reply] textarea').getAttribute('id');
  await louis.fill('#' + rp, 'Oui Claire, on vous la propose au prochain point.'); await louis.click('form[data-form=reply] button'); await louis.waitForTimeout(400);
  ok('Réponse directe depuis la boîte : envoyée et retirée de « À traiter »', !/Pouvez-vous ajouter une page Presse/.test(await main(louis)));
  await claire.reload(); await claire.waitForSelector('#main'); await claire.click('.side [data-go=messages]'); await claire.waitForTimeout(200);
  ok('Claire reçoit la réponse dans son espace', /on vous la propose au prochain point/.test(await main(claire)));
  const before = Number((await louis.locator('.side [data-go=inbox] .badge').innerText()).replace(/\D/g, ''));
  await louis.locator('.inbox-item', { hasText: 'Peut-on ajouter le logo' }).first().locator('[data-act=done]').click(); await louis.waitForTimeout(300);
  const after = Number((await louis.locator('.side [data-go=inbox] .badge').innerText().catch(() => '0')).replace(/\D/g, '') || 0);
  ok('« Traité » : la ligne passe dans l’historique et le badge baisse tout de suite', after < before && !/Peut-on ajouter le logo/.test(await main(louis)), `${before} → ${after}`);
  const theo = await login('theophile@agence-orem.fr');
  ok('Traité par Louis = traité pour Théophile aussi', !/Peut-on ajouter le logo/.test(await main(theo)));
  await louis.screenshot({ path: OUT + '/agence-1-inbox.png', fullPage: true });

  // Liste des clients
  await louis.click('.side [data-go=clients]'); await louis.click('.cat[data-mine="0"]'); await louis.waitForTimeout(150);
  ok('Clients : vraie grille (en-têtes de colonnes)', (await louis.locator('.grid-clients thead th').count()) === 5);
  const firstRow = await louis.locator('.grid-clients tbody tr').first().innerText();
  ok('Tri par urgence : un client qui attend l’agence en premier', /Agence/.test(firstRow), firstRow.replace(/\s+/g, ' '));
  await louis.fill('#cl-q', 'varen'); await louis.waitForTimeout(150);
  ok('Recherche : « varen » ne garde que Cabinet Varenne, le focus reste dans le champ', (await louis.locator('.grid-clients tbody tr').count()) === 1 && /Varenne/.test(await louis.locator('.grid-clients tbody').innerText()) && (await louis.evaluate(() => document.activeElement.id)) === 'cl-q');
  await louis.fill('#cl-q', ''); await louis.selectOption('#cl-s', 'nom'); await louis.waitForTimeout(150);
  ok('Tri par nom', /^Cabinet Varenne/.test((await louis.locator('.grid-clients tbody tr').first().innerText()).trim()));
  ok('« Nouveau client » en bouton secondaire', (await louis.locator('.head [data-go=nouveau].btn-line').count()) === 1);
  await louis.screenshot({ path: OUT + '/agence-2-clients.png', fullPage: true });

  // Fiche client : bandeau d'état, relance, demandes, enregistrement automatique
  await louis.click('[data-open=p_lumen]'); await louis.waitForTimeout(200);
  ok('Fiche : bandeau d’état (agence, client depuis X jours, échéance)', /à valider depuis 2 jours/.test(await louis.locator('.band').innerText()) && /Mise en ligne J-/.test(await louis.locator('.band').innerText()));
  await louis.click('.band [data-act=remind]'); await louis.waitForTimeout(400);
  await claire.reload(); await claire.waitForSelector('#main'); await claire.waitForTimeout(200);
  const ob = await louis.evaluate(async () => (await (await fetch('/api/outbox')).json()).items.map((m) => m.to + ' | ' + m.html));
  await new Promise((r) => setTimeout(r, 500));
  const ob2 = await louis.evaluate(async () => (await (await fetch('/api/outbox')).json()).items.map((m) => m.to + ' | ' + m.html));
  ok('« Relancer » : Claire reçoit un rappel au vouvoiement', ob2.some((m) => m.startsWith('claire@') && /Petit rappel de Louis : plan du site attend votre retour/.test(m)));
  await louis.click('.band [data-act=remind]'); await louis.waitForTimeout(300);
  ok('Pas deux relances le même jour', /déjà relancé/i.test(await louis.textContent('#toast')));
  await louis.click('#tab-demandes'); await louis.waitForTimeout(150);
  ok('Onglet « Demandes » dédié', (await louis.getAttribute('[role=tabpanel]', 'aria-labelledby')) === 'tab-demandes');
  await louis.click('#tab-pilotage'); await louis.waitForTimeout(150);
  await louis.fill('#a-nt', 'Valider le plan avant vendredi'); await louis.locator('#a-nx').focus(); await louis.waitForTimeout(500);
  ok('Prochaine étape enregistrée toute seule en quittant le champ', /Enregistré à/.test(await louis.locator('form[data-form=next] .save-st').innerText()));
  await louis.fill('#a-note', 'Brouillon de la semaine'); await louis.click('#tab-fichiers'); await louis.click('#tab-pilotage'); await louis.waitForTimeout(150);
  ok('Point de la semaine : brouillon conservé en changeant d’onglet', (await louis.inputValue('#a-note')) === 'Brouillon de la semaine');
  ok('Livrables repliés par temps (seul le temps en cours est ouvert)', (await louis.locator('details.ph-fold[open]').count()) === 1 && (await louis.locator('details.ph-fold').count()) === 4);
  await claire.click('.side [data-go=accueil]'); await claire.waitForTimeout(100);
  ok('Claire voit la nouvelle prochaine étape', /Valider le plan avant vendredi/.test(await main(claire)));

  // Ajouter : liste verticale ; mobile : pas d'onglet « Sortir », déconnexion dans Réglages
  await louis.click('.side [data-act=compose]'); await louis.waitForSelector('.compose-card');
  ok('« Ajouter » : types en liste verticale (aria-orientation)', (await louis.getAttribute('.ckinds', 'aria-orientation')) === 'vertical');
  await louis.keyboard.press('Escape');
  const mob = await login('louis@agence-orem.fr', { width: 390, height: 844 });
  ok('Mobile : 4 onglets, plus d’onglet « Sortir »', (await mob.locator('.tabbar a').count()) === 4 && !(await mob.$('.tabbar [data-go=deconnexion]')));
  await mob.click('.tabbar [data-go=reglages]'); await mob.waitForTimeout(150);
  ok('Réglages : « Se déconnecter » et « Déconnecter tous mes appareils »', (await mob.locator('#main [data-act=logout]').count()) === 1 && (await mob.locator('#main [data-act=logout-all]').count()) === 1);
  await mob.click('#main [data-act=logout-all]'); await mob.waitForTimeout(300);
  ok('Déconnexion de tous les appareils : l’autre session de Louis est fermée', (await louis.evaluate(async () => (await fetch('/api/me')).status)) === 401);
  const sw = await mob.evaluate(() => document.documentElement.scrollWidth);
  ok('Mobile : pas de débordement', sw <= 390, sw);

  console.log(R.join('\n')); console.log('ERRS', JSON.stringify(errs)); await br.close();
  } catch (e) { console.log(R.join('\n')); console.log('✘ Arrêt : ' + e.message.split('\n')[0]); process.exit(1); }
  process.exitCode = R.some((x) => x.startsWith('✘')) || errs.length ? 1 : 0;
})();
