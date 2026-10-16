/* Tâches de l'équipe : tâches internes et livrables de tous les clients, par personne, échéance et état.
   Louis ajoute une tâche pour Théophile, qui la reçoit dans sa boîte de réception ; un livrable passé « En cours »
   ici change le planning du client ; un client n'y a jamais accès. node tests/taches.js [dossier] */
const { chromium } = require('playwright'); const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, x) => R.push(`${v ? '✔' : '✘'} ${l}${!v && x ? ' → ' + x : ''}`);
async function login(br, email, w = 1440) {
  const p = await (await br.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 })).newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
  await p.goto(B); await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('#main'); await p.waitForTimeout(400); if (await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
  return p;
}
const api = (p, path, body) => p.evaluate(async ([path, body]) => { const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Orem': '1' }, body: JSON.stringify(body) } : { headers: { 'X-Orem': '1' } }); return { status: r.status, body: await r.json() }; }, [path, body]);
(async () => {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const louis = await login(br, 'louis@agence-orem.fr');
  ok('Menu agence : « Tâches de l’équipe » avec le nombre de tâches du jour ou en retard', /Tâches de l’équipe/.test(await louis.locator('.side').innerText()) && !!(await louis.$('.side [data-go=taches] .badge')));
  await louis.click('.side [data-go=taches]'); await louis.waitForSelector('.tk-bar');
  await louis.screenshot({ path: OUT + '/taches-liste.png', fullPage: true });
  ok('Par défaut : mes tâches, regroupées par échéance (en retard en premier)', (await louis.locator('[data-tkwho=me]').getAttribute('aria-pressed')) === 'true' && /En retard/.test(await louis.locator('.tk-group').first().innerText()));
  ok('Tâche interne d’exemple visible : « Relancer les prospects du salon », urgente', /Relancer les prospects du salon[\s\S]*Urgent/.test(await louis.locator('.tk-group.late').innerText()));
  ok('Les livrables des projets apparaissent aussi (étiquette « Livrable »)', (await louis.locator('.tk-row .chip.idle', { hasText: 'Livrable' }).count()) > 0);
  // Ajouter une tâche pour Théophile, liée à un client
  await louis.click('[data-act=tknew]'); await louis.waitForSelector('form[data-form=teamtask]');
  await louis.fill('#tk-t', 'Préparer les textes de la page Contact'); await louis.uncheck('[name=tk-w][value=u_louis]'); await louis.check('[name=tk-w][value=u_theo]');
  await louis.fill('#tk-d', new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10)); await louis.selectOption('#tk-p', 'p_lumen');
  await louis.screenshot({ path: OUT + '/taches-ajout.png' });
  await louis.locator('form[data-form=teamtask]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(500);
  ok('Tâche ajoutée, message « les personnes concernées sont prévenues »', /prévenues/.test(await louis.locator('#toast').innerText()));
  await louis.click('[data-tkwho=all]'); await louis.waitForTimeout(200);
  ok('Vue « Toute l’équipe » : la nouvelle tâche, pour Maison Lumen', /Préparer les textes de la page Contact/.test(await louis.locator('#main').innerText()) && /Maison Lumen/.test(await louis.locator('.tk-item', { hasText: 'page Contact' }).innerText()));
  // Livrable : passer « En cours » ici change le planning du client
  const before = (await api(louis, '/api/tasks')).body.tasks.find((t) => t.kind === 'item' && t.status === 'todo' && t.projectId === 'p_lumen');
  await louis.selectOption(`[data-tkstate="${before.id}"]`, 'doing'); await louis.waitForTimeout(500);
  const pl = (await api(louis, '/api/projects/p_lumen')).body.project;
  const iid = before.id.split(':')[2], it = pl.phases.flatMap((x) => x.items).find((x) => x.id === iid);
  ok('Un livrable passé « En cours » ici est « En cours » dans le planning du client', it && it.status === 'on', it && it.status);
  // Filtre client et tableau
  await louis.selectOption('#tk-fc', 'interne'); await louis.waitForTimeout(200);
  ok('Filtre « Interne » : seulement les tâches sans client', !/Maison Lumen|Huchet|Varenne/.test(await louis.locator('.tk-group').allInnerTexts().then((x) => x.join(' '))));
  await louis.selectOption('#tk-fc', ''); await louis.click('[data-tklayout=board]'); await louis.waitForTimeout(200);
  await louis.screenshot({ path: OUT + '/taches-tableau.png', fullPage: true });
  ok('Affichage « Tableau » : 3 colonnes Pas commencé, En cours, Fait', (await louis.locator('.tk-col').count()) === 3 && /Pas commencé[\s\S]*En cours[\s\S]*Fait/.test(await louis.locator('.tk-board').innerText()));
  // Terminer et modifier une tâche interne
  await louis.click('[data-tklayout=list]'); await louis.click('[data-tkwho=me]'); await louis.waitForTimeout(200);
  await louis.selectOption('[data-tkstate=td2]', 'done'); await louis.waitForTimeout(400); await louis.click('.tk-done summary');
  ok('Tâche terminée : elle passe dans « Fait »', /Relancer les prospects du salon/.test(await louis.locator('.tk-done').innerText()) && !(await louis.locator('.tk-group', { hasText: 'Relancer les prospects' }).count()));
  // Théophile reçoit la tâche
  const theo = await login(br, 'theophile@agence-orem.fr');
  const inbox = await theo.locator('#main').innerText();
  ok('Théophile la trouve dans « À traiter » : « Louis t’a confié : … »', /Louis t’a confié : « Préparer les textes de la page Contact »/.test(inbox));
  await theo.locator('[data-notif]', { hasText: 'page Contact' }).first().click(); await theo.waitForSelector('form[data-form=teamtask]');
  ok('Un clic l’ouvre directement dans ses tâches, prête à modifier', (await theo.inputValue('#tk-t')) === 'Préparer les textes de la page Contact');
  await theo.selectOption('#tk-s', 'doing'); await theo.locator('form[data-form=teamtask]').evaluate((f) => f.requestSubmit()); await theo.waitForTimeout(400);
  ok('Théophile la passe « En cours »', (await api(theo, '/api/tasks')).body.tasks.find((t) => t.t === 'Préparer les textes de la page Contact').status === 'doing');
  // Mobile
  const m = await login(br, 'clement@agence-orem.fr', 390); await m.click('.tabbar [data-go=taches]').catch(() => m.evaluate(() => document.querySelector('[data-go=taches]').click())); await m.waitForSelector('.tk-bar');
  await m.screenshot({ path: OUT + '/taches-mobile.png', fullPage: true });
  ok('Mobile : pas de défilement horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  // Un client n'y a pas accès
  const claire = await login(br, 'claire@maisonlumen.fr');
  const r1 = await api(claire, '/api/tasks'), r2 = await api(claire, '/api/tasks', { type: 'todo.add', t: 'x' });
  ok('Un client ne voit ni ne crée de tâches de l’équipe (403)', r1.status === 403 && r2.status === 403);
  ok('Aucune trace des tâches internes dans le projet côté client', !/Relancer les prospects|Préparer les textes de la page Contact/.test(JSON.stringify((await api(claire, '/api/projects/p_lumen')).body)));
  ok('Aucune erreur JavaScript', ![louis, theo, m, claire].some((x) => x.errs.length), [louis, theo, m, claire].flatMap((x) => x.errs).join(' | '));
  console.log(R.join('\n')); await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
