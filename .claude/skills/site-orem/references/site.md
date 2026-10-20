# Le site Orem : identifiants et état connu

Mettre à jour ce fichier quand l'audit révèle la structure réelle (convention de classes, composants clés, rôle de chaque script). Les données ci-dessous ont été relevées le 2026-10-20 ; elles peuvent avoir changé, les revérifier avant d'agir.

## Identifiants

| | |
|---|---|
| Site Webflow | **Orem** — `site_id` `6a7582303b9ddd4a77302cc8` (shortName `orem`) |
| Espace de travail | ICONOKOM — `650579697e0e1974b3016c4a` |
| Domaines | `agence-orem.fr`, `www.agence-orem.fr` |
| Sous-domaine de vérification | `orem.webflow.io` |
| Pièges | Plusieurs autres sites s'appellent « ICONOKOM… » dans l'espace : ne jamais les confondre avec Orem. Toujours passer le `site_id` ci-dessus. |

## Pages statiques

| Page | Slug | page_id |
|---|---|---|
| Accueil | `/` | `6a7582333b9ddd4a77302d08` |
| Réalisations | `/realisations` | `6a7dbf0e2ec203e57f8e7e44` |
| À propos | `/a-propos` | `6a7dd249b00b230647bf6d02` |
| Contact | `/contact` | `6a7ed06a2e5bb1e23693d292` |
| Blog | `/blog` | `6a8d70816ca55fc30856706e` |
| Agence web Lille | `/agence-web-lille` | `6ac61124af8e2047b4ff8271` |
| Mentions légales | `/legal/mentions-legales` | `6aa101708e5d116637e95981` |
| Politique de confidentialité | `/legal/politique-de-confidentialite` | `6aa1051b9391937330e82204` |
| 404 | `/404` | `6a8440b8701d33ef3ee85a8f` |

## Collections CMS

Pages modèles publiées (servent des URL) : **Articles**, **Réalisations**, **Offres**, **Membres**. Les autres collections alimentent des sections (modèle non publié).

| Collection | collection_id | Page modèle |
|---|---|---|
| Articles | `6a759b5e8c6a9cdbe2787bc3` | `/articles/…` (`6a759b5e8c6a9cdbe2787bc9`) |
| Réalisations | `6a759af703d4ca7e4b686bb9` | `/realisations/…` (`6a759af703d4ca7e4b686bbf`) |
| Offres | `6a9138262200aeae4011d357` | `/offres/…` (`6a9138272200aeae4011d3c7`) |
| Membres | `6a759ac144dc0178f0b2fc75` | `/membres/…` (`6a759ac144dc0178f0b2fc7b`) |
| Catégories (blog) | `6a7ee1c1ca14fc2bb3b4ad0c` | non publiée |
| Clients | `6a759a9eecb99463c74ef582` | non publiée |
| Compétences | `6a759a9f35fcd2e49d947289` | non publiée |
| Prestations | `6a759aa0e2aa3976fe4c1343` | non publiée |
| Services | `6a759adf6dc08f46cfb5f991` | non publiée |
| Témoignages | `6a759b2503d4ca7e4b687b21` | non publiée |
| FAQ | `6a759b4141528d216986a56e` | non publiée |
| Catégories FAQ | `6aa101739b73bafc27c7a793` | non publiée |
| Partenaires | `6a7eb44fdec3a47e625d5d18` | non publiée |
| Visuels | `6a83065ad666a6023e699ccb` | non publiée |
| Problématiques clients | `6a91380f2ffa2d065f3eb82f` | non publiée |
| Étapes du process | `6a9138102ffa2d065f3eb8a8` | non publiée |
| Contenu concret | `6a9139d725327b36a89bad77` | non publiée |
| Aspects business | `6a9139d7dda3f5c16113a1c3` | non publiée |
| Posts LinkedIn | `6a9859cec71a573e1fe4467e` | non publiée |

Les SEO des pages modèles sont branchés sur des champs CMS (`seo-titre`, `seo-meta-description`, `title-tag`, `meta-description`, `image-de-couverture`) : ne pas renommer ces champs.

## Custom code constaté le 2026-10-20 (avant audit)

- **Code global libre (Site settings)** : head ≈ 35 Ko (34 blocs `<style>`, 4 `<script>`, Google Tag Manager `GTM-TD7C9Z42`, widget iClosed `app.iclosed.io/assets/widget.js`) ; footer ≈ 46 Ko (15 `<script>`, noscript GTM). Chargé sur **toutes** les pages.
- **Scripts appliqués au site** (footer) : `LogoMarqueeFix`, `DragScrollCasesV4`, `CtaButtonActions` 1.1.0, `OffreHeroVideo`.
- **Scripts enregistrés** : 31, dont de nombreuses versions mortes (`ChoixCarouselEngine` → V9, `StaggerReveal` → V5, `BlogCategoryAuthorFilter` → V5, `DragScrollCases` → V4…), plus `FinsweetAttributes`, `FinsweetLoaderBlog`, `ShowreelTabs`, `FooterRevealOffset`. Vérifier lesquels sont appliqués au niveau des pages avant de conclure qu'un script est mort.
- Code au niveau des pages et embeds HTML dans les pages : à inventorier pendant l'audit.

## Conventions du site

À compléter pendant l'audit : système de classes (Client First ou autre), collections de variables, composants principaux (navbar, footer, CTA…), attributs `data-*` utilisés par le JS, breakpoints réellement stylés.
