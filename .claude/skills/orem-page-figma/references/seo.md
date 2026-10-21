# SEO et GEO des pages du site

Règles issues de la revue SEO des pages `/secteurs/hotellerie` et `/secteurs/medias` (21 octobre 2026). Elles s'appliquent à toute nouvelle page, avant le design.

## Ordre de page (page secteur)

La page parle du métier du visiteur **avant** de parler d'Orem, et la preuve arrive tôt.

| # | Section | Rôle |
|---|---|---|
| 1 | Hero | H1 avec le mot-clé principal en tête, première phrase avec le mot-clé, CTA iClosed |
| 2 | **Cas à la une** | un seul cas du secteur, juste sous le hero : visuel du site livré, nom du client, une ligne de contexte, les chiffres de l'étude de cas, lien vers l'étude |
| 3 | Enjeux | 5 enjeux, le bloc le plus dense de la page (format ci-dessous) |
| 4 | Cas clients | les autres cas du secteur + une carte « Toutes nos réalisations » vers `/realisations`. Pas de cas sans rattachement net au secteur |
| 5 | Avis | après les cas ; avis nominatifs uniquement (nom, fonction, entreprise) |
| 6 | Méthode O.R.E.M. | section officielle, **une phrase par temps, propre au secteur** |
| 7 | **Pourquoi Orem** | un seul bloc court (un demi-écran) : 3 preuves + 2 liens vers les offres. Remplace « Pourquoi Orem » + « Offres » |
| 8 | **Ressource propriétaire** | audit type annoté (capture d'une réalisation du secteur, repères numérotés, 4 annotations) ou comparatif honnête ; aucun chiffre inventé |
| 9 | Articles liés | 3 articles réels du blog, accroche liée au secteur, pas de durée de lecture inventée |
| 10 | FAQ | section officielle, questions réécrites (format ci-dessous) |
| 11 | Secteurs proches | **2 liens contextuels**, pas la liste de tous les secteurs |

## Mots-clés

- Un mot-clé principal par page, deux secondaires au maximum.
- Placement : title, H1 (en tête), première phrase de l'intro, au moins un H2. Une occurrence naturelle par bloc, pas de bourrage.
- Si la demande n'est pas mesurable (ex. « agence web médias »), le H1 vise aussi la requête métier réelle (« identité visuelle pour média », « site web pour média »).

## Enjeux : format imposé

Chaque enjeu est un **H2 avec mot-clé**, puis :
1. deux phrases de diagnostic métier ;
2. une phrase « Sur le site : » (ou « Concrètement : ») qui dit ce que ça change ;
3. un **indicateur à suivre** (mesure à instrumenter, jamais une promesse chiffrée).

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
- Prérequis à rappeler : `/realisations` doit avoir sa navigation par secteur avant la publication des pages secteurs.

## Fiche SEO à poser dans Figma

Au-dessus de chaque page, une frame `SEO <url>` (fond `#fff8e6`, hors de la page) qui donne : URL, fil d'Ariane, title (≤ 580 px, mot-clé en tête), meta description (≤ 920 px), H1, mots-clés, balisage (`Service` + `BreadcrumbList` + `FAQPage`), liens sortants, liens entrants à créer, prérequis.

## Volume de texte

Au moins 1 000 mots propres au secteur (hors avis, méthode, nav et footer), mesurés par script sur les nœuds TEXT, y compris les réponses de FAQ masquées.
