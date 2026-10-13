---
name: figma-to-webflow
description: Intègre ou met à jour une maquette Figma dans un site Webflow existant (espace Iconokom), en Client First, avec variables, composants, CMS documenté et responsive déduit. À utiliser dès que l'utilisateur donne des liens Figma et un nom de site Webflow, ou demande d'« intégrer », « mettre à jour » ou « passer sur Webflow » une maquette.
---

# Figma → Webflow

Travailler **en autonomie et vite** : peu d'appels, beaucoup d'actions par appel, aucune question sauf les 3 cas listés en bas.

## Avant de commencer
- Les demandes d'autorisation viennent d'une règle d'organisation sur le connecteur Webflow : conseiller une fois le **mode Auto** (menu à côté de la zone de saisie), puis ne plus en parler.
- Site : `data_sites_tool > list_sites`, prendre le site dont le nom correspond au nom donné ou au nom du fichier Figma.
- Noter dans `journal-webflow-<site>.md` les identifiants et l'avancement (sert à reprendre après une coupure). Une ligne par section terminée, pas plus.

## 1. Lire (une passe)
- Figma : `get_design_context` sur la frame entière (le résultat est enregistré dans un fichier : en extraire les textes avec un script) + `get_screenshot` par section si besoin de visuel.
- Webflow : `get_all_elements` de la page (depth -1), `query_styles`, `get_variable_collections`, `get_all_components`.
- **Mode mise à jour** (le site a déjà des pages) : comparer section par section, garder la structure et les classes existantes, ne changer que ce qui diffère.

## 2. Construire (par lots)
- **Textes** : `set_text` sur l'élément ou son nœud `String` enfant (boutons, TextBlock, ListItem) ; jusqu'à 10 actions par appel. Instances de composants : `set_component_instance_prop_values` (type `string`).
- **Nouvelles sections** : créer d'abord les classes et variables manquantes en un appel, puis `data_whtml_builder` **sans CSS** avec tout le HTML de la section (il réutilise les classes existantes et ignore les classes inconnues).
- **Élément répété** (cartes…) : en construire un, `transform_element_to_component`, `create_prop` (noms et infobulles en français), lier avec `set_settings` clé `text` + `binding prop`, puis insérer les autres instances et remplir leurs props.
- **CMS** : seulement si le contenu se répète ET évolue (blog, offres, équipe…). Champs avec texte d'aide en français. Voir `references/cms.md`.
- Une capture (`element_snapshot_tool`) par section terminée, pas après chaque action. Elle échoue souvent : dans ce cas, demander à l'utilisateur des captures desktop / tablette / mobile avec une liste précise de points à regarder, et corriger d'après elles.

- **Images** : comparer chaque image Figma avec celle du site (`get_screenshot` en petit + télécharger l'image Webflow depuis `s3.amazonaws.com/webflow-prod-assets/...`, autorisé). Import : `download_assets` (URL Figma temporaire) → `asset_tool > upload_image_by_url` (Designer connecté requis), texte alternatif en français. Le téléchargement direct depuis figma.com est bloqué par le proxy ; pour un fichier modifié localement : `data_assets_tool > create_asset` (MD5) puis POST multipart vers S3. Une image insérée par `data_whtml_builder` n'est pas liée à la bibliothèque : la relier avec `set_image_asset`.
- **Schéma à animer en partie** (flèches, cycle) : exporter le groupe Figma en SVG, le découper localement en calques (même `viewBox`), importer chaque calque, les superposer en `position: absolute` et n'animer que le calque voulu. Attention : `inset: 0` sur le conteneur écrase `aspect-ratio` (il prend la hauteur du parent) et déforme tout ; dimensionner par largeur + `aspect-ratio` seuls, calques en `object-fit: contain`. Rotation : uniquement si les flèches ne frôlent aucun libellé. Faire valider par capture avant de garder ; sinon revenir à l'image fixe avec un simple fondu.
- **Liens** : chaque bouton, lien de menu et lien de footer doit avoir une vraie destination (ancre de section, page, mailto, URL). Lister dans le rapport ceux dont la destination manque.
- **Ancres (page unique / LP)** : une ancre ne marche que si la section visée a un **ID** (`set_dom_id`, en minuscules : `methode`, `faq`…). Sans ID, Webflow publie `href="#"`. Poser l'ID sur chaque section, puis lier (`set_settings` clé `link`, mode `pageSection` ; `set_link` refuse les `NavbarLink`). Supprimer tout attribut personnalisé `href` hérité, qui écrase le lien. Les liens du menu et du footer suivent **l'ordre réel des sections** de la page (vérifier avec `get_all_elements`, même si la maquette les liste autrement).
- **Contenu absent de la maquette** (réponses FAQ, prix, mentions) : ne jamais l'inventer ; masquer et le lister dans le rapport.

## 3. Responsive et rapport
- Tablette/mobile : modifier les classes partagées aux breakpoints `medium` / `small` (grilles → 2 puis 1 colonne, empilement, tailles via variables). Règles : `references/responsive.md`.
- **Toujours** finir tablette et mobile (et les faire valider sur captures) **avant** de parler des animations ou d'en créer.
- Puis animations (standard premium de `references/animations.md`, sur **toute** la page, pas seulement le hero) et rappel : republier pour les voir.
- Rapport court : ce qui a été fait, puis **ce qu'il manque** (polices, images, textes absents de la maquette, éléments à supprimer), une ligne par point.

## Règles Client First (résumé)
- Marge de page (standard agence) : variable `page-padding` = **64 px desktop / 32 px tablette / 16 px mobile**, appliquée sur `padding-global` uniquement (`container-large` sans padding latéral, sauf si le design a des lignes/cadres sur les côtés : alors variable `container-padding` 32 / 24 / 16 px sur `container-large`, pour que textes et boutons ne touchent jamais les lignes).
- Arrondis : toujours via variables `Radius` avec modes Tablette/Mobile, réduits vers le mobile (ex. 32 → 24 → 16 px). Aucun rayon en dur.
- Jamais de barre de défilement visible sur un élément qu'on a rendu défilant (carrousel, liste, timeline) : `scrollbar-width: none` sur toute classe en `overflow: auto/scroll`. Seule la barre de la page reste.
- Menu (navbar) : **toujours fixe** sur tous les écrans : `position: sticky`, `top: 0`, `z-index: 100`, fond plein (variable de fond). Vérifier qu'aucun parent n'a `overflow: hidden`.
- Logo : taille fixe sur tous les écrans (`flex-shrink: 0`, `min-width` = largeur, `object-fit: contain`). Il ne doit jamais rétrécir ni se déformer.
- Toujours le maximum en natif Webflow (interactions IX3/GSAP, composants, variables) ; pas de code personnalisé si le natif sait faire.
- Structure : `section_[nom] > padding-global > container-large > padding-section-* > [nom]_component`.
- Classes : `[composant]_[élément]`, combos `is-*`, utilitaires (`heading-style-h2`, `text-size-regular`…). Deux classes identiques = une seule. Valeurs via variables.
- Détails : `references/client-first.md`, `references/variables.md`, `references/composants.md`.

## Pièges connus des outils Webflow
- `set_text` : « Mot 22 : » perd son préfixe → espace insécable avant « : ». `\n` n'est pas interprété → listes `ul/li` ou plusieurs paragraphes.
- `data_element_builder` avec `children` ajoute un texte par défaut (« Lorem ipsum », « This is some text… ») → le supprimer ou le remplacer.
- `row-gap` / `column-gap` refusent une variable sur une nouvelle classe → `grid-row-gap` / `grid-column-gap`.
- `set_style` avec deux classes globales échoue (traité comme combo) → créer une combo `is-*`.
- `create_variable_mode` avec `breakpoint_id` ne marche que pour une collection : pour les autres, créer le mode sans breakpoint puis `set_style_variable_mode` sur `page-wrapper` en `medium` / `small`.
- Vérifier d'abord si les variables ont des modes Tablette/Mobile : sinon les créer (titres et espacements s'adaptent d'un coup), puis seulement corriger les grilles, hauteurs fixes et positions absolues.
- Responsive : additionner les marges latérales (`padding-global` + `container-large` + padding interne des blocs) : en mobile, un seul retrait (16 px) pour tout le contenu, et les textes doivent tous partir du même bord. Un conteneur flex en ligne qui reçoit un bloc de plus (ex. mention légale) casse : passer en colonne.
- Menu burger ouvert : il prend toute la largeur → lui donner le même retrait que le contenu (page-padding + container-padding). `calc()` combinant deux variables est réduit à une seule variable par l'outil : mettre des valeurs fixes.
- `background-position` (raccourci) n'est pas enregistré par l'outil : utiliser `background-position-x` / `-y`, puis relire le style. Toujours relire après une modification de fond.
- Éléments à largeur fixe (cartes, items de liste en rem) : les passer à 100 % en tablette/mobile, sinon ils débordent et coupent les décors.
- Une combo nommée `w--open` est renommée `_w--open` (inutile) : pour battre un état Webflow, utiliser une combo maison (`is-burger`).
- Pas de `set_visibility` sur une instance de composant, pas d'insertion `after` une instance (utiliser `append` sur le parent).
- Un `Span` ne se lie pas à une propriété (`text` refusé) : le remplacer par un bloc texte (`<div class="…">`) puis lier.
- Propriété de lien d'un composant : modes `url` / `email` / `phone` seulement → pour une ancre, `url` = `#id-de-section`.
- `data_whtml_builder` : `href` et `id` écrits en HTML deviennent des attributs bruts → ensuite `set_settings` (`link`) et `set_dom_id`, puis supprimer l'attribut. Un paragraphe ne peut pas être placé directement dans un `Tabs` (le mettre dans un volet).
- Figma : `get_design_context` est tronqué vers 100 Ko sur une page longue → lire les textes avec `use_figma` en lecture seule (parcourir les enfants de la frame, `findAllWithCriteria({types:['TEXT']})`, ignorer les calques masqués) : une passe, tous les textes par section.
- Liste d'avantages dans une carte : propriétés `Avantage 1…n` + booléens « Afficher l'avantage n » liés à la visibilité des lignes optionnelles.

## Ne demander à l'utilisateur que si
1. le site est introuvable ou ambigu ;
2. il faut **supprimer** un élément existant (masquer avec `set_visibility` en attendant) ;
3. les animations (à la fin, en une seule question groupée ; défaut = standard premium de `references/animations.md`).
