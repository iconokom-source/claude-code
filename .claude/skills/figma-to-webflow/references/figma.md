# Lire la maquette Figma (serveur MCP Figma)

## Outils et ordre d'appel

1. **`get_metadata`** (fileKey, nodeId) : arbre des calques avec types, noms, positions et tailles. Sert à découper la page en sections (enfants directs de la frame) et à repérer les instances de composants Figma (indice fort d'élément réutilisable).
2. **`get_screenshot`** : capture de la frame entière, puis de chaque section. C'est la référence visuelle pour comparer avec Webflow.
3. **`get_variable_defs`** : variables et styles Figma (couleurs, typographies, espacements) utilisés dans le nœud. Les appeler sur la frame de la page, et si possible sur la page qui contient la bibliothèque du designer.
4. **`get_design_context`** : appeler **section par section** (nœud de chaque section), jamais toute la page, pour éviter une réponse tronquée. Le code renvoyé (souvent React + Tailwind) est **une référence de valeurs**, pas du code à copier : en extraire les dimensions, l'auto-layout (direction, gap, padding, alignement), les tailles de texte, couleurs, rayons, ombres, textes exacts.
   - Si le skill Figma `figma-design-to-code` est disponible (ou la ressource `skill://figma/figma-design-to-code/SKILL.md`), le charger avant le premier appel, comme le demande le serveur Figma.
5. **Assets** : `download_assets` (ou les URL d'images fournies par `get_design_context`) pour les images, icônes et logos. Garder les icônes et logos en **SVG** ; les photos en JPG/PNG haute définition (×2).

Si un appel échoue parce que le nœud est trop grand, redescendre d'un niveau dans l'arbre (`get_metadata`) et appeler les enfants un par un.

## Traduire l'auto-layout Figma

| Figma | Webflow |
|---|---|
| Auto-layout vertical / horizontal | `display: flex` + `flex-direction: column / row` |
| Gap | `row-gap` / `column-gap` (variable `Gap / *` ou `Space / *`) |
| Padding | padding en notation longue, via variables |
| Hug contents | largeur automatique (pas de width) |
| Fill container | `flex: 1` dans un flex, `width: 100%` sinon |
| Fixed width | `max-width` + `width: 100%` (jamais une largeur fixe pour du contenu) |
| Space between | `justify-content: space-between` |
| Wrap | `flex-wrap: wrap`, ou une grille si les éléments sont alignés en colonnes |
| Rangées et colonnes régulières | `display: grid` + `grid-template-columns` |
| Calque en position absolue | position absolue seulement si décoratif, sinon remettre dans le flux |
| Contraintes Left & Right / Scale | largeur fluide |
| Texte Auto height | pas de hauteur |
| Line height en % ou px | line-height sans unité (`1.2`) : px / taille de police |
| Letter spacing en % | `em` : % / 100 |

## Repérer les pièges de la maquette

- Calques nommés « Frame 123 » : se fier à la structure visuelle, pas aux noms.
- Textes avec retours à la ligne forcés : les retirer (le retour à la ligne doit être naturel).
- Valeurs presque identiques (15, 16, 17 px) : normaliser via les variables, signaler.
- Éléments cachés dans Figma (visible: false) : ignorer, sauf s'ils représentent un état (hover, menu ouvert) ; dans ce cas les noter comme état.
- Composants Figma avec variantes (`State=Hover`, `Type=Secondary`) : ce sont les états et variantes à reproduire.
- Images avec masque ou recadrage : reproduire avec un wrapper `overflow: hidden` + `object-fit`, pas en exportant l'image recadrée si elle est susceptible d'être changée par le client.
- Textes en image (texte vectorisé, capture) : à reconstruire en texte réel ; signaler s'il s'agit d'un logo.
