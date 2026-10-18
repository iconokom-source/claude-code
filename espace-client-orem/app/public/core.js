/* Logique métier de l'espace client, partagée par le serveur (Node) et la démo (navigateur).
   Tout passe par apply() : une action, un utilisateur, des droits vérifiés, une ligne d'activité. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const DAY = 864e5;
  const iso = (d) => new Date(d).toISOString();
  const addDays = (d, n) => iso(new Date(d).getTime() + n * DAY);
  const rnd = () => { const c = typeof globalThis !== 'undefined' && globalThis.crypto; if (c && c.randomUUID) { try { return c.randomUUID().replace(/-/g, '').slice(0, 16); } catch (e) {} } return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10); };
  const uid = (p) => p + '_' + rnd();
  /* Textes à deux registres : « {vous|te} forme » donne « vous forme » ou « te forme » selon le projet. */
  const reg = (text, registre) => String(text || '').replace(/\{([^{}|]*)\|([^{}]*)\}/g, (m, v, t) => (registre === 'tu' ? t : v));
  const FILE_CATS = ['Images', 'Vidéos', 'Documents', 'Autres'];
  const AGENCY_CATS = ['Livrable', 'Devis', 'Facture', 'Contrat', 'RIB', 'Bibliothèque'];

  /* ---------- Offres et méthode O.R.E.M. ----------
     Chaque offre suit les 4 temps Orem : Orienter, Représenter, Exécuter, Mesurer.
     `d` = jours après le démarrage (dates indicatives) ; `val` relie un livrable à une validation du client. */
  const OREM = [['O', 'Orienter'], ['R', 'Représenter'], ['E', 'Exécuter'], ['M', 'Mesurer']];
  const OFFERS = {
    site: { label: 'Site web', phases: [
      { d: [0, 8], txt: 'On cadre ensemble les objectifs, les cibles et le plan du site.',
        items: [['Proposition commerciale', -7], ['Devis signé', -3], ['Visio de cadrage (1 h)', 2], ['Plan du site (arborescence)', 8, 'plan']] },
      { d: [9, 21], txt: 'On donne une image au site : direction artistique, textes, puis maquettes.',
        items: [['Direction artistique', 14, 'da'], ['Textes du site', 14, 'da'], ['Maquettes du site', 21, 'maquettes']] },
      { d: [22, 38], txt: 'On construit le site sur Webflow, on le teste ensemble, on le met en ligne et on {vous|te} forme.',
        items: [['Création du compte Webflow', 23], ['Construction du site', 31], ['Tests du site', 34, 'site'], ['Mise en ligne et remise des accès', 36, 'pv'], ['Formation Webflow (visio)', 38]] },
      { d: [39, 70], txt: 'On mesure les résultats et on améliore ce qui {vous |t’}apporte des clients.',
        items: [['Bilan à 30 jours', 66], ['Proposition d’évolution', 70]] }
    ], validations: [['plan', 'Plan du site', 'Les pages du site et leur organisation', 8], ['da', 'Direction artistique et textes', 'Couleurs, typographies, style et ton', 14], ['maquettes', 'Maquettes du site', 'Le feu vert pour construire le site', 21], ['site', 'Tests du site', 'Le site complet, à tester avant sa mise en ligne', 34], ['pv', 'Mise en ligne', 'Le site est livré tel que prévu', 36]] },
    da: { label: 'Direction artistique', phases: [
      { d: [0, 7], txt: 'On comprend {votre|ta} marque, {vos|tes} clients et ce qui {vous|te} distingue.',
        items: [['Devis signé', -3], ['Atelier de marque (1 h 30)', 3], ['Synthèse et plateforme de marque', 7, 'plateforme']] },
      { d: [8, 20], txt: 'On explore des pistes créatives, puis on affine celle que {vous retenez|tu retiens}.',
        items: [['Pistes créatives', 14, 'pistes'], ['Direction artistique finale', 20, 'da']] },
      { d: [21, 32], txt: 'On décline l’identité sur {vos|tes} supports et on livre la charte.',
        items: [['Logo et déclinaisons', 26], ['Charte graphique', 30, 'charte'], ['Livraison des fichiers sources', 32]] },
      { d: [33, 60], txt: 'On vérifie que l’identité vit bien sur {vos|tes} supports.',
        items: [['Point d’usage à 30 jours', 60]] }
    ], validations: [['plateforme', 'Plateforme de marque', 'Ce que dit la marque, et à qui', 7], ['pistes', 'Choix de la piste créative', 'La direction à développer', 14], ['da', 'Direction artistique finale', 'Logo, couleurs, typographies', 20], ['charte', 'Charte graphique', 'Les règles d’usage de l’identité', 30]] },
    conseil: { label: 'Conseil', phases: [
      { d: [0, 10], txt: 'On écoute : entretiens, analyse de l’existant et du marché.',
        items: [['Devis signé', -3], ['Entretiens de cadrage', 7], ['Analyse de l’existant', 10]] },
      { d: [11, 18], txt: 'On formule un positionnement clair et différenciant.',
        items: [['Restitution du positionnement', 18, 'positionnement']] },
      { d: [19, 28], txt: 'On traduit le positionnement en plan d’action concret.',
        items: [['Plan d’action priorisé', 28, 'plan-action']] },
      { d: [29, 60], txt: 'On fait le point sur la mise en œuvre.',
        items: [['Point à 30 jours', 60]] }
    ], validations: [['positionnement', 'Positionnement', 'Le message et la promesse', 18], ['plan-action', 'Plan d’action', 'Les priorités et le calendrier', 28]] },
    evolution: { label: 'Évolution', phases: [
      { d: [0, 3], txt: 'Chaque mois, on lit les chiffres ensemble en visio de pilotage.', items: [['Visio de pilotage', 3]] },
      { d: [4, 6], txt: 'On décide des priorités du mois.', items: [['Priorités du mois', 6, 'priorites']] },
      { d: [7, 25], txt: 'On exécute les interventions décidées.', items: [['Interventions du mois', 25]] },
      { d: [26, 30], txt: 'On documente ce qui a été fait et ce que ça change.', items: [['Rapport mensuel', 30]] }
    ], validations: [['priorites', 'Priorités du mois', 'Ce qu’on fait évoluer ce mois-ci', 6]] }
  };
  /* Qui fait quoi sur chaque livrable, et où le trouver. Rôles par défaut selon la fonction de chacun
     (Louis : Webflow et livraison du site ; Théophile : stratégie, textes, référencement ; Clément : création),
     modifiables par l'équipe sur chaque projet. « client » = ce qu'il y a à faire côté client.
     Des phrases : « Théophile rédige la proposition », « Vous la lisez et l’acceptez en ligne » (registre du client). */
  const L = 'u_louis', T = 'u_theo', C = 'u_clement', K = 'client';
  const ROLES = {
    'Proposition commerciale': [[[T, 'rédige la proposition et {vous|te} la présente'], [K, '{Vous la lisez et l’acceptez|Tu la lis et l’acceptes} en ligne']], 'proposition'],
    'Devis signé': [[[L, 'établit le devis'], [K, '{Vous le signez|Tu le signes} en ligne']], 'documents'],
    'Visio de cadrage (1 h)': [[[L, 'anime la visio et fixe le planning'], [T, 'cadre les objectifs et les cibles'], [C, 'recueille {vos|tes} goûts et références'], [K, '{Vous choisissez|Tu choisis} le créneau']], 'cal'],
    'Plan du site (arborescence)': [[[T, 'construit le plan des pages'], [K, '{Vous le validez|Tu le valides} ou {demandez|demandes} des changements']], 'valider'],
    'Direction artistique': [[[C, 'crée les couleurs, les typographies et le style'], [K, '{Vous la validez|Tu la valides}']], 'valider'],
    'Textes du site': [[[T, 'écrit les textes, pensés pour Google'], [K, '{Vous les relisez et les validez|Tu les relis et les valides}']], 'valider'],
    'Maquettes du site': [[[C, 'dessine les maquettes'], [K, '{Vous les commentez puis les validez|Tu les commentes puis les valides}']], 'maquettes'],
    'Création du compte Webflow': [[[K, '{Vous créez|Tu crées} l’espace Webflow de l’entreprise'], [L, 'vérifie l’accès']], 'demarrer'],
    'Construction du site': [[[L, 'construit le site sur Webflow'], [T, 'intègre les textes et le référencement']], 'projet'],
    'Tests du site': [[[L, 'prépare le site pour {vos|tes} tests'], [K, '{Vous testez|Tu testes} le site et {notez|notes} {vos|tes} retours']], 'valider'],
    'Mise en ligne et remise des accès': [[[L, 'met le site en ligne et {vous|te} remet les accès'], [K, '{Vous validez|Tu valides} la mise en ligne']], 'valider'],
    'Formation Webflow (visio)': [[[L, 'anime la formation'], [K, '{Vous choisissez|Tu choisis} le créneau']], 'cal'],
    'Bilan à 30 jours': [[[T, 'lit les chiffres et prépare les recommandations'], [L, 'fait le point technique']], 'documents'],
    'Proposition d’évolution': [[[T, 'propose les priorités'], [K, '{Vous choisissez|Tu choisis} ce qu’on fait évoluer']], 'proposition'],
    'Atelier de marque (1 h 30)': [[[C, 'anime l’atelier'], [T, 'travaille le positionnement'], [K, '{Vous choisissez|Tu choisis} le créneau']], 'cal'],
    'Synthèse et plateforme de marque': [[[T, 'rédige la plateforme de marque'], [K, '{Vous la validez|Tu la valides}']], 'valider'],
    'Pistes créatives': [[[C, 'crée les pistes'], [K, '{Vous choisissez|Tu choisis} une piste']], 'valider'],
    'Direction artistique finale': [[[C, 'affine la piste retenue'], [K, '{Vous la validez|Tu la valides}']], 'valider'],
    'Logo et déclinaisons': [[[C, 'dessine le logo et ses déclinaisons']], 'maquettes'],
    'Charte graphique': [[[C, 'réalise la charte graphique'], [K, '{Vous la validez|Tu la valides}']], 'valider'],
    'Livraison des fichiers sources': [[[C, 'livre tous les fichiers']], 'fichiers'],
    'Point d’usage à 30 jours': [[[C, 'fait le point sur {vos|tes} supports'], [K, '{Vous partagez|Tu partages} {vos|tes} retours']], 'cal'],
    'Entretiens de cadrage': [[[T, 'conduit les entretiens'], [K, '{Vous y participez|Tu y participes}']], 'cal'],
    'Analyse de l’existant': [[[T, 'analyse l’existant et le marché']], 'projet'],
    'Restitution du positionnement': [[[T, 'restitue le positionnement'], [K, '{Vous le validez|Tu le valides}']], 'valider'],
    'Plan d’action priorisé': [[[T, 'rédige le plan d’action'], [K, '{Vous le validez|Tu le valides}']], 'valider'],
    'Point à 30 jours': [[[T, 'fait le point sur la mise en œuvre']], 'cal'],
    'Visio de pilotage': [[[L, 'présente les chiffres du mois'], [T, 'propose les priorités'], [K, '{Vous y participez|Tu y participes}']], 'cal'],
    'Priorités du mois': [[[T, 'propose les priorités'], [K, '{Vous les validez|Tu les valides}']], 'valider'],
    'Interventions du mois': [[[L, 'réalise les interventions sur le site'], [C, 'crée les visuels si besoin']], 'projet'],
    'Rapport mensuel': [[[T, 'rédige le bilan du mois']], 'documents']
  };
  const itemWho = (it) => (it && Array.isArray(it.who) ? it.who : ((ROLES[it && it.t] || [])[0] || []));
  const itemGo = (it) => (it && it.link) || ((ROLES[it && it.t] || [])[1] || '');
  const REVIEW_AXES = [['ecoute', 'Écoute et compréhension du besoin'], ['qualite', 'Qualité du résultat'], ['delais', 'Respect des délais'], ['communication', 'Clarté des échanges'], ['prix', 'Rapport qualité prix']];
  const DEFAULT_MISSING = {
    site: [['Logo et charte actuels', 'Tous les fichiers existants, même anciens.'], ['Photos', 'Équipe, lieux, produits : celles qui existent déjà.']],
    da: [['Logo actuel', 'Même ancien, en bonne qualité si possible.'], ['3 ou 4 marques qui inspirent', 'Des liens ou des captures, avec un mot sur ce qui plaît.']],
    conseil: [['Documents existants', 'Plaquette, présentation, chiffres clés : ce qui aide à comprendre l’activité.']],
    evolution: [['Accès Google Analytics et Search Console', 'Pour lire les chiffres du site chaque mois.']]
  };
  /* « Bien démarrer » : les trois priorités du client à l'arrivée (site web) : l'acompte, l'espace Webflow
     à son nom, l'accès au nom de domaine. Le client les envoie, l'équipe vérifie et coche. */
  const SETUP = [['webflow', 'Créer l’espace Webflow de l’entreprise'], ['domaine', 'Donner l’accès au nom de domaine']];
  function addSetup(project, at) {
    if (project.offer !== 'site') return;
    const i = project.tasks.findIndex((t) => t.auto === 'acompte');
    const add = SETUP.filter(([k]) => !project.tasks.some((t) => t.auto === k)).map(([k, t]) => ({ id: uid('t'), t, done: false, auto: k, go: 'demarrer', at }));
    project.tasks.splice(i >= 0 ? i + 1 : 0, 0, ...add);
  }
  const PRELAUNCH = ['Redirections 301 de l’ancien site', 'Mentions légales et politique de confidentialité', 'Bandeau cookies conforme', 'Nom de domaine et DNS prêts', 'Titres et descriptions des pages', 'Formulaires testés de bout en bout', 'Google Analytics et Search Console installés'];
  const DEFAULT_TOOLS = { site: ['brand', 'signature', 'request', 'webflow'], da: ['brand', 'signature'], conseil: ['request'], evolution: ['brand', 'signature', 'request', 'webflow'] };
  const HANDOVER = ['Accès administrateur Webflow transmis', 'Fichiers sources Figma partagés', 'Guide de réutilisation remis', 'Formation réalisée', 'Google Analytics et Search Console connectés'];
  const GENERIC_TUTORIALS = [['Modifier un texte ou une image', '3 min'], ['Ajouter une page à partir d’un modèle', '4 min'], ['Publier un article', '3 min'], ['Publier ses changements en toute sécurité', '2 min']];

  function newProject({ client, projet, contactName, start, registre, amountHT, offer }) {
    const s = start ? iso(start) : iso(Date.now());
    const ht = Number(amountHT) || 0;
    const of = OFFERS[offer] ? offer : 'site', T = OFFERS[of];
    const vals = T.validations.map(([key, t, sub, d]) => ({ id: uid('v'), key, t, sub, due: addDays(s, d), status: 'wait', link: '', history: [] }));
    const lastDay = Math.max(...T.phases.map((p) => p.d[1]));
    return {
      id: uid('p'), client, projet: projet || `${T.label} ${client}`, contactName: contactName || '', offer: of,
      registre: registre === 'tu' ? 'tu' : 'vous', start: s, golive: addDays(s, of === 'site' ? 36 : of === 'evolution' ? lastDay : Math.max(...T.phases[2].items.map((i) => i[1]))), createdAt: iso(Date.now()),
      phase: 1,
      phases: T.phases.map((p, i) => ({ n: i + 1, letter: OREM[i][0], t: OREM[i][1], from: addDays(s, p.d[0]), to: addDays(s, p.d[1]), txt: p.txt, // « {vous|te} » : résolu à l'affichage selon le registre du projet
        items: p.items.map(([t, d, val]) => ({ id: uid('i'), t, due: addDays(s, d), status: 'wait', val: val || undefined })) })),
      next: { title: '', text: '', go: 'accueil' },
      note: { text: '', by: '', at: null },
      meeting: { title: '', when: null },
      validations: vals,
      tasks: [], missing: [], files: [],
      billing: { totalHT: ht, totalTTC: Math.round(ht * 1.2 * 100) / 100, quote: '', signedAt: null },
      invoices: [], activity: [],
      links: { figma: '', proto: '', preview: '', site: '' },
      messages: [], assets: [], requests: [],
      tools: DEFAULT_TOOLS[of].slice(), tutorials: GENERIC_TUTORIALS.map(([t, d]) => ({ t, d, url: '' })),
      brand: { colors: [], fonts: [] },
      results: null, deliveredAt: null, archivedAt: null,
      handover: of === 'site' ? HANDOVER.map((t) => ({ t, done: false })) : [],
      prelaunch: of === 'site' ? PRELAUNCH.map((t) => ({ t, done: false })) : [], cycle: of === 'evolution' ? 1 : undefined,
      review: null,
      proposals: [], versions: [], pins: [], reports: [],
      team: { lead: null, members: [] }
    };
  }
  /* Recaler les dates d'un projet réel (début et mise en ligne connus). */
  function placePhases(p, bounds) {
    p.phases.forEach((ph, i) => { if (!bounds[i]) return; ph.from = iso(bounds[i][0]); ph.to = iso(bounds[i][1]); });
  }

  function seed(now = Date.now()) {
    const TEAM3 = ['u_louis', 'u_theo', 'u_clement'];
    const users = [
      { id: 'u_louis', email: 'louis@agence-orem.fr', name: 'Louis Montagne', role: 'admin', title: 'Chef de projet et développeur Webflow', contact: ['Le planning, les rendez-vous et l’avancement du projet', 'La construction du site sur Webflow et sa mise en ligne', 'Les devis, les factures et les accès'], phone: '07 50 37 15 72', wa: 'https://wa.me/33750371572', photo: 'louis' },
      { id: 'u_theo', email: 'theophile@agence-orem.fr', name: 'Théophile Lamouret', role: 'admin', title: 'Stratège, contenus et référencement', contact: ['Le positionnement et le message de la marque', 'Les textes du site et leur relecture', 'Le référencement sur Google et dans les IA, et les bilans mensuels'], phone: '07 71 67 39 47', wa: 'https://wa.me/33771673947', photo: 'theophile' },
      { id: 'u_clement', email: 'clement@agence-orem.fr', name: 'Clément Saint-Hilaire', role: 'admin', title: 'Directeur de création', contact: ['L’identité visuelle, le logo et la charte graphique', 'Les maquettes et les retours sur le design', 'Les visuels, la bibliothèque et les fichiers sources'], phone: '06 95 62 59 25', wa: 'https://wa.me/33695625925', photo: 'clement' }
    ];
    const at = (n, h) => { const d = new Date(now + n * DAY); if (h !== undefined) d.setHours(h, 0, 0, 0); return d.toISOString(); };
    const f = (name, cat, from, by, d, size, extra = {}) => ({ id: uid('f'), name, cat, from, by, at: d, size, seen: true, demo: true, ...extra });
    const done = (p, upto) => p.phases.forEach((ph) => ph.items.forEach((i) => { if (new Date(i.due) <= new Date(upto)) i.status = 'done'; }));
    const approve = (p, key, d, by) => { const v = p.validations.find((x) => x.key === key); v.status = 'approved'; v.readyAt = addDays(d, -2); v.history.push({ at: addDays(d, -2), by: 'u_louis', action: 'requested' }, { at: d, by, action: 'approved' }); };

    /* Exemple 1 : Maison Lumen (fictif). Site web en cours, le plan du site attend la validation de Claire. */
    const a = newProject({ client: 'Maison Lumen', projet: 'Refonte du site maisonlumen.fr', contactName: 'Claire', start: at(-6), registre: 'vous', amountHT: 6900, offer: 'site' });
    a.id = 'p_lumen'; a.phase = 1;
    a.phases[0].items.forEach((i) => { if (!i.val) i.status = 'done'; });
    a.phases[0].items[3].status = 'done';
    const lp = a.validations.find((v) => v.key === 'plan'); lp.status = 'ready'; lp.readyAt = at(-2, 11); lp.due = at(1, 18); a.phases[0].items[3].due = at(-2, 11); lp.link = 'https://www.figma.com/proto/exemple-maison-lumen-plan';
    lp.history.push({ at: at(-2, 11), by: 'u_louis', action: 'requested' });
    a.next = { title: 'Valider le plan du site', text: 'Le plan des pages est prêt. Regardez la vidéo de Clément, puis validez ou dites-nous ce que vous voulez changer. La direction artistique démarre juste après.', go: 'valider' };
    a.note = { text: 'Le plan du site est prêt : 7 pages, avec une page par atelier comme on en a parlé en visio. Clément démarre les premières pistes graphiques dès votre feu vert.', by: 'u_louis', at: at(-1, 17) };
    a.meeting = { title: 'Point d’étape (visio, 30 min)', when: at(8, 10) };
    a.tasks = [{ id: 't1', t: 'Réserver la visio de cadrage', done: true }, { id: 't2', t: 'Régler l’acompte de 50 %', done: true, auto: 'acompte', go: 'documents' }];
    addSetup(a, at(-20, 9)); a.tasks.filter((t) => t.go === 'demarrer').forEach((t) => Object.assign(t, { done: true, sent: at(-19, 10), checkedAt: at(-18, 9), checkedBy: 'u_louis', info: t.auto === 'webflow' ? { ws: 'Maison Lumen' } : { domain: 'maisonlumen.fr', registrar: 'OVHcloud', mode: 'delegate' } }));
    a.missing = [{ id: 'm1', t: 'Photos de l’équipe', sub: 'Pour la page À propos. Portraits ou photos de groupe.', at: at(-4) }, { id: 'm2', t: '2 ou 3 témoignages clients', sub: 'Un texte court suffit, on s’occupe de la mise en forme.', at: at(-4) }];
    a.billing = { totalHT: 6900, totalTTC: 8280, quote: 'D-2026-0142', signedAt: at(-15, 15) };
    a.invoices = [
      { id: 'inv1', num: 'F-2026-0187', label: 'Facture d’acompte (50 %)', ht: 3450, ttc: 4140, status: 'paid', date: at(-14, 9), paidAt: at(-13, 10) },
      { id: 'inv2', num: '', label: 'Facture de solde (50 %)', ht: 3450, ttc: 4140, status: 'future', date: null }
    ];
    a.links = { figma: 'https://www.figma.com/design/exemple-maison-lumen', proto: 'https://www.figma.com/proto/exemple-maison-lumen-plan', preview: '', site: 'https://www.maisonlumen.fr' };
    a.files = [
      f('Cession des droits d’auteur.pdf', 'Contrat', 'agence', 'u_louis', at(-1, 15), 118000, { sign: { status: 'requested', at: at(-1, 15), by: 'u_louis', label: 'Cession des droits sur la marque et le site' } }),
      f('Plan du site, version 1 (Figma)', 'Livrable', 'agence', 'u_clement', at(-2, 11), 0, { url: 'https://www.figma.com/proto/exemple-maison-lumen-plan' }),
      f('Compte rendu de la visio de cadrage.pdf', 'Livrable', 'agence', 'u_louis', at(-4, 16), 412000),
      f('Devis D-2026-0142 signé.pdf', 'Devis', 'agence', 'u_louis', at(-15, 15), 98000),
      f('Facture F-2026-0187.pdf', 'Facture', 'agence', 'u_louis', at(-14, 9), 87000),
      f('IBAN ICONOKOM.pdf', 'RIB', 'agence', 'u_louis', at(-14, 9), 61000),
      f('Film de marque.mp4', 'Vidéos', 'client', 'u_claire', at(-5, 14), 212000000),
      f('Charte graphique 2019.pdf', 'Documents', 'client', 'u_claire', at(-6, 9), 4100000),
      f('Texte À propos.docx', 'Documents', 'client', 'u_claire', at(-3, 18), 32000, { seen: false }),
      f('Photos atelier (12 fichiers).zip', 'Images', 'client', 'u_claire', at(-7, 10), 86000000),
      f('Logo Maison Lumen.svg', 'Images', 'client', 'u_claire', at(-11, 12), 48000)
    ];
    a.messages = [
      { id: 'lm1', fromAgency: true, readByClient: false, by: 'u_clement', at: at(-2, 11), text: 'Claire, je vous présente le plan du site en vidéo, page par page, avant que vous le validiez.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Le plan du site expliqué', duration: '4 min' } },
      { id: 'lm2', fromAgency: true, by: 'u_louis', at: at(-4, 16), text: 'Merci pour la visio de cadrage ! Le compte rendu est dans vos fichiers.' }
    ];
    a.activity = [
      { at: at(-2, 11), by: 'u_louis', text: 'a demandé la validation : plan du site' },
      { at: at(-3, 18), by: 'u_claire', text: 'a déposé « Texte À propos.docx »', seen: false },
      { at: at(-13, 10), by: 'u_claire', text: 'a réglé l’acompte' }
    ];

    /* Exemple 2 : Huchet-Demorge, projet livré. Contenus repris du cas client Orem ; facturation et messages fictifs. */
    const b = newProject({ client: 'Huchet-Demorge', projet: 'Refonte du site huchet-demorge.fr', contactName: 'Hugo', start: '2025-11-24T09:00:00.000Z', registre: 'tu', amountHT: 9800, offer: 'site' });
    b.id = 'p_huchet'; b.phase = 4; b.golive = '2026-06-15T09:00:00.000Z'; b.deliveredAt = '2026-06-15T09:00:00.000Z';
    placePhases(b, [['2025-11-24', '2025-12-19'], ['2026-01-05', '2026-03-13'], ['2026-03-16', '2026-06-22'], ['2026-06-23', at(30)]]);
    const due = { 'Proposition commerciale': '2025-11-17', 'Devis signé': '2025-11-20', 'Visio de cadrage (1 h)': '2025-11-26', 'Plan du site (arborescence)': '2025-12-16', 'Direction artistique': '2026-02-06', 'Textes du site': '2026-02-06', 'Maquettes du site': '2026-03-13', 'Création du compte Webflow': '2026-03-18', 'Construction du site': '2026-05-29', 'Tests du site': '2026-06-10', 'Mise en ligne et remise des accès': '2026-06-15', 'Formation Webflow (visio)': '2026-06-22', 'Bilan à 30 jours': '2026-07-15', 'Proposition d’évolution': at(6) };
    b.phases.forEach((ph) => ph.items.forEach((i) => { if (due[i.t]) i.due = iso(due[i.t]); }));
    done(b, at(0));
    b.phases[3].items[1].status = 'on';
    [['plan', '2025-12-16'], ['da', '2026-02-06'], ['maquettes', '2026-03-13'], ['site', '2026-06-10'], ['pv', '2026-06-16']].forEach(([k, d]) => { b.validations.find((v) => v.key === k).due = iso(d); approve(b, k, iso(d + 'T15:00:00.000Z'), 'u_hugo'); });
    b.next = { title: 'Ton site est en ligne', text: 'Pour qu’il continue de progresser, on peut le faire évoluer chaque mois avec toi.', go: 'outils' };
    b.note = { text: 'Point à 4 mois envoyé : chaque associé ressort en position 1 sur son nom, et 68 % du trafic vient de la recherche Google, sans budget média. Prochaine étape proposée : le parcours des formulaires d’annonces.', by: 'u_louis', at: at(-6, 17) };
    b.meeting = { title: 'Point évolution du site (visio, 30 min)', when: at(6, 11) };
    b.billing = { totalHT: 9800, totalTTC: 11760, quote: 'D-2025-0098', signedAt: '2025-11-20T10:00:00.000Z' };
    b.invoices = [
      { id: 'hinv1', num: 'F-2025-0131', label: 'Facture d’acompte (50 %)', ht: 4900, ttc: 5880, status: 'paid', date: '2025-11-21T10:00:00.000Z', paidAt: '2025-11-28T10:00:00.000Z' },
      { id: 'hinv2', num: 'F-2026-0112', label: 'Facture de solde (50 %)', ht: 4900, ttc: 5880, status: 'paid', date: '2026-06-15T10:00:00.000Z', paidAt: '2026-06-22T10:00:00.000Z' }
    ];
    b.links = { figma: 'https://www.figma.com/design/irfVpJlJI85XG3Cv2h7cK5/Huchet-Demorge', proto: 'https://www.figma.com/proto/irfVpJlJI85XG3Cv2h7cK5/Huchet-Demorge', preview: '', site: 'https://www.huchet-demorge.fr/' };
    // Évolution (abonnement mensuel après la mise en ligne) : une visio de pilotage par mois, un bilan, des axes d'amélioration.
    b.evo = { active: true, since: '2026-07-15T09:00:00.000Z', plan: 'Évolution mensuelle',
      meeting: { when: at(6, 11), mode: 'Visio de pilotage (45 min)' }, reschedule: [],
      axes: [
        { id: 'ax1', t: 'Mesurer chaque demande d’annonce, du site jusqu’au CRM', effect: 'Savoir quelles pages et quelles sources apportent les demandes.', who: 'u_louis', due: at(8), status: 'on', priority: true },
        { id: 'ax2', t: 'Réécrire les titres des pages hôtels et boulangeries', effect: 'Plus de clics depuis Google sur ces recherches.', who: 'u_theo', due: at(15), status: 'todo' },
        { id: 'ax3', t: 'Annonce intégrée à chaque e-mail de contact', effect: 'Des demandes plus qualifiées, sans aller-retour.', who: 'u_louis', due: at(22), status: 'todo' },
        { id: 'ax4', t: 'Nouvelle série de visuels pour LinkedIn', effect: 'Des publications régulières aux couleurs de la marque.', who: 'u_clement', due: at(-5), status: 'done' }],
      next: [['Novembre', 'Lire les premières demandes par source, enrichir la FAQ.'], ['Décembre', 'Pages par ville pour les recherches locales.'], ['Janvier', 'Section témoignages de vendeurs et d’acheteurs.']],
      reports: [
        { id: 'rp3', month: '2026-09', title: 'Le site attire davantage, il reste à mesurer ce qu’il rapporte', summary: 'Meilleur mois depuis la mise en ligne. Les demandes progressent, mais une partie ne remonte pas encore jusqu’au CRM.',
          stats: [['2 140', 'visites sur le site', '+14 % sur août'], ['21', 'demandes d’annonce', '+5 sur août'], ['1 930', 'clics depuis Google', '+6 % sur août'], ['7,4', 'position moyenne', 'gagne 0,8 place']],
          done: [['Nouvelle série de visuels LinkedIn', 'Livrée le 12 septembre'], ['Formulaire d’annonce simplifié', '3 champs de moins, en ligne le 18 septembre']], at: '2026-10-03T09:00:00.000Z' },
        { id: 'rp2', month: '2026-08', title: 'Un mois d’été stable, la recherche Google porte le site', summary: 'Le trafic tient malgré l’été ; les recherches sur le nom de l’agence progressent.',
          stats: [['1 880', 'visites sur le site', '+3 % sur juillet'], ['16', 'demandes d’annonce', '+1 sur juillet'], ['1 820', 'clics depuis Google', '+4 % sur juillet'], ['8,2', 'position moyenne', 'gagne 0,3 place']],
          done: [['Pages hôtels : temps de chargement divisé par deux', 'Images optimisées le 7 août']], at: '2026-09-04T09:00:00.000Z' },
        { id: 'rp1', month: '2026-07', title: 'Premier mois complet : la base de comparaison', summary: 'Premier état des lieux complet : audience, Google, assistants IA et fiabilité de la mesure.',
          stats: [['1 825', 'visites sur le site', 'premier mois'], ['15', 'demandes d’annonce', 'premier mois'], ['1 750', 'clics depuis Google', 'premier mois'], ['8,5', 'position moyenne', 'premier mois']],
          done: [['Site en ligne depuis le 15 juin', 'Formation Webflow faite le 2 juillet']], at: '2026-08-05T09:00:00.000Z' }] };
    // Le document présenté en visio, consultable et téléchargeable à tout moment (exemples générés par tools/bilans-exemple.js).
    b.evo.reports.forEach((r) => { r.doc = `assets/bilans/huchet-demorge-${r.month}.pdf`; });
    b.results = { period: 'Depuis la mise en ligne, le 15 juin 2026', stats: [['~5', 'demandes qualifiées par semaine'], ['11 961', 'utilisateurs actifs'], ['22 825', 'clics depuis Google'], ['68 %', 'du trafic vient de la recherche Google']] };
    b.brand = { colors: [['Cognac', '#A8552D'], ['Cuivre', '#D67C53'], ['Pierre', '#EFE6DC'], ['Nuit', '#160700']], fonts: [['Titres', 'Sans géométrique, capitales espacées'], ['Texte', 'Sans humaniste']] };
    b.tools = ['teaser', 'brand', 'signature', 'request', 'webflow'];
    b.tutorials = [{ t: 'Modifier un texte ou une image', d: '3 min', url: '' }, { t: 'Ajouter un hôtel ou une boulangerie à vendre', d: '4 min', url: '' }, { t: 'Publier un article', d: '3 min', url: '' }, { t: 'Publier ses changements en toute sécurité', d: '2 min', url: '' }];
    b.handover = HANDOVER.map((t) => ({ t, done: true }));
    // Bibliothèque : les visuels du fichier Figma (pages « Bento reveal » et « Cas d'étude »), à télécharger. Aucun renvoi vers le site de l'agence.
    b.assets = [
      { id: 'a1', kind: 'Présentation', title: 'Visuel de présentation (bento)', img: 'assets/hd/cover.jpg', by: 'team' },
      { id: 'a2', kind: 'Cas d’étude', title: 'Cas d’étude · planche 01', img: 'assets/hd/ecran-1.jpg', by: 'team' },
      { id: 'a3', kind: 'Cas d’étude', title: 'Cas d’étude · planche 02', img: 'assets/hd/ecran-2.jpg', by: 'team' },
      { id: 'a4', kind: 'Cas d’étude', title: 'Cas d’étude · planche 03', img: 'assets/hd/ecran-3.jpg', by: 'team' },
      // Écrans des maquettes, à commenter avec des épingles (page Maquettes), hors de la bibliothèque.
      { id: 'a8', kind: 'Maquettes', title: 'Page d’accueil', img: 'assets/hd/ecran-1.jpg', by: 'u_clement' },
      { id: 'a9', kind: 'Maquettes', title: 'Pages annonces d’hôtels', img: 'assets/hd/ecran-2.jpg', by: 'u_clement' }
    ];
    b.messages = [
      { id: 'hm4', fromAgency: true, by: 'u_clement', at: '2026-01-13T15:00:00.000Z', text: 'Présentation des wireframes et de la page d’accueil, avec les choix de direction artistique.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Wireframes et page d’accueil', duration: '9 min' } },
      { id: 'hm0', fromAgency: true, by: 'u_louis', at: '2026-07-15T16:00:00.000Z', text: 'Hugo, voici le bilan à 30 jours en vidéo : ce qui marche, ce qu’on surveille.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Bilan à 30 jours', duration: '6 min' } },
      { id: 'hm1', fromAgency: true, by: 'u_louis', at: at(-6, 17), text: 'Le point à 4 mois est dans tes fichiers : 3 idées pour la suite, dont le parcours des formulaires.' },
      { id: 'hm2', by: 'u_hugo', at: at(-5, 9), text: 'Top, merci. Nina aimerait savoir de quelle annonce vient chaque demande de contact. C’est faisable ?', readByAgency: true },
      { id: 'hm3', fromAgency: true, by: 'u_louis', at: at(-4, 10), text: 'Oui : on peut ajouter l’annonce (intitulé et lien) dans chaque e-mail de contact. Je te le propose au point évolution.' }
    ];
    b.requests = [{ id: 'hr1', by: 'u_hugo', at: at(-5, 9), type: 'Formulaires', priority: 'Important', text: 'Indiquer l’annonce concernée (hôtel ou boulangerie) dans chaque e-mail de prise de contact.', status: 'Nouveau' }];
    b.files = [
      f('Point à 4 mois.pdf', 'Livrable', 'agence', 'u_louis', at(-6, 17), 860000),
      f('Bilan à 30 jours.pdf', 'Livrable', 'agence', 'u_louis', '2026-07-15T16:00:00.000Z', 820000),
      f('Guide de réutilisation Webflow.pdf', 'Livrable', 'agence', 'u_louis', '2026-06-15T10:00:00.000Z', 2400000),
      f('Accès administrateur Webflow.pdf', 'Livrable', 'agence', 'u_louis', '2026-06-15T10:00:00.000Z', 120000),
      f('Facture F-2026-0112.pdf', 'Facture', 'agence', 'u_louis', '2026-06-15T10:00:00.000Z', 90000),
      f('Facture F-2025-0131.pdf', 'Facture', 'agence', 'u_louis', '2025-11-21T10:00:00.000Z', 88000),
      f('Devis D-2025-0098 signé.pdf', 'Devis', 'agence', 'u_louis', '2025-11-20T10:00:00.000Z', 98000),
      f('Textes des annonces.docx', 'Documents', 'client', 'u_hugo', '2025-12-10T11:00:00.000Z', 64000),
      f('Photos du cabinet (24 fichiers).zip', 'Images', 'client', 'u_hugo', '2025-12-04T09:00:00.000Z', 154000000),
      f('Logo Huchet-Demorge HD.svg', 'Images', 'client', 'u_hugo', '2025-11-27T10:00:00.000Z', 52000, { thumb: 'assets/hd/ecran-3.jpg' })
    ];
    b.activity = [{ at: at(-5, 9), by: 'u_hugo', text: 'a demandé une évolution : formulaires', seen: false }];

    /* Exemple 3 : Cabinet Varenne (fictif), tout début de projet, Julie découvre son espace. */
    const c = newProject({ client: 'Cabinet Varenne', projet: 'Refonte cabinet-varenne.fr', contactName: 'Julie', start: at(-1), registre: 'vous', amountHT: 7600, offer: 'site' });
    c.id = 'p_varenne'; c.phase = 1;
    c.phases[0].items[0].status = 'done'; c.phases[0].items[1].status = 'done';
    c.next = { title: 'Réserver la visio de cadrage', text: 'Une heure pour caler ensemble vos objectifs, vos cibles et le plan du site. Choisissez le créneau qui vous arrange.', go: 'cal' };
    c.tasks = [{ id: 'vt1', t: 'Réserver la visio de cadrage (1 h)', done: false, go: 'cal' }, { id: 'vt2', t: 'Régler l’acompte de 50 %', done: false, go: 'documents', auto: 'acompte' }];
    addSetup(c, at(-3, 15));
    c.missing = [{ id: 'vm1', t: 'Logo et charte actuelle', sub: 'Les fichiers que vous avez, même anciens.', at: at(-1) }, { id: 'vm2', t: 'Photos du cabinet et de l’équipe', sub: 'Si vous en avez déjà, sinon on en parle en visio.', at: at(-1) }];
    c.billing.quote = 'D-2026-0151'; c.billing.signedAt = at(-3, 15);
    c.invoices = [{ id: 'vinv1', num: 'F-2026-0199', label: 'Facture d’acompte (50 %)', ht: 3800, ttc: 4560, status: 'due', date: at(-1, 9) }, { id: 'vinv2', num: '', label: 'Facture de solde (50 %)', ht: 3800, ttc: 4560, status: 'future', date: null }];
    c.files = [f('Devis D-2026-0151 signé.pdf', 'Devis', 'agence', 'u_theo', at(-3, 15), 97000), f('Facture F-2026-0199.pdf', 'Facture', 'agence', 'u_theo', at(-1, 9), 88000), f('IBAN ICONOKOM.pdf', 'RIB', 'agence', 'u_theo', at(-1, 9), 61000)];
    c.messages = [{ id: 'vm-1', fromAgency: true, readByClient: false, by: 'team', at: at(-1, 10), text: 'Bienvenue Julie ! Petite vidéo de 2 minutes pour vous présenter votre espace et la suite du projet.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Bienvenue dans votre espace', duration: '2 min' } }];
    c.activity = [];

    /* Exemple 4 : Domaine des Vergers (fictif), avant signature : Inès découvre sa proposition et l'accepte en ligne. */
    const d = newProject({ client: 'Domaine des Vergers', projet: 'Identité du Domaine des Vergers', contactName: 'Inès', start: at(10), registre: 'vous', amountHT: 0, offer: 'da' });
    d.id = 'p_vergers'; d.phase = 1;
    d.proposals = [{ id: 'pr_vergers', status: 'sent', title: 'Direction artistique du Domaine des Vergers', quote: 'D-2026-0158', sentAt: at(-1, 17), validUntil: at(29),
      intro: 'Merci pour notre échange de mardi. Vous voulez une identité qui raconte le domaine familial et parle aux cavistes comme aux visiteurs. Voici ce que nous proposons.',
      lines: [{ t: 'Atelier de marque et plateforme de marque', ht: 1800 }, { t: 'Pistes créatives et direction artistique finale', ht: 2600 }, { t: 'Logo, charte graphique et fichiers sources', ht: 1400 }], depositPct: 50, example: true }];
    d.tasks = [{ id: 'dt1', t: 'Accepter la proposition', done: false, auto: 'proposal', go: 'proposition' }];
    d.next = { title: 'Découvrir votre proposition', text: 'Tout est détaillé : ce qu’on fait, dans quel ordre, et le budget. Vous pouvez l’accepter en ligne, ou nous poser vos questions.', go: 'proposition' };
    d.messages = [{ id: 'dm1', fromAgency: true, readByClient: false, by: 'u_theo', at: at(-1, 17), text: 'Bonjour Inès, votre proposition est en ligne. Je reste disponible pour en parler.' }];
    d.activity = [{ at: at(-1, 17), by: 'u_theo', text: 'a envoyé la proposition', seen: true }];
    d.team = { lead: 'u_theo', members: TEAM3 };
    // Huchet : devis d'un clic depuis la demande d'évolution (montant fictif)
    b.proposals = [{ id: 'pr_hd1', status: 'sent', title: 'Demande : l’annonce dans chaque e-mail de contact', quote: 'D-2026-0161', sentAt: at(-3, 10), validUntil: at(27), from: 'hr1',
      intro: 'Suite à ta demande : chaque e-mail de contact indiquera l’annonce concernée (intitulé et lien).', lines: [{ t: 'Champ caché « annonce » sur les formulaires et modèle d’e-mail', ht: 450 }], depositPct: 0, example: true }];
    b.requests[0].status = 'Proposé';
    const hugoNotice = { id: uid('n'), userId: 'u_hugo', projectId: 'p_huchet', client: 'Huchet-Demorge', type: 'validations', act: 'proposal.send', text: 'Louis t’a envoyé une proposition : Demande : l’annonce dans chaque e-mail de contact', by: 'u_louis', at: at(-3, 10), read: false, reg: 'tu', go: { view: 'proposition' } };
    a.versions = [{ id: 've1', label: 'V1', t: 'Plan du site', url: 'https://www.figma.com/proto/exemple-maison-lumen-plan', at: at(-2, 11) }];
    b.versions = [{ id: 'hv2', label: 'V2', t: 'Maquettes finales', url: b.links.proto, at: '2026-03-13T10:00:00.000Z' }, { id: 'hv1', label: 'V1', t: 'Maquettes desktop', url: b.links.proto, at: '2026-02-20T10:00:00.000Z' }];
    for (const [x, f] of [[a, 'lumen'], [b, 'huchet'], [c, 'varenne'], [d, 'vergers']]) x.brand.logo = 'assets/logos/' + f + '.svg';
    users.push(
      { id: 'u_ines', email: 'ines@domaine-des-vergers.fr', name: 'Inès', role: 'client', projectId: d.id },
      { id: 'u_claire', email: 'claire@maisonlumen.fr', name: 'Claire', role: 'client', projectId: a.id },
      { id: 'u_hugo', email: 'hugo@huchet-demorge.fr', name: 'Hugo', role: 'client', projectId: b.id, onboardedAt: '2025-11-24T10:00:00.000Z', prefs: { mail: true, weekly: true } },
      { id: 'u_julie', email: 'julie@cabinet-varenne.fr', name: 'Julie', role: 'client', projectId: c.id }
    );
    users.find((u) => u.id === 'u_louis').notify = { email: 'instant', events: { files: true, messages: true, validations: true, requests: true, activity: false } };
    users.find((u) => u.id === 'u_theo').notify = { email: 'digest', events: { files: true, messages: true, validations: true, requests: true, activity: false } };
    users.find((u) => u.id === 'u_clement').notify = { email: 'instant', events: { files: true, messages: true, validations: true, requests: false, activity: false } };
    a.team = { lead: 'u_louis', members: TEAM3 };
    b.team = { lead: 'u_louis', members: TEAM3 };
    c.team = { lead: 'u_theo', members: TEAM3 };
    const N = (userId, p, type, text, by, d, go) => ({ id: uid('n'), userId, projectId: p.id, client: p.client, type, act: { files: 'file.add', requests: 'request.add', activity: 'val.request' }[type], rid: type === 'requests' ? 'hr1' : undefined, done: type === 'requests', read: type === 'requests', text, by, at: d, go: { view: 'admin', tab: go } });
    const notifications = [
      N('u_louis', a, 'files', 'Claire a déposé « Texte À propos.docx »', 'u_claire', at(-3, 18), 'fichiers'),
      N('u_clement', a, 'files', 'Claire a déposé « Texte À propos.docx »', 'u_claire', at(-3, 18), 'fichiers'),
      N('u_louis', b, 'requests', 'Hugo demande une évolution (Formulaires) : « Indiquer l’annonce concernée dans chaque e-mail de contact »', 'u_hugo', at(-5, 9), 'demandes'),
      N('u_theo', b, 'requests', 'Hugo demande une évolution (Formulaires) : « Indiquer l’annonce concernée dans chaque e-mail de contact »', 'u_hugo', at(-5, 9), 'demandes'),
      N('u_clement', a, 'activity', 'Louis a demandé la validation du plan du site', 'u_louis', at(-2, 11), 'validations')
    ];
    notifications.push(hugoNotice);
    // Tâches internes d'exemple (prospection, administratif, suivi client), à côté des livrables des projets.
    const todos = [
      { id: 'td1', t: 'Préparer le bilan d’octobre de Huchet-Demorge', who: ['u_theo'], due: at(3, 10), status: 'doing', projectId: 'p_huchet', note: 'Reprendre les chiffres GA4 et Search Console, et les 3 axes du mois.', urgent: false, by: 'u_louis', at: at(-2, 9), doneAt: null },
      { id: 'td2', t: 'Relancer les prospects du salon', who: ['u_louis'], due: at(-1, 9), status: 'todo', projectId: null, note: '', urgent: true, by: 'u_louis', at: at(-5, 9), doneAt: null },
      { id: 'td3', t: 'Mettre à jour le book avec les derniers projets', who: ['u_clement', 'u_louis'], due: at(9, 9), status: 'todo', projectId: null, note: '', urgent: false, by: 'u_clement', at: at(-1, 15), doneAt: null },
      { id: 'td4', t: 'Envoyer les accès Search Console à Maison Lumen', who: ['u_theo'], due: null, status: 'todo', projectId: 'p_lumen', note: '', urgent: false, by: 'u_theo', at: at(-1, 11), doneAt: null },
      { id: 'td5', t: 'Facturer l’acompte du Cabinet Varenne', who: ['u_louis'], due: at(-3, 9), status: 'done', projectId: 'p_varenne', note: '', urgent: false, by: 'u_louis', at: at(-6, 9), doneAt: at(-3, 16), doneBy: 'u_louis' }
    ];
    return { users, projects: [a, b, c, d], notifications, outbox: [], todos };
  }

  /* ---------- Lecture ---------- */
  function canSee(user, project) { return user && (user.role === 'admin' || user.projectId === project.id); }

  /* ---------- États calculés (une seule source de vérité pour tous les écrans) ---------- */
  function itemState(project, item) {
    if (project.deliveredAt && !(project.phases[project.phases.length - 1].items.includes(item))) return 'done';
    if (item.val) {
      const v = project.validations.find((x) => x.key === item.val);
      if (v && v.status === 'approved') return 'done';
      if (v && (v.status === 'ready' || v.status === 'changes')) return 'review';
      if (item.status === 'done') return 'review';
    }
    return item.status;
  }
  const unsigned = (project) => !project.billing.signedAt && (project.proposals || []).some((x) => !x.from) && !(project.proposals || []).some((x) => !x.from && x.status === 'accepted');
  function phaseState(project, ph) {
    if (unsigned(project)) return 'wait';
    if (project.deliveredAt && ph.n < project.phases.length) return 'done';
    if (ph.n < project.phase) return 'done';
    if (ph.n === project.phase) return 'on';
    return 'wait';
  }

  function lateDays(project, ph) { if (phaseState(project, ph) !== 'on' || project.deliveredAt) return 0; const d = Math.floor((Date.now() - new Date(ph.to).getTime()) / DAY); return d > 0 ? d : 0; }
  function alerts(project) {
    const newFiles = project.files.filter((f) => f.from === 'client' && !f.seen).length;
    const changes = project.validations.filter((v) => v.status === 'changes').length;
    const unseen = project.activity.filter((a) => a.seen === false).length;
    const waiting = project.validations.filter((v) => v.status === 'ready').length;
    const newMessages = (project.messages || []).filter((m) => m.readByAgency === false).length;
    const requests = (project.requests || []).filter((r) => r.status === 'Nouveau').length;
    const due = (project.invoices || []).filter((i) => i.status === 'due').length, missing = (project.missing || []).length;
    const proposals = (project.proposals || []).filter((x) => x.status === 'sent').length;
    return { newFiles, changes, unseen, waiting, newMessages, requests, due, missing, proposals };
  }

  function nextStep(project) {
    const prop = (project.proposals || []).find((x) => x.status === 'sent');
    if (prop && (!project.next || project.next.go !== 'proposition')) return { title: prop.from ? 'Répondre au devis' : 'Découvrir la proposition', text: prop.title, go: 'proposition' };
    if (project.next && project.next.title) return project.next;
    const ready = project.validations.find((v) => v.status === 'ready');
    if (ready) return { title: 'Valider : ' + ready.t.toLowerCase(), text: '', go: 'valider' };
    const miss = project.missing[0];
    if (miss) return { title: 'Déposer : ' + miss.t.toLowerCase(), text: miss.sub || '', go: 'fichiers' };
    return { title: 'Rien à faire pour l’instant', text: '', go: 'projet' };
  }

  function summary(project, user) {
    if (user && user.role !== 'admin') return { id: project.id, client: project.client, projet: project.projet, phase: project.phase, offer: project.offer, golive: project.golive };
    return summaryFull(project);
  }
  function summaryFull(project) {
    const ph = project.phases[project.phase - 1] || {};
    return { id: project.id, client: project.client, projet: project.projet, phase: project.phase, offer: project.offer, offerLabel: (OFFERS[project.offer] || OFFERS.site).label,
      phaseName: (ph.letter ? ph.letter + ' · ' : '') + (ph.t || ''), delivered: !!project.deliveredAt, archived: !!project.archivedAt, draft: !!project.draft, golive: project.golive, next: nextStep(project), alerts: alerts(project),
      lastActivity: project.activity[0] || null, proposalsSent: (project.proposals || []).filter((x) => x.status === 'sent').map((x) => ({ title: x.title, sentAt: x.sentAt, validUntil: x.validUntil, ht: x.lines.reduce((t, l) => t + l.ht, 0) })), team: project.team || { lead: null, members: [] } };
  }

  /* Ce qu'un client reçoit : pas de notes internes, pas de drapeaux « vu ». */
  function forUser(project, user) {
    if (user.role === 'admin') return project;
    const p = JSON.parse(JSON.stringify(project));
    delete p.ext; delete p.source; delete p.draft;
    p.proposals = (p.proposals || []).filter((x) => x.status !== 'draft');
    (p.invoices || []).forEach((i) => { delete i.paidTx; delete i.remindedAt; });
    p.activity = p.activity.map(({ seen, ...a }) => a);
    p.files = p.files.map(({ seen, path, ...f }) => f);
    p.tasks = (p.tasks || []).filter((t) => !t.team);
    return p;
  }

  /* ---------- Écriture ---------- */
  const CLIENT_ACTIONS = new Set(['user.prefs', 'val.undo', 'file.remove', 'proposal.accept', 'proposal.decline', 'pin.add', 'val.approve', 'val.changes', 'task.toggle', 'user.onboarded', 'msg.post', 'msg.read', 'request.add', 'review.add', 'setup.webflow', 'setup.domain', 'evo.reschedule']);
  // « file.sign » n'est jamais appelée directement par un client : le serveur l'appelle (internal) avec l'empreinte et la preuve.

  /* ---------- Validation des données entrantes ----------
     Tout ce qui vient du navigateur est borné en taille, et les liens doivent être en https. */
  const SHORT = new Set(['owner', 'force', 'prid', 'quote', 'ga4', 'gsc', 'abby', 'type', 'kind', 'priority', 'title', 't', 'sub', 'label', 'num', 'name', 'client', 'projet', 'contactName', 'status', 'lead', 'iid', 'vid', 'tid', 'mid', 'fid', 'rid', 'aid', 'id', 'go', 'registre', 'quote', 'email', 'duration', 'cat', 'offer', 'level']);
  const URLS = new Set(['welcomeLoom', 'cgvUrl', 'old', 'payUrl', 'link', 'url', 'figma', 'proto', 'preview', 'site', 'img', 'review', 'video', 'booking', 'training', 'reviewUrl']);
  function safeUrl(v, key) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^https:\/\/[^\s<>"']+$/i.test(v)) return v.slice(0, 1000);
    if (key === 'img' && (/^\/api\/files\/[\w-]+(\?inline=1)?$/.test(v) || /^(blob:|assets\/)/.test(v))) return v;
    throw new Error('LINK');
  }
  function clean(v, key, depth = 0) {
    if (depth > 4) return undefined;
    if (v === null || v === undefined || typeof v === 'boolean') return v;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') return URLS.has(key) ? safeUrl(v, key) : v.slice(0, key === 'sig' ? 120000 : SHORT.has(key) ? 200 : 4000);
    if (Array.isArray(v)) return v.slice(0, 50).map((x) => clean(x, key, depth + 1));
    if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v).slice(0, 40)) { if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k === '__internal') continue; o[k] = clean(v[k], k, depth + 1); } return o; }
    return undefined;
  }
  // Dates entre 2000 et 2100, montants entre 0 et 10 millions : au-delà, c'est une erreur de saisie.
  const validDate = (d) => { if (d === undefined || d === null || d === '') return false; const t = new Date(d).getTime(); return !isNaN(t) && t >= 946684800000 && t < 4102444800000; };
  const amount = (x) => Math.min(1e7, Math.max(0, Number(x) || 0));

  function log(project, user, text) {
    project.activity.unshift({ at: iso(Date.now()), by: user.id, text, seen: user.role === 'admin' });
    if (project.activity.length > 200) project.activity.length = 200;
  }

  function applyInner(store, projectId, user, action, internal) {
    const project = store.projects.find((p) => p.id === projectId);
    if (!project || !canSee(user, project)) return { error: 'Projet introuvable, ou accès retiré. Se reconnecter ; si le problème continue, écrire à l’équipe.' };
    if (action.type === 'file.add' && !internal) return { error: 'Action impossible. Recharger la page puis réessayer.' };
    if (user.role !== 'admin' && !CLIENT_ACTIONS.has(action.type) && !(internal && ['file.add', 'files.batch', 'missing.done', 'file.sign'].includes(action.type))) return { error: 'Action réservée à l’agence.' };
    // Un espace archivé reste consultable, mais plus rien ne s'y écrit (sauf pour le désarchiver).
    if (project.archivedAt && action.type !== 'project.archive' && !['msg.read', 'seen'].includes(action.type)) return { error: 'Cet espace est archivé : il reste consultable, en lecture seule.' };
    const v = action.vid && project.validations.find((x) => x.id === action.vid);
    const now = iso(Date.now());
    switch (action.type) {
      case 'val.approve':
        if (!v || v.status !== 'ready') return { error: 'Cette validation a déjà reçu une réponse. Recharger la page pour voir où elle en est.' };
        v.status = 'approved'; v.history.push({ at: now, by: user.id, action: 'approved' });
        if (project.next.go === 'valider') project.next = { title: '', text: '', go: 'accueil' };
        log(project, user, 'a validé : ' + v.t.toLowerCase()); break;
      case 'val.undo': {
        // Annulation dans les 10 secondes qui suivent une validation, par la personne qui a validé.
        const last = v && v.history[v.history.length - 1];
        if (!v || v.status !== 'approved' || !last || last.action !== 'approved' || last.by !== user.id || Date.now() - new Date(last.at) > 15000) return { error: 'Le délai pour annuler est passé. Pour revenir sur cette validation, écrire à l’équipe dans Messages.' };
        v.status = 'ready'; v.history.pop();
        store.notifications = (store.notifications || []).filter((n) => !(n.act === 'val.approve' && n.projectId === project.id && n.vid === v.id && Date.now() - new Date(n.at) < 20000));
        project.activity = project.activity.filter((a) => !(a.by === user.id && a.text === 'a validé : ' + v.t.toLowerCase() && Date.now() - new Date(a.at) < 20000));
        return { ok: true, silent: true };
      }
      case 'user.prefs': {
        const u = store.users.find((x) => x.id === user.id); if (!u) return { error: 'Utilisateur introuvable.' };
        u.prefs = { ...(u.prefs || {}), mail: !!action.mail, weekly: !!action.weekly }; return { ok: true, silent: true };
      }
      case 'val.changes':
        if (!v || v.status !== 'ready') return { error: 'Cette validation a déjà reçu une réponse. Recharger la page pour voir où elle en est.' };
        if (!String(action.comment || '').trim()) return { error: 'Il manque la description des modifications souhaitées.' };
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
        if (action.go && !['accueil', 'cal', 'valider', 'fichiers', 'projet', 'documents', 'equipe', 'messages', 'maquettes', 'outils', 'proposition'].includes(action.go)) return { error: 'Destination invalide.' };
        project.next = { title: String(action.title || ''), text: String(action.text || ''), go: action.go || 'accueil' };
        log(project, user, 'a mis à jour la prochaine action'); break;
      case 'phase.set': {
        const n = Math.max(1, Math.min(project.phases.length, Number(action.n) || 1));
        project.phase = n; log(project, user, 'a passé le projet à l’étape ' + n + ' : ' + project.phases[n - 1].t); break;
      }
      case 'item.status': {
        const ph = project.phases.find((p) => p.items.some((i) => i.id === action.iid));
        const it = ph && ph.items.find((i) => i.id === action.iid);
        if (!it || !['wait', 'on', 'done'].includes(action.status)) return { error: 'Livrable introuvable.' };
        if (action.due && !validDate(action.due)) return { error: 'Date invalide.' };
        it.status = action.status; if (action.due) it.due = iso(action.due); break;
      }
      case 'note.set':
        project.note = { text: String(action.text || ''), by: user.id, at: now }; break;
      case 'meeting.set':
        if (action.when && !validDate(action.when)) return { error: 'Date invalide.' };
        project.meeting = { title: String(action.title || ''), when: action.when ? iso(action.when) : null }; break;
      case 'task.add':
        if (!String(action.t || '').trim()) return { error: 'Écrivez l’action.' };
        project.tasks.push({ id: uid('t'), t: String(action.t), done: false }); break;
      case 'task.toggle': {
        const t = project.tasks.find((x) => x.id === action.tid); if (!t) return { error: 'Action introuvable.' };
        if (t.auto && user.role !== 'admin') return { error: 'Rien à faire : cette action se coche toute seule dès que l’équipe a l’information.' };
        t.done = !t.done; if (t.done) log(project, user, 'a coché : ' + t.t.toLowerCase()); break;
      }
      case 'item.meta': {
        const it = project.phases.flatMap((x) => x.items).find((x) => x.id === action.iid); if (!it) return { error: 'Livrable introuvable.' };
        if (action.link !== undefined) { const l = String(action.link || '').trim(); it.link = /^https:\/\//.test(l) ? safeUrl(l, 'link') : ['', 'proposition', 'documents', 'cal', 'valider', 'maquettes', 'demarrer', 'projet', 'fichiers'].includes(l) ? l : (() => { throw new Error('LINK'); })(); }
        if (Array.isArray(action.who)) {
          const ok = new Set([...store.users.filter((u) => u.role === 'admin').map((u) => u.id), 'client']);
          it.who = action.who.filter((w) => Array.isArray(w) && ok.has(w[0])).slice(0, 6).map(([w, t]) => [w, String(t || '').trim().slice(0, 120)]);
        }
        break;
      }
      case 'file.signreq': {
        // L'agence demande la signature d'un document (devis, contrat, offre d'Évolution) : il apparaît dans « À valider ».
        const f = project.files.find((x) => x.id === action.fid); if (!f) return { error: 'Fichier introuvable.' };
        if (f.from !== 'agence') return { error: 'Seuls les documents de l’agence se signent ici.' };
        if (f.sign && f.sign.status === 'signed') return { error: 'Ce document est déjà signé.' };
        if (action.cancel) { delete f.sign; break; }
        f.sign = { status: 'requested', at: now, by: user.id, label: String(action.label || '').slice(0, 160) };
        log(project, user, 'a demandé la signature de « ' + f.name + ' »'); return { ok: true, file: f.name };
      }
      case 'file.sign': {
        // Signature électronique simple : consentement explicite, identité (connexion par code), horodatage et empreinte du fichier,
        // ajoutés par le serveur (adresse IP, navigateur). Passe toujours par le serveur, jamais directement.
        if (!internal) return { error: 'La signature passe par le bouton « Signer ».' };
        const f = project.files.find((x) => x.id === action.fid); if (!f || !f.sign || f.sign.status !== 'requested') return { error: 'Ce document n’attend pas de signature.' };
        const sign = String(action.name || '').trim(); if (sign.length < 2) return { error: 'Prénom et nom à saisir pour signer.' };
        if (!action.agree) return { error: 'Pour signer, la case de consentement doit être cochée.' };
        const sig = typeof action.sig === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(action.sig) && action.sig.length < 120000 ? action.sig : '';
        Object.assign(f.sign, { status: 'signed', name: sign.slice(0, 120), sig, signedAt: now, signedBy: user.id, email: user.email, hash: String(action.hash || '').slice(0, 64), ip: String(action.ip || '').slice(0, 60), ua: String(action.ua || '').slice(0, 300) });
        log(project, user, 'a signé « ' + f.name + ' »'); return { ok: true, file: f.name };
      }
      case 'evo.reschedule': {
        // Le client demande un autre créneau pour la visio de pilotage : l'équipe est prévenue et répond.
        const e = project.evo; if (!e || !e.active) return { error: 'Pas de visio de pilotage prévue.' };
        const text = String(action.text || '').trim(); if (text.length < 3) return { error: 'Il manque les créneaux souhaités (jours et heures).' };
        e.reschedule = (e.reschedule || []).filter((r) => r.status !== 'open').concat([{ id: uid('rs'), at: now, by: user.id, text: text.slice(0, 600), status: 'open' }]).slice(-20);
        log(project, user, 'a demandé un autre créneau pour la visio de pilotage'); break;
      }
      case 'evo.set': {
        project.evo = project.evo || { active: false, axes: [], reports: [], next: [], reschedule: [] };
        const e = project.evo;
        if (action.active !== undefined) { e.active = !!action.active; if (e.active && !e.since) e.since = now; }
        if (action.meeting !== undefined) { const w = action.meeting && action.meeting.when; if (w && !validDate(w)) return { error: 'Date invalide.' }; e.meeting = { when: w ? iso(w) : null, mode: String((action.meeting && action.meeting.mode) || 'Visio de pilotage').slice(0, 80) }; (e.reschedule || []).forEach((r) => { if (r.status === 'open') r.status = 'done'; }); }
        if (Array.isArray(action.next)) e.next = action.next.filter((x) => Array.isArray(x) && x[0]).slice(0, 6).map(([m, t]) => [String(m).slice(0, 30), String(t || '').slice(0, 200)]);
        if (Array.isArray(action.axes)) {
          const okWho = new Set([...store.users.filter((u) => u.role === 'admin').map((u) => u.id), 'client', 'both']);
          for (const a of action.axes.slice(0, 20)) { if (a.due && !validDate(a.due)) return { error: 'Date d’échéance invalide.' }; }
          e.axes = action.axes.filter((a) => a && String(a.t || '').trim()).slice(0, 20).map((a, i) => ({ id: a.id || uid('ax'), t: String(a.t).slice(0, 160), effect: String(a.effect || '').slice(0, 300), who: okWho.has(a.who) ? a.who : 'both', due: a.due ? iso(a.due) : null, status: ['todo', 'on', 'done'].includes(a.status) ? a.status : 'todo', priority: !!a.priority }));
        }
        log(project, user, 'a mis à jour l’espace Évolution'); break;
      }
      case 'evo.report': {
        project.evo = project.evo || { active: true, axes: [], reports: [], next: [], reschedule: [] };
        if (!/^\d{4}-\d{2}$/.test(String(action.month || ''))) return { error: 'Choisissez le mois du bilan.' };
        const title = String(action.title || '').trim(); if (!title) return { error: 'Donnez un titre au bilan.' };
        const lines = (a, n) => (Array.isArray(a) ? a : []).filter((x) => Array.isArray(x) && x[0]).slice(0, 8).map((x) => x.slice(0, n).map((y) => String(y || '').slice(0, 200)));
        const rp = { id: uid('rp'), month: action.month, title: title.slice(0, 160), summary: String(action.summary || '').slice(0, 1200), stats: lines(action.stats, 3), done: lines(action.done, 2), fileId: String(action.fileId || '').slice(0, 60) || undefined, at: now };
        project.evo.reports = [rp, ...(project.evo.reports || []).filter((r) => r.month !== rp.month)].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 36);
        log(project, user, 'a publié le bilan du mois ' + rp.month); return { ok: true, report: rp.id };
      }
      case 'task.remove': project.tasks = project.tasks.filter((x) => x.id !== action.tid); break;
      case 'setup.webflow': {
        const t = project.tasks.find((x) => x.auto === 'webflow'); if (!t) return { error: 'Étape introuvable.' };
        const ws = String(action.ws || '').trim(); if (ws.length < 2) return { error: 'Il manque le nom de l’espace de travail Webflow.' };
        Object.assign(t, { sent: now, info: { ws: ws.slice(0, 120) } }); log(project, user, 'a créé l’espace Webflow « ' + ws.slice(0, 120) + ' »'); break;
      }
      case 'setup.domain': {
        const t = project.tasks.find((x) => x.auto === 'domaine'); if (!t) return { error: 'Étape introuvable.' };
        const domain = String(action.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!/^[a-z0-9àâäéèêëîïôöùûüç-]+(\.[a-z0-9àâäéèêëîïôöùûüç-]+)+$/.test(domain)) return { error: 'Nom de domaine incomplet : il doit ressembler à entreprise.fr.' };
        const mode = ['delegate', 'vault', 'unknown'].includes(action.mode) ? action.mode : 'unknown';
        if (mode === 'vault' && !internal) return { error: 'Les identifiants passent par le coffre chiffré.' };
        Object.assign(t, { sent: now, info: { domain: domain.slice(0, 120), registrar: String(action.registrar || '').slice(0, 60), mode } });
        log(project, user, mode === 'vault' ? 'a déposé les accès du nom de domaine dans le coffre chiffré' : mode === 'delegate' ? 'a donné un accès délégué au nom de domaine' : 'a indiqué le nom de domaine ' + domain); break;
      }
      case 'vault.read': log(project, user, 'a ouvert les accès du nom de domaine (coffre chiffré)'); break;
      case 'setup.check': {
        const t = project.tasks.find((x) => x.id === action.tid && ['webflow', 'domaine'].includes(x.auto)); if (!t) return { error: 'Étape introuvable.' };
        if (action.ok) { t.done = true; t.checkedAt = now; t.checkedBy = user.id; log(project, user, 'a vérifié : ' + t.t.toLowerCase()); }
        else { t.done = false; t.sent = null; t.retry = String(action.why || '').slice(0, 300); log(project, user, 'a demandé de reprendre : ' + t.t.toLowerCase()); }
        return { ok: true, purgeVault: t.auto === 'domaine' && !!action.ok };
      }
      case 'missing.add':
        if (!String(action.t || '').trim()) return { error: 'Écrivez ce qu’il manque.' };
        project.missing.push({ id: uid('m'), t: String(action.t), sub: String(action.sub || ''), at: now }); break;
      case 'missing.done': case 'missing.remove':
        project.missing = project.missing.filter((m) => m.id !== action.mid); break;
      case 'file.add': {
        const fl = action.file; if (!fl || !fl.name) return { error: 'Aucun fichier reçu : relancer l’envoi.' };
        if (fl.id && !/^f_[a-f0-9]{8,64}$/.test(fl.id)) return { error: 'Fichier invalide.' };
        if (fl.path && !(String(fl.path).replace(/\\/g, '/').startsWith('uploads/' + project.id + '/') && !String(fl.path).includes('..'))) return { error: 'Fichier invalide.' };
        const cats = user.role === 'admin' ? FILE_CATS.concat(AGENCY_CATS) : FILE_CATS;
        if (project.files.some((f) => f.id === fl.id)) return { error: 'Fichier déjà enregistré.' };
        const rec = { id: fl.id || uid('f'), name: String(fl.name).slice(0, 200), cat: cats.includes(fl.cat) ? fl.cat : (user.role === 'admin' ? 'Livrable' : 'Autres'),
          from: user.role === 'admin' ? 'agence' : 'client', by: user.id, at: now, size: Number(fl.size) || 0, seen: user.role === 'admin', path: fl.path || undefined };
        // Dépôt d'un dossier : on garde le chemin des sous-dossiers (« Photos/Atelier »).
        const folder = String(fl.folder || '').replace(/\\/g, '/').split('/').map((x) => x.trim()).filter((x) => x && x !== '.' && x !== '..').join('/').slice(0, 300);
        if (folder) rec.folder = folder;
        project.files.unshift(rec);
        // Un dossier entier : un seul mot dans l'activité et une seule notification, envoyés à la fin (« files.batch »).
        if (fl.quiet && internal) return { ok: true, file: rec, silent: true };
        log(project, user, 'a déposé « ' + rec.name + ' »'); return { ok: true, file: rec };
      }
      case 'file.remove': {
        const fl = project.files.find((f) => f.id === action.fid); if (!fl) return { error: 'Fichier introuvable.' };
        // Le client peut retirer ce qu'il a déposé lui-même pendant 24 heures ; ensuite, il demande à l'équipe.
        if (user.role !== 'admin' && (fl.by !== user.id || Date.now() - new Date(fl.at) > DAY)) return { error: 'Ce fichier ne peut plus être retiré (délai de 24 h passé). Pour le supprimer, écrire à l’équipe dans Messages.' };
        project.files = project.files.filter((f) => f !== fl);
        if (user.role !== 'admin') { store.notifications = (store.notifications || []).filter((n) => !(n.act === 'file.add' && n.projectId === project.id && n.fid === fl.id)); log(project, user, 'a retiré « ' + fl.name + ' »'); }
        break;
      }
      case 'seen':
        project.files.forEach((f) => (f.seen = true)); project.activity.forEach((a) => (a.seen = true)); break;
      case 'invoice.add':
        if (!['future', 'due', 'paid'].includes(action.status || 'due')) return { error: 'Statut invalide.' };
        project.invoices.push({ id: uid('inv'), num: String(action.num || ''), label: String(action.label || 'Facture'), ht: amount(action.ht),
          ttc: action.ttc ? amount(action.ttc) : Math.round(amount(action.ht) * 120) / 100, status: action.status || 'due', date: now }); break;
      case 'invoice.status': {
        const inv = project.invoices.find((i) => i.id === action.iid); if (!inv) return { error: 'Facture introuvable.' };
        if (!['future', 'due', 'paid'].includes(action.status)) return { error: 'Statut invalide.' };
        inv.status = action.status; if (action.status === 'paid') inv.paidAt = now;
        // l'acompte réglé coche tout seul l'action correspondante côté client
        if (/acompte/i.test(inv.label)) project.tasks.forEach((t) => { if (t.auto === 'acompte') t.done = action.status === 'paid'; });
        if (action.status === 'paid') log(project, user, 'a enregistré le paiement : ' + inv.label.toLowerCase());
        break;
      }
      case 'project.update': {
        if (action.golive !== undefined && !validDate(action.golive)) return { error: 'Date de mise en ligne invalide.' };
        if (action.registre !== undefined && !['tu', 'vous'].includes(action.registre)) return { error: 'Registre invalide.' };
        const allowed = ['client', 'projet', 'contactName', 'registre', 'golive'];
        for (const k of allowed) if (action[k] !== undefined) project[k] = k === 'golive' ? iso(action[k]) : String(action[k]);
        if (action.totalHT !== undefined) { project.billing.totalHT = amount(action.totalHT); project.billing.totalTTC = Math.round(project.billing.totalHT * 120) / 100; }
        if (action.quote !== undefined) project.billing.quote = String(action.quote); break;
      }
      case 'user.add': {
        const email = String(action.email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Adresse e-mail invalide.' };
        if (store.users.some((u) => u.email === email)) return { error: 'Cette adresse a déjà un accès.' };
        const nu = { id: uid('u'), email, name: String(action.name || email.split('@')[0]).slice(0, 80), role: 'client', projectId: project.id, invitedAt: project.draft ? undefined : now };
        store.users.push(nu);
        log(project, user, 'a donné l’accès à ' + email); return { ok: true, invite: project.draft ? undefined : nu.id };
      }
      case 'user.invite': {
        const u = store.users.find((x) => x.id === action.id && x.projectId === project.id); if (!u) return { error: 'Accès introuvable.' };
        if (project.draft) return { error: 'Ouvrez d’abord l’espace (offre et registre).' };
        u.invitedAt = now; log(project, user, 'a renvoyé l’invitation à ' + u.email); return { ok: true, invite: u.id };
      }
      case 'user.onboarded': {
        const u = store.users.find((x) => x.id === user.id); if (!u) return { error: 'Utilisateur introuvable.' };
        u.onboardedAt = now; if (action.prefs) u.prefs = { mail: !!action.prefs.mail, weekly: !!action.prefs.weekly };
        // présentation saisie au dernier écran de la visite guidée : nom obligatoire, le reste facultatif
        if (String(action.name || '').trim()) u.name = String(action.name).trim().slice(0, 80);
        if (action.title !== undefined) u.title = String(action.title || '').trim().slice(0, 80);
        if (action.phone !== undefined) u.phone = String(action.phone || '').replace(/[^\d+ .()-]/g, '').trim().slice(0, 30);
        log(project, user, 'a découvert son espace'); break;
      }
      case 'msg.post': {
        const text = String(action.text || '').trim();
        if (!text) return { error: 'Message vide : rien n’a été envoyé.' };
        const loom = action.loom && action.loom.url ? { url: String(action.loom.url), title: String(action.loom.title || 'Vidéo'), duration: String(action.loom.duration || '') } : undefined;
        project.messages.unshift({ id: uid('m'), by: user.role === 'admin' && action.asTeam ? 'team' : user.id, at: now, text: text.slice(0, 4000), loom, fromAgency: user.role === 'admin', readByAgency: user.role === 'admin', readByClient: user.role !== 'admin' });
        log(project, user, loom ? 'a envoyé une vidéo' : 'a envoyé un message'); break;
      }
      case 'msg.read':
        project.messages.forEach((m) => { if (user.role === 'admin') { if (m.readByAgency === false) m.readByAgency = true; } else if (m.readByClient === false) m.readByClient = true; }); break;
      case 'request.add': {
        const text = String(action.text || '').trim();
        if (!text) return { error: 'Demande vide : il manque la description.' };
        project.requests.unshift({ id: uid('r'), by: user.id, at: now, type: String(action.kind || 'Autre'), priority: String(action.priority || 'Normal'), text: text.slice(0, 4000), status: user.role === 'admin' ? 'Proposé' : 'Nouveau' });
        log(project, user, 'a fait une demande : ' + String(action.kind || 'autre').toLowerCase()); break;
      }
      case 'request.owner': {
        const r = project.requests.find((x) => x.id === action.rid); if (!r) return { error: 'Demande introuvable.' };
        const ad = store.users.find((u) => u.id === action.owner && u.role === 'admin'); r.owner = ad ? ad.id : undefined; break;
      }
      case 'request.status': {
        const r = project.requests.find((x) => x.id === action.rid); if (!r) return { error: 'Demande introuvable.' };
        if (!['Nouveau', 'Proposé', 'En cours', 'Fait'].includes(action.status)) return { error: 'Statut invalide.' };
        r.status = action.status; break;
      }
      case 'links.set':
        for (const k of ['figma', 'proto', 'preview', 'site', 'old']) if (action[k] !== undefined) project.links[k] = String(action[k]).trim();
        log(project, user, 'a mis à jour les liens du projet'); break;
      case 'user.remove': {
        const u = store.users.find((x) => x.id === action.id && x.projectId === project.id);
        if (!u) return { error: 'Accès introuvable.' };
        store.users = store.users.filter((x) => x !== u); break;
      }
      case 'team.set': {
        const admins = new Set(store.users.filter((u) => u.role === 'admin').map((u) => u.id));
        const members = (Array.isArray(action.members) ? action.members : []).filter((id) => admins.has(id));
        const lead = admins.has(action.lead) ? action.lead : members[0] || null;
        if (lead && !members.includes(lead)) members.unshift(lead);
        project.team = { lead, members }; break;
      }
      case 'asset.add': {
        const title = String(action.title || '').trim(); if (!title) return { error: 'Donnez un titre.' };
        if (!action.url && !action.img) return { error: 'Ajoutez une image ou un lien.' };
        project.assets.unshift({ id: uid('a'), kind: String(action.kind || 'Visuels'), title: title.slice(0, 200), url: String(action.url || ''), img: String(action.img || ''), by: user.id, at: now });
        log(project, user, 'a ajouté à la bibliothèque : ' + title); break;
      }
      case 'asset.remove': project.assets = project.assets.filter((a) => a.id !== action.aid); break;
      case 'project.deliver': {
        // Mise en ligne : les trois premiers temps sont terminés, on entre dans « Mesurer ».
        if (action.undo) { project.deliveredAt = null; project.phase = Math.min(project.phase, project.phases.length - 1); log(project, user, 'a annulé la mise en ligne'); break; }
        const pv = project.validations.find((x) => x.key === 'pv');
        if (pv && pv.status !== 'approved' && !String(action.force || '').trim()) return { error: 'La mise en ligne (procès-verbal de réception) n’est pas encore validée par le client. Demandez-la, ou indiquez pourquoi livrer sans.' };
        const when = action.when && validDate(action.when) ? iso(action.when) : now;
        if (pv && pv.status !== 'approved') project.deliveredWithoutPv = { at: now, by: user.id, reason: String(action.force).slice(0, 300) };
        project.deliveredAt = when; project.golive = when; project.phase = project.phases.length;
        project.phases.slice(0, -1).forEach((ph) => ph.items.forEach((i) => { i.status = 'done'; }));
        if (project.links.preview && !project.links.site) project.links.site = project.links.preview;
        project.next = { title: '', text: '', go: 'accueil' };
        log(project, user, 'a mis le site en ligne'); break;
      }
      case 'project.results': {
        const stats = (Array.isArray(action.stats) ? action.stats : []).filter((x) => Array.isArray(x) && x[0] && x[1]).slice(0, 6).map(([v, l]) => [String(v).slice(0, 20), String(l).slice(0, 80)]);
        project.results = stats.length ? { period: String(action.period || '').slice(0, 120), stats } : null; break;
      }
      case 'project.brand': {
        const hex = /^#[0-9a-f]{6}$/i;
        const colors = (Array.isArray(action.colors) ? action.colors : []).filter((c) => Array.isArray(c) && hex.test(c[1])).slice(0, 12).map(([n, h]) => [String(n || '').slice(0, 40), h]);
        const fonts = (Array.isArray(action.fonts) ? action.fonts : []).filter((f) => Array.isArray(f) && f[1]).slice(0, 6).map(([r, n]) => [String(r || '').slice(0, 40), String(n).slice(0, 80)]);
        project.brand = { ...(project.brand || {}), colors, fonts }; break;
      }
      case 'project.logo': {
        // Logo du client, affiché dans son espace en blanc ou en noir selon le fond (« mono »), ou tel quel (« color »).
        project.brand = project.brand || { colors: [], fonts: [] };
        if (!action.img) { delete project.brand.logo; break; }
        project.brand.logo = safeUrl(action.img, 'img'); project.brand.logoTone = action.tone === 'color' ? 'color' : 'mono'; break;
      }
      case 'project.tools': {
        const known = ['teaser', 'brand', 'signature', 'request', 'webflow'];
        project.tools = (Array.isArray(action.tools) ? action.tools : []).filter((t) => known.includes(t)); break;
      }
      case 'handover.toggle': {
        const h = (project.handover || [])[Number(action.n)]; if (!h) return { error: 'Élément introuvable.' };
        h.done = !h.done; break;
      }
      case 'review.add': {
        const score = Number(action.score);
        if (!(score >= 1 && score <= 5)) return { error: 'Note manquante : choisir de 1 à 5 étoiles.' };
        // 4 ou 5 : l'avis part aussi sur Google. 3 ou moins : un questionnaire de bilan, jamais publié.
        let survey;
        if (score <= 3) {
          const q = action.survey || {}, txt = (k, n = 2000) => String(q[k] || '').trim().slice(0, n);
          if (!txt('bad')) return { error: 'Il manque ce qui n’a pas fonctionné : quelques mots suffisent.' };
          const axes = {}; for (const k of REVIEW_AXES.map((a) => a[0])) { const v = Number(q.axes && q.axes[k]); if (v >= 1 && v <= 5) axes[k] = v; }
          survey = { good: txt('good'), bad: txt('bad'), phase: txt('phase', 60), recommend: txt('recommend'), axes, call: !!q.call };
        }
        project.review = { score, text: String(action.text || '').slice(0, 2000), public: score >= 4 && !!action.public, google: score >= 4 && !!action.google, survey, by: user.id, at: now, seen: false };
        if (survey && survey.call && !project.tasks.some((t) => t.auto === 'review-call')) project.tasks.push({ id: uid('t'), t: 'Appeler ' + (project.contactName || 'le client') + ' pour faire le point sur le projet', done: false, auto: 'review-call', team: true });
        log(project, user, 'a laissé un avis (' + score + '/5)'); break;
      }
      case 'prelaunch.toggle': {
        const h = (project.prelaunch || [])[Number(action.n)]; if (!h) return { error: 'Élément introuvable.' };
        h.done = !h.done; break;
      }
      case 'cycle.next': {
        // Évolution : chaque mois, un nouveau cycle O.R.E.M. ; le précédent est gardé.
        if (project.offer !== 'evolution') return { error: 'Réservé à l’offre Évolution.' };
        const T = newProject({ client: project.client, start: now, registre: project.registre, offer: 'evolution' });
        project.cycles = (project.cycles || []).concat([{ n: project.cycle || 1, from: project.start, phases: project.phases, validations: project.validations }]).slice(-24);
        Object.assign(project, { cycle: (project.cycle || 1) + 1, start: now, phases: T.phases, validations: T.validations, phase: 1, golive: T.golive });
        project.next = { title: 'Visio de pilotage du mois', text: '', go: 'cal' };
        log(project, user, 'a démarré le mois ' + project.cycle + ' d’Évolution'); break;
      }
      case 'review.seen': if (project.review) project.review.seen = true; break;
      case 'project.tutorials': {
        project.tutorials = (Array.isArray(action.tutorials) ? action.tutorials : []).filter((x) => x && x.t).slice(0, 12).map((x) => ({ t: String(x.t).slice(0, 120), d: String(x.d || '').slice(0, 20), url: x.url ? safeUrl(x.url, 'url') : '' })); break;
      }
      case 'project.confirm': {
        // Espace préparé depuis Pipedrive : l'équipe choisit l'offre et le registre, puis l'accès du client est créé.
        if (!project.draft) return { error: 'Cet espace est déjà ouvert.' };
        if (!['tu', 'vous'].includes(action.registre)) return { error: 'Choisissez le tutoiement ou le vouvoiement.' };
        const offer = OFFERS[action.offer] ? action.offer : 'site';
        const email = String(action.email || project.draft.email || '').trim().toLowerCase();
        if (email && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || store.users.some((u) => u.email === email))) return { error: 'Adresse e-mail invalide ou déjà utilisée.' };
        const T = newProject({ client: project.client, projet: project.projet, contactName: project.contactName, start: project.start, registre: action.registre, amountHT: project.billing.totalHT, offer });
        for (const k of ['offer', 'registre', 'golive', 'phases', 'validations', 'tools', 'tutorials', 'handover']) project[k] = T[k];
        if (!project.projet || project.projet === project.client) project.projet = T.projet;
        project.phase = 1; delete project.draft;
        let invite;
        if (email) { const nu = { id: uid('u'), email, name: String(action.name || project.contactName || email.split('@')[0]).slice(0, 80), role: 'client', projectId: project.id, invitedAt: now }; store.users.push(nu); invite = nu.id; }
        project.missing = (DEFAULT_MISSING[offer] || []).map(([t, sub]) => ({ id: uid('m'), t, sub, at: now }));
        for (const k of ['prelaunch', 'cycle']) project[k] = T[k];
        log(project, user, 'a ouvert l’espace (' + OFFERS[offer].label + ', ' + (action.registre === 'tu' ? 'tutoiement' : 'vouvoiement') + ')'); return { ok: true, invite };
      }
      case 'project.ext': {
        project.ext = project.ext || {};
        for (const k of ['abby', 'drive', 'ga4', 'gsc']) if (action[k] !== undefined) project.ext[k] = String(action[k] || '').trim().slice(0, 300);
        if (action.figma !== undefined) { project.ext.figma = action.figma ? safeUrl(action.figma, 'figma') : ''; delete project.ext.figmaVersion; }
        break;
      }
      case 'invoice.pay': {
        const inv = project.invoices.find((i) => i.id === action.iid); if (!inv) return { error: 'Facture introuvable.' };
        inv.payUrl = action.payUrl ? safeUrl(action.payUrl, 'url') : ''; break;
      }
      case 'client.remind': {
        // Relance manuelle : le client reçoit un rappel (e-mail selon ses préférences), l'activité garde la trace.
        const vv = project.validations.find((x) => x.status === 'ready');
        const what = vv ? vv.t.toLowerCase() : project.missing[0] ? project.missing[0].t.toLowerCase() : '';
        if (!what) return { error: 'Rien n’attend le client pour l’instant.' };
        if (project.activity.some((x) => x.by === user.id && /^a relancé le client/.test(x.text) && Date.now() - new Date(x.at) < DAY)) return { error: 'Client déjà relancé aujourd’hui.' };
        log(project, user, 'a relancé le client : ' + what); return { ok: true, remind: what };
      }
      case 'proposal.save': {
        // Proposition (avant signature) ou devis d'évolution (depuis une demande du client).
        const lines = (Array.isArray(action.lines) ? action.lines : []).filter((l) => l && String(l.t || '').trim()).slice(0, 20).map((l) => ({ t: String(l.t).slice(0, 160), ht: amount(l.ht) }));
        if (!String(action.title || '').trim()) return { error: 'Donnez un titre à la proposition.' };
        if (!lines.length) return { error: 'Ajoutez au moins une ligne.' };
        if (action.validUntil && !validDate(action.validUntil)) return { error: 'Date de validité invalide.' };
        project.proposals = project.proposals || [];
        let pr = action.prid && project.proposals.find((x) => x.id === action.prid);
        if (pr && pr.status === 'accepted') return { error: 'Cette proposition est déjà acceptée.' };
        if (!pr) { pr = { id: uid('pr'), status: 'draft', from: action.rid || undefined }; project.proposals.unshift(pr); }
        Object.assign(pr, { kind: action.kind === 'evolution' ? 'evolution' : pr.kind, title: String(action.title).slice(0, 160), intro: String(action.intro || '').slice(0, 2000), lines, quote: String(action.quote || pr.quote || ''), validUntil: action.validUntil ? iso(action.validUntil) : addDays(Date.now(), 30), depositPct: Math.min(100, Math.max(0, Number(action.depositPct ?? 50))) });
        return { ok: true, prid: pr.id };
      }
      case 'proposal.send': {
        const pr = (project.proposals || []).find((x) => x.id === action.prid); if (!pr) return { error: 'Proposition introuvable.' };
        if (pr.status === 'accepted') return { error: 'Cette proposition est déjà acceptée.' };
        pr.status = 'sent'; pr.sentAt = now; delete pr.declined;
        if (pr.from) { const rq = project.requests.find((r) => r.id === pr.from); if (rq) rq.status = 'Proposé'; (store.notifications || []).forEach((n) => { if (n.projectId === project.id && n.act === 'request.add' && n.rid === pr.from) { n.done = true; n.read = true; } }); }
        log(project, user, 'a envoyé la proposition : ' + pr.title); break;
      }
      case 'proposal.accept': {
        const pr = (project.proposals || []).find((x) => x.id === action.prid);
        if (!pr || pr.status !== 'sent') return { error: 'Cette proposition a déjà reçu une réponse. Recharger la page pour la voir.' };
        if (pr.validUntil && new Date(pr.validUntil) < new Date()) return { error: 'Cette proposition a expiré. Un message à l’équipe suffit pour recevoir une version à jour.' };
        if (!action.agree) return { error: 'Pour accepter, la case de consentement doit être cochée.' };
        const sign = String(action.name || '').trim(); if (sign.length < 2) return { error: 'Prénom et nom à saisir pour signer.' };
        const ht = pr.lines.reduce((t, l) => t + l.ht, 0);
        const sigImg = typeof action.sig === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(action.sig) && action.sig.length < 120000 ? action.sig : '';
        Object.assign(pr, { status: 'accepted', acceptedAt: now, acceptedBy: user.id, signName: sign.slice(0, 120), sig: sigImg, proof: internal && action.proof ? { ip: String(action.proof.ip || '').slice(0, 60), ua: String(action.proof.ua || '').slice(0, 300), email: user.email } : { email: user.email } });
        if (pr.depositPct > 0) { const dep = Math.round(ht * pr.depositPct) / 100; project.invoices.push({ id: uid('inv'), num: '', label: `Facture d’acompte (${pr.depositPct} %)${pr.from ? ' : ' + pr.title.toLowerCase() : ''}`, ht: dep, ttc: Math.round(dep * 120) / 100, status: 'due', date: now }); }
        if (pr.from) { const rq = project.requests.find((r) => r.id === pr.from); if (rq) rq.status = 'En cours'; }
        else {
          project.billing.totalHT = ht; project.billing.totalTTC = Math.round(ht * 120) / 100; project.billing.quote = pr.quote || project.billing.quote; project.billing.signedAt = now;
          // La signature lance le projet : devis coché, acompte et visio de démarrage dans « À faire ».
          project.phases[0].items.forEach((i) => { if (/proposition|devis/i.test(i.t)) i.status = 'done'; });
          if (pr.depositPct > 0 && !project.tasks.some((t) => t.auto === 'acompte')) project.tasks.push({ id: uid('t'), t: `Régler l’acompte de ${pr.depositPct} %`, done: false, auto: 'acompte', go: 'documents' });
          addSetup(project, now);
          const kick = project.phases[0].items.find((i) => /visio|atelier|entretiens/i.test(i.t));
          if (kick && !project.tasks.some((t) => t.go === 'cal')) project.tasks.push({ id: uid('t'), t: 'Réserver : ' + kick.t.charAt(0).toLowerCase() + kick.t.slice(1), done: false, go: 'cal' });
          if (!project.missing.length) project.missing = (DEFAULT_MISSING[project.offer] || []).map(([t, sub]) => ({ id: uid('m'), t, sub, at: now }));
          project.next = kick ? { title: 'Réserver : ' + kick.t.charAt(0).toLowerCase() + kick.t.slice(1), text: (project.registre === 'tu' ? 'Merci pour ta confiance ! On démarre par ce rendez-vous. Choisis le créneau qui t’arrange.' : 'Merci pour votre confiance ! On démarre par ce rendez-vous. Choisissez le créneau qui vous arrange.'), go: 'cal' } : { title: '', text: '', go: 'accueil' };
        }
        if (pr.kind === 'evolution') { project.evo = project.evo || { axes: [], reports: [], next: [], reschedule: [] }; project.evo.active = true; project.evo.since = now; }
        project.tasks.forEach((t) => { if (t.auto === 'proposal') t.done = true; });
        if (project.next.go === 'proposition') project.next = { title: '', text: '', go: 'accueil' };
        log(project, user, 'a accepté la proposition : ' + pr.title); return { ok: true, proposal: pr.title, accepted: pr.id };
      }
      case 'proposal.decline': {
        const pr = (project.proposals || []).find((x) => x.id === action.prid);
        if (!pr || pr.status !== 'sent') return { error: 'Cette proposition a déjà reçu une réponse. Recharger la page pour la voir.' };
        pr.status = 'declined'; pr.declined = { at: now, by: user.id, comment: String(action.comment || '').slice(0, 2000) };
        log(project, user, 'a décliné la proposition : ' + pr.title); break;
      }
      case 'version.add': {
        if (!String(action.t || '').trim() || !action.url) return { error: 'Donnez un titre et un lien.' };
        project.versions = project.versions || [];
        project.versions.unshift({ id: uid('ve'), label: 'V' + (project.versions.length + 1), t: String(action.t).slice(0, 120), url: String(action.url), at: now });
        log(project, user, 'a publié une nouvelle version : ' + action.t); break;
      }
      case 'pin.add': {
        const text = String(action.text || '').trim(); if (!text) return { error: 'Commentaire vide : rien n’a été envoyé.' };
        const x = Number(action.x), y = Number(action.y);
        if (!(x >= 0 && x <= 100 && y >= 0 && y <= 100) || !String(action.img || '')) return { error: 'Cliquer sur l’image, à l’endroit à commenter.' };
        project.pins = project.pins || [];
        project.pins.push({ id: uid('pin'), img: String(action.img).slice(0, 300), x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, text: text.slice(0, 1000), by: user.id, at: now, status: 'open', version: String(action.version || '').slice(0, 10) });
        log(project, user, 'a commenté une maquette'); break;
      }
      case 'pin.resolve': {
        const pn = (project.pins || []).find((x) => x.id === action.id); if (!pn) return { error: 'Commentaire introuvable.' };
        pn.status = pn.status === 'resolved' ? 'open' : 'resolved'; pn.resolvedAt = now; break;
      }
      case 'project.archive':
        project.archivedAt = action.undo ? null : now; break;
      case 'files.batch': {
        if (!internal) return { error: 'Action impossible. Recharger la page puis réessayer.' };
        const n = Math.max(0, Math.floor(Number(action.count) || 0)); if (!n) return { ok: true, silent: true };
        log(project, user, `a déposé ${action.folder ? 'le dossier « ' + action.folder + ' »' : n + ' fichiers'} (${n} fichier${n > 1 ? 's' : ''})`);
        return { ok: true, file: { name: action.folder ? 'le dossier « ' + action.folder + ' »' : n + ' fichiers', cat: action.cat } };
      }
      default: return { error: 'Action impossible. Recharger la page puis réessayer.' };
    }
    return { ok: true };
  }

  /* ---------- Notifications ----------
     Une action du client prévient l'équipe du projet ; une action de l'équipe prévient le client
     et les autres membres de l'équipe. Chacun règle ce qu'il reçoit et à quel rythme. */
  const EVENT = {
    'file.add': 'files', 'msg.post': 'messages', 'val.approve': 'validations', 'val.changes': 'validations',
    'files.batch': 'files', 'request.add': 'requests', 'review.add': 'messages', 'setup.webflow': 'files', 'evo.reschedule': 'messages', 'file.signreq': 'validations', 'file.sign': 'validations', 'evo.report': 'files', 'evo.set': 'activity', 'setup.domain': 'files', 'setup.check': 'activity', 'client.remind': 'validations',
    'proposal.send': 'validations', 'proposal.accept': 'validations', 'proposal.decline': 'messages', 'pin.add': 'messages', 'version.add': 'files', 'project.deliver': 'activity', 'val.request': 'validations', 'user.onboarded': 'activity', 'asset.add': 'files', 'next.set': 'activity', 'note.set': 'activity'
  };
  const TAB = { files: 'fichiers', messages: 'messages', validations: 'validations', requests: 'demandes', activity: 'activite' };
  const CLIENT_VIEW = { files: 'fichiers', messages: 'messages', validations: 'valider', activity: 'accueil', requests: 'outils' };
  const CLIENT_VIEW_ACT = { 'proposal.send': 'proposition', 'version.add': 'maquettes' };
  const DEFAULT_PREFS = { email: 'instant', events: { files: true, messages: true, validations: true, requests: true, tasks: true, activity: false } };
  const prefsOf = (u) => ({ ...DEFAULT_PREFS, ...(u.notify || {}), events: { ...DEFAULT_PREFS.events, ...((u.notify || {}).events || {}) } });
  function describe(action, user, project, res, audience) {
    const who = user.name.split(' ')[0];
    switch (action.type) {
      case 'file.add': return `${who} a déposé « ${res.file ? res.file.name : 'un fichier'} »`;
      case 'files.batch': { const n = Number(action.count) || 0, go = Number(action.size) || 0, sz = go >= 1e9 ? (go / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Go' : go >= 1e6 ? Math.round(go / 1e6) + ' Mo' : Math.max(1, Math.round(go / 1e3)) + ' Ko'; return `${who} a déposé ${action.folder ? 'le dossier « ' + action.folder + ' »' : n + ' fichiers'} (${n} fichier${n > 1 ? 's' : ''}, ${sz})`; }
      case 'msg.post': return action.loom && action.loom.url ? `${who} a envoyé une vidéo : ${action.loom.title || 'vidéo'}` : `${who} : « ${String(action.text).slice(0, 120)} »`;
      case 'val.approve': { const v = project.validations.find((x) => x.id === action.vid); return `${who} a validé : ${v ? v.t.toLowerCase() : 'une étape'}`; }
      case 'val.changes': { const v = project.validations.find((x) => x.id === action.vid); return `${who} demande des modifications : ${v ? v.t.toLowerCase() : ''} « ${String(action.comment).slice(0, 100)} »`; }
      case 'val.request': { const v = project.validations.find((x) => x.id === action.vid), what = v ? v.t.toLowerCase() : 'une étape'; return audience === 'client' ? `${who} attend ${project.registre === 'tu' ? 'ta' : 'votre'} validation : ${what}` : `${who} a demandé la validation : ${what}`; }
      case 'request.add': return `${who} fait une demande (${action.kind || 'autre'}) : « ${String(action.text).slice(0, 100)} »`;
      case 'user.onboarded': return `${who} a découvert son espace`;
      case 'file.signreq': return audience === 'client' ? `${who} ${project.registre === 'tu' ? 't’' : 'vous '}envoie un document à signer : ${res.file || ''}` : `${who} a demandé la signature de ${res.file || 'un document'}`;
      case 'file.sign': return `${who} a signé ${res.file || 'un document'}`;
      case 'evo.reschedule': return `${who} demande un autre créneau pour la visio de pilotage : « ${String(action.text).slice(0, 140)} »`;
      case 'evo.report': return audience === 'client' ? `${who} a publié le bilan du mois : ${action.title}` : `${who} a publié le bilan du mois ${action.month}`;
      case 'evo.set': return action.meeting ? `${who} a fixé la prochaine visio de pilotage${action.meeting.when ? ' : ' + new Date(action.meeting.when).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}` : `${who} a mis à jour l’espace Évolution`;
      case 'setup.webflow': return `${who} a créé l’espace Webflow « ${action.ws} » : vérifiez l’invitation`;
      case 'setup.domain': return action.mode === 'vault' ? `${who} a déposé les accès du nom de domaine dans le coffre chiffré` : action.mode === 'delegate' ? `${who} a donné un accès délégué au nom de domaine ${action.domain}` : `${who} ne sait pas qui gère le domaine ${action.domain} : à retrouver`;
      case 'setup.check': { const t = project.tasks.find((x) => x.id === action.tid); return action.ok ? `${who} a vérifié : ${t ? t.t.toLowerCase() : 'une étape'}` : `${who} ${project.registre === 'tu' ? 'te' : 'vous'} demande de reprendre : ${t ? t.t.toLowerCase() : 'une étape'}${action.why ? ' (« ' + String(action.why).slice(0, 120) + ' »)' : ''}`; }
      case 'asset.add': return `${who} a ajouté « ${action.title} » à la bibliothèque`;
      case 'next.set': return `${who} a mis à jour la prochaine action`;
      case 'proposal.send': { const pr = project.proposals.find((x) => x.id === action.prid); return audience === 'client' ? `${who} ${project.registre === 'tu' ? 't’' : 'vous '}a envoyé une proposition : ${pr ? pr.title : ''}` : `${who} a envoyé la proposition ${pr ? pr.title : ''}`; }
      case 'proposal.accept': return `${who} a accepté la proposition : ${res.proposal}`;
      case 'proposal.decline': { const pr = project.proposals.find((x) => x.id === action.prid); return `${who} a décliné la proposition${pr ? ' « ' + pr.title + ' »' : ''}${action.comment ? ' : « ' + String(action.comment).slice(0, 100) + ' »' : ''}`; }
      case 'pin.add': return `${who} a commenté une maquette : « ${String(action.text).slice(0, 100)} »`;
      case 'version.add': return `${who} a publié une nouvelle version : ${action.t}`;
      case 'client.remind': return audience === 'client' ? `Petit rappel de ${who} : ${res.remind} attend ${project.registre === 'tu' ? 'ton' : 'votre'} retour.` : `${who} a relancé ${project.contactName || project.client} : ${res.remind}`;
      case 'review.add': return Number(action.score) <= 3 ? `${who} a donné ${action.score}/5 et a rempli le questionnaire de bilan${action.survey && action.survey.call ? ' : souhaite en parler de vive voix' : ''}` : `${who} a laissé un avis : ${action.score}/5${action.text ? ' « ' + String(action.text).slice(0, 100) + ' »' : ''}${action.google ? ', publié sur Google' : ''}`;
      case 'project.deliver': return action.undo ? `${who} a annulé la mise en ligne` : audience === 'client' ? `${who} a annoncé la mise en ligne : ${project.offer === 'site' ? (project.registre === 'tu' ? 'ton' : 'votre') + ' site est en ligne' : 'le projet est livré'}` : `${who} a mis en ligne le projet ${project.client}`;
      case 'note.set': return audience === 'client' ? `${who} a publié le point de la semaine : « ${String(action.text || '').slice(0, 160)} »` : `${who} a publié le point de la semaine`;
    }
    return '';
  }
  function notifyFor(store, project, user, action, res) {
    const type = EVENT[action.type]; if (!type) return [];
    if ((action.type === 'file.add' || action.type === 'files.batch') && user.role === 'admin' && res.file && res.file.cat !== 'Livrable') return [];
    store.notifications = store.notifications || [];
    const team = (project.team && project.team.members && project.team.members.length) ? project.team.members : store.users.filter((u) => u.role === 'admin').map((u) => u.id);
    let to;
    if (user.role === 'admin') {
      // l'équipe voit ce que font les collègues ; le client est prévenu de ce qui le concerne
      const clientTypes = ['files', 'messages', 'validations', 'activity'];
      to = team.filter((id) => id !== user.id).map((id) => ({ id, audience: 'team' }));
      if (clientTypes.includes(type) && action.type !== 'next.set' && !(action.type === 'project.deliver' && action.undo)) to = to.concat(store.users.filter((u) => u.projectId === project.id).map((u) => ({ id: u.id, audience: 'client' })));
    } else {
      to = team.map((id) => ({ id, audience: 'team' })).concat(store.users.filter((u) => u.projectId === project.id && u.id !== user.id).map((u) => ({ id: u.id, audience: 'client' })));
    }
    const at = iso(Date.now());
    const out = [];
    for (const r of to) {
      const u = store.users.find((x) => x.id === r.id); if (!u) continue;
      const text = describe(action, user, project, res, r.audience);
      const n = { id: uid('n'), userId: u.id, projectId: project.id, client: project.client, type, act: action.type, vid: action.vid || undefined, fid: res.file ? res.file.id : undefined, rid: action.type === 'request.add' ? project.requests[0].id : undefined, text, by: user.id, at, read: false, reg: r.audience === 'client' ? project.registre : undefined,
        go: r.audience === 'team' ? { view: 'admin', tab: action.type.startsWith('proposal') ? 'factures' : TAB[type] } : { view: CLIENT_VIEW_ACT[action.type] || CLIENT_VIEW[type] } };
      store.notifications.unshift(n); out.push(n);
    }
    if (store.notifications.length > 2000) store.notifications.length = 2000;
    return out;
  }
  /* E-mails à envoyer tout de suite (préférence « instantané » et type coché). */
  function emailsFor(store, notices, baseUrl, grouped) {
    const by = new Map();
    for (const n of notices) {
      const u = store.users.find((x) => x.id === n.userId); if (!u) continue;
      if (u.role === 'admin') { const pr = prefsOf(u); if (pr.email !== 'instant' || !pr.events[n.type]) continue; }
      else if (n.act === 'note.set') { if (u.prefs && u.prefs.weekly === false) continue; }
      else if (!(u.prefs ? u.prefs.mail : true) || (n.type === 'activity' && n.act !== 'project.deliver')) continue;
      if (!by.has(u.id)) by.set(u.id, { u, items: [] }); by.get(u.id).items.push(n);
    }
    const mails = [];
    for (const { u, items } of by.values()) { if (grouped) mails.push(mailFor(u, items, baseUrl)); else items.forEach((n) => mails.push(mailFor(u, [n], baseUrl))); }
    return mails;
  }
  function digestFor(store, user, since, baseUrl) {
    const items = (store.notifications || []).filter((n) => n.userId === user.id && !n.read && n.at > since);
    return items.length ? mailFor(user, items, baseUrl, true) : null;
  }
  function mailFor(u, items, baseUrl, digest) {
    const first = u.name.split(' ')[0];
    // l'équipe se tutoie ; un client reçoit le registre choisi pour son projet
    const tu = u.role === 'admin' || items[0].reg === 'tu', T = (v, t) => (tu ? t : v);
    const subject = digest ? (u.role === 'admin' ? `Le récap du jour : ${items.length} nouveauté${items.length > 1 ? 's' : ''} dans tes espaces clients` : `Du nouveau dans ${T('votre', 'ton')} espace ${items[0].client}`) : (u.role === 'admin' ? `${items[0].client} · ${items[0].text}` : `Du nouveau dans ${T('votre', 'ton')} espace ${items[0].client}`);
    const rows = items.map((n) => `<tr><td style="padding:12px 0;border-top:1px solid #e2e1dc"><div style="font-size:12px;color:#585865">${esc(n.client)}</div><div style="font-size:15px;color:#0b0b12;margin-top:2px">${esc(n.text)}</div></td></tr>`).join('');
    const html = `<div style="background:#f3f2ef;padding:32px 16px;font-family:Arial,Helvetica,sans-serif"><table width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px" cellpadding="0" cellspacing="0">
      <tr><td style="font-family:Georgia,serif;font-size:22px;color:#000012;padding-bottom:16px">Orem</td></tr>
      <tr><td style="font-size:15px;color:#0b0b12;padding-bottom:8px">Bonjour ${esc(first)},</td></tr>
      <tr><td style="font-size:15px;color:#2f2f3a;padding-bottom:8px">${digest ? 'Voici ce qui s\u2019est passé aujourd\u2019hui :' : 'Il y a du nouveau :'}</td></tr>
      ${rows}
      <tr><td style="padding-top:20px"><a href="${baseUrl}/" style="display:inline-block;background:#000012;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px">Ouvrir l\u2019espace</a></td></tr>
      <tr><td style="font-size:12px;color:#585865;padding-top:20px">${T('Vous recevez', 'Tu reçois')} cet e-mail car ${T('vous êtes', 'tu es')} ${u.role === 'admin' ? 'dans l\u2019équipe du projet' : 'dans cet espace client'}. ${T('Réglez vos', 'Règle tes')} notifications depuis l\u2019espace.</td></tr>
    </table></div>`;
    // by : l'auteur commun des nouveautés (l'e-mail part alors de son adresse si c'est un membre de l'équipe et que le destinataire est un client)
    return { to: u.email, name: u.name, subject, html, text: items.map((n) => `${n.client} : ${n.text}`).join('\n') + `\n\n${baseUrl}/`, by: items.every((n) => n.by === items[0].by) ? items[0].by : null, toClient: u.role !== 'admin' };
  }
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function apply(store, projectId, user, rawAction, internal) {
    if (!rawAction || typeof rawAction !== 'object' || Array.isArray(rawAction) || typeof rawAction.type !== 'string') return { error: 'Action impossible. Recharger la page puis réessayer.' };
    let action;
    try { action = clean(rawAction); } catch (e) { return { error: e.message === 'LINK' ? 'Lien invalide : utilisez une adresse qui commence par https://' : 'Action impossible. Recharger la page puis réessayer.' }; }
    if (typeof action.type !== 'string') return { error: 'Action impossible. Recharger la page puis réessayer.' };
    const project0 = store.projects.find((p) => p.id === projectId);
    const snap = project0 ? JSON.stringify(project0) : null, usersSnap = JSON.stringify(store.users);
    let res;
    try { res = applyInner(store, projectId, user, action, !!internal); }
    catch (e) {
      // Rien ne doit rester à moitié modifié.
      if (project0) Object.assign(project0, JSON.parse(snap));
      store.users.splice(0, store.users.length, ...JSON.parse(usersSnap));
      return { error: 'Action impossible. Recharger la page puis réessayer.' };
    }
    if (res.error) return res;
    const project = store.projects.find((p) => p.id === projectId);
    if (project) capProject(project);
    res.notices = res.silent ? [] : notifyFor(store, project, user, action, res);
    return res;
  }

  /* La base ne grossit pas sans limite : chaque liste a un plafond (les plus anciens éléments partent). */
  const CAPS = { messages: 1000, pins: 300, requests: 300, files: 2000, versions: 50, assets: 500, proposals: 50, missing: 100, tasks: 100, invoices: 100 };
  function capProject(p) {
    for (const [k, n] of Object.entries(CAPS)) if (Array.isArray(p[k]) && p[k].length > n) p[k] = k === 'pins' ? p[k].slice(-n) : p[k].slice(0, n);
    (p.validations || []).forEach((v) => { if (v.history.length > 100) v.history = v.history.slice(-100); });
  }
  /* Dépôt de fichier : seul le serveur (ou la démo) crée l'enregistrement, après avoir écrit le fichier. */
  function addFile(store, projectId, user, meta) {
    return apply(store, projectId, user, { type: 'file.add', file: { id: String(meta.id || ''), name: String(meta.name || 'fichier'), size: Number(meta.size) || 0, cat: meta.cat, path: meta.path, folder: meta.folder || '', quiet: !!meta.quiet } }, true);
  }
  /* Fin d'un dépôt groupé (dossier ou sélection de nombreux fichiers) : un seul message pour l'équipe ou le client. */
  function filesBatch(store, projectId, user, meta) {
    return apply(store, projectId, user, { type: 'files.batch', folder: String(meta.folder || '').slice(0, 200), count: Number(meta.count) || 0, size: Number(meta.size) || 0, cat: meta.cat }, true);
  }

  /* Réglages de l'agence (coordonnées bancaires, liens de réservation…) : plus rien d'écrit en dur dans l'interface. */
  const DEFAULT_SETTINGS = {
    holder: 'ICONOKOM', address: '34 place du Général de Gaulle, Bureau 3, 59000 Lille', iban: 'FR76 1695 8000 0188 1420 4296 259', bic: 'QNTOFRP1XXX', bank: 'Qonto',
    booking: 'https://app.iclosed.io/e/Orem/rdv-30min', training: '', reviewUrl: '', welcomeLoom: '', cgvUrl: '', site: 'https://www.agence-orem.fr', webflowInvite: 'louis@agence-orem.fr', ovhNic: ''
  };
  const settingsOf = (store) => ({ ...DEFAULT_SETTINGS, ...(store.settings || {}) });
  function publicConfig(store) { return settingsOf(store); }
  function setSettings(store, user, body) {
    if (!user || user.role !== 'admin') return { error: 'Réglage réservé à l\u2019équipe.' };
    let b; try { b = clean(body || {}); } catch (e) { return { error: 'Lien invalide : utilisez une adresse qui commence par https://' }; }
    const next = settingsOf(store);
    for (const k of Object.keys(DEFAULT_SETTINGS)) if (typeof b[k] === 'string') next[k] = b[k];
    store.settings = next; return { ok: true, settings: next };
  }

  /* ---------- Tâches de l'équipe ----------
     Une seule liste pour toute l'équipe, sur le modèle de « Programme & Livrables » dans Notion
     (Nom, Personne, Date de livraison, Étape, État), mais commune à tous les clients :
     - les tâches internes, liées à un client ou non (prospection, administratif…) : store.todos ;
     - les livrables des projets confiés à l'équipe, lus directement dans le planning de chaque projet
       (rien n'est recopié : changer l'état ici change le planning du client, et inversement).
     États : 'todo' (Pas commencé), 'doing' (En cours), 'done' (Fait). Jamais visible côté client. */
  const TODO_STATES = ['todo', 'doing', 'done'];
  const ITEM_TO = { wait: 'todo', on: 'doing', review: 'doing', done: 'done' }, TO_ITEM = { todo: 'wait', doing: 'on', done: 'done' };
  const teamIds = (store) => new Set(store.users.filter((u) => u.role === 'admin').map((u) => u.id));
  function teamTasks(store, user, now = Date.now()) {
    if (!user || user.role !== 'admin') return { error: 'Réservé à l’équipe.' };
    const team = teamIds(store), out = [], old = now - 30 * 864e5;
    for (const t of store.todos || []) {
      if (t.status === 'done' && t.doneAt && new Date(t.doneAt) < old) continue;
      const p = t.projectId && store.projects.find((x) => x.id === t.projectId);
      out.push({ ...t, kind: 'task', client: p ? p.client : '' });
    }
    for (const p of store.projects) {
      if (p.archivedAt) continue;
      for (const ph of p.phases || []) for (const it of ph.items || []) {
        const who = itemWho(it).map((w) => w[0]).filter((id) => team.has(id));
        if (!who.length) continue;
        const state = itemState(p, it), status = ITEM_TO[state] || 'todo';
        if (status === 'done' && (!it.due || new Date(it.due) < old)) continue;
        out.push({ id: `i:${p.id}:${it.id}`, kind: 'item', t: it.t, who, due: it.due || null, status, review: state === 'review', projectId: p.id, client: p.client, step: `Étape ${ph.n} · ${ph.t}` });
      }
    }
    return { tasks: out };
  }
  function todoNotices(store, user, t, before, client) {
    const out = [], at = iso(Date.now());
    store.notifications = store.notifications || [];
    for (const id of t.who) {
      if (id === user.id || before.includes(id)) continue;
      const u = store.users.find((x) => x.id === id && x.role === 'admin'); if (!u) continue;
      const when = t.due ? `, pour le ${new Date(t.due).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : '';
      const n = { id: uid('n'), userId: id, projectId: t.projectId || null, client: client || 'Interne', type: 'tasks', act: 'todo.assign', tid: t.id, text: `${user.name.split(' ')[0]} t’a confié : « ${t.t} »${when}`, by: user.id, at, read: false, go: { view: 'taches' } };
      store.notifications.unshift(n); out.push(n);
    }
    if (store.notifications.length > 2000) store.notifications.length = 2000;
    return out;
  }
  function taskAct(store, user, body) {
    if (!user || user.role !== 'admin') return { error: 'Réservé à l’équipe.' };
    let a; try { a = clean(body || {}); } catch { return { error: 'Action impossible. Recharger la page puis réessayer.' }; }
    const team = teamIds(store);
    const whoOf = (w) => (Array.isArray(w) ? [...new Set(w.map(String))].filter((id) => team.has(id)).slice(0, 6) : null);
    const dueOf = (d) => (d === '' || d === null ? null : d === undefined ? undefined : validDate(d) ? iso(d) : false);
    const projOf = (id) => (id === '' || id === null ? null : id === undefined ? undefined : store.projects.find((p) => p.id === id) ? String(id) : false);
    store.todos = store.todos || [];
    if (a.type === 'todo.add') {
      const t = String(a.t || '').trim().slice(0, 160); if (!t) return { error: 'Écrivez la tâche.' };
      const due = dueOf(a.due), projectId = projOf(a.projectId);
      if (due === false) return { error: 'Date invalide.' };
      if (projectId === false) return { error: 'Client introuvable.' };
      const who = whoOf(a.who) || []; if (!who.length) who.push(user.id);
      const status = TODO_STATES.includes(a.status) ? a.status : 'todo';
      const todo = { id: uid('td'), t, who, due: due || null, status, projectId: projectId || null, note: String(a.note || '').slice(0, 2000), urgent: !!a.urgent, by: user.id, at: iso(Date.now()), doneAt: status === 'done' ? iso(Date.now()) : null };
      store.todos.unshift(todo);
      if (store.todos.length > 2000) { const keep = store.todos.filter((x) => x.status !== 'done'); store.todos = keep.concat(store.todos.filter((x) => x.status === 'done')).slice(0, 2000); }
      const p = todo.projectId && store.projects.find((x) => x.id === todo.projectId);
      return { ok: true, task: todo, notices: todoNotices(store, user, todo, [], p && p.client) };
    }
    if (a.type === 'todo.update') {
      const id = String(a.id || '');
      if (id.startsWith('i:')) {
        // Livrable d'un projet : l'état et la date passent par le planning du projet (historique du client compris).
        const [, pid, iid] = id.split(':'); const p = store.projects.find((x) => x.id === pid);
        const it = p && p.phases.flatMap((x) => x.items).find((x) => x.id === iid); if (!it) return { error: 'Livrable introuvable.' };
        const due = dueOf(a.due); if (due === false) return { error: 'Date invalide.' };
        if (a.status !== undefined || due) {
          const status = a.status !== undefined ? TO_ITEM[a.status] : it.status; if (!status) return { error: 'État inconnu.' };
          const r = apply(store, pid, user, { type: 'item.status', iid, status, due: due || undefined }); if (r.error) return r;
        }
        const who = whoOf(a.who); let notices = [];
        if (who) {
          const before = itemWho(it).map((w) => w[0]), texts = new Map(itemWho(it));
          const keepClient = itemWho(it).filter((w) => w[0] === 'client');
          const r = apply(store, pid, user, { type: 'item.meta', iid, who: [...who.map((w) => [w, texts.get(w) || '']), ...keepClient] }); if (r.error) return r;
          notices = todoNotices(store, user, { id, t: it.t, who, due: it.due, projectId: pid }, before, p.client);
        }
        return { ok: true, notices };
      }
      const t = store.todos.find((x) => x.id === id); if (!t) return { error: 'Tâche introuvable. Recharger la page.' };
      const before = t.who.slice();
      if (a.t !== undefined) { const v = String(a.t).trim().slice(0, 160); if (!v) return { error: 'Écrivez la tâche.' }; t.t = v; }
      const due = dueOf(a.due); if (due === false) return { error: 'Date invalide.' }; if (due !== undefined) t.due = due;
      const projectId = projOf(a.projectId); if (projectId === false) return { error: 'Client introuvable.' }; if (projectId !== undefined) t.projectId = projectId;
      const who = whoOf(a.who); if (who) { if (!who.length) return { error: 'Choisissez au moins une personne.' }; t.who = who; }
      if (a.note !== undefined) t.note = String(a.note).slice(0, 2000);
      if (a.urgent !== undefined) t.urgent = !!a.urgent;
      if (a.status !== undefined) { if (!TODO_STATES.includes(a.status)) return { error: 'État inconnu.' }; if (a.status === 'done' && t.status !== 'done') { t.doneAt = iso(Date.now()); t.doneBy = user.id; } if (a.status !== 'done') t.doneAt = null; t.status = a.status; }
      t.updatedAt = iso(Date.now());
      const p = t.projectId && store.projects.find((x) => x.id === t.projectId);
      return { ok: true, task: t, notices: who ? todoNotices(store, user, t, before, p && p.client) : [] };
    }
    if (a.type === 'todo.remove') {
      const id = String(a.id || ''); if (id.startsWith('i:')) return { error: 'Un livrable se retire depuis le planning du client.' };
      const n = store.todos.length; store.todos = store.todos.filter((x) => x.id !== id);
      return n === store.todos.length ? { error: 'Tâche introuvable. Recharger la page.' } : { ok: true };
    }
    return { error: 'Action impossible. Recharger la page puis réessayer.' };
  }

  /* Relances automatiques, une seule fois chacune :
     une validation qui attend depuis plus de 3 jours ouvrés, une facture à régler depuis plus de 10 jours.
     Le client reçoit un rappel (dans son registre), l'équipe du projet le voit dans sa boîte de réception. */
  function workDaysBetween(from, to) {
    let n = 0; const d = new Date(from); d.setHours(12, 0, 0, 0); const end = new Date(to);
    while (d < end) { d.setDate(d.getDate() + 1); if (d <= end && d.getDay() % 6 !== 0) n++; }
    return n;
  }
  /* Planning : une validation en retard de plus d'un jour décale d'autant tout ce qui vient après (livrables, temps, mise en ligne). */
  function replan(p, now) {
    if (p.deliveredAt || p.archivedAt || p.draft) return 0;
    // Seul le retard du client compte : une validation prête, sans réponse 3 jours ouvrés après son échéance.
    const late = (p.validations || []).filter((v) => v.status === 'ready' && v.readyAt && new Date(v.due).getTime() < now - DAY && workDaysBetween(v.readyAt, now) > 3).sort((a, b) => new Date(a.due) - new Date(b.due))[0];
    if (!late) return 0;
    const from = new Date(late.due).getTime(), shift = Math.ceil((now - from) / DAY);
    if (shift < 1) return 0;
    const mv = (d) => (d && new Date(d).getTime() >= from ? addDays(d, shift) : d);
    p.validations.forEach((v) => { if (v.status !== 'approved') v.due = mv(v.due); });
    p.phases.forEach((ph) => { ph.items.forEach((i) => { if (i.status !== 'done') i.due = mv(i.due); }); ph.to = mv(ph.to); if (new Date(ph.from).getTime() > from) ph.from = mv(ph.from); });
    p.golive = mv(p.golive);
    return shift;
  }
  function runReminders(store, now = Date.now()) {
    const out = [], at = iso(now);
    for (const p of store.projects || []) {
      if (p.archivedAt || p.draft) continue;
      const shifted = replan(p, now);
      p.replanned = (p.replanned || 0) + shifted;
      // L'équipe reçoit un résumé du recalage au plus une fois par semaine.
      if (p.replanned && (!p.replanNoticeAt || now - new Date(p.replanNoticeAt).getTime() > 7 * DAY)) {
        const total = p.replanned; p.replanned = 0; p.replanNoticeAt = at;
        const shiftedTxt = total;
        p.activity.unshift({ at, by: 'u_agence', text: `planning recalé de ${shiftedTxt} jour${shiftedTxt > 1 ? 's' : ''} (validation en attente chez le client)`, seen: false });
        const team0 = (p.team && p.team.members && p.team.members.length) ? p.team.members : store.users.filter((u) => u.role === 'admin').map((u) => u.id);
        store.notifications = store.notifications || [];
        for (const id of team0) { const n = { id: uid('n'), userId: id, projectId: p.id, client: p.client, type: 'activity', act: 'replan', text: `Planning ${p.client} recalé de ${shiftedTxt} jour${shiftedTxt > 1 ? 's' : ''} : mise en ligne vers le ${new Date(p.golive).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`, by: 'u_agence', at, read: false, go: { view: 'admin', tab: 'pilotage' } }; store.notifications.unshift(n); out.push(n); }
      }
      const tu = p.registre === 'tu', clients = store.users.filter((u) => u.projectId === p.id);
      const team = (p.team && p.team.members && p.team.members.length) ? p.team.members : store.users.filter((u) => u.role === 'admin').map((u) => u.id);
      const lead = store.users.find((u) => u.id === (p.team && p.team.lead)) || store.users.find((u) => u.role === 'admin') || { id: 'u_agence', name: 'L’équipe' };
      const push = (type, clientText, teamText, go) => {
        for (const u of clients) { const n = { id: uid('n'), userId: u.id, projectId: p.id, client: p.client, type, act: 'reminder', text: clientText, by: lead.id, at, read: false, reg: p.registre, go: { view: go } }; store.notifications.unshift(n); out.push(n); }
        for (const id of team) { const n = { id: uid('n'), userId: id, projectId: p.id, client: p.client, type: 'activity', act: 'reminder', text: teamText, by: lead.id, at, read: false, go: { view: 'admin', tab: type === 'validations' ? 'validations' : 'factures' } }; store.notifications.unshift(n); out.push(n); }
      };
      store.notifications = store.notifications || [];
      for (const v of p.validations || []) {
        if (v.status !== 'ready' || !v.readyAt || v.remindedAt) continue;
        if (workDaysBetween(v.readyAt, now) < 3) continue;
        v.remindedAt = at;
        push('validations', `Petit rappel : ${v.t.toLowerCase()} attend ${tu ? 'ton' : 'votre'} feu vert depuis le ${new Date(v.readyAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`,
          `Relance automatique envoyée à ${p.contactName || p.client} : ${v.t.toLowerCase()}`, 'valider');
        p.activity.unshift({ at, by: lead.id, text: 'a relancé automatiquement : ' + v.t.toLowerCase(), seen: true });
      }
      const late = (p.missing || []).filter((m) => !m.remindedAt && workDaysBetween(m.at || p.start, now) >= 5);
      if (late.length && !p.deliveredAt) {
        late.forEach((m) => (m.remindedAt = at));
        push('files', `Petit rappel : il nous manque ${late.map((m) => m.t.toLowerCase()).join(', ')}. ${tu ? 'Tu peux les déposer' : 'Vous pouvez les déposer'} dans Fichiers.`, `Relance automatique envoyée à ${p.contactName || p.client} : ${late.length} fichier${late.length > 1 ? 's' : ''} attendu${late.length > 1 ? 's' : ''}`, 'fichiers');
      }
      for (const inv of p.invoices || []) {
        if (inv.status !== 'due' || !inv.date || inv.remindedAt || now - new Date(inv.date).getTime() < 10 * DAY) continue;
        inv.remindedAt = at;
        push('files', `Petit rappel : ${inv.label.toLowerCase()}${inv.num ? ' ' + inv.num : ''} reste à régler. ${tu ? 'Tu trouveras' : 'Vous trouverez'} l’IBAN dans « Devis et factures ».`,
          `Relance automatique envoyée à ${p.contactName || p.client} : ${inv.label.toLowerCase()}`, 'documents');
      }
    }
    if (store.notifications && store.notifications.length > 2000) store.notifications.length = 2000;
    return { notices: out };
  }

  /* Invitation : le premier e-mail du client, dans son registre, signé par le chef de projet. */
  function inviteMail(user, project, lead, baseUrl, link) {
    const tu = project.registre === 'tu', T = (v, t) => (tu ? t : v), first = esc(String(user.name || '').split(' ')[0]);
    const who = 'L\u2019équipe Orem';
    const url = link || `${baseUrl}/?email=${encodeURIComponent(user.email)}`;
    return { to: user.email, name: user.name, subject: `${T('Votre', 'Ton')} espace ${project.client} est prêt`,
      text: `Bonjour ${user.name},\n${T('Votre', 'Ton')} espace projet est prêt : ${url}\nUn clic suffit, sans mot de passe (lien personnel valable 7 jours). Ensuite, ${T('connectez-vous', 'connecte-toi')} avec cette adresse e-mail.\n${who} : Louis, Théophile et Clément`,
      html: `<div style="background:#f3f2ef;padding:32px 16px;font-family:Arial,Helvetica,sans-serif"><table width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px" cellpadding="0" cellspacing="0"><tr><td style="font-family:Georgia,serif;font-size:22px;color:#000012;padding-bottom:16px">Orem</td></tr><tr><td style="font-size:15px;color:#0b0b12">Bonjour ${first},</td></tr><tr><td style="font-size:15px;color:#2f2f3a;padding:8px 0 16px">${T('Votre', 'Ton')} espace pour le projet <strong>${esc(project.projet)}</strong> est prêt : le planning, ce qu\u2019on attend de ${T('vous', 'toi')}, ${T('vos', 'tes')} fichiers et ${T('vos', 'tes')} factures, au même endroit. Pas de mot de passe à créer : un clic sur le bouton suffit (lien personnel, valable 7 jours). Pour les fois suivantes, il suffira de saisir cette adresse e-mail.</td></tr><tr><td><a href="${esc(url)}" style="display:inline-block;background:#092482;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px">${T('Ouvrir mon espace', 'Ouvrir mon espace')}</a></td></tr><tr><td style="font-size:15px;color:#2f2f3a;padding-top:20px">${T('À très vite', 'À très vite')},<br>${who}<br><span style="color:#585865;font-size:13px">Louis, Théophile et Clément</span></td></tr></table></div>` };
  }
  function loginMail(user, code, link, registre) {
    const tu = user.role === 'admin' || registre === 'tu', T = (v, t) => (tu ? t : v);
    const first = esc(String(user.name || '').split(' ')[0]);
    return { to: user.email, name: user.name, subject: `${T('Votre', 'Ton')} code de connexion : ${code}`, text: `Code : ${code}\nLien : ${link}\nValable 15 minutes.`,
      html: `<div style="background:#f3f2ef;padding:32px 16px;font-family:Arial,Helvetica,sans-serif"><table width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px" cellpadding="0" cellspacing="0"><tr><td style="font-family:Georgia,serif;font-size:22px;color:#000012;padding-bottom:16px">Orem</td></tr><tr><td style="font-size:15px;color:#0b0b12">Bonjour ${first},</td></tr><tr><td style="font-size:15px;color:#2f2f3a;padding:8px 0 16px">${T('Votre', 'Ton')} code de connexion à l\u2019espace Orem :</td></tr><tr><td style="font-size:30px;letter-spacing:.2em;font-weight:bold;color:#000012">${esc(code)}</td></tr><tr><td style="padding-top:20px"><a href="${esc(link)}" style="display:inline-block;background:#092482;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px">Se connecter</a></td></tr><tr><td style="font-size:12px;color:#585865;padding-top:16px">Valable 15 minutes. ${T('Si vous n\u2019avez rien demandé, ignorez', 'Si tu n\u2019as rien demandé, ignore')} cet e-mail.</td></tr></table></div>` };
  }

  /* Boîte de réception et préférences (par personne).
     « À traiter » : ce qu'un client attend de l'équipe (message, fichier, modifications, demande d'évolution, deal à ouvrir). */
  const TODO_ACTS = new Set(['msg.post', 'file.add', 'val.changes', 'request.add', 'pipedrive', 'review.add', 'proposal.accept', 'proposal.decline', 'pin.add']);
  const isTodo = (store, n) => { if (n.act === 'todo.assign') return true; if (!TODO_ACTS.has(n.act)) return false; if (n.act === 'pipedrive') return true; const by = store.users.find((u) => u.id === n.by); return !by || by.role !== 'admin'; };
  function inbox(store, user) { return (store.notifications || []).filter((n) => n.userId === user.id).slice(0, 200).map((n) => ({ ...n, todo: isTodo(store, n) && !n.done })); }
  function doneNotif(store, user, id, undo) { const n = (store.notifications || []).find((x) => x.userId === user.id && x.id === id); if (!n) return { error: 'Notification introuvable.' };
    n.done = !undo; n.read = true;
    // Traité par un membre de l'équipe : traité pour toute l'équipe (même événement, même projet, même texte).
    (store.notifications || []).forEach((x) => { if (x.projectId === n.projectId && x.text === n.text && x.at === n.at) { x.done = !undo; if (!undo) x.read = true; } });
    return { ok: true }; }
  function readNotif(store, user, id, ids) { const set = Array.isArray(ids) ? new Set(ids.map(String)) : null; (store.notifications || []).forEach((n) => { if (n.userId === user.id && (set ? set.has(n.id) : (!id || n.id === id))) n.read = true; }); return { ok: true }; }
  function setPrefs(store, user, prefs) {
    const u = store.users.find((x) => x.id === user.id); if (!u || u.role !== 'admin') return { error: 'Réglage réservé à l\u2019équipe.' };
    const email = ['instant', 'digest', 'off'].includes(prefs.email) ? prefs.email : 'instant';
    const ev = {}; for (const k of Object.keys(DEFAULT_PREFS.events)) ev[k] = !!(prefs.events || {})[k];
    u.notify = { email, events: ev }; return { ok: true, notify: u.notify };
  }

  function createProject(store, user, data) {
    if (user.role !== 'admin') return { error: 'Action réservée à l’agence.' };
    if (!String(data.client || '').trim()) return { error: 'Indiquez le nom du client.' };
    // Le registre n'est jamais deviné : sans choix explicite, l'espace reste en brouillon (cas Pipedrive).
    if (!['tu', 'vous'].includes(data.registre) && !data.draft) return { error: 'Choisissez le tutoiement ou le vouvoiement.' };
    const p = newProject(data);
    p.team = { lead: user.id, members: store.users.filter((u) => u.role === 'admin').map((u) => u.id) };
    p.missing = (DEFAULT_MISSING[p.offer] || []).map(([t, sub]) => ({ id: uid('m'), t, sub, at: iso(Date.now()) }));
    if (!data.prospect) addSetup(p, iso(Date.now()));
    if (data.draft) p.draft = { from: data.draft, at: iso(Date.now()) };
    store.projects.unshift(p);
    let invite;
    if (data.email) {
      const r = apply(store, p.id, user, { type: 'user.add', email: data.email, name: data.contactName });
      if (r.error) { store.projects.shift(); return r; }
      invite = r.invite;
    }
    log(p, user, 'a créé l’espace');
    return { ok: true, id: p.id, invite };
  }

  return { teamTasks, taskAct, TODO_STATES, filesBatch, seed, newProject, OFFERS, OREM, ROLES, REVIEW_AXES, itemWho, itemGo, itemState, phaseState, lateDays, offerOf: (p) => (OFFERS[p.offer] || OFFERS.site).label, apply, addFile, createProject, summary, forUser, nextStep, alerts, canSee, inbox, readNotif, doneNotif, setPrefs, prefsOf, emailsFor, digestFor, loginMail, inviteMail, publicConfig, setSettings, settingsOf, runReminders, FILE_CATS, AGENCY_CATS, HANDOVER, workDaysBetween, reg, replan };
});
