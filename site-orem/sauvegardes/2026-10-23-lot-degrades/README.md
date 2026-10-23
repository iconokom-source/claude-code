# Lot dégradés / iClosed / showreel — 2026-10-23 (sous-domaine uniquement)

## Fait
- Code global head : 35 487 → 20 669 caractères. Retirés : CSS des dégradés, masquage des images sources, CSS + JS du showreel (déplacés sur Accueil et Lille), widget iClosed (bouton flottant du bas), règles `[data-reveal-dir]` déplacées sur Offres.
- Code global footer : 44 400 → 33 522 caractères. Retirés : les 3 scripts qui fabriquaient les bandes floutées.
- Head Accueil et head Lille (`agence-web-lille`) : script vidéos d'origine + showreel mobile.
- Dégradés natifs : `degrade-hero` (+ combos `accueil`, `realisations`, `a-propos`) = dégradé net ; enfant `degrade-flou` (+ `flou-accueil`, `flou-realisations`, `flou-a-propos`) = reproduction exacte du calque flou (150 px), sans `filter: blur` :
  le flou gaussien d'un bloc de bandes horizontales se sépare en un dégradé vertical (couleur et opacité calculées) multiplié par un fondu horizontal sur les bords (`mask-image`, deux couches en `mask-composite: intersect`). Calcul : `gen.py`, valeurs : `valeurs.json`.
- Éléments : `degrade-flou` ajouté dans les divs dégradé — Accueil 2622da80-…, Lille 1004c114-…, Réalisations a18d83b9-…, À propos d21c7031-….
- Combo `.degrade-hero.a-propos` : le voile blanc 1 % est passé dans `flou-a-propos` (au-dessus, comme en prod).

## Avant (pour retour arrière)
- `avant-*.html` : code head/footer global et heads Accueil/Lille.
- `.degrade-hero.a-propos` background-image avant : `linear-gradient(rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.01)), linear-gradient(to bottom, <47 couleurs COLORS_APROPOS>)`.

## Vérification (tests/degrades-comparaison.mjs, prod vs orem.webflow.io, contenu masqué)
- Accueil, Lille, Réalisations, À propos à 1440 / 768 / 390 px : écart max 3 à 5 niveaux sur 255 (invisible) ; seules différences = bandeau cookies Axeptio (affiché aléatoirement).
- Erreur de la 1re version (sans calque flou) corrigée : elle reproduisait le dégradé net seul (écarts jusqu'à 90/255 sur l'accueil).
- Showreel mobile Accueil + Lille : défile (mot 1 → mot 2 en 4 s). iClosed absent. Apparition Offres : 6 cartes, OK. 0 erreur JS.
