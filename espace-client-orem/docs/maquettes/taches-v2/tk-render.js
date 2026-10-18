/* Prototype de la page « Tâches de l'équipe » v2, injecté dans l'app pour les captures. */
window.tkMock = function (D, o = {}) {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const X = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const pl = (n, s, p) => `${n} ${n > 1 ? p : s}`;
  const IMG = { louis: 'assets/louis.jpg', theophile: 'assets/theophile.jpg', clement: 'assets/clement.jpg' };
  const team = D.team, me = D.me, byId = Object.fromEntries(team.map((u) => [u.id, u]));
  const av = (id, cls = '') => { const u = byId[id]; return u && IMG[u.photo] ? `<img class="av ${cls}" src="${IMG[u.photo]}" alt="">` : `<span class="av"></span>`; };
  const first = (id) => (byId[id] ? byId[id].name.split(' ')[0] : '');
  const avs = (ids) => `<span class="avs" title="${esc(ids.map(first).join(', '))}">${ids.slice(0, 2).map((i) => av(i)).join('')}${ids.length > 2 ? `<span class="more">+${ids.length - 2}</span>` : ''}</span>`;
  const DAY = 864e5, d0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }, today = d0(Date.now());
  const dow = (new Date(today).getDay() + 6) % 7, sunday = today + (6 - dow) * DAY, monday = today - dow * DAY;
  const who = o.who || 'me', mine = (t) => who === 'all' || t.who.includes(who === 'me' ? me.id : who);
  const all = D.tasks.map((t) => (o.undo && t.t === o.undo ? { ...t, status: 'done', doneAt: new Date().toISOString() } : t));
  const scope = all.filter(mine);
  const open = scope.filter((t) => t.status !== 'done' && !t.review);
  const band = (t) => !t.due ? 4 : d0(t.due) < today ? 0 : d0(t.due) === today ? 1 : d0(t.due) <= sunday ? 2 : 3;
  const late = open.filter((t) => band(t) === 0), tod = open.filter((t) => band(t) === 1);
  const next7 = open.filter((t) => t.due && d0(t.due) > today && d0(t.due) <= today + 7 * DAY).sort((a, b) => new Date(a.due) - new Date(b.due));
  const doneIn = (t, from, to) => t.status === 'done' && ((t.doneAt && d0(t.doneAt) >= from && d0(t.doneAt) < to) || (!t.doneAt && t.due && d0(t.due) >= from && d0(t.due) < to));
  const doneWeek = scope.filter((t) => doneIn(t, monday, today + DAY));
  const fmtD = (d, opt) => new Intl.DateTimeFormat('fr-FR', opt).format(new Date(d));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const stepLetter = (t) => (t.step ? 'OREM'[Number((t.step.match(/Étape (\d)/) || [])[1] || 1) - 1] || 'O' : '');
  const stepName = (t) => (t.step ? t.step.split('·')[1].trim() : '');
  const relDay = (d) => { const n = Math.round((d0(d) - today) / DAY); return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : d0(d) <= sunday ? fmtD(d, { weekday: 'long' }) : fmtD(d, { weekday: 'short', day: 'numeric' }); };
  const dueLbl = (t) => {
    if (t.status === 'done') return ['none', t.doneAt ? 'Fait le ' + fmtD(t.doneAt, { day: 'numeric', month: 'short' }) : 'Fait'];
    if (!t.due) return ['none', 'Sans date'];
    const d = d0(t.due), n = Math.round((today - d) / DAY);
    if (n > 0) return ['late', `${n} j de retard`];
    if (n === 0) return ['today', 'Aujourd’hui'];
    if (n === -1) return ['', 'Demain'];
    if (d <= sunday) return ['', cap(fmtD(t.due, { weekday: 'short', day: 'numeric' }))];
    return ['', fmtD(t.due, { day: 'numeric', month: 'short' })];
  };
  const meta = (t) => t.kind === 'item'
    ? `<span class="orem" title="${esc(t.step)}">${stepLetter(t)}</span><span class="tx">${esc(t.client)} · ${esc(stepName(t))}</span>`
    : `<span class="tx">${esc(t.client || 'Interne')}${t.note ? ` · ${esc(t.note)}` : ''}</span>`;
  const check = (t) => t.review
    ? `<span class="ck wait" title="En attente du client"><i>${ic('cal')}</i></span>`
    : `<button class="ck ${t.status}" aria-label="${t.status === 'done' ? 'Marquer comme pas faite' : 'Marquer comme faite'}"><i>${t.status === 'done' ? ic('check') : ''}</i></button>`;
  const urgent = (t) => (t.urgent && t.status !== 'done' ? '<b class="chip bad sm">Urgent</b>' : '');
  const row = (t) => { const [c, l] = dueLbl(t); return `<li class="tk-r ${t.status} ${c === 'late' ? 'late' : ''}">${check(t)}<div class="tk-m"><div class="k-t">${urgent(t)}<span>${esc(t.t)}</span></div><div class="s">${meta(t)}</div></div>${t.review ? '<span class="chip hl sm">Chez le client</span>' : `<span class="due ${c}">${l}</span>`}${avs(t.who)}</li>`; };
  const pressed = (k) => (o.when === k ? 'true' : 'false');

  // En-tête : la date rejoint le sous-titre (plus de fausse pilule).
  const people = [['me', 'Moi', av(me.id)], ['all', 'Équipe', `<span class="grp">${ic('team')}</span>`], ...team.filter((u) => u.id !== me.id).map((u) => [u.id, first(u.id), av(u.id)])];
  const cnt = (w) => all.filter((t) => t.status !== 'done' && !t.review && (w === 'all' || t.who.includes(w === 'me' ? me.id : w))).length;
  const head = `<div class="tk-head"><div class="k-tt"><h1>Tâches de l’équipe</h1><p class="lead"><b>${cap(fmtD(today, { weekday: 'long', day: 'numeric', month: 'long' }))}</b> · Tâches internes et livrables de tous les clients</p></div>
    <button class="btn btn-primary">${ic('plus')}Nouvelle tâche</button>
    <div class="tk-people" role="group" aria-label="Afficher les tâches de">${people.map(([w, l, a]) => `<button aria-pressed="${who === w}">${a}<span class="k-lbl">${l}</span><span class="num" aria-label="${pl(cnt(w), 'tâche ouverte', 'tâches ouvertes')}">${cnt(w)}</span></button>`).join('')}</div></div>`;

  // Saisie rapide
  const quick = `<div class="tk-quick ${o.typing ? 'typing' : ''}">${ic('plus')}<input value="${esc(o.typing || '')}" placeholder="Ajouter une tâche" aria-label="Ajouter une tâche">${o.typing ? '<button class="btn btn-primary btn-sm">Ajouter</button>' : '<span class="k-ex">Ex.&nbsp;: Relancer le devis <b>@théo</b> <b>demain</b> <b>#Lumen</b> <b>!</b></span><kbd title="Raccourci">N</kbd>'}</div>`
    + (o.typing ? `<div class="tk-preview" aria-live="polite"><span class="pc">${av('u_theo')}Théophile</span><span class="pc np">${ic('cal')}Demain, ${fmtD(today + DAY, { weekday: 'short', day: 'numeric', month: 'short' })}</span><span class="pc"><span class="orem">#</span>Maison Lumen</span><span class="pc np urg">Urgent</span><span class="k-hint">Entrée pour ajouter · Maj + Entrée pour les détails</span></div>` : '');

  // Focus (carte encre)
  const fq = open.slice().sort((a, b) => band(a) - band(b) || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (b.status === 'doing') - (a.status === 'doing') || (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15));
  const f = fq[0];
  const fTop = !f ? '' : (() => { const b = band(f); const n = f.due ? Math.round((today - d0(f.due)) / DAY) : 0; const s = b === 0 ? `En retard de ${pl(n, 'jour', 'jours')}` : b === 1 ? 'Pour aujourd’hui' : !f.due ? 'Sans échéance' : 'Pour ' + relDay(f.due); return s + (f.urgent ? ' · Urgent' : ''); })();
  const fMeta = !f ? '' : f.kind === 'item' ? `<span class="orem">${stepLetter(f)}</span>${esc(f.client)} · ${esc(stepName(f))}` : esc(f.client || 'Interne');
  const focus = `<section class="tk-focus b-focus" aria-label="Prochaine tâche">${f ? `<div class="k-top"><span>${fTop}</span><span class="k-nav"><span class="of">${fq.length > 1 ? `1 sur ${fq.length}` : ''}</span>${fq.length > 1 ? `<button class="nx" aria-label="Tâche suivante">${ic('arrow')}</button>` : ''}</span></div>
    <div class="k-ft">${esc(f.t)}</div><div class="k-meta"><span class="k-c">${fMeta}</span>${avs(f.who)}</div>
    <div class="k-acts"><button class="b1">${ic('check')}C’est fait</button>${f.status === 'todo' ? '<button class="b2">Commencer</button>' : ''}</div>`
    : `<div class="k-top"><span>Tout est à jour</span></div><div class="k-ft">Rien ne vous attend. Belle journée.</div>`}</section>`;

  // Chiffres
  const lastWeek = scope.filter((t) => doneIn(t, monday - 7 * DAY, monday)).length;
  const maxLate = late.length ? Math.max(...late.map((t) => Math.round((today - d0(t.due)) / DAY))) : 0;
  const urg = tod.filter((t) => t.urgent).length;
  const kpi = (k, l, v, unit, d, cls = '') => `<button class="tk-kpi" aria-pressed="${pressed(k)}"><span class="k-l">${l}</span><span class="k-v ${v === 0 ? 'zero' : cls}">${v}<small>${unit}</small></span><span class="k-d">${d}</span></button>`;
  const kpis = `<div class="b-kpis">${kpi('today', 'Aujourd’hui', tod.length, 'à faire', tod.length ? (urg ? `dont ${pl(urg, 'urgente', 'urgentes')}` : 'Aucune urgente') : 'Aucune échéance')}
    ${kpi('late', 'En retard', late.length, late.length > 1 ? 'tâches' : 'tâche', late.length ? (late.length > 1 ? `Le plus ancien&nbsp;: ${pl(maxLate, 'jour', 'jours')}` : `Depuis ${pl(maxLate, 'jour', 'jours')}`) : 'Aucun retard', 'bad')}
    ${kpi('next', '7 prochains jours', next7.length, 'à venir', next7.length ? `Prochaine&nbsp;: ${relDay(next7[0].due)}` : 'Rien de prévu')}
    ${kpi('done', 'Cette semaine', doneWeek.length, doneWeek.length > 1 ? 'faites' : 'faite', `Semaine passée&nbsp;: ${lastWeek}`, 'ok')}</div>`;

  // Qui porte quoi : matrice de points, 10 par ligne, uniquement les tâches ouvertes (le chiffre = les points).
  const load = `<section class="tk-card tk-load b-load"><h2>Qui porte quoi</h2><div class="rows">${team.map((u) => {
    const ts = all.filter((t) => t.who.includes(u.id));
    const o2 = ts.filter((t) => t.status !== 'done' && !t.review);
    const lt = o2.filter((t) => band(t) === 0).length, dg = o2.filter((t) => t.status === 'doing' && band(t) !== 0).length, td = o2.length - lt - dg;
    const rev = ts.filter((t) => t.review && t.status !== 'done').length;
    const dots = [...Array(lt).fill('late'), ...Array(dg).fill('doing'), ...Array(td).fill('todo')];
    const on = who === u.id || (who === 'me' && u.id === me.id);
    return `<button class="r" aria-pressed="${on}" aria-label="${first(u.id)} : ${pl(o2.length, 'tâche ouverte', 'tâches ouvertes')}, dont ${lt} en retard et ${dg} en cours">${av(u.id)}<span class="n">${first(u.id)}${rev ? `<span class="cl">+ ${rev} chez le client</span>` : ''}</span><span class="k-t">${o2.length}</span><span class="dots" aria-hidden="true">${dots.slice(0, 30).map((c) => `<i class="d-${c}"></i>`).join('')}</span></button>`;
  }).join('')}</div><div class="legend"><span><i class="d-late"></i>En retard</span><span><i class="d-doing"></i>En cours</span><span><i class="d-todo"></i>Pas commencé</span></div></section>`;

  // 14 jours
  const days = [...Array(14)].map((_, i) => today + i * DAY);
  const per = (d) => open.filter((t) => t.due && d0(t.due) === d).length;
  const mx = Math.max(1, late.length, ...days.map(per));
  const bar = (n) => n ? `<span class="val">${n}</span><span class="k-bar" style="height:${Math.max(10, Math.round(n / mx * 80))}px"></span>` : '<span class="zero"></span>';
  const total = days.reduce((s, d) => s + per(d), 0);
  const daysC = `<section class="tk-card tk-days b-days"><h2>Les 14 prochains jours <span class="aside">${total ? `${pl(total, 'échéance', 'échéances')}` : 'Aucune échéance'}</span></h2><div class="bars">
    ${late.length ? `<button class="c late" aria-label="${pl(late.length, 'tâche', 'tâches')} en retard">${bar(late.length)}<span class="k-lb"><b>Retard</b>&nbsp;</span></button><span class="sep"></span>` : ''}
    ${days.map((d, i) => { const wd = new Date(d).getDay(); return `<button class="c ${i === 0 ? 'today' : ''} ${wd % 6 === 0 ? 'we' : ''}" aria-pressed="${o.day === i}" ${i === 0 ? 'aria-current="date"' : ''}>${bar(per(d))}<span class="k-lb"><b>${i === 0 ? 'Auj.' : 'DLMMJVS'[wd]}</b>${new Date(d).getDate()}</span></button>`; }).join('')}</div></section>`;

  // Par client
  const clients = [...new Set(scope.map((t) => t.client || 'Interne'))].map((c) => { const ts = scope.filter((t) => (t.client || 'Interne') === c); const dn = ts.filter((t) => t.status === 'done').length, lt = ts.filter((t) => t.status !== 'done' && band(t) === 0 && !t.review).length; return { c, n: ts.length, dn, lt, open: ts.length - dn }; }).sort((a, b) => b.open - a.open).slice(0, 5);
  const clientsC = `<section class="tk-card tk-clients b-clients"><h2>Par client</h2><ul>${clients.map((x) => `<li><div class="k-top"><span class="nm">${esc(x.c)}</span><span>${x.lt ? `<em>${x.lt} en retard</em> · ` : ''}${x.dn} / ${x.n} ${x.dn > 1 ? 'faites' : 'faite'}</span></div><div class="pbar" role="img" aria-label="${x.dn} sur ${x.n} faites${x.lt ? `, ${x.lt} en retard` : ''}"><i style="width:${x.n ? x.dn / x.n * 100 : 0}%"></i>${x.lt ? `<i class="k-l" style="width:${Math.max(4, x.lt / x.n * 100)}%"></i>` : ''}</div></li>`).join('')}</ul></section>`;

  const bento = `<div class="tk-bento">${focus}${kpis}${load}${daysC}${clientsC}</div>`;

  // Liste
  const order = (a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15);
  const tomorrow = today + DAY;
  const gOf = (t) => t.review ? 'review' : t.status === 'done' ? 'done' : !t.due ? 'none' : d0(t.due) < today ? 'late' : d0(t.due) === today ? 'today' : d0(t.due) === tomorrow ? 'tomorrow' : d0(t.due) <= sunday ? 'week' : d0(t.due) <= sunday + 7 * DAY ? 'next' : 'later';
  let list = scope; if (o.when === 'late') list = list.filter((t) => gOf(t) === 'late');
  const G = [['late', 'En retard'], ['today', 'Aujourd’hui'], ['tomorrow', 'Demain'], ['week', 'Cette semaine'], ['next', 'Semaine prochaine'], ['later', 'Plus tard'], ['none', 'Sans échéance'], ['review', 'Chez le client']];
  const groups = G.map(([k, l]) => [k, l, list.filter((t) => gOf(t) === k).sort(order)]).filter((x) => x[2].length);
  const base = who === 'all' ? 'Toute l’équipe' : who === 'me' ? 'Toutes vos tâches' : 'Tâches de ' + first(who);
  const filt = o.when === 'late' ? `<button class="tk-filter" aria-label="Retirer le filtre En retard">En retard ${X}</button>` : '';
  const tools = `<div class="tk-listhead"><h2>${base}${filt}</h2><div class="tk-tools"><select class="pill-sel" aria-label="Client"><option>Tous les clients</option></select>
    <div class="seg" role="group" aria-label="Type"><button aria-pressed="true">Tout</button><button aria-pressed="false">Interne</button><button aria-pressed="false">Livrables</button></div>
    <div class="seg" role="group" aria-label="Affichage"><button aria-pressed="${o.board ? 'false' : 'true'}">Liste</button><button aria-pressed="${o.board ? 'true' : 'false'}">Tableau</button></div></div></div>`;
  const nDone = scope.filter((t) => t.status === 'done').length;
  const empty = o.when === 'late' ? `<div class="tk-empty"><span class="ok">${ic('check')}</span><div><b>Plus aucun retard</b><p>Tout ce qui était en retard est fait.</p></div><button class="btn btn-line btn-sm">Voir toutes vos tâches</button></div>` : '';
  const listHtml = `<div class="tk-panel">${groups.length ? groups.map(([k, l, ts]) => `<div class="tk-g"><h3 class="tk-gh ${k === 'late' ? 'late' : ''}">${l} <span class="num">${ts.length}</span></h3><ul class="tk-ul">${ts.slice(0, 6).map(row).join('')}</ul>${ts.length > 6 ? `<button class="tk-more">${ts.length - 6 > 1 ? `Afficher les ${ts.length - 6} autres` : 'Afficher l’autre tâche'}</button>` : ''}</div>`).join('') : empty}
    ${o.when || !nDone ? '' : `<div class="tk-g"><button class="tk-donebtn"><span class="tk-gh">Faites <span class="num">${nDone}</span></span><span class="k-s">30 derniers jours</span><span class="k-chev">Afficher</span></button></div>`}</div>`;
  const card2 = (t) => { const [c, l] = dueLbl(t); const ft = t.review ? '<span class="chip hl sm">Chez le client</span>' : t.status === 'done' ? (t.doneAt ? `<span class="due none">${l}</span>` : '<span></span>') : `<span class="due ${c}">${l}</span>`; return `<div class="tk-card2 ${t.status}">${t.urgent && t.status !== 'done' ? '<b class="chip bad sm">Urgent</b>' : ''}<div class="hd">${check(t)}<div class="k-t">${esc(t.t)}</div></div><div class="s">${meta(t)}</div><div class="k-ft">${ft}${avs(t.who)}</div></div>`; };
  const doneRecent = scope.filter((t) => t.status === 'done' && (t.doneAt || t.due) && d0(t.doneAt || t.due) >= today - 7 * DAY);
  const cols = [['Pas commencé', 'todo', scope.filter((t) => t.status === 'todo' && !t.review)], ['En cours', 'doing', scope.filter((t) => t.status === 'doing' && !t.review)], ['Chez le client', 'review', scope.filter((t) => t.review)], ['Faites (7 jours)', 'done', doneRecent]];
  const board = `<div class="tk-board">${cols.map(([l, c, ts]) => `<section class="tk-col"><h3><i class="h-${c}"></i>${l} <span class="num">${ts.length}</span></h3>${ts.sort(order).slice(0, 5).map(card2).join('') || '<p class="tk-none">Rien ici pour l’instant.</p>'}${ts.length > 5 ? `<button class="tk-more">${ts.length - 5 > 1 ? `Afficher les ${ts.length - 5} autres` : 'Afficher l’autre tâche'}</button>` : ''}</section>`).join('')}</div>`;

  // Panneau latéral
  const ed = o.drawer && scope.find((t) => t.kind === 'task' && t.status !== 'done');
  const edLate = ed && ed.due && d0(ed.due) < today ? Math.round((today - d0(ed.due)) / DAY) : 0;
  const drawer = !ed ? '' : `<div class="tk-veil"></div><aside class="tk-drawer" role="dialog" aria-modal="true" aria-labelledby="tkd-h"><div class="hd"><h2 id="tkd-h">Modifier la tâche</h2><button class="k-x" aria-label="Fermer">${X}</button></div>
    <div class="bd"><label class="lab sr" for="tkd-t">Intitulé</label><textarea id="tkd-t" class="ttl" rows="2">${esc(ed.t)}</textarea>
      <div><div class="lab">État</div><div class="st3" role="radiogroup"><span class="${ed.status === 'todo' ? 'on' : ''}"><span class="ck todo"><i></i></span>Pas commencé</span><span class="${ed.status === 'doing' ? 'on' : ''}"><span class="ck doing"><i></i></span>En cours</span><span><span class="ck done"><i>${ic('check')}</i></span>Faite</span></div></div>
      <div><div class="lab">Personnes</div><div class="k-row">${team.map((u) => `<span class="pp ${ed.who.includes(u.id) ? 'on' : ''}">${av(u.id)}${first(u.id)}${ed.who.includes(u.id) ? `<span class="tick">${ic('check')}</span>` : ''}</span>`).join('')}</div></div>
      <div><div class="lab">Échéance</div><div class="k-row"><span class="pp np">Aujourd’hui</span><span class="pp np">Demain</span><span class="pp np">Lundi</span><span class="pp np">Sans date</span></div><div class="fake" style="margin-top:8px">${ed.due ? fmtD(ed.due, { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'jj/mm/aaaa'} ${ic('cal')}</div>${edLate ? `<p class="k-hint2 bad">En retard de ${pl(edLate, 'jour', 'jours')}</p>` : ''}</div>
      <div><div class="lab">Client</div><div class="fake">${esc(ed.client || 'Aucun (tâche interne)')} <span class="chev">⌄</span></div></div>
      <div class="k-sw">Urgent <i class="${ed.urgent ? 'on' : ''}" role="switch" aria-checked="${!!ed.urgent}"></i></div>
      <div><div class="lab">Note (facultatif)</div><div class="fake area ${ed.note ? '' : 'ph'}">${esc(ed.note || 'Un détail utile pour la personne qui s’en charge')}</div></div></div>
    <div class="k-ft"><button class="btn btn-primary">Enregistrer</button><button class="btn btn-line">Annuler</button><button class="del">Supprimer</button></div></aside>`;

  const undo = o.undo ? `<div class="undo" role="status"><span>Faite : ${esc(o.undo)}</span><button class="btn btn-sm">Annuler</button></div>` : '';
  return `${head}${quick}${o.noBento ? '' : bento}${tools}${o.board ? board : listHtml}${drawer}${undo}<button class="tk-fab" aria-label="Nouvelle tâche">${ic('plus')}</button>`;
};
