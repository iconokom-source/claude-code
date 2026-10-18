/* Interface de l'espace client Orem : vue client et vue agence.
   window.DEMO = true → tout tourne dans le navigateur avec des données d'exemple (aucun serveur). */
(function () {
  const IMG = window.IMG || { logo: 'assets/logo-black.png', louis: 'assets/louis.jpg', theophile: 'assets/theophile.jpg', clement: 'assets/clement.jpg' };
  const cfg = () => (S && S.config) || {};
  const CALF = () => cfg().booking || 'https://app.iclosed.io/e/Orem/rdv-30min';
  const $ = (s) => document.querySelector(s);
  const ic = (id, st) => `<svg aria-hidden="true"${st ? ` style="${st}"` : ''}><use href="#i-${id}"/></svg>`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = (d) => (d ? new Date(d) : null);
  // L'année n'est ajoutée que si la date n'est pas dans l'année en cours.
  const fmt = (d, o = { day: 'numeric', month: 'short' }) => { if (!d) return ''; const x = D(d); if (isNaN(x)) return ''; const opt = !o.year && o.month && x.getFullYear() !== new Date().getFullYear() ? { ...o, year: 'numeric' } : o; const out = new Intl.DateTimeFormat('fr-FR', opt).format(x); return o.day === 'numeric' && o.month && x.getDate() === 1 ? out.replace(/^(\D*)1(\s)/, '$11er$2') : out; };
  const fmtLong = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtTime = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
  const money = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n || 0).replace(/ /g, ' ') + ' €';
  const size = (b) => (!b ? '' : b >= 1e9 ? (b / 1e9).toFixed(1).replace('.', ',') + ' Go' : b >= 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko');
  const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const dtKey = (d) => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

  /* ---------- Accès aux données : serveur local ou démo en mémoire ---------- */
  /* Petit fichier : un seul envoi. */
  const smallUpload = (id, file, cat, onp, missing, extra = {}) => new Promise((ok, ko) => {
        const x = new XMLHttpRequest();
        x.open('POST', `/api/projects/${id}/files?name=${encodeURIComponent(file.name)}&cat=${encodeURIComponent(cat || '')}${missing ? '&missing=' + encodeURIComponent(missing) : ''}${extra.folder ? '&folder=' + encodeURIComponent(extra.folder) : ''}${extra.batch ? '&batch=1' : ''}`);
        x.setRequestHeader('X-Orem', '1');
        x.upload.onprogress = (e) => e.lengthComputable && onp && onp(e.loaded / e.total);
        x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch {} x.status < 300 ? ok(d) : ko(new Error(d.error || R('Envoi impossible. Réessayez dans un instant ; si cela continue, écrivez à l’équipe dans Messages.', 'Envoi impossible. Réessaie dans un instant ; si cela continue, écris à l’équipe dans Messages.'))); };
        x.onerror = () => ko(new Error(R('Connexion perdue pendant l’envoi. Vérifiez votre connexion internet, puis renvoyez le fichier.', 'Connexion perdue pendant l’envoi. Vérifie ta connexion internet, puis renvoie le fichier.')));
        x.send(file);
  });
  /* Un morceau d'un gros fichier, avec sa progression. */
  const putChunk = (uid, offset, blob, onp) => new Promise((ok, ko) => {
    const x = new XMLHttpRequest();
    x.open('PUT', `/api/uploads/${uid}?offset=${offset}`); x.setRequestHeader('X-Orem', '1');
    x.upload.onprogress = (e) => e.lengthComputable && onp && onp(e.loaded);
    x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch {} if (x.status < 300) return ok(d); const e = new Error(d.error || 'Envoi interrompu.'); e.status = x.status; e.received = d.received; ko(e); };
    x.onerror = () => { const e = new Error('Connexion perdue.'); e.status = 0; ko(e); };
    x.send(blob);
  });
  function httpApi() {
    const j = async (url, opts = {}) => {
      const r = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'Content-Type': 'application/json', 'X-Orem': '1', ...(opts.headers || {}) } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(data.error || R('Une erreur est survenue (code ' + r.status + '). Rechargez la page et réessayez.', 'Une erreur est survenue (code ' + r.status + '). Recharge la page et réessaie.')); e.status = r.status; throw e; }
      return data;
    };
    return {
      me: () => j('/api/me'),
      login: (email) => j('/api/login', { method: 'POST', body: JSON.stringify({ email }) }),
      verify: (email, code) => j('/api/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
      logout: () => j('/api/logout', { method: 'POST' }),
      logoutAll: () => j('/api/logout-all', { method: 'POST' }),
      projects: () => j('/api/projects'),
      project: (id) => j('/api/projects/' + id),
      create: (data) => j('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
      action: (id, a) => j('/api/projects/' + id + '/action', { method: 'POST', body: JSON.stringify(a) }),
      // Gros fichier (plus de 32 Mo) : envoi par morceaux, qui reprend tout seul après une coupure. Aucune limite de taille.
      upload: async (id, file, cat, onp, missing, extra = {}) => {
        if (file.size <= 32 * 1024 ** 2) return smallUpload(id, file, cat, onp, missing, extra);
        const st = await j(`/api/projects/${id}/uploads`, { method: 'POST', body: JSON.stringify({ name: file.name, size: file.size, cat, missing, folder: extra.folder || '', batch: !!extra.batch }) });
        const CH = Math.min(st.chunk || 64 * 1024 ** 2, 32 * 1024 ** 2), pause = (ms) => new Promise((r) => setTimeout(r, ms));
        let off = st.received || 0, tries = 0;
        for (;;) {
          const end = Math.min(file.size, off + CH);
          try {
            const r = await putChunk(st.id, off, file.slice(off, end), (n) => onp && onp((off + n) / file.size));
            tries = 0; off = r.received; if (r.done) return r;
          } catch (e) {
            if (e.status === 409 && typeof e.received === 'number') { off = e.received; continue; }
            if (e.status && e.status !== 429 && e.status < 500 && e.status !== 400) throw e;
            if (++tries > 10) throw new Error(R('Connexion perdue pendant l’envoi. Vérifiez votre connexion internet, puis renvoyez le fichier.', 'Connexion perdue pendant l’envoi. Vérifie ta connexion internet, puis renvoie le fichier.'));
            if (onp) onp(off / file.size, true);
            await pause(Math.min(30000, 1000 * 2 ** tries));
            try { off = (await j('/api/uploads/' + st.id)).received; } catch (e2) { if (e2.status === 404) throw e2; }
          }
        }
      },
      batchDone: (id, meta) => j(`/api/projects/${id}/uploads-done`, { method: 'POST', body: JSON.stringify(meta) }),
      fileUrl: (f) => (f.demo ? null : '/api/files/' + encodeURIComponent(f.id)),
      exportUrl: (id, part) => '/api/projects/' + id + '/export' + (part ? '?part=' + part : ''),
      linkAuth: (token) => j('/api/auth/link', { method: 'POST', body: JSON.stringify({ token }) }),
      inbox: () => j('/api/inbox'),
      readNotif: (id) => j('/api/inbox/read', { method: 'POST', body: JSON.stringify({ id }) }),
      doneNotif: (id, undo) => j('/api/inbox/done', { method: 'POST', body: JSON.stringify({ id, undo }) }),
      setPrefs: (p) => j('/api/me/prefs', { method: 'POST', body: JSON.stringify(p) }),
      outbox: () => j('/api/outbox'),
      digest: () => j('/api/digest', { method: 'POST' }),
      settings: (b) => j('/api/settings', { method: 'POST', body: JSON.stringify(b) }),
      tasks: () => j('/api/tasks'),
      task: (b) => j('/api/tasks', { method: 'POST', body: JSON.stringify(b) }),
      connectors: () => j('/api/connectors'),
      testMail: (kind) => j('/api/test/mail', { method: 'POST', body: JSON.stringify({ kind }) }),
      check: (name) => j('/api/connectors/' + name + '/check', { method: 'POST', body: '{}' }),
      ask: (id, question) => j('/api/projects/' + id + '/ask', { method: 'POST', body: JSON.stringify({ question }) }),
      sync: (name, projectId) => j('/api/connectors/' + name + '/sync', { method: 'POST', body: JSON.stringify({ projectId }) }),
      vaultPut: (id, b) => j('/api/projects/' + id + '/vault', { method: 'POST', body: JSON.stringify(b) }),
      signFile: (id, fid, b) => j('/api/projects/' + id + '/files/' + fid + '/sign', { method: 'POST', body: JSON.stringify(b) }),
      proofUrl: (id, fid) => '/api/projects/' + id + '/files/' + fid + '/proof',
      vaultGet: (id) => j('/api/projects/' + id + '/vault'),
      vaultErase: (id) => j('/api/projects/' + id + '/vault', { method: 'DELETE' })
    };
  }
  function demoApi() {
    const store = Core.seed(), vault = {};
    let me = null;
    const BASE = 'https://espace.agence-orem.fr';
    const mail = (r) => { if (r && r.notices) Core.emailsFor(store, r.notices, BASE).forEach((m) => store.outbox.unshift({ ...m, at: new Date().toISOString() })); };
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const team = () => store.users.filter((u) => u.role === 'admin');
    const wait = (v) => new Promise((r) => setTimeout(() => r(clone(v)), 60));
    const fail = (msg) => Promise.reject(new Error(msg));
    return {
      demo: true,
      as: (email) => { me = store.users.find((u) => u.email === email); },
      me: () => (me ? wait({ user: { ...me, notify: me.role === 'admin' ? Core.prefsOf(me) : undefined }, team: team(), config: Core.publicConfig(store) }) : fail('Connectez-vous.')),
      login: (email) => { const u = store.users.find((x) => x.email === email); return wait(u ? { ok: true, devCode: '482917' } : { ok: true }); },
      verify: (email, code) => { const u = store.users.find((x) => x.email === email); if (!u || code !== '482917') return fail('Code incorrect ou expiré. Demandez-en un nouveau.'); me = u; return wait({ ok: true, user: u }); },
      logout: () => { me = null; return wait({ ok: true }); },
      logoutAll: () => { me = null; return wait({ ok: true }); },
      projects: () => wait({ projects: store.projects.filter((p) => Core.canSee(me, p)).map((x) => Core.summary(x, me)) }),
      project: (id) => { const p = store.projects.find((x) => x.id === id); if (!p || !Core.canSee(me, p)) return fail('Projet introuvable.');
        return wait({ project: Core.forUser(p, me), access: me.role === 'admin' ? store.users.filter((u) => u.projectId === id) : undefined,
          people: Object.fromEntries(store.users.map((u) => [u.id, u.name])), vault: vault[id] ? { at: vault[id].at } : null }); },
      // Démo : le coffre reste en mémoire dans l'onglet, rien n'est envoyé ni enregistré.
      vaultPut: (id, b) => { const r = Core.apply(store, id, me, { type: 'setup.domain', mode: 'vault', domain: b.domain, registrar: b.registrar }, true); if (r.error) return fail(r.error); mail(r); vault[id] = { at: new Date().toISOString(), login: b.login, secret: b.secret, note: b.note }; return wait({ ok: true }); },
      vaultGet: (id) => { if (me.role !== 'admin') return fail('Réservé à l’équipe.'); if (!vault[id]) return fail('Aucun accès dans le coffre.'); Core.apply(store, id, me, { type: 'vault.read' }, true); return wait({ ...vault[id], expires: new Date(Date.now() + 30 * 864e5).toISOString() }); },
      vaultErase: (id) => { delete vault[id]; return wait({ ok: true }); },
      signFile: (id, fid, b) => { const r = Core.apply(store, id, me, { type: 'file.sign', fid, name: b.name, agree: b.agree, sig: b.sig, hash: 'démo', ip: 'démo', ua: navigator.userAgent }, true); mail(r); return r.error ? fail(r.error) : wait(r); },
      proofUrl: () => null,
      create: (data) => { const r = Core.createProject(store, me, data); return r.error ? fail(r.error) : wait(r); },
      action: (id, a) => { const r = Core.apply(store, id, me, a); mail(r); return r.error ? fail(r.error) : wait(r); },
      batchDone: (id, meta) => { const r = Core.filesBatch(store, id, me, meta); mail(r); return r.error ? fail(r.error) : wait(r); },
      upload: (id, file, cat, onp, missing, extra = {}) => { onp && onp(1); const r = Core.addFile(store, id, me, { name: file.name, size: file.size, cat, folder: extra.folder, quiet: extra.batch }); if (!r.error && missing) Core.apply(store, id, me, { type: 'missing.done', mid: missing }, true);
        mail(r); if (r.file) r.file.demo = true; return r.error ? fail(r.error) : wait(r); },
      fileUrl: () => null,
      exportUrl: () => null,
      inbox: () => wait({ items: Core.inbox(store, me) }),
      readNotif: (id) => wait(Core.readNotif(store, me, id)),
      doneNotif: (id, undo) => wait(Core.doneNotif(store, me, id, undo)),
      setPrefs: (p) => { const r = Core.setPrefs(store, me, p); if (r.ok) me.notify = r.notify; return r.error ? fail(r.error) : wait(r); },
      outbox: () => wait({ enabled: false, items: store.outbox }),
      settings: (b) => { const r = Core.setSettings(store, me, b); return r.error ? fail(r.error) : wait(r); },
      tasks: () => { const r = Core.teamTasks(store, me); return r.error ? fail(r.error) : wait(r); },
      task: (b) => { const r = Core.taskAct(store, me, b); mail(r); return r.error ? fail(r.error) : wait({ ok: true, task: r.task }); },
      testMail: () => wait({ sent: false, error: 'démo : rien n’est envoyé' }),
      check: () => wait({ ok: false, message: 'Démo : aucun outil n’est branché.' }),
      connectors: () => wait({ connectors: [['pipedrive', 'Pipedrive'], ['abby', 'Abby'], ['qonto', 'Qonto'], ['google', 'Google Drive'], ['figma', 'Figma'], ['claude', 'Assistant (API Claude)']].map(([id, label]) => ({ id, label, configured: false, missing: [], does: 'Non connecté dans la démo' })) }),
      sync: () => fail('Dans la démo, aucun outil n’est connecté.'),
      ask: () => wait({ answer: null, fallback: true }),
      digest: () => { const m = Core.digestFor(store, me, '2000', BASE); if (m) store.outbox.unshift({ ...m, at: new Date().toISOString() }); return wait({ ok: true, sent: m ? 1 : 0 }); }
    };
  }
  const API = window.DEMO ? demoApi() : httpApi();

  /* ---------- État ---------- */
  const S = { drafts: {}, me: null, team: [], projects: [], project: null, access: [], people: {}, view: 'accueil', tab: 'pilotage', preview: false,
    cat: 'Tous', valForm: null, qa: null, ob: null, tool: null, bk: null, zoom: null, teaser: null, sig: null, login: { step: 'email', email: '', dev: null }, uploading: null, loading: true };
  const isAdmin = () => S.me && S.me.role === 'admin';
  // Avant signature : une proposition attend, rien n'est encore signé. Pas de planning ni de facturation à montrer.
  const prospect = () => { const p = S.project; return !!p && !p.billing.signedAt && (p.proposals || []).some((x) => !x.from && x.status !== 'accepted') && !(p.proposals || []).some((x) => !x.from && x.status === 'accepted'); };
  // Une seule source de vérité pour les états (livrables liés à une validation, projet livré…).
  const phS = (ph) => Core.phaseState(S.project, ph), itS = (it) => Core.itemState(S.project, it);
  const ITEM_CHIP = { done: '<span class="chip ok">Fait</span>', on: '<span class="chip hl">En cours</span>', review: '<span class="chip warn">À valider</span>', wait: '<span class="chip idle">Prévu</span>' };
  const PHASE_CHIP = { done: '<span class="chip ok">Terminé</span>', on: '<span class="chip hl">En cours</span>', wait: '<span class="chip idle">À venir</span>' };
  const phName = (ph) => (ph ? `${ph.letter ? ph.letter + ' · ' : ''}${ph.t}` : '');
  const clientMode = () => !isAdmin() || S.preview;
  const R = (vous, tu) => (S.project && S.project.registre === 'tu' ? tu : vous);
  const who = (id) => (id === 'team' ? 'L’équipe Orem' : S.people[id] || (id || '').replace(/^u_/, ''));

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => { t.classList.remove('show'); setTimeout(() => { if (!t.classList.contains('show')) t.textContent = ''; }, 300); }, Math.max(4500, msg.length * 70)); }
  /* Erreur sous le champ : annoncée, reliée au champ (aria-describedby) et focus dessus. */
  function fieldError(id, msg) {
    const el = typeof id === 'string' ? document.getElementById(id) : id; if (!el) return toast(msg);
    const eid = (el.id || el.name) + '-err'; let sp = document.getElementById(eid);
    if (!sp) { sp = document.createElement('span'); sp.id = eid; sp.className = 'err'; sp.setAttribute('role', 'alert'); (el.closest('.field, .otp, fieldset') || el).insertAdjacentElement(el.closest('.field, .otp, fieldset') ? 'beforeend' : 'afterend', sp); }
    sp.textContent = msg; el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '').replace(eid, '').trim() + ' ' + eid).trim()); el.focus();
  }
  /* Après une validation : 10 secondes pour changer d'avis. */
  function undoBar(vid) {
    const old = $('#undo'); if (old) old.remove();
    const d = document.createElement('div'); d.id = 'undo'; d.className = 'undo'; d.innerHTML = `<span role="status">Validation enregistrée. L’équipe est prévenue.</span><button class="btn btn-sm" data-act="val-undo" data-id="${vid}">Annuler <span class="num" id="undo-n" aria-hidden="true">10</span><span aria-hidden="true"> s</span><span class="sr">ma validation</span></button>`;
    document.body.appendChild(d); { const b = d.querySelector('button'); b && b.focus(); } let n = 10;
    const tick = () => { n--; const c = $('#undo-n'); if (c) c.textContent = n; if (n <= 0) { d.remove(); return; } undoBar.t = setTimeout(tick, 1000); };
    clearTimeout(undoBar.t); undoBar.t = setTimeout(tick, 1000);
  }
  /* Enregistrement automatique (pilotage) : à chaque champ quitté, sans bouton ni rechargement de la page. */
  async function autosave(f) {
    const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : ''), st = f.querySelector('.save-st');
    const a = { phase: { type: 'phase.set', n: v('a-phase') }, next: { type: 'next.set', title: v('a-nt'), text: v('a-nx'), go: v('a-ng') }, meeting: { type: 'meeting.set', title: v('a-mt'), when: v('a-mw') || null } }[f.dataset.form];
    if (!a || S.preview) return;
    if (st) st.textContent = 'Enregistrement…';
    try { await API.action(S.project.id, a); const r = await API.project(S.project.id); S.project = r.project; if (st) st.textContent = 'Enregistré à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
      if (f.dataset.form === 'phase') render(); }
    catch (e) { if (st) st.textContent = ''; fieldError(f.querySelector('input,select,textarea'), e.message); }
  }
  /* Badges de la barre latérale et de la barre du bas, mis à jour sans tout reconstruire. */
  function renderBadges() { const side = document.querySelector('.side .nav'); if (!side) return render(); const tmp = document.createElement('div'); tmp.innerHTML = shell(''); const ns = tmp.querySelector('.side .nav'), nt = tmp.querySelector('.tabbar'); side.innerHTML = ns.innerHTML; const tb = document.querySelector('.tabbar'); if (tb && nt) tb.innerHTML = nt.innerHTML; }
  async function act(a, okMsg) {
    if (S.preview) { toast('Aperçu : les actions sont désactivées.'); return false; }
    // Enregistrement automatique : un simple « Enregistré » discret au lieu du message habituel.
    if (S.quiet) { S.quiet = false; okMsg = okMsg ? 'Enregistré.' : okMsg; }
    try { await API.action(S.project.id, a); if (isAdmin()) await loadInbox(); await loadProject(S.project.id); if (okMsg) toast(okMsg); return true; }
    catch (e) { toast(e.message); return false; }
  }
  async function loadProject(id) { const r = await API.project(id); S.project = r.project; S.access = r.access || []; S.people = r.people || {}; S.vault = r.vault || null; S.vaultOpen = null; render(); }
  async function loadProjects() { const r = await API.projects(); S.projects = r.projects; }

  /* ---------- Coque ---------- */
  const pending = () => (S.project ? S.project.validations.filter((v) => v.status === 'ready').length : 0);
  const propsOnly = () => (S.project ? (S.project.proposals || []).filter((x) => x.status === 'sent').length : 0);
  const propsSent = () => (S.project ? (S.project.proposals || []).filter((x) => x.status === 'sent').length + S.project.files.filter((f) => f.sign && f.sign.status === 'requested').length : 0);

  function shell(content) {
    const p = S.project;
    const admin = !clientMode();
    const link = ([id, l, i]) => `<a href="#${id}" data-go="${id}" ${S.view === id || (id === 'clients' && S.view === 'admin') ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${id === 'valider' && pending() + propsSent() ? `<span class="badge" aria-label="${pending() + propsSent()} à valider">${pending() + propsSent()}</span>` : ''}${id === 'messages' && unread() ? `<span class="badge" aria-label="${unread()} non lus">${unread()}</span>` : ''}${id === 'inbox' && todoInbox() ? `<span class="badge" aria-label="${todoInbox()} à traiter">${todoInbox()}</span>` : ''}${id === 'taches' && myUrgent() ? `<span class="badge" aria-label="${myUrgent()} pour aujourd’hui ou en retard">${myUrgent()}</span>` : ''}</a>`;
    const groups = admin
      ? [['Au quotidien', [['inbox', 'Boîte de réception', 'mail'], ['taches', 'Tâches de l’équipe', 'check'], ['clients', 'Clients', 'team']]], ['Gérer', [['nouveau', 'Nouvel espace client', 'plus'], ['reglages', 'Réglages', 'gear']]]]
      : prospect() ? [['Ma proposition', [['accueil', 'Accueil', 'home'], ['valider', 'À valider', 'ok']]], ['Échanges', [['messages', 'Messages', 'chat']]]]
      : [['Mon projet', [['accueil', 'Accueil', 'home'], ['projet', 'Étapes', 'map'], ['valider', 'À valider', 'ok'], ['maquettes', 'Maquettes et visuels', 'figma']]],
         ['Échanges', [['messages', 'Messages', 'chat'], ['fichiers', 'Fichiers et factures', 'folder']]],
         ...((p && visibleTools(p).length) ? [['Outils', [['outils', 'Boîte à outils', 'plus']]]] : [])];
    const navHtml = groups.map(([t, items]) => `<div class="sec">${t}</div>${items.map(link).join('')}`).join('') + (!admin && p && !prospect() ? evoNav(p) : '');
    const tabs = admin ? [['inbox', 'Réception', 'mail'], ['taches', 'Tâches', 'check'], ['clients', 'Clients', 'team'], ['compose', 'Ajouter', 'plus'], ['reglages', 'Réglages', 'gear']] : [['accueil', 'Accueil', 'home'], ['valider', 'À valider', 'ok'], ['messages', 'Messages', 'chat'], ['fichiers', 'Fichiers', 'folder'], ['plus', 'Plus', 'menu']];
    const tabHtml = tabs.map(([id, l, i]) => { const cur = id === 'plus' ? ['plus', 'projet', 'maquettes', 'documents', 'outils', 'biblio', 'equipe', 'preferences', 'evolution'].includes(S.view) : S.view === id || (id === 'clients' && S.view === 'admin');
      return `<a href="#${id}" data-go="${id}" ${cur ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${id === 'inbox' && todoInbox() ? `<span class="badge">${todoInbox()}<span class="sr"> à traiter</span></span>` : ''}${id === 'taches' && myUrgent() ? `<span class="badge">${myUrgent()}<span class="sr"> pour aujourd’hui ou en retard</span></span>` : ''}${id === 'messages' && unread() ? `<span class="badge">${unread()}</span>` : ''}${id === 'valider' && pending() + propsSent() ? `<span class="badge">${pending() + propsSent()}<span class="sr"> à valider</span></span>` : ''}</a>`; }).join('');
    let card;
    if (admin) {
      const waiting = mineProjects().filter((x) => waitingOf(x).who === 'agence' || waitingOf(x).both).length;
      card = `<div class="pcard"><strong>${S.projects.length} espace${S.projects.length > 1 ? 's' : ''} client${S.projects.length > 1 ? 's' : ''}</strong><span class="small">${waiting ? waiting + ' attend' + (waiting > 1 ? 'ent' : '') + ' une action de l’agence' : 'Rien en attente côté agence'}</span></div>`;
    } else {
      const dots = p.phases.map((x) => `<i class="${phS(x) === 'wait' ? '' : phS(x)}"></i>`).join('');
      card = `<div class="pcard">${clientLogo(p, 'dark', 'pc-logo') || `<strong>${esc(p.client)}</strong>`}<span class="small">${p.archivedAt ? 'Espace archivé' : p.deliveredAt ? (p.offer === 'site' ? 'Site en ligne · ' : 'Livré · ') + esc(phName(p.phases[p.phases.length - 1])) : esc(phName(p.phases[p.phase - 1]))}</span><div class="pdots">${dots}<span>${p.phase}/${p.phases.length}</span></div></div>`;
    }
    const meImg = S.me.photo && IMG[S.me.photo] && !S.preview ? `<img src="${IMG[S.me.photo]}" alt="">` : esc(((S.preview ? p.contactName : S.me.name) || '?')[0]);
    return `${S.preview ? `<div class="preview-bar">${ic('eye', 'width:18px;height:18px')}<span>Aperçu de l’espace de ${esc(p.client)}, tel que le client le voit</span><button data-act="endpreview">Quitter l’aperçu</button></div>` : ''}
    <a class="skip" href="#main" data-act="skip">Aller au contenu</a>
    ${cfg().test ? `<div class="testbar" role="note"><strong>Version de test</strong>${admin && cfg().mail ? `<span>Les e-mails ne partent qu’aux adresses ${esc((cfg().mail.allow || []).map((a) => (a.includes('@') ? a : '@' + a)).join(', ') || 'autorisées')}. Tout le reste est réel : connecteurs, fichiers, connexions.</span>` : '<span>Cet espace sert aux essais de l’agence.</span>'}</div>` : ''}
    <div class="app">
      <aside class="side" aria-label="Navigation">
        <div class="brand"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b><span class="tag">${admin ? 'Agence' : 'Client'}</span></div>
        ${card}
        ${admin ? `<button class="add-btn" data-act="compose">${ic('plus')}Ajouter pour un client</button>` : ''}
        <nav class="nav" aria-label="Rubriques">${navHtml}</nav>
        ${API.demo && !S.preview ? `<label class="demo-sel"><span>${ic('eye')}Démo : voir l\u2019espace de</span><select data-demo aria-label="Changer d\u2019espace de démo">${[['claire@maisonlumen.fr', 'Claire · Maison Lumen (en cours)'], ['julie@cabinet-varenne.fr', 'Julie · Cabinet Varenne (démarrage)'], ['ines@domaine-des-vergers.fr', 'Inès · Domaine des Vergers (proposition)'], ['hugo@huchet-demorge.fr', 'Hugo · Huchet-Demorge (livré)'], ['louis@agence-orem.fr', 'Louis · agence'], ['theophile@agence-orem.fr', 'Théophile · agence'], ['clement@agence-orem.fr', 'Clément · agence']].map(([e, l]) => `<option value="${e}" ${S.me.email === e ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
        ${!admin ? `<a class="help-link" href="#equipe" data-go="equipe" ${S.view === 'equipe' ? 'aria-current="page"' : ''}>${ic('team')}<span>Équipe et aide</span></a>` : ''}
        <div class="side-foot">
          <div class="me-av">${meImg}</div>
          <div class="me-txt"><strong>${esc(S.preview ? p.contactName || p.client : S.me.name)}</strong><span class="role">${admin ? 'Agence' : 'Client'}</span></div>
          ${!admin && !S.preview ? bell() : ''}
          <button class="icon-btn" data-act="theme" aria-label="Mode sombre" aria-pressed="${isDark() ? 'true' : 'false'}" title="Mode sombre">${ic('moon')}</button>
          ${S.preview ? '' : `<button class="icon-btn" data-act="logout" aria-label="Se déconnecter" title="Se déconnecter">${ic('out')}</button>`}
        </div>
      </aside>
      <div class="stage">
        <header class="topbar">${!admin && !S.preview ? `<span class="top-bell">${bell()}</span>` : ''}<div class="brand"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b></div>${API.demo && !S.preview ? `<label class="demo-sel top"><span>${ic('eye')}Démo : voir l\u2019espace de</span><select data-demo aria-label="Changer d\u2019espace de démo">${[['claire@maisonlumen.fr', 'Claire · Maison Lumen (en cours)'], ['julie@cabinet-varenne.fr', 'Julie · Cabinet Varenne (démarrage)'], ['ines@domaine-des-vergers.fr', 'Inès · Domaine des Vergers (proposition)'], ['hugo@huchet-demorge.fr', 'Hugo · Huchet-Demorge (livré)'], ['louis@agence-orem.fr', 'Louis · agence'], ['theophile@agence-orem.fr', 'Théophile · agence'], ['clement@agence-orem.fr', 'Clément · agence']].map(([e, l]) => `<option value="${e}" ${S.me.email === e ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}${API.demo && !S.preview ? '' : `<span class="small">${admin ? 'Espace agence' : esc(p.client)}</span>`}</header>
        <div class="sheet"><main class="main" id="main" tabindex="-1"><div class="wrap">${wrapHtml(content)}</div></main></div>
      </div>
      <nav class="tabbar" aria-label="Navigation principale" style="grid-template-columns:repeat(${tabs.length},minmax(0,1fr))">${tabHtml}</nav>
    </div>`;
  }
  function wrapHtml(content) { const p = S.project; return `${p && p.archivedAt && clientMode() ? `<div class="alert">${ic('lock')}<div>Cet espace est archivé depuis le ${fmt(p.archivedAt, { day: 'numeric', month: 'long' })}. Tout reste consultable et téléchargeable, en lecture seule.</div></div>` : ''}${content}`; }

  /* ---------- Vues client ---------- */
  function phaseProgress(ph, i) {
    const st = phS(ph);
    if (st === 'done') return 100;
    if (st === 'wait') return 0;
    const n = ph.items.length || 1;
    const v = ph.items.reduce((s, it) => s + ({ done: 1, review: 0.75, on: 0.5 }[itS(it)] || 0), 0);
    return Math.max(8, Math.round((v / n) * 100));
  }
  const CTA = { proposition: ['Lire la proposition', 'proposition'], valider: ['Voir et valider', 'valider'], fichiers: ['Déposer mes fichiers', 'fichiers'], projet: ['Voir les étapes', 'projet'], documents: ['Voir les devis et factures', 'documents'], equipe: ['Contacter l’équipe', 'equipe'], outils: ['Ouvrir la boîte à outils', 'outils'], messages: ['Lire le message', 'messages'], maquettes: ['Voir les maquettes', 'maquettes'] };

  /* ---------- Bien démarrer : les trois priorités à l'arrivée (acompte, Webflow, nom de domaine) ---------- */
  const REGISTRARS = {
    OVHcloud: 'Dans l’espace client OVHcloud : menu du compte › Gestion des contacts, puis sur la ligne du domaine « Modifier le contact technique » avec l’identifiant client de l’agence{nic}.',
    Gandi: 'Dans Gandi : Organisation › Membres › Inviter, avec l’adresse {mail}, rôle « Gestion technique ».',
    IONOS: 'Dans IONOS : Compte › Utilisateurs et accès › Ajouter un utilisateur, avec l’adresse {mail}, accès aux domaines.',
    GoDaddy: 'Dans GoDaddy : Paramètres du compte › Accès délégué › Inviter, avec l’adresse {mail}, accès « Produits et domaines ».',
    'Squarespace Domains': 'Dans Squarespace Domains (anciennement Google Domains) : le domaine › Permissions › Ajouter un utilisateur, avec l’adresse {mail}.',
    'o2switch': 'o2switch ne propose pas d’accès délégué : choisir plutôt l’option « Coffre chiffré » ci-dessus.',
    Autre: 'Dans l’espace client de votre hébergeur, chercher « accès délégué », « utilisateurs » ou « contact technique », puis inviter {mail}. Sinon, choisir l’option « Coffre chiffré ».'
  };
  /* Logo du client : en blanc sur fond sombre, en noir sur fond clair (« mono »), ou dans ses couleurs (« color »). */
  function clientLogo(p, on, cls = '') {
    const b = p && p.brand; if (!b || !b.logo) return '';
    return `<img class="clogo ${b.logoTone === 'color' ? '' : on === 'dark' ? 'to-white' : on === 'auto' ? 'to-auto' : 'to-black'} ${cls}" src="${esc(asset(b.logo))}" alt="${esc(p.client)}">`;
  }
  function setupState(t) { return !t ? null : t.done ? 'done' : t.sent ? 'sent' : t.retry ? 'retry' : 'todo'; }
  function setupSteps() {
    const p = S.project, T = (k) => p.tasks.find((t) => t.auto === k);
    const dep = T('acompte'), inv = p.invoices.find((i) => /acompte/i.test(i.label));
    return [
      dep || inv ? { k: 'acompte', t: 'Régler l’acompte', st: dep ? (dep.done ? 'done' : 'todo') : inv.status === 'paid' ? 'done' : 'todo', sub: inv ? money(inv.ttc) + ' TTC' : '' } : null,
      T('webflow') ? { k: 'webflow', t: 'Créer l’espace Webflow', st: setupState(T('webflow')), task: T('webflow') } : null,
      T('domaine') ? { k: 'domaine', t: 'Donner l’accès au nom de domaine', st: setupState(T('domaine')), task: T('domaine') } : null
    ].filter(Boolean);
  }
  const SETUP_CHIP = { done: '<span class="chip ok">Fait</span>', sent: '<span class="chip hl">Envoyé, l’équipe vérifie</span>', retry: '<span class="chip warn">À reprendre</span>', todo: '<span class="chip warn">À faire</span>' };
  function vDemarrer() {
    const p = S.project, st = setupSteps(), C = cfg(), inv = p.invoices.find((i) => /acompte/i.test(i.label));
    const mail = C.webflowInvite || 'louis@agence-orem.fr', by = (t) => (t && t.checkedBy ? ' par ' + esc(who(t.checkedBy).split(' ')[0]) : '');
    const sec = (x, i, body) => `<section class="panel" id="su-${x.k}" aria-labelledby="su-${x.k}-h"><div class="panel-head"><h2 id="su-${x.k}-h"><span class="rank">${String(i + 1).padStart(2, '0')}</span>${esc(x.t)}</h2>${SETUP_CHIP[x.st]}</div>${body}</section>`;
    const parts = st.map((x, i) => {
      if (x.k === 'acompte') return sec(x, i, x.st === 'done' ? `<p>Acompte bien reçu, merci. Le projet est lancé.</p>` : `<p>Le projet démarre à réception de l’acompte${inv ? ` de <strong class="num">${money(inv.ttc)} TTC</strong>` : ''}. ${R('Votre', 'Ton')} virement se coche tout seul à son arrivée sur le compte de l’agence.</p>
        <dl class="kv"><dt>Titulaire</dt><dd>${esc(C.holder)}</dd><dt>IBAN</dt><dd class="num" id="iban">${esc(C.iban)}</dd><dt>BIC</dt><dd class="num">${esc(C.bic)}</dd>${inv && inv.num ? `<dt>Référence</dt><dd class="num">${esc(inv.num)}</dd>` : ''}</dl>
        <div class="inline">${inv && inv.payUrl ? `<a class="btn btn-primary" href="${esc(inv.payUrl)}" target="_blank" rel="noopener">Payer en ligne</a>` : ''}<button class="btn btn-line" data-act="copy">${ic('copy')}Copier l’IBAN</button><a class="btn btn-line" href="#documents" data-go="documents">Voir la facture</a></div>`);
      if (x.k === 'webflow') { const t = x.task;
        return sec(x, i, `<p>Le site ${R('vous ', 't’')}appartient dès le premier jour : il est construit dans ${R('votre', 'ton')} propre espace Webflow, et l’hébergement est à ${R('votre', 'ton')} nom.</p>
        <ol class="su-steps"><li>${R('Créez', 'Crée')} un compte sur <a href="https://webflow.com/signup" target="_blank" rel="noopener">webflow.com</a> avec l’adresse e-mail de l’entreprise.</li><li>${R('Créez', 'Crée')} un espace de travail (appelé « Workspace » dans Webflow) au nom de ${esc(p.client)}. L’offre gratuite suffit pour commencer.</li><li>Dans les réglages de cet espace, rubrique « Members » (membres), ${R('invitez', 'invite')} <strong>${esc(mail)}</strong>.</li></ol>
        ${t.retry && !t.sent ? `<p class="hint warn-t">L’équipe ${R('vous', 'te')} demande de reprendre : « ${esc(t.retry)} »</p>` : ''}
        ${x.st === 'done' ? `<p>Invitation reçue et acceptée${by(t)} : merci !</p>` : x.st === 'sent' ? `<p>Merci ! L’équipe vérifie l’invitation pour l’espace « ${esc(t.info.ws)} ».</p>` : `<form class="form" data-form="su-wf"><div class="field"><label for="su-ws">Nom de l’espace de travail Webflow</label><input id="su-ws" type="text" value="${esc(p.client)}" autocomplete="organization"></div><div><button class="btn btn-primary" type="submit">C’est fait, l’invitation est partie</button></div></form>`}`); }
      const t = x.task, i0 = t.info || {};
      const regOpts = Object.keys(REGISTRARS).map((r) => `<option ${S.suReg === r || (!S.suReg && i0.registrar === r) ? 'selected' : ''}>${r}</option>`).join('');
      const reg = S.suReg || i0.registrar || 'OVHcloud', mode = S.suMode || 'delegate';
      const how = REGISTRARS[reg].replace('{mail}', esc(mail)).replace('{nic}', C.ovhNic ? ` : <strong class="num">${esc(C.ovhNic)}</strong>` : ' (on ' + R('vous', 'te') + ' le donne par message)');
      return sec(x, i, `<p>Pour relier le site à ${R('votre', 'ton')} adresse, l’équipe a besoin d’agir sur le nom de domaine. Le plus sûr : un accès délégué, sans jamais partager de mot de passe.</p>
        ${t.retry && !t.sent ? `<p class="hint warn-t">L’équipe ${R('vous', 'te')} demande de reprendre : « ${esc(t.retry)} »</p>` : ''}
        ${x.st === 'done' ? `<p>Accès vérifié${by(t)} pour <strong>${esc(i0.domain)}</strong>. ${S.vault ? '' : 'Rien n’est conservé dans le coffre.'}</p>` : x.st === 'sent' ? `<p>Merci ! L’équipe vérifie l’accès à <strong>${esc(i0.domain)}</strong>${i0.mode === 'vault' ? ' (identifiants dans le coffre chiffré, effacés dès la vérification)' : ''}.</p>${S.vault ? `<button class="btn btn-line btn-sm" data-act="vault-erase">Effacer mes identifiants du coffre</button>` : ''}` : `
        <form class="form" data-form="su-dn">
          <div class="line"><div class="field"><label for="su-d">Nom de domaine</label><input id="su-d" type="text" inputmode="url" autocomplete="url" placeholder="ex. ${esc(p.client.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ''))}.fr" value="${esc(i0.domain || S.suDom || '')}"></div>
          <div class="field"><label for="su-r">Où a-t-il été acheté ?</label><select id="su-r" data-sureg="1">${regOpts}</select></div></div>
          <fieldset class="field"><legend>Comment ${R('voulez-vous', 'veux-tu')} donner l’accès ?</legend>
            <label class="opt"><input type="radio" name="su-m" value="delegate" ${mode === 'delegate' ? 'checked' : ''}> Accès délégué (recommandé, sans mot de passe)</label>
            <label class="opt"><input type="radio" name="su-m" value="vault" ${mode === 'vault' ? 'checked' : ''}> Coffre chiffré (identifiant et mot de passe)</label>
            <label class="opt"><input type="radio" name="su-m" value="unknown" ${mode === 'unknown' ? 'checked' : ''}> Je ne sais pas qui le gère</label></fieldset>
          ${mode === 'delegate' ? `<p class="howto">${how}</p>` : mode === 'vault' ? `<div class="vault-n"><p class="small">${ic('lock')}Chiffrés dès l’envoi, visibles par l’équipe seulement, chaque consultation est enregistrée. Effacés dès que l’accès est vérifié, et au plus tard dans 30 jours. Si le compte a une double authentification, on ${R('vous ', 't’')}appelle au moment de la connexion.</p>
            <div class="line"><div class="field"><label for="su-l">Identifiant</label><input id="su-l" type="text" autocomplete="off" spellcheck="false"></div><div class="field"><label for="su-p">Mot de passe</label><input id="su-p" type="password" autocomplete="new-password"></div></div>
            <div class="field"><label for="su-n">Précision (facultatif)</label><input id="su-n" type="text" placeholder="ex. compte au nom de Paul, le gérant"></div></div>` : `<p class="howto">Aucun souci : ${R('indiquez', 'indique')} seulement le nom de domaine, l’équipe retrouve où il est géré et ${R('vous', 'te')} dit quoi faire.</p>`}
          <div><button class="btn btn-primary" type="submit">${mode === 'vault' ? 'Envoyer dans le coffre chiffré' : mode === 'delegate' ? 'C’est fait, l’accès est donné' : 'Envoyer'}</button></div></form>`}`);
    }).join('');
    return `<div class="head"><div><h1>Bien démarrer</h1><p class="lead">${st.length} priorités pour lancer le projet sans attendre</p></div></div>${parts}`;
  }
  /* ---------- Espace client v2 (bento) ----------
     Maquettes validées par Louis : docs/maquettes/client-v2 (cx.css, cx-render.js, captures). CSS portée sous .cx-wrap
     (ajoutée au #main .wrap dans render() pour ces vues). Une carte encre pour la prochaine action, des chiffres en Trykker,
     l'avancement O.R.E.M. en bandes ; chaque écran garde ses vraies actions (valider, signer, déposer, écrire, payer). */
  const CX_VIEWS = ['accueil', 'projet', 'valider', 'fichiers', 'documents', 'messages', 'maquettes', 'biblio'];
  const CXDAY = 864e5, cxD0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const cxDays = (d) => Math.round((cxD0(d) - cxD0(Date.now())) / CXDAY);
  const cxF = (d, o) => new Intl.DateTimeFormat('fr-FR', o).format(new Date(d));
  const cxHour = (d) => { const x = new Date(d); return x.getHours() + ' h' + (x.getMinutes() ? String(x.getMinutes()).padStart(2, '0') : ''); };
  const cxRel = (d) => { const n = cxDays(d); return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : n === -1 ? 'hier' : 'le ' + fmt(d); }; // « demain », jamais « avant demain »
  const cxRelC = (d) => cap(cxRel(d));
  const cxAgo = (d) => { const n = cxDays(d); return n === 0 ? 'Aujourd’hui' : n === -1 ? 'Hier' : fmt(d); };
  const cxPl = (n, s, pl) => `${n} ${n > 1 ? pl || s + 's' : s}`;
  const cxMoney = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n || 0);
  const cxSize = (b) => (!b ? '0 Ko' : b >= 1e9 ? (b / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Go' : b >= 1e6 ? (b / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: b >= 1e8 ? 0 : 1 }) + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko');
  const cxMon = (d) => cxF(d, { month: 'short' }).replace('.', '');
  const cxAnd = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1] : a[0] || '');
  // Espace insécable avant « : ; ! ? » et après « « », comme dans les maquettes (les données l'oublient parfois).
  const cxNb = (h) => h.replace(/(?<!&#?\w{1,7})([A-Za-zÀ-ÿ)»])([:;!?])(?=\s|<|$)/g, '$1 $2').replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');
  const cxRise = '<svg class="cx-rise" aria-hidden="true"><use href="#i-arrow"/></svg>';
  const cxUser = (id) => S.team.find((u) => u.id === id);
  const cxFirst = (id) => (id === 'client' ? R('Vous', 'Toi') : id === 'team' ? 'L’équipe Orem' : ((cxUser(id) || { name: who(id) }).name || '').split(' ')[0]);
  const cxAv = (id, cls = 'cx-av') => {
    if (id === 'client') return `<span class="cx-you" aria-hidden="true">${esc((S.project.contactName || 'V')[0])}</span>`;
    if (id === 'team') return '<span class="cx-you cx-team-av" aria-hidden="true">O</span>';
    const u = cxUser(id); return u && IMG[u.photo] ? `<img class="${cls}" src="${IMG[u.photo]}" alt="">` : `<span class="cx-you" aria-hidden="true">${esc((cxFirst(id) || '?')[0])}</span>`;
  };
  const cxLead = () => (S.project.team && S.project.team.lead) || (S.team[0] || {}).id;
  const cxMembers = () => { const m = (S.project.team && S.project.team.members) || []; const L = (m.length ? m : S.team.map((u) => u.id)).filter((id) => cxUser(id)); const l = cxLead(); return L.sort((a, b) => (a === l ? -1 : b === l ? 1 : 0)); };
  const cxHead = (h1, sub, right = '') => `<div class="cx-head"><div><h1>${h1}</h1>${sub ? `<p class="cx-sub">${sub}</p>` : ''}</div>${right ? `<div class="cx-head-r">${right}</div>` : ''}</div>`;
  const cxKpi = (l, icn, num, unit, foot, o = {}) => { const tag = o.go ? 'a' : 'div';
    return `<${tag} class="cx-kpi ${o.cls || ''}"${o.go ? ` href="#${o.go}" data-go="${o.go}"` : ''}><div class="cx-l"><span>${l}</span><span class="cx-ico">${ic(icn)}</span></div><div class="cx-num m">${num}<small>${unit}</small></div>${o.extra || ''}<div class="cx-d">${foot}</div></${tag}>`; };
  const cxLastLoom = () => (S.project.messages || []).filter((m) => m.loom && m.fromAgency).sort((a, b) => new Date(b.at) - new Date(a.at))[0];
  const cxLoomCard = (m) => `<div class="cx-loom"><span class="cx-th"><i>${ic('play')}</i>${m.by === 'team' ? '' : cxAv(m.by, '')}</span><div><b>${esc(m.loom.title)}</b><span>${esc(cxFirst(m.by))} · vidéo${m.loom.duration ? ' de ' + esc(m.loom.duration) : ''}</span></div></div>`;
  const cxLoomBtn = (m, cls = 'cx-b-glass', label = 'Regarder la vidéo') => `<a class="cx-btn ${cls}" href="${esc(m.loom.url)}" target="_blank" rel="noopener">${ic('play')}${label}<span class="sr"> : ${esc(m.loom.title)} (s’ouvre dans un nouvel onglet)</span></a>`;
  const cxTeamPill = () => `<span class="cx-pill cx-pill-team"><span class="cx-avs">${cxMembers().map((id) => cxAv(id)).join('')}</span>${R('Votre', 'Ton')} équipe</span>`;
  const CX_SHORT = { 'Direction artistique et textes': 'DA et textes', 'Maquettes du site': 'Maquettes', 'Réception du site': 'Mise en ligne' };
  const cxItems = () => S.project.phases.flatMap((ph) => ph.items);

  /* Où en est le projet : les 4 temps O.R.E.M. en bandes proportionnelles, « aujourd'hui », les feux verts en losanges. */
  function cxOrem() {
    const p = S.project, n = p.phases.length, G = 6; if (!n) return '';
    const W = p.phases.map((ph) => Math.max(5, Math.min(18, (cxD0(ph.to) - cxD0(ph.from)) / CXDAY + 1)));
    const tot = W.reduce((a, b) => a + b, 0), today = cxD0(Date.now());
    const pos = (d) => { const t = cxD0(d); let acc = 0; for (let i = 0; i < n; i++) { const a = cxD0(p.phases[i].from), b = cxD0(p.phases[i].to) + CXDAY; if (t < b || i === n - 1) { const f = Math.max(0, Math.min(1, (t - a) / Math.max(1, b - a))); return `calc((100% - ${G * (n - 1)}px) * ${((acc + f * W[i]) / tot).toFixed(4)} + ${i * G}px)`; } acc += W[i]; } return '100%'; };
    const bands = p.phases.map((ph, i) => { const st = phS(ph); return `<div class="cx-band ${st === 'done' ? 'done' : st === 'on' ? 'on' : 'wait'}" style="flex:${W[i]} 1 0"><span class="cx-lt" aria-hidden="true">${esc(ph.letter || i + 1)}</span><span class="cx-btxt"><span class="cx-bn">${esc(ph.t)}</span><span class="cx-bd">${fmt(ph.from)} au ${fmt(ph.to)}</span></span>${st === 'on' ? '<span class="sr"> (en cours)</span>' : st === 'done' ? '<span class="sr"> (terminé)</span>' : ''}</div>`; }).join('');
    const V = p.validations.filter((v) => v.due), close = (i) => i > 0 && i < V.length && (cxD0(V[i].due) - cxD0(V[i - 1].due)) / CXDAY < 6;
    const miles = V.map((v, i) => { const cls = v.status === 'approved' ? 'ok' : v.status === 'ready' ? 'now' : '', side = close(i + 1) ? 'al' : close(i) ? 'ar' : '';
      return `<div class="cx-mile ${cls} ${i === V.length - 1 ? 'end' : ''} ${side}" style="left:${pos(v.due)}"><i></i><b>${esc(CX_SHORT[v.t] || v.t)}</b><span>${v.status === 'ready' ? cxRelC(v.due) + ', ' + cxHour(v.due) : v.status === 'approved' ? 'Validé' : fmt(v.due)}</span></div>`; }).join('');
    const mlist = V.slice(0, 5).map((v) => `<div class="cx-ml"><span class="cx-chip ${v.status === 'ready' ? 'hl' : v.status === 'approved' ? 'ok' : ''}">${v.status === 'ready' ? cxRelC(v.due) : v.status === 'approved' ? 'Validé' : fmt(v.due)}</span>${esc(v.t)}</div>`).join('');
    const its = cxItems(), dn = its.filter((it) => itS(it) === 'done').length, cur = p.phases[p.phase - 1] || p.phases[0];
    const inRange = today >= cxD0(p.phases[0].from) && today <= cxD0(p.phases[n - 1].to);
    return `<section class="cx-card c-1-13 cx-orem" aria-labelledby="cx-orem-h"><div class="cx-card-h"><h2 id="cx-orem-h">${ic('map')}Où en est ${R('votre', 'ton')} projet</h2><span class="cx-aside cx-hide-s">Étape ${p.phase} sur ${n} · <b>${esc(cur.t)}</b></span></div>
      <div class="cx-track"><div class="cx-bands">${bands}</div>${inRange ? `<div class="cx-today" style="left:${pos(today)}" aria-hidden="true"><span>Aujourd’hui</span></div>` : ''}</div>
      <div class="cx-miles" aria-hidden="true">${miles}</div><div class="cx-mlist"><b>${R('Vos', 'Tes')} feux verts</b>${mlist}</div>
      <div class="cx-orem-ft"><span><b>${cxPl(dn, 'livrable fait', 'livrables faits')}</b> sur ${its.length}</span><div class="cx-pbar thin" role="img" aria-label="${dn} livrables faits sur ${its.length}"><i style="width:${its.length ? (dn / its.length) * 100 : 0}%"></i></div><span class="cx-lg cx-hide-s"><i></i>Fait</span><span class="cx-lg cx-hide-s"><i class="hl"></i>En cours</span><span class="cx-lg cx-hide-s"><i class="w"></i>À venir</span><span class="cx-lg cx-hide-s"><i class="dia"></i>${R('Votre', 'Ton')} feu vert</span></div></section>`;
  }
  /* Bien démarrer (acompte, Webflow, nom de domaine) : une ligne compacte tant qu'il reste quelque chose à faire. */
  function cxSetup() {
    const st = setupSteps(); if (!st.length || st.every((x) => x.st === 'done') || prospect()) return '';
    const n = st.filter((x) => x.st === 'done' || x.st === 'sent').length;
    return `<section class="cx-card c-1-13 cx-setup" aria-labelledby="su-h"><div class="cx-card-h"><h2 id="su-h">${ic('ok')}Bien démarrer</h2><span class="cx-su-a"><span class="cx-aside">${n} sur ${st.length}</span><a class="cx-btn sm cx-b-ink" href="#demarrer" data-go="demarrer">${st.some((x) => x.st === 'todo' || x.st === 'retry') ? 'Commencer' : 'Voir le détail'} ${ic('arrow')}</a></span></div>
      <ol class="cx-su">${st.map((x, i) => `<li class="${x.st}"><span class="cx-sn">${x.st === 'done' ? ic('check') + '<span class="sr">Fait : </span>' : i + 1}</span><div class="cx-m"><b>${esc(x.t)}</b>${SETUP_CHIP[x.st]}${x.k === 'acompte' && x.st !== 'done' ? '<small>Se coche tout seul à réception du virement</small>' : ''}</div></li>`).join('')}</ol>
      </section>`;
  }

  /* ---------- 1. Accueil pendant le projet ---------- */
  function vAccueil() {
    const p = S.project, nx = Core.nextStep(p), ready = p.validations.filter((v) => v.status === 'ready'), signs = toSign(), props = (p.proposals || []).filter((x) => x.status === 'sent');
    const v = nx.go === 'valider' ? ready[0] : null, pros = prospect(), setupHtml = cxSetup(), setupOn = !!setupHtml, lead = cxLead();
    // Ce qui attend le client, sans répéter la prochaine action.
    const same = (t) => String(t).toLowerCase().replace(/^valider : /, '') === String(nx.title).toLowerCase().replace(/^valider : /, '') || (nx.go === 'cal' && /visio de cadrage/i.test(t)) || (nx.go === 'proposition' && /proposition/i.test(t));
    const tasks = p.tasks.filter((t) => !t.done && !same(t.t) && !(nx.go === 'valider' && /^valider/i.test(t.t) && ready.length === 1));
    const others = (nx.go === 'valider' ? Math.max(0, ready.length - 1) : ready.length) + signs.length + (nx.go === 'proposition' ? Math.max(0, props.length - 1) : props.length) + p.missing.length + tasks.length;
    const todo = 1 + others, nDec = ready.length + signs.length + props.length;
    const last = cxLastLoom(), nextPh = p.phases[p.phase], nIt = nextPh && nextPh.items[0], nWho = nIt && Core.itemWho(nIt).map((w) => w[0]).find((w) => w !== 'client');
    const cta = nx.go === 'cal' ? `<a class="cx-btn cx-b-light" href="${esc(CALF())}" target="_blank" rel="noopener">${ic('cal')}Choisir un créneau<span class="sr"> (nouvel onglet)</span></a>`
      : CTA[nx.go] ? `<a class="cx-btn cx-b-light" href="#${CTA[nx.go][1]}" data-go="${CTA[nx.go][1]}">${ic({ valider: 'check', proposition: 'doc', fichiers: 'up' }[nx.go] || 'arrow')}${{ valider: 'Voir et valider', proposition: 'Lire la proposition', fichiers: 'Déposer les fichiers' }[nx.go] || CTA[nx.go][0]}</a>` : '';
    const ink = `<section class="cx-ink ${pros ? 'c-1-13' : 'c-1-7 cx-r2'}" aria-labelledby="nx"><div class="cx-eyebrow"><span>${R('Votre', 'Ta')} prochaine action${v && v.due ? ' · ' + cxRel(v.due) + ', ' + cxHour(v.due) : ''}</span>${todo > 1 ? `<span class="cx-of">Action 1 sur ${todo}</span>` : ''}</div>
      <h2 id="nx">${esc(nx.title)}</h2>${nx.text ? `<p>${esc(nx.text)}</p>` : ''}${last ? cxLoomCard(last) : ''}
      <div class="cx-acts">${cta}${last ? cxLoomBtn(last) : ''}</div>
      ${nIt && !pros ? `<div class="cx-then">${ic('arrow')}<span>Ensuite : <b>${esc(nIt.t)}</b>${nWho ? `, avec ${esc(cxFirst(nWho))}` : ''}</span></div>` : ''}</section>`;
    // Les chiffres : mise en ligne, décisions, fichiers ; le 4e est « À régler » seulement si une facture est due.
    const site = p.offer === 'site', j = Math.max(0, daysTo(p.golive)), span = Math.max(1, Math.round((cxD0(p.golive) - cxD0(p.start || p.phases[0].from)) / CXDAY));
    const step = Math.ceil(span / 54), nd = Math.ceil(span / step), passed = Math.min(nd, Math.round((span - j) / step));
    const dots = Array.from({ length: nd }, (_, i) => `<i class="${i < passed ? 'p' : i === passed ? 't' : ''}"></i>`).join('');
    const clientFiles = p.files.filter((f) => f.from === 'client'), due = p.invoices.filter((i) => i.status === 'due');
    const mt = p.meeting && p.meeting.when && cxDays(p.meeting.when) >= 0 ? p.meeting : null, un = unread();
    const v0 = ready.find((x) => x.due);
    const k4 = due.length ? cxKpi('À régler', 'doc', cxMoney(due.reduce((t, i) => t + i.ttc, 0)), '€', `<span class="cx-trend warn">${ic('cal')}À régler</span>TTC · ${esc(due[0].label)}`, { go: 'documents' })
      : mt ? cxKpi('Prochain point', 'cal', cxF(mt.when, { day: 'numeric' }), cxF(mt.when, { month: 'short' }), `<span class="cx-trend flat">${esc(cap(cxF(mt.when, { weekday: 'long' })))}, ${cxHour(mt.when)}</span>${esc((mt.title || 'Rendez-vous').replace(/\s*\(.*\)$/, ''))}${lead ? ' avec ' + esc(cxFirst(lead)) : ''}`)
      : cxKpi('Messages non lus', 'chat', un, un > 1 ? 'messages' : 'message', un ? 'De l’équipe' : 'Tout est lu', { go: 'messages' });
    const kpis = pros ? '' : `<div class="cx-kpis c-8-13 cx-r2">
      ${cxKpi(site ? 'Mise en ligne' : 'Livraison', 'globe', j, j > 1 ? 'jours' : 'jour', `Le ${fmt(p.golive, { day: 'numeric', month: 'long' })}`, { extra: `<div class="cx-days" aria-hidden="true">${dots}</div>` })}
      ${cxKpi('À valider', 'ok', nDec, nDec > 1 ? 'décisions' : 'décision', v0 ? `<span class="cx-trend hl">${ic('cal')}${cxRelC(v0.due)}, ${cxHour(v0.due)}</span>pour le ${esc(v0.t.toLowerCase())}` : nDec ? 'Sans date limite' : 'Rien pour l’instant', { go: 'valider' })}
      ${cxKpi('Fichiers reçus', 'folder', clientFiles.length, clientFiles.length > 1 ? 'fichiers' : 'fichier', p.missing.length ? `<span class="cx-trend warn">Il en manque ${p.missing.length}</span>` : 'Tout est là', { go: 'fichiers' })}
      ${k4}</div>`;
    // Ce qui arrive ensuite : les livrables du même jour pour le même feu vert sont regroupés.
    const groups = [];
    for (const it of cxItems().filter((x) => itS(x) === 'wait' && x.due).sort((a, b) => new Date(a.due) - new Date(b.due))) {
      let g = groups.find((x) => x.k === cxD0(it.due) && x.val === (it.val || ''));
      if (!g) { if (groups.length >= 3) break; g = { k: cxD0(it.due), val: it.val || '', its: [] }; groups.push(g); }
      g.its.push(it);
    }
    const row = (g) => { const it = g.its[0], ag = [...new Set(g.its.flatMap((x) => Core.itemWho(x).map(([w]) => w)).filter((w) => w !== 'client'))], vv = p.validations.find((x) => x.key === g.val);
      const t = g.its.length > 1 && vv ? vv.t : it.t, w0 = Core.itemWho(it)[0] || [], txt = Core.reg(w0[1] || '', p.registre);
      const s = g.its.length > 1 ? `${cxAnd(ag.map(cxFirst))} · ${R('votre', 'ton')} feu vert` : !w0[0] ? '' : w0[0] === 'client' ? txt : `${cxFirst(w0[0])} ${txt}`;
      return `<li><span class="cx-cal"><small>${cxMon(it.due)}</small><b>${cxF(it.due, { day: 'numeric' })}</b></span><div class="cx-m"><div class="cx-t">${esc(t)}</div>${s ? `<div class="cx-s">${esc(s)}</div>` : ''}</div><span class="cx-avs">${ag.map((w) => cxAv(w)).join('')}</span></li>`; };
    const meetRow = mt && !k4.includes('Prochain point') ? `<li><span class="cx-cal hl"><small>${cxMon(mt.when)}</small><b>${cxF(mt.when, { day: 'numeric' })}</b></span><div class="cx-m"><div class="cx-t">${esc(mt.title || 'Rendez-vous')}</div><div class="cx-s">${esc(cap(cxF(mt.when, { weekday: 'long' })))}, ${cxHour(mt.when)}${lead ? ' · avec ' + esc(cxFirst(lead)) : ''}</div></div></li>` : '';
    const ensuite = `<section class="cx-card c-1-5" aria-labelledby="cx-ens-h"><div class="cx-card-h"><h2 id="cx-ens-h">${ic('cal')}Ce qui arrive ensuite</h2></div><ul class="cx-list">${meetRow}${groups.map(row).join('') || (meetRow ? '' : '<li class="cx-s">Rien de prévu pour l’instant.</li>')}</ul></section>`;
    const equipe = `<section class="cx-card c-5-9" aria-labelledby="cx-team-h"><div class="cx-card-h"><h2 id="cx-team-h">${ic('team')}${R('Votre', 'Ton')} équipe</h2></div><div class="cx-team">
      ${cxMembers().map((id) => { const u = cxUser(id); return `<div class="cx-person ${id === lead ? 'lead' : ''}">${cxAv(id, '')}<div style="min-width:0"><b>${esc(u.name.split(' ')[0])}${id === lead ? `<span class="cx-chip ink">${R('Votre', 'Ton')} contact</span>` : ''}</b><span>${esc(u.title || '')}</span></div></div>`; }).join('')}</div>
      <div class="cx-duo"><a class="cx-btn sm cx-b-ink" href="#messages" data-go="messages">${ic('chat')}Écrire</a><a class="cx-btn sm cx-b-soft" href="${esc(CALF())}" target="_blank" rel="noopener">${ic('cal')}Réserver un appel<span class="sr"> (nouvel onglet)</span></a></div></section>`;
    const lastMsg = (p.messages || []).slice().sort((a, b) => new Date(b.at) - new Date(a.at))[0];
    const cut = (t, n) => (t.length > n ? t.slice(0, t.lastIndexOf(' ', n - 4)) + '…' : t);
    const msgs = `<section class="cx-card c-9-13" aria-labelledby="cx-msg-h"><div class="cx-card-h"><h2 id="cx-msg-h">${ic('chat')}Derniers messages</h2>${un ? `<span class="cx-aside">${cxPl(un, 'non lu')}</span>` : ''}</div><div class="cx-thread">
      ${p.note && p.note.text ? `<div class="cx-msg">${cxAv(p.note.by, '')}<div class="cx-bubble"><div class="cx-who"><b>${esc(cxFirst(p.note.by))}<span class="cx-pin">Épinglé</span></b>${p.note.at ? `<span>${cxAgo(p.note.at)}</span>` : ''}</div>${esc(cut(p.note.text, 120))}</div></div>` : ''}
      ${lastMsg ? `<div class="cx-msg ${lastMsg.fromAgency ? '' : 'me'}">${lastMsg.fromAgency ? cxAv(lastMsg.by, '') : ''}<div class="cx-bubble"><div class="cx-who"><b>${lastMsg.fromAgency ? esc(cxFirst(lastMsg.by)) : R('Vous', 'Toi')}${lastMsg.readByClient === false ? ' <span class="cx-new"></span><span class="sr">(non lu)</span>' : ''}</b><span>${cxAgo(lastMsg.at)}</span></div>${esc(cut(lastMsg.text, 160))}</div></div>` : ''}
      ${!lastMsg && !(p.note && p.note.text) ? `<p class="cx-s">Aucun message pour l’instant.</p>` : ''}</div>
      <a class="cx-reply" href="#messages" data-go="messages"><span>Répondre à l’équipe…</span><i>${ic('arrow')}</i></a></section>`;
    const tasksCard = tasks.filter((t) => !(setupOn && (t.go === 'demarrer' || t.auto === 'acompte'))).length ? `<section class="cx-card c-1-13" aria-labelledby="td"><div class="cx-card-h"><h2 id="td">${ic('ok')}À faire de ${R('votre', 'ton')} côté</h2></div><ul class="cx-list">${tasks.filter((t) => !(setupOn && (t.go === 'demarrer' || t.auto === 'acompte'))).map((t) => t.auto
      ? `<li><span class="cx-chip warn">À régler</span><div class="cx-m"><div class="cx-t">${esc(t.t)}</div><div class="cx-s">Se coche tout seul à réception du virement.</div></div>${t.go ? `<a class="cx-btn sm cx-b-soft" href="#${t.go}" data-go="${t.go}">Ouvrir</a>` : ''}</li>`
      : `<li><button class="check" data-act="task" data-id="${t.id}" aria-label="Cocher : ${esc(t.t)}" aria-pressed="false"></button><div class="cx-m"><div class="cx-t">${esc(t.t)}</div></div>${t.go ? (t.go === 'cal' ? `<a class="cx-btn sm cx-b-soft" href="${esc(CALF())}" target="_blank" rel="noopener">Réserver</a>` : `<a class="cx-btn sm cx-b-soft" href="#${t.go}" data-go="${t.go}">Ouvrir</a>`) : ''}</li>`).join('')}</ul></section>` : '';
    return cxNb(cxHead(`Bonjour ${esc(S.preview || !S.me.name ? p.contactName : S.me.name.split(' ')[0])}`, `${esc(cap(fmtLong(Date.now())))} · ${esc(p.projet)}`)
      + `<div class="cx-bento">${ink}${kpis}${setupHtml}${tasksCard}${cxOrem()}${pros ? '' : ensuite}${equipe.replace('c-5-9', pros ? 'c-1-7b' : 'c-5-9')}${msgs.replace('c-9-13', pros ? 'c-7-13' : 'c-9-13')}</div>`);
  }

  /* ---------- 2. Accueil d'un projet livré (Évolution) ---------- */
  function vAccueilLivre() {
    const p = S.project, e = p.evo || {}, site = p.offer === 'site', dom = (p.links.site || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const pills = `${p.links.site ? `<a class="cx-pill" href="${esc(p.links.site)}" target="_blank" rel="noopener">${ic('globe')}${esc(dom)}<span class="sr"> (nouvel onglet)</span></a>` : ''}${cxTeamPill()}`;
    const sub = `${site ? R('Votre', 'Ton') + ' site est en ligne' : 'Projet livré'} depuis le <b>${fmt(p.deliveredAt, { day: 'numeric', month: 'long' })}</b>${evoOn(p) && e.since ? ` · Évolution depuis le ${fmt(e.since, { day: 'numeric', month: 'long' })}` : ''}`;
    const head = cxHead(`Bonjour ${esc(p.contactName || S.me.name)}`, sub, pills);
    const pr = (p.proposals || []).find((x) => x.status === 'sent');
    const ink = (cls) => pr ? `<section class="cx-ink ${cls}" aria-labelledby="nx"><div class="cx-eyebrow"><span>${R('Votre', 'Ta')} prochaine action</span>${pr.validUntil ? `<span class="cx-of">Valable jusqu’au ${fmt(pr.validUntil, { day: 'numeric', month: 'long' })}</span>` : ''}</div>
        <h2 id="nx">${esc(cap(pr.title.replace(/^Demande : /, '')))}</h2>${pr.intro ? `<p>${esc(pr.intro)}</p>` : ''}
        <div class="cx-price"><span class="cx-num">${cxMoney(pr.lines.reduce((t, l) => t + l.ht, 0))}<small>€ HT</small></span><span>${pr.quote ? 'Devis ' + esc(pr.quote) : 'Devis'}${pr.sentAt ? `, envoyé le ${fmt(pr.sentAt, { day: 'numeric', month: 'long' })}` : ''}</span></div>
        <div class="cx-acts"><a class="cx-btn cx-b-light" href="#proposition" data-go="proposition">${ic('doc')}Lire et accepter</a><a class="cx-btn cx-b-glass" href="#messages" data-go="messages">${ic('chat')}Poser une question</a></div></section>`
      : `<section class="cx-ink ${cls}" aria-labelledby="nx"><div class="cx-eyebrow"><span>En ligne depuis le ${fmt(p.deliveredAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div><h2 id="nx">${site ? R('Votre', 'Ton') + ' site est en ligne.' : 'Le projet est livré.'}</h2>${p.next && p.next.text ? `<p>${esc(p.next.text)}</p>` : ''}
        <div class="cx-acts">${p.links.site ? `<a class="cx-btn cx-b-light" href="${esc(p.links.site)}" target="_blank" rel="noopener">${ic('globe')}Voir le site<span class="sr"> (nouvel onglet)</span></a>` : ''}${cxLastLoom() ? cxLoomBtn(cxLastLoom()) : ''}</div></section>`;
    const after = `${launchKit()}${reviewPanel()}`;
    if (!evoOn(p)) {
      const res = p.results && p.results.stats.length ? `<section class="cx-card c-1-13"><div class="cx-card-h"><h2>${cxRise}Depuis la mise en ligne</h2>${p.results.period ? `<span class="cx-aside">${esc(p.results.period)}</span>` : ''}</div><div class="cx-res">${p.results.stats.slice(0, 6).map(([n, l]) => `<div><span class="cx-num">${esc(String(n).replace(/^~/, ''))}</span><span>${esc(l)}${/^~/.test(n) ? ', en moyenne' : ''}</span></div>`).join('')}</div><p class="cx-note">Chiffres Google Analytics et Search Console</p></section>` : '';
      return cxNb(head + `<div class="cx-bento">${ink('c-1-13')}${res}</div>`) + after + monthlyReport() + evolutionCard();
    }
    const rp = (e.reports || [])[0], hist = (e.reports || []).slice().reverse(), m = e.meeting && e.meeting.when, dur = ((e.meeting && e.meeting.mode) || '').match(/\((\d+) min\)/), open = (e.reschedule || []).find((r) => r.status === 'open');
    const visio = `<section class="cx-card ${pr ? 'c-8-13' : 'c-1-13'}" aria-labelledby="evm"><div class="cx-card-h"><h2 id="evm">${ic('cal')}Prochaine visio de pilotage</h2>${m && cxDays(m) >= 0 ? `<span class="cx-chip hl">${cxDays(m) ? 'Dans ' + cxPl(cxDays(m), 'jour') : 'Aujourd’hui'}</span>` : ''}</div>
      ${m ? `<div class="cx-visio"><span class="cx-bigcal" aria-hidden="true"><small>${cxMon(m)}</small><b>${cxF(m, { day: 'numeric' })}</b><em>${cxF(m, { weekday: 'short' }).replace('.', '')}</em></span><div class="cx-dm"><b>${esc(cap(cxF(m, { weekday: 'long', day: 'numeric', month: 'long' })))}</b><span class="cx-when">${cxHour(m)}${dur ? ` · ${dur[1]} min en visio` : ''}</span>On lit les chiffres du mois et on décide des priorités.</div></div>` : '<p class="cx-s">Date à fixer ensemble.</p>'}
      <div class="cx-visio-ft"><span class="cx-avs">${cxMembers().map((id) => cxAv(id)).join('')}</span><span>Avec ${esc(cxAnd(cxMembers().map(cxFirst)))}</span></div>
      ${open ? `<p class="cx-note">Demande de changement envoyée le ${fmt(open.at, { day: 'numeric', month: 'long' })} : l’équipe ${R('vous', 'te')} propose un créneau très vite.</p>` : S.rsOpen ? `<form class="cx-rs" data-form="reschedule"><div class="field"><label for="rs-t">Les créneaux qui ${R('vous', 't’')}arrangent</label><textarea id="rs-t" rows="2" placeholder="ex. Mardi ou jeudi matin, la semaine prochaine"></textarea></div><div class="cx-duo"><button class="cx-btn sm cx-b-ink" type="submit">Envoyer à l’équipe</button><button class="cx-btn sm cx-b-soft" type="button" data-act="rs-open">Annuler</button></div></form>` : `<button class="cx-btn sm cx-b-soft" data-act="rs-open" aria-expanded="false">Demander un autre créneau</button>`}</section>`;
    const num = (s) => Number(String(s).replace(/[\s  ~%]/g, '').replace(',', '.'));
    const lbl = (r) => cap(cxF(r.month + '-15T12:00:00', { month: 'short' }).replace('.', ''));
    const serie = (k) => hist.map((r) => num((r.stats[k] || [])[0]));
    const bars = (k) => { const s = serie(k), mx = Math.max(...s); return s.some(isNaN) || !(mx > 0) ? '' : `<div class="cx-hbars" aria-hidden="true">${s.map((x, i) => `<div class="cx-c ${i === s.length - 1 ? 'on' : ''}"><div class="cx-bar" style="height:${Math.max(4, Math.round((x / mx) * 64))}px"></div><span>${lbl(hist[i])}</span></div>`).join('')}</div>`; };
    const circles = (k) => { const s = serie(k), mx = Math.max(...s); return s.some(isNaN) || !(mx > 0) ? '' : `<div class="cx-circles" aria-hidden="true">${s.map((x, i) => `<div class="cx-c ${i === s.length - 1 ? 'on' : ''}"><i style="width:${Math.round(68 * Math.sqrt(x / mx))}px;height:${Math.round(68 * Math.sqrt(x / mx))}px">${x}</i><span>${lbl(hist[i])}</span></div>`).join('')}</div>`; };
    const ladder = (k) => { const s = serie(k); return s.some(isNaN) ? '' : `<div class="cx-ladder" aria-hidden="true">${s.map((x, i) => `<div class="cx-rw ${i === s.length - 1 ? 'on' : ''}"><span>${lbl(hist[i])}</span><span class="cx-rail"><b style="left:${Math.max(0, Math.min(100, 100 - ((x - 1) / 9) * 100)).toFixed(1)}%"></b></span><span class="cx-v">${String(x).replace('.', ',')}</span></div>`).join('')}<div class="cx-rw cx-rw-k"><span></span><span><span>10<sup>e</sup></span><span>1<sup>re</sup> place</span></span><span></span></div></div>`; };
    const tr = (d) => { if (!d) return ''; const t = String(d).replace(/^gagne /, '+'), down = /^-|perd/.test(t); let [a, b] = t.split(' sur '); if (!b && hist.length > 1) b = cxF(hist[hist.length - 2].month + '-15T12:00:00', { month: 'long' }); return `<span class="cx-trend ${down ? 'flat' : ''}">${down ? '' : cxRise}${esc(a)}</span>${b ? `<span>sur ${esc(b)}</span>` : ''}`; };
    const icons = ['eye', 'mail', 'globe', 'map'], cols = ['c-1-4', 'c-4-7', 'c-7-10', 'c-10-13'];
    const stats = rp && rp.stats.length ? `<div class="c-1-13 cx-sec"><h2>${esc(cap(cxF(rp.month + '-15T12:00:00', { month: 'long' })))} en chiffres</h2>${rp.at ? `<span>Bilan reçu le ${fmt(rp.at, { day: 'numeric', month: 'long' })}</span>` : ''}</div>
      ${rp.stats.slice(0, 4).map(([v, l, d], k) => `<div class="cx-kpi ${rp.stats.length >= 4 ? cols[k] : 'c-1-13'}"><div class="cx-l"><span>${esc(cap(l || ''))}</span><span class="cx-ico">${ic(icons[k])}</span></div><div class="cx-num m">${esc(v)}</div>${/position/i.test(l || '') ? ladder(k) : k === 1 ? circles(k) : bars(k)}<div class="cx-d">${tr(d)}</div></div>`).join('')}` : '';
    const f = rp && rp.fileId && p.files.find((x) => x.id === rp.fileId), doc = rp && (rp.doc ? asset(rp.doc) : f && API.fileUrl(f)), dname = rp ? `Bilan ${monthName(rp.month)} ${p.client}.pdf`.replace(/[^\wÀ-ſ .-]/g, '') : '';
    const bilan = `<section class="cx-card c-1-7b" aria-labelledby="cx-bil-h"><div class="cx-card-h"><h2 id="cx-bil-h">${ic('doc')}Le bilan du mois</h2>${rp ? `<span class="cx-aside">${esc(monthName(rp.month))}</span>` : ''}</div>
      ${rp ? `<p class="cx-rp-title rp-title">${esc(rp.title)}</p>${rp.summary ? `<p class="cx-s">${esc(rp.summary)}</p>` : ''}
      ${rp.done.length ? `<b class="cx-sub-h">Le travail réalisé</b><ul class="cx-done-l">${rp.done.map(([t, s]) => `<li><i>${ic('check')}</i><div>${esc(t)}${s ? `<small>${esc(s)}</small>` : ''}</div></li>`).join('')}</ul>` : ''}
      <div class="cx-duo cx-duo-l">${doc ? `<button class="cx-btn sm cx-b-ink" data-act="doc-view" data-src="${esc(doc)}" data-title="${esc('Bilan ' + monthName(rp.month))}">${ic('eye')}Consulter le bilan</button><a class="cx-btn sm cx-b-soft" href="${esc(doc)}" download="${esc(dname)}">${ic('down')}PDF<span class="sr"> du bilan ${esc(monthName(rp.month))}</span></a>` : ''}<a class="cx-link" href="#evolution" data-go="evolution">Bilans précédents ${ic('arrow')}</a></div>` : '<p class="cx-s">Le premier bilan arrive à la fin du premier mois.</p>'}</section>`;
    const ax = e.axes || [], adone = ax.filter((a) => a.status === 'done').length;
    const axes = `<section class="cx-card c-7-13" aria-labelledby="cx-ax-h"><div class="cx-card-h"><h2 id="cx-ax-h">${ic('ok')}Les axes du mois</h2>${ax.length ? `<span class="cx-aside">${adone} ${adone > 1 ? 'faits' : 'fait'} sur ${ax.length}</span>` : ''}</div>
      ${ax.length ? `<div class="cx-pbar" aria-hidden="true">${ax.slice().sort((a, b) => ({ done: 0, on: 1, todo: 2 }[a.status] - { done: 0, on: 1, todo: 2 }[b.status])).map((a) => `<i class="${a.status === 'done' ? '' : a.status === 'on' ? 'hl' : 'hatch'}" style="flex:1"></i>`).join('')}</div>
      <ul class="cx-axes">${ax.map((a) => `<li class="${a.priority ? 'pri' : ''} ${a.status}">${a.who === 'client' || a.who === 'both' ? cxAv('client', '') : cxAv(a.who, '')}<div style="min-width:0"><div class="cx-t">${a.priority ? '<span class="sr">Priorité du mois : </span>' : ''}${esc(a.t)}</div><div class="cx-s">${esc(axWho(a.who))} · ${a.status === 'done' ? 'fait' : a.due ? 'prévu le ' + fmt(a.due, { day: 'numeric', month: 'long' }) : 'à planifier'}</div></div>${a.status === 'done' ? '<span class="cx-chip ok">Fait</span>' : a.status === 'on' ? '<span class="cx-chip hl">En cours</span>' : '<span class="cx-chip">Prévu</span>'}</li>`).join('')}</ul>` : '<p class="cx-s">Les axes du mois arrivent après la première visio.</p>'}
      <a class="cx-link" href="#evolution" data-go="evolution">Voir l’espace Évolution ${ic('arrow')}</a></section>`;
    const r = p.results, pi = r ? r.stats.findIndex(([n]) => /%/.test(n)) : -1, pct = pi >= 0 ? Math.max(0, Math.min(100, parseInt(String(r.stats[pi][0]).replace(/[^\d]/g, ''), 10) || 0)) : null;
    const resN = ([n, l]) => (/^~/.test(n) ? [n.slice(1), l + ', en moyenne'] : [n, l]);
    const rest = r ? r.stats.filter((_, i) => i !== pi).slice(0, 3).map(resN) : [];
    const res = r && r.stats.length ? `<section class="cx-card c-1-7b" aria-labelledby="cx-res-h"><div class="cx-card-h"><h2 id="cx-res-h">${cxRise}Depuis la mise en ligne</h2><span class="cx-aside">Depuis le ${fmt(p.deliveredAt, { day: 'numeric', month: 'long' })}</span></div>
      ${pct !== null ? `<div class="cx-res-big"><span class="cx-num">${pct}<small>%</small></span><span>${esc(cap(r.stats[pi][1]))}</span></div><div class="cx-dotm" role="img" aria-label="${pct} sur 100">${Array.from({ length: 100 }, (_, i) => `<i class="${i < pct ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      ${rest.length ? `<div class="cx-res ${pct !== null ? 'cx-res-sep' : ''}">${rest.map(([n, l]) => `<div><span class="cx-num">${esc(n)}</span><span>${esc(l)}</span></div>`).join('')}</div>` : ''}</section>` : '';
    const months = (e.next || []).length ? `<section class="cx-card ${res ? 'c-7-13' : 'c-1-13'}" aria-labelledby="cx-mo-h"><div class="cx-card-h"><h2 id="cx-mo-h">${ic('map')}Les mois suivants</h2></div><div class="cx-months cx-months-1">${e.next.map(([mo, t]) => `<div><b>${esc(mo)}</b><small>${esc(t)}</small></div>`).join('')}</div></section>` : '';
    return cxNb(head + `<div class="cx-bento">${pr ? ink('c-1-8') : ''}${visio}${stats}${bilan}${axes}${res}${months}</div>`) + after;
  }

  /* ---------- 3. Étapes ---------- */
  function vProjet() {
    const p = S.project, n = p.phases.length, a = cxD0(p.phases[0].from), b = cxD0(p.phases[n - 1].to) + CXDAY, P = (d) => Math.max(0, Math.min(100, ((cxD0(d) - a) / (b - a)) * 100));
    const ticks = Array.from({ length: 6 }, (_, i) => a + ((b - a) * i) / 5), today = cxD0(Date.now()), its = cxItems();
    const rows = p.phases.map((ph) => { const st = phS(ph), keys = [...new Set(ph.items.filter((it) => it.val).map((it) => it.val))];
      return `<div class="cx-gl"><span class="cx-ltr ${st === 'on' ? 'hl' : ''}" aria-hidden="true">${esc(ph.letter || '')}</span><div><b>${esc(ph.t)}</b><span>${fmt(ph.from)} au ${fmt(ph.to)}</span></div></div>
      <div class="cx-lane" aria-hidden="true"><div class="cx-gb ${st}" style="left:${P(ph.from)}%;width:${Math.max(2, P(cxD0(ph.to) + CXDAY) - P(ph.from))}%"><span class="cx-gtx">${cxPl(ph.items.length, 'livrable')}</span></div>${keys.map((k) => { const v = p.validations.find((x) => x.key === k); return v && v.due ? `<span class="cx-gdia ${v.status === 'ready' ? 'now' : v.status === 'approved' ? 'ok' : ''}" style="left:${P(v.due)}%" title="${esc(v.t)}"></span>` : ''; }).join('')}</div>`; }).join('');
    const gantt = `<section class="cx-card c-1-13" aria-labelledby="cx-gt-h"><div class="cx-card-h"><h2 id="cx-gt-h">${ic('cal')}Le planning</h2><span class="cx-aside">Dates indicatives, ajustées ensemble · <i class="cx-dia-k"></i> ${R('votre', 'ton')} feu vert</span></div>
      <div class="cx-gantt">${rows}<div class="cx-gscale" aria-hidden="true">${ticks.map((t) => `<span>${fmt(t)}</span>`).join('')}</div>
      ${today >= a && today < b ? `<div class="cx-gtoday" style="left:calc(var(--gl) + (100% - var(--gl)) * ${(P(today) / 100).toFixed(4)})" aria-hidden="true"><span>Aujourd’hui</span></div>` : ''}</div></section>`;
    const ph = p.phases[p.phase - 1] || p.phases[0], dn = ph.items.filter((it) => itS(it) === 'done').length, nx = p.phases[p.phase], late = Core.lateDays(p, ph);
    const rv = p.validations.filter((v) => v.status === 'ready');
    const whoLine = (it) => Core.itemWho(it).map(([id, t]) => { const txt = Core.reg(t || '', p.registre); return `<span>${cxAv(id)}<span>${id === 'client' ? (isAdmin() && !S.preview ? `<b>${esc(p.contactName || 'Client')}</b> : ${esc(txt)}` : `<b>${esc(txt.split(' ')[0])}</b> ${esc(txt.split(' ').slice(1).join(' '))}`) : `<b>${esc(cxFirst(id))}</b> ${esc(txt)}`}</span></span>`; }).join('');
    const deliv = ph.items.map((it) => { const s = itS(it), v = it.val && p.validations.find((x) => x.key === it.val);
      const right = s === 'done' ? `<span class="cx-chip ok">Fait</span>${it.due ? `<small>${fmt(it.due)}</small>` : ''}`
        : s === 'review' ? `<small>${v && v.due ? cxRelC(v.due) + ', ' + cxHour(v.due) : `En attente de ${R('votre', 'ton')} feu vert`}</small><a class="cx-btn sm cx-b-ink" href="#valider" data-go="valider">${ic('check')}Voir et valider<span class="sr"> : ${esc(it.t)}</span></a>`
        : `<span class="cx-chip">${s === 'on' ? 'En cours' : it.due ? fmt(it.due) : 'Prévu'}</span>${itemLink(it, false).replace('btn btn-line btn-sm', 'cx-btn sm cx-b-soft')}`;
      return `<li class="${s}"><span class="cx-st" aria-hidden="true">${ic(s === 'done' ? 'check' : s === 'review' ? 'eye' : 'cal')}</span><div style="min-width:0"><div class="cx-t">${esc(it.t)}</div><div class="cx-who">${whoLine(it)}</div></div><div class="cx-r">${right}</div></li>`; }).join('');
    const now = `<section class="cx-card c-1-9" aria-labelledby="cx-now-h"><div class="cx-phase-now"><div class="cx-pn-l"><span class="cx-chip ${late ? 'warn' : phS(ph) === 'done' ? 'ok' : 'hl'}">${late ? `En retard de ${cxPl(late, 'jour')}` : phS(ph) === 'done' ? 'Terminé' : 'En cours'}</span><span class="cx-big-l" aria-hidden="true">${esc(ph.letter || '')}</span><div><h2 id="cx-now-h" class="cx-now-t">${esc(ph.t)}</h2><p class="cx-s">${esc(Core.reg(ph.txt, p.registre))}</p></div>
      <div class="cx-pn-ft">${nx ? `<div class="cx-after"><span class="cx-ltr" aria-hidden="true">${esc(nx.letter || '')}</span><div><small>Ensuite, à partir du ${fmt(nx.from, { day: 'numeric', month: 'long' })}</small><b>${esc(nx.t)}</b></div></div>` : ''}
      <div><div class="cx-pn-n"><span><b>${dn} sur ${ph.items.length}</b> ${dn > 1 ? 'faits' : 'fait'}</span><span>Fin le ${fmt(ph.to, { day: 'numeric', month: 'long' })}</span></div><div class="cx-pbar" aria-hidden="true">${ph.items.map((it) => `<i class="${itS(it) === 'done' ? '' : itS(it) === 'review' ? 'hl' : 'hatch'}" style="flex:1"></i>`).join('')}</div></div></div></div>
      <ul class="cx-deliv">${deliv}</ul></div></section>`;
    const ppl = [...cxMembers(), 'client'].map((id) => [id, its.filter((it) => Core.itemWho(it).some(([w]) => w === id))]).filter(([, l]) => l.length);
    const mine = its.filter((it) => itS(it) !== 'done' && Core.itemWho(it).some(([w]) => w === 'client')).slice(0, 3);
    const whos = `<section class="cx-card c-9-13" aria-labelledby="cx-who-h"><div class="cx-card-h"><h2 id="cx-who-h">${ic('team')}Qui fait quoi</h2><span class="cx-aside">Sur tout le projet</span></div><div class="cx-whos">
      ${ppl.map(([id, l]) => `<div class="cx-wr">${cxAv(id)}<b>${esc(cxFirst(id))}</b><span class="cx-n">${l.length}<span class="sr"> livrables</span></span><div class="cx-pdots" aria-hidden="true">${l.map((it) => `<i class="${itS(it) === 'done' ? 'd' : itS(it) === 'review' ? 'r' : ''}"></i>`).join('')}</div></div>`).join('')}</div>
      ${mine.length ? `<div class="cx-sepb"><b class="cx-sub-h">${R('Vos', 'Tes')} ${mine.length > 1 ? mine.length + ' prochaines actions' : 'prochaine action'}</b><ul class="cx-mini">${mine.map((it) => { const s = itS(it), v = it.val && p.validations.find((x) => x.key === it.val);
        return `<li><div class="cx-m">${esc(it.t.replace(/ \(.*\)$/, ''))}<small>${esc(Core.reg((Core.itemWho(it).find(([w]) => w === 'client') || [])[1] || '', p.registre))}</small></div><span class="cx-chip ${s === 'review' ? 'hl' : ''}">${s === 'review' && v && v.due ? cxRelC(v.due) : it.due ? fmt(it.due) : 'Prévu'}</span></li>`; }).join('')}</ul></div>` : ''}
      <div class="cx-lgs"><span class="cx-lg"><i class="r"></i>Fait</span><span class="cx-lg"><i class="hl r"></i>À valider</span><span class="cx-lg"><i class="w r"></i>À venir</span></div></section>`;
    const L = p.phases.slice(p.phase), cls = L.length === 3 ? ['c-1-5', 'c-5-9', 'c-9-13'] : L.length === 2 ? ['c-1-7b', 'c-7-13'] : ['c-1-13'];
    const later = L.map((x, i) => `<section class="cx-card ${cls[i]} cx-next-ph" aria-labelledby="cx-ph-${i}"><div class="cx-ph-h"><span class="cx-ltr" aria-hidden="true">${esc(x.letter || '')}</span><div><h2 id="cx-ph-${i}">${esc(x.t)}</h2><span>${fmt(x.from)} au ${fmt(x.to)}</span></div></div><p class="cx-s">${esc(Core.reg(x.txt, p.registre))}</p>
      <ul class="cx-mini">${x.items.map((it) => `<li><div class="cx-m">${esc(it.t)}<small>${it.due ? fmt(it.due) : 'Prévu'}${it.val ? ` · ${R('votre', 'ton')} feu vert` : ''}</small></div><span class="cx-avs">${Core.itemWho(it).map(([w]) => cxAv(w)).join('')}</span></li>`).join('')}</ul></section>`).join('');
    const doneP = p.phases.slice(0, p.phase - 1);
    const past = doneP.length ? `<details class="cx-card c-1-13 cx-past"><summary><span class="cx-card-h"><span class="cx-h2">${ic('ok')}${doneP.length > 1 ? 'Étapes terminées' : 'Étape terminée'}</span><span class="cx-aside">${doneP.map((x) => esc(x.letter || '')).join(' · ')}</span></span></summary>
      ${doneP.map((x) => `<div class="cx-past-ph"><b>${esc(phName(x))}</b><ul class="cx-mini">${x.items.map((it) => `<li><div class="cx-m">${esc(it.t)}<small>${it.due ? fmt(it.due) : ''}</small></div><span class="cx-chip ${itS(it) === 'done' ? 'ok' : ''}">${itS(it) === 'done' ? 'Fait' : 'En cours'}</span>${itemLink(it, itS(it) === 'done').replace('btn btn-line btn-sm', 'cx-btn sm cx-b-soft')}</li>`).join('')}</ul></div>`).join('')}</details>` : '';
    return cxNb(cxHead('Étapes', `${n} temps, selon la méthode O.R.E.M. On passe à la suite avec ${R('votre', 'ton')} feu vert.`, `<span class="cx-pill">${ic('map')}<span>Étape <b>${p.phase} sur ${n}</b></span></span>${p.deliveredAt ? `<span class="cx-pill">${ic('globe')}<span>${p.offer === 'site' ? 'En ligne' : 'Livré'} depuis le <b>${fmt(p.deliveredAt, { day: 'numeric', month: 'long' })}</b></span></span>` : `<span class="cx-pill">${ic('globe')}<span>${p.offer === 'site' ? 'Mise en ligne' : 'Livraison'} le <b>${fmt(p.golive, { day: 'numeric', month: 'long' })}</b></span></span>`}`)
      + `<div class="cx-bento">${gantt}${now}${whos}${later}${past}</div>`) + handoverPanel();
  }

  /* ---------- 4. À valider ---------- */
  function vValider() {
    const p = S.project, ready = p.validations.filter((v) => v.status === 'ready'), signs = toSign(), props = (p.proposals || []).filter((x) => x.status === 'sent');
    const nDec = ready.length + signs.length + props.length, nOk = p.validations.filter((x) => x.status === 'approved').length, last = cxLastLoom(), its = cxItems();
    let k = 0;
    // « Valider le plan du site » : l'article suit le premier mot ; sinon « Je valide ».
    const valLbl = (t) => { const w = t.split(' ')[0].toLowerCase(), a = { plan: 'le', site: 'le', direction: 'la', réception: 'la', plateforme: 'la', charte: 'la', maquettes: 'les', tests: 'les', pistes: 'les', textes: 'les' }[w]; return a ? `Valider ${a} ${esc(t.charAt(0).toLowerCase() + t.slice(1))}` : 'Je valide'; };
    const feat = (v) => { k++;
      const it = its.find((x) => x.val === v.key), maker = it && Core.itemWho(it).map((w) => w[0]).find((w) => w !== 'client');
      const idx = it ? its.indexOf(it) : -1, nIt = idx >= 0 && its.slice(idx + 1).find((x) => Core.itemWho(x).some(([w]) => w !== 'client')), nPh = nIt && p.phases.find((ph) => ph.items.includes(nIt)), nWho = nIt && Core.itemWho(nIt).map((w) => w[0]).find((w) => w !== 'client');
      const hrs = v.due ? Math.round((new Date(v.due) - Date.now()) / 36e5) : null;
      const shot = v.key === 'maquettes' ? (p.assets || []).find((a) => a.kind === 'Maquettes' && a.img) : null;
      const tree = `<div class="cx-tree" aria-hidden="true"><div class="cx-node root">Accueil</div><div class="cx-hrow">${[2, 1, 3, 2, 2, 1].map((nn, i) => `<div class="cx-col"><div class="cx-node ${i === 2 ? 'hl' : ''}"></div>${Array.from({ length: nn }, () => '<div class="cx-node sub"></div>').join('')}</div>`).join('')}</div></div>`;
      const ver = (p.versions || [])[0], figma = /figma\.com/.test(v.link || '');
      const prev = `<div class="cx-prev"><div class="cx-prev-h"><span class="cx-chip">${ic(figma ? 'figma' : 'doc')}${figma ? 'Prototype Figma' : v.link ? 'Livrable en ligne' : 'Aperçu'}${ver && figma ? ' · ' + esc(ver.label) : ''}</span>${v.link ? `<a class="cx-link" href="${esc(v.link)}" target="_blank" rel="noopener">Ouvrir en grand ${ic('arrow')}<span class="sr"> : ${esc(v.t)} (nouvel onglet)</span></a>` : ''}</div>
        <div class="cx-frame"><div class="cx-fb" aria-hidden="true"><i></i><i></i><i></i><span>${ic('lock')}${esc(p.client)} · ${esc(v.t)}</span></div>${shot ? `<img class="cx-frame-img" src="${esc(asset(shot.img))}" alt="${esc(shot.title)}">` : v.key === 'plan' ? tree : `<div class="cx-frame-e">${ic('doc')}<span>${v.link ? `${R('Ouvrez', 'Ouvre')} le livrable pour le parcourir en grand.` : `L’équipe ${R('vous', 't’')}a présenté ce livrable : ${R('retrouvez', 'retrouve')} le détail dans Messages.`}</span></div>`}</div>
        ${last ? `<div class="cx-loom cx-loom-l"><span class="cx-th"><i>${ic('play')}</i>${last.by === 'team' ? '' : cxAv(last.by, '')}</span><div><b>${esc(last.loom.title)}</b><span>Par ${esc(cxFirst(last.by))}${last.loom.duration ? ' · ' + esc(last.loom.duration) : ''}</span></div>${cxLoomBtn(last, 'sm cx-b-ink', 'Regarder')}</div>` : ''}</div>`;
      const acts = S.valForm === v.id
        ? `<form class="cx-form" data-form="changes" data-id="${esc(v.id)}"><div class="field"><label for="chg-${v.id}">Qu’${R('aimeriez-vous', 'aimerais-tu')} changer ?</label><textarea id="chg-${v.id}" required placeholder="Par exemple : regrouper deux pages, ajouter une page Presse…"></textarea><span class="small muted">L’équipe ${R('vous', 'te')} répond sous 24 h ouvrées.</span></div><div class="cx-acts"><button class="cx-btn cx-b-ink" type="submit">Envoyer ma demande de modifications</button><button class="cx-btn cx-b-line" type="button" data-act="valcancel" data-id="${esc(v.id)}">Annuler</button></div></form>`
        : S.valConfirm === v.id ? `<div class="cx-confirm" role="group" aria-label="Confirmer la validation"><p><strong>${R('Vous donnez votre', 'Tu donnes ton')} feu vert pour « ${esc(v.t)} » ?</strong> L’équipe passe à la suite.</p><div class="cx-acts"><button class="cx-btn cx-b-ink" data-act="approve-ok" data-id="${esc(v.id)}">${ic('check')}Oui, je valide</button><button class="cx-btn cx-b-line" data-act="approve-cancel" data-id="${esc(v.id)}">Pas encore</button></div></div>`
        : `<div class="cx-acts"><button class="cx-btn cx-b-ink" data-act="approve" data-id="${esc(v.id)}">${ic('check')}${valLbl(v.t)}</button><button class="cx-btn cx-b-line" data-act="changes" data-id="${esc(v.id)}">Demander des modifications</button></div>`;
      return `<section class="cx-card cx-val c-1-13" aria-labelledby="val-${esc(v.id)}">${prev}<div class="cx-dec"><span class="cx-chip hl">${nDec > 1 ? `Décision ${k} sur ${nDec} · ` : ''}En attente de ${R('votre', 'ton')} feu vert</span><h2 id="val-${esc(v.id)}">${esc(v.t)}</h2>
        <p class="cx-dec-p">${esc(Core.reg(v.sub, p.registre))}. Prêt depuis le ${fmt(v.readyAt, { day: 'numeric', month: 'long' })}${maker ? `, préparé par ${esc(cxFirst(maker))}` : ''}.</p>
        ${hrs !== null && hrs > 0 ? `<div class="cx-count"><span class="cx-num">${hrs}</span><div><b>${hrs > 1 ? 'heures' : 'heure'} pour répondre</b>${cxRelC(v.due)}, ${cxHour(v.due)}</div></div>` : ''}
        ${nIt ? `<div class="cx-count cx-count-l"><span class="cx-ltr hl" aria-hidden="true">${esc(nPh.letter || '')}</span><div><b>Après ${R('votre', 'ton')} feu vert</b>${esc(nIt.t)}${nWho ? `, avec ${esc(cxFirst(nWho))}` : ''}.</div></div>` : ''}
        ${acts}<p class="cx-legal">Valider, c’est donner ${R('votre', 'ton')} feu vert écrit pour passer à la suite. Il est enregistré avec la date et l’heure.</p></div></section>`; };
    const sign = (f) => { k++; const open = S.signOpen === f.id;
      return `<section class="cx-card c-1-13" aria-labelledby="sg-h-${esc(f.id)}"><div class="cx-sign"><span class="cx-pdf" aria-hidden="true"><b>${esc(((f.name.match(/\.([a-z0-9]+)$/i) || [, 'PDF'])[1]).toUpperCase())}</b></span><div class="cx-m"><span class="cx-chip warn">${nDec > 1 ? `Décision ${k} sur ${nDec} · ` : ''}à signer</span><div class="cx-sign-t" id="sg-h-${esc(f.id)}">${esc(f.sign.label || f.name)}</div><div class="cx-s">${esc(f.name)} · envoyé le ${fmt(f.sign.at, { day: 'numeric', month: 'long' })} par ${esc(cxFirst(f.sign.by))} · signature en ligne en 1 minute</div></div>
        ${canPreview(f) ? `<button class="cx-btn sm cx-b-soft" type="button" data-act="fview" data-id="${esc(f.id)}">${ic('eye')}Lire<span class="sr"> : ${esc(f.name)}</span></button>` : API.fileUrl(f) ? `<a class="cx-btn sm cx-b-soft" href="${API.fileUrl(f)}">${ic('down')}Télécharger<span class="sr"> : ${esc(f.name)}</span></a>` : ''}${open ? '' : `<button class="cx-btn sm cx-b-ink" data-act="sign-open" data-id="${esc(f.id)}" aria-expanded="false">Signer<span class="sr"> : ${esc(f.sign.label || f.name)}</span></button>`}</div>
        ${open ? `<form class="cx-form sign-doc" data-form="signdoc" data-id="${esc(f.id)}">${signBox(f.id, 'J’ai lu ce document et je le signe.')}<div class="cx-acts cx-acts-row"><button class="cx-btn cx-b-ink" type="submit">${ic('check')}Signer le document</button><a class="cx-btn cx-b-line" href="#messages" data-go="messages">Poser une question</a><button class="cx-btn cx-b-line" type="button" data-act="sign-close" data-id="${esc(f.id)}">Annuler</button></div></form>` : ''}</section>`; };
    const prop = (x) => { k++; return `<section class="cx-card c-1-13"><div class="cx-sign"><span class="cx-fico" aria-hidden="true">${ic('doc')}</span><div class="cx-m"><span class="cx-chip warn">${nDec > 1 ? `Décision ${k} sur ${nDec} · ` : ''}à lire</span><div class="cx-sign-t">${esc(x.title)}</div><div class="cx-s">${money(x.lines.reduce((t, l) => t + l.ht, 0))} HT${x.validUntil ? ' · valable jusqu’au ' + fmt(x.validUntil, { day: 'numeric', month: 'long' }) : ''}</div></div><a class="cx-btn sm cx-b-ink" href="#proposition" data-go="proposition">Lire et répondre</a></div></section>`; };
    const st = (x, i) => { const h = x.history[x.history.length - 1] || {};
      return `<div class="cx-step ${x.status === 'ready' ? 'now' : x.status === 'approved' ? 'ok' : x.status === 'changes' ? 'chg' : 'lock'}"><span class="cx-sn">${i + 1}</span><b>${esc(x.t)}</b><small>${x.status === 'ready' ? `${ic('cal')}Maintenant` : x.status === 'approved' ? `${ic('check')}Validé le ${fmt(h.at)}` : x.status === 'changes' ? `${ic('chat')}Modifications en cours` : `${ic('lock')}${x.due ? 'Vers le ' + fmt(x.due) : 'Plus tard'}`}</small></div>`; };
    const steps = p.validations.length ? `<section class="cx-card c-1-13" aria-labelledby="cx-st-h"><div class="cx-card-h"><h2 id="cx-st-h">${ic('ok')}Les feux verts du projet</h2><span class="cx-aside">${nOk} sur ${p.validations.length} ${nOk > 1 ? 'donnés' : 'donné'}</span></div><div class="cx-steps">${p.validations.map(st).join('')}</div>
      ${p.validations.some((x) => ['approved', 'changes'].includes(x.status)) ? `<div class="cx-sepb"><b class="cx-sub-h">Déjà répondu</b><ul class="cx-list">${p.validations.filter((x) => ['approved', 'changes'].includes(x.status)).map((x) => { const h = x.history[x.history.length - 1] || {};
        return `<li><span class="cx-chip ${x.status === 'approved' ? 'ok' : 'hl'}">${x.status === 'approved' ? 'Validé' : 'Modifications en cours'}</span><div class="cx-m"><div class="cx-t">${esc(x.t)}</div><div class="cx-s">${x.status === 'approved' ? `Validé par ${esc(h.by === S.me.id ? S.me.name : who(h.by))} le ${fmt(h.at, { day: '2-digit', month: '2-digit' })} à ${fmt(h.at, { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ')}` : 'Modifications demandées le ' + fmt(h.at, { day: 'numeric', month: 'long' }) + (h.comment ? ' : « ' + esc(h.comment) + ' »' : '')}</div></div></li>`; }).join('')}</ul></div>` : ''}</section>` : '';
    const body = props.map(prop).join('') + ready.map(feat).join('') + signs.map(sign).join('');
    return cxNb(cxHead('À valider', nDec ? `<b>${cxPl(nDec, 'décision')}</b> ${nDec > 1 ? R('vous attendent', 't’attendent') : R('vous attend', 't’attend')}. On avance avec ${R('votre', 'ton')} feu vert.` : `On avance avec ${R('votre', 'ton')} feu vert.`, p.validations.length ? `<span class="cx-pill">${ic('ok')}${nOk} ${nOk > 1 ? 'feux verts donnés' : 'feu vert donné'} sur ${p.validations.length}</span>` : '')
      + `<div class="cx-bento">${body || `<div class="cx-card c-1-13 cx-empty-c"><b>Rien à valider pour l’instant.</b><span>On ${R('vous', 'te')} prévient dès que la prochaine étape est prête.</span></div>`}${steps}</div>`);
  }

  /* ---------- 5. Fichiers et factures (une seule page : dépôt, paiements, envois, volume, documents de l'agence) ---------- */
  function vFichiers() {
    const p = S.project, b = p.billing, mine = p.files.filter((f) => f.from === 'client').sort((x, y) => new Date(y.at) - new Date(x.at));
    const ext = (n) => ((n.match(/\.([a-z0-9]{1,6})$/i) || [, ''])[1] || '').toUpperCase(), base = (n) => n.replace(/\.[a-z0-9]{1,6}$/i, '');
    const drop = `<section class="cx-drop c-1-8" id="drop" aria-labelledby="dz-h"><label class="cx-dz" for="file-in"><span class="cx-up" aria-hidden="true">${ic('up')}</span><span class="cx-dz-t"><span class="cx-h2" id="dz-h">${R('Glissez vos fichiers ici', 'Glisse tes fichiers ici')}</span><span class="cx-dz-p">${R('Ou cliquez pour choisir.', 'Ou clique pour choisir.')} Photos, vidéos, textes, dossiers entiers. Aucune limite de taille, l’envoi reprend tout seul si la connexion coupe.</span></span><input id="file-in" type="file" multiple class="sr"></label>
      ${upState()}
      ${p.missing.length ? `<div class="cx-miss-h"><b>Ce qu’il nous manque</b><span class="cx-chip warn">${cxPl(p.missing.length, 'élément')}</span></div>
      <div class="cx-miss">${p.missing.map((m) => `<div><span class="cx-fico" aria-hidden="true">${ic('folder')}</span><div class="cx-m"><b>${esc(m.t)}</b>${m.sub ? `<small>${esc(m.sub)}</small>` : ''}</div><label class="cx-btn sm cx-b-ink cx-file-l" for="miss-${m.id}">Déposer<span class="sr"> : ${esc(m.t)}</span><input id="miss-${m.id}" type="file" multiple class="sr" data-missing="${m.id}"></label></div>`).join('')}</div>` : ''}
      <div class="cx-dir"><label class="cx-btn sm cx-b-soft cx-file-l" for="dir-in">${ic('folder')}Déposer un dossier entier<input id="dir-in" type="file" webkitdirectory multiple class="sr"></label><span>Les sous-dossiers sont conservés.</span></div></section>`;
    // Paiements : ce qui est réglé, ce qui est dû, et de quoi payer (lien en ligne, IBAN).
    const paid = p.invoices.filter((i) => i.status === 'paid').reduce((t, i) => t + i.ttc, 0), total = b.totalTTC || p.invoices.reduce((t, i) => t + i.ttc, 0);
    const dueL = p.invoices.filter((i) => i.status === 'due'), fut = Math.max(0, total - paid), pct = total ? Math.round((paid / total) * 100) : 0, C = 2 * Math.PI * 56;
    const pdfOf = (i) => i.num && p.files.find((f) => f.from === 'agence' && f.cat === 'Facture' && f.name.includes(i.num));
    const pdfBtn = (f) => { const url = f && API.fileUrl(f); return !f ? '' : url ? `<a class="cx-iconbtn" href="${url}">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></a>` : `<button class="cx-iconbtn" data-act="toast" data-msg="Fichier d’exemple : rien à télécharger.">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></button>`; };
    const pay = `<section class="cx-card c-8-13 cx-pay" aria-labelledby="pay-h"><div class="cx-card-h"><h2 id="pay-h">${ic('doc')}Paiements</h2>${b.quote ? `<span class="cx-aside">Devis ${esc(b.quote)}${b.signedAt ? ' signé' : ''}</span>` : ''}</div>
      ${total ? `<div class="cx-pay-top"><div class="cx-ring" role="img" aria-label="${pct} % réglé"><svg viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="56" fill="none" stroke="var(--surface-2)" stroke-width="16"/>${pct ? `<circle cx="66" cy="66" r="56" fill="none" stroke="var(--fg)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(C * pct) / 100} ${C}"/>` : ''}</svg><div><span><b>${pct} %</b><small>réglé</small></span></div></div>
        <div class="cx-pay-n"><div class="cx-num">${cxMoney(paid)}<small>€ TTC réglés</small></div><div class="cx-s">sur ${cxMoney(total)} € TTC au total${dueL.length ? `<br><b>${cxMoney(dueL.reduce((t, i) => t + i.ttc, 0))} €</b> à régler maintenant` : fut ? `<br>Solde de <b>${cxMoney(fut)} €</b> ${p.deliveredAt ? 'selon les factures à venir' : p.offer === 'site' ? 'à la mise en ligne' : 'à la livraison'}` : ''}</div></div></div>` : ''}
      ${p.invoices.map((i) => `<div class="cx-inv ${i.status}"><span class="cx-fico" aria-hidden="true">${ic(i.status === 'paid' ? 'check' : 'cal')}</span><div class="cx-m"><b>${esc(i.label)}</b><small>${i.num ? esc(i.num) + ' · ' : ''}${money(i.ht)} HT · ${i.status === 'paid' ? (i.paidAt ? 'réglée le ' + fmt(i.paidAt, { day: 'numeric', month: 'long' }) : 'réglée') : i.status === 'due' ? (i.num ? 'référence à indiquer sur le virement' : 'à régler') : `sera envoyée ${p.offer === 'site' ? 'à la mise en ligne' : 'à la livraison'}`}</small></div><div class="cx-inv-r"><div class="cx-amt">${cxMoney(i.ttc)} €<span class="sr"> TTC</span></div>${i.status === 'paid' ? '<span class="cx-chip ok">Réglée</span>' : i.status === 'due' ? '<span class="cx-chip warn">À régler</span>' : '<span class="cx-chip">À venir</span>'}</div>${i.status === 'due' && i.payUrl ? `<a class="cx-btn sm cx-b-ink" href="${esc(i.payUrl)}" target="_blank" rel="noopener">Payer en ligne</a>` : ''}${pdfBtn(pdfOf(i))}</div>`).join('') || '<p class="cx-s">Aucune facture pour le moment.</p>'}
      <div class="cx-duo"><button class="cx-btn sm cx-b-soft" data-act="copy">${ic('copy')}Copier l’IBAN</button></div>
      <p class="cx-bank">${esc(cfg().holder || '')}${cfg().bank ? ' · ' + esc(cfg().bank) : ''}<br>IBAN <span id="iban" class="num">${esc(cfg().iban || '')}</span>${cfg().bic ? ` · BIC <span class="num">${esc(cfg().bic)}</span>` : ''}</p></section>`;
    // Les envois du client : vignettes filtrables, aperçu, téléchargement, retrait pendant 24 h.
    const cats = ['Tous', ...Core.FILE_CATS], count = (c) => (c === 'Tous' ? mine.length : mine.filter((f) => f.cat === c).length), q = (S.fq || '').toLowerCase();
    const shown = (S.cat === 'Tous' || !S.cat ? mine : mine.filter((f) => f.cat === S.cat)).filter((f) => !q || f.name.toLowerCase().includes(q));
    const inner = (n) => (n.match(/\((\d+) fichiers\)/) || [, 0])[1];
    const tile = (f) => { const url = API.fileUrl(f), own = !S.preview && f.by === S.me.id && Date.now() - new Date(f.at) < 864e5, kd = kindOf(f);
      const im = f.thumb ? asset(f.thumb) : url && kd === 'image' && !/\.svg$/i.test(f.name) ? url + '?inline=1' : '', th = im ? `<img src="${esc(im)}" alt="" loading="lazy">` : ic({ video: 'play', image: 'eye', link: 'figma' }[kd] || 'doc');
      return `<div class="cx-ft"><div class="cx-fth ${kd === 'video' && !im ? 'vid' : ''}" aria-hidden="true">${th}${ext(f.name) ? `<span class="cx-ext">${esc(ext(f.name))}</span>` : ''}${f.fresh ? '<span class="cx-chip ok cx-newf">Envoyé</span>' : ''}</div><b style="overflow-wrap:anywhere">${esc(base(f.name).replace(/\s*\(\d+ fichiers\)/, ''))}</b><small class="num">${f.folder ? `${esc(f.folder.replace(/\//g, ' › '))} · ` : ''}${inner(f.name) ? inner(f.name) + ' fichiers · ' : ''}${f.size ? cxSize(f.size) + ' · ' : ''}${fmt(f.at)}</small>
        <div class="cx-ft-a">${canPreview(f) ? `<button class="cx-iconbtn" data-act="fview" data-id="${esc(f.id)}">${ic('eye')}<span class="sr">Aperçu de ${esc(f.name)}</span></button>` : ''}${url ? `<a class="cx-iconbtn" href="${url}">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></a>` : `<button class="cx-iconbtn" data-act="toast" data-msg="Fichier d’exemple : rien à télécharger.">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></button>`}${own ? `<button class="cx-iconbtn" data-act="file-remove-own" data-id="${esc(f.id)}" aria-label="Retirer ${esc(f.name)} (possible pendant 24 h)" title="Retirer (possible pendant 24 h)">×</button>` : ''}</div></div>`; };
    const envois = `<section class="cx-card c-1-8" aria-labelledby="mf"><div class="cx-card-h cx-wrap-h"><h2 id="mf">${ic('up')}${R('Vos', 'Tes')} envois</h2>${mine.length ? `<div class="cx-tabs" role="group" aria-label="Filtrer par type">${cats.filter((c) => c === 'Tous' || count(c) || S.cat === c).map((c) => `<button data-cat="${c}" aria-pressed="${(S.cat || 'Tous') === c}">${c} <em>${count(c)}</em></button>`).join('')}</div>` : ''}</div>
      ${mine.length > 3 ? `<div class="field cx-search"><label class="sr" for="f-q">Rechercher un fichier</label><input id="f-q" type="search" placeholder="Rechercher un fichier" value="${esc(S.fq || '')}" data-fsearch="1"></div>` : ''}
      ${shown.length ? `<div class="cx-ftiles">${shown.map(tile).join('')}</div>` : `<p class="cx-s">${q ? 'Aucun fichier ne correspond à « ' + esc(S.fq) + ' ».' : 'Aucun fichier ici pour l’instant.'}</p>`}
      ${mine.some((f) => f.by === S.me.id && Date.now() - new Date(f.at) < 864e5) ? `<p class="cx-note">${R('Vous pouvez', 'Tu peux')} retirer un fichier déposé par erreur pendant 24 heures (bouton ×).</p>` : ''}</section>`;
    const tot = mine.reduce((t, f) => t + (f.size || 0), 0);
    const vc = Core.FILE_CATS.map((c) => [c, mine.filter((f) => f.cat === c)]).map(([c, l]) => [c, l, l.reduce((t, f) => t + (f.size || 0), 0)]).filter(([, l]) => l.length).sort((x, y) => y[2] - x[2]);
    const totTxt = cxSize(tot), [tn, tu] = [totTxt.replace(/\s.*$/, ''), totTxt.replace(/^\S+\s/, '')];
    const vol = `<section class="cx-card c-8-13" aria-labelledby="cx-vol-h"><div class="cx-card-h"><h2 id="cx-vol-h">${ic('folder')}Déjà reçu</h2></div>
      ${mine.length ? `<div class="cx-num">${tn}<small>${tu} au total</small></div><div class="cx-stack" aria-hidden="true">${vc.map(([, , s], i) => `<i class="k${Math.min(3, i + 1)}" style="flex:${Math.max(s, 1)} 1 0"></i>`).join('')}</div>
      <ul class="cx-vleg">${vc.map(([c, l, s], i) => `<li><i class="k${Math.min(3, i + 1)}"></i><span>${c}</span><small>${cxPl(l.length, 'fichier')}</small><b>${cxSize(s)}</b></li>`).join('')}</ul>` : `<p class="cx-s">Rien reçu pour l’instant. ${R('Vos', 'Tes')} fichiers apparaîtront ici.</p>`}</section>`;
    const linked = new Set(p.invoices.map(pdfOf).filter(Boolean).map((f) => f.id)), ag = p.files.filter((f) => f.from === 'agence' && f.cat !== 'Bibliothèque' && !linked.has(f.id)).sort((x, y) => new Date(y.at) - new Date(x.at));
    const agRow = (f) => { const url = API.fileUrl(f), signed = f.sign && f.sign.status === 'signed';
      return `<li><span class="cx-fico ${f.sign && !signed ? 'sig' : ''}" aria-hidden="true">${ic(f.url && !url ? 'figma' : 'doc')}</span><div class="cx-m"><div class="cx-t" style="overflow-wrap:anywhere">${esc(base(f.name))}</div><div class="cx-s num">${esc(f.cat)} · ${fmt(f.at)}${ext(f.name) ? ' · ' + esc(ext(f.name)) : f.url ? ' · Figma' : ''}${f.size ? ' · ' + cxSize(f.size) : ''}</div></div>
        ${signed ? (API.proofUrl(p.id, f.id) ? `<a class="cx-chip ok" href="${API.proofUrl(p.id, f.id)}" target="_blank" rel="noopener" title="Voir le certificat de signature">Signé le ${fmt(f.sign.signedAt)}</a>` : `<span class="cx-chip ok">Signé le ${fmt(f.sign.signedAt)}</span>`) : f.sign ? `<span class="cx-chip warn">À signer</span><a class="cx-btn sm cx-b-ink" href="#valider" data-go="valider">Signer<span class="sr"> : ${esc(f.name)}</span></a>` : ''}
        ${canPreview(f) ? `<button class="cx-iconbtn" data-act="fview" data-id="${esc(f.id)}">${ic('eye')}<span class="sr">Aperçu de ${esc(f.name)}</span></button>` : ''}
        ${f.url && !url ? `<a class="cx-btn sm cx-b-soft" href="${esc(f.url)}" target="_blank" rel="noopener">Ouvrir<span class="sr"> ${esc(f.name)}</span></a>` : url ? `<a class="cx-iconbtn" href="${url}">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></a>` : `<button class="cx-iconbtn" data-act="toast" data-msg="Fichier d’exemple : rien à télécharger.">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></button>`}</li>`; };
    const agence = `<section class="cx-card c-1-13" aria-labelledby="lv"><div class="cx-card-h"><h2 id="lv">${ic('doc')}Remis par l’agence</h2>${ag.length ? `<span class="cx-aside">${cxPl(ag.length, 'document')}</span>` : ''}</div>
      ${ag.length ? `<ul class="cx-list">${ag.map(agRow).join('')}</ul>` : '<p class="cx-s">Les maquettes, devis et documents de l’agence apparaîtront ici.</p>'}</section>`;
    return cxNb(cxHead('Fichiers et factures', `Ce que ${R('vous nous envoyez', 'tu nous envoies')} et ce que l’agence ${R('vous', 'te')} remet`, zipBtn('cx-btn sm cx-b-ink'))
      + `<div class="cx-bento">${drop}${pay}${envois}${vol}${agence}</div>`);
  }
  function vDocuments() { return vFichiers(); }

  /* ---------- 6. Messages ---------- */
  function vMessages() {
    const p = S.project, list = (p.messages || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at)), lead = cxLead();
    let lastDay = '';
    const vid = (m) => `<a class="cx-vid" href="${esc(m.loom.url)}" target="_blank" rel="noopener"><span class="cx-vth" aria-hidden="true"><i>${ic('play')}</i>${m.loom.duration ? `<em>${esc(m.loom.duration)}</em>` : ''}</span><span class="cx-m"><b>${esc(m.loom.title)}</b><span>Vidéo de ${esc(cxFirst(m.by))} · s’ouvre dans Loom</span></span></a>`;
    const thread = list.map((m) => { const dl = cap(cxF(m.at, { weekday: 'long', day: 'numeric', month: 'long' })), sep = dl !== lastDay ? `<div class="cx-day"><span>${cxAgo(m.at) === 'Hier' || cxAgo(m.at) === 'Aujourd’hui' ? cxAgo(m.at) : dl}</span></div>` : ''; lastDay = dl;
      const mine = !m.fromAgency, u = cxUser(m.by);
      return sep + `<div class="cx-msg ${mine ? 'me' : ''}">${mine ? '' : cxAv(m.by, '')}<div class="cx-bubble"><div class="cx-who"><b>${mine ? R('Vous', 'Toi') : esc(cxFirst(m.by))}${u && u.title ? `<span class="cx-role">${esc(u.title.split(/ et |,/)[0])}</span>` : ''}${m.readByClient === false && !mine ? '<span class="cx-chip hl cx-nw">Nouveau</span>' : ''}</b><span>${cxHour(m.at)}</span></div><p>${esc(m.text)}</p>${m.loom ? vid(m) : ''}</div></div>`; }).join('');
    const vids = list.filter((m) => m.loom).reverse(), rv = p.validations.find((v) => v.status === 'ready'), rvIt = rv && cxItems().find((x) => x.val === rv.key), rvWho = rvIt && Core.itemWho(rvIt).map((w) => w[0]).find((w) => w !== 'client');
    const ctx = rv ? `<div class="cx-ctx"><span class="cx-fico" aria-hidden="true">${ic('ok')}</span><div class="cx-m"><b>${esc(rv.t)} : ${R('votre', 'ton')} feu vert est attendu</b><small>${rv.due ? cxRelC(rv.due) + ', ' + cxHour(rv.due) : 'Prêt depuis le ' + fmt(rv.readyAt)}${rvWho ? ' · préparé par ' + esc(cxFirst(rvWho)) : ''}</small></div><a class="cx-btn sm cx-b-ink" href="#valider" data-go="valider">Voir et valider</a></div>` : '';
    const note = p.note && p.note.text ? `<div class="cx-pinned"><span class="cx-pin">Épinglé</span><div><b>Le mot de ${esc(cxFirst(p.note.by))}</b>${p.note.at ? ` · ${cxAgo(p.note.at).toLowerCase()}` : ''}<p>${esc(p.note.text)}</p></div></div>` : '';
    const compose = `<form class="cx-compose" data-form="msg"><label class="sr" for="msg-t">${R('Votre', 'Ton')} message</label><textarea id="msg-t" class="cx-field" placeholder="${R('Écrivez votre message', 'Écris ton message')}…" rows="3"></textarea>
      <div class="cx-cbar"><small>Toute l’équipe lit la conversation et ${R('vous', 'te')} répond sous 24 h ouvrées.</small><button class="cx-btn sm cx-b-ink" type="submit">Envoyer ${ic('arrow')}</button></div></form>`;
    const conv = `<section class="cx-card c-1-8 cx-conv ${vids.length ? 'cx-r2' : ''}" aria-labelledby="cx-conv-h"><div class="cx-card-h"><h2 id="cx-conv-h">${ic('chat')}Conversation</h2><span class="cx-aside">${cxPl(list.length, 'message')}<span class="cx-show-s"> · réponse sous 24 h ouvrées</span></span></div>${note}
      <div class="cx-thread thread" tabindex="0" role="log" aria-label="Conversation">${thread || `<p class="cx-s">Aucun message pour l’instant. ${R('Écrivez', 'Écris')} ci-dessous : l’équipe répond sous 24 h ouvrées.</p>`}</div>${ctx}${compose}</section>`;
    const topics = (u) => (u.contact || []).map((t) => t.replace(/,? et les bilans mensuels$/, ''));
    const whom = `<section class="cx-card c-8-13" aria-labelledby="cx-whom-h"><div class="cx-card-h"><h2 id="cx-whom-h">${ic('team')}À qui écrire</h2></div><div class="cx-whom">
      ${cxMembers().map((id) => { const u = cxUser(id); return `<div class="cx-wm ${id === lead ? 'lead' : ''}">${cxAv(id, '')}<div class="cx-m"><b>${esc(cxFirst(id))}${id === lead ? `<span class="cx-chip ink">${R('Votre', 'Ton')} contact</span>` : ''}</b><small>${esc(u.title || '')}</small>${topics(u).length ? `<ul>${topics(u).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}${u.wa ? `<a class="cx-link" href="${esc(u.wa)}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a>` : ''}</div></div>`; }).join('')}</div>
      <div class="cx-duo"><a class="cx-btn sm cx-b-soft" href="${esc(CALF())}" target="_blank" rel="noopener">${ic('cal')}Réserver un appel<span class="sr"> (nouvel onglet)</span></a></div></section>`;
    const vidCard = vids.length ? `<section class="cx-card c-8-13" aria-labelledby="cx-vids-h"><div class="cx-card-h"><h2 id="cx-vids-h">${ic('play')}Vidéos de l’équipe</h2><span class="cx-aside">${cxPl(vids.length, 'vidéo')}</span></div><ul class="cx-list">
      ${vids.map((m) => `<li><span class="cx-vth sm" aria-hidden="true"><i>${ic('play')}</i></span><div class="cx-m"><a class="cx-t cx-a" href="${esc(m.loom.url)}" target="_blank" rel="noopener">${esc(m.loom.title)}<span class="sr"> (s’ouvre dans Loom)</span></a><div class="cx-s">${esc(cxFirst(m.by))} · ${fmt(m.at)}${m.loom.duration ? ' · ' + esc(m.loom.duration) : ''}</div></div>${m.readByClient === false ? '<span class="cx-chip hl">À regarder</span>' : ''}</li>`).join('')}</ul></section>` : '';
    return cxNb(cxHead('Messages', 'Les messages et les vidéos de l’équipe, au même endroit', `<span class="cx-pill cx-hide-s">${ic('chat')}<span>Réponse sous <b>24 h ouvrées</b></span></span>`)
      + `<div class="cx-bento">${conv}${whom}${vidCard}</div>`);
  }

  /* ---------- 7. Maquettes et visuels (la bibliothèque est une section de la page) ---------- */
  function vMaquettes() { return maquettesBody() + biblioBody(); }
  function maquettesBody() {
    const p = S.project, L = p.links || {}, V = p.versions || [], last = V[0], rep = p.phases.find((x) => x.letter === 'R');
    const screens = (p.assets || []).filter((a) => a.kind === 'Maquettes' && a.img), pins = p.pins || [];
    const sub = p.deliveredAt ? `Les maquettes validées et les visuels de ${R('votre', 'ta')} marque, prêts à réutiliser` : 'En direct depuis Figma, toujours la dernière version';
    if (!L.figma && !L.proto) return cxNb(cxHead('Maquettes et visuels', p.offer === 'site' ? 'Les écrans du site, en direct depuis Figma' : p.offer === 'da' ? 'Les pistes et l’identité, en direct depuis Figma' : 'Les documents de travail, en direct depuis Figma')
      + `<div class="cx-bento"><div class="cx-card c-1-13 cx-empty-c">${ic('figma')}<b>${p.offer === 'da' ? 'Les pistes créatives arrivent' : 'Les maquettes arrivent'} avec l’étape « Représenter »${rep ? ', vers le ' + fmt(rep.from, { day: 'numeric', month: 'long' }) : ''}</b><span>Dès que ${esc(((S.team.find((u) => /design|création/i.test(u.title || '')) || S.team[0] || { name: 'l’équipe' }).name || '').split(' ')[0])} commence le design, ${R('vous les verrez', 'tu les verras')} ici en direct, sans compte Figma.</span></div></div>`);
    const vm = p.validations.find((x) => x.key === 'maquettes'), okAt = vm && vm.status === 'approved' ? (vm.history.find((h) => h.action === 'approved') || {}).at : null;
    const okList = p.validations.filter((x) => ['plan', 'da', 'maquettes', 'pistes', 'charte'].includes(x.key) && x.status === 'approved').map((x) => ({ t: x.t, at: (x.history.find((h) => h.action === 'approved') || {}).at })).filter((x) => x.at);
    const url = L.proto || L.figma, embed = !API.demo && !screens.length;
    const hero = `<section class="cx-card c-1-8 cx-hero" aria-labelledby="cx-hero-h"><div class="cx-card-h"><h2 id="cx-hero-h">${ic('figma')}La maquette cliquable</h2>${last ? `<span class="cx-chip hl">${esc(last.label)} · dernière version</span>` : ''}</div>
      ${embed ? `<div class="cx-shot cx-shot-embed"><iframe src="${figmaEmbed(url)}" title="Maquettes Figma" allowfullscreen loading="lazy"></iframe></div>` : `<a class="cx-shot" href="${esc(url)}" target="_blank" rel="noopener">${screens[0] ? `<img src="${esc(asset(screens[0].img))}" alt="">` : ''}<span class="cx-shot-c"><span class="cx-play" aria-hidden="true">${ic('play')}</span><b>Parcourir comme sur le vrai site</b><span>S’ouvre dans un nouvel onglet, sans compte Figma</span></span></a>`}
      <div class="cx-hero-ft"><div class="cx-m"><b>${esc(last ? last.t : 'Maquettes')}</b><small>${okAt ? `${R('Votre', 'Ton')} feu vert le ${fmt(okAt, { day: 'numeric', month: 'long' })}` : last ? 'Publiée le ' + fmt(last.at, { day: 'numeric', month: 'long' }) : ''}</small></div>${L.proto ? `<a class="cx-btn sm cx-b-ink" href="${esc(L.proto)}" target="_blank" rel="noopener">${ic('play')}Parcourir<span class="sr"> la maquette cliquable (nouvel onglet)</span></a>` : ''}${L.figma ? `<a class="cx-btn sm cx-b-soft" href="${esc(L.figma)}" target="_blank" rel="noopener">${ic('figma')}Ouvrir dans Figma<span class="sr"> (nouvel onglet)</span></a>` : ''}</div></section>`;
    const versions = `<section class="cx-card c-8-13" aria-labelledby="cx-ver-h"><div class="cx-card-h"><h2 id="cx-ver-h">${ic('doc')}Versions</h2>${V.length ? '<span class="cx-aside">La plus récente en premier</span>' : ''}</div>
      ${V.length ? `<ol class="cx-vers">${V.map((v, i) => `<li class="${i ? '' : 'on'}"><span class="cx-vl">${esc(v.label)}</span><div class="cx-m"><b>${esc(v.t)}</b><small>${fmt(v.at, { day: 'numeric', month: 'long' })}${!i && okAt ? ` · validée le ${fmt(okAt, { day: 'numeric', month: 'long' })}` : i ? ' · version précédente' : ' · dernière version'}</small></div>${v.url ? `<a class="cx-btn sm cx-b-line" href="${esc(v.url)}" target="_blank" rel="noopener">Ouvrir<span class="sr"> ${esc(v.label)} (nouvel onglet)</span></a>` : ''}</li>`).join('')}</ol>` : '<p class="cx-s">Chaque nouvelle version publiée par l’équipe apparaîtra ici.</p>'}
      ${okList.length ? `<div class="cx-oks"><b>${R('Vos', 'Tes')} feux verts sur le design</b>${okList.map((x) => `<div><i>${ic('check')}</i><span>${esc(x.t)}</span><small>${fmt(x.at)}</small></div>`).join('')}</div>` : ''}
      <p class="cx-note">Chaque version reste consultable : ${R('vous voyez', 'tu vois')} ce qui a changé d’une étape à l’autre.</p></section>`;
    const shots = screens.length ? `<section class="cx-card c-1-9" aria-labelledby="cx-scr-h"><div class="cx-card-h cx-wrap-h"><h2 id="cx-scr-h">${ic('eye')}Les écrans</h2><span class="cx-aside">${R('Cliquez', 'Clique')} sur un écran, puis sur l’endroit à commenter</span></div><div class="cx-screens">
      ${screens.map((a) => { const nP = pins.filter((x) => x.img === a.img).length; return `<div class="cx-scr"><div class="cx-scr-i" data-act="zoom" data-pin="1" data-src="${esc(a.img)}" data-title="${esc(a.title)}"><img src="${esc(asset(a.img))}" alt="" loading="lazy"><span class="cx-chip">${nP ? cxPl(nP, 'commentaire') : 'Aucun commentaire'}</span></div><div class="cx-scr-b"><div class="cx-m"><b>${esc(a.title)}</b><small>${a.by ? 'Par ' + esc(cxFirst(a.by)) : ''}${last ? (a.by ? ' · ' : '') + esc(last.label) : ''}</small></div><button class="cx-btn sm cx-b-soft" data-act="zoom" data-pin="1" data-src="${esc(a.img)}" data-title="${esc(a.title)}">${ic('chat')}Commenter<span class="sr"> : ${esc(a.title)}</span></button></div></div>`; }).join('')}</div></section>` : '';
    const open = pins.filter((x) => x.status === 'open').length, designer = ((S.team.find((u) => /design|création/i.test(u.title || '')) || S.team[0] || { name: 'l’équipe' }).name || '').split(' ')[0];
    const comments = `<section class="cx-card ${shots ? 'c-9-13' : 'c-1-13'}" aria-labelledby="cx-com-h"><div class="cx-card-h"><h2 id="cx-com-h">${ic('chat')}Commentaires</h2>${pins.length ? `<span class="cx-aside">${open} en cours</span>` : ''}</div>
      ${pins.length ? `<ul class="cx-list">${pins.map((x) => `<li><span class="cx-chip ${x.status === 'open' ? 'warn' : 'ok'}">${x.status === 'open' ? 'En cours' : 'Traité'}</span><div class="cx-m"><div class="cx-t">${esc(x.text)}</div><div class="cx-s">${esc(who(x.by))} · ${fmt(x.at)}${x.version ? ' · ' + esc(x.version) : ''}</div></div></li>`).join('')}</ul>`
        : `<div class="cx-empty"><span class="cx-pinmark" aria-hidden="true">1</span><b>Aucun commentaire pour l’instant</b><span>Une épingle sur l’écran, un mot, et ${esc(designer)} le reçoit. Elle reste visible jusqu’à ce qu’elle soit traitée.</span></div>`}
      ${screens.length ? `<ol class="cx-tips"><li><i>1</i>${R('Ouvrez', 'Ouvre')} un écran</li><li><i>2</i>${R('Cliquez', 'Clique')} là où quelque chose ${R('vous', 'te')} gêne</li><li><i>3</i>${R('Écrivez', 'Écris')} ${R('votre', 'ta')} remarque, on la traite</li></ol>` : `<ol class="cx-tips"><li><i>1</i>${R('Ouvrez la maquette cliquable et cliquez', 'Ouvre la maquette cliquable et clique')} comme sur le vrai site</li><li><i>2</i>${R('Notez ce qui vous gêne', 'Note ce qui te gêne')}, écran par écran</li><li><i>3</i>${R('Validez ou demandez', 'Valide ou demande')} des modifications dans « À valider »</li></ol>`}</section>`;
    return cxNb(cxHead('Maquettes et visuels', sub) + `<div class="cx-bento">${hero}${versions}${shots}${comments}</div>`);
  }
  function vBiblio() { S.toBiblio = true; return vMaquettes(); }
  const dlName = (a) => (S.project.client + ' ' + a.title).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + (a.fileId || /^data:image\/png|\.png$/.test(asset(a.img).slice(0, 40)) ? '.png' : '.jpg');
  function biblioBody() {
    const p = S.project, A = (p.assets || []).filter((a) => a.kind !== 'Maquettes'), B = p.brand || {};
    const kinds = ['Tout', ...new Set(A.map((a) => a.kind))], k = S.bk && kinds.includes(S.bk) ? S.bk : 'Tout', shown = k === 'Tout' ? A : A.filter((a) => a.kind === k);
    if (!A.length && !(B.colors || []).length) return '<div id="biblio"></div>';
    const zip = A.some((a) => a.fileId) && API.exportUrl(p.id) ? `<a class="cx-btn sm cx-b-ink" href="${API.exportUrl(p.id, 'biblio')}" download>${ic('down')}Tout télécharger (ZIP)</a>` : '';
    const gallery = A.length ? `<section class="cx-card c-1-13" aria-labelledby="bib-h"><div class="cx-card-h cx-wrap-h"><h2 id="bib-h">${ic('folder')}Bibliothèque</h2><div class="cx-bib-a"><div class="cx-tabs" role="group" aria-label="Filtrer la bibliothèque">${kinds.map((x) => `<button data-bk="${esc(x)}" aria-pressed="${k === x}">${esc(x)} <em>${x === 'Tout' ? A.length : A.filter((a) => a.kind === x).length}</em></button>`).join('')}</div>${zip}</div></div>
      <p class="cx-note cx-note-t">Les visuels du projet, libres d’usage pour ${R('votre', 'ta')} communication : site, LinkedIn, présentations.</p>
      <div class="cx-gal">${shown.map((a, i) => `<figure class="cx-gi ${i === 0 && shown.length > 2 ? 'big' : ''}">${a.img ? `<div class="cx-gimg" data-act="zoom" data-src="${esc(a.img)}" data-title="${esc(a.title)}"><img src="${esc(asset(a.img))}" alt="${esc(a.title)}" loading="lazy"><span class="cx-chip">${esc(a.kind)}</span></div>` : ''}
        <figcaption><div class="cx-m"><b>${esc(a.title)}</b><small>${a.img ? 'Image haute définition' : esc(a.kind)}</small></div>${a.img ? `<button class="cx-iconbtn" data-act="zoom" data-src="${esc(a.img)}" data-title="${esc(a.title)}">${ic('eye')}<span class="sr">Agrandir : ${esc(a.title)}</span></button><a class="cx-iconbtn" href="${esc(asset(a.img))}" download="${esc(dlName(a))}">${ic('down')}<span class="sr">Télécharger ${esc(a.title)}</span></a>` : ''}${a.url ? `<a class="cx-btn sm cx-b-soft" href="${esc(a.url)}" target="_blank" rel="noopener">Ouvrir<span class="sr"> ${esc(a.title)}</span></a>` : ''}</figcaption></figure>`).join('')}</div></section>` : '';
    const colors = (B.colors || []).length ? `<section class="cx-card ${(B.fonts || []).length ? 'c-1-8' : 'c-1-13'}" aria-labelledby="cx-col-h"><div class="cx-card-h"><h2 id="cx-col-h">${ic('eye')}Couleurs de la marque</h2><span class="cx-aside">${R('Cliquez', 'Clique')} pour copier</span></div><div class="cx-sws">${B.colors.map(([nm, h]) => `<button class="cx-sw" data-act="copytxt" data-txt="${esc(h)}"><i style="background:${esc(h)}"></i><b>${esc(nm)}</b><span>${esc(h)}</span><span class="sr"> : copier le code</span></button>`).join('')}</div></section>` : '';
    const fonts = (B.fonts || []).length ? `<section class="cx-card ${colors ? 'c-8-13' : 'c-1-13'}" aria-labelledby="cx-typo-h"><div class="cx-card-h"><h2 id="cx-typo-h">${ic('doc')}Typographies</h2></div><ul class="cx-list">${B.fonts.map(([r, d]) => `<li><span class="cx-aa" aria-hidden="true">Aa</span><div class="cx-m"><div class="cx-t">${esc(r)}</div><div class="cx-s">${esc(d)}</div></div></li>`).join('')}</ul></section>` : '';
    return cxNb(`<div class="cx-bento" id="biblio">${gallery}${colors}${fonts}</div>`);
  }
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const kindOf = (f) => { const n = f.name.toLowerCase(); return /\.(png|jpe?g|webp|gif|svg)$/.test(n) ? 'image' : /\.(mp4|mov|webm)$/.test(n) ? 'video' : /\.pdf$/.test(n) ? 'pdf' : /\.(zip|rar|7z)$/.test(n) ? 'zip' : /figma/i.test(n) || f.url ? 'link' : 'doc'; };
  const KIND_ICO = { image: 'eye', video: 'play', pdf: 'doc', zip: 'folder', link: 'figma', doc: 'doc' };
  const canPreview = (f) => !!API.fileUrl(f) && ['image', 'video', 'pdf'].includes(kindOf(f)) && !/\.svg$/i.test(f.name);
  /* Vignette d'un fichier : l'image elle-même, sinon une petite page au format du fichier (PDF, vidéo, ZIP…),
     pour reconnaître un fichier d'un coup d'œil sans lire son nom. */
  const EXT_TONE = { pdf: 'pdf', doc: 'word', docx: 'word', odt: 'word', pages: 'word', xls: 'sheet', xlsx: 'sheet', csv: 'sheet', numbers: 'sheet', ppt: 'slide', pptx: 'slide', key: 'slide', zip: 'zip', rar: 'zip', '7z': 'zip', ai: 'art', psd: 'art', eps: 'art', svg: 'art', fig: 'art', ttf: 'font', otf: 'font', woff: 'font', woff2: 'font' };
  function fileThumb(f) {
    const url = API.fileUrl(f), k = kindOf(f), ext = (f.name.match(/\.([a-z0-9]{1,6})$/i) || [, ''])[1].toLowerCase();
    const img = f.thumb ? asset(f.thumb) : url && k === 'image' && ext !== 'svg' ? url + '?inline=1' : '';
    if (img) return `<span class="ft ft-img" aria-hidden="true"><img src="${esc(img)}" alt="" loading="lazy"></span>`;
    if (k === 'video') return `<span class="ft ft-video" aria-hidden="true">${ic('play')}<b>${esc(ext.toUpperCase() || 'VIDÉO')}</b></span>`;
    if (k === 'image') return `<span class="ft ft-pic" aria-hidden="true">${ic('eye')}<b>${esc(ext.toUpperCase())}</b></span>`;
    if (k === 'link') return `<span class="ft ft-link" aria-hidden="true">${ic('figma')}</span>`;
    return `<span class="ft ft-page ft-${EXT_TONE[ext] || 'doc'}" aria-hidden="true"><b>${esc((ext || 'doc').toUpperCase())}</b></span>`;
  }
  function fileRow(f) {
    const url = API.fileUrl(f), k = kindOf(f);
    const agency = f.from === 'agence';
    const mine = !isAdmin() && !S.preview && f.by === S.me.id && Date.now() - new Date(f.at) < 864e5;
    const thumb = fileThumb(f);
    return `<div class="row">${thumb}<div class="grow"><div class="title" style="overflow-wrap:anywhere">${esc(f.name)}</div><div class="sub num">${f.folder ? `<span class="fold">${ic('folder')}${esc(f.folder.replace(/\//g, ' › '))}</span> · ` : ''}${esc(f.cat)}${f.size ? ' · ' + size(f.size) : ''} · ${fmt(f.at)}${!agency && isAdmin() && !S.preview ? ' · ' + esc(who(f.by)) : ''}</div></div>${f.fresh ? '<span class="chip ok">Envoyé</span>' : ''}${isAdmin() && !S.preview && f.seen === false ? '<span class="chip warn">Nouveau</span>' : ''}
      ${f.sign && f.sign.status === 'signed' ? (API.proofUrl(S.project.id, f.id) ? `<a class="chip ok" href="${API.proofUrl(S.project.id, f.id)}" target="_blank" rel="noopener" title="Voir le certificat de signature">Signé le ${fmt(f.sign.signedAt, { day: 'numeric', month: 'short' })}</a>` : `<span class="chip ok">Signé le ${fmt(f.sign.signedAt, { day: 'numeric', month: 'short' })}</span>`) : f.sign ? `<span class="chip warn">À signer</span>` : ''}
      ${isAdmin() && !S.preview && agency && !(f.sign && f.sign.status === 'signed') ? (f.sign ? `<button class="btn btn-line btn-sm" data-act="sign-cancel" data-id="${esc(f.id)}">Retirer la demande<span class="sr"> de signature : ${esc(f.name)}</span></button>` : `<button class="btn btn-line btn-sm" data-act="sign-req" data-id="${esc(f.id)}">Faire signer<span class="sr"> : ${esc(f.name)}</span></button>`) : ''}
      ${canPreview(f) ? `<button class="btn btn-line btn-sm" data-act="fview" data-id="${esc(f.id)}">${ic('eye')}<span class="sr">Aperçu de ${esc(f.name)}</span></button>` : ''}
      ${f.url && !url ? `<a class="btn btn-line btn-sm" href="${esc(f.url)}" target="_blank" rel="noopener">Ouvrir<span class="sr"> ${esc(f.name)}</span></a>` : url ? `<a class="btn btn-line btn-sm" href="${url}">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></a>` : `<button class="btn btn-line btn-sm" data-act="toast" data-msg="Fichier d’exemple : rien à télécharger.">${ic('down')}<span class="sr">Télécharger ${esc(f.name)}</span></button>`}
      ${isAdmin() && !S.preview ? `<button class="x" data-act="file-remove" data-id="${esc(f.id)}" aria-label="Retirer ${esc(f.name)}">×</button>` : mine ? `<button class="x" data-act="file-remove-own" data-id="${esc(f.id)}" aria-label="Retirer ${esc(f.name)} (possible pendant 24 h)" title="Retirer (possible pendant 24 h)">×</button>` : ''}</div>`;
  }
  /* Document à consulter dans l'espace (bilan mensuel présenté en visio) : lecture plein écran et téléchargement. */
  function docPreview() {
    const d = S.docView; if (!d) return '';
    return `<div class="lb" role="dialog" aria-modal="true" aria-label="${esc(d.title)}" data-act="fview-close"><figure class="fview"><iframe src="${esc(d.src)}${/^data:/.test(d.src) ? '' : '#view=FitH'}" title="${esc(d.title)}"></iframe>
      <figcaption>${esc(d.title)} · <a href="${esc(d.src)}" download="${esc(d.title)}.pdf">Télécharger</a></figcaption></figure><button class="lb-x" data-act="fview-close" aria-label="Fermer">×</button></div>`;
  }
  function filePreview() {
    const f = S.fview && S.project && S.project.files.find((x) => x.id === S.fview); if (!f) return '';
    const u = API.fileUrl(f) + '?inline=1', k = kindOf(f);
    return `<div class="lb" role="dialog" aria-modal="true" aria-label="Aperçu : ${esc(f.name)}" data-act="fview-close"><figure class="fview">
      ${k === 'image' ? `<img src="${u}" alt="${esc(f.name)}">` : k === 'video' ? `<video src="${u}" controls preload="metadata"></video>` : `<iframe src="${u}" title="${esc(f.name)}"></iframe>`}
      <figcaption>${esc(f.name)} · <a href="${API.fileUrl(f)}">Télécharger</a></figcaption></figure><button class="lb-x" data-act="fview-close" aria-label="Fermer">×</button></div>`;
  }

  /* Qui fait quoi sur un livrable, et le lien vers l'élément concerné. */
  const GO_LBL = { proposition: 'Lire la proposition', documents: 'Voir le document', valider: 'Voir et valider', maquettes: 'Voir les maquettes', demarrer: 'Bien démarrer', fichiers: 'Voir les fichiers', cal: 'Réserver' };
  function whoHtml(it) {
    const W = Core.itemWho(it); if (!W.length) return '';
    return `<ul class="who-l">${W.map(([w, t]) => { const u = w === 'client' ? null : S.team.find((x) => x.id === w) || { name: who(w) };
      const name = w === 'client' ? (isAdmin() && !S.preview ? (S.project.contactName || 'Client') : R('Vous', 'Toi')) : u.name.split(' ')[0];
      const txt = Core.reg(t || '', S.project.registre), sent = w === 'client' ? (isAdmin() && !S.preview ? `<strong>${esc(name)}</strong> : ${esc(txt.charAt(0).toLowerCase() + txt.slice(1))}` : esc(txt)) : `<strong>${esc(name)}</strong> ${esc(txt)}`;
      return `<li class="${w === 'client' ? 'me' : ''}">${u && IMG[u.photo] ? `<img class="avatar xs" src="${IMG[u.photo]}" alt="">` : `<span class="avatar xs ph">${esc(name[0])}</span>`}<span>${sent}.</span></li>`; }).join('')}</ul>`;
  }
  function itemLink(it, done) {
    const g = Core.itemGo(it), p = S.project; if (!g || g === 'projet') return '';
    if (/^https:/.test(g)) return `<a class="btn btn-line btn-sm" href="${esc(g)}" target="_blank" rel="noopener">Ouvrir<span class="sr"> : ${esc(it.t)}</span></a>`;
    if (g === 'cal') return done ? '' : `<a class="btn btn-line btn-sm" href="${CALF()}" target="_blank" rel="noopener">Réserver<span class="sr"> : ${esc(it.t)}</span></a>`;
    if (g === 'proposition' && !(p.proposals || []).length) return '';
    if (g === 'demarrer' && !p.tasks.some((t) => t.go === 'demarrer')) return '';
    return `<a class="btn btn-line btn-sm" href="#${g}" data-go="${g}">${GO_LBL[g] || 'Ouvrir'}<span class="sr"> : ${esc(it.t)}</span></a>`;
  }

  /* ---------- Proposition (avant signature, ou devis d'évolution) ---------- */
  function vProposition() {
    const p = S.project, L = (p.proposals || []).slice().sort((a, b) => (a.status === 'sent' ? -1 : 0) - (b.status === 'sent' ? -1 : 0));
    const card = (pr) => {
      const ht = pr.lines.reduce((t, l) => t + l.ht, 0), dep = Math.round(ht * pr.depositPct) / 100;
      const head = `<div class="prop-h"><div><div class="k">${pr.from ? 'Devis' : 'Proposition'}${pr.quote ? ' · ' + esc(pr.quote) : ''}</div><h2>${esc(pr.title)}</h2></div>${{ sent: `<span class="chip warn">En attente de ${R('votre', 'ta')} réponse</span>`, accepted: '<span class="chip ok">Acceptée</span>', declined: '<span class="chip idle">Déclinée</span>' }[pr.status] || ''}</div>`;
      const table = `<div class="table-wrap"><table class="prop-t"><caption class="sr">Détail de la proposition</caption><thead><tr><th scope="col">Ce qu’on fait</th><th scope="col" class="num">Montant HT</th></tr></thead><tbody>${pr.lines.map((l) => `<tr><td>${esc(l.t)}</td><td class="num">${money(l.ht)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><th scope="row">Total HT</th><td class="num">${money(ht)}</td></tr><tr><th scope="row">TVA (20 %)</th><td class="num">${money(Math.round(ht * 20) / 100)}</td></tr><tr class="ttc"><th scope="row">Total TTC</th><td class="num">${money(Math.round(ht * 120) / 100)}</td></tr></tfoot></table></div>`;
      const terms = `<p class="small muted">${pr.depositPct ? `Acompte de ${pr.depositPct} % à la signature (${money(dep)} HT), solde à la livraison. ` : 'Facturé à la livraison. '}${pr.status === 'sent' && pr.validUntil ? 'Proposition valable jusqu’au ' + fmt(pr.validUntil, { day: 'numeric', month: 'long' }) + '.' : ''}${pr.example && API.demo ? ' Montants d’exemple.' : ''}</p>`;
      const foot = pr.status === 'accepted' ? `<div class="prop-ok">${ic('ok')}<div><strong>Acceptée le ${esc(fmtTime(pr.acceptedAt))}</strong><span class="small muted">Signé « ${esc(pr.signName)} » depuis l’espace${pr.proof && pr.proof.ip ? ', avec la date, l’heure et l’adresse de connexion' : ''}. ${pr.depositPct ? 'La facture d’acompte est dans « Devis et factures ».' : ''}</span>${pr.sig ? `<img class="sig-img" src="${pr.sig}" alt="Signature de ${esc(pr.signName)}">` : ''}</div>${pr.depositPct ? `<a class="btn btn-line btn-sm" href="#documents" data-go="documents">Voir la facture</a>` : ''}</div>`
        : pr.status === 'declined' ? `<p class="muted">${R('Vous avez décliné', 'Tu as décliné')} cette proposition le ${fmt(pr.declined.at, { day: 'numeric', month: 'long' })}. On revient vers ${R('vous', 'toi')} avec une nouvelle version.</p>`
        : S.propDecline === pr.id ? `<form class="form" data-form="decline" data-id="${esc(pr.id)}"><div class="field"><label for="dc-${pr.id}">Qu’est-ce qui ne ${R('vous', 'te')} convient pas ?</label><textarea id="dc-${pr.id}" rows="3"></textarea></div><div class="inline"><button class="btn btn-line" type="submit">Envoyer ma réponse</button><button class="ghost" type="button" data-act="decline-cancel">Annuler</button></div></form>`
        : `<form class="form prop-sign" data-form="accept" data-id="${esc(pr.id)}">${signBox(pr.id, `J’ai lu la proposition${cfg().cgvUrl ? ` et les <a href="${esc(cfg().cgvUrl)}" target="_blank" rel="noopener">conditions générales</a>` : ''} et je l’accepte${pr.depositPct ? `, acompte de ${pr.depositPct} % compris` : ''}.`)}
            <div class="inline"><button class="btn btn-primary" type="submit">${ic('check')}Signer et accepter</button><a class="btn btn-line" href="#messages" data-go="messages">Poser une question</a><button class="ghost" type="button" data-act="decline" data-id="${esc(pr.id)}">Décliner</button></div></form>`;
      return `<section class="panel prop">${head}${pr.intro ? `<p class="prop-intro">${esc(pr.intro)}</p>` : ''}${table}${terms}${foot}${pr.from ? '' : '<p class="small muted prop-proof">Orem, marque d’ICONOKOM · plus de 40 clients accompagnés depuis 2023 · 100 % de satisfaction client</p>'}</section>`;
    };
    return `<div class="head"><div><h1>${L.length > 1 ? 'Propositions' : 'Proposition'}</h1><p class="lead">${esc(p.client)} · ${esc(Core.offerOf(p))}</p></div></div>
      ${L.map(card).join('') || '<div class="empty">Aucune proposition pour l’instant.</div>'}`;
  }

  /* ---------- Signature électronique (propositions et documents) ----------
     Nom tapé (obligatoire) et signature tracée au doigt ou à la souris (facultative, pour qui ne peut pas tracer).
     Le serveur ajoute la date, l'adresse IP, le navigateur et l'empreinte du document. */
  const toSign = () => (S.project ? S.project.files.filter((f) => f.sign && f.sign.status === 'requested') : []);
  function signBox(id, consent) {
    return `<div class="sign-box"><label class="check-l"><input type="checkbox" id="sg-ok-${id}"> ${consent}</label>
      <div class="field"><label for="sg-n-${id}">${R('Votre', 'Ton')} nom, pour signer</label><input id="sg-n-${id}" type="text" autocomplete="name" placeholder="Prénom Nom" data-signname="${id}"></div>
      <div class="field"><span class="lbl" id="sg-l-${id}">Signature tracée <span class="muted">(facultative)</span></span><div class="sign-pad"><canvas id="sg-c-${id}" width="600" height="180" role="img" aria-labelledby="sg-l-${id}" data-pad="${id}"></canvas><span class="sign-ph" aria-hidden="true">${R('Signez', 'Signe')} ici avec le doigt ou la souris</span></div>
        <div class="inline"><button class="ghost small" type="button" data-act="pad-clear" data-id="${id}">Effacer la signature</button></div></div>
      <p class="small muted">Signature électronique : la date, l’heure et ${R('votre', 'ton')} adresse de connexion sont enregistrées avec une empreinte du document, consultables dans un certificat.</p></div>`;
  }
  const padData = (id) => { const c = document.getElementById('sg-c-' + id); return c && c.dataset.drawn === '1' ? c.toDataURL('image/png') : ''; };
  function initPads() {
    document.querySelectorAll('canvas[data-pad]').forEach((c) => { if (c.dataset.ready) return; c.dataset.ready = '1';
      const x = c.getContext('2d'); x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#0b0b12'; let on = false;
      const pt = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)]; };
      c.addEventListener('pointerdown', (e) => { on = true; c.setPointerCapture(e.pointerId); const [a, b] = pt(e); x.beginPath(); x.moveTo(a, b); e.preventDefault(); });
      c.addEventListener('pointermove', (e) => { if (!on) return; const [a, b] = pt(e); x.lineTo(a, b); x.stroke(); c.dataset.drawn = '1'; c.parentNode.classList.add('drawn'); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => c.addEventListener(t, () => { on = false; }));
    });
  }



  function vEquipe() {
    return `
    <div class="head"><div><h1>Équipe et aide</h1><p class="lead">Une question ? On répond sous 24 h ouvrées</p></div><button class="btn btn-line" data-act="obopen">${ic('play')}Revoir la visite guidée</button></div>
    <div class="team">${S.team.map((u) => `<section class="panel person">${IMG[u.photo] ? `<img src="${IMG[u.photo]}" alt="">` : ''}<div><h2 class="person-n">${esc(u.name)}</h2><div class="role-t">${esc(u.title || '')}</div>${(u.contact || []).length ? `<div class="contact-for"><span class="k">${R('Contactez', 'Contacte')} ${esc(u.name.split(' ')[0])} pour</span><ul>${u.contact.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}${u.phone ? `<div class="small muted num" style="margin-top:4px">${esc(u.phone)}</div>` : ''}</div>${u.wa ? `<a class="btn btn-line btn-sm" href="${u.wa}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a>` : `<a class="btn btn-line btn-sm" href="#messages" data-go="messages">${ic('chat')}Message</a>`}</section>`).join('')}</div>
    <section class="panel" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
      <div style="min-width:0;flex:1 1 280px"><h2>Besoin d’en parler de vive voix ?</h2><p class="muted" style="margin-top:6px">${R('Réservez', 'Réserve')} une visio de 30 minutes quand ${R('vous voulez', 'tu veux')}.</p></div>
      <a class="btn btn-primary" href="${CALF()}" target="_blank" rel="noopener">${ic('cal')}Réserver une visio</a></section>
    <section class="panel"><div class="panel-head"><h2>${ic('chat')}Questions fréquentes</h2></div>
      <details><summary>Que se passe-t-il quand je valide ?</summary><p>La validation est enregistrée avec la date et l’heure, l’équipe est prévenue et passe à la suite du projet.</p></details>
      ${['site', 'evolution'].includes(S.project.offer) ? `<details><summary>Le site m’appartient-il ?</summary><p>Oui. Le site est hébergé sur ${R('votre', 'ton')} propre compte Webflow : ${R('vous en êtes propriétaire et restez libre de changer de prestataire', 'tu en es propriétaire et restes libre de changer de prestataire')}.</p></details>` : ''}
      <details><summary>Où déposer un fichier très lourd ?</summary><p>Dans l’onglet Fichiers, sans limite de taille : ${R('glissez-y', 'glisse-y')} même un dossier entier, ses sous-dossiers sont conservés. Si la connexion coupe, l’envoi reprend tout seul ; ${R('gardez', 'garde')} simplement la page ouverte jusqu’à la fin.</p></details>
      <details><summary>Comment me reconnecter ?</summary><p>Sur la page de connexion, ${R('saisissez votre', 'saisis ton')} e-mail : un lien et un code arrivent en quelques secondes. Pas de mot de passe à retenir.</p></details>
    </section>
    ${qaPanel()}`;
  }


  /* ---------- Chiffres clés ---------- */
  const daysTo = (d) => Math.ceil((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  function kpisAdmin() {
    const P = mineProjects(), sum = (f) => P.reduce((s, p) => s + f(p), 0);
    const k = (v, l) => `<div class="kpi"><span class="v num">${v}</span><span class="l">${l}</span></div>`;
    const pl = (n, one, many) => k(n, n > 1 ? many : one);
    return `<div class="kpis">${pl(P.length, 'espace actif', 'espaces actifs')}${pl(P.filter((p) => waitingOf(p).who === 'agence' || waitingOf(p).both).length, 'client attend l’agence', 'clients attendent l’agence')}${pl(sum((p) => p.alerts.waiting + (p.alerts.proposals || 0)), 'réponse attendue d’un client', 'réponses attendues des clients')}${pl(sum((p) => p.alerts.newFiles), 'nouveau fichier', 'nouveaux fichiers')}</div>`;
  }

  /* ---------- Réponses instantanées ---------- */
  const QA = () => [['ou', 'Où en est le projet ?'], ['moi', 'Qu’est-ce que je dois faire ?'], ['rdv', 'Quel est le prochain rendez-vous ?'], ['payer', 'Que reste-t-il à payer ?'], ['qui', 'Qui contacter ?']];
  function qaAnswer(id) {
    const p = S.project, ph = p.phases[p.phase - 1];
    const done = ph.items.filter((i) => itS(i) === 'done').length;
    const lead = S.team[0] || {};
    switch (id) {
      case 'ou': if (prospect()) return `Le projet démarre dès que la proposition est acceptée. <a href="#proposition" data-go="proposition">Lire la proposition</a>`;
        if (p.deliveredAt) return `${R('Votre', 'Ton')} site est en ligne depuis le <strong>${fmt(p.deliveredAt, { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. ${p.results && p.results.stats[0] ? esc(p.results.stats[0][0]) + ' ' + esc(p.results.stats[0][1]) + '. ' : ''}Pour aller plus loin, on peut le faire évoluer chaque mois. <a href="#outils" data-go="outils">Voir les options</a>`;
        return `Le projet est à l’étape ${p.phase} sur ${p.phases.length} : <strong>${esc(phName(ph))}</strong>. ${done} livrable${done > 1 ? 's' : ''} sur ${ph.items.length} ${done > 1 ? 'sont faits' : 'est fait'} sur cette étape. ${p.offer === 'site' ? 'Mise en ligne' : 'Livraison'} prévue vers le <strong>${fmt(p.golive, { day: 'numeric', month: 'long' })}</strong>, dans ${Math.max(0, daysTo(p.golive))} jours. <a href="#projet" data-go="projet">Voir les étapes</a>`;
      case 'moi': { const list = [...(p.proposals || []).filter((x) => x.status === 'sent').map((x) => 'répondre à la proposition « ' + x.title + ' »'), ...p.validations.filter((v) => v.status === 'ready').map((v) => 'valider ' + v.t.toLowerCase()), ...p.missing.map((m) => 'déposer ' + m.t.toLowerCase())];
        return list.length ? `${list.length} chose${list.length > 1 ? 's' : ''} ${R('vous attendent', 't’attendent')} : ${list.map(esc).join(', ')}. <a href="#${propsSent() ? 'proposition' : pending() ? 'valider' : 'fichiers'}" data-go="${propsSent() ? 'proposition' : pending() ? 'valider' : 'fichiers'}">Commencer</a>` : `Rien pour le moment. On ${R('vous', 'te')} prévient dès qu’on a besoin de ${R('vous', 'toi')}.`; }
      case 'rdv': return p.meeting && p.meeting.when ? `<strong>${esc(p.meeting.title)}</strong>, ${esc(fmtTime(p.meeting.when))}. Besoin d’un autre créneau ? <a href="${CALF()}" target="_blank" rel="noopener">Réserver une visio</a>` : `Aucun rendez-vous fixé. <a href="${CALF()}" target="_blank" rel="noopener">Réserver une visio de 30 minutes</a>`;
      case 'payer': { if (prospect()) return `Rien pour l’instant. Le budget est détaillé dans la proposition ; une facture d’acompte arrive à la signature. <a href="#proposition" data-go="proposition">Lire la proposition</a>`;
        const paid = p.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.ttc, 0), due = p.invoices.filter((i) => i.status === 'due').reduce((s, i) => s + i.ttc, 0);
        const later = Math.max(0, p.billing.totalTTC - paid - due);
        return `Déjà réglé : <strong>${money(paid)} TTC</strong> sur ${money(p.billing.totalTTC)} TTC.${due ? ` À régler maintenant : <strong>${money(due)} TTC</strong>.` : ''}${later ? ` Ensuite : ${money(later)} TTC, ${p.deliveredAt ? 'selon les factures à venir' : 'facturés à la livraison'}.` : ''} <a href="#documents" data-go="documents">Voir les factures</a>`; }
      case 'qui': return `${esc(lead.name || 'Louis')} (${esc(lead.title || 'agence')}) est ${R('votre', 'ton')} interlocuteur principal${lead.phone ? ` : <strong class="num">${esc(lead.phone)}</strong>` : ''}. <a href="#messages" data-go="messages">${R('Lui écrire', 'Lui écrire')}</a>`;
    }
    return '';
  }
  function qaPanel() {
    const lead = S.team[0] || {};
    const A = cfg().assistant;
    return `<section class="panel" aria-labelledby="qa"><div class="panel-head"><h2 id="qa">${ic('chat')}${A ? 'Une question ?' : 'Réponses rapides'}</h2><span class="aside">Réponse immédiate, tirée de ${R('votre', 'ton')} projet</span></div>
      ${A ? `<form class="inline ask" data-form="ask"><label class="sr" for="ask-q">${R('Votre', 'Ta')} question</label><input id="ask-q" type="text" maxlength="600" placeholder="${R('Posez votre question sur le projet', 'Pose ta question sur le projet')}" value="${esc(S.askQ || '')}"><button class="btn btn-primary btn-sm" type="submit">Demander</button></form>
        ${S.askA ? `<div class="qa-answer" role="status">${lead.photo && IMG[lead.photo] ? `<img src="${IMG[lead.photo]}" alt="">` : ''}<p>${S.askA === '…' ? 'Je regarde dans le projet…' : esc(S.askA)}</p></div><p class="small muted">Réponse générée à partir des données du projet. Pour une décision, ${R('écrivez', 'écris')} à l’équipe.</p>` : ''}` : ''}
      <div class="qa-chips" role="group" aria-label="Questions fréquentes">${QA().map(([id, q]) => `<button data-act="qa" data-id="${id}" aria-pressed="${S.qa === id}">${q}</button>`).join('')}</div>
      ${S.qa ? `<div class="qa-answer" role="status">${lead.photo && IMG[lead.photo] ? `<img src="${IMG[lead.photo]}" alt="">` : ''}<p>${qaAnswer(S.qa)}</p></div>` : ''}</section>`;
  }

  /* ---------- Accueil guidé (première connexion) ---------- */
  function onboarding() {
    const p = S.project, st = S.ob.step, first = (p.contactName || S.me.name || '').split(' ')[0];
    const lead = S.team[0] || {};
    const faces = S.team.filter((u) => IMG[u.photo]).map((u) => `<figure class="face"><img src="${IMG[u.photo]}" alt=""><figcaption>${esc(u.name.split(' ')[0])}</figcaption></figure>`).join('');
    const welcome = (p.messages || []).filter((m) => m.fromAgency && m.loom && /bienvenue/i.test(m.loom.title)).sort((a, b) => new Date(a.at) - new Date(b.at))[0] || (cfg().welcomeLoom ? { loom: { url: cfg().welcomeLoom, title: 'Bienvenue chez Orem', duration: '' } } : null);
    const arts = [
      ['Bienvenue', p.phase > 1 || p.tasks.some((t) => t.done) ? `${R('Votre', 'Ton')} espace est prêt, ${esc(first)}.` : `Bienvenue ${esc(first)}, ${R('votre', 'ton')} projet démarre ici.`],
      ['Le chemin', `${p.phases.length} étapes, de la première visio ${p.offer === 'site' ? 'à la mise en ligne' : 'à la livraison'}.`],
      ['Pour démarrer', `${R('Vos', 'Tes')} premières actions.`],
      ['Dernier détail', `Faisons connaissance.`]
    ];
    const actions = [...p.validations.filter((v) => v.status === 'ready').map((v) => ['Valider : ' + v.t.toLowerCase(), 'Environ 5 minutes']), ...p.missing.map((m) => ['Déposer : ' + m.t.toLowerCase(), m.sub]), ...p.tasks.filter((t) => !t.done).map((t) => [t.t, ''])].slice(0, 3);
    if (p.deliveredAt) {
      arts[1] = [`${R('Votre', 'Ton')} espace`, 'Tout ce qu’on a construit, au même endroit.'];
      arts[2] = ['Pour commencer', `Ce que ${R('vous pouvez', 'tu peux')} faire dès maintenant.`];
    }
    const li = (rows) => `<div class="ob-list">${rows.map(([t, d], i) => `<div class="li"><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><strong>${t}</strong><span>${d}</span></div></div>`).join('')}</div>`;
    const notifBody = `<h3>${R('Vous', 'Toi')}</h3>
       <div class="ob-me">
         <div class="field"><label for="ob-n">Prénom et nom</label><input id="ob-n" type="text" autocomplete="name" value="${esc(S.me.name || p.contactName || '')}" required></div>
         <div class="field"><label for="ob-f">Fonction <span class="muted">(facultatif)</span></label><input id="ob-f" type="text" autocomplete="organization-title" value="${esc(S.me.title || '')}" placeholder="ex. Gérante, Responsable marketing"></div>
         <div class="field"><label for="ob-p">Téléphone <span class="muted">(facultatif)</span></label><input id="ob-p" type="tel" autocomplete="tel" value="${esc(S.me.phone || '')}" placeholder="Pour vous joindre en cas d’urgence"></div>
       </div>
       <h3>Les notifications</h3>
       <div class="ob-pref">
         <label><input type="checkbox" id="pf-mail" checked> Un e-mail quand on a besoin de ${R('vous', 'toi')} (validation, nouveau livrable, message)</label>
         <label><input type="checkbox" id="pf-week" checked> Le point de la semaine par e-mail, dès que l’équipe le publie</label>
       </div>`;
    const bodies = p.deliveredAt ? [`<h3>Un mot de l’équipe</h3><p>Bienvenue dans l’espace ${esc(p.client)}. ${R('Vous y retrouvez', 'Tu y retrouves')} tout ce qu’on a construit ensemble, les résultats du site et des outils pour ${R('votre', 'ton')} quotidien.</p><p>Une idée, une question ? On est à un message de ${R('vous', 'toi')}.</p><p class="muted small">${teamSig()}</p>`,
      `<h3>${R('Ce que vous y trouverez', 'Ce qu’il y a ici')}</h3>${li([evoOn(p) ? ['Évolution', 'La visio du mois, les bilans et les axes en cours'] : ['Résultats', 'Les chiffres du site, mis à jour chaque mois'], ['Bibliothèque', 'Visuels, maquettes et cas d’étude à réutiliser'], ['Boîte à outils', 'Kit de marque, signature e-mail, demandes sur le site'], ['Messages', 'Les vidéos et messages de l’équipe']])}`,
      `<h3>Trois raccourcis</h3>${li([['Copier les couleurs de la marque', 'Boîte à outils'], ['Faire une demande sur le site', 'Boîte à outils'], ['Télécharger les visuels du projet', 'Bibliothèque']])}`,
      notifBody
    ] : [
      `<h3>Un mot de l’équipe</h3>
       <p>Merci de nous faire confiance pour ce projet : <strong>${esc(p.projet)}</strong>. Cet espace remplace les mails éparpillés : ${R('vous y trouverez', 'tu y trouveras')} où en est ${p.offer === 'site' ? 'le site' : 'le projet'}, ce qu’on attend de ${R('vous', 'toi')}, ${R('vos', 'tes')} fichiers et ${R('vos', 'tes')} factures.</p>
       <p>On ne passe jamais à l’étape suivante sans ${R('votre', 'ton')} feu vert. Et si quelque chose n’est pas clair, on est à un message de ${R('vous', 'toi')}.</p>
       ${welcome ? `<div class="ob-video">${videoCard(welcome)}</div>` : ''}
       <p class="muted small">${teamSig()}</p>`,
      `<h3>${R('Votre', 'Ton')} planning</h3>
       <div class="ob-tl">${p.phases.map((x) => `<div class="tl ${phS(x) === 'wait' ? '' : phS(x)}"><i></i><strong style="font-weight:${phS(x) === 'on' ? 600 : 400}">${esc(phName(x))}</strong><span class="num">${fmt(x.from)}</span></div>`).join('')}</div>
       <p class="small muted">La méthode O.R.E.M. : Orienter, Représenter, Exécuter, Mesurer. ${p.offer === 'site' ? 'Mise en ligne' : 'Livraison'} prévue vers le <strong style="color:var(--fg)">${fmt(p.golive, { day: 'numeric', month: 'long' })}</strong>. Les dates sont ajustées ensemble à chaque étape.</p>`,
      `<h3>${actions.length ? 'Ce qu’on attend de ' + R('vous', 'toi') : 'Rien à faire pour l’instant'}</h3>
       ${actions.length ? `<div class="ob-list">${actions.map(([t, sub], i) => `<div class="li"><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(t)}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}</div></div>`).join('')}</div>` : `<p>On ${R('vous', 'te')} prévient dès qu’on a besoin de ${R('vous', 'toi')}.</p>`}
       <p class="small muted">${R('Vous les retrouverez', 'Tu les retrouveras')} toujours en haut de l’accueil.</p>`,
      notifBody
    ];
    return `<div class="ob" role="dialog" aria-modal="true" aria-labelledby="ob-t"><div class="ob-card">
      <div class="ob-art">${clientLogo(p, 'dark', 'ob-logo')}<div><div class="k" id="ob-k">${arts[st][0]} · ${st + 1} sur 4</div><h2 id="ob-t" tabindex="-1">${arts[st][1]}</h2></div><div class="faces">${faces}</div></div>
      <div class="ob-body"><div class="ob-steps" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>
        ${bodies[st]}
        <div class="ob-foot">${st ? `<button class="ghost" data-act="ob-prev">${ic('back')}Retour</button>` : '<button class="ghost" data-act="ob-skip">Passer</button>'}
          <button class="btn btn-primary" data-act="${st < 3 ? 'ob-next' : 'ob-done'}" aria-describedby="ob-k ob-t">${st < 3 ? 'Continuer' : 'Découvrir mon espace'} ${ic('arrow')}</button></div>
      </div></div></div>`;
  }
  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = document.querySelector('#main .next, #main .head') || document.body;
    const c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    const cols = ['#ff6200', '#092482', '#6cb5d7', '#0b6a3b', '#f4f4f6'];
    for (let i = 0; i < 70; i++) { const e = document.createElement('i'); e.style.left = Math.random() * 100 + '%'; e.style.background = cols[i % cols.length]; e.style.animationDelay = Math.random() * 0.4 + 's'; e.style.animationDuration = 1.2 + Math.random() + 's'; c.appendChild(e); }
    if (host !== document.body) { c.classList.add('in'); if (getComputedStyle(host).position === 'static') host.style.position = 'relative'; }
    host.appendChild(c); setTimeout(() => c.remove(), 2800);
  }


  /* ---------- Outils transverses ---------- */
  const asset = (p) => (window.ASSETS && window.ASSETS[p]) || p;
  const unread = () => (S.project ? (S.project.messages || []).filter((m) => m.readByClient === false).length : 0);
  const TEAMP = { id: 'team', name: 'L’équipe Orem', photo: 'logo-o', team: true };
  const person = (id) => (id === 'team' ? TEAMP : null) || S.team.find((u) => u.id === id) || { name: S.people[id] || (S.project && S.project.contactName) || '', photo: null };
  const loomId = (u) => { const m = String(u || '').match(/loom\.com\/(?:share|embed)\/([a-z0-9]+)/i); return m ? m[1] : null; };
  const figmaEmbed = (u) => 'https://www.figma.com/embed?embed_host=orem&url=' + encodeURIComponent(u);

  function videoCard(m) {
    const id = loomId(m.loom.url);
    if (!API.demo && id) return `<div class="video"><iframe src="https://www.loom.com/embed/${id}" title="${esc(m.loom.title)}" allowfullscreen loading="lazy"></iframe></div>`;
    return `<a class="video-card" href="${esc(m.loom.url)}" target="_blank" rel="noopener"><span class="play">${ic('play')}</span><span><strong>${esc(m.loom.title)}</strong><span>Vidéo${m.loom.duration ? ' · ' + esc(m.loom.duration) : ''} · s’ouvre dans Loom</span></span></a>`;
  }
  function msgBubble(m) {
    const u = person(m.by), mine = !m.fromAgency;
    return `<div class="msg ${mine ? 'mine' : ''}">${!mine ? (IMG[u.photo] ? `<img class="avatar" src="${IMG[u.photo]}" alt="">` : `<span class="avatar ph${u.team ? ' team' : ''}">${u.team ? `<img src="${IMG.logo}" alt="">` : esc((u.name || '?')[0])}</span>`) : ''}
      <div class="bubble"><div class="meta-l"><strong>${esc(mine ? R('Vous', 'Toi') : u.team ? u.name : (u.name || '').split(' ')[0])}</strong><span>${esc(fmt(m.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span>${m.readByClient === false && !mine ? '<span class="chip hl">Nouveau</span>' : ''}</div>
      <p>${esc(m.text)}</p>${m.loom ? videoCard(m) : ''}</div></div>`;
  }

  /* ---------- Boîte à outils ---------- */
  const TOOLS = {
    teaser: ['doc', 'Fiche de présentation d’un bien', 'Une fiche d’une page pour présenter un hôtel ou une boulangerie à un acquéreur, aux couleurs du cabinet.'],
    brand: ['eye', 'Kit de marque', 'Couleurs, typographies et visuels officiels, à copier en un clic.'],
    signature: ['mail', 'Signature e-mail', 'Une signature propre et cohérente pour toute l’équipe.'],
    request: ['plus', 'Faire une demande', 'Une idée, une correction, une nouvelle page : ${decris}, on s’en occupe.'],
    webflow: ['play', 'Se former à Webflow', 'Les vidéos pour modifier ${site} en autonomie.']
  };
  // Un outil n'apparaît que s'il a de quoi servir : la marque une fois les couleurs posées, Webflow à partir de la construction.
  const visibleTools = (p) => (p.tools || []).filter((t) => TOOLS[t] && (t !== 'brand' || (p.brand && p.brand.colors.length)) && (t !== 'webflow' || p.deliveredAt || p.phase >= 3) && (t !== 'teaser' || (p.brand && p.brand.colors.length)));
  function vOutils() {
    const p = S.project, tools = visibleTools(p);
    if (S.tool && tools.includes(S.tool)) return toolView(S.tool);
    return `<div class="head"><div><h1>Boîte à outils</h1><p class="lead">Des outils pensés pour ${R('votre', 'ton')} quotidien, inclus dans l’espace</p></div></div>
      <div class="toolgrid">${tools.map((t) => { const [i, n, d] = TOOLS[t]; return `<button class="toolcard" data-tool="${t}"><span class="ico hl">${ic(i)}</span><strong>${n}</strong><span>${d.replace('${site}', R('votre site', 'ton site')).replace('${decris}', R('décrivez-la', 'décris-la'))}</span><em>Ouvrir ${ic('arrow')}</em></button>`; }).join('')}</div>`;
  }
  function evolutionCard() {
    return `<section class="evo"><div><div class="k">Évolution</div><h2>${R('Votre', 'Ton')} site ne doit pas se figer.</h2><p>Chaque mois, on lit les chiffres avec ${R('vous', 'toi')}, on décide des priorités et on améliore ce qui ${R('vous ', 't’')}apporte des clients : formulaires, pages, supports commerciaux.</p></div>
      <div class="evo-a"><a class="btn" href="${esc(CALF())}" target="_blank" rel="noopener">Réserver un appel de 30 minutes ${ic('arrow')}</a><button class="ghost on-dark" data-tool="request">Ou ${R('décrivez', 'décris')} une demande</button></div></section>`;
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
      return `${back}${head}<section class="panel"><div class="panel-head"><h2>${ic('eye')}Couleurs</h2><span class="aside">${R('Cliquez', 'Clique')} pour copier le code</span></div>
        ${b.colors.length ? `<div class="swatches">${b.colors.map(([nm, h]) => `<button class="sw" data-act="copytxt" data-txt="${h}"><i style="background:${h}"></i><strong>${esc(nm)}</strong><span class="num">${h}</span></button>`).join('')}</div>` : '<p class="muted">Les couleurs arrivent avec la direction artistique.</p>'}</section>
        <section class="panel"><div class="panel-head"><h2>${ic('doc')}Typographies</h2></div>${b.fonts.length ? `<dl class="kv">${b.fonts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '<p class="muted">Les typographies arrivent avec la direction artistique.</p>'}</section>
        <section class="panel"><div class="panel-head"><h2>${ic('folder')}Visuels et logos</h2><a href="#biblio" data-go="biblio">Ouvrir la bibliothèque</a></div><p class="muted">Tous les visuels du projet sont rangés dans la bibliothèque, prêts à télécharger.</p></section>`;
    }
    if (t === 'signature') {
      const G = S.sig || (S.sig = { name: S.me.name || '', role: '', phone: '' });
      const main = ((p.brand && p.brand.colors[0]) || [])[1] || '#092482';
      return `${back}${head}<div class="grid2 tool2"><form class="panel form" data-form="sig"><div class="field"><label for="sg-n">Prénom et nom</label><input id="sg-n" type="text" value="${esc(G.name)}"></div><div class="field"><label for="sg-r">Fonction</label><input id="sg-r" type="text" value="${esc(G.role)}" placeholder="Associé"></div><div class="field"><label for="sg-p">Téléphone</label><input id="sg-p" type="text" value="${esc(G.phone)}" placeholder="01 23 45 67 89"></div></form>
        <section class="panel"><div class="panel-head"><h2>${ic('eye')}Aperçu</h2><button class="btn btn-line btn-sm" data-act="copysig">${ic('copy')}Copier la signature</button></div><div class="sig" id="sig-p">${sigHtml(G, main)}</div><p class="hint" style="margin-top:12px">${R('Collez', 'Colle')}-la dans les réglages de signature de Gmail ou Outlook.</p></section></div>`;
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
      const vids = p.tutorials || [];
      return `${back}${head}<section class="panel"><div class="videos">${vids.map((v) => `<div class="vitem">${v.url ? videoCard({ loom: { url: v.url, title: v.t, duration: v.d } }) : `<div class="video-card soon"><span class="play">${ic('play')}</span><span><strong>${esc(v.t)}</strong><span>${v.d ? esc(v.d) + ' · ' : ''}vidéo en préparation</span></span></div>`}</div>`).join('') || `<p class="muted">Les vidéos de formation arrivent avec la formation Webflow. En attendant, ${R('posez vos questions', 'pose tes questions')} dans Messages.</p>`}</div></section>
        ${cfg().training ? '' : '<!--'}<section class="panel" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between"><div style="flex:1 1 260px;min-width:0"><h2>Besoin d’un coup de main en direct ?</h2><p class="muted" style="margin-top:4px">Une session de formation en visio, sur ${R('votre', 'ton')} site.</p></div><a class="btn btn-primary" href="${esc(cfg().training || CALF())}" target="_blank" rel="noopener" title="${cfg().training ? '' : 'Visio de 30 minutes'}">${ic('cal')}Réserver une formation</a></section>${cfg().training ? '' : '-->'}`;
    }
    return back;
  }
  function teaserHtml(T) {
    const pts = String(T.points || '').split('\n').map((x) => x.trim()).filter(Boolean);
    return `<div class="tz-top"><span>${esc(S.project.client.toUpperCase())}</span><span>${esc(T.type)} à vendre</span></div>
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
    const items = [...(evoOpen(S.project) ? [['evolution', 'Évolution', 'arrow']] : []), ['projet', 'Étapes', 'map'], ['maquettes', 'Maquettes et visuels', 'figma'], ['documents', 'Devis et factures', 'doc'], ...(visibleTools(S.project).length ? [['outils', 'Boîte à outils', 'plus']] : []), ['equipe', 'Équipe et aide', 'team'], ['preferences', 'Mes notifications', 'mail']];
    return `<div class="head"><div><h1>Tout ${R('votre', 'ton')} espace</h1></div></div><section class="panel"><div class="list">${items.map(([id, l, i]) => `<a class="row linkrow" href="#${id}" data-go="${id}"><span class="ico">${ic(i)}</span><div class="grow"><div class="title">${l}</div></div>${id === 'valider' && pending() + propsSent() ? `<span class="badge">${pending() + propsSent()}</span>` : ''}${ic('arrow', 'width:18px;height:18px;color:var(--muted)')}</a>`).join('')}</div></section>
      <section class="panel"><div class="list"><button class="row linkrow" data-act="theme" aria-pressed="${isDark() ? 'true' : 'false'}"><span class="ico">${ic('moon')}</span><div class="grow"><div class="title">Mode sombre</div></div></button><button class="row linkrow" data-act="logout"><span class="ico">${ic('back')}</span><div class="grow"><div class="title">Se déconnecter</div></div></button></div></section>`;
  }

  /* ---------- Évolution : l'étape supérieure ----------
     Pendant le projet, l'entrée est visible mais verrouillée ; après la mise en ligne, c'est l'espace de l'accompagnement mensuel :
     prochaine visio de pilotage, bilans de chaque mois, axes d'amélioration et leur avancement. */
  const evoOpen = (p) => !!p && (p.offer === 'evolution' || !!p.deliveredAt || !!(p.evo && p.evo.active));
  const evoOn = (p) => !!(p && p.evo && p.evo.active);
  function evoNav(p) {
    if (!evoOpen(p)) return `<div class="nav-evo locked" aria-disabled="true" title="Disponible après la mise en ligne"><span class="ne-i">${ic('lock')}</span><span class="ne-t"><strong>Évolution</strong><small>Disponible après la mise en ligne</small></span></div>`;
    return `<a class="nav-evo" href="#evolution" data-go="evolution" ${S.view === 'evolution' ? 'aria-current="page"' : ''}><span class="ne-i">${ic('arrow')}</span><span class="ne-t"><strong>Évolution</strong><small>${evoOn(p) ? 'Visio, bilans et axes du mois' : 'Faire progresser le site chaque mois'}</small></span></a>`;
  }
  const monthName = (m) => cap(new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(m + '-15T12:00:00')));
  const AX_CHIP = { todo: '<span class="chip idle">Prévu</span>', on: '<span class="chip hl">En cours</span>', done: '<span class="chip ok">Fait</span>' };
  function axWho(w) { if (w === 'client') return R('Vous', 'Toi'); if (w === 'both') return R('L’agence et vous', 'L’agence et toi'); const u = S.team.find((x) => x.id === w); return u ? u.name.split(' ')[0] : 'L’agence'; }
  function evoMeeting(p, compact) {
    const e = p.evo, m = e.meeting || {}, open = (e.reschedule || []).find((r) => r.status === 'open');
    return `<section class="next evo-meet" aria-labelledby="evm"><div><div class="k">Prochaine visio mensuelle</div><h2 id="evm">${m.when ? esc(cap(fmtTime(m.when))) : 'Date à fixer ensemble'}</h2>
      <p>${esc(m.mode || 'Visio de pilotage')} : on lit les chiffres du mois, on fait le point sur les axes en cours et on décide des priorités.</p>
      ${open ? `<div class="meta">Demande de changement envoyée le ${fmt(open.at, { day: 'numeric', month: 'long' })} : l’équipe ${R('vous', 'te')} propose un créneau très vite.</div>` : ''}</div>
      <div class="evo-a">${compact ? `<a class="btn" href="#evolution" data-go="evolution">Ouvrir l’espace Évolution ${ic('arrow')}</a>` : ''}${!open ? `<button class="${compact ? 'ghost on-dark' : 'btn'}" data-act="rs-open" aria-expanded="${!!S.rsOpen}">Demander un autre créneau</button>` : ''}</div></section>
      ${S.rsOpen && !open ? `<form class="panel form" data-form="reschedule"><div class="field"><label for="rs-t">Les créneaux qui ${R('vous', 't’')}arrangent</label><textarea id="rs-t" rows="2" placeholder="ex. Mardi ou jeudi matin, la semaine prochaine"></textarea></div><div class="inline"><button class="btn btn-primary" type="submit">Envoyer à l’équipe</button><button class="btn btn-line" type="button" data-act="rs-open">Annuler</button></div></form>` : ''}`;
  }
  function vEvolution() {
    const p = S.project, e = p.evo || {};
    const pend = (p.proposals || []).filter((x) => x.status === 'sent');
    const propCard = pend.length ? `<a class="newmsg" href="#proposition" data-go="proposition"><span class="grow"><strong>${R('Une proposition vous attend', 'Une proposition t’attend')}</strong><span>${esc(pend[0].title)}</span></span><span class="btn btn-primary btn-sm">Lire et signer</span></a>` : '';
    if (!evoOn(p)) return `<div class="head"><div><h1>Évolution</h1><p class="lead">Faire progresser ${R('votre', 'ton')} site, mois après mois</p></div></div>${propCard}
      <section class="panel"><div class="panel-head"><h2>${ic('arrow')}Ce que comprend l’Évolution</h2></div>
        <ol class="ob-list evo-inc">${[['Une visio de pilotage par mois', 'On lit les chiffres ensemble et on décide des priorités.'], ['Un bilan mensuel', 'Ce qui a été fait, ce que disent les chiffres, ce qu’on fait ensuite.'], ['Un plan d’amélioration à jour', 'Chaque amélioration avec son responsable, son échéance et son avancement.'], ['Les interventions du mois', 'Pages, formulaires, référencement, visuels : on améliore ce qui rapporte.']].map(([t, d], i) => `<li class="li"><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><strong>${t}</strong><span>${d}</span></div></li>`).join('')}</ol>
        <div class="inline"><a class="btn btn-primary" href="${esc(CALF())}" target="_blank" rel="noopener">En parler en 30 minutes ${ic('arrow')}</a></div></section>`;
    const ax = (e.axes || []).slice().sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || ({ on: 0, todo: 1, done: 2 }[a.status] - { on: 0, todo: 1, done: 2 }[b.status]));
    const reps = e.reports || [], openRp = S.rpOpen || (reps[0] && reps[0].id);
    return `<div class="head"><div><h1>Évolution</h1><p class="lead">Depuis le ${fmt(e.since, { day: 'numeric', month: 'long', year: 'numeric' })} · une visio et un bilan chaque mois</p></div></div>
      ${evoMeeting(p)}
      ${propCard}
      <section class="panel" aria-labelledby="ax-h"><div class="panel-head"><h2 id="ax-h">${ic('ok')}Améliorations en cours</h2><span class="small muted num">${ax.filter((a) => a.status === 'done').length} sur ${ax.length} faits</span></div>
        <ul class="list plain">${ax.map((a) => `<li class="row ax-row ${a.status}"><div class="grow"><div class="title">${a.priority ? '<span class="chip warn">Priorité du mois</span> ' : ''}${esc(a.t)}</div>${a.effect ? `<div class="sub">Effet attendu : ${esc(a.effect)}</div>` : ''}<div class="sub">${esc(axWho(a.who))}${a.due ? ' · ' + (a.status === 'done' ? 'fait' : 'prévu pour le') + ' ' + fmt(a.due, { day: 'numeric', month: 'long' }) : ''}</div></div>${AX_CHIP[a.status]}</li>`).join('') || '<li class="muted">Les axes du mois arrivent après la première visio.</li>'}</ul></section>
      <section class="panel" aria-labelledby="rp-h"><div class="panel-head"><h2 id="rp-h">${ic('doc')}Bilans mensuels</h2><span class="aside">Tous les mois, au même endroit</span></div>
        <div class="reports">${reps.map((r) => { const f = r.fileId && p.files.find((x) => x.id === r.fileId), url = f && API.fileUrl(f), open = r.id === openRp;
          const doc = r.doc ? asset(r.doc) : url, dname = `Bilan ${monthName(r.month)} ${p.client}.pdf`.replace(/[^\w\u00C0-\u017F .-]/g, "");
          return `<article class="rp ${open ? 'open' : ''}"><div class="rp-row"><button class="rp-h" data-act="rp-open" data-id="${esc(r.id)}" aria-expanded="${open}"><span class="k">${esc(monthName(r.month))}</span><strong>${esc(r.title)}</strong></button>
            ${doc ? `<div class="rp-a"><button class="btn btn-line btn-sm" data-act="doc-view" data-src="${esc(doc)}" data-title="${esc('Bilan ' + monthName(r.month))}">${ic('eye')}Consulter<span class="sr"> le bilan ${esc(monthName(r.month))}</span></button><a class="btn btn-line btn-sm" href="${esc(doc)}" download="${esc(dname)}">${ic('down')}<span class="sr">Télécharger le bilan ${esc(monthName(r.month))}</span><span aria-hidden="true">PDF</span></a></div>` : f ? `<div class="rp-a"><button class="btn btn-line btn-sm" data-act="toast" data-msg="Fichier d’exemple : rien à ouvrir.">${ic('eye')}Consulter</button></div>` : ''}</div>
            ${open ? `<div class="rp-b">${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
              ${r.stats.length ? `<div class="rp-stats">${r.stats.map(([v, l, d]) => `<div><span class="v num">${esc(v)}</span><span class="l">${esc(l)}</span>${d ? `<span class="d">${esc(d)}</span>` : ''}</div>`).join('')}</div>` : ''}
              ${r.done.length ? `<h3 class="rp-t">Le travail réalisé</h3><ol class="rp-done">${r.done.map(([t, d]) => `<li><strong>${esc(t)}</strong>${d ? `<span>${esc(d)}</span>` : ''}</li>`).join('')}</ol>` : ''}
              </div>` : ''}</article>`; }).join('') || '<p class="muted">Le premier bilan arrive à la fin du premier mois.</p>'}</div></section>
      ${(e.next || []).length ? `<section class="panel" aria-labelledby="nx-h"><div class="panel-head"><h2 id="nx-h">${ic('cal')}Les mois suivants</h2></div><div class="months">${e.next.map(([m, t]) => `<div><strong>${esc(m)}</strong><p>${esc(t)}</p></div>`).join('')}</div></section>` : ''}`;
  }

  function monthlyReport() {
    const rp = (S.project.reports || [])[0]; if (!rp) return '';
    const mName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(rp.month + '-15'));
    const n = (x) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(x).replace(/\u202f/g, ' ');
    return `<section class="panel" aria-labelledby="bm"><div class="panel-head"><h2 id="bm">${ic('map')}Bilan de ${esc(mName)}</h2><span class="aside">Google Analytics et Search Console, comparé au mois précédent</span></div>
      <div class="kpis">${rp.stats.map(([l, v, pv]) => { const better = /Position/.test(l) ? pv != null && v < pv : pv != null && v > pv, d = pv != null && pv !== 0 ? Math.round(((v - pv) / pv) * 100) : null;
        return `<div class="kpi"><span class="v num">${n(v)}</span><span class="l">${esc(l)}</span>${pv != null ? `<span class="small ${better ? 'up' : v === pv ? '' : 'down'}">${/Position/.test(l) ? (better ? 'meilleure que' : 'contre') + ' ' + n(pv) : (d > 0 ? '+' : '') + d + ' %'} <span class="sr">par rapport au mois précédent</span></span>` : ''}</div>`; }).join('')}</div></section>`;
  }
  /* Kit de lancement : les 60 jours après la mise en ligne. */
  function launchKit() {
    const p = S.project; if (!p.deliveredAt || p.offer !== 'site' || Date.now() - new Date(p.deliveredAt) > 60 * 864e5) return '';
    const site = (p.links.site || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const post = S.post ?? `Notre nouveau site est en ligne : ${site}\n\nOn voulait un site qui nous ressemble et qui parle à nos clients. Merci à l’agence Orem pour l’accompagnement, de la stratégie à la mise en ligne.\n\nVos retours nous intéressent !`;
    return `<section class="panel" aria-labelledby="lk"><div class="panel-head"><h2 id="lk">${ic('globe')}Kit de lancement</h2><span class="aside">Pour annoncer ${R('votre', 'ton')} nouveau site</span></div>
      ${p.links.old ? `<div class="ba"><a class="ba-c" href="${esc(p.links.old)}" target="_blank" rel="noopener"><span class="k">Avant</span><strong>L’ancien site</strong><span class="small muted">${esc(p.links.old.replace(/^https?:\/\//, ''))}</span></a><a class="ba-c now" href="${esc(p.links.site)}" target="_blank" rel="noopener"><span class="k">Après</span><strong>${esc(site)}</strong><span class="small">En ligne depuis le ${fmt(p.deliveredAt, { day: 'numeric', month: 'long' })}</span></a></div>` : ''}
      <div class="field"><label for="lk-post">Post LinkedIn, prêt à copier</label><textarea id="lk-post" rows="5" data-post="1">${esc(post)}</textarea></div>
      <div class="inline"><button class="btn btn-primary btn-sm" data-act="copypost">${ic('copy')}Copier le post</button><a class="btn btn-line btn-sm" href="#biblio" data-go="biblio">${ic('eye')}Visuels du site</a>${(p.tools || []).includes('signature') ? `<button class="btn btn-line btn-sm" data-tool="signature">${ic('mail')}Signature e-mail</button>` : ''}</div></section>`;
  }

  /* ---------- Cloche de notifications (client) ---------- */
  function bell() {
    const n = unreadInbox();
    return `<button class="icon-btn bell" data-act="bell" aria-expanded="${!!S.bellOpen}" aria-controls="bell-pop" aria-label="Notifications${n ? ', ' + n + ' non lue' + (n > 1 ? 's' : '') : ''}" title="Notifications">${ic('bell')}${n ? `<span class="badge" aria-hidden="true">${n}</span>` : ''}</button>`;
  }
  function bellPop() {
    if (!S.bellOpen || isAdmin()) return '';
    const L = (S.inbox || []).slice(0, 8);
    return `<div class="bell-pop" id="bell-pop" role="region" aria-label="Notifications"><div class="bell-h"><strong>Notifications</strong>${unreadInbox() ? '<button class="ghost" data-act="bell-read">Tout marquer comme lu</button>' : ''}</div>
      <ul class="list plain">${L.map((n) => `<li><button class="row inbox-row ${n.read ? '' : 'unread'}" data-cnotif="${esc(n.id)}"><span class="grow"><span class="title">${esc(n.text)}</span><span class="sub">${ago(n.at)}</span></span>${n.read ? '' : '<span class="dot-new" aria-hidden="true"></span><span class="sr">Non lu</span>'}</button></li>`).join('') || `<li class="muted" style="padding:12px">Rien de nouveau. On ${R('vous', 'te')} prévient ici et par e-mail.</li>`}</ul>
      <div class="bell-f"><a href="#preferences" data-go="preferences">Régler mes notifications</a></div></div>`;
  }
  function vPreferences() {
    const pr = S.me.prefs || { mail: true, weekly: true };
    return `<div class="head"><div><h1>Mes notifications</h1><p class="lead">${esc(S.me.email)}</p></div></div>
      <form class="panel form" data-form="cprefs"><fieldset class="field" style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:500;margin-bottom:10px">Par e-mail</legend>
        <div class="ob-pref"><label><input type="checkbox" id="cp-mail" ${pr.mail !== false ? 'checked' : ''}> Quand on a besoin de ${R('vous', 'toi')} : validation, nouveau livrable, message, rappel</label>
        <label><input type="checkbox" id="cp-week" ${pr.weekly !== false ? 'checked' : ''}> Le point de la semaine, dès que l’équipe le publie</label></div></fieldset>
        <p class="hint">Dans l’espace, la cloche montre toujours tout.</p>
        <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer</button></div></form>`;
  }

  /* ---------- Fin de projet : remise, avis ---------- */
  function handoverPanel() {
    const p = S.project, H = p.handover || [];
    if (!H.length || !p.deliveredAt) return '';
    const done = H.filter((h) => h.done).length;
    return `<section class="panel" aria-labelledby="hv"><div class="panel-head"><h2 id="hv">${ic('ok')}Remise du projet</h2><span class="small muted num">${done} sur ${H.length}</span></div>
      <ul class="list plain">${H.map((h) => `<li class="row ${h.done ? 'done' : ''}"><span class="check ${h.done ? 'done' : ''}" role="img" aria-label="${h.done ? 'Fait' : 'À faire'}">${h.done ? ic('check') : ''}</span><div class="grow"><div class="title" style="font-weight:400">${esc(h.t)}</div></div></li>`).join('')}</ul></section>`;
  }
  // L'avis est demandé une fois le projet livré depuis au moins 7 jours : le client a eu le temps de s'en servir.
  /* Avis en fin de projet : 4 ou 5 étoiles, on invite à publier sur Google ; 3 ou moins, un questionnaire de bilan
     pour comprendre ce qui n'a pas marché, et proposer d'en parler de vive voix. */
  function reviewPanel() {
    const p = S.project; if (!p.deliveredAt || Date.now() - new Date(p.deliveredAt) < 7 * 864e5) return '';
    const rv = p.review, url = cfg().reviewUrl;
    const stars = (n) => `<span class="small muted">${'★'.repeat(n)}${'☆'.repeat(5 - n)}<span class="sr"> ${n} sur 5</span></span>`;
    if (rv) return rv.score >= 4
      ? `<section class="panel" aria-labelledby="rv"><div class="panel-head"><h2 id="rv">${ic('ok')}Merci pour ${R('votre', 'ton')} avis</h2>${stars(rv.score)}</div>
        ${rv.text ? `<blockquote class="muted">« ${esc(rv.text)} »</blockquote>` : ''}
        ${url ? `<p style="margin-top:12px">${rv.google ? `Merci de ${R('l’avoir', 'l’avoir')} publié sur Google.` : `${R('Vous pouvez', 'Tu peux')} encore le publier sur Google : c’est ce qui aide le plus une agence comme la nôtre.`}</p>${rv.google ? '' : `<div style="margin-top:12px"><a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener" data-act="rv-google">Publier l’avis sur Google ${ic('arrow')}</a></div>`}` : ''}</section>`
      : `<section class="panel" aria-labelledby="rv"><div class="panel-head"><h2 id="rv">${ic('ok')}Merci pour ${R('votre', 'ta')} franchise</h2>${stars(rv.score)}</div>
        <p>L’équipe a bien reçu ${R('vos', 'tes')} réponses et les lit avec attention.${rv.survey && rv.survey.call ? ` On ${R('vous', 't’')}appelle dans les 48 heures ouvrées pour en parler.` : ''}</p></section>`;
    const sc = S.rvScore || 0;
    const starsIn = `<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:500;margin-bottom:8px">${R('Votre', 'Ta')} note sur l’ensemble du projet</legend>
        <div class="stars">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rv-s" value="${n}" class="sr" ${sc === n ? 'checked' : ''}><span aria-hidden="true">${n <= sc ? '★' : '☆'}</span><span class="sr">${n} sur 5</span></label>`).join('')}</div></fieldset>`;
    const head = `<div class="panel-head" style="margin:0"><h2 id="rv">${ic('chat')}${R('Votre', 'Ton')} avis sur le projet</h2><span class="aside">Deux minutes, et ça compte beaucoup pour nous</span></div>`;
    if (!sc) return `<section class="panel form" aria-labelledby="rv">${head}${starsIn}</section>`;
    if (sc >= 4) return `<form class="panel form" data-form="review" aria-labelledby="rv">${head}${starsIn}
      <p class="rv-ok">${sc === 5 ? 'Merci, ça nous touche beaucoup !' : 'Merci !'} ${url ? `Le plus beau cadeau pour l’agence : ${R('le dire sur Google', 'le dire sur Google')}, en deux clics.` : ''}</p>
      <div class="field"><label for="rv-t">En une ou deux phrases, ce qui ${R('vous', 't’')}a plu</label><textarea id="rv-t" rows="3" placeholder="ex. Une équipe à l’écoute, un site clair qui nous ramène des demandes."></textarea>${url ? `<p class="hint">${R('Votre', 'Ton')} texte sera copié : il ${R('vous', 'te')} suffira de le coller sur Google.</p>` : ''}</div>
      <label class="small"><input type="checkbox" id="rv-p"> J’accepte que ce témoignage soit publié par l’agence, avec mon prénom et le nom de l’entreprise</label>
      <div class="inline">${url ? `<button class="btn btn-primary" type="submit" value="google">Publier sur Google ${ic('arrow')}</button><button class="btn btn-line" type="submit" value="send">Envoyer à l’équipe seulement</button>` : `<button class="btn btn-primary" type="submit" value="send">Envoyer mon avis</button>`}</div></form>`;
    const ax = Core.REVIEW_AXES, phases = (p.phases || []).map((ph) => phName(ph));
    return `<form class="panel form" data-form="review" aria-labelledby="rv">${head}${starsIn}
      <p class="rv-ko">Merci de ${R('nous le dire', 'nous le dire')}. Quelques questions pour comprendre ce qui n’a pas fonctionné : ${R('vos', 'tes')} réponses vont à l’équipe uniquement, jamais en ligne.</p>
      <div class="field"><label for="rv-bad">Ce qui n’a pas fonctionné</label><textarea id="rv-bad" rows="3" aria-required="true"></textarea></div>
      <div class="field"><label for="rv-good">Ce qui a bien fonctionné, malgré tout</label><textarea id="rv-good" rows="2"></textarea></div>
      <fieldset class="field rv-axes"><legend>Note par point (1 = pas du tout, 5 = très bien)</legend>${ax.map(([k, l]) => `<div class="rv-ax" role="radiogroup" aria-label="${esc(l)}"><span>${esc(l)}</span><span class="rv-n">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rv-a-${k}" value="${n}"><span>${n}</span></label>`).join('')}</span></div>`).join('')}</fieldset>
      <div class="field"><label for="rv-ph">À quel moment ça a coincé ?</label><select id="rv-ph"><option value="">Je ne sais pas</option>${phases.map((x) => `<option>${esc(x)}</option>`).join('')}<option>Après la mise en ligne</option><option>Tout au long du projet</option></select></div>
      <div class="field"><label for="rv-rec">Qu’aurait-il fallu pour que ${R('vous nous recommandiez', 'tu nous recommandes')} ?</label><textarea id="rv-rec" rows="2"></textarea></div>
      <label class="opt"><input type="checkbox" id="rv-call" checked> J’aimerais qu’on en parle de vive voix</label>
      <div><button class="btn btn-primary" type="submit" value="send">Envoyer à l’équipe</button></div></form>`;
  }

  /* ---------- Agence : mise en ligne et fin de projet ---------- */
  const TOOL_LBL = { teaser: 'Fiche de présentation d’un bien', brand: 'Kit de marque', signature: 'Signature e-mail', request: 'Demandes sur le site', webflow: 'Vidéos Webflow' };
  function tLivraison() {
    const p = S.project, site = p.offer === 'site', R0 = p.results || { period: '', stats: [] }, B = p.brand || { colors: [], fonts: [] };
    const pv = p.validations.find((v) => v.key === 'pv');
    const H = p.handover || [];
    const head = p.deliveredAt
      ? `<section class="panel"><div class="panel-head"><h2>${ic('ok')}${site ? 'Site en ligne' : 'Projet livré'} depuis le ${fmt(p.deliveredAt, { day: 'numeric', month: 'long', year: 'numeric' })}</h2><button class="btn btn-line btn-sm" data-act="undeliver">Annuler la mise en ligne</button></div>
          <p class="muted">L’accueil du client montre ${site ? 'son site en ligne' : 'le projet livré'}, ses résultats et ses outils. L’étape « Mesurer » est en cours.</p></section>`
      : `<form class="panel form" data-form="deliver"><div class="panel-head" style="margin:0"><h2>${ic('globe')}${site ? 'Mettre en ligne' : 'Livrer le projet'}</h2><span class="aside">Les trois premières étapes passent en « Terminé »</span></div>
          ${pv && pv.status !== 'approved' ? `<div class="alert">${ic('alert')}<div>Le procès-verbal (« ${esc(pv.t)} ») n’est pas encore validé par le client. ${pv.status === 'wait' ? 'Demandez-le dans l’onglet Validations.' : 'Il est chez le client.'}</div></div>
            <div class="field"><label for="dl-f">Livrer quand même : pourquoi ? (gardé dans l’historique)</label><input id="dl-f" type="text" placeholder="ex. Réception validée par téléphone le 14/10"></div>` : pv ? `<p class="small muted">Procès-verbal validé par ${esc(who((pv.history.filter((h) => h.action === 'approved').pop() || {}).by))} le ${fmt((pv.history.filter((h) => h.action === 'approved').pop() || {}).at, { day: 'numeric', month: 'long' })}.</p>` : ''}
          <div class="line"><div class="field"><label for="dl-w">Date de mise en ligne</label><input id="dl-w" type="date" value="${dayKey(Date.now())}"></div>${site ? `<div class="field"><label for="dl-s">Adresse du site</label><input id="dl-s" type="url" value="${esc(p.links.site || p.links.preview || '')}" placeholder="https://www.exemple.fr"></div>` : ''}</div>
          <p class="hint">Le client reçoit un e-mail et son accueil bascule sur le projet livré. Pensez à renseigner les résultats et la marque ci-dessous.</p>
          <div><button class="btn btn-primary" type="submit">${ic('globe')}${site ? 'Mettre en ligne' : 'Marquer comme livré'}</button></div></form>`;
    const PL = p.prelaunch || [];
    return `${!p.deliveredAt && PL.length ? `<section class="panel"><div class="panel-head"><h2>${ic('ok')}Avant la mise en ligne</h2><span class="small muted num">${PL.filter((h) => h.done).length} sur ${PL.length}</span></div>
        <div class="ob-pref">${PL.map((h, i) => `<label><input type="checkbox" data-prelaunch="${i}" ${h.done ? 'checked' : ''}> ${esc(h.t)}</label>`).join('')}</div><p class="hint">Liste interne à l’agence, invisible pour le client.</p></section>` : ''}
      ${head}
      ${p.deliveredWithoutPv ? `<p class="small muted">Livré sans procès-verbal : « ${esc(p.deliveredWithoutPv.reason)} » (${esc(who(p.deliveredWithoutPv.by))}, ${fmt(p.deliveredWithoutPv.at, { day: 'numeric', month: 'long' })}).</p>` : ''}
      ${H.length ? `<section class="panel"><div class="panel-head"><h2>${ic('ok')}Checklist de remise</h2><span class="small muted num">${H.filter((h) => h.done).length} sur ${H.length}</span></div>
        <div class="ob-pref">${H.map((h, i) => `<label><input type="checkbox" data-handover="${i}" ${h.done ? 'checked' : ''}> ${esc(h.t)}</label>`).join('')}</div><p class="hint">Visible par le client dans « Étapes » une fois le projet livré.</p></section>` : ''}
      <form class="panel form" data-form="results" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('map')}Résultats affichés au client</h2><span class="aside">Une ligne par chiffre : valeur | libellé</span></div>
        <div class="field"><label for="rs-p">Période</label><input id="rs-p" type="text" value="${esc(R0.period)}" placeholder="Depuis la mise en ligne, le 15 juin 2026"></div>
        <div class="field"><label for="rs-s">Chiffres (6 au maximum)</label><textarea id="rs-s" rows="4" placeholder="~5 | demandes qualifiées par semaine">${esc(R0.stats.map(([v, l]) => v + ' | ' + l).join('\n'))}</textarea></div>
        <div><button class="btn btn-line btn-sm" type="submit">Enregistrer les résultats</button></div></form>
      <form class="panel form" data-form="brand" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('eye')}Marque du client</h2><span class="aside">Kit de marque, fiche teaser, signature e-mail</span></div>
        <div class="line"><div class="field"><label for="br-c">Couleurs : nom | #code</label><textarea id="br-c" rows="4" placeholder="Cognac | #A8552D">${esc(B.colors.map(([n, h]) => n + ' | ' + h).join('\n'))}</textarea></div>
        <div class="field"><label for="br-f">Typographies : usage | police</label><textarea id="br-f" rows="4" placeholder="Titres | Trykker">${esc(B.fonts.map(([r, n]) => r + ' | ' + n).join('\n'))}</textarea></div></div>
        <div><button class="btn btn-line btn-sm" type="submit">Enregistrer la marque</button></div></form>
      <form class="panel form" data-form="tools" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('plus')}Boîte à outils du client</h2></div>
        <div class="ob-pref">${Object.entries(TOOL_LBL).map(([k, l]) => `<label><input type="checkbox" name="tl" value="${k}" ${(p.tools || []).includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div>
        <div><button class="btn btn-line btn-sm" type="submit">Enregistrer les outils</button></div></form>
      <form class="panel form" data-form="tutorials" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('play')}Vidéos de formation</h2><span class="aside">Une ligne par vidéo : titre | durée | lien Loom</span></div>
        <div class="field"><label for="tu-l">Vidéos</label><textarea id="tu-l" rows="5">${esc((p.tutorials || []).map((t) => [t.t, t.d, t.url].join(' | ')).join('\n'))}</textarea></div>
        <p class="hint">Sans lien, la vidéo s’affiche « en préparation » chez le client.</p>
        <div><button class="btn btn-line btn-sm" type="submit">Enregistrer les vidéos</button></div></form>
      <section class="panel"><div class="panel-head"><h2>${ic('chat')}Avis du client</h2></div>
        ${p.review ? `<p><strong>${p.review.score}/5</strong> · ${fmt(p.review.at, { day: 'numeric', month: 'long' })}${p.review.public ? ' · <span class="chip ok">Témoignage publiable</span>' : ' · <span class="chip idle">Usage interne</span>'}</p>${p.review.text ? `<blockquote class="muted" style="margin-top:8px">« ${esc(p.review.text)} »</blockquote>` : ''}`
          : `<p class="muted">${p.deliveredAt ? 'Demandé au client 7 jours après la mise en ligne, sur son accueil.' : 'Demandé au client 7 jours après la mise en ligne.'}${cfg().reviewUrl ? '' : ' Ajoutez le lien d’avis Google dans Réglages pour le lui proposer.'}</p>`}</section>
      <section class="panel" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between"><div style="flex:1 1 260px;min-width:0"><div class="panel-head" style="margin:0"><h2>${ic('lock')}Archiver l’espace</h2></div><p class="muted" style="margin-top:4px">Le client garde l’accès en lecture seule : fichiers, factures et bibliothèque restent téléchargeables.</p></div>
        <div class="inline">${zipBtn()}${p.archivedAt ? `<button class="btn btn-line" data-act="unarchive">Désarchiver</button>` : `<button class="btn btn-line" data-act="archive">Archiver</button>`}</div></section>`;
  }
  const zipBtn = (cls = 'btn btn-line') => { const u = API.exportUrl(S.project.id); return u ? `<a class="${cls}" href="${u}" download>${ic('down')}Tout télécharger (ZIP)</a>` : `<button class="${cls}" data-act="toast" data-msg="Dans la démo, il n’y a pas de fichiers réels à exporter.">${ic('down')}Tout télécharger (ZIP)</button>`; };
  const lines = (t, n) => String(t || '').split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((l) => l[0]).map((l) => l.slice(0, n));

  /* Agrandissement d'une image */
  function lightbox() {
    if (!S.zoom) return '';
    const Z = S.zoom, pins = Z.pin ? (S.project.pins || []).filter((x) => x.img === Z.key) : [];
    const v = (S.project.versions || [])[0];
    return `<div class="lb" role="dialog" aria-modal="true" aria-label="${esc(Z.title)}" data-act="unzoom"><figure>
      <div class="pin-wrap">${Z.pin ? `<button class="pin-area" data-act="pin-here" aria-label="Commenter un endroit de l’écran : ${esc(Z.title)}. Flèches pour choisir l’endroit, Entrée pour commenter." aria-describedby="pin-pos"><img src="${esc(Z.src)}" alt="">${Z.kb ? `<span class="pin-kb" style="left:${Z.kb.x}%;top:${Z.kb.y}%"></span>` : ''}</button><span class="sr" id="pin-pos" aria-live="polite">${Z.kb ? `Repère à ${Math.round(Z.kb.x)} % de la largeur et ${Math.round(Z.kb.y)} % de la hauteur` : ''}</span>` : `<img src="${esc(Z.src)}" alt="${esc(Z.title)}">`}
        ${pins.map((x, i) => `<span class="pin ${x.status}" style="left:${x.x}%;top:${x.y}%" title="${esc(x.text)}">${i + 1}</span>`).join('')}
        ${Z.at ? `<form class="pin-form" data-form="pin" style="left:${Math.min(Z.at.x, 70)}%;top:${Math.min(Z.at.y, 80)}%"><label class="sr" for="pin-t">${R('Votre', 'Ton')} commentaire</label><textarea id="pin-t" rows="2" placeholder="${R('Votre', 'Ton')} commentaire à cet endroit"></textarea><div class="inline"><button class="btn btn-primary btn-sm" type="submit">Ajouter le commentaire</button><button class="ghost" type="button" data-act="pin-cancel">Annuler</button></div></form>` : ''}</div>
      <figcaption>${esc(Z.title)}${Z.pin ? ` · ${pins.length} commentaire${pins.length > 1 ? 's' : ''}${v ? ' · ' + esc(v.label) : ''}` : ''}</figcaption>
      ${pins.length ? `<ol class="pin-list">${pins.map((x) => `<li class="${x.status}"><span>${esc(x.text)}</span><span class="small">${esc(who(x.by))} · ${fmt(x.at)}${x.status === 'resolved' ? ' · traité' : ''}</span></li>`).join('')}</ol>` : ''}</figure>
      <button class="lb-x" data-act="unzoom" aria-label="Fermer">×</button></div>`;
  }
  function pinsPanel() {
    const P = S.project.pins || []; if (!P.length) return '';
    const open = P.filter((x) => x.status === 'open').length;
    return `<section class="panel"><div class="panel-head"><h2>${ic('chat')}Commentaires sur les écrans</h2><span class="aside">${open} en cours · ${P.length - open} traité${P.length - open > 1 ? 's' : ''}</span></div><ul class="list plain">${P.map((x) => `<li class="row"><span class="chip ${x.status === 'open' ? 'warn' : 'ok'}">${x.status === 'open' ? 'En cours' : 'Traité'}</span><div class="grow"><div class="title" style="font-weight:400">${esc(x.text)}</div><div class="sub">${esc(who(x.by))} · ${fmt(x.at)}${x.version ? ' · ' + esc(x.version) : ''}</div></div>${isAdmin() && !S.preview ? `<button class="btn btn-line btn-sm" data-act="pin-resolve" data-id="${esc(x.id)}">${x.status === 'open' ? 'Marquer traité' : 'Rouvrir'}</button>` : ''}</li>`).join('')}</ul></section>`;
  }

  /* ---------- Agence : messages et liens ---------- */
  function tMessages() {
    const p = S.project, list = (p.messages || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at));
    return `<section class="panel"><div class="panel-head"><h2>${ic('chat')}Conversation avec ${esc(p.contactName || p.client)}</h2></div>
      <div class="thread" tabindex="0" role="log" aria-label="Conversation">${list.map((m) => msgBubbleAdmin(m)).join('') || '<p class="muted">Aucun message.</p>'}</div>
      <form class="form" data-form="amsg" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line)">
        <div class="field"><label for="am-t">Message</label><textarea id="am-t" rows="2" placeholder="Bonjour ${esc(p.contactName || '')}, …"></textarea></div>
        <div class="line"><div class="field"><label for="am-u">Vidéo Loom (facultatif)</label><input id="am-u" type="url" placeholder="https://www.loom.com/share/…"></div><div class="field"><label for="am-l">Titre de la vidéo</label><input id="am-l" type="text" placeholder="ex. Présentation des maquettes"></div></div>
        <label class="opt"><input type="checkbox" id="am-team"> Signer au nom de l’équipe (« L’équipe Orem »)</label>
        <div><button class="btn btn-primary" type="submit">Envoyer au client</button></div></form></section>`;
  }
  function tDemandes() {
    const p = S.project, R0 = p.requests || [];
    return `<section class="panel"><div class="panel-head"><h2>${ic('plus')}Demandes d’évolution</h2><span class="aside">${R0.filter((r) => r.status === 'Nouveau').length} nouvelle${R0.filter((r) => r.status === 'Nouveau').length > 1 ? 's' : ''}</span></div><div class="list">${R0.map((r) => `<div class="row"><div class="grow"><div class="title">${esc(r.type)} · ${esc(r.priority)}</div><div class="sub">${esc(r.text)}</div><div class="sub">${esc(who(r.by))} · ${fmt(r.at, { day: 'numeric', month: 'long' })}</div></div>
        ${r.status !== 'Fait' && !(p.proposals || []).some((x) => x.from === r.id) ? `<button class="btn btn-line btn-sm" data-act="prop-from" data-id="${esc(r.id)}">Proposer un devis</button>` : (p.proposals || []).some((x) => x.from === r.id) ? '<span class="chip hl">Devis envoyé</span>' : ''}<label class="sr" for="ow-${r.id}">Pris en charge par</label><select id="ow-${r.id}" data-owner="${esc(r.id)}" style="width:auto"><option value="">Personne</option>${S.team.map((u) => `<option value="${u.id}" ${r.owner === u.id ? 'selected' : ''}>${esc(u.name.split(' ')[0])}</option>`).join('')}</select><label class="sr" for="rq-${r.id}">Statut de la demande</label><select id="rq-${r.id}" data-req="${esc(r.id)}" style="width:auto">${['Nouveau', 'Proposé', 'En cours', 'Fait'].map((x) => `<option ${r.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`).join('') || '<p class="muted">Aucune demande.</p>'}</div></section>`;
  }
  function msgBubbleAdmin(m) {
    const u = person(m.by), agency = !!m.fromAgency;
    return `<div class="msg ${agency ? 'mine' : ''}">${!agency ? `<span class="avatar ph">${esc((u.name || '?')[0])}</span>` : ''}<div class="bubble"><div class="meta-l"><strong>${esc(agency ? (u.name || '').split(' ')[0] : (S.people[m.by] || S.project.contactName))}</strong><span>${esc(fmt(m.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span>${m.readByAgency === false ? '<span class="chip warn">Nouveau</span>' : ''}${agency && m.readByClient === false ? '<span class="chip idle">Pas encore lu</span>' : agency ? '<span class="chip ok">Lu</span>' : ''}</div><p>${esc(m.text)}</p>${m.loom ? videoCard(m) : ''}</div></div>`;
  }
  function tLiens() {
    const L = S.project.links || {};
    return `<form class="panel form" data-form="links" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('figma')}Liens du projet</h2><span class="aside">Visibles côté client dans « Maquettes et visuels » et sur l’accueil</span></div>
      <div class="field"><label for="lk-f">Fichier Figma (lecture seule)</label><input id="lk-f" type="url" value="${esc(L.figma)}" placeholder="https://www.figma.com/design/…"></div>
      <div class="field"><label for="lk-p">Prototype Figma</label><input id="lk-p" type="url" value="${esc(L.proto)}" placeholder="https://www.figma.com/proto/…"></div>
      <div class="field"><label for="lk-w">Prévisualisation Webflow</label><input id="lk-w" type="url" value="${esc(L.preview)}" placeholder="https://….webflow.io"></div>
      <div class="field"><label for="lk-s">Site en ligne</label><input id="lk-s" type="url" value="${esc(L.site)}" placeholder="https://www.…"></div>
      <div class="field"><label for="lk-o">Ancien site (pour l’avant/après du kit de lancement)</label><input id="lk-o" type="url" value="${esc(L.old || '')}" placeholder="https://…"></div>
      <p class="hint">Partagez le fichier Figma en lecture seule : le client le voit sans compte Figma.</p>
      <div><button class="btn btn-primary" type="submit">Enregistrer</button></div></form>
    <form class="panel form" data-form="version"><div class="panel-head" style="margin:0"><h2>${ic('figma')}Versions des maquettes</h2><span class="aside">${(S.project.versions || []).map((v) => esc(v.label)).join(', ') || 'Aucune'}</span></div>
      <div class="line"><div class="field"><label for="ve-t">Ce qui change</label><input id="ve-t" type="text" placeholder="ex. Maquettes après vos retours"></div><div class="field"><label for="ve-u">Lien Figma</label><input id="ve-u" type="url" value="${esc(L.proto || L.figma || '')}"></div></div>
      <div><button class="btn btn-line btn-sm" type="submit">Publier la version ${(S.project.versions || []).length + 1}</button></div></form>
    ${pinsPanel()}`;
  }


  /* ---------- Équipe : boîte de réception ---------- */
  const TYPE_ICO = { files: 'up', messages: 'chat', validations: 'ok', requests: 'plus', tasks: 'check', activity: 'eye' };
  const TYPE_LBL = { files: 'Fichier', messages: 'Message', validations: 'Validation', requests: 'Demande', tasks: 'Tâche', activity: 'Activité' };
  const unreadInbox = () => (S.inbox || []).filter((n) => !n.read).length;
  const todoInbox = () => (S.inbox || []).filter((n) => n.todo).length;
  const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 6e4); if (m < 1) return 'à l’instant'; if (m < 60) return `il y a ${m} min`; const h = Math.round(m / 60); if (h < 24) return `il y a ${h} h`; const j = Math.round(h / 24); return j === 1 ? 'hier' : `il y a ${j} jours`; };
  async function loadInbox() { try { S.inbox = (await API.inbox()).items; } catch { S.inbox = []; } }
  function vInbox() {
    const all = S.inbox || [], f = S.inboxFilter || 'todo';
    const todo = all.filter((n) => n.todo), act = all.filter((n) => !n.todo);
    let list = f === 'todo' ? todo : f === 'activity' ? act : all;
    if (S.inboxType) list = list.filter((n) => n.type === S.inboxType);
    if (S.inboxClient) list = list.filter((n) => n.projectId === S.inboxClient);
    const clients = [...new Map(all.map((n) => [n.projectId, n.client])).entries()];
    const row = (n) => `<li class="inbox-item ${n.read ? '' : 'unread'}">
        <button class="row inbox-row ${n.read ? '' : 'unread'}" data-notif="${esc(n.id)}">
          <span class="ico ${n.read ? '' : 'hl'}">${ic(TYPE_ICO[n.type] || 'eye')}</span>
          <span class="grow"><span class="title">${esc(n.text)}</span><span class="sub">${esc(n.client)} · ${TYPE_LBL[n.type] || ''} · ${ago(n.at)}${n.done ? ' · traité' : ''}</span></span>
          ${n.read ? '' : '<span class="dot-new" aria-hidden="true"></span><span class="sr">Non lu</span>'}${ic('arrow', 'width:18px;height:18px;color:var(--muted);flex:none')}</button>
        ${n.todo || n.done ? `<div class="inbox-acts">${n.todo && ['msg.post', 'request.add', 'val.changes', 'pin.add'].includes(n.act) ? `<button class="btn btn-line btn-sm" data-act="reply" data-id="${esc(n.id)}">${ic('chat')}Répondre</button>` : ''}<button class="btn btn-line btn-sm" data-act="${n.done ? 'undone' : 'done'}" data-id="${esc(n.id)}">${n.done ? 'Remettre à traiter' : ic('check') + 'Marquer comme traité'}</button></div>` : ''}
        ${S.replyTo === n.id ? `<form class="inline reply" data-form="reply" data-id="${esc(n.id)}"><label class="sr" for="rp-${n.id}">Réponse à ${esc(n.client)}</label><textarea id="rp-${n.id}" rows="2" placeholder="Votre réponse, envoyée dans l’espace du client"></textarea><button class="btn btn-primary btn-sm" type="submit">Envoyer</button></form>` : ''}</li>`;
    return `<div class="head"><div><h1>Boîte de réception</h1><p class="lead">Ce que les clients attendent de l’agence, puis l’activité de vos espaces</p></div>
      <div class="head-actions">${todo.length ? `<button class="btn btn-line" data-act="inbox-done-all">${ic('check')}Tout marquer comme traité</button>` : ''}</div></div>
      <div class="hide-m">${kpisAdmin()}</div>
      <div class="inbox-bar"><div class="cats" role="group" aria-label="Afficher">${[['todo', 'À traiter', todo.length], ['activity', 'Activité', act.length], ['all', 'Tout', all.length]].map(([k, l, n]) => `<button class="cat" data-inbox="${k}" aria-pressed="${f === k}"><strong>${l}</strong><span class="num">${n}</span></button>`).join('')}</div>
        <div class="inline filters"><label class="sr" for="ib-t">Type</label><select id="ib-t" data-ibfilter="type"><option value="">Tous les types</option>${Object.entries(TYPE_LBL).map(([k, l]) => `<option value="${k}" ${S.inboxType === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <label class="sr" for="ib-c">Client</label><select id="ib-c" data-ibfilter="client"><option value="">Tous les clients</option>${clients.map(([id, c]) => `<option value="${id}" ${S.inboxClient === id ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div></div>
      <section class="panel">${list.length ? `<ul class="list plain">${list.map(row).join('')}</ul>`
        : `<div class="empty big" style="border:0">${ic('ok')}<strong>${f === 'todo' ? 'Rien à traiter' : 'Rien ici'}</strong><span>${f === 'todo' ? 'Les messages, fichiers, demandes de modifications et demandes sur le site des clients arriveront ici' + (S.me.notify && S.me.notify.email !== 'off' ? ', et par e-mail selon vos réglages' : '') + '.' : 'Aucune notification avec ces filtres.'}</span></div>`}</section>`;
  }

  /* ---------- Équipe : tâches (v2, bento) ----------
     Maquettes validées par Louis : docs/maquettes/taches-v2. Comme « Programme & Livrables » dans Notion, pour toute
     l'équipe et tous les clients : une carte encre « Focus » sur la prochaine tâche, 4 chiffres qui filtrent la liste,
     la charge de chacun en points, les 14 prochains jours, l'avancement par client, une saisie rapide
     (@personne, demain, #client, !) et une liste où l'on coche d'un clic (annulable 5 s). */
  const TK_STATES = [['todo', 'Pas commencé'], ['doing', 'En cours'], ['done', 'Faite']];
  const tkState = () => ({ who: 'me', client: '', kind: 'all', layout: 'list', when: '', edit: null, focus: 0, more: {}, showDone: false, ...(S.tk || {}) });
  async function loadTasks() { try { S.tasks = (await API.tasks()).tasks; } catch { S.tasks = []; } }
  const TKX = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const tkPl = (n, s, p) => `${n} ${n > 1 ? p : s}`;
  const DAYMS = 864e5, tkD0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  function tkCal() { const today = tkD0(Date.now()), dow = (new Date(today).getDay() + 6) % 7; return { today, sunday: today + (6 - dow) * DAYMS, monday: today - dow * DAYMS }; }
  const tkBand = (t, c = tkCal()) => (!t.due ? 4 : tkD0(t.due) < c.today ? 0 : tkD0(t.due) === c.today ? 1 : tkD0(t.due) <= c.sunday ? 2 : 3);
  const tkOpen = (t) => t.status !== 'done' && !t.review;
  const myUrgent = () => (S.tasks || []).filter((t) => tkOpen(t) && t.who.includes(S.me.id) && tkBand(t) <= 1 && t.due).length;
  const tkUser = (id) => (S.team || []).find((u) => u.id === id);
  const tkFirst = (id) => { const u = tkUser(id); return u ? u.name.split(' ')[0] : ''; };
  const tkAv = (id) => { const u = tkUser(id); return u && IMG[u.photo] ? `<img class="av" src="${IMG[u.photo]}" alt="">` : `<span class="av" aria-hidden="true"></span>`; };
  const tkAvs = (ids) => `<span class="avs" title="${esc(ids.map(tkFirst).join(', '))}"><span class="sr">${esc(ids.map(tkFirst).join(', '))}</span>${ids.slice(0, 2).map(tkAv).join('')}${ids.length > 2 ? `<span class="more" aria-hidden="true">+${ids.length - 2}</span>` : ''}</span>`;
  const tkCap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const tkStepLetter = (t) => (t.step ? 'OREM'[Number((t.step.match(/Étape (\d)/) || [])[1] || 1) - 1] || 'O' : '');
  const tkStepName = (t) => (t.step ? (t.step.split('·')[1] || '').trim() : '');
  const tkRelDay = (d, c = tkCal()) => { const n = Math.round((tkD0(d) - c.today) / DAYMS); return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : tkD0(d) <= c.sunday ? fmt(d, { weekday: 'long' }) : fmt(d, { weekday: 'short', day: 'numeric' }); };
  const tkDoneIn = (t, from, to) => t.status === 'done' && ((t.doneAt && tkD0(t.doneAt) >= from && tkD0(t.doneAt) < to) || (!t.doneAt && t.due && tkD0(t.due) >= from && tkD0(t.due) < to));
  function tkDue(t, c = tkCal()) {
    if (t.status === 'done') return ['none', t.doneAt ? 'Faite le ' + fmt(t.doneAt, { day: 'numeric', month: 'short' }) : 'Faite'];
    if (!t.due) return ['none', 'Sans date'];
    const d = tkD0(t.due), n = Math.round((c.today - d) / DAYMS);
    if (n > 0) return ['late', `${n} j de retard`];
    if (n === 0) return ['today', 'Aujourd’hui'];
    if (n === -1) return ['', 'Demain'];
    if (d <= c.sunday) return ['', tkCap(fmt(t.due, { weekday: 'short', day: 'numeric' }))];
    return ['', fmt(t.due, { day: 'numeric', month: 'short' })];
  }
  const tkMeta = (t) => (t.kind === 'item'
    ? `<span class="orem" title="${esc(t.step)}" aria-hidden="true">${tkStepLetter(t)}</span><span class="tx">${esc(t.client)} · ${esc(t.step || '')}</span>`
    : `<span class="tx">${esc(t.client || 'Interne')}${t.note ? ` · ${esc(t.note)}` : ''}</span>`);
  const tkCheck = (t) => (t.review
    ? `<span class="ck wait" title="En attente de la validation du client"><i>${ic('cal')}</i></span>`
    : `<button class="ck ${t.status}" data-tkdone="${esc(t.id)}" aria-label="${t.status === 'done' ? `Faite. Remettre « ${esc(t.t)} » à faire` : `${t.status === 'doing' ? 'En cours. ' : ''}Marquer « ${esc(t.t)} » comme faite`}"><i>${t.status === 'done' ? ic('check') : ''}</i></button>`);
  const tkUrg = (t) => (t.urgent && t.status !== 'done' ? '<b class="chip bad sm">Urgent</b>' : '');
  /* Portée (personne, client, type) puis filtre « when » pour la liste seulement. */
  function tkScope() {
    const k = tkState(), mine = (t) => k.who === 'all' || t.who.includes(k.who === 'me' ? S.me.id : k.who);
    return (S.tasks || []).filter((t) => mine(t) && (!k.client || (k.client === 'interne' ? !t.projectId : t.projectId === k.client)) && (k.kind === 'all' || t.kind === k.kind));
  }
  function tkWhenOk(t, w, c) {
    if (!w) return true;
    if (w === 'today') return tkOpen(t) && tkBand(t, c) === 1;
    if (w === 'late') return tkOpen(t) && tkBand(t, c) === 0;
    if (w === 'next') return tkOpen(t) && t.due && tkD0(t.due) > c.today && tkD0(t.due) <= c.today + 7 * DAYMS;
    if (w === 'done') return tkDoneIn(t, c.monday, c.today + DAYMS);
    if (w.startsWith('day:')) return tkOpen(t) && t.due && tkD0(t.due) === Number(w.slice(4));
    return true;
  }
  const TK_WHEN_LBL = { today: 'Aujourd’hui', late: 'En retard', next: '7 prochains jours', done: 'Faites cette semaine' };
  const tkWhenLbl = (w) => (w.startsWith('day:') ? tkCap(fmt(Number(w.slice(4)), { weekday: 'long', day: 'numeric', month: 'long' })) : TK_WHEN_LBL[w] || '');
  function tkFocusQueue(scope, c) {
    return scope.filter(tkOpen).sort((a, b) => tkBand(a, c) - tkBand(b, c) || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (b.status === 'doing') - (a.status === 'doing') || (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15));
  }
  function tkRow(t, c) {
    const [cl, l] = tkDue(t, c);
    return `<li class="tk-r ${t.status} ${cl === 'late' ? 'late' : ''} ${S.tk && S.tk.flash === t.id ? 'is-flash' : ''}">${tkCheck(t)}<button class="tk-m" data-tkedit="${esc(t.id)}"><span class="k-t">${tkUrg(t)}<span>${esc(t.t)}</span></span><span class="s">${tkMeta(t)}</span><span class="sr">, modifier</span></button>${t.review ? '<span class="chip hl sm">Chez le client</span>' : `<span class="due ${cl}">${l}</span>`}${tkAvs(t.who)}</li>`;
  }
  function tkCard(t, c) {
    const [cl, l] = tkDue(t, c);
    const ft = t.review ? '<span class="chip hl sm">Chez le client</span>' : t.status === 'done' ? (t.doneAt ? `<span class="due none">${l}</span>` : '<span></span>') : `<span class="due ${cl}">${l}</span>`;
    return `<div class="tk-card2 ${t.status}">${tkUrg(t)}<div class="hd">${tkCheck(t)}<button class="k-t" data-tkedit="${esc(t.id)}">${esc(t.t)}</button></div><div class="s">${tkMeta(t)}</div><div class="k-ft">${ft}${tkAvs(t.who)}</div></div>`;
  }
  function vTaches() {
    const k = tkState(), c = tkCal(), all = S.tasks || [], scope = tkScope(), open = scope.filter(tkOpen);
    const late = open.filter((t) => tkBand(t, c) === 0), tod = open.filter((t) => tkBand(t, c) === 1);
    const next7 = open.filter((t) => t.due && tkD0(t.due) > c.today && tkD0(t.due) <= c.today + 7 * DAYMS).sort((a, b) => new Date(a.due) - new Date(b.due));
    const doneWeek = scope.filter((t) => tkDoneIn(t, c.monday, c.today + DAYMS)), lastWeek = scope.filter((t) => tkDoneIn(t, c.monday - 7 * DAYMS, c.monday)).length;
    const who = k.who;
    // En-tête
    const people = [['me', 'Moi', tkAv(S.me.id)], ['all', 'Équipe', `<span class="grp">${ic('team')}</span>`], ...(S.team || []).filter((u) => u.id !== S.me.id).map((u) => [u.id, tkFirst(u.id), tkAv(u.id)])];
    const cnt = (w) => all.filter((t) => tkOpen(t) && (w === 'all' || t.who.includes(w === 'me' ? S.me.id : w))).length;
    const head = `<div class="tk-head"><div class="k-tt"><h1>Tâches de l’équipe</h1><p class="lead"><b>${tkCap(fmt(c.today, { weekday: 'long', day: 'numeric', month: 'long' }))}</b> · Tâches internes et livrables de tous les clients</p></div>
      <button class="btn btn-primary" data-act="tknew">${ic('plus')}Nouvelle tâche</button>
      <div class="tk-people" role="group" aria-label="Afficher les tâches de">${people.map(([w, l, a]) => `<button data-tkwho="${esc(w)}" aria-pressed="${who === w}">${a}<span class="k-lbl">${esc(l)}</span><span class="num"><span class="sr"> : </span>${cnt(w)}<span class="sr"> ${cnt(w) > 1 ? 'tâches ouvertes' : 'tâche ouverte'}</span></span></button>`).join('')}</div></div>`;
    // Saisie rapide
    const quick = `<form class="tk-quick" data-form="tkquick" autocomplete="off">${ic('plus')}<label class="sr" for="tk-q">Ajouter une tâche</label><input id="tk-q" name="tk-q" placeholder="Ajouter une tâche" aria-describedby="tk-prev"><span class="k-ex" aria-hidden="true">Ex.&nbsp;: Relancer le devis <b>@théo</b> <b>demain</b> <b>#Lumen</b> <b>!</b></span><kbd title="Raccourci clavier" aria-hidden="true">N</kbd><button class="btn btn-primary btn-sm k-add" type="submit">Ajouter</button></form><div class="tk-preview" id="tk-prev" aria-live="polite"></div>`;
    // Focus
    const fq = tkFocusQueue(scope, c), fi = Math.min(k.focus || 0, Math.max(0, fq.length - 1)), f = fq[fi];
    const fTop = !f ? '' : (() => { const b = tkBand(f, c), n = f.due ? Math.round((c.today - tkD0(f.due)) / DAYMS) : 0; return (b === 0 ? `En retard de ${tkPl(n, 'jour', 'jours')}` : b === 1 ? 'Pour aujourd’hui' : !f.due ? 'Sans échéance' : 'Pour ' + tkRelDay(f.due, c)) + (f.urgent ? ' · Urgent' : ''); })();
    const fMeta = !f ? '' : f.kind === 'item' ? `<span class="orem" aria-hidden="true">${tkStepLetter(f)}</span>${esc(f.client)} · ${esc(tkStepName(f))}` : esc(f.client || 'Interne');
    const forWho = who === 'me' || who === 'all' ? '' : ` de ${tkFirst(who)}`;
    const focus = `<section class="tk-focus b-focus" aria-label="Prochaine tâche${esc(forWho)}">${f ? `<div class="k-top"><span>${fTop}</span><span class="k-nav">${fq.length > 1 ? `<span class="of">${fi + 1} sur ${fq.length}</span><button class="nx" data-act="tkfocusnext" aria-label="Tâche suivante">${ic('arrow')}</button>` : ''}</span></div>
      <button class="k-ft" data-tkedit="${esc(f.id)}">${esc(f.t)}</button><div class="k-meta"><span class="k-c">${fMeta}</span>${tkAvs(f.who)}</div>
      <div class="k-acts"><button class="b1" data-tkdone="${esc(f.id)}">${ic('check')}C’est fait</button>${f.status === 'todo' ? `<button class="b2" data-tkstart="${esc(f.id)}">Commencer</button>` : ''}</div>`
      : `<div class="k-top"><span>Tout est à jour</span></div><div class="k-ft">${scope.some((t) => t.review && t.status !== 'done') ? 'Tout le reste est chez les clients.' : 'Rien ne vous attend. Belle journée.'}</div><div class="k-acts"><button class="b2" data-act="tkquickfocus">Ajouter une tâche</button></div>`}</section>`;
    // Chiffres
    const maxLate = late.length ? Math.max(...late.map((t) => Math.round((c.today - tkD0(t.due)) / DAYMS))) : 0;
    const urg = tod.filter((t) => t.urgent).length;
    const kpi = (w, l, v, unit, d, cls = '') => `<button class="tk-kpi" data-tkwhen="${w}" aria-pressed="${k.when === w}"><span class="k-l">${l}</span><span class="k-v ${v === 0 ? 'zero' : cls}">${v}<small>${unit}</small></span><span class="k-d">${d}</span><span class="sr">. Filtrer la liste</span></button>`;
    const kpis = `<div class="b-kpis">${kpi('today', 'Aujourd’hui', tod.length, 'à faire', tod.length ? (urg ? `dont ${tkPl(urg, 'urgente', 'urgentes')}` : 'Aucune urgente') : 'Aucune échéance')}
      ${kpi('late', 'En retard', late.length, late.length > 1 ? 'tâches' : 'tâche', late.length ? (late.length > 1 ? `Le plus ancien&nbsp;: ${tkPl(maxLate, 'jour', 'jours')}` : `Depuis ${tkPl(maxLate, 'jour', 'jours')}`) : 'Aucun retard', 'bad')}
      ${kpi('next', '7 prochains jours', next7.length, 'à venir', next7.length ? `Prochaine&nbsp;: ${tkRelDay(next7[0].due, c)}` : 'Rien de prévu')}
      ${kpi('done', 'Cette semaine', doneWeek.length, doneWeek.length > 1 ? 'faites' : 'faite', `Semaine passée&nbsp;: ${lastWeek}`)}</div>`;
    // Qui porte quoi (toujours toute l'équipe, sans les filtres client et type)
    const load = `<section class="tk-card tk-load b-load" aria-labelledby="tk-load-h"><h2 id="tk-load-h">Qui porte quoi</h2><div class="rows">${(S.team || []).map((u) => {
      const ts = all.filter((t) => t.who.includes(u.id)), o2 = ts.filter(tkOpen);
      const lt = o2.filter((t) => tkBand(t, c) === 0).length, dg = o2.filter((t) => t.status === 'doing' && tkBand(t, c) !== 0).length, td = o2.length - lt - dg;
      const rev = ts.filter((t) => t.review && t.status !== 'done').length;
      const dots = [...Array(lt).fill('late'), ...Array(dg).fill('doing'), ...Array(td).fill('todo')];
      const on = who === u.id || (who === 'me' && u.id === S.me.id);
      return `<button class="r" data-tkwho="${u.id === S.me.id ? 'me' : esc(u.id)}" aria-pressed="${on}">${tkAv(u.id)}<span class="n">${esc(tkFirst(u.id))}${rev ? `<span class="cl">+ ${rev} chez le client</span>` : ''}</span><span class="k-t" aria-hidden="true">${o2.length}</span><span class="dots" aria-hidden="true">${dots.slice(0, 30).map((x) => `<i class="d-${x}"></i>`).join('')}</span><span class="sr">${esc(tkFirst(u.id))} : ${tkPl(o2.length, 'tâche ouverte', 'tâches ouvertes')}, dont ${lt} en retard et ${dg} en cours. Afficher ses tâches</span></button>`;
    }).join('')}</div><div class="legend" aria-hidden="true"><span><i class="d-late"></i>En retard</span><span><i class="d-doing"></i>En cours</span><span><i class="d-todo"></i>Pas commencé</span></div></section>`;
    // 14 jours
    const days = [...Array(14)].map((_, i) => c.today + i * DAYMS), per = (d) => open.filter((t) => t.due && tkD0(t.due) === d).length;
    const mx = Math.max(1, late.length, ...days.map(per)), total = days.reduce((s, d) => s + per(d), 0);
    const bar = (n) => (n ? `<span class="val">${n}</span><span class="k-bar" style="height:${Math.max(10, Math.round(n / mx * 80))}px"></span>` : '<span class="zero"></span>');
    const daysC = `<section class="tk-card tk-days b-days" aria-labelledby="tk-days-h"><h2 id="tk-days-h">Les 14 prochains jours <span class="aside">${total ? tkPl(total, 'échéance', 'échéances') : 'Aucune échéance'}</span></h2><div class="bars">
      ${late.length ? `<button class="c late" data-tkwhen="late" aria-pressed="${k.when === 'late'}" aria-label="${tkPl(late.length, 'tâche', 'tâches')} en retard">${bar(late.length)}<span class="k-lb"><b>Retard</b>&nbsp;</span></button><span class="sep"></span>` : ''}
      ${days.map((d, i) => { const wd = new Date(d).getDay(), n = per(d); return `<button class="c ${i === 0 ? 'today' : ''} ${wd % 6 === 0 ? 'we' : ''}" data-tkwhen="day:${d}" aria-pressed="${k.when === 'day:' + d}" ${i === 0 ? 'aria-current="date"' : ''} aria-label="${esc(tkCap(fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })))} : ${tkPl(n, 'tâche', 'tâches')}">${bar(n)}<span class="k-lb" aria-hidden="true"><b>${i === 0 ? 'Auj.' : 'DLMMJVS'[wd]}</b>${new Date(d).getDate()}</span></button>`; }).join('')}</div></section>`;
    // Par client
    const clients = [...new Map(scope.map((t) => [t.projectId || 'interne', t.client || 'Interne'])).entries()].map(([id, name]) => { const ts = scope.filter((t) => (t.projectId || 'interne') === id); const dn = ts.filter((t) => t.status === 'done').length, lt = ts.filter((t) => tkOpen(t) && tkBand(t, c) === 0).length; return { id, name, n: ts.length, dn, lt, open: ts.length - dn }; }).sort((a, b) => b.open - a.open);
    const clientsC = `<section class="tk-card tk-clients b-clients" aria-labelledby="tk-cl-h"><h2 id="tk-cl-h">Par client</h2>${clients.length ? `<ul>${clients.slice(0, 5).map((x) => `<li><button class="k-cb" data-tkclient="${esc(x.id)}" aria-pressed="${k.client === x.id}"><span class="k-top"><span class="nm">${esc(x.name)}</span><span>${x.lt ? `<em>${x.lt} en retard</em> · ` : ''}${x.dn} / ${x.n} ${x.dn > 1 ? 'faites' : 'faite'}</span></span><span class="pbar" aria-hidden="true"><i style="width:${x.n ? x.dn / x.n * 100 : 0}%"></i>${x.lt ? `<i class="k-l" style="width:${Math.max(4, x.lt / x.n * 100)}%"></i>` : ''}</span></button></li>`).join('')}</ul>${clients.length > 5 ? `<p class="k-more">et ${tkPl(clients.length - 5, 'autre', 'autres')} dans le filtre client</p>` : ''}` : '<p class="muted small">Aucune tâche liée à un client.</p>'}</section>`;
    // Liste
    const order = (a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15);
    const tomorrow = c.today + DAYMS;
    const gOf = (t) => (t.review && t.status !== 'done' ? 'review' : t.status === 'done' ? 'done' : !t.due ? 'none' : tkD0(t.due) < c.today ? 'late' : tkD0(t.due) === c.today ? 'today' : tkD0(t.due) === tomorrow ? 'tomorrow' : tkD0(t.due) <= c.sunday ? 'week' : tkD0(t.due) <= c.sunday + 7 * DAYMS ? 'next' : 'later');
    const list = scope.filter((t) => tkWhenOk(t, k.when, c));
    const G = [['late', 'En retard'], ['today', 'Aujourd’hui'], ['tomorrow', 'Demain'], ['week', 'Cette semaine'], ['next', 'Semaine prochaine'], ['later', 'Plus tard'], ['none', 'Sans échéance'], ['review', 'Chez le client']];
    const groups = G.map(([g, l]) => [g, l, list.filter((t) => gOf(t) === g).sort(order)]).filter((x) => x[2].length);
    const base = who === 'all' ? 'Toute l’équipe' : who === 'me' ? 'Toutes vos tâches' : 'Tâches de ' + tkFirst(who);
    const filt = k.when ? `<button class="tk-filter" data-tkwhen="" aria-label="Retirer le filtre ${esc(tkWhenLbl(k.when))}">${esc(tkWhenLbl(k.when))} ${TKX}</button>` : '';
    const tools = `<div class="tk-listhead"><h2 id="tk-list-h" tabindex="-1">${base}${filt}</h2><div class="tk-tools"><label class="sr" for="tk-fc">Client</label><select id="tk-fc" class="pill-sel" data-tkfilter="client"><option value="">Tous les clients</option><option value="interne" ${k.client === 'interne' ? 'selected' : ''}>Interne (sans client)</option>${(S.projects || []).filter((p) => !p.archivedAt).map((p) => `<option value="${esc(p.id)}" ${k.client === p.id ? 'selected' : ''}>${esc(p.client)}</option>`).join('')}</select>
      <div class="seg" role="group" aria-label="Type">${[['all', 'Tout'], ['task', 'Interne'], ['item', 'Livrables']].map(([v, l]) => `<button data-tkkind="${v}" aria-pressed="${k.kind === v}">${l}</button>`).join('')}</div>
      <div class="seg" role="group" aria-label="Affichage">${[['list', 'Liste'], ['board', 'Tableau']].map(([v, l]) => `<button data-tklayout="${v}" aria-pressed="${k.layout === v}">${l}</button>`).join('')}</div></div></div>`;
    const doneList = scope.filter((t) => t.status === 'done').sort((a, b) => new Date(b.doneAt || b.due || 0) - new Date(a.doneAt || a.due || 0));
    const empty = !(S.tasks || []).length ? `<div class="tk-empty"><span class="ok">${ic('check')}</span><div><b>Aucune tâche pour le moment</b><p>Écrivez votre première tâche dans le champ au-dessus. Exemple : « Préparer le bilan d’octobre @théo vendredi ».</p></div></div>`
      : k.when || k.client || k.kind !== 'all' ? `<div class="tk-empty"><span class="ok">${ic('check')}</span><div><b>${k.when === 'late' ? 'Plus aucun retard' : 'Rien avec ces filtres'}</b><p>${k.when === 'late' ? 'Tout ce qui était en retard est fait.' : 'Changez de personne, de client ou de filtre.'}</p></div><button class="btn btn-line btn-sm" data-act="tkclear">Effacer les filtres</button></div>`
      : `<div class="tk-empty"><span class="ok">${ic('check')}</span><div><b>Tout est fait</b><p>Les tâches terminées sont rangées dans « Faites ».</p></div></div>`;
    const more = (g, ts, n) => (ts.length > n && !(k.more || {})[g] ? `<button class="tk-more" data-tkmore="${g}">${ts.length - n > 1 ? `Afficher les ${ts.length - n} autres` : 'Afficher l’autre tâche'}</button>` : '');
    const cut = (g, ts, n) => ((k.more || {})[g] ? ts : ts.slice(0, n));
    const listHtml = `<div class="tk-panel">${groups.length ? groups.map(([g, l, ts]) => `<div class="tk-g"><h3 class="tk-gh ${g === 'late' ? 'late' : ''}">${l} <span class="num">${ts.length}</span></h3><ul class="tk-ul" role="list">${cut(g, ts, 6).map((t) => tkRow(t, c)).join('')}</ul>${more(g, ts, 6)}</div>`).join('') : k.when === 'done' ? '' : empty}
      ${k.when === 'done' ? `<div class="tk-g"><ul class="tk-ul" role="list">${list.map((t) => tkRow(t, c)).join('') || '<li class="tk-none">Rien de fini cette semaine pour l’instant.</li>'}</ul></div>` : k.when || !doneList.length ? '' : `<div class="tk-g"><button class="tk-donebtn" data-act="tkshowdone" aria-expanded="${!!k.showDone}"><span class="tk-gh">Faites <span class="num">${doneList.length}</span></span><span class="k-s">30 derniers jours</span><span class="k-chev">${k.showDone ? 'Masquer' : 'Afficher'}</span></button>${k.showDone ? `<ul class="tk-ul" role="list">${doneList.map((t) => tkRow(t, c)).join('')}</ul>` : ''}</div>`}</div>`;
    const doneRecent = scope.filter((t) => t.status === 'done' && (t.doneAt || t.due) && tkD0(t.doneAt || t.due) >= c.today - 7 * DAYMS && tkWhenOk(t, k.when === 'done' ? 'done' : '', c));
    const inWhen = (t) => tkWhenOk(t, k.when === 'done' ? '' : k.when, c);
    const cols = [['Pas commencé', 'todo', scope.filter((t) => t.status === 'todo' && !t.review && inWhen(t))], ['En cours', 'doing', scope.filter((t) => t.status === 'doing' && !t.review && inWhen(t))], ['Chez le client', 'review', scope.filter((t) => t.review && t.status !== 'done' && !k.when)], ['Faites (7 jours)', 'done', doneRecent]];
    const board = `<div class="tk-board">${cols.map(([l, cl, ts]) => `<section class="tk-col" aria-label="${l}"><h3><i class="h-${cl}" aria-hidden="true"></i>${l} <span class="num">${ts.length}</span></h3>${cut('b' + cl, ts.sort(order), 6).map((t) => tkCard(t, c)).join('') || '<p class="tk-none">Rien ici pour l’instant.</p>'}${more('b' + cl, ts, 6)}</section>`).join('')}</div>`;
    return `${head}${quick}<div class="tk-bento">${focus}${kpis}${load}${daysC}${clientsC}</div>${tools}${k.layout === 'board' ? board : listHtml}${tkUndoBar()}<button class="tk-fab" data-act="tknew" aria-label="Nouvelle tâche">${ic('plus')}</button>`;
  }
  /* Saisie rapide : @personne, échéance (aujourd'hui, demain, lundi, 15/11, dans 3 jours…), #client, ! urgent, // note. */
  const tkNorm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function tkParse(raw) {
    const c = tkCal(), out = { who: [], due: null, dueLbl: '', projectId: undefined, client: '', urgent: false, note: '', errors: [], choices: [] };
    let s = String(raw || '');
    const ni = s.indexOf('//'); if (ni >= 0) { out.note = s.slice(ni + 2).trim(); s = s.slice(0, ni); }
    const team = S.team || [];
    s = s.replace(/(^|\s)@([\p{L}\-]+)/gu, (m, sp, name) => {
      const n = tkNorm(name);
      if (n === 'moi') { out.who.push(S.me.id); return sp; }
      if (n === 'equipe' || n === 'tous') { team.forEach((u) => out.who.push(u.id)); return sp; }
      const hits = team.filter((u) => tkNorm(u.name.split(' ')[0]).startsWith(n) || (n === 'theo' && /^theo/.test(tkNorm(u.name))) || (n === 'clem' && /^clem/.test(tkNorm(u.name))));
      if (hits.length === 1) { out.who.push(hits[0].id); return sp; }
      out.errors.push(`Personne inconnue : @${name}`); return m;
    });
    s = s.replace(/(^|\s)#([\p{L}\d\-]+)/gu, (m, sp, name) => {
      const n = tkNorm(name).replace(/-/g, ' ');
      if (n === 'interne') { out.projectId = ''; out.client = 'Interne'; return sp; }
      const ps = (S.projects || []).filter((p) => !p.archivedAt), hits = ps.filter((p) => tkNorm(p.client).split(/[\s\-']+/).some((w) => w.startsWith(n)) || tkNorm(p.client).startsWith(n));
      if (hits.length === 1) { out.projectId = hits[0].id; out.client = hits[0].client; return sp; }
      if (hits.length > 1) { out.choices = hits.map((p) => ({ id: p.id, client: p.client })); return sp; }
      out.errors.push(`Client inconnu : #${name}`); return m;
    });
    s = s.replace(/(^|\s)!(urgent|!)?(?=\s|$)/giu, (m, sp) => { out.urgent = true; return sp; });
    const set = (t, lbl) => { if (!out.due) { out.due = t; out.dueLbl = lbl; } };
    const WD = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const MO = ['janv', 'fevr', 'mars', 'avr', 'mai', 'juin', 'juil', 'aout', 'sept', 'oct', 'nov', 'dec'];
    const rules = [
      [/(^|\s)(aujourd'hui|aujourd’hui|auj|ce soir)(?=\s|$)/iu, () => c.today],
      [/(^|\s)(apres-demain|après-demain)(?=\s|$)/iu, () => c.today + 2 * DAYMS],
      [/(^|\s)(demain|dem)(?=\s|$)/iu, () => c.today + DAYMS],
      [/(^|\s)(semaine pro(chaine)?|sem pro)(?=\s|$)/iu, () => c.sunday + DAYMS],
      [/(^|\s)fin du mois(?=\s|$)/iu, () => { const d = new Date(c.today); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime(); }],
      [/(^|\s)dans (\d{1,3}) ?(j|jours?|sem|semaines?)(?=\s|$)/iu, (m) => c.today + Number(m[2]) * (/^s/i.test(m[3]) ? 7 : 1) * DAYMS],
      [/(^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$)/u, (m) => { const y0 = new Date(c.today).getFullYear(); let y = m[4] ? Number(m[4].length === 2 ? '20' + m[4] : m[4]) : y0; let d = new Date(y, Number(m[3]) - 1, Number(m[2])).getTime(); if (!m[4] && d < c.today) d = new Date(y + 1, Number(m[3]) - 1, Number(m[2])).getTime(); return isNaN(d) ? null : d; }],
      [/(^|\s)(\d{1,2}) (janv(?:ier)?|f[ée]vr(?:ier)?|mars|avr(?:il)?|mai|juin|juil(?:let)?|ao[uû]t|sept(?:embre)?|oct(?:obre)?|nov(?:embre)?|d[ée]c(?:embre)?)\.?(?=\s|$)/iu, (m) => { const mi = MO.findIndex((x) => tkNorm(m[3]).startsWith(x)); const y0 = new Date(c.today).getFullYear(); let d = new Date(y0, mi, Number(m[2])).getTime(); if (d < c.today) d = new Date(y0 + 1, mi, Number(m[2])).getTime(); return d; }],
      [/(^|\s)(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lun|mar|mer|jeu|ven|sam|dim)(?=\s|$)/iu, (m) => { const n = tkNorm(m[2]); const wd = WD.findIndex((x) => x.startsWith(n)); const cur = new Date(c.today).getDay(); let diff = (wd - cur + 7) % 7; if (diff === 0) diff = 7; return c.today + diff * DAYMS; }]
    ];
    for (const [re, fn] of rules) { const m = s.match(re); if (m && !out.due) { const d = fn(m); if (d) { set(d, ''); s = s.replace(re, m[1]); } } }
    out.t = s.replace(/\s+/g, ' ').trim();
    if (out.due) out.dueLbl = tkCap(tkRelDay(out.due, c)) + (Math.round((out.due - c.today) / DAYMS) > 1 ? ', ' + fmt(out.due, { weekday: 'short', day: 'numeric', month: 'short' }) : '');
    return out;
  }
  function tkPreview(raw) {
    const box = $('#tk-prev'); if (!box) return;
    const add = root.querySelector('.tk-quick'); if (add) add.classList.toggle('typing', !!String(raw).trim());
    if (!String(raw).trim()) { box.innerHTML = ''; return; }
    const p = tkParse(raw), k = tkState();
    const who = p.who.length ? [...new Set(p.who)] : null;
    const chips = [];
    chips.push(who ? who.map((id) => `<span class="pc">${tkAv(id)}${esc(tkFirst(id))}</span>`).join('') : `<span class="pc np dim">${k.who !== 'me' && k.who !== 'all' ? esc(tkFirst(k.who)) : 'Vous'} (par défaut)</span>`);
    if (p.due) chips.push(`<span class="pc np">${ic('cal')}${esc(p.dueLbl)}</span>`);
    if (p.client) chips.push(`<span class="pc"><span class="orem">#</span>${esc(p.client)}</span>`);
    if (p.urgent) chips.push('<span class="pc np urg">Urgent</span>');
    if (p.note) chips.push('<span class="pc np">Note</span>');
    p.choices.forEach((x) => chips.push(`<button type="button" class="pc np" data-tkpick="${esc(x.id)}">${esc(x.client)}</button>`));
    p.errors.forEach((e) => chips.push(`<span class="pc np warn">${esc(e)}</span>`));
    box.innerHTML = chips.join('') + '<span class="k-hint">Entrée pour ajouter · Maj + Entrée pour les détails</span>';
  }
  /* Panneau latéral : nouvelle tâche ou modification, rendu hors de la page (dialogue modal). */
  function tkDrawer() {
    const k = tkState(); if (!k.edit || S.view !== 'taches' || clientMode()) return '';
    const isNew = k.edit === 'new', t = isNew ? null : (S.tasks || []).find((x) => x.id === k.edit); if (!isNew && !t) return '';
    const d = (isNew ? k.draft : null) || {}, item = t && t.kind === 'item', c = tkCal();
    const who = t ? t.who : d.who && d.who.length ? d.who : [k.who !== 'me' && k.who !== 'all' ? k.who : S.me.id];
    const dueV = (ms) => { if (!ms) return ''; const x = new Date(ms); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
    const due = t ? dueV(t.due && new Date(t.due).getTime()) : dueV(d.due);
    const status = t ? t.status : 'todo', pid = t ? t.projectId || '' : d.projectId !== undefined ? d.projectId : k.client && k.client !== 'interne' ? k.client : '';
    const lateN = t && t.due && t.status !== 'done' && tkD0(t.due) < c.today ? Math.round((c.today - tkD0(t.due)) / DAYMS) : 0;
    const mon = c.today + (((1 - new Date(c.today).getDay() + 7) % 7) || 7) * DAYMS;
    return `<div class="tk-veil" data-act="tkclose"></div><aside class="tk-drawer tk-wrap" role="dialog" aria-modal="true" aria-labelledby="tkd-h"><form class="tk-dform" data-form="tkedit" data-id="${esc(k.edit)}">
      <div class="hd"><h2 id="tkd-h">${isNew ? 'Nouvelle tâche' : 'Modifier la tâche'}</h2><button type="button" class="k-x" data-act="tkclose" aria-label="Fermer">${TKX}</button></div>
      <div class="bd">${item ? `<p class="small muted">Livrable de ${esc(t.client)} · ${esc(t.step || '')}. Le titre se change dans le planning du client.</p><h3 class="ttl ro">${esc(t.t)}</h3>${t.review ? '<p class="k-hint2">Le client n’a pas encore validé ce livrable.</p>' : ''}`
        : `<label class="sr" for="tkd-t">Que faut-il faire ?</label><textarea id="tkd-t" class="ttl" rows="2" maxlength="160" placeholder="Que faut-il faire ?">${esc(t ? t.t : d.t || '')}</textarea>`}
        <fieldset class="k-fs"><legend class="lab">État</legend><div class="st3">${TK_STATES.map(([v, l]) => `<label class="${status === v ? 'on' : ''}"><input type="radio" class="sr" name="tkd-s" value="${v}" ${status === v ? 'checked' : ''}><span class="ck ${v}"><i>${v === 'done' ? ic('check') : ''}</i></span>${l}</label>`).join('')}</div></fieldset>
        <fieldset class="k-fs"><legend class="lab">Personnes</legend><div class="k-row">${(S.team || []).map((u) => `<label class="pp ${who.includes(u.id) ? 'on' : ''}"><input type="checkbox" class="sr" name="tkd-w" value="${esc(u.id)}" ${who.includes(u.id) ? 'checked' : ''}>${tkAv(u.id)}${esc(tkFirst(u.id))}<span class="tick" aria-hidden="true">${ic('check')}</span></label>`).join('')}</div></fieldset>
        <div><label class="lab" for="tkd-d">Échéance</label><div class="k-row">${[['Aujourd’hui', c.today], ['Demain', c.today + DAYMS], ['Lundi', mon], ['Sans date', 0]].map(([l, ms]) => `<button type="button" class="pp np ${dueV(ms) === due ? 'on' : ''}" data-tkdue="${dueV(ms)}">${l}</button>`).join('')}</div><input id="tkd-d" type="date" class="k-date" value="${due}">${lateN ? `<p class="k-hint2 bad">En retard de ${tkPl(lateN, 'jour', 'jours')}</p>` : ''}</div>
        ${item ? '' : `<div><label class="lab" for="tkd-p">Client</label><select id="tkd-p" class="k-sel"><option value="">Aucun (tâche interne)</option>${(S.projects || []).filter((p) => !p.archivedAt).map((p) => `<option value="${esc(p.id)}" ${pid === p.id ? 'selected' : ''}>${esc(p.client)}</option>`).join('')}</select></div>
        <label class="k-sw">Urgent <input type="checkbox" id="tkd-u" class="sr" ${(t ? t.urgent : d.urgent) ? 'checked' : ''}><i aria-hidden="true"></i></label>
        <div><label class="lab" for="tkd-n">Note <span class="muted">(facultatif)</span></label><textarea id="tkd-n" class="k-note" rows="3" maxlength="2000" placeholder="Un détail utile pour la personne qui s’en charge">${esc(t ? t.note || '' : d.note || '')}</textarea></div>`}</div>
      <div class="k-ft"><button class="btn btn-primary" type="submit">${isNew ? 'Ajouter la tâche' : 'Enregistrer'}</button><button type="button" class="btn btn-line" data-act="tkclose">Annuler</button>
        ${item ? `<button type="button" class="del k-open" data-act="tkopen" data-id="${esc(t.projectId)}">Ouvrir le planning</button>` : t ? (k.confirmDel ? `<span class="k-confirm">Supprimer définitivement ? <button type="button" class="del" data-act="tkdel" data-id="${esc(t.id)}">Oui</button><button type="button" class="del k-no" data-act="tkdelno">Non</button></span>` : `<button type="button" class="del" data-act="tkdelask">Supprimer</button>`) : ''}</div></form></aside>`;
  }
  /* Changement d'état annulable 5 s : appliqué tout de suite à l'écran, envoyé au serveur à la fin du délai. */
  function tkUndoBar() { const u = S.tkUndo; return u ? `<div class="undo tk-undo" role="status"><span>${esc(u.msg)}</span><button class="btn btn-sm" data-act="tkundo">Annuler</button></div>` : ''; }
  async function tkFlush() {
    const u = S.tkUndo; if (!u) return; clearTimeout(u.timer); S.tkUndo = null;
    try { await API.task(u.body); } catch (err) { toast(err.message); }
    await loadTasks(); if (S.view === 'taches') render(false, true);
  }
  async function tkSetStatus(id, status) {
    if (S.tkUndo) await tkFlush();
    const t = (S.tasks || []).find((x) => x.id === id); if (!t || t.review) return;
    const prev = { status: t.status, doneAt: t.doneAt };
    t.status = status; t.doneAt = status === 'done' ? new Date().toISOString() : null;
    const msg = status === 'done' ? `Faite : ${t.t}` : status === 'doing' ? `En cours : ${t.t}` : `Remise à faire : ${t.t}`;
    S.tkUndo = { id, prev, msg, body: { type: 'todo.update', id, status }, timer: setTimeout(tkFlush, 5000) };
    render(false, true);
    const b = root.querySelector('[data-act=tkundo]'); if (b && document.activeElement === document.body) b.focus({ preventScroll: true });
  }
  function tkUndo() {
    const u = S.tkUndo; if (!u) return; clearTimeout(u.timer); S.tkUndo = null;
    const t = (S.tasks || []).find((x) => x.id === u.id); if (t) Object.assign(t, u.prev);
    render(false, true); toast('Annulé.');
  }
  window.addEventListener('pagehide', () => { const u = S.tkUndo; if (u) { clearTimeout(u.timer); S.tkUndo = null; try { fetch('/api/tasks', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Orem': '1' }, body: JSON.stringify(u.body) }); } catch {} } });
  async function tkSave(body, msg) {
    try { const r = await API.task(body); await loadTasks(); if (msg) toast(msg); return r || true; } catch (err) { toast(err.message); return false; }
  }
  function tkGoList() { const h = $('#tk-list-h'); if (h) { h.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); h.focus({ preventScroll: true }); } }
  /* Gestionnaires (appelés par les écouteurs délégués de la page). */
  /* Synchrone : attendre ici empêcherait les autres clics d'annuler l'action par défaut du navigateur. */
  function tkClick(e) {
    if (S.view !== 'taches' || clientMode()) return false;
    const g = (sel) => e.target.closest(sel);
    let el;
    if ((el = g('[data-tkdone]'))) { const t = (S.tasks || []).find((x) => x.id === el.dataset.tkdone); if (t) tkSetStatus(t.id, t.status === 'done' ? 'todo' : 'done'); return true; }
    if ((el = g('[data-tkstart]'))) { tkSetStatus(el.dataset.tkstart, 'doing'); return true; }
    if ((el = g('[data-tkwho]'))) { S.tk = { ...tkState(), who: el.dataset.tkwho, focus: 0 }; render(false, true); return true; }
    if ((el = g('[data-tkwhen]'))) { const w = el.dataset.tkwhen; S.tk = { ...tkState(), when: tkState().when === w ? '' : w }; render(false, true); if (S.tk.when) tkGoList(); return true; }
    if ((el = g('[data-tkclient]'))) { const v = el.dataset.tkclient; S.tk = { ...tkState(), client: tkState().client === v ? '' : v }; render(false, true); if (S.tk.client) tkGoList(); return true; }
    if ((el = g('[data-tkkind]'))) { S.tk = { ...tkState(), kind: el.dataset.tkkind }; render(false, true); return true; }
    if ((el = g('[data-tklayout]'))) { S.tk = { ...tkState(), layout: el.dataset.tklayout }; render(false, true); return true; }
    if ((el = g('[data-tkmore]'))) { const k = tkState(); S.tk = { ...k, more: { ...(k.more || {}), [el.dataset.tkmore]: true } }; render(false, true); return true; }
    if ((el = g('[data-tkedit]'))) { S.tkOpener = el.dataset.tkedit; S.tk = { ...tkState(), edit: el.dataset.tkedit, confirmDel: false, draft: null }; render(); return true; }
    if ((el = g('[data-tkpick]'))) { const inp = $('#tk-q'), p = (S.projects || []).find((x) => x.id === el.dataset.tkpick); if (inp && p) { inp.value = inp.value.replace(/(^|\s)#[\p{L}\d\-]+/u, '$1#' + p.client.split(' ').pop()); tkPreview(inp.value); inp.focus(); } return true; }
    if ((el = g('[data-tkdue]'))) { const i = $('#tkd-d'); if (i) i.value = el.dataset.tkdue; root.querySelectorAll('[data-tkdue]').forEach((b) => b.classList.toggle('on', b === el)); return true; }
    const a = g('[data-act]'); if (!a) return false;
    switch (a.dataset.act) {
      case 'tkclose': { const was = tkState().edit; S.tk = { ...tkState(), edit: null, confirmDel: false, draft: null }; render(); const b = was && was !== 'new' ? root.querySelector(`[data-tkedit="${CSS.escape(was)}"]`) : $('[data-act=tknew]'); if (b) b.focus(); return true; }
      case 'tkdelask': S.tk = { ...tkState(), confirmDel: true }; render(); const y = root.querySelector('[data-act=tkdel]'); if (y) y.focus(); return true;
      case 'tkdelno': S.tk = { ...tkState(), confirmDel: false }; render(); return true;
      case 'tkundo': tkUndo(); return true;
      case 'tkfocusnext': { const k = tkState(); S.tk = { ...k, focus: (k.focus || 0) + 1 >= tkFocusQueue(tkScope(), tkCal()).length ? 0 : (k.focus || 0) + 1 }; render(false, true); const n = root.querySelector('[data-act=tkfocusnext]'); if (n) n.focus(); return true; }
      case 'tkquickfocus': { const q = $('#tk-q'); if (q) q.focus(); return true; }
      case 'tkshowdone': S.tk = { ...tkState(), showDone: !tkState().showDone }; render(false, true); return true;
      case 'tkclear': S.tk = { ...tkState(), when: '', client: '', kind: 'all' }; render(false, true); return true;
    }
    return false;
  }
  async function tkSubmit(f) {
    if (f.dataset.form === 'tkquick') {
      const inp = $('#tk-q'), raw = inp ? inp.value : '', p = tkParse(raw);
      if (!raw.trim()) { if (inp) inp.focus(); return true; }
      if (!p.t) { toast('Écrivez la tâche avant les raccourcis.'); return true; }
      const k = tkState(), who = p.who.length ? [...new Set(p.who)] : [k.who !== 'me' && k.who !== 'all' ? k.who : S.me.id];
      const body = { type: 'todo.add', t: p.t, who, due: p.due ? new Date(p.due + 9 * 3600e3).toISOString() : '', projectId: p.projectId !== undefined ? p.projectId : k.client && k.client !== 'interne' ? k.client : '', urgent: p.urgent, note: p.note };
      const r = await tkSave(body, null);
      if (r) {
        const others = who.filter((w) => w !== S.me.id).map(tkFirst);
        toast('Tâche ajoutée' + (others.length ? ` pour ${others.join(' et ')}` : '') + (p.due ? `, ${tkRelDay(p.due)}` : '') + '.' + (others.length ? (others.length > 1 ? ' Les personnes sont prévenues.' : ' La personne est prévenue.') : ''));
        S.tk = { ...tkState(), flash: r.task && r.task.id }; render(false, true);
        const q = $('#tk-q'); if (q) { q.value = ''; q.focus(); }
        setTimeout(() => { if (S.tk) S.tk.flash = null; }, 1600);
      }
      return true;
    }
    if (f.dataset.form === 'tkedit') {
      const id = f.dataset.id, isNew = id === 'new', item = id.startsWith('i:');
      const v = (sel) => { const x = f.querySelector(sel); return x ? x.value.trim() : ''; };
      const who = [...f.querySelectorAll('[name=tkd-w]:checked')].map((x) => x.value);
      if (!who.length) { toast('Choisissez au moins une personne.'); return true; }
      if (!item && !v('#tkd-t')) { fieldError('tkd-t', 'Écrivez la tâche.'); return true; }
      const st = f.querySelector('[name=tkd-s]:checked'), dd = v('#tkd-d');
      const body = { type: isNew ? 'todo.add' : 'todo.update', who, status: st ? st.value : 'todo' };
      if (!isNew) body.id = id;
      if (dd) body.due = dd + 'T09:00:00'; else if (!item) body.due = '';
      if (!item) Object.assign(body, { t: v('#tkd-t'), projectId: v('#tkd-p'), note: v('#tkd-n'), urgent: !!(f.querySelector('#tkd-u') || {}).checked });
      const r = await tkSave(body, isNew ? (who.some((w) => w !== S.me.id) ? 'Tâche ajoutée. Les personnes concernées sont prévenues.' : 'Tâche ajoutée.') : 'Tâche enregistrée.');
      if (r) { const was = id; S.tk = { ...tkState(), edit: null, draft: null, flash: isNew && r.task ? r.task.id : was }; render(); const b = root.querySelector(`[data-tkedit="${CSS.escape(isNew && r.task ? r.task.id : was)}"]`); if (b) b.focus(); setTimeout(() => { if (S.tk) S.tk.flash = null; }, 1600); }
      return true;
    }
    return false;
  }
  function tkKey(e) {
    if (S.view !== 'taches' || clientMode() || !S.me) return false;
    const tag = (e.target.tagName || '').toLowerCase(), typing = ['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable;
    if (e.target.id === 'tk-q' && e.key === 'Enter' && e.shiftKey) { e.preventDefault(); const p = tkParse(e.target.value); S.tk = { ...tkState(), edit: 'new', draft: p }; render(); return true; }
    if (e.key === 'Escape' && tkState().edit) { e.preventDefault(); const b = root.querySelector('.tk-drawer [data-act=tkclose]'); if (b) b.click(); return true; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return false;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); if (e.shiftKey) { S.tk = { ...tkState(), edit: 'new', draft: null }; render(); } else { const q = $('#tk-q'); if (q) q.focus(); } return true; }
    if (e.key === 'Escape' && tkState().when) { S.tk = { ...tkState(), when: '' }; render(false, true); return true; }
    return false;
  }

  /* ---------- Équipe : réglages ---------- */
  function vReglages() {
    const n = S.me.notify || { email: 'instant', events: {} };
    const ev = [['files', 'Un client dépose un fichier'], ['messages', 'Un client écrit ou envoie un message'], ['validations', 'Un client valide ou demande des modifications'], ['requests', 'Un client fait une demande sur son site'], ['tasks', 'Un collègue me confie une tâche'], ['activity', 'Un collègue publie quelque chose dans un de mes projets']];
    const ob = S.outbox || { items: [] };
    return `<div class="head"><div><h1>Réglages</h1><p class="lead">${esc(S.me.name)} · ${esc(S.me.email)}</p></div><div class="head-actions"><button class="btn btn-line" data-act="logout">${ic('out')}Se déconnecter</button><button class="btn btn-line" data-act="logout-all">Déconnecter tous mes appareils</button></div></div>
      <form class="panel form" data-form="prefs" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('mail')}Mes notifications par e-mail</h2><span class="aside">Dans la boîte de réception, vous voyez toujours tout</span></div>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:500;margin-bottom:10px">Quand m’écrire ?</legend>
          <div class="ob-pref">${[['instant', 'À chaque nouveauté, tout de suite'], ['digest', 'Un récap par jour, à 18 h'], ['off', 'Jamais, je regarde la boîte de réception']].map(([v, l]) => `<label><input type="radio" name="pf-email" value="${v}" ${n.email === v ? 'checked' : ''}> ${l}</label>`).join('')}</div></fieldset>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:500;margin-bottom:10px">Pour quoi ?</legend>
          <div class="ob-pref">${ev.map(([k, l]) => `<label><input type="checkbox" name="pf-ev" value="${k}" ${n.events && n.events[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div></fieldset>
        <p class="hint">Vous n’êtes prévenu que pour les projets dont vous faites partie (onglet « Accès et infos » de chaque client).</p>
        <div class="inline"><button class="btn btn-primary" type="submit">Enregistrer</button><button class="btn btn-line" type="button" data-act="digest">${ic('mail')}M’envoyer le récap maintenant</button></div></form>
      <form class="panel form" data-form="settings" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('gear')}Réglages de l’agence</h2><span class="aside">Communs à toute l’équipe, affichés aux clients</span></div>
        <div class="line"><div class="field"><label for="st-b">Lien de réservation d’une visio</label><input id="st-b" type="url" value="${esc(cfg().booking)}"></div><div class="field"><label for="st-t">Lien de réservation d’une formation</label><input id="st-t" type="url" value="${esc(cfg().training)}"></div></div>
        <div class="field"><label for="st-r">Lien pour laisser un avis Google</label><input id="st-r" type="url" value="${esc(cfg().reviewUrl)}" placeholder="https://g.page/r/…"></div>
        <div class="line"><div class="field"><label for="st-w">Vidéo Loom d’accueil (accueil guidé)</label><input id="st-w" type="url" value="${esc(cfg().welcomeLoom)}" placeholder="https://www.loom.com/share/…"></div><div class="field"><label for="st-g">Conditions générales (lien)</label><input id="st-g" type="url" value="${esc(cfg().cgvUrl)}" placeholder="https://www.agence-orem.fr/…"></div></div>
        <div class="line"><div class="field"><label for="st-h">Titulaire du compte</label><input id="st-h" type="text" value="${esc(cfg().holder)}"></div><div class="field"><label for="st-k">Banque</label><input id="st-k" type="text" value="${esc(cfg().bank)}"></div></div>
        <div class="field"><label for="st-a">Adresse</label><input id="st-a" type="text" value="${esc(cfg().address)}"></div>
        <div class="line"><div class="field"><label for="st-i">IBAN</label><input id="st-i" type="text" value="${esc(cfg().iban)}"></div><div class="field"><label for="st-c">BIC</label><input id="st-c" type="text" value="${esc(cfg().bic)}"></div></div>
        <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer</button></div></form>
      <section class="panel"><div class="panel-head"><h2>${ic('globe')}Outils connectés</h2><span class="aside">Clés dans le coffre Notion, fournies au lancement du serveur</span></div>
        <div class="list">${(S.connectors || []).map((c) => `<div class="row"><span class="ico ${c.configured ? 'ok' : ''}">${ic(c.configured ? 'ok' : 'lock')}</span><div class="grow"><div class="title">${esc(c.label)}</div><div class="sub">${esc(c.does)}${c.last ? ` · dernière synchronisation ${ago(c.last.at)} : ${esc(c.last.summary)}` : ''}${!c.configured && (c.missing || []).length && /_/.test(c.missing[0]) ? `<br>Clé à fournir : ${esc(c.missing.join(', '))}` : ''}</div></div>${c.configured ? '<span class="chip ok">Connecté</span>' : '<span class="chip idle">Non connecté</span>'}${c.configured ? `<button class="btn btn-line btn-sm" data-act="ccheck" data-id="${esc(c.id)}">Tester<span class="sr"> la connexion à ${esc(c.label)}</span></button>` : ''}${c.configured && ['abby', 'qonto', 'google'].includes(c.id) ? `<button class="btn btn-line btn-sm" data-act="sync" data-id="${esc(c.id)}">Synchroniser</button>` : ''}</div>`).join('') || '<p class="muted">Aucun connecteur.</p>'}</div>
        <p class="hint">Rien n’est appelé tant qu’une clé n’est pas fournie. Pipedrive prépare l’espace dès qu’une affaire est gagnée ; l’équipe choisit ensuite l’offre et le tutoiement ou le vouvoiement.</p></section>
      ${testPanel()}
      <section class="panel"><div class="panel-head"><h2>${ic('mail')}E-mails envoyés</h2><span class="aside">${ob.enabled ? 'Envoi réel activé' : 'Envoi réel désactivé : les e-mails restent ici tant que l’espace n’est pas en ligne'}</span></div>
        <div class="list">${(ob.items || []).slice(0, 15).map((m, i) => `<button class="row inbox-row" data-mail="${esc(i)}"><span class="ico">${ic('mail')}</span><span class="grow"><span class="title">${esc(m.subject)}</span><span class="sub">${m.from ? 'De ' + esc(m.from) + ' · ' : ''}À ${esc(m.to)} · ${ago(m.at)}${m.note ? ' · ' + esc(m.note) : m.sent ? ' · envoyé' : ''}</span></span>${ic('eye', 'width:18px;height:18px;color:var(--muted);flex:none')}</button>`).join('') || '<p class="muted">Aucun e-mail pour l’instant. Déposez un fichier côté client pour voir ce que reçoit l’équipe.</p>'}</div></section>`;
  }
  /* Réglages › Tester la version en ligne : les e-mails (générique et en son nom) et la connexion de chaque outil, en un clic. */
  function testPanel() {
    const M = cfg().mail; if (!M) return '';
    const line = (ok, t, d) => `<div class="row"><span class="ico ${ok ? 'ok' : ''}">${ic(ok ? 'ok' : 'alert')}</span><div class="grow"><div class="title">${t}</div>${d ? `<div class="sub">${d}</div>` : ''}</div></div>`;
    return `<section class="panel" aria-labelledby="tst-h"><div class="panel-head"><h2 id="tst-h">${ic('check')}Tester la version en ligne</h2><span class="aside">${cfg().test ? 'Version de test' : 'Version en ligne'}</span></div>
      <div class="list">
        ${line(M.enabled, M.enabled ? `Envoi des e-mails activé (${M.provider === 'smtp' ? 'SMTP' : 'Brevo'})` : 'Envoi des e-mails désactivé', M.enabled ? '' : 'En local, les e-mails restent dans « E-mails envoyés ». En ligne, il faut la clé Brevo ou les accès SMTP (voir le guide de mise en ligne).')}
        ${line(true, `Adresse générique : ${esc(M.from)}`, 'Codes de connexion, récaps de 18 h, relances automatiques.')}
        ${line(M.personal, M.personal ? `En votre nom : ${esc(S.me.email)}` : 'Envois en nom propre désactivés', 'Invitation d’un client, messages, vidéos et validations demandées : le client vous répond directement.')}
        ${M.test ? line(true, 'Version de test : envois limités', `Les e-mails ne partent qu’à ${esc((M.allow || []).map((a) => (a.includes('@') ? a : 'toute adresse @' + a)).join(', '))}. Les autres restent ici, marqués « non envoyé ».`) : ''}
      </div>
      <div class="inline" style="margin-top:12px"><button class="btn btn-primary btn-sm" data-act="testmail" data-id="generic">${ic('mail')}M’envoyer un e-mail générique</button><button class="btn btn-line btn-sm" data-act="testmail" data-id="personal">${ic('mail')}M’envoyer un e-mail en mon nom</button><button class="btn btn-line btn-sm" data-act="ccheck" data-id="mail">Tester le compte d’envoi</button></div>
      <p class="hint">Pour tester un parcours client complet : « Nouvel espace client » avec une de vos adresses (ou une adresse autorisée), puis ouvrez l’invitation reçue.</p></section>`;
  }
  function mailPreview() {
    if (!S.mailView) return '';
    return `<div class="lb" role="dialog" aria-modal="true" aria-label="Aperçu de l’e-mail"><div class="mailbox"><div class="mail-h"><div><strong>${esc(S.mailView.subject)}</strong><span>À ${esc(S.mailView.to)}</span></div><button class="x" data-act="mail-close" aria-label="Fermer">×</button></div><iframe class="mail-b" sandbox tabindex="-1" title="Contenu de l\u2019e-mail" srcdoc="${esc(S.mailView.html)}"></iframe></div></div>`;
  }

  /* ---------- Équipe : ajouter n'importe quoi, depuis n'importe où ---------- */
  const KINDS = [['msg', 'Message ou vidéo', 'chat'], ['file', 'Fichier', 'up'], ['val', 'Validation', 'ok'], ['asset', 'Bibliothèque', 'eye'], ['link', 'Liens Figma et site', 'figma'], ['note', 'Point de la semaine', 'cal']];
  function composer() {
    if (!S.compose) return '';
    const C = S.compose, pid = C.projectId || (S.project && S.project.id) || '';
    const P = S.compose.full;
    const kindTabs = KINDS.map(([k, l, i]) => `<button type="button" role="tab" id="ck-${k}" aria-controls="ck-panel" aria-selected="${C.kind === k}" tabindex="${C.kind === k ? 0 : -1}" data-ckind="${k}">${ic(i)}${l}</button>`).join('');
    let body = '';
    if (!P) body = `<p class="muted">Choisissez d’abord le client.</p>`;
    else if (C.kind === 'msg') body = `<div class="field"><label for="c-t">Message à ${esc(P.contactName || P.client)}</label><textarea id="c-t" rows="4" placeholder="${P.registre === 'tu' ? 'Salut' : 'Bonjour'} ${esc(P.contactName || '')}, …"></textarea></div>
      <div class="line"><div class="field"><label for="c-u">Lien Loom (facultatif)</label><input id="c-u" type="url" placeholder="https://www.loom.com/share/…"></div><div class="field"><label for="c-l">Titre de la vidéo</label><input id="c-l" type="text" placeholder="ex. Présentation des maquettes"></div></div>
        <label class="opt"><input type="checkbox" id="c-team"> Signer au nom de l’équipe (« L’équipe Orem »)</label>
      <p class="hint">Le client reçoit un e-mail et voit un bandeau sur son accueil.</p>`;
    else if (C.kind === 'file') body = `<div class="field"><label for="c-cat">Type</label><select id="c-cat">${[['Livrable', 'Livrable (visible dans Fichiers)'], ['Devis', 'Devis'], ['Facture', 'Facture'], ['Contrat', 'Contrat'], ['RIB', 'RIB']].map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
      <label class="drop small-drop" for="c-file"><span class="ico hl">${ic('up')}</span><strong>Glissez un ou plusieurs fichiers, ou cliquez</strong><span class="small muted">Sans limite de taille</span><input id="c-file" type="file" multiple class="sr"></label>
      ${upState()}`;
    else if (C.kind === 'val') body = `<div class="field"><label for="c-v">Quelle validation ?</label><select id="c-v">${P.validations.map((v) => `<option value="${v.id}" ${v.status === 'wait' ? '' : ''}>${esc(v.t)} · ${{ wait: 'pas encore demandée', ready: 'chez le client', approved: 'validée', changes: 'modifications demandées' }[v.status]}</option>`).join('')}</select></div>
      <div class="field"><label for="c-vl">Lien à regarder</label><input id="c-vl" type="url" placeholder="https://www.figma.com/proto/…" value="${esc((P.links && (P.links.proto || P.links.figma)) || '')}"></div>
      <div class="field"><label for="c-vt">Un mot pour le client (facultatif)</label><textarea id="c-vt" rows="2" placeholder="ex. Le plan est prêt, dites-nous ce que vous en pensez."></textarea></div>
      <p class="hint">Elle devient sa prochaine action sur l’accueil, et il reçoit un e-mail.</p>`;
    else if (C.kind === 'asset') body = `<div class="line"><div class="field"><label for="c-at">Titre</label><input id="c-at" type="text" placeholder="ex. Maquette de la page d’accueil"></div><div class="field"><label for="c-ak">Catégorie</label><select id="c-ak">${[['Visuels', 'Visuels'], ['Présentation', 'Présentation'], ['Cas d’étude', 'Cas d’étude'], ['Logos', 'Logos'], ['Maquettes', 'Écran de maquette à commenter (hors bibliothèque)']].map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div></div>
      <div class="field"><label for="c-ai">Image (facultatif)</label><input id="c-ai" type="file" accept="image/*"></div>
      <div class="field"><label for="c-au">Ou un lien (Figma, site, PDF…)</label><input id="c-au" type="url" placeholder="https://"></div>`;
    else if (C.kind === 'link') { const L = P.links || {}; body = [['figma', 'Fichier Figma (lecture seule)'], ['proto', 'Prototype Figma'], ['preview', 'Prévisualisation Webflow'], ['site', 'Site en ligne']].map(([k, l]) => `<div class="field"><label for="c-${k}">${l}</label><input id="c-${k}" type="url" value="${esc(L[k] || '')}" placeholder="https://"></div>`).join(''); }
    else if (C.kind === 'note') body = `<div class="field"><label for="c-n">Point de la semaine</label><textarea id="c-n" rows="4" placeholder="ex. Ce qui a été fait, ce qui vient.">${esc(P.note.text || '')}</textarea></div>
      <div class="line"><div class="field"><label for="c-mt">Prochain rendez-vous</label><input id="c-mt" type="text" value="${esc(P.meeting.title || '')}" placeholder="ex. Point d’étape (visio, 30 min)"></div><div class="field"><label for="c-mw">Date et heure</label><input id="c-mw" type="datetime-local" value="${dtKey(P.meeting.when)}"></div></div>`;
    return `<div class="ob" role="dialog" aria-modal="true" aria-labelledby="c-title"><form class="compose-card" data-form="compose">
      <div class="compose-h"><h2 id="c-title">Ajouter</h2><button type="button" class="x" data-act="compose-close" aria-label="Fermer">×</button></div>
      <div class="field"><label for="c-p">Client</label><select id="c-p" data-cproject>${S.projects.length ? '' : ''}<option value="">Choisir un client…</option>${S.projects.map((x) => `<option value="${x.id}" ${x.id === pid ? 'selected' : ''}>${esc(x.client)}</option>`).join('')}</select></div>
      <div class="ckinds" role="tablist" aria-orientation="vertical" aria-label="Que voulez-vous ajouter ?">${kindTabs}</div>
      <div class="form" role="tabpanel" id="ck-panel" aria-labelledby="ck-${C.kind}">${body}</div>
      <div class="compose-f"><span class="small muted">Ajouté par ${esc(S.me.name.split(' ')[0])}${P && P.team && P.team.members.length ? ' · l’équipe du projet est prévenue' : ''}</span>${C.kind !== 'file' ? `<button class="btn btn-primary" type="submit">${C.kind === 'msg' ? 'Envoyer' : C.kind === 'val' ? 'Demander la validation' : 'Ajouter'}</button>` : ''}</div>
    </form></div>`;
  }
  async function openCompose(kind, projectId) {
    const pid = projectId || (S.project && S.view === 'admin' ? S.project.id : '');
    S.compose = { kind: kind || 'msg', projectId: pid, full: null };
    if (pid) { try { S.compose.full = (await API.project(pid)).project; } catch {} }
    render(); const f = document.querySelector('.compose-card textarea, .compose-card input:not([type=file])'); if (f) f.focus();
  }
  async function composeDone(msg) {
    const pid = S.compose.projectId; S.compose = null;
    await loadProjects(); await loadInbox();
    if (S.view === 'admin' && S.project && S.project.id === pid) await loadProject(pid); else render();
    toast(msg);
  }
  async function composeSubmit() {
    const C = S.compose, pid = C.projectId; if (!pid) return fieldError('c-p', 'Choisissez le client.');
    const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
    const run = async (a) => { await API.action(pid, a); };
    try {
      if (C.kind === 'msg') { if (!v('c-t')) return fieldError('c-t', 'Écrivez le message.'); await run({ type: 'msg.post', text: v('c-t'), asTeam: !!($('#c-team') || {}).checked, loom: v('c-u') ? { url: v('c-u'), title: v('c-l') || 'Vidéo' } : undefined }); return composeDone(v('c-u') ? 'Vidéo envoyée. Le client est prévenu.' : 'Message envoyé. Le client est prévenu.'); }
      if (C.kind === 'val') { await run({ type: 'val.request', vid: v('c-v'), link: v('c-vl'), text: v('c-vt') }); return composeDone('Validation demandée. Le client est prévenu.'); }
      if (C.kind === 'link') { await run({ type: 'links.set', figma: v('c-figma'), proto: v('c-proto'), preview: v('c-preview'), site: v('c-site') }); return composeDone('Liens enregistrés.'); }
      if (C.kind === 'note') { await run({ type: 'note.set', text: v('c-n') }); await run({ type: 'meeting.set', title: v('c-mt'), when: v('c-mw') || null }); return composeDone('Point de la semaine publié.'); }
      if (C.kind === 'asset') {
        const f = $('#c-ai') && $('#c-ai').files[0]; let img = '';
        if (!v('c-at')) return fieldError('c-at', 'Donnez un titre.');
        if (f) { const r = await API.upload(pid, f, 'Bibliothèque'); img = r.file && r.file.id && !API.demo ? '/api/files/' + r.file.id + '?inline=1' : URL.createObjectURL(f); }
        await run({ type: 'asset.add', title: v('c-at'), kind: v('c-ak'), url: v('c-au'), img });
        return composeDone('Ajouté à la bibliothèque du client.');
      }
    } catch (e) { toast(e.message); }
  }
  async function composeFiles(files) {
    const pid = S.compose.projectId; if (!pid) return fieldError('c-p', 'Choisissez le client.');
    const cat = $('#c-cat').value; let n = 0;
    for (const f of files) { S.uploading = { name: f.name, p: 0 }; render(); try { await API.upload(pid, f, cat, (x) => { S.uploading.p = x; const b = document.querySelector('.compose-card .progress i'); if (b) b.style.width = Math.round(x * 100) + '%'; }); n++; } catch (e) { toast(e.message); } }
    S.uploading = null; if (n) composeDone(`${n} fichier${n > 1 ? 's' : ''} partagé${n > 1 ? 's' : ''}.${cat === 'Livrable' ? ' Le client est prévenu.' : ''}`); else render();
  }

  /* ---------- Équipe d'un projet ---------- */
  function teamPanel() {
    const p = S.project, T = p.team || { lead: null, members: [] };
    return `<form class="panel form" data-form="team" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('team')}Équipe du projet</h2><span class="aside">Ces personnes reçoivent les notifications de ce client</span></div>
      <div class="ob-pref">${S.team.map((u) => `<label><input type="checkbox" name="tm" value="${u.id}" ${T.members.includes(u.id) ? 'checked' : ''}>${IMG[u.photo] ? `<img class="avatar sm" src="${IMG[u.photo]}" alt="">` : ''}<span><strong style="font-weight:500">${esc(u.name)}</strong> · <span class="muted">${esc(u.title || '')}</span></span></label>`).join('')}</div>
      <div class="field"><label for="tm-lead">Contact principal du client</label><select id="tm-lead">${S.team.map((u) => `<option value="${u.id}" ${T.lead === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>
      <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer l’équipe</button></div></form>`;
  }
  const faces = (ids) => `<span class="faces-sm">${(ids || []).map((id) => { const u = S.team.find((x) => x.id === id); return u ? (IMG[u.photo] ? `<img src="${IMG[u.photo]}" alt="${esc(u.name)}" title="${esc(u.name)}">` : `<i title="${esc(u.name)}">${esc(u.name[0])}</i>`) : ''; }).join('')}</span>`;

  /* ---------- Vues agence ---------- */
  /* Ce qu'attend chaque espace : l'agence (à traiter), le client (validation, fichiers, paiement) ou personne. */
  const mineProjects = () => S.projects.filter((p) => !p.team || !p.team.members.length || p.team.members.includes(S.me.id));
  function waitingOf(p) {
    const a = p.alerts || Core.alerts(p);
    if (p.draft) return { who: 'agence', txt: 'Espace à ouvrir' };
    const ag = [a.newFiles && `${a.newFiles} fichier${a.newFiles > 1 ? 's' : ''}`, a.newMessages && `${a.newMessages} message${a.newMessages > 1 ? 's' : ''}`, a.changes && 'modifications demandées', a.requests && `demande${a.requests > 1 ? 's' : ''} sur le site`].filter(Boolean);
    const clw = [a.proposals && (a.proposals > 1 ? `${a.proposals} propositions` : 'une proposition'), a.waiting && (a.waiting > 1 ? `${a.waiting} validations` : 'une validation'), a.missing && !p.delivered && `${a.missing} fichier${a.missing > 1 ? 's' : ''} attendu${a.missing > 1 ? 's' : ''}`, a.due && (a.due > 1 ? `${a.due} factures à régler` : 'une facture à régler')].filter(Boolean);
    if (ag.length) return { who: 'agence', txt: ag.join(', '), both: clw.length ? clw.join(', ') : '' };
    const cl = [a.proposals && (a.proposals > 1 ? `${a.proposals} propositions` : 'une proposition'), a.waiting && (a.waiting > 1 ? `${a.waiting} validations` : 'une validation'), a.missing && `${a.missing} fichier${a.missing > 1 ? 's' : ''} attendu${a.missing > 1 ? 's' : ''}`, a.due && (a.due > 1 ? `${a.due} factures à régler` : 'une facture à régler')].filter(Boolean);
    if (cl.length && (!p.delivered || a.proposals)) return { who: 'client', txt: cl.join(', ') };
    return { who: '', txt: 'Rien en attente' };
  }
  function vClients() {
    const mine = S.mine !== false, q = norm(S.cq || ''), sort = S.csort || 'urgence';
    let P = mine ? S.projects.filter((p) => !p.team || !p.team.members.length || p.team.members.includes(S.me.id)) : S.projects.slice();
    if (q) P = P.filter((p) => norm(p.client + ' ' + p.projet + ' ' + (p.offerLabel || '')).includes(q));
    const rank = (p) => { const w = waitingOf(p); return w.who === 'agence' ? 0 : w.who === 'client' ? 1 : 2; };
    P.sort(sort === 'nom' ? (a, b) => a.client.localeCompare(b.client, 'fr') : sort === 'echeance' ? (a, b) => new Date(a.golive) - new Date(b.golive) : (a, b) => rank(a) - rank(b) || new Date(a.golive) - new Date(b.golive));
    const rows = P.map((p) => { const w = waitingOf(p), j = daysTo(p.golive);
      return `<tr><th scope="row"><button class="linklike" data-open="${esc(p.id)}"><span class="c-name">${esc(p.client)}</span><span class="small muted">${esc(p.projet)}</span></button></th>
        <td><span class="small">${esc(p.offerLabel || '')}</span><br><span class="small muted">${esc(p.phaseName)}</span></td>
        <td class="num">${p.archived ? '<span class="chip idle">Archivé</span>' : p.delivered ? '<span class="chip ok">En ligne</span>' : `<span class="${j < 0 ? 'chip warn' : j <= 14 ? 'chip hl' : 'small'}">${j < 0 ? `${-j} j de retard` : `dans ${j} j`}</span><br><span class="small muted">${fmt(p.golive)}</span>`}</td>
        <td>${w.who === 'agence' ? `<span class="chip warn">Agence</span> <span class="small">${esc(w.txt)}</span>${w.both ? `<br><span class="chip hl">Client</span> <span class="small">${esc(w.both)}</span>` : ''}` : w.who === 'client' ? `<span class="chip hl">Client</span> <span class="small">${esc(w.txt)}</span>` : `<span class="small muted">${esc(w.txt)}</span>`}</td>
        <td>${p.team ? faces(p.team.members) : ''}</td></tr>`; }).join('');
    const needs = P.filter((p) => waitingOf(p).who === 'agence').length;
    return `
    <div class="head"><div><h1>Clients</h1><p class="lead">${esc(cap(fmtLong(Date.now())))}</p></div><button class="btn btn-line" data-go="nouveau">${ic('plus')}Nouvel espace client</button></div>
    <div class="inbox-bar"><div class="cats" role="group" aria-label="Afficher"><button class="cat" data-mine="1" aria-pressed="${mine}"><strong>Mes clients</strong><span class="num">${S.projects.filter((p) => !p.team || !p.team.members.length || p.team.members.includes(S.me.id)).length}</span></button><button class="cat" data-mine="0" aria-pressed="${!mine}"><strong>Toute l’agence</strong><span class="num">${S.projects.length}</span></button></div>
      <div class="inline filters"><label class="sr" for="cl-q">Rechercher un client</label><input id="cl-q" type="search" placeholder="Rechercher un client" value="${esc(S.cq || '')}" data-clsearch="1">
      <label class="sr" for="cl-s">Trier</label><select id="cl-s" data-clsort="1">${[['urgence', 'Trier par urgence'], ['echeance', 'Trier par échéance'], ['nom', 'Trier par nom']].map(([v, l]) => `<option value="${v}" ${sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    ${needs ? `<div class="alert">${ic('alert')}<div><strong>${needs} client${needs > 1 ? 's' : ''} attend${needs > 1 ? 'ent' : ''} une action de l’agence.</strong> Fichiers à récupérer, messages, modifications, demandes sur le site ou espace à ouvrir.</div></div>` : ''}
    ${(() => { const L = S.projects.flatMap((p) => (p.proposalsSent || []).map((x) => ({ ...x, client: p.client, id: p.id }))); return L.length ? `<section class="panel"><div class="panel-head"><h2>${ic('doc')}Propositions en cours</h2><span class="aside">${L.length} chez les clients</span></div><ul class="list plain">${L.map((x) => `<li class="row"><div class="grow"><div class="title">${esc(x.client)} · ${esc(x.title)}</div><div class="sub">${money(x.ht)} HT · envoyée le ${fmt(x.sentAt, { day: 'numeric', month: 'long' })} · valable jusqu’au ${fmt(x.validUntil, { day: 'numeric', month: 'long' })}</div></div><button class="btn btn-line btn-sm" data-open="${esc(x.id)}">Ouvrir</button></li>`).join('')}</ul></section>` : ''; })()}
    <section class="panel flush"><div class="table-wrap"><table class="grid-clients"><caption class="sr">Espaces clients</caption><thead><tr><th scope="col">Client</th><th scope="col">Offre et étape</th><th scope="col">Échéance</th><th scope="col">En attente de</th><th scope="col">Équipe</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5"><div class="empty">${q ? 'Aucun client ne correspond à « ' + esc(S.cq) + ' ».' : 'Aucun espace client pour l’instant.'}</div></td></tr>`}</tbody></table></div></section>`;
  }
  const norm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function vNouveau() {
    return `
    <div class="head"><div><h1>Nouvel espace client</h1><p class="lead">Si son e-mail est saisi, le client reçoit une invitation, sans mot de passe à créer</p></div></div>
    <form class="panel form" data-form="create">
      <div class="line"><div class="field"><label for="n-client">Client</label><input id="n-client" type="text" required placeholder="ex. Nom de l’entreprise"></div>
      <div class="field"><label for="n-projet">Projet</label><input id="n-projet" type="text" placeholder="ex. Refonte du site"></div></div>
      <div class="line"><div class="field"><label for="n-contact">Prénom du contact</label><input id="n-contact" type="text" placeholder="ex. Prénom"></div>
      <div class="field"><label for="n-email">E-mail du contact</label><input id="n-email" type="email" placeholder="ex. claire@client.fr"></div></div>
      <div class="line"><div class="field"><label for="n-start">Démarrage</label><input id="n-start" type="date" value="${dayKey(Date.now())}"></div>
      <div class="field"><label for="n-ht">Montant HT (€)</label><input id="n-ht" type="number" min="0" step="10" placeholder="ex. 6900"></div></div>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:500;margin-bottom:8px">Offre</legend>
        <div class="offers">${Object.entries(Core.OFFERS).map(([k, o], i) => `<label class="offer"><input type="radio" name="n-offer" value="${k}" ${i === 0 ? 'checked' : ''}><span><strong>${esc(o.label)}</strong><span class="small muted">${o.phases.reduce((n, ph) => n + ph.items.length, 0)} livrables · ${o.validations.length} validation${o.validations.length > 1 ? 's' : ''} · ${o.phases[o.phases.length - 1].d[1]} jours</span></span></label>`).join('')}</div></fieldset>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:500;margin-bottom:8px">Tutoiement ou vouvoiement</legend>
        <div class="radio"><label><input type="radio" name="n-reg" value="vous"> Vouvoiement</label><label><input type="radio" name="n-reg" value="tu"> Tutoiement</label></div>
        <span class="small muted" id="n-reg-h">À choisir avec le client, jamais deviné.</span></fieldset>
      <p class="small muted">Les 4 étapes O.R.E.M. (Orienter, Représenter, Exécuter, Mesurer), les livrables et les validations de l’offre sont créés automatiquement, avec des dates indicatives calculées depuis le démarrage.</p>
      <div><button class="btn btn-primary" type="submit">Créer l’espace</button></div>
    </form>`;
  }

  const TABS = () => [['pilotage', 'Planning'], ['messages', 'Messages'], ['demandes', 'Demandes'], ['validations', 'Validations'], ['fichiers', 'Fichiers'], ['liens', 'Liens'], ['factures', 'Devis et factures'], ...(S.project && (S.project.phase >= 3 || S.project.deliveredAt) ? [['livraison', S.project.offer === 'site' ? 'Mise en ligne' : 'Livraison']] : []), ...(evoOpen(S.project) ? [['evolution', 'Évolution']] : []), ['acces', 'Accès et infos'], ['activite', 'Activité']];
  function vAdmin() {
    const p = S.project, a = Core.alerts(p);
    const tabCount = { fichiers: a.newFiles, validations: a.changes, messages: a.newMessages, demandes: a.requests, livraison: p.deliveredAt && p.review && !p.review.seen ? 1 : 0 };
    const body = ({ pilotage: tPilotage, messages: tMessages, demandes: tDemandes, liens: tLiens, validations: tValidations, fichiers: tFichiers, factures: tFactures, livraison: tLivraison, evolution: tEvolution, acces: tAcces, activite: tActivite }[S.tab] || tPilotage)();
    return `
    <div><button class="ghost" data-go="clients" style="padding-left:0">${ic('back')}Tous les clients</button></div>
    <div class="head"><div><h1>${esc(p.client)}</h1><p class="lead">${esc(p.projet)} · ${esc(Core.offerOf(p))} · ${esc(phName(p.phases[p.phase - 1]))}${p.deliveredAt ? ' · livré le ' + fmt(p.deliveredAt, { day: 'numeric', month: 'long' }) : ''}</p></div><div class="head-actions"><button class="btn btn-primary" data-act="compose">${ic('plus')}Ajouter</button><button class="btn btn-line" data-act="preview">${ic('eye')}Voir comme le client</button></div></div>
    ${statusBand(p)}
    ${p.draft ? `<form class="panel form draft" data-form="confirm"><div class="panel-head" style="margin:0"><h2>${ic('alert')}Espace préparé depuis ${esc(p.draft.from)}, à ouvrir</h2><span class="aside">Le client n’a pas encore accès</span></div>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:500;margin-bottom:8px">Offre</legend><div class="offers">${Object.entries(Core.OFFERS).map(([k, o]) => `<label class="offer"><input type="radio" name="cf-offer" value="${k}" ${p.offer === k ? 'checked' : ''}><span><strong>${esc(o.label)}</strong></span></label>`).join('')}</div></fieldset>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:500;margin-bottom:8px">Tutoiement ou vouvoiement</legend><div class="radio"><label><input type="radio" name="cf-reg" value="vous"> Vouvoiement</label><label><input type="radio" name="cf-reg" value="tu"> Tutoiement</label></div></fieldset>
      <div class="line"><div class="field"><label for="cf-n">Prénom du contact</label><input id="cf-n" type="text" value="${esc(p.draft.name || p.contactName)}"></div><div class="field"><label for="cf-e">E-mail du contact</label><input id="cf-e" type="email" value="${esc(p.draft.email)}"></div></div>
      <div><button class="btn btn-primary" type="submit">Ouvrir l’espace</button></div></form>` : ''}
    ${p.archivedAt ? `<div class="alert">${ic('lock')}<div><strong>Espace archivé le ${fmt(p.archivedAt, { day: 'numeric', month: 'long' })}.</strong> Le client le consulte en lecture seule. <button class="ghost" data-act="unarchive">Désarchiver</button></div></div>` : ''}
    <div class="tabs" role="tablist" aria-label="Fiche ${esc(p.client)}">${TABS().map(([id, l]) => `<button role="tab" id="tab-${id}" aria-controls="tabpanel" aria-selected="${S.tab === id}" tabindex="${S.tab === id ? 0 : -1}" data-tab="${id}">${l}${tabCount[id] ? `<span class="badge">${tabCount[id]}<span class="sr"> à traiter</span></span>` : ''}</button>`).join('')}</div>
    <div role="tabpanel" id="tabpanel" aria-labelledby="tab-${S.tab}" class="tabpanel">${body}</div>`;
  }
  function statusBand(p) {
    if (p.draft || p.archivedAt) return '';
    const a = Core.alerts(p), days = (d) => Math.max(0, -daysTo(d)), since = (d) => (days(d) ? `depuis ${days(d)} jour${days(d) > 1 ? 's' : ''}` : 'depuis aujourd’hui');
    const ag = [a.newFiles && [`${a.newFiles} fichier${a.newFiles > 1 ? 's' : ''} à récupérer`, 'fichiers'], a.newMessages && [`${a.newMessages} message${a.newMessages > 1 ? 's' : ''} sans réponse`, 'messages'], a.changes && ['Modifications demandées', 'validations'], a.requests && [`${a.requests} demande${a.requests > 1 ? 's' : ''} sur le site`, 'demandes']].filter(Boolean);
    const ready = p.validations.filter((v) => v.status === 'ready'), due = p.invoices.filter((i) => i.status === 'due');
    const cl = [...ready.map((v) => `${v.t} : à valider ${since(v.readyAt)}`), ...p.missing.slice(0, 2).map((m) => `${m.t} : fichier attendu`), ...due.map((i) => `${i.label} : à régler${i.date ? ' ' + since(i.date) : ''}`)];
    return `<section class="band" aria-label="État du projet">
      <div><div class="k">L’agence</div>${ag.length ? ag.map(([t, tab]) => `<button class="linklike" data-tab="${tab}">${esc(t)}</button>`).join('') : '<span class="muted">Rien à traiter</span>'}</div>
      <div><div class="k">${esc(p.contactName || 'Le client')}</div>${cl.length ? cl.map((t) => `<span>${esc(t)}</span>`).join('') : '<span class="muted">Rien en attente</span>'}${ready.length || p.missing.length ? `<button class="btn btn-line btn-sm" data-act="remind">${ic('mail')}Relancer</button>` : ''}</div>
      <div><div class="k">Échéance</div><span>${p.deliveredAt ? 'En ligne depuis le ' + fmt(p.deliveredAt, { day: 'numeric', month: 'long' }) : `${p.offer === 'site' ? 'Mise en ligne' : 'Livraison'} ${daysTo(p.golive) >= 0 ? 'J-' + daysTo(p.golive) : 'dépassée de ' + -daysTo(p.golive) + ' j'}, le ${fmt(p.golive, { day: 'numeric', month: 'long' })}`}</span></div>
    </section>`;
  }
  const GO_OPTS = [['accueil', 'Aucun bouton'], ['cal', 'Prise de rendez-vous'], ['valider', 'À valider'], ['fichiers', 'Fichiers'], ['projet', 'Étapes'], ['documents', 'Devis et factures'], ['equipe', 'Équipe et aide']];
  function setupAdmin() {
    const st = setupSteps(); if (!st.length || st.every((x) => x.st === 'done')) return '';
    const V = S.vaultOpen;
    const line = (x) => { const t = x.task, i0 = (t && t.info) || {};
      const what = x.k === 'acompte' ? (x.st === 'done' ? 'Reçu' : 'En attente du virement' + (x.sub ? ' · ' + x.sub : ''))
        : x.k === 'webflow' ? (t.sent ? `Espace « ${esc(i0.ws)} », envoyé le ${fmt(t.sent)} : vérifiez l’invitation reçue sur Webflow` : 'Pas encore fait')
        : t.sent ? `${esc(i0.domain)}${i0.registrar ? ' chez ' + esc(i0.registrar) : ''} · ${{ delegate: 'accès délégué', vault: 'identifiants dans le coffre chiffré', unknown: 'le client ne sait pas qui le gère' }[i0.mode] || ''}` : 'Pas encore fait';
      const btns = x.k !== 'acompte' && t.sent && !t.done ? `${x.k === 'domaine' && i0.mode === 'vault' && S.vault ? (V ? `<button class="btn btn-line btn-sm" data-act="vault-hide">Masquer</button>` : `<button class="btn btn-line btn-sm" data-act="vault-open">${ic('lock')}Afficher les accès</button>`) : ''}<button class="btn btn-primary btn-sm" data-act="setup-ok" data-id="${t.id}" data-k="${x.k}">C’est vérifié</button><button class="btn btn-line btn-sm" data-act="setup-retry" data-id="${t.id}">Demander de reprendre</button>` : '';
      return `<div class="row"><span class="rank ${x.st === 'done' ? 'ok' : ''}">${x.st === 'done' ? ic('check') : String(st.indexOf(x) + 1).padStart(2, '0')}</span><div class="grow"><div class="title">${esc(x.t)} ${SETUP_CHIP[x.st]}</div><div class="sub">${what}</div>
        ${x.k === 'domaine' && V ? `<dl class="kv vault-o"><dt>Identifiant</dt><dd class="num">${esc(V.login)}</dd><dt>Mot de passe</dt><dd class="num">${esc(V.secret)}</dd>${V.note ? `<dt>Précision</dt><dd>${esc(V.note)}</dd>` : ''}</dl><p class="hint">Consultation inscrite dans l’historique du client. Effacement automatique le ${fmt(V.expires, { day: 'numeric', month: 'long' })}, ou dès que vous cliquez « Vérifié ».</p>` : ''}</div><div class="inline">${btns}</div></div>`; };
    return `<section class="panel" aria-labelledby="sua-h"><div class="panel-head"><h2 id="sua-h">${ic('ok')}Bien démarrer</h2><span class="aside">Les priorités du client à l’arrivée</span></div><div class="list">${st.map(line).join('')}</div></section>`;
  }
  function tPilotage() {
    const p = S.project;
    return `
    ${setupAdmin()}
    ${p.offer === 'evolution' ? `<section class="panel" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><div><h2>${ic('cal')}Évolution · mois ${p.cycle || 1}</h2><p class="small muted">Depuis le ${fmt(p.start, { day: 'numeric', month: 'long' })}${(p.cycles || []).length ? ' · ' + p.cycles.length + ' mois précédent' + (p.cycles.length > 1 ? 's' : '') : ''}</p></div><button class="btn btn-line btn-sm" data-act="cycle-next">Démarrer le mois ${(p.cycle || 1) + 1}</button></section>` : ''}
    <form class="panel form" data-form="phase" data-autosave="1"><div class="panel-head" style="margin:0"><h2>${ic('map')}Étape en cours</h2><span class="aside save-st" aria-live="polite"></span></div>
      <div class="inline"><select id="a-phase" aria-label="Étape en cours">${p.phases.map((x) => `<option value="${x.n}" ${x.n === p.phase ? 'selected' : ''}>${esc(phName(x))}</option>`).join('')}</select></div></form>
    <form class="panel form" data-form="next" data-autosave="1"><div class="panel-head" style="margin:0"><h2>${ic('arrow')}Prochaine action affichée au client</h2><span class="aside save-st" aria-live="polite">Enregistrement automatique</span></div>
      <div class="field"><label for="a-nt">Titre</label><input id="a-nt" type="text" value="${esc(p.next.title)}" placeholder="${esc(Core.nextStep({ ...p, next: {} }).title)}"></div>
      <div class="field"><label for="a-nx">Texte</label><textarea id="a-nx" placeholder="Une ou deux phrases : ce qu’on attend et pourquoi.">${esc(p.next.text)}</textarea></div>
      <div class="inline"><label for="a-ng" style="flex:none">Bouton vers</label><select id="a-ng">${GO_OPTS.map(([v, l]) => `<option value="${v}" ${p.next.go === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <p class="small muted">Titre vide : l’espace affiche tout seul la prochaine action (validation en attente, puis fichiers manquants).</p></form>
    <form class="panel form" data-form="meeting" data-autosave="1"><div class="panel-head" style="margin:0"><h2>${ic('cal')}Prochain rendez-vous</h2><span class="aside save-st" aria-live="polite">Enregistrement automatique</span></div>
      <div class="line"><div class="field"><label for="a-mt">Intitulé</label><input id="a-mt" type="text" value="${esc(p.meeting.title)}" placeholder="ex. Point d’étape (visio, 30 min)"></div><div class="field"><label for="a-mw">Date et heure</label><input id="a-mw" type="datetime-local" value="${dtKey(p.meeting.when)}"></div></div></form>
    <form class="panel form" data-form="note"><div class="panel-head" style="margin:0"><h2>${ic('cal')}Point de la semaine</h2>${p.note.at ? `<span class="small muted">Publié le ${fmt(p.note.at)}</span>` : ''}</div>
      <label class="sr" for="a-note">Point de la semaine</label><textarea id="a-note" placeholder="ex. Ce qui a été fait, ce qui vient." data-draft="note">${esc((S.drafts[p.id] && S.drafts[p.id].note) ?? p.note.text)}</textarea>
      ${S.drafts[p.id] && S.drafts[p.id].note !== undefined && S.drafts[p.id].note !== p.note.text ? '<p class="hint">Brouillon non publié, conservé sur cet appareil.</p>' : ''}
      <div class="inline"><button class="btn btn-primary btn-sm" type="submit">Publier au client</button><span class="small muted">Il le reçoit par e-mail s’il l’a demandé.</span></div></form>
    <section class="panel"><div class="panel-head"><h2>${ic('doc')}Livrables par étape</h2><span class="small muted">Visibles dans « Étapes » côté client</span></div>
      ${p.phases.map((ph) => `<details class="ph-fold" ${phS(ph) === 'on' ? 'open' : ''}><summary class="phase-title">${esc(phName(ph))} <span class="small muted">· ${ph.items.filter((it) => itS(it) === 'done').length} sur ${ph.items.length} faits</span></summary>${ph.items.map((it) => `<div class="it"><div>${esc(it.t)}${whoHtml(it)}<button class="linkish small" type="button" data-act="item-edit" data-id="${esc(it.id)}" aria-expanded="${S.itemEdit === it.id}">Modifier qui fait quoi et le lien</button>${S.itemEdit === it.id ? itemEditor(it) : ''}${it.val ? `<div class="small muted">Lié à la validation « ${esc((p.validations.find((v) => v.key === it.val) || {}).t || '')} »${itS(it) === 'review' ? ' : en attente du client' : itS(it) === 'done' && it.status !== 'done' ? ' : validé' : ''}</div>` : ''}</div>
        ${it.val && itS(it) !== 'wait' && itS(it) !== 'on' ? `<span class="chip ${itS(it) === 'done' ? 'ok' : 'warn'}">${itS(it) === 'done' ? 'Validé' : 'Chez le client'}</span>` : `<select data-item="${esc(it.id)}" aria-label="Statut : ${esc(it.t)}">${[['wait', 'Prévu'], ['on', 'En cours'], ...(it.val ? [] : [['done', 'Fait']])].map(([v, l]) => `<option value="${v}" ${(it.status === 'done' && it.val ? 'on' : it.status) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`}
        <input type="date" data-itemdate="${esc(it.id)}" value="${dayKey(it.due)}" aria-label="Date prévue : ${esc(it.t)}"></div>`).join('')}</details>`).join('')}</section>
    <div class="grid2">
      <section class="panel"><div class="panel-head"><h2>${ic('ok')}Actions du client</h2></div>
        <div class="list">${p.tasks.map((t) => `<div class="row"><span class="check ${t.done ? 'done' : ''}">${t.done ? ic('check') : ''}</span><div class="grow">${esc(t.t)}</div><button class="x" data-act="task-remove" data-id="${esc(t.id)}" aria-label="Retirer">×</button></div>`).join('') || '<p class="small muted">Aucune action manuelle. Les validations et fichiers manquants s’ajoutent tout seuls.</p>'}</div>
        <form class="inline" data-form="task" style="margin-top:12px"><input id="a-task" type="text" placeholder="ex. Valider les textes de la page Contact" aria-label="Nouvelle action"><button class="btn btn-line btn-sm" type="submit">Ajouter</button></form></section>
      <section class="panel"><div class="panel-head"><h2>${ic('folder')}Fichiers attendus</h2></div>
        <div class="list">${p.missing.map((m) => `<div class="row"><div class="grow"><div class="title" style="font-weight:400">${esc(m.t)}</div>${m.sub ? `<div class="sub">${esc(m.sub)}</div>` : ''}</div><button class="x" data-act="missing-remove" data-id="${esc(m.id)}" aria-label="Retirer">×</button></div>`).join('') || '<p class="small muted">Rien n’est attendu.</p>'}</div>
        <form class="form" data-form="missing" style="margin-top:12px;gap:8px"><input id="a-mi" type="text" placeholder="ex. Plan d’accès en PDF" aria-label="Fichier attendu"><input id="a-ms" type="text" placeholder="Précision (facultatif)" aria-label="Précision"><div><button class="btn btn-line btn-sm" type="submit">Ajouter</button></div></form></section>
    </div>`;
  }
  function tValidations() {
    const p = S.project;
    const chip = { wait: '<span class="chip idle">Pas encore demandée</span>', ready: '<span class="chip hl">Chez le client</span>', approved: '<span class="chip ok">Validé</span>', changes: '<span class="chip warn">Modifications demandées</span>' };
    const label = { approved: 'a validé', changes: 'a demandé des modifications', requested: 'validation demandée', reset: 'remise en attente' };
    return p.validations.map((v) => `<section class="panel form">
      <div class="panel-head" style="margin:0"><h2>${esc(v.t)}</h2>${chip[v.status]}</div>
      <p class="small muted" style="margin-top:-8px">${esc(Core.reg(v.sub, p.registre))} · prévue vers le ${fmt(v.due)}</p>
      <form class="inline" data-form="valreq" data-id="${esc(v.id)}"><input type="url" id="vl-${v.id}" value="${esc(v.link)}" placeholder="Lien à regarder (Figma, prévisualisation Webflow…)" aria-label="Lien pour ${esc(v.t)}">
        <button class="btn btn-primary btn-sm" type="submit">${v.status === 'ready' ? 'Mettre à jour' : v.status === 'changes' ? 'Redemander la validation' : 'Demander la validation'}</button>
        ${v.status !== 'wait' ? `<button class="btn btn-line btn-sm" type="button" data-act="valreset" data-id="${esc(v.id)}">Remettre en attente</button>` : ''}</form>
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
      ${upState()}
      <p class="small muted" style="margin-bottom:12px">« Livrable » apparaît dans Fichiers côté client. Devis, factures, contrat et RIB apparaissent dans « Devis et factures ».</p>
      <div class="list">${fromAgency.map(fileRow).join('') || '<p class="muted">Rien de partagé pour l’instant.</p>'}</div></section>`;
  }
  function propEditor() {
    const p = S.project, D0 = S.propDraft && S.propDraft.pid === p.id ? S.propDraft : null;
    const edit = D0 && D0.prid ? (p.proposals || []).find((x) => x.id === D0.prid) : null, base = edit || D0 || {};
    const L = p.proposals || [];
    const st = { draft: '<span class="chip idle">Brouillon</span>', sent: '<span class="chip hl">Chez le client</span>', accepted: '<span class="chip ok">Acceptée</span>', declined: '<span class="chip warn">Déclinée</span>' };
    return `<section class="panel"><div class="panel-head"><h2>${ic('doc')}Propositions et devis</h2>${D0 ? '' : '<button class="btn btn-line btn-sm" data-act="prop-new">Nouvelle proposition</button>'}</div>
      <ul class="list plain">${L.map((x) => `<li class="row"><div class="grow"><div class="title">${esc(x.title)}</div><div class="sub">${money(x.lines.reduce((t, l) => t + l.ht, 0))} HT${x.from ? ' · depuis une demande' : ''}${x.acceptedAt ? ' · acceptée le ' + fmt(x.acceptedAt, { day: 'numeric', month: 'long' }) + ' par « ' + esc(x.signName) + ' »' : x.sentAt ? ' · envoyée le ' + fmt(x.sentAt, { day: 'numeric', month: 'long' }) : ''}${x.declined && x.declined.comment ? ' · « ' + esc(x.declined.comment) + ' »' : ''}</div></div>${st[x.status] || ''}${x.status !== 'accepted' ? `<button class="btn btn-line btn-sm" data-act="prop-edit" data-id="${esc(x.id)}">Modifier</button>` : ''}${x.status === 'draft' || x.status === 'declined' ? `<button class="btn btn-primary btn-sm" data-act="prop-send" data-id="${esc(x.id)}">Envoyer</button>` : ''}</li>`).join('') || '<p class="muted">Aucune proposition. La proposition d’avant signature et les devis des demandes se préparent ici.</p>'}</ul>
      ${D0 ? `<form class="form" data-form="proposal" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line)">
        <div class="line"><div class="field"><label for="pp-t">Titre</label><input id="pp-t" type="text" value="${esc(base.title || '')}" placeholder="ex. Refonte du site"></div><div class="field"><label for="pp-q">N° de devis</label><input id="pp-q" type="text" value="${esc(base.quote || '')}" placeholder="ex. D-2026-0160"></div></div>
        <div class="field"><label for="pp-i">Introduction</label><textarea id="pp-i" rows="3" placeholder="ex. Ce qu’on a compris de votre besoin">${esc(base.intro || '')}</textarea></div>
        <div class="field"><label for="pp-l">Lignes : libellé | montant HT</label><textarea id="pp-l" rows="4" placeholder="ex. Atelier de cadrage | 900">${esc((base.lines || []).map((l) => l.t + ' | ' + l.ht).join('\n'))}</textarea></div>
        <label class="opt"><input type="checkbox" id="pp-evo" ${(D0p => D0p && D0p.kind === 'evolution')((S.project.proposals || []).find((x) => x.id === (S.propDraft || {}).prid))  ? 'checked' : ''}> Offre Évolution : la signature active l’abonnement mensuel du client</label>
        <div class="line"><div class="field"><label for="pp-d">Acompte (%)</label><input id="pp-d" type="number" min="0" max="100" value="${base.depositPct ?? (base.rid ? 0 : 50)}"></div><div class="field"><label for="pp-v">Valable jusqu’au</label><input id="pp-v" type="date" value="${dayKey(base.validUntil || Date.now() + 30 * 864e5)}"></div></div>
        <div class="inline"><button class="btn btn-line" type="submit" name="pp-go" value="save">Enregistrer le brouillon</button><button class="btn btn-primary" type="submit" name="pp-go" value="send">Envoyer au client</button><button class="ghost" type="button" data-act="prop-cancel">Annuler</button></div></form>` : ''}</section>`;
  }
  function tFactures() {
    const p = S.project, b = p.billing;
    return `${propEditor()}
    <form class="panel form" data-form="billing" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('doc')}Montant du projet</h2></div>
      <div class="line"><div class="field"><label for="b-ht">Montant HT (€)</label><input id="b-ht" type="number" min="0" step="0.01" value="${b.totalHT}"></div><div class="field"><label for="b-q">N° de devis</label><input id="b-q" type="text" value="${esc(b.quote)}" placeholder="ex. D-2026-0142"></div></div>
      <div><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>
    <section class="panel"><div class="panel-head"><h2>${ic('doc')}Factures</h2></div>
      <div class="list">${p.invoices.map((i) => `<div class="row"><div class="grow"><div class="title">${esc(i.label)} ${esc(i.num)}</div><div class="sub num">${money(i.ht)} HT · ${money(i.ttc)} TTC</div></div>
        <select data-inv="${esc(i.id)}" style="width:auto" aria-label="Statut de la facture">${[['future', 'À venir'], ['due', 'À régler'], ['paid', 'Payée']].map(([v, l]) => `<option value="${v}" ${i.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        ${i.status === 'due' ? `<form class="inline" data-form="payurl" data-id="${esc(i.id)}" style="margin:-4px 0 10px"><input type="url" id="pu-${i.id}" value="${esc(i.payUrl || '')}" placeholder="Lien de paiement (facultatif)" aria-label="Lien de paiement : ${esc(i.label)}"><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></form>` : ''}`).join('') || '<p class="muted">Aucune facture.</p>'}</div>
      ${(S.connectors || []).some((c) => ['abby', 'qonto'].includes(c.id) && c.configured) ? `<div class="inline" style="margin-top:12px">${(S.connectors || []).filter((c) => ['abby', 'qonto'].includes(c.id) && c.configured).map((c) => `<button class="btn btn-line btn-sm" data-act="sync" data-id="${esc(c.id)}" data-project="1">Synchroniser avec ${esc(c.label)}</button>`).join('')}</div>` : ''}
      <form class="form" data-form="invoice" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line)">
        <div class="line"><div class="field"><label for="i-l">Libellé</label><input id="i-l" type="text" placeholder="ex. Facture d’acompte (50 %)"></div><div class="field"><label for="i-n">Numéro</label><input id="i-n" type="text" placeholder="ex. F-2026-0187"></div></div>
        <div class="line"><div class="field"><label for="i-ht">Montant HT (€)</label><input id="i-ht" type="number" min="0" step="0.01"></div><div class="field"><label for="i-s">Statut</label><select id="i-s"><option value="due">À régler</option><option value="paid">Payée</option><option value="future">À venir</option></select></div></div>
        <div><button class="btn btn-line btn-sm" type="submit">Ajouter la facture</button></div>
        <p class="small muted">Le PDF se dépose dans l’onglet Fichiers, catégorie « Facture ». Avec Abby et Qonto connectés (Réglages), factures et paiements arrivent tout seuls.</p></form></section>`;
  }
  function tAcces() {
    const p = S.project;
    return `${teamPanel()}
    <section class="panel"><div class="panel-head"><h2>${ic('team')}Personnes qui ont accès</h2></div>
      <div class="list">${S.access.map((u) => `<div class="row"><span class="ico">${ic('mail')}</span><div class="grow"><div class="title">${esc(u.name)}</div><div class="sub">${esc(u.email)} · ${u.lastLoginAt ? 'connecté le ' + fmt(u.lastLoginAt, { day: 'numeric', month: 'long' }) : u.invitedAt ? 'invité le ' + fmt(u.invitedAt, { day: 'numeric', month: 'long' }) + ', pas encore connecté' : 'pas encore invité'}</div></div>${p.draft ? '' : `<button class="btn btn-line btn-sm" data-act="reinvite" data-id="${esc(u.id)}">${u.invitedAt ? 'Renvoyer l’invitation' : 'Inviter'}</button>`}<button class="x" data-act="user-remove" data-id="${esc(u.id)}" aria-label="Retirer l’accès de ${esc(u.email)}">×</button></div>`).join('') || '<p class="muted">Personne pour l’instant.</p>'}</div>
      <form class="inline" data-form="user" style="margin-top:14px"><input id="u-n" type="text" placeholder="Prénom" aria-label="Prénom" style="flex:0 1 140px"><input id="u-e" type="email" placeholder="adresse@client.fr" aria-label="E-mail"><button class="btn btn-line btn-sm" type="submit">Donner l’accès</button></form>
      <p class="small muted" style="margin-top:10px">Chaque personne se connecte avec son e-mail : un lien et un code à 6 chiffres, sans mot de passe ni compte Google.</p></section>
    ${logoPanel()}
    <form class="panel form" data-form="infos" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('globe')}Infos du projet</h2></div>
      <div class="line"><div class="field"><label for="p-c">Client</label><input id="p-c" type="text" value="${esc(p.client)}"></div><div class="field"><label for="p-p">Projet</label><input id="p-p" type="text" value="${esc(p.projet)}"></div></div>
      <div class="line"><div class="field"><label for="p-ct">Prénom du contact</label><input id="p-ct" type="text" value="${esc(p.contactName)}"></div><div class="field"><label for="p-g">Mise en ligne prévue</label><input id="p-g" type="date" value="${dayKey(p.golive)}"></div></div>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:500;margin-bottom:8px">Tutoiement ou vouvoiement</legend><div class="radio"><label><input type="radio" name="p-r" value="vous" ${p.registre !== 'tu' ? 'checked' : ''}> Vouvoiement</label><label><input type="radio" name="p-r" value="tu" ${p.registre === 'tu' ? 'checked' : ''}> Tutoiement</label></div></fieldset>
      <div><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>
    <form class="panel form" data-form="ext" data-autosave="submit"><div class="panel-head" style="margin:0"><h2>${ic('globe')}Outils de l’agence</h2><span class="aside">Pour les synchronisations automatiques</span></div>
      <div class="line"><div class="field"><label for="x-a">Identifiant du client dans Abby</label><input id="x-a" type="text" value="${esc((p.ext || {}).abby)}"></div><div class="field"><label for="x-d">Dossier Google Drive du client</label><input id="x-d" type="text" value="${esc((p.ext || {}).drive)}" placeholder="https://drive.google.com/drive/folders/…"></div></div>
      <div class="line"><div class="field"><label for="x-g">Propriété Google Analytics 4</label><input id="x-g" type="text" value="${esc((p.ext || {}).ga4)}" placeholder="ex. 312345678"></div><div class="field"><label for="x-s">Site Search Console</label><input id="x-s" type="text" value="${esc((p.ext || {}).gsc)}" placeholder="ex. sc-domain:client.fr"></div></div>
      <div class="field"><label for="x-f">Fichier Figma des visuels (pages « Bento » et « Cas d’étude »)</label><input id="x-f" type="url" value="${esc((p.ext || {}).figma)}" placeholder="https://www.figma.com/design/…"><p class="hint">Sans adresse ici, l’import utilise le lien Figma du projet. Les cadres de ces deux pages arrivent dans la bibliothèque du client, en PNG.</p></div>${(S.connectors || []).some((c) => c.id === 'figma' && c.configured) ? `<div class="inline"><button class="btn btn-line btn-sm" type="button" data-act="sync" data-id="figma" data-project="1">${ic('figma')}Importer les visuels depuis Figma</button></div>` : ''}
      <p class="hint">Les fichiers déposés par le client sont copiés dans ce dossier dès que Google est connecté, et le bilan mensuel se calcule tout seul. Partagez le dossier, la propriété et le site avec le compte de service.</p>
      <div><button class="btn btn-line btn-sm" type="submit">Enregistrer</button></div></form>`;
  }
  function logoPanel() {
    const p = S.project, B = p.brand || {};
    return `<section class="panel"><div class="panel-head"><h2>${ic('eye')}Logo du client</h2><span class="aside">Affiché dans son espace : barre latérale, accueil, visite guidée</span></div>
        <div class="logo-prev">${B.logo ? `<span class="lp dark">${clientLogo(p, 'dark')}</span><span class="lp light">${clientLogo(p, 'light')}</span>` : '<p class="muted">Pas encore de logo : le nom du client s’affiche à la place.</p>'}</div>
        <div class="line"><div class="field"><label for="br-l">${B.logo ? 'Remplacer le logo' : 'Ajouter le logo'} (SVG ou PNG transparent)</label><input id="br-l" type="file" accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp" data-logo="1"></div>
        <div class="field"><label for="br-t">Affichage</label><select id="br-t" data-logotone="1"><option value="mono" ${B.logoTone !== 'color' ? 'selected' : ''}>En blanc ou en noir selon le fond</option><option value="color" ${B.logoTone === 'color' ? 'selected' : ''}>Dans ses couleurs d’origine</option></select></div></div>
        ${B.logo ? '<div><button class="btn btn-line btn-sm" data-act="logo-remove">Retirer le logo</button></div>' : ''}</section>`;
  }
  function itemEditor(it) {
    const W = Core.itemWho(it), g = it.link || '', has = (w) => W.find((x) => x[0] === w);
    const people = [...S.team.map((u) => [u.id, u.name.split(' ')[0]]), ['client', S.project.contactName || 'Client']];
    return `<form class="form it-edit" data-form="itemmeta" data-id="${esc(it.id)}">${people.map(([id, n]) => `<div class="inline"><label class="opt" style="flex:0 0 130px"><input type="checkbox" name="iw" value="${id}" ${has(id) ? 'checked' : ''}> ${esc(n)}</label><label class="sr" for="iw-${id}">Ce que fait ${esc(n)}</label><input id="iw-${id}" type="text" value="${esc((has(id) || [])[1] || '')}" placeholder="ex. dessine les maquettes"></div>`).join('')}
      <div class="field"><label for="il-${esc(it.id)}">Lien (adresse https, ou vide pour le lien automatique : ${esc(GO_LBL[Core.itemGo({ t: it.t })] || 'aucun')})</label><input id="il-${esc(it.id)}" type="text" value="${esc(/^https:/.test(g) ? g : '')}" placeholder="https://…"></div>
      <div class="inline"><button class="btn btn-primary btn-sm" type="submit">Enregistrer</button><button class="btn btn-line btn-sm" type="button" data-act="item-edit" data-id="">Fermer</button></div></form>`;
  }
  /* Agence : l'espace Évolution du client (visio du mois, axes, bilans). */
  const WHO_KEYS = { louis: 'u_louis', theophile: 'u_theo', 'théophile': 'u_theo', clement: 'u_clement', 'clément': 'u_clement', client: 'client', tous: 'both', agence: 'both' };
  const ST_KEYS = { 'prévu': 'todo', prevu: 'todo', 'en cours': 'on', fait: 'done' };
  function tEvolution() {
    const p = S.project, e = p.evo || { axes: [], reports: [], next: [] }, open = (e.reschedule || []).filter((r) => r.status === 'open');
    const whoTxt = (w) => ({ u_louis: 'Louis', u_theo: 'Théophile', u_clement: 'Clément', client: 'client', both: 'tous' }[w] || 'tous');
    const stTxt = { todo: 'prévu', on: 'en cours', done: 'fait' };
    const local = (d) => (d ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : '');
    return `${open.length ? `<section class="panel warn-p"><div class="panel-head"><h2>${ic('cal')}Demande de changement de créneau</h2></div>${open.map((r) => `<p>« ${esc(r.text)} » <span class="small muted">${esc(who(r.by))}, ${fmt(r.at, { day: 'numeric', month: 'long' })}</span></p>`).join('')}<p class="hint">Fixez la nouvelle date ci-dessous : le client est prévenu et la demande se ferme.</p></section>` : ''}
    <form class="panel form" data-form="evo-meet"><div class="panel-head" style="margin:0"><h2>${ic('cal')}Abonnement et visio de pilotage</h2></div>
      <label class="opt"><input type="checkbox" id="ev-on" ${e.active ? 'checked' : ''}> Évolution active pour ce client</label>
      <div class="line"><div class="field"><label for="ev-w">Prochaine visio</label><input id="ev-w" type="datetime-local" value="${local(e.meeting && e.meeting.when)}"></div><div class="field"><label for="ev-m">Format</label><input id="ev-m" type="text" value="${esc((e.meeting && e.meeting.mode) || 'Visio de pilotage (45 min)')}"></div></div>
      <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer</button></div></form>
    <form class="panel form" data-form="evo-axes"><div class="panel-head" style="margin:0"><h2>${ic('ok')}Améliorations en cours</h2><span class="aside">Une ligne par axe : titre | effet attendu | qui | échéance AAAA-MM-JJ | prévu, en cours ou fait | priorité</span></div>
      <label class="sr" for="ev-ax">Axes</label><textarea id="ev-ax" rows="6" placeholder="Mesurer les demandes jusqu’au CRM | Savoir d’où viennent les demandes | Louis | 2026-10-23 | en cours | priorité">${esc((e.axes || []).map((a) => [a.t, a.effect, whoTxt(a.who), a.due ? dayKey(a.due) : '', stTxt[a.status], a.priority ? 'priorité' : ''].join(' | ').replace(/( \| )+$/, '')).join('\n'))}</textarea>
      <div class="field"><label for="ev-nx">Les mois suivants : mois | ce qu’on prévoit</label><textarea id="ev-nx" rows="3">${esc((e.next || []).map((x) => x.join(' | ')).join('\n'))}</textarea></div>
      <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer les axes</button></div></form>
    <form class="panel form" data-form="evo-report"><div class="panel-head" style="margin:0"><h2>${ic('doc')}Publier le bilan du mois</h2><span class="aside">${(e.reports || []).length} bilan${(e.reports || []).length > 1 ? 's' : ''} publié${(e.reports || []).length > 1 ? 's' : ''}</span></div>
      <div class="line"><div class="field"><label for="er-m">Mois</label><input id="er-m" type="month" value="${new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 7)}"></div><div class="field"><label for="er-t">Titre</label><input id="er-t" type="text" placeholder="ex. Le site attire davantage, il reste à mesurer ce qu’il rapporte"></div></div>
      <div class="field"><label for="er-s">L’essentiel en deux phrases</label><textarea id="er-s" rows="2"></textarea></div>
      <div class="line"><div class="field"><label for="er-k">Chiffres : valeur | libellé | écart</label><textarea id="er-k" rows="4" placeholder="1 838 | visites sur le site | +17,8 % sur août"></textarea></div><div class="field"><label for="er-d">Travail réalisé : titre | précision</label><textarea id="er-d" rows="4"></textarea></div></div>
      <div class="field"><label for="er-f">Le document présenté en visio (PDF) : le client pourra le consulter et le télécharger</label><input id="er-f" type="file" accept="application/pdf,.pdf"></div>
      <div><button class="btn btn-primary btn-sm" type="submit">Publier le bilan</button></div></form>`;
  }
  function tActivite() {
    const p = S.project;
    return `<section class="panel"><div class="list">${p.activity.map((a) => `<div class="row"><div class="grow"><div class="title" style="font-weight:400"><strong style="font-weight:500">${esc(who(a.by))}</strong> ${esc(a.text)}</div><div class="sub">${fmt(a.at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div></div>${a.seen === false ? '<span class="chip warn">Nouveau</span>' : ''}</div>`).join('') || '<p class="muted">Aucune activité.</p>'}</div></section>`;
  }

  /* ---------- Connexion ---------- */
  function vConnexion() {
    const L = S.login;
    if (S.linkToken) return `<main class="login" id="main"><section class="login-art"><div class="brand" style="padding:0"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b></div><div style="margin-block:40px"><div class="k">Espace client</div><p class="art-t">Tout votre projet, au même endroit.</p></div><p class="small art-foot" style="color:var(--night-muted)">Orem, marque d\u2019ICONOKOM · agence-orem.fr</p></section>
      <section class="login-form"><form data-form="linkauth" novalidate><div><h1 style="font-size:26px">Confirmer la connexion</h1><p class="muted" style="margin-top:8px">Vous avez cliqué sur le lien reçu par e-mail. Confirmez pour ouvrir votre espace sur cet appareil.</p></div><button class="btn btn-primary" type="submit">Ouvrir mon espace</button><button class="ghost" type="button" data-act="link-cancel" style="justify-content:center">Utiliser un code à la place</button></form></section></main>`;
    const demo = API.demo ? `<div class="or">ou, pour la démo</div><div class="demo-pick"><button class="btn btn-line" type="button" data-act="demo-as" data-email="claire@maisonlumen.fr">Entrer comme cliente (Claire, Maison Lumen)</button><button class="btn btn-line" type="button" data-act="demo-as" data-email="louis@agence-orem.fr">Entrer comme agence (Louis)</button></div>` : '';
    const expired = /lien=expire/.test(location.search) ? '<div class="alert">' + ic('alert') + '<div>Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau.</div></div>' : '';
    const form = L.step === 'email'
      ? `<form data-form="login" novalidate>
          <div><h1 style="font-size:28px">Connexion à votre espace</h1><p class="muted" style="margin-top:8px">Saisissez l’adresse e-mail à laquelle l’agence vous écrit. Vous recevez un lien et un code : pas de mot de passe à retenir.</p></div>
          ${expired}
          <div class="field"><label for="em">Adresse e-mail</label><input id="em" type="email" autocomplete="email" placeholder="vous@entreprise.fr" value="${esc(L.email)}" required></div>
          <button class="btn btn-primary" type="submit">${ic('mail')}Recevoir mon lien de connexion</button>
          ${demo}
        </form>`
      : `<form data-form="verify" novalidate>
          <div><h1 style="font-size:28px">Vérifiez votre boîte mail</h1><p class="muted" style="margin-top:8px">Si <strong style="color:var(--fg)">${esc(L.email)}</strong> a un espace, un e-mail vient de partir. Cliquez sur le lien, ou saisissez le code à 6 chiffres. Rien reçu après 2 minutes ? Regardez dans les courriers indésirables.</p></div>
          ${L.dev ? `<div class="devcode">${API.demo ? 'Démo' : 'En local'}, aucun e-mail n’est envoyé. Code : <b>${esc(L.dev)}</b></div>` : ''}
          <div class="field"><label for="o1">Code à 6 chiffres</label><div class="otp">${[1, 2, 3, 4, 5, 6].map((i) => `<input id="o${i}" type="text" inputmode="numeric" autocomplete="${i === 1 ? 'one-time-code' : 'off'}" aria-label="Chiffre ${i}">`).join('')}</div></div>
          <button class="btn btn-primary" type="submit">Accéder à mon espace</button>
          <button class="ghost" type="button" data-act="login-back" style="justify-content:center">Changer d’adresse e-mail</button>
          <p class="demo-tag">Le code reste valable 15 minutes. Votre appareil reste connecté 30 jours.</p>
        </form>`;
    return `<main class="login" id="main">
      <section class="login-art" aria-label="Orem">
        <div class="brand" style="padding:0;position:relative;z-index:1"><img class="logo" src="${IMG.logo}" alt=""><b>Orem</b></div>
        <div style="position:relative;z-index:1;margin-block:40px"><div class="k">Espace client</div><p class="art-t">Tout votre projet, au même endroit.</p><p>Où en est le projet, ce qu’on attend de vous, vos fichiers et vos factures. Sans mot de passe, sans compte à créer.</p><p class="proof">Plus de 40 clients accompagnés depuis 2023 · 100 % de satisfaction client</p></div>
        <p class="small art-foot" style="position:relative;z-index:1;color:var(--night-muted)">Orem, marque d’ICONOKOM · agence-orem.fr</p>
      </section>
      <section class="login-form">${form}</section>
    </main>`;
  }

  /* ---------- Rendu ---------- */
  const root = $('#root');
  /* Focus : on retrouve l'élément actif après chaque rendu (par id ou par ses attributs data-*),
     on enferme le focus dans un dialogue ouvert et on le rend au déclencheur à la fermeture. */
  const KEYS = ['data-tkwho', 'data-tklayout', 'data-tkedit', 'data-tkdone', 'data-tkstart', 'data-tkwhen', 'data-tkclient', 'data-tkkind', 'data-tkmore', 'data-tkdue', 'data-go', 'data-act', 'data-id', 'data-tab', 'data-cat', 'data-bk', 'data-inbox', 'data-mine', 'data-ckind', 'data-tool', 'data-notif', 'data-open', 'data-item', 'data-itemdate', 'data-inv', 'data-req', 'data-handover', 'data-mail', 'data-tz'];
  function keyOf(el) {
    if (!el || el === document.body || !root.contains(el)) return null;
    if (el.id) return '#' + CSS.escape(el.id);
    const sel = KEYS.filter((k) => el.hasAttribute(k)).map((k) => `[${k}="${CSS.escape(el.getAttribute(k))}"]`).join('');
    if (sel) return el.tagName.toLowerCase() + sel + (el.name ? `[name="${CSS.escape(el.name)}"]` : '');
    if (el.name && el.value) return `[name="${CSS.escape(el.name)}"][value="${CSS.escape(el.value)}"]`;
    const f = el.closest('[data-form]');
    if (f) return `[data-form="${CSS.escape(f.dataset.form)}"]${f.dataset.id ? `[data-id="${CSS.escape(f.dataset.id)}"]` : ''} ${el.tagName.toLowerCase()}${el.type ? `[type="${CSS.escape(el.type)}"]` : ''}`;
    return null;
  }
  const dialogOpen = () => !!(S.ob || S.zoom || S.compose || S.mailView || S.fview || S.docView || (S.view === 'taches' && S.tk && S.tk.edit && !clientMode()));
  const TITLES = { evolution: 'Évolution', demarrer: 'Bien démarrer', preferences: 'Mes notifications', proposition: 'Proposition', accueil: 'Accueil', projet: 'Étapes', valider: 'À valider', maquettes: 'Maquettes', messages: 'Messages', fichiers: 'Fichiers', documents: 'Devis et factures', outils: 'Boîte à outils', biblio: 'Bibliothèque', equipe: 'Équipe et aide', plus: 'Plus', inbox: 'Boîte de réception', taches: 'Tâches de l’équipe', reglages: 'Réglages', clients: 'Clients', nouveau: 'Nouvel espace client' };
  let wasDialog = false;
  /* onlyMain : seule la zone principale change (filtre, question rapide) ; la barre latérale et le reste ne sont pas reconstruits. */
  function render(focus, onlyMain) {
    const active = document.activeElement, prevKey = keyOf(active), hadDialog = wasDialog;
    if (dialogOpen() && !hadDialog) { S.opener = prevKey; S.openerIdx = prevKey ? [...root.querySelectorAll(prevKey)].indexOf(active) : -1; }
    if (S.loading) { root.innerHTML = ''; return; }
    const wrap = onlyMain && !dialogOpen() && !hadDialog && S.me && root.querySelector('#main .wrap');
    if (!S.me) { root.innerHTML = vConnexion(); }
    else if (clientMode()) {
      if (!S.project) { root.innerHTML = shell('<div class="empty">Votre espace est en cours de préparation. L’équipe vous écrit dès qu’il est prêt.</div>'); return; }
      const V = { accueil: () => (S.project.deliveredAt ? vAccueilLivre() : vAccueil()), proposition: vProposition, demarrer: vDemarrer, evolution: vEvolution, preferences: vPreferences, projet: vProjet, valider: vValider, maquettes: vMaquettes, messages: vMessages, fichiers: vFichiers, documents: vDocuments, outils: vOutils, biblio: vBiblio, equipe: vEquipe, plus: vPlus };
      if (!V[S.view]) S.view = 'accueil';
      if (wrap) wrap.innerHTML = wrapHtml(V[S.view]()); else root.innerHTML = shell(V[S.view]()) + bellPop() + (S.ob ? onboarding() : '') + lightbox() + filePreview() + docPreview();
      const w1 = root.querySelector('#main .wrap'); if (w1) w1.classList.toggle('cx-wrap', CX_VIEWS.includes(S.view));
    } else {
      const V = { inbox: vInbox, taches: vTaches, reglages: vReglages, clients: vClients, nouveau: vNouveau, admin: vAdmin };
      if (!V[S.view] || (S.view === 'admin' && !S.project)) S.view = 'inbox';
      if (wrap) wrap.innerHTML = wrapHtml(V[S.view]()); else root.innerHTML = shell(V[S.view]()) + composer() + mailPreview() + tkDrawer();
      const w2 = root.querySelector('#main .wrap'); if (w2) w2.classList.toggle('tk-wrap', S.view === 'taches');
    }
    const where = !S.me ? 'Connexion' : S.view === 'admin' && S.project ? S.project.client : S.view === 'outils' && S.tool ? (TOOLS[S.tool] || [])[1] : TITLES[S.view];
    document.title = (where ? where + ' · ' : '') + 'Espace client Orem';
    initPads();
    // Dialogue ouvert : l'arrière-plan devient inerte, le focus va dans le dialogue.
    const dlg = root.querySelector('[role=dialog]'), bg = root.querySelectorAll('.app, .preview-bar, .skip');
    bg.forEach((el) => { if (dlg) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    wasDialog = !!dlg;
    document.querySelectorAll('.thread').forEach((t) => (t.scrollTop = t.scrollHeight));
    bindFiles();
    const back = (k) => { const el = k && root.querySelector(k); if (el && !el.closest('[inert]')) { el.focus({ preventScroll: true }); return true; } return false; };
    if (dlg) {
      if (!(prevKey && dlg.querySelector(prevKey) && back(prevKey))) { const f = dlg.querySelector('.ob .btn-primary, textarea, input:not([type=file]):not([type=hidden]), select, button, [href]'); if (f) f.focus({ preventScroll: true }); }
      return;
    }
    if (hadDialog && S.opener) { const k = S.opener, i = S.openerIdx; S.opener = null; S.openerIdx = -1; const el = i > 0 && root.querySelectorAll(k)[i]; if (el && !el.closest('[inert]')) { el.focus({ preventScroll: true }); return; } if (back(k)) return; }
    if (focus) {
      const h = root.querySelector('#main h1') || root.querySelector('h1');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } else { const m = $('#main'); if (m) m.focus({ preventScroll: true }); }
      window.scrollTo(0, 0); return;
    }
    if (prevKey && !back(prevKey)) { const m = $('#main'); if (m && active && active !== document.body) m.focus({ preventScroll: true }); }
  }
  async function go(v) {
    if (v === 'deconnexion') return logout();
    // Rubriques regroupées : Documents est un onglet de Fichiers, la Bibliothèque une section de Maquettes.
    if (!isAdmin() || S.preview) { if (v === 'documents') { S.toPay = true; v = 'fichiers'; } if (v === 'biblio') { S.toBiblio = true; v = 'maquettes'; } }
    S.bellOpen = false;
    if (v === 'compose') return openCompose();
    if (v === 'inbox' && isAdmin()) { await loadInbox(); await loadProjects(); }
    if (v === 'taches' && isAdmin()) { await loadTasks(); await loadProjects(); }
    if (v === 'reglages' && isAdmin()) { try { S.outbox = await API.outbox(); } catch { S.outbox = null; } try { S.connectors = (await API.connectors()).connectors; } catch { S.connectors = []; } }
    if (v === 'clients' && isAdmin() && !S.preview) { S.project = null; await loadProjects(); }
    // Côté client, chaque changement de vue reprend les dernières données (une étape publiée par l'équipe apparaît tout de suite).
    if (!isAdmin() && S.project && !S.preview) { try { const r = await API.project(S.project.id); S.project = r.project; S.people = r.people || S.people; } catch {} }
    // Messages lus avant l'affichage : un second rendu effacerait ce que le client commence à écrire.
    if (v === 'messages' && S.project && !isAdmin() && unread() && !S.preview) { try { await API.action(S.project.id, { type: 'msg.read' }); const r = await API.project(S.project.id); S.project = r.project; } catch {} }
    S.view = v; S.valForm = null; S.tool = v === 'outils' ? S.tool : null; render(true);
    for (const [k, id] of [['toBiblio', 'biblio'], ['toPay', 'pay-h']]) { if (!S[k]) continue; S[k] = false; const b = document.getElementById(id); if (b) { b.scrollIntoView({ block: 'start' }); const h = b.matches('h2') ? b : b.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } } }
  }
  async function enter() {
    const r = await API.me(); S.me = r.user; S.team = r.team || []; S.config = r.config || {};
    if (S.me.role === 'admin') { await loadProjects(); await loadInbox(); await loadTasks(); S.view = 'inbox'; S.project = null; try { S.connectors = (await API.connectors()).connectors; } catch { S.connectors = []; } }
    else { await loadInbox(); await loadProjects(); if (S.projects[0]) { const d = await API.project(S.projects[0].id); S.project = d.project; S.people = d.people || {}; } S.view = 'accueil'; if (S.project && !S.me.onboardedAt) S.ob = { step: 0 }; orderTeam(); }
    S.loading = false; render(); window.scrollTo(0, 0);
    // Mise en ligne récente : une célébration, une seule fois par appareil.
    const P = S.project;
    if (!isAdmin() && P && P.deliveredAt && Date.now() - new Date(P.deliveredAt) < 30 * 864e5 && !S.ob) {
      const k = 'orem-live-' + P.id; let seen = true; try { seen = !!localStorage.getItem(k); localStorage.setItem(k, '1'); } catch {}
      if (!seen) { celebrate(); toast(P.offer === 'site' ? R('Votre site est en ligne !', 'Ton site est en ligne !') : R('Votre projet est livré !', 'Ton projet est livré !')); }
    }
  }
  /* Signature de l'équipe : les prénoms, sans hiérarchie (« Louis, Théophile et Clément »). */
  function teamSig() { const n = S.team.map((u) => u.name.split(' ')[0]); return n.length > 1 ? n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1] : (n[0] || 'L’équipe Orem'); }
  function orderTeam() {
    const T = S.project && S.project.team; if (!T || !T.members || !T.members.length) return;
    S.team = S.team.filter((u) => T.members.includes(u.id)).sort((a, b) => (a.id === T.lead ? -1 : b.id === T.lead ? 1 : 0));
  }
  async function openProject(id) { S.tab = 'pilotage'; S.view = 'admin'; await loadProject(id); window.scrollTo(0, 0);
    const a = Core.alerts(S.project); if (a.unseen) { try { await API.action(id, { type: 'seen' }); } catch {} } }
  async function markAgencyRead() { const a = Core.alerts(S.project); if (a.newMessages) { try { await API.action(S.project.id, { type: 'msg.read' }); } catch {} } }
  async function logout() { try { await API.logout(); } catch {} S.me = null; S.project = null; S.preview = false; S.login = { step: 'email', email: '', dev: null }; render(true); }

  /* Dépôt de fichiers ou de dossiers entiers, sans limite de taille. Un dossier garde ses sous-dossiers ;
     plusieurs fichiers d'un coup ne donnent qu'une seule notification à la fin. */
  const sizeTxt = (b) => (b >= 1e9 ? (b / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Go' : b >= 1e6 ? Math.round(b / 1e6) + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko');
  const SKIP = /^(\.ds_store|thumbs\.db|desktop\.ini|\._.*)$/i;
  async function upload(files, opts = {}) {
    const p = S.project; if (!p || !files.length) return;
    if (S.preview) return toast('Aperçu : les actions sont désactivées.');
    if (S.uploading) return toast(R('Un envoi est déjà en cours : attendez qu’il se termine.', 'Un envoi est déjà en cours : attends qu’il se termine.'));
    const typeOf = (f) => (f.type.startsWith('image') ? 'Images' : f.type.startsWith('video') ? 'Vidéos' : /pdf|word|text|document|presentation|sheet/.test(f.type) ? 'Documents' : 'Autres');
    const items = files.map((f) => (f.file ? f : { file: f, folder: (f.webkitRelativePath || '').split('/').slice(0, -1).join('/') })).filter((x) => !SKIP.test(x.file.name));
    if (!items.length) return;
    const batch = items.length > 1, total = items.reduce((t, x) => t + x.file.size, 0);
    const tops = [...new Set(items.map((x) => x.folder.split('/')[0]).filter(Boolean))];
    let n = 0, sent = 0, failed = [];
    S.uploading = { name: items[0].file.name, p: 0, i: 1, n: items.length, total, sent: 0 }; render();
    for (const [k, it] of items.entries()) {
      Object.assign(S.uploading, { name: (it.folder ? it.folder + '/' : '') + it.file.name, i: k + 1, wait: false });
      paintUpload();
      try {
        await API.upload(p.id, it.file, opts.cat || typeOf(it.file), (x, waiting) => { S.uploading.p = x; S.uploading.wait = !!waiting; S.uploading.sent = sent + x * it.file.size; paintUpload(); }, n ? undefined : opts.missing, { folder: it.folder, batch });
        n++; sent += it.file.size;
      } catch (e) { failed.push(it.file.name); if (!batch) toast(e.message); sent += it.file.size; }
    }
    if (batch && n) { try { await API.batchDone(p.id, { folder: tops.length === 1 ? tops[0] : '', count: n, size: items.filter((x) => !failed.includes(x.file.name)).reduce((t, x) => t + x.file.size, 0), cat: opts.cat }); } catch {} }
    S.uploading = null;
    await loadProject(p.id);
    if (n) { S.project.files.slice(0, n).forEach((f) => (f.fresh = true)); render(); toast((isAdmin() ? `${n} fichier${n > 1 ? 's' : ''} partagé${n > 1 ? 's' : ''} avec le client.` : `${n > 1 ? n + ' fichiers envoyés' : 'Fichier envoyé'}${tops.length === 1 ? ' (dossier « ' + tops[0] + ' »)' : ''}. L’équipe est prévenue.`) + (failed.length ? ` ${failed.length} n’${failed.length > 1 ? 'ont' : 'a'} pas pu partir : ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''}.` : '')); }
    else if (failed.length) render();
  }
  /* Progression sans tout redessiner : barre, fichier en cours, volume envoyé. */
  function paintUpload() {
    const u = S.uploading; if (!u) return;
    const pct = u.total ? Math.min(100, Math.round((u.sent / u.total) * 100)) : Math.round(u.p * 100);
    document.querySelectorAll('.up-state').forEach((el) => {
      el.querySelector('.up-name').textContent = u.name;
      el.querySelector('.up-meta').textContent = (u.n > 1 ? `Fichier ${u.i} sur ${u.n} · ` : '') + `${sizeTxt(u.sent || 0)} sur ${sizeTxt(u.total || 0)}` + (u.wait ? ' · connexion coupée, reprise automatique…' : ` · ${pct} %`);
      el.querySelector('.progress i').style.width = pct + '%';
    });
  }
  const upState = () => S.uploading ? `<div class="up-state" role="status" aria-live="polite"><span class="up-name">${esc(S.uploading.name)}</span><span class="progress"><i style="width:0%"></i></span><span class="up-meta small muted"></span><span class="small muted">${R('Gardez', 'Garde')} cette page ouverte jusqu’à la fin de l’envoi.</span></div>` : '';
  /* Glisser-déposer : fichiers et dossiers (avec tous leurs sous-dossiers). */
  async function dropped(dt) {
    const entries = [...(dt.items || [])].map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)).filter(Boolean);
    if (!entries.length) return [...dt.files];
    const out = [];
    const walk = async (en, dir) => {
      if (en.isFile) { try { out.push({ file: await new Promise((ok, ko) => en.file(ok, ko)), folder: dir }); } catch {} return; }
      if (!en.isDirectory) return;
      const here = (dir ? dir + '/' : '') + en.name, rd = en.createReader();
      for (;;) { const batch = await new Promise((ok, ko) => rd.readEntries(ok, ko)).catch(() => []); if (!batch.length) break; for (const c of batch) await walk(c, here); }
    };
    for (const en of entries) await walk(en, '');
    return out;
  }
  window.addEventListener('beforeunload', (e) => { if (S.uploading) { e.preventDefault(); e.returnValue = ''; } });
  function bindFiles() {
    const d = $('#drop');
    if (d) {
      ['dragenter', 'dragover'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.add('over'); }));
      ['dragleave', 'drop'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.remove('over'); }));
      d.addEventListener('drop', async (e) => { const dt = e.dataTransfer; upload(await dropped(dt)); });
    }
  }

  /* ---------- Événements ---------- */
  function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(() => toast(ok), () => toast(R('Copie impossible ici. Sélectionnez le texte à la main.', 'Copie impossible ici. Sélectionne le texte à la main.'))); } catch { toast(R('Copie impossible ici. Sélectionnez le texte à la main.', 'Copie impossible ici. Sélectionne le texte à la main.')); } }
  function copyHtml(h, ok) { try { navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob([h.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' }) })]).then(() => toast(ok), () => copyText(h, ok)); } catch { copyText(h, ok); } }
  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.matches('[data-tkfilter]')) { S.tk = { ...tkState(), [t.dataset.tkfilter]: t.value, focus: 0 }; render(false, true); return; }
    if (t.matches('[data-cproject]')) { S.compose.projectId = t.value; S.compose.full = t.value ? (await API.project(t.value)).project : null; render(); return; }
    if (t.id === 'c-file' && t.files.length) { composeFiles([...t.files]); t.value = ''; return; }
    if (t.dataset.logo && t.files.length) { const f = t.files[0]; t.value = '';
      if (!/\.(svg|png|webp)$/i.test(f.name)) return fieldError('br-l', 'Choisissez un fichier SVG, PNG ou WebP.');
      try { const r = await API.upload(S.project.id, f, 'Bibliothèque'); const img = r.file && r.file.id && !API.demo ? '/api/files/' + r.file.id + '?inline=1' : URL.createObjectURL(f);
        act({ type: 'project.logo', img, tone: ($('#br-t') || {}).value }, 'Logo enregistré.'); } catch (err) { fieldError('br-l', err.message); } return; }
    if (t.dataset.logotone) { const B = S.project.brand || {}; if (B.logo) act({ type: 'project.logo', img: B.logo, tone: t.value }, 'Affichage du logo enregistré.'); return; }
    if (t.matches('[data-demo]')) { API.as(t.value); S.preview = false; S.tool = null; S.ob = null; enter(); return; }
    if (t.dataset.req) { act({ type: 'request.status', rid: t.dataset.req, status: t.value }, 'Statut mis à jour.'); return; }
    if (t.type === 'file' && t.files.length && !t.closest('.compose-card')) {
      const files = [...t.files];
      if (t.dataset.agency) upload(files, { cat: $('#a-cat').value });
      else upload(files, { missing: t.dataset.missing });
      t.value = '';
    }
    if (t.dataset.item) act({ type: 'item.status', iid: t.dataset.item, status: t.value }, 'Livrable mis à jour.');
    if (t.dataset.itemdate && t.value) { const it = S.project.phases.flatMap((x) => x.items).find((x) => x.id === t.dataset.itemdate); act({ type: 'item.status', iid: it.id, status: it.status, due: t.value }, 'Date mise à jour.'); }
    if (t.dataset.inv) act({ type: 'invoice.status', iid: t.dataset.inv, status: t.value }, 'Facture mise à jour.');
    if (t.dataset.ibfilter) { S[t.dataset.ibfilter === 'type' ? 'inboxType' : 'inboxClient'] = t.value || null; render(false, true); return; }
    if (t.dataset.clsort) { S.csort = t.value; render(false, true); return; }
    if (t.dataset.sureg || t.name === 'su-m') { S.suDom = ($('#su-d') || {}).value || ''; if (t.dataset.sureg) S.suReg = t.value; else S.suMode = t.value; render(false, true); const back = t.dataset.sureg ? $('#su-r') : document.querySelector(`[name=su-m][value="${t.value}"]`); back && back.focus(); return; }
    const af = t.closest && t.closest('[data-autosave]');
    if (af && af.dataset.autosave === 'submit') { S.quiet = true; af.requestSubmit(); return; }
    if (af) { autosave(af); return; }
    if (t.dataset.prelaunch !== undefined) { act({ type: 'prelaunch.toggle', n: Number(t.dataset.prelaunch) }); return; }
    if (t.dataset.owner) { act({ type: 'request.owner', rid: t.dataset.owner, owner: t.value }, 'Responsable enregistré.'); return; }
    if (t.dataset.handover !== undefined) act({ type: 'handover.toggle', n: Number(t.dataset.handover) }, 'Checklist mise à jour.');
    if (t.name === 'rv-s') { S.rvScore = Number(t.value); const txt = ($('#rv-t') || {}).value, pub = ($('#rv-p') || {}).checked; render(); if ($('#rv-t')) { $('#rv-t').value = txt || ''; $('#rv-p').checked = !!pub; } const r = document.querySelector(`[name=rv-s][value="${S.rvScore}"]`); r && r.focus(); }
  });
  document.addEventListener('click', async (e) => {
    if (tkClick(e)) return;
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); return go(g.dataset.go); }
    const o = e.target.closest('[data-open]'); if (o) return openProject(o.dataset.open);
    const cn = e.target.closest('[data-cnotif]'); if (cn) { const n = (S.inbox || []).find((x) => x.id === cn.dataset.cnotif); try { await API.readNotif(n.id); } catch {} n.read = true; S.bellOpen = false; return go((n.go && n.go.view) || 'accueil'); }
    if (S.bellOpen && !e.target.closest('#bell-pop, [data-act=bell]')) { S.bellOpen = false; render(); }
    const nt = e.target.closest('[data-notif]'); if (nt) { const n = S.inbox.find((x) => x.id === nt.dataset.notif); try { await API.readNotif(n.id); } catch {} n.read = true; if (n.go && n.go.view === 'taches') { S.tk = { ...tkState(), edit: n.tid || null }; return go('taches'); } await openProject(n.projectId); S.tab = (n.go && n.go.tab) || 'pilotage'; render(true); if (S.tab === 'messages') markAgencyRead(); return; }
    const ib = e.target.closest('[data-inbox]'); if (ib) { S.inboxFilter = ib.dataset.inbox; return render(false, true); }
    const mn = e.target.closest('[data-mine]'); if (mn) { S.mine = mn.dataset.mine === '1'; return render(false, true); }
    const ck = e.target.closest('[data-ckind]'); if (ck) { S.compose.kind = ck.dataset.ckind; render(); return; }
    const ml = e.target.closest('[data-mail]'); if (ml) { S.mailView = S.outbox.items[+ml.dataset.mail]; return render(); }
    const tb = e.target.closest('[data-tab]'); if (tb) { S.tab = tb.dataset.tab; render(); if (S.tab === 'messages') markAgencyRead(); if (S.tab === 'livraison' && S.project.review && !S.project.review.seen) { try { await API.action(S.project.id, { type: 'review.seen' }); await loadProject(S.project.id); } catch {} } return; }
    const tl = e.target.closest('[data-tool]'); if (tl) { S.tool = tl.dataset.tool || null; if (S.view !== 'outils') S.view = 'outils'; render(true); return; }
    const bk = e.target.closest('[data-bk]'); if (bk) { S.bk = bk.dataset.bk; return render(false, true); }
    const c = e.target.closest('[data-cat]'); if (c) { S.cat = c.dataset.cat; return render(false, true); }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const id = a.dataset.id;
    switch (a.dataset.act) {
      case 'toast': e.preventDefault(); toast(a.dataset.msg); break;
      case 'theme': { const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('orem-theme', r.dataset.theme); } catch {} document.querySelectorAll('[data-act=theme]').forEach((b) => b.setAttribute('aria-pressed', String(!dark))); break; }
      case 'logout': logout(); break;
      case 'approve': if (S.preview) return toast('Aperçu : les actions sont désactivées.'); S.valConfirm = id; render(); { const b = document.querySelector('[data-act=approve-ok]'); b && b.focus(); } break;
      case 'approve-cancel': S.valConfirm = null; render(); { const b = document.querySelector(`[data-act=approve][data-id="${CSS.escape(id)}"]`); b && b.focus(); } break;
      case 'approve-ok': { S.valConfirm = null; if (await act({ type: 'val.approve', vid: id })) { S.view = 'valider'; render(); celebrate(); undoBar(id); } break; }
      case 'val-undo': { clearTimeout(undoBar.t); $('#undo') && $('#undo').remove(); if (await act({ type: 'val.undo', vid: id }, 'Validation annulée. Rien n’a été envoyé à l’équipe.')) render(); break; }
      case 'fview': S.fview = id; render(); break;
      case 'sign-open': S.signOpen = id; render(); { const c = document.getElementById('sg-ok-' + id); c && c.focus(); } break;
      case 'sign-close': S.signOpen = null; render(); { const b = document.querySelector(`[data-act=sign-open][data-id="${CSS.escape(id)}"]`); b && b.focus(); } break;
      case 'fview-close': if (e.target.closest('video, iframe, img, a')) return; S.fview = null; S.docView = null; render(); break;
      case 'doc-view': S.docView = { src: a.dataset.src, title: a.dataset.title }; render(); break;
      case 'testmail': { a.disabled = true; try { const r = await API.testMail(id); toast(r.sent ? `E-mail envoyé depuis ${r.from} à ${S.me.email}. Regardez votre boîte de réception.` : `Non envoyé : ${r.error || 'envoi désactivé'}`); } catch (err) { toast(err.message); } a.disabled = false; try { S.outbox = await API.outbox(); render(false, true); } catch {} break; }
      case 'tknew': S.tk = { ...tkState(), edit: 'new' }; render(); ($('#tk-t') || {}).focus && $('#tk-t').focus(); break;
      case 'tkopen': S.tk = { ...tkState(), edit: null }; await openProject(id); S.tab = 'pilotage'; render(true); break;
      case 'tkdel': { const t = (S.tasks || []).find((x) => x.id === id); if (!confirm(`Supprimer la tâche « ${t ? t.t : ''} » ?`)) break; S.tk = { ...tkState(), edit: null }; await tkSave({ type: 'todo.remove', id }, 'Tâche supprimée.'); break; }
      case 'ccheck': { a.disabled = true; const old = a.textContent; a.textContent = 'Test…'; try { const r = await API.check(id); toast((r.ok ? 'Connexion réussie. ' : 'Échec. ') + r.message); } catch (err) { toast(err.message); } a.disabled = false; a.textContent = old; break; }
      case 'file-remove-own': if (await act({ type: 'file.remove', fid: id }, 'Fichier retiré.')) render(); break;
      case 'bell': S.bellOpen = !S.bellOpen; render(); if (S.bellOpen) { const f = document.querySelector('#bell-pop button, #bell-pop a'); f && f.focus(); } break;
      case 'bell-read': try { await API.readNotif(); } catch {} await loadInbox(); render(); break;
      case 'changes': if (S.preview) return toast('Aperçu : les actions sont désactivées.'); S.valForm = id; render(); { const t = $('#chg-' + id); t && t.focus(); } break;
      case 'valcancel': S.valForm = null; render(); { const b = document.querySelector(`[data-act=changes][data-id="${CSS.escape(id)}"]`); b && b.focus(); } break;
      case 'task': if (S.preview) return toast('Aperçu : les actions sont désactivées.'); act({ type: 'task.toggle', tid: id }); break;
      case 'task-remove': act({ type: 'task.remove', tid: id }); break;
      case 'missing-remove': act({ type: 'missing.remove', mid: id }); break;
      case 'file-remove': act({ type: 'file.remove', fid: id }, 'Fichier retiré de l’espace.'); break;
      case 'user-remove': act({ type: 'user.remove', id }, 'Accès retiré.'); break;
      case 'seen': act({ type: 'seen' }, 'Tout est marqué comme vu.'); break;
      case 'valreset': act({ type: 'val.reset', vid: id }, 'Validation remise en attente.'); break;
      case 'undeliver': if (API.demo || confirm('Annuler la mise en ligne ? L’accueil du client repasse en projet en cours.')) act({ type: 'project.deliver', undo: true }, 'Mise en ligne annulée.'); break;
      case 'archive': if (API.demo || confirm('Archiver cet espace ? Le client le garde en lecture seule.')) act({ type: 'project.archive' }, 'Espace archivé.'); break;
      case 'sync': { a.disabled = true; try { const r = await API.sync(id, a.dataset.project ? S.project.id : undefined); toast('Synchronisation faite : ' + r.summary + '.'); try { S.connectors = (await API.connectors()).connectors; } catch {} if (S.project && S.view === 'admin') await loadProject(S.project.id); else render(); } catch (err) { toast(err.message); a.disabled = false; } break; }
      case 'done': case 'undone': { try { await API.doneNotif(id, a.dataset.act === 'undone'); } catch (err) { return toast(err.message); } await loadInbox(); render(false, true); renderBadges(); toast(a.dataset.act === 'done' ? 'Marqué comme traité.' : 'Remis à traiter.'); break; }
      case 'reply': S.replyTo = S.replyTo === id ? null : id; render(false, true); { const t = $('#rp-' + id); t && t.focus(); } break;
      case 'cycle-next': if (API.demo || confirm('Démarrer un nouveau mois d’Évolution ? Le mois en cours est gardé dans l’historique.')) act({ type: 'cycle.next' }, 'Nouveau mois démarré.'); break;
      case 'reinvite': act({ type: 'user.invite', id }, 'Invitation renvoyée.'); break;
      case 'remind': act({ type: 'client.remind' }, 'Relance envoyée au client.'); break;
      case 'logout-all': try { await API.logoutAll(); } catch {} S.me = null; S.project = null; render(true); toast('Tous vos appareils sont déconnectés.'); break;
      case 'unarchive': act({ type: 'project.archive', undo: true }, 'Espace désarchivé.'); break;
      case 'preview': S.preview = true; S.view = 'accueil'; render(true); break;
      case 'endpreview': S.preview = false; S.ob = null; S.view = 'admin'; render(true); break;
      case 'link-cancel': S.linkToken = null; render(); break;
      case 'login-back': S.login.step = 'email'; render(); break;
      case 'demo-as': API.as(a.dataset.email); enter(); break;
      case 'skip': e.preventDefault(); { const m = $('#main'); m.focus(); const f = m.querySelector('a,button,input,select,textarea'); if (f) f.focus(); } break;
      case 'compose': openCompose(); break;
      case 'compose-close': S.compose = null; render(); break;
      case 'mail-close': S.mailView = null; render(); break;
      case 'inbox-done-all': { for (const n of (S.inbox || []).filter((x) => x.todo)) { try { await API.doneNotif(n.id); } catch {} } await loadInbox(); render(false, true); renderBadges(); toast('Tout est traité.'); break; }
      case 'inbox-all': try { await API.readNotif(); } catch {} await loadInbox(); render(); toast('Tout est lu.'); break;
      case 'digest': try { const r = await API.digest(); S.outbox = await API.outbox(); render(); toast(r.sent ? 'Récap envoyé. Il apparaît dans « E-mails envoyés ».' : 'Rien de nouveau à récapituler.'); } catch (err) { toast(err.message); } break;
      case 'qa': S.qa = S.qa === id ? null : id; render(false, true); break;
      case 'zoom': S.zoom = { src: asset(a.dataset.src), key: a.dataset.src, title: a.dataset.title, pin: !!a.dataset.pin && !isAdmin() }; render(); break;
      case 'pin-here': { e.stopPropagation(); const im = a.querySelector('img').getBoundingClientRect(); const kb = S.zoom.kb || { x: 50, y: 50 }, x = e.clientX ? ((e.clientX - im.left) / im.width) * 100 : kb.x, y = e.clientY ? ((e.clientY - im.top) / im.height) * 100 : kb.y; S.zoom.kb = null;
        S.zoom.at = { x: Math.max(0, Math.min(100, Math.round(x * 10) / 10)), y: Math.max(0, Math.min(100, Math.round(y * 10) / 10)) }; render(); const t = $('#pin-t'); t && t.focus(); break; }
      case 'pin-cancel': S.zoom.at = null; render(); break;
      case 'pin-resolve': act({ type: 'pin.resolve', id }, 'Commentaire mis à jour.'); break;
      case 'unzoom': if (e.target.tagName === 'IMG' || e.target.closest('.pin-form, .pin-list, .pin-area')) return; S.zoom = null; render(); break;
      case 'decline': S.propDecline = id; render(); { const t = $('#dc-' + id); t && t.focus(); } break;
      case 'decline-cancel': S.propDecline = null; render(); break;
      case 'prop-new': S.propDraft = { pid: S.project.id }; render(); { const t = $('#pp-t'); t && t.focus(); } break;
      case 'prop-edit': S.propDraft = { pid: S.project.id, prid: id }; render(); { const t = $('#pp-t'); t && t.focus(); } break;
      case 'prop-cancel': S.propDraft = null; render(); break;
      case 'prop-send': act({ type: 'proposal.send', prid: id }, 'Proposition envoyée. Le client est prévenu.'); break;
      case 'prop-from': { const rq = S.project.requests.find((r) => r.id === id); S.propDraft = { pid: S.project.id, rid: id, title: 'Demande : ' + rq.type.toLowerCase(), intro: (S.project.registre === 'tu' ? 'Suite à ta demande : ' : 'Suite à votre demande : ') + rq.text, lines: [{ t: rq.text.slice(0, 120), ht: 0 }], depositPct: 0 }; S.tab = 'factures'; render(); { const t = $('#pp-l'); t && t.focus(); } break; }
      case 'copypost': copyText($('#lk-post').value, R('Post copié. Collez-le sur LinkedIn.', 'Post copié. Colle-le sur LinkedIn.')); break;
      case 'copytxt': copyText(a.dataset.txt, a.dataset.txt + ' copié.'); break;
      case 'vault-erase': if (!confirm('Effacer les identifiants du coffre ?')) break; try { await API.vaultErase(S.project.id); await loadProject(S.project.id); toast('Identifiants effacés du coffre.'); } catch (err) { toast(err.message); } break;
      case 'vault-open': try { const vo = await API.vaultGet(S.project.id); await loadProject(S.project.id); S.vaultOpen = vo; render(false, true); } catch (err) { toast(err.message); } break;
      case 'item-edit': S.itemEdit = a.dataset.id || null; render(false, true); { const f = S.itemEdit && document.querySelector(`[data-form=itemmeta] input`); f && f.focus(); } break;
      case 'rs-open': S.rsOpen = !S.rsOpen; render(false, true); { const t = S.rsOpen && $('#rs-t'); t && t.focus(); } break;
      case 'rp-open': S.rpOpen = a.dataset.id === (S.rpOpen || '') ? '' : a.dataset.id; render(false, true); break;
      case 'pad-clear': { const c = document.getElementById('sg-c-' + a.dataset.id); if (c) { c.getContext('2d').clearRect(0, 0, c.width, c.height); delete c.dataset.drawn; c.parentNode.classList.remove('drawn'); } break; }
      case 'sign-req': act({ type: 'file.signreq', fid: a.dataset.id }, 'Demande de signature envoyée au client.'); break;
      case 'sign-cancel': act({ type: 'file.signreq', fid: a.dataset.id, cancel: true }, 'Demande de signature retirée.'); break;
      case 'logo-remove': act({ type: 'project.logo', img: '' }, 'Logo retiré.'); break;
      case 'vault-hide': S.vaultOpen = null; render(false, true); break;
      case 'setup-ok': if (await act({ type: 'setup.check', tid: a.dataset.id, ok: true }, 'Vérifié. Le client est prévenu.')) { if (a.dataset.k === 'domaine') { S.vaultOpen = null; await loadProject(S.project.id); } } break;
      case 'setup-retry': { const why = prompt('Ce qu’il faut reprendre (le client le verra) :'); if (why === null) break; act({ type: 'setup.check', tid: a.dataset.id, ok: false, why }, 'Demande envoyée au client.'); break; }
      case 'copysig': copyHtml($('#sig-p').innerHTML, R('Signature copiée. Collez-la dans votre messagerie.', 'Signature copiée. Colle-la dans ta messagerie.')); break;
      case 'copyteaser': copyText($('#teaser-p').innerText, 'Texte de la fiche copié.'); break;
      case 'print': document.body.classList.add('printing'); window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); break;
      case 'obopen': S.ob = { step: 0 }; render(); break;
      case 'obpreview': S.preview = true; S.view = 'accueil'; S.ob = { step: 0 }; render(true); break;
      case 'ob-next': S.ob.step++; render(); break;
      case 'ob-prev': S.ob.step--; render(); break;
      case 'ob-skip': case 'ob-done': {
        const prefs = { mail: !!($('#pf-mail') || {}).checked, weekly: !!($('#pf-week') || {}).checked };
        const wasDone = a.dataset.act === 'ob-done';
        const me = wasDone ? { name: ($('#ob-n') || {}).value || '', title: ($('#ob-f') || {}).value || '', phone: ($('#ob-p') || {}).value || '' } : null;
        if (me && !me.name.trim()) return fieldError('ob-n', R('Indiquez votre prénom et votre nom.', 'Indique ton prénom et ton nom.'));
        S.ob = null;
        if (me && !S.preview) Object.assign(S.me, { name: me.name.trim(), title: me.title.trim(), phone: me.phone.trim() });
        if (!S.preview && !S.me.onboardedAt) { S.me.onboardedAt = new Date().toISOString(); try { await API.action(S.project.id, { type: 'user.onboarded', prefs: wasDone ? prefs : undefined, ...(me || {}) }); } catch {} }
        render(); if (wasDone) celebrate(); break; }
      case 'copy': { const txt = $('#iban').textContent; const sel = () => { const r = document.createRange(); r.selectNodeContents($('#iban')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(R('IBAN sélectionné : copiez-le avec Ctrl+C (Cmd+C sur Mac).', 'IBAN sélectionné : copie-le avec Ctrl+C (Cmd+C sur Mac).')); };
        try { navigator.clipboard.writeText(txt).then(() => toast('IBAN copié.'), sel); } catch { sel(); } break; }
    }
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    if (f.dataset.form === 'tkquick' || f.dataset.form === 'tkedit') { tkSubmit(f); return; }
    const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
    switch (f.dataset.form) {
      case 'linkauth': { try { await API.linkAuth(S.linkToken); S.linkToken = null; await enter(); } catch (err) { S.linkToken = null; render(); toast(err.message); } break; }
      case 'login': {
        const email = v('em').toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fieldError('em', 'Saisissez une adresse e-mail valide, par exemple vous@entreprise.fr.');
        try { const r = await API.login(email); S.login = { step: 'code', email, dev: r.devCode || null }; render(); $('#o1') && $('#o1').focus(); } catch (err) { fieldError('em', err.message); }
        break; }
      case 'verify': {
        const code = [1, 2, 3, 4, 5, 6].map((i) => v('o' + i)).join('');
        if (code.length !== 6) return fieldError('o1', 'Saisissez les 6 chiffres du code.');
        try { await API.verify(S.login.email, code); history.replaceState(null, '', location.pathname); await enter(); } catch (err) { fieldError('o1', err.message); }
        break; }
      case 'changes': {
        const txt = v('chg-' + f.dataset.id);
        if (!txt) return fieldError('chg-' + f.dataset.id, R('Écrivez ce que vous aimeriez changer.', 'Écris ce que tu aimerais changer.'));
        if (await act({ type: 'val.changes', vid: f.dataset.id, comment: txt }, 'Demande de modifications envoyée. L’équipe répond sous 24 h ouvrées.')) { S.valForm = null; render(); }
        break; }
      case 'create': {
        const reg = (f.querySelector('[name=n-reg]:checked') || {}).value;
        if (!v('n-client')) return fieldError('n-client', 'Indiquez le nom du client.');
        if (!reg) return fieldError(f.querySelector('[name=n-reg]'), 'Choisissez le tutoiement ou le vouvoiement.');
        try { const r = await API.create({ offer: (f.querySelector('[name=n-offer]:checked') || {}).value, client: v('n-client'), projet: v('n-projet'), contactName: v('n-contact'), email: v('n-email'), start: v('n-start') || undefined, amountHT: v('n-ht'), registre: (f.querySelector('[name=n-reg]:checked') || {}).value });
          await loadProjects(); await openProject(r.id); toast('Espace créé. Vérifiez la prochaine action, puis l’accès du client dans « Accès et infos ».'); } catch (err) { toast(err.message); }
        break; }
      case 'itemmeta': { const id = f.dataset.id; const who = [...f.querySelectorAll('[name=iw]:checked')].map((c) => [c.value, (f.querySelector('#iw-' + c.value) || {}).value || '']);
        if (await act({ type: 'item.meta', iid: id, who, link: (f.querySelector('#il-' + id) || {}).value.trim() }, 'Livrable mis à jour.')) { S.itemEdit = null; render(false, true); } break; }
      case 'evo-meet': act({ type: 'evo.set', active: $('#ev-on').checked, meeting: { when: v('ev-w') || null, mode: v('ev-m') } }, 'Évolution enregistrée. Le client est prévenu.'); break;
      case 'evo-axes': { const L = lines(v('ev-ax'), 6), bad = L.find((x) => x[3] && isNaN(new Date(x[3]))); if (bad) return fieldError('ev-ax', 'Date invalide sur la ligne « ' + bad[0] + ' » : écrivez AAAA-MM-JJ.');
        act({ type: 'evo.set', axes: L.map(([t, effect, w, due, st, pr], i) => ({ id: ((S.project.evo || {}).axes || [])[i] && S.project.evo.axes[i].t === t ? S.project.evo.axes[i].id : undefined, t, effect, who: WHO_KEYS[String(w || '').trim().toLowerCase()] || 'both', due: due || null, status: ST_KEYS[String(st || '').trim().toLowerCase()] || 'todo', priority: /priorit/i.test(pr || '') })), next: lines(v('ev-nx'), 2) }, 'Axes enregistrés.'); break; }
      case 'evo-report': { if (!v('er-t')) return fieldError('er-t', 'Donnez un titre au bilan.'); let fileId; const fl = $('#er-f').files[0];
        if (fl) { try { const r = await API.upload(S.project.id, fl, 'Livrable'); fileId = r.file && r.file.id; } catch (err) { return fieldError('er-f', err.message); } }
        if (await act({ type: 'evo.report', month: v('er-m'), title: v('er-t'), summary: v('er-s'), stats: lines(v('er-k'), 3), done: lines(v('er-d'), 2), fileId }, 'Bilan publié. Le client est prévenu.')) f.reset(); break; }
      case 'reschedule': { if (!v('rs-t')) return fieldError('rs-t', R('Indiquez les créneaux qui vous arrangent.', 'Indique les créneaux qui t’arrangent.')); if (await act({ type: 'evo.reschedule', text: v('rs-t') }, 'Demande envoyée. L’équipe revient vers ' + R('vous', 'toi') + ' très vite.')) S.rsOpen = false; break; }
      case 'signdoc': { const id2 = f.dataset.id; if (!$('#sg-ok-' + id2).checked) return fieldError('sg-ok-' + id2, R('Cochez la case « J’ai lu ce document et je le signe ».', 'Coche la case « J’ai lu ce document et je le signe ».')); if (v('sg-n-' + id2).length < 2) return fieldError('sg-n-' + id2, R('Écrivez votre nom pour signer.', 'Écris ton nom pour signer.'));
        if (S.preview) return toast('Aperçu : les actions sont désactivées.');
        try { await API.signFile(S.project.id, id2, { name: v('sg-n-' + id2), agree: true, sig: padData(id2) }); await loadProject(S.project.id); toast('Document signé. Merci !'); celebrate(); } catch (err) { fieldError('sg-n-' + id2, err.message); } break; }
      case 'su-wf': { if (!v('su-ws')) return fieldError('su-ws', R('Indiquez le nom de l’espace de travail Webflow.', 'Indique le nom de l’espace de travail Webflow.')); if (await act({ type: 'setup.webflow', ws: v('su-ws') }, 'Merci ! L’équipe vérifie l’invitation.')) { const h = $('#su-domaine-h') || $('#su-webflow-h'); h && h.scrollIntoView({ block: 'start' }); } break; }
      case 'su-dn': {
        const mode = (document.querySelector('[name=su-m]:checked') || {}).value || 'delegate', domain = v('su-d'), registrar = v('su-r');
        if (!domain) return fieldError('su-d', R('Indiquez le nom de domaine, par exemple entreprise.fr.', 'Indique le nom de domaine, par exemple entreprise.fr.'));
        if (S.preview) return toast('Aperçu : les actions sont désactivées.');
        if (mode === 'vault') {
          if (!v('su-l')) return fieldError('su-l', R('Indiquez l’identifiant de connexion.', 'Indique l’identifiant de connexion.')); if (!$('#su-p').value) return fieldError('su-p', R('Indiquez le mot de passe.', 'Indique le mot de passe.'));
          try { await API.vaultPut(S.project.id, { domain, registrar, login: v('su-l'), secret: $('#su-p').value, note: v('su-n') }); $('#su-p').value = ''; S.suMode = S.suReg = S.suDom = null; await loadProject(S.project.id); toast('Identifiants chiffrés et envoyés à l’équipe.'); } catch (err) { fieldError('su-d', err.message); }
        } else if (await act({ type: 'setup.domain', mode, domain, registrar }, mode === 'delegate' ? 'Merci ! L’équipe vérifie l’accès.' : 'Merci ! L’équipe s’en occupe.')) { S.suMode = S.suReg = S.suDom = null; }
        break; }
      case 'msg': { const t = v('msg-t'); if (!t) return fieldError('msg-t', R('Écrivez votre message.', 'Écris ton message.')); if (S.preview) return toast('Aperçu : les actions sont désactivées.'); if (await act({ type: 'msg.post', text: t }, 'Message envoyé. Réponse sous 24 h ouvrées.')) { const th = document.querySelector('.thread'); if (th) th.lastElementChild && th.lastElementChild.scrollIntoView({ block: 'nearest' }); } break; }
      case 'amsg': { const t = v('am-t'); if (!t) return fieldError('am-t', 'Écrivez le message.'); act({ type: 'msg.post', text: t, asTeam: !!($('#am-team') || {}).checked, loom: v('am-u') ? { url: v('am-u'), title: v('am-l') || 'Vidéo' } : undefined }, 'Message envoyé au client.'); break; }
      case 'links': act({ type: 'links.set', figma: v('lk-f'), proto: v('lk-p'), preview: v('lk-w'), site: v('lk-s'), old: v('lk-o') }, 'Liens enregistrés.'); break;
      case 'version': if (!v('ve-t')) return fieldError('ve-t', 'Dites ce qui change dans cette version.'); act({ type: 'version.add', t: v('ve-t'), url: v('ve-u') }, 'Version publiée. Le client est prévenu.'); break;
      case 'proposal': { const go = (e.submitter && e.submitter.value) || 'save'; const D0 = S.propDraft || {};
        const lns = lines(v('pp-l'), 2).map(([t, ht]) => ({ t, ht: Number(String(ht || '').replace(/\s/g, '').replace(',', '.')) || 0 }));
        if (!v('pp-t')) return fieldError('pp-t', 'Donnez un titre.'); if (!lns.length) return fieldError('pp-l', 'Ajoutez au moins une ligne : libellé | montant HT.');
        try { const r = await API.action(S.project.id, { type: 'proposal.save', prid: D0.prid, rid: D0.rid, title: v('pp-t'), quote: v('pp-q'), intro: v('pp-i'), lines: lns, depositPct: v('pp-d'), validUntil: v('pp-v') || undefined, kind: ($('#pp-evo') || {}).checked ? 'evolution' : undefined });
          if (go === 'send') await API.action(S.project.id, { type: 'proposal.send', prid: r.prid });
          S.propDraft = null; await loadProject(S.project.id); toast(go === 'send' ? 'Proposition envoyée. Le client est prévenu.' : 'Brouillon enregistré.'); } catch (err) { toast(err.message); } break; }
      case 'accept': { const id2 = f.dataset.id; if (!$('#sg-ok-' + id2).checked) return fieldError('sg-ok-' + id2, R('Cochez la case « J’ai lu la proposition » pour accepter.', 'Coche la case « J’ai lu la proposition » pour accepter.')); if (v('sg-n-' + id2).length < 2) return fieldError('sg-n-' + id2, R('Écrivez votre nom pour signer.', 'Écris ton nom pour signer.'));
        if (S.preview) return toast('Aperçu : les actions sont désactivées.');
        if (await act({ type: 'proposal.accept', prid: id2, agree: true, name: v('sg-n-' + id2), sig: padData(id2) }, R('Proposition acceptée. Merci pour votre confiance !', 'Proposition acceptée. Merci pour ta confiance !'))) celebrate(); break; }
      case 'decline': if (await act({ type: 'proposal.decline', prid: f.dataset.id, comment: v('dc-' + f.dataset.id) }, 'Réponse envoyée à l’équipe.')) { S.propDecline = null; render(); } break;
      case 'pin': { const t = v('pin-t'); if (!t) return fieldError('pin-t', R('Écrivez votre commentaire.', 'Écris ton commentaire.')); if (S.preview) return toast('Aperçu : les actions sont désactivées.');
        try { await API.action(S.project.id, { type: 'pin.add', img: S.zoom.key, x: S.zoom.at.x, y: S.zoom.at.y, text: t, version: ((S.project.versions || [])[0] || {}).label }); S.zoom.at = null; await loadProject(S.project.id); toast('Commentaire épinglé. L’équipe est prévenue.'); } catch (err) { toast(err.message); } break; }
      case 'request': { const t = v('rq-t'); if (!t) return fieldError('rq-t', R('Décrivez votre demande.', 'Décris ta demande.')); if (S.preview) return toast('Aperçu : les actions sont désactivées.'); act({ type: 'request.add', kind: v('rq-k'), priority: v('rq-p'), text: t }, R('Demande envoyée. On revient vers vous sous 24 h ouvrées.', 'Demande envoyée. On revient vers toi sous 24 h ouvrées.')); break; }
      case 'teaser': case 'sig': break;
      case 'compose': composeSubmit(); break;
      case 'prefs': { const em = (f.querySelector('[name=pf-email]:checked') || {}).value; const events = {}; f.querySelectorAll('[name=pf-ev]').forEach((c) => (events[c.value] = c.checked));
        try { const r = await API.setPrefs({ email: em, events }); S.me.notify = r.notify; toast('Réglages enregistrés.'); render(); } catch (err) { toast(err.message); } break; }
      case 'team': { const members = [...f.querySelectorAll('[name=tm]:checked')].map((c) => c.value); act({ type: 'team.set', members, lead: v('tm-lead') }, 'Équipe enregistrée.'); break; }
      case 'phase': act({ type: 'phase.set', n: v('a-phase') }, 'Étape mise à jour.'); break;
      case 'next': act({ type: 'next.set', title: v('a-nt'), text: v('a-nx'), go: v('a-ng') }, 'Prochaine action publiée.'); break;
      case 'note': if (await act({ type: 'note.set', text: v('a-note') }, 'Point de la semaine publié dans l’espace du client.')) { delete S.drafts[S.project.id]; render(); } break;
      case 'task': if (v('a-task')) act({ type: 'task.add', t: v('a-task') }, 'Action ajoutée.'); break;
      case 'missing': if (v('a-mi')) act({ type: 'missing.add', t: v('a-mi'), sub: v('a-ms') }, 'Ajouté aux fichiers attendus.'); break;
      case 'valreq': act({ type: 'val.request', vid: f.dataset.id, link: v('vl-' + f.dataset.id) }, 'Le client voit la demande de validation.'); break;
      case 'billing': act({ type: 'project.update', totalHT: v('b-ht'), quote: v('b-q') }, 'Montant enregistré.'); break;
      case 'invoice': if (!v('i-ht')) return fieldError('i-ht', 'Indiquez le montant HT.'); act({ type: 'invoice.add', label: v('i-l') || 'Facture', num: v('i-n'), ht: v('i-ht'), status: v('i-s') }, 'Facture ajoutée.'); break;
      case 'user': act({ type: 'user.add', email: v('u-e'), name: v('u-n') }, 'Accès donné. L’invitation part par e-mail (en local, elle reste dans « E-mails envoyés »).'); break;
      case 'deliver': { const ok = await act({ type: 'project.deliver', when: v('dl-w') || undefined, force: v('dl-f') || undefined }); if (!ok) break; if (v('dl-s')) await act({ type: 'links.set', site: v('dl-s') }); celebrate(); toast(S.project.offer === 'site' ? 'Le site est en ligne. Le client est prévenu.' : 'Projet livré. Le client est prévenu.'); break; }
      case 'results': act({ type: 'project.results', period: v('rs-p'), stats: lines(v('rs-s'), 2) }, 'Résultats enregistrés.'); break;
      case 'brand': act({ type: 'project.brand', colors: lines(v('br-c'), 2), fonts: lines(v('br-f'), 2) }, 'Marque enregistrée.'); break;
      case 'tools': act({ type: 'project.tools', tools: [...f.querySelectorAll('[name=tl]:checked')].map((c) => c.value) }, 'Boîte à outils mise à jour.'); break;
      case 'tutorials': act({ type: 'project.tutorials', tutorials: lines(v('tu-l'), 3).map(([t, d, url]) => ({ t, d, url })) }, 'Vidéos enregistrées.'); break;
      case 'review': { const sc = Number((f.querySelector('[name=rv-s]:checked') || {}).value); if (!sc) return fieldError(f.querySelector('[name=rv-s]'), R('Choisissez une note de 1 à 5 étoiles.', 'Choisis une note de 1 à 5 étoiles.')); if (S.preview) return toast('Aperçu : les actions sont désactivées.');
        if (sc <= 3) {
          if (!v('rv-bad')) return fieldError('rv-bad', R('Dites-nous ce qui n’a pas fonctionné, même en quelques mots.', 'Dis-nous ce qui n’a pas fonctionné, même en quelques mots.'));
          const axes = Object.fromEntries(Core.REVIEW_AXES.map(([k]) => [k, Number((f.querySelector(`[name=rv-a-${k}]:checked`) || {}).value) || 0]));
          if (await act({ type: 'review.add', score: sc, survey: { bad: v('rv-bad'), good: v('rv-good'), phase: v('rv-ph'), recommend: v('rv-rec'), axes, call: $('#rv-call').checked } }, R('Merci, vos réponses sont transmises à l’équipe.', 'Merci, tes réponses sont transmises à l’équipe.'))) S.rvScore = 0;
          break;
        }
        const google = e.submitter && e.submitter.value === 'google' && cfg().reviewUrl, txt = v('rv-t');
        // Google s'ouvre tout de suite (avant l'attente réseau, sinon le navigateur bloque la fenêtre) ; le texte est copié pour être collé.
        if (google) { if (txt) { try { navigator.clipboard.writeText(txt); } catch {} } window.open(cfg().reviewUrl, '_blank', 'noopener'); }
        if (await act({ type: 'review.add', score: sc, text: txt, public: $('#rv-p').checked, google: !!google }, google ? R('Merci ! Collez votre texte sur Google.', 'Merci ! Colle ton texte sur Google.') : R('Merci ! Votre avis est transmis à l’équipe.', 'Merci ! Ton avis est transmis à l’équipe.'))) S.rvScore = 0; break; }
      case 'confirm': { const reg = (f.querySelector('[name=cf-reg]:checked') || {}).value; if (!reg) return fieldError(f.querySelector('[name=cf-reg]'), 'Choisissez le tutoiement ou le vouvoiement.');
        if (await act({ type: 'project.confirm', offer: (f.querySelector('[name=cf-offer]:checked') || {}).value, registre: reg, email: v('cf-e'), name: v('cf-n') }, 'Espace ouvert. Le client peut se connecter avec son e-mail.')) await loadProjects(); break; }
      case 'ext': act({ type: 'project.ext', abby: v('x-a'), drive: v('x-d'), ga4: v('x-g'), gsc: v('x-s'), figma: v('x-f') }, 'Enregistré.'); break;
      case 'payurl': act({ type: 'invoice.pay', iid: f.dataset.id, payUrl: v('pu-' + f.dataset.id) }, 'Lien de paiement enregistré. Le client voit « Payer en ligne ».'); break;
      case 'reply': { const n = S.inbox.find((x) => x.id === f.dataset.id), t = v('rp-' + f.dataset.id); if (!t) return fieldError('rp-' + f.dataset.id, 'Écrivez la réponse.');
        try { await API.action(n.projectId, { type: 'msg.post', text: t }); await API.doneNotif(n.id); S.replyTo = null; await loadInbox(); render(false, true); renderBadges(); toast('Réponse envoyée dans l’espace de ' + n.client + '.'); } catch (err) { toast(err.message); } break; }
      case 'meeting': break;
      case 'ask': { const q = v('ask-q'); if (!q) return fieldError('ask-q', R('Écrivez votre question.', 'Écris ta question.')); S.askQ = q; S.askA = '…'; render(false, true);
        try { const r = await API.ask(S.project.id, q); S.askA = r.answer || R('Je ne trouve pas la réponse dans le projet. Écrivez à l’équipe depuis Messages, elle répond sous 24 h ouvrées.', 'Je ne trouve pas la réponse dans le projet. Écris à l’équipe depuis Messages, elle répond sous 24 h ouvrées.'); } catch (err) { S.askA = err.message; }
        render(false, true); break; }
      case 'cprefs': if (await act({ type: 'user.prefs', mail: $('#cp-mail').checked, weekly: $('#cp-week').checked }, 'Préférences enregistrées.')) { S.me.prefs = { mail: $('#cp-mail') ? $('#cp-mail').checked : true, weekly: $('#cp-week') ? $('#cp-week').checked : true }; } break;
      case 'settings': try { const r = await API.settings({ booking: v('st-b'), training: v('st-t'), reviewUrl: v('st-r'), welcomeLoom: v('st-w'), cgvUrl: v('st-g'), holder: v('st-h'), bank: v('st-k'), address: v('st-a'), iban: v('st-i'), bic: v('st-c') }); S.config = r.settings; render(); toast('Réglages de l’agence enregistrés.'); } catch (err) { toast(err.message); } break;
      case 'infos': act({ type: 'project.update', client: v('p-c'), projet: v('p-p'), contactName: v('p-ct'), golive: v('p-g') || undefined, registre: (f.querySelector('[name=p-r]:checked') || {}).value }, 'Infos enregistrées.'); break;
    }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.post) { S.post = t.value; return; }
    if (t.dataset && t.dataset.fsearch) { S.fq = t.value; render(false, true); return; }
    if (t.dataset && t.dataset.clsearch) { S.cq = t.value; render(false, true); return; }
    if (t.dataset && t.dataset.draft && S.project) { (S.drafts[S.project.id] = S.drafts[S.project.id] || {})[t.dataset.draft] = t.value; }
    if (t.getAttribute && t.getAttribute('aria-invalid') === 'true') { t.removeAttribute('aria-invalid'); const sp = document.getElementById((t.id || t.name) + '-err'); if (sp) sp.remove(); }
    if (t.closest('#teaser-f')) { const v = (id) => $('#' + id).value; S.teaser = { type: v('tz-type'), name: v('tz-name'), city: v('tz-city'), size: v('tz-size'), ca: v('tz-ca'), price: v('tz-price'), points: v('tz-points') }; $('#teaser-p').innerHTML = teaserHtml(S.teaser); return; }
    if (t.closest('[data-form=sig]')) { S.sig = { name: $('#sg-n').value, role: $('#sg-r').value, phone: $('#sg-p').value }; $('#sig-p').innerHTML = sigHtml(S.sig, ((S.project.brand && S.project.brand.colors[0]) || [])[1] || '#092482'); return; }
    if (t.closest('.otp')) {
      const digits = t.value.replace(/\D/g, '');
      if (digits.length > 1) { const all = [...document.querySelectorAll('.otp input')]; digits.slice(0, 6).split('').forEach((d, i) => all[i] && (all[i].value = d)); all[Math.min(5, digits.length - 1)].focus(); return; }
      t.value = digits; if (digits && t.nextElementSibling) t.nextElementSibling.focus();
    }
  });
  const isDark = () => { const r = document.documentElement; return r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  document.addEventListener('focusout', (e) => {
    if (!S.bellOpen || !e.target.closest || !e.target.closest('#bell-pop, [data-act=bell]')) return;
    setTimeout(() => { const a = document.activeElement; if (S.bellOpen && a && a !== document.body && !a.closest('#bell-pop, [data-act=bell]')) { S.bellOpen = false; render(); } }, 0);
  });
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'tk-q') tkPreview(e.target.value); });
  document.addEventListener('keydown', (e) => {
    if (tkKey(e)) return;
    if (S.zoom && e.target.closest && e.target.closest('.pin-area') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault(); const k = S.zoom.kb || { x: 50, y: 50 }, d = e.shiftKey ? 2 : 10;
      if (e.key === 'ArrowLeft') k.x -= d; if (e.key === 'ArrowRight') k.x += d; if (e.key === 'ArrowUp') k.y -= d; if (e.key === 'ArrowDown') k.y += d;
      S.zoom.kb = { x: Math.max(0, Math.min(100, k.x)), y: Math.max(0, Math.min(100, k.y)) }; render(); return;
    }
    const tl = e.target.closest && e.target.closest('[role=tablist]');
    if (tl && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      const tabs = [...tl.querySelectorAll('[role=tab]')], i = tabs.indexOf(e.target); if (i < 0) return;
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + tabs.length) % tabs.length;
      e.preventDefault(); tabs[n].focus(); tabs[n].click(); return;
    }
    if (e.key === 'Escape' && S.ob) { const sk = document.querySelector('[data-act=ob-skip]'); if (sk) { sk.click(); return; } S.ob = null; if (!S.preview && !S.me.onboardedAt) { S.me.onboardedAt = new Date().toISOString(); API.action(S.project.id, { type: 'user.onboarded' }).catch(() => {}); } render(); return; }
    if (e.key === 'Escape' && (S.zoom || S.compose || S.mailView || S.fview || S.docView)) { S.zoom = null; S.compose = null; S.mailView = null; S.fview = null; S.docView = null; render(); return; }
    if (e.key === 'Escape' && S.bellOpen) { S.bellOpen = false; render(); const b = document.querySelector('[data-act=bell]'); b && b.focus(); return; }
    if (e.target.closest && e.target.closest('.otp') && e.key === 'Backspace' && !e.target.value && e.target.previousElementSibling) e.target.previousElementSibling.focus();
  });

  document.documentElement.lang = 'fr';
  // Ancien lien d'invitation (?email=) : l'adresse est déjà remplie
  try { const em = new URLSearchParams(location.search).get('email'); if (em && /^[^@\s]+@[^@\s]+$/.test(em)) { S.login.email = em; history.replaceState(null, '', location.pathname); } } catch {}
  try { const th = localStorage.getItem('orem-theme'); if (th) document.documentElement.dataset.theme = th; } catch {}
  if (API.demo) { API.as('claire@maisonlumen.fr'); enter(); }
  else if (location.pathname.startsWith('/auth/')) { S.loading = false; S.linkToken = location.pathname.slice(6); history.replaceState(null, '', '/'); render(); }
  else enter().catch(() => { S.loading = false; render(); });
})();
