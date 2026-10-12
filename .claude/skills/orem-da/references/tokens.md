# Orem : tokens visuels (couleurs, typo, formes, effets)

Toutes les valeurs ci-dessous sont implémentées dans `assets/orem.css` (variables `--orem-*`).
Valeurs relevées dans le Figma (variables + calques réels des slides et documents).

## Sommaire
1. Couleurs : monochrome, bleu, orange, états
2. Dégradés et fonds signature
3. Typographie et échelles (web, slide, document)
4. Espacements, grille, rayons, ombres
5. Effets : formes organiques, verre, grain, trame de points
6. Icônes

---

## 1. Couleurs

Principe : **une identité de musée**. Le monochrome est le socle (fonds, textes, structure) et
s'efface pour laisser la place aux projets. Le bleu est la couleur fondatrice, utilisée comme un
spectre (nuit → aube), pas comme une valeur fixe. L'orange est l'énergie : un accent ponctuel.

### Monochrome (socle, ~90 % de la surface)
| Token | Hex | Usage |
|---|---|---|
| `--orem-black` | `#000000` | Fond sombre principal (slides, sidebar) |
| `--orem-ink` | `#000012` | Texte et filets sur fond clair (noir légèrement bleuté) |
| `--orem-light` | `#F2F2F2` | Texte sur fond sombre (jamais du blanc pur pour le corps) |
| `--orem-grey` | `#777777` | Gris neutre du brand book |
| `--orem-white` | `#FFFFFF` | Fond clair, cartes |
| `--orem-paper` | `#F8F8F7` | Surface claire secondaire : cartes plates, lignes alternées de tableau |
| `--orem-graphite` | `#181818` / `#1E1E1E` | Panneaux sur fond noir |
| Texte secondaire clair | `#434242` à 60 % (≈ `#8E8D8D`) | Chapeaux, légendes, labels sur blanc |
| Texte secondaire sombre | `#F2F2F2` à 60 % | Idem sur noir |
| Filet clair | `#BCBAB9` à 25 % (≈ `#DEDDDC`) | Séparateurs de documents et tableaux |
| Filet sombre | `#F2F2F2` à 20 % | Bordures de cartes verre |

### Bleu Orem (couleur fondatrice)
Spectre « dégradé japonais » : bleu nuit `#051026` → **bleu Orem `#092482`** → bleu aube `#C5E6F1`.
Paliers utilisés dans les dégradés de slides (du haut vers le bas) :
`#020105 · #000B1D · #010F27 · #00122F · #00163B · #022257 · #022F79 · #0143B0 · #0166B0 · #0186B0 · #63C2E0 · #A0DAEC · #BDE7F4 · #D7F4FE · #FFFFFF`
- `#092482` : lueur des formes organiques, data-viz (traits, aires à faible opacité), étiquettes
  « étape 1 » sur fond clair, focus d'UI.
- `#D2EDF6` : fond bleu ciel uni (slide de cartes blanches).

### Orange Orem (accent)
Spectre : `#210E03` (minéral) → **`#FF6200`** → `#FCDFCE` (solaire).
- `#FF6200` **en petite surface uniquement** : surtitres (« Notre approche », « Cible »,
  « Programme partenaire »), numéros d'options (« Opt 1 », « Option 1 »), « Étape 01 »,
  mention « À noter », focus clavier. Jamais en aplat de fond de slide, jamais pour un paragraphe.
- `#FCDFCE` : fond de badge chaleureux.
- Le dégradé orange (noir → `#210E03` → `#FF6200` → `#FCDFCE`) existe dans le brand book ;
  le réserver à un visuel d'exception, pas aux supports courants.

### États (UI uniquement)
Succès `#34C759` (`#1F8A3B` sur fond blanc pour le contraste du texte) · Erreur `#FF383C`
(`#D92B2F` sur blanc) · Attente / à valider : orange `#FF6200`.

### Contrastes à respecter
`#000012` sur blanc et `#F2F2F2` sur noir : AAA. Le gris secondaire (60 %) n'est pas fait pour
du texte essentiel de petite taille. L'orange `#FF6200` sur blanc ≈ 3:1 : OK pour du texte
≥ 18 px ou un surtitre, pas pour du corps de texte.

## 2. Dégradés et fonds signature

| Fond | Description | Asset |
|---|---|---|
| Dégradé bleu vertical | Nuit en haut → aube en bas, transitions douces (voir paliers) | `--orem-gradient-blue`, `assets/backgrounds/degrade-bleu.png` |
| Couverture « hero » | Dégradé flou très diffus : noir en bas à gauche, bleu au centre, blanc lumineux en haut à droite, grain | `assets/backgrounds/couverture-hero.jpg` |
| Forme organique | Grande forme noire sur fond noir, bord éclairé en bleu `#092482`, grain | `assets/shapes/blob-*-bleu.svg`, `assets/backgrounds/blob-sombre*.jpg` |
| Halo graphite | Dégradé radial `#2A2A2A` → noir, pour les slides contact | `--orem-gradient-graphite`, `assets/backgrounds/contact-halo.jpg` |
| Trame de points | Fond uni + points de ~3 px tous les 26 px (12 % clair sur noir, 10 % encre sur blanc) | `.orem-dots`, `assets/backgrounds/trame-points-*.png` |
| Bleu ciel | Aplat `#D2EDF6` | `.orem-bg-sky` |

En CSS : `background: var(--orem-gradient-blue);`. Le texte posé sur la moitié haute du
dégradé est `#F2F2F2` ; sur la moitié basse (claire), passer en `#000012` ou poser une carte
blanche.

## 3. Typographie

Deux familles, toutes deux Google Fonts (fichiers dans `assets/fonts/`, licence OFL) :

- **Trykker** (sérif éditoriale, une seule graisse Regular 400) : titres, chiffres clés,
  citations, prises de parole fortes, labels et valeurs des slides « texte ».
- **Lexend Deca** (sans géométrique) : corps de texte, UI, surtitres, légendes, boutons.
  Graisses : **Light 300** (textes discrets, corps des documents), Regular 400 (corps des
  slides, UI), **Medium 500** (structure, emphase), **SemiBold 600** (information importante,
  rare). Pas de Bold ni d'ExtraLight.

Réglages communs : interligne **120 %** (110 % pour les très grands titres et les boutons),
interlettrage **−3 %** au-dessus de ~50 px, **−2 %** pour le corps et les petits titres, −1 %
pour les documents. Pas d'italique (Trykker n'en a pas) : l'emphase passe par la graisse ou la
couleur. Pas de capitales en titre ; casse de phrase partout.

### Échelle slide (cadre 1920×1080)
| Rôle | Police | Taille | Notes |
|---|---|---|---|
| Title | Trykker | 164 px | Très rare (un mot, un chiffre) |
| Titre de couverture / chapitre | Trykker | 94 px | lh 110–120 %, −3 % |
| Quote / grand titre d'intro | Trykker | 72–82 px | −3 % |
| Titre de slide | Trykker | 64 px | −3 % |
| Headline | Trykker | 37 px | lh 130 %, 0 % : titres de cartes, labels/valeurs des slides texte |
| Body | Lexend Deca Regular/Light | 24 px | −2 % |
| Subbody | Lexend Deca | 20 px | Notes, légendes de cartes |
| Caption | Lexend Deca | 17 px | lh 110 % : « Étape 01 », « Opt 1 » |
| Surtitre | Lexend Deca Light | 24 px (ou 20 px) | Orange `#FF6200`, au-dessus du titre |

En PowerPoint (13,33 × 7,5 in) : taille en pt = taille en px ÷ 2 (94 px → 47 pt, 24 px → 12 pt).

### Échelle web / application
| Rôle | Police | Taille | Interlettrage |
|---|---|---|---|
| H1 | Trykker | 54 px | −3 % |
| H2 | Trykker | 43 px | −3 % |
| H3 | Trykker | 34 px | −2 % |
| H4 | Trykker | 27 px | −2 % |
| H5 | Lexend Deca Medium | 22 px | −2 % |
| H6 | Lexend Deca Medium | 18 px | −1 % |
| Paragraphe | Lexend Deca Light/Regular | 14 px (15–16 px conseillés en app) | 0 % |
| Bouton | Lexend Deca Regular | 11–15 px | lh 110 % |
| Légende | Lexend Deca | 11–13 px | 0 % |

### Échelle document A4 (595 × 842 pt)
| Rôle | Police | Taille |
|---|---|---|
| Titre du document (en-tête page 1, aligné à droite) | Trykker | 17 pt |
| Type de document (« Rapport mois 1 ») | Lexend Deca Light | 9 pt |
| Titre de section + filet dessous | Trykker | 17 pt, −2 % |
| Sous-section | Trykker | 13 pt |
| Corps | Lexend Deca Light | 12 pt, lh 120 %, −1 % |
| Mentions (« © 2026 Orem. Tous droits réservés. »), pagination | Lexend Deca Light | 9 pt |
| Chiffre clé | Trykker | 26 pt |

## 4. Espacements, grille, rayons, ombres

- **Marges de slide : 64 px** sur les quatre côtés (24 px pour un panneau collé au bord).
  Gouttières : 64 px entre colonnes/cartes, 24–32 px dans une grille dense.
- Grille de slide : colonne label 560–620 px + colonne valeur à x = 684 px ; ou découpage
  653 px (panneau) / 1267 px (contenu) ; ou deux moitiés 924 px + 948 px.
- Document : marges 32 pt, en-tête à 32 pt du haut, contenu à partir de 84 pt.
- Échelle d'espacement : 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- **Rayons** : 24 px (cartes, images, panneaux : la valeur signature), 999 px (boutons
  pilule), 8 px (champs), 4 px (petits éléments). Les cartes « papier » des études de cas et
  les colonnes de cartes plates sont à angle droit.
- **Ombre de carte** : `0 16px 90px 5px rgba(0,0,18,.15), 0 0 4px rgba(0,0,18,.30)`.
  Variante plus courte : `0 8px 30px rgba(0,0,18,.30), 0 0 4px rgba(0,0,18,.20)`.

## 5. Effets

- **Forme organique (« bulle »)** : forme fluide noire, ombres intérieures bleues `#092482`
  (forte, décalée) + reflet `#CBD3F0` à 10–35 %, bruit `#D3DCFE` à 15 %. Elle déborde
  généralement du cadre. Utiliser les SVG prêts `assets/shapes/blob-{a,b,c}-bleu.svg` (filtres
  intégrés) ou les silhouettes nues `blob-{a,b,c}.svg` pour un masque.
- **Verre** : fond blanc 2–5 %, `backdrop-filter: blur(30px)`, bordure 1 px `#F2F2F2` à 20 %,
  rayon 24. Sur fond sombre ou dégradé uniquement.
- **Grain** : bruit léger en `mix-blend-mode: overlay` sur les dégradés et les formes (`.orem-grain`).
- **Flou** : les dégradés de couverture sont très flous (flou de calque 34 px, flou d'arrière-plan
  200–350 px dans Figma) : aucune arête nette dans le fond.

## 6. Icônes

Set dessiné main, silhouettes essentielles, trait constant **1,5 px**, terminaisons et angles
**arrondis** (comme la typo). Deux styles : contour et plein. Tailles : **16 px** (informatif,
non interactif), **20 px** (interactif mobile), **24 px** (interactif desktop). À défaut du set
maison, utiliser Lucide ou Phosphor en trait 1,5 et bouts ronds. Coches et croix : ✓ / ✕ fins ;
dans les listes, puce ronde pleine avec coche blanche.
