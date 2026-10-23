# Fondu du haut de l'accueil en CSS — 2026-10-23 (sous-domaine)

Effet d'origine (interaction Webflow IX2, preset "Slide In Bottom", déclenchement à l'apparition) :
opacité 0 → 1 et montée de 100 px, 1 s, courbe outQuart ; délais : H1 c7dee749 0 s, lien f6eb1637 0,25 s,
sous-titre e817c46e 0,3 s, logos 105590a1 0,35 s. Les éléments étaient cachés (opacity:0) jusqu'à
l'exécution de webflow.js → titre (LCP) invisible ~10 s en mesure mobile.

Remplacement : bloc <style> en tête du head de la page Accueil (keyframes `oremSlideInBottom`,
cubic-bezier(0.25, 1, 0.5, 1)). L'animation CSS prime sur les styles en ligne de l'IX2, qui reste en place
sans effet visible. Les deux autres éléments animés (65caab5d, 2511761c) restent en IX2 (plus bas, au défilement).

Retour arrière : remettre `avant-accueil-head.html` dans le head de la page Accueil.
Mesure (390 px, CPU ×4, réseau 1,6 Mbit/s) : H1 affiché à ~2,1 s au lieu de ~9,6 s ; état final identique.
Lighthouse mobile accueil : 39 → 55-57, LCP 15,8 s → 7-8 s (reste : polices).
