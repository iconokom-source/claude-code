/* Tâches de l'équipe v2 (bento) : carte Focus, chiffres qui filtrent, saisie rapide (@personne demain #client !),
   cercle à cocher annulable 5 s, panneau latéral, tableau 4 colonnes, livrables reliés au planning du client,
   collègue prévenu, client sans accès, mobile sans défilement horizontal. node tests/taches.js [dossier] */
const { chromium } = require('playwright'); const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || require('os').tmpdir();
const R = []; const ok = (l, v, x) => R.push(`${v ? '✔' : '✘'} ${l}${!v && x ? ' → ' + x : ''}`);
let br;
async function login(email, w = 1440, h = 900) {
  const p = await (await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, locale: 'fr-FR' })).newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
  await p.goto(B); await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
  await p.waitForSelector('#main'); await p.waitForTimeout(400);
  for (let i = 0; i < 10 && await p.$('.ob'); i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  return p;
}
const api = (p, path, body) => p.evaluate(async ([path, body]) => { const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Orem': '1' }, body: JSON.stringify(body) } : { headers: { 'X-Orem': '1' } }); return { status: r.status, body: await r.json() }; }, [path, body]);
const tasks = async (p) => (await api(p, '/api/tasks')).body.tasks;
const noScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
(async () => {
  br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const louis = await login('louis@agence-orem.fr');
  ok('Menu agence : « Tâches de l’équipe » avec le nombre de tâches du jour ou en retard', /Tâches de l’équipe/.test(await louis.locator('.side').innerText()) && !!(await louis.$('.side [data-go=taches] .badge')));
  await louis.click('.side [data-go=taches]'); await louis.waitForSelector('.tk-bento');
  await louis.screenshot({ path: OUT + '/taches-v2.png', fullPage: false });
  ok('Bento : carte Focus, 4 chiffres, Qui porte quoi, 14 jours, Par client', !!(await louis.$('.tk-focus')) && (await louis.locator('.tk-kpi').count()) === 4 && !!(await louis.$('.tk-load')) && !!(await louis.$('.tk-days')) && !!(await louis.$('.tk-clients')));
  ok('Titre en Trykker, onglet actif en pilule blanche', /Trykker/.test(await louis.locator('.tk-head h1').evaluate((e) => getComputedStyle(e).fontFamily)) && (await louis.locator('.side [data-go=taches]').evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgb(244, 244, 246)');
  ok('Focus : la tâche en retard et urgente « Relancer les prospects du salon »', /Relancer les prospects du salon/.test(await louis.locator('.tk-focus').innerText()) && /En retard/.test(await louis.locator('.tk-focus .k-top').innerText()));
  ok('« Qui porte quoi » : le chiffre de chacun = ses points', await louis.evaluate(() => [...document.querySelectorAll('.tk-load .r')].every((r) => Number(r.querySelector('.k-t').textContent) === Math.min(30, r.querySelectorAll('.dots i').length) || r.querySelectorAll('.dots i').length === 30)));
  ok('Plus d’étiquette « Livrable » : la tuile O.R.E.M. à la place', !(await louis.locator('.tk-r .chip', { hasText: 'Livrable' }).count()) && (await louis.locator('.tk-r .orem').count()) > 0);
  // Saisie rapide
  await louis.fill('#tk-q', 'Préparer les textes de la page Contact @théo demain #Lumen !'); await louis.waitForTimeout(150);
  const prev = await louis.locator('#tk-prev').innerText();
  ok('Saisie rapide : aperçu Théophile, Demain, Maison Lumen, Urgent', /Théophile/.test(prev) && /Demain/.test(prev) && /Maison Lumen/.test(prev) && /Urgent/.test(prev), prev);
  await louis.screenshot({ path: OUT + '/taches-v2-saisie.png' });
  await louis.press('#tk-q', 'Enter'); await louis.waitForTimeout(600);
  const added = (await tasks(louis)).find((t) => t.t === 'Préparer les textes de la page Contact');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  ok('Entrée : tâche créée pour Théophile, demain, Maison Lumen, urgente, titre nettoyé', added && added.who.join() === 'u_theo' && added.projectId === 'p_lumen' && added.urgent && new Date(added.due).getDate() === tomorrow.getDate(), JSON.stringify(added));
  ok('Message clair après l’ajout', /Tâche ajoutée pour Théophile, demain\. La personne est prévenue\./.test(await louis.locator('#toast').innerText()), await louis.locator('#toast').innerText());
  ok('Le champ se vide et garde le focus pour enchaîner', (await louis.inputValue('#tk-q')) === '' && await louis.evaluate(() => document.activeElement.id === 'tk-q'));
  // Chiffre « En retard » : filtre la liste
  await louis.click('.tk-kpi[data-tkwhen=late]'); await louis.waitForTimeout(300);
  ok('Clic sur « En retard » : la liste est filtrée, pastille « En retard ✕ »', (await louis.locator('.tk-filter').count()) === 1 && (await louis.locator('.tk-panel .tk-r').count()) === 1);
  await louis.click('.tk-filter'); await louis.waitForTimeout(200);
  ok('La pastille retire le filtre', !(await louis.$('.tk-filter')));
  // Cocher, annuler, cocher
  await louis.click('.tk-panel [data-tkdone=td2]'); await louis.waitForTimeout(200);
  ok('Cocher : « Faite : … » avec « Annuler »', /Faite\s: Relancer les prospects du salon/.test(await louis.locator('.tk-undo').innerText()));
  await louis.click('[data-act=tkundo]'); await louis.waitForTimeout(400);
  ok('Annuler : rien n’est envoyé, la tâche reste à faire', (await tasks(louis)).find((t) => t.id === 'td2').status === 'todo' && !(await louis.$('.tk-undo')));
  await louis.click('.tk-focus [data-tkdone=td2]'); await louis.waitForTimeout(5800);
  ok('« C’est fait » sur la carte Focus : enregistré après 5 s', (await tasks(louis)).find((t) => t.id === 'td2').status === 'done');
  // Livrable passé « En cours » dans le panneau : le planning du client suit
  const item = (await tasks(louis)).find((t) => t.kind === 'item' && t.status === 'todo' && t.projectId === 'p_lumen' && t.who.includes('u_louis'));
  await louis.click(`.tk-panel [data-tkedit="${item.id}"]`).catch(async () => { await louis.click('[data-tkmore]'); await louis.click(`.tk-panel [data-tkedit="${item.id}"]`); });
  await louis.waitForSelector('.tk-drawer');
  ok('Panneau latéral : livrable, titre non modifiable, lien vers le planning', /Livrable de Maison Lumen/.test(await louis.locator('.tk-drawer').innerText()) && !!(await louis.$('.tk-drawer [data-act=tkopen]')) && !(await louis.$('#tkd-t')));
  await louis.screenshot({ path: OUT + '/taches-v2-panneau.png' });
  await louis.click('.tk-drawer .st3 label:has(input[value=doing])'); await louis.click('.tk-drawer button[type=submit]'); await louis.waitForTimeout(500);
  const pl = (await api(louis, '/api/projects/p_lumen')).body.project, it = pl.phases.flatMap((x) => x.items).find((x) => x.id === item.id.split(':')[2]);
  ok('Le livrable passé « En cours » est « En cours » dans le planning du client', it && it.status === 'on', it && it.status);
  ok('Le panneau se ferme et le focus revient sur la ligne', !(await louis.$('.tk-drawer')) && await louis.evaluate((id) => document.activeElement && document.activeElement.dataset.tkedit === id, item.id));
  // Nouvelle tâche par le panneau
  await louis.click('.tk-head [data-act=tknew]'); await louis.waitForSelector('#tkd-t');
  await louis.fill('#tkd-t', 'Mettre à jour la page Références'); await louis.click('.tk-drawer label.pp:has(input[value=u_clement])'); await louis.click('.tk-drawer [data-tkdue]:has-text("Lundi")');
  await louis.locator('form[data-form=tkedit]').evaluate((f) => f.requestSubmit()); await louis.waitForTimeout(500);
  const ref = (await tasks(louis)).find((t) => t.t === 'Mettre à jour la page Références');
  ok('Nouvelle tâche par le panneau : Louis et Clément, pour lundi', ref && ref.who.includes('u_clement') && ref.who.includes('u_louis') && new Date(ref.due).getDay() === 1, JSON.stringify(ref));
  // Tableau
  await louis.click('[data-tkwho=all]'); await louis.click('[data-tklayout=board]'); await louis.waitForTimeout(300);
  await louis.screenshot({ path: OUT + '/taches-v2-tableau.png', fullPage: true });
  ok('Tableau : Pas commencé, En cours, Chez le client, Faites (7 jours)', (await louis.locator('.tk-col').count()) === 4 && /Pas commencé[\s\S]*En cours[\s\S]*Chez le client[\s\S]*Faites \(7 jours\)/.test(await louis.locator('.tk-board').innerText()));
  // Raccourci N
  await louis.click('[data-tklayout=list]'); await louis.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {}); await louis.evaluate(() => document.activeElement && document.activeElement.blur());
  await louis.keyboard.press('n');
  ok('Touche N : curseur dans la saisie rapide', await louis.evaluate(() => document.activeElement && document.activeElement.id === 'tk-q'));
  // Théophile reçoit la tâche
  const theo = await login('theophile@agence-orem.fr');
  ok('Théophile la trouve dans « À traiter » : « Louis t’a confié : … »', /Louis t’a confié\s:\s«\sPréparer les textes de la page Contact\s»/.test(await theo.locator('#main').innerText()));
  await theo.locator('[data-notif]', { hasText: 'page Contact' }).first().click(); await theo.waitForSelector('.tk-drawer #tkd-t');
  ok('Un clic ouvre la tâche dans le panneau', (await theo.inputValue('#tkd-t')) === 'Préparer les textes de la page Contact');
  // Mobile 390 et 320
  for (const w of [390, 320]) {
    const m = await login('clement@agence-orem.fr', w, 800);
    await m.evaluate(() => document.querySelector('[data-go=taches]').click()); await m.waitForSelector('.tk-bento');
    if (w === 390) await m.screenshot({ path: OUT + '/taches-v2-mobile.png', fullPage: true });
    const order = await m.evaluate(() => { const y = (s) => document.querySelector(s).getBoundingClientRect().top; return y('.tk-panel') < y('.tk-load'); });
    ok(`Mobile ${w} px : pas de défilement horizontal, la liste avant les graphiques`, await noScroll(m) && order);
  }
  // Client
  const claire = await login('claire@maisonlumen.fr');
  const r1 = await api(claire, '/api/tasks'), r2 = await api(claire, '/api/tasks', { type: 'todo.add', t: 'x' });
  ok('Un client ne voit ni ne crée de tâches de l’équipe (403)', r1.status === 403 && r2.status === 403);
  ok('Aucune trace des tâches internes côté client', !/Relancer les prospects|page Contact|page Références/.test(JSON.stringify((await api(claire, '/api/projects/p_lumen')).body)));
  ok('Aucune erreur JavaScript', ![louis, theo, claire].some((x) => x.errs.length), [louis, theo, claire].flatMap((x) => x.errs).join(' | '));
  console.log(R.join('\n')); await br.close();
})().catch((e) => { console.error(e); console.log(R.join('\n')); process.exit(1); });
