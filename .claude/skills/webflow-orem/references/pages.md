# Site Orem — structure des pages (audit lecture seule)

Site Webflow `6a7582303b9ddd4a77302cc8` · domaine `https://www.agence-orem.fr` · locale principale `6a758245eec5583c65d039d4`.
Audit du 21/10/2026 (MCP Webflow : `get_all_elements`, `get_page_metadata`, `query_pages_schema_markup`, `list_pages_sitemap_status`, `list_forms`, `get_all_components`, plus le HTML publié récupéré avec curl). Rien n'a été modifié.

Conventions de lecture :
- Arbre : `Type .classe1.classe2 #element-id`. Les classes sont celles du Designer (les noms commençant par un chiffre, comme `1500px`, deviennent `_1500px` dans le CSS publié).
- `[COMP nom]` = instance de composant. Les id d'élément sont relatifs à la page indiquée (le champ `component` de l'id = l'id de la page).
- « Constaté » = vu dans l'API ou le HTML publié. « À vérifier » = ce que l'API n'expose pas (filtres et tris des Collection Lists, notamment).

---

## 0. Vue d'ensemble

### Pages statiques

| Page | id | Slug / chemin | Sitemap | JSON-LD (@type) |
|---|---|---|---|---|
| Accueil - Orem | `6a7582333b9ddd4a77302d08` | `/` | oui | Organization (`#organization`) + BreadcrumbList |
| Agence web Lille | `6ac61124af8e2047b4ff8271` | `/agence-web-lille` | oui | ProfessionalService (`#agence-lille`) + FAQPage + BreadcrumbList |
| Blog | `6a8d70816ca55fc30856706e` | `/blog` | oui | Blog + BreadcrumbList |
| Contact | `6a7ed06a2e5bb1e23693d292` | `/contact` | oui | ContactPage + BreadcrumbList |
| À propos | `6a7dd249b00b230647bf6d02` | `/a-propos` | oui | AboutPage + 3 × Person + BreadcrumbList |
| Réalisations | `6a7dbf0e2ec203e57f8e7e44` | `/realisations` | oui | CollectionPage (ItemList de 8 CreativeWork, **saisis en dur**) + BreadcrumbList |
| 404 | `6a8440b8701d33ef3ee85a8f` | `/404` | (page utilitaire) | aucun |
| Mentions Légales | `6aa101708e5d116637e95981` | `/legal/mentions-legales` (dossier `6aa104fd88eb96ffc48a261b`) | **non** | WebPage + BreadcrumbList |
| Politique de Confidentialité | `6aa1051b9391937330e82204` | `/legal/politique-de-confidentialite` | **non** | WebPage + BreadcrumbList |

### Templates CMS publiés (id de **page** ≠ id de collection)

| Template | id page | id collection | Chemin | SEO title / desc | JSON-LD |
|---|---|---|---|---|---|
| Offres | `6a9138272200aeae4011d3c7` | `6a9138262200aeae4011d357` | `/offres/[slug]` | champs `seo-titre` / `seo-meta-description` | Service (`…/offres/{slug}#service`, provider `#organization`) |
| Réalisations | `6a759af703d4ca7e4b686bbf` | `6a759af703d4ca7e4b686bb9` | `/realisations/[slug]` | `seo-titre` / `seo-meta-description`, OG image = `image-de-couverture` | Article |
| Articles | `6a759b5e8c6a9cdbe2787bc9` | `6a759b5e8c6a9cdbe2787bc3` | `/articles/[slug]` | `title-tag` / `meta-description`, OG = `image-de-couverture` | BlogPosting (auteur = Person `membres/{slug}#person`) |
| Membres | `6a759ac144dc0178f0b2fc7b` | `6a759ac144dc0178f0b2fc75` | `/membres/[slug]` | `seo-titre` / `seo-meta-description`, OG = `photo` | ProfilePage + Person |

Les id fournis dans le brief pour Réalisations, Articles et Membres sont des id de **collection**. `get_page_metadata` les refuse (404) : il faut utiliser les id de page ci-dessus.
Templates de données non publiés (`shouldPublish:false`, ignorés) : Catégories FAQ, Posts LinkedIn, Aspects business, Contenu concret, Étapes du process, Problématiques clients, Visuels, Catégories, Partenaires, FAQ, Témoignages, Services, Prestations, Compétences, Clients.

### Socle commun à toutes les pages (sauf 404)

```
Body
└─ Block .page-wrapper
   ├─ Block .main-wrapper
   │  ├─ [COMP new-menu-container]        (directement, ou dans Section .Navbar_Logo_Left sur / et /agence-web-lille)
   │  ├─ Section<section> .hero-container-section(.variante)
   │  ├─ … sections …
   │  └─ [COMP embed-modale]              (absent sur /blog, /contact, /legal/*)
   └─ [COMP footer]                       (sur /contact il est DANS .main-wrapper)
```

- Le menu `new-menu-container` (`d07cebab-c6fc-a15d-b0e5-9c10ac539d36`, 12 instances) contient une Collection List Offres (dropdown). Sur la 404 on utilise une copie statique, `menu-404` (`07fbcfe4-bea8-a7cd-423f-8490c5c94140`).
- Le footer `footer` (`d1220ddf-2c09-baed-309f-e1f2237fd802`, 12 instances, prop image `Image`). `footer-404` existe mais n'a aucune instance : la 404 n'a pas de footer.
- Le composant `header` (`5bfc9d1c-…-6227`) a 0 instance. La Section `.Navbar Logo Left` `5bfc9d1c-afac-cd73-40fc-14d554ff6226` (sur / et /agence-web-lille) en est une copie déliée.
- Liens du menu (HTML publié) : `/`, `/realisations`, Offres (CMS) = `/offres/conseil`, `/offres/image-de-marque`, `/offres/site-web`, `/offres/evolution` (rendus 2 fois, desktop + tablette), `/a-propos` (« Équipe »), `/blog` (« Ressources »), `/contact`. `/offres/seo` et `/agence-web-lille` **ne sont pas dans le menu**.
- Liens du footer : iClosed `https://app.iclosed.io/e/ICONOKOM/rdv-30min` (×2), `/realisations`, `/blog`, `/contact`, **`/agence-web-lille`**, `/offres/seo`, `/offres/conseil`, `/offres/image-de-marque`, `/offres/site-web`, `/offres/evolution`, `/a-propos`, `/membres/louis-montagne`, `/membres/theophile-lamouret`, `/membres/clement-saint-hilaire`, `/legal/mentions-legales`, `/legal/politique-de-confidentialite`. Trois liens pointent sur `#` : « LinkedIn Orem », « © 2026 Orem », « Gérer mes cookies » (ce dernier porte `data-cookie-consent`).

### Constats techniques globaux (HTML publié)

- **Toutes** les `<img>` portent `loading="lazy"`, y compris le logo et les visuels du hero (LCP) : 0 image en `eager` sur l'ensemble des pages testées.
- Formats d'image : WebP et AVIF en majorité, quelques PNG et SVG. Sur l'accueil : 155 webp, 69 avif, 1 png, 8 svg.
- CSS partagé `orem.webflow.shared.a083f6a91.min.css` : 120,7 ko (23,3 ko gzip), environ 705 classes.
- Code personnalisé dans le `<head>` : environ 48 ko, avec 34 blocs `<style>` et 9 `<script>` (GTM, widget iClosed `app.iclosed.io/assets/widget.js`, webfont.js, styles du menu `nav-on-dark`/`nav-on-light`…). Environ 24 scripts en fin de body, dont jQuery 3.5.1 et webflow.js.
- Vidéos d'arrière-plan : 7 sur l'accueil, 6 sur /agence-web-lille, 3 sur /offres/site-web, 1 dans le footer (`.fond-footer`, présente sur toutes les pages).
- Une balise canonique auto-référente est présente partout. OG image par défaut : asset `6a86dc7f73d8efed9748266f` (`opengraph-orem.png`), sauf pour la 404 (aucune).
- `robots.txt` déclare uniquement le sitemap. Le sitemap contient : les pages statiques (sans /legal/*), 2 membres sur 3 (`clement-saint-hilaire` est **absent** alors que la page répond en 200 ; à vérifier), 16 réalisations (dont `orem`), 6 articles et 5 offres.
- `/404` répond en 200 si on l'appelle directement. Une URL inexistante renvoie bien un code 404.

---

## 1. `/agence-web-lille` (page modèle SEO locale) — `6ac61124af8e2047b4ff8271`

**Origine :** la page a été créée le 07/10/2026 par duplication de l'accueil. La plupart des id d'élément sont identiques à ceux de `/` (ex. `d76b15b1-…-f764`). Seuls le texte et la section 4 sont propres à Lille.

### SEO
- Title (58 car.) : `Agence web à Lille : branding & sites Webflow B2B | Orem`
- Meta description (134 car.) : `Agence web à Lille pour PME B2B : branding, copywriting et sites Webflow. Métropole lilloise et Hauts-de-France. Diagnostic gratuit.`
- OG : titre et description copiés (`titleCopied`/`descriptionCopied` = true), image = asset `6a86dc7f73d8efed9748266f`. `twitter:card` = summary_large_image.
- Slug `agence-web-lille`, à la racine (pas de dossier). Présente dans le sitemap. Canonique `https://www.agence-orem.fr/agence-web-lille`.
- JSON-LD (`@graph`, saisi dans les réglages de la page, pas d'embed) :
  - `ProfessionalService`, `@id` `https://www.agence-orem.fr/#agence-lille`, name « Orem », url de la page, telephone, email, `PostalAddress` (34 Place du Général de Gaulle, 59800 Lille, Hauts-de-France, FR), `GeoCoordinates` (50.637168, 3.063799), `areaServed` [City Lille, AdministrativeArea Métropole européenne de Lille, AdministrativeArea Hauts-de-France, Country France], `knowsAbout` [Création de site web, Webflow, Branding, Copywriting, Refonte de site web], `parentOrganization` → `#organization`.
  - `FAQPage` avec 11 Question/Answer **en texte dur**. Les 11 questions correspondent exactement aux 11 H3 rendus par la FAQ CMS.
  - `BreadcrumbList` : Accueil → Agence web à Lille.
- Maillage : la page n'est liée **que depuis le footer** (aucun lien dans le corps des autres pages, y compris l'article `/articles/meilleures-agences-web-lille`). Liens sortants internes : `/contact` (×5), `/offres/{conseil,image-de-marque,site-web,evolution}` (×4 chacun, liste CMS + menu + footer), `/offres/seo`, `/realisations` (×3), `/realisations/{le-crayon,huchet-demorge,logical-conseils,concilum-le-recruteur}`, `/articles/choisir-agence-webflow-b2b` et `/articles/webflow-vs-wordpress-site-b2b` (dans les réponses FAQ), `/a-propos`, `/blog`, membres, pages légales. Liens externes : Google Maps (`?query=ICONOKOM`), Google support, Sortlist, sites clients (bande de logos).

### Plan, section par section

| # | Élément racine (id) | Classes | Rôle | Titres |
|---|---|---|---|---|
| 0 | Section `5bfc9d1c-afac-cd73-40fc-14d554ff6226` | `.Navbar Logo Left` (tag div) → `[COMP new-menu-container]` `d07cebab-c6fc-a15d-b0e5-9c10ac539d35` | Navigation | — |
| 1 | Section `d76b15b1-5ce3-f486-6575-5d5d2934f764` | `.hero-container-section` | Hero (H1, preuve sociale, CTA, showreel) | H1 |
| 2 | `[COMP case-section-lille]` `d9e87367-f3c1-9696-d0d8-6def2d706443` | (racine du composant : `.section.32px-haut.64px-bas.32px-gap.gris.cas-client`, attribut `id="realisations-home"`) | Cas clients filtrés Lille | H2 + H3 (CMS) |
| 3 | Section `c109d473-3e3f-169a-33e3-dcd6c0b2fff8` | `.section.64px-haut.32px-bas.12px-gap.gris` | Bande de logos clients (CMS) | — |
| 4 | Section `78431571-f774-3230-e878-288934e34a78` | `.section.32px-haut.64px-bas.64px-gap.blanc` | **Section propre à Lille** : « L'agence à Lille » | H2 + 3 H3 |
| 5 | Section `356c9f75-8d70-8efa-32cc-657e212fbbc6` | `.section.blanc.32px-haut.32px-bas.64px-gap`, attributs `data-anim="slide"` `data-carousel="bg"` | Offres (CMS) + vidéos | H2 + H3 (CMS) |
| 6 | `[COMP avis-section]` `2f8c8330-4c95-e348-14bf-5f85110b745c` | (racine `.section.96px-haut.32px-bas.24px-gap.blanc`) | Témoignages (slider CMS) | **aucun** |
| 7 | Section `a72fc657-4619-fef9-b274-40ff34f5f20c` | `.section.noir.32px-haut` | Méthode O.R.E.M. | H2 + 4 H3 |
| 8 | Section `24f47c06-4b34-b297-6db9-708dadd57aab` | `.section.32px-haut.64px-bas.64px-gap.blanc` | Gestion de projet / espace client | H2 + 3 H3 |
| 9 | Section `4d112419-153c-4a11-77fd-40cc16e39fd6` | `.section.64px-padding.64px-gap.blanc` | FAQ à onglets (CMS) — **copie déliée du composant `faq-section`** | H2 + H3 (CMS) |
| 10 | `[COMP embed-modale]` `db6ccddb-ee7c-aa54-a74a-67d92fd6921a` | — | Modale des cas clients (code embed) | — |
| 11 | `[COMP footer]` `d1220ddf-2c09-baed-309f-e1f2237fd801` (hors `.main-wrapper`) | — | Footer | — |

### Détail

**1 · Hero** `d76b15b1-5ce3-f486-6575-5d5d2934f764`
```
Section<section> .hero-container-section
├─ Block .sticky-div.home  #254240d0-4158-3737-5335-9478252cda27
│  └─ Block .hero-container  #e901c0e9-e383-c49b-f341-e484578dad5c
│     ├─ Block .page-padding.1500px > Block .container.space-between.center.24px-padding > 2× Image .image.union   (séparateur déco)
│     ├─ Block .page-padding.1500px  #9b90c9dc-e692-aaa9-5dff-795d6f791147
│     │  └─ Block .container.space-between.haut.min-32px-gap
│     │     ├─ Block .container.32px-vertical.max-700px
│     │     │  ├─ H1 .primary-text.54px.blanc  #c7dee749-bc35-171b-8b46-bf2d55ebfcf0  « Agence web à Lille pour les PME B2B qui valent mieux que leur image. »
│     │     │  └─ [COMP logo-client] (Variant base)  #59383b0d-4ddb-67d7-a4e3-7d2366283fb8
│     │     └─ Block .container.24px-vertical.452px
│     │        ├─ Link .container.4px-horizontal.center (href="#") > Image .image.16px + Block .secondary-text.14px.blanc « Noté 5/5 par nos clients »
│     │        ├─ Block .secondary-text.14px.blanc.60%  #e817c46e-4ebe-03d0-b2f0-46ea3686fdcd  (intro « Orem est une agence web à Lille… »)
│     │        └─ Block .container.16px-horizontal
│     │           ├─ Link .button.primary.no-max-width « Réserver un appel » (→ /contact)
│     │           └─ Link .button.secondary.no-max-width « Voir nos réalisations »
│     ├─ Block .page-padding.center.64px-padding-haut-bas.hide > Block .container.center.88px-gap.hide-mobile > 6 Image (.200x130px / .150x190px / .200x170px)
│     ├─ Block .page-padding.32px-padding-bas > Block .container.0px-vertical.center.32px-radius.fond-blanc   (showreel à onglets)
│     │  ├─ Block .container.1x5-grid.change-hide > 5× Block .container-showreal[.stroke|.hide] (data-showreel=…) > texte + .ligne-orange
│     │  ├─ Block .container.image-showreel > 5× Image .image.absolute-showreel.{showreel-2025|conception-web|direction-artistique|accompagnement|copywriting}
│     │  └─ Block .container-mobile-change (version mobile, flèches .change-div.gauche/.droite)
│     └─ Block .page-padding.1500px > Block .container.space-between.center.32px-padding-bas.hide-mobile > 2× Image .image.union
└─ Image .image-fond-realisations.home  #1310f1be-26fa-1dc0-966a-c1321f1aa30a  (dégradé de fond)
```

**2 · Cas clients Lille** : composant `case-section-lille` (voir sections.md § P4). Props sur l'instance : Text = « Nos cas clients à Lille » (rendu correctement), Title = « Des marques B2B construites depuis Lille » (**pas rendu** : le H2 du composant est un texte statique « Ne vous fiez plus aux apparences : construisez la vôtre »). La liste est filtrée sur le switch CMS Réalisations `afficher-sur-agence-web-lille` (d'après la description du composant). Rendu constaté : 4 cas (Le Crayon, Huchet Demorge, Logical Conseils, Concilum - Le Recruteur).

**3 · Logos clients** `c109d473-3e3f-169a-33e3-dcd6c0b2fff8`
```
Section .section.64px-haut.32px-bas.12px-gap.gris
├─ Block .page-padding.1030px > Block .container.space-between.center > 2× Image .image.union
├─ Block .page-padding.center  #6bec7c71-6047-eb21-60e0-7133fb98ae68
│  └─ DynamoWrapper .collection-list-wrapper-logo  #c212174c-8800-9e32-af8f-adb92702d85f
│     └─ DynamoList .collection-list-logo > DynamoItem .collection-item-logo > Link .link-block.100%.8px-padding > Image .image.100%.blending (champ CMS)
├─ Block .page-padding.1030px > Block .container.space-between.center.64px-padding-bas > 2× Image .image.union
└─ Block .page-padding.1500px > Block .container.space-between.center > 2× Image .image.union
```
Collection probable : Clients (`6a759a9eecb99463c74ef582`). Les liens sortent vers les sites clients (constaté en HTML). Filtre et tri : à vérifier.

**4 · « L'agence à Lille » (propre à la page)** `78431571-f774-3230-e878-288934e34a78`
```
Section<section> .section.32px-haut.64px-bas.64px-gap.blanc
├─ Block .page-padding  #78431571-f774-3230-e878-288934e34a5f
│  └─ Block .container.space-between.bas
│     ├─ Block .container.16px-vertical.max-550px
│     │  ├─ Block .secondary-text.11px  « L'agence à Lille »                 (sur-titre)
│     │  ├─ H2 .secondary-text.43px  #78431571-f774-3230-e878-288934e34a51  « Une agence web B2B, au cœur de Lille. »
│     │  └─ Block .primary-text.18px.noir-60% > Strong « Nous ne sommes pas une agence généraliste… »
│     └─ Block .container.24px-vertical.max-280px
│        ├─ Block .secondary-text.14px « Siège : 34 Place du Général de Gaulle 59800 Lille » (+ lien Google Maps en HTML)
│        └─ Block .container.4px-horizontal > Block .secondary-text.14px « 07 50 37 15 72 »  (texte, pas de lien tel:)
└─ Block .page-padding  #78431571-f774-3230-e878-288934e34a77
   └─ Block .container.24px-vertical
      ├─ Block .container.gestion-projet  #2e3a3fe6-bb58-1e05-3cd9-9bbaa9ded980
      │  ├─ Block .projet-container.lille-proximite > Image .image.photo-cover (Vieux-Lille)
      │  ├─ Block .projet-container.lille-tissu    > Image .image.photo-cover (Vieille Bourse)
      │  └─ Block .projet-container.lille-zone     > Image .image.photo-cover (Grand'Place aérienne)
      └─ Block .1x3-grid  (data-carousel="bg")  #5a3b6be2-4eb6-486b-7955-3311b43f8c2f
         └─ 3× Block .container.choix.haut (data-visuel="lille-proximite" | "lille-tissu" | "lille-zone")
               ├─ Block .container.8px-horizontal.center > Image .image.union + H3 .primary-text.18px  (« La proximité » / « Le tissu lillois » / « Notre zone d'intervention »)
               ├─ Block .secondary-text.14px.22px-padding (texte)
               └─ Block .ligne-bleue
```
Le bloc reprend la structure « onglets + visuels » de la section 8 (`.gestion-projet` / `.projet-container` / `.1x3-grid` / `.container.choix.haut` avec `data-visuel`). Les combo-classes de visuel ont été créées pour Lille : `lille-proximite`, `lille-tissu`, `lille-zone`.

**5 · Offres** `356c9f75-8d70-8efa-32cc-657e212fbbc6`
```
Section .section.blanc.32px-haut.32px-bas.64px-gap  (data-anim="slide", data-carousel="bg")
├─ Block .page-padding.1500px > séparateur .image.union ×2
├─ Block .page-padding > Block .container.space-between.bas
│  ├─ Block .container.16px-vertical.max-720 > Block .secondary-text.11px.bleu « Nos offres » + H2 .secondary-text.43px « Devenez l'évidence et non le choix par défaut »
│  └─ Block .container.4px-horizontal.center.auto > Link .secondary-text.14px « Ils nous ont notés 5 » + Image .image.16px
└─ Block .page-padding > Block .container.grid.1fr-2fr  #cbda7b6a-b3c7-7a7a-9ca3-48b44851ee0a
   ├─ DynamoWrapper #4fcbd72d-31e0-dee5-903a-749dbaaac52c > DynamoList .Collection List 3 > DynamoItem
   │    └─ Block .container.choix > [Block .container.16px-vertical > (Image .image.union + H3 .primary-text.18px) + Block .secondary-text.14px.22px-padding.hide] + Link .secondary-text.14px.22px-padding.tablette « Découvrir l'offre » + Block .ligne-bleue
   └─ Block .container.fond-expertises > 4× BackgroundVideoWrapper .image.100%.cover.{conseil|image-de-marque|site-web|evolution}
```
Collection : Offres (`6a9138262200aeae4011d357`). 4 éléments rendus (Conseil, Image de marque, Site web, Évolution) ; l'offre SEO n'apparaît pas. Filtre : à vérifier.

**6 · Avis** : `[COMP avis-section]` (voir sections.md § P6).

**7 · Méthode O.R.E.M.** `a72fc657-4619-fef9-b274-40ff34f5f20c`
```
Section .section.noir.32px-haut
├─ Block .page-padding.1500px > séparateur
├─ Block .page-padding.1500px > Block .container-black.full
│  ├─ Block .container-black.940px > Block .container.180px-hauteur + Block .secondary-text.14px.orange « La méthode O.R.E.M. » + BackgroundVideoWrapper .image.280x280px + H2 .primary-text.27px.blanc.center.max-700px
│  ├─ Block .container-black.1000px.gauche  > Block .container.methode-orem > [.container.358px-hauteur > Image] + [.container.16px-vertical > H3 .primary-text.34px.blanc « Orienter » + Block .primary-text.18px.blanc-60%] + Image .image.absolute.100%-vh (lettre)
│  ├─ Block .container-black.1000px         > … « Représenter »
│  ├─ Block .container-black.1000px.droite  > … « Exécuter »
│  └─ Block .container-black.1600px         > … « Mesurer »
└─ Block .page-padding.1500px > Block .container.space-between.center.32px-padding > séparateur
```

**8 · Gestion de projet** `24f47c06-4b34-b297-6db9-708dadd57aab` : même gabarit que la section 4 (en-tête `.container.space-between.bas` avec sur-titre « Gestion de projet », H2 « Un suivi clair, à chaque étape. », paragraphe en `Strong`, citation client à droite), puis `.container.gestion-projet` > 3 `.projet-container.{suivi|tableau-de-bord|rapport}` (2 images `.image.projets-grand-1` / `.projets-petit-1`), puis `.1x3-grid` (data-carousel="bg") avec 3 `.container.choix.haut.{suivi|tableau-de-bord|rapport}` et 3 H3.

**9 · FAQ** `4d112419-153c-4a11-77fd-40cc16e39fd6` (copie déliée de `faq-section`)
```
Section .section.64px-padding.64px-gap.blanc
├─ Block .page-padding.1500px > Block .container.64px-vertical.center
│  ├─ H2 .primary-text.34px.center  #4152a55d-6d98-1226-e46f-54938883d9da  « Vos questions sur notre agence web à Lille. »
│  └─ Block .1x2-grid.128px-gap
│     ├─ Block .container.24px-vertical.center > TabsWrapper .tabs
│     │  ├─ TabsMenu .tabs-menu > 3× TabsLink .tabs-link (« Fit », « Approche », « Déroulé »)
│     │  └─ TabsContent .tabs-content > TabsPane .tab-pane-1 / .tab-pane-2 / .tab-pane-3
│     │       └─ DynamoWrapper .collection-list-wrapper-faq > DynamoList .collection-list-faq > DynamoItem .collection-item-faq
│     │            └─ Block .container-faq.100%-vw.24px
│     │               ├─ Block .space-between-div.haut
│     │               │  ├─ Block .container-faq.vertical.0px.gauche.auto
│     │               │  │  ├─ Block .space-between-div.haut.16px-gap.faq > H3 .secondary-text.22px (question CMS) + Block .mini-container.24px > Image .image.12px
│     │               │  │  └─ Block .Div > RichText .secondary-text.14px.60%.16px-margin (réponse CMS)
│     │               │  └─ Block .container-faq.100%VH.Haut
│     │               └─ Block .Texte.Police Secondaire.20px.80%.Hide « Q : Combien de temps… » (texte statique résiduel)
│     └─ Link .link-faq.612px  #4152a55d-6d98-1226-e46f-54938883dabb > Image .image.absolute.100%.cover + [COMP Animation Button CTA] (Variant 83c1c303-19c2-0196-6ca4-89b0b1adfec9)
└─ Block .page-padding.1500px > séparateur
```
Collection : FAQ (`6a759b4141528d216986a56e`). Champ dédié : switch `afficher-sur-agence-web-lille` (« Activé = la question apparaît dans la FAQ de la page /agence-web-lille »). Filtre exact de chaque onglet (switch + `categorie-faq`, probablement) : à vérifier dans le Designer. Rendu constaté : 11 questions.

### Hiérarchie des titres (HTML publié)
H1 (1) → H2 « Ne vous fiez plus aux apparences… » (cas) → H3 ×4 (cas) → H2 « Une agence web B2B, au cœur de Lille. » → H3 ×3 → H2 « Devenez l'évidence… » → H3 ×4 (offres) → H2 « Quatre lettres… » → H3 ×4 → H2 « Un suivi clair… » → H3 ×3 → H2 FAQ → H3 ×11. Le H1 est unique et aucun niveau n'est sauté.

### Problèmes
1. **Prop `Title` non câblée** dans `case-section-lille` (comme dans `case-section`) : le H2 de cette section reste générique et identique à celui de l'accueil.
2. **Contenu dupliqué avec l'accueil** : les sections 3, 5, 6, 7 et 8 sont des copies (mêmes id, mêmes textes) et non des composants. Seuls le H1, l'intro, la section 4 et la FAQ sont propres à Lille.
3. La FAQ est une **copie déliée** de `faq-section` (le H2 a été modifié directement). Toute évolution du composant ne s'y propagera pas.
4. Chaque item de FAQ contient un texte statique masqué (`.Texte.Police Secondaire.20px.80%.Hide`, « Q : Combien de temps faut-il… ») : c'est un résidu.
5. Blocs masqués dans le hero : `.page-padding.center.64px-padding-haut-bas.hide` (6 images) et `.container-showreal.hide`. Leur masquage est responsive (règles `.hide` dans des media queries) ; ces images sont quand même chargées.
6. Toutes les images sont en `loading="lazy"`, y compris dans le hero (LCP).
7. Liens morts ou faibles : « Noté 5/5 par nos clients » (`href="#"`) ; téléphone sans lien `tel:` ; footer « LinkedIn Orem » sur `#`.
8. `Strong` sert à mettre en forme des paragraphes entiers (sections 4, 7, 8). Il y a un élément vide (saut de ligne) dans le bloc adresse.
9. Classes génériques : `Collection List 3`, `Div`. Les états vides « No items found. » sont laissés par défaut.
10. 6 vidéos d'arrière-plan et environ 210 images sur une seule landing page.
11. La FAQ JSON-LD est saisie en dur : elle doit être resynchronisée à la main si les questions CMS changent.
12. La page n'est liée que depuis le footer.

---

## 2. Accueil `/` — `6a7582333b9ddd4a77302d08`

- SEO : title `Agence Branding & Web B2B | PME Ambitieuses | Orem` · description `Orem accompagne les PME B2B en branding, création de site web Webflow et conseil stratégique. Agence à Lille et Paris.` · OG image `6a86dc7f73d8efed9748266f` · nom de page « Accueil - Orem ».
- JSON-LD : `Organization` `#organization` (adresse, `aggregateRating` 5/5 sur 9 avis, 9 `Review` en dur, `hasOfferCatalog` de 5 offres dont `/offres/seo`, logo, `sameAs` = pages membres, `legalName` ICONOKOM SARL, `foundingDate` 2023) + `BreadcrumbList`. C'est l'entité de référence (`#organization`) des autres pages.
- Plan (identique à Lille, sauf les points indiqués) :
  0. Section `.Navbar Logo Left` `5bfc9d1c-afac-cd73-40fc-14d554ff6226` > `new-menu-container`
  1. Hero `d76b15b1-5ce3-f486-6575-5d5d2934f764` : H1 `c7dee749-…-cfd0` « Nous aidons les entreprises ambitieuses à aligner leur image avec leur niveau réel. »
  2. `[COMP case-section]` `849481a4-7c3d-6aa3-c13e-b49829cd3da4` (Title en override, mais non câblé). Filtre probable : switch `afficher-sur-la-page-d-accueil` et tri par `ordre` (à vérifier). 9 cas rendus.
  3. Logos `c109d473-3e3f-169a-33e3-dcd6c0b2fff8`
  4. Offres `356c9f75-8d70-8efa-32cc-657e212fbbc6`
  5. `[COMP avis-section]` `2f8c8330-4c95-e348-14bf-5f85110b745c`
  6. Méthode `a72fc657-4619-fef9-b274-40ff34f5f20c`
  7. Gestion de projet `24f47c06-4b34-b297-6db9-708dadd57aab`
  8. `[COMP faq-section]` `4d112419-153c-4a11-77fd-40cc16e39fd6` (Variant `83c1c303-19c2-0196-6ca4-89b0b1adfec9`) : H2 « Tout ce que vous voulez savoir (et plus encore). », 15 H3
  9. `embed-modale` `db6ccddb-…-921a`, puis `footer`
- Titres : 1 H1, 6 H2, 34 H3. Hiérarchie correcte.
- Problèmes : les mêmes que Lille aux points 1, 4, 5, 6, 7, 9 et 10 ; 7 vidéos ; 233 images, toutes en lazy.

## 3. Contact `/contact` — `6a7ed06a2e5bb1e23693d292`

- SEO : `Contact | Agence Branding & Web | Orem` / `Contactez Orem pour un devis gratuit. Agence branding et web B2B à Lille. Tél. 07 50 37 15 72.` · JSON-LD `ContactPage` + Breadcrumb.
- Plan :
  - `[COMP new-menu-container]` `d043b354-9335-9bf3-2d4d-c0844f9bfe56`
  - Section `.hero-container-section.noir` `de49e0e2-ac11-9cea-ad64-ed3565d322b3` > Block `.hero-container.static.0px-gap` > séparateur + Block `.page-padding` > Block `.1x2-grid.contact` `35c711f8-57cc-7db2-2bde-543196503605`
    - colonne gauche `.container.space-between.vertical.contact` : témoignage (Block `.primary-text.34px.blanc`), auteur (Image `.image.40px-rond` + noms), « Ils nous ont fait confiance » + `[COMP logo-client]` `66dd6060-fae9-6648-c0b3-76bee6740c85`
    - colonne droite `.container.space-between.vertical.contact.inverse` > `.form-container` > H1 `.secondary-text.14px.orange.absolute` `e52c00fe-9f43-bd41-cbed-5b0729fd4bf2` « Parlons de votre projet » > TabsWrapper `.swap-container` (2 TabsLink contenant des **HtmlEmbed** d'icônes `.embed-mail`/`.embed-form`) > Pane 1 = formulaire, Pane 2 = HtmlEmbed `.iclosed-embed` (agenda iClosed)
    - Image `.image.100%-absolute` (fond)
  - `[COMP footer]` `20c06a89-eead-dffa-3793-b35b17eb5d4b` **à l'intérieur** de `.main-wrapper` (ailleurs, il est à l'extérieur)
- Formulaire : FormWrapper `.contact-form` `4e153c82-5d2c-0182-9f9b-88cd3e0cd9f3`, FormForm `.form` `4e153c82-5d2c-0182-9f9b-88cd3e0cd9f4` (attributs `id="email-form"`, `data-form-name="Contact"`, nom Webflow « Email Form », **method GET**, pas de redirection). Champs : `Nom`* (text), `Entreprise`* (text), `Téléphone` (tel), `Email`* (email), `Field`* (textarea, label « Votre message »), bouton `.submit-button`. Les messages de succès et d'erreur existent (le message d'erreur est resté en anglais par défaut : « Oops! Something went wrong… »).
- `list_forms` : 3 enregistrements « Email Form » (`6aa25c4993f6d311b7df7116`, `6aa25c4993f6d311b7df710e`, `6a7ed92b52b4fd2729b821ca`). Tous ont le même `formElementId`, `4e153c82-5d2c-0182-9f9b-88cd3e0cd9f4` ; ils correspondent à 3 `siteDomainId` différents. Il n'y a **qu'un seul formulaire** sur tout le site : aucun formulaire sur /agence-web-lille ni sur les offres (la conversion passe par iClosed et /contact).
- Problèmes : le H1 est stylé comme un sur-titre de 14 px (faible poids SEO) ; le champ message s'appelle `Field` ; les placeholders contiennent des données réelles (téléphone, email) ; method GET ; le message d'erreur est en anglais ; des icônes en HtmlEmbed ; le footer est mal placé.

## 4. À propos `/a-propos` — `6a7dd249b00b230647bf6d02`

- SEO : `À Propos | Agence Branding & Web | Orem` · JSON-LD `AboutPage` + 3 `Person` (`membres/{slug}#person`) + Breadcrumb.
- Plan :
  - `new-menu-container` `d1895a5c-976e-f0d8-c37b-5602e66275e8`
  - Hero `.hero-container-section.à-propos` `de49e0e2-ac11-9cea-ad64-ed3565d322b3` > `.sticky-div.à-propos` > `.hero-container.static.64px-gap` : séparateur, `.container.600px-hauteur.exclusion` (sur-titre « Qui sommes-nous », H1 `08aebaf3-3883-6c7c-e125-d7f4308c77db` « Une conviction simple. » `.primary-text.54px.16px-padding-bas.blanc.center`, texte), `[COMP Animation Button CTA]` `99c9f160-…` (Variant `47d716ba-c346-7392-4bdb-7cc7e07f3db0`) ; Image `.image-fond-realisations.à-propos` ; Block `.page-padding.1500px.absolute.image-a-propos` (4 photos absolues)
  - Section `.section.128px-haut.32px-bas.64px-gap.blanc` `49f5c985-e925-0428-9447-b7943ae762c0` : H2 `.secondary-text.14px.bleu` « Qui sommes-nous » + manifeste (Block `.primary-text.27px.max-600px`, paragraphes séparés par des sauts de ligne et des `‍`)
  - Section `.section.noir.32px-haut.64px-bas.64px-gap` `61e19510-307a-29f8-7342-344b7d8ef341` : H2 « Rencontrez l'équipe d'Orem » + liste CMS Membres (`.collection-list-wrapper-membres`, Link avec `data-modal-trigger`)
  - Section `.section.32px-haut.64px-bas.32px-gap.128px-padding-bas` `733c846a-3f4a-a778-c87e-87b95fce3f55` : H2 « Nos partenaires de confiances » + liste CMS Partenaires (`.collection-list-wrapper-partenaires`, H3 `.primary-text.27px.tablette`, `data-partner-*`) + H2 « Notre sélection de clients » + liste de logos (`.collection-list-wrapper-logo.64px-padding` / `.collection-list-logo.flex-libre`)
  - `embed-modale` `9b21c23e-…`, `footer` `acab33e4-…`
- Problèmes : un H2 sert de sur-titre (« Qui sommes-nous », 14 px, doublon du sur-titre du hero) ; faute « Nos partenaires de confiances » ; texte espacé par des paragraphes `‍` ; les images CMS des membres et partenaires n'ont pas d'alt visible dans le Designer (liaison à vérifier).

## 5. Réalisations `/realisations` — `6a7dbf0e2ec203e57f8e7e44`

- SEO : `Réalisations | Projets Branding & Web | Orem` · JSON-LD `CollectionPage` + `ItemList` de **8 réalisations en dur** (le sitemap en compte 16).
- Plan :
  - `new-menu-container` `705bac3c-958c-79e7-06df-2101ee8999c2`
  - Hero `.hero-container-section.blanc` `de49e0e2-ac11-9cea-ad64-ed3565d322b3` > `.sticky-div.realisations` > `.hero-container.realisations` (H1 `de49e0e2-…-d322bd` `.primary-text.54px` « Une image qui reflète enfin toute la valeur de votre business. », `[COMP logo-client (couleur)]` `14df5f7c-…`, note 5/5, texte, CTA `.button.black.full-16px-padding` + `.button.secondary.inverse.no-max` (ancre vers la section)) ; Image `.image-fond-realisations`
  - **Section imbriquée dans le hero** : `.section.128px-haut.64px-gap.noir` `de49e0e2-ac11-9cea-ad64-ed3565d322f8` (id HTML `realisations`) : liste CMS Réalisations `.collection-list-wrapper-realisations` / `.collection-list-realisations` (id `real`) / Link `.container.24px-vertical.real` (`data-modal-trigger`, `data-shadow-color`) > image + **H2 statique « Voir le cas d'étude »** + texte ; puis FAQ **variante sombre** inline (`.page-padding.128px-padding-haut.64px-padding-bas.64px-gap.1500px`, H2 `.primary-text.34px.center.blanc`, onglets « Projets / Résultats / Suite », `.tabs-menu.inverse`, `.tabs-link.fond-noir`, H3 `.secondary-text.22px.blanc`, `.link-faq.612px` avec `Animation Button CTA` Variant base)
  - `embed-modale`, `footer`
- Problèmes : **15 H2 identiques « Voir le cas d'étude »** (il faudrait le nom du cas en H2 ou H3) ; une section imbriquée dans une section ; la FAQ est une copie non composant ; l'ItemList JSON-LD est figée.

## 6. Blog `/blog` — `6a8d70816ca55fc30856706e`

- SEO : `Blog | Branding, Web & Positionnement | Orem` · JSON-LD `Blog` + Breadcrumb.
- Plan : `new-menu-container` `a36f1847-…` ; hero `.hero-container-section` > `.sticky-div.realisations.blog` > `.hero-container.blog` (H1 `.primary-text.54px` « Nous créons des sites Webflow, qui pitchent mieux que vous. » + filtres Finsweet `.blog-filters` [`fs-list-element="filters"`], radios catégorie/auteur générés par 2 listes CMS) ; Image `.image-fond-realisations.blog` ; Section `.section.64px-padding.128px-padding-bas-more.blanc` `bdb7803e-cd2f-95d9-9af1-470028161a44` > `.page-padding` > `.1x3-grid.blog` : liste Articles (`.collection-list-wrapper-article` / `.collection-list-article` [`fs-list-element="list"`] / Link > image + H2 `.primary-text.18px` + catégorie [`fs-list-field="category"`] + auteur) + `.ligne.vertical` + barre latérale des posts LinkedIn (`.li-sidebar`, DynamoList `Collection List 2`, classes `li-*`) ; `footer`. Pas d'`embed-modale`.
- Problèmes : le H1 ne parle pas du blog (c'est un slogan Webflow) ; 7 images sans alt (avatars et images des posts LinkedIn du CMS) ; classe générique `Collection List 2`.

## 7. 404 — `6a8440b8701d33ef3ee85a8f`

- SEO : `Page introuvable | Orem`, pas d'image OG, pas de JSON-LD.
- Plan : `[COMP menu-404]` `a316f560-382e-6c18-72d8-746e4397f242` ; Section `.p404-hero` `5122babd-cce6-00ca-fe37-5aa937e55012` (Image `.p404-bg`, `.p404-inner` > `.p404-code` (spans `.p404-digit`, `.p404-zero`), `.p404-kicker`, H1 `.p404-title` « Cette page s'est perdue en chemin. Vous, pas encore. », Paragraph `.p404-lead`, `.p404-actions` avec 2 boutons `.button.primary/.secondary.no-max-width` vers `/` et iClosed) ; `[COMP embed-modale]` `ccb1fdb6-…`. Pas de footer.
- La page a son propre système de classes (`p404-*`), en dehors du système `section` / `page-padding` / `container`.

## 8. Mentions légales — `6aa101708e5d116637e95981` · Politique de confidentialité — `6aa1051b9391937330e82204`

- SEO : `Mentions Légales | Orem` et `Politique de Confidentialité | Orem` ; JSON-LD `WebPage` + Breadcrumb ; **exclues du sitemap** (choix volontaire, probablement).
- Plan (mentions, d'après l'API ; politique, d'après le HTML, avec les mêmes classes) : `new-menu-container` ; Section `.hero-container-section` `308595d8-5da5-f43f-14e8-2c29456015b4` > `.sticky-div.realisations.blog` > `.hero-container.blog` > séparateur + Block `.page-padding.64px-padding-bas.mobile.center` > **RichText `.rich-text`** `f1e3788b-012f-0596-36c2-0567541ca2bd` (H1 + H2/H3 numérotés + paragraphes) ; Image `.image-fond-realisations.blog` ; `footer`.
- Problèmes : tout le contenu est dans le hero (pas de section de contenu) ; de nombreux paragraphes vides `‍` servent d'espacement ; les listes sont faites de « - » et de sauts de ligne au lieu de vraies `<ul>`.

## 9. Templates CMS (résumé)

- **Offres** `6a9138272200aeae4011d3c7` (gabarit des pages services) :
  - `new-menu-container` ; Section hero `.hero-container-section` `4164ddad-4776-7b75-bd4c-39257c9bc588` > `.sticky-div.realisations.blog` > `.hero-container.blog` > `.page-padding.1500px` > `.1x2-grid.0.9fr` (H1 CMS `c968810c-c83c-21b5-52ab-a71f39dc6976` `.primary-text.54px`, CTA « Réserver un appel » / « Voir nos réalisations », vidéo `.container.video-offres`) + **section imbriquée** `.section.64px-padding.64px-gap` `ba9ba095-6233-5c9c-de27-b0c8125fe89d` (sticky « Vos problématiques » + H2 CMS + liste `.collection-list-wrapper-pb-clients` de cartes `.pb-clients-card` avec H3)
  - Section `.section.noir.32px-haut` `2e8c11cb-1bab-db16-8c92-6e000cf12987` : carte `.glass-card` (« Notre Solution », H2 CMS, CTA `.button.blanc`) + en-tête « Détail / Contenu de l'offre » + liste `.collection-list-wrapper-cases` de `.problematique-card` (H3)
  - Section `.section.#f8f8f7` `07b0790c-f558-821d-3d7c-71df794f8358` : process (`.process-container`, `.process-heading`, Paragraph `.process-eyebrow`, H2 `.process-title` « Une méthode claire », liste `.process-grid` de `.process-card` avec H3)
  - `[COMP avis-section]` `993cbab1-07b5-56cb-3f87-9f1c1b5b49e9`, `[COMP case-section]` `1d7cefa8-e79b-24f8-ad30-1b05c711839b`
  - FAQ inline `c53e74d0-a1a0-61a4-0a1f-6151ded1c60f` (même arbre que `faq-section`, H2 statique, onglets filtrés sur `offre-liee` et `onglet-offre`, à vérifier), `embed-modale`, `footer`
  - Sur /offres/site-web : 1 H1, 6 H2 et 40 H3 en tout.
- **Réalisations** `6a759af703d4ca7e4b686bbf` : 0 élément Section (la mise en page repose sur des Blocks). Composants : `new-menu-container` `04394165-cf4a-563d-d37c-11416a0bf36e`, `[COMP case-section]` `6337e2dd-dc4f-826c-470c-47ee160d1cea` (props par défaut) et `footer` `d89bef79-570d-cc30-e9a5-9325e01e7ee0`. Titres dans le Designer : H1 `4e75240f-7ecb-3840-51a0-4dc194954779` `.primary-text.34px`, et 2 H2 `.secondary-text.14px` (« Problématique », « Contexte » : des sur-titres balisés en H2). Sur /realisations/le-crayon, le `case-section` (H2 + 9 H3) est rendu **avant** le H1 dans le HTML : l'ordre des titres est inversé.
- **Articles** `6a759b5e8c6a9cdbe2787bc9` : Section `.hero-container-section.blanc` `ab6bdf27-b868-ff3c-3caf-82d30bfb82a1` + Section `.section` `ab6bdf27-b868-ff3c-3caf-82d30bfb82cd` ; composants `new-menu-container` `47acb428-…` et `footer` `84d23b7b-…` (pas d'`embed-modale`, pas de HtmlEmbed). Titres statiques : H1 `f0160ce3-63f8-ea26-18fb-3032b533c408` `.primary-text.54px.blanc`, 4 H2 `.primary-text.27px`, 1 H3 `.secondary-text.22px`, plus les titres du RichText. Sur l'article testé : 26 titres, 5 images sans alt.
- **Membres** `6a759ac144dc0178f0b2fc7b` : H1 = nom, H2 « Cofondateur / Compétences / Projets », 2 images sans alt. Aucun lien vers `/agence-web-lille` trouvé dans le HTML de `/membres/louis-montagne`.

## 10. Synthèse des problèmes transverses (par priorité)

1. Props `Title` de `case-section` et `case-section-lille` non câblées : H2 identique sur toutes les pages.
2. Les sections FAQ, Offres, Méthode, Gestion de projet et Logos sont dupliquées par copie (accueil, Lille, offres, réalisations) au lieu d'être des composants. `faq-section` n'a qu'une seule instance liée (accueil).
3. Toutes les images sont en `lazy`, y compris dans le hero (LCP).
4. H2 répétés « Voir le cas d'étude » (/realisations) ; H2 utilisé comme sur-titre (/a-propos) ; H1 de 14 px (/contact) ; H1 hors sujet (/blog) ; H2 avant le H1 (template Réalisations).
5. Résidus : blocs `.Hide` « Q : Combien de temps… » dans chaque FAQ, « No items found. », classes `Div`, `Collection List 2/3`, `#f8f8f7`, paragraphes `‍`.
6. JSON-LD en dur (FAQ Lille, ItemList Réalisations, Reviews accueil) qui ne suit pas le CMS.
7. Liens `#` (LinkedIn, note 5/5, © 2026) ; téléphone non cliquable ; `/agence-web-lille` et `/offres/seo` absents du menu.
8. Formulaire unique en GET, avec un champ `Field` et un message d'erreur en anglais.
9. Poids : environ 48 ko de code dans le `<head>`, 6 à 7 vidéos sur les grandes pages, plus de 200 images.
