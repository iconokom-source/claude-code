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
- **Choisir le mot-clé sur un volume mesuré** (DataForSEO France), pas sur la formule « agence web + secteur » par défaut. Volumes relevés par l'expert le 22 octobre 2026 : agence web hôtellerie 140 (agence web hôtel 110, création site internet hôtel 70, site web hôtel 40), **site internet association 170** (« agence web association » non mesurable), agence web santé 90, agence web communication 40, site web agence de communication 30, site internet coach 10, site web coach 10, **site internet ESN 10** (« agence web ESN » non mesurable) ; non mesurables : agence web médias, agence web cabinet RH, site internet cabinet de recrutement, agence web production audiovisuelle, agence web formateur, agence web collectivité. Sans volume mesuré, écrire « à mesurer », jamais un chiffre.
- Les requêtes secondaires mesurées ont chacune leur **H2 explicite** (ex. hôtellerie : enjeu 02 « Site web d'hôtel… », enjeu 04 « Création de site internet pour hôtel… », H2 Pourquoi Orem « …agence web pour votre hôtel »).
- **Mesurer** title et meta avant de les écrire dans la fiche : Liberation Sans (métriques d'Arial) 20 px pour le title, 14 px pour la meta, avec PIL `ImageFont.getlength`. Indiquer « N px mesurés ».
- Ne jamais reprendre telle quelle une proposition de l'expert qui enfreint le vocabulaire Orem (« image de marque », « studio ») : garder l'intention, reformuler.

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
- Ancres descriptives et sectorielles, jamais « en savoir plus » ; une même ancre ne pointe jamais vers deux URL, et une même URL reçoit **la même ancre** sur toutes les pages (son mot-clé principal : « Agence web cabinet RH », « Site internet ESN », « Site internet association »…).
- Secteurs proches : 2 liens maximum, uniquement vers des pages qui existent ou sont prévues dans la même vague (pas de lien vers /secteurs/immobilier ou /secteurs/industrie tant qu'elles ne sont pas maquettées).
- Articles liés : le blog n'a que 6 articles. Viser 1 à 2 articles vraiment liés au secteur ; le bloc se remplit avec la production éditoriale.
- Liens entrants à demander (dans la fiche SEO) : filtre par secteur sur `/realisations`, bloc « Ce secteur » en fin de chaque étude de cas, blocs par secteur sur les pages offres.
- Prérequis à rappeler dans la fiche : hub `/secteurs` publié (sinon fil d'Ariane et `BreadcrumbList` mènent à une 404), `/realisations` avec navigation par secteur, liens entrants posés, pages secteurs proches publiées.
- JSON-LD dans cet ordre : `Service`, puis `BreadcrumbList` (après le hub), puis `FAQPage` (FAQ visible). Pas de `LocalBusiness`.

## Fiche SEO à poser dans Figma

Au-dessus de chaque page, une frame `SEO <url>` (fond `#fff8e6`, hors de la page) qui donne : URL, fil d'Ariane, title (≤ 580 px, mot-clé en tête), meta description (≤ 920 px), H1, mots-clés, balisage (`Service` + `BreadcrumbList` + `FAQPage`), liens sortants, liens entrants à créer, prérequis.

## Santé et sujets sensibles (YMYL)

Toute page qui touche à la santé porte une section « Cadre déontologique » (voir `/secteurs/sante`, nœud `3873:5682`) :
1. auteur identifié (nom, fonction, lien vers la page équipe /about) ;
2. dates de publication et de dernière mise à jour visibles (champs CMS) ;
3. ce que nous refusons et pourquoi : promesse de résultat, avant / après, témoignage de patient ; données de santé uniquement chez un hébergeur HDS ; accessibilité RGAA ;
4. sources citées avec lien : RGPD art. 9 (cnil.fr), Code de la santé publique L.1111-8 et R.4127-19 / R.4127-19-1 (legifrance.gouv.fr), RGAA 4.1 (accessibilite.numerique.gouv.fr).
Pas de balisage santé (`MedicalBusiness`), `FAQPage` limitée aux questions de site et de communication, aucun avis de patient ni chiffre de résultat clinique.

## Volume de texte

Décision de Louis (22 octobre 2026) : on garde les 9 pages et des pages complètes. Les formats « allégé » (700 à 900 mots) et « minimal » (400 à 600 mots) proposés par l'expert pour les secteurs à faible volume ne sont pas appliqués.

Au moins 1 000 mots propres au secteur (hors avis, méthode, nav et footer), mesurés par script sur les nœuds TEXT, y compris les réponses de FAQ masquées.
