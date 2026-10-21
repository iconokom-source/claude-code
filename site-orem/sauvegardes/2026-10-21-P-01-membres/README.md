# P-01 membres — 2026-10-21

Modèle « Membres Template » (`6a759ac144dc0178f0b2fc7b`).

- `avant-head-modele-membres.html` : head d'origine (masquage + redirection vers `/a-propos?p=`).
- `avant-structure.md` : structure d'origine (Body > racine `[data-project-root]`).
- `apres-head-modele-membres.html` : head appliqué.

Éléments ajoutés : page-wrapper `a5a80fa7-…` > main-wrapper `2956c955-…` > [liste CMS cachée `e52f2ca8-…` (.liste-projets-modale, Membres, tri « ordre ») avec repère `a0cc05a3-…` (`data-modal-trigger`, `data-slug` = slug), menu `e50400db-…`] + footer `7d1f2596-…` ; panneau `2caf35fc-…` (.is-open, data-project-modal) > overlay + dialog > contenu `5b86e115-…` + `.projet-statique` `47b07bf4-…` > racine d'origine.

Retour arrière : remettre le head d'origine ; déplacer la racine `3582318c-…-ee29` en enfant direct de Body ; supprimer page-wrapper et panneau ; publier.
