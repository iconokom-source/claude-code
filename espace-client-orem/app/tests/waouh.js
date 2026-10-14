/* Lot 7 : moments waouh (serveur local sur le port 3123, données neuves) : node tests/waouh.js [dossier] */
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
const errs = [];
(async () => { try {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  async function login(email, keepOb, vp = { width: 1440, height: 900 }) {
    const p = await (await br.newContext({ viewport: vp })).newPage();
    p.on('pageerror', (e) => errs.push(email + ' : ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.goto(B); await p.fill('#em', email); await p.click('form[data-form=login] button[type=submit]');
    await p.waitForSelector('.devcode b', { timeout: 8000 }); await p.fill('#o1', await p.textContent('.devcode b'));
    await p.click('form[data-form=verify] button[type=submit]'); await p.waitForSelector('#main'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
    if (!keepOb && await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(120); }
    return p;
  }
  const main = (p) => p.locator('#main').innerText();
  const go = async (p, v) => { await p.click(`.side [data-go="${v}"]`); await p.waitForTimeout(200); };

  // 1. Inès accepte sa proposition en ligne
  const ines = await login('ines@domaine-des-vergers.fr');
  ok('Inès : la prochaine étape est sa proposition', /Découvrir votre proposition/.test(await main(ines)));
  await go(ines, 'proposition');
  ok('Proposition : détail, total HT 5 800 €, TTC 6 960 €, acompte 50 %', /5\s800\s€/.test(await main(ines)) && /6\s960\s€/.test(await main(ines)) && /Acompte de 50 %/.test(await main(ines)));
  await ines.screenshot({ path: OUT + '/waouh-1-proposition.png', fullPage: true });
  await ines.click('form[data-form=accept] button[type=submit]'); await ines.waitForTimeout(150);
  ok('Sans la case cochée : erreur sous la case', !!(await ines.$('[id^=ac-ok-][aria-invalid=true]')));
  await ines.check('[id^=ac-ok-]'); await ines.fill('[id^=ac-n-]', 'Inès Delmas'); await ines.click('form[data-form=accept] button[type=submit]'); await ines.waitForTimeout(500);
  ok('Acceptée, horodatée, signée « Inès Delmas »', /Acceptée le/.test(await main(ines)) && /Inès Delmas/.test(await main(ines)));
  ok('Confettis dans le bandeau, pas par-dessus la page', (await ines.locator('body > .confetti').count()) === 0);
  await go(ines, 'documents');
  ok('Facture d’acompte créée (2 900 € HT, à régler) et devis signé', /Facture d’acompte \(50 %\)/.test(await main(ines)) && /2\s900\s€ HT/.test(await main(ines)) && /D-2026-0158/.test(await main(ines)));
  const theo = await login('theophile@agence-orem.fr');
  ok('Théophile voit l’acceptation dans « À traiter »', /Inès a accepté la proposition/.test(await main(theo)));

  // 2. Devis d'un clic depuis une demande d'évolution
  const claire = await login('claire@maisonlumen.fr');
  await go(claire, 'outils'); await claire.click('[data-tool=request]'); await claire.waitForTimeout(150);
  await claire.fill('#rq-t', 'Ajouter une page Presse avec nos parutions.'); await claire.click('form[data-form=request] button'); await claire.waitForTimeout(300);
  const louis = await login('louis@agence-orem.fr');
  await go(louis, 'clients'); await louis.click('.cat[data-mine="0"]'); await louis.click('[data-open=p_lumen]'); await louis.click('#tab-demandes'); await louis.waitForTimeout(150);
  await louis.locator('.row', { hasText: 'page Presse' }).locator('[data-act=prop-from]').click(); await louis.waitForTimeout(200);
  ok('« Proposer un devis » : le formulaire est prérempli depuis la demande', /page Presse/.test(await louis.inputValue('#pp-l')) && /Évolution : contenu/.test(await louis.inputValue('#pp-t')));
  await louis.fill('#pp-l', 'Page Presse (maquette et intégration) | 600'); await louis.click('form[data-form=proposal] button[value=send]'); await louis.waitForTimeout(500);
  await claire.reload(); await claire.waitForSelector('#main'); await claire.waitForTimeout(200);
  ok('Claire voit « Proposition » dans sa navigation avec un badge', /1/.test(await claire.locator('.side [data-go=proposition]').innerText()));
  await go(claire, 'proposition');
  ok('Devis d’évolution : 600 € HT, facturé à la livraison, au vouvoiement', /Devis d’évolution/i.test(await main(claire)) && /600\s€/.test(await main(claire)) && /En attente de votre réponse/.test(await main(claire)));

  // 3. Hugo : versions et commentaires épinglés
  const hugo = await login('hugo@huchet-demorge.fr');
  await go(hugo, 'maquettes');
  ok('Versions V2 puis V1', /V2[\s\S]*Maquettes finales[\s\S]*V1/.test(await main(hugo)));
  await hugo.click('.shot >> nth=0'); await hugo.waitForSelector('.lb .pin-area');
  const box = await hugo.locator('.pin-area img').boundingBox();
  await hugo.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4); await hugo.waitForSelector('#pin-t');
  await hugo.fill('#pin-t', 'Le titre est un peu petit ici.'); await hugo.click('form[data-form=pin] button[type=submit]'); await hugo.waitForTimeout(400);
  ok('Commentaire épinglé à l’endroit cliqué (pastille 1)', (await hugo.locator('.lb .pin').count()) === 1 && /Le titre est un peu petit/.test(await hugo.locator('.lb').innerText()));
  await hugo.screenshot({ path: OUT + '/waouh-2-pin.png' });
  await hugo.keyboard.press('Escape'); await hugo.waitForTimeout(150);
  ok('Liste des commentaires sur la page Maquettes', /Commentaires sur les écrans/.test(await main(hugo)) && /En cours/.test(await main(hugo)));
  await go(louis, 'clients'); await louis.click('.cat[data-mine="0"]'); await louis.click('[data-open=p_huchet]'); await louis.click('#tab-liens'); await louis.waitForTimeout(150);
  await louis.click('[data-act=pin-resolve]'); await louis.waitForTimeout(300);
  ok('Louis marque le commentaire comme traité', /Traité/.test(await louis.locator('#tabpanel').innerText()));

  // 4. Compte à rebours, mise en ligne, kit de lancement
  await go(louis, 'clients'); await louis.click('.cat[data-mine="0"]'); await louis.click('[data-open=p_lumen]'); await louis.waitForTimeout(150);
  await louis.selectOption('#a-phase', '3'); await louis.waitForTimeout(500);
  await louis.click('#tab-acces'); await louis.fill('#p-g', new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10)); await louis.click('form[data-form=infos] button'); await louis.waitForTimeout(300);
  await go(claire, 'accueil');
  ok('Compte à rebours : « 10 jours » avant la mise en ligne', /10\s*jours/i.test(await claire.locator('.countdown').innerText().catch(() => '')));
  await claire.screenshot({ path: OUT + '/waouh-3-compte-a-rebours.png' });
  await louis.click('#tab-liens'); await louis.fill('#lk-o', 'https://ancien.maisonlumen.fr'); await louis.click('form[data-form=links] button[type=submit]'); await louis.waitForTimeout(300);
  await louis.click('#tab-livraison'); await louis.fill('#dl-s', 'https://www.maisonlumen.fr'); await louis.click('form[data-form=deliver] button[type=submit]'); await louis.waitForTimeout(500);
  await go(claire, 'accueil');
  ok('Kit de lancement : avant/après et post LinkedIn', /Kit de lancement/.test(await main(claire)) && /Avant/i.test(await main(claire)) && /maisonlumen\.fr/.test(await claire.inputValue('#lk-post')));
  ok('Post LinkedIn sans tiret long', !/[—–]/.test(await claire.inputValue('#lk-post')));
  await claire.screenshot({ path: OUT + '/waouh-4-lancement.png', fullPage: true });

  // 5. Accueil guidé de Julie : vidéo de bienvenue, noms sous les photos ; réponses rapides sans assistant
  const julie = await login('julie@cabinet-varenne.fr', true);
  ok('Accueil guidé : vidéo de bienvenue de Théophile', (await julie.locator('.ob .ob-video iframe[title="Bienvenue dans votre espace"], .ob .ob-video .video-card').count()) === 1);
  ok('Accueil guidé : prénoms sous les photos', (await julie.locator('.ob .face figcaption').count()) >= 2);
  await julie.keyboard.press('Escape'); await julie.waitForTimeout(150);
  ok('Sans clé d’API : « Réponses rapides », pas de champ libre', /Réponses rapides/.test(await main(julie)) && !(await julie.$('#ask-q')));

  await br.close();
} catch (e) { R.push('✘ Arrêt : ' + e.message.split('\n')[0]); }
  console.log(R.join('\n')); console.log('ERRS', JSON.stringify(errs));
  process.exitCode = R.some((x) => x.startsWith('✘')) || errs.length ? 1 : 0;
})();
