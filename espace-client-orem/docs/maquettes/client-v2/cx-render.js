/* Prototype « Espace client » v2, injecté dans l'app pour les captures. Données réelles de l'API (projets d'exemple). */
window.cxMock = function (D, o = {}) {
  const p = D.p, team = D.team, byId = Object.fromEntries(team.map((u) => [u.id, u]));
  /* Texte : échappement HTML et espace insécable avant « : ; ! ? » quand la donnée l'a oubliée (« Suite à ta demande: »). */
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/([A-Za-zÀ-ÿ)»])([:;!?])(?=\s|$)/g, '$1 $2');
  const ic = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const rise = `<svg class="cx-rise" aria-hidden="true"><use href="#i-arrow"/></svg>`; // flèche montante (l'icône « up » est celle de l'envoi de fichier)
  const IMG = { louis: 'assets/louis.jpg', theophile: 'assets/theophile.jpg', clement: 'assets/clement.jpg' };
  const TU = p.registre === 'tu', R = (v, t) => (TU ? t : v), reg = (s) => Core.reg(s, p.registre);
  const first = (id) => (byId[id] ? byId[id].name.split(' ')[0] : id === 'client' ? R('Vous', 'Toi') : id === 'team' ? 'L’équipe Orem' : '');
  const av = (id, cls = 'cx-av') => id === 'client' ? `<span class="cx-you" title="${R('Vous', 'Toi')}">${esc((p.contactName || 'V')[0])}</span>` : byId[id] && IMG[byId[id].photo] ? `<img class="${cls}" src="${IMG[byId[id].photo]}" alt="">` : id === 'team' ? `<span class="cx-you cx-team-av">O</span>` : '';
  const DAY = 864e5, d0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }, today = d0(Date.now());
  const fmt = (d, opt) => new Intl.DateTimeFormat('fr-FR', opt).format(new Date(d));
  const dm = (d) => fmt(d, { day: 'numeric', month: 'long' }), dms = (d) => fmt(d, { day: 'numeric', month: 'short' });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const money = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
  const days = (d) => Math.round((d0(d) - today) / DAY);
  const hour = (d) => fmt(d, { hour: 'numeric' }).replace(/\s?h$/, '') + ' h' + (new Date(d).getMinutes() ? String(new Date(d).getMinutes()).padStart(2, '0') : '');
  const rel = (d) => { const n = days(d); return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : n === -1 ? 'hier' : 'le ' + dms(d); }; // « demain », jamais « avant demain » (= après-demain)
  const relC = (d) => cap(rel(d));
  const ago = (d) => { const n = days(d); return n === 0 ? 'Aujourd’hui' : n === -1 ? 'Hier' : dms(d); };
  const plural = (n, s, pl) => `${n} ${n > 1 ? pl || s + 's' : s}`;
  const iS = (it) => Core.itemState(p, it), pS = (ph) => Core.phaseState(p, ph), who = (it) => Core.itemWho(it);
  const items = p.phases.flatMap((ph) => ph.items);
  const leadId = (p.team && p.team.lead) || 'u_louis';
  const readyV = p.validations.filter((v) => v.status === 'ready');
  const toSign = p.files.filter((f) => f.sign && f.sign.status === 'requested');
  const clientFiles = p.files.filter((f) => f.from === 'client');
  const paid = p.invoices.filter((i) => i.status === 'paid').reduce((t, i) => t + i.ttc, 0);
  const total = p.billing.totalTTC || p.invoices.reduce((t, i) => t + i.ttc, 0);
  const lastLoom = p.messages.filter((m) => m.loom).sort((a, b) => new Date(b.at) - new Date(a.at))[0];
  const kpi = (l, icn, num, unit, foot, extra = '', cls = '') => `<div class="cx-kpi ${cls}"><div class="cx-l"><span>${l}</span><span class="cx-ico">${ic(icn)}</span></div><div class="cx-num m">${num}<small>${unit}</small></div>${extra}<div class="cx-d">${foot}</div></div>`;
  const head = (h1, sub, right = '') => `<div class="cx-head"><div><h1>${h1}</h1><p class="cx-sub">${sub}</p></div>${right ? `<div class="cx-head-r">${right}</div>` : ''}</div>`;
  const teamPill = () => `<span class="cx-pill" style="padding-left:6px"><span class="cx-avs">${(p.team.members || []).map((m) => av(m)).join('')}</span>${R('Votre', 'Ton')} équipe</span>`;
  const shortV = { 'Direction artistique et textes': 'DA et textes', 'Maquettes du site': 'Maquettes', 'Tests du site': 'Tests du site', 'Réception du site': 'Mise en ligne', 'Plan du site': 'Plan du site' };
  const nb = (h) => h.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');
  const andJoin = (a) => a.length > 1 ? a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1] : a[0] || '';
  const loomCard = (m, cls = '') => `<div class="cx-loom ${cls}"><span class="cx-th"><i>${ic('play')}</i>${m.by === 'team' ? '' : av(m.by, '')}</span><div><b>${esc(m.loom.title)}</b><span>${esc(first(m.by))} · vidéo de ${esc(m.loom.duration)}</span></div></div>`;

  /* ---------- Avancement O.R.E.M. (bandes, aujourd'hui, jalons) ---------- */
  function oremCard() {
    const n = p.phases.length, G = 6; // écart entre bandes, pris en compte dans les positions
    const W = p.phases.map((ph) => Math.max(5, Math.min(18, (d0(ph.to) - d0(ph.from)) / DAY + 1)));
    const tot = W.reduce((a, b) => a + b, 0);
    const pos = (d) => { const t = d0(d); let acc = 0; for (let i = 0; i < n; i++) { const a = d0(p.phases[i].from), b = d0(p.phases[i].to) + DAY; if (t < b || i === n - 1) { const f = Math.max(0, Math.min(1, (t - a) / (b - a))); return `calc((100% - ${G * (n - 1)}px) * ${((acc + f * W[i]) / tot).toFixed(4)} + ${i * G}px)`; } acc += W[i]; } return '100%'; };
    const bands = p.phases.map((ph, i) => { const st = pS(ph); return `<div class="cx-band ${st === 'done' ? 'done' : st === 'on' ? 'on' : 'wait'}" style="flex:${W[i]} 1 0"><span class="cx-lt">${ph.letter}</span><span class="cx-btxt"><span class="cx-bn">${esc(ph.t)}</span><span class="cx-bd">${dms(ph.from)} au ${dms(ph.to)}</span></span></div>`; }).join('');
    const V = p.validations, close = (i) => i > 0 && i < V.length && (d0(V[i].due) - d0(V[i - 1].due)) / DAY < 6;
    const miles = V.map((v, i) => { const end = i === V.length - 1; const cls = v.status === 'approved' ? 'ok' : v.status === 'ready' ? 'now' : ''; const side = close(i + 1) ? 'al' : close(i) ? 'ar' : ''; // deux jalons proches : étiquettes de part et d'autre, sur la même ligne
      return `<div class="cx-mile ${cls} ${end ? 'end' : ''} ${side}" style="left:${pos(v.due)}"><i></i><b>${esc(shortV[v.t] || v.t)}</b><span>${v.status === 'ready' ? relC(v.due) + ', ' + hour(v.due) : dms(v.due)}</span></div>`; }).join('');
    const mlist = V.slice(0, 5).map((v) => `<div class="cx-ml"><span class="cx-chip ${v.status === 'ready' ? 'hl' : ''}">${v.status === 'ready' ? relC(v.due) : dms(v.due)}</span>${esc(v.t)}</div>`).join('');
    const dn = items.filter((it) => iS(it) === 'done').length;
    const cur = p.phases[p.phase - 1];
    return `<section class="cx-card c-1-13 cx-orem"><div class="cx-card-h"><h2>${ic('map')}Où en est ${R('votre', 'ton')} projet</h2><span class="cx-aside cx-hide-s">Étape ${p.phase} sur 4 · <b style="color:var(--hl);font-weight:500">${esc(cur.t)}</b></span></div>
      <div class="cx-track"><div class="cx-bands">${bands}</div><div class="cx-today" style="left:${pos(today)}"><span>Aujourd’hui</span></div></div>
      <div class="cx-miles">${miles}</div><div class="cx-mlist"><b style="font-size:14px;font-weight:500">${R('Vos', 'Tes')} feux verts</b>${mlist}</div>
      <div class="cx-orem-ft"><span><b>${dn} livrables faits</b> sur ${items.length}</span><div class="cx-pbar thin"><i style="width:${(dn / items.length) * 100}%"></i></div><span class="cx-lg cx-hide-s"><i></i>Fait</span><span class="cx-lg cx-hide-s"><i class="hl"></i>En cours</span><span class="cx-lg cx-hide-s"><i class="w"></i>À venir</span><span class="cx-lg cx-hide-s"><i class="dia"></i>${R('Votre', 'Ton')} feu vert</span></div></section>`;
  }

  /* ---------- 1. Accueil pendant le projet ---------- */
  function accueil() {
    const v = readyV[0], nDec = readyV.length + toSign.length, todo = nDec + (p.missing || []).length;
    const golive = days(p.golive), span = Math.max(1, Math.round((d0(p.golive) - d0(p.start)) / DAY)), passed = span - golive;
    const nextPh = p.phases[p.phase];
    const ink = `<section class="cx-ink c-1-7 cx-r2"><div class="cx-eyebrow"><span>${R('Votre', 'Ta')} prochaine action${v ? ' · ' + rel(v.due) + ', ' + hour(v.due) : ''}</span>${todo > 1 ? `<span class="cx-of">Action 1 sur ${todo}</span>` : ''}</div>
      <h2>${esc(p.next.title)}</h2><p>${esc(p.next.text)}</p>${lastLoom ? loomCard(lastLoom) : ''}
      <div class="cx-acts"><button class="cx-btn cx-b-light">${ic(p.next.go === 'valider' ? 'check' : p.next.go === 'cal' ? 'cal' : 'arrow')}${{ valider: 'Voir et valider', cal: 'Choisir un créneau', proposition: 'Lire la proposition', fichiers: 'Déposer les fichiers' }[p.next.go] || 'Y aller'}</button>${lastLoom ? `<button class="cx-btn cx-b-glass">${ic('play')}Regarder la vidéo</button>` : ''}</div>
      ${nextPh ? `<div class="cx-then">${ic('arrow')}<span>Ensuite : <b>${esc(nextPh.items[0].t)}</b>, avec ${esc(first(who(nextPh.items[0])[0][0]))}</span></div>` : ''}</section>`;
    const dots = Array.from({ length: span }, (_, i) => `<i class="${i < passed ? 'p' : i === passed ? 't' : ''}"></i>`).join('');
    /* 4e chiffre : « Reste à régler » seulement si une facture est due ; sinon le prochain rendez-vous, sinon les messages non lus. */
    const due = p.invoices.filter((i) => i.status === 'due'), mt = p.meeting && p.meeting.when && days(p.meeting.when) >= 0 ? p.meeting : null;
    const unreadN = p.messages.filter((m) => m.fromAgency && m.readByClient === false).length;
    const k4 = due.length ? kpi('À régler', 'doc', money(due.reduce((t, i) => t + i.ttc, 0)), '€', `<span class="cx-trend warn">${ic('cal')}À régler</span>TTC · ${esc(due[0].label)}`)
      : mt ? kpi('Prochain point', 'cal', fmt(mt.when, { day: 'numeric' }), fmt(mt.when, { month: 'short' }), `<span class="cx-trend flat">${cap(fmt(mt.when, { weekday: 'long' }))}, ${hour(mt.when)}</span>${esc(mt.title.replace(/\s*\(.*\)$/, ''))} avec ${esc(first(leadId))}`)
      : kpi('Messages non lus', 'chat', unreadN, unreadN > 1 ? 'messages' : 'message', unreadN ? 'De l’équipe' : 'Tout est lu');
    const kpis = `<div class="cx-kpis c-8-13 cx-r2">
      ${kpi('Mise en ligne', 'globe', golive, golive > 1 ? 'jours' : 'jour', `Le ${dm(p.golive)}`, `<div class="cx-days">${dots}</div>`)}
      ${kpi('À valider', 'ok', nDec, nDec > 1 ? 'décisions' : 'décision', v ? `<span class="cx-trend hl">${ic('cal')}${relC(v.due)}, ${hour(v.due)}</span>pour le ${esc(v.t.toLowerCase())}` : nDec ? 'Sans date limite' : 'Rien pour l’instant')}
      ${kpi('Fichiers reçus', 'folder', clientFiles.length, clientFiles.length > 1 ? 'fichiers' : 'fichier', (p.missing || []).length ? `<span class="cx-trend warn">Il en manque ${(p.missing || []).length}</span>` : 'Tout est là')}
      ${k4}</div>`;
    /* Ce qui arrive ensuite : les livrables qui tombent le même jour pour le même feu vert sont regroupés (plus de trois « 26 oct. » à la suite). */
    const groups = [];
    for (const it of items.filter((x) => iS(x) === 'wait').sort((a, b) => new Date(a.due) - new Date(b.due))) {
      let g = groups.find((x) => x.k === d0(it.due) && x.val === (it.val || ''));
      if (!g) { if (groups.length >= 3) break; g = { k: d0(it.due), val: it.val || '', its: [] }; groups.push(g); }
      g.its.push(it);
    }
    const row = (g) => { const it = g.its[0], ag = [...new Set(g.its.flatMap((x) => who(x).map(([w]) => w)).filter((w) => w !== 'client'))], vv = p.validations.find((x) => x.key === g.val);
      const t = g.its.length > 1 && vv ? vv.t : it.t, w0 = who(it)[0], s = g.its.length > 1 ? `${andJoin(ag.map(first))} · ${R('votre', 'ton')} feu vert` : w0[0] === 'client' ? reg(w0[1]) : `${first(w0[0])} ${reg(w0[1])}`;
      return `<li><span class="cx-cal"><small>${fmt(it.due, { month: 'short' }).replace('.', '')}</small><b>${fmt(it.due, { day: 'numeric' })}</b></span><div class="cx-m"><div class="cx-t">${esc(t)}</div><div class="cx-s">${esc(s)}</div></div><span class="cx-avs">${ag.map((w) => av(w)).join('')}</span></li>`; };
    const ensuite = `<section class="cx-card c-1-5"><div class="cx-card-h"><h2>${ic('cal')}Ce qui arrive ensuite</h2></div><ul class="cx-list">
      ${mt && due.length ? `<li><span class="cx-cal hl"><small>${fmt(mt.when, { month: 'short' }).replace('.', '')}</small><b>${fmt(mt.when, { day: 'numeric' })}</b></span><div class="cx-m"><div class="cx-t">${esc(mt.title)}</div><div class="cx-s">${cap(fmt(mt.when, { weekday: 'long' }))}, ${hour(mt.when)} · avec ${esc(first(leadId))}</div></div></li>` : ''}
      ${groups.map(row).join('')}</ul></section>`;
    const equipe = `<section class="cx-card c-5-9"><div class="cx-card-h"><h2>${ic('team')}${R('Votre', 'Ton')} équipe</h2></div><div class="cx-team">
      ${(p.team.members || []).map((id) => { const u = byId[id]; return `<div class="cx-person ${id === leadId ? 'lead' : ''}">${av(id, '')}<div style="min-width:0"><b>${esc(u.name.split(' ')[0])}${id === leadId ? `<span class="cx-chip ink">${R('Votre', 'Ton')} contact</span>` : ''}</b><span>${esc(u.title)}</span></div></div>`; }).join('')}</div>
      <div class="cx-duo"><button class="cx-btn sm cx-b-ink">${ic('chat')}Écrire</button><button class="cx-btn sm cx-b-soft">${ic('cal')}Réserver un appel</button></div></section>`;
    const msgs = p.messages.slice().sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 1);
    const cut = (t, n) => t.length > n ? t.slice(0, t.lastIndexOf(' ', n - 4)) + '…' : t;
    const echanges = `<section class="cx-card c-9-13"><div class="cx-card-h"><h2>${ic('chat')}Derniers messages</h2>${unreadN ? `<span class="cx-aside">${plural(unreadN, 'non lu')}</span>` : ''}</div><div class="cx-thread">
      ${p.note && p.note.text ? `<div class="cx-msg">${av(p.note.by, '')}<div class="cx-bubble"><div class="cx-who"><b>${esc(first(p.note.by))}<span class="cx-pin">Épinglé</span></b><span>${ago(p.note.at)}</span></div>${esc(cut(p.note.text, 120))}</div></div>` : ''}
      ${msgs.map((m) => `<div class="cx-msg">${av(m.by, '')}<div class="cx-bubble"><div class="cx-who"><b>${esc(first(m.by))} ${m.readByClient === false ? '<span class="cx-new" title="Non lu"></span>' : ''}</b><span>${ago(m.at)}</span></div>${esc(m.text)}</div></div>`).join('')}</div>
      <div class="cx-reply"><span>Répondre à l’équipe…</span><i>${ic('arrow')}</i></div></section>`;
    return head(`Bonjour ${esc(p.contactName)}`, `${cap(fmt(today, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${esc(p.projet)}`)
      + `<div class="cx-bento">${ink}${kpis}${oremCard()}${ensuite}${equipe}${echanges}</div>`;
  }

  /* ---------- 2. Accueil d'un projet livré : Évolution ---------- */
  function evolution() {
    const e = p.evo, rp = e.reports[0], hist = e.reports.slice().reverse();
    const pr = (p.proposals || []).find((x) => x.status === 'sent');
    const num = (s) => Number(String(s).replace(/[\s  ~]/g, '').replace(',', '.'));
    const lbl = (r) => cap(fmt(r.month + '-15', { month: 'short' }).replace('.', ''));
    const ink = pr ? `<section class="cx-ink c-1-8"><div class="cx-eyebrow"><span>Ta prochaine action</span><span class="cx-of">Valable jusqu’au ${dm(pr.validUntil)}</span></div>
      <h2>${esc(cap(pr.title.replace(/^Demande : /, '')))}</h2><p>${esc(pr.intro)}</p>
      <div class="cx-price"><span class="cx-num" style="font-size:56px;color:#f4f4f6">${money(pr.lines.reduce((t, l) => t + l.ht, 0))}<small style="color:rgba(244,244,246,.72)">€ HT</small></span><span>Devis ${esc(pr.quote)}, envoyé par Louis le ${dm(pr.sentAt)}</span></div>
      <div class="cx-acts"><button class="cx-btn cx-b-light">${ic('doc')}Lire et accepter</button><button class="cx-btn cx-b-glass">${ic('chat')}Poser une question</button></div></section>` : '';
    const m = e.meeting.when, dur = (e.meeting.mode.match(/\((\d+) min\)/) || [, ''])[1];
    /* Date lisible dans l'ordre naturel : « Samedi 24 octobre », puis l'heure ; le calendrier reprend le jour en grand. */
    const visio = `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('cal')}Prochaine visio de pilotage</h2><span class="cx-chip hl">Dans ${plural(days(m), 'jour')}</span></div>
      <div class="cx-visio"><span class="cx-bigcal"><small>${fmt(m, { month: 'short' }).replace('.', '')}</small><b>${fmt(m, { day: 'numeric' })}</b><em>${fmt(m, { weekday: 'short' }).replace('.', '')}</em></span><div class="cx-dm"><b>${cap(fmt(m, { weekday: 'long', day: 'numeric', month: 'long' }))}</b><span class="cx-when">${hour(m)}${dur ? ` · ${dur} min en visio` : ''}</span>On lit les chiffres du mois et on décide des priorités.</div></div>
      <div class="cx-visio-ft"><span class="cx-avs">${av('u_louis')}${av('u_theo')}</span><span>Louis présente les chiffres, Théophile propose les priorités</span></div>
      <button class="cx-btn sm cx-b-soft">Demander un autre créneau</button></section>`;
    const serie = (k) => hist.map((r) => num(r.stats[k][0]));
    /* Barres proportionnelles depuis zéro (plus de hauteur de base qui écrasait les écarts). */
    const bars = (k) => { const s = serie(k), mx = Math.max(...s); return `<div class="cx-hbars">${s.map((v, i) => `<div class="cx-c ${i === s.length - 1 ? 'on' : ''}"><div class="cx-bar" style="height:${Math.round((v / mx) * 64)}px"></div><span>${lbl(hist[i])}</span></div>`).join('')}</div>`; };
    const circles = (k) => { const s = serie(k), mx = Math.max(...s); return `<div class="cx-circles">${s.map((v, i) => `<div class="cx-c ${i === s.length - 1 ? 'on' : ''}"><i style="width:${Math.round(68 * Math.sqrt(v / mx))}px;height:${Math.round(68 * Math.sqrt(v / mx))}px">${v}</i><span>${lbl(hist[i])}</span></div>`).join('')}</div>`; };
    const ladder = (k) => { const s = serie(k); return `<div class="cx-ladder">${s.map((v, i) => `<div class="cx-rw ${i === s.length - 1 ? 'on' : ''}"><span>${lbl(hist[i])}</span><span class="cx-rail"><b style="left:${(100 - (v - 1) / 9 * 100).toFixed(1)}%"></b></span><span class="cx-v">${String(v).replace('.', ',')}</span></div>`).join('')}<div class="cx-rw" style="font-size:11px"><span></span><span style="display:flex;justify-content:space-between"><span>10<sup>e</sup></span><span>1<sup>re</sup> place</span></span><span></span></div></div>`; };
    const tr = (s) => { const t = s.replace(/ sur \S+$/, ''); return `<span class="cx-trend">${rise}${esc(t)}</span><span>sur ${esc(s.split(' sur ')[1] || '')}</span>`; };
    const st = rp.stats;
    const stat = (k, cls, icn, viz, trend) => `<div class="cx-kpi ${cls}"><div class="cx-l"><span>${cap(esc(st[k][1]))}</span><span class="cx-ico">${icn}</span></div><div class="cx-num m">${esc(st[k][0])}</div>${viz}<div class="cx-d">${trend}</div></div>`;
    const kp = `<div class="c-1-13 cx-sec"><h2>${cap(fmt(rp.month + '-15', { month: 'long' }))} en chiffres</h2><span>Bilan reçu le ${dm(rp.at)}</span></div>
      ${stat(0, 'c-1-4', ic('eye'), bars(0), tr(st[0][2]))}${stat(1, 'c-4-7', ic('mail'), circles(1), tr(st[1][2]))}${stat(2, 'c-7-10', ic('globe'), bars(2), tr(st[2][2]))}
      ${stat(3, 'c-10-13', ic('map'), ladder(3), `<span class="cx-trend">${rise}${esc(st[3][2].replace('gagne ', '+'))}</span><span>sur ${esc(fmt(hist[hist.length - 2].month + '-15', { month: 'long' }))}</span>`)}`;
    const bilan = `<section class="cx-card c-1-7b"><div class="cx-card-h"><h2>${ic('doc')}Le bilan du mois</h2><span class="cx-aside">${cap(fmt(rp.month + '-15', { month: 'long', year: 'numeric' }))}</span></div>
      <p class="cx-rp-title">${esc(rp.title)}</p><p style="font-size:14px;color:var(--muted)">${esc(rp.summary)}</p>
      <b style="font-size:14px;font-weight:500;margin-top:4px">Le travail réalisé</b><ul class="cx-done-l">${rp.done.map(([t, s]) => `<li><i>${ic('check')}</i><div>${esc(t)}<small>${esc(s)}</small></div></li>`).join('')}</ul>
      <div class="cx-duo" style="align-items:center"><button class="cx-btn sm cx-b-ink" style="flex:none">${ic('eye')}Consulter le bilan</button><button class="cx-btn sm cx-b-soft" style="flex:none">${ic('down')}PDF</button><button class="cx-link" style="margin-left:auto">Bilans précédents ${ic('arrow')}</button></div></section>`;
    const ax = e.axes, adone = ax.filter((a) => a.status === 'done').length;
    const axes = `<section class="cx-card c-7-13"><div class="cx-card-h"><h2>${ic('ok')}Les axes du mois</h2><span class="cx-aside">${adone} ${adone > 1 ? 'faits' : 'fait'} sur ${ax.length}</span></div>
      <div class="cx-pbar">${ax.slice().sort((a, b) => (a.status === 'done' ? -1 : b.status === 'done' ? 1 : a.status === 'on' ? -1 : 1)).map((a) => `<i class="${a.status === 'done' ? '' : a.status === 'on' ? 'hl' : 'hatch'}" style="flex:1"></i>`).join('')}</div>
      <ul class="cx-axes">${ax.map((a) => `<li class="${a.priority ? 'pri' : ''} ${a.status}">${av(a.who, '')}<div style="min-width:0"><div class="cx-t">${esc(a.t)}</div><div class="cx-s">${esc(first(a.who))} · ${a.status === 'done' ? 'fait' : 'prévu le ' + dm(a.due)}</div></div>${a.status === 'done' ? '<span class="cx-chip ok">Fait</span>' : a.status === 'on' ? '<span class="cx-chip hl">En cours</span>' : '<span class="cx-chip">Prévu</span>'}</li>`).join('')}</ul></section>`;
    const r = p.results, pct = parseInt(r.stats[3][0], 10);
    /* « ~5 » devient « 5 », et la légende le dit en toutes lettres (en moyenne). */
    const resN = ([n, l]) => /^~/.test(n) ? [n.slice(1), l + ', en moyenne'] : [n, l];
    const res = `<section class="cx-card c-1-7b"><div class="cx-card-h"><h2>${rise}Depuis la mise en ligne</h2><span class="cx-aside">Depuis le ${dm(p.deliveredAt)}</span></div>
      <div style="display:flex;align-items:center;gap:20px"><span class="cx-num">${pct}<small>%</small></span><span style="font-size:14px;color:var(--muted);line-height:1.4">${esc(r.stats[3][1].replace(/^du/, 'Du'))}, sans budget média</span></div>
      <div class="cx-dotm" role="img" aria-label="${pct} points sur 100">${Array.from({ length: 100 }, (_, i) => `<i class="${i < pct ? 'on' : ''}"></i>`).join('')}</div>
      <div class="cx-res" style="padding-top:14px;border-top:1px solid var(--line)">${r.stats.slice(0, 3).map(resN).map(([n, l]) => `<div><span class="cx-num">${esc(n)}</span><span>${esc(l)}</span></div>`).join('')}</div></section>`;
    const months = `<section class="cx-card c-7-13"><div class="cx-card-h"><h2>${ic('map')}Les mois suivants</h2></div><div class="cx-months" style="grid-template-columns:1fr">${e.next.map(([mo, t]) => `<div><b>${esc(mo)}</b><small>${esc(t)}</small></div>`).join('')}</div></section>`;
    return head(`Bonjour ${esc(p.contactName)}`, `Ton site est en ligne depuis le <b>${fmt(p.deliveredAt, { day: 'numeric', month: 'long' })}</b> · Évolution depuis le ${dm(e.since)}`, `<span class="cx-pill">${ic('globe')}huchet-demorge.fr</span>${teamPill()}`)
      + `<div class="cx-bento">${ink}${visio}${kp}${bilan}${axes}${res}${months}</div>`;
  }

  /* ---------- 3. Étapes ---------- */
  function etapes() {
    const a = d0(p.phases[0].from), b = d0(p.phases[3].to) + DAY, P = (d) => ((d0(d) - a) / (b - a)) * 100;
    const ticks = Array.from({ length: 6 }, (_, i) => a + ((b - a) * i) / 5);
    const rows = p.phases.map((ph) => { const st = pS(ph); return `<div class="cx-gl"><span class="cx-ltr ${st === 'on' ? 'hl' : ''}">${ph.letter}</span><div><b>${esc(ph.t)}</b><span>${dms(ph.from)} au ${dms(ph.to)}</span></div></div>
      <div class="cx-lane"><div class="cx-gb ${st}" style="left:${P(ph.from)}%;width:${P(d0(ph.to) + DAY) - P(ph.from)}%"><span class="cx-gtx">${ph.items.length} livrables</span></div>${[...new Set(ph.items.filter((it) => it.val).map((it) => it.val))].map((k) => { const v = p.validations.find((x) => x.key === k); return `<span class="cx-gdia ${v.status === 'ready' ? 'now' : ''}" style="left:${P(v.due)}%" title="${esc(v.t)}"></span>`; }).join('')}</div>`; }).join('');
    const gantt = `<section class="cx-card c-1-13"><div class="cx-card-h"><h2>${ic('cal')}Le planning</h2><span class="cx-aside">Dates indicatives, ajustées ensemble · <i class="cx-dia-k"></i> ${R('votre', 'ton')} feu vert</span></div>
      <div class="cx-gantt" style="margin-top:28px">${rows}<div class="cx-gscale">${ticks.map((t) => `<span>${dms(t)}</span>`).join('')}</div>
      <div class="cx-gtoday" style="left:calc(200px + (100% - 200px) * ${(P(today) / 100).toFixed(4)})"><span>Aujourd’hui</span></div></div></section>`;
    const ph = p.phases[p.phase - 1], dn = ph.items.filter((it) => iS(it) === 'done').length, nx = p.phases[p.phase];
    const whoLine = (it) => who(it).map(([id, t]) => `<span>${av(id)}<span>${id === 'client' ? `<b>${esc(reg(t).split(' ')[0])}</b> ${esc(reg(t).split(' ').slice(1).join(' '))}` : `<b>${esc(first(id))}</b> ${esc(reg(t))}`}</span></span>`).join('');
    const rv = readyV[0];
    const now = `<section class="cx-card c-1-9"><div class="cx-phase-now"><div class="cx-pn-l"><span class="cx-chip hl" style="align-self:flex-start">En cours</span><span class="cx-big-l">${ph.letter}</span><div><b style="font-size:24px;font-weight:500">${esc(ph.t)}</b><p style="font-size:14px;color:var(--muted);margin-top:6px">${esc(reg(ph.txt))}</p></div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:18px">${nx ? `<div class="cx-after"><span class="cx-ltr">${nx.letter}</span><div><small>Ensuite, à partir du ${dm(nx.from)}</small><b>${esc(nx.t)}</b></div></div>` : ''}
      <div><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:8px"><span><b style="color:var(--fg);font-weight:500">${dn} sur ${ph.items.length}</b> faits</span><span>Fin le ${dm(ph.to)}</span></div><div class="cx-pbar">${ph.items.map((it) => `<i class="${iS(it) === 'done' ? '' : iS(it) === 'review' ? 'hl' : 'hatch'}" style="flex:1"></i>`).join('')}</div></div></div></div>
      <ul class="cx-deliv">${ph.items.map((it) => { const s = iS(it); return `<li class="${s}"><span class="cx-st">${ic(s === 'done' ? 'check' : s === 'review' ? 'eye' : 'cal')}</span><div style="min-width:0"><div class="cx-t">${esc(it.t)}</div><div class="cx-who">${whoLine(it)}</div></div><div class="cx-r">${s === 'done' ? '<span class="cx-chip ok">Fait</span>' : s === 'review' ? `<small>${rv ? relC(rv.due) + ', ' + hour(rv.due) : ''}</small><button class="cx-btn sm cx-b-ink">${ic('check')}Voir et valider</button>` : `<span class="cx-chip">${dms(it.due)}</span>`}${s === 'done' ? `<small>${dms(it.due)}</small>` : ''}</div></li>`; }).join('')}</ul></div></section>`;
    const ppl = ['u_louis', 'u_theo', 'u_clement', 'client'].map((id) => { const mine = items.filter((it) => who(it).some(([w]) => w === id)); return [id, mine]; });
    const whos = `<section class="cx-card c-9-13"><div class="cx-card-h"><h2>${ic('team')}Qui fait quoi</h2><span class="cx-aside">Sur tout le projet</span></div><div class="cx-whos">
      ${ppl.map(([id, mine]) => `<div class="cx-wr">${av(id)}<b>${id === 'client' ? R('Vous', 'Toi') : esc(first(id))}</b><span class="cx-n">${mine.length}</span><div class="cx-pdots">${mine.map((it) => `<i class="${iS(it) === 'done' ? 'd' : iS(it) === 'review' ? 'r' : ''}"></i>`).join('')}</div></div>`).join('')}</div>
      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:4px"><b style="font-size:14px;font-weight:500">${R('Vos', 'Tes')} 3 prochaines actions</b><ul class="cx-mini" style="margin-top:6px">${items.filter((it) => iS(it) !== 'done' && who(it).some(([w]) => w === 'client')).slice(0, 3).map((it) => { const s = iS(it); return `<li><div class="cx-m">${esc(it.t.replace(/ \(.*\)$/, ''))}<small>${esc(reg(who(it).find(([w]) => w === 'client')[1]))}</small></div><span class="cx-chip ${s === 'review' ? 'hl' : ''}">${s === 'review' && rv ? relC(rv.due) : dms(it.due)}</span></li>`; }).join('')}</ul></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--muted);margin-top:auto"><span class="cx-lg"><i style="border-radius:50%"></i>Fait</span><span class="cx-lg"><i class="hl" style="border-radius:50%"></i>À valider</span><span class="cx-lg"><i class="w" style="border-radius:50%"></i>À venir</span></div></section>`;
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
    const nDec = readyV.length + toSign.length;
    const feat = `<section class="cx-card cx-val c-1-13"><div class="cx-prev"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="cx-chip">${ic('figma')}Prototype Figma · version 1</span><button class="cx-link" aria-label="Ouvrir le prototype en grand">Ouvrir en grand ${ic('arrow')}</button></div>
      <div class="cx-frame"><div class="cx-fb"><i></i><i></i><i></i><span>${ic('lock')}${esc(p.client)} · ${esc(v.t)}</span></div>${tree}</div>
      ${lastLoom ? `<div class="cx-loom cx-loom-l"><span class="cx-th"><i>${ic('play')}</i>${av(lastLoom.by, '')}</span><div><b>${esc(lastLoom.loom.title)}</b><span>Par ${esc(first(lastLoom.by))}, page par page · ${esc(lastLoom.loom.duration)}</span></div><button class="cx-btn sm cx-b-ink" style="margin-left:auto">${ic('play')}Regarder</button></div>` : ''}</div>
      <div class="cx-dec"><span class="cx-chip hl" style="align-self:flex-start">${nDec > 1 ? `Décision 1 sur ${nDec} · ` : ''}En attente de ${R('votre', 'ton')} feu vert</span><h2>${esc(v.t)}</h2><p style="font-size:15px;color:var(--fg-2)">${esc(v.sub)}. Prêt depuis le ${dm(v.readyAt)}, préparé par ${esc(first(maker))}.</p>
      <div class="cx-count"><span class="cx-num">${hrs}</span><div><b>heures pour répondre</b>${relC(v.due)}, ${hour(v.due)}</div></div>
      <div class="cx-count cx-count-l"><span class="cx-ltr hl">R</span><div><b>Après ${R('votre', 'ton')} feu vert</b>La direction artistique démarre, avec Clément.</div></div>
      <div class="cx-acts"><button class="cx-btn cx-b-ink">${ic('check')}Valider le plan du site</button><button class="cx-btn cx-b-line">Demander des modifications</button></div>
      <p class="cx-legal">Valider, c’est donner ${R('votre', 'ton')} feu vert écrit pour passer à la suite. Il est enregistré avec la date et l’heure.</p></div></section>`;
    const f = toSign[0];
    const sign = f ? `<section class="cx-card c-1-13"><div class="cx-sign"><span class="cx-pdf"><b>PDF</b></span><div style="flex:1;min-width:0"><span class="cx-chip warn" style="margin-bottom:6px">Décision ${readyV.length + 1} sur ${nDec} · à signer</span><div style="font-size:17px;font-weight:500">${esc(f.sign.label)}</div><div style="font-size:13px;color:var(--muted)">${esc(f.name)} · envoyé le ${dm(f.sign.at)} par ${esc(first(f.sign.by))} · signature en ligne en 1 minute</div></div><button class="cx-btn sm cx-b-soft">${ic('eye')}Lire</button><button class="cx-btn sm cx-b-ink">Signer</button></div></section>` : '';
    const nOk = p.validations.filter((x) => x.status === 'approved').length;
    const steps = `<section class="cx-card c-1-13"><div class="cx-card-h"><h2>${ic('ok')}Les feux verts du projet</h2><span class="cx-aside">${nOk} sur ${p.validations.length} ${nOk > 1 ? 'donnés' : 'donné'}</span></div><div class="cx-steps">
      ${p.validations.map((x, i) => `<div class="cx-step ${x.status === 'ready' ? 'now' : x.status === 'approved' ? '' : 'lock'}"><span class="cx-sn">${i + 1}</span><b>${esc(x.t)}</b><small>${x.status === 'ready' ? `${ic('cal')}Maintenant` : `${ic('lock')}Vers le ${dms(x.due)}`}</small></div>`).join('')}</div></section>`;
    return head('À valider', `<b>${plural(nDec, 'décision')}</b> ${nDec > 1 ? R('vous attendent', 't’attendent') : R('vous attend', 't’attend')}. On avance avec ${R('votre', 'ton')} feu vert.`, `<span class="cx-pill">${ic('ok')}${nOk} ${nOk > 1 ? 'feux verts donnés' : 'feu vert donné'} sur ${p.validations.length}</span>`)
      + `<div class="cx-bento">${feat}${sign}${steps}</div>`;
  }

  /* ---------- 5. Fichiers et factures ---------- */
  function fichiers() {
    const mo = (n) => n >= 1e6 ? (n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: n >= 1e8 ? 0 : 1 }) + '\u00a0Mo' : Math.round(n / 1e3) + '\u00a0Ko';
    const ext = (n) => (n.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toUpperCase();
    const base = (n) => n.replace(/\.[a-z0-9]+$/i, '');
    const drop = `<section class="cx-drop c-1-8"><div class="cx-dz"><span class="cx-up">${ic('up')}</span><div><h2>Glissez ${R('vos', 'tes')} fichiers ici</h2><p>Photos, vidéos, textes, dossiers entiers. Aucune limite de taille, l’envoi reprend tout seul si la connexion coupe.</p></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px;font-weight:500">Ce qu’il nous manque</b><span class="cx-chip warn">${plural(p.missing.length, 'élément')}</span></div>
      <div class="cx-miss">${p.missing.map((m) => `<div><span class="cx-fico">${ic('folder')}</span><div class="cx-m"><b>${esc(m.t)}</b><small>${esc(m.sub)}</small></div><button class="cx-btn sm cx-b-ink" style="padding:0 14px">Déposer</button></div>`).join('')}</div><div style="display:flex;align-items:center;gap:12px;margin-top:auto;flex-wrap:wrap"><button class="cx-btn sm cx-b-soft">${ic('folder')}Déposer un dossier entier</button><span style="font-size:13px;color:var(--muted)">Les sous-dossiers sont conservés.</span></div></section>`;
    const pct = Math.round((paid / total) * 100), C = 2 * Math.PI * 56;
    const fut = p.invoices.filter((i) => i.status !== 'paid').reduce((t, i) => t + i.ttc, 0);
    const pay = `<section class="cx-card c-8-13 cx-pay"><div class="cx-card-h"><h2>${ic('doc')}Paiements</h2><span class="cx-aside">Devis ${esc(p.billing.quote)} signé</span></div>
      <div style="display:flex;align-items:center;gap:20px"><div class="cx-ring" role="img" aria-label="${pct} % réglé"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="56" fill="none" stroke="var(--surface-2)" stroke-width="16"/><circle cx="66" cy="66" r="56" fill="none" stroke="var(--fg)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(C * pct) / 100} ${C}"/></svg><div><span><b>${pct} %</b><small>réglé</small></span></div></div>
      <div style="display:flex;flex-direction:column;gap:10px"><div><div class="cx-num" style="font-size:40px">${money(paid)}<small>€ TTC réglés</small></div></div><div style="font-size:14px;color:var(--muted)">sur ${money(total)} € TTC au total<br>Solde de <b style="color:var(--fg);font-weight:500">${money(fut)} €</b> à la mise en ligne</div></div></div>
      ${p.invoices.map((i) => `<div class="cx-inv ${i.status}"><span class="cx-fico" style="background:var(--surface)">${ic(i.status === 'paid' ? 'check' : 'cal')}</span><div class="cx-m"><b>${esc(i.label)}</b><small>${i.num ? esc(i.num) + ' · ' : ''}${i.status === 'paid' ? 'réglée le ' + dm(i.paidAt) : i.status === 'due' ? 'à régler' : 'sera envoyée à la mise en ligne'}</small></div><div><div class="cx-amt">${money(i.ttc)} €</div>${i.status === 'paid' ? '<span class="cx-chip ok" style="margin-top:4px">Réglée</span>' : i.status === 'due' ? '<span class="cx-chip warn" style="margin-top:4px">À régler</span>' : '<span class="cx-chip" style="margin-top:4px">À venir</span>'}</div></div>`).join('')}
      <div class="cx-duo"><button class="cx-btn sm cx-b-soft">${ic('copy')}Copier l’IBAN</button><button class="cx-btn sm cx-b-soft">${ic('down')}Factures</button></div></section>`;
    const cf = clientFiles.slice().sort((a, b) => new Date(b.at) - new Date(a.at));
    const cats = ['Images', 'Vidéos', 'Documents'].map((c) => [c, cf.filter((f) => f.cat === c)]);
    const inner = (n) => (n.match(/\((\d+) fichiers\)/) || [, 0])[1];
    const envois = `<section class="cx-card c-1-8"><div class="cx-card-h cx-wrap-h"><h2>${ic('up')}${R('Vos', 'Tes')} envois</h2><div class="cx-tabs"><span class="on">Tous <em>${cf.length}</em></span>${cats.map(([c, l]) => `<span>${c} <em>${l.length}</em></span>`).join('')}</div></div>
      <div class="cx-ftiles">${cf.map((f) => `<div class="cx-ft"><div class="cx-fth ${f.cat === 'Vidéos' ? 'vid' : ''}">${ic(f.cat === 'Vidéos' ? 'play' : f.cat === 'Images' ? 'eye' : 'doc')}<span class="cx-ext">${ext(f.name)}</span>${f.seen === false ? '<span class="cx-chip hl cx-newf">Nouveau</span>' : ''}</div><b>${esc(base(f.name).replace(/\s*\(\d+ fichiers\)/, ''))}</b><small>${inner(f.name) ? inner(f.name) + ' fichiers · ' : ''}${mo(f.size)} · ${dms(f.at)}</small></div>`).join('')}</div></section>`;
    /* Volume reçu : une barre empilée proportionnelle (les cercles gonflaient artificiellement les 4 Mo de documents). */
    const tot = cf.reduce((t, f) => t + f.size, 0);
    const vc = cats.map(([c, l]) => [c, l, l.reduce((t, f) => t + f.size, 0)]).sort((a, b) => b[2] - a[2]);
    const vol = `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('folder')}Déjà reçu</h2></div>
      <div class="cx-num" style="font-size:56px">${mo(tot).replace(/\u00a0(Mo|Ko)$/, '<small>$1 au total</small>')}</div>
      <div class="cx-stack" role="img" aria-label="Répartition par type">${vc.map(([, , s], i) => `<i class="k${i + 1}" style="flex:${s} 1 0"></i>`).join('')}</div>
      <ul class="cx-vleg">${vc.map(([c, l, s], i) => `<li><i class="k${i + 1}"></i><span>${c}</span><small>${plural(l.length, 'fichier')}</small><b>${mo(s)}</b></li>`).join('')}</ul></section>`;
    const ag = p.files.filter((f) => f.from === 'agence');
    const agence = `<section class="cx-card c-1-13"><div class="cx-card-h"><h2>${ic('doc')}Remis par l’agence</h2><span class="cx-aside">${plural(ag.length, 'document')}</span></div><ul class="cx-list">
      ${ag.map((f) => `<li><span class="cx-fico ${f.sign ? 'sig' : ''}">${ic(f.url ? 'figma' : 'doc')}</span><div class="cx-m"><div class="cx-t">${esc(base(f.name))}</div><div class="cx-s">${esc(f.cat)} · ${dms(f.at)}${ext(f.name) ? ' · ' + ext(f.name) : f.url ? ' · Figma' : ''}${f.size ? ' · ' + mo(f.size) : ''}</div></div>${f.sign ? '<span class="cx-chip warn">À signer</span><button class="cx-btn sm cx-b-ink">Signer</button>' : f.url ? '<button class="cx-btn sm cx-b-soft">Ouvrir</button>' : `<button class="cx-iconbtn" aria-label="Télécharger ${esc(base(f.name))}">${ic('down')}</button>`}</li>`).join('')}</ul></section>`;
    return head('Fichiers et factures', `Ce que ${R('vous nous envoyez', 'tu nous envoies')} et ce que l’agence ${R('vous', 'te')} remet`, `<button class="cx-btn sm cx-b-ink">${ic('down')}Tout télécharger</button>`)
      + `<div class="cx-bento">${drop}${pay}${envois}${vol}${agence}</div>`;
  }

  /* ---------- 6. Messages ---------- */
  function messages() {
    const list = p.messages.slice().sort((a, b) => new Date(a.at) - new Date(b.at));
    const members = p.team.members || [];
    let lastDay = '';
    const thread = list.map((m) => { const dl = cap(fmt(m.at, { weekday: 'long', day: 'numeric', month: 'long' })), sep = dl !== lastDay ? `<div class="cx-day"><span>${ago(m.at) === 'Hier' ? 'Hier' : dl}</span></div>` : ''; lastDay = dl;
      const mine = !m.fromAgency, u = byId[m.by];
      return sep + `<div class="cx-msg ${mine ? 'me' : ''}">${mine ? '' : av(m.by, '')}<div class="cx-bubble"><div class="cx-who"><b>${mine ? R('Vous', 'Toi') : esc(first(m.by))}${u ? `<span class="cx-role">${esc(u.title.split(/ et |,/)[0])}</span>` : ''}${m.readByClient === false ? '<span class="cx-chip hl cx-nw">Nouveau</span>' : ''}</b><span>${hour(m.at)}</span></div>${esc(m.text)}
        ${m.loom ? `<div class="cx-vid"><span class="cx-vth"><i>${ic('play')}</i><em>${esc(m.loom.duration)}</em></span><div><b>${esc(m.loom.title)}</b><span>Vidéo de ${esc(first(m.by))} · s’ouvre dans Loom</span></div></div>` : ''}</div></div>`; }).join('');
    const vids = list.filter((m) => m.loom).reverse();
    const rv = readyV[0], rvIt = rv && items.find((x) => x.val === rv.key);
    const ctx = rv ? `<div class="cx-ctx"><span class="cx-fico">${ic('ok')}</span><div class="cx-m"><b>${esc(rv.t)} : ${R('votre', 'ton')} feu vert est attendu</b><small>${relC(rv.due)}, ${hour(rv.due)} · préparé par ${esc(first(who(rvIt)[0][0]))}</small></div><button class="cx-btn sm cx-b-ink">Voir et valider</button></div>` : '';
    const note = p.note && p.note.text ? `<div class="cx-pinned"><span class="cx-pin">Épinglé</span><div><b>Le mot de ${esc(first(p.note.by))}</b> · ${ago(p.note.at).toLowerCase()}<p>${esc(p.note.text)}</p></div></div>` : '';
    const to = ['team', ...members];
    const compose = `<div class="cx-compose"><div class="cx-to"><span>Pour</span>${to.map((id, i) => `<span class="cx-tochip ${i ? '' : 'on'}">${id === 'team' ? 'Toute l’équipe' : `${av(id, '')}${esc(first(id))}`}</span>`).join('')}</div>
      <div class="cx-field"><span>${R('Écrivez votre message', 'Écris ton message')}…</span></div>
      <div class="cx-cbar"><button class="cx-iconbtn" aria-label="Joindre un fichier">${ic('plus')}</button><small>Toute l’équipe lit la conversation. Choisir une personne la prévient en priorité.</small><button class="cx-btn sm cx-b-ink">Envoyer ${ic('arrow')}</button></div></div>`;
    const conv = `<section class="cx-card c-1-8 cx-conv ${vids.length ? 'cx-r2' : ''}"><div class="cx-card-h"><h2>${ic('chat')}Conversation</h2><span class="cx-aside">${plural(list.length, 'message')}<span class="cx-show-s"> · réponse sous 24 h ouvrées</span></span></div>${note}<div class="cx-thread">${thread}</div>${ctx}${compose}</section>`;
    /* Écrire au bon interlocuteur : ce dont chacun s'occupe, en clair. */
    const topics = (u) => (u.contact || []).map((t) => t.replace(/^L[ea’'] ?|^Les /, (x) => x).replace(/,? et les bilans mensuels$/, ''));
    const whoCard = `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('team')}À qui écrire</h2></div><div class="cx-whom">
      ${members.map((id) => { const u = byId[id]; return `<div class="cx-wm ${id === leadId ? 'lead' : ''}">${av(id, '')}<div class="cx-m"><b>${esc(first(id))}${id === leadId ? `<span class="cx-chip ink">${R('Votre', 'Ton')} contact</span>` : ''}</b><small>${esc(u.title)}</small><ul>${topics(u).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div></div>`; }).join('')}</div>
      <div class="cx-duo"><button class="cx-btn sm cx-b-soft">${ic('cal')}Réserver un appel</button></div></section>`;
    const vidCard = vids.length ? `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('play')}Vidéos de l’équipe</h2><span class="cx-aside">${plural(vids.length, 'vidéo')}</span></div><ul class="cx-list">
      ${vids.map((m) => `<li><span class="cx-vth sm"><i>${ic('play')}</i></span><div class="cx-m"><div class="cx-t">${esc(m.loom.title)}</div><div class="cx-s">${esc(first(m.by))} · ${dms(m.at)} · ${esc(m.loom.duration)}</div></div>${m.readByClient === false ? '<span class="cx-chip hl">À regarder</span>' : ''}</li>`).join('')}</ul></section>` : '';
    return head('Messages', 'Les messages et les vidéos de l’équipe, au même endroit', `<span class="cx-pill cx-hide-s">${ic('chat')}<span>Réponse sous <b>24 h ouvrées</b></span></span>`)
      + `<div class="cx-bento">${conv}${whoCard}${vidCard}</div>`;
  }

  /* ---------- 7. Maquettes et visuels ---------- */
  function maquettes() {
    const L = p.links || {}, V = p.versions || [], last = V[0];
    const screens = (p.assets || []).filter((a) => a.kind === 'Maquettes' && a.img);
    const A = (p.assets || []).filter((a) => a.kind !== 'Maquettes');
    const kinds = [...new Set(A.map((a) => a.kind))];
    const vm = p.validations.find((x) => x.key === 'maquettes'), okAt = vm && vm.status === 'approved' ? (vm.history.find((h) => h.action === 'approved') || {}).at : null;
    const pins = p.pins || [];
    const okList = p.validations.filter((x) => ['plan', 'da', 'maquettes'].includes(x.key) && x.status === 'approved').map((x) => ({ t: x.t, at: (x.history.find((h) => h.action === 'approved') || {}).at })).filter((x) => x.at);
    const hero = `<section class="cx-card c-1-8 cx-hero"><div class="cx-card-h"><h2>${ic('figma')}La maquette cliquable</h2>${last ? `<span class="cx-chip hl">${esc(last.label)} · dernière version</span>` : ''}</div>
      <div class="cx-shot">${screens[0] ? `<img src="${screens[0].img}" alt="">` : ''}<div class="cx-shot-c"><span class="cx-play">${ic('play')}</span><b>Parcourir comme sur le vrai site</b><span>S’ouvre dans un nouvel onglet, sans compte Figma</span></div></div>
      <div class="cx-hero-ft"><div class="cx-m"><b>${esc(last ? last.t : 'Maquettes')}</b><small>${okAt ? `${R('Votre', 'Ton')} feu vert le ${dm(okAt)}` : last ? 'Publiée le ' + dm(last.at) : ''}</small></div><button class="cx-btn sm cx-b-ink">${ic('play')}Parcourir</button><button class="cx-btn sm cx-b-soft">${ic('figma')}Ouvrir dans Figma</button></div></section>`;
    const versions = `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('doc')}Versions</h2><span class="cx-aside">La plus récente en premier</span></div><ol class="cx-vers">
      ${V.map((v, i) => `<li class="${i ? '' : 'on'}"><span class="cx-vl">${esc(v.label)}</span><div class="cx-m"><b>${esc(v.t)}</b><small>${dm(v.at)}${!i && okAt ? ` · validée le ${dm(okAt)}` : i ? ' · version précédente' : ''}</small></div><button class="cx-btn sm cx-b-line">Ouvrir</button></li>`).join('')}</ol>
      ${okList.length ? `<div class="cx-oks"><b>${R('Vos', 'Tes')} feux verts sur le design</b>${okList.map((x) => `<div><i>${ic('check')}</i><span>${esc(x.t)}</span><small>${dms(x.at)}</small></div>`).join('')}</div>` : ''}
      <p class="cx-note">Chaque version reste consultable : ${R('vous voyez', 'tu vois')} ce qui a changé d’une étape à l’autre.</p></section>`;
    const shots = screens.length ? `<section class="cx-card c-1-9"><div class="cx-card-h"><h2>${ic('eye')}Les écrans</h2><span class="cx-aside">${R('Cliquez', 'Clique')} sur un écran, puis sur l’endroit à commenter</span></div><div class="cx-screens">
      ${screens.map((a) => { const n = pins.filter((x) => x.img === a.img).length; return `<div class="cx-scr"><div class="cx-scr-i"><img src="${a.img}" alt="${esc(a.title)}"><span class="cx-chip">${n ? plural(n, 'commentaire') : 'Aucun commentaire'}</span></div><div class="cx-scr-b"><div class="cx-m"><b>${esc(a.title)}</b><small>Par ${esc(first(a.by))}${last ? ' · ' + esc(last.label) : ''}</small></div><button class="cx-btn sm cx-b-soft">${ic('chat')}Commenter</button></div></div>`; }).join('')}</div></section>` : '';
    const open = pins.filter((x) => x.status === 'open').length;
    const comments = `<section class="cx-card c-9-13"><div class="cx-card-h"><h2>${ic('chat')}Commentaires</h2>${pins.length ? `<span class="cx-aside">${open} en cours</span>` : ''}</div>
      ${pins.length ? `<ul class="cx-list">${pins.map((x) => `<li><span class="cx-chip ${x.status === 'open' ? 'warn' : 'ok'}">${x.status === 'open' ? 'En cours' : 'Traité'}</span><div class="cx-m"><div class="cx-t">${esc(x.text)}</div><div class="cx-s">${dms(x.at)}</div></div></li>`).join('')}</ul>`
      : `<div class="cx-empty"><span class="cx-pinmark">1</span><b>Aucun commentaire pour l’instant</b><span>Une épingle sur l’écran, un mot, et Clément le reçoit. Elle reste visible jusqu’à ce qu’elle soit traitée.</span></div>`}
      <ol class="cx-tips"><li><i>1</i>${R('Ouvrez', 'Ouvre')} un écran</li><li><i>2</i>${R('Cliquez', 'Clique')} là où quelque chose ${R('vous', 'te')} gêne</li><li><i>3</i>${R('Écrivez', 'Écris')} ${R('votre', 'ta')} remarque, on la traite</li></ol></section>`;
    const big = A[0];
    const gallery = A.length ? `<section class="cx-card c-1-13"><div class="cx-card-h cx-wrap-h"><h2>${ic('folder')}Bibliothèque</h2><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div class="cx-tabs"><span class="on">Tout <em>${A.length}</em></span>${kinds.map((k) => `<span>${esc(k)} <em>${A.filter((a) => a.kind === k).length}</em></span>`).join('')}</div><button class="cx-btn sm cx-b-ink">${ic('down')}Tout télécharger</button></div></div>
      <p class="cx-note" style="margin-top:-4px">Les visuels du projet, libres d’usage pour ${R('votre', 'ta')} communication : site, LinkedIn, présentations.</p>
      <div class="cx-gal">${A.map((a, i) => `<figure class="cx-gi ${a === big ? 'big' : ''}"><div class="cx-gimg"><img src="${a.img}" alt="${esc(a.title)}"><span class="cx-chip">${esc(a.kind)}</span></div><figcaption><div class="cx-m"><b>${esc(a.title)}</b><small>JPG · haute définition</small></div><button class="cx-iconbtn" aria-label="Télécharger ${esc(a.title)}">${ic('down')}</button></figcaption></figure>`).join('')}</div></section>` : '';
    const B = p.brand || {};
    const colors = (B.colors || []).length ? `<section class="cx-card c-1-8"><div class="cx-card-h"><h2>${ic('eye')}Couleurs de la marque</h2><span class="cx-aside">${R('Cliquez', 'Clique')} pour copier</span></div><div class="cx-sws">${B.colors.map(([n, h]) => `<button class="cx-sw"><i style="background:${h}"></i><b>${esc(n)}</b><span>${h}</span></button>`).join('')}</div></section>` : '';
    const fonts = (B.fonts || []).length ? `<section class="cx-card c-8-13"><div class="cx-card-h"><h2>${ic('doc')}Typographies</h2></div><ul class="cx-list">${B.fonts.map(([r, d]) => `<li><span class="cx-aa">Aa</span><div class="cx-m"><div class="cx-t">${esc(r)}</div><div class="cx-s">${esc(d)}</div></div></li>`).join('')}</ul></section>` : '';
    return head('Maquettes et visuels', p.deliveredAt ? `Les maquettes validées et les visuels de ${R('votre', 'ta')} marque, prêts à réutiliser` : 'En direct depuis Figma, toujours la dernière version')
      + `<div class="cx-bento">${hero}${versions}${shots}${comments}${gallery}${colors}${fonts}</div>`;
  }

  const screens = { accueil, evolution, etapes, valider, fichiers, messages, maquettes };
  return nb(screens[o.screen || 'accueil']());
};
