# Sections : ce qui existe déjà (à ne pas refaire) et comment inventer

## Principe

La trame de Louis dit **quoi** mettre dans chaque section (rôle SEO ou conversion, contenu, CTA). Elle peut citer une section existante (« structure du hero du template Offres », « composant avis-section tel quel ») : c'est une indication de **contenu et de fonction**, pas de forme. La forme est toujours une composition nouvelle, construite avec les invariants de `da-site.md`.

Exceptions, reprises telles quelles : la nav, le footer, la section **Méthode O.R.E.M.** (`2174:5281`), la section **FAQ** (`2174:5376`, textes adaptés) et quelques petits composants (note Google, CTA animé).

## Collections CMS

Tout contenu répété vient d'une collection Webflow : cas clients, avis, articles, questions de FAQ, secteurs. Le nombre d'éléments varie d'une page à l'autre. Donc :

- dessiner une **liste d'éléments identiques** (même structure, mêmes calques nommés `*-item`, `*-list`), jamais une mise en page qui dépend d'un nombre précis d'éléments ou qui traite un élément à part (pas de « carte vedette » différente des autres) ;
- la mise en page doit tenir avec 2 comme avec 8 éléments : rail horizontal qui défile, grille avec retour à la ligne, liste verticale ;
- nommer les calques par champ CMS (`avis-texte`, `avis-nom`, `avis-fonction`, `avis-photo`).

## Les sections existantes du site (formes déjà prises)

Avant de dessiner une section, vérifier qu'elle ne ressemble à aucune de celles-ci. Même rôle : oui. Même composition : non.

| Section existante | Où | Composition à ne pas reproduire |
|---|---|---|
| Hero accueil | `/` (2174:4993) | fond nuit bleue, H1 serif blanc à gauche, texte et 2 CTA à droite, bandeau d'images en ligne, showreel à onglets |
| Hero offre | `/offre-branding` (2856:2079) | dégradé orange, H1 serif 4 lignes, carte « carte mentale » de vignettes reliées par des traits, carte logo blob |
| Hero à propos | `/about` (2180:6308) | dégradé nuit vers blanc, titre centré, photos d'équipe éparpillées |
| Hero services, réalisations | `/services`, `/travaux` | H1 à gauche, logos dessous, note Google et CTA à droite |
| Le problème | `/offre-branding` (2856:2158) | titre fixe à gauche, colonne de grandes cartes blanches qui défilent à droite, puces « → » |
| Ce que nous faisons | `/offre-branding` (2856:4864) | carte en verre centrée sur des blobs bleus, fond noir |
| Contenu de l'offre | `/offre-branding` (2867:5266) | 3 cartes noires hautes en ligne, titre serif en haut, texte en bas |
| Méthode en 6 étapes | `/offre-branding` (2856:4896) | frise verticale centrale, cartes en quinconce gauche et droite |
| Cas clients | `Component 8` (2174:5052) | 3 cartes blanches avec 3 images inclinées empilées, « Voir le cas d'étude » |
| Logos | `/` (2174:5053) | grille 6 × 4 de logos gris |
| Expertises | `/` (2174:5064) | liste d'onglets à gauche, grand visuel à droite |
| Avis | `/` (2174:5227) | carrousel d'une grande carte citation avec portrait, flèches |
| Méthode O.R.E.M. | `/` (2174:5281) | fond noir, blob animé, une carte d'illustration par lettre en défilement vertical |
| Espace client | `/` (2174:5326) | capture navigateur pleine largeur, 3 onglets dessous |
| FAQ | `/` (2174:5376) | titre serif centré, onglets de catégories, accordéon à gauche, carte ASCII dégradé avec CTA orange à droite |
| Équipe | `/about` (2180:6341) | 3 portraits noir et blanc, fond noir |
| Partenaires | `/about` (2180:6361) | liste à filets nom / métier / flèche |
| Article | `/blog/articles` | sommaire latéral, FAQ, carte auteur, suggestions en 3 cartes image |

## Correspondance avec les noms Webflow des trames

| Nom dans la trame | Sens dans Figma |
|---|---|
| `new-menu-container` | nav : cloner la nav officielle (claire `2856:2147` ou sombre `2174:5014`) |
| `embed-modale` | modale projets du site : rien à dessiner, mentionner dans les notes |
| `footer` | cloner `2158:2237` |
| `logo-client` | bandeau de logos clients (logos importés, gris) |
| `case-card` | carte de cas client : à **redessiner**, contenu = réalisations du secteur |
| `avis-section` | avis : à **redessiner**, contenu = vrais avis du site |
| `Animation Button CTA` | component set `2768:6461` (pastilles orange + « Rencontrer l'équipe ») ; sur fond clair, utiliser la pilule noire « ↳ » |
| `L'agence à Lille` (en-tête + 3 cartes à visuels) | contenu « 3 arguments illustrés » : à redessiner |

## Sections inventées et validées (pages Hôtellerie 3815:1702 et Médias 3836:1747)

L'ordre de page à suivre est celui de `seo.md`. Le tableau ci-dessous décrit la forme de chaque section.

Elles montrent le niveau attendu. **Ne pas les recopier non plus d'une page secteur à l'autre** : changer au moins la composition d'une page à l'autre (inverser, passer en sombre, changer le nombre de colonnes, la mise en scène des visuels).

| # | Rôle | Composition |
|---|---|---|
| 1 | Hero clair 2 colonnes | dégradé d'ambiance du secteur ; eyebrow cible, H1 serif deux tons avec mot-clé, intro, pilule noire « ↳ » + lien ; note Google ; **collage** de 3 visuels du secteur en rayon 24 qui se chevauchent avec ombres et une **pastille de preuve chiffrée réelle** ; bandeau de logos gris pleine largeur avec ceux du secteur en tête |
| 2 | Enjeux du secteur | **index éditorial** : en-tête deux tons + intro à droite ; 5 lignes à filets, numéro Trykker 54 gris, H3 Trykker 27, trois colonnes Problème / Solution / Indicateur, l'indicateur en serif encre avec point bleu |
| 3 | Cas clients | section **nuit `#000012`** ; collection en grille 2 colonnes avec retour à la ligne, cartes de 618 px, colonne de droite **décalée de 120 px** ; grand visuel 16:10, 3 vignettes, nom du client en serif, question du cas, **chiffres réels** en Trykker 54 sur filet, tags en pilules contour |
| 2 bis | Cas à la une | section blanche ; grand visuel 640 × 432 rayon 24 avec une vignette qui le chevauche, à droite eyebrow « Réalisation à la une », nom du client (H2 Trykker 34), contexte, 2 chiffres de l'étude sur filet, lien vers l'étude |
| 3 bis | Enjeux (version SEO) | même index éditorial, mais H2 de 400 px avec mot-clé, colonne diagnostic (2 phrases grises + phrase « Sur le site : » en encre, libellé en Medium) et colonne « Indicateur à suivre » de 250 px |
| 4 | Pourquoi Orem (bloc fusionné) | demi-écran sur `#f8f8f7` : titre deux tons à gauche (380 px), 3 preuves à filets avec point bleu au centre, 2 cartes blanches de liens vers les offres à droite (340 px) |
| 4 bis | Ressource : audit annoté (supprimé) | section blanche ; capture d'une réalisation du secteur avec repères ronds numérotés bleu accent (bord blanc, ombre), liste de 4 annotations à filets avec les mêmes numéros |
| 5 | Témoignages | section blanche ; en-tête deux tons avec chiffres officiels, note Google et flèches ; **rail de collection** `avis-list` qui déborde à droite : cartes `avis-item` identiques 416 px sur `#f8f8f7`, citation Trykker 18, espace flexible, filet puis auteur (photo ronde 44, nom, fonction). L'avis du secteur en premier. Une première version en carte vedette bleue a été refusée : fond bleu hors DA, texte collé au nom, pas pensée pour une collection |
| 6 | Nos offres (abandonné) | remplacé par le bloc fusionné « Pourquoi Orem » sur demande de l'expert SEO |
| 7 | Méthode O.R.E.M. | **section officielle reprise telle quelle** (`2174:5281`) |
| 8 | Articles liés | section blanche ; **liste éditoriale** à filets : vignette typographique (dégradé bleu nuit + mot Trykker), tag, titre serif, accroche liée au secteur, bouton rond |
| 9 | FAQ + CTA final | **section officielle reprise** (`2174:5376`) : titre adapté au secteur, onglets masqués, 5 questions du secteur, la première ouverte avec une réponse appuyée sur un chiffre réel |
| 10 | Secteurs proches | bande blanche basse ; label « Secteurs proches » à gauche, **2 liens** Trykker 27 en encre avec flèche bleue |

## Version actuelle des sections (après retours de Louis du 21 octobre)

| Section | Composition |
|---|---|
| Hero | colonne texte 600 px fixes (H1 600 px max) + écart 64 + collage dans une frame de 636 × 600 qui ne dépasse jamais le conteneur ; navigateur calé à droite (x = 636 − largeur) : navigateur 576 px (capture desktop du site) + téléphone 176 px (capture mobile) qui le chevauche à gauche + pastille de résultat réel en bas à droite |
| Réalisations en onglets | section nuit `#000012` ; en-tête deux tons + bouton contour « Toutes nos réalisations → » ; rangée d'onglets pilules (actif blanc, inactifs contour) `cas-tabs (collection CMS)` ; panneau `cas-panel` : visuel principal 740 px (mockup d'étude de cas), 2 visuels secondaires de 362 px, colonne texte (nom H3, contexte, 2 chiffres sur filets, tags, bouton blanc vers l'étude). Les autres panneaux existent, masqués |
| Enjeux en onglets | colonne d'onglets 460 px (numéro + titre H2 Trykker 18, onglet actif en carte blanche avec ombre) ; panneau blanc rayon 24 : boîte visuel 430 px de haut fond `#f8f8f7` avec le site centré, H2, diagnostic, « Sur le site : », carte indicateur + où le lire |
| Réalisation unique | collection CMS gardée (un onglet Actif, un panneau), rangée d'onglets `cas-tabs` **masquée** tant qu'il n'y a qu'un élément ; à réafficher dès la deuxième réalisation. Le noter dans la fiche SEO |
| Avis | cadre `avis-collection` à la hauteur des cartes (au moins 320 px, 376 px pour les citations longues) : à 287 px il coupe le nom et la fonction des auteurs. Avis du secteur en premier ; sans avis du secteur, celui du client le plus proche |
| Pourquoi Orem | à gauche titre deux tons, 3 preuves à filets, 2 boutons (noir et contour) ; à droite visuel de l'espace client Orem (desktop + mobile + légende) |

## Banque d'idées pour varier

- **Hero** : visuel plein cadre avec texte en carte flottante ; titre centré très large et visuels en éventail dessous ; split image à fond perdu à droite ; mosaïque bento de 5 visuels ; avant/après du site du client.
- **Enjeux** : grille bento de tailles inégales ; cartes « symptôme » sombres avec indicateur en grand chiffre ; schéma en entonnoir (découverte, décision, réservation) ; onglets horizontaux.
- **Preuves** : bandeau de chiffres réels géants ; citation plein écran sur visuel ; frise avant/après ; carte « résultat » par client.
- **Arguments** : 3 colonnes séparées par des filets verticaux ; liste numérotée avec visuel qui change ; carte unique horizontale avec 3 volets.
- **Offres / méthode** : lettres O.R.E.M. géantes en fond ; accordéon horizontal ; tableau comparatif.
- **Fin de page** : grande bande CTA nuit avec visuels du secteur ; carte contact avec le porteur du dossier (Louis ou Théophile, photos dans le kit `orem-da`).
