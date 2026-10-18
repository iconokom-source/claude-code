/* Prototype de la page « Tâches de l'équipe » v2, injecté dans l'app pour les captures. */
window.tkMock = function (D, o = {}) {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const IMG = { louis: 'assets/louis.jpg', theophile: 'assets/theophile.jpg', clement: 'assets/clement.jpg' };
  const team = D.team, me = D.me, byId = Object.fromEntries(team.map((u) => [u.id, u]));
  const av = (id, cls = '') => { const u = byId[id]; return u && IMG[u.photo] ? `<img class="av ${cls}" src="${IMG[u.photo]}" alt="">` : `<span class="av"></span>`; };
  const avs = (ids) => `<span class="avs">${ids.slice(0, 2).map((i) => av(i)).join('')}${ids.length > 2 ? `<span class="more">+${ids.length - 2}</span>` : ''}</span>`;
  const first = (id) => (byId[id] ? byId[id].name.split(' ')[0] : '');
  const DAY = 864e5, d0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }, today = d0(Date.now());
  const dow = (new Date(today).getDay() + 6) % 7, sunday = today + (6 - dow) * DAY, monday = today - dow * DAY;
  const who = o.who || 'me', mine = (t) => who === 'all' || t.who.includes(who === 'me' ? me.id : who);
  const all = D.tasks;
  const scope = all.filter(mine);
  const open = scope.filter((t) => t.status !== 'done' && !t.review);
  const band = (t) => !t.due ? 4 : d0(t.due) < today ? 0 : d0(t.due) === today ? 1 : d0(t.due) <= sunday ? 2 : 3;
  const late = open.filter((t) => band(t) === 0), tod = open.filter((t) => band(t) === 1), week = open.filter((t) => band(t) === 2);
  const doneWeek = scope.filter((t) => t.status === 'done' && ((t.doneAt && d0(t.doneAt) >= monday) || (!t.doneAt && t.due && d0(t.due) >= monday && d0(t.due) <= today)));
  const fmtD = (d, opt) => new Intl.DateTimeFormat('fr-FR', opt).format(new Date(d));
  const stepLetter = (t) => (t.step ? 'OREM'[Number((t.step.match(/Étape (\d)/) || [])[1] || 1) - 1] || 'O' : '');
  const stepName = (t) => (t.step ? t.step.split('·')[1].trim() : '');
  const dueLbl = (t) => {
    if (t.status === 'done') return ['none', t.doneAt ? 'Fait le ' + fmtD(t.doneAt, { day: 'numeric', month: 'short' }) : 'Fait'];
    if (!t.due) return ['none', 'Sans date'];
    const d = d0(t.due), n = Math.round((today - d) / DAY);
    if (n > 0) return ['late', `${n} j de retard`];
    if (n === 0) return ['today', 'Aujourd’hui'];
    if (n === -1) return ['', 'Demain'];
    if (d <= sunday) { const s = fmtD(t.due, { weekday: 'short', day: 'numeric' }); return ['', s.charAt(0).toUpperCase() + s.slice(1)]; }
    return ['', fmtD(t.due, { day: 'numeric', month: 'short' })];
  };
  const meta = (t) => t.kind === 'item' ? `<span class="orem" title="${esc(t.step)}">${stepLetter(t)}</span>${esc(t.client)} · ${esc(stepName(t))}` : esc(t.client || 'Interne') + (t.note ? ` · ${esc(t.note)}` : '');
  const check = (t) => t.review ? `<span class="ck wait"><i>${ic('cal')}</i></span>` : `<button class="ck ${t.status}"><i>${t.status === 'done' ? ic('check') : ''}</i></button>`;
  const row = (t) => { const [c, l] = dueLbl(t); return `<li class="tk-r ${t.status} ${c === 'late' ? 'late' : ''}">${check(t)}<div class="tk-m"><div class="k-t">${t.urgent && t.status !== 'done' ? '<b class="chip bad sm">Urgent</b>' : ''}<span>${esc(t.t)}</span></div><div class="s">${meta(t)}</div></div>${t.review ? '<span class="chip hl sm">Chez le client</span>' : `<span class="due ${c}">${l}</span>`}${avs(t.who)}</li>`; };
  const pressed = (k) => (o.when === k ? 'true' : 'false');

  // En-tête
  const people = [['me', 'Moi', av(me.id)], ['all', 'Équipe', `<span class="grp">${ic('team')}</span>`], ...team.filter((u) => u.id !== me.id).map((u) => [u.id, first(u.id), av(u.id)])];
  const cnt = (w) => all.filter((t) => t.status !== 'done' && !t.review && (w === 'all' || t.who.includes(w === 'me' ? me.id : w))).length;
  const dateTxt = fmtD(today, { weekday: 'long', day: 'numeric', month: 'long' });
  const head = `<div class="tk-head"><div><h1>Tâches de l’équipe</h1><p class="lead">Les tâches internes et les livrables de tous les clients</p></div>
    <div class="k-acts"><span class="tk-date">${ic('cal')}${dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1)}</span>
    <div class="tk-people" role="group" aria-label="Personne">${people.map(([w, l, a]) => `<button aria-pressed="${who === w}">${a}${l}<span class="num">${cnt(w)}</span></button>`).join('')}</div>
    <button class="btn btn-primary">${ic('plus')}Nouvelle tâche</button></div></div>`;

  // Saisie rapide
  const quick = `<div class="tk-quick">${ic('plus')}<input value="${esc(o.typing || '')}" placeholder="Ajouter une tâche : « Relancer le devis @théo demain #Lumen ! »"><kbd>N</kbd>${o.typing ? '<button class="btn btn-primary btn-sm">Ajouter</button>' : ''}</div>`
    + (o.typing ? `<div class="tk-preview" aria-live="polite"><span class="pc">${av('u_theo')}Théophile</span><span class="pc np">${ic('cal')}Demain, ${fmtD(today + DAY, { weekday: 'short', day: 'numeric', month: 'short' })}</span><span class="pc"><span class="orem">#</span>Maison Lumen</span><span class="pc np" style="color:var(--bad)">Urgent</span><span class="k-hint">Entrée pour ajouter · Maj + Entrée pour les détails</span></div>` : '');

  // Focus
  const fq = open.slice().sort((a, b) => band(a) - band(b) || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (b.status === 'doing') - (a.status === 'doing') || (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15));
  const f = fq[0];
  const fTop = !f ? '' : (() => { const b = band(f); const n = f.due ? Math.round((today - d0(f.due)) / DAY) : 0; let s = b === 0 ? `En retard de ${n} jour${n > 1 ? 's' : ''}` : b === 1 ? 'Pour aujourd’hui' : !f.due ? 'Sans échéance' : n === -1 ? 'Pour demain' : 'Pour ' + fmtD(f.due, { weekday: 'long' }); return s + (f.urgent ? ' · Urgent' : ''); })();
  const focus = `<section class="tk-focus b-focus" aria-label="Prochaine tâche">${f ? `<div class="k-top"><span>${fTop}</span><span class="of">1 sur ${Math.min(5, fq.length)}</span></div>
    <div class="k-ft">${esc(f.t)}</div><div class="k-meta"><span style="display:flex;gap:8px;align-items:center">${f.kind === 'item' ? `<span class="orem">${stepLetter(f)}</span>${esc(f.client)} · Étape ${esc(f.step.replace('Étape ', ''))}` : esc(f.client || 'Interne')}</span>${avs(f.who)}</div>
    <div class="k-acts"><button class="b1">${ic('check')}C’est fait</button>${f.status === 'todo' ? '<button class="b2">Commencer</button>' : ''}<button class="b3">Autre tâche ${ic('arrow')}</button></div>` : `<div class="k-top"><span>Tout est fait</span></div><div class="k-ft">Rien ne vous attend. Belle journée.</div>`}</section>`;

  // KPI
  const lastWeek = scope.filter((t) => t.doneAt && d0(t.doneAt) >= monday - 7 * DAY && d0(t.doneAt) < monday).length;
  const diff = doneWeek.length - lastWeek;
  const maxLate = late.length ? Math.max(...late.map((t) => Math.round((today - d0(t.due)) / DAY))) : 0;
  const kpi = (k, l, v, unit, d, cls = '') => `<button class="tk-kpi" aria-pressed="${pressed(k)}"><span class="k-l">${l}</span><span class="k-v ${v === 0 ? 'zero' : cls}">${v}<small>${unit}</small></span><span class="k-d">${d}</span></button>`;
  const kpis = `<div class="b-kpis">${kpi('today', 'Aujourd’hui', tod.length, 'à faire', tod.length ? (tod.some((t) => t.urgent) ? `dont ${tod.filter((t) => t.urgent).length} urgente` : 'pour aujourd’hui') : 'Rien pour aujourd’hui')}
    ${kpi('late', 'En retard', late.length, 'en retard', late.length ? `depuis ${maxLate} j au plus` : 'Aucun retard', 'bad')}
    ${kpi('week', 'Cette semaine', week.length, 'à venir', `${open.filter((t) => t.status === 'doing').length} en cours au total`)}
    <button class="tk-kpi" aria-pressed="${pressed('done')}"><span class="k-l">Faites cette semaine</span><span class="k-v ${doneWeek.length ? '' : 'zero'}">${doneWeek.length}<small>faites</small></span><span class="k-d">${diff ? `<span class="trend ${diff > 0 ? '' : 'flat'}">${diff > 0 ? '+' : '−'}${Math.abs(diff)}</span> vs sem. passée` : 'Comme la semaine passée'}</span></button></div>`;

  // Charge
  const load = `<section class="tk-card tk-load b-load"><h2>Qui porte quoi</h2><div class="rows">${team.map((u) => {
    const ts = all.filter((t) => t.who.includes(u.id));
    const o2 = ts.filter((t) => t.status !== 'done' && !t.review);
    const dw = ts.filter((t) => t.status === 'done' && ((t.doneAt && d0(t.doneAt) >= monday) || (!t.doneAt && t.due && d0(t.due) >= monday && d0(t.due) <= today))).length;
    const lt = o2.filter((t) => band(t) === 0).length, dg = o2.filter((t) => t.status === 'doing' && band(t) !== 0).length, td = o2.length - lt - dg;
    const rev = ts.filter((t) => t.review && t.status !== 'done').length;
    const dots = [...Array(dw).fill('done'), ...Array(lt).fill('late'), ...Array(dg).fill('doing'), ...Array(td).fill('todo')];
    return `<button class="r" aria-pressed="${who === u.id || (who === 'me' && u.id === me.id)}">${av(u.id)}<span class="n">${first(u.id)}</span><span class="k-t">${o2.length}</span><span class="dots" aria-hidden="true">${dots.slice(0, 39).map((c) => `<i class="d-${c}"></i>`).join('')}</span>${rev ? `<span class="cl">+ ${rev} chez le client</span>` : ''}</button>`;
  }).join('')}</div><div class="legend"><span><i class="d-done"></i>Faites</span><span><i class="d-late"></i>En retard</span><span><i class="d-doing"></i>En cours</span><span><i class="d-todo"></i>Pas commencé</span></div></section>`;

  // 14 jours
  const days = [...Array(14)].map((_, i) => today + i * DAY);
  const per = (d) => open.filter((t) => t.due && d0(t.due) === d).length;
  const mx = Math.max(1, late.length, ...days.map(per));
  const bar = (n, cls) => n ? `<span class="val">${n}</span><span class="k-bar" style="height:${Math.max(8, Math.round(n / mx * 86))}px"></span>` : '<span class="zero"></span>';
  const total = days.reduce((s, d) => s + per(d), 0);
  const daysC = `<section class="tk-card tk-days b-days"><h2>Les 14 prochains jours <span class="aside">${total} tâche${total > 1 ? 's' : ''}</span></h2><div class="bars">
    ${late.length ? `<button class="c late">${bar(late.length)}<span class="k-lb"><b>Retard</b>&nbsp;</span></button><span class="sep"></span>` : ''}
    ${days.map((d, i) => { const wd = new Date(d).getDay(); return `<button class="c ${i === 0 ? 'today' : ''} ${wd % 6 === 0 ? 'we' : ''}" aria-pressed="${o.day === i}">${bar(per(d))}<span class="k-lb"><b>${'DLMMJVS'[wd]}</b>${new Date(d).getDate()}</span></button>`; }).join('')}</div></section>`;

  // Par client
  const clients = [...new Set(scope.map((t) => t.client || 'Interne'))].map((c) => { const ts = scope.filter((t) => (t.client || 'Interne') === c); const dn = ts.filter((t) => t.status === 'done').length, lt = ts.filter((t) => t.status !== 'done' && band(t) === 0 && !t.review).length; return { c, n: ts.length, dn, lt, open: ts.length - dn }; }).sort((a, b) => b.open - a.open).slice(0, 5);
  const clientsC = `<section class="tk-card tk-clients b-clients"><h2>Par client</h2><ul>${clients.map((x) => `<li><div class="k-top">${esc(x.c)}<span>${x.dn} / ${x.n} faites</span></div><div class="pbar"><i style="width:${x.n ? x.dn / x.n * 100 : 0}%"></i>${x.lt ? `<i class="k-l" style="width:${Math.max(4, x.lt / x.n * 100)}%"></i>` : ''}</div></li>`).join('')}</ul></section>`;

  const bento = `<div class="tk-bento">${focus}${kpis}${load}${daysC}${clientsC}</div>`;

  // Liste
  const order = (a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15);
  const tomorrow = today + DAY;
  const gOf = (t) => t.review ? 'review' : t.status === 'done' ? 'done' : !t.due ? 'none' : d0(t.due) < today ? 'late' : d0(t.due) === today ? 'today' : d0(t.due) === tomorrow ? 'tomorrow' : d0(t.due) <= sunday ? 'week' : d0(t.due) <= sunday + 7 * DAY ? 'next' : 'later';
  let list = scope; if (o.when === 'late') list = list.filter((t) => gOf(t) === 'late');
  const G = [['late', 'En retard'], ['today', 'Aujourd’hui'], ['tomorrow', 'Demain'], ['week', 'Cette semaine'], ['next', 'Semaine prochaine'], ['later', 'Plus tard'], ['none', 'Sans échéance'], ['review', 'Chez le client']];
  const groups = G.map(([k, l]) => [k, l, list.filter((t) => gOf(t) === k).sort(order)]).filter((x) => x[2].length);
  const title = o.when === 'late' ? `En retard <span class="chip hl">En retard ✕</span>` : who === 'all' ? 'Toute l’équipe' : who === 'me' ? 'Toutes vos tâches' : 'Tâches de ' + first(who);
  const tools = `<div class="tk-listhead"><h2>${title}</h2><div class="tk-tools"><select class="pill-sel"><option>Tous les clients</option></select>
    <div class="seg"><button aria-pressed="true">Tout</button><button aria-pressed="false">Interne</button><button aria-pressed="false">Livrables</button></div>
    <div class="seg"><button aria-pressed="${o.board ? 'false' : 'true'}">Liste</button><button aria-pressed="${o.board ? 'true' : 'false'}">Tableau</button></div></div></div>`;
  const listHtml = `<div class="tk-panel">${groups.map(([k, l, ts]) => `<div class="tk-g"><h3 class="tk-gh ${k === 'late' ? 'late' : ''}">${l} <span class="num">${ts.length}</span></h3><ul class="tk-ul">${ts.slice(0, 6).map(row).join('')}</ul>${ts.length > 6 ? `<button class="tk-more">${ts.length - 6 > 1 ? `Afficher les ${ts.length - 6} autres` : 'Afficher l’autre tâche'}</button>` : ''}</div>`).join('')}
    <div class="tk-g"><h3 class="tk-gh">Fait <span class="num">${scope.filter((t) => t.status === 'done').length}</span> <span class="num" style="text-transform:none;letter-spacing:0;font-weight:400">· 30 derniers jours, replié</span></h3></div></div>`;
  const card2 = (t) => { const [c, l] = dueLbl(t); return `<div class="tk-card2"><div class="hd">${check(t)}<div class="k-t">${t.urgent && t.status !== 'done' ? '<b class="chip bad sm">Urgent</b> ' : ''}${esc(t.t)}</div></div><div class="s">${meta(t)}</div><div class="k-ft">${t.review ? '<span class="chip hl sm">Chez le client</span>' : `<span class="due ${c}">${l}</span>`}${avs(t.who)}</div></div>`; };
  const cols = [['Pas commencé', 'var(--field)', scope.filter((t) => t.status === 'todo' && !t.review)], ['En cours', 'var(--hl)', scope.filter((t) => t.status === 'doing' && !t.review)], ['Chez le client', 'var(--hl-soft)', scope.filter((t) => t.review)], ['Fait (7 jours)', 'var(--fg)', scope.filter((t) => t.status === 'done')]];
  const board = `<div class="tk-board">${cols.map(([l, c, ts]) => `<section class="tk-col"><h3><i style="background:${c}"></i>${l} <span class="num">${ts.length}</span></h3>${ts.sort(order).slice(0, 5).map(card2).join('') || '<p class="small muted" style="padding:0 4px">Rien ici.</p>'}${ts.length > 5 ? `<button class="tk-more" style="padding-left:4px">${ts.length - 5 > 1 ? `Afficher les ${ts.length - 5} autres` : 'Afficher l’autre tâche'}</button>` : ''}</section>`).join('')}</div>`;

  // Panneau
  const ed = o.drawer && scope.find((t) => t.kind === 'task' && t.status !== 'done') ;
  const drawer = !ed ? '' : `<div class="tk-veil"></div><aside class="tk-drawer" role="dialog" aria-label="Modifier la tâche"><div class="hd"><h2>Modifier la tâche</h2><button class="k-x">✕</button></div>
    <div class="bd"><textarea class="ttl" rows="1">${esc(ed.t)}</textarea>
      <div><div class="lab">État</div><div class="st3"><span class="${ed.status === 'todo' ? 'on' : ''}"><span class="ck todo"><i></i></span>Pas commencé</span><span class="${ed.status === 'doing' ? 'on' : ''}"><span class="ck doing"><i></i></span>En cours</span><span><span class="ck done"><i>${ic('check')}</i></span>Fait</span></div></div>
      <div><div class="lab">Personnes</div><div class="k-row">${team.map((u) => `<span class="pp ${ed.who.includes(u.id) ? 'on' : ''}">${av(u.id)}${first(u.id)}</span>`).join('')}</div></div>
      <div><div class="lab">Échéance</div><div class="k-row"><span class="pp np">Aujourd’hui</span><span class="pp np">Demain</span><span class="pp np">Lundi</span><span class="pp np">Sans date</span></div><div class="fake" style="margin-top:8px">${ed.due ? fmtD(ed.due, { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'jj/mm/aaaa'} ${ic('cal').replace('<svg', '<svg style="width:16px;height:16px"')}</div></div>
      <div><div class="lab">Client</div><div class="fake">${esc(ed.client || 'Aucun (tâche interne)')} <span>⌄</span></div></div>
      <div class="k-sw">Urgent <i></i></div>
      <div><div class="lab">Note (facultatif)</div><div class="fake area">${esc(ed.note || 'Un détail utile pour la personne qui s’en charge')}</div></div></div>
    <div class="k-ft"><button class="btn btn-primary">Enregistrer</button><button class="btn btn-line">Annuler</button><span class="del">Supprimer</span></div></aside>`;

  const undo = o.undo ? `<div class="undo" role="status"><span>Fait : ${esc(o.undo)}.</span><button class="btn btn-sm">Annuler</button></div>` : '';
  return `${head}${quick}${o.noBento ? '' : bento}${tools}${o.board ? board : listHtml}${drawer}${undo}<button class="tk-fab" aria-label="Nouvelle tâche">${ic('plus')}</button>`;
};
