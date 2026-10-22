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
