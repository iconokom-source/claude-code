# Client First : conventions appliquées

Référence : Client First v2 de Finsweet, adaptée aux variables natives Webflow. Si le site contient déjà un starter Client First, **ses classes existantes priment** : on les réutilise et on relie leurs valeurs aux variables du projet au lieu de créer des équivalents.

## 1. Structure de page

```
body
└── page-wrapper
    ├── [Composant] Global styles (HtmlEmbed, si nécessaire)
    ├── [Composant] Navbar
    ├── main-wrapper (balise main)
    │   └── section_[nom] (balise section)            ← racine du composant de section
    │       └── padding-global
    │           └── container-large | container-medium | container-small
    │               └── padding-section-large | padding-section-medium | padding-section-small
    │                   └── [nom]_component
    │                       └── [nom]_content, [nom]_image-wrapper, [nom]_list…
    └── [Composant] Footer
```

Règles :
- `section_[nom]` ne porte que ce qui concerne la section entière : couleur de fond, position relative, overflow. Jamais de padding (c'est le rôle de `padding-global` et `padding-section-*`).
- `padding-global` gère la marge latérale (variable `Global / Padding X`, qui change selon le mode responsive).
- Choisir le conteneur selon la largeur utile dans Figma : `container-large` (80rem = 1280 px), `container-medium` (64rem = 1024 px), `container-small` (48rem = 768 px). Si la maquette a une largeur utile différente, ajuster la variable `Container / Large` plutôt que de créer un nouveau conteneur.
- Si une section va bord à bord (image plein écran), retirer seulement le conteneur, pas `padding-global`, sauf si le visuel touche réellement les bords.

## 2. Nommage des classes

### Classes personnalisées
- Format : `[composant]_[élément]`, tout en minuscules, mots séparés par des tirets : `hero_component`, `hero_content`, `hero_image-wrapper`, `team_card`, `team_card-image`.
- Le préfixe avant le `_` crée un dossier dans le panneau Styles. Un préfixe = un composant ou une section.
- Nommer selon **le rôle**, jamais selon l'apparence ou la position : `pricing_card-highlight` et non `pricing_card-blue` ni `pricing_card-left`.
- Section unique sur le site : préfixe descriptif (`home-hero_`). Section réutilisée sur plusieurs pages : préfixe générique (`cta_`, `faq_`, `logos_`).
- Quand une structure est identique entre deux sections, **elles partagent le même préfixe** et donc les mêmes classes. Exemple : deux grilles de cartes identiques sur « Services » et « Projets » deviennent `card-grid_` et non `services_grid` et `projects_grid`.

### Combo classes (variantes)
- Toujours préfixées `is-` : `is-reverse`, `is-dark`, `is-large`, `is-active`.
- Une combo s'ajoute **sur une classe personnalisée ou sur `button`**, jamais seule et jamais sur une classe utilitaire.
- Une seule combo par élément de préférence, deux au maximum. Au-delà, créer une variante de composant ou une nouvelle classe.
- Pour une variation de composant (fond sombre, image à gauche), préférer une **variante de composant Webflow** quand l'écart concerne plusieurs éléments du composant (voir `composants.md`).

### Classes utilitaires (globales)
Utilisées directement dans le HTML, cumulables, sans `_` :

| Famille | Classes |
|---|---|
| Structure | `page-wrapper`, `main-wrapper`, `padding-global`, `container-large`, `container-medium`, `container-small`, `padding-section-large`, `padding-section-medium`, `padding-section-small` |
| Titres | `heading-style-h1` à `heading-style-h6` |
| Texte | `text-size-large`, `text-size-medium`, `text-size-regular`, `text-size-small`, `text-size-tiny` |
| Graisse | `text-weight-xbold`, `text-weight-bold`, `text-weight-semibold`, `text-weight-medium`, `text-weight-normal`, `text-weight-light` |
| Style | `text-style-allcaps`, `text-style-italic`, `text-style-muted`, `text-style-nowrap`, `text-style-link`, `text-style-quote` |
| Alignement | `text-align-left`, `text-align-center`, `text-align-right` |
| Couleurs | `text-color-primary`, `text-color-secondary`, `text-color-alternate`, `background-color-primary`, `background-color-secondary`, `background-color-alternate` (noms sémantiques reliés à la collection `Theme`) |
| Schémas de couleur | `color-scheme-1`, `color-scheme-2`… (appliquent un mode de la collection `Theme`, voir `variables.md`) |
| Espacements | `margin-top`, `margin-bottom`, `margin-left`, `margin-right`, `margin-vertical`, `margin-horizontal`, `margin-0` combinées avec une taille : `margin-tiny`, `margin-xxsmall`, `margin-xsmall`, `margin-small`, `margin-medium`, `margin-large`, `margin-xlarge`, `margin-xxlarge`, `margin-huge`, `margin-xhuge`, `margin-xxhuge`. Même logique pour `padding-*`. |
| Largeur max | `max-width-xxsmall` à `max-width-xxlarge`, `max-width-full`, `align-center` |
| Affichage | `hide`, `hide-tablet`, `hide-mobile-landscape`, `hide-mobile-portrait`, `overflow-hidden` |
| Boutons | `button` + combos `is-secondary`, `is-small`, `is-large`, `is-text`, `is-icon` ; `button-group` |
| Icônes | `icon-1x1-small`, `icon-1x1-medium`, `icon-1x1-large`, `icon-height-small`… |
| Divers | `z-index-1`, `z-index-2`, `layer` (position absolue sur tout le parent), `pointer-events-none`, `spacer-*` |

Ne créer **que les utilitaires réellement utilisés** par la maquette (le registre le dit). Exception : la structure, les titres, les tailles de texte et `hide-*` sont toujours créés car le client en aura besoin.

Les combos d'espacement s'écrivent ainsi : un élément porte `margin-bottom` + `margin-medium`. La classe `margin-bottom` ne définit aucune valeur ; c'est la combo `margin-medium` (créée avec `parent_style_names: ["margin-bottom"]`) qui définit `margin-bottom` avec la variable `Space / Medium`.

## 3. Utilitaire ou classe personnalisée ?

1. Si l'élément peut être stylé **entièrement** avec 1 à 3 utilitaires → utilitaires uniquement.
2. Si l'élément a besoin d'une propriété qu'aucun utilitaire ne couvre (grille, ratio, position, bordure spécifique) → classe personnalisée qui porte **uniquement** ce qui manque. Texte et espacements restent en utilitaires quand c'est possible.
3. Si le même assemblage de 4 utilitaires ou plus se répète sur plus de 3 éléments → une classe personnalisée remplace cet assemblage.
4. Les marges entre éléments d'un même composant : préférer `gap` (flex ou grid) sur le parent plutôt que des marges sur chaque enfant.

## 4. Styles de balises

À définir sur les balises (et non via des classes) :
- `body` : police primaire, `Text / Regular` en taille, couleur `Text / Primary`, line-height, fond `Background / Primary`.
- `h1`–`h6` : police, graisse, taille et line-height de `heading-style-h1`–`h6` (les mêmes variables), marges à 0.
- `p` : marges à 0. `a` : couleur héritée.
- `img` : `max-width: 100%`, `display: inline-block` (défaut Webflow, à vérifier).

Les classes `heading-style-h*` servent à donner l'apparence d'un niveau sans changer la balise (par exemple un `h2` qui ressemble à un `h4`).

## 5. Code global (« Global styles »)

Si nécessaire, créer un composant « Global styles » placé en haut de `page-wrapper`, contenant un HtmlEmbed avec uniquement ce que Webflow ne sait pas faire :

```css
/* Lissage et rendu du texte */
body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
/* Le dernier enfant d'un rich text n'ajoute pas d'espace en bas */
.w-richtext > :first-child { margin-top: 0; }
.w-richtext > :last-child, .w-richtext ul li:last-child, .w-richtext ol li:last-child { margin-bottom: 0; }
/* Hériter la couleur et la police dans les liens et formulaires */
a, .w-input, .w-select, .w-tab-link, .w-nav-link, .w-dropdown-btn, .w-dropdown-toggle, .w-dropdown-link { color: inherit; text-decoration: inherit; font-size: inherit; }
/* Accessibilité : focus visible au clavier uniquement */
*[tabindex]:focus-visible, input[type="file"]:focus-visible { outline: 0.125rem solid var(--focus-color, currentColor); outline-offset: 0.125rem; }
/* Réduire les animations pour qui le demande */
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }
/* Pointer-events sur éléments marqués */
.pointer-events-off { pointer-events: none; }
```

Ne pas y mettre de styles de mise en page : tout ce qui est faisable dans Webflow se fait dans Webflow.

## 6. Interdits

- Classes génériques sans préfixe (`card`, `wrapper`, `div-block-12`, `text-block`).
- Classes nommées d'après une valeur (`text-24`, `blue-title`, `mt-32`).
- Classes nommées d'après une page alors que la section est réutilisable.
- Styles appliqués sur une classe utilitaire dans un contexte particulier (modifier `margin-small` pour une section casse tout le site).
- Combo sur une classe utilitaire (`text-size-large is-hero`).
- Styles en ligne, `!important`, sélecteurs CSS personnalisés dans les embeds pour corriger un layout.
