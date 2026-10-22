# DA du site Orem dans Figma : les invariants

Relevés dans le fichier Figma Orem (`aVKI9kfuXoWvQsiRsajLXD`), onglet **Site** (`2028:1326`). Ce sont les éléments qui font qu'une page « est Orem ». Tout le reste (composition, rythme, mise en scène) doit être réinventé à chaque page.

## Grille

- Frame de page : **1500 px** de large, fond `#f8f8f7`, `clipsContent`.
- Conteneur de contenu : **1300 px**, centré (marges de 100 px).
- Nav et rangées de points : **1436 px** (marges de 32 px).
- Rythme vertical : sections de 96 à 160 px de padding haut et bas ; 56 à 80 px entre l'en-tête de section et son contenu ; 24 à 32 px entre les cartes.
- Tout est en auto-layout (exigence pour l'intégration Webflow Client First).

## Couleurs (collection « Couleurs »)

| Rôle | Valeur | Usage |
|---|---|---|
| typography/primary | `#000012` | texte principal ; fond des sections « nuit » |
| typography/secondary | `#434242` à 60 % | paragraphes, 2e ligne des titres |
| typography/tertiary | `#434242` à 35 % | numéros, lettres géantes |
| background/secondary | `#f8f8f7` | fond de page |
| background/primary | `#ffffff` | cartes, sections blanches |
| accent | `#092482` | eyebrows, points, petits textes d'accent. **Jamais en fond de carte ou de section** (refusé par Louis) |
| orange | `#ff6200` | **uniquement sur fond sombre** : eyebrow, CTA, point actif |
| noir | `#000000` | sections méthode, footer |
| carte sur noir | `#161617` | cartes en section noire |
| filet | `#cdcdcd` | séparateurs de listes |
| points sur clair | `#e4e4e3` | points de coin |

Fonds de section possibles : `#f8f8f7`, `#ffffff`, `#000012`, `#000000`, et un **dégradé d'ambiance propre à la page** pour le hero (voir plus bas). Alterner clair et sombre pour rythmer la page ; jamais deux sections sombres de suite.

## Typographie (styles « Web typeramp »)

| Style | Police | Usage |
|---|---|---|
| Slide typeramp/Display | Trykker 94 | lettres O.R.E.M. géantes, chiffres, mots de vignettes |
| Heading 1 | Trykker 54 / 110 % / -3 % | H1, chiffres de résultats, titres de section sombre |
| Heading 2 | Lexend Deca Regular 43 / 110 % / -3 % | H2 de section, **en deux tons** |
| Heading 3 | Trykker 34 / 130 % | citations, titre de carte CTA |
| Heading 4 | Trykker 27 / 120 % | H3 de cartes et de lignes |
| Heading 5 | Lexend Deca Regular 22 | signes +/− |
| Heading 6 | Trykker 18 | nav, citations courtes, indicateurs |
| Heading 6 (sans) | Lexend Deca Regular 18 | questions de FAQ |
| Paragraph | Lexend Deca Light 14 / 120 % / -1 % | corps de texte |
| Button | Lexend Deca Medium 14 | boutons, noms |
| Caption | Lexend Deca Light 11 | eyebrows, légendes, tags |

Toujours appliquer le style (`setTextStyleIdAsync`), jamais une taille en dur. Les IDs sont dans `helpers.js`.

## Signatures visuelles (à garder sur chaque page)

1. **Les points de coin** : deux points organiques (vecteur « Union », `2856:2082`, 12 × 11 px) en haut et en bas de chaque section, à 24 ou 32 px des bords, et en 8 px dans les cartes. Couleur `#e4e4e3` sur clair, `#333333` sur noir, `#092482` ou blanc sur les zones d'accent. Toujours cloner le vecteur, jamais une ellipse.
2. **Le titre deux tons** : ligne 1 en encre, ligne 2 en gris à 60 % (ou blanc à 50 % sur sombre).
3. **L'eyebrow** : petite ligne Caption 11 au-dessus de chaque titre, bleu `#092482` sur clair, orange sur sombre.
4. **Le mélange serif / sans** : Trykker pour l'émotion (H1, titres de cartes, citations, chiffres), Lexend Deca pour la structure (H2, paragraphes, UI).
5. **Rayons** : 24 px pour les cartes et grands visuels, 16 px pour les vignettes, 9999 pour les pilules, 12 px pour les petites images.
6. **Ombres** : styles d'effet `light-elevations/*` uniquement, sur les visuels flottants et les pastilles.
7. **Boutons** : pilule noire « ↳ libellé » sur clair ; pilule blanche ou orange sur sombre ; lien texte avec « › ». Le composant `animation-cta` (2180:6481) est un bouton en verre réservé aux fonds sombres.

## Le hero : une ambiance propre à chaque page

Chaque page du site a son propre dégradé de hero : nuit bleue (accueil), orange (offre), bleu ciel (services), bleu vers blanc (à propos), blanc vers bleu (réalisations). Une nouvelle page reçoit **sa** couleur d'ambiance, tirée de l'univers du secteur ou du client, toujours en dégradé linéaire du haut vers `#f8f8f7`. Exemple validé : hôtellerie, `#cfd8ea` → `#e9ecf2` → `#f8f8f7` (bleu-gris des illustrations Eiffel Ségur).

## Éléments globaux, toujours repris tels quels

| Élément | Nœud à cloner | Remarque |
|---|---|---|
| Nav claire (texte encre) | `2856:2147` | remettre `layoutPositioning = 'AUTO'` après clonage |
| Nav sombre (texte blanc) | `2174:5014` | pour un hero sombre |
| Footer | `2158:2237` (« footer content ») | toujours dernier enfant de la page |
| Note Google ★ | `2174:5003` | modifier le texte, laisser l'étoile |
| Bouton CTA animé orange | component set `2768:6461` (« animation button cta ») | CTA final sur fond sombre, libellé « Rencontrer l'équipe » |
| Section **Méthode O.R.E.M.** (« Quatre lettres pour ne rien laisser au hasard. ») | `2174:5281` | reprise **telle quelle**, sans modification |
| Section **FAQ** (« Tout ce que vous voulez savoir ») | `2174:5376` | reprise ; on change le titre, les questions, la réponse ouverte ; on masque les onglets de catégories si la trame demande une seule liste |

Rien d'autre n'est cloné : toutes les autres sections sont dessinées.
