# CMS Webflow — site Orem (agence-orem.fr)

Audit en lecture seule réalisé le 2026-10-21 via l'API Webflow (MCP). site_id `6a7582303b9ddd4a77302cc8`, locale unique FR (cmsLocaleId `6a759a9eecb99463c74ef573`).

Conventions de ce document :
- Les **slugs API** (colonne « slug API ») sont les clés à utiliser dans `fieldData` pour les écritures et les bindings. Ils diffèrent souvent du nom affiché (ex. `citatio`, `categorie-2`, `page-2`, `texte-hero-2`).
- Chaque collection a les champs système `name` (PlainText, requis, max 256) et `slug` (requis, alphanumérique + tirets). Ils ne sont rappelés que si leur nom affiché est personnalisé.
- **Aucun groupe de champs** (field groups) n'est défini sur aucune des 19 collections (`fieldGroups: []`).
- Les valeurs d'option (type `Option`) s'écrivent avec l'**id d'option**, pas le libellé.
- « brouillon » = `isDraft: true` ; « archivé » = `isArchived: true`.

---

## 1. Vue d'ensemble

| Collection | id | slug | Template publié ? (URL) | Items (dont brouillons / archivés) | Rôle (déduit) |
|---|---|---|---|---|---|
| Clients | `6a759a9eecb99463c74ef582` | `clients` | Non | 28 (4 / 0) | Logos clients (bandeau logos, hero), cible des réf. Réalisations/Témoignages |
| Compétences | `6a759a9f35fcd2e49d947289` | `competences` | Non | 17 (0 / 0) | Tags de compétences des membres |
| Prestations | `6a759aa0e2aa3976fe4c1343` | `prestations` | Non | **0** | Vide — héritage, référencée seulement par Services (vide aussi) |
| Membres | `6a759ac144dc0178f0b2fc75` | `membres` | **Oui** (`/membres/[slug]`) | 3 (0 / 0) | Équipe + auteurs du blog et des posts LinkedIn |
| Services | `6a759adf6dc08f46cfb5f991` | `services` | Non | **0** | Vide — remplacée de fait par Offres |
| Réalisations | `6a759af703d4ca7e4b686bb9` | `realisations` | **Oui** (`/realisations/[slug]`) | 16 (1 / 0) | Études de cas clients |
| Témoignages | `6a759b2503d4ca7e4b687b21` | `temoignages` | Non | 9 (0 / 0) | Citations clients |
| FAQ | `6a759b4141528d216986a56e` | `faq` | Non | 107 (0 / 0) | Questions/réponses : accueil, réalisations, offres, /agence-web-lille, articles |
| Articles | `6a759b5e8c6a9cdbe2787bc3` | `articles` | **Oui** (`/articles/[slug]`) | 6 (0 / 0) | Blog |
| Partenaires | `6a7eb44fdec3a47e625d5d18` | `partenaires` | Non | 4 (0 / 0) | Réseau de freelances partenaires (liste avec photo au survol) |
| Catégories | `6a7ee1c1ca14fc2bb3b4ad0c` | `categories` | Non | 4 (0 / 0) | Catégories du blog |
| Visuels | `6a83065ad666a6023e699ccb` | `visuels` | Non | 372 (50 / 21) | Galerie image/vidéo de chaque Réalisation |
| Problématiques clients | `6a91380f2ffa2d065f3eb82f` | `problematiques-clients` | Non | 28 (0 / 0) | Section « problème » des pages Offres |
| Étapes du process | `6a9138102ffa2d065f3eb8a8` | `etapes-du-process` | Non | 30 (0 / 0) | Section « méthode » des pages Offres |
| Offres | `6a9138262200aeae4011d357` | `offres` | **Oui** (`/offres/[slug]`) | 5 (0 / 0) | Pages offres (Conseil, Image de marque, Site web, Évolution, SEO) |
| Contenu concret | `6a9139d725327b36a89bad77` | `contenu-concret` | Non | 37 (0 / 0) | Liste « ce que contient l'offre » (avec icône) |
| Aspects business | `6a9139d7dda3f5c16113a1c3` | `aspects-business` | Non | 37 (0 / 0) | Bénéfice business associé à chaque Contenu concret |
| Posts LinkedIn | `6a9859cec71a573e1fe4467e` | `posts-linkedin` | Non | 6 (3 / 0) | Posts LinkedIn de l'équipe affichés sur le site |
| Catégories FAQ | `6aa101739b73bafc27c7a793` | `categories-faq` | Non | 13 (0 / 0) | Onglets/regroupements de la FAQ |

Total : 19 collections, 722 items.

### Sitemap (collections à template publié)

| Collection | Items inclus dans le sitemap (staged) | Exclus |
|---|---|---|
| Offres | 5/5 | — |
| Réalisations | 16/16 (live : 15/15, Sleepee n'est pas publié) | — |
| Articles | 6/6 (vérifié item par item, la liste globale renvoyait 429) | — |
| Membres | 2/3 | **`clement-saint-hilaire`** (`includeInSitemap: false`) |

---

## 2. Carte des relations

Format : `Collection.slug-du-champ` → collection cible (`Reference` = simple, `MultiReference` = multiple).

```
Offres
├── problematiques-clients  (Multi) → Problématiques clients
├── etapes-du-process       (Multi) → Étapes du process
├── contenu-concret         (Multi) → Contenu concret
│                                       └── aspect-business (Ref) → Aspects business
├── aspects-business        (Multi) → Aspects business
│                                       └── contenu-concret (Ref) → Contenu concret   [vide partout]
├── faq-associee            (Multi) → FAQ
└── temoignages-associes    (Multi) → Témoignages                  [vide partout]

FAQ
├── categorie-faq (Ref) → Catégories FAQ
├── offre-liee    (Ref) → Offres
├── article-liee  (Ref) → Articles
└── categorie-2   (Ref) → Catégories (blog)                        [vide partout]

Articles
├── auteur      (Ref, requis) → Membres
└── categorie-3 (Ref, requis) → Catégories
Catégories
└── articles-lies (Multi, requis) → Articles                       [vide partout]

Réalisations
├── client            (Ref, requis) → Clients
├── membres-impliques (Multi)       → Membres
└── services-concernes (Multi)      → Services                     [vide partout ; Services vide]
Visuels
└── realisation (Ref, requis) → Réalisations

Témoignages
└── client (Ref, requis) → Clients

Membres
└── competences (Multi) → Compétences
Compétences
└── membres     (Multi) → Membres            (relation doublée dans les deux sens)

Posts LinkedIn
└── auteur (Ref, requis) → Membres

Services
└── prestations-incluses (Multi) → Prestations   [les deux collections sont vides]

Isolées (aucune référence entrante ni sortante) : Partenaires.
Clients : référencée uniquement (Réalisations, Témoignages).
```

Contrôle des références : **aucune référence orpheline** (tous les ids pointés existent). Une référence pointe vers un item **brouillon** : Réalisation `orem` (publiée) → Client `orem` (brouillon).

---

## 3. Détail par collection

### 3.1 Clients — `clients`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Logo | `logo` | Image | oui | |
| Logo blanc | `logo-blanc` | Image | non | |
| Site web | `site-web` | Link | non | |
| Ordre | `ordre` | Number (entier, négatif autorisé) | non | « Ordre d'affichage des logos (croissant : 1 en premier) » |
| Afficher dans la section logos clients | `afficher-le-logo` | Switch | non | « Activer pour afficher ce logo dans la section clients » |
| Afficher dans la hero | `afficher-dans-la-hero` | Switch | non | « Activer pour afficher ce logo dans la hero section » |

Items (28) :
- Sleepee by tim — `sleepee-by-tim` *(brouillon)*
- Orem — `orem` *(brouillon)*
- MTC Nord — `mtc-nord`
- Hôtel Eiffel Ségur — `hotel-eiffel-segur`
- Jean-François Badias — `jean-francois-badias`
- Club Casa Zanoni — `club-casa-zanoni`
- Concilium – Le Recruteur — `concilium-le-recruteur`
- DimSum — `dimsum`
- Bund Médias — `bund-medias`
- SforSales — `sforsales`
- Huchet Demorge — `huchet-demorge`
- Valere Avocats — `valere-avocats`
- Aktionnaire — `aktionnaire`
- Creative Group — `creative-group`
- Serenitine — `serenitine`
- Les Ombres — `les-ombres`
- Culinary Agency — `culinary-agency`
- H19 — `h19`
- SEKENTIEL — `sekentiel` *(brouillon)*
- Impulsions Métropole Sud — `impulsions-metropole-sud`
- Financière Saint Matthieu — `financiere-saint-matthieu` *(brouillon)*
- Logical Conseils — `logical-conseils`
- Creative Balance — `creative-balance`
- 24 Degrés — `24-degres`
- JUWA — `juwa`
- Jared — `jared`
- Le Crayon — `le-crayon`
- RISKINTEL — `riskintel`

Points d'attention :
- 3 brouillons sans logo alors que `logo` est requis : `orem`, `sekentiel`, `financiere-saint-matthieu` (ne pourront pas être publiés en l'état).
- `orem` est brouillon mais référencé par la Réalisation publiée `orem`.
- `h19` : `logo-blanc` pointe vers le **même fichier** que `logo` (pas de version blanche).
- `afficher-dans-la-hero` vaut `null` (et non `false`) sur 16 items publiés ; seuls 8 sont à `true` : `le-crayon`, `riskintel`, `logical-conseils`, `huchet-demorge`, `aktionnaire`, `sforsales`, `dimsum`, `24-degres`.
- `ordre` : 1 à 24 sans doublon sur les 24 publiés ; vide sur les 4 brouillons.
- Alt présents sur tous les logos.

### 3.2 Compétences — `competences`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Membres | `membres` | MultiReference | non | → Membres |

Items (17, tous publiés) : UX Writing — `ux-writing` · Communication — `communication` · Copywriting — `copywriting` · Positionnement — `positionnement` · GEO — `geo` · SEO — `seo` · Intelligence artificielle — `intelligence-artificielle` · Automatisation — `automatisation` · Webflow — `webflow` · Logo design — `logo-design` · Typographie — `typographie` · Photographie — `photographie` · Light motion design — `light-motion-design` · Direction artistique — `direction-artistique` · Design graphique — `design-graphique` · UX Design — `ux-design` · UI Design — `ui-design`

Points d'attention :
- Relation doublée : `competences.membres` et `membres.competences` doivent être tenus à jour **des deux côtés** (Webflow ne synchronise pas). Actuellement cohérents.

### 3.3 Prestations — `prestations`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Description | `description` | RichText | oui | |

Items : **aucun**.

Points d'attention : collection vide, seulement référencée par Services (vide). Candidate à suppression après vérification qu'aucune page ne la lie.

### 3.4 Membres — `membres` (template publié `/membres/[slug]`)

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Poste | `poste` | PlainText | oui | |
| Bio | `bio` | RichText | oui | |
| Photo | `photo` | Image | oui | |
| Compétences | `competences` | MultiReference | non | → Compétences |
| Ordre | `ordre` | Number (entier ≥ 0) | non | |
| Description courte (Auteur blog) | `description-courte-auteur-blog` | PlainText (multiligne) | oui | Bloc auteur des articles |
| SEO Titre | `seo-titre` | PlainText | non | |
| SEO Meta Description | `seo-meta-description` | PlainText | non | |

Items (3, tous publiés) :
- Louis Montagne — `louis-montagne` (ordre 1, id `6a759dc235fcd2e49d94f708`)
- Théophile Lamouret — `theophile-lamouret` (ordre 2, id `6a759dc235fcd2e49d94f70a`)
- Clément Saint-Hilaire — `clement-saint-hilaire` (ordre 3, id `6a759dc235fcd2e49d94f70c`)

Points d'attention :
- **`clement-saint-hilaire` exclu du sitemap** alors que les deux autres y sont.
- Tous les champs remplis, SEO et alt présents.
- `description-courte-auteur-blog` de Clément se termine par un saut de ligne parasite.
- Bios en RichText contenant de nombreux paragraphes vides `<p>‍</p>` (caractère zero-width) utilisés comme espacement.

### 3.5 Services — `services`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Image de couverture | `image-de-couverture` | Image | oui | |
| Description | `description` | RichText | oui | |
| Prestations incluses | `prestations-incluses` | MultiReference | non | → Prestations |

Items : **aucun**.

Points d'attention : collection vide, mais référencée par `realisations.services-concernes` (vide partout). Fonction reprise par Offres.

### 3.6 Réalisations — `realisations` (template publié `/realisations/[slug]`)

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Client | `client` | Reference | **oui** | → Clients |
| Image de couverture | `image-de-couverture` | Image | non | |
| Problématique | `problematique` | RichText | non | |
| Contexte | `contexte` | RichText | non | |
| Statistique 1 - Valeur | `statistique-1---valeur` | PlainText | non | **3 tirets** dans le slug |
| Statistique 1 - Libellé | `statistique-1---libelle` | PlainText | non | |
| Statistique 2 - Valeur / Libellé | `statistique-2---valeur` / `statistique-2---libelle` | PlainText | non | |
| Statistique 3 - Valeur / Libellé | `statistique-3---valeur` / `statistique-3---libelle` | PlainText | non | |
| Statistique 4 - Valeur / Libellé | `statistique-4---valeur` / `statistique-4---libelle` | PlainText | non | |
| Galerie d'images | `galerie-d-images` | MultiImage | non | Inutilisé (galerie gérée via Visuels) |
| Texte du bouton CTA | `texte-du-bouton-cta` | PlainText | non | |
| Lien du bouton CTA | `lien-du-bouton-cta` | Link | non | |
| Services concernés | `services-concernes` | MultiReference | non | → Services (vide) |
| Membres impliqués | `membres-impliques` | MultiReference | non | → Membres |
| Image Case Study 1 / 2 / 3 | `image-case-study-1` / `image-case-study-2` / `image-case-study-3` | Image | non | |
| Couleur fond | `couleur-fond` | Color | non | |
| Couleur Dot | `couleur-dot` | Color | non | |
| Couleur Ombre portée | `couleur-ombre-portee` | Color | **oui** | |
| Ordre page d'accueil | `ordre` | Number (entier ≥ 0) | non | Le slug est `ordre`, pas `ordre-page-d-accueil` |
| Ordre page "Réalisations" | `ordre-page-realisations` | Number (entier ≥ 0) | non | |
| Accroche | `accroche` | PlainText | non | « Phrase courte affichée sur la carte cas client (home et grille réalisations) » |
| Couleur fond cas client | `couleur-fond-cas-client` | Color | non | « …div cas-client-container. Laisser vide pour garder la couleur par défaut. » |
| Couleur cases chiffres clés | `couleur-cases-chiffres-cles` | Color | non | « …Laisser vide pour garder la couleur par défaut. » |
| SEO Titre | `seo-titre` | PlainText | non | |
| SEO Meta Description | `seo-meta-description` | PlainText | non | |
| Afficher sur la page d'accueil | `afficher-sur-la-page-d-accueil` | Switch | non | Désactivé = absent de la liste cas clients de l'accueil |
| Afficher sur Agence web Lille | `afficher-sur-agence-web-lille` | Switch | non | Activé = apparaît sur /agence-web-lille |

Items (16) — `ordre` accueil / `ordre-page-realisations` / accueil / Lille :
- Le Crayon — `le-crayon` (1 / 1 / oui / oui)
- Huchet Demorge — `huchet-demorge` (2 / 6 / oui / oui)
- Hôtel Eiffel Ségur — `hotel-eiffel-segur` (3 / 4 / oui / —)
- Riskintel Group — `riskintel` (4 / 11 / oui / non)
- Logical Conseils — `logical-conseils` (5 / 8 / oui / oui)
- Club Casa Zanoni — `club-casa-zanoni` (6 / 2 / oui / —)
- Bund Médias — `bund-medias` (7 / 7 / oui / —)
- Concilum - Le Recruteur — `concilum-le-recruteur` (8 / 5 / oui / oui)
- Dim Sum — `dim-sum` (9 / 9 / oui / —)
- SforSales Academy — `sforsales` (10 / 10 / non / non)
- Aktionnaire — `aktionnaire` (12 / 12 / non / non)
- 24 Degrés — `24-degres` (13 / 13 / non / non)
- Impulsions Métropole Sud — `impulsions-metropole-sud` (14 / 14 / non / oui)
- Les Ombres — `les-ombres` (15 / 15 / non / non)
- Sleepee by tim — `sleepee-by-tim` (16 / 16 / non / non) *(brouillon)*
- Orem — `orem` (— / 3 / non / —)

Points d'attention :
- **`orem`** (publiée) : client référencé `orem` en **brouillon** ; pas d'`ordre` accueil ; pas d'images case study 1-3 ; 0 statistique ; pas de `couleur-fond` ni `couleur-dot`.
- **Faute de frappe** : « Concilum » (nom + slug `concilum-le-recruteur`) alors que le client s'appelle « Concilium » (`concilium-le-recruteur`). Changer le slug casse l'URL `/realisations/concilum-le-recruteur` (prévoir une redirection 301).
- Slugs incohérents avec les Clients : `dim-sum` (client `dimsum`).
- `hotel-eiffel-segur` : `texte-du-bouton-cta` = « Voir les site  » (faute + espace final). Les 15 autres : « Voir le site ».
- Statistiques incomplètes : `concilum-le-recruteur` (2/4), `bund-medias` (3/4), `orem` (0/4).
- Champs jamais remplis : `galerie-d-images` (16/16), `services-concernes` (16/16).
- `afficher-sur-agence-web-lille` à `null` sur 5 items (`orem`, `dim-sum`, `hotel-eiffel-segur`, `bund-medias`, `club-casa-zanoni`).
- `couleur-fond-cas-client` et `couleur-cases-chiffres-cles` vides sur 5 items (`logical-conseils`, `dim-sum`, `le-crayon`, `bund-medias`, `club-casa-zanoni`) — vide = couleur par défaut, donc acceptable.
- SEO titre/meta et alt d'images renseignés partout. Meta de `logical-conseils` = 174 caractères (long).
- `sleepee-by-tim` brouillon mais `includeInSitemap: true` (sans effet tant qu'il n'est pas publié).

### 3.7 Témoignages — `temoignages`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Name | `name` | PlainText | oui | helpText « Nom de l'auteur du témoignage » |
| Client | `client` | Reference | oui | → Clients |
| Poste de l'auteur | `poste-de-l-auteur` | PlainText | non | Format observé « Fonction - Entreprise » |
| Photo de l'auteur | `photo-de-l-auteur` | Image | non | |
| Citation | **`citatio`** | PlainText (multiligne) | non | Slug tronqué (sans « n ») |

Items (9, tous publiés) :
- Louis-Poinsignon — `louis-poinsignon` (client `les-ombres`)
- Gautier Hubert — `gautier-hubert` (`serenitine`)
- Julia Auriault — `julia-auriault` (`valere-avocats`)
- Justine Timbert — `justine-timbert` (`h19`)
- Wallerand Moullé-Berteaux — `wallerand-moulle-berteaux` (`le-crayon`)
- Virginie Hilssone-Lévy — `virginie-hilssone-levy` (`24-degres`)
- Hugo Demorge — `hugo-demorge` (`huchet-demorge`)
- Mathéo Lamblin — `matheo-lamblin` (`juwa`)
- Julie Egron — `julie-egron` (`concilium-le-recruteur`)

Points d'attention :
- Slug du champ citation = **`citatio`** : à utiliser tel quel en écriture.
- Nom « Louis-Poinsignon » avec tiret (probable prénom + nom « Louis Poinsignon » ; à vérifier).
- Faute dans une citation (Serenitine) : « soupoudré » (→ « saupoudré »).
- Aucun témoignage n'est relié aux Offres (`offres.temoignages-associes` vide partout).

### 3.8 FAQ — `faq`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Question | `name` | PlainText | oui | helpText « L'intitulé de la question » |
| Réponse | `reponse` | RichText | oui | |
| Catégorie | **`categorie-2`** | Reference | non | → Catégories (blog). Vide partout |
| Ordre | `ordre` | Number (entier) | non | « Position de la question dans sa catégorie (1 à 5) » |
| Article liée | `article-liee` | Reference | non | → Articles |
| Catégorie FAQ | `categorie-faq` | Reference | non | → Catégories FAQ |
| Page | **`page-2`** | Option | non | Accueil `0b5398b2d179c8451f8b30f8b493d60f` · Réalisations `e11266af2d79ee65ed4240ebe5e1db62` · Conseil `fbc1aad406c47927f848d9f61fc634dc` · Image de marque `cafbc80aab199ac732fef7871adf9ec0` · Site web `9d9bc8100fa870c9f4665a751fee5f5b` · Évolution `2c86779c53b0003f302a210c94bc7cee` (pas d'option SEO) |
| Offre liée | `offre-liee` | Reference | non | → Offres |
| Afficher sur Agence web Lille | `afficher-sur-agence-web-lille` | Switch | non | Activé = FAQ de /agence-web-lille |
| Onglet offre | `onglet-offre` | Option | non | 1 `58f6da8fd389e18a664bb55bad59979f` · 2 `4c3bac411639a54150caef4af67a7048` · 3 `b83884bb97ad47706895c01675cad99b` |

Répartition des 107 questions (tous publiés) :

| Usage | Champs renseignés | Nb |
|---|---|---|
| Accueil | `page-2`=Accueil + `categorie-faq` (approche 5, deroule 5, fit 5) | 15 |
| Page Réalisations | `page-2`=Réalisations + `categorie-faq` (nos-projets 3, nos-resultats 3, la-suite 2) | 8 |
| Offre Conseil | `page-2` + `offre-liee`=conseil + `onglet-offre` 1/2/3 (les-enjeux 4, la-methode 2, les-livrables 4) | 10 |
| Offre Image de marque | idem (les-enjeux 3, limpact 3, la-methode 4) | 10 |
| Offre Site web | idem (les-enjeux 4, la-methode 4, la-performance 3) | 11 |
| Offre Évolution | idem (les-enjeux 4, laccompagnement 4, les-resultats 2) | 10 |
| Offre SEO | `offre-liee`=seo + `onglet-offre` (les-enjeux 3, la-methode 3, les-resultats 2), **sans `page-2`** | 8 |
| /agence-web-lille | `afficher-sur-agence-web-lille`=true + `categorie-faq` (approche 3, deroule 4, fit 4), slugs `lille-*` | 11 |
| Articles | `article-liee` seul (meilleures-agences-web-lille 7, choisir-agence-webflow-b2b 5, autres 3 chacun) | 24 |

Toutes les FAQ d'offre sont aussi listées dans `offres.faq-associee` de la même offre (cohérence vérifiée, 49 items) : le lien est donc **doublé** (`offre-liee` côté FAQ + `faq-associee` côté Offre) et doit être maintenu des deux côtés.

Les 30 premiers items (sur 107) :
- Combien de temps faut-il pour créer un site avec une agence web à Lille ? — `delai-creation-site-agence-web-lille`
- Faut-il payer un abonnement mensuel de maintenance ? — `abonnement-maintenance-site-web`
- Qui doit être propriétaire de mon site web ? — `proprietaire-site-web`
- Une agence lilloise vaut-elle mieux qu'une agence parisienne ? — `agence-lilloise-ou-parisienne`
- Où trouver une agence web B2B à Lille ? — `trouver-agence-web-b2b-lille`
- Combien coûte une agence web à Lille ? — `cout-agence-web-lille`
- Quelle est la meilleure agence web à Lille ? — `meilleure-agence-web-lille`
- En combien de temps verrai-je des résultats en SEO ? — `seo-7`
- Comment mesurez-vous votre travail ? — `seo-6`
- Travaillez-vous uniquement sous Webflow ? — `seo-5`
- Une agence SEO à Lille ou à distance, ça change quoi ? — `seo-4`
- Le netlinking est-il risqué ? — `seo-3`
- Faut-il refaire son site pour bien se référencer ? — `seo-2`
- Combien coûte une agence SEO pour une PME B2B ? — `seo-1`
- Quelle est la différence entre SEO et référencement naturel ? — `seo-0`
- En combien de temps voit-on des résultats en référencement ? — `lille-delai-resultats-referencement`
- Comment choisir son agence web à Lille ? — `lille-comment-choisir-agence-web`
- Quelle différence entre une agence web et un freelance ? — `lille-agence-web-ou-freelance`
- Combien coûte la refonte d'un site web existant ? — `lille-prix-refonte-site-web`
- Comment démarre une collaboration ? — `lille-demarrer-collaboration`
- Combien de temps faut-il pour créer un site web ? — `lille-delais-projet`
- Faut-il traiter le SEO local en même temps que le site ? — `lille-seo-local-et-site`
- Pourquoi choisir Webflow plutôt que WordPress ? — `lille-pourquoi-webflow`
- Combien coûte un site internet pour une PME B2B ? — `lille-cout-site-b2b`
- Travaillez-vous avec des entreprises en dehors de Lille ? — `lille-travail-hors-lille`
- Pourquoi choisir une agence web à Lille ? — `lille-pourquoi-agence-web-locale`
- Dois-je choisir une agence Webflow Paris ou une agence en province ? — `agence-webflow-paris-ou-province`
- Une agence Webflow peut-elle aussi gérer le SEO de mon site ? — `agence-webflow-gerer-seo-site`
- Est-ce que je garde la propriété de mon site Webflow après livraison ? — `garder-propriete-site-webflow-apres-livraison`
- Combien de temps dure un projet de création de site B2B sur Webflow ? — `duree-projet-creation-site-b2b-webflow`

Points d'attention :
- `categorie-2` (→ Catégories blog) vide sur les 107 items : champ mort.
- Les FAQ d'articles n'ont ni `categorie-faq` ni `ordre` cohérent (ordres 1-5 répétés sans groupe identifiable autre que `article-liee`).
- Option `page-2` sans valeur « SEO » : les FAQ de l'offre SEO n'ont pas de `page-2` (fonctionne via `offre-liee`).
- Conventions de slug hétérogènes : préfixés par catégorie/page (`approche-…`, `fit-…`, `deroule-…`, `conseil-…`, `site-web-…`, `realisations-…`, `lille-…`) vs non préfixés pour les FAQ d'articles ; 37 slugs dépassent 80 caractères (question entière).
- Aucun doublon d'intitulé.

### 3.9 Articles — `articles` (template publié `/articles/[slug]`)

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Titre | `name` | PlainText | oui | H1 |
| Title Tag | `title-tag` | PlainText (multiligne) | oui | Balise `<title>` |
| Meta Description | `meta-description` | PlainText (multiligne) | oui | |
| Introduction | `introduction` | PlainText (multiligne) | oui | |
| Image de couverture | `image-de-couverture` | Image | oui | |
| Contenu | `contenu` | RichText | oui | Commence par `<h2>En bref</h2>` sur 5/6 |
| Auteur | `auteur` | Reference | oui | → Membres |
| Catégorie | **`categorie-3`** | Reference | oui | → Catégories |
| Date de publication | `date-de-publication` | DateTime | oui | |

Items (6, tous publiés, tous dans le sitemap) :
- Les meilleures agences web à Lille : comment les choisir (et notre sélection) — `meilleures-agences-web-lille` (Louis, web, 2026-10-07)
- Comment choisir son agence Webflow pour un projet B2B (2026) — `choisir-agence-webflow-b2b` (Louis, web, 2026-09-17)
- Le SEO vous rend visible. Le récit de marque donne une raison de vous choisir. — `seo-recit-de-marque-b2b` (Théophile, acquisition, 2026-09-09)
- Pourquoi les marques B2B se ressemblent toutes et comment construire une identité visuelle forte… — `identite-visuelle-b2b-differentiation` (Clément, branding, 2026-09-08)
- Comment être cité par ChatGPT, Perplexity et Google AI en 2026 : le guide GEO pour les entreprises B2B — `geo-referencement-ia-guide-b2b` (Théophile, web, 2026-09-08)
- Webflow vs WordPress : le guide B2B honnête (2026) — `webflow-vs-wordpress-site-b2b` (Louis, web, 2026-09-08)

Points d'attention :
- **Alt manquant sur l'image de couverture de 4/6 articles** : `choisir-agence-webflow-b2b`, `seo-recit-de-marque-b2b`, `geo-referencement-ia-guide-b2b`, `webflow-vs-wordpress-site-b2b`.
- `identite-visuelle-b2b-differentiation` : titre (H1) de 152 caractères, rédigé comme une phrase complète.
- `geo-referencement-ia-guide-b2b` : `title-tag` sans le suffixe « | Orem » (les 5 autres l'ont). `meilleures-agences-web-lille` : title-tag de 67 caractères (risque de troncature).
- Catégorie `developpement` jamais utilisée ; 4 articles sur 6 en `web` (dont l'article GEO, plutôt « acquisition »).
- Pas de champ SEO séparé du `name` pour l'Open Graph (le template utilise vraisemblablement `title-tag`/`meta-description` ; non vérifié côté Designer).

### 3.10 Partenaires — `partenaires`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Fonction | `fonction` | PlainText | non | « Fonction ou rôle du partenaire » |
| Lien | `lien` | Link | non | Site ou réseaux |
| Ordre | `ordre` | Number (entier) | non | Croissant |
| Photo | `photo` | Image | non | « Photo affichée au survol de la ligne (175×250px) » |

Items (4, tous publiés) : Nathan Poncet — `nathan-poncet` (1) · Nathanaël Mpondo — `nathanael-mpondo-de-grandow` (2) · Massinissa Laouchedi — `massinissa-laouchedi` (3) · Thomas Pereira — `thomas-pereira` (4)

Points d'attention : slug `nathanael-mpondo-de-grandow` ≠ nom affiché « Nathanaël Mpondo » (sans impact, pas de page template). Tous champs et alt remplis.

### 3.11 Catégories — `categories` (blog)

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Nom de la catégorie | `name` | PlainText | oui | |
| Articles liés | `articles-lies` | MultiReference | **oui** | → Articles |

Items (4, tous publiés) : Acquisition — `acquisition` · Développement — `developpement` · Branding — `branding` · Web — `web`

Points d'attention :
- **`articles-lies` est requis mais vide sur les 4 items** : relation inverse de `articles.categorie-3`, jamais remplie. Toute écriture API sur ces items risque d'être refusée tant que le champ requis reste vide ; il faudrait soit le remplir, soit le passer en non requis (puis le supprimer s'il ne sert pas).
- Singulier mal orthographié dans le schéma : `singularName` = « Catégory ».
- `developpement` n'a aucun article.

### 3.12 Visuels — `visuels`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Nom du visuel | `name` | PlainText | oui | Ex. « Visuel Huchet Demorge n°1 » |
| Type de média | `type-de-media` | Option | oui | Image `0ff9e2e05432fdef3ddc5827230d0396` · Vidéo `30b875f041a0e8a0e7c53e39f249e639` |
| Image | `image` | Image | non | Vide pour les vidéos |
| Taille de l'image | `taille-de-l-image` | Option | oui | Demi `ebd3b7843751ba2e9499fb2d9b74ffa4` · Pleine `3acf0f0261241325661938e5ae3618e2` |
| Ordre | `ordre` | Number (entier ≥ 0) | oui | Ordre dans la galerie de la réalisation |
| Réalisation | `realisation` | Reference | oui | → Réalisations |
| Lien vidéo | `lien-video` | Link | non | Rempli pour les 32 visuels de type Vidéo |

Répartition par réalisation (total / brouillons / archivés) :

| Réalisation | Visuels | Brouillons | Archivés | Remarque |
|---|---|---|---|---|
| le-crayon | 53 | 20 | 20 | 20 anciens visuels `visuel-le-crayon-2…21` archivés+brouillons, doublons de nom des actifs `le-crayon-2026-*` |
| huchet-demorge | 32 | 0 | 0 | 10 vidéos ; ordre commence à 0 |
| riskintel | 32 | 0 | 0 | |
| sleepee-by-tim | 28 | 28 | 0 | réalisation en brouillon |
| les-ombres | 25 | 1 | 1 | `lesombres-20` archivé |
| 24-degres | 23 | 0 | 0 | |
| aktionnaire | 23 | 0 | 0 | |
| impulsions-metropole-sud | 23 | 0 | 0 | |
| sforsales | 22 | 0 | 0 | |
| orem | 21 | 0 | 0 | 9 vidéos |
| hotel-eiffel-segur | 20 | 1 | 0 | 10 vidéos ; item brouillon `test` ; **ordre 9 en double** (`visuel-hotel-eiffel-segur-8` et `-9`) |
| club-casa-zanoni | 16 | 0 | 0 | 3 vidéos ; ordres 1→19 avec trous |
| concilum-le-recruteur | 15 | 0 | 0 | |
| dim-sum | 15 | 0 | 0 | |
| logical-conseils | 13 | 0 | 0 | |
| bund-medias | 11 | 0 | 0 | |

Les 30 premiers items (sur 372) :
- Visuel Le Crayon bonus B — `lecrayon-bonus-b`
- Visuel Le Crayon bonus D — `lecrayon-bonus-d`
- Visuel Le Crayon bonus C — `lecrayon-bonus-c`
- Visuel Le Crayon bonus A — `lecrayon-bonus-a`
- Visuel Sleepee by tim bonus B — `sleepee-bonus-b` *(brouillon)*
- Visuel Sleepee by tim bonus D — `sleepee-bonus-d` *(brouillon)*
- Visuel Sleepee by tim bonus C — `sleepee-bonus-c` *(brouillon)*
- Visuel Sleepee by tim bonus A — `sleepee-bonus-a` *(brouillon)*
- Visuel Les Ombres bonus B — `lesombres-bonus-b`
- Visuel Les Ombres bonus D — `lesombres-bonus-d`
- Visuel Les Ombres bonus C — `lesombres-bonus-c`
- Visuel Les Ombres bonus A — `lesombres-bonus-a`
- Visuel Impulsions Métropole Sud bonus B — `impulsions-bonus-b`
- Visuel Impulsions Métropole Sud bonus D — `impulsions-bonus-d`
- Visuel Impulsions Métropole Sud bonus C — `impulsions-bonus-c`
- Visuel Impulsions Métropole Sud bonus A — `impulsions-bonus-a`
- Visuel 24 Degrés bonus B — `24degres-bonus-b`
- Visuel 24 Degrés bonus D — `24degres-bonus-d`
- Visuel 24 Degrés bonus C — `24degres-bonus-c`
- Visuel 24 Degrés bonus A — `24degres-bonus-a`
- Visuel Aktionnaire bonus B — `aktionnaire-bonus-b`
- Visuel Aktionnaire bonus D — `aktionnaire-bonus-d`
- Visuel Aktionnaire bonus C — `aktionnaire-bonus-c`
- Visuel Aktionnaire bonus A — `aktionnaire-bonus-a`
- Visuel Riskintel Group bonus B — `riskintel-bonus-b`
- Visuel Riskintel Group bonus D — `riskintel-bonus-d`
- Visuel Riskintel Group bonus C — `riskintel-bonus-c`
- Visuel Riskintel Group bonus A — `riskintel-bonus-a`
- Visuel SforSales Academy bonus B — `sforsales-bonus-b`
- Visuel SforSales Academy bonus D — `sforsales-bonus-d`

Points d'attention :
- 20 items Le Crayon archivés/brouillons à nettoyer (doublons de nom avec les visuels actifs).
- Item brouillon `test` (nommé « Visuel Hôtel Eiffel Segur 18 ») à supprimer.
- Doublon d'`ordre` (9) sur hotel-eiffel-segur.
- Conventions de slug multiples : `visuel-<client>-N`, `<client>-N`, `<client>-2026-N`, `<client>-bonus-a…d`, `visuel-zanoni-N`, `lesombres-N`, `24degres-N`.
- Aucun alt manquant sur les images ; aucune référence orpheline.

### 3.13 Problématiques clients — `problematiques-clients`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Titre | `name` | PlainText | oui | Ex. « Votre image est en retard. » |
| Bullet point 1 / 2 / 3 | `bullet-point-1` / `bullet-point-2` / `bullet-point-3` | PlainText | non | |
| Ordre | `ordre` | Number (entier) | non | |

Items (28, tous publiés, tous référencés par exactement une offre) — préfixe de slug = offre (`seo-`, `acc-` = Évolution, `im-` = Image de marque, `conseil-`, aucun préfixe = Site web) :
- Vous investissez, mais vous exploitez mal ce qui a été créé — `acc-vous-investissez-mais-exploitez-mal`
- Vous manquez d'expertise pour arbitrer seul — `acc-vous-manquez-dexpertise-pour-arbitrer`
- Vous avancez sans assez de recul — `acc-vous-avancez-sans-assez-de-recul`
- Vos priorités business changent, mais votre présence suit mal — `acc-vos-priorites-business-changent`
- Vous laissez passer des optimisations utiles — `acc-vous-laissez-passer-des-optimisations`
- Vous risquez de repayer plus tard ce que vous auriez pu faire évoluer plus tôt — `acc-vous-risquez-de-repayer-plus-tard`
- On comprend mal ce que vous faites — `conseil-on-comprend-mal-ce-que-vous-faites`
- On ne voit pas clairement pourquoi vous choisir — `conseil-on-ne-voit-pas-pourquoi-vous-choisir`
- Votre offre manque de lisibilité — `conseil-votre-offre-manque-de-lisibilite`
- Vous ne savez pas quoi corriger en premier — `conseil-vous-ne-savez-pas-quoi-corriger`
- Vous risquez d'investir au mauvais endroit — `conseil-vous-risquez-investir-mauvais-endroit`
- Votre entreprise est sous-évaluée — `conseil-votre-entreprise-est-sous-evaluee`
- Votre image ne reflète plus votre niveau — `im-votre-image-ne-reflete-plus-votre-niveau`
- Votre marque manque de cohérence — `im-votre-marque-manque-de-coherence`
- Vous ressemblez trop à d'autres — `im-vous-ressemblez-trop-a-dautres`
- Votre image ne rassure pas assez — `im-votre-image-ne-rassure-pas-assez`
- Votre montée en gamme n'est pas soutenue — `im-votre-montee-en-gamme-nest-pas-soutenue`
- Votre image ne vous aide pas commercialement — `im-votre-image-ne-vous-aide-pas-commercialement`
- Votre site attire du trafic, pas des clients. — `seo-trafic-pas-des-clients`
- Vos positions montent, vos demandes non. — `seo-positions-montent-demandes-non`
- Vos prospects vous cherchent sans vous trouver. — `seo-prospects-cherchent-sans-trouver`
- Vous êtes absent des réponses IA. — `seo-absent-des-reponses-ia`
- Votre image est en retard. — `votre-image-est-en-retard`
- Votre message manque de clarté. — `votre-message-manque-de-clarte`
- Votre offre est peu lisible. — `votre-offre-est-peu-lisible`
- Votre site rassure peu. — `votre-site-rassure-peu`
- Votre visibilité est fragile. — `votre-visibilite-est-fragile`
- Votre site travaille peu. — `votre-site-travaille-peu`

Points d'attention : préfixe `acc-` pour l'offre Évolution (ancien nom « Accompagnement ») ; items Site web sans préfixe. Ponctuation finale incohérente (certains titres finissent par un point, d'autres non).

### 3.14 Étapes du process — `etapes-du-process`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Titre | `name` | PlainText | oui | Ex. « Visio de découverte » |
| Numéro d'étape | `numero-d-etape` | Number (entier) | non | 1 à 6 par offre |
| Texte explicatif | **`texte-explicatif-2`** | PlainText | non | |

Items (30, tous publiés, 6 par offre, chacun référencé par une seule offre) :
- Visio mensuelle de pilotage — `acc-visio-mensuelle-de-pilotage`
- Analyse des résultats — `acc-analyse-des-resultats`
- Lecture des objectifs business — `acc-lecture-de-vos-objectifs-business`
- Recommandations d'experts — `acc-recommandations-dexperts`
- Plan d'action du mois — `acc-plan-daction-du-mois`
- Suivi dans l'espace client — `acc-suivi-dans-lespace-client`
- Évolution — `accompagnement`
- Cadrage du projet — `cadrage-du-projet`
- Conception — `conception`
- Échange — `conseil-visio-de-decouverte`
- Diagnostic — `conseil-diagnostic`
- Décryptage — `conseil-analyse`
- Décisions — `conseil-recommandations`
- Plan d'action — `conseil-plan-daction`
- Accompagnement — `conseil-execution-si-besoin`
- Développement — `dev-du-site`
- Visio de découverte — `im-visio-de-decouverte`
- Cadrage — `im-cadrage`
- Direction de marque — `im-direction-de-marque`
- Création visuelle — `im-creation-visuelle`
- Système de marque — `im-livraison`
- Faire vivre votre image — `im-suivi-si-besoin`
- Mise en ligne — `mise-en-ligne`
- Diagnostic gratuit — `seo-diagnostic-gratuit`
- Audit technique et sémantique — `seo-audit-technique-semantique`
- Stratégie de mots-clés B2B — `seo-strategie-mots-cles-b2b`
- Contenu et maillage interne — `seo-contenu-maillage-interne`
- Netlinking et autorité — `seo-netlinking-autorite`
- Mesure et pilotage — `seo-mesure-pilotage`
- Visio de découverte — `visio-de-decouverte`

Points d'attention : slugs devenus incohérents avec les titres après renommage (`accompagnement` = « Évolution », `dev-du-site` = « Développement », `im-suivi-si-besoin` = « Faire vivre votre image », `im-livraison` = « Système de marque », `conseil-execution-si-besoin` = « Accompagnement », `conseil-recommandations` = « Décisions », `conseil-analyse` = « Décryptage », `conseil-visio-de-decouverte` = « Échange »). Sans impact public (pas de template).

### 3.15 Offres — `offres` (template publié `/offres/[slug]`)

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Name | `name` | PlainText | oui | |
| Titre hero | `titre-hero` | PlainText | non | |
| Vidéo hero | `video-hero` | File | non | Vide partout (remplacé par le lien Cloudinary) |
| Lien vidéo hero (Cloudinary) | `lien-video-hero-cloudinary` | Link | non | URL webm/mp4 Cloudinary ; vide = pas de vidéo |
| Texte hero | **`texte-hero-2`** | PlainText | non | Paragraphe sous le titre hero |
| Titre problème | `titre-probleme` | PlainText | non | |
| Description problème | **`description-probleme-2`** | PlainText | non | |
| Problématiques clients | `problematiques-clients` | MultiReference | non | → Problématiques clients |
| Eyebrow solution | `eyebrow-solution` | PlainText | non | « Notre Solution » partout |
| Titre solution | `titre-solution` | PlainText | non | « Ce que nous faisons » partout |
| Texte solution 1 | **`texte-solution-1-2`** | PlainText | non | |
| Texte solution 2 | **`texte-solution-2-2`** | PlainText | non | |
| Titre process | `titre-process` | PlainText | non | « Une méthode claire » partout |
| Étapes du process | `etapes-du-process` | MultiReference | non | → Étapes du process |
| Texte intro contenu de l'offre | `texte-intro-contenu-de-l-offre` | PlainText | non | |
| Contenu concret | `contenu-concret` | MultiReference | non | → Contenu concret |
| Aspects business | `aspects-business` | MultiReference | non | → Aspects business |
| Témoignages associés | `temoignages-associes` | MultiReference | non | → Témoignages |
| FAQ associée | `faq-associee` | MultiReference | non | → FAQ |
| Onglet FAQ 1 / 2 / 3 | `onglet-faq-1` / `onglet-faq-2` / `onglet-faq-3` | PlainText | non | Libellés d'onglets FAQ |
| Ordre | `ordre` | Number (entier) | non | Croissant |
| Accroche carte accueil | `accroche-carte-accueil` | PlainText | non | Carte section offres de l'accueil |
| SEO Titre | `seo-titre` | PlainText | non | |
| SEO Meta Description | `seo-meta-description` | PlainText | non | |
| Masquer dans la navigation | `masquer-dans-la-navigation` | Switch | non | Activé = page existante mais absente du menu, du footer et de l'accueil |

Items (5, tous publiés, tous dans le sitemap) :
- Conseil — `conseil` (ordre 1 ; onglets Enjeux / Méthode / Livrables)
- Image de marque — `image-de-marque` (2 ; Les enjeux / L'impact / La méthode)
- Site web — `site-web` (3 ; Les enjeux / La méthode / La performance)
- Évolution — `evolution` (4 ; Enjeux / Accompagnement / Résultats)
- SEO — `seo` (5 ; Les enjeux / La méthode / Les résultats) — **`masquer-dans-la-navigation: true`**

Points d'attention :
- `temoignages-associes` vide sur les 5 offres (aucune preuve sociale sur les pages offres via le CMS).
- `video-hero` (File) vide partout : champ mort.
- **`seo` et `evolution` utilisent la même vidéo Cloudinary** (`…/6a9b23d204640d602160cfc4_video_evolution.webm`).
- Libellés d'onglets FAQ incohérents (« Enjeux » vs « Les enjeux »).
- Slugs suffixés `-2` (`texte-hero-2`, `description-probleme-2`, `texte-solution-1-2`, `texte-solution-2-2`) : vestiges de champs recréés, à utiliser tels quels.
- `masquer-dans-la-navigation` à `null` (non `false`) sur 4 offres.

### 3.16 Contenu concret — `contenu-concret`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Titre | `name` | PlainText | oui | |
| Ordre | `ordre` | Number (entier) | non | |
| Aspect business | `aspect-business` | Reference | non | → Aspects business (bénéfice affiché en regard) |
| Icone | `icone` | Image | non | |

Items (37, tous publiés, chacun référencé par une seule offre ; 30 premiers listés, triés par offre) :
- 2 mois d'accompagnement — `2-mois-daccompagnement`
- Visio mensuelle de pilotage — `acc-c-visio-mensuelle-de-pilotage`
- Revue des actions menées — `acc-revue-des-actions-menees`
- Analyse des résultats — `acc-c-analyse-des-resultats`
- Regard externe et recommandations d'experts — `acc-regard-externe-recommandations-experts`
- Priorisation des actions du mois — `acc-priorisation-des-actions-du-mois`
- Adaptation à vos objectifs business — `acc-adaptation-a-vos-objectifs-business`
- Mise à jour du site, des supports ou des messages — `acc-mise-a-jour-du-site-supports-messages`
- Espace client avec suivi des tâches — `acc-espace-client-avec-suivi-des-taches`
- Arborescence et structure de pages — `arborescence-et-structure-de-pages`
- Diagnostic de votre message, de votre offre et de votre présence actuelle — `conseil-diagnostic-message-offre-presence`
- Analyse de vos points de friction — `conseil-analyse-points-de-friction`
- Clarification de votre différence — `conseil-clarification-de-votre-difference`
- Hiérarchisation de vos offres et de vos messages — `conseil-hierarchisation-offres-messages`
- Recommandations concrètes et priorisées — `conseil-recommandations-concretes-priorisees`
- Plan d'action personnalisé — `conseil-plan-daction-personnalise`
- Copywriting orienté conversion — `copywriting-oriente-conversion`
- Plateforme de marque — `im-plateforme-de-marque`
- Identité visuelle — `im-identite-visuelle`
- Direction artistique — `im-direction-artistique`
- Système typographique et chromatique — `im-systeme-typographique-et-chromatique`
- Design system — `im-design-system`
- Déclinaisons utiles à votre activité — `im-declinaisons-utiles-a-votre-activite`
- Charte de marque — `im-charte-de-marque`
- Intégrations formulaires / CRM / automatisations — `integrations-formulaires-crm-automatisations`
- Mise en ligne et accompagnement — `mise-en-ligne-et-accompagnement`
- Optimisation SEO de base — `optimisation-seo-de-base`
- Audit SEO technique et sémantique — `seo-cc-1`
- Carte de mots-clés B2B par intention d'achat — `seo-cc-2`
- Contenus rédigés à partir de votre expertise — `seo-cc-3`

Points d'attention : `aspect-business` rempli sur 37/37 et toujours vers l'aspect de même `ordre` de la même offre (cohérent). Icônes et alt présents partout. Slugs SEO génériques (`seo-cc-1…8`) vs slugs descriptifs ailleurs ; préfixe `acc-c-` sur 2 items Évolution.

### 3.17 Aspects business — `aspects-business`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Titre | `name` | PlainText | oui | |
| Ordre | `ordre` | Number (entier) | non | |
| Contenu concret | `contenu-concret` | Reference | non | → Contenu concret |

Items (37, tous publiés, chacun référencé par une seule offre ; 30 premiers listés) :
- Vous prenez de meilleures décisions avec plus de recul et plus de méthode. — `acc-vous-prenez-de-meilleures-decisions`
- Vous savez ce qui a été fait, ce qui a avancé et ce qui reste à optimiser. — `acc-vous-savez-ce-qui-a-ete-fait`
- Vous identifiez ce qui fonctionne réellement et ce qui doit être ajusté. — `acc-vous-identifiez-ce-qui-fonctionne`
- Vous êtes conseillé sur des sujets que vous ne maîtrisez pas toujours en interne. — `acc-vous-etes-conseille-sur-des-sujets`
- Vous concentrez le temps et le budget sur ce qui a le plus d'impact. — `acc-vous-concentrez-le-temps-et-le-budget`
- Votre présence suit vos vrais enjeux : recrutement, lancement, nouvelle offre, visibilité. — `acc-votre-presence-suit-vos-vrais-enjeux`
- Vous évitez que vos actifs prennent du retard ou perdent en cohérence. — `acc-vous-evitez-que-vos-actifs-prennent-retard`
- Vous gardez une vision claire de ce qui est prévu, réalisé et en cours. — `acc-vous-gardez-une-vision-claire`
- Vous identifiez ce qui freine la compréhension, la crédibilité et la conversion. — `conseil-vous-identifiez-ce-qui-freine`
- Vous arrêtez de corriger au hasard et vous concentrez vos efforts au bon endroit. — `conseil-vous-arretez-de-corriger-au-hasard`
- Vous devenez plus facile à choisir et moins facile à comparer. — `conseil-vous-devenez-plus-facile-a-choisir`
- Vous rendez la lecture plus simple, la décision plus rapide et l'entrée en relation plus fluide. — `conseil-vous-rendez-la-lecture-plus-simple`
- Vous savez quoi faire d'abord, quoi reporter et quoi arrêter. — `conseil-vous-savez-quoi-faire-dabord`
- Vous gagnez du temps, vous réduisez les erreurs et vous investissez avec plus de justesse. — `conseil-vous-gagnez-du-temps`
- Vous clarifiez ce que votre image doit exprimer et ce qu'elle doit faire ressentir. — `im-vous-clarifiez-ce-que-votre-image-doit`
- Vous renvoyez une image plus juste, plus solide et plus alignée avec votre niveau réel. — `im-vous-renvoyez-une-image-plus-juste`
- Vous gagnez en cohérence et en distinction sur l'ensemble de vos supports. — `im-vous-gagnez-en-coherence-et-distinction`
- Vous rendez votre marque plus reconnaissable et plus constante dans le temps. — `im-vous-rendez-votre-marque-plus-reconnaissable`
- Vous facilitez la production de vos futurs supports sans repartir de zéro à chaque fois. — `im-vous-facilitez-la-production-de-vos-supports`
- Vous équipez vos équipes avec des supports cohérents, prêts à être utilisés. — `im-vous-equipez-vos-equipes-avec-supports`
- Vous sécurisez la cohérence de votre image à mesure que votre entreprise grandit. — `im-vous-securisez-la-coherence-de-votre-image`
- Moins de friction dans le parcours et moins d'opportunités perdues. — `moins-de-friction-moins-dopportunites-perdues`
- Un plan d'action priorisé sur ce qui bloque vraiment. — `seo-ab-1`
- Des visites qui viennent d'acheteurs potentiels, pas de curieux. — `seo-ab-2`
- Des pages que vos prospects lisent avant même de vous contacter. — `seo-ab-3`
- Une structure qui guide le visiteur jusqu'à la prise de contact. — `seo-ab-4`
- Une autorité qui progresse sans risque de pénalité. — `seo-ab-5`
- Une expertise citée dans les réponses de Google et des assistants IA. — `seo-ab-6`
- Aucune dépendance technique ni devis séparé pour chaque nouvelle page. — `seo-ab-7`
- Un référencement jugé sur les demandes entrantes, pas seulement sur les positions. — `seo-ab-8`

Points d'attention : `contenu-concret` vide sur 37/37 — la relation est portée uniquement par `contenu-concret.aspect-business` ; champ inverse mort. Slugs SEO génériques (`seo-ab-1…8`).

### 3.18 Posts LinkedIn — `posts-linkedin`

| Nom affiché | slug API | type | requis | notes |
|---|---|---|---|---|
| Name | `name` | PlainText | oui | Format « Post <Prénom> - <sujet> » |
| Auteur | `auteur` | Reference | oui | → Membres |
| Texte | `texte` | PlainText | oui | Texte brut copié de LinkedIn |
| Texte riche | `texte-riche` | RichText | non | Même texte avec paragraphes |
| Image | `image` | Image | non | Capture/visuel du post |
| Likes | `likes` | Number (entier) | non | |
| Commentaires | `commentaires` | Number (entier) | non | |
| Date | `date` | DateTime | oui | |
| Lien LinkedIn | `lien-linkedin` | Link | oui | URL du post |

Items (6) :
- Post Clément - ICONOKOM devient Orem — `post-clement-iconokom-devient-orem`
- Post Théophile - ICONOKOM devient Orem — `post-theophile-iconokom-devient-orem`
- Post Louis - ICONOKOM devient Orem — `post-louis-iconokom-devient-orem`
- Post Théophile - rebranding et projets — `post-theophile-rebranding-et-projets` *(brouillon)*
- Post Louis - retour de vacances — `post-louis-retour-de-vacances` *(brouillon)*
- Post Clément - police et fonte — `post-clement-police-et-fonte` *(brouillon)*

Points d'attention :
- **Les 3 posts publiés n'ont pas d'alt sur `image`** ; les 3 brouillons en ont un.
- `post-clement-iconokom-devient-orem` : `commentaires` vide.
- Liens hétérogènes : 2 liens courts `lnkd.in`, 4 URLs complètes.
- `likes`/`commentaires` sont des instantanés manuels (non synchronisés).

### 3.19 Catégories FAQ — `categories-faq`

Aucun champ hors `name`/`slug`.

Items (13, tous publiés) : Déroulé — `deroule` · Approche — `approche` · Fit — `fit` · Les résultats — `les-resultats` · L'accompagnement — `laccompagnement` · La performance — `la-performance` · L'impact — `limpact` · Les livrables — `les-livrables` · La méthode — `la-methode` · Les enjeux — `les-enjeux` · La suite — `la-suite` · Nos résultats — `nos-resultats` · Nos projets — `nos-projets`

Points d'attention : les libellés d'onglets des pages Offres sont saisis en texte libre (`onglet-faq-1…3`) et ne reprennent pas toujours ces noms (« Enjeux » vs « Les enjeux ») ; le lien onglet ↔ question passe par `faq.onglet-offre`, pas par la catégorie.

---

## 4. Problèmes CMS détectés (par priorité)

### Priorité haute (visible en ligne / SEO / bloquant API)
1. **Réalisation `orem` publiée liée à un client `orem` en brouillon** : la référence `client` sera vide en ligne (logo/nom client absents). Publier le client (il lui faut d'abord un `logo`, requis) ou changer la référence.
2. **Membre `clement-saint-hilaire` exclu du sitemap** (`includeInSitemap: false`) alors que sa page est publiée et qu'il est auteur d'article.
3. **Alt manquant** : image de couverture de 4 articles (`choisir-agence-webflow-b2b`, `seo-recit-de-marque-b2b`, `geo-referencement-ia-guide-b2b`, `webflow-vs-wordpress-site-b2b`) et image des 3 Posts LinkedIn publiés.
4. **Catégories (blog) : `articles-lies` requis mais vide sur les 4 items** — risque de rejet de toute mise à jour API de ces items ; passer le champ en non requis ou le remplir.
5. **Faute dans un slug publié** : Réalisation `concilum-le-recruteur` (« Concilum ») — corriger nom + slug avec redirection 301.
6. CTA `hotel-eiffel-segur` : « Voir les site  » (faute + espace).

### Priorité moyenne (qualité de données)
7. Réalisation `orem` incomplète : pas d'`ordre` accueil, 0 statistique, pas d'images case study, pas de `couleur-fond`/`couleur-dot`. Statistiques incomplètes aussi sur `concilum-le-recruteur` (2/4) et `bund-medias` (3/4).
8. Visuels : 20 visuels Le Crayon archivés+brouillons en doublon de nom, un brouillon `test`, un doublon d'`ordre` (9) sur hotel-eiffel-segur, ordre démarrant à 0 sur huchet-demorge, trous d'ordre sur club-casa-zanoni.
9. Offres `seo` et `evolution` partagent la même vidéo hero Cloudinary.
10. Article `identite-visuelle-b2b-differentiation` : H1 de 152 caractères ; `geo-referencement-ia-guide-b2b` : title-tag sans « | Orem ».
11. Clients : 3 brouillons sans logo requis (`orem`, `sekentiel`, `financiere-saint-matthieu`) ; `h19` sans vrai logo blanc ; switches `afficher-dans-la-hero` / Réalisations `afficher-sur-agence-web-lille` / Offres `masquer-dans-la-navigation` à `null` plutôt que `false` (à traiter comme faux dans les filtres).
12. Relations doublées à maintenir manuellement des deux côtés : `offres.faq-associee` ↔ `faq.offre-liee` ; `membres.competences` ↔ `competences.membres`.

### Priorité basse (dette de schéma)
13. Champs jamais utilisés : `faq.categorie-2`, `realisations.galerie-d-images`, `realisations.services-concernes`, `offres.video-hero`, `offres.temoignages-associes`, `aspects-business.contenu-concret`, `categories.articles-lies`.
14. Collections vides : **Services** et **Prestations** (seule référence entrante : `realisations.services-concernes`).
15. Slugs de champs non intuitifs à connaître pour l'API : `citatio`, `categorie-2`, `categorie-3`, `page-2`, `texte-hero-2`, `description-probleme-2`, `texte-solution-1-2`, `texte-solution-2-2`, `texte-explicatif-2`, `statistique-N---valeur/libelle` (3 tirets), `ordre` = « Ordre page d'accueil » dans Réalisations.
16. Conventions de slug d'items hétérogènes (préfixes `acc-` pour Évolution, Site web sans préfixe, Visuels en 6 schémas, slugs d'étapes ne correspondant plus aux titres, `dim-sum` vs client `dimsum`).
17. Divers : `singularName` « Catégory » ; témoignage « Louis-Poinsignon » (tiret) ; faute « soupoudré » ; catégorie blog `developpement` sans article ; `sleepee-by-tim` (réalisation + 28 visuels + client) en brouillon, en attente de publication.
