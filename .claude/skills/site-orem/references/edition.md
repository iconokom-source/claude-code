# Mode 3 — Faire évoluer le site

Pages, sections, textes, mises en page, contenus CMS. Toujours dans la DA d'Orem (skill `orem-da`) et avec les briques déjà présentes sur le site. Les règles de sécurité du SKILL.md s'appliquent (lecture, sauvegarde, validation, pas de publication en production sans accord).

## Avant de construire

- Charger `orem-da`. Couleurs, typographie (Trykker pour les titres, Lexend Deca pour le texte), surtitre orange + titre, rayon 24 px, boutons pilule, voix Orem : y revenir à chaque décision visuelle ou textuelle.
- Regarder comment le site fait déjà : composants existants (`get_all_components` avec props), classes et variables existantes, sections similaires sur d'autres pages. **Réutiliser avant de créer.** Une nouvelle section ressemble aux autres sections du site, pas à un gabarit générique.
- Pour un contenu qui se répète ou évolue (articles, réalisations, offres, membres, FAQ, témoignages…) : passer par la collection CMS existante, pas par du statique.

## Changer un texte

1. Trouver l'élément (`query_elements` par texte) ou l'item CMS concerné ; si le texte vient d'un composant, voir s'il s'agit d'une prop d'instance ou du texte du composant (qui change partout).
2. Proposer la nouvelle version dans la voix Orem (ou appliquer mot pour mot celle donnée par l'utilisateur), avec l'ancienne à côté.
3. Après accord : `set_text` / prop d'instance / `update_collection_items`. Garder la balise et le niveau de titre.

## Créer une section

1. Proposer la structure (contenu, titre, éléments, composant réutilisé ou nouveau, version mobile) et, si utile, une maquette rapide en HTML aux couleurs d'Orem pour valider l'idée avant de construire.
2. Construire avec les classes existantes ; nouvelles classes seulement si nécessaire, dans la convention du site, valeurs reliées aux variables.
3. Sémantique : `section`, un seul `h1` par page, titres dans l'ordre, liens et boutons réels, textes alternatifs en français.
4. Responsive vérifié à 1440 / 992 / 991 / 767 / 478 / 390 px.
5. Animations : IX3 natives, sobres (cohérentes avec la DA « musée » : discrètes, lentes, rares), respect de `prefers-reduced-motion`. Aucun nouveau custom code si le natif suffit ; s'il est indispensable, suivre les règles d'écriture de `performance.md`, au niveau de la page.
6. En faire un composant si elle peut servir ailleurs, avec des props nommées en français.

## Créer une page

1. Valider avec l'utilisateur : objectif, slug en français, place dans la navigation, titre SEO, meta description, image Open Graph.
2. `create_page` (en brouillon `draft: true`) ou `duplicateOf` d'une page proche pour hériter de la structure. Navbar et footer : instances des composants existants.
3. Construire section par section comme ci-dessus ; si une maquette Figma existe, utiliser le skill `figma-to-webflow`.
4. SEO : titre, description, Open Graph, JSON-LD si pertinent, lien depuis la navigation ou le maillage interne, présence dans le sitemap.
5. Vérifier sur le sous-domaine, mesurer (la page doit respecter les budgets de `performance.md`), puis retirer le brouillon et publier après accord.

## Contenus CMS (article, réalisation, offre…)

1. `get_collection_details` pour les champs et leurs textes d'aide.
2. Préparer l'item complet (y compris champs SEO, image de couverture optimisée et son texte alternatif, catégorie), le montrer à l'utilisateur.
3. Créer en brouillon (`isDraft: true`), vérifier la page modèle sur le sous-domaine, puis publier l'item après accord (`publish_collection_items`).
4. Images : WebP ou AVIF, largeur adaptée à l'affichage réel, nom de fichier en kebab-case.

## Consigner

Toute modification appliquée va dans `site-orem/journal.md` (section « Évolutions »), avec la sauvegarde si de l'existant a été modifié. Committer et pousser.
