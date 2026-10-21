# Site Orem — catalogue des sections réutilisables

Site `6a7582303b9ddd4a77302cc8`. Ce catalogue est tiré de l'audit en lecture seule du 21/10/2026 ; le détail page par page est dans `pages.md`.
Règle d'or pour toute nouvelle page : **on réutilise avant de créer**. On insère d'abord un composant existant ; à défaut, on recopie la structure d'une section existante avec **exactement les mêmes classes**. On ne crée jamais de nouvelle classe de base. Une combo-classe n'est ajoutée que si aucune n'existe pour l'effet voulu.

Notation : `Type .classe.combo  #element-id (page)`. Dans le Designer, les classes commencent parfois par un chiffre (`1500px`, `32px-haut`, `64px-gap`…). Dans le CSS publié, elles deviennent `_1500px`, etc. Dans les appels MCP (`set_style`), on utilise le nom Designer (sans `_`).

## 0. Système de classes (constaté)

Ce n'est pas du Client-First. Le site suit un système maison en trois niveaux, et seul `avis-section` contient en interne quelques classes de type Relume/Client-First (`section_testimonials`, `container-large`).

```
Section<section> .section + [espacement] + [gap] + [fond]
└─ Block .page-padding (+ largeur : 1500px | 1030px | aucune) (+ .center, .64px-padding-bas, …)
   └─ Block .container + [modificateurs de layout]
```

- **Espacement de section** (combos de `.section`) : `32px-haut`, `64px-haut`, `96px-haut`, `128px-haut`, `32px-bas`, `64px-bas`, `64px-padding`, `128px-padding-bas`, `128px-padding-bas-more`.
- **Gap de section** : `12px-gap`, `24px-gap`, `32px-gap`, `64px-gap`.
- **Fond de section** : `blanc`, `gris`, `noir` (et `#f8f8f7` sur le template Offres, à éviter).
- **Largeur** : `.page-padding.1500px` (max 1500 px, padding latéral de 32 px, 16 px en mobile), `.page-padding.1030px`, `.container-1300px` (largeur fixe 1300 px, pour les sliders CMS), `.page-padding` seul (pleine largeur, avec padding).
- **Layout de `.container`** : `space-between`, `center`, `haut`, `bas`, `gauche`, `droite`, `16px-vertical`, `24px-vertical`, `32px-vertical`, `64px-vertical`, `4px-horizontal`, `8px-horizontal`, `16px-horizontal`, `max-280px`, `max-550px`, `max-660px`, `max-700px`, `max-720`, `grid`, `1fr-2fr`, `choix`, `gestion-projet`, `methode-orem`…
- **Grilles** : `.1x2-grid`, `.1x3-grid`, `.1x5-grid`, `.1x2-grid.128px-gap`.
- **Typographie** : `.primary-text` (titres) et `.secondary-text` (corps et sur-titres), plus taille (`11px`, `14px`, `18px`, `22px`, `27px`, `34px`, `43px`, `54px`), couleur (`blanc`, `orange`, `bleu`, `noir-60%`, `blanc-60%`, `60%`) et alignement (`center`).
- **Boutons** : `.button.primary.no-max-width`, `.button.secondary.no-max-width` (sur fond sombre), `.button.black.full-16px-padding`, `.button.secondary.inverse.no-max` (sur fond clair), `.button.blanc`, `.button.noir`.
- **Décor** : `.image.union` (forme Orem), `.ligne-bleue`, `.ligne-orange`, `.image-fond-realisations` (dégradé du hero).

### Typographie des titres (constatée)

| Usage | Balise | Classes |
|---|---|---|
| H1 du hero sombre (accueil, Lille) | H1 | `.primary-text.54px.blanc` |
| H1 du hero clair (réalisations, blog, offres) | H1 | `.primary-text.54px` |
| Sur-titre de section | Block (pas un heading) | `.secondary-text.11px` (+ `.bleu` / `.orange`) |
| H2 de section (titre aligné à gauche) | H2 | `.secondary-text.43px` |
| H2 centré (FAQ) | H2 | `.primary-text.34px.center` |
| H2 sur fond noir (méthode) | H2 | `.primary-text.27px.blanc.center.max-700px` |
| H3 de carte | H3 | `.primary-text.18px` |
| H3 de question FAQ | H3 | `.secondary-text.22px` |
| Paragraphe d'intro de section | Block | `.primary-text.18px.noir-60%` |
| Texte de carte | Block | `.secondary-text.14px.22px-padding` |

---

## 1. Composants existants (à insérer, ne jamais recréer)

`get_all_components` : 14 composants.

| Composant | id | Instances | Props | Rôle |
|---|---|---|---|---|
| `new-menu-container` | `d07cebab-c6fc-a15d-b0e5-9c10ac539d36` | 12 | — | Navbar (avec liste CMS Offres) |
| `menu-404` | `07fbcfe4-bea8-a7cd-423f-8490c5c94140` | 1 | — | Navbar statique pour la 404 |
| `header` | `5bfc9d1c-afac-cd73-40fc-14d554ff6227` | 0 | — | Ancien header (copie déliée sur / et Lille) |
| `footer` | `d1220ddf-2c09-baed-309f-e1f2237fd802` | 12 | `Image` (image) | Footer |
| `footer-404` | `9a9ec921-60c0-47a4-b4c4-d78b7b27c933` | 0 | `Image` | Footer statique, inutilisé |
| `embed-modale` | `db6ccddb-ee7c-aa54-a74a-67d92fd6921b` | 6 | — | Code embed de la modale des cas clients (`data-modal-trigger`) |
| `case-section` | `849481a4-7c3d-6aa3-c13e-b49829cd3da5` | 3 | `Text` (sur-titre), `Title` (**non câblée**) | Slider des cas clients |
| `case-section-lille` | `63c8992a-ae6e-842a-bbb0-8a23e2b51470` | 1 | `Text`, `Title` (**non câblée**) | Idem, filtré sur « Afficher sur Agence web Lille » |
| `avis-section` | `2f8c8330-4c95-e348-14bf-5f85110b745d` | 3 | `Image 1..4` | Slider des témoignages (CMS) |
| `faq-section` | `4d112419-153c-4a11-77fd-40cc16e39fd7` | 1 | `Title`, `Text 1..5`, `Link 1..2`, `Image 1..4`, `Variant` (de Animation Button CTA) | FAQ à 3 onglets |
| `logo-client` | `59383b0d-4ddb-67d7-a4e3-7d2366283fb9` | 3 | `Variant` | Mini bande de logos (blancs) sous le H1 |
| `logo-client (couleur)` (groupe CTA) | `8e8ce913-f703-0e8d-c607-8fe472b1e6fb` | 1 | `Variant` | Idem, logos en couleur (fond clair) |
| `Animation Button CTA` (groupe CTA) | `f3cf7fbf-f5a2-c923-29fc-32d976d10732` | 17 | `Variant` (base, `83c1c303-19c2-0196-6ca4-89b0b1adfec9`, `47d716ba-c346-7392-4bdb-7cc7e07f3db0`) | Bouton animé « Rencontrer l'équipe » avec avatars et icônes |

Une instance s'insère avec `data_component_tool > insert_component_instance` (`component_id` ci-dessus, `parent_element_id` = `.main-wrapper` ou section voisine, `creation_position` before/after).

---

## 2. Catalogue des patterns de section

### P0 — Socle de page
- **Rôle** : squelette obligatoire de toute page.
- **Arbre** :
```
Body
└─ Block .page-wrapper
   ├─ Block .main-wrapper
   │  ├─ [COMP new-menu-container]
   │  ├─ (sections…)
   │  └─ [COMP embed-modale]        ← si la page contient des cartes avec data-modal-trigger (case-section, membres, réalisations)
   └─ [COMP footer]                 ← hors .main-wrapper (.main-wrapper a un z-index de 2 et une ombre ; le footer est "révélé" dessous)
```
- **Référence** : /realisations (`de49e0e2-ac11-9cea-ad64-ed3565d322b0` → `…322b1`).
- **Variantes** : sur / et /agence-web-lille, le menu est enveloppé dans Section `.Navbar Logo Left` (`5bfc9d1c-afac-cd73-40fc-14d554ff6226`), une copie déliée du composant `header` ; on n'en a pas besoin. Sur /contact, le footer est dans `.main-wrapper` : c'est une anomalie, à ne pas copier.

### P1 — Navigation → composant `new-menu-container`
Insérer l'instance. Ne pas modifier le menu pour une page SEO : le menu est global. Liens actuels : voir pages.md § 0.

### P2 — Footer → composant `footer`
Insérer l'instance. Le lien « Agence web Lille » (`/agence-web-lille`) vit **dans le composant** : ajouter une nouvelle page locale au footer revient à modifier le composant, ce qui touche les 12 pages.

### P3 — Hero « landing » sombre (accueil, Lille)
- **Rôle** : H1, preuve sociale, intro, 2 CTA, showreel ; fond en dégradé.
- **Référence à copier** : `/agence-web-lille` Section `d76b15b1-5ce3-f486-6575-5d5d2934f764` (même id sur /).
- **Arbre** :
```
Section<section> .hero-container-section
├─ Block .sticky-div.home
│  └─ Block .hero-container
│     ├─ P11 séparateur (.page-padding.1500px > .container.space-between.center.24px-padding > 2× Image .image.union)
│     ├─ Block .page-padding.1500px
│     │  └─ Block .container.space-between.haut.min-32px-gap
│     │     ├─ Block .container.32px-vertical.max-700px
│     │     │  ├─ H1 .primary-text.54px.blanc
│     │     │  └─ [COMP logo-client] (Variant base)
│     │     └─ Block .container.24px-vertical.452px
│     │        ├─ Link .container.4px-horizontal.center > Image .image.16px + Block .secondary-text.14px.blanc   (« Noté 5/5 par nos clients »)
│     │        ├─ Block .secondary-text.14px.blanc.60%           (intro)
│     │        └─ Block .container.16px-horizontal > Link .button.primary.no-max-width + Link .button.secondary.no-max-width
│     ├─ Block .page-padding.center.64px-padding-haut-bas.hide > Block .container.center.88px-gap.hide-mobile > 6 Image (.image.200x130px | .150x190px | .200x170px)
│     ├─ Block .page-padding.32px-padding-bas > Block .container.0px-vertical.center.32px-radius.fond-blanc   (showreel : .container.1x5-grid.change-hide / .container.image-showreel / .container-mobile-change)
│     └─ P11 séparateur (.container.space-between.center.32px-padding-bas.hide-mobile)
└─ Image .image-fond-realisations.home
```
- **À personnaliser** : le texte du H1, l'intro `#e817c46e-4ebe-03d0-b2f0-46ea3686fdcd` (sur Lille) et le lien du bouton « Réserver un appel » (actuellement `/contact`).
- **Composant ?** Non. C'est un candidat, mais le H1 et l'intro changent à chaque page : il faudrait des props câblées (H1, intro, liens).

### P3b — Hero « clair » de page intérieure (blog, offres, légal, articles)
- **Arbre** :
```
Section<section> .hero-container-section
├─ Block .sticky-div.realisations.blog
│  └─ Block .hero-container.blog
│     ├─ P11 séparateur (.page-padding.1500px > .container.space-between.center.24px-padding)
│     └─ Block .page-padding.64px-padding-bas.mobile (+ .center sur les pages légales)
│        └─ … (H1 .primary-text.54px, contenu)
└─ Image .image-fond-realisations.blog (+ .offres sur le template Offres)
```
- **Références** : /blog `de49e0e2-ac11-9cea-ad64-ed3565d322b3` ; template Offres `4164ddad-4776-7b75-bd4c-39257c9bc588` (version deux colonnes `.1x2-grid.0.9fr`, avec CTA `.button.black.full-16px-padding` + `.button.secondary.inverse.no-max` et vidéo `.container.video-offres`).
- **Variantes** : `.hero-container-section.blanc` + `.sticky-div.realisations` + `.hero-container.realisations` (/realisations, avec `[COMP logo-client (couleur)]`) ; `.hero-container-section.noir` + `.hero-container.static.0px-gap` (/contact) ; `.hero-container-section.à-propos` + `.hero-container.static.64px-gap` (/a-propos).

### P4 — Cas clients (slider CMS) → composants `case-section` / `case-section-lille`
- **Rôle** : slider des réalisations ; une carte ouvre la modale (`embed-modale`).
- **Arbre interne** (identique pour les deux composants) :
```
Section<section> .section.32px-haut.64px-bas.32px-gap.gris.cas-client   (id HTML "realisations-home")
├─ Block .page-padding.1500px > Block .container.space-between.center.64px-padding-bas > 2× Block .dot-change.cas-clients
├─ Block .page-padding > Block .container.space-between.bas > Block .container.16px-vertical.max-660px
│     ├─ Block .secondary-text.11px                      ← prop Text (câblée)
│     └─ H2 .secondary-text.43px « Ne vous fiez plus aux apparences : construisez la vôtre »   ← texte STATIQUE (prop Title non liée)
└─ Block .container-1300px
   └─ DynamoWrapper .collection-list-wrapper-cases > DynamoList .collection-list-cases > DynamoItem .collection-item-cases
        └─ Link .case-card.anim (data-modal-trigger, data-bg-color)
             ├─ .container.space-between.center > 2× .dot-change
             ├─ .container.400px-vh > Image .image.case-1 / .case-2 / .case-3   (images CMS)
             ├─ .container.space-between.center > H3 .primary-text.18px (nom CMS) + .chevron-container (.chevron-bas / .chevron-haut)
             ├─ Block .secondary-text.14px.60%   (accroche CMS)
             ├─ .container.space-between.center > 2× .dot-change
             ├─ Block .bg-holder (data-bg-holder) + Block .dot-holder (data-dot-holder)
```
- **Instances** : `/` `849481a4-7c3d-6aa3-c13e-b49829cd3da4` ; `/agence-web-lille` `d9e87367-f3c1-9696-d0d8-6def2d706443` (case-section-lille) ; template Offres `1d7cefa8-e79b-24f8-ad30-1b05c711839b` ; template Réalisations `6337e2dd-dc4f-826c-470c-47ee160d1cea`.
- **CMS** : collection Réalisations `6a759af703d4ca7e4b686bb9`. Champs de filtrage disponibles : switch `afficher-sur-la-page-d-accueil`, switch `afficher-sur-agence-web-lille`, nombres `ordre` et `ordre-page-realisations`. Le filtre exact de chaque instance n'est pas exposé par l'API (à vérifier). La description de `case-section-lille` confirme son filtre sur « Afficher sur Agence web Lille ».
- **Réutiliser** : insérer l'instance. Pour une nouvelle ville, `duplicate_component` à partir de `case-section-lille`, puis changer le filtre de la liste dans le Designer (non modifiable par MCP, à vérifier). La prop `Title` n'a aucun effet tant que le H2 n'est pas lié à la prop.
- **À corriger** (constaté) : lier le H2 à la prop `Title` dans les deux composants.

### P5 — Bande de logos clients (CMS)
- **Référence** : `/agence-web-lille` (et /) Section `c109d473-3e3f-169a-33e3-dcd6c0b2fff8`.
- **Arbre** :
```
Section<section> .section.64px-haut.32px-bas.12px-gap.gris
├─ Block .page-padding.1030px > Block .container.space-between.center > 2× Image .image.union
├─ Block .page-padding.center
│  └─ DynamoWrapper .collection-list-wrapper-logo > DynamoList .collection-list-logo > DynamoItem .collection-item-logo
│        └─ Link .link-block.100%.8px-padding > Image .image.100%.blending
├─ Block .page-padding.1030px > Block .container.space-between.center.64px-padding-bas > 2× Image .image.union
└─ Block .page-padding.1500px > Block .container.space-between.center > 2× Image .image.union
```
- **Variante** : /a-propos `b7fbd604-48f5-f7fa-f38e-8a11033a2c91` (`.collection-list-wrapper-logo.64px-padding`, `.collection-list-logo.flex-libre`, `.collection-item-logo.flex-libre`).
- **Composant ?** Non, c'est une copie (les mêmes id sur / et Lille le confirment). Un composant serait pertinent : le contenu est identique partout.
- Ne pas confondre avec `logo-client` (mini bande sous le H1, qui est un composant).

### P6 — Témoignages → composant `avis-section`
- **Arbre interne** :
```
Section<section> .section.96px-haut.32px-bas.24px-gap.blanc
├─ Block .section_testimonials > Block .container-large > Block .testimonials_component > Block .testimonials_mask
│     > Block .slider-viewport > Block .slider-track
│       > DynamoWrapper .collection-list-wrapper-avis > DynamoList .collection-list-avis > DynamoItem .collection-item-avis
│           └─ Block .card-témoignage > Image .image.fond-témoignage + séparateurs .image.union + Block .space-between-hauteur (Block .primary-text.22px [citation] + nom/poste .secondary-text.14px + Image .image.110x130px)
├─ Block .bouton-change-container > Block .button-change.left / .button-change.right (Image .image.24px)
└─ Block .page-padding.1500px > séparateur
```
- **Instances** : / et Lille `2f8c8330-4c95-e348-14bf-5f85110b745c` ; template Offres `993cbab1-07b5-56cb-3f87-9f1c1b5b49e9`.
- **CMS** : probablement Témoignages (`6a759b2503d4ca7e4b687b21`), à vérifier.
- **Limite** : la section ne contient aucun titre (ni H2 ni sur-titre).

### P7 — Offres (grille CMS + vidéos)
- **Référence** : `/agence-web-lille` (et /) Section `356c9f75-8d70-8efa-32cc-657e212fbbc6`.
- **Arbre** :
```
Section<section> .section.blanc.32px-haut.32px-bas.64px-gap  (attrs data-anim="slide", data-carousel="bg")
├─ P11 séparateur (.page-padding.1500px > .container.space-between.center)
├─ Block .page-padding > Block .container.space-between.bas
│  ├─ Block .container.16px-vertical.max-720 > Block .secondary-text.11px.bleu (« Nos offres ») + H2 .secondary-text.43px
│  └─ Block .container.4px-horizontal.center.auto > Link .secondary-text.14px + Image .image.16px
└─ Block .page-padding > Block .container.grid.1fr-2fr
   ├─ DynamoWrapper > DynamoList .Collection List 3 > DynamoItem
   │    └─ Block .container.choix
   │         ├─ Block .container.16px-vertical > (Block .container.8px-horizontal.center > Image .image.union + H3 .primary-text.18px) + Block .secondary-text.14px.22px-padding.hide
   │         ├─ Link .secondary-text.14px.22px-padding.tablette « Découvrir l'offre »
   │         └─ Block .ligne-bleue
   └─ Block .container.fond-expertises > séparateurs + Block .container.100%.24px-padding > Block .container-24px-padding > 4× BackgroundVideoWrapper .image.100%.cover.{conseil|image-de-marque|site-web|evolution}
```
- **CMS** : Offres `6a9138262200aeae4011d357`. 4 offres affichées ; SEO est exclue, critère à vérifier. Les vidéos sont associées aux offres par combo-classe (le slug de l'offre), d'où l'absence de vidéo pour une 5ᵉ offre.
- **Composant ?** Non, c'est une copie. Contenu identique sur / et Lille : bon candidat pour un composant.

### P8 — Méthode O.R.E.M. (fond noir)
- **Référence** : Section `a72fc657-4619-fef9-b274-40ff34f5f20c` (/, Lille).
- **Arbre** :
```
Section<section> .section.noir.32px-haut
├─ Block .page-padding.1500px > séparateur
├─ Block .page-padding.1500px > Block .container-black.full
│  ├─ Block .container-black.940px > Block .container.180px-hauteur + Block .secondary-text.14px.orange + BackgroundVideoWrapper .image.280x280px + H2 .primary-text.27px.blanc.center.max-700px
│  ├─ Block .container-black.1000px.gauche  > Block .container.methode-orem > (Block .container.358px-hauteur > Image .image.100%-vh.mobile) + (Block .container.16px-vertical > H3 .primary-text.34px.blanc + Block .primary-text.18px.blanc-60%) + Image .image.absolute.100%-vh
│  ├─ Block .container-black.1000px         > … (Représenter)
│  ├─ Block .container-black.1000px.droite  > … (Exécuter ; .image.100%-vw)
│  └─ Block .container-black.1600px         > … (Mesurer)
└─ Block .page-padding.1500px > Block .container.space-between.center.32px-padding > séparateur
```
- **Composant ?** Non. Contenu de marque identique partout : il faudrait en faire un composant sans prop.

### P9 — Section « en-tête scindé + onglets à visuels » (pattern le plus réutilisable pour un contenu local ou un service)
- **Rôle** : sur-titre, H2 et paragraphe à gauche ; info ou citation à droite ; dessous, 3 visuels qui changent selon la carte survolée ou active (`data-visuel` ↔ combo de `.projet-container`).
- **Références** : Lille « L'agence à Lille » `78431571-f774-3230-e878-288934e34a78` (contenu local) ; « Gestion de projet » `24f47c06-4b34-b297-6db9-708dadd57aab` (/, Lille).
- **Arbre** (version Lille) :
```
Section<section> .section.32px-haut.64px-bas.64px-gap.blanc
├─ [Gestion de projet seulement] P11 séparateur (.page-padding.1500px > .container.space-between.center)
├─ Block .page-padding
│  └─ Block .container.space-between.bas
│     ├─ Block .container.16px-vertical.max-550px
│     │  ├─ Block .secondary-text.11px                 (sur-titre)
│     │  ├─ H2 .secondary-text.43px
│     │  └─ Block .primary-text.18px.noir-60% > Strong  (paragraphe)
│     └─ Block .container.24px-vertical.max-280px      (adresse et téléphone, ou citation client : .secondary-text.14px / .container.4px-horizontal)
└─ Block .page-padding
   └─ Block .container.24px-vertical
      ├─ Block .container.gestion-projet
      │  ├─ Block .projet-container.<cle-1> > Image .image.photo-cover      (Lille : 1 photo)
      │  ├─ Block .projet-container.<cle-2> > Image .image.photo-cover      (Gestion : .image.projets-grand-1 + .image.projets-petit-1)
      │  └─ Block .projet-container.<cle-3> > Image …
      └─ Block .1x3-grid  (data-carousel="bg")
         └─ 3× Block .container.choix.haut  (data-visuel="<cle-n>")   (Gestion ajoute aussi la combo .<cle-n>)
               ├─ Block .container.8px-horizontal.center > Image .image.union + H3 .primary-text.18px
               ├─ Block .secondary-text.14px.22px-padding
               └─ Block .ligne-bleue
```
- **Clés existantes** : Lille `lille-proximite`, `lille-tissu`, `lille-zone` ; Gestion `suivi`, `tableau-de-bord`, `rapport`.
- **Réutiliser** : copier la structure avec les mêmes classes. Changer les textes, les images (assets) et les attributs `data-visuel`. Le lien entre `data-visuel` et la combo `.projet-container.<cle>` passe par un script personnalisé, non inspecté. Avant de créer une nouvelle combo (ex. `roubaix-proximite`), **vérifier** si le script exige une combo par clé, ou réutiliser les clés existantes.
- **Composant ?** Non (deux copies avec des contenus différents). C'est le meilleur candidat pour un composant à props (sur-titre, H2, paragraphe, 3 × [H3, texte, image]).

### P10 — FAQ à onglets (CMS)
- **Composant** : `faq-section` `4d112419-153c-4a11-77fd-40cc16e39fd7`. Une seule instance liée : / `4d112419-153c-4a11-77fd-40cc16e39fd6`.
- **Copies déliées ou inline** (même arbre) : Lille `4d112419-153c-4a11-77fd-40cc16e39fd6` (id d'instance repris, déliée, H2 modifié), template Offres `c53e74d0-a1a0-61a4-0a1f-6151ded1c60f`, /realisations (variante sombre, dans `de49e0e2-ac11-9cea-ad64-ed3565d32407`).
- **Arbre** :
```
Section<section> .section.64px-padding.64px-gap.blanc
├─ Block .page-padding.1500px > Block .container.64px-vertical.center
│  ├─ H2 .primary-text.34px.center                       (prop Title dans le composant)
│  └─ Block .1x2-grid.128px-gap
│     ├─ Block .container.24px-vertical.center > TabsWrapper .tabs
│     │  ├─ TabsMenu .tabs-menu > 3× TabsLink .tabs-link > Block (prop Text 1..3 : « Fit », « Approche », « Déroulé »)
│     │  └─ TabsContent .tabs-content > TabsPane .tab-pane-1 | .tab-pane-2 | .tab-pane-3
│     │       └─ DynamoWrapper .collection-list-wrapper-faq > DynamoList .collection-list-faq > DynamoItem .collection-item-faq
│     │            └─ Block .container-faq.100%-vw.24px
│     │               ├─ Block .space-between-div.haut
│     │               │  ├─ Block .container-faq.vertical.0px.gauche.auto
│     │               │  │  ├─ Block .space-between-div.haut.16px-gap.faq > H3 .secondary-text.22px (name) + Block .mini-container.24px > Image .image.12px
│     │               │  │  └─ Block .Div > RichText .secondary-text.14px.60%.16px-margin (reponse)
│     │               │  └─ Block .container-faq.100%VH.Haut
│     │               └─ Block .Texte.Police Secondaire.20px.80%.Hide   ← résidu statique, à NE PAS recopier
│     └─ Link .link-faq.612px > Image .image.absolute.100%.cover + [COMP Animation Button CTA]
└─ Block .page-padding.1500px > séparateur
```
- **Variante sombre** (/realisations) : H2 `.primary-text.34px.center.blanc`, `.tabs-menu.inverse`, `.tabs-link.fond-noir`, H3 `.secondary-text.22px.blanc`, RichText `+ .blanc`, et un `.link-faq.612px` en Block contenant 2 images `.index-1` / `.index-2`.
- **CMS** : FAQ `6a759b4141528d216986a56e`. Champs : `name` (question), `reponse` (RichText), `categorie-faq` (réf. Catégories FAQ `6aa101739b73bafc27c7a793`), `ordre`, `page-2` (Option : Accueil / Réalisations / Conseil / Image de marque / Site web / Évolution), `offre-liee` (réf. Offres), `onglet-offre` (Option 1/2/3), switch `afficher-sur-agence-web-lille`, `article-liee`. Filtres exacts par onglet : à vérifier dans le Designer.
- **Réutiliser** : insérer `faq-section` et surcharger `Title` et `Text 1..3`. Le filtre des listes est figé dans le composant ; pour un autre jeu de questions, il faut une copie (`duplicate_component`) avec ses propres filtres. Penser à **synchroniser le JSON-LD FAQPage** de la page avec les questions affichées.

### P11 — Séparateur décoratif « union »
- **Arbre** : `Block .page-padding.1500px > Block .container.space-between.center (+ .24px-padding | .32px-padding | .32px-padding-bas | .64px-padding-bas | .hide-mobile) > 2× Image .image.union`.
- Il est présent en haut et/ou en bas de presque chaque section (plus de 20 occurrences par page). Assets : `6a79b00124488c5b4eeaf6d2` (bleu), `6a7c1d55f4b97d52345d5138` (gris foncé), `6a7598ad8a374a5f2d76d4fd`, `6a8d735191dd3832d5fb675c`…, avec des alt descriptifs (« Forme abstraite décorative … de la marque Orem »).
- **Composant ?** Non, et c'est la principale source de « div soup » répétée. Recommandation : un composant `separateur-union` avec une prop image (et un alt vide, puisque l'image est décorative).

### P12 — En-tête de section (sur-titre + H2), brique interne
```
Block .page-padding > Block .container.space-between.bas
├─ Block .container.16px-vertical.max-550px | .max-660px | .max-720
│  ├─ Block .secondary-text.11px (+ .bleu | .orange)
│  ├─ H2 .secondary-text.43px (+ .blanc sur fond noir)
│  └─ (option) Block .primary-text.18px.noir-60%
└─ (option) élément aligné à droite (lien, note, citation, bouton .button.blanc)
```
Utilisée dans P4, P7, P9 et le template Offres (« Détail / Contenu de l'offre » `2e8c11cb-1bab-db16-8c92-6e000cf1299d`).

### P13 — Bouton CTA animé → composant `Animation Button CTA`
17 instances (dans `faq-section`, `.link-faq`, hero /a-propos `99c9f160-3960-1101-dd66-2eb319f46e0f`). Choisir le `Variant` (base, `83c1c303-19c2-0196-6ca4-89b0b1adfec9` sur fond clair dans la FAQ, `47d716ba-c346-7392-4bdb-7cc7e07f3db0` dans le hero /a-propos).

### P14 — Formulaire de contact (unique)
- /contact, FormWrapper `.contact-form` `4e153c82-5d2c-0182-9f9b-88cd3e0cd9f3`. Ce n'est pas un composant et il n'y a qu'un seul formulaire sur le site. Les pages SEO renvoient vers `/contact` ou vers iClosed (`https://app.iclosed.io/e/ICONOKOM/rdv-30min`) ; on ne duplique pas le formulaire.

### P15 — Page de texte légal
- `hero-container-section` > `.sticky-div.realisations.blog` > `.hero-container.blog` > séparateur + `.page-padding.64px-padding-bas.mobile.center` > RichText `.rich-text` (H1/H2/H3 dans le RichText). Référence : `f1e3788b-012f-0596-36c2-0567541ca2bd` (/legal/mentions-legales).

### P16 — Blocs spécifiques au template Offres (réutilisables pour une page service)
- **Problématiques (sticky + liste)** : Section `.section.64px-padding.64px-gap` `ba9ba095-6233-5c9c-de27-b0c8125fe89d` > `.max-1300px-container` > `.1x2-grid-scroll` > `.container-scroll.vertical.16px` > `.container-sticky` (sur-titre `.secondary-text.14px.bleu`, H2 `.secondary-text.43px.max-750px`, texte) + liste `.collection-list-wrapper-pb-clients` de cartes `.pb-clients-card` (H3 `.primary-text.34px.max-320px`). Elle est **imbriquée dans le hero** : pour la réutiliser, la sortir au niveau `.main-wrapper`.
- **Solution + contenu de l'offre (fond noir)** : Section `.section.noir.32px-haut` `2e8c11cb-1bab-db16-8c92-6e000cf12987` (`.container.center.725px` > `.image.logo-crop-gauche` + `.container.528px.glass-card` + `.image.logo-crop-droite` ; puis P12 ; puis `.container-1300px.64px-padding-bas` > liste de `.problematique-card` (H3 `.primary-text.27px.blanc.F2F2F2`)).
- **Process** : Section `.section.#f8f8f7` `07b0790c-f558-821d-3d7c-71df794f8358` > `.page-padding.1500px` > `.process-container` (`.process-dots-row`, `.process-heading` > Paragraph `.process-eyebrow` + H2 `.process-title`, `.process-grid-wrap` > `.process-line` + liste `.process-grid` de `.process-card` [`.process-step-heading`, H3 `.primary-text.27px`, Paragraph `.process-step-text`]). Collection probable : Étapes du process (`6a9138102ffa2d065f3eb8a8`), à vérifier.

### P17 — Modale des cas clients → composant `embed-modale`
À insérer en dernier enfant de `.main-wrapper` sur toute page qui contient P4 (cartes `data-modal-trigger`).

---

## 3. Gabarit « page SEO locale » (modèle : `/agence-web-lille`)

### 3.1 Comment la page Lille est construite (constaté)
- Page statique à la racine, slug `agence-web-lille`, créée par **duplication de l'accueil** (les id d'éléments sont identiques).
- Ordre des sections dans `.main-wrapper` :
  1. Section `.Navbar Logo Left` > `[COMP new-menu-container]`
  2. **P3 Hero** : H1 local « Agence web à Lille pour les PME B2B qui valent mieux que leur image. », intro locale.
  3. **P4 `[COMP case-section-lille]`** : réalisations filtrées par le switch `afficher-sur-agence-web-lille`, prop Text « Nos cas clients à Lille ».
  4. **P5 Logos** (copie de l'accueil).
  5. **P9 « L'agence à Lille »** (**seule section créée pour la page**) : sur-titre, H2 « Une agence web B2B, au cœur de Lille. », adresse (lien Google Maps), téléphone, 3 cartes H3 (La proximité / Le tissu lillois / Notre zone d'intervention, avec la liste des communes) et 3 photos de Lille.
  6. **P7 Offres** (copie).
  7. **P6 `[COMP avis-section]`**.
  8. **P8 Méthode** (copie).
  9. **P9 Gestion de projet** (copie).
  10. **P10 FAQ** (copie déliée de `faq-section`) : H2 local « Vos questions sur notre agence web à Lille. », questions FAQ CMS au switch `afficher-sur-agence-web-lille` réparties dans les 3 onglets (11 questions).
  11. `[COMP embed-modale]` ; puis `[COMP footer]` hors `.main-wrapper`.
- **Méta** :
  - Title : `Agence web à {Ville} : branding & sites Webflow B2B | Orem` (58 car. pour Lille)
  - Description : `Agence web à {Ville} pour PME B2B : branding, copywriting et sites Webflow. {Zone : Métropole lilloise et Hauts-de-France}. Diagnostic gratuit.` (134 car.)
  - OG : copié du SEO (`titleCopied`/`descriptionCopied` = true), image par défaut `6a86dc7f73d8efed9748266f`.
- **JSON-LD** (réglages de page, `@graph`) :
  - `ProfessionalService` : `@id` `https://www.agence-orem.fr/#agence-{ville}`, name « Orem », description locale, url de la page, telephone `+33750371572`, email, `address` (siège de Lille), `geo`, `areaServed` [City, AdministrativeArea métropole, AdministrativeArea région, Country France], `knowsAbout`, `parentOrganization: {"@id":"https://www.agence-orem.fr/#organization"}`.
  - `FAQPage` : copie **textuelle** des questions et réponses CMS affichées.
  - `BreadcrumbList` : Accueil → « Agence web à {Ville} ».
- **Maillage** : entrant = un lien dans le composant `footer` seulement ; sortant = offres (liste CMS), 4 réalisations, `/contact`, iClosed, 2 articles cités dans les réponses FAQ, `/offres/seo`.
- **Sitemap** : inclus (`includeInSitemap: true`).

### 3.2 Pour créer « Agence web {Ville} » (procédure recommandée, à valider)
1. **Créer la page** en dupliquant `/agence-web-lille` (`create_page` avec `duplicateOf: 6ac61124af8e2047b4ff8271`, slug `agence-web-{ville}`, à la racine comme Lille). La duplication garde toutes les classes et instances, sans rien recréer.
2. **Méta** : title et description selon le pattern ci-dessus (title ≤ 60 car., description de 120 à 155 car.) ; OG copié.
3. **Hero (P3)** : remplacer le H1 `c7dee749-bc35-171b-8b46-bf2d55ebfcf0` et l'intro `e817c46e-4ebe-03d0-b2f0-46ea3686fdcd` (`set_text`). Ne pas toucher la structure.
4. **Section locale (P9)** `78431571-f774-3230-e878-288934e34a78` : réécrire le sur-titre, le H2 `78431571-…-34a51`, le paragraphe, l'adresse et les 3 cartes (H3 + texte : proximité, tissu économique local sourcé, zone d'intervention avec les communes). Remplacer les 3 images `.image.photo-cover` par des photos de la ville (`set_image_asset`, avec un alt descriptif). Clés `data-visuel` : voir la réserve de P9.
5. **Cas clients (P4)** : il n'existe un switch que pour Lille. Options : (a) garder `case-section` générique (cas de l'accueil) ; (b) `duplicate_component` de `case-section-lille` et ajouter dans Réalisations un switch `afficher-sur-agence-web-{ville}`. Recommandation à arbitrer : remplacer les switches par ville par un champ MultiReference ou Option « Pages locales », qui passe mieux à l'échelle. Dans tous les cas, câbler d'abord la prop `Title`.
6. **FAQ (P10)** : même logique. Le switch FAQ `afficher-sur-agence-web-lille` est propre à Lille : prévoir un champ équivalent pour la nouvelle ville, puis modifier le filtre des 3 listes de la copie FAQ dans le Designer. Mettre à jour le H2 `4152a55d-6d98-1226-e46f-54938883d9da`.
7. **Sections génériques** (P5, P7, P6, P8, P9 Gestion) : à conserver telles quelles, ce sont des copies de l'accueil. Attention : la proportion de contenu dupliqué est déjà forte sur Lille. Pour chaque nouvelle ville, l'unicité repose sur le hero, la section locale et la FAQ, qui doivent donc être substantiels.
8. **JSON-LD** : copier le `@graph` de Lille ; changer `@id` (`#agence-{ville}`), description, url, `areaServed` et `geo`. Garder l'adresse réelle du siège (Lille) : n'inventer aucune adresse locale. Régénérer `FAQPage` à partir des questions réellement affichées, et mettre à jour le `BreadcrumbList`.
9. **Maillage** : ajouter le lien dans le composant `footer` (impact global) ; lier depuis les contenus pertinents (articles locaux, offres) ; ajouter un lien croisé entre les pages villes (Lille ↔ {Ville}).
10. **Sitemap** : vérifier `includeInSitemap: true` (`get_page_sitemap_status`).
11. **Nettoyage à ne pas propager** : le bloc `.Hide` « Q : Combien de temps… » dans les items de FAQ, le lien `#` de « Noté 5/5 », le téléphone sans `tel:`, et le chargement lazy des images du hero.

### 3.3 Pour une page service (hors local)
Utiliser le template CMS **Offres** (`/offres/[slug]`, collection `6a9138262200aeae4011d357`) : créer un item CMS plutôt qu'une page statique. Le template assemble P3b (hero deux colonnes) + P16 + P6 + P4 + P10 (FAQ filtrée par `offre-liee` / `onglet-offre`). Le JSON-LD `Service` y est généré dynamiquement. Exemple existant : `/offres/seo`, présente dans le footer mais absente du menu.
