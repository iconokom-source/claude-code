# Responsive : déduire tablette et mobile

**Le responsive passe avant le pixel perfect.** Une page lisible, sans défilement horizontal et confortable au doigt vaut mieux qu'une copie exacte du desktop qui casse à 800 px.

## 1. Breakpoints Webflow

| Breakpoint | Identifiant | S'applique à |
|---|---|---|
| Desktop (base) | `main` | 992 px et plus, et tout ce qui n'est pas surchargé plus bas |
| Tablette | `medium` | 991 px et moins |
| Mobile paysage | `small` | 767 px et moins |
| Mobile portrait | `tiny` | 478 px et moins |
| Grands écrans | `large`, `xl`, `xxl` | 1280, 1440, 1920 px et plus : à ne pas utiliser, sauf si la maquette desktop est à 1920 px et casse à 1280 px |

Les styles descendent en cascade : ce qui est défini sur `medium` s'applique aussi sur `small` et `tiny`. Toujours travailler dans l'ordre `medium` → `small` → `tiny` et ne redéfinir que ce qui change.

Une maquette desktop à 1440 px est construite sur `main`, mais `main` commence à **992 px** : vérifier systématiquement que chaque section tient à 992 px (grilles à 4 colonnes, textes longs sur une ligne, navbar avec beaucoup de liens). Si ça ne tient pas, appliquer dès `main` une solution fluide (largeur en %, `minmax()`, `flex-wrap`) plutôt qu'un breakpoint `large`.

## 2. Ordre d'intervention

1. **Variables** (déjà faites par les modes `Tablet` et `Mobile`) : tailles de texte, padding des sections, marge latérale, gaps.
2. **Classes de mise en page partagées** (grilles, flex) : changer le nombre de colonnes ou la direction une fois, toutes les instances suivent.
3. **Classes personnalisées** : seulement ce qui est propre au composant.
4. **Utilitaires `hide-*`** : en dernier recours, pour un élément décoratif sans intérêt sur mobile. Ne jamais masquer du contenu ou un lien utile.

Ne jamais créer une classe utilisée uniquement à un breakpoint, ni dupliquer une section en version mobile.

## 3. Règles de déduction (sans maquette pour ce breakpoint)

### Grilles et colonnes
| Desktop | Tablette (`medium`) | Mobile paysage (`small`) | Mobile portrait (`tiny`) |
|---|---|---|---|
| 4 colonnes | 2 | 2 si cartes courtes, sinon 1 | 1 |
| 3 colonnes | 2 (ou 3 si les éléments font moins de 200 px : logos, icônes, chiffres) | 1 (2 pour logos et chiffres) | 1 (2 pour les logos) |
| 2 colonnes texte + image | 1 colonne si chaque colonne fait moins de 400 px à 991 px, sinon 2 | 1 | 1 |
| 2 colonnes de cartes | 2 | 1 si les cartes contiennent plus qu'un titre et une phrase | 1 |
| Grille asymétrique ou bento | Simplifier en 2 colonnes régulières, l'élément principal sur toute la largeur | 1 | 1 |
| 5 ou 6 logos en ligne | 3 | 3 | 2 |

Préférer `grid-template-columns: repeat(auto-fit, minmax(Xrem, 1fr))` quand le nombre de colonnes peut s'adapter seul : une seule règle au lieu de trois.

### Ordre quand on empile
- Texte + image : **le texte d'abord** (le titre est le contenu principal), sauf pour un hero dont l'image est le message principal, ou si la maquette mobile dit autre chose.
- Alternance gauche/droite (image-texte, texte-image) : sur mobile, **toujours le même ordre** pour toutes les rangées (`order` ou `flex-direction: column` homogène).
- Une colonne latérale (filtres, sommaire) passe au-dessus du contenu, repliée si elle est longue.

### Typographie
- Gérée par les variables `Responsive` (réduction progressive des titres, texte courant jamais sous 16 px).
- Un titre ne doit jamais déborder : `overflow-wrap: break-word` sur les titres, et vérifier les mots longs en français.
- Retirer les `<br>` forcés de la maquette ; gérer la largeur du texte avec `max-width` en `ch` ou `rem`.
- Texte centré de plus de 3 lignes sur mobile : le passer à gauche, sauf hero et CTA.

### Espacements
- Gérés par les variables (`Section / Padding *`, `Global / Padding X`, `Gap / *`).
- Les marges fixes de grande taille dans les classes personnalisées (> 4rem) sont divisées environ par 2 sur mobile.

### Arrondis
- Plus l'écran est petit, plus les angles sont réduits : modes Tablette/Mobile sur la collection Radius (voir variables.md), jamais de rayon en dur.

### Dimensions
- Largeurs fixes → `width: 100%` + `max-width`.
- Hauteurs fixes → `min-height` ou `aspect-ratio` ; les images utilisent `object-fit: cover` dans un wrapper avec `aspect-ratio`.
- Hero plein écran : `min-height: 100svh` sur desktop, retirer ou passer à `auto` sur mobile si le contenu est plus haut que l'écran.
- Éléments en position absolue décoratifs : réduire, repositionner ou masquer sur `small`. Contenu en position absolue : repasser en flux normal sur `medium`.

### Navigation
- Utiliser l'élément **Navbar natif Webflow** avec menu burger à partir de `medium` (menu accessible, géré nativement).
- Menu mobile : liens empilés, zone cliquable de 44 px minimum, bouton CTA de la navbar dans le menu.
- Dropdowns : ouverture au clic sur tablette et mobile.

### Boutons et interactions tactiles
- Zone cliquable de 44 × 44 px minimum (padding, pas seulement la taille du texte).
- Groupe de boutons qui ne tient pas sur une ligne à `tiny` : empiler, boutons en `width: 100%`.
- Rien ne doit dépendre du survol : une information visible au hover sur desktop doit être visible par défaut sur tactile.

### Contenus larges
- Tableaux : wrapper avec `overflow-x: auto`, ou transformation en cartes si moins de 4 colonnes.
- Carrousels : Slider Webflow ou défilement horizontal avec `scroll-snap`, la carte suivante légèrement visible.
- Onglets horizontaux trop larges : défilement horizontal ou accordéon.
- Formulaires : champs sur une colonne à `small`, `font-size` des champs à 16 px minimum.

## 4. Avec une maquette tablette ou mobile fournie

- Elle fait foi pour son breakpoint : reprendre ses valeurs dans les modes de variables (au lieu des valeurs calculées) et ses changements de mise en page.
- Les breakpoints sans maquette (souvent `small` entre tablette et mobile portrait) sont déduits par interpolation : appliquer la mise en page mobile si la largeur de 767 px ne permet pas celle de la tablette.
- Signaler dans le rapport tout ce qui diffère entre la maquette mobile et le desktop sans être techniquement possible avec un seul composant (contenu différent, ordre incompatible).

## 5. Vérifications à chaque breakpoint

À 991, 767, 478 px **et** 992 px, puis à 375 et 320 px pour les cas limites :
- aucun défilement horizontal de la page ;
- aucun texte coupé ou qui dépasse de son conteneur ;
- images non déformées ;
- zones cliquables d'au moins 44 px ;
- menu burger fonctionnel ;
- hiérarchie visuelle conservée (H1 plus grand que H2, etc.).

Capture avec `element_snapshot_tool` après chaque section modifiée. Si l'outil ne permet pas de choisir la largeur, vérifier les valeurs avec `query_styles` (breakpoints `medium`, `small`, `tiny`) et noter dans le rapport que la vérification visuelle sur appareil reste à faire.
