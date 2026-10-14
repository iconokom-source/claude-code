/* Simulation de 5 clients sur le serveur local : clics par tâche, accès aux bons documents, accessibilité (axe-core). */
const { chromium } = require('playwright');
const fs = require('fs');
const B = 'http://127.0.0.1:3123';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const out = { personas: [], axe: {}, security: [] };

async function login(br, email, vp, opts = {}) {
  const ctx = await br.newContext({ bypassCSP: true, viewport: vp, reducedMotion: 'reduce', colorScheme: opts.dark ? 'dark' : 'light', isMobile: vp.width < 500, hasTouch: vp.width < 500 });
  const p = await ctx.newPage();
  p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
  await p.goto(B + '/'); await p.fill('#em', email); await p.click('form[data-form=login] button[type=submit]');
  await p.waitForSelector('.devcode b', { timeout: 8000 }).catch(async () => { throw new Error('Pas de code de connexion pour ' + email + ' : ' + (await p.textContent('#toast').catch(() => '')) + ' (limite de connexions ? redémarrer le serveur)'); }); const code = await p.textContent('.devcode b');
  await p.fill('#o1', code); await p.click('form[data-form=verify] button[type=submit]');
  await p.waitForSelector('#main'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
  return p;
}
function persona(name, desc) { const P = { name, desc, tasks: [], notes: [] }; out.personas.push(P); return P; }
async function task(P, p, label, steps, check) {
  let clicks = 0, ok = false, err = '';
  const click = async (sel) => { clicks++; await p.locator(sel).first().click(); await p.waitForTimeout(120); };
  const fill = async (sel, v) => { await p.locator(sel).first().fill(v); };
  try { await steps({ click, fill }); ok = await check(); } catch (e) { err = e.message.split('\n')[0]; }
  P.tasks.push({ label, clicks, ok, err });
}
async function axe(p, view) {
  await p.addScriptTag({ content: AXE });
  const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0] && v.nodes[0].target.join(' ') })));
  for (const v of r) { const k = v.id; out.axe[k] = out.axe[k] || { impact: v.impact, help: v.help, views: [], sample: v.sample }; out.axe[k].views.push(view + ' (' + v.n + ')'); }
}
const goHome = async (p) => { const el = p.locator('.side [data-go=accueil], .tabbar [data-go=accueil]').filter({ visible: true }).first(); await el.click(); await p.waitForTimeout(120); };
const visible = (p, sel) => p.locator(sel).first().isVisible();
const text = async (p, t) => (await p.locator('#main').innerText()).includes(t);

(async () => {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });

  /* 1. Julie, Cabinet Varenne : tout début, première connexion, sur mobile, peu à l'aise. */
  {
    const P = persona('Julie', 'Cabinet Varenne · démarrage · première connexion · mobile');
    const p = await login(br, 'julie@cabinet-varenne.fr', { width: 390, height: 844 });
    P.notes.push('Accueil guidé affiché à la 1re connexion : ' + (await visible(p, '.ob')));
    await task(P, p, 'Terminer l’accueil guidé', async ({ click }) => { for (let i = 0; i < 3; i++) await click('[data-act=ob-next]'); await click('[data-act=ob-done]'); }, async () => !(await p.$('.ob')));
    await axe(p, 'Accueil mobile (démarrage)');
    await task(P, p, 'Savoir quoi faire en premier', async () => {}, async () => (await p.locator('.next h2').innerText()).length > 0);
    P.notes.push('Prochaine étape affichée : « ' + (await p.locator('.next h2').innerText()) + ' »');
    await task(P, p, 'Trouver la facture d’acompte à régler', async ({ click }) => { await click('#main [data-go=documents]'); }, () => text(p, 'F-2026-0199'));
    await task(P, p, 'Copier l’IBAN', async ({ click }) => { await click('[data-act=copy]'); }, () => visible(p, '#iban'));
    await goHome(p);
    await task(P, p, 'Déposer son logo', async ({ click }) => { await click('.tabbar [data-go=fichiers]'); await p.setInputFiles('#file-in', { name: 'logo-varenne.png', mimeType: 'image/png', buffer: Buffer.alloc(5000, 1) }); await p.waitForTimeout(400); }, () => text(p, 'logo-varenne.png'));
    await goHome(p);
    await task(P, p, 'Réserver la visio de cadrage', async () => {}, () => visible(p, '.next a[target=_blank]'));
    await task(P, p, 'Voir la vidéo de bienvenue de Louis', async ({ click }) => { await goHome(p); await click('.newmsg'); }, () => visible(p, '.video-card, .video'));
    await task(P, p, 'Voir les maquettes (pas encore prêtes)', async ({ click }) => { await click('.tabbar [data-go=plus]'); await click('#main [data-go=maquettes]'); }, () => text(p, 'arrivent'));
    P.sw = await p.evaluate(() => document.documentElement.scrollWidth);
    await axe(p, 'Maquettes vides (mobile)');
    P.errs = p.errs;
  }

  /* 2. Claire, Maison Lumen : en pleine phase de design, desktop. */
  {
    const P = persona('Claire', 'Maison Lumen · étape 2 · desktop');
    const p = await login(br, 'claire@maisonlumen.fr', { width: 1440, height: 900 });
    if (await p.$('.ob')) await p.click('[data-act=ob-skip]');
    await axe(p, 'Accueil desktop (en cours)');
    await task(P, p, 'Regarder la vidéo de Clément', async ({ click }) => { await click('.newmsg'); }, () => visible(p, '.video-card, .video'));
    await axe(p, 'Messages');
    await goHome(p);
    await task(P, p, 'Valider le plan du site', async ({ click }) => { await click('.next .btn'); await click('[data-act=approve]'); await click('[data-act=approve-ok]'); }, () => text(p, 'Validé'));
    await axe(p, 'À valider');
    await goHome(p);
    await task(P, p, 'Voir les maquettes', async ({ click }) => { await click('.side [data-go=maquettes]'); }, () => visible(p, 'iframe, .shot, a[href*="figma"]'));
    await goHome(p);
    await task(P, p, 'Connaître le prochain rendez-vous', async () => {}, () => visible(p, '.meet'));
    await task(P, p, 'Savoir combien il reste à payer', async ({ click }) => { await click('[data-act=qa][data-id=payer]'); }, () => text(p, 'Déjà réglé'));
    await task(P, p, 'Retrouver le compte rendu de la visio', async ({ click }) => { await click('.side [data-go=fichiers]'); }, () => text(p, 'Compte rendu'));
    await task(P, p, 'Écrire à l’équipe', async ({ click, fill }) => { await click('.side [data-go=messages]'); await fill('#msg-t', 'Merci Clément, c’est très clair !'); await click('form[data-form=msg] button'); }, () => text(p, 'très clair'));
    await axe(p, 'Fichiers');
    P.errs = p.errs;
  }

  /* 3. Hugo, Huchet-Demorge : projet livré, pressé, mobile. */
  {
    const P = persona('Hugo', 'Huchet-Demorge · site livré · mobile · pressé');
    const p = await login(br, 'hugo@huchet-demorge.fr', { width: 390, height: 844 });
    P.notes.push('Accueil guidé (déjà vu) : ' + (await visible(p, '.ob')));
    await axe(p, 'Accueil projet livré (mobile)');
    await task(P, p, 'Voir les résultats du site', async () => {}, () => visible(p, '.kpi'));
    await task(P, p, 'Préparer une fiche teaser pour un hôtel', async ({ click, fill }) => { await click('#main [data-tool=teaser]'); await fill('#tz-name', 'Hôtel 4 étoiles, Marais'); }, () => text(p, 'Marais'));
    await axe(p, 'Fiche teaser');
    await task(P, p, 'Demander une évolution (formulaires)', async ({ click, fill }) => { await click('[data-tool=""]'); await click('[data-tool=request]'); await fill('#rq-t', 'Ajouter le lien de l’annonce dans l’e-mail de contact.'); await click('form[data-form=request] button'); }, () => text(p, 'lien de l’annonce'));
    await goHome(p);
    await task(P, p, 'Retrouver le guide Webflow', async ({ click }) => { await click('.tabbar [data-go=fichiers]'); }, () => text(p, 'Guide de réutilisation'));
    await goHome(p);
    await task(P, p, 'Ouvrir le fichier Figma', async ({ click }) => { await click('#main [data-go=maquettes]'); }, () => visible(p, 'a[href*="figma.com/design"]'));
    await goHome(p);
    await task(P, p, 'Récupérer les visuels du cas client', async ({ click }) => { await click('#main [data-go=biblio]'); }, () => visible(p, '.tile'));
    await axe(p, 'Bibliothèque (mobile)');
    P.sw = await p.evaluate(() => document.documentElement.scrollWidth);
    P.errs = p.errs;
  }

  /* 4. Nina, assistante chez Huchet-Demorge : ajoutée par l'agence, 1re connexion. */
  {
    const P = persona('Nina', 'Huchet-Demorge · invitée par l’agence · 1re connexion · desktop');
    const a = await login(br, 'louis@agence-orem.fr', { width: 1440, height: 900 });
    let clicksAdmin = 0;
    await a.click('.side [data-go=clients]'); clicksAdmin++; await a.waitForTimeout(150); await a.click('[data-open=p_huchet]'); clicksAdmin++; await a.waitForTimeout(200);
    await a.click('[data-tab=acces]'); clicksAdmin++;
    await a.fill('#u-n', 'Nina'); await a.fill('#u-e', 'nina@huchet-demorge.fr'); await a.click('form[data-form=user] button'); clicksAdmin++; await a.waitForTimeout(300);
    P.notes.push(`Louis donne l’accès en ${clicksAdmin} clics (onglet Accès et infos)`);
    await axe(a, 'Agence : fiche client');
    const p = await login(br, 'nina@huchet-demorge.fr', { width: 1440, height: 900 });
    P.notes.push('Accueil guidé proposé à Nina : ' + (await visible(p, '.ob')));
    if (await p.$('.ob')) { P.notes.push('Écran 3 de l’accueil (projet livré) : « ' + (await (async () => { for (let i = 0; i < 2; i++) await p.click('[data-act=ob-next]'); return p.locator('.ob-body h3').innerText(); })()) + ' »'); await p.click('[data-act=ob-skip]').catch(() => p.keyboard.press('Escape')); }
    await task(P, p, 'Trouver les couleurs de la marque', async ({ click }) => { await click('.side [data-go=maquettes]'); }, () => visible(p, '.sw'));
    await task(P, p, 'Préparer une fiche boulangerie', async ({ click }) => { await click('.side [data-go=outils]'); await click('[data-tool=teaser]'); await p.selectOption('#tz-type', 'Boulangerie'); }, async () => (await p.locator('#teaser-p').innerText()).toLowerCase().includes('boulangerie à vendre'));
    await task(P, p, 'Retrouver la dernière facture', async ({ click }) => { await click('.side [data-go=fichiers]'); await click('[data-ftab=docs]'); }, () => text(p, 'F-2026-0112'));
    P.errs = p.errs;
  }

  /* 5. Claire au clavier, en mode sombre et zoom 200 % (malvoyante). */
  {
    const P = persona('Claire (clavier)', 'Maison Lumen · clavier seul · mode sombre · zoom 200 %');
    const p = await login(br, 'claire@maisonlumen.fr', { width: 720, height: 900 }, { dark: true });
    await p.evaluate(() => (document.body.style.zoom = '2'));
    if (await p.$('.ob')) await p.keyboard.press('Escape');
    let tabs = 0, found = false, focusVisible = false;
    await p.keyboard.press('Tab'); const isSkip = await p.evaluate(() => document.activeElement.classList.contains('skip')); P.notes.push('1re tabulation = lien « Aller au contenu » : ' + isSkip); if (isSkip) await p.keyboard.press('Enter'); tabs = 2;
    for (let k = 0; k < 40; k++, tabs++) {
      if (k === 0) { const pre = await p.evaluate(() => { const a = document.activeElement; return { t: (a.innerText || '').trim(), go: a.dataset && a.dataset.go }; }); if (pre.go === 'messages' || /Lire|Regarder/.test(pre.t)) { found = true; focusVisible = true; break; } }
      await p.keyboard.press('Tab');
      const info = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { t: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 40), o: cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px', go: a.dataset && a.dataset.go }; });
      if (info.go === 'messages' || /Lire|Regarder/.test(info.t)) { found = true; focusVisible = info.o; tabs++; break; }
    }
    P.tasks.push({ label: 'Atteindre le message non lu au clavier', clicks: 0, keys: tabs, ok: found, err: found ? '' : 'introuvable en 40 tabulations' });
    P.notes.push('Contour de focus visible : ' + focusVisible);
    await p.evaluate(() => (document.body.style.zoom = '1'));
    await axe(p, 'Accueil mode sombre');
    P.sw = await p.evaluate(() => document.documentElement.scrollWidth);
    P.errs = p.errs;
  }

  /* Sécurité : un client ne voit que son projet. */
  {
    const p = await login(br, 'julie@cabinet-varenne.fr', { width: 800, height: 600 });
    for (const id of ['p_huchet', 'p_lumen']) { const r = await p.evaluate(async (id) => (await fetch('/api/projects/' + id)).status, id); out.security.push(`Julie → projet ${id} : HTTP ${r}`); }
    const f = await p.evaluate(async () => (await fetch('/api/projects/p_varenne/action', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Orem': '1' }, body: JSON.stringify({ type: 'links.set', site: 'x' }) })).status);
    out.security.push(`Julie → action réservée à l’agence : HTTP ${f}`);
  }
  await br.close();
  fs.writeFileSync(require('path').join(require('os').tmpdir(), 'orem-simulation.json'), JSON.stringify(out, null, 1));
  for (const P of out.personas) { console.log(`\n## ${P.name} — ${P.desc}`); P.tasks.forEach((t) => console.log(` ${t.ok ? '✔' : '✘'} ${t.label} : ${t.keys !== undefined ? t.keys + ' tabulations' : t.clicks + ' clic(s)'} ${t.err}`)); P.notes.forEach((n) => console.log('   · ' + n)); if (P.sw) console.log('   · largeur page ' + P.sw); if (P.errs && P.errs.length) console.log('   ! erreurs JS', P.errs); }
  console.log('\n## Accessibilité (axe-core)'); for (const [k, v] of Object.entries(out.axe)) console.log(` - [${v.impact}] ${k} : ${v.help} → ${v.views.join(', ')} · ex. ${v.sample}`);
  console.log('\n## Sécurité'); out.security.forEach((s) => console.log(' - ' + s));
})();
