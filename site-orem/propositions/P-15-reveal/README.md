# P-15 reveal / P-04 — Footer « reveal » sans JavaScript (proposition, en attente d'accord)

**Aujourd'hui** : CSS dans le head du site (`.footer{position:fixed;top:0;min-height:100vh;will-change:transform}` + `.main-wrapper{position:relative;z-index:2;background:#f2f2f0}`) et un script dans le footer du site (espaceur `#footer-reveal-spacer` + `transform` du footer recalculé à chaque événement de scroll, sur toutes les pages).

**Contrainte mesurée** : le footer est plus haut que l'écran partout (contenu : 968 px de 768 px de large et plus, ~1 017–1 034 px entre 480 et 767 px, 1 660 px à 479 px et moins). Un simple `position: sticky; bottom: 0` cacherait le haut du footer.

**Variante B (proposée)** : réglages natifs Webflow sur la classe `footer` (Designer) :
- ≥ 768 px : `position: sticky`, `bottom: min(0px, calc(100vh - 968px))`, `min-height: 100vh`, `z-index: 1` ;
- 480–767 px : `bottom: min(0px, calc(100vh - 1034px))` ;
- ≤ 479 px : `bottom: min(0px, calc(100vh - 1660px))`.
Puis retrait du bloc CSS du head et du script du footer (≈1,6 Ko de code, plus aucun calcul au scroll).
Captures (`footer-compare_*.png`) : rendu **identique** à l'actuel au début du dévoilement, au milieu et en bas de page (accueil et contact, 1440 et 390 px) ; position finale du footer identique au pixel près (−68 px / −815 px).
**Limite** : si le contenu du footer change de hauteur, ces 3 valeurs sont à ajuster (sinon le haut du footer est légèrement masqué ou un vide apparaît). Entre 480 et 767 px la hauteur varie (968 → 1 034 px) : écart possible jusqu'à ~60 px sur ces largeurs.

**Variante A** : footer en flux normal, sans effet de dévoilement. Le plus simple (aucun réglage à maintenir), mais l'effet disparaît : le footer arrive en défilant comme le reste de la page.

Test : `tests/footer-reveal-captures.mjs` (injection, sans toucher Webflow).
