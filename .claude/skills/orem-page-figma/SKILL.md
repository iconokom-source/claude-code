---
name: orem-page-figma
description: Conçoit une nouvelle page du site Orem directement dans le fichier Figma Orem (onglet Site), à partir d'une trame de sections fournie par Louis (page secteur, page offre, page ville, landing). Respecte la DA du site au pixel près tout en inventant des sections nouvelles, avec les visuels des réalisations du secteur et uniquement des chiffres réels. À utiliser dès que Louis demande de « créer une page dans Figma », « maquetter une nouvelle page du site », « faire la page secteur X », donne une trame de page Orem, ou demande de « dupliquer une page pour le secteur Y ».
---

# Nouvelle page du site Orem dans Figma

Fichier : **Orem** `aVKI9kfuXoWvQsiRsajLXD` (https://www.figma.com/design/aVKI9kfuXoWvQsiRsajLXD/Orem), onglet **Site** (`2028:1326`).

Exemples validés par Louis : `/secteurs/hotellerie` (nœud `3815:1702`) et `/secteurs/medias` (`3836:1747`).

## Les quatre règles de Louis

1. **Ne jamais modifier l'existant.** On crée une nouvelle frame de page dans une zone vide de l'onglet Site. Aucun nœud existant n'est déplacé, renommé ou retouché. On ne fait que **cloner** ce qui doit l'être.
2. **La trame donne le fond, pas la forme.** Chaque section de la trame (rôle, contenu, CTA) devient une **composition nouvelle**, dessinée avec les invariants de la DA. Une trame qui cite une section existante (« structure du hero du template Offres ») indique le rôle, pas la mise en page.
   Exceptions, reprises telles quelles : la **nav**, le **footer**, la section **Méthode O.R.E.M.** (`2174:5281`) et la section **FAQ** (`2174:5376`, textes adaptés au secteur).
3. **Les visuels viennent des réalisations du secteur**, prises sur agence-orem.fr/realisations (ex. hôtellerie : Huchet-Demorge et Hôtel Eiffel Ségur, pas Casa Zanoni ; médias : Le Crayon, Riskintel, Bund Médias, Aktionnaire). Aucun chiffre ni avis inventé.
4. **Tout contenu répété est une collection CMS** (avis, cas, articles, FAQ, secteurs) : une liste d'éléments identiques qui tient avec n'importe quel nombre d'éléments.

## Prérequis

- Charger les skills Figma `figma-use` puis `figma-generate-design` (ressources `skill://figma/...` via `get_figma_skill`) avant le premier `use_figma`, et passer `skillNames` à chaque appel.
- Charger les outils Figma en une fois : `use_figma`, `get_screenshot`, `get_metadata`, `upload_assets`.
- Lire les références de ce skill :
  - `references/da-site.md` : grille, couleurs, typographie, signatures visuelles, éléments globaux à cloner ;
  - `references/sections.md` : sections existantes à ne pas refaire, sections inventées validées, banque d'idées, règles CMS ;
  - `references/visuels.md` : récupération et import des visuels, hash déjà présents, chiffres réels ;
  - `references/helpers.js` : boîte à outils à coller en tête de chaque script `use_figma` ;
  - `references/controle-qualite.md` : liste de contrôle avant de rendre.
- Règles de rédaction et vocabulaire Orem : celles du skill `orem-da` (vouvoiement, pas de tiret long, pas de « suivi », « agence » jamais « studio », offres O.R.E.M., chiffres officiels, CTA iClosed). Aucun prix sur une page du site.

## Déroulé

### 1. Comprendre la trame
Lister les sections dans l'ordre avec, pour chacune : rôle (SEO ou conversion), contenu variable, CTA, et s'il s'agit d'une des reprises autorisées. Identifier le mot-clé du H1 et le secteur.
Si une information manque (secteur ambigu, réalisations à rattacher), poser la question avant de dessiner.

### 2. Rassembler la matière réelle
- Réalisations du secteur : pages `/realisations/<slug>` du site. En tirer la question du cas, le contexte, les chiffres de résultat, les visuels (voir `visuels.md`).
- Avis : bloc avis de la page d'accueil du site (texte exact, nom, fonction). Mettre en premier l'avis d'un client du secteur.
- Articles : titres réels de https://www.agence-orem.fr/blog (liens `/articles/<slug>`).
- Si les visuels ne sont pas encore dans le fichier : les télécharger, les convertir en JPG, les importer via `upload_assets` dans une frame `sources-visuels/<secteur>` posée hors des pages (à droite, vers x = 9600), et ajouter leurs hash dans `visuels.md`.

### 3. Créer la frame de page
Dans l'onglet Site, à droite de la dernière nouvelle page (première page à x = 2500, y = -8295, puis + 1700 en x à chaque page), vérifier que la zone est vide, puis créer une frame auto-layout verticale de 1500 px, fond `#f8f8f7`, nommée comme son URL (`/secteurs/<secteur>`). Y cloner le footer (`2158:2237`).
Pour « dupliquer une page pour un autre secteur », cloner la frame validée et remplacer **tous** les textes, visuels, logos, chiffres et l'ambiance du hero ; refaire la liste des cas selon le nombre de réalisations du secteur.

### 4. Concevoir avant de construire
Pour chaque section à dessiner, choisir une composition qui :
- remplit le rôle de la trame ;
- ne ressemble à aucune section existante (tableau de `sections.md`) ni à la même section d'une autre page secteur ;
- utilise les invariants (points de coin, titre deux tons, eyebrow, Trykker et Lexend Deca, rayons, ombres) ;
- alterne fonds clairs et sombres ;
- met en scène les visuels du secteur (collage, vignettes, grand visuel) et au moins une preuve chiffrée réelle dans le hero.
Donner au hero une **couleur d'ambiance propre au secteur** (dégradé vers `#f8f8f7`).

### 5. Construire section par section
Un appel `use_figma` par section (ou deux sections proches), avec `helpers.js` en tête et `ROOT_ID` renseigné. Après chaque appel :
1. renvoyer le footer en dernier (`footerLast()`) ;
2. capture de la section (`get_screenshot`, `maxDimension` 1300), téléchargée et regardée ;
3. correction ciblée si besoin, sans tout reconstruire.

Pièges déjà rencontrés (et réglés dans `helpers.js`) :
- `resize()` fige la hauteur : repasser `layoutSizingVertical = 'HUG'` (`fixWidth`) ;
- la nav clonée est en position absolue : `layoutPositioning = 'AUTO'` (`navLight`) ;
- le composant `animation-cta` est un bouton en verre invisible sur fond clair : pilule noire « ↳ » à la place ;
- « ↗ » s'affiche en carré bleu (glyphe absent) : utiliser « → » ;
- le clone du bandeau de logos du site est vide : utiliser les logos importés (`logoStrip`) ;
- les images ne s'importent qu'avec un `imageHash` déjà présent dans le fichier.

### 6. Finitions et contrôle
- `typoPass(ROOT)` sur la page (espaces insécables, flèches).
- Capture de la page entière (`maxDimension` 7000 à 9000), découpée en tranches pour la relire.
- Dérouler `controle-qualite.md` et corriger.

### 7. Rendre
Donner à Louis le lien direct vers la frame (`https://www.figma.com/design/aVKI9kfuXoWvQsiRsajLXD/Orem?node-id=<id avec tiret>`), la liste des sections avec leur parti pris visuel, les sources des chiffres et des avis, et ce qui reste à valider (liste des autres secteurs, articles à relier, liens).
Si Louis corrige une règle, mettre ce skill à jour (`sections.md`, `da-site.md`) pour que la correction serve aux pages suivantes.
