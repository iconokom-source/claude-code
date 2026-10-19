# Audit d'un site existant

But : savoir, avant de créer quoi que ce soit, **quelles classes, variables, composants et animations existent déjà** et comment le développeur d'origine les a nommés et assemblés. Toutes les sorties brutes vont dans le scratchpad (jamais dans le dépôt) ; seule la synthèse va dans `references/sites/<slug>.md`.

Chaque appel MCP prend `session_id` (le `ses_…` de la session) et un `agent_id` stable. Les outils `data_style_tool`, `data_element_tool`, `data_interactions_tool` prennent `siteId` et `pageId` au niveau racine.

## 1. Pages
`data_pages_tool > list_pages` (site_id) → noter : page d'accueil, pages statiques, templates de collection, dossiers, slugs, page 404/utility. Choisir 2–3 **pages de référence** : l'accueil + la page la plus proche de ce qu'on va créer (ex. pour un blog : une page de contenu long, type « À propos »).

## 2. Variables
`data_variable_tool > get_variable_collections` puis `get_variables` par collection. Noter : couleurs (nom → valeur), polices, tailles/espacements, modes (clair/sombre…). Si le site n'a pas de variables, noter les valeurs récurrentes trouvées dans les styles (étape 3).

## 3. Styles
Un seul appel lourd, à sauvegarder :

```
data_style_tool > get_styles {
  query: "all",
  include_properties: true,
  include_breakpoints: ["main", "medium", "small", "tiny"],
  include_base_pseudos: ["noPseudo", "hover"]
}
```

Sauvegarder le résultat JSON brut dans `<scratchpad>/<slug>-styles.json` (si le résultat est trop gros, l'outil le persiste lui-même dans un fichier : utiliser ce fichier). Puis :

```
python3 -I .claude/skills/webflow-dev/scripts/doublons_styles.py <scratchpad>/<slug>-styles.json
```

Le script sort : nombre de classes, convention de nommage détectée (préfixes, séparateurs), groupes de classes **strictement identiques** (mêmes propriétés sur tous les breakpoints/états), classes vides, et valeurs en dur les plus fréquentes (couleurs, tailles) qui mériteraient une variable. Si le format JSON a changé et que le script ne trouve rien, l'adapter (il est volontairement simple) plutôt que d'analyser à la main.

Ensuite, classer les classes utiles par **rôle** (c'est ce qui servira à construire) :
- layout : section, padding de section, container, grilles ;
- typo : h1–h6, paragraphes (tailles), texte riche (`w-richtext` stylé ?), surtitres, liens ;
- boutons et CTA (et leurs combos) ;
- cartes, badges, tags, séparateurs ;
- images (ratio, object-fit, arrondis) ;
- utilitaires (marges, couleurs de fond, visibilité).

Détection du framework : `padding-global`, `container-large`, `heading-style-h1`, `text-size-medium` → **Client-First** (Finsweet). `u-`, `c-` / variables fluides → **Lumos**. Sinon convention maison : la décrire (langue, séparateur `-` ou `_`, préfixe par section, etc.).

## 4. Composants
`data_component_tool > get_all_components` avec `options: { includeProps: true, includeInstanceCount: true, includeVariants: true }`. Noter pour chacun : nom, groupe, props (texte, lien, image, booléen de visibilité…), variantes, nb d'instances. Repérer navbar, footer, boutons, cartes, CTA de fin de page.

## 5. Structure
Sur chaque page de référence : `data_element_tool > get_all_elements` (`depth: -1`). Relever :
- le squelette type d'une section (ex. `section.section_hero > div.padding-global > div.container-large > div.padding-section-large > …`) ;
- les balises (section/header/article/main), la hiérarchie des titres ;
- les noms affichés dans le Navigator ;
- les attributs custom (`data-*`, `fs-*` Finsweet, `aria-*`) — ils trahissent souvent un script ou une librairie.

## 6. Animations et scripts
- `data_interactions_tool > list_interactions` sur chaque page de référence, puis `get_interaction` sur les plus utilisées : déclencheur, cible (classe ou élément), propriétés, durée, easing, stagger. Rédiger une « bibliothèque » d'animations à réutiliser (ex. « apparition titre : load, y 40→0 + opacity 0→1, 0,8 s, power2.out, stagger 0,1 »).
- Interactions Classic (non visibles par le MCP) : demander à l'utilisateur ou regarder dans le Designer s'il y en a ; le noter.
- `data_scripts_tool > get_site_scripts`, `get_site_freeform_code`, `get_page_freeform_code` : GSAP/ScrollTrigger custom, Lenis, Swiper, Finsweet Attributes, cookies, analytics.

## 7. CMS
`data_cms_tool > get_collection_list` puis `get_collection_details` de chaque collection : champs (slug, type, requis), références. Noter les templates de collection associés.

## 8. Visuel
Si le Designer est ouvert : `element_snapshot_tool` sur le hero, une section de contenu, la navbar et le footer. Noter polices, rayons, ombres, dégradés, style des images (ex. Dipita : photos plein cadre avec dégradé sombre, boutons pilule bleu nuit avec pastille flèche).

## 9. Synthèse
Remplir `references/sites/<slug>.md` d'après `_modele.md`, avec la date de l'audit. Lister les doublons trouvés comme **propositions** de nettoyage (jamais appliqués sans accord).
