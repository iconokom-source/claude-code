# Animations (phase 10, en dernier)

Les animations ne commencent qu'une fois la page intégrée et responsive. Les **transitions d'états** dessinées dans Figma (hover de bouton, de lien, de carte) ne sont pas des animations : elles sont faites pendant la construction, en CSS (`transition` + pseudo-état `hover`).

## 1. Questionnaire

Poser ces questions **en un seul message**, avec une proposition par défaut pour chacune, afin que l'utilisateur puisse simplement répondre « ok » :

1. **Intensité** : aucune, subtile (apparitions douces), marquée (mouvements visibles, parallaxe) ? *Défaut : subtile.*
2. **Apparition au défilement** des titres, textes et images : oui/non, et quel effet (fondu, fondu + montée de 2rem, révélation par masque) ? *Défaut : fondu + montée, 0,6 s, décalage de 0,1 s entre les éléments d'une même liste.*
3. **Hero** : animation au chargement de la page (titre, sous-titre, boutons qui apparaissent l'un après l'autre) ? *Défaut : oui.*
4. **Navbar** : se cache en descendant et réapparaît en remontant, ou change de fond après le hero ? *Défaut : fond qui devient opaque après 50 px de défilement.*
5. **Cartes et images** : léger zoom de l'image au survol, élévation de la carte ? *Défaut : zoom de l'image de 1,05.*
6. **Éléments spécifiques** vus dans la maquette (compteurs de chiffres, carrousel automatique, texte défilant, curseur personnalisé) : lesquels animer ? Lister ceux détectés.
7. **Durée et courbe** : *défaut : 0,6 s, ease-out.*

Rappeler que `prefers-reduced-motion` est respecté (code global, voir `client-first.md`).

## 2. Intégration

1. Lire `data_interactions_tool > guide` (ou la ressource `webflow://guides/interactions`) **avant** d'écrire la première interaction : l'outil refuse beaucoup de formats pourtant valides selon le schéma.
2. Deux règles à respecter dès le premier essai : animer l'opacité sous `wf:transform` et jamais sous `wf:style` ; écrire les valeurs sous forme de tableau ou de tuple, jamais en objet `{from, to}`.
3. Cibler des **classes** (toutes les instances de `heading-style-h2` dans une section, toutes les `[nom]_item`) plutôt que des éléments uniques, pour que l'animation suive les nouveaux contenus du client.
4. Une interaction réutilisable par type d'effet (une « apparition au défilement » commune), pas une par élément.
5. Éviter d'animer `width`, `height`, `top`, `left` : uniquement `transform` et `opacity`.
6. Ne jamais cacher du contenu par défaut sans que l'animation le révèle de façon fiable (un contenu resté invisible est pire que pas d'animation).

## 3. Validation

Un enregistrement réussi ne prouve pas que l'animation fonctionne. Demander à l'utilisateur de vérifier dans l'aperçu Webflow (ou sur le site de staging) et lister précisément quoi regarder : « Sur l'accueil, en descendant : les titres de chaque section apparaissent en montant ; les cartes Services apparaissent l'une après l'autre ; la navbar devient blanche après le hero. » Corriger selon le retour, puis mettre à jour le journal.

## 4. Standard agence « ultra clean, premium » (validé sur The Rep)

**Toujours en natif Webflow** : interactions IX3 (moteur GSAP de Webflow) via `data_interactions_tool`. Jamais de code personnalisé ni de librairie externe tant que le natif sait faire.

| Effet | Réglage |
|---|---|
| Apparition au défilement (titres de section, blocs texte, gros blocs) | `wf:scroll` sur les classes, `start: "top 85%"`, action sur `wf:trigger-only` : opacité 0→100 %, `y` 24→0, 0,8 s, ease 8 (power3.out) |
| Cartes en cascade | trigger scroll sur la liste, cible = classe de carte avec `filterContext.relationship: "within"` + `filterBy` = classes des listes ; `y` 32→0, stagger 0,09 s |
| Hero au chargement | `wf:load` : image opacité + `scale` 1,06→1 (1,4 s), texte `y` 28→0 (1 s, décalé 0,1 s), éléments en `translate(-50%)` : **opacité seule** (un `y` écraserait leur transform) |
| Survol boutons / cartes | `wf:hover` en deux groupes (enter/leave), To `y` −2 px (boutons) / −4 px (cartes), 0,3–0,4 s, ease 5 |
| Accordéon FAQ (au clic, ouvre/ferme) | Pas de `details/summary` (pas animable) → balises `div`. Interaction de scope composant : clic sur la question, `control: "togglePlayReverse"`, réponse `height` 0px→auto + opacité, icône `rotation` 0→45°, 0,5 s, ease 9. Réponse en `overflow: hidden`. |

- `prefers-reduced-motion` : `skip-to-end` sur les apparitions (le contenu reste visible), `dont-animate` sur les survols.
- Cibles `wf:class` : passer les **id de style** (le nom de classe seul est parfois refusé).
- Rien qui tourne en boucle, rebondit, clignote ; pas de parallaxe lourde.
