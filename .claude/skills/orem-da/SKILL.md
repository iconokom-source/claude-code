---
name: orem-da
description: Crée un document commercial 100 % dans la direction artistique Orem (proposition commerciale, book, deck de suivi, présentation client, one-pager) en HTML 1920x1080 exportable en PDF. À utiliser dès qu'on demande un document, une propal, un deck, un book ou des slides « Orem », « avec notre DA » ou pour un client de l'agence.
---

# Document Orem (DA officielle)

Produit un deck HTML 16:9 (1920x1080 par slide) qui reprend exactement la DA Figma d'Orem, avec un bouton « Télécharger en PDF » et un export PDF vectoriel léger. Le gabarit `template/index.html` contient 16 slides modèles (P01 à P16) déjà validées en production (book Orem, propositions Sundis, Au P'tit Louis, Huchet-Demorge).

## Règles non négociables

**Rédaction**
- Français, vouvoiement du lecteur.
- **Jamais de tiret long « — » ni « – »** : virgule, deux-points ou point à la place. `render.js` les compte et alerte.
- Guillemets français « » dans le texte, guillemets typographiques “ ” pour les citations clients.
- Espaces avant `: ; ! ?` et dans les nombres (`1 000+`, `100 %`, `490 € HT`).
- Écrire orienté décision et bénéfice client, pas orienté prestation. Un titre de slide est une affirmation, pas une étiquette (« Votre site doit vous faire choisir » plutôt que « Notre offre site »).

**Vocabulaire Orem**
- « agence », jamais « studio ».
- « Direction artistique », jamais « Image de marque ».
- Pas de « Zero-Lock » : dire « Votre site vous appartient, vous êtes libres ».
- Méthode **O.R.E.M.** : Orienter, Représenter, Exécuter, Mesurer.
- Offres :
  - Conseil (O), phase incluse au début de chaque projet ;
  - Direction artistique (R), niveaux Essentiel, Pro et Premium ;
  - Site web (E), Webflow, SEO et GEO, deux mois d'assistance ;
  - Évolution (M), suivi mensuel réservé aux clients Orem, niveau 1 à 490 € HT / mois, niveau 2 à 890 € HT / mois, engagement 3 mois.
- Chiffres officiels : « plus de 40 clients accompagnés depuis 2023 », « 100 % de satisfaction client ».
- Positionnement : agence de conseil, de direction artistique et de sites web pour les entreprises B2B qui ont déjà de la traction et dont l'image ne suit plus. Ne pas réduire Orem à « des sites ».

**Prix et contact**
- **Aucun prix dans un book ou une présentation d'agence.** Prix uniquement dans une proposition commerciale nominative.
- **CTA unique** : « Réserver un appel de 30 minutes », lien https://app.iclosed.io/e/Orem/rdv-30min. Un lien iClosed spécifique au client peut le remplacer s'il est fourni.
- Contacts :
  - Louis Montagne, cofondateur, louis@agence-orem.fr, 07 50 37 15 72 ;
  - Théophile Lamouret, cofondateur, theophile@agence-orem.fr, 07 71 67 39 47.
  Mettre en avant celui qui porte le dossier client.
- Signature : « Orem, marque d'ICONOKOM » et agence-orem.fr.

## Démarrage

```bash
.claude/skills/orem-da/scripts/new_doc.sh <dossier-cible> "<Titre onglet>"
```

Copie le gabarit et tous les assets (polices, fonds, logos, photos) dans le dossier. Ensuite :

1. **Plan d'abord.** Lister les slides (titre et message clé de chacune) avant d'écrire du HTML. Viser 10 à 17 slides pour une propal, 20 à 26 pour un book.
2. **Choisir un modèle par slide** dans le catalogue ci-dessous. Dupliquer la `<section>`, remplacer les `[crochets]`, supprimer les modèles inutilisés. Alterner fonds clairs, sombres et dégradés pour garder du rythme. Pas plus de deux slides consécutives sur le même fond.
3. **Images** : convertir toute image en JPEG avant intégration (`python3 scripts/img.py src.webp assets/x.jpg 1600`). Les AVIF et WebP gonflent le PDF au-delà de 20 Mo. Garder en PNG uniquement les détourés (logos, `studio-display.png`).
4. **Rendu et contrôle** (voir plus bas), corriger, recommencer jusqu'à zéro alerte.
5. **Export PDF**, commit, puis envoi du PDF à l'utilisateur.

## Système visuel

**Format**
- Slide de 1920x1080, marges de 64px sur les quatre côtés. Zone utile de 1792x952.
- Positionnement absolu `.abs` avec `left`/`top` en px.
- Colonnes types :
  - gauche 64→804 et droite 928→1856 ;
  - trois colonnes de 555px séparées par 64px ;
  - grilles avec `gap:24px`.
- En-tête standard : titre `.title` à gauche, `.sub` à droite, en `top:64px`. Contenu à partir de `top:232px`.

**Couleurs** (tokens `:root`)

| Token | Valeur | Usage |
|---|---|---|
| `--ink` | #000012 | texte principal, cartes sombres, CTA |
| `--orange` | #ff6200 | accent **sur fond sombre uniquement** : numéros, surtitres, « Le résultat », option recommandée |
| `--accent` | #092482 | accent **sur fond clair uniquement** (même rôles que l'orange) |
| `--paper-2` | #f8f8f7 | fond de carte claire |
| `--muted` / `--light-muted` | gris 60 % | texte secondaire sur clair / sombre |
| `--stroke` | #cdcdcd | filets |
| `--grad` | dégradé nuit vers ciel | `.bg-grad`, `.split-left` |

**Ces tokens sont la palette complète.** Aucune autre couleur n'est autorisée : pas de crème, pas de bleu clair inventé, pas de teinte intermédiaire. Seules exceptions : les teintes internes du dégradé `--grad` (jamais isolées en aplat) et les transparences de blanc ou d'encre (`rgba(255,255,255,.06)`, `rgba(0,0,18,.08)`) pour les cartes « verre » et les filets.

**Règle des deux accents (comme sur agence-orem.fr)**
- Fond clair (blanc, `--paper-2`, carte blanche) : accent **bleu** `--accent`. Jamais d'orange.
- Fond sombre (noir, encre, `.dots-dark`, `.bg-grad` côté sombre, carte encre, couverture) : accent **orange** `--orange`.
- Le gabarit l'applique tout seul : `.c-orange`, `.eyebrow` et tous les composants utilisent le token `--hl`, qui vaut bleu dans un contexte clair et orange dans un contexte sombre (bloc « Garde-fou DA Orem » en fin de CSS). **N'écrivez jamais `var(--orange)` ni `#ff6200` en dur dans une slide : utilisez `var(--hl)` ou `.c-orange`.**
- Le contexte est détecté sur les classes connues (`.bg-black`, `.dots-dark`, `.bg-grad`, `.split-left`, `.box.ink`, `.case-quote`, couverture) et sur les styles inline `background:var(--ink)`, `#000`, `#fff`, `var(--paper-2)`. Pour un nouveau conteneur dont le fond vient d'une classe CSS, ajoutez `class="on-dark"` ou `class="on-light"`.
- Un contour d'accent posé sur fond clair (ex. carte recommandée) utilise `var(--accent)`, même si la carte elle-même est sombre.
- Pas d'orange en aplat de fond (une petite pastille de tag reste tolérée sur fond sombre).

**Logo**
- Fond sombre : `assets/logo-white.png` (blanc).
- Fond clair : `assets/logo-black.png`, ou `assets/logo-gradient.png` en grand format sur une carte claire.
- Couverture : le logo est posé dans la zone claire du visuel `cover-bg`, donc `logo-black.png`. Si la zone est sombre, passez en blanc.

Fonds : `.bg-grad`, `.bg-black`, `.dots-dark`, `.dots-light`, `assets/cover-bg.jpg` (couverture), `assets/blob-chapter.jpg` (intercalaire), `assets/opt-bg-1/2/3.jpg` (cadres d'options).

**Typographie**
- Trykker (serif) pour les titres et les chiffres.
- Lexend Deca pour le texte courant.
- Les deux sont embarquées en woff2 local : ne jamais charger Google Fonts, car Chromium le refuse dans cet environnement.

| Classe | Rôle | Taille |
|---|---|---|
| `.display` | titre de couverture, chiffres géants | 94px serif |
| `.quote` | citation plein écran | 72px serif |
| `.title` | titre de slide | 64px serif |
| `.headline` / `.headline-13` | titres de cartes, phrases fortes | 37px serif |
| `.body` / `.body-l` | texte courant (regular / light 350) | 24px |
| `.sub` | sous-titres, légendes | 20px |
| `.label` | libellés de carte | 17px |
| `.eyebrow` | surtitre d'accent (bleu ou orange selon le fond) | 24px |

Couleurs de texte : `.c-light .c-lm .c-muted .c-orange .c-accent .c-ink`. **Ne pas descendre sous 17px.** Ne pas inventer de nouvelles tailles, sauf `.case-title` (52px) et les chiffres à 80px (`.display` réduit).

**Composants**
- `.checks` : puces cochées `<li><svg><use href="#check"/></svg><span>…</span></li>`. Sur fond sombre, ajouter `style="--check-stroke:#000"` et `class="c-light"`.
- `.dash` : puces rondes.
- `.loss` : point numéroté à filet gauche.
- `.col-rule` : colonne à filet sur fond sombre.
- `.card` et `.split-left` / `.split-right` : split dégradé avec cartes.
- `.offer` : carte d'offre avec lettre O.R.E.M.
- `.cmp` (`.cmp-head`, `.cmp-row`, `.cmp-total`, `.cmp-reco`) : comparatif à trois options.
- `.tl-line` / `.tl-col` / `.tl-dot` : chronologie.
- `.step` : étapes à filet.
- `.team` : équipe.
- `.avis-grid` / `.avis` : avis clients.
- Cas client : `.case-left`, `.case-right`, `.case-cols`, `.case-stats`, `.case-num`, `.site-btn`.
- `.logo-grid` / `.logo-cell` : grille de logos.
- `.screen` : capture de site dans l'écran Studio Display.
- `.pill-cta` : bouton CTA.
- `.opt-frame` / `.opt-card` : options sur fond photo.
- Flèche : `<svg><use href="#arrow"/></svg>`.

## Catalogue des slides modèles (template/index.html)

| ID | Modèle | Usage |
|---|---|---|
| P01 | Couverture (fond cover-bg, logo, surtitre d'accent, titre display) | toujours en premier |
| P02 | Intercalaire de chapitre (blob, titre centré) | changer de partie |
| P03 | Titre à gauche, 3 points numérotés à droite | constat, problème, enjeux |
| P04 | 3 colonnes sur fond sombre pointillé | différenciateurs, piliers |
| P05 | Split dégradé et deux cartes (liste cochée et chiffres) | une étape de méthode, un service |
| P06 | Chronologie en 4 étapes | méthode, planning, cycle mensuel |
| P07 | Chiffres clés et citation avec photo | preuve, repères |
| P08 | 3 cartes d'offres ou d'options, la recommandée cerclée d'accent | offres, packs |
| P09 | Tableau comparatif à trois options | décision, chiffrage |
| P10 | Grille de 6 avis clients avec photos | réassurance (très important) |
| P11 | Citation plein écran sur dégradé | respiration, témoignage fort |
| P12 | Cas client (contexte, problème, action, chiffres, visuels, bouton « Voir le site ») | réalisations |
| P13 | Équipe (Louis, Théophile, Clément) | qui sommes-nous |
| P14 | Texte et capture de site dans l'écran | audit, site actuel, avant / après |
| P15 | Grille de 24 logos clients | fin de book |
| P16 | Prochaine étape : CTA, QR code, contacts | toujours en dernier |

Pour une proposition commerciale nominative, structure recommandée : P01, contexte client (P03), enjeux (P04), recommandation (P05 ou P14), méthode (P06), options (P08 ou P09), ce qui est inclus, preuves (P07, P10, P12), planning, P16.

## Données réutilisables

- **Logos clients** : `assets/logos/{slug}.png|webp|avif` et `{slug}-blanc.*` pour les fonds sombres.
- **Photos** : `assets/team/` (louis, theophile, clement) et `assets/avis/` (wallerand, julie, hugo, justine, virginie, gautier, julia, poinsignon).
- **Avis clients complets et cas clients** : collections Webflow du site Orem (`6a7582303b9ddd4a77302cc8`) :
  - Témoignages : `6a759b2503d4ca7e4b687b21` ;
  - Réalisations : `6a759af703d4ca7e4b686bb9`, champ `lien-du-bouton-cta` pour « Voir le site » ;
  - Offres : `6a9138262200aeae4011d357`.
  Fiches offres internes : Google Drive, dossier `15PDRU0rzeXNJT4g4OtOThbAGu1YdvYJ-`.
- **Fichiers CMS Webflow** : remplacer `https://cdn.prod.website-files.com/` par `https://s3.amazonaws.com/webflow-prod-assets/` pour les télécharger, car le CDN est bloqué.
- **QR code** : `python3 -c "import segno;segno.make('URL',error='m').save('assets/qr.svg',scale=10,border=0,dark='#000012')"`. Vérifier le décodage avec `cv2.QRCodeDetector` sur la capture.
- **Rendus Figma de référence** : récupérer via le MCP Figma `get_screenshot`, car figma.com est bloqué en direct.

## Rendu, contrôle, export

```bash
cd .claude/skills/orem-da/scripts
NODE_PATH=$(npm root -g) FILE=/abs/doc/index.html OUT=/abs/captures node render.js            # toutes les slides
NODE_PATH=$(npm root -g) FILE=... OUT=... node render.js "3,7"                                   # slides ciblées
NODE_PATH=$(npm root -g) FILE=... OUT=... PDF=/abs/doc/Nom-Du-Document.pdf node render.js "" pdf # export
python3 sheet.py /abs/captures                                                                   # planches 2x2
```

Le script utilise Chromium (`/opt/pw-browsers/chromium`). **Ne jamais lancer `playwright install`.** Il signale les éléments qui débordent de la slide, les textes rognés et les tirets longs.

**Contrôle visuel obligatoire** : ouvrir chaque planche avec Read et vérifier :
- aucun texte coupé, superposé ou collé à un bord (marge de 64px) ;
- un seul message par slide, le titre lisible en 3 secondes ;
- des cartes d'une même rangée alignées et de hauteur égale, sans grand vide disgracieux (sinon ajouter un bloc « Le résultat » ou agrandir la typo d'un cran) ;
- bleu sur fond clair, orange sur fond sombre, nulle part ailleurs ; aucune couleur hors palette ; logo blanc sur fond sombre ;
- l'orange réservé aux accents, jamais en aplat de fond ;
- pas d'ombre portée floue (`box-shadow` à grand flou) : dans le PDF, Aperçu l'affiche comme un rectangle gris autour de l'élément. Préférer un filet `0 0 0 1px rgba(0,0,18,.08)` ;
- des liens cliquables (`<a href>`) sur les CTA et les « Voir le site », qui restent actifs dans le PDF ;
- un PDF de moins de 5 Mo, et autant de pages que de slides (`pdfinfo`).

**Livraison**
- Nommer le PDF `Client-Objet-Orem.pdf`.
- Commiter le dossier (HTML, assets, PDF) sur la branche de travail.
- Envoyer le PDF via SendUserFile.
- Lister à l'utilisateur les textes ajoutés au-delà de ce qu'il a fourni, pour validation.
