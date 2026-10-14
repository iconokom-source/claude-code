/* Interface de l'espace client Orem : vue client et vue agence.
   window.DEMO = true → tout tourne dans le navigateur avec des données d'exemple (aucun serveur). */
(function () {
  const IMG = window.IMG || { logo: 'assets/logo-black.png', louis: 'assets/louis.jpg', theophile: 'assets/theophile.jpg', clement: 'assets/clement.jpg' };
  const CAL = 'https://cal.com/iconokom/rendez-vous-de-30-min';
  const $ = (s) => document.querySelector(s);
  const ic = (id, st) => `<svg aria-hidden="true"${st ? ` style="${st}"` : ''}><use href="#i-${id}"/></svg>`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = (d) => (d ? new Date(d) : null);
  const fmt = (d, o = { day: 'numeric', month: 'short' }) => (d ? new Intl.DateTimeFormat('fr-FR', o).format(D(d)) : '');
  const fmtLong = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtTime = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
  const money = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n || 0).replace(/ /g, ' ') + ' €';
  const size = (b) => (!b ? '' : b >= 1e9 ? (b / 1e9).toFixed(1).replace('.', ',') + ' Go' : b >= 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko');
  const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const dtKey = (d) => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

  /* ---------- Accès aux données : serveur local ou démo en mémoire ---------- */
  function httpApi() {
    const j = async (url, opts = {}) => {
      const r = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'Content-Type': 'application/json', 'X-Orem': '1', ...(opts.headers || {}) } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(data.error || 'Erreur ' + r.status); e.status = r.status; throw e; }
      return data;
    };
    return {
      me: () => j('/api/me'),
      login: (email) => j('/api/login', { method: 'POST', body: JSON.stringify({ email }) }),
      verify: (email, code) => j('/api/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
      logout: () => j('/api/logout', { method: 'POST' }),
      projects: () => j('/api/projects'),
      project: (id) => j('/api/projects/' + id),
      create: (data) => j('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
      action: (id, a) => j('/api/projects/' + id + '/action', { method: 'POST', body: JSON.stringify(a) }),
      upload: (id, file, cat, onp) => new Promise((ok, ko) => {
        const x = new XMLHttpRequest();
        x.open('POST', `/api/projects/${id}/files?name=${encodeURIComponent(file.name)}&cat=${encodeURIComponent(cat || '')}`);
        x.setRequestHeader('X-Orem', '1');
        x.upload.onprogress = (e) => e.lengthComputable && onp && onp(e.loaded / e.total);
        x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch {} x.status < 300 ? ok(d) : ko(new Error(d.error || 'Envoi impossible.')); };
        x.onerror = () => ko(new Error('Connexion perdue pendant l’envoi. Réessayez.'));
        x.send(file);
      }),
      fileUrl: (f) => (f.demo ? null : '/api/files/' + f.id)
    };
  }
  function demoApi() {
    const store = Core.seed();
    let me = null;
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const team = () => store.users.filter((u) => u.role === 'admin');
    const wait = (v) => new Promise((r) => setTimeout(() => r(clone(v)), 60));
    const fail = (msg) => Promise.reject(new Error(msg));
    return {
      demo: true,
      as: (email) => { me = store.users.find((u) => u.email === email); },
      me: () => (me ? wait({ user: me, team: team() }) : fail('Connectez-vous.')),
      login: (email) => { const u = store.users.find((x) => x.email === email); return wait(u ? { ok: true, devCode: '482917' } : { ok: true }); },
      verify: (email, code) => { const u = store.users.find((x) => x.email === email); if (!u || code !== '482917') return fail('Code incorrect ou expiré. Demandez-en un nouveau.'); me = u; return wait({ ok: true, user: u }); },
      logout: () => { me = null; return wait({ ok: true }); },
      projects: () => wait({ projects: store.projects.filter((p) => Core.canSee(me, p)).map(Core.summary) }),
      project: (id) => { const p = store.projects.find((x) => x.id === id); if (!p || !Core.canSee(me, p)) return fail('Projet introuvable.');
        return wait({ project: Core.forUser(p, me), access: me.role === 'admin' ? store.users.filter((u) => u.projectId === id) : undefined,
          people: Object.fromEntries(store.users.map((u) => [u.id, u.name])) }); },
      create: (data) => { const r = Core.createProject(store, me, data); return r.error ? fail(r.error) : wait(r); },
      action: (id, a) => { const r = Core.apply(store, id, me, a); return r.error ? fail(r.error) : wait(r); },
      upload: (id, file, cat, onp) => { onp && onp(1); const r = Core.apply(store, id, me, { type: 'file.add', file: { name: file.name, size: file.size, cat } });
        if (r.file) r.file.demo = true; return r.error ? fail(r.error) : wait(r); },
      fileUrl: () => null
    };
  }
  const API = window.DEMO ? demoApi() : httpApi();

  /* ---------- État ---------- */
  const S = { me: null, team: [], projects: [], project: null, access: [], people: {}, view: 'accueil', tab: 'pilotage', preview: false,
    cat: 'Tous', valForm: null, login: { step: 'email', email: '', dev: null }, uploading: null, loading: true };
  const isAdmin = () => S.me && S.me.role === 'admin';
  const clientMode = () => !isAdmin() || S.preview;
  const R = (vous, tu) => (S.project && S.project.registre === 'tu' ? tu : vous);
  const who = (id) => S.people[id] || (id || '').replace(/^u_/, '');

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2800); }
  async function act(a, okMsg) {
    if (S.preview) { toast('Aperçu : les actions sont désactivées.'); return false; }
    try { await API.action(S.project.id, a); await loadProject(S.project.id); if (okMsg) toast(okMsg); return true; }
    catch (e) { toast(e.message); return false; }
  }
  async function loadProject(id) { const r = await API.project(id); S.project = r.project; S.access = r.access || []; S.people = r.people || {}; render(); }
  async function loadProjects() { const r = await API.projects(); S.projects = r.projects; }

  /* ---------- Coque ---------- */
  const CLIENT_NAV = [['accueil', 'Accueil', 'home'], ['projet', R('Mon projet', 'Mon projet'), 'map'], ['valider', 'À valider', 'ok'], ['fichiers', 'Fichiers', 'folder'], ['documents', 'Documents', 'doc'], ['equipe', 'Équipe et aide', 'team']];
  const pending = () => (S.project ? S.project.validations.filter((v) => v.status === 'ready').length : 0);

  function shell(content) {
    const p = S.project;
    const admin = !clientMode();
    const nav = admin
      ? [['clients', 'Clients', 'team'], ['nouveau', 'Nouvel espace', 'plus']]
      : CLIENT_NAV;
    const navHtml = nav.map(([id, l, i]) => `<a href="#${id}" data-go="${id}" ${S.view === id ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${id === 'valider' && pending() ? `<span class="badge" aria-label="${pending()} à valider">${pending()}</span>` : ''}${id === 'clients' ? alertsTotal() : ''}</a>`).join('');
    const tabs = admin ? nav.concat([['deconnexion', 'Sortir', 'out']]) : [['accueil', 'Accueil', 'home'], ['projet', 'Projet', 'map'], ['valider', 'Valider', 'ok'], ['fichiers', 'Fichiers', 'folder'], ['plus', 'Plus', 'team']];
    const tabHtml = tabs.map(([id, l, i]) => { const cur = id === 'plus' ? ['documents', 'equipe'].includes(S.view) : S.view === id || (id === 'clients' && S.view === 'admin');
      return `<a href="#${id}" data-go="${id}" ${cur ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${id === 'valider' && pending() ? `<span class="badge">${pending()}</span>` : ''}</a>`; }).join('');
    const badge = admin ? `<div class="client"><div class="mono">O</div><div><strong>Espace agence</strong><span class="small muted">${esc(S.me.name)}</span></div></div>`
      : `<div class="client"><div class="mono">${esc((p.client || '?')[0])}</div><div><strong>${esc(p.client)}</strong><span class="small muted">Espace client</span></div></div>`;
    return `${S.preview ? `<div class="preview-bar">${ic('eye', 'width:18px;height:18px')}<span>Aperçu de l’espace de ${esc(p.client)}, tel que le client le voit</span><button data-act="endpreview">Revenir à l’administration</button></div>` : ''}
    <div class="app">
      <aside class="side ${admin ? 'admin' : ''}" aria-label="Navigation">
        <div class="brand"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b></div>
        ${badge}
        <nav class="nav">${navHtml}</nav>
        <div class="side-foot">
          <button class="ghost" data-act="theme">${ic('moon')}Changer de thème</button>
          ${S.preview ? '' : `<button class="ghost" data-act="logout">${ic('out')}Se déconnecter</button>`}
        </div>
      </aside>
      <div style="min-width:0">
        <header class="topbar"><div class="brand"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b></div><span class="small muted">${admin ? 'Espace agence' : esc(p.client)}</span></header>
        <main class="main" id="main" tabindex="-1"><div class="wrap">${content}</div></main>
      </div>
      <nav class="tabbar" aria-label="Navigation principale">${tabHtml}</nav>
    </div>`;
  }
  function alertsTotal() { const n = S.projects.reduce((s, p) => s + p.alerts.newFiles + p.alerts.changes, 0); return n ? `<span class="badge">${n}</span>` : ''; }

  /* ---------- Vues client ---------- */
  function phaseProgress(ph, i) {
    const p = S.project;
    if (ph.n < p.phase) return 100;
    if (ph.n > p.phase) return 0;
    const n = ph.items.length || 1;
    const v = ph.items.reduce((s, it) => s + (it.status === 'done' ? 1 : it.status === 'on' ? 0.5 : 0), 0);
    return Math.max(8, Math.round((v / n) * 100));
  }
  const CTA = { valider: ['Voir et valider', 'valider'], fichiers: ['Déposer mes fichiers', 'fichiers'], projet: ['Voir le projet', 'projet'], documents: ['Voir les documents', 'documents'], equipe: ['Contacter l’équipe', 'equipe'] };

  function vAccueil() {
    const p = S.project, nx = Core.nextStep(p), ph = p.phases[p.phase - 1];
    const cta = CTA[nx.go];
    const ready = p.validations.filter((v) => v.status === 'ready');
    const actions = [
      ...ready.map((v) => ({ t: 'Valider : ' + v.t.toLowerCase(), sub: R('Prêt depuis le ', 'Prêt depuis le ') + fmt(v.readyAt), go: 'valider' })),
      ...p.missing.map((m) => ({ t: 'Déposer : ' + m.t.toLowerCase(), sub: m.sub, go: 'fichiers' })),
      ...p.tasks.map((t) => ({ t: t.t, done: t.done, tid: t.id }))
    ];
    const doneN = actions.filter((a) => a.done).length;
    const note = p.note && p.note.text;
    const author = S.team.find((u) => u.id === p.note.by);
    const delivs = p.files.filter((f) => f.from === 'agence' && f.cat === 'Livrable').slice(0, 3);
    return `
    <div class="head"><div><div class="eyebrow">${esc(cap(fmtLong(Date.now())))}</div><h1>Bonjour ${esc(p.contactName || S.me.name)}</h1></div><span class="small muted">${esc(p.projet)}</span></div>
    <section class="next" aria-labelledby="nx"><div><div class="k">Prochaine étape</div><h2 id="nx">${esc(nx.title)}</h2>${nx.text ? `<p>${esc(nx.text)}</p>` : ''}<div class="meta">Étape ${p.phase} sur 5 · ${esc(ph.t)}</div></div>${cta ? `<a class="btn" href="#${cta[1]}" data-go="${cta[1]}">${cta[0]} ${ic('arrow')}</a>` : ''}</section>
    <section class="panel" aria-labelledby="av">
      <div class="panel-head"><h2 id="av">Où en est le projet</h2><a href="#projet" data-go="projet">Voir le détail</a></div>
      <div class="steps">${p.phases.map((x, i) => `<div class="step ${x.n === p.phase ? 'on' : ''}"><div class="bar"><i style="width:${phaseProgress(x, i)}%"></i></div><div class="t">${esc(x.t)}</div><div class="d">${fmt(x.from)} au ${fmt(x.to)}</div></div>`).join('')}</div>
      <p class="small muted" style="margin-top:14px">Mise en ligne prévue vers le ${fmt(p.golive, { day: 'numeric', month: 'long' })}. Dates indicatives, ajustées ensemble à chaque étape.</p>
    </section>
    <div class="grid2">
      <section class="panel" aria-labelledby="td">
        <div class="panel-head"><h2 id="td">${R('Vos actions', 'Tes actions')}</h2>${actions.length ? `<span class="small muted num">${doneN} sur ${actions.length}</span>` : ''}</div>
        <div class="list">${actions.map((a) => a.tid
          ? `<div class="row ${a.done ? 'done' : ''}"><button class="check ${a.done ? 'done' : ''}" data-act="task" data-id="${a.tid}" aria-label="${a.done ? 'Décocher' : 'Cocher'} : ${esc(a.t)}" aria-pressed="${!!a.done}">${a.done ? ic('check') : ''}</button><div class="grow"><div class="title">${esc(a.t)}</div></div></div>`
          : `<div class="row"><span class="check"></span><div class="grow"><div class="title">${esc(a.t)}</div>${a.sub ? `<div class="sub">${esc(a.sub)}</div>` : ''}</div><a class="btn btn-line btn-sm" href="#${a.go}" data-go="${a.go}">Ouvrir</a></div>`).join('') || `<p class="muted">${R('Rien à faire de votre côté pour le moment.', 'Rien à faire de ton côté pour le moment.')}</p>`}</div>
      </section>
      <section class="panel" aria-labelledby="sm">
        <div class="panel-head"><h2 id="sm">Cette semaine</h2>${p.note.at ? `<span class="small muted">Mis à jour le ${fmt(p.note.at, { day: 'numeric', month: 'long' })}</span>` : ''}</div>
        ${note ? `<div class="note">${author && IMG[author.photo] ? `<img class="avatar" src="${IMG[author.photo]}" alt="">` : ''}<div><blockquote>${esc(note)}</blockquote><div class="who">${esc(author ? author.name.split(' ')[0] + ', ' + (author.title || '').toLowerCase() : '')}</div></div></div>` : `<p class="muted">Le point de la semaine arrive bientôt.</p>`}
        ${p.meeting && p.meeting.when ? `<div class="row" style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"><span class="ico">${ic('cal')}</span><div class="grow"><div class="title">${esc(p.meeting.title || 'Rendez-vous')}</div><div class="sub">${esc(cap(fmtTime(p.meeting.when)))}</div></div></div>` : ''}
      </section>
    </div>
    ${delivs.length ? `<section class="panel" aria-labelledby="dl"><div class="panel-head"><h2 id="dl">Derniers ajouts de l’agence</h2><a href="#fichiers" data-go="fichiers">Tous les fichiers</a></div><div class="list">${delivs.map(fileRow).join('')}</div></section>` : ''}`;
  }
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  function fileRow(f) {
    const url = API.fileUrl(f);
    const agency = f.from === 'agence';
    return `<div class="row"><span class="ico ${agency ? 'hl' : ''}">${ic(/figma/i.test(f.name) ? 'figma' : 'doc')}</span><div class="grow"><div class="title" style="overflow-wrap:anywhere">${esc(f.name)}</div><div class="sub num">${esc(f.cat)}${f.size ? ' · ' + size(f.size) : ''} · ${fmt(f.at)}${!agency && isAdmin() && !S.preview ? ' · ' + esc(who(f.by)) : ''}</div></div>${f.fresh ? '<span class="chip ok">Envoyé</span>' : ''}${isAdmin() && !S.preview && f.seen === false ? '<span class="chip warn">Nouveau</span>' : ''}${url ? `<a class="btn btn-line btn-sm" href="${url}">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></a>` : `<button class="btn btn-line btn-sm" data-act="toast" data-msg="Fichier d’exemple : rien à télécharger.">${ic('down')}<span class="sr">Télécharger</span></button>`}${isAdmin() && !S.preview ? `<button class="x" data-act="file-remove" data-id="${f.id}" aria-label="Retirer ${esc(f.name)}">×</button>` : ''}</div>`;
  }

  function vProjet() {
    const p = S.project;
    return `
    <div class="head"><div><div class="eyebrow">${esc(p.projet)}</div><h1>${R('Votre projet', 'Ton projet')}</h1></div><span class="chip hl">Étape ${p.phase} sur 5</span></div>
    <p class="muted" style="max-width:62ch;margin-top:-12px">Cinq étapes, de la première visio à la livraison. On ne passe à l’étape suivante qu’avec ${R('votre', 'ton')} feu vert. Les dates sont indicatives et ajustées ensemble.</p>
    <section class="panel">
    ${p.phases.map((ph, i) => { const st = ph.n < p.phase ? 'done' : ph.n === p.phase ? 'on' : 'wait';
      return `<div class="phase"><div class="rail"><span class="dot ${st}">${st === 'done' ? ic('check') : ph.n}</span>${i < 4 ? '<span class="line"></span>' : ''}</div>
      <div class="phase-body"><div class="phase-top"><h2 style="font-size:19px">${esc(ph.t)}</h2>${st === 'done' ? '<span class="chip ok">Terminé</span>' : st === 'on' ? '<span class="chip hl">En cours</span>' : '<span class="chip idle">À venir</span>'}<span class="small muted num">${fmt(ph.from)} au ${fmt(ph.to)}</span></div>
      <p>${esc(ph.txt)}</p>
      ${ph.items.length ? `<div class="deliv">${ph.items.map((it) => `<div class="row"><div class="grow"><div class="title" style="font-weight:400">${esc(it.t)}</div><div class="sub">${it.status === 'done' ? 'Fait' : 'Prévu vers le ' + fmt(it.due, { day: 'numeric', month: 'long' })}</div></div>${it.status === 'done' ? '<span class="chip ok">Fait</span>' : it.status === 'on' ? '<span class="chip hl">En cours</span>' : '<span class="chip idle">Prévu</span>'}</div>`).join('')}</div>` : ''}
      </div></div>`; }).join('')}
    </section>`;
  }

  function vValider() {
    const p = S.project;
    const ready = p.validations.filter((v) => v.status === 'ready');
    const done = p.validations.filter((v) => ['approved', 'changes'].includes(v.status));
    const later = p.validations.filter((v) => v.status === 'wait');
    const card = (v) => {
      const form = S.valForm === v.id
        ? `<form class="field" data-form="changes" data-id="${v.id}"><label for="chg-${v.id}">Qu’${R('aimeriez-vous', 'aimerais-tu')} changer ?</label><textarea id="chg-${v.id}" required placeholder="Par exemple : regrouper deux pages, ajouter une page Presse…"></textarea><span class="small muted">L’équipe ${R('vous', 'te')} répond sous 24 h ouvrées.</span><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">Envoyer mes remarques</button><button class="btn btn-line" type="button" data-act="valcancel">Annuler</button></div></form>`
        : `<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-act="approve" data-id="${v.id}">${ic('check')}${R('Je valide', 'Je valide')}</button><button class="btn btn-line" data-act="changes" data-id="${v.id}">Demander des modifications</button></div>
           <p class="small muted">Valider, c’est donner ${R('votre', 'ton')} feu vert écrit pour passer à la suite. Il est enregistré avec la date et l’heure.</p>`;
      return `<section class="panel" style="display:flex;flex-direction:column;gap:14px"><div><span class="chip warn">En attente de ${R('votre', 'ta')} validation</span></div>
        <h2>${esc(v.t)}</h2><p class="muted">${esc(v.sub)}. Prêt depuis le ${fmt(v.readyAt, { day: 'numeric', month: 'long' })}.</p>
        ${v.link ? `<a class="link" href="${esc(v.link)}" target="_blank" rel="noopener">Ouvrir et regarder ${ic('arrow', 'width:14px;height:14px;vertical-align:-2px')}</a>` : ''}
        ${form}</section>`;
    };
    return `
    <div class="head"><div><div class="eyebrow">On avance avec ${R('votre', 'ton')} feu vert</div><h1>À valider</h1></div></div>
    ${ready.map(card).join('') || `<div class="empty">Rien à valider pour l’instant. On ${R('vous', 'te')} prévient dès que la prochaine étape est prête.</div>`}
    ${done.length ? `<section class="panel"><div class="panel-head"><h2>Déjà ${R('traité', 'traité')}</h2></div><div class="list">${done.map((v) => { const h = v.history[v.history.length - 1] || {};
      return `<div class="row"><span class="ico ${v.status === 'approved' ? 'ok' : ''}">${ic(v.status === 'approved' ? 'ok' : 'chat')}</span><div class="grow"><div class="title">${esc(v.t)}</div><div class="sub">${v.status === 'approved' ? 'Validé le ' + fmt(h.at, { day: 'numeric', month: 'long' }) : 'Remarques envoyées le ' + fmt(h.at, { day: 'numeric', month: 'long' }) + (h.comment ? ' : « ' + esc(h.comment) + ' »' : '')}</div></div>${v.status === 'approved' ? '<span class="chip ok">Validé</span>' : '<span class="chip hl">En cours de reprise</span>'}</div>`; }).join('')}</div></section>` : ''}
    ${later.length ? `<section class="panel"><div class="panel-head"><h2>Les prochaines validations</h2></div><div class="list">${later.map((v) => `<div class="row"><span class="ico">${ic('lock')}</span><div class="grow"><div class="title">${esc(v.t)}</div><div class="sub">${esc(v.sub)}</div></div><span class="small muted num" style="text-align:right">Vers le ${fmt(v.due)}</span></div>`).join('')}</div></section>` : ''}`;
  }

  function vFichiers() {
    const p = S.project;
    const mine = p.files.filter((f) => f.from === 'client');
    const cats = ['Tous', ...Core.FILE_CATS];
    const shown = S.cat === 'Tous' ? mine : mine.filter((f) => f.cat === S.cat);
    const count = (c) => (c === 'Tous' ? mine.length : mine.filter((f) => f.cat === c).length);
    const delivs = p.files.filter((f) => f.from === 'agence' && f.cat === 'Livrable');
    return `
    <div class="head"><div><div class="eyebrow">Pas besoin de compte Google</div><h1>Fichiers</h1></div></div>
    <label class="drop" id="drop" for="file-in">
      <span class="ico hl">${ic('up')}</span>
      <strong>${R('Glissez vos fichiers ici, ou cliquez pour choisir', 'Glisse tes fichiers ici, ou clique pour choisir')}</strong>
      <span class="small muted">Photos, vidéos, textes, logos. Jusqu’à 2 Go par fichier. On les range pour ${R('vous', 'toi')}.</span>
      ${S.uploading ? `<span class="small" style="width:100%;max-width:320px">${esc(S.uploading.name)}<span class="progress"><i style="width:${Math.round(S.uploading.p * 100)}%"></i></span></span>` : ''}
      <input id="file-in" type="file" multiple class="sr">
    </label>
    ${p.missing.length ? `<section class="panel" aria-labelledby="mq"><div class="panel-head"><h2 id="mq">Ce qu’il nous manque</h2><span class="small muted">${p.missing.length} élément${p.missing.length > 1 ? 's' : ''}</span></div>
      ${p.missing.map((m) => `<div class="ask"><span class="ico">${ic('folder')}</span><div style="flex:1;min-width:0"><div style="font-weight:500">${esc(m.t)}</div>${m.sub ? `<div class="small muted">${esc(m.sub)}</div>` : ''}</div><label class="btn btn-line btn-sm" for="miss-${m.id}">Déposer</label><input id="miss-${m.id}" type="file" multiple class="sr" data-missing="${m.id}"></div>`).join('')}</section>` : ''}
    <section class="panel" aria-labelledby="mf">
      <div class="panel-head"><h2 id="mf">${R('Vos envois', 'Tes envois')}</h2><span class="small muted num">${mine.length} fichier${mine.length > 1 ? 's' : ''}</span></div>
      <div class="cats" role="group" aria-label="Filtrer par type" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">${cats.map((c) => `<button class="cat" data-cat="${c}" aria-pressed="${S.cat === c}"><strong>${c}</strong><span class="small muted num">${count(c)}</span></button>`).join('')}</div>
      <div class="list" style="margin-top:18px">${shown.map(fileRow).join('') || '<p class="muted">Aucun fichier ici pour l’instant.</p>'}</div>
    </section>
    <section class="panel" aria-labelledby="lv"><div class="panel-head"><h2 id="lv">Livrables de l’agence</h2></div>
      <div class="list">${delivs.map(fileRow).join('') || '<p class="muted">Les maquettes et documents de l’agence apparaîtront ici.</p>'}</div></section>`;
  }

  function vDocuments() {
    const p = S.project, b = p.billing;
    const paid = p.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.ttc, 0);
    const docs = p.files.filter((f) => f.from === 'agence' && f.cat !== 'Livrable');
    const st = { paid: '<span class="chip ok">Payée</span>', due: '<span class="chip warn">À régler</span>', future: '<span class="chip idle">À venir</span>' };
    return `
    <div class="head"><div><div class="eyebrow">Devis, factures et paiement</div><h1>Documents</h1></div></div>
    <div class="grid2">
      <section class="panel"><div class="small muted">Montant du projet</div><div class="money num" style="margin-top:6px">${money(b.totalHT)} HT</div><div class="small muted num">${money(b.totalTTC)} TTC${b.quote ? ' · devis ' + esc(b.quote) : ''}${b.signedAt ? ' signé le ' + fmt(b.signedAt) : ''}</div></section>
      <section class="panel"><div class="small muted">Déjà réglé</div><div class="money num" style="margin-top:6px">${money(paid)} TTC</div><div class="small muted num">Reste ${money(Math.max(0, b.totalTTC - paid))} TTC</div></section>
    </div>
    <section class="panel"><div class="panel-head"><h2>Factures</h2></div><div class="list">${p.invoices.map((i) => `<div class="row"><span class="ico ${i.status === 'paid' ? 'ok' : ''}">${ic('doc')}</span><div class="grow"><div class="title">${esc(i.label)}${i.num ? ' ' + esc(i.num) : ''}</div><div class="sub num">${money(i.ht)} HT · ${money(i.ttc)} TTC${i.status === 'paid' && i.paidAt ? ' · réglée le ' + fmt(i.paidAt) : i.status === 'future' ? ' · envoyée à la livraison' : ''}</div></div>${st[i.status] || ''}</div>`).join('') || '<p class="muted">Aucune facture pour le moment.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>PDF à télécharger</h2></div><div class="list">${docs.map(fileRow).join('') || '<p class="muted">Les devis et factures en PDF apparaîtront ici.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>Coordonnées bancaires</h2><span class="small muted">Banque Qonto</span></div>
      <dl class="kv"><dt>Titulaire</dt><dd>ICONOKOM, 34 place du Général de Gaulle, Bureau 3, 59000 Lille</dd><dt>IBAN</dt><dd id="iban">FR76 1695 8000 0188 1420 4296 259</dd><dt>BIC</dt><dd>QNTOFRP1XXX</dd></dl>
      <div class="copy" style="margin-top:16px"><button class="btn btn-line btn-sm" data-act="copy">${ic('copy')}Copier l’IBAN</button></div></section>`;
  }

  function vEquipe() {
    return `
    <div class="head"><div><div class="eyebrow">Une question ? On répond sous 24 h ouvrées</div><h1>Équipe et aide</h1></div></div>
    <div class="team">${S.team.map((u) => `<section class="panel person">${IMG[u.photo] ? `<img src="${IMG[u.photo]}" alt="">` : ''}<div><h3>${esc(u.name)}</h3><div class="role">${esc(u.title || '')}</div>${u.phone ? `<div class="small muted num" style="margin-top:4px">${esc(u.phone)}</div>` : ''}</div>${u.wa ? `<a class="btn btn-line btn-sm" href="${u.wa}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a>` : '<span class="small muted">Joignable via Louis</span>'}</section>`).join('')}</div>
    <section class="panel" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
      <div style="min-width:0;flex:1 1 280px"><h2>Besoin d’en parler de vive voix ?</h2><p class="muted" style="margin-top:6px">${R('Réservez', 'Réserve')} une visio de 30 minutes quand ${R('vous voulez', 'tu veux')}.</p></div>
      <a class="btn btn-primary" href="${CAL}" target="_blank" rel="noopener">${ic('cal')}Réserver une visio</a></section>
    <section class="panel"><div class="panel-head"><h2>Questions fréquentes</h2></div>
      <details><summary>Que se passe-t-il quand je valide une étape ?</summary><p>La validation est enregistrée avec la date et l’heure, l’équipe est prévenue et l’étape suivante démarre.</p></details>
      <details><summary>Le site m’appartient-il ?</summary><p>Oui. Le site est hébergé sur ${R('votre', 'ton')} propre compte Webflow : ${R('vous en êtes propriétaire, vous êtes libres', 'tu en es propriétaire, tu es libre')}.</p></details>
      <details><summary>Où déposer un fichier très lourd ?</summary><p>Dans l’onglet Fichiers, jusqu’à 2 Go par fichier. Au-delà, ${R('envoyez', 'envoie')}-nous un lien WeTransfer sur WhatsApp.</p></details>
      <details><summary>Comment me reconnecter ?</summary><p>Sur la page de connexion, ${R('saisissez votre', 'saisis ton')} e-mail : un lien et un code arrivent en quelques secondes. Pas de mot de passe à retenir.</p></details>
    </section>`;
  }

  /* ---------- Vues agence ---------- */
  function vClients() {
    const rows = S.projects.map((p) => { const a = p.alerts;
      const flags = [a.newFiles ? `<span class="chip warn">${a.newFiles} nouveau${a.newFiles > 1 ? 'x' : ''} fichier${a.newFiles > 1 ? 's' : ''}</span>` : '',
        a.changes ? `<span class="chip warn">Modifications demandées</span>` : '',
        a.waiting ? `<span class="chip hl">Validation chez le client</span>` : '',
        !a.newFiles && !a.changes && !a.waiting ? '<span class="chip idle">Rien de neuf</span>' : ''].join('');
      return `<button class="crow" data-open="${p.id}"><div><div class="c-name">${esc(p.client)}</div><div class="small muted">${esc(p.projet)}</div></div><div><div class="small"><span class="muted">Étape ${p.phase} · ${esc(p.phaseName)}</span></div><div class="small" style="margin-top:2px">${esc(p.next.title)}</div></div><div class="c-flags">${flags}</div></button>`; }).join('');
    const needs = S.projects.filter((p) => p.alerts.newFiles || p.alerts.changes).length;
    return `
    <div class="head"><div><div class="eyebrow">${esc(cap(fmtLong(Date.now())))}</div><h1>Clients</h1></div><button class="btn btn-primary" data-go="nouveau">${ic('plus')}Nouvel espace client</button></div>
    ${needs ? `<div class="alert">${ic('alert')}<div><strong>${needs} client${needs > 1 ? 's' : ''} attend${needs > 1 ? 'ent' : ''} une action de l’agence.</strong> Nouveaux fichiers à récupérer ou modifications demandées.</div></div>` : ''}
    <section class="panel"><div class="clients">${rows || '<div class="empty">Aucun espace client pour l’instant.</div>'}</div></section>`;
  }

  function vNouveau() {
    return `
    <div class="head"><div><div class="eyebrow">Le client reçoit un lien de connexion, sans mot de passe</div><h1>Nouvel espace client</h1></div></div>
    <form class="panel form" data-form="create">
      <div class="line"><div class="field"><label for="n-client">Client</label><input id="n-client" type="text" required placeholder="Maison Lumen"></div>
      <div class="field"><label for="n-projet">Projet</label><input id="n-projet" type="text" placeholder="Refonte du site maisonlumen.fr"></div></div>
      <div class="line"><div class="field"><label for="n-contact">Prénom du contact</label><input id="n-contact" type="text" placeholder="Claire"></div>
      <div class="field"><label for="n-email">E-mail du contact</label><input id="n-email" type="email" placeholder="claire@maisonlumen.fr"></div></div>
      <div class="line"><div class="field"><label for="n-start">Démarrage</label><input id="n-start" type="date" value="${dayKey(Date.now())}"></div>
      <div class="field"><label for="n-ht">Montant HT (€)</label><input id="n-ht" type="number" min="0" step="10" placeholder="6900"></div></div>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:500;margin-bottom:8px">Tutoiement ou vouvoiement</legend>
        <div class="radio"><label><input type="radio" name="n-reg" value="vous" checked> Vouvoiement</label><label><input type="radio" name="n-reg" value="tu"> Tutoiement</label></div></fieldset>
      <p class="small muted">Les 5 étapes, les livrables et les 4 validations sont créés automatiquement avec des dates indicatives calculées depuis le démarrage.</p>
      <div><button class="btn btn-primary" type="submit">Créer l’espace</button></div>
    </form>`;
  }

  const TABS = [['pilotage', 'Pilotage'], ['validations', 'Validations'], ['fichiers', 'Fichiers'], ['factures', 'Factures'], ['acces', 'Accès et infos'], ['activite', 'Activité']];
  function vAdmin() {
    const p = S.project, a = Core.alerts(p);
    const tabCount = { fichiers: a.newFiles, validations: a.changes };
    const body = { pilotage: tPilotage, validations: tValidations, fichiers: tFichiers, factures: tFactures, acces: tAcces, activite: tActivite }[S.tab]();
    return `
    <div><button class="ghost" data-go="clients" style="padding-left:0">${ic('back')}Tous les clients</button></div>
    <div class="head"><div><div class="eyebrow">${esc(p.projet)} · Étape ${p.phase} sur 5</div><h1>${esc(p.client)}</h1></div><button class="btn btn-line" data-act="preview">${ic('eye')}Voir comme le client</button></div>
    <div class="tabs" role="tablist">${TABS.map(([id, l]) => `<button role="tab" aria-selected="${S.tab === id}" data-tab="${id}">${l}${tabCount[id] ? `<span class="badge">${tabCount[id]}</span>` : ''}</button>`).join('')}</div>
    ${body}`;
  }
  const GO_OPTS = [['accueil', 'Aucun bouton'], ['valider', 'À valider'], ['fichiers', 'Fichiers'], ['projet', 'Projet'], ['documents', 'Documents'], ['equipe', 'Équipe']];
  function tPilotage() {
    const p = S.project;
    return `
    <form class="panel form" data-form="phase"><div class="panel-head" style="margin:0"><h2>Étape en cours</h2></div>
      <div class="inline"><select id="a-phase" aria-label="Étape en cours">${p.phases.map((x) => `<option value="${x.n}" ${x.n === p.phase ? 'selected' : ''}>${x.n} · ${esc(x.t)}</option>`).join('')}</select><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>
    <form class="panel form" data-form="next"><div class="panel-head" style="margin:0"><h2>Prochaine étape affichée au client</h2><span class="small muted">Le grand bloc en haut de son accueil</span></div>
      <div class="field"><label for="a-nt">Titre</label><input id="a-nt" type="text" value="${esc(p.next.title)}" placeholder="${esc(Core.nextStep({ ...p, next: {} }).title)}"></div>
      <div class="field"><label for="a-nx">Texte</label><textarea id="a-nx" placeholder="Une ou deux phrases : ce qu’on attend et pourquoi.">${esc(p.next.text)}</textarea></div>
      <div class="inline"><label for="a-ng" style="flex:none">Bouton vers</label><select id="a-ng">${GO_OPTS.map(([v, l]) => `<option value="${v}" ${p.next.go === v ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn btn-primary btn-sm" type="submit">Publier</button></div>
      <p class="small muted">Laissez le titre vide pour une prochaine étape automatique (validation en attente, puis fichiers manquants).</p></form>
    <form class="panel form" data-form="note"><div class="panel-head" style="margin:0"><h2>Cette semaine</h2>${p.note.at ? `<span class="small muted">Dernière mise à jour le ${fmt(p.note.at)}</span>` : ''}</div>
      <textarea id="a-note" aria-label="Note de la semaine" placeholder="Ce qui a été fait, ce qui vient.">${esc(p.note.text)}</textarea>
      <div class="line"><div class="field"><label for="a-mt">Prochain rendez-vous</label><input id="a-mt" type="text" value="${esc(p.meeting.title)}" placeholder="Point d’étape (visio, 30 min)"></div><div class="field"><label for="a-mw">Date et heure</label><input id="a-mw" type="datetime-local" value="${dtKey(p.meeting.when)}"></div></div>
      <div><button class="btn btn-primary btn-sm" type="submit">Publier</button></div></form>
    <section class="panel"><div class="panel-head"><h2>Livrables par étape</h2><span class="small muted">Visibles dans « Projet » côté client</span></div>
      ${p.phases.map((ph) => `<h3 style="margin:14px 0 4px">${ph.n} · ${esc(ph.t)}</h3>${ph.items.map((it) => `<div class="it"><div>${esc(it.t)}</div>
        <select data-item="${it.id}" aria-label="Statut : ${esc(it.t)}">${[['wait', 'Prévu'], ['on', 'En cours'], ['done', 'Fait']].map(([v, l]) => `<option value="${v}" ${it.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input type="date" data-itemdate="${it.id}" value="${dayKey(it.due)}" aria-label="Date prévue : ${esc(it.t)}"></div>`).join('')}`).join('')}</section>
    <div class="grid2">
      <section class="panel"><div class="panel-head"><h2>Actions du client</h2></div>
        <div class="list">${p.tasks.map((t) => `<div class="row"><span class="check ${t.done ? 'done' : ''}">${t.done ? ic('check') : ''}</span><div class="grow">${esc(t.t)}</div><button class="x" data-act="task-remove" data-id="${t.id}" aria-label="Retirer">×</button></div>`).join('') || '<p class="small muted">Aucune action manuelle. Les validations et fichiers manquants s’ajoutent tout seuls.</p>'}</div>
        <form class="inline" data-form="task" style="margin-top:12px"><input id="a-task" type="text" placeholder="Régler l’acompte de 50 %" aria-label="Nouvelle action"><button class="btn btn-line btn-sm" type="submit">Ajouter</button></form></section>
      <section class="panel"><div class="panel-head"><h2>Fichiers attendus</h2></div>
        <div class="list">${p.missing.map((m) => `<div class="row"><div class="grow"><div class="title" style="font-weight:400">${esc(m.t)}</div>${m.sub ? `<div class="sub">${esc(m.sub)}</div>` : ''}</div><button class="x" data-act="missing-remove" data-id="${m.id}" aria-label="Retirer">×</button></div>`).join('') || '<p class="small muted">Rien n’est attendu.</p>'}</div>
        <form class="form" data-form="missing" style="margin-top:12px;gap:8px"><input id="a-mi" type="text" placeholder="Photos de l’équipe" aria-label="Fichier attendu"><input id="a-ms" type="text" placeholder="Précision (facultatif)" aria-label="Précision"><div><button class="btn btn-line btn-sm" type="submit">Ajouter</button></div></form></section>
    </div>`;
  }
  function tValidations() {
    const p = S.project;
    const chip = { wait: '<span class="chip idle">Pas encore demandée</span>', ready: '<span class="chip hl">Chez le client</span>', approved: '<span class="chip ok">Validé</span>', changes: '<span class="chip warn">Modifications demandées</span>' };
    const label = { approved: 'a validé', changes: 'a demandé des modifications', requested: 'validation demandée', reset: 'remise en attente' };
    return p.validations.map((v) => `<section class="panel form">
      <div class="panel-head" style="margin:0"><h2>${esc(v.t)}</h2>${chip[v.status]}</div>
      <p class="small muted" style="margin-top:-8px">${esc(v.sub)} · prévue vers le ${fmt(v.due)}</p>
      <form class="inline" data-form="valreq" data-id="${v.id}"><input type="url" id="vl-${v.id}" value="${esc(v.link)}" placeholder="Lien à regarder (Figma, prévisualisation Webflow…)" aria-label="Lien pour ${esc(v.t)}">
        <button class="btn btn-primary btn-sm" type="submit">${v.status === 'ready' ? 'Mettre à jour' : v.status === 'changes' ? 'Redemander la validation' : 'Demander la validation'}</button>
        ${v.status !== 'wait' ? `<button class="btn btn-line btn-sm" type="button" data-act="valreset" data-id="${v.id}">Remettre en attente</button>` : ''}</form>
      ${v.history.length ? `<div class="hist">${v.history.slice().reverse().map((h) => `<div>${fmt(h.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${esc(who(h.by))} ${label[h.action] || ''}${h.comment ? ` : <q>${esc(h.comment)}</q>` : ''}</div>`).join('')}</div>` : ''}
    </section>`).join('');
  }
  function tFichiers() {
    const p = S.project;
    const fromClient = p.files.filter((f) => f.from === 'client');
    const fromAgency = p.files.filter((f) => f.from === 'agence');
    return `
    <section class="panel"><div class="panel-head"><h2>Déposés par le client</h2>${fromClient.some((f) => f.seen === false) ? '<button class="btn btn-line btn-sm" data-act="seen">Tout marquer comme vu</button>' : ''}</div>
      <div class="list">${fromClient.map(fileRow).join('') || '<p class="muted">Le client n’a encore rien déposé.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>Partagés par l’agence</h2></div>
      <div class="inline" style="margin-bottom:16px"><select id="a-cat" aria-label="Type de document">${Core.AGENCY_CATS.map((c) => `<option>${c}</option>`).join('')}</select><label class="btn btn-primary btn-sm" for="a-up">${ic('up')}Ajouter un fichier</label><input id="a-up" type="file" multiple class="sr" data-agency="1"></div>
      ${S.uploading ? `<div class="small">${esc(S.uploading.name)}<span class="progress"><i style="width:${Math.round(S.uploading.p * 100)}%"></i></span></div>` : ''}
      <p class="small muted" style="margin-bottom:12px">« Livrable » apparaît dans Fichiers côté client. Devis, factures, contrat et RIB apparaissent dans Documents.</p>
      <div class="list">${fromAgency.map(fileRow).join('') || '<p class="muted">Rien de partagé pour l’instant.</p>'}</div></section>`;
  }
  function tFactures() {
    const p = S.project, b = p.billing;
    return `
    <form class="panel form" data-form="billing"><div class="panel-head" style="margin:0"><h2>Montant du projet</h2></div>
      <div class="line"><div class="field"><label for="b-ht">Montant HT (€)</label><input id="b-ht" type="number" min="0" step="0.01" value="${b.totalHT}"></div><div class="field"><label for="b-q">N° de devis</label><input id="b-q" type="text" value="${esc(b.quote)}" placeholder="D-2026-0142"></div></div>
      <div><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>
    <section class="panel"><div class="panel-head"><h2>Factures</h2></div>
      <div class="list">${p.invoices.map((i) => `<div class="row"><div class="grow"><div class="title">${esc(i.label)} ${esc(i.num)}</div><div class="sub num">${money(i.ht)} HT · ${money(i.ttc)} TTC</div></div>
        <select data-inv="${i.id}" style="width:auto" aria-label="Statut de la facture">${[['future', 'À venir'], ['due', 'À régler'], ['paid', 'Payée']].map(([v, l]) => `<option value="${v}" ${i.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`).join('') || '<p class="muted">Aucune facture.</p>'}</div>
      <form class="form" data-form="invoice" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line)">
        <div class="line"><div class="field"><label for="i-l">Libellé</label><input id="i-l" type="text" placeholder="Facture d’acompte (50 %)"></div><div class="field"><label for="i-n">Numéro</label><input id="i-n" type="text" placeholder="F-2026-0187"></div></div>
        <div class="line"><div class="field"><label for="i-ht">Montant HT (€)</label><input id="i-ht" type="number" min="0" step="0.01"></div><div class="field"><label for="i-s">Statut</label><select id="i-s"><option value="due">À régler</option><option value="paid">Payée</option><option value="future">À venir</option></select></div></div>
        <div><button class="btn btn-line btn-sm" type="submit">Ajouter la facture</button></div>
        <p class="small muted">Le PDF se dépose dans l’onglet Fichiers, catégorie « Facture ». Plus tard : import automatique depuis Abby et paiement détecté dans Qonto.</p></form></section>`;
  }
  function tAcces() {
    const p = S.project;
    return `
    <section class="panel"><div class="panel-head"><h2>Personnes qui ont accès</h2></div>
      <div class="list">${S.access.map((u) => `<div class="row"><span class="ico">${ic('mail')}</span><div class="grow"><div class="title">${esc(u.name)}</div><div class="sub">${esc(u.email)}</div></div><button class="x" data-act="user-remove" data-id="${u.id}" aria-label="Retirer l’accès de ${esc(u.email)}">×</button></div>`).join('') || '<p class="muted">Personne pour l’instant.</p>'}</div>
      <form class="inline" data-form="user" style="margin-top:14px"><input id="u-n" type="text" placeholder="Prénom" aria-label="Prénom" style="flex:0 1 140px"><input id="u-e" type="email" placeholder="adresse@client.fr" aria-label="E-mail"><button class="btn btn-line btn-sm" type="submit">Donner l’accès</button></form>
      <p class="small muted" style="margin-top:10px">Chaque personne se connecte avec son e-mail : un lien et un code à 6 chiffres, sans mot de passe ni compte Google.</p></section>
    <form class="panel form" data-form="infos"><div class="panel-head" style="margin:0"><h2>Infos du projet</h2></div>
      <div class="line"><div class="field"><label for="p-c">Client</label><input id="p-c" type="text" value="${esc(p.client)}"></div><div class="field"><label for="p-p">Projet</label><input id="p-p" type="text" value="${esc(p.projet)}"></div></div>
      <div class="line"><div class="field"><label for="p-ct">Prénom du contact</label><input id="p-ct" type="text" value="${esc(p.contactName)}"></div><div class="field"><label for="p-g">Mise en ligne prévue</label><input id="p-g" type="date" value="${dayKey(p.golive)}"></div></div>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:500;margin-bottom:8px">Registre</legend><div class="radio"><label><input type="radio" name="p-r" value="vous" ${p.registre !== 'tu' ? 'checked' : ''}> Vouvoiement</label><label><input type="radio" name="p-r" value="tu" ${p.registre === 'tu' ? 'checked' : ''}> Tutoiement</label></div></fieldset>
      <div><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>`;
  }
  function tActivite() {
    const p = S.project;
    return `<section class="panel"><div class="list">${p.activity.map((a) => `<div class="row"><div class="grow"><div class="title" style="font-weight:400"><strong style="font-weight:500">${esc(who(a.by))}</strong> ${esc(a.text)}</div><div class="sub">${fmt(a.at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div></div>${a.seen === false ? '<span class="chip warn">Nouveau</span>' : ''}</div>`).join('') || '<p class="muted">Aucune activité.</p>'}</div></section>`;
  }

  /* ---------- Connexion ---------- */
  function vConnexion() {
    const L = S.login;
    const demo = API.demo ? `<div class="or">ou, pour la démo</div><div class="demo-pick"><button class="btn btn-line" type="button" data-act="demo-as" data-email="claire@maisonlumen.fr">Entrer comme cliente (Claire, Maison Lumen)</button><button class="btn btn-line" type="button" data-act="demo-as" data-email="louis@agence-orem.fr">Entrer comme agence (Louis)</button></div>` : '';
    const expired = /lien=expire/.test(location.search) ? '<div class="alert">' + ic('alert') + '<div>Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau.</div></div>' : '';
    const form = L.step === 'email'
      ? `<form data-form="login" novalidate>
          <div><h1 style="font-size:28px">Connexion à votre espace</h1><p class="muted" style="margin-top:8px">Saisissez l’e-mail utilisé pour votre projet. On vous envoie un lien et un code, sans mot de passe à retenir.</p></div>
          ${expired}
          <div class="field"><label for="em">Adresse e-mail</label><input id="em" type="email" autocomplete="email" placeholder="vous@entreprise.fr" value="${esc(L.email)}" required></div>
          <button class="btn btn-primary" type="submit">${ic('mail')}Recevoir mon lien de connexion</button>
          ${demo}
        </form>`
      : `<form data-form="verify" novalidate>
          <div><h1 style="font-size:28px">Vérifiez votre boîte mail</h1><p class="muted" style="margin-top:8px">Si <strong style="color:var(--fg)">${esc(L.email)}</strong> a un espace, un e-mail vient de partir. Cliquez sur le lien, ou saisissez le code à 6 chiffres.</p></div>
          ${L.dev ? `<div class="devcode">${API.demo ? 'Démo' : 'En local'}, aucun e-mail n’est envoyé. Code : <b>${esc(L.dev)}</b></div>` : ''}
          <div class="field"><label for="o1">Code à 6 chiffres</label><div class="otp">${[1, 2, 3, 4, 5, 6].map((i) => `<input id="o${i}" type="text" inputmode="numeric" autocomplete="${i === 1 ? 'one-time-code' : 'off'}" aria-label="Chiffre ${i}">`).join('')}</div></div>
          <button class="btn btn-primary" type="submit">Accéder à mon espace</button>
          <button class="ghost" type="button" data-act="login-back" style="justify-content:center">Changer d’adresse e-mail</button>
          <p class="demo-tag">Le code reste valable 15 minutes. Votre appareil reste connecté 30 jours.</p>
        </form>`;
    return `<div class="login">
      <section class="login-art">
        <div class="brand" style="padding:0;position:relative;z-index:1"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b></div>
        <div style="position:relative;z-index:1;margin-block:40px"><div class="k">Espace client</div><h1>Tout votre projet, au même endroit.</h1><p>Où en est le site, ce qu’on attend de vous, vos fichiers et vos factures. Sans Notion, sans compte Google.</p></div>
        <p class="small art-foot" style="position:relative;z-index:1;color:var(--night-muted)">Orem, marque d’ICONOKOM · agence-orem.fr</p>
      </section>
      <section class="login-form">${form}</section>
    </div>`;
  }

  /* ---------- Rendu ---------- */
  const root = $('#root');
  function render(focus) {
    if (S.loading) { root.innerHTML = ''; return; }
    if (!S.me) { root.innerHTML = vConnexion(); }
    else if (clientMode()) {
      if (!S.project) { root.innerHTML = shell('<div class="empty">Votre espace est en cours de préparation.</div>'); return; }
      const V = { accueil: vAccueil, projet: vProjet, valider: vValider, fichiers: vFichiers, documents: vDocuments, equipe: vEquipe };
      if (!V[S.view]) S.view = 'accueil';
      root.innerHTML = shell(V[S.view]());
    } else {
      const V = { clients: vClients, nouveau: vNouveau, admin: vAdmin };
      if (!V[S.view] || (S.view === 'admin' && !S.project)) S.view = 'clients';
      root.innerHTML = shell(V[S.view]());
    }
    bindFiles();
    if (focus) { const m = $('#main'); if (m) m.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }
  async function go(v) {
    if (v === 'plus') v = 'equipe';
    if (v === 'deconnexion') return logout();
    if (v === 'clients' && isAdmin() && !S.preview) { S.project = null; await loadProjects(); }
    S.view = v; S.valForm = null; render(true);
  }
  async function enter() {
    const r = await API.me(); S.me = r.user; S.team = r.team || [];
    if (S.me.role === 'admin') { await loadProjects(); S.view = 'clients'; S.project = null; }
    else { await loadProjects(); if (S.projects[0]) { const d = await API.project(S.projects[0].id); S.project = d.project; S.people = d.people || {}; } S.view = 'accueil'; }
    S.loading = false; render(true);
  }
  async function openProject(id) { S.tab = 'pilotage'; S.view = 'admin'; await loadProject(id); window.scrollTo(0, 0);
    const a = Core.alerts(S.project); if (a.unseen) { try { await API.action(id, { type: 'seen' }); } catch {} } }
  async function logout() { try { await API.logout(); } catch {} S.me = null; S.project = null; S.preview = false; S.login = { step: 'email', email: '', dev: null }; render(true); }

  async function upload(files, opts = {}) {
    const p = S.project; if (!p || !files.length) return;
    if (S.preview) return toast('Aperçu : les actions sont désactivées.');
    const typeOf = (f) => (f.type.startsWith('image') ? 'Images' : f.type.startsWith('video') ? 'Vidéos' : /pdf|word|text|document|presentation|sheet/.test(f.type) ? 'Textes' : 'Autres');
    let n = 0;
    for (const f of files) {
      S.uploading = { name: f.name, p: 0 }; render();
      try { const r = await API.upload(p.id, f, opts.cat || typeOf(f), (x) => { S.uploading.p = x; const bar = document.querySelector('.progress i'); if (bar) bar.style.width = Math.round(x * 100) + '%'; }); n++; }
      catch (e) { toast(e.message); }
    }
    S.uploading = null;
    if (opts.missing && n) { try { await API.action(p.id, { type: 'missing.done', mid: opts.missing }); } catch {} }
    await loadProject(p.id);
    if (n) { S.project.files.slice(0, n).forEach((f) => (f.fresh = true)); render(); toast(isAdmin() ? `${n} fichier${n > 1 ? 's' : ''} partagé${n > 1 ? 's' : ''} avec le client.` : `${n > 1 ? n + ' fichiers envoyés' : 'Fichier envoyé'}. L’équipe est prévenue.`); }
  }
  function bindFiles() {
    const d = $('#drop');
    if (d) {
      ['dragenter', 'dragover'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.add('over'); }));
      ['dragleave', 'drop'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.remove('over'); }));
      d.addEventListener('drop', (e) => upload([...e.dataTransfer.files]));
    }
  }

  /* ---------- Événements ---------- */
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'file' && t.files.length) {
      const files = [...t.files];
      if (t.dataset.agency) upload(files, { cat: $('#a-cat').value });
      else upload(files, { missing: t.dataset.missing });
      t.value = '';
    }
    if (t.dataset.item) act({ type: 'item.status', iid: t.dataset.item, status: t.value }, 'Livrable mis à jour.');
    if (t.dataset.itemdate && t.value) { const it = S.project.phases.flatMap((x) => x.items).find((x) => x.id === t.dataset.itemdate); act({ type: 'item.status', iid: it.id, status: it.status, due: t.value }, 'Date mise à jour.'); }
    if (t.dataset.inv) act({ type: 'invoice.status', iid: t.dataset.inv, status: t.value }, 'Facture mise à jour.');
  });
  document.addEventListener('click', async (e) => {
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); return go(g.dataset.go); }
    const o = e.target.closest('[data-open]'); if (o) return openProject(o.dataset.open);
    const tb = e.target.closest('[data-tab]'); if (tb) { S.tab = tb.dataset.tab; return render(); }
    const c = e.target.closest('[data-cat]'); if (c) { S.cat = c.dataset.cat; return render(); }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const id = a.dataset.id;
    switch (a.dataset.act) {
      case 'toast': e.preventDefault(); toast(a.dataset.msg); break;
      case 'theme': { const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('orem-theme', r.dataset.theme); } catch {} break; }
      case 'logout': logout(); break;
      case 'approve': if (S.preview) return toast('Aperçu : les actions sont désactivées.'); if (await act({ type: 'val.approve', vid: id }, 'Validation enregistrée. L’équipe est prévenue.')) { S.view = 'valider'; render(); } break;
      case 'changes': if (S.preview) return toast('Aperçu : les actions sont désactivées.'); S.valForm = id; render(); { const t = $('#chg-' + id); t && t.focus(); } break;
      case 'valcancel': S.valForm = null; render(); break;
      case 'task': if (S.preview) return toast('Aperçu : les actions sont désactivées.'); act({ type: 'task.toggle', tid: id }); break;
      case 'task-remove': act({ type: 'task.remove', tid: id }); break;
      case 'missing-remove': act({ type: 'missing.remove', mid: id }); break;
      case 'file-remove': act({ type: 'file.remove', fid: id }, 'Fichier retiré de l’espace.'); break;
      case 'user-remove': act({ type: 'user.remove', id }, 'Accès retiré.'); break;
      case 'seen': act({ type: 'seen' }, 'Tout est marqué comme vu.'); break;
      case 'valreset': act({ type: 'val.reset', vid: id }, 'Validation remise en attente.'); break;
      case 'preview': S.preview = true; S.view = 'accueil'; render(true); break;
      case 'endpreview': S.preview = false; S.view = 'admin'; render(true); break;
      case 'login-back': S.login.step = 'email'; render(); break;
      case 'demo-as': API.as(a.dataset.email); enter(); break;
      case 'copy': { const txt = $('#iban').textContent; const sel = () => { const r = document.createRange(); r.selectNodeContents($('#iban')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('IBAN sélectionné, copiez-le avec Ctrl+C.'); };
        try { navigator.clipboard.writeText(txt).then(() => toast('IBAN copié.'), sel); } catch { sel(); } break; }
    }
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
    switch (f.dataset.form) {
      case 'login': {
        const email = v('em').toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Saisissez une adresse e-mail valide, par exemple vous@entreprise.fr.');
        try { const r = await API.login(email); S.login = { step: 'code', email, dev: r.devCode || null }; render(); $('#o1') && $('#o1').focus(); } catch (err) { toast(err.message); }
        break; }
      case 'verify': {
        const code = [1, 2, 3, 4, 5, 6].map((i) => v('o' + i)).join('');
        if (code.length !== 6) return toast('Saisissez les 6 chiffres du code.');
        try { await API.verify(S.login.email, code); history.replaceState(null, '', location.pathname); await enter(); } catch (err) { toast(err.message); }
        break; }
      case 'changes': {
        const txt = v('chg-' + f.dataset.id);
        if (!txt) return toast('Écrivez ce que vous aimeriez changer.');
        if (await act({ type: 'val.changes', vid: f.dataset.id, comment: txt }, 'Remarques envoyées. Réponse sous 24 h ouvrées.')) { S.valForm = null; render(); }
        break; }
      case 'create': {
        try { const r = await API.create({ client: v('n-client'), projet: v('n-projet'), contactName: v('n-contact'), email: v('n-email'), start: v('n-start') || undefined, amountHT: v('n-ht'), registre: (f.querySelector('[name=n-reg]:checked') || {}).value });
          await loadProjects(); await openProject(r.id); toast('Espace créé. Ajoutez la prochaine étape puis donnez l’accès au client.'); } catch (err) { toast(err.message); }
        break; }
      case 'phase': act({ type: 'phase.set', n: v('a-phase') }, 'Étape mise à jour.'); break;
      case 'next': act({ type: 'next.set', title: v('a-nt'), text: v('a-nx'), go: v('a-ng') }, 'Prochaine étape publiée.'); break;
      case 'note': if (await act({ type: 'note.set', text: v('a-note') })) act({ type: 'meeting.set', title: v('a-mt'), when: v('a-mw') || null }, 'Publié dans l’espace du client.'); break;
      case 'task': if (v('a-task')) act({ type: 'task.add', t: v('a-task') }, 'Action ajoutée.'); break;
      case 'missing': if (v('a-mi')) act({ type: 'missing.add', t: v('a-mi'), sub: v('a-ms') }, 'Ajouté aux fichiers attendus.'); break;
      case 'valreq': act({ type: 'val.request', vid: f.dataset.id, link: v('vl-' + f.dataset.id) }, 'Le client voit la demande de validation.'); break;
      case 'billing': act({ type: 'project.update', totalHT: v('b-ht'), quote: v('b-q') }, 'Montant enregistré.'); break;
      case 'invoice': if (!v('i-ht')) return toast('Indiquez le montant HT.'); act({ type: 'invoice.add', label: v('i-l') || 'Facture', num: v('i-n'), ht: v('i-ht'), status: v('i-s') }, 'Facture ajoutée.'); break;
      case 'user': act({ type: 'user.add', email: v('u-e'), name: v('u-n') }, 'Accès donné. La personne peut se connecter avec son e-mail.'); break;
      case 'infos': act({ type: 'project.update', client: v('p-c'), projet: v('p-p'), contactName: v('p-ct'), golive: v('p-g') || undefined, registre: (f.querySelector('[name=p-r]:checked') || {}).value }, 'Infos enregistrées.'); break;
    }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.closest('.otp')) {
      const digits = t.value.replace(/\D/g, '');
      if (digits.length > 1) { const all = [...document.querySelectorAll('.otp input')]; digits.slice(0, 6).split('').forEach((d, i) => all[i] && (all[i].value = d)); all[Math.min(5, digits.length - 1)].focus(); return; }
      t.value = digits; if (digits && t.nextElementSibling) t.nextElementSibling.focus();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.otp') && e.key === 'Backspace' && !e.target.value && e.target.previousElementSibling) e.target.previousElementSibling.focus();
  });

  try { const th = localStorage.getItem('orem-theme'); if (th) document.documentElement.dataset.theme = th; } catch {}
  if (API.demo) { S.loading = false; render(); }
  else enter().catch(() => { S.loading = false; render(); });
})();
