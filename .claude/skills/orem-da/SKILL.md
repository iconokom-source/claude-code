---
name: orem-da
description: Direction artistique et charte de marque d'Orem (agence de design et développement web B2B) pour produire n'importe quel support aux couleurs d'Orem — présentations et propositions commerciales (HTML, PDF, PowerPoint/.pptx), documents (rapports, comptes rendus, devis, notes en PDF ou Word/.docx), applications et outils internes, dashboards, pages web, emails, posts. Contient les couleurs (noir, bleu Orem #092482 en dégradé nuit→aube, orange #FF6200 en accent), les polices Trykker + Lexend Deca, les logos SVG/PNG, les formes organiques, les gabarits prêts à l'emploi, des scripts .pptx/.docx et le ton de voix. À utiliser dès qu'un livrable mentionne Orem, l'agence, « notre DA », « notre charte », « nos couleurs », « à nos couleurs », « au style Orem », ou qu'un membre d'Orem demande un deck, un doc, une app interne ou un visuel, même sans parler explicitement de charte.
---

# Orem : direction artistique

Orem conçoit des sites et des identités pour des entreprises B2B. Son identité fonctionne
comme **un musée** : un cadre monochrome, sobre et silencieux qui laisse la place aux projets,
une typographie éditoriale qui donne la voix, un bleu fondateur déployé en spectre (de la nuit
vers l'aube : la complexité qui devient claire) et un orange qui n'apparaît que par touches.
Fonction avant forme, clarté visuelle, exigence du détail. Si un choix n'est pas couvert ici,
trancher en faveur du plus sobre et du plus lisible.

## L'essentiel à appliquer partout

**Couleurs**
- Fond : noir `#000000` ou blanc `#FFFFFF` (secondaires : papier `#F8F8F7`, graphite `#181818`).
- Texte : encre `#000012` sur clair, `#F2F2F2` sur sombre ; secondaire = même couleur à 60 %.
- Bleu Orem `#092482` + spectre nuit `#051026` → aube `#C5E6F1`, surtout sous forme de
  **dégradé vertical** (`--orem-gradient-blue`) et de **formes organiques** à lueur bleue.
- Orange `#FF6200` : **uniquement** surtitres, numéros d'options/étapes, « À noter », focus.
  Jamais en fond, jamais en titre, jamais en paragraphe.

**Typographie** (Google Fonts, fichiers dans `assets/fonts/`)
- **Trykker** Regular : titres, chiffres clés, citations. Interlettrage −3 % au-dessus de 50 px.
- **Lexend Deca** Light / Regular / Medium / SemiBold : corps, UI, surtitres, légendes. −2 %.
- Interligne 120 %. Casse de phrase, pas de capitales, pas d'italique, pas de Bold.
- Paragraphes **toujours alignés à gauche** ; centrage réservé aux couvertures, chapitres, citations.

**Formes** : rayon **24 px** pour cartes et images, boutons en **pilule**, filets fins de 1–1,5 px,
beaucoup de vide, marges de 64 px (slides) / 32 pt (A4). Ombre unique et douce :
`0 16px 90px 5px rgba(0,0,18,.15), 0 0 4px rgba(0,0,18,.3)`.

**Motif signature** : un **surtitre orange** court au-dessus d'un **titre Trykker** (« Notre
approche » / « Des sites conçus pour faire travailler les entreprises B2B. »).

**Voix** : affirmée, experte, sobre. Phrases courtes, verbe fort, bénéfice d'abord, preuve
chiffrée, puis action. Zéro jargon creux, zéro superlatif, ponctuation minimale, guillemets
typographiques. Écrire « Orem » (pas « OREM », pas « cshStudio »). Détails : `references/marque.md`.

## Démarche

1. **Identifier le support** et ouvrir la référence correspondante :
   | Support | Lire | Partir de |
   |---|---|---|
   | Deck, proposition, keynote | `references/slides.md` | `assets/templates/slides.html` ou `scripts/orem_pptx.py` |
   | Rapport, compte rendu, devis, note, PDF/Word | `references/documents.md` | `assets/templates/document-a4.html` ou `scripts/orem_docx.py` |
   | App interne, dashboard, page web, composant | `references/apps.md` | `assets/templates/app.html` + `assets/orem.css` |
   | Texte seul (email, post, accroche, microcopy) | `references/marque.md` | — |
   | Logo, favicon, visuels, photos | `references/logo-photo.md` | `assets/logo/` |
   Valeurs exactes (échelles typo web/slide/doc, paliers du dégradé, effets) : `references/tokens.md`.
2. **Copier les assets nécessaires** à côté du livrable (le CSS et les gabarits utilisent des
   chemins relatifs `../orem.css`, `../logo/…`, `../shapes/…`) ou les intégrer en ligne pour un
   fichier HTML autonome (SVG inline, CSS dans `<style>`).
3. **Composer avec les mises en page existantes** plutôt qu'inventer : le catalogue de
   `references/slides.md` renvoie à des captures du Figma dans `assets/reference/`. Les regarder
   quand un rendu doit être fidèle.
4. **Rédiger dans la voix Orem** (structure bénéfice → preuve → action).
5. **Vérifier le rendu** : capture Chromium/Playwright pour le HTML, `soffice --headless
   --convert-to pdf` puis `pdftoppm` pour .pptx/.docx. Contrôler : polices bien chargées
   (Trykker reconnaissable à ses empattements), aucun texte qui déborde, orange limité aux
   accents, texte lisible sur le dégradé (clair en haut, foncé ou carte blanche en bas).

## Scripts
- `scripts/orem_pptx.py spec.json deck.pptx` : deck 16:9 éditable, 12 mises en page
  (`--demo` pour l'exemple complet ; format du spec dans la docstring).
- `scripts/orem_docx.py spec.json doc.docx` : document A4 avec en-tête, styles, KPI, tableaux,
  encadrés, pagination (`--demo` pour l'exemple).
- `scripts/install_fonts.sh` : installe les polices pour Office/LibreOffice. Sans elles,
  .pptx et .docx s'afficheront dans une police de substitution.
Dépendances : `python-pptx`, `python-docx` (`pip install python-pptx python-docx`).

## Assets
```
assets/
  orem.css                 tokens (:root), thèmes clair/sombre, composants de base
  fonts/                   Trykker-Regular, LexendDeca Light/Regular/Medium/SemiBold + Variable, licences OFL
  logo/                    orem-monogramme-*.svg, orem-symbole-*.svg (noir, blanc, clair, bleu)
  logo/png/                mêmes logos en PNG transparents (Office, favicon)
  shapes/                  blob-{a,b,c}.svg (silhouettes), blob-{a,b,c}-bleu.svg (lueur bleue + grain)
  backgrounds/             dégradé bleu, couverture hero, formes sur noir, halo contact, trames de points
  templates/               slides.html (13 mises en page), document-a4.html, app.html
  reference/               captures des slides et du brand book Figma (00 à 28)
```

## Source
Figma « Orem » (fichier `aVKI9kfuXoWvQsiRsajLXD`) : pages Brand (brand book), Slides
(gabarits), Documents. Si l'accès Figma est disponible et qu'un détail manque, c'est la
source de vérité.
