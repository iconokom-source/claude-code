# Orem : documents (rapports, comptes rendus, propositions écrites, devis, notes)

Référence : page « Documents » du Figma (rapport « Un mois après la mise en ligne »).
L'esprit : une page blanche de musée, beaucoup d'air, une hiérarchie portée par Trykker et des
filets fins. Aucune couleur sauf l'orange pour un surtitre et le bleu `#092482` pour les graphiques.

## Choisir le format
| Besoin | Outil |
|---|---|
| PDF à envoyer, rendu exact | `assets/templates/document-a4.html` → PDF via Chromium (Playwright `page.pdf({format: 'A4', printBackground: true})`) |
| Fichier Word éditable (.docx) | `scripts/orem_docx.py` (spec JSON ou API Python) |
| Google Docs | Générer le .docx avec `orem_docx.py` puis l'importer ; sinon appliquer les styles ci-dessous à la main |
| Markdown / Notion / email | Pas de mise en page possible : appliquer seulement le ton (`marque.md`) et la structure |

## Mise en page A4 (595 × 842 pt)
- Marges latérales **32 pt**. En-tête à 32 pt du haut ; le contenu démarre à ~84 pt.
- **En-tête (toutes les pages)** : monogramme « Orem » noir 38 pt de large à gauche ;
  à droite « © 2026 Orem. / Tous droits réservés. » en Lexend Deca Light 9 pt, interligne 110 %.
- **Bloc titre (page 1)** : à gauche le type de document (« Rapport mois 1 », « Compte rendu »,
  « Proposition ») en Lexend Light 9 pt ; à droite le titre en Trykker 17 pt ; filet fin dessous.
- **Titres de section** : Trykker 17 pt, −2 %, suivis d'un filet 1 px `#BCBAB9` à 25 % à 4 pt
  sous le texte, puis le corps directement.
- **Corps** : Lexend Deca Light 12 pt, interligne 120 %, −1 %, couleur `#000012`, aligné à gauche.
  Paragraphes séparés par une ligne vide (~9 pt), pas d'alinéa.
- Listes : tirets ou puces simples, ou numérotation 1. 2. 3. ; jamais de puces fantaisie.
- **Pagination** : « 1/2 » en bas à droite, 9 pt, gris `#434242` à 60 %.
- Gras : Lexend Deca Medium, avec parcimonie. Pas d'italique, pas de soulignement.

## Composants
- **Chiffres clés** : 2–4 colonnes, filet vertical 1 px `#000012` à gauche, chiffre Trykker
  26 pt, libellé Lexend Light 9 pt dessous.
- **Tableau** : en-têtes Lexend Light gris, filet sous l'en-tête, lignes alternées `#F8F8F7`,
  aucune bordure verticale ni quadrillage, texte 10 pt.
- **Encadré « À noter »** : fond `#F8F8F7`, label orange 9 pt, texte 10,5 pt.
- **Graphiques** : traits fins `#092482` (0,5–1 pt), aires `#092482` à 25–30 % d'opacité, labels
  en Trykker 10 pt bleu. Radar, courbes, barres sobres ; pas de légende colorée multicolore. Pour
  plusieurs séries, utiliser les paliers du spectre bleu (`#022257`, `#0166B0`, `#63C2E0`, `#BDE7F4`)
  puis l'orange pour la série à mettre en avant.
- **Images** : captures de projets pleine largeur ou demi-colonne, sans ombre (à plat dans un document).

## Structures types
- **Rapport mensuel** : Contexte → Référencement naturel (SEO) → Performances techniques →
  Comportement des visiteurs → Synthèse et recommandations (liste numérotée) → prochain point d'étape.
- **Compte rendu de réunion** : Contexte / participants → Décisions → Points ouverts →
  Prochaines étapes (qui, quoi, quand) dans un tableau.
- **Proposition écrite** : Ce que nous avons compris → Notre approche → Périmètre et livrables
  (tableau) → Planning (chronologie) → Investissement (ce que couvre le montant, options,
  coûts récurrents) → Prochaine étape.
- **Devis / facture** : en-tête identique ; tableau Désignation / Quantité / Prix unitaire HT /
  Total HT ; totaux alignés à droite avec le total TTC en Trykker ; mentions légales en 9 pt gris.

## Export PDF depuis le gabarit HTML
```bash
node -e "
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[1], { waitUntil: 'networkidle' });
  await p.pdf({ path: process.argv[2], format: 'A4', printBackground: true, margin: {top:0,right:0,bottom:0,left:0} });
  await b.close(); })();" "$PWD/document.html" document.pdf
```
Pour les slides HTML, même commande avec `width: '1920px', height: '1080px'` au lieu de `format`.

## Polices hors-ligne
Les gabarits HTML chargent les polices depuis Google Fonts. Sans réseau, décommenter les
`@font-face` de `orem.css` et copier `assets/fonts/` à côté. Pour Word/PowerPoint/LibreOffice,
installer les .ttf de `assets/fonts/` (`scripts/install_fonts.sh` sous Linux/macOS).
