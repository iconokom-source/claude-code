/* Prototype « Espace client » v2, injecté dans l'app pour les captures. Données réelles de l'API (projets d'exemple). */
window.cxMock = function (D, o = {}) {
  const p = D.p, team = D.team, byId = Object.fromEntries(team.map((u) => [u.id, u]));
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const IMG = { louis: 'assets/louis.jpg', theophile: 'assets/theophile.jpg', clement: 'assets/clement.jpg' };
  const TU = p.registre === 'tu', R = (v, t) => (TU ? t : v), reg = (s) => Core.reg(s, p.registre);
  const first = (id) => (byId[id] ? byId[id].name.split(' ')[0] : id === 'client' ? R('Vous', 'Toi') : '');
  const av = (id, cls = 'cx-av') => id === 'client' ? `<span class="cx-you" title="${R('Vous', 'Toi')}">${esc((p.contactName || 'V')[0])}</span>` : byId[id] && IMG[byId[id].photo] ? `<img class="${cls}" src="${IMG[byId[id].photo]}" alt="">` : '';
  const DAY = 864e5, d0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }, today = d0(Date.now());
  const fmt = (d, opt) => new Intl.DateTimeFormat('fr-FR', opt).format(new Date(d));
  const dm = (d) => fmt(d, { day: 'numeric', month: 'long' }), dms = (d) => fmt(d, { day: 'numeric', month: 'short' });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const money = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
  const days = (d) => Math.round((d0(d) - today) / DAY);
  const hour = (d) => fmt(d, { hour: 'numeric' }).replace(/\s?h$/, '') + ' h' + (new Date(d).getMinutes() ? String(new Date(d).getMinutes()).padStart(2, '0') : '');
  const iS = (it) => Core.itemState(p, it), pS = (ph) => Core.phaseState(p, ph), who = (it) => Core.itemWho(it);
  const items = p.phases.flatMap((ph) => ph.items);
  const leadId = (p.team && p.team.lead) || 'u_louis', lead = byId[leadId];
  const readyV = p.validations.filter((v) => v.status === 'ready');
  const toSign = p.files.filter((f) => f.sign && f.sign.status === 'requested');
  const clientFiles = p.files.filter((f) => f.from === 'client');
  const paid = p.invoices.filter((i) => i.status === 'paid').reduce((t, i) => t + i.ttc, 0);
  const total = p.billing.totalTTC || p.invoices.reduce((t, i) => t + i.ttc, 0);
  const lastLoom = p.messages.filter((m) => m.loom).sort((a, b) => new Date(b.at) - new Date(a.at))[0];
  const kpi = (l, icn, num, unit, foot, extra = '', cls = '') => `<div class="cx-kpi ${cls}"><div class="cx-l"><span>${l}</span><span class="cx-ico">${ic(icn)}</span></div><div class="cx-num m">${num}<small>${unit}</small></div>${extra}<div class="cx-d">${foot}</div></div>`;
  const head = (h1, sub, right = '') => `<div class="cx-head"><div><h1>${h1}</h1><p class="cx-sub">${sub}</p></div><div class="cx-head-r">${right}</div></div>`;
  const teamPill = () => `<span class="cx-pill" style="padding-left:6px"><span class="cx-avs">${(p.team.members || []).map((m) => av(m)).join('')}</span>${R('Votre', 'Ton')} équipe</span>`;
  const shortV = { 'Direction artistique et textes': 'DA et textes', 'Maquettes du site': 'Maquettes', 'Tests du site': 'Tests du site', 'Réception du site': 'Mise en ligne', 'Plan du site': 'Plan du site' };
  const nb = (h) => h.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');

  /* ---------- Avancement O.R.E.M. (bandes, aujourd'hui, jalons) ---------- */
  function oremCard() {
    const W = p.phases.map((ph) => Math.max(5, Math.min(18, (d0(ph.to) - d0(ph.from)) / DAY + 1)));
    const tot = W.reduce((a, b) => a + b, 0);
    const pos = (d) => { const t = d0(d); let acc = 0; for (let i = 0; i < p.phases.length; i++) { const a = d0(p.phases[i].from), b = d0(p.phases[i].to) + DAY; if (t < b || i === p.phases.length - 1) { const f = Math.max(0, Math.min(1, (t - a) / (b - a))); return ((acc + f * W[i]) / tot) * 100; } acc += W[i]; } return 100; };
    const bands = p.phases.map((ph, i) => { const st = pS(ph), dn = ph.items.filter((it) => iS(it) === 'done').length; return `<div class="cx-band ${st === 'done' ? 'done' : st === 'on' ? 'on' : 'wait'}" style="flex:${W[i]} 1 0">${st === 'on' ? `<span class="cx-fill" style="width:${Math.round((dn / ph.items.length) * 100)}%"></span>` : ''}<span class="cx-lt">${ph.letter}</span><span class="cx-btxt"><span class="cx-bn">${esc(ph.t)}</span><span class="cx-bd">${dms(ph.from)} au ${dms(ph.to)}</span></span></div>`; }).join('');
    const miles = p.validations.map((v, i) => { const end = i === p.validations.length - 1; const cls = v.status === 'approved' ? 'ok' : v.status === 'ready' ? 'now' : ''; return `<div class="cx-mile ${cls} ${end ? 'end' : ''}" style="left:${pos(v.due).toFixed(2)}%;${end && p.validations.length > 1 && (d0(v.due) - d0(p.validations[i - 1].due)) / DAY < 6 ? 'top:58px' : ''}"><i></i><b>${esc(shortV[v.t] || v.t)}</b><span>${v.status === 'ready' ? R('Avant demain', 'Avant demain') : dms(v.due)}</span></div>`; }).join('');
    const mlist = p.validations.slice(0, 5).map((v) => `<div style="display:flex;align-items:center;gap:10px;font-size:14px"><span class="cx-chip ${v.status === 'ready' ? 'hl' : ''}">${dms(v.due)}</span>${esc(v.t)}</div>`).join('');
    const dn = items.filter((it) => iS(it) === 'done').length;
    const cur = p.phases[p.phase - 1];
    return `<section class="cx-card c-1-13 cx-orem"><div class="cx-card-h"><h2>${ic('map')}Où en est ${R('votre', 'ton')} projet</h2><span class="cx-aside">Étape ${p.phase} sur 4 · <b style="color:var(--hl);font-weight:500">${esc(cur.t)}</b></span></div>
      <div class="cx-track"><div class="cx-bands">${bands}</div><div class="cx-today" style="left:${pos(today).toFixed(2)}%"><span>Aujourd’hui</span></div></div>
      <div class="cx-miles" style="height:${p.validations.length > 4 ? 120 : 74}px">${miles}</div><div class="cx-mlist"><b style="font-size:14px;font-weight:500">Vos feux verts</b>${mlist}</div>
      <div class="cx-orem-ft"><span><b>${dn} livrables faits</b> sur ${items.length}</span><div class="cx-pbar thin"><i style="width:${(dn / items.length) * 100}%"></i></div><span class="cx-lg cx-hide-s"><i></i>Fait</span><span class="cx-lg cx-hide-s"><i class="hl"></i>En cours</span><span class="cx-lg cx-hide-s"><i class="w"></i>À venir</span></div></section>`;
  }

  /* ---------- 1. Accueil pendant le projet ---------- */
  function accueil() {
    const v = readyV[0], todo = readyV.length + toSign.length + (p.missing || []).length;
    const golive = days(p.golive), span = Math.max(1, Math.round((d0(p.golive) - d0(p.start)) / DAY)), passed = span - golive;
    const loom = lastLoom ? `<div class="cx-loom"><span class="cx-th"><i>${ic('play')}</i>${av(lastLoom.by, '')}</span><div><b>${esc(lastLoom.loom.title)}</b><span>${esc(first(lastLoom.by))} · vidéo de ${esc(lastLoom.loom.duration)}</span></div></div>` : '';
    const nextPh = p.phases[p.phase];
    const ink = `<section class="cx-ink c-1-7 cx-r2"><div class="cx-eyebrow"><span>${R('Votre', 'Ta')} prochaine action${v ? ' · avant demain, ' + hour(v.due) : ''}</span><span class="cx-of">1 sur ${todo}</span></div>
      <h2>${esc(p.next.title)}</h2><p>${esc(p.next.text)}</p>${loom}
      <div class="cx-acts"><button class="cx-btn cx-b-light">${ic('check')}Voir et valider</button><button class="cx-btn cx-b-glass">${ic('play')}Regarder la vidéo</button></div>
      ${nextPh ? `<div class="cx-then">${ic('arrow')}<span>Ensuite : <b>${esc(nextPh.items[0].t)}</b>, avec ${esc(first(who(nextPh.items[0])[0][0]))}</span></div>` : ''}</section>`;
    const dots = Array.from({ length: span }, (_, i) => `<i class="${i < passed ? 'p' : i === passed ? 't' : ''}"></i>`).join('');
    const kpis = `<div class="cx-kpis c-8-13 cx-r2">
      ${kpi('Mise en ligne', 'globe', golive, 'jours', `Le ${dm(p.golive)}`, `<div class="cx-days">${dots}</div>`)}
      ${kpi('À valider', 'ok', readyV.length + toSign.length, readyV.length + toSign.length > 1 ? 'décisions' : 'décision', `<span class="cx-trend hl">${ic('cal')}Avant demain</span>`)}
      ${kpi('Fichiers reçus', 'folder', clientFiles.length, 'fichiers', (p.missing || []).length ? `<span class="cx-trend warn">${(p.missing || []).length} manquent</span>` : 'Tout est là')}
      ${kpi('Reste à régler', 'doc', money(total - paid), '€', `TTC · ${Math.round((paid / total) * 100)} % déjà réglé`, `<div class="cx-pbar"><i style="width:${(paid / total) * 100}%"></i><i class="hatch" style="flex:1"></i></div>`)}</div>`;
    const nextItems = items.filter((it) => iS(it) === 'wait').slice(0, 3);
    const ensuite = `<section class="cx-card c-1-5"><div class="cx-card-h"><h2>${ic('cal')}Ce qui arrive ensuite</h2></div><ul class="cx-list">
      ${p.meeting && p.meeting.when ? `<li><span class="cx-cal hl"><small>${fmt(p.meeting.when, { month: 'short' }).replace('.', '')}</small><b>${fmt(p.meeting.when, { day: 'numeric' })}</b></span><div class="cx-m"><div class="cx-t">${esc(p.meeting.title)}</div><div class="cx-s">${cap(fmt(p.meeting.when, { weekday: 'long' }))}, ${hour(p.meeting.when)} · avec ${esc(first(leadId))}</div></div></li>` : ''}
      ${nextItems.map((it) => `<li><span class="cx-cal"><small>${fmt(it.due, { month: 'short' }).replace('.', '')}</small><b>${fmt(it.due, { day: 'numeric' })}</b></span><div class="cx-m"><div class="cx-t">${esc(it.t)}</div><div class="cx-s">${esc(first(who(it)[0][0]))} ${esc(reg(who(it)[0][1]))}</div></div>${av(who(it)[0][0])}</li>`).join('')}</ul></section>`;
    const equipe = `<section class="cx-card c-5-9"><div class="cx-card-h"><h2>${ic('team')}${R('Votre', 'Ton')} équipe</h2></div><div class="cx-team">
      ${(p.team.members || []).map((id) => { const u = byId[id]; return `<div class="cx-person ${id === leadId ? 'lead' : ''}">${av(id, '')}<div style="min-width:0"><b>${esc(u.name.split(' ')[0])}</b><span>${esc(u.title)}</span></div>${id === leadId ? `<span class="cx-chip ink">${R('Votre', 'Ton')} contact</span>` : ''}</div>`; }).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:auto"><button class="cx-btn sm cx-b-ink" style="flex:1">${ic('chat')}Écrire</button><button class="cx-btn sm cx-b-soft" style="flex:1">${ic('cal')}Réserver un appel</button></div></section>`;
    const msgs = p.messages.slice().sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 2);
    const echanges = `<section class="cx-card c-9-13"><div class="cx-card-h"><h2>${ic('chat')}Derniers messages</h2><span class="cx-aside">${p.messages.filter((m) => m.fromAgency && m.readByClient === false).length} non lu</span></div><div class="cx-thread">
      ${p.note && p.note.text ? `<div class="cx-msg">${av(p.note.by, '')}<div class="cx-bubble"><div class="cx-who"><b>${esc(first(p.note.by))}</b><span>${cap(fmt(p.note.at, { weekday: 'long' }))}</span></div>${esc(p.note.text.length > 120 ? p.note.text.slice(0, p.note.text.lastIndexOf(' ', 116)) + '…' : p.note.text)}</div></div>` : ''}
      ${msgs.slice(0, 1).map((m) => `<div class="cx-msg">${av(m.by, '')}<div class="cx-bubble"><div class="cx-who"><b>${esc(first(m.by))} ${m.readByClient === false ? '<span class="cx-new"></span>' : ''}</b><span>${dms(m.at)}</span></div>${esc(m.text)}</div></div>`).join('')}</div>
      <div class="cx-reply"><span>${R('Répondre à l’équipe', 'Répondre à l’équipe')}…</span><i>${ic('arrow')}</i></div></section>`;
    return head(`Bonjour ${esc(p.contactName)}`, `${cap(fmt(today, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${esc(p.projet)}`, `<span class="cx-pill">${ic('globe')}<span>Mise en ligne le <b>${dm(p.golive)}</b></span></span>${teamPill()}`)
      + `<div class="cx-bento">${ink}${kpis}${oremCard()}${ensuite}${equipe}${echanges}</div>`;
  }

  /* ---------- 2. Accueil d'un projet livré : Évolution ---------- */
  function evolution() {
    const e = p.evo, rp = e.reports[0], hist = e.reports.slice().reverse();
    const pr = (p.proposals || []).find((x) => x.status === 'sent');
    const num = (s) => Number(String(s).replace(/\s| | /g, '').replace(',', '.'));
    const lbl = (r) => cap(fmt(r.month + '-15', { month: 'short' }).replace('.', ''));
    const ink = pr ? `<section class="cx-ink c-1-8"><div class="cx-eyebrow"><span>Ta prochaine action</span><span class="cx-of">Valable jusqu’au ${dm(pr.validUntil)}</span></div>
      <h2>${esc(cap(pr.title.replace(/^Demande : /, '')))}</h2><p>${esc(pr.intro)}</p>
      <div style="display:flex;align-items:baseline;gap:10px"><span class="cx-num" style="font-size:56px;color:#f4f4f6">${money(pr.lines.reduce((t, l) => t + l.ht, 0))}<small style="color:rgba(244,244,246,.72)">€ HT</small></span><span style="font-size:13px;color:rgba(244,244,246,.72)">Devis ${esc(pr.quote)}, envoyé par Louis le ${dm(pr.sentAt)}</span></div>
      <div class="cx-acts"><button class="cx-btn cx-b-light">${ic('doc')}Lire et accepter</button><button class="cx-btn cx-b-glass">${ic('chat')}Poser une question</button></div></section>` : '';
    const m = e.meeting.when;
    const visio = `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('cal')}Prochaine visio de pilotage</h2><span class="cx-chip hl">Dans ${days(m)} jours</span></div>
      <div class="cx-visio"><span class="cx-dd">${fmt(m, { day: 'numeric' })}</span><div class="cx-dm"><b>${cap(fmt(m, { weekday: 'long' }))}</b>${fmt(m, { month: 'long' })}, ${hour(m)} · ${esc(e.meeting.mode.replace(/^Visio de pilotage /, '').replace(/[()]/g, ''))}<br>On lit les chiffres du mois et on décide des priorités.</div></div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:auto;padding-top:14px;border-top:1px solid var(--line)"><span class="cx-avs">${av('u_louis')}${av('u_theo')}</span><span style="font-size:13px;color:var(--muted);flex:1">Louis présente les chiffres, Théophile propose les priorités</span></div>
      <button class="cx-btn sm cx-b-soft">Demander un autre créneau</button></section>`;
    const serie = (k) => hist.map((r) => num(r.stats[k][0]));
    const bars = (k) => { const s = serie(k), mx = Math.max(...s); return `<div class="cx-hbars">${s.map((v, i) => `<div class="cx-c ${i === s.length - 1 ? 'on' : ''}"><div class="cx-bar" style="height:${Math.round(22 + (v / mx) * 48)}px"></div><span>${lbl(hist[i])}</span></div>`).join('')}</div>`; };
    const circles = (k) => { const s = serie(k), mx = Math.max(...s); return `<div class="cx-circles">${s.map((v, i) => `<div class="cx-c ${i === s.length - 1 ? 'on' : ''}"><i style="width:${Math.round(68 * Math.sqrt(v / mx))}px;height:${Math.round(68 * Math.sqrt(v / mx))}px">${v}</i><span>${lbl(hist[i])}</span></div>`).join('')}</div>`; };
    const ladder = (k) => { const s = serie(k); return `<div class="cx-ladder">${s.map((v, i) => `<div class="cx-rw ${i === s.length - 1 ? 'on' : ''}"><span>${lbl(hist[i])}</span><span class="cx-rail"><b style="left:${(100 - (v - 1) / 9 * 100).toFixed(1)}%"></b></span><span class="cx-v">${String(v).replace('.', ',')}</span></div>`).join('')}<div class="cx-rw" style="font-size:11px"><span></span><span style="display:flex;justify-content:space-between"><span>10<sup>e</sup></span><span>1<sup>re</sup> place</span></span><span></span></div></div>`; };
    const tr = (s) => { const t = s.replace(/ sur \S+$/, ''); return `<span class="cx-trend">${ic('up')}${esc(t)}</span><span>sur ${esc(s.split(' sur ')[1] || '')}</span>`; };
    const st = rp.stats;
    const stat = (k, cls, icn, viz, trend) => `<div class="cx-kpi ${cls}"><div class="cx-l"><span>${cap(esc(st[k][1]))}</span><span class="cx-ico">${ic(icn)}</span></div><div class="cx-num m">${esc(st[k][0])}</div>${viz}<div class="cx-d">${trend}</div></div>`;
    const kp = `<div class="c-1-13" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:10px"><h2 style="font-family:var(--serif);font-weight:400;font-size:32px;letter-spacing:-.015em">${cap(fmt(rp.month + '-15', { month: 'long' }))} en chiffres</h2><span style="font-size:14px;color:var(--muted)">Bilan reçu le ${dm(rp.at)}</span></div>
      ${stat(0, 'c-1-4', 'eye', bars(0), tr(st[0][2]))}${stat(1, 'c-4-7', 'mail', circles(1), tr(st[1][2]))}${stat(2, 'c-7-10', 'globe', bars(2), tr(st[2][2]))}
      ${stat(3, 'c-10-13', 'up', ladder(3), `<span class="cx-trend">${ic('up')}${esc(st[3][2].replace('gagne ', '+'))}</span><span>sur août</span>`)}`;
    const bilan = `<section class="cx-card c-1-7b"><div class="cx-card-h"><h2>${ic('doc')}Le bilan du mois</h2><span class="cx-aside">${cap(fmt(rp.month + '-15', { month: 'long', year: 'numeric' }))}</span></div>
      <p class="cx-rp-title">${esc(rp.title)}</p><p style="font-size:14px;color:var(--muted)">${esc(rp.summary)}</p>
      <b style="font-size:14px;font-weight:500;margin-top:4px">Le travail réalisé</b><ul class="cx-done-l">${rp.done.map(([t, s]) => `<li><i>${ic('check')}</i><div>${esc(t)}<small>${esc(s)}</small></div></li>`).join('')}</ul>
      <div style="display:flex;gap:8px;margin-top:auto"><button class="cx-btn sm cx-b-ink">${ic('eye')}Consulter le bilan</button><button class="cx-btn sm cx-b-soft">${ic('down')}PDF</button><button class="cx-link" style="margin-left:auto">Bilans précédents ${ic('arrow')}</button></div></section>`;
    const ax = e.axes, adone = ax.filter((a) => a.status === 'done').length;
    const axes = `<section class="cx-card c-7-13"><div class="cx-card-h"><h2>${ic('ok')}Les axes du mois</h2><span class="cx-aside">${adone} sur ${ax.length} faits</span></div>
      <div class="cx-pbar">${ax.slice().sort((a, b) => (a.status === 'done' ? -1 : b.status === 'done' ? 1 : a.status === 'on' ? -1 : 1)).map((a) => `<i class="${a.status === 'done' ? '' : a.status === 'on' ? 'hl' : 'hatch'}" style="flex:1"></i>`).join('')}</div>
      <ul class="cx-axes">${ax.map((a) => `<li class="${a.priority ? 'pri' : ''} ${a.status}">${av(a.who, '')}<div style="min-width:0"><div class="cx-t">${esc(a.t)}</div><div class="cx-s">${esc(first(a.who))} · ${a.status === 'done' ? 'fait' : 'prévu le ' + dm(a.due)}</div></div>${a.status === 'done' ? '<span class="cx-chip ok">Fait</span>' : a.status === 'on' ? '<span class="cx-chip hl">En cours</span>' : '<span class="cx-chip">Prévu</span>'}</li>`).join('')}</ul></section>`;
    const r = p.results, pct = parseInt(r.stats[3][0], 10);
    const res = `<section class="cx-card c-1-7b"><div class="cx-card-h"><h2>${ic('up')}Depuis la mise en ligne</h2><span class="cx-aside">Depuis le ${dm(p.deliveredAt)}</span></div>
      <div style="display:flex;align-items:center;gap:20px"><span class="cx-num">${pct}<small>%</small></span><span style="font-size:14px;color:var(--muted);line-height:1.4">${esc(r.stats[3][1].replace(/^du/, 'Du'))}, sans budget média</span></div>
      <div class="cx-dotm">${Array.from({ length: 100 }, (_, i) => `<i class="${i < pct ? 'on' : ''}"></i>`).join('')}</div>
      <div class="cx-res" style="padding-top:14px;border-top:1px solid var(--line)">${r.stats.slice(0, 3).map(([n, l]) => `<div><span class="cx-num">${esc(n)}</span><span>${esc(l)}</span></div>`).join('')}</div></section>`;
    const months = `<section class="cx-card c-7-13"><div class="cx-card-h"><h2>${ic('map')}Les mois suivants</h2></div><div class="cx-months" style="grid-template-columns:1fr">${e.next.map(([mo, t]) => `<div><b>${esc(mo)}</b><small>${esc(t)}</small></div>`).join('')}</div></section>`;
    return head(`Bonjour ${esc(p.contactName)}`, `Ton site est en ligne depuis le <b>${fmt(p.deliveredAt, { day: 'numeric', month: 'long' })}</b> · Évolution depuis le ${dm(e.since)}`, `<span class="cx-pill">${ic('globe')}huchet-demorge.fr</span>${teamPill()}`)
      + `<div class="cx-bento">${ink}${visio}${kp}${bilan}${axes}${res}${months}</div>`;
  }

  /* ---------- 3. Étapes ---------- */
  function etapes() {
    const a = d0(p.phases[0].from), b = d0(p.phases[3].to) + DAY, P = (d) => ((d0(d) - a) / (b - a)) * 100;
    const ticks = Array.from({ length: 6 }, (_, i) => a + ((b - a) * i) / 5);
    const rows = p.phases.map((ph) => { const st = pS(ph), vals = ph.items.filter((it) => it.val).length; return `<div class="cx-gl"><span class="cx-ltr ${st === 'on' ? 'hl' : ''}">${ph.letter}</span><div><b>${esc(ph.t)}</b><span>${dms(ph.from)} au ${dms(ph.to)}</span></div></div>
      <div class="cx-lane"><div class="cx-gb ${st}" style="left:${P(ph.from)}%;width:${P(d0(ph.to) + DAY) - P(ph.from)}%"><span class="cx-gtx">${ph.items.length} livrables</span></div>${[...new Set(ph.items.filter((it) => it.val).map((it) => it.val))].map((k) => { const v = p.validations.find((x) => x.key === k); return `<span class="cx-gb-m" style="position:absolute;top:calc(100% - 8px);left:${P(v.due)}%;width:13px;height:13px;transform:translate(-50%,-50%) rotate(45deg);border-radius:3px;z-index:2;background:${v.status === 'ready' ? 'var(--hl)' : 'var(--surface)'};box-shadow:0 0 0 2px ${v.status === 'ready' ? 'var(--surface)' : 'var(--fg)'}" title="${esc(v.t)}"></span>`; }).join('')}</div>`; }).join('');
    const gantt = `<section class="cx-card c-1-13"><div class="cx-card-h"><h2>${ic('cal')}Le planning</h2><span class="cx-aside">Dates indicatives, ajustées ensemble · ◆ ${R('votre', 'ton')} feu vert</span></div>
      <div class="cx-gantt" style="margin-top:28px">${rows}<div class="cx-gscale">${ticks.map((t) => `<span>${dms(t)}</span>`).join('')}</div>
      <div class="cx-gtoday" style="left:calc(200px + (100% - 200px) * ${(P(today) / 100).toFixed(4)})"><span>Aujourd’hui</span></div></div></section>`;
    const ph = p.phases[p.phase - 1], dn = ph.items.filter((it) => iS(it) === 'done').length;
    const whoLine = (it) => who(it).map(([id, t]) => `<span>${av(id)}<span>${id === 'client' ? `<b>${esc(reg(t).split(' ')[0])}</b> ${esc(reg(t).split(' ').slice(1).join(' '))}` : `<b>${esc(first(id))}</b> ${esc(reg(t))}`}</span></span>`).join('');
    const now = `<section class="cx-card c-1-9"><div class="cx-phase-now"><div class="cx-pn-l"><span class="cx-chip hl" style="align-self:flex-start">En cours</span><span class="cx-big-l">${ph.letter}</span><div><b style="font-size:24px;font-weight:500">${esc(ph.t)}</b><p style="font-size:14px;color:var(--muted);margin-top:6px">${esc(reg(ph.txt))}</p></div>
      <div style="margin-top:auto"><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:8px"><span><b style="color:var(--fg);font-weight:500">${dn} sur ${ph.items.length}</b> faits</span><span>Fin le ${dm(ph.to)}</span></div><div class="cx-pbar">${ph.items.map((it) => `<i class="${iS(it) === 'done' ? '' : iS(it) === 'review' ? 'hl' : 'hatch'}" style="flex:1"></i>`).join('')}</div></div></div>
      <ul class="cx-deliv">${ph.items.map((it) => { const s = iS(it); return `<li class="${s}"><span class="cx-st">${ic(s === 'done' ? 'check' : s === 'review' ? 'eye' : 'cal')}</span><div style="min-width:0"><div class="cx-t">${esc(it.t)}</div><div class="cx-who">${whoLine(it)}</div></div><div class="cx-r">${s === 'done' ? '<span class="cx-chip ok">Fait</span>' : s === 'review' ? `<button class="cx-btn sm cx-b-ink">Voir et valider</button>` : `<span class="cx-chip">${dms(it.due)}</span>`}${s === 'review' ? `<small>Avant demain</small>` : `<small>${dms(it.due)}</small>`}</div></li>`; }).join('')}</ul></div></section>`;
    const ppl = ['u_louis', 'u_theo', 'u_clement', 'client'].map((id) => { const mine = items.filter((it) => who(it).some(([w]) => w === id)); return [id, mine]; });
    const whos = `<section class="cx-card c-9-13"><div class="cx-card-h"><h2>${ic('team')}Qui fait quoi</h2><span class="cx-aside">Sur tout le projet</span></div><div class="cx-whos">
      ${ppl.map(([id, mine]) => `<div class="cx-wr">${av(id)}<b>${id === 'client' ? R('Vous', 'Toi') : esc(first(id))}</b><span class="cx-n">${mine.length}</span><div class="cx-pdots">${mine.map((it) => `<i class="${iS(it) === 'done' ? 'd' : iS(it) === 'review' ? 'r' : ''}"></i>`).join('')}</div></div>`).join('')}</div>
      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:4px"><b style="font-size:14px;font-weight:500">${R('Vos', 'Tes')} 3 prochaines actions</b><ul class="cx-mini" style="margin-top:6px">${items.filter((it) => iS(it) !== 'done' && who(it).some(([w]) => w === 'client')).slice(0, 3).map((it) => { const s = iS(it); return `<li><div class="cx-m">${esc(reg(who(it).find(([w]) => w === 'client')[1]))}<small>${esc(it.t)}</small></div><span class="cx-chip ${s === 'review' ? 'hl' : ''}">${s === 'review' ? 'Avant demain' : dms(it.due)}</span></li>`; }).join('')}</ul></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--muted);margin-top:auto"><span class="cx-lg"><i style="border-radius:50%"></i>Fait</span><span class="cx-lg"><i class="hl" style="border-radius:50%"></i>${R('À vous', 'À toi')}</span><span class="cx-lg"><i class="w" style="border-radius:50%"></i>À venir</span></div></section>`;
    const later = p.phases.slice(p.phase).map((x, i) => `<section class="cx-card ${['c-1-5', 'c-5-9', 'c-9-13'][i]} cx-next-ph"><div class="cx-ph-h"><span class="cx-ltr">${x.letter}</span><div><b>${esc(x.t)}</b><span>${dms(x.from)} au ${dms(x.to)}</span></div></div><p style="font-size:13px;color:var(--muted)">${esc(reg(x.txt))}</p>
      <ul class="cx-mini">${x.items.map((it) => `<li><div class="cx-m">${esc(it.t)}<small>${dms(it.due)}${it.val ? ` · ${R('votre', 'ton')} feu vert` : ''}</small></div><span class="cx-avs">${who(it).map(([w]) => av(w)).join('')}</span></li>`).join('')}</ul></section>`).join('');
    return head('Étapes', `4 temps, selon la méthode O.R.E.M. On passe à la suite avec ${R('votre', 'ton')} feu vert.`, `<span class="cx-pill">${ic('map')}<span>Étape <b>${p.phase} sur 4</b></span></span><span class="cx-pill">${ic('globe')}<span>Mise en ligne le <b>${dm(p.golive)}</b></span></span>`)
      + `<div class="cx-bento">${gantt}${now}${whos}${later}</div>`;
  }

  /* ---------- 4. À valider ---------- */
  function valider() {
    const v = readyV[0], it = items.find((x) => x.val === v.key), maker = who(it)[0][0];
    const tree = `<div class="cx-tree"><div class="cx-node root">Accueil</div><div class="cx-hrow">${[2, 1, 3, 2, 2, 1].map((n, i) => `<div class="cx-col"><div class="cx-node ${i === 2 ? 'hl' : ''}"></div>${Array.from({ length: n }, () => '<div class="cx-node sub"></div>').join('')}</div>`).join('')}</div></div>`;
    const hrs = Math.max(1, Math.round((new Date(v.due) - Date.now()) / 36e5));
    const feat = `<section class="cx-card cx-val c-1-13"><div class="cx-prev"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="cx-chip">${ic('figma')}Prototype Figma · version 1</span><button class="cx-link">Ouvrir en grand ${ic('arrow')}</button></div>
      <div class="cx-frame"><div class="cx-fb"><i></i><i></i><i></i><span>${ic('lock')}${esc(p.client)} · ${esc(v.t)}</span></div>${tree}</div>
      ${lastLoom ? `<div class="cx-loom" style="background:var(--surface);box-shadow:0 0 0 1px var(--line)"><span class="cx-th"><i>${ic('play')}</i>${av(lastLoom.by, '')}</span><div><b>${esc(lastLoom.loom.title)}</b><span style="color:var(--muted)">Par ${esc(first(lastLoom.by))}, page par page · ${esc(lastLoom.loom.duration)}</span></div><button class="cx-btn sm cx-b-ink" style="margin-left:auto">${ic('play')}Regarder</button></div>` : ''}</div>
      <div class="cx-dec"><span class="cx-chip hl" style="align-self:flex-start">En attente de ${R('votre', 'ton')} feu vert</span><h2>${esc(v.t)}</h2><p style="font-size:15px;color:var(--fg-2)">${esc(v.sub)}. Prêt depuis le ${dm(v.readyAt)}, préparé par ${esc(first(maker))}.</p>
      <div class="cx-count"><span class="cx-num">${hrs}</span><div><b>heures pour répondre</b>Avant demain, ${hour(v.due)}</div></div>
      <div class="cx-count" style="background:transparent;box-shadow:inset 0 0 0 1px var(--line);padding:12px 16px"><span class="cx-ltr hl">R</span><div><b>Après ${R('votre', 'ton')} feu vert</b>La direction artistique démarre, avec Clément.</div></div>
      <div class="cx-acts"><button class="cx-btn cx-b-ink">${ic('check')}Valider le plan du site</button><button class="cx-btn cx-b-line">Demander des modifications</button></div>
      <p class="cx-legal">Valider, c’est donner ${R('votre', 'ton')} feu vert écrit pour passer à la suite. Il est enregistré avec la date et l’heure.</p></div></section>`;
    const f = toSign[0];
    const sign = f ? `<section class="cx-card c-1-13"><div class="cx-sign"><span class="cx-pdf"><b>PDF</b></span><div style="flex:1;min-width:0"><span class="cx-chip warn" style="margin-bottom:6px">À signer · 2 sur 2</span><div style="font-size:17px;font-weight:500">${esc(f.sign.label)}</div><div style="font-size:13px;color:var(--muted)">${esc(f.name)} · envoyé le ${dm(f.sign.at)} par ${esc(first(f.sign.by))} · signature en ligne en 1 minute</div></div><button class="cx-btn sm cx-b-soft">${ic('eye')}Lire</button><button class="cx-btn sm cx-b-ink">Signer</button></div></section>` : '';
    const steps = `<section class="cx-card c-1-13"><div class="cx-card-h"><h2>${ic('ok')}Les feux verts du projet</h2><span class="cx-aside">${p.validations.filter((x) => x.status === 'approved').length} sur ${p.validations.length} donnés</span></div><div class="cx-steps">
      ${p.validations.map((x, i) => `<div class="cx-step ${x.status === 'ready' ? 'now' : x.status === 'approved' ? '' : 'lock'}"><span class="cx-sn">${i + 1}</span><b>${esc(x.t)}</b><small>${x.status === 'ready' ? `${ic('cal')}Maintenant` : `${ic('lock')}Vers le ${dms(x.due)}`}</small></div>`).join('')}</div></section>`;
    return head('À valider', `<b>${readyV.length + toSign.length} décisions</b> ${R('vous attendent', 't’attendent')}. On avance avec ${R('votre', 'ton')} feu vert.`, `<span class="cx-pill">${ic('ok')}${p.validations.filter((x) => x.status === 'approved').length} feu vert donné sur ${p.validations.length}</span>`)
      + `<div class="cx-bento">${feat}${sign}${steps}</div>`;
  }

  /* ---------- 5. Fichiers et factures ---------- */
  function fichiers() {
    const mo = (n) => n >= 1e6 ? (n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: n >= 1e8 ? 0 : 1 }) + ' Mo' : Math.round(n / 1e3) + ' Ko';
    const ext = (n) => (n.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toUpperCase();
    const drop = `<section class="cx-drop c-1-8"><div class="cx-dz"><span class="cx-up">${ic('up')}</span><div><h2>Glissez ${R('vos', 'tes')} fichiers ici</h2><p>Photos, vidéos, textes, dossiers entiers. Aucune limite de taille, l’envoi reprend tout seul si la connexion coupe.</p></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px;font-weight:500">Ce qu’il nous manque</b><span class="cx-chip warn">${p.missing.length} éléments</span></div>
      <div class="cx-miss">${p.missing.map((m) => `<div><span class="cx-fico">${ic('folder')}</span><div class="cx-m"><b>${esc(m.t)}</b><small>${esc(m.sub)}</small></div><button class="cx-btn sm cx-b-ink" style="padding:0 14px">Déposer</button></div>`).join('')}</div></section>`;
    const pct = Math.round((paid / total) * 100), C = 2 * Math.PI * 56;
    const pay = `<section class="cx-card c-8-13 cx-pay"><div class="cx-card-h"><h2>${ic('doc')}Paiements</h2><span class="cx-aside">Devis ${esc(p.billing.quote)} signé</span></div>
      <div style="display:flex;align-items:center;gap:20px"><div class="cx-ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="56" fill="none" stroke="var(--surface-2)" stroke-width="16"/><circle cx="66" cy="66" r="56" fill="none" stroke="var(--fg)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(C * pct) / 100} ${C}"/></svg><div><span><b>${pct} %</b><small>réglé</small></span></div></div>
      <div style="display:flex;flex-direction:column;gap:10px"><div><div class="cx-num" style="font-size:40px">${money(paid)}<small>€ TTC réglés</small></div></div><div style="font-size:14px;color:var(--muted)">sur ${money(total)} € TTC au total<br><b style="color:var(--fg);font-weight:500">${money(total - paid)} €</b> à la mise en ligne</div></div></div>
      ${p.invoices.map((i) => `<div class="cx-inv ${i.status}"><span class="cx-fico" style="background:var(--surface)">${ic(i.status === 'paid' ? 'check' : 'cal')}</span><div class="cx-m"><b>${esc(i.label)}</b><small>${i.num ? esc(i.num) + ' · ' : ''}${i.status === 'paid' ? 'réglée le ' + dm(i.paidAt) : 'envoyée à la mise en ligne'}</small></div><div><div class="cx-amt">${money(i.ttc)} €</div>${i.status === 'paid' ? '<span class="cx-chip ok" style="margin-top:4px">Réglée</span>' : '<span class="cx-chip" style="margin-top:4px">Plus tard</span>'}</div></div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:auto"><button class="cx-btn sm cx-b-soft" style="flex:1">${ic('copy')}Copier l’IBAN</button><button class="cx-btn sm cx-b-soft" style="flex:1">${ic('down')}Factures</button></div></section>`;
    const cf = clientFiles.slice().sort((a, b) => new Date(b.at) - new Date(a.at));
    const cats = ['Images', 'Vidéos', 'Documents'].map((c) => [c, cf.filter((f) => f.cat === c)]);
    const envois = `<section class="cx-card c-1-8"><div class="cx-card-h"><h2>${ic('up')}${R('Vos', 'Tes')} envois</h2><div class="cx-tabs"><span class="on">Tous <em>${cf.length}</em></span>${cats.map(([c, l]) => `<span>${c} <em>${l.length}</em></span>`).join('')}</div></div>
      <div class="cx-ftiles">${cf.map((f) => `<div class="cx-ft"><div class="cx-fth ${f.cat === 'Vidéos' ? 'vid' : ''}">${ic(f.cat === 'Vidéos' ? 'play' : f.cat === 'Images' ? 'eye' : 'doc')}<span class="cx-ext">${ext(f.name)}</span>${f.seen === false ? '<span class="cx-chip hl cx-newf">Nouveau</span>' : ''}</div><b>${esc(f.name.replace(/\.[a-z0-9]+$/i, ''))}</b><small>${mo(f.size)} · ${dms(f.at)}</small></div>`).join('')}</div></section>`;
    const tot = cf.reduce((t, f) => t + f.size, 0), mx = Math.max(...cats.map(([, l]) => l.reduce((t, f) => t + f.size, 0)));
    const vol = `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('folder')}Déjà reçu</h2><span class="cx-aside">${mo(tot)} au total</span></div><div class="cx-vol">
      ${cats.sort((a, b) => b[1].reduce((t, f) => t + f.size, 0) - a[1].reduce((t, f) => t + f.size, 0)).map(([c, l], i) => { const s = l.reduce((t, f) => t + f.size, 0), d = Math.max(64, Math.round(150 * Math.sqrt(s / mx))); return `<div class="cx-c"><i class="k${i + 1}" style="width:${d}px;height:${d}px"><span><b>${mo(s)}</b></span></i><span>${c} · ${l.length}</span></div>`; }).join('')}</div></section>`;
    const ag = p.files.filter((f) => f.from === 'agence');
    const agence = `<section class="cx-card c-1-13"><div class="cx-card-h"><h2>${ic('doc')}Remis par l’agence</h2><span class="cx-aside">${ag.length} documents</span></div><ul class="cx-list">
      ${ag.map((f) => `<li><span class="cx-fico ${f.sign ? 'sig' : ''}">${ic(f.sign ? 'doc' : f.url ? 'figma' : f.cat === 'Facture' || f.cat === 'Devis' ? 'doc' : 'folder')}</span><div class="cx-m"><div class="cx-t">${esc(f.name)}</div><div class="cx-s">${esc(f.cat)} · ${dms(f.at)}${f.size ? ' · ' + mo(f.size) : ''}</div></div>${f.sign ? '<span class="cx-chip warn">À signer</span><button class="cx-btn sm cx-b-ink">Signer</button>' : f.url ? '<button class="cx-btn sm cx-b-soft">Ouvrir</button>' : `<button class="cx-iconbtn" aria-label="Télécharger">${ic('down')}</button>`}</li>`).join('')}</ul></section>`;
    return head('Fichiers et factures', `Ce que ${R('vous nous envoyez', 'tu nous envoies')} et ce que l’agence ${R('vous', 'te')} remet`, `<button class="cx-btn sm cx-b-ink">${ic('down')}Tout télécharger</button>`)
      + `<div class="cx-bento">${drop}${pay}${envois}${vol}${agence}</div>`;
  }

  const screens = { accueil, evolution, etapes, valider, fichiers };
  return nb(screens[o.screen || 'accueil']());
};
