# Reprise du chantier « Espace client Orem »

Document de passation pour reprendre **exactement là où on s'est arrêtés** (session de Louis du 14 octobre 2026). À lire en entier avant de toucher au code.

---

## 0. Journal de reprise (à lire en premier, mis à jour à chaque étape)

**Règle de synergie** : une seule session travaille sur la branche à la fois. Avant de commencer : `git pull`, lire ce journal. Après chaque étape terminée : mettre à jour ce journal (fait, en cours, reste), commit, push. Avant de pousser : `git pull --no-rebase` pour intégrer le travail d'une autre session.

**Session active** : session de Louis (15/10, matin). La session de Théophile est arrêtée (crédits épuisés).

**Fait le 15/10 (session de Louis)** :
- `tests/tout.sh` rejoué : 100 % sauf `equipe` (2 vérifications), corrigé (catégorie « Visuels » dans le test ; le message de Julie passe au rejeu).
- Correctifs accessibilité et mobile de l'audit du 15/10 (liste plus bas) : 320 px, focus rendu au bon ouvreur (position mémorisée), double anneau de focus sur fond sombre, Échap dans l'aperçu d'e-mail, erreur sur le champ client d'« Ajouter », cloche fermée quand le focus sort, épingle au clavier (flèches, Entrée), « Continuer » de l'accueil guidé décrit par l'étape et son titre, barre latérale nommée, bouton de thème avec son état, mode sombre et déconnexion dans « Plus », barre du haut non collante sous 500 px de hauteur, focus rendu après « Annuler » et « Pas encore », focus sur « Annuler ma validation » après « Oui, je valide ».
- Audit UX : cloche ouverte à côté de la barre latérale (ne recouvre plus Évolution), puces, numéros et dates sur une ligne, lignes de liste qui passent à la ligne sous 420 px.

- Relecture copywriting (rapport complet : `docs/audit-copywriting.md`, clarté notée 6,5/10 client et 6/10 agence) : les 133 réécritures P1 et P2 sont appliquées dans `app.js` et `core.js` (lexique : « étape » pour les 4 temps O.R.E.M., « prochaine action », « Devis et factures », « faire une demande », « maquette cliquable », « Tests du site » au lieu de « Recette du site », délai unique « sous 24 h ouvrées », erreurs neutres en registre qui disent quoi faire, mot « suivi » retiré). Maquettes : le placeholder nomme bien le designer (`/design|création/`).

- `tests/tout.sh` rejoué après le copywriting : **11 suites à 100 %** (simulation 25, equipe 14, lots 24, a11y 24, agence 26, waouh 20, accueil 25, connecteurs 40, securite 13, core 61). Tests adaptés aux nouveaux textes (« Mise en ligne dans N jours », « Devis », « Demande : … »). Titre d'un devis tiré d'une demande : « Demande : … » au lieu de « Évolution : … ».
- Démo regénérée et republiée (version 5) : https://claude.ai/artifact/WBnaucQmcvNXdBjr4YECBT (compte de Louis, privée). Limite connue : dans le lecteur d'artifact, les boutons « Télécharger » de la démo ne font rien (le lecteur bloque les téléchargements) ; dans l'app locale, ils fonctionnent.

- **Arrivée d'un nouveau client** (test `tests/arrivee.js`, 10 vérifications, captures à chaque écran) : l'invitation contient un **lien de connexion direct** (valable 7 jours, une seule fois, `db.invites`) ; un clic, « Confirmer la connexion », puis la visite guidée. Dernier écran « Faisons connaissance » : prénom et nom (pré-rempli, obligatoire), fonction et téléphone (facultatifs), notifications ; l'équipe les voit dans « Accès et infos ». Les fois suivantes : adresse e-mail puis code ou lien. Un ancien lien `?email=` pré-remplit l'adresse.
- **Bug corrigé** : sur une adresse `/auth/…`, `index.html` chargeait `core.js` et `app.js` en chemin relatif, donc les liens de connexion par e-mail ne démarraient pas l'app. Chemins passés en absolu (`/core.js`, `/app.js`, `/styles.css`).

- **Bilans mensuels Évolution** (test `tests/bilans.js`, 5 vérifications) : chaque bilan affiche « Consulter » (visionneuse plein écran) et « PDF » (téléchargement nommé « Bilan Septembre 2026 Huchet-Demorge.pdf ») sans avoir à le déplier. Côté agence, le formulaire « Publier le bilan du mois » prend « le document présenté en visio (PDF) ». Bilans d'exemple de Huchet-Demorge générés au format des bilans Orem (16:9, couverture, l'essentiel du mois, le travail réalisé) par `tools/bilans-exemple.js` dans `public/assets/bilans/`, intégrés à la démo.

- **Dépôts sans limite** (test `tests/depots.js`, 11 vérifications) : plus de limite de 2 Go par fichier ni de quota de 20 Go par projet (limites facultatives `MAX_UPLOAD_GB` et `PROJECT_QUOTA_GB` ; le serveur garde toujours 2 Go libres sur son disque et refuse proprement au-delà). Au-delà de 32 Mo, envoi **par morceaux reprenable** (`POST /api/projects/<id>/uploads`, `PUT /api/uploads/<id>?offset=`, `GET` pour reprendre ; envois abandonnés purgés après 7 jours). **Dossiers entiers** : glisser-déposer ou bouton « Déposer un dossier entier », sous-dossiers conservés (`file.folder`, affiché « Photos atelier › Portraits »), fichiers système ignorés, **une seule notification** par dépôt groupé (`files.batch`). Progression : fichier N sur M, volume envoyé, reprise affichée ; alerte si on quitte la page pendant un envoi. Export ZIP passé en **ZIP64** (plus de limite de 4 Go), sous-dossiers conservés dans l'archive.

- **Version de test en ligne prête à installer** (guide `docs/MISE-EN-LIGNE-TEST.md`, script `app/deploy/installer.sh`, test `tests/version-test.js`, 12 vérifications avec un faux serveur SMTP) :
  - e-mails par **Brevo ou SMTP** (`app/mail.js`, sans dépendance) ; **contact@agence-orem.fr** pour le générique (codes, récaps, relances), **l'adresse de la personne** pour ce qu'elle envoie en son nom à un client (invitation signée par le chef de projet, messages, vidéos, validations) ;
  - **mode test** (`TEST_MODE=1`) : bandeau orange « Version de test », e-mails envoyés seulement aux adresses de `MAIL_ALLOW` (par défaut @agence-orem.fr), les autres gardés dans « E-mails envoyés » marqués « non envoyé » ;
  - **Réglages › Tester la version en ligne** : e-mail générique, e-mail en son nom, test du compte d'envoi ; bouton « Tester » sur chaque outil connecté (Pipedrive, Qonto, Figma, Claude, Abby ; lecture seule, rien n'est créé) ;
  - `/api/health` pour la surveillance ;
  - le script d'installation (à lancer en root sur le VPS) : Node 22 si besoin, code dans `/opt/espace-orem` (jeton GitHub en lecture seule), configuration `/etc/espace-orem.env` reprise des clés de `/root/pipeline/automatisation/.env` (`BREVO_API_KEY_OREM`, `PIPEDRIVE_API_KEY`, `ABBY_API_KEY`, `FIGMA_API_KEY` → `FIGMA_TOKEN`, `ANTHROPIC_API_KEY`), service systemd `espace-orem` (port 3100), HTTPS par Caddy ou Nginx + certbot, vérification finale. Données dans `/var/lib/espace-orem`.

**Mise en ligne de la version de test (15/10, après-midi)** : Louis ne peut pas lancer de terminal sur le VPS (et la session cloud n'atteint pas le port SSH). Solution retenue avec son accord : un **serveur dédié chez Hetzner créé par l'API**, sans terminal, `espace-orem-test` (CX23, Nuremberg, ≈ 6 € TTC par mois, IPv4 **178.104.114.48**), par `app/deploy/hetzner-creer.js` (cloud-init : Node 22, Caddy et HTTPS automatique, service `espace-orem`, **mise à jour automatique toutes les 3 minutes depuis la branche** par `espace-maj.timer`, pare-feu Hetzner `espace-orem-web` : seuls 80 et 443 ouverts, pas de SSH). Le VPS `iconokom-pipeline` (188.245.37.4) n'est pas touché.
- Brevo : compte « Agence Orem », domaine agence-orem.fr authentifié (DKIM brevo1/brevo2), expéditeurs contact@, louis@, theophile@, clement@ vérifiés ; SPF et DMARC (avec rua) mis à jour chez Hostinger.
- Coffre Notion : `BREVO_API_KEY_OREM`, `HETZNER_API_TOKEN`, `GITHUB_TOKEN_VPS_ESPACE` ajoutés (collés dans la conversation : à régénérer avant la production ; le jeton GitHub n'a pas d'expiration).
- Clés présentes sur le serveur (dans `/etc/espace-orem.env` et les données cloud-init de Hetzner) : Brevo, Pipedrive, Abby, Figma, Claude. Qonto et Google non configurés.
- **Fait (15/10, soir)** : enregistrement A `espace` → 178.104.114.48 chez Hostinger, certificat HTTPS émis par Caddy (après un redémarrage du serveur par l'API : les premières demandes étaient parties avant le changement de DNS). Louis voyait `ERR_CERT_COMMON_NAME_INVALID` : cache DNS de son poste qui gardait l'ancienne IP du pipeline ; réglé par le DNS sécurisé de Chrome. Le site s'ouvre chez lui. `/api/health` : `{"ok":true,"test":true,"mail":true}`.
- **Tests des outils (15/10, soir)** : Pipedrive et Claude « Connexion réussie ». **Abby** : l'adresse `/me` n'existe pas ; le test pointe maintenant sur `GET /company` (vérifiée, renvoie le compte). La documentation OpenAPI d'Abby est publique (`https://api.app-abby.com/api-docs-json`) : listes `GET /v2/billings`, `GET /billing/customer/{id}/billings`, `GET /customers` ; la synchronisation (`/v2/customers/<id>/documents`) reste à réécrire sur ces adresses, l'exploration avec la vraie clé a été bloquée par le garde-fou (données de facturation) et attend l'accord de Louis. **Figma** : le jeton `FIGMA_API_KEY` du coffre est refusé par Figma (401, en-tête et Bearer) : il est expiré ou révoqué, Louis doit en créer un nouveau (lecture des fichiers) et le mettre dans le coffre ; le serveur n'ayant pas de SSH, il faudra le reconfigurer (reconstruction par l'API Hetzner ou réglage des clés depuis l'interface).
- **Suite (15/10, soir)** : nouveau jeton Figma « Espace client Orem » créé par Louis, vérifié (Figma l'accepte) et rangé dans le coffre Notion (`FIGMA_API_KEY`). **Abby** : synchronisation réécrite sur l'API documentée (`GET /v2/billings?customerId=`, montants en centimes, PDF par `GET /v2/billing/{id}/download`), testée contre le faux serveur ; pas encore essayée sur le vrai compte (lecture des factures réelles bloquée par le garde-fou). `deploy/hetzner-creer.js --remplacer` recrée le serveur en gardant l'IP 178.104.114.48 (adresse principale passée en `auto_delete: false`). **Serveur remplacé** avec l'accord de Louis (même IP, HTTPS OK, nouvelle clé Figma en `FIGMA_TOKEN`). Les données de test sont reparties de zéro (espaces d'exemple).
- **Qonto et Google (15/10, soir)** : identifiants Qonto (`iconokom-4335`, lecture seule) et compte de service Google `iconokom-sheets@iconokom.iam.gserviceaccount.com` (nouvelle clé `d21b8770103d`, API Drive, Analytics Data et Search Console activées) vérifiés depuis la session (« Connexion réussie ») et rangés dans le coffre (`QONTO_*`, `GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT`). Sur le serveur, le JSON passe en base64 (`saJson()` accepte les deux). **Sur le serveur** depuis la recréation autorisée par Louis (même IP, HTTPS OK) : les 6 outils sont configurés.
- **Reste** : Louis vérifie l'étape 5 (code reçu de contact@, e-mail générique et e-mail en son nom, « Tester » sur chaque outil), puis on donne l'accès à Théophile et Clément.
- Pour changer une clé ou un réglage sur ce serveur sans terminal : recréer le serveur (supprimer puis relancer le script ; les données de test sont perdues) ou ajouter plus tard une page d'administration des réglages.

- **Tâches de l'équipe (16/10)**, demandées par Louis « comme sur Notion, généralisé pour l'équipe » : nouvelle page agence **« Tâches de l'équipe »** (menu Au quotidien, onglet mobile « Tâches », badge = mes tâches du jour ou en retard). Modèle repris de la base Notion « Programme & Livrables » (Nom, Personne, Date de livraison, Étape, État) mais commun à tous les clients :
  - **tâches internes** `db.todos` (avec ou sans client : prospection, administratif…) : titre, personnes (plusieurs), échéance, état `todo`/`doing`/`done` (Pas commencé, En cours, Fait), client facultatif, note, urgent ; `Core.taskAct` (`todo.add`, `todo.update`, `todo.remove`), `GET/POST /api/tasks` réservés à l'agence ;
  - **livrables des projets** lus directement dans le planning (`Core.teamTasks`, identifiant `i:<projet>:<livrable>`) : rien n'est recopié, changer l'état ou la date ici passe par `item.status` (historique du client compris), changer les personnes par `item.meta` ;
  - vues : Mes tâches / Toute l'équipe / par personne, filtre client (dont « Interne »), case « Livrables des projets », **Liste** (En retard, Aujourd'hui, Cette semaine, Plus tard, Sans échéance, Fait des 30 derniers jours) ou **Tableau** (3 colonnes) ;
  - confier une tâche à un collègue le prévient : notification `todo.assign` (type `tasks`, dans « À traiter », e-mail selon ses réglages : nouvelle case « Un collègue me confie une tâche »), un clic ouvre la tâche ;
  - 5 tâches internes d'exemple dans les données de démo ; test `tests/taches.js` (17 vérifications, dont : client refusé en 403, aucune trace côté client, mobile sans défilement horizontal).
  - **Bug corrigé au passage** (trouvé par la suite `agence`, qui échouait une fois sur deux) : à l'ouverture de « Messages » côté client, un second rendu (messages marqués lus) effaçait ce que le client commençait à écrire. Les messages sont maintenant marqués lus avant l'affichage (`go()`), un seul rendu. Tests `agence` rendus robustes (attente du message affiché, fermeture répétée de la visite guidée) ; mobile agence : 5 onglets dont « Tâches ».
  - Idées suivantes possibles (non faites) : rappel du matin des tâches du jour, tâches récurrentes, sous-tâches ou liste de contrôle, glisser-déposer dans le tableau, section « Tâches internes » dans la fiche client.
- `tests/tout.sh` : **16 suites à 100 %** (taches 17, agence 26 désormais stable, simulation 25, equipe 14, lots 24, a11y 24, agence 26, waouh 20, accueil 25, arrivee 9, bilans 5, depots 11, connecteurs 40, securite 13, core 61, version-test 12). `agence` a échoué une fois sur une question de délai pendant le passage complet, puis passé seul et rejoué : à surveiller. Export ZIP : ZIP64 seulement au-delà de 4 Go (les petites archives restent au format classique) ; branche ZIP64 vérifiée par Python et unzip avec un seuil abaissé (`unzip -l` affiche alors les accents en `#U00e9` si la langue du système n'est pas réglée : affichage seulement, les fichiers sont intacts).

**En cours** : vérification de l'étape 5 par Louis sur https://espace.agence-orem.fr ; en attendant, les restes de l'audit UX et produit et les 52 propositions P3 du copywriting.

**Reste aussi du copywriting** : les 52 propositions P3 du rapport ; statut de demande « Proposé » affiché « Devis envoyé » (sans changer la valeur stockée) ; signature de l'e-mail d'invitation selon l'équipe du projet (`core.js`, test `core.js:84`) ; décision à prendre par Louis : l'interface agence vouvoie alors que les e-mails internes tutoient.

**Reste** : rejouer `tests/tout.sh` après le copywriting, regénérer la démo et la republier, restes de l'audit UX (regroupement des 10 onglets de la fiche, « Aperçu des écrans » réservé aux vraies maquettes) et de l'audit produit (point 5 du point d'arrêt du 14/10), puis audit final des 4 angles.

---

## 1. Message à coller dans la nouvelle session Claude

> Tu reprends le chantier « Espace client Orem » de l'agence Orem (ICONOKOM). Dépôt `iconokom-source/claude-code`, branche `claude/blissful-pasteur-u33w5x`, PR #12 (brouillon). Lis d'abord en entier `espace-client-orem/docs/REPRISE.md` (surtout la section « Point d'arrêt » à la fin), puis `docs/conception.md` et `docs/simulation-parcours.md`.
>
> Où on en est : le lot 1 (sécurité) est terminé et poussé. Les lots 2 et 4 sont commencés : le modèle O.R.E.M. par offre, les données d'exemple et le registre tu/vous dans les e-mails sont faits dans `app/public/core.js` (commit `6a00baa`), mais pas encore dans les écrans (`app/public/app.js`).
>
> Première chose à faire : depuis `espace-client-orem/app`, `rm -rf data`, lance `PORT=3123 MAIL_BATCH_MS=300 node server.js &`, puis `NODE_PATH=$(npm root -g) node tests/simulation.js` et `node tests/equipe.js`. Au dernier passage, `tests/equipe.js` s'est arrêté sur un délai dépassé (un élément attendu introuvable, sans doute un écran touché par le nouveau modèle) et le décompte de la simulation n'a pas été récupéré. Trouve la cause et corrige jusqu'à 100 % sur les deux tests.
>
> Ensuite, termine les lots 2 et 4 dans `app.js` (liste dans « Point d'arrêt ») : lettre O/R/E/M et `Core.itemState`/`Core.phaseState` partout, choix de l'offre à la création, panneau « Mettre en ligne » (`project.deliver`), checklist de remise, avis client, retrait de la case WhatsApp de l'accueil guidé, tutoriels lus dans `p.tutorials`, `runReminders` réel. Puis enchaîne les lots 3, 5, 6, 7 et 8 (section 5), dans l'ordre.
>
> Après chaque lot : rejouer les deux tests, regénérer la démo (`node build-demo.js`), commit et push sur la même branche, puis republier la démo en artifact privé.
>
> Règles impératives : tout reste en local, rien en ligne ni sur un nom de domaine sans validation de Louis ; aucun e-mail réel (`MAIL_ENABLED` reste vide) ; aucun appel aux vrais comptes Pipedrive, Abby, Qonto ou Google sans accord ; ne jamais afficher ni écrire une clé (elles sont dans le coffre Notion, skill `cles-api`) ; pas de nom de modèle dans les commits ni la PR. Réponds en français avec les règles d'écriture Orem : jamais de tiret long, guillemets « », espace avant `: ; ! ?`, « agence » et jamais « studio », jamais le mot « suivi », registre tu/vous choisi par client et jamais deviné.
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
| `app/tests/lots.js` | 24 vérifications des lots 2 et 4 (registre dans tout le rendu, O.R.E.M., mise en ligne, avis, export ZIP) |
| `app/tests/a11y.js` | 24 vérifications du lot 3 (focus, dialogues, onglets, erreurs, 320 px, démo) |
| `app/tests/core.js` | 29 tests de la logique métier, sans navigateur |
| `app/tests/agence.js` | 26 vérifications du lot 6 (boîte « À traiter », grille des clients, bandeau d'état, relance, enregistrement automatique) |
| `app/tests/waouh.js` | 20 vérifications du lot 7 (proposition, devis d'évolution, épingles, compte à rebours, lancement) |
| `app/tests/accueil.js` | 25 vérifications du lot 8 (accueil sans défilement, navigation, fichiers, cloche, validation annulable, mode sombre) |
| `app/tests/connecteurs.js` | 28 vérifications du lot 5 contre un faux serveur local (aucun appel aux vrais comptes) |
| `app/tests/tout.sh` | Rejoue tout, chaque test sur des données neuves |
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

Statut : **les 8 lots sont faits** ; voir « Point d'arrêt » à la fin pour le réaudit en cours.

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

## Point d'arrêt (session du 15 octobre 2026)

**Fait dans cette session** (voir `docs/conception.md` section 11 et `docs/mcp.md`) : sections du pilotage espacées ; équipe de trois sur tous les projets, rôles du site sans « cofondateur », Clément Saint-Hilaire avec son WhatsApp, photo recadrée, bienvenue signée par l'équipe ; « Bien démarrer » (acompte, espace Webflow, accès au nom de domaine par délégation ou coffre chiffré) ; bibliothèque de visuels téléchargeables sans renvoi au site, ZIP, connecteur Figma ; vignettes de fichiers ; logo du client recoloré en blanc ou en noir ; serveur MCP (`app/mcp.js`) et jetons d'API (`app/jeton.js`) pour piloter les espaces depuis Claude Code ; icône `menu`, carte « À régler », boutons d'enregistrement masqués, tests adaptés.

**Ensuite, dans la même session** : qui fait quoi et lien sur chaque étape, rôles en phrases (Louis chef de projet), avis en deux chemins (Google ou questionnaire), signature en ligne des propositions et des documents avec certificat, espace Évolution (verrouillé pendant le projet ; visio, bilans, axes après la livraison), corrections d'espacement (cloche, bibliothèque), étape 4 de la visite guidée d'un projet livré, outils MCP Évolution et signature.

**Reste à faire** : rejouer `tests/tout.sh` jusqu'à 100 % après les derniers correctifs (bandeau en jours du calendrier, simulation et lots adaptés), puis les points 4 à 6 et la liste accessibilité ci-dessous.

**À valider par Louis, en plus** : consignes d'accès délégué par registraire (`REGISTRARS` dans `app.js`), identifiant OVH de l'agence (réglage `ovhNic`), adresse d'invitation Webflow (`webflowInvite`, par défaut louis@agence-orem.fr), jeton Figma pour l'import réel, photo de Clément en meilleure définition (à déposer dans `app/public/assets/clement.jpg`).

## Point d'arrêt précédent (session du 14 octobre 2026, soir)

**Les 8 lots sont faits, testés et poussés** (commits `551723c` à `63271b0`), puis le réaudit indépendant a été lancé (4 relecteurs) et ses correctifs appliqués en partie. `docs/reprise/server.wip.js` est obsolète (le serveur actuel l'a remplacé).

Démo privée à jour jusqu'au lot 8 : https://claude.ai/artifact/BVAN9vWbkvpfS6FpXTpMeo (compte de Théophile ; `node build-demo.js` produit `dist/espace-client-demo.html` autonome et `dist/espace-client-artifact.html` pour la publication).

**Tests** : `cd app && NODE_PATH=$(npm root -g):<dossier axe-core>:<dossier @anthropic-ai/sdk facultatif> CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome ./tests/tout.sh /tmp/orem-tests` rejoue 11 suites, chacune sur des données neuves (simulation 25, equipe 14, lots 24, a11y 24, agence 26, waouh 20, accueil 25, connecteurs 38, securite 13, core 39). Dernier passage complet à 100 % avant le dernier commit.

**Réaudit (notes reçues)** : sécurité 6/10 (toutes les failles corrigées, commit `20c0350`) ; produit 6,5 à 7,5/10 (corrigé : invitation, signature puis démarrage, mode prospect, PV bloquant, recalage, fichiers attendus, Évolution mensuelle, propositions dans la grille ; commit `cd89c17`) ; UX 7/10 client, 6/10 agence ; accessibilité 7,5/10 et mobile 7/10 (rapport reçu le 15/10, à corriger, voir la liste « Correctifs accessibilité » ci-dessous).

**Dernier commit (« en cours, tests non rejoués »)** : correctifs de l'audit UX dans `core.js` et `app.js` : catégorie « Documents », date de livraison des offres hors site, « À venir » avant signature, retards affichés, proposition en prochaine étape et dans la cloche de Hugo, enregistrement automatique sur toute la fiche client (formulaires `data-autosave="submit"`, boutons à masquer), compteurs unifiés au périmètre « mes clients », « Tout marquer comme traité », pilotage avec l'état calculé, « 1er » du mois, textes par offre, « À valider » dans la barre du bas mobile (icône `menu` à ajouter au sprite de `index.html`), un nom par page (« Étapes »), répétitions retirées, outils vides masqués, carte « À régler » en tête des factures, accueil guidé selon le stade, onglet Mise en ligne à partir du temps E, textes de démo retirés.

**À faire en reprenant, dans l'ordre :**
1. Ajouter le symbole `i-menu` au sprite d'`app/public/index.html`, styles `.pay` / `.pay-a` (carte « À régler ») et masquer les boutons « Enregistrer » des formulaires `[data-autosave=submit]`.
2. Adapter les tests qui cliquaient ces boutons : remplacer `click('form[data-form=X] button')` par `locator('form[data-form=X]').evaluate((f) => f.requestSubmit())` (lots, waouh, equipe, agence, accueil) ; l'onglet « Mise en ligne » n'existe plus avant le temps E (passer le projet en E dans les tests) ; la barre du bas mobile a « À valider » au lieu d'« Étapes » (simulation : tâches Julie/Hugo qui passent par « Plus ») ; le titre de la page Étapes est « Étapes ».
3. Rejouer `tests/tout.sh` jusqu'à 100 %, regénérer la démo, commit, push, republier l'artifact (même adresse).
4. Restes de l'audit UX : grille Clients et factures en cartes à 390 px (CSS), `white-space:nowrap` sur numéros et dates, volet de la cloche qui recouvre le bloc Évolution, regroupement des onglets de la fiche (10 aujourd'hui), « Aperçu des écrans » réservé aux vraies maquettes.
5. Restes de l'audit produit : PDF du procès-verbal et réserves, espace prospect créé à « Proposition envoyée » dans Pipedrive, devis et facture d'acompte dans Abby à l'acceptation (chemins de l'API à confirmer), lien de paiement Qonto généré, responsable sur les livrables et notes internes, données de démo montrant chaque moment waouh (bilan, épingles Lumen, avant/après, avis).
6. Relancer l'audit accessibilité et un audit final des 4 angles, viser 10/10.

**À valider par Louis** : formules et prix de l'offre Évolution ; nom de famille de Clément (laissé « Clément ») ; lien de réservation d'une formation (vide, le bouton est masqué) ; lien des conditions générales et vidéo d'accueil (Réglages) ; branchement réel des connecteurs (clés dans le coffre Notion).

**Correctifs accessibilité et mobile à faire** (audit du 15/10 : axe-core passé sur 492 écrans, 2 règles seulement en échec) :
1. Défilement horizontal à 320 px : `.tabs{position:relative}` (le `.sr` d'un badge d'onglet s'échappe), `.sr{width:1px!important;height:1px!important}` (l'input fichier `#a-up` fait 308 px).
2. Focus caché sous la barre du bas : `scroll-padding-bottom` et `scroll-padding-top` égaux aux barres fixes sous 860 px.
3. Focus rendu au mauvais ouvreur (visionneuse, bibliothèque, « Ajouter » de la fiche) : mémoriser l'élément ouvreur lui-même ; après « Annuler », « Pas encore » et « Oui, je valide », rendre le focus au bon bouton (ou à `#undo`).
4. Anneau de focus orange sous 3:1 sur `.next .btn`, `.newmsg`, `.video-card` : double anneau (orange plus blanc).
5. Aperçu d'e-mail : Échap inopérant quand le focus est dans l'iframe (`tabindex=-1` sur l'iframe).
6. « Choisissez le client » dans « Ajouter » : `fieldError('c-p', …)`.
7. Cloche : Tab sort du panneau ; l'insérer après le bouton ou la fermer en sortie de focus.
8. Épingle placée seulement au centre au clavier : flèches ou grille de 9 zones.
9. Accueil guidé : annoncer le changement d'étape (focus sur le titre ou région live).
10. Mobile client : déconnexion et thème dans Plus ou Préférences ; barre du haut non collante si la hauteur est inférieure à 500 px.
11. Mineurs : `ul > p` dans l'onglet Factures, alt redondant des captures, état lu deux fois dans Étapes (et `aria-current="step"`), compteur de `#undo` hors de la région live, région live permanente pour les réponses rapides, nav de la barre latérale à nommer, bouton de thème avec son état, champs de la grille Clients en pleine largeur sous 420 px, cases `flex:none`, boucle du focus dans les dialogues.
