# Composants des pages secteurs

Bibliothèque locale : frame **« Composants / pages secteurs »** (`3852:1792`) sur l'onglet Site, sous les pages secteurs.
Demande de Louis : tout élément répété ou interactif est un **composant**, pour que l'agent d'intégration Webflow comprenne qu'il y a plusieurs éléments du même type et leurs états. On ne livre jamais une page faite de frames dupliquées.

| Composant | ID | Variantes | Propriétés de texte | Images à remplacer dans l'instance |
|---|---|---|---|---|
| `navigateur` | 3852:1807 | aucune | URL | `capture` (1440 × 900) ; largeur via `rescale(w / 600)` |
| `mobile` | 3852:1810 | aucune | aucune | `capture` (780 × 1688) ; `rescale(w / 176)` |
| `visuel-secondaire` | 3852:1825 | Type = Mockup / Navigateur | aucune (URL dans l'instance navigateur imbriquée) | `visuel` ou `capture` imbriquée |
| `bouton` | 3852:1845 | Style = Plein blanc / Contour clair / Plein noir / Contour sombre | Libellé | aucune |
| `pastille-benefice` | (dans la bibliothèque) | aucune | Titre, Précision | aucune |
| `onglet-cas` | 3852:1855 | Etat = Actif / Inactif | Nom | aucune |
| `panneau-cas` | 3852:1884 | aucune | Nom, Contexte, Chiffre 1, Légende 1, Chiffre 2, Légende 2, Tag 1 à 3 ; bouton imbriqué : Libellé | `visuel-principal` ; 2 `visuel-secondaire` imbriqués (changer leur Type) |
| `onglet-enjeu` | 3852:1896 | Etat = Actif / Inactif | Numéro, Titre | aucune |
| `panneau-enjeu` | 3852:1945 | Visuel = Navigateur / Mockup | Titre, Diagnostic, Concrètement, Indicateur, Source | `capture` (navigateur imbriqué) ou `mockup` |
| `carte-avis` | 3852:1959 | aucune | Citation, Nom, Fonction | `photo` |

## Règles

- Onglets : un seul onglet en variante Actif, les autres Inactif. Les panneaux des onglets inactifs sont des instances **masquées** (`visible = false`) mais complètes : le contenu doit exister dans le DOM.
- Les instances se nomment comme leur rôle dans la page (`cas-panel`, `enjeu-panel (onglet 3, masqué)`, `avis-item`).
- Un nouveau besoin répétable (ex. carte d'article, ligne de FAQ maison) se crée d'abord dans la bibliothèque, avec description et propriétés, puis s'instancie dans la page.
- Les sections officielles reprises (nav, footer, Méthode, FAQ) restent des clones : ce sont déjà les éléments du site existant.

## Tableau « États » : tous les textes visibles

Demande de Louis : quand on donne la page et les composants à l'intégration, **absolument tous les textes doivent se lire**, pas seulement le premier onglet. Les panneaux masqués ne suffisent pas.

Sous la bibliothèque, chaque page a une frame **`États <url>`** (fond `#fff8e6`, hors de la page, x = page.x − 60, y = bas de la bibliothèque + 400), qui empile :
1. un clone de `section-realisations` **par réalisation** : l'onglet i en variante Actif, les autres Inactif, seul le panneau i visible ;
2. un clone de `section-enjeux` **par enjeu** (5), même logique ;
3. un clone de la FAQ avec **toutes les réponses `faq-reponse` visibles** ;
4. avant chaque version, une pilule noire qui la nomme (« Enjeux, onglet 2 actif : <titre> »).

En tête du tableau, une phrase rappelle que sur le site seul le premier onglet est affiché et que chaque version est un panneau du composant Tabs Webflow. Exemples : `3855:2098` (hôtellerie, 8 versions) et `3855:2644` (médias, 10 versions).
Le tableau se refait après toute modification d'une section à onglets (supprimer l'ancien, recloner), et on vérifie par script que chaque version a exactement un onglet Actif et un panneau visible dont le titre correspond à l'onglet.

## Instancier depuis un script

```js
const keyOf = (inst, label) => Object.keys(inst.componentProperties).find(k => k.split('#')[0] === label);
const setP = (inst, map) => { const o = {}; for (const [k, v] of Object.entries(map)) { const kk = keyOf(inst, k); if (kk) o[kk] = v; } inst.setProperties(o); };
const setImg = (node, hash) => { const fl = JSON.parse(JSON.stringify(node.fills)); fl.find(f => f.type === 'IMAGE').imageHash = hash; node.fills = fl; };

const set = await figma.getNodeByIdAsync('3852:1945');            // panneau-enjeu
const inst = set.children.find(c => c.name === 'Visuel=Mockup').createInstance();
setP(inst, { Titre: '…', Diagnostic: '…', 'Concrètement': '…', Indicateur: '…', Source: '…' });
setImg(inst.findOne(n => n.name === 'mockup'), '<imageHash>');
// variante d'une instance imbriquée : nested.setProperties({ Type: 'Navigateur' })
```
