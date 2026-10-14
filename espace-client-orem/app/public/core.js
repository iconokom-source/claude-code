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
      activity: [],
      links: { figma: '', proto: '', preview: '', site: '' },
      messages: [],
      assets: [],
      requests: [],
      tools: ['brand', 'signature', 'request', 'webflow'],
      brand: { colors: [], fonts: [] },
      results: null, deliveredAt: null
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
    a.links = { figma: 'https://www.figma.com/', proto: 'https://www.figma.com/', preview: '', site: '' };
    a.messages = [
      { id: 'lm1', by: 'u_clement', at: at(-2), text: 'Claire, je vous présente le plan du site en vidéo, page par page, avant que vous le validiez.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Le plan du site expliqué', duration: '4 min' }, fromAgency: true, readByClient: false },
      { id: 'lm2', fromAgency: true, by: 'u_louis', at: at(-8), text: 'Merci pour la visio de cadrage ! Le compte rendu est dans vos fichiers.' }
    ];
    a.activity = [
      { at: at(-2), by: 'u_louis', text: 'a demandé la validation du plan du site' },
      { at: at(-3), by: 'u_claire', text: 'a déposé « Texte À propos.docx »', seen: false },
      { at: at(-14), by: 'u_claire', text: 'a réglé l’acompte' }
    ];

    /* Exemple 2 : projet livré (Huchet-Demorge). Contenus repris du cas client Orem, facturation fictive. */
    const b = newProject({ client: 'Huchet-Demorge', projet: 'Refonte du site huchet-demorge.fr', contactName: 'Hugo', start: '2025-11-24', registre: 'tu', amountHT: 9800 });
    b.id = 'p_huchet'; b.phase = 5; b.golive = '2026-06-15T09:00:00.000Z'; b.deliveredAt = '2026-06-15T09:00:00.000Z';
    b.phases.forEach((ph) => ph.items.forEach((i) => (i.status = 'done')));
    b.validations.forEach((v) => { v.status = 'approved'; v.history.push({ at: v.due, by: 'u_hugo', action: 'approved' }); });
    b.next = { title: 'Ton site est en ligne', text: 'Il génère environ 5 demandes qualifiées par semaine. Pour qu’il continue de progresser, on peut le faire évoluer chaque mois avec toi.', go: 'outils' };
    b.note = { text: 'Bilan à 1 mois envoyé : chaque associé ressort en position 1 sur son nom, et 68 % du trafic vient de Google, sans budget média. Prochaine étape proposée : le parcours des formulaires d’annonces.', by: 'u_louis', at: at(-6) };
    b.meeting = { title: 'Point évolution du site (visio, 30 min)', when: (() => { const d = new Date(at(6)); d.setHours(11, 0, 0, 0); return d.toISOString(); })() };
    b.billing = { totalHT: 9800, totalTTC: 11760, quote: 'D-2025-0098', signedAt: '2025-11-20T10:00:00.000Z' };
    b.invoices = [
      { id: 'hinv1', num: 'F-2025-0131', label: 'Facture d’acompte (50 %)', ht: 4900, ttc: 5880, status: 'paid', date: '2025-11-21T10:00:00.000Z', paidAt: '2025-11-28T10:00:00.000Z' },
      { id: 'hinv2', num: 'F-2026-0112', label: 'Facture de solde (50 %)', ht: 4900, ttc: 5880, status: 'paid', date: '2026-06-15T10:00:00.000Z', paidAt: '2026-06-22T10:00:00.000Z' }
    ];
    b.links = { figma: 'https://www.figma.com/design/irfVpJlJI85XG3Cv2h7cK5/Huchet-Demorge', proto: 'https://www.figma.com/proto/irfVpJlJI85XG3Cv2h7cK5/Huchet-Demorge', preview: '', site: 'https://www.huchet-demorge.fr/' };
    b.results = { period: 'Depuis la mise en ligne', stats: [['~5', 'demandes qualifiées par semaine'], ['11 961', 'utilisateurs actifs'], ['22 825', 'clics depuis Google'], ['68 %', 'du trafic vient du SEO, sans budget média']] };
    b.brand = { colors: [['Cognac', '#A8552D'], ['Cuivre', '#D67C53'], ['Pierre', '#EFE6DC'], ['Nuit', '#160700']], fonts: [['Titres', 'Sans géométrique, capitales espacées'], ['Texte', 'Sans humaniste']] };
    b.tools = ['teaser', 'brand', 'signature', 'request', 'webflow'];
    b.assets = [
      { id: 'a1', kind: 'Réalisation', title: 'Visuel de couverture du cas client', img: 'assets/hd/cover.jpg', url: 'https://www.agence-orem.fr/realisations/huchet-demorge' },
      { id: 'a2', kind: 'Réalisation', title: 'Mise en scène du site sur mobile', img: 'assets/hd/ecran-1.jpg' },
      { id: 'a3', kind: 'Réalisation', title: 'Pages annonces d’hôtels', img: 'assets/hd/ecran-2.jpg' },
      { id: 'a4', kind: 'Réalisation', title: 'Détail de la direction artistique', img: 'assets/hd/ecran-3.jpg' },
      { id: 'a5', kind: 'Cas d’étude', title: 'Cas client Huchet-Demorge sur agence-orem.fr', img: 'assets/hd/cover.jpg', url: 'https://www.agence-orem.fr/realisations/huchet-demorge' },
      { id: 'a6', kind: 'Maquettes', title: 'Fichier Figma complet (maquettes et composants)', img: 'assets/hd/ecran-2.jpg', url: b.links.figma },
      { id: 'a7', kind: 'Maquettes', title: 'Prototype interactif', img: 'assets/hd/ecran-1.jpg', url: b.links.proto }
    ];
    b.messages = [
      { id: 'hm1', fromAgency: true, by: 'u_louis', at: at(-6), text: 'Hugo, voici le bilan à 1 mois en vidéo : ce qui marche, ce qu’on surveille, et 3 idées pour la suite.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Bilan à 1 mois du site', duration: '6 min' } },
      { id: 'hm2', by: 'u_hugo', at: at(-5), text: 'Top, merci. Nina aimerait savoir de quelle annonce vient chaque demande de contact. C’est faisable ?', readByAgency: true },
      { id: 'hm3', fromAgency: true, by: 'u_louis', at: at(-4), text: 'Oui : on peut ajouter l’annonce (intitulé et lien) dans chaque e-mail de contact. Je te le propose dans le point évolution.' },
      { id: 'hm4', fromAgency: true, by: 'u_clement', at: '2026-01-13T15:00:00.000Z', text: 'Présentation des wireframes et de la page d’accueil, avec les choix de direction artistique.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Wireframes et page d’accueil', duration: '9 min' } }
    ];
    b.requests = [{ id: 'hr1', by: 'u_hugo', at: at(-5), type: 'Formulaires', priority: 'Important', text: 'Indiquer l’annonce concernée (hôtel ou boulangerie) dans chaque e-mail de prise de contact.', status: 'Proposé' }];
    const hf = (name, cat, d, sz) => ({ id: uid('f'), name, cat, from: 'agence', by: 'u_louis', at: d, size: sz, seen: true, demo: true });
    b.files = [
      hf('Guide de réutilisation Webflow.pdf', 'Livrable', '2026-06-15T10:00:00.000Z', 2400000),
      hf('Bilan à 1 mois.pdf', 'Livrable', at(-6), 820000),
      hf('Accès administrateur Webflow.pdf', 'Livrable', '2026-06-15T10:00:00.000Z', 120000),
      hf('Facture F-2026-0112.pdf', 'Facture', '2026-06-15T10:00:00.000Z', 90000),
      hf('Devis D-2025-0098 signé.pdf', 'Devis', '2025-11-20T10:00:00.000Z', 98000)
    ];
    b.activity = [{ at: at(-5), by: 'u_hugo', text: 'a demandé une évolution : formulaires', seen: false }];

    /* Exemple 3 : tout début de projet, la cliente découvre son espace. */
    const c = newProject({ client: 'Cabinet Varenne', projet: 'Refonte cabinet-varenne.fr', contactName: 'Julie', start: at(-1), registre: 'vous', amountHT: 7600 });
    c.id = 'p_varenne'; c.phase = 1;
    c.phases[0].items[0].status = 'done'; c.phases[0].items[1].status = 'done';
    c.next = { title: 'Réserver la visio de cadrage', text: 'Une heure pour caler ensemble vos objectifs, vos cibles et le plan du site. Choisissez le créneau qui vous arrange.', go: 'equipe' };
    c.tasks = [{ id: 'vt1', t: 'Réserver la visio de cadrage (1 h)', done: false }, { id: 'vt2', t: 'Régler l’acompte de 50 %', done: false }];
    c.missing = [{ id: 'vm1', t: 'Logo et charte actuelle', sub: 'Les fichiers que vous avez, même anciens.' }, { id: 'vm2', t: 'Photos du cabinet et de l’équipe', sub: 'Si vous en avez déjà, sinon on en parle en visio.' }];
    c.billing.quote = 'D-2026-0151'; c.billing.signedAt = at(-3);
    c.invoices = [{ id: 'vinv1', num: 'F-2026-0199', label: 'Facture d’acompte (50 %)', ht: 3800, ttc: 4560, status: 'due', date: at(-1) }, { id: 'vinv2', num: '', label: 'Facture de solde (50 %)', ht: 3800, ttc: 4560, status: 'future', date: null }];
    c.files = [hf('Devis D-2026-0151 signé.pdf', 'Devis', at(-3), 97000), hf('Facture F-2026-0199.pdf', 'Facture', at(-1), 88000), hf('IBAN ICONOKOM.pdf', 'RIB', at(-1), 61000)];
    c.messages = [{ id: 'vm-1', fromAgency: true, readByClient: false, by: 'u_louis', at: at(-1), text: 'Bienvenue Julie ! Petite vidéo de 2 minutes pour vous présenter votre espace et la suite du projet.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Bienvenue dans votre espace', duration: '2 min' } }];
    c.activity = [];

    users.push(
      { id: 'u_claire', email: 'claire@maisonlumen.fr', name: 'Claire', role: 'client', projectId: a.id },
      { id: 'u_hugo', email: 'hugo@huchet-demorge.fr', name: 'Hugo', role: 'client', projectId: b.id, onboardedAt: '2025-11-24T10:00:00.000Z' },
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
    const newMessages = (project.messages || []).filter((m) => m.readByAgency === false).length;
    const requests = (project.requests || []).filter((r) => r.status === 'Nouveau').length;
    return { newFiles, changes, unseen, waiting, newMessages, requests };
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
  const CLIENT_ACTIONS = new Set(['val.approve', 'val.changes', 'task.toggle', 'missing.done', 'file.add', 'user.onboarded', 'msg.post', 'msg.read', 'request.add']);

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
      case 'msg.post': {
        const text = String(action.text || '').trim();
        if (!text) return { error: 'Écrivez votre message.' };
        const loom = action.loom && action.loom.url ? { url: String(action.loom.url), title: String(action.loom.title || 'Vidéo'), duration: String(action.loom.duration || '') } : undefined;
        project.messages.unshift({ id: uid('m'), by: user.id, at: now, text: text.slice(0, 4000), loom, fromAgency: user.role === 'admin', readByAgency: user.role === 'admin', readByClient: user.role !== 'admin' });
        log(project, user, loom ? 'a envoyé une vidéo' : 'a envoyé un message'); break;
      }
      case 'msg.read':
        project.messages.forEach((m) => { if (user.role === 'admin') { if (m.readByAgency === false) m.readByAgency = true; } else if (m.readByClient === false) m.readByClient = true; }); break;
      case 'request.add': {
        const text = String(action.text || '').trim();
        if (!text) return { error: 'Décrivez votre demande.' };
        project.requests.unshift({ id: uid('r'), by: user.id, at: now, type: String(action.kind || 'Autre'), priority: String(action.priority || 'Normal'), text: text.slice(0, 4000), status: user.role === 'admin' ? 'Proposé' : 'Nouveau' });
        log(project, user, 'a demandé une évolution : ' + String(action.kind || 'autre').toLowerCase()); break;
      }
      case 'request.status': {
        const r = project.requests.find((x) => x.id === action.rid); if (!r) return { error: 'Demande introuvable.' };
        r.status = String(action.status); break;
      }
      case 'links.set':
        for (const k of ['figma', 'proto', 'preview', 'site']) if (action[k] !== undefined) project.links[k] = String(action[k]).trim();
        log(project, user, 'a mis à jour les liens du projet'); break;
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
