# Orem : applications internes, outils, dashboards, pages web

Le système web d'Orem s'appuie sur la même logique que les slides : un cadre monochrome
silencieux, Trykker pour les titres, Lexend Deca pour tout le fonctionnel, le bleu pour la
profondeur et les données, l'orange en accent minuscule.

Point de départ : `assets/templates/app.html` (barre latérale noire, tableau de bord, KPI,
tableau, formulaire, badges, thème clair/sombre) + `assets/orem.css` (tokens + composants).

## Architecture visuelle
- **Barre latérale noire** (`#000000`) avec symbole + monogramme clairs, navigation Lexend
  Light à 60 % ; élément actif en `#F2F2F2` sur `#1E1E1E`, rayon 8.
- **Contenu** sur blanc (thème clair, par défaut) ou noir (thème sombre via `data-theme="dark"`).
  Les deux thèmes partagent les mêmes tokens sémantiques (`--bg`, `--text`, `--rule`…).
- En-tête de page : surtitre orange (date, section) + titre Trykker H1/H2, action principale à droite.
- Panneaux : fond `--bg-subtle` (`#F8F8F7` / `#181818`), rayon 24, pas de bordure ni d'ombre.
- Densité : padding de page 40–48 px desktop, 16–24 px mobile ; gouttière 24 px.

## Composants (classes de `orem.css`)
| Composant | Règle |
|---|---|
| Bouton principal `.orem-button` | Pilule (rayon 999), encre `#000012` sur clair / blanc sur sombre, Lexend Regular, survol bleu Orem. Libellé verbe + bénéfice (« Créer le projet »), flèche ↗ pour une sortie ou une étape suivante |
| Bouton secondaire `.orem-button--ghost` | Transparent, filet `--rule` |
| Champ `.orem-input` | Rayon 8, filet `--rule`, focus bleu `#092482` + halo 15 % ; label 13 px gris au-dessus, jamais de placeholder seul |
| Carte `.orem-card` | Blanche, rayon 24, ombre douce ; `--flat` pour la version papier, `--glass` sur fond sombre/dégradé |
| KPI | Filet vertical 1 px à gauche, valeur Trykker 43 px, libellé 13 px gris |
| Tableau `.orem-table` | En-têtes Light gris, filet sous l'en-tête, lignes alternées papier, pas de quadrillage, alignement à gauche (chiffres alignés à droite si colonnes de montants) |
| Badge `.orem-badge` | Pilule 12 px ; `--brand` (bleu aube / bleu Orem), `--accent` (orange clair / orange profond) |
| Statut | Pastille 7 px + libellé coloré : vert / orange (en attente) / rouge |
| Surtitre `.orem-eyebrow` | Orange, 14 px, au-dessus d'un titre |

États : focus clavier visible (contour orange 2 px ou halo bleu), survol discret (fond
`--bg-subtle`), désactivé à 40 % d'opacité. Transitions 150 ms `ease`, pas d'animation gratuite :
le mouvement sert la compréhension.

## Data-viz
- Série unique : bleu Orem `#092482` (trait) + aire à 25 %.
- Séries multiples : paliers du spectre bleu `#022257 · #0166B0 · #63C2E0 · #BDE7F4` ; l'orange
  `#FF6200` pour la série ou la valeur à mettre en avant.
- Axes et grilles en `--rule`, labels Lexend 12 px gris, valeurs clés en Trykker.
- Barres arrondies (pilules) comme dans le Figma ; pas de 3D, pas de camemberts multicolores.
- En thème sombre, remplacer `#092482` (trop sombre sur noir) par `#0166B0` / `#63C2E0`.

## Microcopy (voir `marque.md`)
- Boutons : verbe à l'infinitif, précis (« Envoyer le devis », pas « Valider »).
- Erreurs : dire ce qui se passe et comment corriger (« Votre email semble incomplet. »), jamais
  « Erreur 404 : Not Found ». États vides : une phrase utile + l'action pour commencer.
- Vouvoiement, phrases courtes, pas de points d'exclamation.

## Tailwind (si le projet l'utilise)
```js
// tailwind.config.js — extrait
theme: { extend: {
  colors: {
    ink: '#000012', light: '#F2F2F2', paper: '#F8F8F7', graphite: '#181818',
    orem: { blue: '#092482', night: '#051026', dawn: '#C5E6F1', sky: '#D2EDF6',
            orange: '#FF6200', 'orange-light': '#FCDFCE', 'orange-deep': '#210E03' },
  },
  fontFamily: { serif: ['Trykker', 'Georgia', 'serif'], sans: ['"Lexend Deca"', 'Arial', 'sans-serif'] },
  borderRadius: { card: '24px' },
  letterSpacing: { tight: '-0.03em', snug: '-0.02em' },
  boxShadow: { card: '0 16px 90px 5px rgba(0,0,18,.15), 0 0 4px rgba(0,0,18,.30)' },
  backgroundImage: { 'orem-gradient': 'linear-gradient(180deg,#020105 0%,#00122F 21%,#022257 34%,#0143B0 49%,#0186B0 62%,#63C2E0 72%,#A0DAEC 80%,#D7F4FE 94%,#EAF8FD 100%)' },
}}
```

## React / composants
Garder les tokens en variables CSS (copier le bloc `:root` de `orem.css`) et ne pas coder de
couleurs en dur dans les composants. Charger les polices une fois (Google Fonts ou `@font-face`
locaux). Favicon : `assets/logo/png/orem-symbole-noir.png` (ou blanc sur fond sombre).

## Accessibilité
Contraste AA minimum : texte secondaire à 60 % seulement pour du contenu non essentiel ; orange
jamais pour un texte de moins de 18 px porteur d'information ; cibles cliquables ≥ 40 px ;
navigation clavier complète ; `prefers-reduced-motion` respecté.
