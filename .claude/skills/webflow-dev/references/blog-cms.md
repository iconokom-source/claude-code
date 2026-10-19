# Recette : ajouter un blog à un site existant

Pré-requis : audit fait et `references/sites/<slug>.md` à jour. Plan validé (étape 3 du skill).

## 1. Collections CMS
Vérifier d'abord qu'aucune collection « Blog / Articles / Actualités » n'existe déjà (`get_collection_list`).

**Articles** (`data_cms_tool > create_collection`, nom « Articles », slug `blog`) puis champs (`create_collection_static_field` / `option` / `reference`) :

| Champ | Type | Requis | Usage |
|---|---|---|---|
| Name | (natif) | oui | titre de l'article (h1) |
| Slug | (natif) | oui | URL |
| Résumé | PlainText (multiligne, ≤ 160) | oui | extrait carte + meta description |
| Image principale | Image | oui | carte, hero, OG |
| Texte alt image | PlainText | non | alt de l'image |
| Contenu | RichText | oui | corps |
| Date de publication | DateTime | oui | tri + affichage |
| Catégorie | Reference → Catégories | non | filtres, tags |
| Auteur | PlainText (ou Reference → Auteurs si plusieurs) | non | signature |
| Temps de lecture | Number | non | « 5 min » |
| À la une | Switch | non | article mis en avant |
| Titre SEO | PlainText | non | sinon Name |
| Meta description | PlainText | non | sinon Résumé |

**Catégories** (si le client en veut) : Name, Slug, Description, Couleur (optionnel). Créer la collection Catégories **avant** le champ Reference.

Adapter les noms de champs à la langue du site (FR pour Dipita).

## 2. Page liste `/blog`
- `data_pages_tool > create_page` (title « Blog », slug `blog`), idéalement `duplicateOf` une page existante pour récupérer navbar, footer, CTA de fin et réglages.
- Structure : hero court (reprendre le hero d'une page secondaire, pas celui de l'accueil) → article à la une (optionnel, Collection List filtrée `À la une` isOn, limit 1) → grille d'articles → CTA existant → footer.
- Grille : Collection List (`DynamoWrapper`) — source = collection Articles, tri `date-de-publication` descending, pagination `{ itemsPerPage: 9 }` (réglages via `data_element_settings_tool > set_settings`, valeurs `static_json`). État vide (`DynamoEmpty`) avec un texte.
- Carte article : réutiliser une carte existante du site si elle existe (composant ou classes) ; sinon créer **un composant** « Carte article » avec props liées aux champs (image, catégorie, titre, résumé, date, lien). Classes : uniquement typo/boutons/rayons existants + au plus 2–3 classes de layout nouvelles, nommées selon la convention du site.
- Filtres par catégorie : liens vers les pages de template Catégorie, ou Finsweet Attributes (CMS Filter) si le site l'utilise déjà.

## 3. Template d'article
Le template de collection est créé avec la collection. Structure :
- hero article : catégorie, `h1` = Name, date + temps de lecture + auteur, image principale (alt lié) ;
- corps : Rich Text lié à Contenu, avec une classe de texte riche stylée (h2, h3, p, ul, blockquote, img, a) **à partir des styles typo existants** (mêmes tailles/couleurs/interlignes que les titres du site) ; largeur de lecture ~ 65–75 caractères ;
- fin d'article : CTA existant (ex. « Prendre RDV »), « Articles similaires » (Collection List filtrée même catégorie, limit 3, réutilise la carte) ;
- SEO du template : titre `{Titre SEO || Name} | <Marque>`, description `{Meta description || Résumé}`, OG image = Image principale ; schéma JSON-LD `BlogPosting` (headline, image, datePublished, author, publisher).

## 4. Navigation
Ajouter « Blog » dans la navbar (composant : modifier le composant une fois, pas chaque page) et le footer, avec le même style que les autres liens. Le demander dans le plan : c'est visible sur tout le site.

## 5. Animations
Reprendre la bibliothèque d'animations du site : apparition du hero, stagger des cartes au scroll, hover des cartes (même effet que les cartes/boutons existants).

## 6. Contenu et publication
- 1 à 3 articles d'exemple en brouillon (`create_collection_items` sans publier) pour tester la mise en page, à supprimer ou remplacer ensuite (avec accord).
- Vérifications de l'étape 6 du skill, preview `webflow.io`, puis publication site + items sur accord.
- Rappeler au client/Louis que le plan Webflow du site doit inclure le CMS (plan CMS ou Business) et la limite d'items.
