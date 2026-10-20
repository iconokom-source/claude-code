# Expertise performance Webflow

Repères d'expert pour diagnostiquer et corriger. Les fonctions Webflow évoluent : avant de recommander une solution native, confirmer qu'elle existe aujourd'hui et comment elle se comporte (guide MCP, `ask_webflow_ai`, documentation officielle).

## Ce que Webflow fait déjà (ne pas le refaire en code)

- Hébergement sur CDN avec HTTP/2-3, compression et cache. Options de minification HTML/CSS/JS dans les réglages de publication : vérifier qu'elles sont actives.
- Images ajoutées via l'élément Image : `srcset` responsive généré automatiquement, conversion WebP/AVIF possible depuis le panneau Assets, réglage de chargement par image (lazy / eager / auto). Les **images de fond CSS** n'ont pas de `srcset` : une grande image de fond est servie entière sur mobile.
- Les classes du Designer sont compilées dans **un seul fichier CSS** mis en cache entre les pages. Du CSS dans le code global head est, lui, renvoyé dans le HTML de chaque page et bloque le rendu.
- Les interactions natives (IX3, moteur GSAP) ne chargent que ce qui est utilisé. GSAP et ses plugins sont gratuits et intégrés à Webflow : charger GSAP depuis un CDN en plus est un doublon probable.
- Éléments natifs à privilégier au JS maison : Slider, Tabs, Dropdown, Navbar, Lightbox, Background video, Modal et Popover (éléments récents, basés sur `<dialog>` / l'API Popover), listes de collection avec pagination native, formulaires natifs.

## Correspondances fréquentes custom code → solution plus légère

| Custom code typique | Remplaçant à évaluer |
|---|---|
| Apparition au scroll (« stagger reveal ») en JS | Interaction IX3 « scroll into view » avec décalage entre enfants ; ou CSS `animation-timeline: view()` avec repli |
| Défilement de logos (marquee) en JS | Interaction IX3 en boucle, ou animation CSS `transform` sur une piste dupliquée (pas de JS) |
| Carrousel maison (« carousel engine ») | Slider natif, ou défilement CSS `scroll-snap` + boutons minimalistes ; Swiper/Splide uniquement si besoin réel, chargé sur la seule page concernée |
| Glisser pour faire défiler (« drag scroll ») | `overflow-x: auto` + `scroll-snap` (le tactile marche nativement) ; glisser à la souris en petit JS différé si vraiment voulu |
| Onglets / showreel en JS | Tabs natifs |
| Modale projet en JS + CSS | Élément Modal natif |
| Bouton qui ouvre un widget, scroll vers une ancre | Lien natif (ancre, modal, popover) ; JS seulement pour ce que le natif ne fait pas |
| Filtres de blog maison | Finsweet Attributes (List Filter) chargé uniquement sur la page blog, ou pages Catégories CMS natives (meilleur SEO, zéro JS) |
| Vidéo de hero chargée par JS | Background video natif, ou `<video preload="none" poster>` qui ne démarre qu'à l'affichage ; pas de vidéo lourde en autoplay sur mobile |
| Footer « reveal » calculé en JS | `position: sticky` / CSS pur |
| Corrections de mise en page en JS (« fix », calcul d'espacements) | Corriger la classe dans le Designer (flex/grid, `gap`, `aspect-ratio`) |
| `<style>` globaux pour des éléments précis | Classes Webflow, ou au minimum code au niveau de la page concernée |

Avant de retirer un JS d'animation : relever précisément le rendu actuel (capture vidéo Playwright ou captures successives, durée, courbe, décalage) pour que le remplaçant soit visuellement équivalent.

## Leviers par indicateur

**LCP (affichage du contenu principal)**
- L'image ou le titre du haut de page ne doit pas être en lazy, ni masqué par une animation d'entrée (opacité 0 au chargement = LCP retardé). Une animation d'entrée du hero doit partir d'un état visible ou rester très courte.
- Peu de CSS bloquant dans le head ; pas de script synchrone dans le head (sauf le minimum de GTM, dont le chargement peut être retardé avec accord).
- Polices : woff2, `font-display: swap`, préchargement (`<link rel="preload" as="font" crossorigin>`) de la seule police du titre principal ; limiter les graisses (Trykker Regular + Lexend Deca 3–4 graisses : préférer la police variable si plus légère au total).
- Préconnexion (`preconnect`) seulement vers les domaines tiers réellement utilisés en début de page.

**CLS (stabilité)**
- Dimensions ou `aspect-ratio` sur images, vidéos, embeds, iframes.
- Pas de contenu injecté au-dessus du contenu existant par JS après chargement (bandeaux, widgets).
- Polices de repli aux métriques proches (`size-adjust` si nécessaire).

**INP / TBT (réactivité)**
- Écouteurs `scroll` / `resize` remplacés par `IntersectionObserver` / `ResizeObserver` ; écouteurs `passive`.
- Pas de travail lourd au chargement : initialiser les scripts quand la section entre à l'écran.
- Tiers (chat, prise de rendez-vous, tracking) chargés après interaction ou au repos (`requestIdleCallback`) — **avec accord**, et en vérifiant que le suivi des conversions fonctionne encore.
- Un seul jeu de bibliothèques : pas deux versions de GSAP, pas jQuery chargé une seconde fois (Webflow le fournit déjà).

**Poids**
- Images : WebP/AVIF, dimensions adaptées (pas de 4000 px pour un affichage à 800 px), compression ; vidéos compressées (H.264/H.265, ≤ 2–3 Mo pour un hero).
- Code mort et versions inutilisées retirés.
- Code spécifique déplacé sur ses pages.

## Règles d'écriture quand le code reste nécessaire

- Un seul fichier par fonction, nommé clairement, versionné ; scripts hébergés plutôt qu'inline géant (cache).
- `defer` (ou `type="module"`) ; aucun `document.write` ; aucune dépendance à un ordre de chargement implicite.
- Cibler les éléments par attributs `data-*` explicites plutôt que par classes de style (une classe renommée ne casse plus le JS).
- Sortir proprement si l'élément visé est absent (`if (!el) return;`).
- Respecter `prefers-reduced-motion`.
- Commenter en tête : rôle, pages, éléments visés, date, lien vers la fiche P-xx.

## Budgets cibles (à ajuster après l'audit)

Mobile, page d'accueil : LCP < 2,5 s, CLS < 0,1, INP < 200 ms, Lighthouse Performance ≥ 90, JS total (hors Webflow) < 100 Ko compressé, code global head < 5 Ko.
