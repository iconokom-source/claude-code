# P-13 — Animations en custom code : état des lieux et remplacement natif (IX3)

2026-10-23, lecture seule : rien n'a été modifié dans Webflow.

Code relu le 23/10 : `audits/code-2026-10-23/`. Il comprend le code global head et footer, le code des pages (Accueil, Lille, Réalisations, À propos, Contact, Article, Offre, Réalisation, Membre) et les scripts hébergés.

## Ce que permet le natif aujourd'hui (vérifié dans le guide MCP 2.2.0, `data_interactions_tool`)

- **Interactions IX3**, créables par le MCP sans passer par le Designer.
  - Déclencheurs : clic, survol, chargement, **défilement** (avec suivi du scroll, `scrub`, début et fin réglables), mouvement de souris, événement personnalisé.
  - Propriétés animables : position, opacité, échelle, rotation, **largeur et hauteur**, couleurs, z-index, ajout ou retrait de classe, découpage du texte (lettres, mots, lignes), décalage en cascade.
  - **Lecture conditionnelle par point de rupture** (par exemple « seulement sur mobile ») et respect du réglage système « réduire les animations ».
- **États et transitions du Designer** (survol, focus, transition CSS) : du natif pur, sans interaction.
- **Pas confirmé** : la répétition infinie d'une timeline IX3 (boucle), et un défilement automatique natif pour les onglets. À tester sur une page brouillon avant toute promesse.
- **Coût à mesurer** : dès qu'une interaction IX3 existe, Webflow charge son moteur d'animation, basé sur GSAP. Son poids doit rester inférieur au code qu'on retire. Il sera mesuré au premier essai.

Aucune interaction IX3 n'existe sur le site aujourd'hui (liste vide). Les animations natives existantes sont en IX2, l'ancien moteur.

## Inventaire du code d'animation

« Partout » = code global, chargé sur toutes les pages.

| # | Animation | Où le code est chargé | Taille | Coût à l'exécution | Remplacement natif | Faisabilité |
|---|---|---|---|---|---|---|
| A1 | **Couleur de la navbar** (blanc/noir selon la section dessous) | partout (footer 6 + head 18, 21) | 5,9 Ko JS + 1,4 Ko CSS | **calculs à chaque image de scroll** et relance toutes les 150 ms pendant 6 s (P-03) | IX3 « défilement » sur chaque section sombre : ajoute ou retire la classe `nav-on-dark` de la navbar | **oui** (repérer les sections sombres une fois) |
| A2 | **Dégradés du haut de page** (bandes floutées à 150 px reconstruites en JS) | partout (footer 10–12 + head 28), utile sur 3 pages | 10,8 Ko JS + 0,5 Ko CSS | rendu très coûteux (flou de 150 px sur 2 310 px de haut) ; image cachée de 1 Mo sur l'accueil | dégradé de fond natif dans le panneau Style (pas d'animation) | **oui** (P-05, rendu à comparer) |
| A3 | **Showreel mobile** (mots qui défilent + images) | **head de toutes les pages**, utile seulement sur l'accueil en mobile | 2,6 Ko CSS + **10,8 Ko JS** | minuteur permanent | IX3 au chargement en cascade, si la boucle infinie est possible ; sinon déplacer le code sur l'accueil seulement | à tester |
| A4 | **Slider des avis** (défilement auto, carte active) | partout (footer 0–1) | 1,5 Ko CSS + 7 Ko JS | minuteur + calculs de position | élément Slider natif (lecture auto, flèches) ; le rendu « carte centrale agrandie » est à recréer | partiel (rendu à valider) |
| A5 | **Carrousel « Ce que nous faisons »** (8 s, barre de progression) | Accueil et Lille : **deux moteurs pour la même chose** (code de page 4 Ko + `ChoixCarouselEngineV9` 3,8 Ko, P-09) | 7,8 Ko | 2 minuteurs | d'abord garder **un seul** moteur (−4 Ko par page) ; natif complet seulement si l'IX3 sait boucler | oui pour le doublon, à tester pour le natif |
| A6 | Onglets showreel (8 s) | Accueil et Lille (`ShowreelTabs`) | 1,2 Ko | minuteur | comme A5 | à tester |
| A7 | **Ligne de progression du process** (suit le scroll) | Offres (code de page) | 1 Ko | calcul à chaque scroll | IX3 « défilement » avec `scrub` : hauteur 0 → 100 % | **oui** |
| A8 | **Apparition des étapes du process** (gauche/droite, mobile) | partout (footer 8 + head 23) | 0,8 Ko JS + 0,8 Ko CSS | faible | IX3 « défilement », glissé + fondu, mobile seulement | **oui** |
| A9 | **Cartes problématiques allumées au scroll** (mobile) | partout (footer 9 + head 24) | 1,5 Ko JS + 0,8 Ko CSS | faible | IX3 « défilement » qui ajoute ou retire une classe, mobile seulement | **oui** |
| A10 | Effets de survol en CSS (menu, menu déroulant, FAQ, LinkedIn, filtres blog, onglets Contact, flèche partenaires, cartes problématiques) | partout (head 4, 5, 8, 11, 16) + pages | ~9 Ko CSS | nul (CSS) | états de survol et transitions du Designer ; IX3 survol quand un élément change au survol de son parent | oui, bloc par bloc (gain de maintenance plus que de vitesse) |
| A11 | Ombre colorée au survol des réalisations | Réalisations (code de page) | 0,6 Ko JS | faible | la couleur vient du CMS : le natif ne sait pas la lire simplement | non (à garder) |
| A12 | Photo qui suit la souris (partenaires) | À propos | 1 Ko JS | faible | IX3 « mouvement de souris » | possible, faible intérêt |
| A13 | Bandeau de logos qui défile | partout (head 6) + `LogoMarqueeFix` | 0,2 Ko CSS + 0,9 Ko JS | nul (CSS) | déjà léger ; natif seulement si la boucle IX3 est confirmée | à laisser |

**Hors animations, à garder** :
- modale projets (10,5 Ko) ;
- glisser des cas clients (`DragScrollCasesV4`) ;
- dates en français ;
- suivi des formulaires ;
- `CtaButtonActions` ;
- `OffreHeroVideo`.

**Total du code d'animation : ~70 Ko**, dont ~50 Ko chargés sur **toutes** les pages alors que la plupart ne servent qu'à une ou deux pages.

## Propositions, par ordre de gain sur risque (une à la fois, chacune avec accord)

1. **A8, premier essai IX3 (petit et isolé).** Apparition des étapes du process en mobile. On crée l'interaction par le MCP, on publie sur orem.webflow.io, et on vérifie trois choses :
   - le rendu ;
   - **le poids réel du moteur IX3** ;
   - l'absence d'effet sur les autres pages.

   Si le moteur pèse plus que ce qu'il permet de retirer, on s'arrête là et on revoit la stratégie.
2. **A1, navbar.** C'est le plus gros gain de fluidité : plus aucun calcul pendant le scroll, et 7 Ko de moins sur toutes les pages. Il faut repérer les sections sombres de chaque page, une seule fois.
3. **A2, dégradés.** C'est le plus gros bloc de code (11 Ko) et le rendu le plus coûteux. Il se remplace par un style natif, sans IX3. Captures avant/après.
4. **A7 et A9**, même méthode que A8.
5. **A5, retrait du doublon** (P-09), puis A3, A4 et A6 selon le résultat du test de boucle IX3. À défaut, on déplace leur code vers les seules pages concernées : le code global passe d'environ 50 Ko à quelques Ko sur les autres pages.
6. **A10**, au fil de l'eau.
