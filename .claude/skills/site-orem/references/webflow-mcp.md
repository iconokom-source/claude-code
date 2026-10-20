# MCP Webflow : mode d'emploi

Le guide officiel (`webflow_guide_tool`) fait foi et change souvent ; ce fichier n'en garde que l'essentiel pour le site Orem. Version du MCP au 2026-10-20 : **2.2.0**.

## Connexion

- Charger les outils avec `ToolSearch` (`select:mcp__Webflow__webflow_guide_tool,mcp__Webflow__data_sites_tool,…`).
- **`agent_id`** : `<modèle>|claude-code|<5 caractères>`, choisi au début de la tâche et identique sur tous les appels. Un sous-agent prend le sien.
- **`session_id`** : `start` au tout premier appel (le guide), puis la valeur `ses_…` renvoyée, sur tous les appels suivants. La transmettre aux sous-agents.
- **`context`** : 15–25 mots, à la troisième personne, sans donnée personnelle.
- Le guide fait ~100 Ko : sa réponse est enregistrée dans un fichier. L'extraire avec `jq -r '.[].text'` dans le scratchpad et n'en lire que les sections utiles (`grep -n`).

## Outils Data (API, sans Designer) et Designer

- Les outils `data_*` passent par l'API et fonctionnent sans Designer ouvert dans la plupart des cas.
- `designer_tool`, `element_snapshot_tool` et certaines actions d'éléments ou de composants demandent que le site soit ouvert dans le Designer avec l'app MCP Webflow lancée. Si un appel le signale : demander à l'utilisateur d'ouvrir le Designer du site Orem avec l'app MCP, puis reprendre.

## Correspondance besoin → outil

| Besoin | Outil > action |
|---|---|
| Site, domaines, locales | `data_sites_tool > get_site` |
| Pages, SEO, Open Graph, JSON-LD | `data_pages_tool > list_pages / get_page_metadata / update_page_settings / query_pages_schema_markup` |
| Arbre d'éléments d'une page | `data_element_tool > get_all_elements` (`depth`), `query_elements` (par classe, texte, attribut, composant) |
| Contenu d'un embed HTML | `data_element_settings_tool > get_settings` puis `set_settings` |
| Attributs `data-*`, id, balise, visibilité | `data_element_tool > get_attributes / set_attributes`, `data_element_settings_tool > set_dom_id / set_tag / set_visibility` |
| Classes | `data_style_tool > get_styles` (filtrer !), `create_style`, `update_style` (propriétés longues, par breakpoint et pseudo-état) |
| Variables | `data_variable_tool` |
| Composants, props, variantes | `data_component_tool`, `data_component_props_tool`, `data_component_variants_tool` |
| Insérer de la structure | `data_element_builder`, `data_component_builder`, `data_whtml_builder` (HTML + CSS sans `@keyframes` ni media queries hors breakpoints Webflow) |
| Code global / page | `data_scripts_tool > get_site_freeform_code / set_site_freeform_code / get_page_freeform_code / set_page_freeform_code` |
| Scripts enregistrés | `data_scripts_tool > get_registered_scripts / get_site_scripts / get_page_scripts / register_* / add_* / remove_*` |
| Animations (IX3) | `data_interactions_tool` (lire `guide` avant tout payload) |
| CMS | `data_cms_tool` |
| Assets (images, poids, alt) | `data_assets_tool`, `asset_tool > upload_image_by_url`, `get_asset_preview` |
| Polices | `data_fonts_tool` |
| Audience (prioriser les pages) | `data_analyze_tool` (si l'offre l'inclut) |
| Plan du site | `data_sitemap_tool` |
| Capture visuelle d'un élément | `element_snapshot_tool` |
| Question produit Webflow | `ask_webflow_ai` |
| Outil manquant | `get_more_tools` |
| Publication | `data_sites_tool > publish_site` (1 par minute max) |

## Pièges connus

- `set_site_scripts` / `set_page_scripts` **remplacent toute la liste** : ne jamais les utiliser.
- `set_site_freeform_code` / `set_page_freeform_code` **remplacent tout le bloc** : toujours partir du contenu actuel lu à l'instant, modifier seulement la partie visée, comparer avec un `diff` avant d'écrire.
- Script inline enregistré : 2 000 caractères maximum. Au-delà, script hébergé (`register_hosted_script`, avec hash SRI) ou découpage.
- `data_style_tool > update_style` : propriétés CSS en version longue (`margin-top`, pas `margin`). Sans `breakpoint`, la modification s'applique au breakpoint principal et descend en cascade.
- Breakpoints : `main` (tous), `medium` ≤ 991 px, `small` ≤ 767 px, `tiny` ≤ 478 px ; `large` ≥ 1280, `xl` ≥ 1440, `xxl` ≥ 1920.
- `data_element_tool > set_style` remplace toute la liste de classes de l'élément : repasser les classes existantes (combo).
- `remove_element` est irréversible par l'outil.
- Interactions : une écriture acceptée n'est pas la preuve que l'animation tourne. Toujours vérifier dans l'aperçu ou sur le sous-domaine publié. Opacité sous `wf:transform`, valeurs en tableaux.
- Les branches de page sont réservées à l'offre Enterprise : vérifier avec `data_pages_tool > list_branches` avant d'en parler ; un 403 `not_enterprise_plan_site` est définitif.
- Les items CMS publiés via `publish_collection_items` sortent du brouillon : ne publier que des items validés.
- Réponses volumineuses (custom code, styles) : enregistrées dans un fichier. Les découper avec `jq` / Python ; ne pas les recopier dans le chat.
