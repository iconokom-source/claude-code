---
name: webflow-dev
description: Développeur Webflow expert (Designer, CMS, Interactions GSAP/IX3, composants, variables, MCP Webflow) pour reprendre un site client existant et le faire évoluer directement via le MCP — ajouter une page, un blog, une section, une animation — en reprenant exactement ses codes visuels, sa structure et ses noms de classes, sans créer de doublons de styles. À utiliser dès qu'une demande touche un site Webflow d'Orem / ICONOKOM (« ajoute un blog sur Dipita », « crée une page sur le site X », « reprends le site Y », « anime cette section », « audit des styles Webflow », « nouveautés Webflow / MCP »).
---

# Développeur Webflow (Orem / ICONOKOM)

Rôle : reprendre un site **déjà livré** à un client et le modifier via le MCP Webflow comme si c'était le développeur d'origine. Le résultat doit être indiscernable du reste du site : mêmes classes, même structure, mêmes animations, aucun style en double.

Ordre obligatoire : **0. Se mettre à jour → 1. Trouver le site → 2. Auditer → 3. Planifier et valider → 4. Construire → 5. Vérifier → 6. Publier (sur accord)**. Ne jamais sauter l'audit, même pour « juste une page ».

## 0. Se mettre à jour (à chaque session)

Webflow et son MCP changent toutes les quelques semaines. Avant tout travail :

1. Appeler `webflow_guide_tool` (une seule fois par session, `session_id: "start"`, puis réutiliser le `ses_…` renvoyé). Noter la **version du MCP** affichée en tête et la comparer à celle de `references/veille.md`.
2. Version différente, ou dernière veille de plus de 30 jours → faire la veille décrite dans `references/veille.md` (changelog développeurs, page Updates, blog) et **mettre à jour ce fichier** avec les nouveautés utiles (outils, limites, animations, CMS). Commit de la mise à jour avec le reste du travail.
3. Avant d'écrire une animation : `data_interactions_tool > guide` (ou ressource `webflow://guides/interactions`). Avant un upload d'image/police : ressources `webflow://guides/asset-upload` / `webflow://guides/font-upload`.

Si un outil cité ici n'existe plus ou a changé de nom, suivre le guide du MCP (il fait foi) et corriger ce skill.

## 1. Trouver le site

- `data_sites_tool > list_sites` → repérer le site par son nom. Ne jamais supposer un `site_id`.
- Site absent de la liste (cas de Dipita en octobre 2026) → le site est dans un autre workspace (souvent celui du client) et n'a pas été autorisé pour le connecteur. Le dire à l'utilisateur : reconnecter le connecteur Webflow dans les réglages des connecteurs claude.ai et **cocher le site / workspace du client** dans l'écran d'autorisation Webflow (ou se faire inviter dans le workspace du client). Ne rien tenter d'autre en attendant.
- Jeton API de site (`WEBFLOW_API_KEY_<CLIENT>`, via le skill `cles-api`) : utile pour l'API REST v2 (pages, CMS, assets, custom code), mais il ne donne **ni les styles ni les interactions** — l'audit complet passe par le MCP. Ne jamais l'écrire dans le dépôt.
- **Plan du site** : vérifier qu'il permet ce qu'on va faire (un plan Basic n'a pas de CMS → pas de blog CMS sans changement de plan payé par le client). Le signaler avant de planifier.
- `get_site` → domaines, locales (FR-FR…), dernière publication.
- `data_agent_instructions_tool > search_instructions` → lire les instructions propres au site s'il y en a.
- Les outils Designer (`designer_tool`, `element_snapshot_tool`, sélection, navigation) exigent que le site soit **ouvert dans le Designer** avec l'app MCP Bridge lancée. Si ce n'est pas le cas, demander à l'utilisateur de l'ouvrir ; les outils `data_*` fonctionnent sans.
- Fiche du site : `references/sites/<slug>.md`. Si elle existe, la lire (elle contient le résultat du dernier audit) et ne refaire que la partie de l'audit qui a pu changer depuis sa date. Sinon, la créer à l'étape 2.

## 2. Auditer le site (obligatoire avant toute création)

Procédure détaillée : `references/audit.md`. En résumé :

1. **Pages** : `data_pages_tool` → liste, templates CMS, dossiers, slugs, SEO.
2. **Variables** : `data_variable_tool > get_variable_collections` + `get_variables` → couleurs, tailles, polices, modes.
3. **Styles** : `data_style_tool > get_styles` avec `include_properties: true` et les breakpoints `medium`, `small`, `tiny`, plus `hover` → sauvegarder le JSON dans le scratchpad, puis lancer `scripts/doublons_styles.py` dessus pour repérer les classes identiques et la convention de nommage.
4. **Composants** : `data_component_tool > get_all_components` (props, variantes, nombre d'instances). Navbar, footer, boutons, cartes = presque toujours des composants à réutiliser tels quels.
5. **Structure** : `data_element_tool > get_all_elements` sur la page d'accueil et 1–2 pages types (profondeur complète) → squelette de section (section > container > …), balises, noms affichés dans le Navigator, attributs.
6. **Animations** : `data_interactions_tool > list_interactions` sur ces pages → quels déclencheurs, quelles cibles (classe), quelles durées/courbes. Noter aussi les scripts (`data_scripts_tool > get_site_scripts`, freeform code) : GSAP custom, Lenis, Finsweet…
7. **CMS** : `data_cms_tool > get_collection_list` + détails des collections existantes.
8. **Visuel** : `element_snapshot_tool` sur 2–3 sections clés si le Designer est ouvert.

Rédiger/mettre à jour `references/sites/<slug>.md` avec le modèle `references/sites/_modele.md` : tokens, convention de nommage, classes réutilisables par rôle, composants, squelette de section, animations, CMS, doublons repérés. C'est ce fichier qui sert de « charte » pour toutes les créations suivantes.

## 3. Planifier et faire valider

Avant d'écrire quoi que ce soit dans Webflow, présenter un plan court :

- pages / collections / champs à créer (nom, slug, SEO) ;
- arbre des éléments de chaque nouvelle section, **classe par classe**, en signalant pour chacune : `réutilisée` (classe existante), `combo` (classe existante + modificateur) ou `nouvelle` (justifier pourquoi aucune existante ne convient) ;
- composants réutilisés et éventuels nouveaux composants ;
- animations reprises (mêmes que telle section) ;
- doublons existants trouvés à l'audit (proposer, ne pas corriger sans accord).

Attendre l'accord. Les nettoyages de styles existants, suppressions d'éléments, de composants, d'assets ou de champs CMS demandent **toujours** un accord explicite (actions irréversibles via MCP).

## 4. Construire — règles de style (le cœur du skill)

1. **Réutiliser d'abord.** Avant de créer une classe, `query_styles` par propriétés (`properties: [{name, value}]`) et par nom. Une classe existante qui a les mêmes propriétés = on l'utilise, même si son nom est imparfait.
2. **Zéro doublon.** Deux éléments qui ont exactement les mêmes propriétés (tous breakpoints et états compris) portent **la même classe**. Jamais de `blog-title` qui recopie `heading-style-h2`.
3. **Combo plutôt que copie.** Une variation légère d'une classe existante = combo class (`parent_style_names`) ou variante de composant, pas une nouvelle classe complète.
4. **Respecter la convention du site** relevée à l'audit (Client-First, Lumos, BEM maison, kebab-case FR…) : préfixes, séparateurs, langue. Une nouvelle classe doit avoir l'air d'avoir été écrite par la même personne.
5. **Variables, pas de valeurs en dur.** Couleur, police, taille, espacement qui existe en variable → `variable_as_value`. Une valeur nouvelle récurrente → proposer une variable.
6. **Propriétés longues** (`margin-top`, pas `margin`) dans `create_style` / `update_style`. Breakpoints : `main` puis `medium` (≤991), `small` (≤767), `tiny` (≤478) — reproduire le comportement responsive des sections équivalentes.
7. **Créer les styles avant les éléments** qui les utilisent. `set_style` remplace toute la liste de classes de l'élément (l'ordre = base puis combos).
8. **Composants** : navbar, footer, CTA, cartes → insérer l'instance existante (`data_component_builder` / `insert_component_instance`) et régler ses props ; ne jamais recréer à la main un bloc qui existe en composant. Un nouveau bloc répété ≥ 2 fois → en faire un composant avec props.
9. **Structure** : reprendre le squelette de section du site, les balises sémantiques (`section`, `header`, `article`, un seul `h1` par page, niveaux de titres cohérents), et nommer les éléments dans le Navigator comme sur les autres pages (`set_display_name`).
10. **Construire** : `data_element_builder` pour des arbres d'éléments (profondeur illimitée en un appel), ou `data_whtml_builder` (HTML + CSS) pour un gros bloc — dans ce cas le CSS ne doit contenir **que des classes déjà existantes ou validées au plan**, uniquement les media queries Webflow (991/767/479), pas de `@keyframes`. Vérifier après coup qu'aucune classe parasite n'a été créée (`query_styles`).
11. **Pages** : `data_pages_tool > create_page` (option `duplicateOf` pour partir d'une page existante quand la structure est proche — c'est souvent le plus fidèle), puis SEO / Open Graph / schéma JSON-LD.
12. **Images** : `asset_tool > upload_image_by_url` avec texte alternatif ; compression webp/avif seulement sur accord (remplace l'original).

Recette complète pour ajouter un blog (collection, template, liste, catégories, SEO) : `references/blog-cms.md`.

## 5. Animations (Interactions IX3 / GSAP)

- Seul `data_interactions_tool` crée ou modifie des animations. Toujours lire son `guide` avant d'écrire un payload : le schéma JSON valide ne suffit pas.
- Reproduire les animations déjà présentes (même déclencheur, même courbe, même durée, même décalage) plutôt qu'en inventer. Cibler par **classe** pour que l'animation s'applique à toutes les occurrences.
- Pièges connus : animer `opacity` sous `wf:transform` (jamais `wf:style`) ; valeurs en tableaux/tuples, jamais `{from, to}`.
- Les interactions « Classic » (anciennes IX2) ne sont ni visibles ni modifiables par le MCP : si le site en utilise, le signaler et proposer soit de les reproduire en IX3, soit de les laisser à faire à la main dans le Designer.
- Une écriture acceptée ne prouve pas que ça anime : vérifier en Preview ou sur la version publiée (staging).
- `prefers-reduced-motion` : respecter le réglage existant du site ; ne pas ajouter d'animation bloquante sur le contenu principal.

## 6. Vérifier

- `element_snapshot_tool` sur chaque section créée (desktop) et comparer à une section équivalente du site.
- `query_styles` : aucune classe créée hors plan, aucune classe vide, aucun doublon nouveau (relancer `scripts/doublons_styles.py` et comparer au résultat de l'audit).
- Responsive : propriétés posées sur `medium` / `small` / `tiny` comme les sections équivalentes.
- SEO : titre, meta description, slug, OG, `h1` unique, alt des images, page dans le sitemap.

## 7. Publier

Jamais sans accord explicite (« publie »). Proposer d'abord la publication sur le sous-domaine `webflow.io` pour relecture (`publish_site` avec `publishToWebflowSubdomain: true`, sans domaine custom), puis la prod. Une publication par minute maximum. Items CMS : `publish_collection_items`.

## Règles générales

- Clés / jetons Webflow (API REST hors MCP) : skill `cles-api` (`WEBFLOW_API_KEY_*`). Ne jamais les afficher.
- Ne jamais supprimer (élément, style, composant, asset, champ, item) sans accord explicite sur l'objet précis.
- Ne pas modifier les styles d'une classe existante pour les besoins d'une nouvelle page : ça change tout le site. Créer une combo à la place.
- Ne pas toucher à la locale principale via `data_localization_tool` (elle est en lecture seule) ; les traductions vont dans les locales secondaires.
- Fin de tâche : résumé en quelques lignes (pages/sections créées, classes réutilisées vs nouvelles, composants, animations, lien de preview) + mise à jour de `references/sites/<slug>.md`.
