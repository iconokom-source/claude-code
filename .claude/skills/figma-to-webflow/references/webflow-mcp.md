# Utiliser le serveur MCP Webflow

## Identification des appels

- `agent_id` : identifiant fixe pour toute la tâche, au format `<modèle>|<outil>|<suffixe>` (ex. `opus|claude-code|fw7k2`). Choisir le suffixe au début et ne plus le changer.
- `session_id` : `start` au **premier** appel uniquement, puis la valeur `ses_…` renvoyée, sur tous les appels suivants. Un sous-agent reçoit le même `session_id` mais génère son propre `agent_id`.
- `context` : 15 à 25 mots, à la troisième personne, sans donnée personnelle.
- Appeler `webflow_guide_tool` une seule fois par session, en premier.

## Outils par usage

| Besoin | Outil > action |
|---|---|
| Trouver le site | `data_sites_tool > list_sites` (filtrer sur le nom et l'espace Iconokom), `get_site` |
| Règles propres au site | `data_agent_instructions_tool > search_instructions`, `read_instruction` |
| Pages | `data_pages_tool > list_pages`, `create_page` (title, slug), `update_page_settings` |
| Variables | `data_variable_tool > get_variable_collections`, `create_variable_collection`, `create_variable_mode`, `create_*_variable`, `update_*_variable` |
| Styles | `data_style_tool > query_styles`, `get_styles`, `create_style` (`parent_style_names` pour une combo), `update_style` (`breakpoint_id`, `pseudo`), `set_style_variable_mode` |
| Polices | `data_fonts_tool > list_fonts`, `create_font` + upload (ressource `webflow://guides/font-upload`) |
| Assets | `asset_tool > upload_image_by_url` ; `data_assets_tool > create_asset` + upload (ressource `webflow://guides/asset-upload`), `create_asset_folder`, `update_asset` (texte alternatif) |
| Construire | `data_whtml_builder` (HTML + classes), `data_element_builder` (un élément), `data_element_tool` (`set_style`, `set_text`, `set_link`, `set_image_asset`, `set_heading_level`, `move_element`, `set_display_name`) |
| Réglages d'élément | `data_element_settings_tool` (`set_tag`, `set_visibility`, `set_dom_id`, `get_bindable_sources`, `set_settings`) |
| Composants | `data_component_tool` (`transform_element_to_component`, `create_blank_component`, `set_component_metadata`, `get_component`), `data_component_props_tool`, `data_component_variants_tool`, `data_component_builder` |
| CMS | `data_cms_tool` (collections, champs, groupes de champs, éléments) ; listes de collection via `data_element_settings_tool` |
| Vérifier visuellement | `element_snapshot_tool` |
| Designer ouvert | `designer_tool` (`get_current_page`, `switch_page`, `select_element`, `open_canvas`) |
| Animations | `data_interactions_tool` (lire `guide` avant d'écrire) |
| Code global | `data_scripts_tool > set_site_freeform_code` (head/footer) : à éviter sauf besoin réel |

Regrouper les actions : la plupart des outils acceptent un tableau `actions` exécuté dans l'ordre. Ne pas mettre dans un même appel des actions qui dépendent d'un identifiant renvoyé par une action précédente.

## Construire une section

Les styles du registre doivent **déjà exister** (phase 4) avant de construire.

1. **Méthode principale : `data_whtml_builder`**. Envoyer le HTML de la section avec les attributs `class` du registre, **sans CSS** (paramètre `css` vide) puisque les classes existent déjà. Un seul élément racine par action, 5 actions maximum par appel.
   ```html
   <section class="section_cta">
     <div class="padding-global">
       <div class="container-large">
         <div class="padding-section-large">
           <div class="cta_component">
             <div class="cta_content">
               <h2 class="heading-style-h2">Titre</h2>
               <p class="text-size-medium">Texte</p>
             </div>
             <div class="button-group">
               <a href="#" class="button">Nous contacter</a>
               <a href="#" class="button is-secondary">En savoir plus</a>
             </div>
           </div>
         </div>
       </div>
     </div>
   </section>
   ```
2. **Test obligatoire à la première utilisation** dans un projet : après la première insertion, `query_styles` sur les classes utilisées pour vérifier que l'outil a **réutilisé** les classes existantes, sans créer de doublon (nom suffixé, classe recréée sans les variables). Si c'est le cas, supprimer ce que l'outil a créé et passer à la méthode de repli pour tout le projet ; noter le choix dans le journal.
3. **Méthode de repli** : `data_element_builder` pour la structure, puis `data_element_tool > set_style` avec les noms de classes (la liste remplace tous les styles de l'élément ; plusieurs noms = combo).
4. Si le paramètre `css` est indispensable (rare), n'y mettre que les media queries Webflow autorisées (991, 767, 479 px), aucun `@keyframes`, et uniquement des classes du registre.
5. Après insertion : textes exacts (`set_text`), niveaux de titre (`set_heading_level`), balises sémantiques (`set_tag`), liens (`set_link`), images (`set_image_asset` + texte alternatif), noms lisibles dans le navigateur si utile (`set_display_name`).
6. Capture avec `element_snapshot_tool` et comparaison avec la capture Figma.

## Polices

1. `list_fonts` : ne pas réimporter une police existante.
2. Google Fonts : récupérer les fichiers woff2 des graisses **réellement utilisées** (pas toute la famille), calculer le MD5 de chaque fichier, `create_font` (famille, graisse, italique, `font_display: swap`), puis envoyer le fichier sur l'URL d'upload signée (valable environ 15 minutes) en suivant `webflow://guides/font-upload`.
3. Police commerciale ou introuvable : ne pas bloquer. Utiliser une police de repli proche dans la variable `Font / Primary` (ex. `"Nom de la police", "Inter", Arial, sans-serif`) et l'ajouter à « Ce qu'il me manque » : « Fichiers de la police X (graisses 400, 600, 700) au format woff2, avec licence web ». Quand les fichiers arrivent, seule la variable change.
4. Si l'environnement ne permet pas d'envoyer un fichier (pas d'accès réseau ni de fichiers), ajouter la police à « Ce qu'il me manque » avec la procédure manuelle : Paramètres du site > Fonts > Upload.

## Assets

- Nommage : kebab-case descriptif en français (`equipe-claire-dupont.jpg`, `icone-fleche-droite.svg`).
- Texte alternatif en français pour toute image porteuse de sens ; `null` (décorative) pour les images purement décoratives.
- Un dossier d'assets par page ou par collection (`create_asset_folder` : les dossiers ne peuvent pas être supprimés par l'API, donc n'en créer que le nécessaire).
- Icônes SVG monochromes qui changent de couleur (hover, thème) : HtmlEmbed avec `fill="currentColor"` dans un composant `Icône`, pour qu'elles suivent la couleur du texte.
- Compression WebP/AVIF (`compress_assets`) : remplace le fichier d'origine, donc la proposer dans le rapport final au lieu de la lancer.

## Erreurs fréquentes

- Une propriété en notation courte (`padding: 2rem`) est refusée ou mal interprétée : toujours en notation longue.
- `set_style` remplace **toute** la liste des classes de l'élément : repasser toutes les classes, pas seulement la nouvelle.
- Seules des instances de composants peuvent aller dans un slot.
- Les outils `designer_tool` et parfois `element_snapshot_tool` nécessitent le Designer ouvert : si erreur de connexion, point d'arrêt n° 1.
- Un 429 (trop de requêtes) : attendre et réessayer, ne pas multiplier les appels en parallèle.
