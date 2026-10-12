---
name: figma-to-webflow
description: Intègre une maquette Figma complète dans un site Webflow existant, en Client First, avec variables, composants réutilisables, collections CMS documentées pour le client et responsive tablette/mobile déduit automatiquement. À utiliser dès que l'utilisateur fournit des liens Figma (figma.com/design/...) avec un nom de site Webflow, ou demande d'« intégrer », « monter », « passer sur Webflow » une maquette, une page ou une section Figma.
---

# Intégration Figma → Webflow (Client First)

Ce skill transforme une maquette Figma en site Webflow propre, maintenable et éditable par le client. Il travaille **en autonomie** : il ne s'arrête que sur les points d'arrêt obligatoires listés plus bas et signale tout le reste dans un rapport final.

## Entrées attendues

| Entrée | Obligatoire | Détail |
|---|---|---|
| Nom du site Webflow | Oui | Le site existe déjà, dans l'espace de travail **Iconokom**. |
| Liens Figma desktop | Oui | Un lien par page ou par frame (`figma.com/design/<fileKey>/<nom>?node-id=<id>`). |
| Liens Figma tablette / mobile | Non | S'ils existent, ils font foi pour ces breakpoints. Sinon le skill les déduit. |
| Nom des pages | Non | Sinon déduit du nom de la frame Figma. |

Lecture d'un lien Figma : `fileKey` = segment après `/design/` ; `nodeId` = paramètre `node-id` avec `-` remplacé par `:` (ex. `9387-44` → `9387:44`). Pour un lien `/design/<fileKey>/branch/<branchKey>/...`, utiliser `branchKey` comme fileKey.

## Ordre de priorité des règles

En cas de conflit, la règle du dessus gagne :

1. **Responsive et accessibilité** avant le pixel perfect. Un écart de 1 à 4 px est acceptable s'il rend le système plus propre ou plus robuste.
2. **Client First** pour tout le nommage et la structure (`references/client-first.md`).
3. **Zéro classe dupliquée** : deux classes aux propriétés identiques n'en font qu'une (`references/registre-styles.md`).
4. **Toute valeur de design passe par une variable** : couleurs, polices, tailles de texte, espacements, rayons, largeurs (`references/variables.md`).
5. **Maximum de composants** : chaque section est un composant réutilisable par le client (`references/composants.md`).
6. **Tout contenu qui se répète ou évolue est dans le CMS**, avec des champs décrits en français pour le client (`references/cms.md`).

## Points d'arrêt obligatoires (et uniquement ceux-là)

Le skill ne demande **rien d'autre** à l'utilisateur. Toute autre décision est prise selon les références, notée dans le journal, et listée dans le rapport final.

1. **Accès bloquant** : site Webflow introuvable ou ambigu (plusieurs sites du même nom), lien Figma inaccessible, ou Designer Webflow non connecté alors qu'un outil Designer est indispensable. Dans ce dernier cas : demander d'ouvrir le site dans le Designer avec l'app MCP Webflow lancée, puis reprendre.
2. **Action destructive sur de l'existant** : supprimer ou écraser un style, un composant, une collection, une page, un asset ou une variable **que le skill n'a pas créés lui-même**. Les éléments créés par le skill pendant la session peuvent être modifiés ou supprimés librement.
3. **Animations** (phase 10) : questionnaire, puis validation après intégration.

Tout ce qui manque mais ne bloque pas (polices sous licence, états hover absents, maquette mobile absente, images basse définition…) est **contourné avec une solution de repli** et ajouté à la section « Ce qu'il me manque » du rapport. Ne jamais attendre une réponse pour ça.

## Journal de projet

Tenir un fichier `journal-webflow-<site>.md` dans le dossier de travail (modèle : `templates/journal.md`). Il contient : identifiants (site, pages, collections, variables, composants), registre des styles, décisions prises, éléments manquants, avancement par phase. Le mettre à jour à la fin de chaque phase : il permet de reprendre le projet dans une nouvelle conversation sans tout réanalyser. Au démarrage, si un journal existe déjà pour ce site, le relire et reprendre là où il s'est arrêté.

## Déroulé

### Phase 0 — Connexion et audit

1. Webflow : appeler `webflow_guide_tool` **une seule fois** (voir `references/webflow-mcp.md` pour `agent_id` et `session_id`). Puis `data_sites_tool > list_sites` et retenir le site dont le nom correspond, dans l'espace de travail Iconokom. Appeler `data_agent_instructions_tool > search_instructions` sur ce site pour récupérer d'éventuelles règles propres au site.
2. État existant du site : pages (`data_pages_tool`), styles (`data_style_tool > get_styles`), variables, composants, collections, polices. Repérer si un starter Client First est déjà en place (classes `padding-global`, `container-large`, etc.) : dans ce cas, **réutiliser** ses classes au lieu d'en créer.
3. Figma, pour chaque lien (voir `references/figma.md`) :
   - `get_metadata` pour l'arbre de la frame et le découpage en sections ;
   - `get_screenshot` de la frame complète puis de chaque section (référence visuelle) ;
   - `get_variable_defs` pour les variables et styles Figma ;
   - `get_design_context` **section par section** (jamais la page entière d'un coup) ;
   - repérer les assets (images, icônes SVG, logos).
4. Produire l'**inventaire de la maquette** dans le journal : sections, éléments répétés, polices, couleurs, tailles de texte, espacements, rayons, ombres, états (hover, focus, actif), assets.
5. Remplir la liste « Ce qu'il me manque » avec `references/checklist-manques.md`. **Ne pas s'arrêter** : continuer avec les solutions de repli.

### Phase 1 — Variables

Suivre `references/variables.md` :
- Partir des variables Figma si elles existent. Sinon les **déduire** : regrouper les valeurs brutes, fusionner les quasi-doublons, ajuster les espacements à une échelle.
- Créer les collections et les modes (`Primitives`, `Theme`, `Responsive`, `Spacing`, `UI`), puis les variables, en rem.
- Calculer les valeurs tablette et mobile des tailles de texte et des espacements avec `scripts/echelle_responsive.py`.

### Phase 2 — Registre des styles (avant toute création de classe)

Suivre `references/registre-styles.md` :
- Lister **toutes** les classes nécessaires à la maquette entière, avec leurs propriétés normalisées et leurs liens aux variables.
- Lancer `scripts/registre_styles.py` pour détecter les doublons et les classes déjà couvertes par une classe utilitaire, puis appliquer la fusion.
- Le registre final est la **seule** source des classes créées en phase 4. Aucune classe créée « à la volée » pendant la construction.

### Phase 3 — Plan des composants et du CMS

- Composants : appliquer `references/composants.md` (sections, éléments réutilisables, props, variantes, slots).
- CMS : appliquer l'algorithme de détection de `references/cms.md` à chaque bloc répété. Décider : collection CMS, composant avec slot, ou contenu statique. Noter la justification de chaque décision dans le journal.

### Phase 4 — Fondations dans Webflow

Dans cet ordre (chaque étape dépend de la précédente) :
1. **Polices** : Google Fonts → télécharger les fichiers woff2 et les ajouter avec `data_fonts_tool` (voir `references/webflow-mcp.md`). Police commerciale sans fichier → police de repli la plus proche, notée dans « Ce qu'il me manque ».
2. **Variables** de la phase 1, y compris les variables de famille de police.
3. **Styles globaux** : classes de structure et classes utilitaires Client First du registre, puis styles de balises (body, h1–h6, p, a). Code global éventuel : voir `references/client-first.md`.
4. **Application des modes responsive** : collection `Responsive` sur `page-wrapper` (mode Tablet sur `medium`, mode Mobile sur `small`).
5. **Classes personnalisées** du registre, avec leurs états (hover, focus) et leurs transitions CSS si la maquette montre des états.
6. **Assets** : téléverser images et icônes, nommés en kebab-case avec un texte alternatif en français. Les rassembler dans un dossier d'assets par page.

### Phase 5 — Construction desktop

Pour chaque page puis chaque section, de haut en bas :
1. Créer ou retrouver la page (`data_pages_tool > create_page`, slug en français).
2. Construire la section avec la structure Client First (`references/client-first.md`), en utilisant **uniquement** les classes du registre. Méthode et vérifications : `references/webflow-mcp.md`, section « Construire une section ».
3. Remplacer le contenu factice par le vrai contenu Figma (textes, images, liens, niveaux de titre corrects : un seul `h1` par page).
4. Transformer la section en composant, créer les props et les lier (`references/composants.md`).
5. Comparer la capture Webflow (`element_snapshot_tool`) avec la capture Figma. Corriger les écarts significatifs (au-delà de 4 px, mauvaise couleur, mauvais retour à la ligne). Arrêter après 3 cycles de correction par section et noter l'écart restant.

Navbar et footer sont construits en premier et réutilisés sur toutes les pages.

### Phase 6 — CMS

Suivre `references/cms.md` : créer les collections, leurs champs avec texte d'aide en français, leurs groupes de champs, les éléments d'exemple tirés de la maquette, puis brancher les listes de collection et les pages modèles.

### Phase 7 — Responsive

Suivre `references/responsive.md`, breakpoint par breakpoint : **tablette (`medium`) → mobile paysage (`small`) → mobile portrait (`tiny`)**. Pour chaque breakpoint :
- Si une maquette Figma existe pour ce breakpoint, elle fait foi. Sinon, appliquer les règles de déduction.
- Modifier en priorité les **variables** (déjà gérées par les modes), puis les **classes partagées**, et en dernier recours les classes personnalisées. Ne jamais créer une classe pour un seul breakpoint.
- Vérifier à 991, 767 et 478 px **et** à 992 px (la plus petite largeur desktop, souvent oubliée).

### Phase 8 — Contrôle qualité

Passer la checklist de `references/controle-qualite.md` : doublons de classes, valeurs en dur, nommage, débordements horizontaux, accessibilité, SEO de base. Corriger avant le rapport.

### Phase 9 — Rapport final

Remplir `templates/rapport-final.md`. Le rapport doit dire **clairement et en premier** ce qui manque pour terminer le projet en autonomie, avec pour chaque point l'action attendue de l'utilisateur. Ne pas publier le site : la publication reste une décision de l'utilisateur.

### Phase 10 — Animations (en dernier)

Suivre `references/animations.md` : poser le questionnaire, intégrer les animations validées avec `data_interactions_tool`, puis demander une validation dans l'aperçu Webflow.

## Règles transverses

- **Unités** : rem partout (base 16 px), sauf bordures en px, largeurs en %, ratios avec `aspect-ratio`. Jamais de font-size en px.
- **Pas de hauteur fixe** sur un conteneur de texte. Utiliser min-height, padding ou aspect-ratio.
- **Pas de position absolue** pour du contenu ; seulement pour des éléments décoratifs.
- **Sémantique** : `section`, `nav`, `header`, `footer`, `main`, listes `ul/li` pour les listes, `button` ou lien pour tout élément cliquable, un `h1` par page, une hiérarchie de titres sans saut.
- **Textes et contenus client en français** : textes d'aide CMS, noms et infobulles de props, textes alternatifs, noms de collections et de composants. Les **noms de classes et de variables restent en anglais**, conformément à Client First.
- **Ne jamais publier** le site et ne jamais supprimer un élément existant sans accord (point d'arrêt n° 2).
- **Économiser les appels** : regrouper les actions dans un même appel quand l'outil accepte un tableau `actions`.
