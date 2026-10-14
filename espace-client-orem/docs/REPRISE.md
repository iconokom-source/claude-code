# Reprise du chantier « Espace client Orem »

Document de passation pour reprendre **exactement là où on s'est arrêtés** (session de Louis du 14 octobre 2026). À lire en entier avant de toucher au code.

---

## 1. Message à coller dans la nouvelle session Claude

> Tu reprends le chantier « Espace client Orem » de l'agence Orem (ICONOKOM). Le dépôt est `iconokom-source/claude-code`, branche `claude/blissful-pasteur-u33w5x`, PR #12 (brouillon). Commence par lire `espace-client-orem/docs/REPRISE.md` en entier, puis `docs/conception.md` et `docs/simulation-parcours.md`. Tout est en local : rien ne doit être mis en ligne ni branché sur un nom de domaine sans validation de Louis. Reprends le plan « 8 lots pour passer à 10/10 » à partir du **lot 1 (sécurité)**, en partant du brouillon `docs/reprise/server.wip.js`. Travaille lot par lot : coder, rejouer `tests/simulation.js` et `tests/equipe.js`, regénérer la démo (`node build-demo.js`), commit, push sur la même branche. Réponds en français, avec les règles d'écriture Orem.

---

## 2. Ce qu'on construit (la demande de Louis)

Remplacer l'espace client actuel (galerie Notion + Google Drive) par **une app web à la DA Orem**, sur un sous-domaine d'agence-orem.fr **plus tard**, avec connexion par identifiant (e-mail + code, pas de mot de passe, pas de compte Google). Demandes successives de Louis, toutes à respecter :

1. Inspiré des meilleurs portails clients (UX, accessibilité, design), lisible, fluide, moderne. DA Orem adaptée à une app (on peut sortir de la DA si c'est plus lisible).
2. Les clients déposent leurs documents ; deux rôles : clients et agence (admin).
3. **Tout en local** tant que ce n'est pas validé. Rien sur un domaine.
4. Ressembler davantage à **Never Boring AI** (app.neverboring.ai) : barre latérale sombre, grande feuille claire à points, cartes nettes, onglets en pilule, plus de contraste, tailles de police cohérentes.
5. « L'espace client du futur » : effet waouh à la réception, l'onboarding fait partie de la prestation.
6. Pas seulement un espace client : maquettes Figma en direct, messages et vidéos Loom de l'équipe, **outils** utiles au client, bibliothèque des assets (réalisations, cas d'études). Cas réel de référence : **Huchet-Demorge**, projet terminé.
7. Simuler 5 clients, mesurer les clics, l'accessibilité, l'accès aux bons documents.
8. Côté **équipe** (Louis, Théophile, Clément) : chacun peut tout ajouter (Loom, fichiers, liens…), tout recevoir, avec **notifications e-mail** quand un client dépose quelque chose.
9. Audit complet noté sur 10, puis **« Lance tout »** : appliquer les 8 lots ci-dessous.

---

## 3. État actuel (dernier commit de la branche)

**Lancer** : `cd espace-client-orem/app && node server.js` → http://localhost:3000 (Node 20+, aucune dépendance). Le code de connexion s'affiche à l'écran et dans le terminal en local. Supprimer `app/data/` pour repartir des données d'exemple.

**Comptes d'exemple** : agence `louis@agence-orem.fr`, `theophile@agence-orem.fr`, `clement@agence-orem.fr` ; clients `julie@cabinet-varenne.fr` (démarrage, vous), `claire@maisonlumen.fr` (en cours, vous), `hugo@huchet-demorge.fr` (livré, tu).

**Démo autonome** (sans serveur, données en mémoire) : `node build-demo.js` → `app/dist/espace-client-demo.html`. Publiée en artifact privé sur le compte de Louis : https://claude.ai/artifact/WBnaucQmcvNXdBjr4YECBT (un menu en bas de la barre latérale change de profil). Théophile ne la verra que si Louis la partage, ou s'il republie sa propre démo.

**Fichiers**

| Fichier | Rôle |
|---|---|
| `app/server.js` | Serveur HTTP sans dépendance : connexion, sessions, API, fichiers, e-mails (Brevo désactivé par défaut), récap 18 h |
| `app/public/core.js` | Logique métier partagée serveur et démo : modèle de projet, seed (3 clients), `apply()` (toutes les actions et les droits), notifications, e-mails |
| `app/public/app.js` | Interface (vanilla JS, rendu par `innerHTML`) : vues client, vues agence, accueil guidé, composer « Ajouter », etc. |
| `app/public/styles.css` | Design (tokens, clair et sombre) |
| `app/public/index.html` | Squelette + sprite d'icônes SVG |
| `app/build-demo.js` | Fabrique la démo autonome |
| `app/tests/simulation.js` | 5 profils clients, 25 tâches, axe-core, cloisonnement (serveur sur le port 3123) |
| `app/tests/equipe.js` | 14 vérifications du circuit équipe (serveur sur le port 3123) |
| `docs/conception.md` | Choix UX, DA, sécurité, côté équipe, envoi des e-mails |
| `docs/simulation-parcours.md` | Résultats de la simulation des 5 clients |
| `docs/reprise/server.wip.js` | **Brouillon** de réécriture sécurisée du serveur (lot 1), pas encore branché |

**Lancer les tests** : `PORT=3123 node server.js &` (après `rm -rf data`), puis `NODE_PATH=$(npm root -g) node tests/simulation.js` et `node tests/equipe.js`. axe-core : `npm install axe-core@4.10.2` dans un dossier temporaire (ou ajouter un `package.json`). Chromium : variable `CHROMIUM` (dans le cloud : `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`). Les deux tests passaient à 100 % au dernier commit.

**Ce qui existe** : côté client (accueil avec prochaine étape, chiffres clés, étapes, validations horodatées, maquettes, messages + vidéos Loom, fichiers, documents/factures/IBAN, boîte à outils : fiche teaser de bien, kit de marque, signature e-mail, demande d'évolution, vidéos Webflow ; bibliothèque ; équipe et aide ; réponses rapides ; accueil guidé en 4 écrans adapté au démarrage ou au projet livré ; confettis à la validation ; mode sombre ; mobile avec barre du bas). Côté agence : boîte de réception par personne, bouton « Ajouter pour un client » (message/vidéo, fichier, validation, bibliothèque, liens, point de la semaine), fiche client à onglets, équipe par projet (membres + chef de projet), réglages de notifications (instantané, récap 18 h, jamais ; par type), boîte d'envoi locale des e-mails avec aperçu, « Voir comme le client ».

---

## 4. Résultat de l'audit (4 relecteurs indépendants) : **5/10**

| Angle | Note |
|---|---|
| Sécurité et robustesse | 3/10 |
| Qualité du code | 5/10 |
| UX client | 6,5/10 |
| UX agence | 5,5/10 |
| Design visuel | 7/10 |
| Accessibilité | 6/10 |
| Mobile et performance | 6/10 |
| Effet waouh | 6/10 |
| Couverture du process agence | 4/10 |
| Marque et contenus | 6,5/10 |

Louis a validé : **« Lance tout »** = les 8 lots ci-dessous, dans l'ordre.

---

## 5. Le plan : 8 lots pour passer à 10/10

Statut au moment de la coupure : **lot 1 commencé** (brouillon `docs/reprise/server.wip.js`), lots 2 à 8 à faire.

### Lot 1. Sécurité et robustesse (en cours)

Failles vérifiées (fichier:ligne dans la version actuelle) :

- **C1** `server.js:12,117` : le code de connexion est renvoyé par l'API (`devCode`) dès que `NODE_ENV` n'est pas `production`. → N'afficher le code que si le serveur écoute en local ET sans envoi d'e-mail ; refuser de démarrer exposé sans HTTPS ni e-mail. *(fait dans le brouillon)*
- **C2** `server.js:163` : le lien magique est construit avec l'en-tête `Host` (empoisonnement). → Toujours `BASE_URL`. *(fait dans le brouillon)*
- **C3** `core.js` : `file.add` est autorisé aux clients via `/action` avec `path`, `id`, `url` fournis par le navigateur → plantage du serveur (EISDIR), lecture d'un fichier d'un autre projet, **remplacement du RIB de l'agence par un faux** (même `id`). → Retirer `file.add` des actions client et des actions tout court ; créer `Core.addFile(store, projectId, user, meta)` appelé **seulement** par le serveur après l'upload ; identifiants uniques ; au téléchargement vérifier `abs.startsWith(UPLOADS + sep)` + `isFile()` + gestion d'erreur des flux. *(serveur fait dans le brouillon, `Core.addFile` à écrire)*
- **C4** `server.js:29-36` : sauvegarde repoussée indéfiniment, base qui gonfle (aucune limite de longueur sur `kind`, `priority`, titres, URL) → plantage `Invalid string length`. → Sauvegarde plafonnée (brouillon) + **limites de longueur sur tous les champs** dans `core.js`.
- **I1** limitation par IP et blocage après 10 échecs/24 h ; ne pas réinitialiser les essais quand un nouveau code est demandé *(brouillon)*.
- **I2** limiter les actions par utilisateur, regrouper les e-mails instantanés (2 min) *(brouillon)*.
- **I3** valider **avant** de modifier (ex. `project.update` avec date invalide modifie quand même le nom) ; messages d'erreur génériques ; refuser un corps non objet. → Dans `Core.apply` : cloner le projet, restaurer en cas d'exception, et valider dates/tableaux.
- **I4** `file.remove` et upload interrompu laissent les fichiers sur le disque ; quota par projet *(brouillon côté serveur)*.
- **I5** cookie mal formé = 400 sur tout le site *(brouillon)*.
- **I6** en-têtes CSP, X-Frame-Options, HSTS, COOP *(brouillon)*.
- **I7** sessions et codes stockés hachés (sha256), purge, « déconnecter partout », cookie `__Host-sid` en HTTPS *(brouillon)*.
- **M1** n'accepter que des URL `https:` pour Loom, Figma, liens, assets (`core.js`).
- **M2** échapper le nom dans l'e-mail de connexion ; aperçu d'e-mail dans `<iframe sandbox srcdoc>`.
- **M3** le lien magique ne doit plus se consommer par GET : `/auth/<jeton>` sert l'app, qui affiche « Confirmer la connexion » et appelle `POST /api/auth/link` *(serveur fait, interface à faire dans app.js)*.
- **M5** `/api/me` ne doit plus renvoyer les réglages de l'agence aux clients *(brouillon)*.
- **M7** `uid()` avec `crypto.randomUUID()` (repli `Math.random` si indisponible, ex. démo en `file://`).

**Ce que le brouillon `server.wip.js` attend de `core.js` et d'un nouveau fichier `connectors.js`** (à créer pour qu'il démarre) :
`Core.addFile`, `Core.loginMail(user, code, link)`, `Core.runReminders(db, now)` (lot 5, peut renvoyer `{ notices: [] }` d'abord), `Core.publicConfig(db)` (IBAN, liens de réservation… en configuration, lot 2), `Core.setSettings(db, user, body)` (admin), `Core.readNotif(db, user, id, ids)`, `Core.emailsFor(db, items, base, grouped)` ; et `Connectors.webhook(source, body, headers, db, env)`, `Connectors.status(env, db)`, `Connectors.sync(name, db, env, projectId, user)`, `Connectors.ask(project, user, question, env, db)` (lots 5 et 7 ; écrire d'abord des versions minimales qui renvoient une erreur claire « connecteur non configuré »). Côté interface : écran « Confirmer la connexion » pour `/auth/…`, appel `POST /api/verify` qui ne renvoie plus `user`, cookie nommé selon HTTPS.

### Lot 2. Cohérence, registre tu/vous, données d'exemple

- **Une seule source de vérité** pour les états : un livrable lié à une validation reste « À valider » tant qu'elle n'est pas validée (aujourd'hui « Plan du site » est « Fait » dans Étapes et « En attente » dans À valider) ; un projet livré a toutes ses phases terminées ; les demandes d'évolution non traitées comptent dans les alertes et la liste Clients ; afficher l'année si ce n'est pas l'année en cours.
- **Registre tu/vous à 100 %**, y compris `core.js` (PHASES, `describe`, `mailFor`, titres de l'équipe) et l'e-mail de connexion. Bug vérifié : Claire (vous) reçoit « Louis attend **ta** validation ». Séparer les textes « équipe » et « client » dans `notifyFor`. Ajouter un test qui cherche « vous » dans le rendu d'un projet en tutoiement et inversement. Exemples à corriger chez Hugo : « Qu'attendez-vous de moi ? », « vidéos à revoir quand vous voulez », « Designer, il dessine vos maquettes », « décrivez-la », « Cliquez pour copier », conseils de la page Maquettes.
- **Promesses non tenues** dans l'accueil guidé : « message WhatsApp pour les validations » et « point de la semaine chaque vendredi » ne font rien → implémenter (e-mail hebdo au client construit depuis la note) ou retirer.
- **Données d'exemple cohérentes** : Huchet (dates des phases calculées depuis le démarrage → livraison affichée « 1er janv. » alors que le site est en ligne depuis le 15 juin ; vidéo des wireframes après la fin du design ; « bilan à 1 mois » daté d'octobre) ; Lumen (acompte réglé avant le devis et la facture ; compte rendu annoncé avant d'être déposé ; 1 jour entre DA et maquettes) ; Varenne (vidéo de bienvenue envoyée par Louis alors que Théophile est chef de projet) ; liens Figma de Lumen vers `figma.com` ; même Loom partout ; Clément sans nom de famille.
- **IBAN et liens de réservation en configuration** (pas dans `app.js`). Un seul outil de réservation, au nom d'Orem (aujourd'hui cal.com « iconokom » et iClosed « Orem » coexistent).
- **Tiret long** : la fiche teaser affiche « HUCHET—DEMORGE » (`app.js`, `teaserHtml`) → trait d'union.
- **Vidéos Webflow** de la boîte à outils codées en dur pour Huchet (« Ajouter un hôtel ou une boulangerie ») → paramétrables par projet.
- La fiche teaser et la boîte à outils doivent être configurables par client (aujourd'hui figées sur Huchet).
- Facture affichée deux fois (ligne + PDF séparé) → PDF sur la ligne de facture.
- Le client ne doit pas pouvoir cocher « Régler l'acompte » lui-même (paiement = fait vérifiable).

### Lot 3. Accessibilité et mobile

- **Focus** : les 4 dialogues (accueil guidé, Ajouter, visionneuse, aperçu d'e-mail) ne retiennent pas le focus et ne le rendent pas ; le focus tombe sur `BODY` après presque chaque action (filtres, cases, onglets, envoi de message). Correctif proposé : dans `render()`, mémoriser l'élément actif (par `id` ou `data-*`), rendre l'arrière-plan `inert` quand un `[role=dialog]` est ouvert, focaliser dans le dialogue, rendre le focus au déclencheur à la fermeture, sinon restaurer l'élément précédent. Supprimer l'ancien bloc qui écrase le focus.
- Démo : ajouter `<!doctype html><html lang="fr">` et le meta viewport dans `build-demo.js` (sinon mode quirks et 980 px sur mobile) + `document.documentElement.lang='fr'`.
- Contour de focus orange (`--night-hl`) sur les fonds sombres (`.next`, `.evo`, `.video-card`, `.login-art`, `.ob-art`, `.lb`) ; `:focus-within` sur les zones de dépôt (`input.sr`).
- Bordures de champs contrastées : jeton `--field` (#85847e clair, #6a6d92 sombre).
- Onglets ARIA complets (`tablist` nommé, `tabpanel`, `aria-controls`, `tabindex` itinérant, flèches).
- Erreurs sous le champ (`aria-invalid`, `aria-describedby`, focus sur le champ) au lieu du toast ; toast plus long (au moins 4 s) et vidé ensuite ; toast au-dessus de la barre du bas sur mobile.
- `document.title` par vue + focus sur le `h1` au changement de vue.
- `.ob-list .li span:not(.rank)` (numéros illisibles), `.sr` correct (`margin:-1px; clip-path`), `.btn` qui peut passer à la ligne (débordements à 320 px).
- Mobile : champs en 16 px (zoom iOS), `dvh` au lieu de `vh`, `interactive-widget=resizes-content`, pas de défilement imbriqué dans Messages, cibles de 44 px sur écran tactile.
- Connexion : un seul `h1`, landmark `main`. Équipe et aide : ordre des titres. Libellés « Télécharger <nom> ». Frise d'avancement lisible par les lecteurs d'écran. Listes en `<ol>/<li>`.
- Performance : ne rendre que la vue (`#main .wrap`) quand l'état global ne change pas ; ne plus dupliquer les images base64 dans `data-src` ; gzip + ETag + cache long sur `/assets` *(serveur fait dans le brouillon)* ; images responsives.

### Lot 4. O.R.E.M., offres, mise en ligne, fin de projet

- Remplacer les 5 étapes génériques par des **gabarits par offre** structurés selon la méthode **O.R.E.M.** : Orienter (cadrage, plan), Représenter (direction artistique, maquettes), Exécuter (Webflow, recette, mise en ligne), Mesurer (bilan à 30 jours, puis Évolution). Offres : **Conseil**, **Direction artistique** (Essentiel, Pro, Premium), **Site web**, **Évolution** (mensuel). Choix de l'offre à la création de l'espace.
- **Action « Mettre en ligne »** côté agence : fixe `deliveredAt`, bascule l'accueil client en « projet livré », célébration, saisie des résultats, de la marque (couleurs, polices) et des outils activés. Aujourd'hui l'écran livré n'existe que dans les données d'exemple.
- **Fin de projet** : procès-verbal de livraison validé, checklist de remise (accès Webflow, sources Figma, guide), demande d'avis Google et de témoignage au bon moment, archivage et lecture seule, export ZIP.

### Lot 5. Connecteurs et automatisations (zéro double saisie)

- Pipedrive : deal gagné → création de l'espace (webhook signé `POST /api/hooks/pipedrive`, prévu dans le brouillon).
- Abby : import du devis signé et des factures avec PDF.
- Qonto : rapprochement des virements → facture « Payée » + message au client ; lien de paiement sur « À régler ».
- Copie des fichiers reçus vers le dossier Drive du client.
- Planning qui se recalcule quand une validation est en retard ; relances automatiques au client (`Core.runReminders`).
- Les clés API sont dans le coffre Notion de Louis (skill `cles-api`). **Ne jamais écrire une clé dans le dépôt.** Coder les connecteurs derrière des variables d'environnement et les tester avec des réponses simulées. Ne pas appeler les vrais comptes sans l'accord de Louis.

### Lot 6. Poste de travail agence

- Boîte de réception : « À traiter » (message, demande de modification, fichier, demande d'évolution) séparé de « Activité » ; filtres par type et client ; réponse directe ; marquer comme traité ; badge mis à jour tout de suite.
- Fiche client : bandeau d'état en tête (ce qui attend l'agence, le client, depuis combien de jours, bouton « Relancer ») ; enregistrement automatique (aujourd'hui 4 boutons séparés, modifications perdues) ; livrables repliés par phase.
- Onglet « Demandes » dédié avec badge.
- Liste Clients en vraie grille (client, phase, échéance J-x, « en attente de », équipe), recherche, tri ; colonne mal alignée aujourd'hui.
- Un seul bouton « Ajouter » ; « Nouveau client » en bouton secondaire. Types d'ajout en liste verticale ; bouton Envoyer collé en bas sur mobile. Placeholders génériques (« ex. »). Déconnexion dans Réglages, pas en onglet mobile.

### Lot 7. Moments waouh

- Page **Proposition** avant signature (propale Orem consultable, acceptation horodatée, acompte).
- **Mise en ligne mise en scène** : compte à rebours, page « Ton site est en ligne » avec avant/après, kit de lancement (post LinkedIn, visuels, signature e-mail), demande d'avis et de témoignage.
- **Bilan mensuel** branché sur GA4 et Search Console.
- **Évolution** avec formules (pas de prix dans un book, mais dans l'espace d'un client Évolution c'est possible ; demander à Louis) et devis d'un clic depuis une demande.
- **Commentaires épinglés** sur les maquettes et la recette, versions V1/V2.
- **Assistant** qui répond à partir des données du projet (API Claude, clé `ANTHROPIC_API_KEY` dans le coffre ; garde-fous, renvoi vers un humain) ; à défaut renommer « Réponses rapides ».
- Vidéo Loom d'accueil de Louis dans l'accueil guidé ; noms sous les photos ; pas de confettis par-dessus le contenu.

### Lot 8. Accueil épuré, navigation, fichiers, réaudit

- Accueil client : supprimer la répétition de la progression (4 fois aujourd'hui) et des KPI ; prochaine étape avec J-x, puis « À faire » sans doublon, puis le mot de la semaine et le rendez-vous ; tout visible sans défiler en 1440×900. Pas de compteurs à zéro au démarrage.
- Navigation client à **7 entrées maximum** (fusionner Maquettes et Bibliothèque, vidéos une seule fois) ; rubriques vides masquées ou annoncées avec une date ; pied de barre latérale jamais coupé.
- Fichiers : aperçu intégré (images, PDF, vidéo), miniatures, icône par type, recherche, suppression par le client pendant 24 h.
- Cloche de notifications côté client et page de préférences.
- Validation avec confirmation, annulation 10 s, « Validé par Claire le 14/10 à 18 h 10 ».
- Mode sombre : même couleur d'accent sémantique (l'orange réservé aux alertes) ; actions faites barrées dans les deux thèmes.
- Puis : rejouer les tests, relancer un audit indépendant (4 angles : sécurité, UX, accessibilité, produit) et viser 10/10.

---

## 6. Règles de travail (à respecter)

- **Langue et écriture Orem** (textes visibles, docs, messages) : français ; **jamais de tiret long « — » ni « – »** ; guillemets « » ; espace avant `: ; ! ?` ; « agence » jamais « studio » ; « Direction artistique » ; **jamais le mot « suivi »** ; méthode O.R.E.M. ; offres Conseil, Direction artistique, Site web, Évolution ; chiffres officiels « plus de 40 clients accompagnés depuis 2023 », « 100 % de satisfaction client ».
- **DA** : encre `#000012`, bleu `#092482` sur fond clair, orange `#ff6200` sur fond sombre ; Trykker (titres de marque) et Lexend Deca (interface), servies en local. Pour l'app, la lisibilité prime (Louis l'a validé).
- **Registre** tu/vous choisi par client, jamais déduit.
- **Local uniquement** : aucun déploiement, aucun e-mail réel (`MAIL_ENABLED` reste vide), aucun appel aux vrais comptes Pipedrive/Abby/Qonto/Google sans accord.
- **Clés** : dans le coffre Notion de Louis (page `3f9897c5a62a81398913ea3f87b315bd`, skill `cles-api`) ; jamais affichées ni écrites dans le dépôt.
- **Git** : travailler sur `claude/blissful-pasteur-u33w5x`, commit par lot avec un message clair en français, push, la PR #12 est en brouillon. Ne pas mettre de nom de modèle dans les commits.
- **Méthode** : après chaque lot, rejouer `tests/simulation.js` et `tests/equipe.js` (et les mettre à jour), regarder les captures, regénérer la démo. Montrer à Louis des captures et le lien de démo à jour.
- Données réelles Huchet-Demorge : contenus publics du cas client Orem (site agence-orem.fr, CMS Webflow, collection Réalisations `6a759af703d4ca7e4b686bb9`), dates Notion (24/11/2025 → 15/06/2026), Figma `irfVpJlJI85XG3Cv2h7cK5` ; facturation et messages sont fictifs. Contact Hugo Demorge, tutoiement.

---

## 7. Le brouillon du lot 1

`docs/reprise/server.wip.js` est une réécriture complète de `app/server.js` qui corrige C1, C2, la partie serveur de C3, C4 (sauvegarde), I1, I2, I4, I5, I6, I7, M3 (serveur), M5, ajoute gzip/ETag, journaux structurés, et prépare les routes des lots 5 et 7 (`/api/hooks/<source>`, `/api/connectors`, `/api/projects/<id>/ask`, `/api/settings`). Pour le brancher :

1. Écrire dans `core.js` les fonctions listées au §5 lot 1 (au minimum en version simple), durcir `apply()` (validation, limites, URL https, `file.add` interne seulement, uid sûr).
2. Créer `app/connectors.js` avec des versions minimales.
3. Copier le brouillon sur `app/server.js`, adapter `app.js` (écran de confirmation du lien, `/api/verify` ne renvoie plus `user`).
4. Rejouer les deux tests + les tests de sécurité de l'audit (faux `file.add`, `Host` piégé, cookie mal formé, champs de 1 Mo, date invalide).
