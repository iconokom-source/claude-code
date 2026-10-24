# P-08 — 2026-10-21 : code copié-collé retiré

Pages : Mentions légales (`6aa101708e5d116637e95981`), Politique de confidentialité (`6aa1051b9391937330e82204`), Blog (`6a8d70816ca55fc30856706e`).

Avant : head = CSS de la grille Réalisations (+ CSS ombre `[data-shadow-holder]` sur les 2 pages légales) ; footer = script d'ombre au survol des réalisations (pages légales). Blog : footer vide.
Vérification avant retrait : 0 élément `.collection-list-realisations`, `.collection-item-realisations`, `[data-shadow-holder]`, `.image.realisations`, 0 `[data-modal-trigger]` sur ces 3 pages (HTML publié et DOM rendu).

Fichiers : `avant-<page>-head.html`, `avant-<page>-footer.html`. Retour arrière : recoller chaque fichier dans le bloc correspondant de la page.
