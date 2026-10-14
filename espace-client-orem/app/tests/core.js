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
const d = Core.apply(db, 'p_lumen', by('u_louis'), { type: 'project.deliver' });
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

console.log(R.join('\n'));
process.exitCode = R.some((l) => l.startsWith('✘')) ? 1 : 0;
