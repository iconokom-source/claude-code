# Journal du site Orem (Webflow)

Mémoire de travail du skill `site-orem`. À lire en début de session, à mettre à jour après chaque phase d'audit et chaque modification. Ne jamais y écrire de clé API.

## État

- Site : Orem — `6a7582303b9ddd4a77302cc8` — agence-orem.fr
- Version du MCP Webflow vue en dernier : 2.2.0 (2026-10-20)
- Audit complet : **phases A à C faites le 2026-10-20** (MCP, lecture seule) ; **phase D (mesure réelle) en attente** de l'ouverture réseau ; 7 scripts hébergés appliqués non lus (CDN bloqué)
- Dernier rapport : `site-orem/audits/audit-2026-10-20.md` · code de référence : `site-orem/audits/code-2026-10-20/`

## Modifications

| Date | Fiche | Ce qui a changé | Avant → après | Sauvegarde | Statut |
|---|---|---|---|---|---|
| — | P-01 | Réalisations/Membres : masquage + redirection JS (SEO) | — | — | à valider |
| — | P-02 | Préchargement de toutes les pages projets | — | — | à valider |
| — | P-03 | Couleur navbar calculée au scroll | — | — | à valider |
| — | P-04 | Footer reveal en JS | — | — | à valider |
| — | P-05 | Dégradés hero flou 150 px + images cachées | — | — | à valider |
| — | P-06 | Vidéos lourdes, preload auto, MutationObserver permanent | — | — | à valider |
| — | P-07 | Code global spécifique à une page | — | — | à valider |
| — | P-08 | CSS/JS copiés-collés sur pages légales et blog | — | — | à valider |
| — | P-09 | Doublon probable carrousel des offres | — | — | à valider |
| — | P-10 | Scripts enregistrés obsolètes | — | — | à valider |
| — | P-11 | Tiers (GTM, Axeptio, iClosed) | — | — | à valider |
| — | P-12 | Polices via Google Fonts | — | — | à valider |
| — | P-13 | Animations JS / IX2 → IX3 ou CSS | — | — | à valider |
| — | P-14 | Accessibilité et robustesse | — | — | à valider |

Statuts : à valider · validé · appliqué (sous-domaine) · en production · refusé · annulé.

## Évolutions (pages, sections, textes, CMS)

| Date | Quoi | Où | Statut |
|---|---|---|---|

## Veille Webflow

| Date | Nouveauté | Source | Utile pour |
|---|---|---|---|

## Notes

- 2026-10-20 : création du skill. Constat initial : ≈ 81 Ko de code global inline chargé sur toutes les pages (head ≈ 35 Ko dont 34 blocs `<style>`, footer ≈ 46 Ko dont 15 `<script>`), 4 scripts appliqués au site, 31 scripts enregistrés dont beaucoup de versions anciennes. Le réseau de la session cloud refusait alors `agence-orem.fr` (403 du proxy) : à autoriser pour mesurer.
