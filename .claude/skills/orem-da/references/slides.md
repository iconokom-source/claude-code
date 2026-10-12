# Orem : présentations (decks, propositions commerciales, keynotes)

Format : **16:9, cadre 1920×1080**. Chaque mise en page ci-dessous a une image de référence
dans `assets/reference/` (captures du Figma) : l'ouvrir avant de composer une slide inédite.

## Outils
- **HTML / PDF** : partir de `assets/templates/slides.html` (13 mises en page prêtes, échelle
  automatique, export PDF 1 slide = 1 page via l'impression Chromium).
- **PowerPoint / Keynote / Google Slides** : `scripts/orem_pptx.py` génère un .pptx à partir
  d'un spec JSON (`python3 scripts/orem_pptx.py --demo demo.pptx` pour voir toutes les mises en
  page). Mises en page : `cover, chapter, intro, rows, bullets, cards, steps, kpis, quote, table,
  timeline, contact`. Les fonds complexes (dégradés, formes) y sont des images de
  `assets/backgrounds/`, le texte reste éditable.
- Vérifier le rendu : `soffice --headless --convert-to pdf deck.pptx` puis `pdftoppm -r 50 -png`.

## Principes de composition
1. **Une idée par slide.** Beaucoup de vide, peu de texte. Le vide fait partie de la marque.
2. **Alterner les ambiances** pour rythmer : noir (chapitres, contenus denses), dégradé bleu
   (chapitres, cartes, citations), blanc (contenus, chiffres, tableaux). Éviter trois slides
   identiques d'affilée.
3. **Surtitre orange + titre Trykker** est la signature de toute slide d'ouverture de section.
4. Texte à gauche, aligné sur la marge de 64 px. Le centrage est réservé aux couvertures,
   chapitres et citations courtes.
5. Pas de puces décoratives, pas d'icônes clipart, pas d'ombres portées dures, pas de
   pictogrammes colorés. Les visuels sont des captures de projets (rayon 24) ou des formes
   organiques.
6. Le symbole Orem (bulles) se place en haut à droite (x = 1749, y = 64, ~107 px) sur la
   couverture ; pas besoin de logo sur chaque slide.

## Catalogue des mises en page

| # | Mise en page | Fond | Composition | Référence |
|---|---|---|---|---|
| 1 | **Couverture** | Dégradé flou « hero » + grain | Symbole noir en haut à droite. Titre Trykker 94 px `#F2F2F2` en bas à gauche (x 64, bas à 53 px), 2 lignes max | `02-couverture-hero-degrade.jpg` |
| 1b | Couverture forme | Noir + grande forme organique | Surtitre orange + titre Trykker 94 centrés | `01-couverture-blob.jpg` |
| 2 | **Chapitre sombre** | Noir + forme organique | Surtitre orange 24 px + titre Trykker 94 centré, 2 lignes | `03-chapitre-blob.jpg` |
| 3 | Chapitre dégradé | Dégradé bleu vertical | Idem, texte `#F2F2F2` dans le tiers haut | `04-chapitre-degrade.jpg` |
| 4 | Chapitre clair | Blanc | Surtitre + titre à gauche (x 64), symbole en dégradé bleu à droite | `05-chapitre-clair-symbole.jpg` |
| 5 | **Intro texte + visuels** | Blanc ou noir | Colonne gauche 924 px : surtitre, titre Trykker 72, paragraphe Lexend 24 gris 60 %, phrase forte en SemiBold. À droite : captures de projets (rayon 24) ou panneau dégradé | `06-…sombre.jpg`, `07-…clair.jpg` |
| 6 | Schéma cible | Blanc ou noir | Titre Trykker à gauche ; à droite cercles concentriques en pointillés (trait 1,5, tirets 20/20) avec libellés Lexend 24 | `08-schema-cercles-pointilles.jpg` |
| 7 | **Texte label / valeur** | Noir + trame de points | Titre Trykker 94 (lh 110 %), chapeau Trykker 37 à 60 %. Lignes : label Trykker 37 à 60 % (x 64) / valeur Trykker 37 (x 684). Tout en Trykker | `21-texte-label-valeur-sombre.jpg` |
| 8 | Texte listes | Noir + trame de points | Titre + 2 colonnes : label gris puis liste à puces « • » Trykker 37 | `22-texte-listes-sombre.jpg` |
| 9 | **Cartes options** | Dégradé bleu | 3 cartes blanches rayon 24, ombre douce : « Opt 1 » orange 20 px, titre Trykker 37, puces Lexend 24, note grise en pied | `11-…verre-degrade.jpg`, `12-cartes-blanches.jpg` |
| 9b | Options colonnes | Noir | Titre Lexend 64 en bas à gauche, 3 colonnes séparées par filets verticaux : « Option 1 » Trykker 37 orange en haut, titre + puces en bas | `13-options-colonnes-sombre.jpg` |
| 10 | **Étapes** | Panneau dégradé 653 px + blanc | Titre Lexend 64 `#F2F2F2` dans le panneau ; grille 2×2 : « Étape 01 » orange 17 px, titre Trykker 37, texte Lexend 24 | `09-etapes-split-degrade.jpg` |
| 11 | Problème / constat | Noir + forme, ou blanc | Surtitre « Le problème » + deux affirmations Lexend 64 avec ✓ et ✕ | `10-probleme-check-croix.jpg` |
| 12 | **Chiffres clés** | Blanc | Légende 20 px en haut à gauche ; à droite (x 928) 3 lignes : filet vertical 1,5 px + chiffre Trykker 94 + libellé Trykker 37. Témoignage Lexend 37 en bas à gauche + auteur | `18-chiffres-cles.jpg` |
| 13 | **Citation** | Dégradé bleu ou forme organique | Citation Trykker 72 blanche entre guillemets “ ”, signature « Orem » Trykker 37 alignée à droite | `14-…blob.jpg`, `15-…degrade.jpg` |
| 14 | **Tableau** | Blanc | Titre Trykker 64 à gauche (x 64) ; tableau à x 684 : en-têtes Lexend Light 20 gris, lignes alternées `#F8F8F7`, aucun quadrillage ; note grise en bas à gauche | `23-tableau.jpg` |
| 15 | Versus / comparaison | Panneau dégradé + blanc à trame de points | Titre Trykker 64 dans le panneau ; deux cartes `#F8F8F7` à angle droit avec listes ✓ / ✕ | `24-versus.jpg` |
| 16 | **Chronologie** | Blanc | Titre Trykker 64 ; ligne horizontale 1,5 px `#000012` à mi-hauteur, points de 20 px, titres Trykker 37, textes Lexend 20 gris | `19-chronologie.jpg` |
| 17 | Process + équipe | Moitié blanche / moitié noire à points | Bulles d'étapes `#F8F8F7` rayon 24 en quinconce (« étape 1 » bleu `#092482`) ; photos d'équipe reliées par des courbes fines | `20-process-equipe.jpg` |
| 18 | Étude de cas | Panneau dégradé + grille | Panneau gauche : nom du projet Trykker 64, contexte en bas. Grille 2×2 de cartes `#F8F8F7` : Enjeu, Notre intervention, Résultats, Ce qui fait écho | `16-etude-de-cas-grille.jpg`, `17-…texte-sombre.jpg` |
| 19 | Équipe | Noir + trame de points | Titre Trykker 64 ; 3 photos rayon 24 ; nom Trykker 24 + rôle Lexend 18 à 60 % | `25-equipe.jpg` |
| 20 | Références | Noir | Mosaïque de captures de sites en cartes rayon 24 dispersées, titre Lexend 64 centré | `28-mosaique-references.jpg` |
| 21 | Graphique | Blanc | Titre Trykker 64 ; barres en pilules arrondies (dégradé bleu nuit → noir, grain) | `27-graphique-barres.jpg` |
| 22 | **Contact** | Halo graphite + formes bleues | Carte verre centrale 474×598 : surtitre orange, nom Trykker 37, email/téléphone à 60 %, bouton pilule blanc « Prochaine étape ↗ » | `26-contact-carte-verre.jpg` |

Vue d'ensemble du brand book : `00-brandbook-vue-ensemble.jpg`.

## Trame type d'une proposition commerciale Orem
1. Couverture (« Recommandation stratégique & opérationnelle pour le futur site [Client] »)
2. Ce que nous avons compris du projet (label / valeur)
3. Le rôle que doit jouer le futur site (listes)
4. Challenge du plan de site & constat UX (label / valeur)
5. Notre lecture / approche éditoriale
6. Méthode : étapes ou chronologie, puis équipe projet
7. Études de cas (contexte, enjeu, intervention, résultats, ce qui fait écho)
8. Chiffres clés et témoignage
9. Multilingue, accessibilité, performance, conformité
10. Visibilité et pilotage du projet ; extensions possibles
11. Investissement (ce que couvre le montant, options, coûts récurrents)
12. Après la mise en ligne : faire vivre le site
13. Contact / prochaine étape

## Pièges fréquents
- Mettre du texte sombre sur la moitié haute du dégradé (illisible) ou du `#FFFFFF` pur pour un
  long paragraphe sur noir (utiliser `#F2F2F2`).
- Employer l'orange pour un titre ou un fond : il reste un accent de petite taille.
- Multiplier les tailles : s'en tenir à l'échelle 94 / 64 / 37 / 24 / 20 / 17.
- Oublier l'interlettrage négatif sur les grands titres Trykker (ils paraissent alors lâches).
- Utiliser ↗ ou ᵉ dans PowerPoint : Lexend Deca et Trykker n'ont pas ces glyphes.
