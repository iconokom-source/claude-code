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
- Podcast masqué (accord utilisateur). Section L'application créée (`921a2140-5f7e-be86-3228-6ca4e6b75eee`) : Kicker, titre, intro, 4 Cartes Pilier, note. Newsletter déplacée après L'application → ordre conforme V2.
- Snapshot en échec (timeout) : vérifier visuellement dans le Designer. Grille auto-fit 12rem OK pour 4 cartes.
- Reste : CapUS, responsive des nouvelles sections, rapport.

## Responsive (tablette ≤ 991 / mobile ≤ 767)
- Constat : quasi aucune surcharge responsive sur le site, variables sans modes.
- Typography : modes Tablette (auto medium) et Mobile (auto small) → titres 4xl 57→48→36 px, 3xl 43→38→32, 2xl 34→30→26, xl, l, display, roadmap + interlignes.
- Spacing : modes Tablette/Mobile (liaison breakpoint refusée par Webflow → appliqués sur `page-wrapper` en medium/small). margin 8→3→1.25 rem, space/10→7→5, 6→4.5→3.5, 4→3→2.5, 3→2.5→2, 2.5→2→1.75, 2→2→1.5.
- Classes : split_component (+is-equal) 1 colonne, split_divider masqué, split_visual hauteur auto + image-wrapper 28/20 rem, hero_letter en flux (plus en absolu), hero min-height auto, pain-points 1 colonne non sticky, method_heading 100 %, method_card plus étroites en mobile, tracker empilé, system 44/30 rem, roadmap empilé (timeline 26 rem), footer colonnes empilées, navbar menu ouvert en colonne sur fond blanc, CTA navbar masqué en mobile.
- À vérifier visuellement (captures impossibles) : hero lettre, section système (schéma), roadmap, menu burger.
- Retours utilisateur (captures) corrigés : footer_card en colonne (mention légale sous les colonnes) ; marge de page unifiée (padding-global = variable margin 48/20 px, container-large 0 en tablette/mobile — avant 56+24 px en mobile) ; split_text et faq sans retrait en tablette/mobile ; tracker, roadmap, cartes à 20 px de padding en mobile ; système : schéma sous le titre en mobile.
- Standard agence appliqué : variable `page-padding` (Spacing) 64 / 32 / 16 px sur `padding-global` ; `container-large` sans padding latéral. Variable `margin` inchangée (utilisée sur CapUS).
- The Rep a des lignes verticales (box-shadow de container-large) : rien ne doit les toucher → variable `container-padding` 32 / 24 / 16 px sur container-large (en plus de page-padding 64/32/16).
- Menu mobile ouvert : navbar_menu padding latéral = page-padding + container-padding (56 px tablette, 32 px mobile) ; calc() avec deux variables non supporté par l'outil (garde une seule variable) → valeurs fixes.
- Arrondis responsive : collection Radius modes Tablette/Mobile (page-wrapper) ; radius/card 45→32→20 px ; nouvelle radius/large 32→24→16 px (tracker, roadmap) ; method_card et pain-points_card liés à radius/card (étaient 45px en dur).
- Bouton S'abonner : flèche en background sans position (s'affichait en haut à gauche) → background-position-x/y. Roadmap : roadmap_item 100 %, roadmap_list/track 100 % en tablette/mobile (la liste débordait et cachait la frise).
- Méthode TABLE : lettre géante (font-size/display) 250 → 208 → 176 px (au lieu de 160/96) ; cartes 480 px de haut en tablette, 288 px de large et 384 px mini en mobile.
- Boutons mobile : texte 16→15 px, hauteur ~46→42 px (padding 12/20 px) ; is-submit et capus_button ajustés.
- Menu tablette/mobile refait : panneau plein écran (min-height 100vh, fond blanc, padding-top 7.5rem), liens en grand (2xl) séparés par un filet, bloc CTA `navbar_menu-cta` (Rejoindre + Débuter avec CapUS) visible seulement < 992 px, navbar_right masqué < 992 px, burger `navbar_menu-button is-burger` (fond transparent, au-dessus du panneau). Lien « Feuille de route » → section roadmap.
- À faire par l'utilisateur : Navbar > Settings > Menu animation = « Over Right » (non réglable via MCP).
- Sections plus aérées : padding-section-medium 72 px tablette / 64 px mobile ; padding-section-large 88 / 72 px.
- Footer : footer_component padding latéral = page-padding (l'image de fond reste visible autour de la carte), 96 px haut/bas en tablette, 64 px en mobile. FAQ : ombre-bordure latérale supprimée < 992 px.
- Menu : logo au-dessus du panneau (navbar_logo-link relative z-index 1001), liens et CTA alignés à droite.
- Menu Over Right : navbar_menu width/max-width 100vw (avec 100 % le panneau débordait à gauche et les filets touchaient le bord).
- Barre de défilement masquée sur method_track (scrollbar-width: none), roadmap_timeline l'avait déjà.
- Photo + avatar fondateur remplacés par l'image Figma V2 (asset 6ace27d75da2a0900a67f77f, alt FR). Manifeste/Newsletter/footer/hero identiques à la V2.
- Logo : taille fixe (flex-shrink 0, min-width 9.4375rem).
- Animations IX3 natives : i-1d903600 apparition au scroll, i-5e1f3e0d cartes en cascade, i-2e4c7cd6 entrée du hero, i-4e667f16 accordéon FAQ (details/summary → div, togglePlayReverse), i-6edf2e6b survol boutons (site), i-df445b5f survol cartes. Reduced motion respecté.
- Animations scroll recréées en wf:inst (30 interactions « Home – Apparition 01-20 », « Cascade Staff/Application/L'écart/Méthode/Tracker/FAQ », « Image 1-3 », « Schéma système ») ; les versions wf:class ne jouaient pas en publié (supprimées). Animations CapUS ajoutées puis retirées (à faire après The Rep).
- FAQ : réponses 2 à 6 absentes de la maquette V2 → à fournir par le client.
- Navbar compacte 992-1279 px : liens 15 px, gap 20 px, padding pilule 18 px, « Débuter avec CapUS » masqué ; rétabli au breakpoint large (≥ 1280 px). Burger natif impossible au-dessus de 991 px.
- Système : titre max 34rem (dans le cercle) ; schéma centré par marges auto (plus de translate) ; rotation au scroll (scrub, −12° → 12°, i-ba3c9290). Option : schéma en SVG pour animer seulement les flèches.
