# Footer reveal sans décalage (CLS) ni footer « contenu principal » (LCP), 2026-10-23

## Avant (composant `footer` d1220ddf-2c09-baed-309f-e1f2237fd802, 13 instances)
Structure : `.footer` (racine) > [ `.page-padding._32px-padding-bas.z-index-3` (d1220ddf-…803), Background Video `.fond-footer` (18252d3d-f46c-02e5-6747-ff8d071e4b90) ].

Classe `.footer` (id 289a3df2-e8ca-ab1f-934a-9db6d97dc01b) :
- base/main : position sticky ; top auto ; z-index 0 ; display flex ; width 100% ; height auto ; min-height 100vh ; flex-direction column ; justify-content flex-start ; flex-wrap nowrap ; align-items center ; background-color hsla(0,0%,0%,1) ; background-image none ; background-size auto ; bottom min(0px, calc(100vh - 968px))
- medium : position sticky
- small : bottom min(0px, calc(100vh - 1034px))
- tiny : position sticky ; bottom min(0px, calc(100vh - 1660px))

## Après
- `.footer` (racine) devient le conteneur : position relative ; z-index 0 ; margin-top -100vh ; display block ; width 100% ; plus de sticky/bottom/min-height/fond.
- Nouvelle classe `footer-espace` (bloc vide, height 100vh) en premier enfant.
- Nouvelle classe `footer-sticky` = toutes les propriétés de l'ancien `.footer` (y compris les 3 valeurs de bottom), qui contient les deux anciens enfants.
- Principe : le footer ne peut « coller » qu'à l'intérieur de son conteneur, qui commence un écran avant la fin de page → il n'est plus à l'écran au chargement (plus de LCP sur le footer, plus de CLS), même effet de révélation (positions identiques mesurées à 390/600/800/1440 px sur Accueil, À propos, Contact).

## Retour arrière
1. Remettre sur `.footer` les propriétés « Avant » (base, medium, small, tiny).
2. Déplacer les deux enfants de `footer-sticky` directement sous `.footer` (ordre : page-padding puis fond-footer), supprimer `footer-sticky` et `footer-espace`.
