# Journal Webflow — The Rep

- Site : `6ac69beb7c3a9e78e083cf93` (The Rep, espace Iconokom, plan Starter)
- Pages : Home `6ac69bed7c3a9e78e083cfa1` · CapUS `6ac6aef437435cbd51de1994`
- Figma : `aTYYGBNvJhZlmPkcSYo8sQ` — The Rep V2 `9387:486` · CapUS V2 `9387:44`
- Mode : **mise à jour** d'un site existant (textes V2 + nouvelles sections)

## Avancement Home
- [x] Hero : sur-titre (Kicker), H1, boutons empilés (`button-group is-stacked`), intro, lettre, signature + bio
- [x] Cinq situations : titre, intro, 5 cartes
- [x] Manifeste : sur-titre, titre, texte, liste `ul`, bouton, note (légende avatar masquée)
- [x] Méthode TABLE : sur-titre, titre, intro, 5 cartes
- [x] Daily Tracker : sur-titre, bouton, note, 6 lignes
- [~] Système : sur-titre, titre (légende bleue à ajouter, schéma à vérifier)
- [~] Newsletter : sur-titre, titre, intro, liste (phrase de fin à ajouter)
- [~] Fondateur : sur-titre, titre, nom, rôle (citation 3 paragraphes avec surlignage à refaire, avatar)
- [ ] Roadmap → Membres fondateurs (titre, texte, bouton REJOINDRE, note, 4 étapes)
- [ ] FAQ : 6 questions, sans onglets (réponses 2 à 6 absentes de la maquette)
- [ ] Footer, navbar
- [ ] Nouvelles sections : L'écart, Votre staff (5 cartes), L'application (4 cartes) — composant carte commun
- [ ] Ordre des sections, Podcast absent de la V2

## Classes créées
- `button-group is-stacked`, `text-size-caption`, `text-color-accent`
- `hero_signature` : ajout text-align right

## À valider par l'utilisateur (suppressions)
- Sur-titre de « Cinq situations » (instance de composant, non masquable par l'outil)
- Section Podcast (absente de la V2)
- Onglets de la FAQ

## Enseignements pour le skill
- set_text sur un bouton : viser le nœud String, pas le Block
- set_text supprime un préfixe « Mot 22 : » → utiliser une espace insécable avant « : » et relire le texte
- « \n » n'est pas interprété : créer des listes `ul/li` (BY_CUSTOM_TAG) ou plusieurs paragraphes
- row-gap n'accepte pas de variable : utiliser grid-row-gap
- set_style avec 2 classes globales échoue : elles sont traitées comme combo
- Instance de composant : pas de set_visibility
