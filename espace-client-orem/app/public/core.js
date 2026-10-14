/* Logique métier de l'espace client, partagée par le serveur (Node) et la démo (navigateur).
   Tout passe par apply() : une action, un utilisateur, des droits vérifiés, une ligne d'activité. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const DAY = 864e5;
  const iso = (d) => new Date(d).toISOString();
  const addDays = (d, n) => iso(new Date(d).getTime() + n * DAY);
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 10);

  /* Les 5 étapes Orem. `at` = jours après le démarrage (dates indicatives). */
  const PHASES = [
    { n: 1, t: 'Démarrage', days: [0, 4], txt: 'On fait connaissance, on cadre le projet et on réunit les premiers contenus.',
      items: [['Proposition commerciale', 0], ['Devis signé', 0], ['Visio de cadrage (1 h)', 2]] },
    { n: 2, t: 'Cadrage et design', days: [5, 22], txt: 'On construit le plan du site, la direction artistique, les textes puis les maquettes.',
      items: [['Plan du site (arborescence)', 6], ['Direction artistique', 8], ['Textes du site', 8], ['Maquettes du site', 15]] },
    { n: 3, t: 'Construction et mise en ligne', days: [23, 31], txt: 'On construit le site sur Webflow. Le lien de prévisualisation apparaîtra ici.',
      items: [['Création du compte Webflow', 23], ['Construction du site', 28], ['Mise en ligne et remise des accès', 31]] },
    { n: 4, t: 'Formation', days: [32, 35], txt: 'Une visio pour être autonome sur Webflow, et des vidéos à revoir quand vous voulez.',
      items: [['Formation Webflow (visio)', 35]] },
    { n: 5, t: 'Livraison finale', days: [36, 38], txt: 'Dernières vérifications, facture de solde et remise de tous les fichiers.',
      items: [['Livraison finale du site', 38]] }
  ];
  const VALIDATIONS = [
    ['plan', 'Plan du site', 'Les pages du site et leur organisation', 6],
    ['da', 'Direction artistique et textes', 'Couleurs, typographies, style et ton', 8],
    ['maquettes', 'Maquettes du site', 'Le feu vert pour construire le site', 15],
    ['site', 'Site avant mise en ligne', 'Dernier contrôle avant publication', 30]
  ];
  const FILE_CATS = ['Images', 'Vidéos', 'Textes', 'Autres'];
  const AGENCY_CATS = ['Livrable', 'Devis', 'Facture', 'Contrat', 'RIB'];

  function newProject({ client, projet, contactName, start, registre, amountHT }) {
    const s = start ? iso(start) : iso(Date.now());
    const ht = Number(amountHT) || 0;
    return {
      id: uid('p'), client, projet: projet || 'Site web ' + client, contactName: contactName || '',
      registre: registre === 'tu' ? 'tu' : 'vous', start: s, golive: addDays(s, 31), createdAt: iso(Date.now()),
      phase: 1,
      phases: PHASES.map((p) => ({ n: p.n, t: p.t, from: addDays(s, p.days[0]), to: addDays(s, p.days[1]), txt: p.txt,
        items: p.items.map(([t, at]) => ({ id: uid('i'), t, due: addDays(s, at), status: 'wait' })) })),
      next: { title: '', text: '', go: 'accueil' },
      note: { text: '', by: '', at: null },
      meeting: { title: '', when: null },
      validations: VALIDATIONS.map(([key, t, sub, at]) => ({ id: uid('v'), key, t, sub, due: addDays(s, at), status: 'wait', link: '', history: [] })),
      tasks: [],
      missing: [],
      files: [],
      billing: { totalHT: ht, totalTTC: Math.round(ht * 1.2 * 100) / 100, quote: '', signedAt: null },
      invoices: [],
      activity: []
    };
  }

  function seed(now = Date.now()) {
    const users = [
      { id: 'u_louis', email: 'louis@agence-orem.fr', name: 'Louis Montagne', role: 'admin', title: 'Chef de projet', phone: '07 50 37 15 72', wa: 'https://wa.me/33750371572', photo: 'louis' },
      { id: 'u_theo', email: 'theophile@agence-orem.fr', name: 'Théophile Lamouret', role: 'admin', title: 'Stratégie et textes', phone: '07 71 67 39 47', wa: 'https://wa.me/33771673947', photo: 'theophile' },
      { id: 'u_clement', email: 'clement@agence-orem.fr', name: 'Clément', role: 'admin', title: 'Designer, il dessine vos maquettes', photo: 'clement' }
    ];
    const at = (n) => addDays(now, n);

    /* Exemple 1 : en pleine phase de design, une validation attend le client. */
    const a = newProject({ client: 'Maison Lumen', projet: 'Refonte du site maisonlumen.fr', contactName: 'Claire', start: at(-9), registre: 'vous', amountHT: 6900 });
    a.id = 'p_lumen'; a.phase = 2;
    a.phases[0].items.forEach((i) => (i.status = 'done'));
    a.phases[1].items[0].status = 'done';
    a.phases[1].items[1].status = 'on';
    a.phases[1].items[2].status = 'on';
    a.phases[1].items[1].due = a.phases[1].items[2].due = a.validations[1].due = at(5);
    a.validations[0].status = 'ready'; a.validations[0].readyAt = at(-2); a.validations[0].link = 'https://www.figma.com/';
    a.next = { title: 'Valider le plan du site', text: 'Le plan des pages est prêt. Jetez-y un œil, puis validez ou dites-nous ce que vous voulez changer. On attaque la direction artistique juste après.', go: 'valider' };
    a.note = { text: 'Le plan du site est prêt : 7 pages, avec une page par atelier comme on en a parlé en visio. Clément démarre les premières pistes graphiques dès votre feu vert.', by: 'u_louis', at: at(-1) };
    a.meeting = { title: 'Point d’étape (visio, 30 min)', when: (() => { const d = new Date(at(8)); d.setHours(10, 0, 0, 0); return d.toISOString(); })() };
    a.tasks = [
      { id: 't1', t: 'Réserver la visio de cadrage', done: true },
      { id: 't2', t: 'Régler l’acompte de 50 %', done: true }
    ];
    a.missing = [
      { id: 'm1', t: 'Photos de l’équipe', sub: 'Pour la page À propos. Portraits ou photos de groupe.' },
      { id: 'm2', t: '2 ou 3 témoignages clients', sub: 'Un texte court suffit, on s’occupe de la mise en forme.' }
    ];
    a.billing = { totalHT: 6900, totalTTC: 8280, quote: 'D-2026-0142', signedAt: at(-12) };
    a.invoices = [
      { id: 'inv1', num: 'F-2026-0187', label: 'Facture d’acompte (50 %)', ht: 3450, ttc: 4140, status: 'paid', date: at(-11), paidAt: at(-10) },
      { id: 'inv2', num: '', label: 'Facture de solde (50 %)', ht: 3450, ttc: 4140, status: 'future', date: null }
    ];
    const f = (name, cat, from, by, d, size, seen = true) => ({ id: uid('f'), name, cat, from, by, at: at(d), size, seen, demo: true });
    a.files = [
      f('Plan du site, version 1 (Figma)', 'Livrable', 'agence', 'u_louis', -2, 0),
      f('Compte rendu de la visio de cadrage.pdf', 'Livrable', 'agence', 'u_louis', -7, 412000),
      f('Devis D-2026-0142 signé.pdf', 'Devis', 'agence', 'u_louis', -12, 98000),
      f('Facture F-2026-0187.pdf', 'Facture', 'agence', 'u_louis', -11, 87000),
      f('IBAN ICONOKOM.pdf', 'RIB', 'agence', 'u_louis', -11, 61000),
      f('Film de marque.mp4', 'Vidéos', 'client', 'u_claire', -4, 212000000),
      f('Charte graphique 2019.pdf', 'Textes', 'client', 'u_claire', -5, 4100000),
      f('Texte À propos.docx', 'Textes', 'client', 'u_claire', -3, 32000, false),
      f('Photos atelier (12 fichiers).zip', 'Images', 'client', 'u_claire', -6, 86000000),
      f('Logo Maison Lumen.svg', 'Images', 'client', 'u_claire', -8, 48000)
    ];
    a.activity = [
      { at: at(-2), by: 'u_louis', text: 'a demandé la validation du plan du site' },
      { at: at(-3), by: 'u_claire', text: 'a déposé « Texte À propos.docx »', seen: false },
      { at: at(-14), by: 'u_claire', text: 'a réglé l’acompte' }
    ];

    /* Exemple 2 : en construction, rien n'attend. */
    const b = newProject({ client: 'Atelier Nord', projet: 'Site vitrine atelier-nord.fr', contactName: 'Hugo', start: at(-30), registre: 'tu', amountHT: 4800 });
    b.id = 'p_nord'; b.phase = 3;
    b.phases[0].items.forEach((i) => (i.status = 'done'));
    b.phases[1].items.forEach((i) => (i.status = 'done'));
    b.phases[2].items[0].status = 'done'; b.phases[2].items[1].status = 'on';
    b.validations.slice(0, 3).forEach((v) => { v.status = 'approved'; v.history.push({ at: at(-12), by: 'u_hugo', action: 'approved' }); });
    b.next = { title: 'Rien à faire de ton côté cette semaine', text: 'On construit ton site sur Webflow. Le lien de prévisualisation arrive d’ici vendredi.', go: 'projet' };
    b.activity = [{ at: at(-3), by: 'u_hugo', text: 'a validé les maquettes du site', seen: true }];

    /* Exemple 3 : démarrage, une demande de modification à traiter. */
    const c = newProject({ client: 'Cabinet Varenne', projet: 'Refonte cabinet-varenne.fr', contactName: 'Julie', start: at(-9), registre: 'vous', amountHT: 7600 });
    c.id = 'p_varenne'; c.phase = 2;
    c.phases[0].items.forEach((i) => (i.status = 'done'));
    c.phases[1].items[0].status = 'on';
    c.validations[0].status = 'changes'; c.validations[0].history.push({ at: at(-1), by: 'u_julie', action: 'changes', comment: 'Pouvez-vous ajouter une page dédiée au droit de la famille ?' });
    c.activity = [{ at: at(-1), by: 'u_julie', text: 'a demandé des modifications sur le plan du site', seen: false }];

    users.push(
      { id: 'u_claire', email: 'claire@maisonlumen.fr', name: 'Claire', role: 'client', projectId: a.id },
      { id: 'u_hugo', email: 'hugo@atelier-nord.fr', name: 'Hugo', role: 'client', projectId: b.id },
      { id: 'u_julie', email: 'julie@cabinet-varenne.fr', name: 'Julie', role: 'client', projectId: c.id }
    );
    return { users, projects: [a, b, c] };
  }

  /* ---------- Lecture ---------- */
  function canSee(user, project) { return user && (user.role === 'admin' || user.projectId === project.id); }

  function alerts(project) {
    const newFiles = project.files.filter((f) => f.from === 'client' && !f.seen).length;
    const changes = project.validations.filter((v) => v.status === 'changes').length;
    const unseen = project.activity.filter((a) => a.seen === false).length;
    const waiting = project.validations.filter((v) => v.status === 'ready').length;
    return { newFiles, changes, unseen, waiting };
  }

  function nextStep(project) {
    if (project.next && project.next.title) return project.next;
    const ready = project.validations.find((v) => v.status === 'ready');
    if (ready) return { title: 'Valider : ' + ready.t.toLowerCase(), text: '', go: 'valider' };
    const miss = project.missing[0];
    if (miss) return { title: 'Déposer : ' + miss.t.toLowerCase(), text: miss.sub || '', go: 'fichiers' };
    return { title: 'Rien à faire pour l’instant', text: '', go: 'projet' };
  }

  function summary(project) {
    return { id: project.id, client: project.client, projet: project.projet, phase: project.phase,
      phaseName: (project.phases[project.phase - 1] || {}).t, golive: project.golive, next: nextStep(project), alerts: alerts(project),
      lastActivity: project.activity[0] || null };
  }

  /* Ce qu'un client reçoit : pas de notes internes, pas de drapeaux « vu ». */
  function forUser(project, user) {
    if (user.role === 'admin') return project;
    const p = JSON.parse(JSON.stringify(project));
    p.activity = p.activity.map(({ seen, ...a }) => a);
    p.files = p.files.map(({ seen, path, ...f }) => f);
    return p;
  }

  /* ---------- Écriture ---------- */
  const CLIENT_ACTIONS = new Set(['val.approve', 'val.changes', 'task.toggle', 'missing.done', 'file.add', 'user.onboarded']);

  function log(project, user, text) {
    project.activity.unshift({ at: iso(Date.now()), by: user.id, text, seen: user.role === 'admin' });
    if (project.activity.length > 200) project.activity.length = 200;
  }

  function apply(store, projectId, user, action) {
    const project = store.projects.find((p) => p.id === projectId);
    if (!project || !canSee(user, project)) return { error: 'Projet introuvable.' };
    if (user.role !== 'admin' && !CLIENT_ACTIONS.has(action.type)) return { error: 'Action réservée à l’agence.' };
    const v = action.vid && project.validations.find((x) => x.id === action.vid);
    const now = iso(Date.now());
    switch (action.type) {
      case 'val.approve':
        if (!v || v.status !== 'ready') return { error: 'Cette étape n’attend pas de validation.' };
        v.status = 'approved'; v.history.push({ at: now, by: user.id, action: 'approved' });
        if (project.next.go === 'valider') project.next = { title: '', text: '', go: 'accueil' };
        log(project, user, 'a validé : ' + v.t.toLowerCase()); break;
      case 'val.changes':
        if (!v || v.status !== 'ready') return { error: 'Cette étape n’attend pas de validation.' };
        if (!String(action.comment || '').trim()) return { error: 'Écrivez ce que vous aimeriez changer.' };
        v.status = 'changes'; v.history.push({ at: now, by: user.id, action: 'changes', comment: String(action.comment).slice(0, 4000) });
        if (project.next.go === 'valider') project.next = { title: '', text: '', go: 'accueil' };
        log(project, user, 'a demandé des modifications : ' + v.t.toLowerCase()); break;
      case 'val.request':
        if (!v) return { error: 'Validation introuvable.' };
        v.status = 'ready'; v.readyAt = now; if (action.link !== undefined) v.link = String(action.link || '');
        v.history.push({ at: now, by: user.id, action: 'requested' });
        project.next = { title: 'Valider : ' + v.t.toLowerCase(), text: action.text || '', go: 'valider' };
        log(project, user, 'a demandé la validation : ' + v.t.toLowerCase()); break;
      case 'val.reset':
        if (!v) return { error: 'Validation introuvable.' };
        v.status = 'wait'; v.history.push({ at: now, by: user.id, action: 'reset' }); break;
      case 'next.set':
        project.next = { title: String(action.title || ''), text: String(action.text || ''), go: action.go || 'accueil' };
        log(project, user, 'a mis à jour la prochaine étape'); break;
      case 'phase.set': {
        const n = Math.max(1, Math.min(5, Number(action.n) || 1));
        project.phase = n; log(project, user, 'a passé le projet à l’étape ' + n + ' : ' + project.phases[n - 1].t); break;
      }
      case 'item.status': {
        const ph = project.phases.find((p) => p.items.some((i) => i.id === action.iid));
        const it = ph && ph.items.find((i) => i.id === action.iid);
        if (!it || !['wait', 'on', 'done'].includes(action.status)) return { error: 'Livrable introuvable.' };
        it.status = action.status; if (action.due) it.due = iso(action.due); break;
      }
      case 'note.set':
        project.note = { text: String(action.text || ''), by: user.id, at: now }; break;
      case 'meeting.set':
        project.meeting = { title: String(action.title || ''), when: action.when ? iso(action.when) : null }; break;
      case 'task.add':
        if (!String(action.t || '').trim()) return { error: 'Écrivez l’action.' };
        project.tasks.push({ id: uid('t'), t: String(action.t), done: false }); break;
      case 'task.toggle': {
        const t = project.tasks.find((x) => x.id === action.tid); if (!t) return { error: 'Action introuvable.' };
        t.done = !t.done; if (t.done) log(project, user, 'a coché : ' + t.t.toLowerCase()); break;
      }
      case 'task.remove': project.tasks = project.tasks.filter((x) => x.id !== action.tid); break;
      case 'missing.add':
        if (!String(action.t || '').trim()) return { error: 'Écrivez ce qu’il manque.' };
        project.missing.push({ id: uid('m'), t: String(action.t), sub: String(action.sub || '') }); break;
      case 'missing.done': case 'missing.remove':
        project.missing = project.missing.filter((m) => m.id !== action.mid); break;
      case 'file.add': {
        const fl = action.file; if (!fl || !fl.name) return { error: 'Fichier manquant.' };
        const cats = user.role === 'admin' ? FILE_CATS.concat(AGENCY_CATS) : FILE_CATS;
        const rec = { id: fl.id || uid('f'), name: String(fl.name).slice(0, 200), cat: cats.includes(fl.cat) ? fl.cat : (user.role === 'admin' ? 'Livrable' : 'Autres'),
          from: user.role === 'admin' ? 'agence' : 'client', by: user.id, at: now, size: Number(fl.size) || 0, seen: user.role === 'admin', path: fl.path, url: fl.url || '' };
        project.files.unshift(rec);
        log(project, user, 'a déposé « ' + rec.name + ' »'); return { ok: true, file: rec };
      }
      case 'file.remove': project.files = project.files.filter((f) => f.id !== action.fid); break;
      case 'seen':
        project.files.forEach((f) => (f.seen = true)); project.activity.forEach((a) => (a.seen = true)); break;
      case 'invoice.add':
        project.invoices.push({ id: uid('inv'), num: String(action.num || ''), label: String(action.label || 'Facture'), ht: Number(action.ht) || 0,
          ttc: Number(action.ttc) || Math.round((Number(action.ht) || 0) * 120) / 100, status: action.status || 'due', date: now }); break;
      case 'invoice.status': {
        const inv = project.invoices.find((i) => i.id === action.iid); if (!inv) return { error: 'Facture introuvable.' };
        inv.status = action.status; if (action.status === 'paid') inv.paidAt = now; break;
      }
      case 'project.update': {
        const allowed = ['client', 'projet', 'contactName', 'registre', 'golive'];
        for (const k of allowed) if (action[k] !== undefined) project[k] = k === 'golive' ? iso(action[k]) : String(action[k]);
        if (action.totalHT !== undefined) { project.billing.totalHT = Number(action.totalHT) || 0; project.billing.totalTTC = Math.round(project.billing.totalHT * 120) / 100; }
        if (action.quote !== undefined) project.billing.quote = String(action.quote); break;
      }
      case 'user.add': {
        const email = String(action.email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Adresse e-mail invalide.' };
        if (store.users.some((u) => u.email === email)) return { error: 'Cette adresse a déjà un accès.' };
        store.users.push({ id: uid('u'), email, name: String(action.name || email.split('@')[0]), role: 'client', projectId: project.id });
        log(project, user, 'a donné l’accès à ' + email); break;
      }
      case 'user.onboarded': {
        const u = store.users.find((x) => x.id === user.id); if (!u) return { error: 'Utilisateur introuvable.' };
        u.onboardedAt = now; if (action.prefs) u.prefs = { mail: !!action.prefs.mail, whatsapp: !!action.prefs.whatsapp, weekly: !!action.prefs.weekly };
        log(project, user, 'a découvert son espace'); break;
      }
      case 'user.remove': {
        const u = store.users.find((x) => x.id === action.id && x.projectId === project.id);
        if (!u) return { error: 'Accès introuvable.' };
        store.users = store.users.filter((x) => x !== u); break;
      }
      default: return { error: 'Action inconnue.' };
    }
    return { ok: true };
  }

  function createProject(store, user, data) {
    if (user.role !== 'admin') return { error: 'Action réservée à l’agence.' };
    if (!String(data.client || '').trim()) return { error: 'Indiquez le nom du client.' };
    const p = newProject(data);
    store.projects.unshift(p);
    if (data.email) {
      const r = apply(store, p.id, user, { type: 'user.add', email: data.email, name: data.contactName });
      if (r.error) { store.projects.shift(); return r; }
    }
    log(p, user, 'a créé l’espace');
    return { ok: true, id: p.id };
  }

  return { seed, newProject, apply, createProject, summary, forUser, nextStep, alerts, canSee, FILE_CATS, AGENCY_CATS };
});
