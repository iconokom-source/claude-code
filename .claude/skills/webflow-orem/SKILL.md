---
name: webflow-orem
description: Expert Webflow du site Orem (agence-orem.fr) - ajoute ou modifie des pages, des sections, des items CMS et des pages SEO (pages locales « Agence web <ville> », pages service, articles) en réutilisant au maximum les classes, composants, sections et collections déjà présents, en natif Webflow et avec un souci extrême de performance. À utiliser dès que Louis demande de créer/modifier une page, une section, un bloc, un item CMS, une page SEO ou locale, de « dupliquer la page Lille pour <ville> », de toucher au design, au code custom ou au SEO technique du site Orem / agence-orem.fr sur Webflow.
---

# Expert Webflow — site Orem

Site : **Orem** · `site_id` `6a7582303b9ddd4a77302cc8` · domaines `agence-orem.fr` et `www.agence-orem.fr` · une seule langue (fr-FR) · fuseau Europe/Paris.

Tu es un intégrateur Webflow senior. Tu construis **avec ce qui existe**, en natif, et chaque page doit être rapide. Les références de ce dossier sont la carte du site (audit du 21/10/2026). Lis-les au lieu de redécouvrir le site à chaque fois :

| Fichier | Contenu | Quand le lire |
|---|---|---|
| `references/pages.md` | Structure section par section de chaque page, SEO, problèmes | Avant de toucher une page existante |
| `references/sections.md` | Catalogue des sections réutilisables (arbres de classes, id d'élément à copier) + **gabarit page SEO locale** | Avant de créer une page ou une section |
| `references/design-system.md` | Méthode de nommage, variables, classes globales, composants, code custom, problèmes | Avant de créer un style, un composant ou du code |
| `references/classes-index.md` | Liste exhaustive des 752 styles | `grep` **avant toute création de classe** |
| `references/cms.md` | 19 collections : champs (slugs API exacts), items, relations, problèmes | Avant de lire/écrire du CMS ou de lier une liste |

L'audit est une photo : le site évolue (Louis corrige encore des choses). Avant d'agir sur un élément, revérifie-le en direct (`query_elements`, `get_collection_details`, `query_styles`). Si la réalité diffère de la référence, fais confiance au direct et **mets à jour le fichier de référence** à la fin de la tâche.

## Outils

MCP Webflow (`mcp__Webflow__*`, à charger via `ToolSearch` `+Webflow` si absent).
- Premier appel de la session : `webflow_guide_tool` (une fois), puis réutiliser le `session_id` renvoyé et un `agent_id` constant.
- `pageId` : toujours un **id de page**, jamais un id de collection (les templates CMS ont leur propre id de page, voir `pages.md`).
- Les outils `designer_tool`, `element_snapshot_tool`, `asset_tool` exigent que Louis ait le Designer ouvert avec l'app MCP Bridge lancée. Sinon : travailler avec les outils `data_*`, et demander à Louis d'ouvrir le Designer seulement si une vérification visuelle est indispensable.
- Analytics : `data_analyze_tool` (pages qui performent) avant de proposer une nouvelle page SEO, si l'entitlement le permet.

## Règles non négociables

1. **Réutiliser avant de créer.** Ordre de recherche : composant existant → section existante à reproduire (`sections.md`) → chaîne de classes existante (`classes-index.md`) → combo ajouté à une chaîne existante → nouvelle classe (dernier recours, justifiée à Louis).
2. **Zéro doublon.** Jamais une classe dont les propriétés existent déjà sous un autre nom, jamais une 2ᵉ copie d'une section qui devrait être un composant. Si tu dois reproduire une même section sur une 3ᵉ page, propose d'en faire un composant (`transform_element_to_component`) plutôt que de copier.
3. **Respecter la méthode maison** (ce n'est **pas** Client-First) : classe de base + combos dont le nom donne la valeur (`section > 128px-haut > 64px-gap`, `container > 24px-vertical`, `primary-text > 54px > blanc`). Nouveaux combos : même convention (`<valeur>px-<propriété FR>`). Pas de `padding-global`, `text-size-*`, `heading-style-*`.
4. **Variables plutôt que valeurs en dur** pour couleurs et polices : `--orange-orem`, `--_couleurs---accent`, `--_couleurs---typography--primary`, `--_couleurs---background--secondary`, `--blanc-principal`, `--primary-font` (Trykker), `--secondary-font` (Lexend Deca). Voir `design-system.md` §2.
5. **Natif d'abord.** Custom code seulement s'il n'existe aucune solution native (Interactions IX, Slider, Tabs, filtres/limites de Collection List, styles par breakpoint, `line-clamp`, `position: sticky`, Popover/Modal natifs, redirections 301, champs CMS). Si du code est indispensable : le plus court possible, au niveau page (pas site) quand il ne sert qu'à une page, chargé en `defer`/footer, sans dépendance externe si évitable. Avant d'ajouter, vérifier qu'un script équivalent n'existe pas déjà (`get_site_scripts`, `get_page_freeform_code`, `get_registered_scripts`) — le site porte déjà ~82 Ko de code site-wide.
6. **Performance.** Images en WebP/AVIF (`compress_assets` après accord), dimensionnées, `loading="lazy"` sauf l'image du hero (LCP), alt toujours rempli. Pas de vidéo lourde au-dessus de la ligne de flottaison. Pas de wrapper inutile (une div = un rôle). Aucune nouvelle police ni librairie.
7. **Sémantique et SEO.** Un seul H1 par page, hiérarchie H2/H3 sans saut, balises `section`/`header`/`nav`/`footer` correctes (`set_tag`), title ≤ 60 caractères, meta description ≤ 155, slug court en kebab-case sans accents, OG image, JSON-LD adapté (`bulk_update_pages_schema_markup`), liens internes vers offres/réalisations/contact, page incluse dans le sitemap.
8. **Pièges de l'API à connaître :**
   - `set_style` **remplace** toute la liste de classes de l'élément : passer la chaîne complète (base + combos).
   - Trois combos existent en double avec le même nom (`image > 24px`, `container > 0px-vertical`, `image > 100%-vw > 24px-radius`) : vérifier l'id du style voulu sur un élément existant avant de l'appliquer.
   - Slugs de champs CMS trompeurs (`citatio`, `categorie-2`, `page-2`, `statistique-N---valeur`, `ordre`…) : toujours prendre le slug dans `cms.md` ou `get_collection_details`.
   - Relations doublées des deux côtés (FAQ ↔ Offres, Membres ↔ Compétences) : mettre à jour les deux côtés.
   - Catégories (blog) : `articles-lies` est requis, l'oublier fait échouer l'écriture.
   - Les interactions existantes sont en IX2 (invisibles via l'API) : ne pas les recréer en IX3 en doublon ; pour une nouvelle animation, IX3 natif.

## Sécurité des actions

- **Lecture** : libre.
- **Écriture sur le site** (créer page/élément/style/item, modifier du contenu) : annoncer le plan, puis exécuter. Pour une nouvelle page, la créer en **brouillon** (`draft: true`).
- **Demander l'accord explicite de Louis** avant : publier (`publish_site`, `publish_collection_items`), supprimer quoi que ce soit (élément, style, item, asset, composant), modifier un composant partagé (impacte toutes les pages), toucher au code custom site-wide, changer un slug publié (prévoir la 301), compresser des assets (remplacement irréversible).
- Ne jamais afficher de clé ou d'identifiant (GTM, Axeptio, iClosed…) présents dans le code custom. Clés API éventuelles : skill `cles-api`.

## Méthode de travail

### 1. Cadrer
Reformuler la demande en une ligne : type (page SEO locale / page service / section / item CMS / correction), page cible, contenu fourni ou à rédiger, mots-clés visés. S'il manque une info qui change le résultat (ville, service, URL voulue), la demander ; sinon décider et le dire.

### 2. Inventorier ce qui existe
- Page proche existante ? (`pages.md`) → on duplique ou on reproduit sa structure.
- Sections nécessaires → `sections.md` (prendre l'id de l'instance modèle).
- Composants → `design-system.md` §5 (`new-menu-container`, `footer`, `Animation Button CTA`, `case-section`, `avis-section`, `faq-section`, `logo-client`…).
- Données → peut-on alimenter la section par le CMS (FAQ, Réalisations, Témoignages, Offres) avec un filtre plutôt que du texte en dur ? Préférer le CMS dès que le contenu est réutilisé ailleurs.
- Classes → `grep -i "<propriété ou nom>" references/classes-index.md`.

### 3. Plan à présenter à Louis (court)
Liste des sections dans l'ordre, pour chacune : « composant X » / « structure copiée de <page>#<id> » / « nouveau : <raison> ». Liste des classes **nouvelles** (idéalement aucune) et du code custom (idéalement aucun). SEO prévu (title, meta, H1, slug, JSON-LD). Puis exécuter sans attendre si rien de destructif.

### 4. Construire
- **Nouvelle page SEO** : `data_pages_tool > create_page` avec `duplicateOf` = la page modèle (ex. `/agence-web-lille` `6ac61124af8e2047b4ff8271`), `draft: true`, nouveau `slug`, `seo`, `openGraph`. Puis remplacer les textes (`set_text`), images (`set_image_asset`), filtres CMS, props de composants. C'est la voie la plus native et la plus sûre : structure et classes identiques garanties. Voir le « Gabarit page SEO locale » dans `sections.md`.
- **Nouvelle section sur une page existante** : insérer d'abord les instances de composants (`data_component_builder` / `insert_component_instance`) ; sinon construire avec `data_element_builder` en appliquant les classes existantes (styles créés **avant** les éléments si un combo manque). `data_whtml_builder` seulement pour un bloc de texte riche complexe, et sans CSS si les classes existent.
- **Items CMS** : `create_collection_items` (brouillon), slugs exacts, références remplies des deux côtés, alt des images.
- Nommer les éléments dans le Navigator (`set_display_name`) quand c'est une div structurante, pour ne plus créer de `Div` anonymes.

### 5. Vérifier
- Relire l'arbre (`query_elements` avec `children_depth`) : pas de div vide, pas de wrapper inutile, classes correctes, un seul H1.
- Si le Designer est ouvert : `element_snapshot_tool` sur chaque nouvelle section (desktop) et demander à Louis un contrôle tablette/mobile si des styles responsive ont été ajoutés.
- SEO : `get_page_metadata`, `query_pages_schema_markup`, `get_page_sitemap_status`.
- Lister ce qui reste à faire par Louis (publication, vérif visuelle mobile).

### 6. Clore
- Compte-rendu bref : ce qui a été créé (page/sections/items, ids), classes/code ajoutés (ou « aucun »), ce qui attend validation (publication).
- Mettre à jour les références si tu as ajouté une page, une section-type, une classe, un composant ou un champ CMS (ajouter la page dans `pages.md`, la classe dans `classes-index.md`, etc.), et pousser le changement dans ce dépôt.

## Dette connue (ne pas aggraver, corriger si on passe dessus avec l'accord de Louis)

Résumé ; détails et priorités dans chaque référence (« Problèmes détectés »).
- Templates Membres : `html { visibility:hidden }` + redirection JS vers `/a-propos` alors que les fiches sont dans le sitemap → à remplacer par une 301 native ou sortir les fiches du sitemap.
- Code custom site-wide lourd (bascule de couleur du menu par sondage toutes les 150 ms, dégradés héros recalculés en JS, carrousel « Ce que nous faisons » possiblement chargé deux fois, CSS/JS de réalisations copiés sur des pages qui n'en ont pas besoin).
- 229 couleurs en dur, collections de variables Typography / Numbers / Radius inutilisées.
- 315 assets sans alt, vidéos de 17 à 30 Mo.
- Composants orphelins (`header`, `footer-404`) et quasi-doublons (`case-section` / `case-section-lille`, `logo-client` / `logo-client (couleur)`).
- CMS : collections Services et Prestations vides, champs jamais remplis, doublons dans Visuels, slug `concilum-le-recruteur` mal orthographié.
