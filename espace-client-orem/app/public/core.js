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
  const FILE_CATS = ['Images', 'Vidéos', 'Textes', 'Autres'];
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
      { d: [22, 38], txt: 'On construit le site sur Webflow, on le teste ensemble, on le met en ligne et on vous forme.',
        items: [['Création du compte Webflow', 23], ['Construction du site', 31], ['Recette du site', 34, 'site'], ['Mise en ligne et remise des accès', 36, 'pv'], ['Formation Webflow (visio)', 38]] },
      { d: [39, 70], txt: 'On mesure les résultats et on fait évoluer ce qui transforme.',
        items: [['Bilan à 30 jours', 66], ['Proposition d’évolution', 70]] }
    ], validations: [['plan', 'Plan du site', 'Les pages du site et leur organisation', 8], ['da', 'Direction artistique et textes', 'Couleurs, typographies, style et ton', 14], ['maquettes', 'Maquettes du site', 'Le feu vert pour construire le site', 21], ['site', 'Recette du site', 'Le site complet, avant sa mise en ligne', 34], ['pv', 'Réception du site', 'Le site est livré tel que prévu', 36]] },
    da: { label: 'Direction artistique', phases: [
      { d: [0, 7], txt: 'On comprend votre marque, vos clients et ce qui vous distingue.',
        items: [['Devis signé', -3], ['Atelier de marque (1 h 30)', 3], ['Synthèse et plateforme de marque', 7, 'plateforme']] },
      { d: [8, 20], txt: 'On explore des pistes créatives, puis on affine celle que vous retenez.',
        items: [['Pistes créatives', 14, 'pistes'], ['Direction artistique finale', 20, 'da']] },
      { d: [21, 32], txt: 'On décline l’identité sur vos supports et on livre la charte.',
        items: [['Logo et déclinaisons', 26], ['Charte graphique', 30, 'charte'], ['Livraison des fichiers sources', 32]] },
      { d: [33, 60], txt: 'On vérifie que l’identité vit bien sur vos supports.',
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
      registre: registre === 'tu' ? 'tu' : 'vous', start: s, golive: addDays(s, of === 'site' ? 36 : lastDay), createdAt: iso(Date.now()),
      phase: 1,
      phases: T.phases.map((p, i) => ({ n: i + 1, letter: OREM[i][0], t: OREM[i][1], from: addDays(s, p.d[0]), to: addDays(s, p.d[1]), txt: p.txt,
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
      review: null,
      team: { lead: null, members: [] }
    };
  }
  /* Recaler les dates d'un projet réel (début et mise en ligne connus). */
  function placePhases(p, bounds) {
    p.phases.forEach((ph, i) => { if (!bounds[i]) return; ph.from = iso(bounds[i][0]); ph.to = iso(bounds[i][1]); });
  }

  function seed(now = Date.now()) {
    const users = [
      { id: 'u_louis', email: 'louis@agence-orem.fr', name: 'Louis Montagne', role: 'admin', title: 'Cofondateur, chef de projet', phone: '07 50 37 15 72', wa: 'https://wa.me/33750371572', photo: 'louis' },
      { id: 'u_theo', email: 'theophile@agence-orem.fr', name: 'Théophile Lamouret', role: 'admin', title: 'Cofondateur, stratégie et textes', phone: '07 71 67 39 47', wa: 'https://wa.me/33771673947', photo: 'theophile' },
      { id: 'u_clement', email: 'clement@agence-orem.fr', name: 'Clément', role: 'admin', title: 'Designer, il dessine les maquettes', photo: 'clement' }
    ];
    const at = (n, h) => { const d = new Date(now + n * DAY); if (h !== undefined) d.setHours(h, 0, 0, 0); return d.toISOString(); };
    const f = (name, cat, from, by, d, size, extra = {}) => ({ id: uid('f'), name, cat, from, by, at: d, size, seen: true, demo: true, ...extra });
    const done = (p, upto) => p.phases.forEach((ph) => ph.items.forEach((i) => { if (new Date(i.due) <= new Date(upto)) i.status = 'done'; }));
    const approve = (p, key, d, by) => { const v = p.validations.find((x) => x.key === key); v.status = 'approved'; v.readyAt = addDays(d, -2); v.history.push({ at: addDays(d, -2), by: 'u_louis', action: 'requested' }, { at: d, by, action: 'approved' }); };

    /* Exemple 1 : Maison Lumen (fictif). Site web en cours, le plan du site attend la validation de Claire. */
    const a = newProject({ client: 'Maison Lumen', projet: 'Refonte du site maisonlumen.fr', contactName: 'Claire', start: at(-12), registre: 'vous', amountHT: 6900, offer: 'site' });
    a.id = 'p_lumen'; a.phase = 1;
    a.phases[0].items.forEach((i) => { if (!i.val) i.status = 'done'; });
    a.phases[0].items[3].status = 'done';
    const lp = a.validations.find((v) => v.key === 'plan'); lp.status = 'ready'; lp.readyAt = at(-2, 11); lp.link = 'https://www.figma.com/proto/exemple-maison-lumen-plan';
    lp.history.push({ at: at(-2, 11), by: 'u_louis', action: 'requested' });
    a.next = { title: 'Valider le plan du site', text: 'Le plan des pages est prêt. Regardez la vidéo de Clément, puis validez ou dites-nous ce que vous voulez changer. La direction artistique démarre juste après.', go: 'valider' };
    a.note = { text: 'Le plan du site est prêt : 7 pages, avec une page par atelier comme on en a parlé en visio. Clément démarre les premières pistes graphiques dès votre feu vert.', by: 'u_louis', at: at(-1, 17) };
    a.meeting = { title: 'Point d’étape (visio, 30 min)', when: at(8, 10) };
    a.tasks = [{ id: 't1', t: 'Réserver la visio de cadrage', done: true }, { id: 't2', t: 'Régler l’acompte de 50 %', done: true, auto: 'acompte', go: 'documents' }];
    a.missing = [{ id: 'm1', t: 'Photos de l’équipe', sub: 'Pour la page À propos. Portraits ou photos de groupe.' }, { id: 'm2', t: '2 ou 3 témoignages clients', sub: 'Un texte court suffit, on s’occupe de la mise en forme.' }];
    a.billing = { totalHT: 6900, totalTTC: 8280, quote: 'D-2026-0142', signedAt: at(-15, 15) };
    a.invoices = [
      { id: 'inv1', num: 'F-2026-0187', label: 'Facture d’acompte (50 %)', ht: 3450, ttc: 4140, status: 'paid', date: at(-14, 9), paidAt: at(-13, 10) },
      { id: 'inv2', num: '', label: 'Facture de solde (50 %)', ht: 3450, ttc: 4140, status: 'future', date: null }
    ];
    a.links = { figma: 'https://www.figma.com/design/exemple-maison-lumen', proto: 'https://www.figma.com/proto/exemple-maison-lumen-plan', preview: '', site: 'https://www.maisonlumen.fr' };
    a.files = [
      f('Plan du site, version 1 (Figma)', 'Livrable', 'agence', 'u_clement', at(-2, 11), 0, { url: 'https://www.figma.com/proto/exemple-maison-lumen-plan' }),
      f('Compte rendu de la visio de cadrage.pdf', 'Livrable', 'agence', 'u_louis', at(-9, 16), 412000),
      f('Devis D-2026-0142 signé.pdf', 'Devis', 'agence', 'u_louis', at(-15, 15), 98000),
      f('Facture F-2026-0187.pdf', 'Facture', 'agence', 'u_louis', at(-14, 9), 87000),
      f('IBAN ICONOKOM.pdf', 'RIB', 'agence', 'u_louis', at(-14, 9), 61000),
      f('Film de marque.mp4', 'Vidéos', 'client', 'u_claire', at(-5, 14), 212000000),
      f('Charte graphique 2019.pdf', 'Textes', 'client', 'u_claire', at(-6, 9), 4100000),
      f('Texte À propos.docx', 'Textes', 'client', 'u_claire', at(-3, 18), 32000, { seen: false }),
      f('Photos atelier (12 fichiers).zip', 'Images', 'client', 'u_claire', at(-7, 10), 86000000),
      f('Logo Maison Lumen.svg', 'Images', 'client', 'u_claire', at(-11, 12), 48000)
    ];
    a.messages = [
      { id: 'lm1', fromAgency: true, readByClient: false, by: 'u_clement', at: at(-2, 11), text: 'Claire, je vous présente le plan du site en vidéo, page par page, avant que vous le validiez.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Le plan du site expliqué', duration: '4 min' } },
      { id: 'lm2', fromAgency: true, by: 'u_louis', at: at(-9, 16), text: 'Merci pour la visio de cadrage ! Le compte rendu est dans vos fichiers.' }
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
    const due = { 'Proposition commerciale': '2025-11-17', 'Devis signé': '2025-11-20', 'Visio de cadrage (1 h)': '2025-11-26', 'Plan du site (arborescence)': '2025-12-16', 'Direction artistique': '2026-02-06', 'Textes du site': '2026-02-06', 'Maquettes du site': '2026-03-13', 'Création du compte Webflow': '2026-03-18', 'Construction du site': '2026-05-29', 'Recette du site': '2026-06-10', 'Mise en ligne et remise des accès': '2026-06-15', 'Formation Webflow (visio)': '2026-06-22', 'Bilan à 30 jours': '2026-07-15', 'Proposition d’évolution': at(6) };
    b.phases.forEach((ph) => ph.items.forEach((i) => { if (due[i.t]) i.due = iso(due[i.t]); }));
    done(b, at(0));
    b.phases[3].items[1].status = 'on';
    [['plan', '2025-12-16'], ['da', '2026-02-06'], ['maquettes', '2026-03-13'], ['site', '2026-06-10'], ['pv', '2026-06-16']].forEach(([k, d]) => { b.validations.find((v) => v.key === k).due = iso(d); approve(b, k, iso(d + 'T15:00:00.000Z'), 'u_hugo'); });
    b.next = { title: 'Ton site est en ligne', text: 'Il génère environ 5 demandes qualifiées par semaine. Pour qu’il continue de progresser, on peut le faire évoluer chaque mois avec toi.', go: 'outils' };
    b.note = { text: 'Point à 4 mois envoyé : chaque associé ressort en position 1 sur son nom, et 68 % du trafic vient de la recherche Google, sans budget média. Prochaine étape proposée : le parcours des formulaires d’annonces.', by: 'u_louis', at: at(-6, 17) };
    b.meeting = { title: 'Point évolution du site (visio, 30 min)', when: at(6, 11) };
    b.billing = { totalHT: 9800, totalTTC: 11760, quote: 'D-2025-0098', signedAt: '2025-11-20T10:00:00.000Z' };
    b.invoices = [
      { id: 'hinv1', num: 'F-2025-0131', label: 'Facture d’acompte (50 %)', ht: 4900, ttc: 5880, status: 'paid', date: '2025-11-21T10:00:00.000Z', paidAt: '2025-11-28T10:00:00.000Z' },
      { id: 'hinv2', num: 'F-2026-0112', label: 'Facture de solde (50 %)', ht: 4900, ttc: 5880, status: 'paid', date: '2026-06-15T10:00:00.000Z', paidAt: '2026-06-22T10:00:00.000Z' }
    ];
    b.links = { figma: 'https://www.figma.com/design/irfVpJlJI85XG3Cv2h7cK5/Huchet-Demorge', proto: 'https://www.figma.com/proto/irfVpJlJI85XG3Cv2h7cK5/Huchet-Demorge', preview: '', site: 'https://www.huchet-demorge.fr/' };
    b.results = { period: 'Depuis la mise en ligne, le 15 juin 2026', stats: [['~5', 'demandes qualifiées par semaine'], ['11 961', 'utilisateurs actifs'], ['22 825', 'clics depuis Google'], ['68 %', 'du trafic vient de la recherche Google']] };
    b.brand = { colors: [['Cognac', '#A8552D'], ['Cuivre', '#D67C53'], ['Pierre', '#EFE6DC'], ['Nuit', '#160700']], fonts: [['Titres', 'Sans géométrique, capitales espacées'], ['Texte', 'Sans humaniste']] };
    b.tools = ['teaser', 'brand', 'signature', 'request', 'webflow'];
    b.tutorials = [{ t: 'Modifier un texte ou une image', d: '3 min', url: '' }, { t: 'Ajouter un hôtel ou une boulangerie à vendre', d: '4 min', url: '' }, { t: 'Publier un article', d: '3 min', url: '' }, { t: 'Publier ses changements en toute sécurité', d: '2 min', url: '' }];
    b.handover = HANDOVER.map((t) => ({ t, done: true }));
    b.assets = [
      { id: 'a1', kind: 'Réalisation', title: 'Visuel de couverture du cas client', img: 'assets/hd/cover.jpg', url: 'https://www.agence-orem.fr/realisations/huchet-demorge' },
      { id: 'a2', kind: 'Réalisation', title: 'Mise en scène du site sur mobile', img: 'assets/hd/ecran-1.jpg' },
      { id: 'a3', kind: 'Réalisation', title: 'Pages annonces d’hôtels', img: 'assets/hd/ecran-2.jpg' },
      { id: 'a4', kind: 'Réalisation', title: 'Monogramme HD', img: 'assets/hd/ecran-3.jpg' },
      { id: 'a5', kind: 'Cas d’étude', title: 'Cas client Huchet-Demorge sur agence-orem.fr', img: 'assets/hd/cover.jpg', url: 'https://www.agence-orem.fr/realisations/huchet-demorge' },
      { id: 'a6', kind: 'Maquettes', title: 'Fichier Figma complet (maquettes et composants)', url: b.links.figma },
      { id: 'a7', kind: 'Maquettes', title: 'Prototype interactif', url: b.links.proto }
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
      f('Textes des annonces.docx', 'Textes', 'client', 'u_hugo', '2025-12-10T11:00:00.000Z', 64000),
      f('Photos du cabinet (24 fichiers).zip', 'Images', 'client', 'u_hugo', '2025-12-04T09:00:00.000Z', 154000000),
      f('Logo Huchet-Demorge HD.svg', 'Images', 'client', 'u_hugo', '2025-11-27T10:00:00.000Z', 52000)
    ];
    b.activity = [{ at: at(-5, 9), by: 'u_hugo', text: 'a demandé une évolution : formulaires', seen: false }];

    /* Exemple 3 : Cabinet Varenne (fictif), tout début de projet, Julie découvre son espace. */
    const c = newProject({ client: 'Cabinet Varenne', projet: 'Refonte cabinet-varenne.fr', contactName: 'Julie', start: at(-1), registre: 'vous', amountHT: 7600, offer: 'site' });
    c.id = 'p_varenne'; c.phase = 1;
    c.phases[0].items[0].status = 'done'; c.phases[0].items[1].status = 'done';
    c.next = { title: 'Réserver la visio de cadrage', text: 'Une heure pour caler ensemble vos objectifs, vos cibles et le plan du site. Choisissez le créneau qui vous arrange.', go: 'cal' };
    c.tasks = [{ id: 'vt1', t: 'Réserver la visio de cadrage (1 h)', done: false, go: 'cal' }, { id: 'vt2', t: 'Régler l’acompte de 50 %', done: false, go: 'documents', auto: 'acompte' }];
    c.missing = [{ id: 'vm1', t: 'Logo et charte actuelle', sub: 'Les fichiers que vous avez, même anciens.' }, { id: 'vm2', t: 'Photos du cabinet et de l’équipe', sub: 'Si vous en avez déjà, sinon on en parle en visio.' }];
    c.billing.quote = 'D-2026-0151'; c.billing.signedAt = at(-3, 15);
    c.invoices = [{ id: 'vinv1', num: 'F-2026-0199', label: 'Facture d’acompte (50 %)', ht: 3800, ttc: 4560, status: 'due', date: at(-1, 9) }, { id: 'vinv2', num: '', label: 'Facture de solde (50 %)', ht: 3800, ttc: 4560, status: 'future', date: null }];
    c.files = [f('Devis D-2026-0151 signé.pdf', 'Devis', 'agence', 'u_theo', at(-3, 15), 97000), f('Facture F-2026-0199.pdf', 'Facture', 'agence', 'u_theo', at(-1, 9), 88000), f('IBAN ICONOKOM.pdf', 'RIB', 'agence', 'u_theo', at(-1, 9), 61000)];
    c.messages = [{ id: 'vm-1', fromAgency: true, readByClient: false, by: 'u_theo', at: at(-1, 10), text: 'Bienvenue Julie ! Petite vidéo de 2 minutes pour vous présenter votre espace et la suite du projet.', loom: { url: 'https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3', title: 'Bienvenue dans votre espace', duration: '2 min' } }];
    c.activity = [];

    users.push(
      { id: 'u_claire', email: 'claire@maisonlumen.fr', name: 'Claire', role: 'client', projectId: a.id },
      { id: 'u_hugo', email: 'hugo@huchet-demorge.fr', name: 'Hugo', role: 'client', projectId: b.id, onboardedAt: '2025-11-24T10:00:00.000Z', prefs: { mail: true, weekly: true } },
      { id: 'u_julie', email: 'julie@cabinet-varenne.fr', name: 'Julie', role: 'client', projectId: c.id }
    );
    users.find((u) => u.id === 'u_louis').notify = { email: 'instant', events: { files: true, messages: true, validations: true, requests: true, activity: false } };
    users.find((u) => u.id === 'u_theo').notify = { email: 'digest', events: { files: true, messages: true, validations: true, requests: true, activity: false } };
    users.find((u) => u.id === 'u_clement').notify = { email: 'instant', events: { files: true, messages: true, validations: true, requests: false, activity: false } };
    a.team = { lead: 'u_louis', members: ['u_louis', 'u_clement'] };
    b.team = { lead: 'u_louis', members: ['u_louis', 'u_theo', 'u_clement'] };
    c.team = { lead: 'u_theo', members: ['u_theo', 'u_louis'] };
    const N = (userId, p, type, text, by, d, go) => ({ id: uid('n'), userId, projectId: p.id, client: p.client, type, text, by, at: d, read: false, go: { view: 'admin', tab: go } });
    const notifications = [
      N('u_louis', a, 'files', 'Claire a déposé « Texte À propos.docx »', 'u_claire', at(-3, 18), 'fichiers'),
      N('u_clement', a, 'files', 'Claire a déposé « Texte À propos.docx »', 'u_claire', at(-3, 18), 'fichiers'),
      N('u_louis', b, 'requests', 'Hugo demande une évolution (Formulaires) : « Indiquer l’annonce concernée dans chaque e-mail de contact »', 'u_hugo', at(-5, 9), 'messages'),
      N('u_theo', b, 'requests', 'Hugo demande une évolution (Formulaires) : « Indiquer l’annonce concernée dans chaque e-mail de contact »', 'u_hugo', at(-5, 9), 'messages'),
      N('u_clement', a, 'activity', 'Louis a demandé la validation du plan du site', 'u_louis', at(-2, 11), 'validations')
    ];
    return { users, projects: [a, b, c], notifications, outbox: [] };
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
  function phaseState(project, ph) {
    if (project.deliveredAt && ph.n < project.phases.length) return 'done';
    if (ph.n < project.phase) return 'done';
    if (ph.n === project.phase) return 'on';
    return 'wait';
  }

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
      lastActivity: project.activity[0] || null, team: project.team || { lead: null, members: [] } };
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
  const CLIENT_ACTIONS = new Set(['val.approve', 'val.changes', 'task.toggle', 'missing.done', 'user.onboarded', 'msg.post', 'msg.read', 'request.add', 'review.add']);

  /* ---------- Validation des données entrantes ----------
     Tout ce qui vient du navigateur est borné en taille, et les liens doivent être en https. */
  const SHORT = new Set(['type', 'kind', 'priority', 'title', 't', 'sub', 'label', 'num', 'name', 'client', 'projet', 'contactName', 'status', 'lead', 'iid', 'vid', 'tid', 'mid', 'fid', 'rid', 'aid', 'id', 'go', 'registre', 'quote', 'email', 'duration', 'cat', 'offer', 'level']);
  const URLS = new Set(['link', 'url', 'figma', 'proto', 'preview', 'site', 'img', 'review', 'video']);
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
    if (typeof v === 'string') return URLS.has(key) ? safeUrl(v, key) : v.slice(0, SHORT.has(key) ? 200 : 4000);
    if (Array.isArray(v)) return v.slice(0, 50).map((x) => clean(x, key, depth + 1));
    if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v).slice(0, 40)) o[k] = clean(v[k], k, depth + 1); return o; }
    return undefined;
  }
  const validDate = (d) => d !== undefined && d !== null && d !== '' && !isNaN(new Date(d).getTime());

  function log(project, user, text) {
    project.activity.unshift({ at: iso(Date.now()), by: user.id, text, seen: user.role === 'admin' });
    if (project.activity.length > 200) project.activity.length = 200;
  }

  function applyInner(store, projectId, user, action) {
    const project = store.projects.find((p) => p.id === projectId);
    if (!project || !canSee(user, project)) return { error: 'Projet introuvable.' };
    if (action.type === 'file.add' && !action.__internal) return { error: 'Action inconnue.' };
    if (user.role !== 'admin' && !CLIENT_ACTIONS.has(action.type) && !(action.type === 'file.add' && action.__internal)) return { error: 'Action réservée à l’agence.' };
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
        if (t.auto && user.role !== 'admin') return { error: 'Cette action se coche toute seule.' };
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
        if (project.files.some((f) => f.id === fl.id)) return { error: 'Fichier déjà enregistré.' };
        const rec = { id: fl.id || uid('f'), name: String(fl.name).slice(0, 200), cat: cats.includes(fl.cat) ? fl.cat : (user.role === 'admin' ? 'Livrable' : 'Autres'),
          from: user.role === 'admin' ? 'agence' : 'client', by: user.id, at: now, size: Number(fl.size) || 0, seen: user.role === 'admin', path: fl.path || undefined };
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
        const when = action.when && validDate(action.when) ? iso(action.when) : now;
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
        project.brand = { colors, fonts }; break;
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
        if (!(score >= 1 && score <= 5)) return { error: 'Choisissez une note de 1 à 5.' };
        project.review = { score, text: String(action.text || '').slice(0, 2000), public: !!action.public, by: user.id, at: now };
        log(project, user, 'a laissé un avis (' + score + '/5)'); break;
      }
      case 'project.archive':
        project.archivedAt = action.undo ? null : now; break;
      default: return { error: 'Action inconnue.' };
    }
    return { ok: true };
  }

  /* ---------- Notifications ----------
     Une action du client prévient l'équipe du projet ; une action de l'équipe prévient le client
     et les autres membres de l'équipe. Chacun règle ce qu'il reçoit et à quel rythme. */
  const EVENT = {
    'file.add': 'files', 'msg.post': 'messages', 'val.approve': 'validations', 'val.changes': 'validations',
    'request.add': 'requests', 'val.request': 'validations', 'user.onboarded': 'activity', 'asset.add': 'files', 'next.set': 'activity', 'note.set': 'activity'
  };
  const TAB = { files: 'fichiers', messages: 'messages', validations: 'validations', requests: 'messages', activity: 'activite' };
  const CLIENT_VIEW = { files: 'fichiers', messages: 'messages', validations: 'valider', activity: 'accueil', requests: 'outils' };
  const DEFAULT_PREFS = { email: 'instant', events: { files: true, messages: true, validations: true, requests: true, activity: false } };
  const prefsOf = (u) => ({ ...DEFAULT_PREFS, ...(u.notify || {}), events: { ...DEFAULT_PREFS.events, ...((u.notify || {}).events || {}) } });
  function describe(action, user, project, res, audience) {
    const who = user.name.split(' ')[0];
    switch (action.type) {
      case 'file.add': return `${who} a déposé « ${res.file ? res.file.name : 'un fichier'} »`;
      case 'msg.post': return action.loom && action.loom.url ? `${who} a envoyé une vidéo : ${action.loom.title || 'vidéo'}` : `${who} : « ${String(action.text).slice(0, 120)} »`;
      case 'val.approve': { const v = project.validations.find((x) => x.id === action.vid); return `${who} a validé : ${v ? v.t.toLowerCase() : 'une étape'}`; }
      case 'val.changes': { const v = project.validations.find((x) => x.id === action.vid); return `${who} demande des modifications : ${v ? v.t.toLowerCase() : ''} « ${String(action.comment).slice(0, 100)} »`; }
      case 'val.request': { const v = project.validations.find((x) => x.id === action.vid), what = v ? v.t.toLowerCase() : 'une étape'; return audience === 'client' ? `${who} attend ${project.registre === 'tu' ? 'ta' : 'votre'} validation : ${what}` : `${who} a demandé la validation : ${what}`; }
      case 'request.add': return `${who} demande une évolution (${action.kind || 'autre'}) : « ${String(action.text).slice(0, 100)} »`;
      case 'user.onboarded': return `${who} a découvert son espace`;
      case 'asset.add': return `${who} a ajouté « ${action.title} » à la bibliothèque`;
      case 'next.set': return `${who} a mis à jour la prochaine étape`;
      case 'note.set': return `${who} a publié le point de la semaine`;
    }
    return '';
  }
  function notifyFor(store, project, user, action, res) {
    const type = EVENT[action.type]; if (!type) return [];
    if (action.type === 'file.add' && user.role === 'admin' && res.file && res.file.cat !== 'Livrable') return [];
    store.notifications = store.notifications || [];
    const team = (project.team && project.team.members && project.team.members.length) ? project.team.members : store.users.filter((u) => u.role === 'admin').map((u) => u.id);
    let to;
    if (user.role === 'admin') {
      // l'équipe voit ce que font les collègues ; le client est prévenu de ce qui le concerne
      const clientTypes = ['files', 'messages', 'validations', 'activity'];
      to = team.filter((id) => id !== user.id).map((id) => ({ id, audience: 'team' }));
      if (clientTypes.includes(type) && action.type !== 'next.set') to = to.concat(store.users.filter((u) => u.projectId === project.id).map((u) => ({ id: u.id, audience: 'client' })));
    } else {
      to = team.map((id) => ({ id, audience: 'team' })).concat(store.users.filter((u) => u.projectId === project.id && u.id !== user.id).map((u) => ({ id: u.id, audience: 'client' })));
    }
    const at = iso(Date.now());
    const out = [];
    for (const r of to) {
      const u = store.users.find((x) => x.id === r.id); if (!u) continue;
      const text = describe(action, user, project, res, r.audience);
      const n = { id: uid('n'), userId: u.id, projectId: project.id, client: project.client, type, text, by: user.id, at, read: false, reg: r.audience === 'client' ? project.registre : undefined,
        go: r.audience === 'team' ? { view: 'admin', tab: TAB[type] } : { view: CLIENT_VIEW[type] } };
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
      else if (!(u.prefs ? u.prefs.mail : true) || n.type === 'activity') continue;
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
    return { to: u.email, name: u.name, subject, html, text: items.map((n) => `${n.client} : ${n.text}`).join('\n') + `\n\n${baseUrl}/` };
  }
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function apply(store, projectId, user, rawAction, internal) {
    if (!rawAction || typeof rawAction !== 'object' || Array.isArray(rawAction) || typeof rawAction.type !== 'string') return { error: 'Requête invalide.' };
    let action;
    try { action = clean(rawAction); } catch (e) { return { error: e.message === 'LINK' ? 'Lien invalide : utilisez une adresse qui commence par https://' : 'Requête invalide.' }; }
    if (internal) action.__internal = true; else delete action.__internal;
    const project0 = store.projects.find((p) => p.id === projectId);
    const snap = project0 ? JSON.stringify(project0) : null, usersSnap = JSON.stringify(store.users);
    let res;
    try { res = applyInner(store, projectId, user, action); }
    catch (e) {
      // Rien ne doit rester à moitié modifié.
      if (project0) Object.assign(project0, JSON.parse(snap));
      store.users.splice(0, store.users.length, ...JSON.parse(usersSnap));
      return { error: 'Requête invalide.' };
    }
    if (res.error) return res;
    const project = store.projects.find((p) => p.id === projectId);
    res.notices = notifyFor(store, project, user, action, res);
    return res;
  }

  /* Dépôt de fichier : seul le serveur (ou la démo) crée l'enregistrement, après avoir écrit le fichier. */
  function addFile(store, projectId, user, meta) {
    return apply(store, projectId, user, { type: 'file.add', file: { id: String(meta.id || ''), name: String(meta.name || 'fichier'), size: Number(meta.size) || 0, cat: meta.cat, path: meta.path } }, true);
  }

  /* Réglages de l'agence (coordonnées bancaires, liens de réservation…) : plus rien d'écrit en dur dans l'interface. */
  const DEFAULT_SETTINGS = {
    holder: 'ICONOKOM', address: '34 place du Général de Gaulle, Bureau 3, 59000 Lille', iban: 'FR76 1695 8000 0188 1420 4296 259', bic: 'QNTOFRP1XXX', bank: 'Qonto',
    booking: 'https://app.iclosed.io/e/Orem/rdv-30min', training: 'https://app.iclosed.io/e/Orem/rdv-30min', reviewUrl: '', site: 'https://www.agence-orem.fr'
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

  /* Relances automatiques : une validation qui attend depuis plus de 3 jours ouvrés déclenche un rappel au client (une seule fois). Complété au lot 5. */
  function runReminders(store, now) { return { notices: [] }; }

  function loginMail(user, code, link, registre) {
    const tu = user.role === 'admin' || registre === 'tu', T = (v, t) => (tu ? t : v);
    const first = esc(String(user.name || '').split(' ')[0]);
    return { to: user.email, name: user.name, subject: `${T('Votre', 'Ton')} code de connexion : ${code}`, text: `Code : ${code}\nLien : ${link}\nValable 15 minutes.`,
      html: `<div style="background:#f3f2ef;padding:32px 16px;font-family:Arial,Helvetica,sans-serif"><table width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px" cellpadding="0" cellspacing="0"><tr><td style="font-family:Georgia,serif;font-size:22px;color:#000012;padding-bottom:16px">Orem</td></tr><tr><td style="font-size:15px;color:#0b0b12">Bonjour ${first},</td></tr><tr><td style="font-size:15px;color:#2f2f3a;padding:8px 0 16px">${T('Votre', 'Ton')} code de connexion à l\u2019espace Orem :</td></tr><tr><td style="font-size:30px;letter-spacing:.2em;font-weight:bold;color:#000012">${esc(code)}</td></tr><tr><td style="padding-top:20px"><a href="${esc(link)}" style="display:inline-block;background:#092482;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px">Se connecter</a></td></tr><tr><td style="font-size:12px;color:#585865;padding-top:16px">Valable 15 minutes. ${T('Si vous n\u2019avez rien demandé, ignorez', 'Si tu n\u2019as rien demandé, ignore')} cet e-mail.</td></tr></table></div>` };
  }

  /* Boîte de réception et préférences (par personne). */
  function inbox(store, user) { return (store.notifications || []).filter((n) => n.userId === user.id).slice(0, 200); }
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
    const p = newProject(data);
    p.team = { lead: user.id, members: [user.id] };
    store.projects.unshift(p);
    if (data.email) {
      const r = apply(store, p.id, user, { type: 'user.add', email: data.email, name: data.contactName });
      if (r.error) { store.projects.shift(); return r; }
    }
    log(p, user, 'a créé l’espace');
    return { ok: true, id: p.id };
  }

  return { seed, newProject, OFFERS, OREM, itemState, phaseState, offerOf: (p) => (OFFERS[p.offer] || OFFERS.site).label, apply, addFile, createProject, summary, forUser, nextStep, alerts, canSee, inbox, readNotif, setPrefs, prefsOf, emailsFor, digestFor, loginMail, publicConfig, setSettings, settingsOf, runReminders, FILE_CATS, AGENCY_CATS };
});
