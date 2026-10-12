# Composants réutilisables

Objectif : le client doit pouvoir **construire de nouvelles pages seul** en assemblant des sections existantes et en remplissant des champs, sans jamais toucher aux classes.

## 1. Ce qui devient un composant

| Niveau | Exemples | Règle |
|---|---|---|
| Global | Navbar, Footer, Global styles, bandeau cookies | Toujours |
| Section | Hero, CTA, grille de services, témoignages, FAQ, logos, chiffres clés, contact | **Toujours**, même si la section n'apparaît qu'une fois : le client pourra la réutiliser sur une nouvelle page |
| Élément | Bouton, tag ou badge, carte, élément de liste, élément de FAQ, chiffre clé, lien avec icône | Dès qu'il apparaît 2 fois ou plus, ou qu'il est placé dans un slot |

Ne deviennent **pas** des composants : les wrappers de structure seuls (`padding-global`, conteneurs), les éléments à l'intérieur d'un élément de liste CMS qui sont déjà liés aux champs CMS (la carte CMS reste un composant si elle est aussi utilisée hors CMS).

## 2. Nommage et rangement

- Noms lisibles en français, rangés par groupe (`group` dans `create_blank_component` ou `set_component_metadata`) :
  - groupe `Global` : `Navbar`, `Footer`, `Global styles`
  - groupe `Sections` : `Hero – Accueil`, `CTA – Bandeau`, `Grille – Services`, `FAQ`
  - groupe `Éléments` : `Bouton`, `Carte – Projet`, `Tag`, `Élément FAQ`
- Ajouter une **description** à chaque composant : à quoi il sert et où il est utilisé (« Section d'appel à l'action pleine largeur, utilisable en bas de n'importe quelle page »).
- Les classes à l'intérieur restent en Client First anglais (`cta_component`…).

## 3. Props (champs éditables par le client)

Créer une prop pour **chaque contenu qui peut changer** d'une utilisation à l'autre :

| Contenu | Type de prop | Liaison |
|---|---|---|
| Titre, sur-titre, texte court | `textContent` | Texte de l'élément |
| Paragraphe avec mise en forme | `richText` | Rich text |
| Image | `image` + `altText` | Source de l'image et texte alternatif |
| Lien, bouton | `link` + `textContent` | Lien et libellé |
| Vidéo | `video` | Lien vidéo |
| Élément optionnel (sur-titre, 2e bouton, image) | `boolean` | Visibilité de l'élément |
| Ancre de section | `id` | Identifiant DOM de la section |

Règles :
- Noms de props en français, courts et explicites, avec groupe : `Titre`, `Sur-titre`, `Texte`, `Image`, `Texte alternatif`, `Bouton principal – texte`, `Bouton principal – lien`, `Afficher le bouton secondaire`. Groupes : `Contenu`, `Média`, `Boutons`, `Affichage`.
- Une **infobulle** (`tooltip`) en français pour chaque prop qui n'est pas évidente : longueur conseillée, format d'image, effet de l'option.
- Valeur par défaut = contenu de la maquette.
- Liaison : `get_bindable_sources` sur l'élément (avec `scope_component_id`), puis `set_settings` avec `binding: { source_type: "prop", prop_id }`. Pour la visibilité : `set_visibility` avec la prop booléenne.
- Un bouton imbriqué dans une section : instance du composant `Bouton` dont les props sont reliées aux props de la section si l'outil le permet ; sinon, props directement sur la section.

## 4. Variantes ou slots ?

- **Variante de composant** (`data_component_variants_tool`) : même structure, apparence différente. Exemples : section claire ou sombre, image à gauche ou à droite, bouton principal, secondaire ou texte. La variante modifie les styles (`set_variant_styles`) sans nouvelles classes. Pour les couleurs, préférer appliquer un mode de la collection `Theme` à la variante (`set_style_variable_mode` avec `variant_id`).
- **Slot** (`ComponentSlot`) : le nombre ou le type d'éléments à l'intérieur varie. Exemples : liste de cartes statiques, groupe de boutons, colonne de contenu libre. Seules des instances de composants peuvent aller dans un slot ; insérer avec `data_component_builder > insert_in_slot`.
- **Combo class** (`is-*`) : seulement pour une variation locale d'un élément, pas d'un composant entier.
- Plus de 3 variantes, ou des structures vraiment différentes → deux composants distincts.

## 5. Procédure de création

1. Construire la section sur la page avec les classes du registre (voir `webflow-mcp.md`).
2. `data_component_tool > transform_element_to_component` sur `section_[nom]`, avec le nom et le groupe.
3. Créer les props (`data_component_props_tool > create_prop`) en un seul appel.
4. Lier chaque élément à sa prop.
5. Créer les variantes nécessaires.
6. Vérifier : `get_component` avec `includeProps` et `includeVariants`, puis capture de l'instance.
7. Pour réutiliser la section sur une autre page : `data_component_builder` ou `insert_component_instance`, puis `set_component_instance_prop_values`. **Ne jamais dupliquer la structure à la main.**

## 6. Composants contenant du CMS

Une section qui affiche une liste CMS (derniers articles, équipe) peut être un composant contenant une Collection List. La source de la liste est fixe dans le composant ; si la même section doit afficher des collections différentes, faire un composant par collection, avec les mêmes classes.
