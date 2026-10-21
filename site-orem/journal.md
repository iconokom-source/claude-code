# Journal du site Orem (Webflow)

Mémoire de travail du skill `site-orem`. À lire en début de session, à mettre à jour après chaque phase d'audit et chaque modification. Ne jamais y écrire de clé API.

## État

- Site : Orem — `6a7582303b9ddd4a77302cc8` — agence-orem.fr
- Version du MCP Webflow vue en dernier : 2.2.0 (2026-10-20)
- Audit complet : **phases A à C faites le 2026-10-20** (MCP, lecture seule) ; **phase D (mesure) faite le 2026-10-20** : 42–51/100 mobile, LCP 10–20 s ; à refaire après autorisation de `d3e54v103j8qbb.cloudfront.net` (jQuery), `client.axept.io`, `www.clarity.ms`, `www.google-analytics.com`, `www.google.com`
- Dernier rapport : `site-orem/audits/audit-2026-10-20.md` · code de référence : `site-orem/audits/code-2026-10-20/`

## Modifications

| Date | Fiche | Ce qui a changé | Avant → après | Sauvegarde | Statut |
|---|---|---|---|---|---|
| 2026-10-20 | P-15 étape 1 | Retrait du préchargement `fetchpriority=high` du logo animé du footer (head Accueil + Lille) | Accueil LCP 10,5 → 16,2 s ; Lille 10,7 → 15,6 s (pire) | `sauvegardes/2026-10-20-P-15-1/` | **annulé** : tests 32/32 OK mais mesure dégradée ; sous-domaine restauré à l'identique, production jamais touchée |
| 2026-10-20 | P-15 logo | Logo animé du footer remplacé (asset `6ad79fd27ff729f4861857c7`, 560 px, 398 Ko au lieu de 1 279 Ko, même animation) + retrait du préchargement sur Accueil et Lille | poids −0,8 à −1,6 Mo/page ; LCP Accueil 11,7→9,6 s, Lille 11,9→10,4 s, Mentions 10,7→6,1 s, Réalisations 20,6→17,1 s | `sauvegardes/2026-10-20-P-15-logo/` + `sauvegardes/2026-10-20-P-15-1/avant-head-*.html` | **en production** le 2026-10-20 ; tests 32/32 sur agence-orem.fr après publication |
| — | P-15 vidéo | Vidéo `footer_gradiant` réencodée plus légère (option 3a, même rendu) | — | — | à faire |
| — | P-15 reveal | Footer reveal réglé en natif (sticky dans le Designer), suppression du CSS et du JS correspondants | — | — | à faire |
| — | P-16 | Observateurs DOM permanents (DragScrollCasesV4…) | — | — | à valider |
| — | P-17 | Vidéos JS en preload auto (OffreHeroVideo, visuels) | — | — | à valider |
| 2026-10-20 | P-01 maquette | Pages Réalisations référençables : plus de masquage/redirection ; panneau « modale » natif par-dessus menu + case-section + footer ; le script global de la modale prend le relais au `load` | SEO : 15/15 pages lisibles (1 h1, canonique, pas de redirection) ; erreur JS en arrivée directe 3/6 en prod → 0/6 ; flèches en arrivée directe 9/15 (comme avant) | `sauvegardes/2026-10-20-P-01/` | **v1 en production depuis le 2026-10-21 07:41** (publication faite depuis le Designer, pas par Claude) ; v2 sur le sous-domaine (voir ligne suivante) |
| 2026-10-21 | P-01 v2 fermeture | Demande : « le fond, c'est toujours la page où l'on est ; quand on quitte, on reste sur la même page ». Le faux fond de la page projet n'est plus jamais laissé affiché : fermer (croix, fond, Échap) ramène sur la vraie page d'origine (rechargement / retour) ou sur le vrai accueil (arrivée par Google ou lien partagé) ; « précédent » ne ramène plus sur le projet | tests injection + sous-domaine 1440/390 : 13/13 ×2 ; modale-seo 14/14 ×2 ; fonctionnel 32/32 ; 0 erreur JS | `sauvegardes/2026-10-20-P-01/maquette-v1-head-modele-realisations.html` (retour arrière = remettre ce fichier dans le head du modèle) | **en production** le 2026-10-21 (accord « Publie ») ; diff sous-domaine/prod vérifié avant (seule la page projet différait) ; après publication sur agence-orem.fr : fermeture 14/14 ×2, modale-seo 14/14 ×2, fonctionnel 32/32 |
| 2026-10-21 | P-01 membres | Pages `/membres/…` référençables, même principe que les Réalisations : plus de masquage ni de redirection vers `/a-propos?p=` ; modèle Membres = menu + footer + panneau natif (`is-open`, `data-project-modal`…) contenant la fiche ; liste CMS cachée des 3 membres (tri « ordre », comme À propos) avec repères `data-modal-trigger` + `data-slug` lié au slug (href est réservé côté MCP) pour les flèches ; fermeture → vraie page d'origine ou `/a-propos` (choix de l'utilisateur) ; retrait de la copie statique une fois la modale remplie (un seul h1) | prod actuelle : erreur webflow.js 4/8 en arrivée directe, 1/8 au rechargement → 0/8 et 0/16 ; flèches en arrivée directe : ordre Louis → Théophile → Clément comme sur À propos | `sauvegardes/2026-10-21-P-01-membres/` | **sous-domaine uniquement**, en attente du « publie » |
| 2026-10-21 | P-01 v3 réalisations | Même correctif sur le modèle Réalisations : pas d'ouverture avant `load` au rechargement (erreur webflow.js 3/8 → 0/8) et retrait de la copie statique (1 seul h1 après chargement) | voir ligne précédente | `sauvegardes/2026-10-20-P-01/maquette-v2-head-modele-realisations.html` | **sous-domaine uniquement**, en attente du « publie » |
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

- 2026-10-20 : consigne de Théophile — **réduire le code, pas en ajouter ; natif Webflow au maximum.** Un script de chargement différé du footer (1,7 Ko) avait été préparé et testé en injection locale, il a été abandonné avant tout envoi à Webflow.

- 2026-10-20 : leçon P-15 étape 1 — tant que le logo animé du footer est chargé au départ et reste l'élément LCP, retirer son préchargement retarde le LCP. Ne traiter le logo qu'avec la suppression de son chargement initial (étapes 1 + 2 ensemble).

- 2026-10-20 : tests de fonctionnement réutilisables dans `site-orem/tests/fonctionnel.mjs` (8 pages × 4 largeurs, modale, footer, erreurs JS). Les erreurs « Dropped events » viennent d'Axeptio quand `api.axept.io` est bloqué par le réseau de la session : ignorées.
- 2026-10-20 : demande de Théophile pour P-01 : garder visuellement la modale, mais pages réalisations/membres référençables. **Décision : option 1** — la page modèle affiche elle-même le panneau « modale » par-dessus la vraie grille des réalisations (composant `case-section` / liste CMS native) ; plus de masquage ni de redirection ; à la fermeture, URL → `/realisations`. Même principe pour les membres (section équipe d'À propos). Maquette sur une seule réalisation sur orem.webflow.io avant généralisation.

- 2026-10-20 : création du skill. Constat initial : ≈ 81 Ko de code global inline chargé sur toutes les pages (head ≈ 35 Ko dont 34 blocs `<style>`, footer ≈ 46 Ko dont 15 `<script>`), 4 scripts appliqués au site, 31 scripts enregistrés dont beaucoup de versions anciennes. Le réseau de la session cloud refusait alors `agence-orem.fr` (403 du proxy) : à autoriser pour mesurer.
