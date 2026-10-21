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

## Sections inventées et validées (page Hôtellerie, 3815:1702)

Elles montrent le niveau attendu. **Ne pas les recopier non plus d'une page secteur à l'autre** : changer au moins la composition d'une page à l'autre (inverser, passer en sombre, changer le nombre de colonnes, la mise en scène des visuels).

| # | Rôle | Composition |
|---|---|---|
| 1 | Hero clair 2 colonnes | dégradé d'ambiance du secteur ; eyebrow cible, H1 serif deux tons avec mot-clé, intro, pilule noire « ↳ » + lien ; note Google ; **collage** de 3 visuels du secteur en rayon 24 qui se chevauchent avec ombres et une **pastille de preuve chiffrée réelle** ; bandeau de logos gris pleine largeur avec ceux du secteur en tête |
| 2 | Enjeux du secteur | **index éditorial** : en-tête deux tons + intro à droite ; 5 lignes à filets, numéro Trykker 54 gris, H3 Trykker 27, trois colonnes Problème / Solution / Indicateur, l'indicateur en serif encre avec point bleu |
| 3 | Cas clients | section **nuit `#000012`** ; collection en grille 2 colonnes avec retour à la ligne, cartes de 618 px, colonne de droite **décalée de 120 px** ; grand visuel 16:10, 3 vignettes, nom du client en serif, question du cas, **chiffres réels** en Trykker 54 sur filet, tags en pilules contour |
| 4 | Pourquoi Orem | en-tête centré ; 3 cartes blanches **en escalier** (0, 64, 128 px), visuel en haut, numéro bleu, H3, texte |
| 5 | Témoignages | section blanche ; en-tête deux tons avec chiffres officiels, note Google et flèches ; **rail de collection** `avis-list` qui déborde à droite : cartes `avis-item` identiques 416 px sur `#f8f8f7`, citation Trykker 18, espace flexible, filet puis auteur (photo ronde 44, nom, fonction). L'avis du secteur en premier. Une première version en carte vedette bleue a été refusée : fond bleu hors DA, texte collé au nom, pas pensée pour une collection |
| 6 | Nos offres | 4 cartes O, R, E, M de **hauteurs croissantes** ; l'offre la plus liée au secteur en grande carte nuit avec visuel du secteur et lien orange |
| 7 | Méthode O.R.E.M. | **section officielle reprise telle quelle** (`2174:5281`) |
| 8 | Articles liés | section blanche ; **liste éditoriale** à filets : vignette typographique (dégradé bleu nuit + mot Trykker), tag, titre serif, accroche liée au secteur, bouton rond |
| 9 | FAQ + CTA final | **section officielle reprise** (`2174:5376`) : titre adapté au secteur, onglets masqués, 5 questions du secteur, la première ouverte avec une réponse appuyée sur un chiffre réel |
| 10 | Autres secteurs | bande blanche basse ; label à gauche, liens Trykker 27 en ligne séparés par « / », le premier en encre, les autres en gris |

## Banque d'idées pour varier

- **Hero** : visuel plein cadre avec texte en carte flottante ; titre centré très large et visuels en éventail dessous ; split image à fond perdu à droite ; mosaïque bento de 5 visuels ; avant/après du site du client.
- **Enjeux** : grille bento de tailles inégales ; cartes « symptôme » sombres avec indicateur en grand chiffre ; schéma en entonnoir (découverte, décision, réservation) ; onglets horizontaux.
- **Preuves** : bandeau de chiffres réels géants ; citation plein écran sur visuel ; frise avant/après ; carte « résultat » par client.
- **Arguments** : 3 colonnes séparées par des filets verticaux ; liste numérotée avec visuel qui change ; carte unique horizontale avec 3 volets.
- **Offres / méthode** : lettres O.R.E.M. géantes en fond ; accordéon horizontal ; tableau comparatif.
- **Fin de page** : grande bande CTA nuit avec visuels du secteur ; carte contact avec le porteur du dossier (Louis ou Théophile, photos dans le kit `orem-da`).
