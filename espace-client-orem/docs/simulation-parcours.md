# Simulation de 5 parcours clients

Simulation automatisée dans Chromium, sur le serveur local (vraie connexion par code, vrais droits), le 14 octobre 2026. Chaque tâche part de l'accueil. Un « clic » compte chaque action de l'utilisateur (le texte saisi ne compte pas).

Script : `app/tests/simulation.js` (Playwright + axe-core ; lancer le serveur sur le port 3123 puis `node tests/simulation.js`). Résultat : **25 tâches sur 25 réussies**, aucune erreur JavaScript, aucune page plus large que l'écran, **0 problème d'accessibilité axe-core (WCAG 2 A et AA)** après corrections.

## Les 5 profils

| Profil | Situation | Appareil |
|---|---|---|
| Julie, Cabinet Varenne | Tout début de projet, première connexion, peu à l'aise avec le numérique | Mobile |
| Claire, Maison Lumen | En pleine phase de design, une validation attend | Ordinateur |
| Hugo, Huchet-Demorge | Site livré, pressé | Mobile |
| Nina, Huchet-Demorge | Assistante invitée par l'agence, première connexion | Ordinateur |
| Claire au clavier | Clavier seul, mode sombre, zoom 200 % (malvoyante) | Ordinateur |

## Résultats par tâche

| Profil | Tâche | Clics |
|---|---|---|
| Julie | Comprendre quoi faire en premier | 0 (affiché en haut de l'accueil) |
| Julie | Réserver la visio de cadrage | 0 de navigation (bouton direct dans « Prochaine étape ») |
| Julie | Trouver la facture d'acompte à régler | 1 |
| Julie | Copier l'IBAN | 1 |
| Julie | Déposer son logo | 1 (+ choix du fichier) |
| Julie | Voir la vidéo de bienvenue de Louis | 1 |
| Julie | Voir les maquettes (pas encore prêtes, message clair) | 2 |
| Claire | Regarder la vidéo de Clément | 1 |
| Claire | Valider le plan du site | 2 |
| Claire | Voir les maquettes | 1 |
| Claire | Connaître le prochain rendez-vous | 0 |
| Claire | Savoir ce qu'il reste à payer | 1 |
| Claire | Retrouver le compte rendu de visio | 1 |
| Claire | Écrire à l'équipe | 2 |
| Hugo | Voir les résultats du site | 0 |
| Hugo | Préparer une fiche teaser de bien | 1 |
| Hugo | Demander une évolution | 3 (1 depuis le bloc Évolution de l'accueil) |
| Hugo | Retrouver le guide Webflow | 1 |
| Hugo | Ouvrir le fichier Figma | 1 |
| Hugo | Récupérer les visuels du cas client | 1 |
| Nina | Trouver les couleurs de la marque | 1 |
| Nina | Préparer une fiche boulangerie | 2 |
| Nina | Retrouver la dernière facture | 1 |
| Louis (agence) | Donner l'accès à Nina | 3 |
| Claire au clavier | Atteindre le message non lu | 3 tabulations (lien « Aller au contenu » en premier) |

Toutes les informations sont à **2 clics au maximum** depuis l'accueil, sauf la demande d'évolution par la boîte à outils (3), qui a un raccourci en 1 clic.

## Cloisonnement des données

| Test | Résultat |
|---|---|
| Julie demande le projet Huchet-Demorge | Refusé (404) |
| Julie demande le projet Maison Lumen | Refusé (404) |
| Julie tente une action réservée à l'agence | Refusé (400) |

## Ce que la simulation a fait corriger

| Constat | Correction |
|---|---|
| Julie devait passer par « Plus » puis « Documents » pour payer l'acompte (2 clics sur mobile) | Les actions de l'accueil ont un bouton direct (« Ouvrir », « Réserver ») : 1 clic |
| « Réserver la visio » envoyait vers la page Équipe, puis un 2e clic | Le bouton de la prochaine étape ouvre directement la prise de rendez-vous |
| Hugo mettait 3 clics pour la fiche teaser | Raccourci « Fiche teaser » sur l'accueil d'un projet livré : 1 clic |
| L'accueil guidé de Nina (projet livré) affichait le planning et « Rien à faire » | Accueil guidé adapté aux projets livrés : ce que contient l'espace, 3 raccourcis |
| Au clavier, 21 tabulations pour atteindre le contenu | Lien « Aller au contenu » en premier : 3 tabulations |
| Contraste insuffisant des titres de rubriques de la barre latérale (4,1:1) | Remonté au-dessus de 4,5:1 |
| Fil de messages défilant non atteignable au clavier | Rendu focalisable, annoncé comme « Conversation » |
| Ville de la fiche teaser en cuivre sur fond pierre (contraste faible) | Teinte assombrie |

## Points positifs relevés

- La prochaine étape est toujours visible sans cliquer, avec un seul bouton.
- Les vidéos de l'équipe sont signalées dès l'accueil (bandeau « Clément vous a envoyé une vidéo »).
- Sur mobile, la barre du bas couvre l'essentiel (accueil, étapes, messages, fichiers) et « Plus » liste le reste.
- Un projet livré reste utile : résultats, outils du quotidien, bibliothèque, évolution.

## Points à surveiller (non bloquants)

- L'aperçu Figma et les vidéos Loom s'affichent intégrés en local seulement s'ils sont partagés publiquement (« Anyone with the link »). Sinon, le client voit un lien.
- La fiche teaser ne s'exporte en PDF qu'en local (bouton « PDF ») : la démo en ligne permet seulement de copier le texte.
- À tester avec de vrais clients : la compréhension du mot « Bibliothèque » et l'usage réel de la boîte à outils.
