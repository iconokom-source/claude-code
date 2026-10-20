# P-01 — pages Réalisations référençables (maquette, sous-domaine uniquement)

Le bloc de code global du footer n'a **pas** été modifié (approche abandonnée : réécriture de 46 Ko trop risquée). `avant-site-footer.html` = copie de référence.

## Ce qui a changé (page modèle « Réalisations Template », `6a759af703d4ca7e4b686bbf`)
- **Code head** : avant = `avant-head-modele-realisations.html` (html masqué + redirection `/?p=`). Après = 2 règles CSS + un `history.replaceState` au `load` (le script global de la modale prend le relais).
- **Structure ajoutée** (Designer) :
  - `page-wrapper` (`884604ea-…`) > `main-wrapper` (`7d79e84e-…`) > [liste cachée `liste-projets-modale` (`71a3dcc0-…`, liée à Réalisations, tri « Ordre page Réalisations »), composant `new-menu-container`, composant `case-section`] + composant `footer`.
  - Panneau `[data-project-modal].is-open` (`c3643479-…`) > overlay + dialog > `[data-project-modal-content]` (vide) + `.projet-statique` (`c2deba6f-…`) > bloc d'origine `.contenu-cas-client[data-project-root]` (`4b4be793-…`, déplacé, inchangé).
- **Classes créées** : `is-open` (vide), `projet-statique`, `liste-projets-modale` (display none).

## Restaurer l'état d'avant
1. Déplacer `4b4be793-…` (`data-project-root`) directement dans le Body.
2. Supprimer `884604ea-…` (page-wrapper) et `c3643479-…` (panneau).
3. Remettre le head d'origine (`avant-head-modele-realisations.html`), puis publier.
