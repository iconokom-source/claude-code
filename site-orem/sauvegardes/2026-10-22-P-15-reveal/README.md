# P-15 reveal / P-04 — 2026-10-22 : footer « reveal » en natif (variante B)

## Avant
- Designer, classe `footer` : `position: fixed` (base, medium, tiny), `top/bottom: auto`, `min-height: 100vh`, `z-index: 0`.
- Head du site : bloc `<style>.footer{position:fixed;top:0;left:0;width:100%;min-height:100vh;z-index:1;will-change:transform}.main-wrapper{position:relative;z-index:2;background:#f2f2f0}</style>` (`avant-site-head.html`).
- Footer du site : script espaceur `#footer-reveal-spacer` + `transform` au scroll (`avant-site-footer.html`).

## Après
- Designer, classe `footer` : `position: sticky` (base, medium, tiny) ; `bottom: min(0px, calc(100vh - 968px))` (base), `min(0px, calc(100vh - 1034px))` (small), `min(0px, calc(100vh - 1660px))` (tiny).
- Bloc CSS retiré du head (−251 caractères), script retiré du footer (−1 322 caractères). `.main-wrapper` garde ses réglages Designer (relative, z-index 2, fond #f2f2f0, identiques).

## Retour arrière
1. Designer `footer` : remettre `position: fixed` (base, medium, tiny), retirer `bottom` (base, small, tiny).
2. Réécrire `avant-site-head.html` et `avant-site-footer.html` dans le code du site. Publier.
