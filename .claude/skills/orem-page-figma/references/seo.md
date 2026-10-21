# SEO et GEO des pages du site

Règles issues de la revue SEO des pages `/secteurs/hotellerie` et `/secteurs/medias` (21 octobre 2026). Elles s'appliquent à toute nouvelle page, avant le design.

## Ordre de page (page secteur « agence web »)

Validé par Louis et par la revue SEO V3 (21 octobre 2026). Ne plus le rediscuter.

| # | Section | Rôle |
|---|---|---|
| 1 | Hero | H1 avec le mot-clé principal en tête ; la **première phrase de l'intro parle du problème du secteur et ne répète pas le mot-clé** ; CTA iClosed ; visuel navigateur + téléphone du site d'un client du secteur et une pastille de résultat réel |
| 2 | **Réalisations en onglets** (collection CMS) | un onglet par réalisation du secteur ; panneau = grand visuel du site, 2 visuels secondaires, nom, contexte, chiffres de l'étude de cas, tags, bouton vers l'étude ; bouton « Toutes nos réalisations » propre dans l'en-tête (pas de carte) |
| 3 | **Enjeux en onglets** | 5 onglets (titres H2 avec mot-clé) à gauche, panneau à droite : visuel de site, diagnostic, phrase « Sur le site : », carte « Indicateur à suivre » + « Où le lire » ; les 5 panneaux sont dans le DOM (Webflow Tabs) |
| 4 | Avis | collection, avis nominatifs, celui du secteur en premier |
| 5 | Méthode O.R.E.M. | section officielle, une phrase par temps, propre au secteur |
| 6 | Pourquoi Orem | bloc court **avec un visuel** (espace client Orem en navigateur + mobile) : 3 preuves + 2 boutons vers les offres |
| 7 | Articles liés | 3 articles réels du blog |
| 8 | FAQ | section officielle, 3 questions-requêtes + 2 objections, toutes les réponses |
| 9 | Secteurs proches | 2 liens contextuels |

Retirés à la demande de Louis : l'audit type annoté (« je ne sais pas à quoi ça sert »), la carte « Toutes nos réalisations » dans la galerie.

## Mots-clés

- Un mot-clé principal par page, deux secondaires au maximum.
- Placement : title, H1 (en tête), au moins un H2. Le mot-clé n'apparaît **qu'une fois dans le premier écran** (le H1) : la première phrase du hero qualifie le problème, elle ne répète pas le H1.
- Title : 450 à 580 px (mesurer) ; meta description ≤ 920 px, dans l'ordre mot-clé, bénéfice, 2 ou 3 noms de cas clients.
- Si la demande n'est pas mesurable (ex. « agence web médias »), le H1 vise aussi la requête métier réelle (« identité visuelle pour média », « site web pour média »).

## Enjeux : format imposé

Chaque enjeu est un **H2 avec mot-clé**, puis :
1. deux phrases de diagnostic métier ;
2. une phrase « Sur le site : » (ou « Concrètement : ») qui dit ce que ça change ;
3. un **indicateur à suivre** et **où le lire** (moteur de réservation, Google Analytics 4, Search Console…). Valeur de départ et cible à 6 mois : mesurées pendant le diagnostic, jamais inventées.

Chaque H2 doit pouvoir être extrait seul et rester compréhensible (GEO : les IA citent des passages, pas des pages).

## FAQ : format imposé

- 5 questions minimum : **3 questions-requêtes** formulées comme on les tape dans Google (« Combien coûte un site internet pour un hôtel ? », « Quel CMS pour… ? », « Comment réduire… ? ») et **2 objections** de rendez-vous.
- Réponses de 40 à 60 mots, autoportantes, avec un fait attribuable (client, chiffre de l'étude de cas) quand c'est possible.
- Question sur le prix : jamais de montant sur une page du site ; expliquer de quoi dépend le budget et renvoyer au diagnostic gratuit.
- Toutes les réponses sont rédigées dans Figma : la première ouverte, les autres en calques masqués `faq-reponse`.
- Balisage `FAQPage` uniquement si la FAQ est visible sur la page.

## Preuve

- Chiffres uniquement tirés des études de cas publiées ; si une étude n'a pas de chiffre (ex. Bund Médias), montrer le contexte et le livrable.
- Un logo client par cas dans le bandeau sous le hero.
- Faits datés et attribuables (client, secteur, livrable, année), pas d'adjectif sans preuve.

## Maillage

- Liens sortants : `/realisations`, les études de cas du secteur, `/offres/site-web`, `/offres/image-de-marque` (ancre « Direction artistique » : le vocabulaire Orem interdit « Image de marque » dans le texte), 2 pages secteurs proches.
- Ancres descriptives et sectorielles, jamais « en savoir plus » ; une même ancre ne pointe jamais vers deux URL.
- Liens entrants à demander (dans la fiche SEO) : filtre par secteur sur `/realisations`, bloc « Ce secteur » en fin de chaque étude de cas, blocs par secteur sur les pages offres.
- Prérequis à rappeler dans la fiche : hub `/secteurs` publié (sinon fil d'Ariane et `BreadcrumbList` mènent à une 404), `/realisations` avec navigation par secteur, liens entrants posés, pages secteurs proches publiées.
- JSON-LD dans cet ordre : `Service`, puis `BreadcrumbList` (après le hub), puis `FAQPage` (FAQ visible). Pas de `LocalBusiness`.

## Fiche SEO à poser dans Figma

Au-dessus de chaque page, une frame `SEO <url>` (fond `#fff8e6`, hors de la page) qui donne : URL, fil d'Ariane, title (≤ 580 px, mot-clé en tête), meta description (≤ 920 px), H1, mots-clés, balisage (`Service` + `BreadcrumbList` + `FAQPage`), liens sortants, liens entrants à créer, prérequis.

## Volume de texte

Au moins 1 000 mots propres au secteur (hors avis, méthode, nav et footer), mesurés par script sur les nœuds TEXT, y compris les réponses de FAQ masquées.
