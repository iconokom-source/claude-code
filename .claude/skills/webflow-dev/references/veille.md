# Veille Webflow / MCP

Dernière veille : **2026-10-19** · Version MCP constatée : **2.2.0**

Refaire la veille si la version renvoyée par `webflow_guide_tool` diffère, ou si la date ci-dessus a plus de 30 jours. Après la veille : mettre à jour la date, la version et la section « État des connaissances » (garder court : ce qui change notre façon de travailler, pas le marketing).

## Où regarder (dans cet ordre)

1. **Guide du MCP** : `webflow_guide_tool` (fait foi pour les noms d'outils et les règles) + `data_interactions_tool > guide`.
2. **Changelog développeurs** : https://developers.webflow.com/home/changelog (filtre MCP : `?filter=MCP`). Chaque entrée existe aussi en `.md` (ex. `/home/changelog/2026/9/21.md`), plus léger à lire avec WebFetch.
3. **Nouveautés produit** : https://webflow.com/updates
4. **Blog Webflow** (annonces Conf, keynote builder) : https://webflow.com/blog
5. En complément (agences à jour) : Digidop, Finsweet, Relume, Flowbase — seulement pour confirmer un usage, jamais comme seule source.

Méthode : `WebSearch` (mode `standard`) « Webflow changelog MCP <mois année> » et « Webflow updates <mois année> », puis `WebFetch` des pages officielles. Citer les sources dans le résumé à l'utilisateur.

## État des connaissances (au 2026-10-19)

### MCP Webflow
- **2.2.0** (constatée le 2026-10-19). Outils `data_*` (API REST, sans Designer ouvert) + `designer_tool` / `element_snapshot_tool` (Designer ouvert avec l'app MCP Bridge).
- **2.1** (21/09/2026) : Interactions avec GSAP (`data_interactions_tool` : click, hover, load, scroll, mouse-move, custom event ; list/get/create/update/delete), Webflow Cloud (`data_apps_tool`), Campaigns (`data_campaigns_tool`). Les interactions **Classic** ne sont pas visibles/éditables par le MCP. Les valeurs de variables d'environnement Cloud passent par la CLI.
- **2.0** (été 2026) : création de composants, props, variantes, accès aux variables CSS, instructions d'agent par site (`data_agent_instructions_tool`), requêtes analytics (`data_analyze_tool`), travail sur branches.
- `data_element_builder` construit des arbres d'éléments de profondeur illimitée en un appel ; `data_whtml_builder` insère du HTML + CSS (media queries Webflow uniquement, pas de `@keyframes`).
- Réglages des Collection Lists (source, filtres, tri, pagination) via `data_element_settings_tool` sur l'élément `DynamoWrapper` (bêta).
- Page branching = Enterprise uniquement (vérifier avec `list_branches` avant d'en parler). Single Page Publishing = Enterprise.
- Popovers et Modals natifs créables via `data_element_builder` (type `Popover` / `Modal`) + lien `mode: popover|modal`.

### Designer / produit
- **Interactions GSAP (IX3)** : moteur d'animation par défaut ; animations sur variables (mars 2026) ; déclencheur mouse-move (suivi du curseur).
- **Webflow Conf 2026** (Boston, 1–3 sept.) : composants CMS, canvas multi-breakpoints, édition visuelle des composants de code IA, popovers natifs, traduction agentique, composants par défaut dans les slots, « style props » annoncés pour fin 2026. Lancement de **Source** (plateforme marketing + agents).
- Breakpoints : `main` (base), `large` ≥1280, `xl` ≥1440, `xxl` ≥1920, `medium` ≤991, `small` ≤767, `tiny` ≤478.
- Markdown pour agents IA et Component Canvas (avril 2026).

### Sources de cette veille
- https://developers.webflow.com/home/changelog/2026/9/21
- https://webflow.com/blog/mcp-2-features
- https://webflow.com/blog/2026-builder-keynote
- https://webflow.com/updates
