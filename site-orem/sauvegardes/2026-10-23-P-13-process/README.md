# P-13 essai IX3 (Offres : ligne de progression + apparition des étapes mobile), 2026-10-23

## Fait
- Interactions IX3 créées (portée : modèle Offres `6a9138272200aeae4011d3c7`) :
  - `i-d6f5aa5c` « Process - ligne de progression » : défilement scrub sur `.process-grid-wrap` (élément `9fe72d8c-…`), hauteur de `.process-line` 0 → 100 %, début « top center », fin « bottom center ».
  - `i-db768440` « Process - apparition des étapes (mobile) » : défilement sur chaque `.process-card`, « top 85% », opacité 0 → 1 et yPercent 15 → 0 en 0,6 s ; sur ordinateur et tablette : saut à l'état final.
- Code retiré :
  - footer du modèle Offres (script de la ligne, `avant-offre-footer.html`) ;
  - footer global : bloc « Etapes du process : reveal alterne » (−768 o, `avant-site-footer.html` → `apres-site-footer.html`).
- Règles CSS `[data-reveal-dir]` du head global laissées (devenues inertes) : à retirer lors d'une prochaine écriture du head.
- Publié sur orem.webflow.io seulement.

## Retour arrière
1. `data_interactions_tool > delete_interaction` sur `i-d6f5aa5c` et `i-db768440`.
2. Réécrire `avant-offre-footer.html` (footer du modèle Offres) et `avant-site-footer.html` (footer global).
3. Republier.
