---
name: orem-da
description: Direction artistique, charte et contenus d'Orem (studio de clarté stratégique, d'image et de sites Webflow pour PME B2B) pour produire tout support à ses couleurs — propositions commerciales, recommandations, decks et présentations en PDF ou PowerPoint, rapports, comptes rendus, devis (PDF A4 ou Word), apps et outils internes, dashboards, pages web, emails, posts. Contient le kit de slides officiel (dégradé bleu nuit→aube, couvertures, formes organiques, trames de points, cartes), les polices Trykker et Lexend Deca, les logos, les gabarits, des scripts de rendu PDF/.pptx/.docx, le ton de voix, la méthode O.R.E.M., les offres, les références chiffrées et les témoignages. À utiliser dès qu'un livrable concerne Orem, l'agence ou un de ses prospects/clients, qu'on parle de « notre DA », « notre charte », « à nos couleurs », « une propale », « une reco », « un deck », ou qu'un membre d'Orem demande un document, une présentation, une app interne ou un visuel, même sans citer la charte.
---

# Orem : direction artistique

Orem conçoit l'image et les sites d'entreprises B2B. L'identité fonctionne comme **un musée** :
un cadre monochrome, sobre et silencieux qui laisse la place aux projets ; une typographie
éditoriale (Trykker) qui porte la voix ; un **bleu fondateur déployé en spectre** (de la nuit vers
l'aube : la complexité qui devient claire) ; un orange qui n'apparaît que par touches. Fonction
avant forme, clarté, exigence du détail. Dans le doute, choisir le plus sobre et le plus lisible.

## L'essentiel à appliquer partout

**Couleurs**
- Fonds : noir `#000000` (souvent avec trame de points), blanc `#FFFFFF`, **dégradé bleu**
  (21 paliers `#050C1C` → `#D3EDF5`, classe `.bg-gradient`), panneau dégradé de 653 px + blanc.
- Texte : encre `#000012` sur clair, `#F2F2F2` sur sombre ; secondaire `#434242` à 60 % (clair) ou
  `#F2F2F2` à 60 % (sombre).
- **Surtitres et petits labels : bleu `#092482` sur fond clair, orange `#FF6200` sur fond sombre,
  dégradé ou couverture.** L'orange n'est jamais un fond, un titre ou un paragraphe.
- Surfaces : carte blanche rayon 24 (sur dégradé), papier `#F8F8F7` (sur fond à points), bloc
  marine `#050C1C` rayon 24 (mise en avant sur fond clair).

**Typographie** (Google Fonts ; fichiers dans `assets/fonts/`)
- **Trykker** : titres (94 / 64 / 48 / 37 px sur slide 1920), chiffres, phrases fortes. −3 %.
- **Lexend Deca** Light/Regular/Medium : texte 24, légendes 20, labels 17. −2 %.
- Interligne 120 %, casse de phrase, pas d'italique, paragraphes alignés à gauche.

**Signatures visuelles** : surtitre + titre-phrase ; étiquette de contexte en haut à droite ;
bloc conclusion « Le résultat » (label bleu + phrase Trykker) ; numéros 01/02 ou repères A/B/C ;
listes à coches rondes ; colonnes à filet vertical ; chiffres Trykker à filet ; couverture en
dégradé flou avec le symbole en haut à droite ; dernière page « Prochaine étape » en carte blanche
avec CTA pilule, QR et contacts.

**Voix** : affirmée, experte, honnête, sobre. Titres = l'idée complète en une phrase. Bénéfice →
preuve → action. Chiffres prudents et sourcés, jamais inventés. Écrire « Orem ». Détails :
`references/marque.md`. **Contenus réels (offres, méthode O.R.E.M., références chiffrées,
témoignages, équipe) : `references/contenus-orem.md`.**

## Démarche

1. **Identifier le support** :
   | Support | Lire | Partir de |
   |---|---|---|
   | Proposition, recommandation, deck, présentation, atelier, « document » client en paysage | `references/slides.md` | `assets/templates/deck.html` + `scripts/render_pdf.cjs` |
   | .pptx éditable explicitement demandé | `references/slides.md` | `scripts/orem_pptx.py` |
   | Rapport, compte rendu, devis, note A4 (PDF ou Word) | `references/documents.md` | `assets/templates/document-a4.html` ou `scripts/orem_docx.py` |
   | App interne, dashboard, page web, composant | `references/apps.md` | `assets/templates/app.html` + `assets/orem.css` |
   | Texte seul (email, post, accroche, microcopy) | `references/marque.md` | — |
   | Logo, favicon, visuels, photos | `references/logo-photo.md` | `assets/logo/` |
   Valeurs exactes (échelles, paliers, effets) : `references/tokens.md`.
2. **Partir du gabarit et de ses classes**, ne pas réinventer les styles :
   `sh scripts/new_deck.sh dossier/ [deck|document|app]` prépare le livrable avec tous ses assets
   (CSS, fonts/, backgrounds/, logo/) et des chemins corrects. Les chiffres et textes [entre
   crochets] du gabarit sont des exemples à remplacer.
3. **Remplir avec du contenu réel** (brief + `contenus-orem.md`). Inconnu = `[à compléter]`.
4. **Rendre et regarder** : `node scripts/render_pdf.cjs deck.html deck.pdf --png apercus/` puis
   ouvrir les PNG. Vérifier : polices chargées, aucun débordement ni chevauchement, chiffres non
   coupés, labels de la bonne couleur selon le fond, texte lisible sur le dégradé. Corriger, re-rendre.

## Scripts
- `scripts/render_pdf.cjs page.html sortie.pdf [--a4] [--png dossier/]` : HTML → PDF (Playwright).
- `scripts/new_deck.sh dossier/ [deck|document|app]` : prépare un livrable avec ses assets.
- `scripts/qr.py "url" qr.svg` : QR code encre (`pip install segno`).
- `scripts/orem_pptx.py spec.json deck.pptx` : deck éditable, 12 mises en page (`--demo`). Dépendances Python : `pip install python-pptx python-docx segno`.
- `scripts/orem_docx.py spec.json doc.docx` : document A4 Word (`--demo`).
- `scripts/install_fonts.sh` : polices pour Office/LibreOffice.

## Assets
```
assets/
  orem-deck.css            kit de slides 1920×1080 (fonds, typo, cartes, listes, chiffres, boutons)
  orem.css                 tokens + composants web/app (thèmes clair/sombre)
  templates/deck.html      20 mises en page de proposition (référence : reference/deck/*.jpg)
  templates/document-a4.html, templates/app.html
  backgrounds/             couverture-hero(.jpg, -2), blob-sombre.jpg, degrade-bleu(.png, -vertical), trames de points
  logo/                    monogramme + symbole SVG ; logo/png/ dont orem-symbole-degrade.png
  shapes/                  formes organiques SVG (silhouettes + versions à lueur bleue) pour le web
  fonts/                   Trykker, Lexend Deca (OFL)
  reference/deck/          captures des 18 mises en page ; reference/*.jpg captures du Figma
```

## Sources
Figma « Orem » (`aVKI9kfuXoWvQsiRsajLXD` : pages Brand, Slides, Documents), decks Orem validés
(octobre 2026) et site agence-orem.fr (Webflow, site « Orem »). Si un accès Figma ou Webflow est
disponible et qu'un détail manque, ce sont les sources de vérité.
