# Design system Webflow — site « Orem » (agence-orem.fr)

> Audit en lecture seule réalisé le 21/10/2026 via le MCP Webflow (site_id `6a7582303b9ddd4a77302cc8`).
> Sources : `data_variable_tool`, `data_style_tool` (752 styles, base + breakpoints + :hover), `data_component_tool`, `data_interactions_tool`, `data_fonts_tool`, `data_assets_tool`, `data_scripts_tool`.
> Index exhaustif des classes : `classes-index.md` (à grepper AVANT toute création de classe).

**Chiffres clés** : 752 styles (259 classes globales, 482 combos, 11 balises) · 7 collections de variables / 215 variables (seules 16 sont réellement utilisées par les styles) · 13 composants · 0 interaction IX3 (les animations natives sont en IX2 legacy, invisibles via l'API) · 0 police uploadée (Google Fonts) · 444 assets · ~82 Ko de code custom site-wide + 31 scripts enregistrés (dont 4 appliqués au site, 3 à des pages).

**Breakpoints** : `designer_tool > get_all_breakpoints` a échoué (Designer non ouvert / app MCP Bridge non lancée). Les styles ne contiennent que les breakpoints standard Webflow : `main` (desktop, base), `medium` (≤ 991 px, tablette), `small` (≤ 767 px, mobile paysage), `tiny` (≤ 479 px, mobile portrait). Aucun style sur `large` / `xl` / `xxl` (1280/1440/1920) → le site n'utilise pas les breakpoints larges. Répartition des surcharges : 111 styles en `tiny`, 64 en `medium`, 64 en `small` (177 styles responsive au total). Les media queries du code custom utilisent les mêmes seuils (991 / 767 / 479), plus un `max-width:1280px` ponctuel (page À propos).

---

## 1. Méthodologie de nommage

**Ce n'est PAS du Client-First.** Il n'existe aucune classe `padding-global`, `container-large/medium/small`, `padding-section-*`, `text-size-*`, `heading-style-*`, `margin-*`, `spacer-*`. Le site suit une méthode maison « classe de base + empilement de combos descriptifs » :

1. **Classes de base génériques (globales)** qui portent peu ou pas de styles et servent de racine à des chaînes de combos :
   - `section` (flex column, centré, fond transparent) → combos de padding/gap/couleur : `section > 128px-haut > 64px-gap`, `section > noir`, `section > #f8f8f7`…
   - `page-padding` (max-width 1300 px, padding latéral 32 px → 16 px en `tiny`) = l'équivalent maison de `padding-global` + `container-large`.
   - `container` (width 100 %) → plus de 100 combos de layout : `container > 24px-vertical` (flex column, gap 24), `container > 16px-horizontal`, `container > space-between > center`…
   - `primary-text` (police Trykker) / `secondary-text` (police Lexend Deca) → combos de taille (`_18px`, `_27px`, `_54px`…), puis couleur (`blanc`, `60%`, `F2F2F2`), puis alignement (`center`) et largeur (`max-700px`).
   - `image` (vide) → combos de dimension (`24px`, `40px-rond`, `100%`, `100%-vw`, `cover`, `absolute`…).
   - `button` → variantes `black`, `blanc`, `noir`, `primary`, `secondary`, `third`, puis modificateurs (`no-max-width`, `inverse`, `full-16px-padding`).
2. **Les combos encodent la valeur dans le nom** (`64px-padding-bas`, `24px-gap`, `max-580px`, `1300px`, `128px-padding-haut`) — souvent en français (`haut`, `bas`, `gauche`, `droite`, `blanc`, `noir`, `gris`) mélangé à de l'anglais (`center`, `auto`, `full`, `hide`). Les noms commençant par un chiffre ou contenant `%` sont slugifiés par Webflow avec un `_` initial et `--` pour `%` (ex. `100%-vw` → sélecteur `._100--vw`, `1x2-grid` → `._1x2-grid`).
3. **Classes « composant/section » en kebab-case** sans préfixe de section systématique : `case-card`, `pb-clients-card`, `problematique-card`, `process-*`, `faq-*`, `li-*` (posts LinkedIn), `p404-*` (page 404), `blog-filter-*`, `collection-list-*` / `collection-item-*` / `collection-list-wrapper-*` (une par collection CMS).
4. **Underscore Client-First** présent seulement dans 4 classes importées : `fs-toc_*` (Finsweet TOC), `testimonials_component`, `testimonials_mask`, `section_testimonials`.
5. **Noms par défaut Webflow non renommés** : `Div`, `List Item`, `Collection List 2/3/4`, `Collection List Wrapper`, `Tabs Content 2`, `Tab Pane [Tab 1]`, `Tab Pane [Tab 2]`, `Menu button`, `Nav Link`, `Nav Divider`, `Nav Menu Two`, `Nav Menu Wrapper`, `Navbar Brand`, `Navbar Logo Left`, `Navbar Logo Left Container` (> `Shadow Three`), `Navbar Wrapper`, `Mobile Margin Top 10`, `Utility Page Content`, `Utility Page Wrap`, `Texte` (> `Police Secondaire` > `20px` > `80%` > `Hide`).

**Règle pour le futur skill** : on ne réécrit pas la méthode. Pour un nouvel élément, chercher d'abord une chaîne existante dans `classes-index.md` (ex. un bloc flex vertical gap 24 = `container` + `24px-vertical`), puis seulement en dernier recours ajouter UN combo dans la chaîne existante en respectant la convention « valeur-en-px + direction FR » (`64px-padding-bas`, `32px-gap`).

---

## 2. Variables

7 collections, 215 variables. Convention de noms Webflow « dossiers » (`typography/primary`, `buttons/primary/hover`) → CSS `--_<collection>---<dossier>--<nom>`. Les collections `Couleurs`, `Typography`, `Numbers`, `Radius`, `Primitives` forment un vrai système à deux niveaux (primitives → sémantiques, avec modes Dark / Mobile) **mais il est quasi inutilisé** : les styles référencent seulement 16 variables, majoritairement de la vieille « Base collection ».

| Collection | id | Modes | Rôle |
|---|---|---|---|
| Base collection | `collection-95658950-3402-b18a-3d23-96eaf58c41ee` | Base | Ancienne collection « fourre-tout » : polices, blanc, orange, tailles px nommées par leur valeur (`--12`, `--14`, `--18`, `--54`). **C'est elle qui est réellement utilisée.** |
| Couleurs | `collection-5877a9ab-5626-4fe6-4ffe-e394de3b2e30` | Base, Dark (`mode-53fc18f1-3271-e72a-fb0b-092401f66aa4`) | Tokens sémantiques (texte, fonds, fills, boutons, strokes), alias vers Primitives. |
| Primitives | `collection-307b275d-33e7-b00b-a126-8d8951183354` | Base, Dark (`mode-a495cdd8-2c5d-7d56-39d7-73b6d3b29a77`) | Palette de 15 teintes × 9 paliers (type palette Apple HIG). |
| Typography | `collection-4c683894-508e-4830-0f33-f609c2be0bb5` | Base, Mobile (`mode-789a5680-511c-18ed-a67f-7643ca47d150`) | Graisses et échelle de tailles (ratio 1,25, en nombres sans unité). **Aucune utilisation dans les styles.** |
| Numbers | `collection-aa610052-3ed0-c219-29c4-767ecc556142` | Base | Échelle d'espacements (nombres sans unité = px, nommés en rem). **Aucune utilisation directe.** |
| Radius | `collection-2d42fed6-7c74-f094-a506-1968b3ffabe2` | Base | Rayons (alias vers Numbers). **Aucune utilisation.** |
| animation-footer | `collection-3ae88bb7-911d-8c3a-f753-28f10340ef95` | Base, Mode 2 (`mode-10d9d0fd-0e9c-ef0b-8e35-fe65e4870e88`) | Une seule variable `hauteur` (400 / 64), reliquat d'une animation de footer. |

**Variables réellement référencées par les styles** (nombre de références) : `--secondary-font` (20), `--12` (12, rayons des vignettes image), `--primary-font` (8), `--_couleurs---stroke--secondary` (8), `--orange-orem` (5), `--_couleurs---background--secondary` (5), `--_couleurs---typography--primary` (5, dont 4 en :hover), `--blanc-principal` (4), `--_couleurs---accent` (4), `--_couleurs---stroke--primary` (3), `--_couleurs---buttons--primary--default` (3), `--14`, `--18`, `--54`, `--_couleurs---buttons--primary--hover`, `--_primitives---monochrome--900` (1 chacune). Toutes les références pointent vers des variables existantes.

**Règle pour le futur skill** : pour toute couleur/police, lier une variable plutôt qu'une valeur en dur. Couleurs de marque : orange `--orange-orem` (#FF6200), bleu `--_couleurs---accent` (#092482), texte `--_couleurs---typography--primary` (#000012), fond clair `--_couleurs---background--secondary` (#F8F8F7), blanc cassé `--blanc-principal` (#F2F2F2), noir carte `--_primitives---monochrome--800` (#1D1D1F). Attention : `--_couleurs---accent` vaut #FF6200 (orange) en mode Dark, pas bleu.

#### Base collection (9 variables)

| Nom | Type | CSS | Valeur |
|---|---|---|---|
| primary-font | FontFamily | `--primary-font` | Trykker |
| blanc-principal | Color | `--blanc-principal` | #f2f2f2 |
| 12 | Size | `--12` | 12px |
| secondary-font | FontFamily | `--secondary-font` | Lexend Deca |
| 54 | Size | `--54` | 54px |
| 14 | Size | `--14` | 14px |
| color | Color | `--color` | white |
| 18 | Size | `--18` | 18px |
| orange-orem | Color | `--orange-orem` | hsla(23.058823529411768, 100.00%, 50.00%, 1.00) |

#### Couleurs (24 variables)

| Nom | Type | CSS | Base | Mode 2 |
|---|---|---|---|---|
| accent | Color | `--_couleurs---accent` | #092482 | #FF6200 |
| typography/primary | Color | `--_couleurs---typography--primary` | #000012 | #F2F2F2 |
| typography/secondary | Color | `--_couleurs---typography--secondary` | #43424299 | #F2F2F299 |
| typography/Tertiary | Color | `--_couleurs---typography--tertiary` | #43424259 | #F2F2F259 |
| typography/Quaternary | Color | `--_couleurs---typography--quaternary` | #43424233 | #F2F2F233 |
| background/primary | Color | `--_couleurs---background--primary` | #FFFFFF | #000000 |
| background/secondary | Color | `--_couleurs---background--secondary` | #F8F8F7 | #1D1D1F |
| fills/elevated | Color | `--_couleurs---fills--elevated` | #FFFFFF | #1D1D1F |
| fills/primary | Color | `--_couleurs---fills--primary` | #9392921F | #9392921F |
| fills/secondary | Color | `--_couleurs---fills--secondary` | #3C3C3B99 | #EAE9E899 |
| fills/tertiary | Color | `--_couleurs---fills--tertiary` | #66656433 | #66656433 |
| fills/liquid glass | Color | `--_couleurs---fills--liquid-glass` | #FFFFFFCC | #1D1D1FCC |
| buttons/primary/default | Color | `--_couleurs---buttons--primary--default` | → `--_primitives---monochrome--800` | → `--_primitives---monochrome--200` |
| buttons/primary/hover | Color | `--_couleurs---buttons--primary--hover` | → `--_primitives---monochrome--900` | → `--_primitives---monochrome--100` |
| buttons/primary/content | Color | `--_couleurs---buttons--primary--content` | → `--_primitives---monochrome--200` | → `--_primitives---monochrome--800` |
| buttons/secondary/default | Color | `--_couleurs---buttons--secondary--default` | → `--_primitives---monochrome--300` | → `--_primitives---monochrome--600` |
| buttons/secondary/hover | Color | `--_couleurs---buttons--secondary--hover` | → `--_primitives---monochrome--400` | → `--_primitives---monochrome--700` |
| buttons/secondary/content | Color | `--_couleurs---buttons--secondary--content` | → `--_primitives---monochrome--800` | → `--_primitives---monochrome--200` |
| buttons/disruptive/default | Color | `--_couleurs---buttons--disruptive--default` | → `--_primitives---red--500` | → `--_primitives---red--600` |
| buttons/disruptive/hover | Color | `--_couleurs---buttons--disruptive--hover` | → `--_primitives---red--600` | → `--_primitives---red--500` |
| buttons/disruptive/content | Color | `--_couleurs---buttons--disruptive--content` | → `--_primitives---monochrome--100` | → `--_primitives---monochrome--100` |
| stroke/primary | Color | `--_couleurs---stroke--primary` | → `--_primitives---monochrome--400` | → `--_primitives---monochrome--500` |
| stroke/secondary | Color | `--_couleurs---stroke--secondary` | → `--_primitives---monochrome--200` | → `--_primitives---monochrome--600` |
| stroke/tertiary | Color | `--_couleurs---stroke--tertiary` | → `--_primitives---monochrome--200` | #FFFFFF1A |

#### Typography (12 variables)

| Nom | Type | CSS | Base | Mode 2 |
|---|---|---|---|---|
| weight/Bold | Number | `--_typography---weight--bold` | 700 | 700 |
| weight/Semibold | Number | `--_typography---weight--semibold` | 600 | 600 |
| weight/Medium | Number | `--_typography---weight--medium` | 500 | 500 |
| weight/Regular | Number | `--_typography---weight--regular` | 400 | 400 |
| size/xs | Number | `--_typography---size--xs` | 13 | 11 |
| size/s | Number | `--_typography---size--s` | 16 | 14 |
| size/m | Number | `--_typography---size--m` | 20 | 18 |
| size/l | Number | `--_typography---size--l` | 25 | 22 |
| size/xl | Number | `--_typography---size--xl` | 31 | 27 |
| size/2xl | Number | `--_typography---size--2xl` | 39 | 34 |
| size/3xl | Number | `--_typography---size--3xl` | 49 | 43 |
| size/4xl | Number | `--_typography---size--4xl` | 61 | 54 |

#### Numbers (33 variables)

| Nom | Type | CSS | Valeur |
|---|---|---|---|
| none | Number | `--_numbers---none` | 0 |
| 0,25 rem | Number | `--_numbers---0-25-rem` | 4 |
| 0,5 rem | Number | `--_numbers---0-5-rem` | 8 |
| 0,75 rem | Number | `--_numbers---0-75-rem` | 12 |
| 1 rem | Number | `--_numbers---1-rem` | 16 |
| 1,25 rem | Number | `--_numbers---1-25-rem` | 20 |
| 1,5 rem | Number | `--_numbers---1-5-rem` | 24 |
| 1,75 rem | Number | `--_numbers---1-75-rem` | 28 |
| 2 rem | Number | `--_numbers---2-rem` | 32 |
| 2,25 rem | Number | `--_numbers---2-25-rem` | 36 |
| 2,5 rem | Number | `--_numbers---2-5-rem` | 40 |
| 2,75 rem | Number | `--_numbers---2-75-rem` | 44 |
| 3 rem | Number | `--_numbers---3-rem` | 48 |
| 3,25 rem | Number | `--_numbers---3-25-rem` | 52 |
| 3,5 rem | Number | `--_numbers---3-5-rem` | 56 |
| 3,75 rem | Number | `--_numbers---3-75-rem` | 56 |
| 4 rem | Number | `--_numbers---4-rem` | 64 |
| 5 rem | Number | `--_numbers---5-rem` | 80 |
| 6 rem | Number | `--_numbers---6-rem` | 96 |
| 7 rem | Number | `--_numbers---7-rem` | 112 |
| 8 rem | Number | `--_numbers---8-rem` | 128 |
| 9 rem | Number | `--_numbers---9-rem` | 144 |
| 10 rem | Number | `--_numbers---10-rem` | 160 |
| 11 rem | Number | `--_numbers---11-rem` | 176 |
| 12 rem | Number | `--_numbers---12-rem` | 192 |
| 13 rem | Number | `--_numbers---13-rem` | 208 |
| 14 rem | Number | `--_numbers---14-rem` | 224 |
| 15 rem | Number | `--_numbers---15-rem` | 240 |
| 16 rem | Number | `--_numbers---16-rem` | 256 |
| 17 rem | Number | `--_numbers---17-rem` | 272 |
| 18 rem | Number | `--_numbers---18-rem` | 288 |
| 19 rem | Number | `--_numbers---19-rem` | 304 |
| 20 rem | Number | `--_numbers---20-rem` | 320 |

#### Radius (10 variables)

| Nom | Type | CSS | Valeur |
|---|---|---|---|
| none | Number | `--_radius---none` | → `--_numbers---none` |
| xs | Number | `--_radius---xs` | → `--_numbers---0-25-rem` |
| s | Number | `--_radius---s` | → `--_numbers---0-5-rem` |
| m | Number | `--_radius---m` | → `--_numbers---0-75-rem` |
| l | Number | `--_radius---l` | → `--_numbers---1-rem` |
| xl | Number | `--_radius---xl` | → `--_numbers---1-5-rem` |
| 2xl | Number | `--_radius---2xl` | → `--_numbers---1-75-rem` |
| 3xl | Number | `--_radius---3xl` | → `--_numbers---2-rem` |
| 4xl | Number | `--_radius---4xl` | → `--_numbers---2-75-rem` |
| max | Number | `--_radius---max` | 9999 |

#### Primitives (135 variables, modes Base / Dark)

CSS : `--_primitives---<teinte>--<palier>` (ex. `--_primitives---monochrome--800`). Valeurs du mode Base ; en mode Dark seules diffèrent : la gamme `monochrome` (inversée 100↔900) le palier 500 de chaque teinte et red 500 à 900.

| Teinte | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| red | #FFD7D8 | #FFAFB1 | #FF888A | #FF6063 | #FF383C | #CC2D30 | #992224 | #661618 | #330B0C |
| monochrome | #FFFFFF | #F7F5F5 | #E5E5E5 | #CDCDCD | #808080 | #656565 | #2E2E2E | #1D1D1F | #000000 |
| orange | #FFE8D4 | #FFD1A9 | #FFBB7E | #FFA453 | #FF8D28 | #CC7120 | #995518 | #663810 | #331C08 |
| yellow | #FFF5CC | #FFEB99 | #FFE066 | #FFD633 | #FFCC00 | #CCA300 | #997A00 | #665200 | #332900 |
| blue | #CCE7FF | #99CFFF | #66B8FF | #33A0FF | #0088FF | #006DCC | #005299 | #003666 | #001B33 |
| green | #D6F4DE | #AEE9BD | #85DD9B | #5DD27A | #34C759 | #2A9F47 | #1F7735 | #155024 | #0A2812 |
| lime | #EBF5D4 | #D8EBA9 | #C4E07F | #B1D654 | #9DCC29 | #7EA321 | #5E7A19 | #3F5210 | #1F2908 |
| mint | #CCF4F0 | #99E9E1 | #66DED1 | #33D3C2 | #00C8B3 | #00A08F | #00786B | #005048 | #002824 |
| teal | #CCF3F6 | #99E7EC | #66DBE3 | #33CFD9 | #00C3D0 | #009CA6 | #00757D | #004E53 | #00272A |
| cyan | #CCF2FA | #99E6F6 | #66D9F1 | #33CDED | #00C0E8 | #009ABA | #00738B | #004D5D | #00262E |
| indigo | #DFDDFD | #C0BBFB | #A099F9 | #8177F7 | #6155F5 | #4E44C4 | #3A3393 | #272262 | #131131 |
| purple | #F5D6F9 | #EAACF3 | #E083EC | #D559E6 | #CB30E0 | #A226B3 | #7A1D86 | #51135A | #290A2D |
| pink | #FFD5DD | #FFABBB | #FF8299 | #FF5877 | #FF2E55 | #CC2544 | #991C33 | #661222 | #330911 |
| brown | #EEE5DF | #DECCBF | #CDB29E | #BD997E | #AC7F5E | #8A664B | #674C38 | #453326 | #221913 |

Différences Dark hors monochrome : red/500 #FF383C→#FE4245, red/600 #CC2D30→#CB3537, red/700 #992224→#982829, red/800 #661618→#661A1C, red/900 #330B0C→#330D0E, yellow/500 #FFCC00→#FFD600, blue/500 #0088FF→#0091FF, green/500 #34C759→#30D158, lime/500 #9DCC29→#A0CC33, mint/500 #00C8B3→#00DAC3, teal/500 #00C3D0→#00D2E0, cyan/500 #00C0E8→#3CD3FE, indigo/500 #6155F5→#6B5DFF, purple/500 #CB30E0→#DB34F2, pink/500 #FF2E55→#FF375F, brown/500 #AC7F5E→#B78A66

#### animation-footer (1 variables)

| Nom | Type | CSS | Base | Mode 2 |
|---|---|---|---|---|
| hauteur | Number | `--_animation-footer---hauteur` | 400 | 64 |

---

## 3. Classes globales / utilitaires

Il n'y a pas d'utilitaires « atomiques » indépendants : les utilitaires sont des **classes de base + combos**. Valeurs ci-dessous = desktop ; surcharges responsive indiquées quand elles existent.

### 3.1 Balises (styles HTML par défaut)

| Balise | Propriétés clés |
|---|---|
| `body` | Arial 14 px / 20 px, #333 (valeurs Webflow par défaut jamais remplacées : la police de marque est posée par classe) |
| `h1` | `--secondary-font` (Lexend Deca), 38 px, 500, lh 120 %, ls −1.5 px, noir, marges 0 |
| `h2` | Lexend Deca, 32 px, 500, ls −1 px |
| `h3` | Lexend Deca, 24 px, 400, ls −0.7 px |
| `h4` | Lexend Deca, 18 px, 400, ls −0.5 px |
| `p` | Lexend Deca, 400, lh 120 %, noir 60 %, marges 0 |
| `li` | Lexend Deca, lh 120 %, ls −0.3 px |
| `ul`, `ol` | flex column, gap 6 px, padding-left 40 px, mb 10 px (doublon exact) |
| `a` | couleur `--orange-orem`, souligné |
| `blockquote` | bordure gauche 5 px #E2E2E2, Lexend Deca 18 px |

### 3.2 Layout & espacement

| Classe | Rôle | Propriétés clés |
|---|---|---|
| `page-wrapper` | Enveloppe de page | relative, overflow visible |
| `main-wrapper` | Contenu au-dessus du footer « reveal » | relative, z-index 2, overflow-x clip, fond #f2f2f0, ombre portée |
| `section` | Section pleine largeur | flex column, align center, width 100 %, fond transparent |
| `section > blanc` / `section > noir` / `section > #f8f8f7` | Fond de section | blanc / noir / #F8F8F7 (en dur) |
| `section > 128px-haut` / `64px-haut` / `96px-haut` / `32px-haut` | Padding-top section | 128 / 64 / 96 / 32 px (puis combos `32px-bas`, `64px-bas` pour le bas) |
| `section > 64px-padding` | Padding vertical | 64 px haut et bas |
| `section > … > 64px-gap` / `32px-gap` / `24px-gap` / `12px-gap` | Gap vertical entre blocs | flex column + gap |
| `page-padding` | Gouttière + largeur max (≈ padding-global + container) | max-width 1300 px, padding-x 32 px (`tiny` : 16 px) |
| `page-padding > 1500px` | Variante large | max-width 1500 px |
| `page-padding > 1030px` | Variante étroite | max-width 1030 px |
| `page-padding > center` | Centrage | flex, margin auto, justify center |
| `max-1300px-container` | Conteneur centré | width 100 %, max-width 1300 px, flex column center |
| `container-1300px` | Conteneur fixe | width 1300 px, margin auto (neutralisé en `!important` par le code custom : width 100 %, max-width none) |
| `container` | Bloc générique | width 100 %, max-width none |
| `container > {N}px-vertical` | Pile verticale | flex column, align start, gap N ∈ {0, 4, 8, 10, 12, 16, 24, 32, 64, 112, 160} |
| `container > {N}px-horizontal` | Rangée | flex row, gap N ∈ {4, 8, 16, 24} |
| `container > space-between` | Rangée espacée | flex, space-between, gap 24 (+ `center`, `haut`, `bas`, `vertical`) |
| `container > center` | Centrage flex | justify/align center (+ `24px-gap`, `26px-gap`, `88px-gap`) |
| `container > droite` | Aligné à droite | flex-end |
| `space-between-div` | Rangée espacée (doublon de `container > space-between`) | flex, width 100 %, space-between, center |
| `space-between-hauteur` | Colonne espacée | flex column, height 100 %, space-between |
| `container-sticky` / `container > sticky-article` | Colonne collante | sticky top 120 px, flex column (gap 16 / 24) |
| `1x2-grid` | Grille 2 colonnes | grid 1fr 1fr, gap 16 (+ `0.9fr`, `05-1fr`, `1fr-4fr`, `128px-gap`, `contact`) |
| `1x3-grid` | Grille 3 colonnes | grid 1fr×3, gap 0 (`small` : 1 colonne) |
| `2x2-grid` | Grille 2×2 | grid 1fr 1fr, gap 16 (+ `12px-gap`) |
| `1x2-grid-scroll` | Grille contenu + colonne 441 px | gap 64 |
| `container > grid > 1fr-2fr` | Grille 1/2 | gap 32 |
| `container > 1x5-grid` | Grille 5 colonnes (showreel desktop) | (+ `change-hide` = 4 colonnes) |
| `ligne` | Séparateur horizontal 1 px | fond `--_couleurs---stroke--primary` (+ `noir`, `vertical`, `pointillés`, `256px`) |
| `ligne-vertical` | Séparateur vertical | 1 px, blanc 60 % |

### 3.3 Typographie

Deux familles : **`primary-text` = Trykker (serif, titres/accroches)**, **`secondary-text` = Lexend Deca (sans, texte courant)**. Les tailles sont des combos nommés en px (non liées aux variables Typography).

| Classe | Rôle | Propriétés clés |
|---|---|---|
| `primary-text` | Base Trykker | `--primary-font`, 400, lh 110 %, noir, marges 0 |
| `primary-text > 54px` | Titre hero (H1 visuel) | 54 px, ls −1 (`small` 48, `tiny` 38) ; `> blanc` utilise `--54` |
| `primary-text > 34px` | Titre de section | 34 px, ls −1 |
| `primary-text > 27px` | Sous-titre / titre de carte | 27 px, lh 120 %, ls −0.5 (`tablette` : 22 → 18 px) |
| `primary-text > 22px` | Accroche | 22 px (+ `60%` gris) |
| `primary-text > 18px` | Petit titre | 18 px, ls −0.3 |
| `secondary-text` | Base Lexend Deca | `--secondary-font`, lh 120 %, ls −0.1, noir |
| `secondary-text > 43px` | Grand titre sans-serif | 43 px, 400, ls −1 (`small` 38, `tiny` 32) |
| `secondary-text > 22px` | Accroche | 22 px, ls −1 |
| `secondary-text > 18px` | Paragraphe principal | `--18`, ls −0.2 |
| `secondary-text > 14px` | Texte courant / légende | 14 px, 300 |
| `secondary-text > 11px` | Sur-titre (eyebrow) | 11 px, 300, couleur `--_couleurs---accent` (+ `orange`, `bleu`) |
| Modificateurs couleur | `blanc`, `60%`, `blanc > 60%`, `#f2f2f2`, `F2F2F2`, `F2F2F2 > 20%`, `gris-60%`, `noir-60%`, `bleu`, `orange` | majoritairement en dur (hsla), sauf `bleu`/`orange` |
| Modificateurs layout | `center`, `max-240/280/320/400/600/700/750px`, `16px-padding-bas`, `22px-padding`, `16px-margin` | text-align / max-width / padding |
| `rich-text` / `rich-text-block` | Rich text CMS | max-width 900 / flex column gap 32 ; marges internes gérées par CSS custom |
| `Texte > Police Secondaire …` | Ancienne chaîne typo (Lexend 28 px 600) | reliquat, à ne pas réutiliser |

### 3.4 Boutons & liens

| Classe | Rôle | Propriétés clés |
|---|---|---|
| `button` | Base bouton pilule | flex center, 143×49 px, radius 9999, Lexend Deca, `--blanc-principal` |
| `button > black` | Bouton noir icône+texte | fond `--_couleurs---buttons--primary--default`, padding 12/12/12/16, gap 4 (+ `full-16px-padding`) |
| `button > noir` | CTA noir Trykker 18 px | hauteur 54, fond buttons/primary/default |
| `button > blanc` | Bouton clair | fond #F2F2F2, texte noir, min-height 38 (+ `inverse` = noir) |
| `button > primary` | Bouton verre (sur fond sombre) | fond blanc 8 % → 12 % au hover (+ `no-max-width`) |
| `button > secondary` | Bouton transparent | (+ `inverse` texte foncé, `no-max-width`) |
| `button > third` | Bouton contour blanc 2 px | (+ `no-max-witdh` [faute de frappe] hover fond `--blanc-principal`, + `100%`) |
| `button-header` | CTA de la navbar | pilule blanche 38 px, Trykker 14 px, hover scale 1.1 |
| `bouton-menu` | Bouton menu mobile | pilule blanche, hover scale 1.1 (+ `change`) |
| `submit-button` | Bouton de formulaire | blanc, 48 px, radius 9 |
| `button-change` / `change-modale` / `close-modale` | Boutons ronds (flèches / fermer) | 48 ou 54 px, radius 9999, fond background/secondary |
| `link-block > 100%` / `link-block > 8px-gap` | Liens bloc | width/height 100 % / flex gap 8 |
| `p404-btn` (+ `p404-btn-light`, `p404-btn-ghost`) | Boutons de la 404 | valeurs en dur, propriétés CSS brutes |

### 3.5 Images & médias

| Classe | Rôle |
|---|---|
| `image > 100%` | Image 100 % × 100 %, object-fit contain (+ `24px-borders`, `cover`, `blending`) |
| `image > 100%-vw` | Image width 100 % (+ `24px-radius`, `32px-radius`, `364px`) |
| `image > 100%-absolute` / `image > photo-cover` | Image de fond absolue cover |
| `image > 12px` / `14px` / `16px` / `20px` / `20x20px` / `24px` / `45px` | Icônes carrées (20px ≡ 20x20px) |
| `image > 40px-rond` / `45px > rond` | Avatars ronds |
| `image > logo` (+ `60%`, `blending`) | Logos clients 130×42 |
| `image > absolute-showreel` (+ 6 combos) | Images du showreel (opacity pilotée par JS) |
| `image > case-1/2/3` (+ `petit`) | Vignettes inclinées des cas clients |
| `image-fond-realisations` (+ `home`, `blog`, `article`, `à-propos`) | Image de fond des heros (masquée et remplacée par un dégradé JS sur home/réalisations/à-propos) |

### 3.6 Cartes & conteneurs décorés

| Classe | Rôle |
|---|---|
| `case-card` | Carte cas client 441×590, radius 24, fond blanc (+ `anim` hover ombre, `small`) |
| `card-témoignage` | Carte avis, radius 24, fond #f8f8f7 |
| `pb-clients-card` | Carte problématique client (sticky en pile), bord stroke/secondary |
| `problematique-card` | Carte offre sombre 340×430 (hover en CSS custom) |
| `process-card` | Étape process 322×380 radius 16 |
| `container > choix` | Item « Ce que nous faisons » (carrousel JS) |
| `container > methode-orem` | Carte dégradé sombre + ombres |
| `container > 528px > glass-card` | Carte verre (backdrop-filter en CSS custom) |
| `container > gris > 180px` | Tuile grise 180 px |
| `form-container` | Carte formulaire sombre radius 26 |
| `mini-container` (+ `24px`, `compétences`, `noir`, `noir > inverse`) | Badges / tags |
| `tabs-menu` / `tabs-link` (+ `fond-noir`) / `tabs-agenda` / `tabs-formulaire` | Onglets segmentés |
| `text-field` (+ `big`) | Champs de formulaire sombres |

---

## 4. Classes par famille / section

| Famille | Classes (racines) | Remarques |
|---|---|---|
| Navigation | `Navbar Logo Left Container` (> `Shadow Three` = fixed, max 1500), `Navbar Wrapper`, `Navbar Logo Left`, `Navbar Brand`, `Nav Menu Two`, `Nav Menu Wrapper`, `Nav Link` (> `hide-pc`), `Nav Divider`, `nav-dropdown-list`, `dropdown-offre-link`, `dropdown-hide-tablette`, `button-header`, `button-menu-container`, `bouton-menu`, `bouton-change-container`, `Menu button` | Couleur clair/sombre basculée par JS (`nav-on-light` / `nav-on-dark`, classes non stylées dans Webflow, définies en CSS custom). |
| Hero | `hero-container-section` (+ `blanc`, `noir`, `à-propos`), `hero-container` (sticky, padding-top 88 ; + `0px-gap`, `blog`, `realisations`, `static`), `sticky-div` (+ `home`, `article`, `realisations`, `à-propos`), `sticky-div-article`, `image-fond-realisations`, `logo-client-hero` | `sticky-div` porte en dur une hauteur de 2310 px et une image de fond. |
| Footer | `footer` (fixed, min-height 100vh, fond noir), `fond-footer` | Effet « reveal » fait en JS (`footerrevealoffset` + script inline). |
| Cas clients | `cas-client-container`, `contenu-cas-client` (+ `membres`), `case-card`, `collection-list(-wrapper)-cases`, `dot-change` (+ `cas-clients`), `bg-holder`, `dot-holder`, `data-shadow-holder` | Drag-scroll en JS ; couleurs CMS lues via des « holders » invisibles. |
| Modale projet | `liste-projets-modale`, `code-embed-modale`, `change-modale`, `close-modale`, `projet-statique`, `miniature-container` | Ouverture/navigation en JS (`[data-project-modal]`). |
| Offres / expertises | `container > choix`, `container > fond-expertises`, `projet-container` (+ `rapport`, `suivi`, `tableau-de-bord`, `lille-*`), `problematique-card`, `pb-clients-card`, `collection-list-pb-clients`, `container > video-offres`, `container > gestion-projet` | |
| Process | `process-container`, `process-heading`, `process-title`, `process-eyebrow`, `process-grid-wrap`, `process-grid`, `process-line`, `process-card`, `process-step-heading`, `process-step-num`, `process-step-text`, `process-dots-row`, `process-dot` | Créées via API (propriétés brutes `gap`, `padding`, `border-radius`, couleurs en dur). |
| FAQ / CTA animé | `faq-choise-container`, `faq-cta-wrapper`, `faq-cta-text`, `faq-cta-icon-slot`, `faq-cta-tooltip`, `faq-icons-cluster`, `faq-icon-btn(-outer)`, `faq-icon-img`, `faq-avatar(-outer)` (+ `clem`, `louis`, `théo`), `container-faq` (+ combos), `link-faq` (> `612px`), `collection-list(-wrapper)-faq` | Toute l'animation est en CSS custom (head). |
| Témoignages | `section_testimonials`, `testimonials_component`, `testimonials_mask`, `slider-viewport`, `slider-track`, `collection-list(-wrapper)-avis`, `collection-item-avis`, `card-témoignage` | Slider 100 % JS custom. |
| Showreel | `container-showreal` (+ `hide`, `stroke`), `container > image-showreel`, `image > absolute-showreel`, `container-mobile-change`, `div-change`, `change-div` (+ `gauche`, `droite`), `ligne-orange` (+ `haut`), `swap-change`, `swap-container` | Desktop en IX2 natif, mobile en JS custom. |
| Blog / articles | `container-article` (+ combos), `container-auteur` (+ `newsletter`), `collection-list-article(s)`, `blog-filters`, `blog-filter-column/row/radio/label`, `fs-toc_*`, `rich-text-block`, `share-container` (+ `copy`, `share`) | Filtre catégorie/auteur en JS (`blogcategoryauthorfilterv5`). |
| Posts LinkedIn | `li-post`, `li-post-text`, `li-avatar-row`, `li-avatar-img`, `li-name-col`, `li-name`, `li-role`, `li-date`, `li-meta-row`, `li-left-meta`, `li-pill`, `li-pill-text`, `li-stats`, `li-stat-group`, `li-stat-icon`, `li-stat-text`, `li-image`, `li-body-col`, `li-sidebar` | Créées via API, valeurs en dur, `li-sidebar` doublonnée par `container > 64px-vertical > li-sidebar`. |
| Équipe / partenaires | `container > membres-équipe`, `collection-list-membres`, `collection-list(-wrapper)-partenaires`, `partner-photo` | Photo qui suit la souris en JS (page À propos). |
| Contact | `contact-form`, `form`, `form-container`, `text-field`, `submit-button`, `succes-message`, `container > succes-form`, `tabs*`, `iclosed-embed`, `embed-form`, `embed-mail` | |
| Page 404 | 30 classes `p404-*` | Autonome, créée via API, aucune variable. |
| CMS (listes) | `collection-list-*`, `collection-item-*`, `collection-list-wrapper-*` pour : article(s), avis, cases, catégorie, compétences, faq, logo(s), membres, menu, partenaires, pb-clients, projets, realisations, suggestions, visuels | Une classe par liste, souvent juste `width:100%`. |
| Utilitaires d'état | `is-open`, `is-active-panel`, `is-revealed`, `hide`, `hide-pc`, `hide-mobile`, `mobile`, `tablette` | `hide-mobile` / `tablette` / `mobile` sont des combos par contexte (pas réutilisables globalement). |

---

## 5. Composants

13 composants (aucun Library / code component). Aucun n'a de groupe sauf « CTA ». `get_all_components` et `list_components` donnent la même liste.

| Nom | id | Groupe | Props (type — id) | Variantes | Instances | Usage |
|---|---|---|---|---|---|---|
| `header` | `5bfc9d1c-afac-cd73-40fc-14d554ff6227` | — | aucune | Base | **0** | Ancien header, remplacé par `new-menu-container`. Orphelin. |
| `new-menu-container` | `d07cebab-c6fc-a15d-b0e5-9c10ac539d36` | — | aucune | Base | 12 | **Navbar du site** (une instance par page). Contient le dropdown CMS des offres. |
| `menu-404` | `07fbcfe4-bea8-a7cd-423f-8490c5c94140` | — | aucune | Base | 1 | Copie statique du menu (sans liste CMS) pour la 404. |
| `footer` | `d1220ddf-2c09-baed-309f-e1f2237fd802` | — | Image (image — `c2750d9a-c950-2a51-c379-df458ca27ad8`, défaut asset `6a7c9b2e94804d6ccbd87d03`) | Base | 12 | **Footer du site** (fixed + reveal). |
| `footer-404` | `9a9ec921-60c0-47a4-b4c4-d78b7b27c933` | — | Image (image — `c2750d9a-c950-2a51-c379-df458ca27ad8`) | Base | **0** | Copie statique du footer pour la 404, non placée (la 404 n'a donc pas de footer composant). |
| `embed-modale` | `db6ccddb-ee7c-aa54-a74a-67d92fd6921b` | — | aucune | Base | 6 | Coque de la modale projet (`[data-project-modal]`), pilotée par le JS site. |
| `Animation Button CTA` | `f3cf7fbf-f5a2-c923-29fc-32d976d10732` | CTA | Variant (variant — `1484597f-a895-79ea-a51c-ba12673a32a5`) | Base, Dark (`47d716ba-c346-7392-4bdb-7cc7e07f3db0`), Orange (`83c1c303-19c2-0196-6ca4-89b0b1adfec9`) | 17 | **CTA principal** « Rencontrer l'équipe » avec avatars + icônes question/calendrier/mail (classes `faq-*`). À réutiliser pour tout CTA de prise de RDV. |
| `logo-client` | `59383b0d-4ddb-67d7-a4e3-7d2366283fb9` | — | Variant (variant — `37e8135b-7d6c-d8e7-542e-74efb716178b`) | Base, « 2 » (`7a0ae232-4d9c-2c69-9d83-473d30f21278`) | 3 | Bande de logos clients CMS (logos blancs), marquee CSS. |
| `logo-client (couleur)` | `8e8ce913-f703-0e8d-c607-8fe472b1e6fb` | CTA | Variant (variant — `e23c85a9-e77e-5ded-8809-de2148b89580`) | Base, « 2 » (`e23c85a9-e77e-5ded-8809-de2148b89581`) | 1 | Même bande, logos couleur (champ CMS Logo). Quasi-doublon de `logo-client` (aurait pu être une variante). Groupe « CTA » incohérent. |
| `avis-section` | `2f8c8330-4c95-e348-14bf-5f85110b745d` | — | Image 1 (`3af9b009-a7b6-1312-1c97-f2b1c91e1b46`), Image 2 (`db7630e5-1875-b466-0d7b-424b14632c47`), Image 3 (`28b4fabf-4bfa-2140-5f1d-9478d26e5eb1`), Image 4 (`75a488c9-ce0c-b507-b74e-1f6c00541423`) — toutes image | Base | 3 | Section témoignages (slider JS). Props = icônes chevrons/union. |
| `case-section` | `849481a4-7c3d-6aa3-c13e-b49829cd3da5` | — | Text (textContent — `8ec93798-e73e-8510-31f3-0c720af3b03c`, « Nos cas clients »), Title (textContent — `52230ac8-0a18-7bc5-d1e7-c5fc86aa8754`) | Base | 3 | Section cas clients (liste CMS drag-scroll). |
| `case-section-lille` | `63c8992a-ae6e-842a-bbb0-8a23e2b51470` | — | mêmes ids de props que `case-section` | Base | 1 | Copie de `case-section` filtrée « Afficher sur Agence web Lille ». Doublon structurel (différence = filtre CMS). |
| `faq-section` | `4d112419-153c-4a11-77fd-40cc16e39fd7` | — | Title (textContent `78e5c955-b854-8048-2e30-0c4fa89c4c51`), Text 1–5 (textContent `f2d5e320-d11f-3935-cf28-20875529ebb4`, `c169b8b3-5c69-79be-491b-666e6e49ee57`, `5d069984-215d-71a6-c5c4-0686efd3f2d9`, `4796cf30-02c5-ad5a-dbfe-34bf7bb4b711`, `b5621864-4575-accc-74d8-5a9a149fb461`), Link 1 (link `aee3d06c-26b5-a15a-aebb-44fa7b86735d` → page contact), Link 2 (link `ada7bade-bfe0-0697-fd10-b7ae39b36095`, « # »), Image 1–4 (image `23b99bb2-0040-f9c5-7e9b-275cef994bcc`, `97737971-eb3e-5536-0d6d-c760388a948d`, `a27ef9ee-a403-d227-8221-0f4c80c7f6e4`, `b5a0e581-7425-f38c-198f-dfae94eec7b3`), Variant (variant `a70510aa-decf-564f-9b15-559efe06b06a`, groupe « Animation Button CTA » = variante du CTA imbriqué) | Base | 1 | Section FAQ avec onglets Fit / Approche / Déroulé + CTA. |

**Règle pour le futur skill** : header/footer/CTA/sections cas clients, avis, FAQ existent déjà en composants → insérer une instance (`insert_component_instance`) plutôt que reconstruire. Pour un nouveau CTA, utiliser `Animation Button CTA` avec sa variante (Base / Dark / Orange).

---

## 6. Interactions

- `data_interactions_tool > list_interactions` : **0 interaction IX3** (total 0). Rien à récupérer avec `get_interaction`.
- Le code custom confirme l'existence d'**interactions IX2 (legacy) natives** non exposées par l'API : showreel desktop (`.container-showreal` ×5 + `.ligne-orange`, conteneur `.container._1x5-grid.change-hide`), opacité du wrapper `.container._0px-vertical.center._32px-radius.fond-blanc`, probablement le menu mobile et des apparitions au scroll. Elles ne peuvent être auditées qu'en ouvrant le Designer.
- Les **transitions CSS natives** sont posées directement sur les classes (`transition: all 200ms ease` sur `button > primary`, `bouton-menu`, `Nav Link`, `button-header`…) et 10 états `:hover` natifs existent (`bouton-menu`, `button-header`, `Nav Link`, `button > primary`, `button > third > no-max-witdh`, `case-card > anim`, `p404-btn-light`, `p404-btn-ghost`, `p404-card`, `p404-report`).
- Une grande partie des animations est en **CSS/JS custom** (voir §9) : marquee logos, slider avis, carrousel « choix », reveal process, hover FAQ/CTA, dropdown décalé, footer reveal, bascule couleur navbar.

**Règle** : pour toute nouvelle animation, préférer IX3 (`create_interaction`, scroll/hover/click natifs, `prefers-reduced-motion` géré) ou une transition + état :hover natif, avant d'ajouter du JS.

---

## 7. Polices

- `data_fonts_tool > list_fonts` : **0 police custom uploadée**. Les polices sont des **Google Fonts** chargées par Webflow : **Trykker** (serif, `--primary-font`) et **Lexend Deca** (sans, `--secondary-font`, graisses 300/400/500/600 utilisées).
- Le style `body` reste en Arial 14 px (défaut Webflow) : toute nouvelle balise texte sans classe s'affichera en Arial → toujours poser `primary-text` / `secondary-text` ou s'appuyer sur les styles h1–h4/p/li (Lexend Deca).
- 23 déclarations `font-family` sont en dur (`'Lexend Deca', sans-serif`, `Trykker`, `Lexend Deca`) dans les familles `li-*`, `p404-*`, `blog-filter-label`, contre 28 via variable.

---

## 8. Assets

- **444 assets**, **0 dossier** (`list_asset_folders` vide) → tout est à la racine.
- Formats : 405 WebP, 12 WebM, 11 SVG, 6 AVIF, 5 MP4, 4 PNG, 1 texte (`llms.txt`). Les images raster sont déjà en WebP/AVIF : **aucun PNG/JPG > 300 Ko**.
- Poids connu : ≈ 136 Mo, dont **≈ 131 Mo de vidéo**. Attention : l'API renvoie `size: 0` pour 301 assets récents (uploadés via API), le poids réel est donc sous-estimé.
- **Vidéos lourdes** (à recompresser ou supprimer si inutilisées) : `video-etape-developpement-v2.webm` (29,5 Mo, `6a9aee175cfcecae9fc654e6`), `Container.webm` (27,5 Mo, `6a9aeb6851c2695590bf38b3`), `video-etape-conception-creation-ambient.webm` (21,2 Mo, `6a9830c0981fec81125b73fa`), `video-etape-conception-creation-v2.webm` (18,1 Mo, `6a982e6e35e58033883191da`), `video-etape-conception-creation-v3.webm` (17,0 Mo, `6a9aeb706db5e2c8d407e95a`), `enregistrement-ecran-demo-2026-08-17.mp4` (3,2 Mo), `video-etape-developpement.webm` (2,3 Mo), `footer_gradiant 2 (1).mp4` (1,3 Mo). Plusieurs versions v1/v2/v3 coexistent.
- **WebP les plus lourds** : `gradient-hero-accueil.webp` 990 Ko (`6a9974700a39c3bf5b02dbcb`), `gradient-hero-realisations.webp` 371 Ko, `gradient-hero-a-propos-ancien.webp` 317 Ko, `gradient-hero-accueil-ancien.webp` 298 Ko, `gradient-offre.webp` 293 Ko, `fond-à-propos.webp` 267 Ko, `image-copywriting.webp` 228 Ko. Les dégradés pourraient être des `linear-gradient` CSS natifs (0 Ko) — le JS les reconstruit déjà en bandes de couleur.
- **PNG** : `opengraph-orem.png` (194 Ko, OK pour l'OG), `orem-logo-signature.png`, `meilleures-agences-web-lille-orem.png`, `meilleures-agences-web-lille.png` (sans alt).
- **Texte alternatif manquant : 315 / 444** (292 WebP, 12 WebM, 5 MP4, 3 PNG, 2 SVG, 1 txt). Principalement les visuels de réalisations `visuel-<client>-NN(-v2).webp`, `vignette-*`, `*-bonus.webp`, logos SVG `logo-(blanc-)sleepee-by-tim.svg`.
- **Doublons de nom** : 14 fichiers en double (`visuel-riskintel-06/15/20/22-v2.webp`, `visuel-lesombres-13/15/19/21-v2.webp`, `visuel-sleepee-05/09/12/19.webp`, `image-case-study-sleepee-2.webp`, `open-menu.webp`) + fichiers « -ancien ».
- Variantes responsive : certains WebP ont des variantes générées en PNG (`-p-500.png`) ou en erreur `FILESIZE_EXCEEDS_CAP` (ex. `lettre-m.webp`, `fond-quadrillage.webp`).

---

## 9. Custom code

### 9.1 Inventaire

| Emplacement | Rôle | Alternative native ? | Impact perf |
|---|---|---|---|
| Site head — CSS modale projet `[data-project-modal]` | Overlay + panneau qui monte du bas | Partiellement : styles en classes + IX3 pour l'ouverture | Faible |
| Site head — CSS overrides `container-1300px`, `collection-list(-wrapper)-cases` (`!important`) | Scroll horizontal des cas clients, neutralise la largeur 1300 | **Oui** : modifier directement les classes dans le Designer | Faible, mais dette (styles contradictoires) |
| Site head — CSS `bg-holder`/`dot-holder` | Masquer les « holders » de couleur CMS | **Oui** : classes natives (déjà width/height 0) | Nul |
| Site head — CSS `visuels-list/item[data-size]` | Grille demi/pleine largeur selon attribut CMS | Partiellement : combo classes conditionnelles (visibilité CMS) | Faible |
| Site head — CSS FAQ CTA (keyframes, nth-child, hover groupé) | Animation du composant `Animation Button CTA` | Partiellement : IX3 hover (les keyframes « rebond » non) | Faible |
| Site head — CSS navbar `nav-on-light/dark`, `:has(.menu-button.w--open)` | Couleur du menu selon le fond | Non natif (dépend du JS de luminance) | Faible |
| Site head — CSS marquee `logo-client-hero` | Défilement logos | **Oui** : IX3 loop / animation native | Faible |
| Site head — CSS `rich-text-block` (marges h/p/li) | Typo du rich text | **Oui** : styles « All H2 inside rich-text-block » natifs du Designer | Nul |
| Site head — CSS dropdown `.w-dropdown-list` forcé + délais nth-child | Dropdown au survol avec cascade | Partiellement : IX3 hover + stagger | Faible |
| Site head — CSS `.footer` fixed + `.main-wrapper` | Footer « reveal » | **Oui** : déjà défini dans les classes (doublon) | Nul |
| Site head — CSS `no-rich-text` (`!important` partout) | Aplatir un rich text en texte simple | **Oui** : champ CMS texte simple / styles natifs | Faible |
| Site head — CSS `blog-filter-radio:checked` | Radio actif | Non (pas d'état :checked natif) | Nul |
| Site head — CSS `filter-anim`, scrollbars masquées, `cursor:grab`, `li-post-text` line-clamp, `li-sidebar` sticky | Divers | line-clamp : **oui** (propriété native « Line clamp » du panneau Style) ; sticky : **oui** | Faible |
| Site head — CSS responsive (`visuels`, `case-1/2/3` rotate, `process-card`, `problematique-card`, `collection-list-logo.flex-libre`, `li-sidebar`, `[data-partner-photo]`) | Surcharges tablette/mobile | **Oui** pour la plupart : styles par breakpoint dans le Designer | Faible |
| Site head — CSS + JS `home-gradient-*`, `image-fond-realisations.home {display:none}` | Remplace l'image de dégradé par des bandes floutées | **Oui** : un `linear-gradient` natif sur la section | Moyen (filter: blur(150px) sur grande surface = coût GPU) |
| Site head — JS showreel mobile (`initShowreelMobile`) | Carrousel mot/image sous 767 px | Partiellement : Slider/Tabs natifs ou IX3 | Faible-moyen (rAF, timers) |
| Site head — Axeptio (contient un identifiant client) | Bandeau cookies + Consent Mode | Non (tiers requis) | Moyen (script tiers async) |
| Site head — Google Tag Manager (contient un identifiant) | Analytics/tags | Non | Moyen-élevé selon les tags |
| Site head — meta google-site-verification (contient un identifiant) | Search Console | **Oui** : champ natif de vérification Google dans Site settings | Nul |
| Site head — iClosed widget (contient un identifiant) | Widget de prise de RDV | Non | Moyen (script tiers) |
| Site footer — CSS + JS slider témoignages | Slider avis avec clones, swipe, autoplay | **Oui** : composant Slider natif Webflow | Moyen |
| Site footer — JS modale projet (`[data-modal-trigger]`, fetch `/realisations/…`) | Ouvre une réalisation en modale, URL `?p=` | Non natif | Moyen (fetch de pages entières) |
| Site footer — JS `cleanEmptyParagraphs` | Masque les `<p>` vides du rich text | Non (nettoyage de contenu préférable) | Faible |
| Site footer — JS `buildVideos` (`.visuels-item[data-type=video]`) | Crée des `<video>` depuis un champ CMS | Partiellement : élément Background Video natif / embed CMS | Moyen (vidéos lourdes) |
| Site footer — JS hover `case-card` (couleur de section) | Change la couleur du fond selon la carte | Non natif simple | Faible |
| Site footer — JS bascule navbar (luminance par canvas, poll 6 s) | Menu clair/sombre selon le fond réel | Partiellement : IX3 scroll into view par section | **Élevé** (lecture canvas + polling 150 ms pendant 6 s + scroll) |
| Site footer — JS footer reveal (spacer + translate au scroll) | Effet footer qui se découvre | Partiellement : `position: sticky` / IX3 scroll | Moyen (listener scroll) |
| Site footer — JS dates en français | Reformate les dates CMS | **Oui** : format de date du champ (choisir un format numérique) / locale du site | Faible (parcours de nœuds texte) |
| Site footer — JS reveal process (mobile) | Apparition alternée des étapes | **Oui** : IX3 scroll into view | Faible |
| Site footer — JS `problematique-card` `card-visible` (≤ 991) | Hover simulé au scroll | **Oui** : IX3 scroll | Faible |
| Site footer — JS dégradés home / réalisations / à-propos (48 couleurs codées en dur) | Reconstruction du fond hero | **Oui** : `linear-gradient` natif | Moyen (blur 150px) |
| Site footer — JS `[data-cookie-consent]` → Axeptio | Lien « gérer les cookies » | Non | Nul |
| Site footer — GTM noscript (contient un identifiant) | GTM sans JS | Non | Nul |
| Site footer — JS `form_submit_success` dataLayer | Tracking des formulaires | Non | Faible |
| Scripts site appliqués : `logomarqueefix` 1.0.0, `dragscrollcasesv4` 1.0.0, `ctabuttonactions` 1.1.0, `offreherovideo` 1.0.0 (footer) | (déduit des noms) correctif marquee logos, drag-scroll des cas clients, actions des boutons du CTA animé, vidéo du hero des offres | Marquee / drag : IX3 ou CSS natif `overflow:auto` + scroll-snap | Faible-moyen (4 requêtes JS) |
| Scripts page Home + Agence web Lille : `showreeltabs` 1.0.0, `choixcarouselenginev9` 1.0.0 | Onglets showreel + carrousel « choix » | Tabs / Slider natifs | Moyen |
| Script page Blog : `blogcategoryauthorfilterv5` | Filtre articles par catégorie / auteur | **Oui** : filtres CMS natifs (ou Finsweet List Filter) | Faible |
| Home head + Agence web Lille head : lazy-load vidéos (MutationObserver) | Évite le chargement immédiat des vidéos de fond | Partiellement (pas de lazy natif pour Background Video) | **Positif** (corrige un score mobile 35/100) |
| Home footer + Agence web Lille footer : carrousel « Ce que nous faisons » (inline, 3,9 Ko) | Carrousel choix/visuel | Slider / Tabs natifs | Moyen — **doublon probable** avec `choixcarouselenginev9` appliqué aux mêmes pages |
| Blog head ; Réalisations head ; Mentions head ; Confidentialité head : CSS grille `collection-list-realisations` 2/1–1/2 | Grille alternée | **Oui** : Grid natif + combos nth-child via « Collection item » settings ; sur Blog/Mentions/Confidentialité ce CSS ne sert à rien (copié-collé) | Faible |
| Réalisations / Mentions / Confidentialité footer : JS ombre colorée au hover (`data-shadow-holder`) | Drop-shadow couleur CMS | Partiellement | Faible — inutile sur Mentions/Confidentialité |
| Contact head : CSS `.segment-icon` des onglets | Couleur icônes onglets | **Oui** : états Current / Hover natifs des Tab Links | Nul |
| À propos head : CSS ≤ 1280 px + flèche partenaires ; footer : JS photo qui suit la souris | Effets partenaires | Partiellement : IX3 mouse-move | Faible |
| Template Offres (`6a9138272200aeae4011d3c7`) head : `.glass-card`, hover `problematique-card`, décalage sticky `collection-item-pb-clients:nth-child(n)` ; footer : ligne de process au scroll | Effets offres | glass-card : **oui** (backdrop-filter natif dans le panneau Effects) ; ligne : IX3 scroll | Faible |
| 404 (`6a8440b8701d33ef3ee85a8f`) | Aucun code | — | — |

Non lus : les ids `6a759af703d4ca7e4b686bb9` (réalisations), `6a759b5e8c6a9cdbe2787bc3` (articles), `6a759ac144dc0178f0b2fc75` (membres) renvoient « page not found » sur `get_page_freeform_code` → ce sont vraisemblablement des ids de collections CMS, pas des pages template. Le code des templates Réalisations / Articles / Membres n'a pas pu être audité.

### 9.2 Scripts enregistrés (31) — non appliqués = morts

Appliqués : `logomarqueefix`, `dragscrollcasesv4`, `ctabuttonactions@1.1.0`, `offreherovideo` (site) ; `showreeltabs`, `choixcarouselenginev9` (Home, Agence web Lille) ; `blogcategoryauthorfilterv5` (Blog).
Enregistrés mais non appliqués (sur les pages vérifiées) : `choixcarouselengine` à `v8` (8 versions), `dragscrollcases` à `v3` (3), `staggerreveal` à `v5` (5), `blogcategoryauthorfilter` à `v4` (4), `ctabuttonactions@1.0.0`, `finsweetattributes` 2.0.0, `finsweetloaderblog`, `footerrevealoffset` (logique dupliquée inline dans le footer site). Les classes `fs-toc_*` laissent penser que Finsweet est utilisé sur le template Articles (non vérifiable).

---

## 10. Problèmes détectés (par priorité)

### P1 — Performance
1. **Vidéos** : ≈ 131 Mo de vidéo dans les assets, dont 5 fichiers de 17 à 29,5 Mo (`video-etape-*-v2/v3`, `Container.webm`). Recompresser (cible < 3 Mo, 720p, CRF élevé) et supprimer les versions inutilisées.
2. **JS de bascule navbar** (luminance via canvas + polling 150 ms pendant 6 s + scroll) et **dégradés reconstruits en JS avec `filter: blur(150px)`** sur 3 pages : coût CPU/GPU au chargement. Remplacer par des `linear-gradient` natifs et une IX3 « scroll into view » par section sombre/claire.
3. **Doublon carrousel** : code inline « Ce que nous faisons » (footer Home + Lille) ET script `choixcarouselenginev9` sur les mêmes pages → à vérifier, garder un seul.
4. **4 scripts tiers en head** (Axeptio, GTM, iClosed + Webflow) : charger iClosed seulement sur les pages qui l'utilisent.
5. ~82 Ko de CSS/JS inline site-wide chargés sur chaque page (dont le slider témoignages, la modale projet, la logique showreel mobile) même là où les éléments n'existent pas.

### P2 — Doublons de classes (même propriétés, noms différents)
- `image > 24px` existe **3 fois** (ids `411449f2-21bc-da79-2e8e-14d63a40e638`, `82e16ae4-e358-65e3-a94b-e5925ee38868`, `c85dc58c-0562-80c9-3d58-c476bc5f9bc1`, propriétés différentes !), `container > 0px-vertical` **2 fois** (`95b9d070-bc57-b40b-edf6-6d9d3234ce9e`, `ea88218a-082b-f045-89e3-dd5e4f3c8f84`), `image > 100%-vw > 24px-radius` **2 fois** (`0fbebc7c-41dc-5d21-6a52-aae1092bb761`, `82e16ae4-e358-65e3-a94b-e5925ee38885`). Même nom de chaîne = ambiguïté garantie pour un agent : cibler par id.
- `image > 20px` ≡ `image > 20x20px` ≡ `embed-form` ≡ `embed-mail` (20×20).
- `bg-holder` ≡ `dot-holder` ; `tabs-agenda` ≡ `tabs-formulaire` ; `ul` ≡ `ol` ; `container-large` ≡ `testimonials_component` ; `Navbar Wrapper` ≡ `p404-card-top`.
- `li-sidebar` ≡ `container > 64px-vertical > li-sidebar`.
- `button > primary > no-max-width` ≡ `button > secondary > no-max-width`.
- `space-between-div` ≈ `container > space-between` ; `max-1300px-container` ≈ `page-padding` ≈ `container-1300px` (3 façons de faire un conteneur 1300 px).
- `collection-list-article` ≈ `collection-list-articles` (et leurs wrappers) ; `collection-list-logo` ≈ `collection-list-logos`.
- Padding répétés sous des chaînes différentes : `padding-bottom:64px` existe dans **10 combos** (`… > 64px-padding-bas`, `64px-bas`), `padding-bottom:32px` dans 5, `padding-top:64px` dans 4, `padding-top:128px` dans 3, `display:none` dans 8 classes (`hide-pc`, `hide`, `Hide`, `button-menu-container`, `container-mobile-change`, `liste-projets-modale`, `tablette-haut-container`…), `width:100%` seul dans 21 classes.
- Nom trompeur : `container > 16px-vertical > max-660px` vaut 700 px ; `container > max-440px` vaut 400 px ; `page-padding > 32px-padding-bas` vaut 0 px ; `section > 64px-padding > 128px-padding-bas-more` vaut 192 px ; `button > third > no-max-witdh` (faute).

### P2 — Valeurs en dur au lieu de variables
- **229 déclarations de couleur en dur contre 36 liées à une variable** ; 23 `font-family` en dur. Exemples : `#f8f8f7` (= `--_couleurs---background--secondary`) dans `card-témoignage`, `container > choix`, `tabs-link`, `li-pill`, `container-article > newsletter > sticky` ; `#1d1d1f` (= `--_primitives---monochrome--800`) dans `close-modale > noir`, `change-modale > suivant > noir`, `tabs-menu > inverse`, `tabs-link > fond-noir`, `tabs-agenda`, `tabs-formulaire`, `swap-change` ; `#092482` (= accent) dans `li-name`, `li-pill-text`, `process-eyebrow`, `p404-*` ; `#000012` (= typography/primary) dans `blog-filter-label`, `li-post-text`, `process-*`, `p404-*` ; `#ff6200` dans `faq-icon-btn`, `p404-kicker` ; `hsla(0,0.75%,26.08%,0.60)` (= typography/secondary) dans 6 combos `60%`.
- Les collections **Typography, Numbers, Radius** et 134/135 **Primitives** ne sont jamais utilisées : le système de tokens existe mais n'est pas branché. Tailles et rayons sont tous en px dans les noms de classes.
- Variables mal nommées dans `Base collection` : `--12`, `--14`, `--18`, `--54` (nom = valeur), `--color` (= white, inutilisée).

### P3 — Classes orphelines / sans styles
- **64 classes totalement vides** (aucune propriété sur aucun breakpoint ni état) : notamment `Div`, `List Item`, `link-block`, `image` (bases vides, normales), `is-open`, `tab-pane-1/2/3`, `button-change > left/right`, `container > grid`, `container > 24px-vertical > real`, `container > choix > haut > rapport/suivi/tableau-de-bord`, `projet-container > lille-proximite/lille-tissu/lille-zone`, `secondary-text > 18px > copywriting/web/blanc/_60`, `primary-text > 54px > 16px-padding-bas > blanc (> center)`, et ~20 combos `section > … > blanc/noir/64px-gap` sans effet. Certains servent de **hooks JS** (`copywriting`, `web`, `rapport`, `suivi`, `tableau-de-bord`, `is-open`, `dot-change > cas-clients`, `p404-btn-light/ghost` combos) → ne pas supprimer sans vérifier le code custom. Liste complète : marquées « vide » dans `classes-index.md`.
- 34 autres classes vides en desktop mais actives seulement en responsive (`hide-mobile`, `tablette`, `mobile`, …).
- Composants **`header`** et **`footer-404`** : 0 instance.
- Noms par défaut non renommés (voir §1) : `Collection List 2/3/4`, `Div`, `Mobile Margin Top 10` (styles responsive uniquement), `Tabs Content 2`, `Tab Pane [Tab 1/2]`…
- Classes utilisées dans le code custom **sans style Webflow** : `nav-on-light`, `nav-on-dark`, `home-gradient-crop`, `home-gradient-bands`, `filter-anim`, `filter-hidden`, `card-visible`, `process-reveal-in`, `is-dragging`, `rt-empty-p`, `segment-icon`, `propos` (le code cible `.hero-container-section.propos` alors que le combo Webflow s'appelle `à-propos` → sélecteur probablement inopérant, à vérifier), `is-active`.

### P3 — Code custom remplaçable par du natif
1. CSS de grille `collection-list-realisations` copié sur Blog, Mentions, Confidentialité (inutile) + JS d'ombre sur Mentions/Confidentialité (inutile).
2. Overrides `!important` de `container-1300px` / `collection-list-wrapper-cases` → corriger les classes à la source.
3. `rich-text-block` (marges), `li-post-text` (line-clamp), `li-sidebar` (sticky), `glass-card` (backdrop-filter), états des onglets Contact, responsive `process-card` / `collection-list-logo` / `case-1/2/3` → tout est faisable dans le panneau Style.
4. Marquee logos, reveal process, `card-visible`, footer reveal, ligne de process → IX3.
5. Slider témoignages → Slider natif ; filtre blog → filtres CMS natifs.
6. Dates en français → format de date du champ CMS.
7. 24 scripts enregistrés obsolètes (`*v2…v8`, `staggerreveal*`, `footerrevealoffset`, `finsweet*`) à supprimer du registre.

### P4 — Assets
- **315 assets sans texte alternatif** (dont tous les visuels de réalisations `visuel-*-v2.webp`, `vignette-*`, `*-bonus.webp`, 3 PNG Lille, 2 SVG Sleepee).
- 0 dossier pour 444 fichiers ; 14 doublons de nom ; fichiers « -ancien » et versions v1/v2/v3 de vidéos à purger.
- `gradient-hero-accueil.webp` 990 Ko pour un simple dégradé (déjà masqué et remplacé par du JS sur la home → probablement téléchargé pour rien).

## Complément : code custom des templates CMS (lu après coup avec les bons ids de pages)

| Template (id page) | Emplacement | Rôle | Alternative native ? | Impact |
|---|---|---|---|---|
| Réalisations (`6a759af703d4ca7e4b686bbf`) | head | CSS + JS « page projet affichée dans la modale » : gère l'historique (`history.replaceState`, `sessionStorage`), fermeture via `[data-project-modal-close]`, `[data-project-modal-overlay]`, `.close-modale`, Échap. Dépend d'un script global de modale. | Non (logique de navigation spécifique). À garder, ne pas dupliquer. | Faible |
| Articles (`6a759b5e8c6a9cdbe2787bc9`) | head | Finsweet Attributes v2 `fs-toc` (sommaire auto), CSS `.w--current`, CSS toast de partage, CSS scroll-snap des suggestions (`.collection-list-wrapper-suggestions`, `.collection-list-suggestions`, `.collection-item-suggestions`) | Le CSS scroll-snap et `.w--current` peuvent passer en styles natifs (overflow, scroll-snap via propriétés custom de la classe). Le TOC reste Finsweet. | Script Finsweet module async : modéré |
| Articles | footer | Temps de lecture (`.rich-text-block` → `[data-reading-time]`, 200 mots/min) ; boutons copier/partager (`.share-container.copy`, `.share-container.share`) ; calage largeur du carrousel de suggestions au resize | Temps de lecture : pourrait devenir un champ CMS Number rempli à la création (zéro JS). Le calage de largeur pourrait être fait en CSS (`margin-right: calc(...)`/`width: 100vw` natif). | Faible |
| Membres (`6a759ac144dc0178f0b2fc7b`) | head | ⚠️ `html { visibility: hidden !important }` + redirection JS `location.replace('/a-propos?p=…')` : toute fiche membre redirige en JS vers À propos. Le CSS imbriqué dans `html {}` est invalide hors CSS nesting. | Oui : redirection 301 native (Site settings > Publishing > 301 redirects, `/membres/(.*)` → `/a-propos`) **ou** passer les pages membres hors sitemap / template non publié. | ⚠️ SEO : pages publiées et dans le sitemap (sauf `clement-saint-hilaire`) qui ne montrent rien à Google et redirigent en JS (soft redirect). À corriger. |

Les 3 templates n'ont aucun script enregistré appliqué au niveau page (404 « Custom code block not found » = aucun).
