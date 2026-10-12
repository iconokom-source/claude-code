# Contrôle qualité (phase 8)

Corriger tout ce qui échoue avant d'écrire le rapport. Ce qui ne peut pas être corrigé va dans le rapport.

## Classes et styles
- [ ] `get_styles` avec propriétés : aucune paire de classes aux propriétés identiques (repasser le registre réel dans `scripts/registre_styles.py`).
- [ ] Aucune classe parasite : `div-block-*`, `text-block-*`, `heading-*`, `link-block-*`, `image-*`, noms suffixés ` 2`.
- [ ] Toutes les classes personnalisées suivent `[composant]_[élément]`, toutes les combos commencent par `is-`.
- [ ] Aucune combo sur une classe utilitaire, aucune modification d'utilitaire dans un contexte particulier.
- [ ] Aucune couleur, taille de texte, espacement ou rayon en valeur brute.
- [ ] Aucune classe inutilisée créée par le skill (la supprimer).

## Variables
- [ ] Chaque variable créée est utilisée.
- [ ] Les modes `Tablet` et `Mobile` sont appliqués sur `page-wrapper` et les titres changent bien de taille.
- [ ] Les schémas de couleur (`color-scheme-*`) basculent correctement textes, boutons et bordures.

## Composants
- [ ] Chaque section est un composant, rangé dans le bon groupe, avec une description.
- [ ] Chaque contenu variable est une prop nommée en français, avec infobulle si nécessaire.
- [ ] Navbar et footer sont les mêmes instances sur toutes les pages.
- [ ] Aucune structure dupliquée à la main au lieu d'une instance.

## CMS
- [ ] Chaque champ a un texte d'aide en français.
- [ ] Les groupes de champs sont en place.
- [ ] Le design supporte un champ facultatif vide et un texte deux fois plus long que dans la maquette.
- [ ] Les listes ont un état vide en français.
- [ ] Les pages modèles sont liées aux champs SEO.

## Responsive
- [ ] Checklist de la partie 5 de `responsive.md` validée à 992, 991, 767, 478, 375 et 320 px.

## Accessibilité et sémantique
- [ ] Un seul `h1` par page, hiérarchie sans saut.
- [ ] Balises `nav`, `main`, `footer`, `section`. Listes en `ul/li`.
- [ ] Texte alternatif sur toutes les images porteuses de sens.
- [ ] Contraste AA du texte : 4,5:1 (texte courant), 3:1 (grands titres, éléments d'interface).
- [ ] Focus visible au clavier sur tous les éléments interactifs.
- [ ] Les liens d'icône seule ont un `aria-label`.
- [ ] Les champs de formulaire ont un label.

## SEO de base
- [ ] Titre et meta description de chaque page en français.
- [ ] Slugs en français, courts, sans accent.
- [ ] Images au bon poids (le signaler sinon) et `loading="lazy"` hors premier écran (comportement par défaut de Webflow à vérifier sur le hero : `eager` pour l'image du hero).
