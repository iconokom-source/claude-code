# P-06 / P-17 — Vidéos : état des lieux et propositions

2026-10-22, lecture seule : rien n'a été modifié dans Webflow.

Outil de mesure : `tests/videos-chargement.mjs`. Il relève les vidéos de la page, puis le moment où chacune est téléchargée : au chargement, ou au défilement par pas de 400 px.

Les tailles indiquées sont celles des fichiers servis par Webflow. Chrome, Safari, Edge et Firefox lisent le MP4, proposé en premier : c'est lui que téléchargent les vrais visiteurs. Le WebM n'est chargé que par les navigateurs sans H.264, comme le Chromium des tests.

## 1. Inventaire

| Vidéo | Où | Élément | MP4 servi | Quand elle est chargée |
|---|---|---|---|---|
| **conception création** | Accueil, Lille : carrousel « Ce que nous faisons » | Background Video natif (`preload="none"`, script de chargement différé du head) | **3 860 Ko** (944×720, 16 s, ~2 Mbit/s) | quand le carrousel atteint la section (vers 3 200 px de défilement sur ordinateur) |
| **Container** (développement web) | idem, même emplacement (onglet suivant du carrousel) | idem | **3 449 Ko** (942×720, 21 s, ~1,3 Mbit/s) | quand le carrousel passe sur cet onglet |
| video evolution | idem | idem | 242 Ko | idem |
| conseil-strat | Accueil, Lille | idem | 224 Ko | au défilement (au chargement sur mobile) |
| output-5 | Accueil, Lille, section noire | idem | 272 Ko | au défilement |
| footer_gradiant | toutes les pages (footer) | Background Video natif | 223 Ko (WebM 2,2 Mo) | au chargement (voir P-15 vidéo) |
| Vidéos du hero des Offres (5 pages) | modèle Offres | **créées en JS** (`OffreHeroVideo`, `preload="auto"`, WebM seul, hébergées sur **Cloudinary**) | inconnu : `res.cloudinary.com` bloqué par le réseau de la session | au chargement |
| conseil strat, WhatsApp Video | Offre site web | Background Video natif | 222 et 301 Ko | au chargement |

**Constat principal.**
- Sur l'accueil et Lille, deux vidéos du carrousel font à elles seules **7,3 Mo** (MP4) : conception création 3,9 Mo et Container 3,4 Mo. Elles s'affichent dans un cadre de 531 px de haut au plus (218 px sur mobile).
- Leur chargement est déjà différé : le problème est leur poids, pas le moment où elles sont chargées.
- Ce sont les « images » les plus lourdes du site. Elles expliquent les 9 à 13 Mo relevés sur l'accueil quand le carrousel tourne pendant une mesure.

## 2. Essai de compression (en local, rien d'envoyé à Webflow)

Même définition, même durée, sans son, H.264 (`crf 28`, `preset slow`, `faststart`) :

| Vidéo | Actuel | Essai | Gain | Fidélité (SSIM, 1 = identique) |
|---|---|---|---|---|
| conception création | 3 860 Ko | **620 Ko** | −84 % | 0,990 |
| Container | 3 449 Ko | **1 133 Ko** | −67 % | 0,989 |

Comparaison image par image : `propositions/P-06-videos/*-avant-apres.jpg` (à gauche l'actuel, à droite l'essai). Aucune différence visible à taille réelle.

Une variante plus légère (`crf 32`) donne 350 Ko et 762 Ko, avec une fidélité de 0,984 et 0,983. À regarder en mouvement avant de la retenir.

## 3. Propositions (une à la fois, avec votre accord)

| # | Proposition | Comment | Gain | Risque | Code |
|---|---|---|---|---|---|
| V-1 | **Remplacer les fichiers « conception création » et « Container »** par les versions compressées | Natif : nouveau fichier dans les Background Video existants (accueil et Lille), rien d'autre ne change. Webflow réencode à l'import : on vérifie la taille réellement servie sur orem.webflow.io avant toute publication. | jusqu'à −5,5 Mo par visite de l'accueil ou de Lille, selon la part du carrousel vue | faible : rendu à comparer en mouvement ; retour arrière = remettre l'ancien fichier (toujours dans les assets) | aucun |
| V-2 | **Vidéos du hero des Offres** : les mesurer, puis les servir en natif si possible (Background Video, MP4 et WebM générés par Webflow, sans `preload="auto"`), ce qui permettrait de retirer `OffreHeroVideo` | Il faut d'abord autoriser `res.cloudinary.com` dans l'accès réseau de l'environnement pour mesurer. Vérifier ensuite si une vidéo d'arrière-plan peut être liée au CMS ; sinon, garder le JS en `preload="metadata"`. | à mesurer ; WebM seul : rien ne s'affiche sur les anciens Safari | moyen (modèle CMS) | **en moins** si le natif convient |
| V-3 | Vidéo du footer : déjà notée « à revoir » (P-15 vidéo) | — | faible (seuls les navigateurs sans H.264 téléchargent le WebM de 2,2 Mo) | — | — |

Ordre conseillé : **V-1** (gros gain, aucun code, retour arrière simple), puis V-2 après autorisation de Cloudinary.

## 4. Reste des assets

L'audit du 20/10 relevait 5 WebM de 17 à 30 Mo dans les assets. Aucun n'est servi sur les pages mesurées, sauf peut-être via Cloudinary sur les Offres (`conception-creation-16s-ambient-drift.webm`, à mesurer). Les supprimer des assets ne changerait rien pour les visiteurs ; c'est du ménage, avec un accord nommé.

## 5. V-1 préparée (2026-10-22) : plan détaillé

### Résolution

| | |
|---|---|
| Sources d'origine (assets) | conception création 1124×858, Container 1414×1080, 60 i/s |
| Fichiers servis aujourd'hui | **944×720 et 942×720, 30 i/s** |
| Pixels réellement affichés | 707×531 (écran standard) ; jusqu'à 1 414×1 062 (portable Retina) et 1 662×948 (tablette Retina, 991 px) ; 858×654 (mobile ×3) |

- **Webflow plafonne les vidéos d'arrière-plan à 720 px de haut.** Les 7 vidéos du site sortent toutes en 720 px, quelle que soit leur source : 858, 1 080 ou 720 px.
- Envoyer un fichier plus grand ne donnerait donc pas plus de détail. Envoyer plus petit ferait perdre de la netteté.
- Les fichiers préparés gardent exactement la définition servie aujourd'hui : **944×720 et 942×720**. Ils sont tirés des sources d'origine (réduction Lanczos), pas des fichiers déjà compressés par Webflow.
- Sur écran Retina, la vidéo reste aussi nette qu'aujourd'hui, ni plus ni moins. Faire mieux demanderait de sortir du Background Video natif : vidéo hébergée et balise `<video>` dans un embed, donc du code en plus. Ce n'est pas proposé.

### Fichiers prêts (dans ce dossier)

| Fichier | Définition | Poids | Remplace |
|---|---|---|---|
| `P-06-videos/conception-creation-v4.mp4` | 944×720, 30 i/s, H.264, sans son | 894 Ko (au lieu de 3 860) | asset `6a9aeb706db5e2c8d407e95a` |
| `P-06-videos/container-v2.mp4` | 942×720, 30 i/s, H.264, sans son | 1 442 Ko (au lieu de 3 449) | asset `6a9aeb6851c2695590bf38b3` |

Qualité : `crf 26`, un cran plus prudent que l'essai du §2. Zoom ×2 sur les textes : `*-zoom-x2-actuel-vs-crf26.jpg` (à gauche l'actuel, à droite le nouveau). Pas de différence visible.

### L'inconnue à lever d'abord

**Webflow réencode chaque vidéo envoyée.** Le poids servi dépend de son encodeur, pas seulement du fichier envoyé. C'est probablement pour ça que les fichiers servis aujourd'hui sont lourds : il a reçu des sources à 8,7 et 10,7 Mbit/s en 60 i/s. On ne connaîtra le gain réel qu'après un premier envoi.

### Déroulé proposé

Le MCP ne peut pas changer la vidéo d'un Background Video (réglage non exposé) : les remplacements se font dans le Designer.

1. **Test sur un seul élément** : la vidéo « conception création » de l'accueil (élément `efeed470-…`). Dans le Designer : Réglages › Background Video › envoyer `conception-creation-v4.mp4`.
2. Publier **uniquement sur orem.webflow.io**, puis mesurer avec `tests/tailles-videos.sh https://orem.webflow.io/` :
   - si le MP4 servi fait nettement moins de 3 860 Ko, en 944×720 → on continue ;
   - sinon → on remet l'asset d'origine (retour arrière ci-dessous) et on s'arrête là.
3. Si c'est concluant : les trois autres remplacements (Container sur l'accueil, puis les deux sur Lille). Pour Lille, réutiliser l'asset déjà envoyé, ce qui évite un deuxième réencodage.
4. Vérifier sur orem.webflow.io :
   - tailles servies ;
   - rendu en mouvement à 1440, 991 et 390 px ;
   - le carrousel (ordre, durée de 8 s, barre de progression) ;
   - tests fonctionnels habituels.
5. Puis votre accord pour la publication en production.

- **Attention, publications depuis le Designer** : entre l'étape 1 et la fin, si quelqu'un publie, la nouvelle vidéo part en ligne. Le risque est faible, car même rendu et même définition. Faire les étapes 1 à 4 d'une traite.
- **Retour arrière** : resélectionner l'asset d'origine sur l'élément. Voir `sauvegardes/2026-10-22-P-06-V1/README.md` ; ne pas supprimer les anciens assets.
- **Gain attendu**, si Webflow respecte le poids envoyé : environ −4,9 Mo sur ces deux vidéos (MP4), pour les visiteurs de l'accueil et de Lille qui voient ces onglets du carrousel.

## 6. V-2 mesurée (2026-10-22) : vidéos du haut des pages Offres (Cloudinary)

Rappel : la taille affichée dans le Designer (« Size » d'un Background Video) est celle du **fichier envoyé**. Pour les Background Video, les visiteurs reçoivent les versions réencodées par Webflow (ex. Container : 26,86 Mo envoyés, 3,4 Mo servis). Les pages Offres, elles, servent le **fichier brut** depuis Cloudinary, sans réencodage.

Le champ CMS `lien-video-hero-cloudinary` (collection Offres) est lu par le script `OffreHeroVideo` (`<video preload="auto" autoplay loop>`, une seule source WebM).

| Offre | Fichier | Définition | Poids du fichier | Téléchargé en 15 s (1440 / 390 px) | Affiché dans |
|---|---|---|---|---|---|
| **Site web** | Container.webm | 1414×1080, 60 i/s, 21 s | **27,5 Mo** | **38 / 42 Mo** | 644×569 (358×302 mobile) |
| **Image de marque** | conception-creation-16s-ambient-drift.webm | **2830×2160 (4K)**, 60 i/s, 16 s | **21,2 Mo** | **29 / 30 Mo** | idem |
| Évolution et SEO | video_evolution.webm | 1124×858, 10 s | 1,65 Mo | 1,8 / 2,1 Mo | idem |
| Conseil | conseil-strat.webm | 750×572, 2 s | 0,28 Mo | 0,3–0,4 Mo | idem |

- **On télécharge plus que la taille du fichier** : un fichier trop gros pour le cache vidéo du navigateur est retéléchargé en partie à chaque boucle.
- **Même chose sur mobile** : 30 à 42 Mo pour un cadre de 358×302 px.
- C'est de loin le plus gros poste du site : **une visite de l'offre Site web pèse plus que toutes les autres pages réunies**.

**Résolution nécessaire.**
- Le cadre fait 569 px de haut ; la vidéo le remplit en hauteur (`cover`).
- Sur écran Retina, il faut donc ~1 138 pixels réels : **1080 px de haut suffisent**.
- La version 4K d'Image de marque est au-dessus de ce qu'aucun écran n'affiche dans ce cadre.

Essai local, en 1080 px de haut, 30 i/s, H.264, sans son, `crf 26` :

| Offre | Actuel | Essai |
|---|---|---|
| Site web | 27,5 Mo (38 Mo téléchargés) | **2,9 Mo** |
| Image de marque | 21,2 Mo (29 Mo téléchargés) | **1,6 Mo** |

**Gain : environ −35 à −40 Mo** par visite de ces deux pages.

**Comment, sans ajouter de code.** Il suffit de changer l'URL dans le champ CMS `lien-video-hero-cloudinary` des 2 offres. Le MCP sait modifier un item CMS, et le retour arrière consiste à remettre l'URL d'origine, notée ci-dessus. Deux façons d'obtenir le fichier léger :

- **(a) Transformation Cloudinary dans l'URL**, sans envoi de fichier. Exemple de forme : `…/video/upload/h_1080,fps_30,q_auto,vc_h264/v1788968724/6a9aeb6851c2695590bf38b3_Container.mp4`. Cloudinary génère et met en cache la version MP4. Cela consomme des crédits de transformation du compte Cloudinary (`fgv66xtf`) : à valider par le titulaire du compte.
- **(b) Envoyer les MP4 préparés** sur Cloudinary (par le titulaire du compte) et mettre leurs URLs dans le CMS.

En MP4 H.264, la vidéo se lira aussi sur les anciens Safari, ce qui n'est pas garanti en WebM seul.
