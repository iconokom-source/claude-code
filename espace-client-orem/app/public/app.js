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
    cat: 'Tous', valForm: null, qa: null, ob: null, tool: null, bk: null, zoom: null, teaser: null, sig: null, login: { step: 'email', email: '', dev: null }, uploading: null, loading: true };
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
    const link = ([id, l, i]) => `<a href="#${id}" data-go="${id}" ${S.view === id || (id === 'clients' && S.view === 'admin') ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${id === 'valider' && pending() ? `<span class="badge" aria-label="${pending()} à valider">${pending()}</span>` : ''}${id === 'messages' && unread() ? `<span class="badge" aria-label="${unread()} non lus">${unread()}</span>` : ''}${id === 'clients' ? alertsTotal() : ''}</a>`;
    const groups = admin
      ? [['Pilotage', [['clients', 'Clients', 'team'], ['nouveau', 'Nouvel espace', 'plus']]]]
      : [['Mon projet', [['accueil', 'Accueil', 'home'], ['projet', 'Étapes', 'map'], ['valider', 'À valider', 'ok'], ['maquettes', 'Maquettes', 'figma']]],
         ['Échanges', [['messages', 'Messages', 'chat'], ['fichiers', 'Fichiers', 'folder'], ['documents', 'Documents', 'doc']]],
         ['Outils', [['outils', 'Boîte à outils', 'plus'], ['biblio', 'Bibliothèque', 'eye']]],
         ['Aide', [['equipe', 'Équipe et aide', 'team']]]];
    const navHtml = groups.map(([t, items]) => `<div class="sec">${t}</div>${items.map(link).join('')}`).join('');
    const tabs = admin ? [['clients', 'Clients', 'team'], ['nouveau', 'Nouvel espace', 'plus'], ['deconnexion', 'Sortir', 'out']] : [['accueil', 'Accueil', 'home'], ['projet', 'Étapes', 'map'], ['messages', 'Messages', 'chat'], ['fichiers', 'Fichiers', 'folder'], ['plus', 'Plus', 'team']];
    const tabHtml = tabs.map(([id, l, i]) => { const cur = id === 'plus' ? ['plus', 'valider', 'maquettes', 'documents', 'outils', 'biblio', 'equipe'].includes(S.view) : S.view === id || (id === 'clients' && S.view === 'admin');
      return `<a href="#${id}" data-go="${id}" ${cur ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${id === 'messages' && unread() ? `<span class="badge">${unread()}</span>` : ''}${id === 'plus' && pending() ? `<span class="badge">${pending()}</span>` : ''}</a>`; }).join('');
    let card;
    if (admin) {
      const waiting = S.projects.filter((x) => x.alerts.newFiles || x.alerts.changes || x.alerts.newMessages || x.alerts.requests).length;
      card = `<div class="pcard"><strong>${S.projects.length} espace${S.projects.length > 1 ? 's' : ''} client${S.projects.length > 1 ? 's' : ''}</strong><span class="small">${waiting ? waiting + ' attend' + (waiting > 1 ? 'ent' : '') + ' une action de l’agence' : 'Rien en attente côté agence'}</span></div>`;
    } else {
      const dots = p.phases.map((x) => `<i class="${p.deliveredAt || x.n < p.phase ? 'done' : x.n === p.phase ? 'on' : ''}"></i>`).join('');
      card = `<div class="pcard"><strong>${esc(p.client)}</strong><span class="small">${p.deliveredAt ? 'Site en ligne · projet livré' : `Étape ${p.phase} · ${esc(p.phases[p.phase - 1].t)}`}</span><div class="pdots">${dots}<span>${p.deliveredAt ? '5/5' : p.phase + '/5'}</span></div></div>`;
    }
    const meImg = S.me.photo && IMG[S.me.photo] && !S.preview ? `<img src="${IMG[S.me.photo]}" alt="">` : esc(((S.preview ? p.contactName : S.me.name) || '?')[0]);
    return `${S.preview ? `<div class="preview-bar">${ic('eye', 'width:18px;height:18px')}<span>Aperçu de l’espace de ${esc(p.client)}, tel que le client le voit</span><button data-act="endpreview">Revenir à l’administration</button></div>` : ''}
    <a class="skip" href="#main" data-act="skip">Aller au contenu</a>
    <div class="app">
      <aside class="side" aria-label="Navigation">
        <div class="brand"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b><span class="tag">${admin ? 'Agence' : 'Client'}</span></div>
        ${card}
        <nav class="nav">${navHtml}</nav>
        ${API.demo && !S.preview ? `<label class="demo-sel"><span>${ic('eye')}Démo : voir l\u2019espace de</span><select data-demo aria-label="Changer d\u2019espace de démo">${[['claire@maisonlumen.fr', 'Claire · Maison Lumen (en cours)'], ['julie@cabinet-varenne.fr', 'Julie · Cabinet Varenne (démarrage)'], ['hugo@huchet-demorge.fr', 'Hugo · Huchet-Demorge (livré)'], ['louis@agence-orem.fr', 'Louis · vue agence']].map(([e, l]) => `<option value="${e}" ${S.me.email === e ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
        <div class="side-foot">
          <div class="me-av">${meImg}</div>
          <div class="me-txt"><strong>${esc(S.preview ? p.contactName || p.client : S.me.name)}</strong><span class="role">${admin ? 'Agence' : 'Client'}</span></div>
          <button class="icon-btn" data-act="theme" aria-label="Changer de thème" title="Changer de thème">${ic('moon')}</button>
          ${S.preview ? '' : `<button class="icon-btn" data-act="logout" aria-label="Se déconnecter" title="Se déconnecter">${ic('out')}</button>`}
        </div>
      </aside>
      <div class="stage">
        <header class="topbar"><div class="brand"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b></div>${API.demo && !S.preview ? `<label class="demo-sel top"><span>${ic('eye')}Démo : voir l\u2019espace de</span><select data-demo aria-label="Changer d\u2019espace de démo">${[['claire@maisonlumen.fr', 'Claire · Maison Lumen (en cours)'], ['julie@cabinet-varenne.fr', 'Julie · Cabinet Varenne (démarrage)'], ['hugo@huchet-demorge.fr', 'Hugo · Huchet-Demorge (livré)'], ['louis@agence-orem.fr', 'Louis · vue agence']].map(([e, l]) => `<option value="${e}" ${S.me.email === e ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}${API.demo && !S.preview ? '' : `<span class="small">${admin ? 'Espace agence' : esc(p.client)}</span>`}</header>
        <div class="sheet"><main class="main" id="main" tabindex="-1"><div class="wrap">${content}</div></main></div>
      </div>
      <nav class="tabbar" aria-label="Navigation principale">${tabHtml}</nav>
    </div>`;
  }
  function alertsTotal() { const n = S.projects.reduce((s, p) => s + p.alerts.newFiles + p.alerts.changes + p.alerts.newMessages + p.alerts.requests, 0); return n ? `<span class="badge">${n}</span>` : ''; }

  /* ---------- Vues client ---------- */
  function phaseProgress(ph, i) {
    const p = S.project;
    if (ph.n < p.phase) return 100;
    if (ph.n > p.phase) return 0;
    const n = ph.items.length || 1;
    const v = ph.items.reduce((s, it) => s + (it.status === 'done' ? 1 : it.status === 'on' ? 0.5 : 0), 0);
    return Math.max(8, Math.round((v / n) * 100));
  }
  const CTA = { valider: ['Voir et valider', 'valider'], fichiers: ['Déposer mes fichiers', 'fichiers'], projet: ['Voir le projet', 'projet'], documents: ['Voir les documents', 'documents'], equipe: ['Voir les créneaux', 'equipe'], outils: ['Ouvrir la boîte à outils', 'outils'], messages: ['Lire le message', 'messages'], maquettes: ['Voir les maquettes', 'maquettes'] };

  function vAccueil() {
    const p = S.project, nx = Core.nextStep(p), ph = p.phases[p.phase - 1];
    const cta = CTA[nx.go];
    const ctaHtml = nx.go === 'cal' ? `<a class="btn" href="${CAL}" target="_blank" rel="noopener">Choisir un créneau ${ic('arrow')}</a>` : cta ? `<a class="btn" href="#${cta[1]}" data-go="${cta[1]}">${cta[0]} ${ic('arrow')}</a>` : '';
    const ready = p.validations.filter((v) => v.status === 'ready');
    const actions = [
      ...ready.map((v) => ({ t: 'Valider : ' + v.t.toLowerCase(), sub: R('Prêt depuis le ', 'Prêt depuis le ') + fmt(v.readyAt), go: 'valider' })),
      ...p.missing.map((m) => ({ t: 'Déposer : ' + m.t.toLowerCase(), sub: m.sub, go: 'fichiers' })),
      ...p.tasks.map((t) => ({ t: t.t, done: t.done, tid: t.id, go: t.go }))
    ];
    const doneN = actions.filter((a) => a.done).length;
    let rk = 0;
    const note = p.note && p.note.text;
    const author = S.team.find((u) => u.id === p.note.by);
    const delivs = p.files.filter((f) => f.from === 'agence' && f.cat === 'Livrable').slice(0, 3);
    return `
    <div class="head"><div><h1 class="brandish">Bonjour ${esc(p.contactName || S.me.name)}</h1><p class="lead">${esc(cap(fmtLong(Date.now())))} · ${esc(p.projet)}</p></div></div>
    <section class="next" aria-labelledby="nx"><div><div class="k">Prochaine étape</div><h2 id="nx">${esc(nx.title)}</h2>${nx.text ? `<p>${esc(nx.text)}</p>` : ''}<div class="meta">Étape ${p.phase} sur 5 · ${esc(ph.t)}</div></div>${ctaHtml}</section>
    ${unreadBanner()}
    ${kpisClient()}
    <section class="panel" aria-labelledby="av">
      <div class="panel-head"><h2 id="av">${ic('map')}Où en est le projet</h2><a href="#projet" data-go="projet">Voir le détail</a></div>
      <div class="steps">${p.phases.map((x, i) => `<div class="step ${x.n === p.phase ? 'on' : ''}"><div class="bar"><i style="width:${phaseProgress(x, i)}%"></i></div><div class="t">${esc(x.t)}</div><div class="d">${fmt(x.from)} au ${fmt(x.to)}</div></div>`).join('')}</div>
      <p class="steps-foot">Mise en ligne prévue vers le ${fmt(p.golive, { day: 'numeric', month: 'long' })}. Dates indicatives, ajustées ensemble à chaque étape.</p>
    </section>
    <div class="grid2">
      <section class="panel" aria-labelledby="td">
        <div class="panel-head"><h2 id="td">${ic('ok')}${R('Vos actions', 'Tes actions')}</h2>${actions.length ? `<span class="small muted num">${doneN} sur ${actions.length}</span>` : ''}</div>
        <div class="list">${actions.map((a) => a.tid
          ? `<div class="row ${a.done ? 'done' : ''}"><button class="check ${a.done ? 'done' : ''}" data-act="task" data-id="${a.tid}" aria-label="${a.done ? 'Décocher' : 'Cocher'} : ${esc(a.t)}" aria-pressed="${!!a.done}">${a.done ? ic('check') : ''}</button><div class="grow"><div class="title">${esc(a.t)}</div></div>${!a.done && a.go ? (a.go === 'cal' ? `<a class="btn btn-line btn-sm" href="${CAL}" target="_blank" rel="noopener">Réserver</a>` : `<a class="btn btn-line btn-sm" href="#${a.go}" data-go="${a.go}">Ouvrir</a>`) : ''}</div>`
          : `<div class="row"><span class="rank">${String(++rk).padStart(2, '0')}</span><div class="grow"><div class="title">${esc(a.t)}</div>${a.sub ? `<div class="sub">${esc(a.sub)}</div>` : ''}</div><a class="btn btn-line btn-sm" href="#${a.go}" data-go="${a.go}">Ouvrir</a></div>`).join('') || `<p class="muted">${R('Rien à faire de votre côté pour le moment.', 'Rien à faire de ton côté pour le moment.')}</p>`}</div>
      </section>
      <section class="panel" aria-labelledby="sm">
        <div class="panel-head"><h2 id="sm">${ic('cal')}Cette semaine</h2>${p.note.at ? `<span class="small muted">Mis à jour le ${fmt(p.note.at, { day: 'numeric', month: 'long' })}</span>` : ''}</div>
        ${note ? `<div class="note">${author && IMG[author.photo] ? `<img class="avatar" src="${IMG[author.photo]}" alt="">` : ''}<div><blockquote>${esc(note)}</blockquote><div class="who">${esc(author ? author.name.split(' ')[0] + ', ' + (author.title || '').toLowerCase() : '')}</div></div></div>` : `<p class="muted">Le point de la semaine arrive bientôt.</p>`}
        ${p.meeting && p.meeting.when ? `<div class="meet"><span class="ico">${ic('cal')}</span><div class="grow"><div class="title">${esc(p.meeting.title || 'Rendez-vous')}</div><div class="sub">${esc(cap(fmtTime(p.meeting.when)))}</div></div></div>` : ''}
      </section>
    </div>
    ${qaPanel()}
    ${delivs.length ? `<section class="panel" aria-labelledby="dl"><div class="panel-head"><h2 id="dl">${ic('figma')}Derniers ajouts de l’agence</h2><a href="#fichiers" data-go="fichiers">Tous les fichiers</a></div><div class="list">${delivs.map(fileRow).join('')}</div></section>` : ''}`;
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
    <div class="head"><div><h1>${R('Votre projet', 'Ton projet')}</h1><p class="lead">${esc(p.projet)}</p></div><span class="chip hl">Étape ${p.phase} sur 5</span></div>
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
        : `<div class="acts"><button class="btn btn-primary" data-act="approve" data-id="${v.id}">${ic('check')}${R('Je valide', 'Je valide')}</button><button class="btn btn-line" data-act="changes" data-id="${v.id}">Demander des modifications</button></div>
           <p class="small muted">Valider, c’est donner ${R('votre', 'ton')} feu vert écrit pour passer à la suite. Il est enregistré avec la date et l’heure.</p>`;
      return `<section class="panel valcard"><div><span class="chip warn">En attente de ${R('votre', 'ta')} validation</span></div>
        <h2>${esc(v.t)}</h2><p class="muted">${esc(v.sub)}. Prêt depuis le ${fmt(v.readyAt, { day: 'numeric', month: 'long' })}.</p>
        ${v.link ? `<a class="link" href="${esc(v.link)}" target="_blank" rel="noopener">Ouvrir et regarder ${ic('arrow', 'width:14px;height:14px;vertical-align:-2px')}</a>` : ''}
        ${form}</section>`;
    };
    return `
    <div class="head"><div><h1>À valider</h1><p class="lead">On avance avec ${R('votre', 'ton')} feu vert</p></div></div>
    ${ready.map(card).join('') || `<div class="empty">Rien à valider pour l’instant. On ${R('vous', 'te')} prévient dès que la prochaine étape est prête.</div>`}
    ${done.length ? `<section class="panel"><div class="panel-head"><h2>${ic('ok')}Déjà ${R('traité', 'traité')}</h2></div><div class="list">${done.map((v) => { const h = v.history[v.history.length - 1] || {};
      return `<div class="row"><span class="ico ${v.status === 'approved' ? 'ok' : ''}">${ic(v.status === 'approved' ? 'ok' : 'chat')}</span><div class="grow"><div class="title">${esc(v.t)}</div><div class="sub">${v.status === 'approved' ? 'Validé le ' + fmt(h.at, { day: 'numeric', month: 'long' }) : 'Remarques envoyées le ' + fmt(h.at, { day: 'numeric', month: 'long' }) + (h.comment ? ' : « ' + esc(h.comment) + ' »' : '')}</div></div>${v.status === 'approved' ? '<span class="chip ok">Validé</span>' : '<span class="chip hl">En cours de reprise</span>'}</div>`; }).join('')}</div></section>` : ''}
    ${later.length ? `<section class="panel"><div class="panel-head"><h2>${ic('lock')}Les prochaines validations</h2></div><div class="list">${later.map((v) => `<div class="row"><span class="ico">${ic('lock')}</span><div class="grow"><div class="title">${esc(v.t)}</div><div class="sub">${esc(v.sub)}</div></div><span class="small muted num" style="text-align:right">Vers le ${fmt(v.due)}</span></div>`).join('')}</div></section>` : ''}`;
  }

  function vFichiers() {
    const p = S.project;
    const mine = p.files.filter((f) => f.from === 'client');
    const cats = ['Tous', ...Core.FILE_CATS];
    const shown = S.cat === 'Tous' ? mine : mine.filter((f) => f.cat === S.cat);
    const count = (c) => (c === 'Tous' ? mine.length : mine.filter((f) => f.cat === c).length);
    const delivs = p.files.filter((f) => f.from === 'agence' && f.cat === 'Livrable');
    return `
    <div class="head"><div><h1>Fichiers</h1><p class="lead">Pas besoin de compte Google</p></div></div>
    <label class="drop" id="drop" for="file-in">
      <span class="ico hl">${ic('up')}</span>
      <strong>${R('Glissez vos fichiers ici, ou cliquez pour choisir', 'Glisse tes fichiers ici, ou clique pour choisir')}</strong>
      <span class="small muted">Photos, vidéos, textes, logos. Jusqu’à 2 Go par fichier. On les range pour ${R('vous', 'toi')}.</span>
      ${S.uploading ? `<span class="small" style="width:100%;max-width:320px">${esc(S.uploading.name)}<span class="progress"><i style="width:${Math.round(S.uploading.p * 100)}%"></i></span></span>` : ''}
      <input id="file-in" type="file" multiple class="sr">
    </label>
    ${p.missing.length ? `<section class="panel" aria-labelledby="mq"><div class="panel-head"><h2 id="mq">${ic('alert')}Ce qu’il nous manque</h2><span class="small muted">${p.missing.length} élément${p.missing.length > 1 ? 's' : ''}</span></div>
      ${p.missing.map((m) => `<div class="ask"><span class="ico">${ic('folder')}</span><div style="flex:1;min-width:0"><div style="font-weight:500">${esc(m.t)}</div>${m.sub ? `<div class="small muted">${esc(m.sub)}</div>` : ''}</div><label class="btn btn-line btn-sm" for="miss-${m.id}">Déposer</label><input id="miss-${m.id}" type="file" multiple class="sr" data-missing="${m.id}"></div>`).join('')}</section>` : ''}
    <section class="panel" aria-labelledby="mf">
      <div class="panel-head"><h2 id="mf">${ic('up')}${R('Vos envois', 'Tes envois')}</h2><span class="small muted num">${mine.length} fichier${mine.length > 1 ? 's' : ''}</span></div>
      <div class="cats" role="group" aria-label="Filtrer par type" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">${cats.map((c) => `<button class="cat" data-cat="${c}" aria-pressed="${S.cat === c}"><strong>${c}</strong><span class="small muted num">${count(c)}</span></button>`).join('')}</div>
      <div class="list" style="margin-top:18px">${shown.map(fileRow).join('') || '<p class="muted">Aucun fichier ici pour l’instant.</p>'}</div>
    </section>
    <section class="panel" aria-labelledby="lv"><div class="panel-head"><h2 id="lv">${ic('figma')}Livrables de l’agence</h2></div>
      <div class="list">${delivs.map(fileRow).join('') || '<p class="muted">Les maquettes et documents de l’agence apparaîtront ici.</p>'}</div></section>`;
  }

  function vDocuments() {
    const p = S.project, b = p.billing;
    const paid = p.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.ttc, 0);
    const docs = p.files.filter((f) => f.from === 'agence' && f.cat !== 'Livrable');
    const st = { paid: '<span class="chip ok">Payée</span>', due: '<span class="chip warn">À régler</span>', future: '<span class="chip idle">À venir</span>' };
    return `
    <div class="head"><div><h1>Documents</h1><p class="lead">Devis, factures et paiement</p></div></div>
    <div class="grid2">
      <section class="panel"><div class="small muted">Montant du projet</div><div class="money num" style="margin-top:6px">${money(b.totalHT)} HT</div><div class="small muted num">${money(b.totalTTC)} TTC${b.quote ? ' · devis ' + esc(b.quote) : ''}${b.signedAt ? ' signé le ' + fmt(b.signedAt) : ''}</div></section>
      <section class="panel"><div class="small muted">Déjà réglé</div><div class="money num" style="margin-top:6px">${money(paid)} TTC</div><div class="small muted num">Reste ${money(Math.max(0, b.totalTTC - paid))} TTC</div></section>
    </div>
    <section class="panel"><div class="panel-head"><h2>${ic('doc')}Factures</h2></div><div class="list">${p.invoices.map((i) => `<div class="row"><span class="ico ${i.status === 'paid' ? 'ok' : ''}">${ic('doc')}</span><div class="grow"><div class="title">${esc(i.label)}${i.num ? ' ' + esc(i.num) : ''}</div><div class="sub num">${money(i.ht)} HT · ${money(i.ttc)} TTC${i.status === 'paid' && i.paidAt ? ' · réglée le ' + fmt(i.paidAt) : i.status === 'future' ? ' · envoyée à la livraison' : ''}</div></div>${st[i.status] || ''}</div>`).join('') || '<p class="muted">Aucune facture pour le moment.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>${ic('down')}PDF à télécharger</h2></div><div class="list">${docs.map(fileRow).join('') || '<p class="muted">Les devis et factures en PDF apparaîtront ici.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>${ic('copy')}Coordonnées bancaires</h2><span class="small muted">Banque Qonto</span></div>
      <dl class="kv"><dt>Titulaire</dt><dd>ICONOKOM, 34 place du Général de Gaulle, Bureau 3, 59000 Lille</dd><dt>IBAN</dt><dd id="iban">FR76 1695 8000 0188 1420 4296 259</dd><dt>BIC</dt><dd>QNTOFRP1XXX</dd></dl>
      <div class="copy" style="margin-top:16px"><button class="btn btn-line btn-sm" data-act="copy">${ic('copy')}Copier l’IBAN</button></div></section>`;
  }

  function vEquipe() {
    return `
    <div class="head"><div><h1>Équipe et aide</h1><p class="lead">Une question ? On répond sous 24 h ouvrées</p></div><button class="btn btn-line" data-act="obopen">${ic('play')}Revoir la visite guidée</button></div>
    <div class="team">${S.team.map((u) => `<section class="panel person">${IMG[u.photo] ? `<img src="${IMG[u.photo]}" alt="">` : ''}<div><h3>${esc(u.name)}</h3><div class="role-t">${esc(u.title || '')}</div>${u.phone ? `<div class="small muted num" style="margin-top:4px">${esc(u.phone)}</div>` : ''}</div>${u.wa ? `<a class="btn btn-line btn-sm" href="${u.wa}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a>` : '<span class="small muted">Joignable via Louis</span>'}</section>`).join('')}</div>
    <section class="panel" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
      <div style="min-width:0;flex:1 1 280px"><h2>Besoin d’en parler de vive voix ?</h2><p class="muted" style="margin-top:6px">${R('Réservez', 'Réserve')} une visio de 30 minutes quand ${R('vous voulez', 'tu veux')}.</p></div>
      <a class="btn btn-primary" href="${CAL}" target="_blank" rel="noopener">${ic('cal')}Réserver une visio</a></section>
    ${qaPanel()}
    <section class="panel"><div class="panel-head"><h2>${ic('chat')}Questions fréquentes</h2></div>
      <details><summary>Que se passe-t-il quand je valide une étape ?</summary><p>La validation est enregistrée avec la date et l’heure, l’équipe est prévenue et l’étape suivante démarre.</p></details>
      <details><summary>Le site m’appartient-il ?</summary><p>Oui. Le site est hébergé sur ${R('votre', 'ton')} propre compte Webflow : ${R('vous en êtes propriétaire, vous êtes libres', 'tu en es propriétaire, tu es libre')}.</p></details>
      <details><summary>Où déposer un fichier très lourd ?</summary><p>Dans l’onglet Fichiers, jusqu’à 2 Go par fichier. Au-delà, ${R('envoyez', 'envoie')}-nous un lien WeTransfer sur WhatsApp.</p></details>
      <details><summary>Comment me reconnecter ?</summary><p>Sur la page de connexion, ${R('saisissez votre', 'saisis ton')} e-mail : un lien et un code arrivent en quelques secondes. Pas de mot de passe à retenir.</p></details>
    </section>`;
  }


  function unreadBanner() {
    const n = unread(); if (!n) return '';
    const m = (S.project.messages || []).filter((x) => x.readByClient === false).sort((a, b) => new Date(b.at) - new Date(a.at))[0];
    const u = person(m.by);
    return `<a class="newmsg" href="#messages" data-go="messages">${IMG[u.photo] ? `<img class="avatar" src="${IMG[u.photo]}" alt="">` : ''}<span class="grow"><strong>${esc(u.name.split(' ')[0])} ${m.loom ? R('vous a envoyé une vidéo', 't\u2019a envoyé une vidéo') : R('vous a écrit', 't\u2019a écrit')}</strong><span>${esc(m.loom ? m.loom.title + (m.loom.duration ? ' · ' + m.loom.duration : '') : m.text)}</span></span><span class="btn btn-primary btn-sm">${m.loom ? ic('play') + 'Regarder' : 'Lire'}</span></a>`;
  }
  /* ---------- Chiffres clés ---------- */
  const daysTo = (d) => Math.ceil((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  function kpisClient() {
    const p = S.project, j = daysTo(p.golive);
    const sent = p.files.filter((f) => f.from === 'client').length;
    const k = (v, l, go) => `<a class="kpi" href="#${go}" data-go="${go}"><span class="v num">${v}</span><span class="l">${l}</span></a>`;
    return `<div class="kpis">
      ${k(j > 0 ? `J-${j}` : 'En ligne', j > 0 ? 'avant la mise en ligne' : R('Votre', 'Ton') + ' site est publié', 'projet')}
      ${k(`${p.phase}<small>/5</small>`, esc(p.phases[p.phase - 1].t), 'projet')}
      ${k(pending(), pending() > 1 ? 'éléments à valider' : 'élément à valider', 'valider')}
      ${k(`${sent}`, sent > 1 ? 'fichiers envoyés' : 'fichier envoyé', 'fichiers')}
    </div>`;
  }
  function kpisAdmin() {
    const P = S.projects, sum = (f) => P.reduce((s, p) => s + f(p), 0);
    const k = (v, l) => `<div class="kpi"><span class="v num">${v}</span><span class="l">${l}</span></div>`;
    const pl = (n, one, many) => k(n, n > 1 ? many : one);
    return `<div class="kpis">${pl(P.length, 'espace actif', 'espaces actifs')}${pl(P.filter((p) => p.alerts.newFiles || p.alerts.changes).length, 'à traiter par l’agence', 'à traiter par l’agence')}${pl(sum((p) => p.alerts.waiting), 'validation chez un client', 'validations chez les clients')}${pl(sum((p) => p.alerts.newFiles), 'nouveau fichier', 'nouveaux fichiers')}</div>`;
  }

  /* ---------- Réponses instantanées ---------- */
  const QA = () => [['ou', 'Où en est le projet ?'], ['moi', 'Qu’attendez-vous de ' + R('moi', 'moi') + ' ?'], ['rdv', 'Quel est le prochain rendez-vous ?'], ['payer', 'Que reste-t-il à payer ?'], ['qui', 'Qui contacter ?']];
  function qaAnswer(id) {
    const p = S.project, ph = p.phases[p.phase - 1];
    const done = ph.items.filter((i) => i.status === 'done').length;
    const lead = S.team[0] || {};
    switch (id) {
      case 'ou': if (p.deliveredAt) return `${R('Votre', 'Ton')} site est en ligne depuis le <strong>${fmt(p.deliveredAt, { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. ${p.results ? esc(p.results.stats[0][0]) + ' ' + esc(p.results.stats[0][1]) + '. ' : ''}Pour aller plus loin, on peut le faire évoluer chaque mois. <a href="#outils" data-go="outils">Voir les options</a>`;
      case 'ou': return `Le projet est à l’étape ${p.phase} sur 5 : <strong>${esc(ph.t)}</strong>. ${done} livrable${done > 1 ? 's' : ''} sur ${ph.items.length} ${done > 1 ? 'sont faits' : 'est fait'} sur cette étape. Mise en ligne prévue vers le <strong>${fmt(p.golive, { day: 'numeric', month: 'long' })}</strong>, dans ${Math.max(0, daysTo(p.golive))} jours. <a href="#projet" data-go="projet">Voir les étapes</a>`;
      case 'moi': { const list = [...p.validations.filter((v) => v.status === 'ready').map((v) => 'valider ' + v.t.toLowerCase()), ...p.missing.map((m) => 'déposer ' + m.t.toLowerCase())];
        return list.length ? `${list.length} chose${list.length > 1 ? 's' : ''} ${R('vous attendent', 't’attendent')} : ${list.map(esc).join(', ')}. <a href="#${pending() ? 'valider' : 'fichiers'}" data-go="${pending() ? 'valider' : 'fichiers'}">Commencer</a>` : `Rien pour le moment. On ${R('vous', 'te')} prévient dès qu’on a besoin de ${R('vous', 'toi')}.`; }
      case 'rdv': return p.meeting && p.meeting.when ? `<strong>${esc(p.meeting.title)}</strong>, ${esc(fmtTime(p.meeting.when))}. Besoin d’un autre créneau ? <a href="${CAL}" target="_blank" rel="noopener">Réserver une visio</a>` : `Aucun rendez-vous fixé. <a href="${CAL}" target="_blank" rel="noopener">Réserver une visio de 30 minutes</a>`;
      case 'payer': { const paid = p.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.ttc, 0); const next = p.invoices.find((i) => i.status !== 'paid');
        return `Déjà réglé : <strong>${money(paid)} TTC</strong> sur ${money(p.billing.totalTTC)} TTC. Reste <strong>${money(Math.max(0, p.billing.totalTTC - paid))} TTC</strong>${next ? (next.status === 'due' ? ', à régler maintenant' : ', facturés à la livraison') : ''}. <a href="#documents" data-go="documents">Voir les factures</a>`; }
      case 'qui': return `${esc(lead.name || 'Louis')}, ${esc((lead.title || 'chef de projet').toLowerCase())}, est ${R('votre', 'ton')} interlocuteur principal${lead.phone ? ` : <strong class="num">${esc(lead.phone)}</strong>` : ''}. ${lead.wa ? `<a href="${lead.wa}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>` : ''}`;
    }
    return '';
  }
  function qaPanel() {
    const lead = S.team[0] || {};
    return `<section class="panel" aria-labelledby="qa"><div class="panel-head"><h2 id="qa">${ic('chat')}Une question ?</h2><span class="aside">Réponse immédiate, tirée de ${R('votre', 'ton')} projet</span></div>
      <div class="qa-chips" role="group" aria-label="Questions fréquentes">${QA().map(([id, q]) => `<button data-act="qa" data-id="${id}" aria-pressed="${S.qa === id}">${q}</button>`).join('')}</div>
      ${S.qa ? `<div class="qa-answer" role="status">${lead.photo && IMG[lead.photo] ? `<img src="${IMG[lead.photo]}" alt="">` : ''}<p>${qaAnswer(S.qa)}</p></div>` : ''}</section>`;
  }

  /* ---------- Accueil guidé (première connexion) ---------- */
  function onboarding() {
    const p = S.project, st = S.ob.step, first = (p.contactName || S.me.name || '').split(' ')[0];
    const lead = S.team[0] || {};
    const faces = S.team.filter((u) => IMG[u.photo]).map((u) => `<img src="${IMG[u.photo]}" alt="${esc(u.name)}">`).join('');
    const arts = [
      ['Bienvenue', `Bienvenue ${esc(first)}, ${R('votre', 'ton')} projet démarre ici.`],
      ['Le chemin', '5 étapes jusqu’à la mise en ligne.'],
      ['Pour démarrer', `${R('Vos', 'Tes')} premières actions.`],
      ['Dernier détail', `On ${R('vous', 'te')} prévient comment ?`]
    ];
    const actions = [...p.validations.filter((v) => v.status === 'ready').map((v) => ['Valider : ' + v.t.toLowerCase(), 'Environ 5 minutes']), ...p.missing.map((m) => ['Déposer : ' + m.t.toLowerCase(), m.sub]), ...p.tasks.filter((t) => !t.done).map((t) => [t.t, ''])].slice(0, 3);
    if (p.deliveredAt) {
      arts[1] = [`${R('Votre', 'Ton')} espace`, 'Tout ce qu’on a construit, au même endroit.'];
      arts[2] = ['Pour commencer', `Ce que ${R('vous pouvez', 'tu peux')} faire dès maintenant.`];
    }
    const li = (rows) => `<div class="ob-list">${rows.map(([t, d], i) => `<div class="li"><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><strong>${t}</strong><span>${d}</span></div></div>`).join('')}</div>`;
    const bodies = p.deliveredAt ? [`<h3>Un mot de ${esc((lead.name || 'Louis').split(' ')[0])}</h3><p>Bienvenue dans l’espace ${esc(p.client)}. ${R('Vous y retrouvez', 'Tu y retrouves')} tout ce qu’on a construit ensemble, les résultats du site et des outils pour ${R('votre', 'ton')} quotidien.</p><p>Une idée, une question ? On est à un message de ${R('vous', 'toi')}.</p><p class="muted small">${esc(lead.name || '')}</p>`,
      `<h3>${R('Ce que vous y trouverez', 'Ce qu’il y a ici')}</h3>${li([['Résultats', 'Les chiffres du site, mis à jour chaque mois'], ['Bibliothèque', 'Visuels, maquettes et cas d’étude à réutiliser'], ['Boîte à outils', 'Fiche teaser, kit de marque, signature e-mail'], ['Messages', 'Les vidéos et messages de l’équipe']])}`,
      `<h3>Trois raccourcis</h3>${li([['Préparer une fiche teaser de bien', 'Boîte à outils'], ['Demander une évolution du site', 'Boîte à outils'], ['Télécharger les visuels du cas client', 'Bibliothèque']])}`
    ] : [
      `<h3>Un mot de ${esc((lead.name || 'Louis').split(' ')[0])}</h3>
       <p>Merci de nous faire confiance pour ce projet : <strong>${esc(p.projet)}</strong>. Cet espace remplace les mails éparpillés : ${R('vous y trouverez', 'tu y trouveras')} où en est le site, ce qu’on attend de ${R('vous', 'toi')}, ${R('vos', 'tes')} fichiers et ${R('vos', 'tes')} factures.</p>
       <p>On ne passe jamais à l’étape suivante sans ${R('votre', 'ton')} feu vert. Et si quelque chose n’est pas clair, on est à un message de ${R('vous', 'toi')}.</p>
       <p class="muted small">${esc(lead.name || '')}${lead.title ? ', ' + esc(lead.title.toLowerCase()) : ''}</p>`,
      `<h3>${R('Votre', 'Ton')} planning</h3>
       <div class="ob-tl">${p.phases.map((x) => `<div class="tl ${x.n < p.phase ? 'done' : x.n === p.phase ? 'on' : ''}"><i></i><strong style="font-weight:${x.n === p.phase ? 600 : 400}">${esc(x.t)}</strong><span class="num">${fmt(x.from)}</span></div>`).join('')}</div>
       <p class="small muted">Mise en ligne prévue vers le <strong style="color:var(--fg)">${fmt(p.golive, { day: 'numeric', month: 'long' })}</strong>. Les dates sont ajustées ensemble à chaque étape.</p>`,
      `<h3>${actions.length ? 'Ce qu’on attend de ' + R('vous', 'toi') : 'Rien à faire pour l’instant'}</h3>
       ${actions.length ? `<div class="ob-list">${actions.map(([t, sub], i) => `<div class="li"><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(t)}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}</div></div>`).join('')}</div>` : `<p>On ${R('vous', 'te')} prévient dès qu’on a besoin de ${R('vous', 'toi')}.</p>`}
       <p class="small muted">${R('Vous les retrouverez', 'Tu les retrouveras')} toujours en haut de l’accueil.</p>`,
      `<h3>Être prévenu au bon moment</h3>
       <div class="ob-pref">
         <label><input type="checkbox" id="pf-mail" checked> Un e-mail quand on a besoin de ${R('vous', 'toi')}</label>
         <label><input type="checkbox" id="pf-wa"> Un message WhatsApp pour les validations</label>
         <label><input type="checkbox" id="pf-week" checked> Le point de la semaine, chaque vendredi</label>
       </div>`
    ];
    return `<div class="ob" role="dialog" aria-modal="true" aria-labelledby="ob-t"><div class="ob-card">
      <div class="ob-art"><div><div class="k">${arts[st][0]} · ${st + 1} sur 4</div><h2 id="ob-t">${arts[st][1]}</h2></div><div class="faces">${faces}</div></div>
      <div class="ob-body"><div class="ob-steps" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>
        ${bodies[st]}
        <div class="ob-foot">${st ? `<button class="ghost" data-act="ob-prev">${ic('back')}Retour</button>` : '<button class="ghost" data-act="ob-skip">Passer</button>'}
          <button class="btn btn-primary" data-act="${st < 3 ? 'ob-next' : 'ob-done'}">${st < 3 ? 'Continuer' : 'Découvrir mon espace'} ${ic('arrow')}</button></div>
      </div></div></div>`;
  }
  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    const cols = ['#ff6200', '#092482', '#6cb5d7', '#0b6a3b', '#f4f4f6'];
    for (let i = 0; i < 70; i++) { const e = document.createElement('i'); e.style.left = Math.random() * 100 + '%'; e.style.background = cols[i % cols.length]; e.style.animationDelay = Math.random() * 0.4 + 's'; e.style.animationDuration = 1.2 + Math.random() + 's'; c.appendChild(e); }
    document.body.appendChild(c); setTimeout(() => c.remove(), 2800);
  }


  /* ---------- Outils transverses ---------- */
  const asset = (p) => (window.ASSETS && window.ASSETS[p]) || p;
  const unread = () => (S.project ? (S.project.messages || []).filter((m) => m.readByClient === false).length : 0);
  const person = (id) => S.team.find((u) => u.id === id) || { name: S.people[id] || (S.project && S.project.contactName) || '', photo: null };
  const loomId = (u) => { const m = String(u || '').match(/loom\.com\/(?:share|embed)\/([a-z0-9]+)/i); return m ? m[1] : null; };
  const figmaEmbed = (u) => 'https://www.figma.com/embed?embed_host=orem&url=' + encodeURIComponent(u);

  function videoCard(m) {
    const id = loomId(m.loom.url);
    if (!API.demo && id) return `<div class="video"><iframe src="https://www.loom.com/embed/${id}" title="${esc(m.loom.title)}" allowfullscreen loading="lazy"></iframe></div>`;
    return `<a class="video-card" href="${esc(m.loom.url)}" target="_blank" rel="noopener"><span class="play">${ic('play')}</span><span><strong>${esc(m.loom.title)}</strong><span>Vidéo${m.loom.duration ? ' · ' + esc(m.loom.duration) : ''} · s’ouvre dans Loom</span></span></a>`;
  }
  function msgBubble(m) {
    const u = person(m.by), mine = !m.fromAgency;
    return `<div class="msg ${mine ? 'mine' : ''}">${!mine ? (IMG[u.photo] ? `<img class="avatar" src="${IMG[u.photo]}" alt="">` : `<span class="avatar ph">${esc((u.name || '?')[0])}</span>`) : ''}
      <div class="bubble"><div class="meta-l"><strong>${esc(mine ? R('Vous', 'Toi') : (u.name || '').split(' ')[0])}</strong><span>${esc(fmt(m.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span>${m.readByClient === false && !mine ? '<span class="chip hl">Nouveau</span>' : ''}</div>
      <p>${esc(m.text)}</p>${m.loom ? videoCard(m) : ''}</div></div>`;
  }

  /* ---------- Maquettes ---------- */
  function vMaquettes() {
    const p = S.project, L = p.links || {};
    const shots = (p.assets || []).filter((a) => a.img && (a.kind === 'Maquettes' || a.kind === 'Réalisation')).slice(0, 4);
    if (!L.figma && !L.proto) return `<div class="head"><div><h1>Maquettes</h1><p class="lead">Les écrans du site, en direct depuis Figma</p></div></div>
      <div class="empty big">${ic('figma')}<strong>Les maquettes arrivent à l’étape 2</strong><span>Dès que Clément commence le design, ${R('vous les verrez', 'tu les verras')} ici en direct, sans compte Figma.</span></div>`;
    return `<div class="head"><div><h1>Maquettes</h1><p class="lead">En direct depuis Figma, toujours la dernière version</p></div>
      <div class="head-actions">${L.proto ? `<a class="btn btn-primary" href="${esc(L.proto)}" target="_blank" rel="noopener">${ic('play')}Tester le prototype</a>` : ''}${L.figma ? `<a class="btn btn-line" href="${esc(L.figma)}" target="_blank" rel="noopener">${ic('figma')}Ouvrir dans Figma</a>` : ''}</div></div>
      ${!API.demo && (L.proto || L.figma) ? `<section class="panel flush"><div class="figma-frame"><iframe src="${figmaEmbed(L.proto || L.figma)}" title="Maquettes Figma" allowfullscreen loading="lazy"></iframe></div></section>`
        : `<section class="panel"><div class="panel-head"><h2>${ic('eye')}Aperçu des écrans</h2><span class="aside">Le prototype s’ouvre dans un nouvel onglet, sans compte Figma</span></div>
          ${shots.length ? `<div class="shots">${shots.map((a) => `<button class="shot" data-act="zoom" data-src="${esc(asset(a.img))}" data-title="${esc(a.title)}"><img src="${esc(asset(a.img))}" alt="${esc(a.title)}" loading="lazy"><span>${esc(a.title)}</span></button>`).join('')}</div>` : '<p class="muted">Les captures des écrans apparaîtront ici.</p>'}</section>`}
      <section class="panel"><div class="panel-head"><h2>${ic('chat')}Comment donner ${R('votre', 'ton')} avis</h2></div>
        <div class="tips"><div><span class="rank">01</span><p>Ouvrez le prototype et cliquez comme sur le vrai site.</p></div><div><span class="rank">02</span><p>Notez ce qui vous gêne, écran par écran.</p></div><div><span class="rank">03</span><p>Validez ou demandez des modifications dans « À valider ».</p></div></div></section>`;
  }

  /* ---------- Messages ---------- */
  function vMessages() {
    const p = S.project;
    const list = (p.messages || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at));
    const videos = list.filter((m) => m.loom).reverse();
    return `<div class="head"><div><h1>Messages</h1><p class="lead">Les vidéos et les messages de l’équipe, au même endroit</p></div></div>
      ${videos.length ? `<section class="panel"><div class="panel-head"><h2>${ic('play')}Vidéos de l’équipe</h2><span class="aside">${videos.length} vidéo${videos.length > 1 ? 's' : ''}</span></div><div class="videos">${videos.map((m) => `<div class="vitem">${videoCard(m)}<span class="small muted">${esc(person(m.by).name.split(' ')[0])} · ${fmt(m.at)}</span></div>`).join('')}</div></section>` : ''}
      <section class="panel"><div class="panel-head"><h2>${ic('chat')}Conversation</h2><span class="aside">Réponse sous 24 h ouvrées</span></div>
        <div class="thread" tabindex="0" role="log" aria-label="Conversation">${list.map(msgBubble).join('') || '<p class="muted">Aucun message pour l’instant.</p>'}</div>
        <form class="compose" data-form="msg"><label class="sr" for="msg-t">${R('Votre', 'Ton')} message</label><textarea id="msg-t" placeholder="${R('Écrivez votre message', 'Écris ton message')}…" rows="2"></textarea><button class="btn btn-primary" type="submit">Envoyer</button></form>
      </section>`;
  }

  /* ---------- Bibliothèque ---------- */
  function vBiblio() {
    const p = S.project, A = p.assets || [];
    const kinds = ['Tout', ...new Set(A.map((a) => a.kind))];
    const k = S.bk && kinds.includes(S.bk) ? S.bk : 'Tout';
    const shown = k === 'Tout' ? A : A.filter((a) => a.kind === k);
    return `<div class="head"><div><h1>Bibliothèque</h1><p class="lead">Les visuels, maquettes et cas d’étude du projet, prêts à réutiliser</p></div></div>
      ${A.length ? `<div class="cats" role="group" aria-label="Filtrer">${kinds.map((x) => `<button class="cat" data-bk="${esc(x)}" aria-pressed="${k === x}"><strong>${esc(x)}</strong><span class="num">${x === 'Tout' ? A.length : A.filter((a) => a.kind === x).length}</span></button>`).join('')}</div>
      <div class="gallery">${shown.map((a) => `<article class="tile">${a.img ? `<button class="tile-img" data-act="zoom" data-src="${esc(asset(a.img))}" data-title="${esc(a.title)}" aria-label="Agrandir : ${esc(a.title)}"><img src="${esc(asset(a.img))}" alt="" loading="lazy"></button>` : ''}
        <div class="tile-b"><span class="chip idle">${esc(a.kind)}</span><strong>${esc(a.title)}</strong><div class="tile-a">${a.url ? `<a class="btn btn-line btn-sm" href="${esc(a.url)}" target="_blank" rel="noopener">Ouvrir</a>` : ''}${a.img && !API.demo ? `<a class="btn btn-line btn-sm" href="${esc(a.img)}" download>${ic('down')}Télécharger</a>` : ''}</div></div></article>`).join('')}</div>`
      : `<div class="empty big">${ic('folder')}<strong>La bibliothèque se remplit au fil du projet</strong><span>Maquettes, visuels et cas d’étude apparaîtront ici dès qu’ils sont prêts.</span></div>`}
      ${p.brand && p.brand.colors.length ? `<section class="panel"><div class="panel-head"><h2>${ic('eye')}Couleurs de la marque</h2><span class="aside">Cliquez pour copier</span></div><div class="swatches">${p.brand.colors.map(([n, h]) => `<button class="sw" data-act="copytxt" data-txt="${h}"><i style="background:${h}"></i><strong>${esc(n)}</strong><span class="num">${h}</span></button>`).join('')}</div></section>` : ''}`;
  }

  /* ---------- Boîte à outils ---------- */
  const TOOLS = {
    teaser: ['doc', 'Fiche teaser de bien', 'Une fiche d’une page pour présenter un hôtel ou une boulangerie à un acquéreur, aux couleurs du cabinet.'],
    brand: ['eye', 'Kit de marque', 'Couleurs, typographies et visuels officiels, à copier en un clic.'],
    signature: ['mail', 'Signature e-mail', 'Une signature propre et cohérente pour toute l’équipe.'],
    request: ['plus', 'Demander une évolution', 'Une idée, une correction, une nouvelle page : décrivez-la, on s’en occupe.'],
    webflow: ['play', 'Se former à Webflow', 'Les vidéos pour modifier ${site} en autonomie.']
  };
  function vOutils() {
    const p = S.project, tools = (p.tools || []).filter((t) => TOOLS[t]);
    if (S.tool && tools.includes(S.tool)) return toolView(S.tool);
    return `<div class="head"><div><h1>Boîte à outils</h1><p class="lead">Des outils pensés pour ${R('votre', 'ton')} quotidien, inclus dans l’espace</p></div></div>
      ${p.deliveredAt ? evolutionCard() : ''}
      <div class="toolgrid">${tools.map((t) => { const [i, n, d] = TOOLS[t]; return `<button class="toolcard" data-tool="${t}"><span class="ico hl">${ic(i)}</span><strong>${n}</strong><span>${d.replace('${site}', R('votre site', 'ton site'))}</span><em>Ouvrir ${ic('arrow')}</em></button>`; }).join('')}</div>`;
  }
  function evolutionCard() {
    return `<section class="evo"><div><div class="k">Évolution</div><h2>${R('Votre', 'Ton')} site ne doit pas se figer.</h2><p>Chaque mois, on lit les chiffres avec ${R('vous', 'toi')}, on décide des priorités et on fait évoluer ce qui transforme : formulaires, pages, supports commerciaux.</p></div>
      <div class="evo-a"><a class="btn" href="https://app.iclosed.io/e/Orem/rdv-30min" target="_blank" rel="noopener">Réserver un appel de 30 minutes ${ic('arrow')}</a><button class="ghost on-dark" data-tool="request">Ou ${R('décrivez', 'décris')} une demande</button></div></section>`;
  }
  function toolView(t) {
    const p = S.project, [i, n] = TOOLS[t];
    const back = `<div><button class="ghost" data-tool="">${ic('back')}Boîte à outils</button></div>`;
    const head = `<div class="head"><div><h1>${n}</h1></div></div>`;
    if (t === 'teaser') {
      const T = S.teaser || (S.teaser = { type: 'Hôtel', name: 'Hôtel 3 étoiles, rive gauche', city: 'Paris 7e', size: '42 chambres', ca: '2,4 M€', price: 'Sur demande', points: 'Murs et fonds\nEmplacement à 5 minutes de la tour Eiffel\nTaux d’occupation de 86 %' });
      const c = (p.brand && p.brand.colors) || [];
      const main = (c[0] || [])[1] || '#092482', soft = (c[2] || [])[1] || '#f3f2ef', dark = (c[3] || [])[1] || '#0b0b12';
      return `${back}${head}<div class="grid2 tool2">
        <form class="panel form" data-form="teaser" id="teaser-f">
          <div class="field"><label for="tz-type">Type de bien</label><select id="tz-type">${['Hôtel', 'Boulangerie'].map((x) => `<option ${T.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label for="tz-name">Intitulé (sans le nom de l’établissement)</label><input id="tz-name" type="text" value="${esc(T.name)}"></div>
          <div class="line"><div class="field"><label for="tz-city">Localisation</label><input id="tz-city" type="text" value="${esc(T.city)}"></div><div class="field"><label for="tz-size">Taille</label><input id="tz-size" type="text" value="${esc(T.size)}"></div></div>
          <div class="line"><div class="field"><label for="tz-ca">Chiffre d’affaires</label><input id="tz-ca" type="text" value="${esc(T.ca)}"></div><div class="field"><label for="tz-price">Prix</label><input id="tz-price" type="text" value="${esc(T.price)}"></div></div>
          <div class="field"><label for="tz-points">Points forts (un par ligne)</label><textarea id="tz-points" rows="4">${esc(T.points)}</textarea></div>
          <p class="hint">L’aperçu se met à jour pendant que ${R('vous tapez', 'tu tapes')}.</p>
        </form>
        <section class="panel"><div class="panel-head"><h2>${ic('eye')}Aperçu</h2><div class="inline">${API.demo ? '' : `<button class="btn btn-line btn-sm" data-act="print">${ic('down')}PDF</button>`}<button class="btn btn-line btn-sm" data-act="copyteaser">${ic('copy')}Copier le texte</button></div></div>
          <div class="teaser" id="teaser-p" style="--tz:${main};--tz-soft:${soft};--tz-dark:${dark}">${teaserHtml(T)}</div></section></div>`;
    }
    if (t === 'brand') {
      const b = p.brand || { colors: [], fonts: [] };
      return `${back}${head}<section class="panel"><div class="panel-head"><h2>${ic('eye')}Couleurs</h2><span class="aside">Cliquez pour copier le code</span></div>
        ${b.colors.length ? `<div class="swatches">${b.colors.map(([nm, h]) => `<button class="sw" data-act="copytxt" data-txt="${h}"><i style="background:${h}"></i><strong>${esc(nm)}</strong><span class="num">${h}</span></button>`).join('')}</div>` : '<p class="muted">Les couleurs arrivent avec la direction artistique.</p>'}</section>
        <section class="panel"><div class="panel-head"><h2>${ic('doc')}Typographies</h2></div>${b.fonts.length ? `<dl class="kv">${b.fonts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '<p class="muted">Les typographies arrivent avec la direction artistique.</p>'}</section>
        <section class="panel"><div class="panel-head"><h2>${ic('folder')}Visuels et logos</h2><a href="#biblio" data-go="biblio">Ouvrir la bibliothèque</a></div><p class="muted">Tous les visuels du projet sont rangés dans la bibliothèque, prêts à télécharger.</p></section>`;
    }
    if (t === 'signature') {
      const G = S.sig || (S.sig = { name: S.me.name || '', role: '', phone: '' });
      const main = ((p.brand && p.brand.colors[0]) || [])[1] || '#092482';
      return `${back}${head}<div class="grid2 tool2"><form class="panel form" data-form="sig"><div class="field"><label for="sg-n">Prénom et nom</label><input id="sg-n" type="text" value="${esc(G.name)}"></div><div class="field"><label for="sg-r">Fonction</label><input id="sg-r" type="text" value="${esc(G.role)}" placeholder="Associé"></div><div class="field"><label for="sg-p">Téléphone</label><input id="sg-p" type="text" value="${esc(G.phone)}" placeholder="01 23 45 67 89"></div></form>
        <section class="panel"><div class="panel-head"><h2>${ic('eye')}Aperçu</h2><button class="btn btn-line btn-sm" data-act="copysig">${ic('copy')}Copier la signature</button></div><div class="sig" id="sig-p">${sigHtml(G, main)}</div><p class="hint" style="margin-top:12px">Collez-la dans les réglages de signature de Gmail ou Outlook.</p></section></div>`;
    }
    if (t === 'request') {
      const reqs = p.requests || [];
      return `${back}${head}<div class="grid2 tool2"><form class="panel form" data-form="request">
          <div class="field"><label for="rq-k">De quoi s’agit-il ?</label><select id="rq-k">${['Contenu', 'Design', 'Formulaires', 'Nouvelle page', 'Référencement', 'Autre'].map((x) => `<option>${x}</option>`).join('')}</select></div>
          <div class="field"><label for="rq-p">Priorité</label><select id="rq-p"><option>Normal</option><option>Important</option><option>Urgent</option></select></div>
          <div class="field"><label for="rq-t">${R('Décrivez votre', 'Décris ta')} demande</label><textarea id="rq-t" rows="5" placeholder="Ce que ${R('vous voulez', 'tu veux')} changer, sur quelle page, et pourquoi."></textarea></div>
          <div><button class="btn btn-primary" type="submit">Envoyer la demande</button></div></form>
        <section class="panel"><div class="panel-head"><h2>${ic('doc')}${R('Vos', 'Tes')} demandes</h2></div><div class="list">${reqs.map((r) => `<div class="row"><div class="grow"><div class="title">${esc(r.type)} · ${esc(r.priority)}</div><div class="sub">${esc(r.text)}</div></div><span class="chip ${r.status === 'Fait' ? 'ok' : r.status === 'Nouveau' ? 'warn' : 'hl'}">${esc(r.status)}</span></div>`).join('') || '<p class="muted">Aucune demande pour l’instant.</p>'}</div></section></div>`;
    }
    if (t === 'webflow') {
      const vids = [['Modifier un texte ou une image', '3 min'], ['Ajouter un hôtel ou une boulangerie à vendre', '4 min'], ['Publier un article', '3 min'], ['Publier ses changements en toute sécurité', '2 min']];
      return `${back}${head}<section class="panel"><div class="videos">${vids.map(([tt, d]) => `<div class="vitem">${videoCard({ loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: tt, duration: d } })}</div>`).join('')}</div></section>
        <section class="panel" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between"><div style="flex:1 1 260px;min-width:0"><h2>Besoin d’un coup de main en direct ?</h2><p class="muted" style="margin-top:4px">Une session de formation en visio, sur ${R('votre', 'ton')} site.</p></div><a class="btn btn-primary" href="https://cal.com/iconokom/formation-webflow" target="_blank" rel="noopener">${ic('cal')}Réserver une formation</a></section>`;
    }
    return back;
  }
  function teaserHtml(T) {
    const pts = String(T.points || '').split('\n').map((x) => x.trim()).filter(Boolean);
    return `<div class="tz-top"><span>${esc(S.project.client.toUpperCase().replace('-', '\u2014'))}</span><span>${esc(T.type)} à vendre</span></div>
      <div class="tz-title">${esc(T.name || 'Intitulé du bien')}</div><div class="tz-city">${esc(T.city)}</div>
      <div class="tz-kpis"><div><b>${esc(T.size)}</b><span>Taille</span></div><div><b>${esc(T.ca)}</b><span>Chiffre d’affaires</span></div><div><b>${esc(T.price)}</b><span>Prix</span></div></div>
      <ul>${pts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="tz-foot">Dossier confidentiel · Contactez le cabinet pour recevoir la fiche complète</div>`;
  }
  function sigHtml(G, main) {
    return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a"><tr><td style="border-left:3px solid ${main};padding-left:12px">
      <div style="font-size:15px;font-weight:bold">${esc(G.name || 'Prénom Nom')}</div><div style="color:#555">${esc(G.role || 'Fonction')} · ${esc(S.project.client)}</div>
      <div style="margin-top:6px">${esc(G.phone || '')}${G.phone ? ' · ' : ''}<a href="${esc((S.project.links && S.project.links.site) || '#')}" style="color:${main};text-decoration:none">${esc(((S.project.links && S.project.links.site) || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') || 'votre-site.fr')}</a></div></td></tr></table>`;
  }

  /* ---------- Plus (mobile) ---------- */
  function vPlus() {
    const items = [['valider', 'À valider', 'ok'], ['maquettes', 'Maquettes', 'figma'], ['documents', 'Documents', 'doc'], ['outils', 'Boîte à outils', 'plus'], ['biblio', 'Bibliothèque', 'folder'], ['equipe', 'Équipe et aide', 'team']];
    return `<div class="head"><div><h1>Tout ${R('votre', 'ton')} espace</h1></div></div><section class="panel"><div class="list">${items.map(([id, l, i]) => `<a class="row linkrow" href="#${id}" data-go="${id}"><span class="ico">${ic(i)}</span><div class="grow"><div class="title">${l}</div></div>${id === 'valider' && pending() ? `<span class="badge">${pending()}</span>` : ''}${ic('arrow', 'width:18px;height:18px;color:var(--muted)')}</a>`).join('')}</div></section>`;
  }

  /* ---------- Accueil d'un projet livré ---------- */
  function vAccueilLivre() {
    const p = S.project, last = (p.messages || []).filter((m) => m.fromAgency && m.loom).sort((a, b) => new Date(b.at) - new Date(a.at))[0];
    const author = S.team.find((u) => u.id === p.note.by);
    return `<div class="head"><div><h1 class="brandish">Bonjour ${esc(p.contactName || S.me.name)}</h1><p class="lead">${esc(cap(fmtLong(Date.now())))} · ${esc(p.projet)}</p></div></div>
      <section class="next live"><div><div class="k"><span class="pulse"></span>En ligne depuis le ${fmt(p.deliveredAt, { day: 'numeric', month: 'long', year: 'numeric' })}</div><h2>${R('Votre', 'Ton')} site travaille pour ${R('vous', 'toi')}.</h2><p>${esc(p.next.text || '')}</p></div>
        ${p.links.site ? `<a class="btn" href="${esc(p.links.site)}" target="_blank" rel="noopener">Voir le site ${ic('arrow')}</a>` : ''}</section>
      ${p.results ? `<div class="kpis">${p.results.stats.map(([v, l]) => `<div class="kpi"><span class="v num">${esc(v)}</span><span class="l">${esc(l)}</span></div>`).join('')}</div><p class="steps-foot" style="margin-top:-8px">${esc(p.results.period)} · chiffres Google Analytics et Search Console</p>` : ''}
      ${evolutionCard()}
      <div class="grid2">
        ${last ? `<section class="panel"><div class="panel-head"><h2>${ic('play')}Dernière vidéo de l’équipe</h2><a href="#messages" data-go="messages">Tous les messages</a></div><p style="margin-bottom:12px">${esc(last.text)}</p>${last.loom ? videoCard(last) : ''}</section>` : ''}
        <section class="panel"><div class="panel-head"><h2>${ic('cal')}Cette semaine</h2></div>
          ${p.note.text ? `<div class="note">${author && IMG[author.photo] ? `<img class="avatar" src="${IMG[author.photo]}" alt="">` : ''}<div><blockquote>${esc(p.note.text)}</blockquote><div class="who">${esc(author ? author.name.split(' ')[0] : '')}</div></div></div>` : ''}
          ${p.meeting && p.meeting.when ? `<div class="meet"><span class="ico">${ic('cal')}</span><div class="grow"><div class="title">${esc(p.meeting.title)}</div><div class="sub">${esc(cap(fmtTime(p.meeting.when)))}</div></div></div>` : ''}</section>
      </div>
      <section class="panel"><div class="panel-head"><h2>${ic('folder')}Tout ce qu’on a construit ensemble</h2></div>
        <div class="quick">${[(p.tools || []).includes('teaser') ? ['tool:teaser', 'Fiche teaser', 'Présenter un bien en 2 minutes', 'doc'] : ['outils', 'Boîte à outils', 'Kit de marque, signature…', 'plus'], ['maquettes', 'Maquettes', 'Le fichier Figma et le prototype', 'figma'], ['biblio', 'Bibliothèque', `${(p.assets || []).length} visuels et cas d’étude`, 'folder'], ['fichiers', 'Fichiers', 'Guide Webflow, accès, bilans', 'doc']].map(([g, t, d, i]) => `<a class="qcard" href="#${g.replace('tool:', '')}" ${g.startsWith('tool:') ? `data-tool="${g.slice(5)}"` : `data-go="${g}"`}><span class="ico hl">${ic(i)}</span><strong>${t}</strong><span>${esc(d)}</span></a>`).join('')}</div></section>
      ${qaPanel()}`;
  }

  /* Agrandissement d'une image */
  function lightbox() {
    return S.zoom ? `<div class="lb" role="dialog" aria-modal="true" aria-label="${esc(S.zoom.title)}" data-act="unzoom"><figure><img src="${esc(S.zoom.src)}" alt="${esc(S.zoom.title)}"><figcaption>${esc(S.zoom.title)}</figcaption></figure><button class="lb-x" data-act="unzoom" aria-label="Fermer">×</button></div>` : '';
  }

  /* ---------- Agence : messages et liens ---------- */
  function tMessages() {
    const p = S.project, list = (p.messages || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at));
    return `<section class="panel"><div class="panel-head"><h2>${ic('chat')}Conversation avec ${esc(p.contactName || p.client)}</h2></div>
      <div class="thread" tabindex="0" role="log" aria-label="Conversation">${list.map((m) => msgBubbleAdmin(m)).join('') || '<p class="muted">Aucun message.</p>'}</div>
      <form class="form" data-form="amsg" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line)">
        <div class="field"><label for="am-t">Message</label><textarea id="am-t" rows="2" placeholder="Bonjour ${esc(p.contactName || '')}, …"></textarea></div>
        <div class="line"><div class="field"><label for="am-u">Vidéo Loom (facultatif)</label><input id="am-u" type="url" placeholder="https://www.loom.com/share/…"></div><div class="field"><label for="am-l">Titre de la vidéo</label><input id="am-l" type="text" placeholder="Présentation des maquettes"></div></div>
        <div><button class="btn btn-primary" type="submit">Envoyer au client</button></div></form></section>
      <section class="panel"><div class="panel-head"><h2>${ic('plus')}Demandes d’évolution</h2></div><div class="list">${(p.requests || []).map((r) => `<div class="row"><div class="grow"><div class="title">${esc(r.type)} · ${esc(r.priority)}</div><div class="sub">${esc(r.text)}</div></div>
        <select data-req="${r.id}" style="width:auto" aria-label="Statut de la demande">${['Nouveau', 'Proposé', 'En cours', 'Fait'].map((x) => `<option ${r.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`).join('') || '<p class="muted">Aucune demande.</p>'}</div></section>`;
  }
  function msgBubbleAdmin(m) {
    const u = person(m.by), agency = !!m.fromAgency;
    return `<div class="msg ${agency ? 'mine' : ''}">${!agency ? `<span class="avatar ph">${esc((u.name || '?')[0])}</span>` : ''}<div class="bubble"><div class="meta-l"><strong>${esc(agency ? (u.name || '').split(' ')[0] : (S.people[m.by] || S.project.contactName))}</strong><span>${esc(fmt(m.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span>${m.readByAgency === false ? '<span class="chip warn">Nouveau</span>' : ''}${agency && m.readByClient === false ? '<span class="chip idle">Pas encore lu</span>' : agency ? '<span class="chip ok">Lu</span>' : ''}</div><p>${esc(m.text)}</p>${m.loom ? videoCard(m) : ''}</div></div>`;
  }
  function tLiens() {
    const L = S.project.links || {};
    return `<form class="panel form" data-form="links"><div class="panel-head" style="margin:0"><h2>${ic('figma')}Liens du projet</h2><span class="aside">Visibles côté client dans « Maquettes » et sur l’accueil</span></div>
      <div class="field"><label for="lk-f">Fichier Figma (lecture seule)</label><input id="lk-f" type="url" value="${esc(L.figma)}" placeholder="https://www.figma.com/design/…"></div>
      <div class="field"><label for="lk-p">Prototype Figma</label><input id="lk-p" type="url" value="${esc(L.proto)}" placeholder="https://www.figma.com/proto/…"></div>
      <div class="field"><label for="lk-w">Prévisualisation Webflow</label><input id="lk-w" type="url" value="${esc(L.preview)}" placeholder="https://….webflow.io"></div>
      <div class="field"><label for="lk-s">Site en ligne</label><input id="lk-s" type="url" value="${esc(L.site)}" placeholder="https://www.…"></div>
      <p class="hint">Partagez le fichier Figma en « Can view » : le client le voit sans compte.</p>
      <div><button class="btn btn-primary" type="submit">Enregistrer</button></div></form>`;
  }

  /* ---------- Vues agence ---------- */
  function vClients() {
    const rows = S.projects.map((p) => { const a = p.alerts;
      const flags = [a.newFiles ? `<span class="chip warn">${a.newFiles} nouveau${a.newFiles > 1 ? 'x' : ''} fichier${a.newFiles > 1 ? 's' : ''}</span>` : '',
        a.changes ? `<span class="chip warn">Modifications demandées</span>` : '',
        a.waiting ? `<span class="chip hl">Validation chez le client</span>` : '',
        a.newMessages ? `<span class="chip warn">${a.newMessages} message${a.newMessages > 1 ? 's' : ''}</span>` : '',
        a.requests ? `<span class="chip warn">Demande d\u2019évolution</span>` : '',
        !a.newFiles && !a.changes && !a.waiting && !a.newMessages && !a.requests ? '<span class="chip idle">Rien de neuf</span>' : ''].join('');
      return `<button class="crow" data-open="${p.id}"><div><div class="c-name">${esc(p.client)}</div><div class="small muted">${esc(p.projet)}</div></div><div><div class="small"><span class="muted">Étape ${p.phase} · ${esc(p.phaseName)}</span></div><div class="small" style="margin-top:2px">${esc(p.next.title)}</div></div><div class="c-flags">${flags}</div></button>`; }).join('');
    const needs = S.projects.filter((p) => p.alerts.newFiles || p.alerts.changes || p.alerts.newMessages || p.alerts.requests).length;
    return `
    <div class="head"><div><h1>Clients</h1><p class="lead">${esc(cap(fmtLong(Date.now())))}</p></div><button class="btn btn-primary" data-go="nouveau">${ic('plus')}Nouvel espace client</button></div>
    ${kpisAdmin()}
    ${needs ? `<div class="alert">${ic('alert')}<div><strong>${needs} client${needs > 1 ? 's' : ''} attend${needs > 1 ? 'ent' : ''} une action de l’agence.</strong> Nouveaux fichiers à récupérer ou modifications demandées.</div></div>` : ''}
    <section class="panel"><div class="clients">${rows || '<div class="empty">Aucun espace client pour l’instant.</div>'}</div></section>`;
  }

  function vNouveau() {
    return `
    <div class="head"><div><h1>Nouvel espace client</h1><p class="lead">Le client reçoit un lien de connexion, sans mot de passe</p></div></div>
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

  const TABS = [['pilotage', 'Pilotage'], ['messages', 'Messages'], ['validations', 'Validations'], ['fichiers', 'Fichiers'], ['liens', 'Liens'], ['factures', 'Factures'], ['acces', 'Accès et infos'], ['activite', 'Activité']];
  function vAdmin() {
    const p = S.project, a = Core.alerts(p);
    const tabCount = { fichiers: a.newFiles, validations: a.changes, messages: a.newMessages + a.requests };
    const body = { pilotage: tPilotage, messages: tMessages, liens: tLiens, validations: tValidations, fichiers: tFichiers, factures: tFactures, acces: tAcces, activite: tActivite }[S.tab]();
    return `
    <div><button class="ghost" data-go="clients" style="padding-left:0">${ic('back')}Tous les clients</button></div>
    <div class="head"><div><h1>${esc(p.client)}</h1><p class="lead">${esc(p.projet)} · Étape ${p.phase} sur 5</p></div><div class="head-actions"><button class="btn btn-line" data-act="obpreview">${ic('play')}Accueil du client</button><button class="btn btn-line" data-act="preview">${ic('eye')}Voir comme le client</button></div></div>
    <div class="tabs" role="tablist">${TABS.map(([id, l]) => `<button role="tab" aria-selected="${S.tab === id}" data-tab="${id}">${l}${tabCount[id] ? `<span class="badge">${tabCount[id]}</span>` : ''}</button>`).join('')}</div>
    ${body}`;
  }
  const GO_OPTS = [['accueil', 'Aucun bouton'], ['cal', 'Prise de rendez-vous'], ['valider', 'À valider'], ['fichiers', 'Fichiers'], ['projet', 'Projet'], ['documents', 'Documents'], ['equipe', 'Équipe']];
  function tPilotage() {
    const p = S.project;
    return `
    <form class="panel form" data-form="phase"><div class="panel-head" style="margin:0"><h2>${ic('map')}Étape en cours</h2></div>
      <div class="inline"><select id="a-phase" aria-label="Étape en cours">${p.phases.map((x) => `<option value="${x.n}" ${x.n === p.phase ? 'selected' : ''}>${x.n} · ${esc(x.t)}</option>`).join('')}</select><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>
    <form class="panel form" data-form="next"><div class="panel-head" style="margin:0"><h2>${ic('arrow')}Prochaine étape affichée au client</h2><span class="small muted">Le grand bloc en haut de son accueil</span></div>
      <div class="field"><label for="a-nt">Titre</label><input id="a-nt" type="text" value="${esc(p.next.title)}" placeholder="${esc(Core.nextStep({ ...p, next: {} }).title)}"></div>
      <div class="field"><label for="a-nx">Texte</label><textarea id="a-nx" placeholder="Une ou deux phrases : ce qu’on attend et pourquoi.">${esc(p.next.text)}</textarea></div>
      <div class="inline"><label for="a-ng" style="flex:none">Bouton vers</label><select id="a-ng">${GO_OPTS.map(([v, l]) => `<option value="${v}" ${p.next.go === v ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn btn-primary btn-sm" type="submit">Publier</button></div>
      <p class="small muted">Laissez le titre vide pour une prochaine étape automatique (validation en attente, puis fichiers manquants).</p></form>
    <form class="panel form" data-form="note"><div class="panel-head" style="margin:0"><h2>${ic('cal')}Cette semaine</h2>${p.note.at ? `<span class="small muted">Dernière mise à jour le ${fmt(p.note.at)}</span>` : ''}</div>
      <textarea id="a-note" aria-label="Note de la semaine" placeholder="Ce qui a été fait, ce qui vient.">${esc(p.note.text)}</textarea>
      <div class="line"><div class="field"><label for="a-mt">Prochain rendez-vous</label><input id="a-mt" type="text" value="${esc(p.meeting.title)}" placeholder="Point d’étape (visio, 30 min)"></div><div class="field"><label for="a-mw">Date et heure</label><input id="a-mw" type="datetime-local" value="${dtKey(p.meeting.when)}"></div></div>
      <div><button class="btn btn-primary btn-sm" type="submit">Publier</button></div></form>
    <section class="panel"><div class="panel-head"><h2>${ic('doc')}Livrables par étape</h2><span class="small muted">Visibles dans « Projet » côté client</span></div>
      ${p.phases.map((ph) => `<div class="phase-title">${ph.n} · ${esc(ph.t)}</div>${ph.items.map((it) => `<div class="it"><div>${esc(it.t)}</div>
        <select data-item="${it.id}" aria-label="Statut : ${esc(it.t)}">${[['wait', 'Prévu'], ['on', 'En cours'], ['done', 'Fait']].map(([v, l]) => `<option value="${v}" ${it.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input type="date" data-itemdate="${it.id}" value="${dayKey(it.due)}" aria-label="Date prévue : ${esc(it.t)}"></div>`).join('')}`).join('')}</section>
    <div class="grid2">
      <section class="panel"><div class="panel-head"><h2>${ic('ok')}Actions du client</h2></div>
        <div class="list">${p.tasks.map((t) => `<div class="row"><span class="check ${t.done ? 'done' : ''}">${t.done ? ic('check') : ''}</span><div class="grow">${esc(t.t)}</div><button class="x" data-act="task-remove" data-id="${t.id}" aria-label="Retirer">×</button></div>`).join('') || '<p class="small muted">Aucune action manuelle. Les validations et fichiers manquants s’ajoutent tout seuls.</p>'}</div>
        <form class="inline" data-form="task" style="margin-top:12px"><input id="a-task" type="text" placeholder="Régler l’acompte de 50 %" aria-label="Nouvelle action"><button class="btn btn-line btn-sm" type="submit">Ajouter</button></form></section>
      <section class="panel"><div class="panel-head"><h2>${ic('folder')}Fichiers attendus</h2></div>
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
    <section class="panel"><div class="panel-head"><h2>${ic('up')}Déposés par le client</h2>${fromClient.some((f) => f.seen === false) ? '<button class="btn btn-line btn-sm" data-act="seen">Tout marquer comme vu</button>' : ''}</div>
      <div class="list">${fromClient.map(fileRow).join('') || '<p class="muted">Le client n’a encore rien déposé.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>${ic('down')}Partagés par l’agence</h2></div>
      <div class="inline" style="margin-bottom:16px"><select id="a-cat" aria-label="Type de document">${Core.AGENCY_CATS.map((c) => `<option>${c}</option>`).join('')}</select><label class="btn btn-primary btn-sm" for="a-up">${ic('up')}Ajouter un fichier</label><input id="a-up" type="file" multiple class="sr" data-agency="1"></div>
      ${S.uploading ? `<div class="small">${esc(S.uploading.name)}<span class="progress"><i style="width:${Math.round(S.uploading.p * 100)}%"></i></span></div>` : ''}
      <p class="small muted" style="margin-bottom:12px">« Livrable » apparaît dans Fichiers côté client. Devis, factures, contrat et RIB apparaissent dans Documents.</p>
      <div class="list">${fromAgency.map(fileRow).join('') || '<p class="muted">Rien de partagé pour l’instant.</p>'}</div></section>`;
  }
  function tFactures() {
    const p = S.project, b = p.billing;
    return `
    <form class="panel form" data-form="billing"><div class="panel-head" style="margin:0"><h2>${ic('doc')}Montant du projet</h2></div>
      <div class="line"><div class="field"><label for="b-ht">Montant HT (€)</label><input id="b-ht" type="number" min="0" step="0.01" value="${b.totalHT}"></div><div class="field"><label for="b-q">N° de devis</label><input id="b-q" type="text" value="${esc(b.quote)}" placeholder="D-2026-0142"></div></div>
      <div><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>
    <section class="panel"><div class="panel-head"><h2>${ic('doc')}Factures</h2></div>
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
    <section class="panel"><div class="panel-head"><h2>${ic('team')}Personnes qui ont accès</h2></div>
      <div class="list">${S.access.map((u) => `<div class="row"><span class="ico">${ic('mail')}</span><div class="grow"><div class="title">${esc(u.name)}</div><div class="sub">${esc(u.email)}</div></div><button class="x" data-act="user-remove" data-id="${u.id}" aria-label="Retirer l’accès de ${esc(u.email)}">×</button></div>`).join('') || '<p class="muted">Personne pour l’instant.</p>'}</div>
      <form class="inline" data-form="user" style="margin-top:14px"><input id="u-n" type="text" placeholder="Prénom" aria-label="Prénom" style="flex:0 1 140px"><input id="u-e" type="email" placeholder="adresse@client.fr" aria-label="E-mail"><button class="btn btn-line btn-sm" type="submit">Donner l’accès</button></form>
      <p class="small muted" style="margin-top:10px">Chaque personne se connecte avec son e-mail : un lien et un code à 6 chiffres, sans mot de passe ni compte Google.</p></section>
    <form class="panel form" data-form="infos"><div class="panel-head" style="margin:0"><h2>${ic('globe')}Infos du projet</h2></div>
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
      const V = { accueil: () => (S.project.deliveredAt ? vAccueilLivre() : vAccueil()), projet: vProjet, valider: vValider, maquettes: vMaquettes, messages: vMessages, fichiers: vFichiers, documents: vDocuments, outils: vOutils, biblio: vBiblio, equipe: vEquipe, plus: vPlus };
      if (!V[S.view]) S.view = 'accueil';
      root.innerHTML = shell(V[S.view]()) + (S.ob ? onboarding() : '') + lightbox();
    } else {
      const V = { clients: vClients, nouveau: vNouveau, admin: vAdmin };
      if (!V[S.view] || (S.view === 'admin' && !S.project)) S.view = 'clients';
      root.innerHTML = shell(V[S.view]());
    }
    if (S.ob) { const b = document.querySelector('.ob .btn-primary'); if (b) b.focus({ preventScroll: true }); }
    document.querySelectorAll('.thread').forEach((t) => (t.scrollTop = t.scrollHeight));
    bindFiles();
    if (focus) { const m = $('#main'); if (m) m.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }
  async function go(v) {
    if (v === 'deconnexion') return logout();
    if (v === 'clients' && isAdmin() && !S.preview) { S.project = null; await loadProjects(); }
    S.view = v; S.valForm = null; S.tool = v === 'outils' ? S.tool : null; render(true);
    if (v === 'messages' && S.project && (isAdmin() ? false : unread()) && !S.preview) { try { await API.action(S.project.id, { type: 'msg.read' }); await loadProject(S.project.id); } catch {} }
  }
  async function enter() {
    const r = await API.me(); S.me = r.user; S.team = r.team || [];
    if (S.me.role === 'admin') { await loadProjects(); S.view = 'clients'; S.project = null; }
    else { await loadProjects(); if (S.projects[0]) { const d = await API.project(S.projects[0].id); S.project = d.project; S.people = d.people || {}; } S.view = 'accueil'; if (S.project && !S.me.onboardedAt) S.ob = { step: 0 }; }
    S.loading = false; render(true);
  }
  async function openProject(id) { S.tab = 'pilotage'; S.view = 'admin'; await loadProject(id); window.scrollTo(0, 0);
    const a = Core.alerts(S.project); if (a.unseen) { try { await API.action(id, { type: 'seen' }); } catch {} } }
  async function markAgencyRead() { const a = Core.alerts(S.project); if (a.newMessages) { try { await API.action(S.project.id, { type: 'msg.read' }); } catch {} } }
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
  function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(() => toast(ok), () => toast('Copie impossible ici. Sélectionnez le texte à la main.')); } catch { toast('Copie impossible ici. Sélectionnez le texte à la main.'); } }
  function copyHtml(h, ok) { try { navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob([h.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' }) })]).then(() => toast(ok), () => copyText(h, ok)); } catch { copyText(h, ok); } }
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-demo]')) { API.as(t.value); S.preview = false; S.tool = null; S.ob = null; enter(); return; }
    if (t.dataset.req) { act({ type: 'request.status', rid: t.dataset.req, status: t.value }, 'Statut mis à jour.'); return; }
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
    const tb = e.target.closest('[data-tab]'); if (tb) { S.tab = tb.dataset.tab; render(); if (S.tab === 'messages') markAgencyRead(); return; }
    const tl = e.target.closest('[data-tool]'); if (tl) { S.tool = tl.dataset.tool || null; if (S.view !== 'outils') S.view = 'outils'; render(true); return; }
    const bk = e.target.closest('[data-bk]'); if (bk) { S.bk = bk.dataset.bk; return render(); }
    const c = e.target.closest('[data-cat]'); if (c) { S.cat = c.dataset.cat; return render(); }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const id = a.dataset.id;
    switch (a.dataset.act) {
      case 'toast': e.preventDefault(); toast(a.dataset.msg); break;
      case 'theme': { const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('orem-theme', r.dataset.theme); } catch {} break; }
      case 'logout': logout(); break;
      case 'approve': if (S.preview) return toast('Aperçu : les actions sont désactivées.'); if (await act({ type: 'val.approve', vid: id }, 'Validation enregistrée. L’équipe est prévenue.')) { S.view = 'valider'; render(); celebrate(); } break;
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
      case 'endpreview': S.preview = false; S.ob = null; S.view = 'admin'; render(true); break;
      case 'login-back': S.login.step = 'email'; render(); break;
      case 'demo-as': API.as(a.dataset.email); enter(); break;
      case 'skip': e.preventDefault(); { const m = $('#main'); m.focus(); const f = m.querySelector('a,button,input,select,textarea'); if (f) f.focus(); } break;
      case 'qa': S.qa = S.qa === id ? null : id; render(); break;
      case 'zoom': S.zoom = { src: a.dataset.src, title: a.dataset.title }; render(); break;
      case 'unzoom': if (e.target.tagName === 'IMG') return; S.zoom = null; render(); break;
      case 'copytxt': copyText(a.dataset.txt, a.dataset.txt + ' copié.'); break;
      case 'copysig': copyHtml($('#sig-p').innerHTML, 'Signature copiée. Collez-la dans votre messagerie.'); break;
      case 'copyteaser': copyText($('#teaser-p').innerText, 'Texte de la fiche copié.'); break;
      case 'print': document.body.classList.add('printing'); window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); break;
      case 'obopen': S.ob = { step: 0 }; render(); break;
      case 'obpreview': S.preview = true; S.view = 'accueil'; S.ob = { step: 0 }; render(true); break;
      case 'ob-next': S.ob.step++; render(); break;
      case 'ob-prev': S.ob.step--; render(); break;
      case 'ob-skip': case 'ob-done': {
        const prefs = { mail: !!($('#pf-mail') || {}).checked, whatsapp: !!($('#pf-wa') || {}).checked, weekly: !!($('#pf-week') || {}).checked };
        const wasDone = a.dataset.act === 'ob-done'; S.ob = null;
        if (!S.preview && !S.me.onboardedAt) { S.me.onboardedAt = new Date().toISOString(); try { await API.action(S.project.id, { type: 'user.onboarded', prefs: wasDone ? prefs : undefined }); } catch {} }
        render(); if (wasDone) { celebrate(); toast(R('Bienvenue dans votre espace.', 'Bienvenue dans ton espace.')); } break; }
      case 'demo-switch-old': API.as(isAdmin() ? 'claire@maisonlumen.fr' : 'louis@agence-orem.fr'); S.preview = false; enter(); break;
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
      case 'msg': { const t = v('msg-t'); if (!t) return toast('Écrivez votre message.'); if (S.preview) return toast('Aperçu : les actions sont désactivées.'); if (await act({ type: 'msg.post', text: t }, 'Message envoyé. Réponse sous 24 h ouvrées.')) { const th = document.querySelector('.thread'); if (th) th.lastElementChild && th.lastElementChild.scrollIntoView({ block: 'nearest' }); } break; }
      case 'amsg': { const t = v('am-t'); if (!t) return toast('Écrivez le message.'); act({ type: 'msg.post', text: t, loom: v('am-u') ? { url: v('am-u'), title: v('am-l') || 'Vidéo' } : undefined }, 'Message envoyé au client.'); break; }
      case 'links': act({ type: 'links.set', figma: v('lk-f'), proto: v('lk-p'), preview: v('lk-w'), site: v('lk-s') }, 'Liens enregistrés.'); break;
      case 'request': { const t = v('rq-t'); if (!t) return toast('Décrivez votre demande.'); if (S.preview) return toast('Aperçu : les actions sont désactivées.'); act({ type: 'request.add', kind: v('rq-k'), priority: v('rq-p'), text: t }, 'Demande envoyée. On revient vers vous sous 48 h.'); break; }
      case 'teaser': case 'sig': break;
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
    if (t.closest('#teaser-f')) { const v = (id) => $('#' + id).value; S.teaser = { type: v('tz-type'), name: v('tz-name'), city: v('tz-city'), size: v('tz-size'), ca: v('tz-ca'), price: v('tz-price'), points: v('tz-points') }; $('#teaser-p').innerHTML = teaserHtml(S.teaser); return; }
    if (t.closest('[data-form=sig]')) { S.sig = { name: $('#sg-n').value, role: $('#sg-r').value, phone: $('#sg-p').value }; $('#sig-p').innerHTML = sigHtml(S.sig, ((S.project.brand && S.project.brand.colors[0]) || [])[1] || '#092482'); return; }
    if (t.closest('.otp')) {
      const digits = t.value.replace(/\D/g, '');
      if (digits.length > 1) { const all = [...document.querySelectorAll('.otp input')]; digits.slice(0, 6).split('').forEach((d, i) => all[i] && (all[i].value = d)); all[Math.min(5, digits.length - 1)].focus(); return; }
      t.value = digits; if (digits && t.nextElementSibling) t.nextElementSibling.focus();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (S.ob || S.zoom)) { S.ob = null; S.zoom = null; render(); return; }
    if (e.target.closest && e.target.closest('.otp') && e.key === 'Backspace' && !e.target.value && e.target.previousElementSibling) e.target.previousElementSibling.focus();
  });

  try { const th = localStorage.getItem('orem-theme'); if (th) document.documentElement.dataset.theme = th; } catch {}
  if (API.demo) { API.as('claire@maisonlumen.fr'); enter(); }
  else enter().catch(() => { S.loading = false; render(); });
})();
