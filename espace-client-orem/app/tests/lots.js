/* Écrans des lots 2 et 4 (serveur local sur le port 3123, données neuves) : node tests/lots.js [dossier des captures] */
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, extra) => R.push(`${v ? '✔' : '✘'} ${l}${!v && extra ? ' → ' + extra : ''}`);
const CLIENT_VIEWS = ['accueil', 'projet', 'valider', 'maquettes', 'messages', 'fichiers', 'documents', 'outils', 'equipe', 'preferences'];
(async () => {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const errs = [];
  async function login(email, keepOb) {
    const p = await (await br.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
    p.on('pageerror', (e) => errs.push(email + ' : ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.goto(B); await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
    await p.waitForSelector('.devcode b', { timeout: 8000 }); await p.fill('#o1', await p.textContent('.devcode b'));
    await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit()); await p.waitForSelector('#main'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
    if (!keepOb && await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
    return p;
  }
  const go = async (p, v) => { const t = v === 'documents' ? 'fichiers' : v; await p.evaluate((v) => { const a = document.querySelector(`.side [data-go="${v}"]`) || document.querySelector(`[data-go="${v}"]`); a && a.click(); }, t); await p.waitForTimeout(150); };
  const main = (p) => p.locator('#main').innerText();
  // Registre : parcourt toutes les vues et relève les phrases dans le mauvais registre.
  async function registre(p, tu) {
    const bad = [];
    const re = tu ? /\b(vous|votre|vos)\b/i : /\b(tu|ton|toi|tes)\b|\bta\b|\bt’/i;
    for (const v of CLIENT_VIEWS) {
      await go(p, v);
      const txt = (await main(p)).replace(/rendez-vous/gi, '').replace(/style et ton/gi, ''); // « le ton » d'une marque n'est pas un tutoiement
      for (const line of txt.split('\n')) if (re.test(line)) bad.push(v + ' : ' + line.trim().slice(0, 90));
    }
    return bad;
  }

  // 1. Hugo (tutoiement) et Claire (vouvoiement) : aucun texte dans le mauvais registre
  const hugo = await login('hugo@huchet-demorge.fr');
  const bh = await registre(hugo, true); ok('Hugo (tu) : aucun « vous » dans ses 10 écrans', !bh.length, bh.slice(0, 6).join(' / '));
  const claire = await login('claire@maisonlumen.fr');
  const bc = await registre(claire, false); ok('Claire (vous) : aucun « tu » dans ses 10 écrans', !bc.length, bc.slice(0, 6).join(' / '));

  // 2. O.R.E.M. et une seule source de vérité
  await go(claire, 'projet');
  const dots = await claire.locator('.cx-gantt .cx-ltr').allInnerTexts();
  ok('Page projet : les 4 temps O, R, E, M (lettres affichées)', dots.join('') === 'OREM' && /Orienter/.test(await main(claire)) && /Mesurer/.test(await main(claire)), dots.join(','));
  const planRow = await claire.locator('.cx-deliv li', { hasText: 'Plan du site' }).innerText();
  ok('« Plan du site » est « À valider » (et plus « Fait ») tant que Claire n’a pas validé', /Voir et valider/.test(planRow) && !/\bFait\b/.test(planRow), planRow.replace(/\n/g, ' '));
  await claire.screenshot({ path: OUT + '/lots-1-projet.png', fullPage: true });
  await go(claire, 'documents');
  ok('Facture : le PDF est sur la ligne de la facture, plus en double', (await claire.locator('.cx-inv', { hasText: 'F-2026-0187' }).count()) === 1 && (await claire.locator('.cx-inv', { hasText: 'F-2026-0187' }).locator('.cx-iconbtn').count()) === 1 && (await claire.locator('.cx-list li', { hasText: 'Facture F-2026-0187' }).count()) === 0);

  // 3. Julie : l'acompte se coche tout seul, pas de case WhatsApp dans l'accueil guidé
  const julie = await login('julie@cabinet-varenne.fr', true);
  for (let i = 0; i < 3; i++) { await julie.click('[data-act=ob-next]'); await julie.waitForTimeout(80); }
  const obTxt = await julie.locator('.ob').innerText();
  ok('Accueil guidé : plus de promesse WhatsApp', !/WhatsApp/i.test(obTxt));
  ok('Accueil guidé : le point de la semaine par e-mail, au vouvoiement', /point de la semaine par e-mail/.test(obTxt));
  await julie.click('[data-act=ob-done]'); await julie.waitForTimeout(200);
  ok('Acompte : pas de case à cocher pour le client', (await julie.locator('button[data-act=task]', { hasText: '' }).filter({ has: julie.locator('xpath=..', { hasText: 'acompte' }) }).count()) === 0 && /se coche tout seul/i.test(await main(julie)));

  // 4. Louis crée un espace « Conseil » au tutoiement
  const louis = await login('louis@agence-orem.fr');
  await go(louis, 'nouveau');
  ok('Création : les 4 offres sont proposées', (await louis.locator('[name=n-offer]').count()) === 4);
  await louis.fill('#n-client', 'Atelier Brun'); await louis.fill('#n-contact', 'Paul'); await louis.fill('#n-email', 'paul@atelier-brun.fr');
  await louis.locator('form[data-form=create]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(250);
  ok('Création refusée tant que le registre n’est pas choisi (jamais deviné)', (await louis.locator('h1').innerText()) === 'Nouvel espace client');
  await louis.check('[name=n-offer][value=conseil]'); await louis.check('[name=n-reg][value=tu]');
  await louis.screenshot({ path: OUT + '/lots-2-creation.png', fullPage: true });
  await louis.locator('form[data-form=create]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(500);
  ok('Espace Conseil créé, au temps « O · Orienter »', /Atelier Brun/.test(await louis.locator('h1').innerText()) && /Conseil · O · Orienter/.test(await main(louis)), await louis.locator('.head .lead').innerText().catch(() => ''));

  // 5. Louis met en ligne Maison Lumen
  await go(louis, 'clients'); await louis.click('.cat[data-mine="0"]'); await louis.click('[data-open=p_lumen]'); await louis.waitForTimeout(300); await louis.selectOption('#a-phase', '3'); await louis.waitForTimeout(500); await louis.click('[data-tab=livraison]'); await louis.waitForTimeout(200);
  ok('Onglet « Mise en ligne » avec l’alerte du procès-verbal non validé', /Réception du site/.test(await main(louis)));
  await louis.fill('#dl-s', 'https://www.maisonlumen.fr'); if (await louis.$('#dl-f')) await louis.fill('#dl-f', 'Réception validée par téléphone'); await louis.locator('form[data-form=deliver]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(500);
  ok('Mise en ligne faite côté agence', /Site en ligne depuis le/.test(await main(louis)));
  await louis.fill('#rs-p', 'Depuis la mise en ligne'); await louis.fill('#rs-s', '12 | demandes de devis\n3 400 | visiteurs'); await louis.locator('form[data-form=results]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(300);
  await louis.check('[data-handover="0"]'); await louis.waitForTimeout(700);
  await louis.fill('#tu-l', 'Modifier un texte | 3 min | https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3\nAjouter un atelier | 4 min |'); await louis.locator('form[data-form=tutorials]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(300);
  await louis.screenshot({ path: OUT + '/lots-3-mise-en-ligne.png', fullPage: true });
  await claire.reload(); await claire.waitForSelector('#main'); await claire.waitForTimeout(300);
  ok('Claire voit « Votre site est en ligne » et ses résultats', /Votre site est en ligne/.test(await main(claire)) && /12\s*demandes de devis/.test(await main(claire)));
  const ob = await louis.evaluate(async () => (await (await fetch('/api/outbox')).json()).items.map((m) => m.to + ' | ' + m.subject));
  await new Promise((r) => setTimeout(r, 500));
  const ob2 = await louis.evaluate(async () => (await (await fetch('/api/outbox')).json()).items.map((m) => m.to + ' | ' + m.html));
  ok('Claire reçoit un e-mail « votre site est en ligne »', ob2.some((m) => m.startsWith('claire@') && /votre site est en ligne/.test(m)), ob.join(' / '));
  await go(claire, 'projet');
  ok('Claire voit la checklist de remise (1 sur 5)', /Remise du projet/.test(await main(claire)) && /1 sur 5/.test(await main(claire)));
  await go(claire, 'outils'); await claire.click('[data-tool=webflow]'); await claire.waitForTimeout(150);
  ok('Tutoriels lus dans le projet (dont une vidéo « en préparation »)', /Ajouter un atelier/.test(await main(claire)) && /en préparation/.test(await main(claire)));

  // 6. Hugo laisse un avis (projet livré depuis plus de 7 jours)
  await go(hugo, 'accueil');
  ok('Hugo : demande d’avis sur l’accueil, au tutoiement', /Ton avis sur le projet/.test(await main(hugo)));
  await hugo.click('.stars label >> nth=4'); await hugo.waitForTimeout(150); await hugo.fill('#rv-t', 'Un site qui nous ressemble enfin.'); await hugo.check('#rv-p');
  await hugo.locator('form[data-form=review]').evaluate((f) => f.requestSubmit()); await hugo.waitForTimeout(400);
  ok('Avis de Hugo enregistré (5 sur 5)', /Merci pour ton avis/.test(await main(hugo)));
  await hugo.screenshot({ path: OUT + '/lots-4-avis.png', fullPage: true });
  await go(louis, 'inbox'); await louis.waitForTimeout(200);
  ok('Louis voit l’avis de Hugo dans sa boîte de réception', /Hugo a laissé un avis : 5\/5/.test(await main(louis)));

  // 7. Réglages de l'agence : lien d'avis Google
  await go(louis, 'reglages'); await louis.fill('#st-r', 'https://g.page/r/orem-exemple/review'); await louis.locator('form[data-form=settings]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(300);
  await hugo.reload(); await hugo.waitForSelector('#main'); await hugo.waitForTimeout(300);
  ok('Avis 5/5 : Hugo se voit proposer de le publier sur Google', /Publier l’avis sur Google/.test(await main(hugo)));
  await go(louis, 'reglages'); await louis.fill('#st-b', 'http://pas-https.fr'); await louis.locator('form[data-form=settings]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(300);
  ok('Lien non https refusé dans les réglages', /https/.test(await louis.textContent('#toast')));

  // 8. Export ZIP (Claire a déposé un fichier réel)
  await go(claire, 'fichiers'); await claire.setInputFiles('#file-in', { name: 'Brief.txt', mimeType: 'text/plain', buffer: Buffer.from('Bonjour Orem') }); await claire.waitForTimeout(500);
  const zip = await claire.evaluate(async () => { const r = await fetch('/api/projects/p_lumen/export'); return { status: r.status, b64: btoa(String.fromCharCode(...new Uint8Array(await r.arrayBuffer()))) }; });
  require('fs').writeFileSync(OUT + '/export.zip', Buffer.from(zip.b64, 'base64'));
  let list = ''; try { list = require('child_process').execFileSync('unzip', ['-l', OUT + '/export.zip']).toString(); require('child_process').execFileSync('unzip', ['-tq', OUT + '/export.zip']); } catch (e) { list = 'ERREUR ' + e.message; }
  ok('Export ZIP valide : récapitulatif et fichier déposé', zip.status === 200 && /Récapitulatif du projet\.txt/.test(list) && /Fichiers déposés\/Brief\.txt/.test(list), list.slice(0, 200));
  const other = await claire.evaluate(async () => (await fetch('/api/projects/p_huchet/export')).status);
  ok('Claire ne peut pas exporter l’espace d’un autre client', other === 404);

  console.log(R.join('\n')); console.log('ERRS', JSON.stringify(errs)); await br.close();
  process.exitCode = R.some((l) => l.startsWith('✘')) || errs.length ? 1 : 0;
})();
