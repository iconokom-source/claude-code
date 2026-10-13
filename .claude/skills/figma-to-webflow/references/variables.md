# Variables du projet

Objectif : **aucune valeur de design en dur** dans les classes. Chaque couleur, police, taille de texte, espacement, rayon et largeur de conteneur est une variable Webflow, reliée aux classes avec `variable_as_value`.

## 1. Source des valeurs

1. **Variables ou styles Figma présents** (`get_variable_defs`) : les reprendre tels quels, en conservant leur organisation, renommés selon la convention ci-dessous. Noter la correspondance Figma → Webflow dans le journal.
2. **Absents ou partiels** : déduire les variables depuis les valeurs brutes de `get_design_context` :
   - **Couleurs** : regrouper les hex identiques (casse ignorée, opacité comprise). Fusionner deux couleurs quasi identiques (moins de 2 % d'écart sur chaque canal) en gardant la plus utilisée ; signaler la fusion dans le rapport.
   - **Tailles de texte** : une variable par taille réellement utilisée, rangées en échelle (H1 → H6, Large → Tiny). Plus de 10 tailles de texte = incohérence de maquette : rapprocher les tailles à 1 ou 2 px près et le signaler.
   - **Espacements** : ramener chaque valeur à l'échelle d'espacement ci-dessous si l'écart est de 2 px ou moins. Si la maquette suit une autre grille cohérente (par exemple 4 px), adapter les valeurs de l'échelle à cette grille.
   - **Rayons, bordures** : une variable par valeur distincte.
3. Conversion : `rem = px / 16`, arrondi à 3 décimales (`scripts/echelle_responsive.py rem 24` → `1.5rem`).

## 2. Collections et nommage

Les noms de variables sont en anglais (convention Client First). Le `/` crée des groupes dans le panneau Variables ; si l'outil le refuse, utiliser ` - ` à la place et le noter dans le journal.

### `Primitives` (un seul mode) — la palette brute
- `Color / Neutral / White`, `Color / Neutral / Lightest`, `Color / Neutral / Lighter`, `Color / Neutral / Light`, `Color / Neutral / Base`, `Color / Neutral / Dark`, `Color / Neutral / Darker`, `Color / Neutral / Darkest`, `Color / Neutral / Black`
- `Color / Brand / Primary`, `Color / Brand / Secondary`, `Color / Brand / Accent` (+ déclinaisons `Light`, `Dark` si la maquette en a)
- `Color / System / Success`, `Color / System / Error`, `Color / System / Warning` (si formulaires)
- `Font / Primary`, `Font / Secondary` (variables de famille de police, avec pile de repli : `"Inter", Arial, sans-serif`)

Les classes **ne pointent jamais directement** vers les primitives de couleur. Elles passent par `Theme`.

### `Theme` (un mode par schéma de couleur) — les rôles
Modes : `Light` (par défaut) et un mode par autre ambiance présente dans la maquette (`Dark`, `Brand`…). Chaque variable est un **alias** vers une primitive :
- `Background / Primary`, `Background / Secondary`, `Background / Alternate`
- `Text / Primary`, `Text / Secondary`, `Text / Alternate`, `Text / Muted`
- `Border / Primary`, `Border / Secondary`
- `Accent / Primary`, `Accent / Primary Hover`
- `Button / Primary Background`, `Button / Primary Text`, `Button / Secondary Border`…
- `Focus / Ring`

Les classes utilitaires `color-scheme-1`, `color-scheme-2`… appliquent chaque mode (`set_style_variable_mode`). Une section sombre reçoit `color-scheme-2` : tout son contenu (textes, boutons, bordures) s'adapte sans aucune classe supplémentaire. C'est la manière de gérer les sections claires et sombres.

### `Responsive` (modes `Desktop`, `Tablet`, `Mobile`) — tout ce qui change selon l'écran
- `Heading / H1 / Size` … `Heading / H6 / Size`, et `Heading / H1 / Line Height` si les interlignes diffèrent
- `Text / Large / Size`, `Text / Medium / Size`, `Text / Regular / Size`, `Text / Small / Size`, `Text / Tiny / Size`
- `Section / Padding Large`, `Section / Padding Medium`, `Section / Padding Small`
- `Global / Padding X` (marge latérale de `padding-global`)
- `Gap / Large`, `Gap / Medium`, `Gap / Small` (espacements entre colonnes et cartes)

Valeurs tablette et mobile : calculées par `scripts/echelle_responsive.py` (règles dans `responsive.md`), sauf si une maquette tablette ou mobile fournit la valeur exacte.

Application : `set_style_variable_mode` sur la classe `page-wrapper` :
- breakpoint `main` → mode `Desktop`
- breakpoint `medium` → mode `Tablet`
- breakpoint `small` → mode `Mobile` (hérité par `tiny`)

Vérifier avec `get_style_variable_modes`. Si l'application de mode par breakpoint échoue, solution de repli : surcharger les classes utilitaires concernées (`heading-style-h1`, `padding-section-large`…) au breakpoint, avec les mêmes variables déclinées (`Heading / H1 / Size Tablet`). Noter le repli dans le journal.

### `Spacing` (un seul mode) — l'échelle fixe des utilitaires
| Variable | rem | px |
|---|---|---|
| `Space / Tiny` | 0.125 | 2 |
| `Space / XXSmall` | 0.25 | 4 |
| `Space / XSmall` | 0.5 | 8 |
| `Space / Small` | 1 | 16 |
| `Space / Medium` | 2 | 32 |
| `Space / Large` | 3 | 48 |
| `Space / XLarge` | 4 | 64 |
| `Space / XXLarge` | 5 | 80 |
| `Space / Huge` | 6 | 96 |
| `Space / XHuge` | 8 | 128 |
| `Space / XXHuge` | 12 | 192 |

Garder ces noms mais adapter les valeurs si la maquette suit une autre échelle.

### `Radius` (modes Desktop / Tablette / Mobile) — arrondis responsive
Les arrondis diminuent en allant vers le mobile (jamais d'arrondi en px en dur sur une classe) :

| Variable | Desktop | Tablette | Mobile |
|---|---|---|---|
| `Radius / Small` | 8 px | 6 px | 4 px |
| `Radius / Medium` | 16 px | 12 px | 8 px |
| `Radius / Large` | 32 px | 24 px | 16 px |
| `Radius / Card` (si la maquette a ~40-48 px) | valeur Figma | ≈ 70 % | ≈ 45 % |
| `Radius / Round` | 999 px | 999 px | 999 px |

Adapter les valeurs desktop à la maquette, garder la proportion de réduction.

### `UI` (un seul mode) — tout le reste
- `Border / Width` (1px)
- `Container / Large` (80rem), `Container / Medium` (64rem), `Container / Small` (48rem)
- `Max Width / XSmall` … `Max Width / XXLarge`
- `Button / Padding Y`, `Button / Padding X`, `Button / Radius`
- `Transition / Duration` (nombre, ex. 0.3)

Les ombres ne sont pas un type de variable Webflow : les définir sur des classes dédiées (`shadow-small`, `shadow-medium`) et ne les créer qu'une fois.

## 3. Création

1. `data_variable_tool > get_variable_collections` : ne pas recréer une collection ou une variable existante ; la mettre à jour si besoin.
2. Créer les collections, puis les modes (`create_variable_mode`), puis les variables (`create_color_variable`, `create_size_variable`, `create_font_family_variable`, `create_number_variable`).
3. Valeurs : `static_value` pour les primitives ; `existing_variable_id` pour les alias de `Theme` ; `custom_value` uniquement si une fonction CSS est indispensable (`clamp()`, `calc()`).
4. Noter chaque identifiant de variable dans le journal : le registre des styles s'en sert pour `variable_as_value`.

## 4. Contrôle

- Aucune classe ne doit contenir une couleur, une taille de texte, un rayon ou un espacement en valeur brute, à l'exception de `0`, `auto`, `100%` et des valeurs de mise en page (fractions de grille, `aspect-ratio`).
- Chaque variable créée doit être utilisée au moins une fois, sinon la supprimer (elle a été créée par le skill, donc pas de point d'arrêt).
