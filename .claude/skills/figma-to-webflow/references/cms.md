# Collections CMS

Objectif : des collections que le client comprend et alimente seul, avec les bons types de champs, des textes d'aide clairs en français et un nombre de champs raisonnable.

## 1. Détecter ce qui est une collection

Analyser **chaque groupe d'éléments répétés** de la maquette (cartes, lignes, logos, items) et compter les signaux :

| Signal | Poids |
|---|---|
| Une page de détail existe ou est suggérée (« Lire l'article », « Voir le projet », carte cliquable, maquette de page détail) | +3 |
| Le contenu est daté, signé ou catégorisé (date, auteur, catégorie, tags, lieu, prix) | +2 |
| Le contenu va évidemment s'enrichir dans le temps (actualités, événements, offres d'emploi, réalisations, produits, témoignages, membres d'équipe) | +2 |
| La même liste (ou un extrait) apparaît sur plusieurs pages (« Derniers articles » sur l'accueil + page Blog) | +2 |
| Filtres, onglets de catégories, pagination, « Voir plus », compteur | +2 |
| 3 éléments ou plus de structure identique avec un contenu différent | +1 |
| Contenu figé lié à la mise en page (étapes 1-2-3 d'un process, 3 arguments sous un hero, menu) | −3 |
| Moins de 3 éléments et aucune perspective d'en ajouter | −2 |

Décision :
- **Score ≥ 3 → collection CMS.**
- **Score 1 ou 2 → composant avec slot** (le client peut ajouter des éléments, mais il n'y a ni page détail ni réutilisation).
- **Score ≤ 0 → contenu statique** dans le composant de section (props).

Cas habituels : Blog/Actualités, Réalisations/Projets, Équipe, Témoignages, Offres d'emploi, Événements, Services avec pages détail, Partenaires/Logos (si réutilisés sur plusieurs pages), FAQ (si réutilisée sur plusieurs pages ou plus de 8 questions), Catégories et Auteurs (collections de référence).

Noter le score et la décision de chaque groupe dans le journal ; le rapport final les reprend en une ligne chacune.

## 2. Concevoir la collection

### Nommage
- `displayName` au pluriel, `singularName` au singulier, en français : `Actualités` / `Actualité`, `Réalisations` / `Réalisation`.
- `slug` en français, court, sans accent : `actualites`, `realisations`, `equipe`.

### Champs
Champ `Name` (obligatoire, déjà créé par Webflow) : c'est le titre de l'élément. Renommer son libellé si besoin (`update_collection_field`) : `Titre de l'article`, `Nom et prénom`. Le `Slug` est généré automatiquement.

Correspondance contenu → type de champ :

| Contenu dans la maquette | Type Webflow | Remarque |
|---|---|---|
| Texte court sur une ligne (sous-titre, poste, ville) | `PlainText` | |
| Résumé pour les cartes | `PlainText` | Préciser la longueur maximale dans l'aide |
| Corps d'article, description longue mise en forme | `RichText` | |
| Image principale, photo, logo | `Image` | |
| Galerie | `MultiImage` | |
| Date (publication, événement) | `DateTime` | |
| Lien externe, site web | `Link` | |
| Vidéo YouTube ou Vimeo | `VideoLink` | |
| Prix, durée, note, ordre d'affichage | `Number` | |
| Mis en avant, à la une, épinglé | `Switch` | |
| Liste fermée de valeurs (statut, type de contrat) | `Option` | Si les valeurs ne changent jamais et n'ont pas de page |
| Catégorie, auteur, service lié | `Reference` | Collection séparée si la valeur a sa propre page, une description, ou sert de filtre réutilisé |
| Plusieurs catégories ou tags | `MultiReference` | |
| Document à télécharger (PDF) | `File` | |
| Couleur propre à l'élément | `Color` | Seulement si la maquette varie vraiment la couleur selon l'élément |
| E-mail, téléphone | `Email`, `Phone` | |

Toujours ajouter pour une collection avec page détail :
- `Meta title` (`PlainText`) et `Meta description` (`PlainText`), dans un groupe « SEO ». Ils servent dans les réglages SEO de la page modèle, avec repli sur le titre et le résumé.
- `Image de partage` (`Image`) si la maquette ne contient pas déjà une image principale utilisable.

Ne **pas** créer de champ pour ce qui est identique pour tous les éléments (libellé « Lire la suite », icône de flèche) : c'est du design, pas du contenu.

### Textes d'aide (`helpText`), obligatoires sur chaque champ
Format : **où ça s'affiche** + **contraintes** + **exemple** si utile. En français, une ou deux phrases.

- Image : « Image affichée en haut de l'article et sur la carte de la page Blog. Format paysage 16:9, 1600 × 900 px minimum, moins de 500 Ko (WebP ou JPG). »
- Résumé : « Court texte affiché sur les cartes de la liste. 160 caractères maximum, sans retour à la ligne. »
- Switch : « Activez pour afficher cet élément en premier dans la section « À la une » de l'accueil. Un seul élément à la fois. »
- Ordre : « Position dans la liste (1 = en premier). Laissez vide pour un tri par date. »
- Référence : « Catégorie affichée sur la carte et utilisée pour les filtres de la page Blog. Créez d'abord la catégorie dans la collection Catégories. »
- Meta description : « Texte affiché sous le titre dans Google. Entre 120 et 155 caractères. Si vide, le résumé est utilisé. »

Pour définir les dimensions conseillées d'une image : prendre la taille d'affichage maximale dans la maquette, × 2 pour les écrans haute densité, arrondie, et le ratio réel.

### Champs obligatoires
`isRequired: true` seulement pour ce dont le design a absolument besoin (image d'une carte, résumé). Tout le reste est facultatif et le design doit fonctionner s'il est vide (masquer l'élément avec une visibilité conditionnelle).

### Groupes de champs
Après création des champs : `update_collection_field_groups` avec, dans l'ordre : `Contenu`, `Médias`, `Classement` (catégories, mis en avant, ordre), `SEO`. Une description courte par groupe.

## 3. Créer dans Webflow

1. Collections de référence en premier (Catégories, Auteurs), puis les collections principales (un champ `Reference` a besoin de l'identifiant de la collection cible).
2. `create_collection` → `create_collection_static_field` / `create_collection_option_field` / `create_collection_reference_field`, en regroupant les actions dans un même appel.
3. Groupes de champs.
4. **Éléments d'exemple** : créer un élément par carte visible dans la maquette, avec le vrai contenu Figma et les images téléversées. Pour une collection avec page détail sans contenu détaillé dans la maquette, remplir le `RichText` avec un texte d'exemple structuré (titres, paragraphes, liste) pour tester le style rich text, et le signaler dans le rapport. Créer les éléments avec `isDraft: false` (prêts à publier) mais **ne pas publier**.
5. Vérifier les limites du plan Webflow (nombre de collections, de champs par collection, d'éléments). En cas de dépassement probable, le signaler dans le rapport au lieu de supprimer des champs utiles.

## 4. Brancher le design

1. Dans la section : Collection List (`DynamoWrapper`). Régler `source`, `sort` (date décroissante ou ordre), `limit`, filtres (`filters` / `filterMatch`) via `data_element_settings_tool > set_settings`, valeurs en `static_json`. Vérifier avec `get_settings`.
2. Classes Client First sur la liste : `[nom]_list-wrapper` (wrapper), `[nom]_list` (liste, porte la grille), `[nom]_item` (élément).
3. Lier chaque élément de la carte au champ CMS (`get_bindable_sources` puis `set_settings`). Visibilité conditionnelle sur les éléments liés à des champs facultatifs.
4. État vide (`DynamoEmpty`) : message en français (« Aucune actualité pour le moment. ») avec les classes de texte existantes.
5. **Page modèle** : construire la page détail avec les composants existants et les liaisons CMS. Si la maquette ne contient pas de page détail, créer une page modèle simple et propre (hero avec titre, date, image ; rich text dans `container-small`) et la signaler comme « à valider : maquette absente ».
6. Style du rich text : classe `text-rich-text` avec les styles de tous les éléments enfants (titres, paragraphes, listes, liens, images, citations), en réutilisant les variables de titres et de texte.
7. SEO de la page modèle : titre et description liés aux champs SEO, image Open Graph liée à l'image principale ; à défaut d'outil, le noter dans le rapport comme réglage manuel.
