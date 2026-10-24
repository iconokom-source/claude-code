# P-11 — Outils extérieurs (iClosed, Axeptio, GTM/gtag, webfont.js) : état des lieux et propositions

2026-10-22, lecture seule : rien n'a été modifié dans Webflow.

Sources :
- `audits/mesures-2026-10-22/` : 15 mesures Lighthouse mobile du matin (07:38), 5 pages.
- `audits/simulation-tiers-2026-10-22/` : accueil, 3 passages par cas, un outil bloqué à la fois.
- Lecture du conteneur GTM publié (version 4), de la configuration Axeptio publiée et du HTML en ligne.

## 0. À traiter d'abord : décalage de mise en page apparu avec le footer natif

La simulation de l'après-midi donne un score de 13 sur l'accueil, contre 39 le matin. La cause est un **CLS de 1,1** sur l'accueil, contre 0,03 le matin. La mesure du matin a été faite à 07:38, avant la publication du footer reveal natif (P-15 reveal / P-04) à 08:17.

Mesure directe sur agence-orem.fr (`tests/decalages-cls.mjs`) :

| Page | 412 px (CPU ×4) | 1440 px |
|---|---|---|
| Accueil | 1,29 | 0,53 |
| Réalisations | 0,69 | 1,09 |
| Contact, À propos, Mentions | 0,00 | 0,00 à 0,05 |

Google juge « mauvais » un CLS au-delà de 0,25.

**Ce qui se passe.**
- Au chargement, des scripts changent la hauteur de la page :
  - accueil : une section passe de 1 715 à 954 px vers 1,3 s ;
  - Réalisations : la grille passe de 3 524 à 8 819 px, puis à 8 608 px.
- Avant, le footer était `fixed` : il ne dépendait pas de la hauteur de la page.
- Il est maintenant `sticky`, donc rattaché au bas de la page. Chrome compte chaque changement de hauteur comme un déplacement de la vidéo du footer, alors qu'à l'écran rien ne bouge, puisque le footer est derrière le contenu.
- Ce n'est pas qu'un artefact de test : le CLS des vrais visiteurs Chrome, qui alimente les Core Web Vitals de Google Search, est calculé de la même façon.

**Options**
- **A. Revenir à l'état d'avant** (sauvegarde `sauvegardes/2026-10-22-P-15-reveal/`) : CLS ≈ 0,03 comme ce matin. On remet le JS de scroll du footer.
  - Risque nul : c'est l'état testé jusqu'à ce matin.
  - Demande une restauration, un test sur orem.webflow.io et une publication.
- **B. Garder le footer natif et supprimer les changements de hauteur à la source** : section de l'accueil, grille de Réalisations. Plus long, à étudier section par section ; le CLS reste mauvais pendant ce temps.
- Recommandation : **A maintenant**, puis B à froid, pour reprendre le footer natif une fois les hauteurs stabilisées.

## 1. État des lieux chiffré (toutes pages, médiane des 15 mesures du matin)

| Outil | Poids | Requêtes | Calcul (main thread) | Blocage (TBT) | Chargé où |
|---|---|---|---|---|---|
| iClosed (widget « Lift » + React + polices Inter) | 530 Ko | 8 (11 sur Contact) | 553 ms | 433 ms | head global, toutes les pages ; Contact a en plus un calendrier intégré (onglet 2, masqué au départ) |
| Axeptio (bannière cookies) | 344 Ko | 8 à 13 | 1 041 ms | 500 ms | head global |
| GTM + gtag (GA4) + Clarity | 325 Ko | 3 (+ Clarity) | 552 ms | 308 ms | head global |
| `webfont.js` (polices Google) | 6 Ko + 83 Ko de polices | 1 + 6 | — | bloque l'affichage ~0,9 s (estimation Lighthouse) | ajouté par Webflow (Google Fonts des réglages du site) |

**Total des trois tiers : ~1,2 Mo, ~2,1 s de calcul et ~1,2 s de blocage sur un TBT médian de 973 ms**, soit l'essentiel du TBT.

Simulation sur l'accueil (médiane de 3, hors CLS) :

| Cas | FCP | LCP | TBT | Poids | Requêtes |
|---|---|---|---|---|---|
| Actuel | 2,95 s | 9,7 s | 1 310 ms | 5,2 Mo | 101 |
| sans iClosed | 2,88 s | 9,7 s | 818 ms | 4,6 Mo | 94 |
| sans Axeptio | 2,82 s | 9,6 s | 842 ms | 4,9 Mo | 94 |
| sans GTM | 2,67 s | 9,2 s | 972 ms | 4,9 Mo | 96 |
| sans webfont.js (polices non chargées : borne haute) | 2,63 s | 8,9 s | 1 296 ms | — | 101 |
| sans les quatre | 2,39 s | 5,7 s | 58 ms | 3,9 Mo | 74 |

Le bruit est fort : TBT de base de 969 à 5 333 ms selon le passage, et la vidéo « conception création » de 8,6 Mo est chargée ou non selon le carrousel. Les écarts de LCP (−4 s sans les quatre outils) viennent de la bande passante partagée avec le logo et la vidéo du footer, qui restent l'élément LCP.

## 2. Ce que fait chaque outil

**iClosed.**
- Le script du head (`widget.js`, `data-cta-widget="rwHV-P4jCI50"`) affiche le widget flottant « Lift ». Il télécharge 430 Ko de script, React et ReactDOM, deux CSS de 47 Ko et la police Inter en 9 graisses.
- Tous les boutons « Réserver un appel » / « Prendre RDV » sont de simples liens vers `app.iclosed.io/e/ICONOKOM/rdv-30min` (nouvel onglet) : ils n'ont pas besoin du widget.
- Le suivi `book_call` est fait par GTM, sur le clic des liens contenant `iclosed.io` : il ne dépend pas non plus du widget.
- Le widget n'apparaît pas sur les captures Lighthouse à 5 s. Son API (`app.api.iclosed.io`) est bloquée par le réseau de cette session : impossible de confirmer ici s'il affiche quelque chose.

**Axeptio.**
- SDK de 200 à 220 Ko, plus `datacenter-ranges.js` (107 à 115 Ko) et `behavior-detection` (9 Ko), qui servent à détecter les robots.
- Axeptio charge aussi ses propres polices : Lexend Deca 100–300 et Source Sans 3 en 4 graisses.
- Consent Mode v2 : tout est refusé par défaut, avec `wait_for_update: 500`.
- La configuration publiée n'a qu'un écran « bienvenue », sans liste de services.

**GTM (`GTM-TD7C9Z42`, version 4).**
- Balises : Google tag GA4 `G-DFTYWVYRVJ` ; événements `generate_lead` (déclenché par `form_submit_success`, envoyé par le script du footer global), `book_call`, `cta_click` (liens /contact sur l'accueil et les offres) et `scroll_depth` (accueil et offres) ; Microsoft Clarity `yjmq0todzd`.
- gtag (191 Ko) est le script Google chargé par la balise GA4 : il est incompressible tant qu'on garde GA4.

**webfont.js.**
- Webflow l'ajoute parce que Lexend Deca (300 à 700) et Trykker sont déclarées comme Google Fonts dans les réglages du site. Aucune police n'est hébergée (liste des polices personnalisées vide).
- Lexend Deca est servie par Google comme **un seul fichier variable de 39 Ko**, identique à celui du skill `orem-da`, plus Trykker en 12 Ko.

## 3. Propositions (une à la fois, chacune avec votre accord)

| # | Proposition | Ce qui change | Gain mesuré / attendu | Risque | Code |
|---|---|---|---|---|---|
| T-1 | **Retirer le widget flottant iClosed du head global**, si vous confirmez qu'il ne sert pas ou que vous pouvez vous en passer. Les liens de réservation et le calendrier de Contact restent tels quels. | 3 lignes en moins dans le head global | −570 Ko, −7 requêtes, TBT −430 à −490 ms sur chaque page | faible : perte du bouton flottant s'il s'affiche ; `book_call` inchangé | **en moins** |
| T-2 | **Polices hébergées par Webflow** : envoi de Lexend Deca (variable) et Trykker en polices personnalisées (`font-display: swap`) par le MCP, puis retrait des deux Google Fonts dans Réglages du site › Polices (Designer uniquement, l'API ne le permet pas). | `webfont.js` et la CSS Google disparaissent (à confirmer sur orem.webflow.io) | FCP −0,3 s mesuré (jusqu'à ~0,9 s selon Lighthouse), 2 domaines en moins | faible à moyen : vérifier les graisses, les caractères (œ, ’) et l'absence de conflit de noms pendant la transition | **en moins** (natif) |
| T-3 | **Alléger Axeptio depuis son administration**, pas dans le site : ne plus charger ses polices (le site a déjà Lexend Deca) ; voir si la détection de robots peut être désactivée. | réglages Axeptio | −30 à −150 Ko selon ce qui peut être coupé ; le SDK (~1 s de calcul) reste | faible | aucun |
| T-4 | **GTM : pas de changement dans le site.** Le garder tel quel (suivi des conversions). Retarder GTM ajouterait du code et ferait perdre des visites courtes : déconseillé. | — | — | — | — |

Ordre conseillé : **0 (CLS)** → T-1 → T-2 → T-3.

## 4. À signaler (hors performance, à votre décision)

- **Clarity se déclenche dès le chargement**, avant tout choix dans la bannière : déclencheur `gtm.js`, sans condition de consentement dans GTM. Lighthouse, qui n'accepte rien, montre l'envoi vers `c.clarity.ms`. Point RGPD/CNIL à régler dans GTM (exiger `analytics_storage`), pas dans le site.
- La bannière Axeptio n'a qu'un écran de bienvenue, sans détail des services (GA4, Clarity, iClosed) : à vérifier côté conformité.
- iClosed et Axeptio chargent chacun leurs propres polices (Inter en 9 graisses, Source Sans 3 en 4 graisses).
