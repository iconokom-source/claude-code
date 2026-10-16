/* Tests unitaires de la logique métier (sans navigateur) : node tests/core.js */
const Core = require('../public/core.js');
const R = []; const ok = (l, v) => R.push(`${v ? '✔' : '✘'} ${l}`);
const DAY = 864e5, now = Date.now();
const db = Core.seed(now);
const by = (id) => db.users.find((u) => u.id === id), P = (id) => db.projects.find((p) => p.id === id);

// États calculés
const lumen = P('p_lumen'), plan = lumen.phases[0].items.find((i) => i.val === 'plan');
ok('Plan du site (Lumen) : « À valider » tant que Claire n’a pas validé', Core.itemState(lumen, plan) === 'review');
const huchet = P('p_huchet');
ok('Huchet livré : les 3 premiers temps sont terminés, « Mesurer » en cours', huchet.phases.slice(0, 3).every((ph) => Core.phaseState(huchet, ph) === 'done') && Core.phaseState(huchet, huchet.phases[3]) === 'on');
ok('Lettres O, R, E, M sur les 4 temps', lumen.phases.map((p) => p.letter).join('') === 'OREM');
ok('Livraison Huchet affichée au 15 juin 2026', huchet.deliveredAt.startsWith('2026-06-15'));

// Offres
for (const k of Object.keys(Core.OFFERS)) { const p = Core.newProject({ client: 'X', offer: k }); ok(`Offre ${Core.OFFERS[k].label} : 4 temps O.R.E.M., ${p.validations.length} validation(s)`, p.phases.length === 4 && p.offer === k && p.validations.length > 0); }
const c = Core.createProject(db, by('u_louis'), { client: 'Atelier Test', offer: 'conseil', registre: 'tu', email: 'a@atelier-test.fr' });
ok('Création avec l’offre Conseil', c.ok && P(c.id).offer === 'conseil' && P(c.id).registre === 'tu');

// Registre dans les notifications et e-mails
const r1 = Core.apply(db, 'p_lumen', by('u_louis'), { type: 'val.request', vid: lumen.validations.find((v) => v.key === 'da').id });
const toClaire = r1.notices.find((n) => n.userId === 'u_claire');
ok('Claire (vous) : « Louis attend votre validation »', toClaire && /votre validation/.test(toClaire.text));
const mails = Core.emailsFor(db, r1.notices, 'http://x');
ok('E-mail à Claire au vouvoiement', mails.some((m) => m.to === 'claire@maisonlumen.fr' && /Vous recevez/.test(m.html) && !/Tu reçois/.test(m.html)));
const r2 = Core.apply(db, 'p_huchet', by('u_louis'), { type: 'msg.post', text: 'Hugo, voici la suite.' });
ok('E-mail à Hugo au tutoiement', Core.emailsFor(db, r2.notices, 'http://x').some((m) => m.to === 'hugo@huchet-demorge.fr' && /Tu reçois/.test(m.html)));
ok('E-mail de connexion au tutoiement pour Hugo', /Ton code/.test(Core.loginMail(by('u_hugo'), '123456', 'http://x', 'tu').subject));

// Point de la semaine par e-mail (promesse de l'accueil guidé)
const r3 = Core.apply(db, 'p_huchet', by('u_louis'), { type: 'note.set', text: 'Cette semaine : les formulaires.' });
ok('Point de la semaine envoyé par e-mail au client qui l’a demandé', Core.emailsFor(db, r3.notices, 'http://x').some((m) => m.to === 'hugo@huchet-demorge.fr' && /formulaires/.test(m.html)));
by('u_hugo').prefs.weekly = false;
const r4 = Core.apply(db, 'p_huchet', by('u_louis'), { type: 'note.set', text: 'Encore.' });
ok('… et pas à celui qui l’a refusé', !Core.emailsFor(db, r4.notices, 'http://x').some((m) => m.to === 'hugo@huchet-demorge.fr'));

// Relances automatiques
ok('Aucune relance aujourd’hui (plan prêt depuis 2 jours)', Core.runReminders(db, now).notices.length === 0);
const later = now + 6 * DAY, rr = Core.runReminders(db, later);
ok('Relance de Claire au bout de 3 jours ouvrés, au vouvoiement', rr.notices.some((n) => n.userId === 'u_claire' && /votre feu vert/.test(n.text)));
ok('L’équipe du projet voit la relance', rr.notices.some((n) => n.userId === 'u_louis' && /Relance automatique/.test(n.text)));
ok('Une seule relance par validation', Core.runReminders(db, later + DAY).notices.filter((n) => n.userId === 'u_claire').length === 0);
ok('Relance de la facture d’acompte non réglée (Varenne) après 10 jours', Core.runReminders(db, now + 12 * DAY).notices.some((n) => n.userId === 'u_julie' && /reste à régler/.test(n.text)));

// Mise en ligne, avis, archive
ok('Mise en ligne refusée sans procès-verbal validé', /procès-verbal/.test(Core.apply(db, 'p_lumen', by('u_louis'), { type: 'project.deliver' }).error || ''));
const d = Core.apply(db, 'p_lumen', by('u_louis'), { type: 'project.deliver', force: 'Client absent, réception validée par téléphone' });
ok('Livraison sans procès-verbal : motif tracé', !!(db.projects.find((p) => p.id === 'p_lumen').deliveredWithoutPv || {}).reason);
ok('Mise en ligne : temps « Mesurer » en cours, e-mail au client', d.ok && P('p_lumen').phase === 4 && Core.emailsFor(db, d.notices, 'http://x').some((m) => m.to === 'claire@maisonlumen.fr'));
ok('Après la mise en ligne, tous les livrables des 3 premiers temps sont faits', P('p_lumen').phases.slice(0, 3).every((ph) => ph.items.every((i) => Core.itemState(P('p_lumen'), i) === 'done')));
ok('Le client ne peut pas mettre en ligne lui-même', !!Core.apply(db, 'p_lumen', by('u_claire'), { type: 'project.deliver' }).error);
ok('Avis client : note de 1 à 5 obligatoire', !!Core.apply(db, 'p_huchet', by('u_hugo'), { type: 'review.add', score: 9 }).error);
const rv = Core.apply(db, 'p_huchet', by('u_hugo'), { type: 'review.add', score: 5, text: 'Top', public: true });
ok('Avis de Hugo enregistré, l’équipe est prévenue', rv.ok && P('p_huchet').review.score === 5 && rv.notices.some((n) => n.userId === 'u_louis'));
Core.apply(db, 'p_huchet', by('u_louis'), { type: 'project.archive' });
ok('Espace archivé : le client ne peut plus écrire', /archivé/.test(Core.apply(db, 'p_huchet', by('u_hugo'), { type: 'msg.post', text: 'x' }).error || ''));
ok('… mais l’agence peut le désarchiver', Core.apply(db, 'p_huchet', by('u_louis'), { type: 'project.archive', undo: true }).ok && !P('p_huchet').archivedAt);
ok('Réglages : un lien de réservation non https est refusé', !!Core.setSettings(db, by('u_louis'), { booking: 'javascript:alert(1)' }).error);
ok('Réglages réservés à l’équipe', !!Core.setSettings(db, by('u_claire'), { iban: 'FR00' }).error);

// Signature puis démarrage, invitation, fichiers attendus, recalage
const db2 = Core.seed(); const ines = db2.users.find((u) => u.id === 'u_ines'); const V = db2.projects.find((p) => p.id === 'p_vergers');
Core.apply(db2, 'p_vergers', ines, { type: 'proposal.accept', prid: 'pr_vergers', agree: true, name: 'Inès Delmas' });
ok('Signature : devis coché, acompte et rendez-vous de démarrage dans « À faire »', V.phases[0].items.find((i) => /Devis/.test(i.t)).status === 'done' && V.tasks.some((t) => t.auto === 'acompte') && V.tasks.some((t) => t.go === 'cal') && V.next.go === 'cal');
ok('Signature : fichiers attendus de l’offre ajoutés', V.missing.length >= 2);
const cp = Core.createProject(db2, db2.users.find((u) => u.id === 'u_louis'), { client: 'Sans registre', email: 'x@y.fr' });
ok('Création refusée sans registre explicite (côté serveur aussi)', /tutoiement/.test(cp.error || ''));
const cp2 = Core.createProject(db2, db2.users.find((u) => u.id === 'u_louis'), { client: 'Atelier Neuf', email: 'a@atelier-neuf.fr', registre: 'vous', offer: 'site' });
const nu = db2.users.find((u) => u.email === 'a@atelier-neuf.fr');
ok('Création : invitation à envoyer, Webflow et nom de domaine dans « Bien démarrer »', cp2.invite === nu.id && ['webflow', 'domaine'].every((k) => db2.projects[0].tasks.some((t) => t.auto === k && t.go === 'demarrer')));
ok('Création : les trois membres de l’équipe sur le projet', ['u_louis', 'u_theo', 'u_clement'].every((id) => db2.projects[0].team.members.includes(id)));
{ const P = db2.projects[0], pid = P.id, cl = nu, lo = db2.users.find((u) => u.id === 'u_louis');
  ok('Bien démarrer : le client déclare l’espace Webflow', !Core.apply(db2, pid, cl, { type: 'setup.webflow', ws: 'Atelier Neuf' }).error && !!P.tasks.find((t) => t.auto === 'webflow').sent);
  ok('Bien démarrer : le client ne peut pas cocher lui-même', !!Core.apply(db2, pid, cl, { type: 'setup.check', tid: P.tasks.find((t) => t.auto === 'webflow').id, ok: true }).error);
  ok('Bien démarrer : mot de passe refusé hors du coffre', !!Core.apply(db2, pid, cl, { type: 'setup.domain', mode: 'vault', domain: 'atelier-neuf.fr' }).error);
  ok('Bien démarrer : nom de domaine invalide refusé', !!Core.apply(db2, pid, cl, { type: 'setup.domain', mode: 'delegate', domain: 'pas un domaine' }).error);
  ok('Bien démarrer : accès délégué déclaré', !Core.apply(db2, pid, cl, { type: 'setup.domain', mode: 'delegate', domain: 'https://www.Atelier-Neuf.fr/', registrar: 'Gandi' }).error && P.tasks.find((t) => t.auto === 'domaine').info.domain === 'www.atelier-neuf.fr');
  const r = Core.apply(db2, pid, lo, { type: 'setup.check', tid: P.tasks.find((t) => t.auto === 'domaine').id, ok: true });
  ok('Bien démarrer : vérification par l’équipe, coffre à effacer', r.ok && r.purgeVault === true && P.tasks.find((t) => t.auto === 'domaine').done);
  ok('Logo du client : http refusé, image enregistrée sinon', !!Core.apply(db2, pid, lo, { type: 'project.logo', img: 'http://x.fr/l.png' }).error && !Core.apply(db2, pid, lo, { type: 'project.logo', img: 'https://x.fr/l.png', tone: 'mono' }).error && P.brand.logo === 'https://x.fr/l.png');
  ok('Logo du client : conservé quand on change les couleurs', !Core.apply(db2, pid, lo, { type: 'project.brand', colors: [['Bleu', '#112233']], fonts: [] }).error && P.brand.logo === 'https://x.fr/l.png'); }
const im = Core.inviteMail(nu, db2.projects[0], db2.users.find((u) => u.id === 'u_louis'), 'http://x');
ok('E-mail d’invitation au vouvoiement, signé par l’équipe', /Votre espace Atelier Neuf est prêt/.test(im.subject) && /L\u2019équipe Orem/.test(im.html) && /Louis, Théophile et Clément/.test(im.html) && !/\u2014/.test(im.html));
ok('Le client ne peut plus retirer un fichier attendu sans rien déposer', !!Core.apply(db2, 'p_varenne', db2.users.find((u) => u.id === 'u_julie'), { type: 'missing.done', mid: 'vm1' }).error);
ok('Relance des fichiers attendus après 5 jours ouvrés', Core.runReminders(db2, Date.now() + 9 * 864e5).notices.some((n) => n.userId === 'u_julie' && /il nous manque/.test(n.text)));
const db3 = Core.seed(); const vv = db3.projects.find((p) => p.id === 'p_varenne'); const g = vv.golive;
Core.runReminders(db3, Date.now() + 20 * 864e5);
ok('Recalage : une validation pas encore demandée par l’agence ne décale rien', vv.golive === g);
{ // Signature, Évolution, avis
  const d = Core.seed(), U = (id) => d.users.find((u) => u.id === id), claire = U('u_claire'), louis = U('u_louis'), hugo = U('u_hugo');
  const L = d.projects.find((p) => p.id === 'p_lumen'), H = d.projects.find((p) => p.id === 'p_huchet'), f = L.files.find((x) => x.sign);
  ok('Signature : le client ne peut pas signer sans passer par le serveur', !!Core.apply(d, 'p_lumen', claire, { type: 'file.sign', fid: f.id, name: 'Claire', agree: true }).error);
  ok('Signature : refusée sans la case cochée', !!Core.apply(d, 'p_lumen', claire, { type: 'file.sign', fid: f.id, name: 'Claire', agree: false }, true).error);
  ok('Signature : enregistrée avec la preuve', !Core.apply(d, 'p_lumen', claire, { type: 'file.sign', fid: f.id, name: 'Claire Lumen', agree: true, hash: 'abc', ip: '1.2.3.4', ua: 'test', sig: 'data:image/png;base64,AAAA' }, true).error && f.sign.status === 'signed' && f.sign.ip === '1.2.3.4' && f.sign.email === claire.email);
  ok('Signature : image refusée si ce n’est pas un PNG', (() => { const g = { id: 'fx', name: 'x.pdf', cat: 'Contrat', from: 'agence', sign: { status: 'requested' } }; L.files.push(g); Core.apply(d, 'p_lumen', claire, { type: 'file.sign', fid: 'fx', name: 'Claire', agree: true, sig: 'javascript:alert(1)' }, true); return g.sign.sig === ''; })());
  ok('Signature : un client ne peut pas demander de signature', !!Core.apply(d, 'p_lumen', claire, { type: 'file.signreq', fid: f.id }).error);
  ok('Évolution : Hugo demande un autre créneau, l’équipe est prévenue', (() => { const r = Core.apply(d, 'p_huchet', hugo, { type: 'evo.reschedule', text: 'Mardi matin' }); return !r.error && H.evo.reschedule.some((x) => x.status === 'open') && r.notices.some((n) => n.userId === 'u_louis'); })());
  ok('Évolution : la nouvelle date ferme la demande', !Core.apply(d, 'p_huchet', louis, { type: 'evo.set', meeting: { when: new Date(Date.now() + 9 * 864e5).toISOString(), mode: 'Visio' } }).error && !H.evo.reschedule.some((x) => x.status === 'open'));
  ok('Évolution : bilan du mois publié et trié', !Core.apply(d, 'p_huchet', louis, { type: 'evo.report', month: '2026-10', title: 'Octobre', stats: [['1', 'x', '+1']], done: [] }).error && H.evo.reports[0].month === '2026-10');
  ok('Évolution : le client ne peut pas modifier les axes', !!Core.apply(d, 'p_huchet', hugo, { type: 'evo.set', axes: [] }).error);
  ok('Évolution : une proposition Évolution signée active l’abonnement', (() => { const V = d.projects.find((p) => p.id === 'p_varenne'); Core.apply(d, 'p_varenne', louis, { type: 'proposal.save', title: 'Évolution', lines: [{ t: 'Mois', ht: 900 }], kind: 'evolution' }); const pr = V.proposals[0]; Core.apply(d, 'p_varenne', louis, { type: 'proposal.send', prid: pr.id }); Core.apply(d, 'p_varenne', U('u_julie'), { type: 'proposal.accept', prid: pr.id, agree: true, name: 'Julie V' }); return V.evo && V.evo.active === true; })());
  ok('Avis 2/5 : questionnaire obligatoire, jamais publié, appel proposé à l’équipe', !!Core.apply(d, 'p_huchet', hugo, { type: 'review.add', score: 2 }).error && !Core.apply(d, 'p_huchet', hugo, { type: 'review.add', score: 2, public: true, survey: { bad: 'Délais', call: true, axes: { delais: 2 } } }).error && H.review.public === false && H.review.survey.axes.delais === 2 && H.tasks.some((t) => t.auto === 'review-call') && !Core.forUser(H, hugo).tasks.some((t) => t.team));
  ok('Avis 5/5 : publié sur Google noté', !Core.apply(d, 'p_huchet', hugo, { type: 'review.add', score: 5, google: true, text: 'Top' }).error && H.review.google === true);
  ok('Qui fait quoi : rôles par défaut, au registre du client', Core.reg(Core.itemWho({ t: 'Tests du site' })[1][1], 'tu') === 'Tu testes le site et notes tes retours');
}
console.log(R.join('\n'));
process.exitCode = R.some((l) => l.startsWith('✘')) ? 1 : 0;
