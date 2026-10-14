const { chromium } = require('playwright');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = [];
const ok = (label, v) => R.push(`${v ? '✔' : '✘'} ${label}`);
(async () => {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const errs = [];
  async function login(email, vp = { width: 1440, height: 900 }) {
    const p = await (await br.newContext({ viewport: vp, reducedMotion: 'reduce' })).newPage(); p.on('pageerror', (e) => errs.push(email + ': ' + e.message));
    await p.goto(B); await p.fill('#em', email); await p.click('form[data-form=login] button[type=submit]'); await p.waitForSelector('.devcode b', { timeout: 8000 }).catch(async () => { throw new Error('Pas de code de connexion pour ' + email + ' : ' + (await p.textContent('#toast').catch(() => '')) + ' (limite de connexions ? redémarrer le serveur)'); });
    await p.fill('#o1', await p.textContent('.devcode b')); await p.click('form[data-form=verify] button[type=submit]'); await p.waitForSelector('#main'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
    if (await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(100); }
    return p;
  }
  const outbox = async (p) => p.evaluate(async () => (await (await fetch('/api/outbox')).json()).items.map((m) => m.to + ' | ' + m.subject));

  // 1. Claire dépose un fichier
  const claire = await login('claire@maisonlumen.fr');
  await claire.click('.side [data-go=fichiers]'); await claire.setInputFiles('#file-in', { name: 'Photos équipe.zip', mimeType: 'application/zip', buffer: Buffer.alloc(3000, 1) }); await claire.waitForTimeout(500);
  // 2. Clément reçoit, ouvre en 1 clic
  const clem = await login('clement@agence-orem.fr');
  await clem.screenshot({ path: OUT + '/1-inbox-clement.png' });
  const first = await clem.locator('.inbox-row.unread .title').first().innerText();
  ok('Clément voit le dépôt de Claire en tête de sa boîte de réception : « ' + first + ' »', /Photos équipe/.test(first));
  const ob1 = await outbox(clem);
  ok('E-mail instantané à Clément pour ce dépôt', ob1.some((m) => m.startsWith('clement@') && /Photos/.test(m)));
  ok('Théophile (pas dans l’équipe Lumen) n’est pas prévenu', !ob1.some((m) => m.startsWith('theophile@') && /Photos/.test(m)));
  await clem.click('.inbox-row.unread'); await clem.waitForTimeout(300);
  ok('1 clic sur la notification ouvre la fiche Maison Lumen, onglet Fichiers', (await clem.locator('.tabs [aria-selected=true]').innerText()).includes('Fichiers') && (await clem.locator('h1').innerText()).includes('Maison Lumen'));
  // 3. Clément envoie une vidéo Loom via « Ajouter »
  await clem.click('.side [data-act=compose]'); await clem.waitForSelector('.compose-card');
  await clem.selectOption('#c-p', 'p_lumen'); await clem.waitForTimeout(200);
  await clem.fill('#c-t', 'Claire, voici la direction artistique en vidéo.'); await clem.fill('#c-u', 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3'); await clem.fill('#c-l', 'Direction artistique');
  await clem.screenshot({ path: OUT + '/2-composer.png' });
  await clem.click('.compose-card button[type=submit]'); await clem.waitForTimeout(400);
  // 4. Clément ajoute un visuel à la bibliothèque
  await clem.click('.side [data-act=compose]'); await clem.selectOption('#c-p', 'p_lumen'); await clem.waitForTimeout(200); await clem.click('[data-ckind=asset]');
  await clem.fill('#c-at', 'Planche de tendances'); await clem.setInputFiles('#c-ai', { name: 'planche.png', mimeType: 'image/png', buffer: require('fs').readFileSync('/home/user/claude-code/espace-client-orem/app/public/assets/logo-black.png') });
  await clem.click('.compose-card button[type=submit]'); await clem.waitForTimeout(500);
  // 5. Claire voit la vidéo + le visuel
  await claire.reload(); await claire.waitForSelector('#main'); await claire.waitForTimeout(300);
  ok('Claire voit le bandeau « Clément vous a envoyé une vidéo »', /Clément vous a envoyé une vidéo/.test(await claire.locator('.newmsg').innerText().catch(() => '')));
  await claire.click('.side [data-go=biblio]'); await claire.waitForTimeout(300);
  const imgOk = await claire.evaluate(() => { const i = [...document.querySelectorAll('.tile img')].find((x) => x.closest('.tile').innerText.includes('Planche')); return i ? i.naturalWidth > 0 : false; });
  ok('Le visuel ajouté par Clément s’affiche dans la bibliothèque de Claire', imgOk);
  const ob2 = await outbox(clem);
  ok('Claire reçoit un e-mail pour la vidéo', ob2.some((m) => m.startsWith('claire@')));
  // 6. Louis voit ce que fait Clément ; ajoute Clément à Varenne
  const louis = await login('louis@agence-orem.fr');
  ok('E-mail instantané à Louis pour le dépôt de Claire', (await outbox(louis)).some((m) => m.startsWith('louis@') && /Photos/.test(m)));
  ok('Louis voit « Clément a envoyé une vidéo » dans sa boîte', /Clément a envoyé une vidéo/.test(await louis.locator('#main').innerText()));
  await louis.click('.side [data-go=clients]'); await louis.click('.cat[data-mine="0"]'); await louis.click('[data-open=p_varenne]'); await louis.click('[data-tab=acces]');
  await louis.check('[name=tm][value=u_clement]'); await louis.click('form[data-form=team] button'); await louis.waitForTimeout(300);
  await louis.screenshot({ path: OUT + '/3-equipe.png', fullPage: true });
  // 7. Julie écrit ; Théophile (récap) le voit et s'envoie le récap
  const julie = await login('julie@cabinet-varenne.fr');
  await julie.click('.side [data-go=messages]'); await julie.fill('#msg-t', 'Bonjour, je vous envoie le logo demain.'); await julie.click('form[data-form=msg] button'); await julie.waitForTimeout(300);
  const theo = await login('theophile@agence-orem.fr');
  ok('Théophile (chef de projet Varenne) voit le message de Julie', /Julie/.test(await theo.locator('#main').innerText()));
  const ob3 = await outbox(theo);
  ok('Théophile, en mode récap, ne reçoit pas d’e-mail immédiat', !ob3.some((m) => m.startsWith('theophile@') && !/récap/i.test(m)));
  await theo.click('.side [data-go=reglages]'); await theo.waitForTimeout(200); await theo.click('[data-act=digest]'); await theo.waitForTimeout(400);
  const ob4 = await outbox(theo);
  ok('Le récap du jour de Théophile part (bouton « M’envoyer le récap »)', ob4.some((m) => m.startsWith('theophile@') && /récap/i.test(m)));
  await theo.click('[data-mail="0"]'); await theo.waitForTimeout(200); await theo.screenshot({ path: OUT + '/4-email.png' });
  await theo.click('[data-act=mail-close]');
  await theo.check('[name=pf-email][value=instant]'); await theo.click('form[data-form=prefs] button[type=submit]'); await theo.waitForTimeout(300);
  ok('Théophile passe en « à chaque nouveauté »', await theo.evaluate(async () => (await (await fetch('/api/me')).json()).user.notify.email === 'instant'));
  ok('Clément (ajouté à Varenne) reçoit le message de Julie', await clem.evaluate(async () => (await (await fetch('/api/inbox')).json()).items.some((n) => /Julie/.test(n.text))));
  console.log('compose open?', !!(await clem.$('.compose-card')), await clem.textContent('#toast')); if (await clem.$('.compose-card')) await clem.keyboard.press('Escape');
  await clem.click('.side [data-go=inbox]'); await clem.waitForTimeout(200); await clem.screenshot({ path: OUT + '/5-inbox.png' });
  const mob = await login('louis@agence-orem.fr', { width: 390, height: 844 }); await mob.screenshot({ path: OUT + '/6-mobile.png' });
  console.log(R.join('\n')); console.log('ERRS', JSON.stringify(errs)); await br.close();
})();
