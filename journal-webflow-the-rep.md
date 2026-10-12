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

## Mise à jour (après redémarrages)
- Home : textes de toutes les sections existantes faits (fondateur, newsletter, système, membres fondateurs, FAQ 6 questions, navbar, footer + mention légale).
- Variables créées : radius/card (2.8125rem), space/3-rem, space/2-5-rem
- Classes créées : stack_component, section-header_component, card-grid_list (+ medium 2 col, small 1 col), card-grid_card, card-grid_subtitle, text-style-accent, compare_list (+ small 1 col), compare_card (+ is-outline, small padding), compare_row, compare_outro, text-size-caption is-accent, text-color-accent
- Section L'écart insérée après le hero : `fad4e16a-2ff1-b448-1eb2-630adf6cb9d3`
  - À faire : créer `section_ecart` et `compare_rows` (non créées par whtml), ajouter les Kickers (L'ÉCART, SON STAFF, VOTRE STAFF)
- Restent : sections Votre staff + L'application (composant carte), ordre, CapUS, responsive, rapport

## Enseignements (suite)
- data_whtml_builder sans CSS : réutilise les classes existantes, **ignore** les classes inconnues (pas de doublon, mais classe manquante) → créer toutes les classes avant
- Éléments créés avec children par data_element_builder : un nœud texte par défaut (« Lorem ipsum », « This is some text… ») est ajouté → toujours relire et nettoyer
- set_text sur TextBlock/ListItem échoue : viser le nœud String enfant
- Insertion "after" une instance de composant refusée : utiliser append sur le parent
- Demandes d'autorisation : règle d'organisation → mode Auto conseillé

## Avancement (suite 2)
- L'écart : classes section_ecart/compare_rows créées et appliquées, lien CapUS (page), 3 Kickers OK. Capture à refaire (snapshot a échoué).
- Classes section_staff, section_app créées.
- Section Votre staff insérée après « Cinq situations » : `445637ed-7e63-2ea6-a284-99e66b907261` avec 1 carte modèle (La tête)
  - À faire : Kicker « VOTRE STAFF », transformer la carte en composant « Carte Pilier » (props Numéro/Titre/Sous-titre/Texte), 4 autres instances
- Puis : section L'application (4 cartes, même composant), ordre des sections, CapUS
- Votre staff : composant « Carte Pilier » (a0016d0b-3e01-da83-407e-96ab0ee340f3, props Numéro/Titre/Sous-titre/Texte liés), 5 cartes remplies, Kicker OK.
- Reste : section L'application (4 Cartes Pilier + note), ordre (Podcast à valider), CapUS, responsive, rapport.
- Skill simplifié (SKILL.md court, 3 étapes, pièges outils intégrés).
