# Visuels : d'où ils viennent et comment les importer

`use_figma` ne lit pas les URL : une image ne peut être posée qu'avec un `imageHash` déjà présent dans le fichier. On importe donc les visuels avec l'outil `upload_assets`, puis on réutilise leurs hash.

## Règle de choix des visuels

0. **Page « agence web » : uniquement des visuels de sites web** (pages, mockups navigateur, laptop, téléphone). Pas de logos, palettes, cartes de visite, objets ou affiches : ils iront sur les futures pages design. Ordre de préférence : (a) visuels de site des études de cas sur agence-orem.fr ; (b) captures propres des sites en ligne (Playwright, 1440 × 900 et 390 × 844 en @2x) posées dans `browser()` et `phone()`. Si un secteur n'a pas assez de visuels de site, le dire à Louis plutôt que d'utiliser autre chose.
0 bis. **Jamais d'image coupée** : respecter le ratio d'origine (FILL sur un cadre au bon ratio, ou FIT), et aucun visuel ne dépasse le bord du conteneur.

1. **Les réalisations Orem du secteur de la page, et elles seules.** Les visuels viennent des pages `https://www.agence-orem.fr/realisations/<slug>`. Une page « Hôtellerie » montre Huchet-Demorge et Hôtel Eiffel Ségur, **pas** Casa Zanoni (refusé par Louis : ce n'est pas de l'hôtellerie). En cas de doute sur le rattachement d'une réalisation, demander à Louis.
2. Visuels de marque Orem (illustrations O.R.E.M., photos d'équipe, portraits d'avis) : réutilisables partout.
3. Aucune image générée par IA, aucune banque d'images, aucun visuel d'un client hors secteur pour illustrer le secteur.
4. Aucune capture plein écran d'une page existante utilisée comme image de fond.

## Récupérer les visuels d'une réalisation

```bash
DIR=<scratchpad>/visuels-<secteur>; mkdir -p $DIR; cd $DIR
curl -sL https://www.agence-orem.fr/realisations/<slug> -o case.html
# Grandes images (on ignore les variantes -p-500 / -p-800)
grep -oE 'https://cdn\.prod\.website-files\.com/[^" ,]+\.(avif|webp|jpg|png)' case.html \
  | grep -iE '<slug-ou-nom-client>' | grep -vE -- '-p-[0-9]+\.' | sort -u
```

Les noms utiles : `miniature-<client>` (vignette de cas, 16:10), `image-case-<client>-1..3` (carrés 600 px), `visuel-<client>-NN` (mockups, collages), `logo-<client>` et `logo-<client>-blanc`.
Le texte de la page (contexte, solution, chiffres) est **rendu en JavaScript** : `curl` ne renvoie que la nav. Le lire avec Playwright (`document.body.innerText`, le corps de l'étude suit « Gérer mes cookies ») ; on récupère au passage les URL des images (`img.currentSrc`) et le lien « Visiter le site web ». C'est la **seule** source autorisée pour les chiffres de résultat.
Étude de cas pas encore publiée (ex. Sleepee by tim, octobre 2026) : lire le brouillon dans le CMS Webflow du site Orem (collection Réalisations, lecture seule, ne rien publier), et capturer le nouveau site sur son URL de préproduction `*.webflow.io` (masquer le badge « Made in Webflow »), jamais l'ancien site en ligne. Le lien vers l'étude est à activer à la publication.

Convertir en JPG (AVIF n'est pas accepté par l'import) puis faire une planche contact pour choisir :

```bash
python3 -c "
from PIL import Image; import glob
for f in glob.glob('*.avif')+glob.glob('*.webp'):
    Image.open(f).convert('RGB').save(f.rsplit('.',1)[0]+'.jpg', quality=92)"
```

## Importer dans Figma

1. Créer, **hors de la page en cours et hors de toute frame existante**, une frame `sources-visuels/<secteur>` (auto-layout horizontal avec retour à la ligne) à droite de la zone des nouvelles pages, avec une frame vide nommée par visuel.
2. `upload_assets` avec `count` = nombre de visuels, `nodeIds` = ces frames, `scaleMode` = `FILL` (ou `FIT` pour les logos).
3. POST de chaque fichier en `multipart/form-data` (champ `file`) sur son `submitUrl`. La réponse contient l'`imageHash`.
4. Noter les hash ci-dessous pour les prochaines pages.

## Hash déjà présents dans le fichier

### Hôtellerie (frame `sources-visuels/hotellerie`, 3821:2337)
| Visuel | imageHash |
|---|---|
| miniature-eiffel-segur (illustration façade + logo) | 338fc4b0a834b40f44bb2f7b876eadbd77f0f177 |
| image-case-hotel-eiffel-segur-1 (iPhone, notification de réservation) | 8d39a4d092a9dc419cfecd82827cd323f82b9dbb |
| image-case-hotel-eiffel-segur-2 (façade + fiche chambre) | 296e7b1429a3e8f481af72c7516b0c4b51a7283f |
| image-case-hotel-eiffel-segur-3 (livret de marque) | df1cb0938d988a959e6fbb963ad995a077dd26f4 |
| visuel-hotel-eiffel-segur-13 (page chambre desktop + mobile) | 165c956d22bbf3ea5617cdeadd7a4d58482451cf |
| visuel-hotel-eiffel-segur-9 (collage photos hôtel) | 1e5b366f0c73dd5e13392e2968c979ce19bef402 |
| miniature-huchet-demorge (façade haussmannienne + logo) | 934541b0db5669417f33d25ae3229de711945074 |
| image-case-study-huchet-demorge-1 (livre sur fauteuil cuir) | 889a487625449d10db22814b5efe3eec044011ed |
| image-case-study-huchet-demorge-2 (stand d'exposition) | 81c5559488defa2f4feabda93d3e15eea405fa53 |
| image-case-study-huchet-demorge-3 (monogramme HD) | b34e527e7127495f8c195f5f85c0ec77c30da9ce |
| visuel-huchet-demorge-29 (iPhone, site Huchet) | 991ef780cc53ba99990b5dd4c38069f9981e9cbc |
| visuel-huchet-demorge-18 (affichage abribus) | 1b15d778505c583a8017387922f1433ac82c0afe |
| visuel-huchet-demorge-22 (newsletter) | b38e0b7e55d616e2fe1b807fd57d3c4b6dc43a05 |
| visuel-huchet-demorge-12 (CTA du site) | 44ef70f6833024ad7db9b7d5d93004eb4f48435f |
| visuel-huchet-demorge-4 (palette) | f0b38266a8a84593de8d4eac9e18acd68f1e84a4 |
| visuel-huchet-demorge-5 (nommage des tokens) | c9d3e5e3b11c1652d8ac93e3f4a50972c30c0cd5 |

### Médias (frame `sources-visuels/medias`, 3835:1747)
Réalisations du secteur : Le Crayon Groupe, Riskintel, Aktionnaire, Bund Médias.
| Visuel | imageHash |
|---|---|
| miniature-le-crayon | 0a67677b9ad6f1e683a9cea0ab0f0023e6d746a9 |
| image-case-study-le-crayon-1 / 2 / 3 | dc3aa1a71c87c1112684feb57eb47c8ccef94ae0 / a2b7b95d16a9d05277963e643c89a9fc91e6edfa / 19802a4de9ed895fca83a176c2aa456cbebac032 |
| visuel-le-crayon-2026-01 (affiche) / 02 (palette) | d21b359dd6b3b8b6c07d2f787263b199ffa5a705 / 6280fd527de8c7e45d0982ac3ee34713a80a153c |
| visuel-riskintel-01 (logo sur ciel) | 14234f5054560d252dc9016161f8cbeb011924a3 |
| visuel-riskintel-v2-01 (3 entités) | cdf7e9526a2419f18df77e73a101e5d3d59217ba |
| vignette-riskintel-v3-1 / v2-2 (badge) / v2-3 (iPhone) | 0243796ae94e4a94bede350ac5bbab5651f7f115 / 049de625f867c7d37c2d0c358ccf9b1adfa30b5c / e3defc5503a324a4cc3a75e0e4035cb0889b3fef |
| visuel-aktionnaire-01 (logo) / 02 (palette) | e321ce0d5c3a1fa6f39d4315a7ed2bc03b3f1fee / 2831d65b6327475f7ae3b988d22fc4bbac5f0aab |
| image-case-study-aktionnaire-1 (site) / 2 (articles) / 3 (tasse) | 5c766914d11a62a0b5b87ab9dc13bedfe138392a / a2ed676b49b8b19e4ea18446102c42119a1e32ef / 6eb54964193a953f1f4f7d03f6183e757a82f093 |
| miniature-bund-medias | f34596d6d4fd152b9552b791c1c5de7d4a987a2b |
| image-case-bund-medias-1 / 2 (casquette) / 3 (formulaire) | 8d53c6fe9f0e1bf6dae7a12311ae37e4ecf1529e / 4b351d17a5ebf091bb269115655d61a04405a826 / c8d71d8d88dcea12525f7f58374e2c59a74a9548 |

Chiffres réels utilisables (pages de cas) : Le Crayon, plus de 1 000 demandes qualifiées et 70 % du trafic en SEO ; Riskintel, plus de 500 leads et trafic organique multiplié par plus de 250 (janvier à août 2026) ; Aktionnaire, plus de 2 000 inscriptions newsletter et position moyenne de 27,8 à 6,3 ; Bund Médias, aucun chiffre publié (ne pas en inventer). Hôtel Eiffel Ségur, position moyenne de 38 à 6 et 398 visiteurs venus des IA ; Huchet-Demorge, environ 5 demandes qualifiées par semaine.

### Visuels de sites web (frame `sources-visuels/sites-web`, 3848:1792)
Mockups d'études de cas (ratio 2160 × 1460 ou 1080 × 730, sauf mention) :
| Visuel | imageHash |
|---|---|
| visuel-hotel-eiffel-segur-13 (page chambre desktop + mobile) | 165c956d22bbf3ea5617cdeadd7a4d58482451cf |
| visuel-huchet-demorge-28 (laptop) / -11 (écran carte) / -29 (iPhone, 532 carré) | c57b71a37f6b3b7bf519171690ac88ee4714dcf5 / 263b503364de59e58dddfa6ffa4992e8a19ea3ac / 991ef780cc53ba99990b5dd4c38069f9981e9cbc |
| visuel-le-crayon-2026-06 (navigateur) / -12 (laptop) / -16 (Le Surligneur) / -26 (iPhone) | 8ed054f2c25122fe5815c3b4d3e6534d58cd0f45 / 029552243c0bbfb4383e510e49efb36d08cec5e0 / 7f1305c9b2898508370805c88e3bf51016111b39 / 7587bb223747945f23755caa786ce74f8a8131dd |
| visuel-riskintel-04-v2 (navigateur) / -05-v2 (3 entités) / v2-10 (laptop) / v2-08 (iPhone, carré) | f1d82077b27c8d4d51af878530928e1ddd3537ce / 004d15c581c9a6aa02644c2538490fbd8f92c14c / 941fb880c15238d5da199f9333017a23d84e40c8 / c0e6e2d7b31eaf658be4e0f45bea9101efacdcb0 |
| visuel-aktionnaire-04 (site) / -13 (laptop) / -08 (téléphones) / -05 (formulaire, carré) | b428e6d2bc714a8c539e742a102fcb6f4e02c5ef / fe2522970932610c4238c969220b4528e0938068 / e711d25c069911d0c4739c433d5b90be270982e6 / b77def2a94a866b4f0479bdcb2be7be6db51b08c |
| visuel-bund-medias-3 (site) / -4 (mobiles, 1620 × 1095) | bdc5af71fc0afd56ff015dba0bc932f34efbd0ab / 3c46f5234713901d34d03176a4ad26bba80dc904 |

Captures des sites en ligne (desktop 1440 × 900, mobile 780 × 1688) :
| Site | desktop accueil / autre | mobile |
|---|---|---|
| paris-hotel-eiffel-segur.com | 4ac7342404a4a676f5c5483166da4ec73797b976 / 10f1fba959b179894033df85216b850fc6307d0f | 3dd3d75e743e3e4204b91363d741db0d34be43fa |
| huchet-demorge.fr | 8a9141de4130bca24d5a24a0104ab29bb42862f9 / 15da19f252826982e097dbd7025d3c696d1c8c74 | 75ee879964a71aa1bdafefa09506c108b542457b |
| lecrayongroupe.fr | 705674d3ba5ab75d273718e2b6c6b68ba4549944 / 7362962f80b0f663616f3703ed9188855e706e25 | 91c856dc6d04109aa8d9957574ec0b8c9905cf08 |
| riskintel.fr | 60feec6c583051f6177cacc1c8d52d1e31a69352 / d3828bec4eeb4ae970ddfea42d963147b4e031bf | a8def56f2067d130c899a7f07e10a56e5112ba0b |
| aktionnaire.com | cb7550da79209f471a16f3287a44bca6ac081dce | 625cdda3606eca462f75fe64eabe27ee5e2bb290 |
| bund-medias.fr | 4f546ea20b9c4e3ff2d4e0b8a9b8e79dd7861f10 | b7734394bfc40057963ee58422ea5626b413da5b |

### Portraits d'avis (kit `orem-da`, `template/assets/avis/`)
| Personne | Rôle | imageHash |
|---|---|---|
| Hugo Demorge | Négociateur hôtellerie, Huchet Demorge | ba544a498d75bc862eda24e33861912025e1e0b3 |
| Wallerand Moullé-Berteaux | CEO, Le Crayon Groupe | 26cb74a0b6022a70a8eaea167d5b7f75fc692001 |
| Virginie Hilssone-Lévy | Fondatrice, 24 Degrés | 685577d9dd6ac4fcceb9d7a35e9b3a1c83c2286f |
| Julie Egron | Fondatrice, Concilium Le Recruteur | e2c8221c701759bc3cb7f3cf4797aebac1556543 |
| Justine Timbert | Fondatrice, H19 | 72f52e83b37ae9daa72f3bc004f9fa5b12ad42fe |
| Julia Auriault | Avocate associée, Valere Avocats | 38d06ee861947b5fcc72f622585a6ef31840f3ee |

Les textes exacts des avis sont sur la page d'accueil du site (bloc avis). Ne jamais réécrire un avis : on peut le couper, pas le reformuler.

### Logos clients (kit `orem-da`, `template/assets/logos/`, importés en FIT)
| Logo | ratio l/h | imageHash |
|---|---|---|
| hotel-eiffel-segur | 3.57 | 4c1d3836264eff314fa4d5cfe3d68eb45cc5a6d3 |
| hotel-eiffel-segur-blanc | 3.56 | dfba9f701d7fe38c40de4df3969bf8d6c2bde75f |
| huchet-demorge | 3.84 | fa1a9d55ababe0d2a93e2d5cba5740ca76f30140 |
| huchet-demorge-blanc | 3.84 | 03670dcf8697a1ba7b2cfd65bf385d30a8dcc6fc |
| le-crayon | 5.0 | 0801825e6e65e0ab25718295a0a8bb3ae6af6850 |
| h19 | 1.95 | bca85dc7b18e92c2ec8640dc1c87195cee254232 |
| valere-avocats | 0.87 | db241dd11501d34136a832972563c86c7207c065 |
| concilium | 9.5 | fc4dc4bf6b497dc45eec9d57e5d8fc2d774e9f07 |
| 24-degres | 3.24 | 36dc90869a7110691789fa4b2f9d59747e252663 |
| riskintel | 3.82 | cf0379e2c7e6829f1e4e66393953221697ac8c4d |
| bund-medias | 3.40 | be7ca94f63067d977a912f2278d02cb9395032d7 |
| aktionnaire | 3.87 | f487b49b4bf5352bcaa79a0d319f7f0773e9bd45 |

Mettre les logos du secteur en tête du bandeau.

### Visuels de marque Orem déjà dans le fichier
| Visuel | imageHash |
|---|---|
| Illustration Orienter | af8979dd525f5fd5088323d94446841da2b87c46 |
| Illustration Représenter | a9bac20c5d21b638c82972194ff751a891a8911d |
| Illustration Exécuter | 97e06432670b33b051a245a5f763e4dc92908110 |
| Illustration Mesurer | c5cf91381f9c921f7c69251f7dd11953537ffdab |
| Espace client (capture desktop) | b32ffe58b12f6f7c4b3200424b3ee3f65ad5d71e |
| Espace client (capture mobile) | a023fbadcf96fa2623f1437e39f203d6c8bdb97b |

Pour un nouveau secteur, compléter ce fichier avec les nouveaux hash (et pousser la mise à jour du skill).

### Pages secteurs d'octobre 2026 (frames `sources-visuels/<secteur>` à x = 9600)

Chaque frame contient toutes les images importées, nommées. Principaux hash :

| Secteur (frame) | Capture desktop accueil | Capture mobile accueil | Mockup principal | Logo (FIT) |
|---|---|---|---|---|
| RH, Concilium (`3859:8124`) | 29e61b021f351f5fcd0d7d4fa528360112c33956 | 43eaa103fc88e71fa553e4c3cccd279808ffa451 | 02e83546c4a8e97e06764bb31cff17ea5020d8b1 (recomposé, l'étude n'a que des visuels de marque) | — |
| ESN, Logical Conseils (`3859:6943`) | 1ae693702cb2a18ad24d351449bde94e6e73b1d9 | 1d9f2ab3bdb06714350ddfcab3046655e6486ddb | visuel-6 578db7f509d1c5ab3767d5b90d6992a31c21cbf5 | 754ff7d2d2febb112fe1465dc4b4253693e31a81 |
| Santé, Sleepee by tim (`3859:2702`) | 743d00de9f818bf7ae37279cd9724cb73fa475f6 (préproduction) | 0496a8446e4a13c5cb8ec4d55c160bbe82ccf543 | a-bonus 60fe8c595b507f9e77a6acdff2805390a965d222 | 0c13be4f52889d506d55382a6f4ea6c1c9a37e44 |
| Coachs, SforSales (`3859:2725`) | 5cf5674810d0c9ac314095f16261d8fd20fa7fec | f6c5ef08f4c590cb30be6eb415f9b4353f280af4 | b-bonus 85f46d2b982c56850ee87c78513b61798f8a6762 | 69cf9cbb6010b280650caf98ae0f1441a217a7a6 |
| Coachs, Dipita (`3859:2725`) | 35e3b51e47174c1f17af6a533d3497cb46c936b9 | 8a0b0dff5e310914397e5db3a7d08383b68b9a05 | 04 86edc627a510a954bccb7ffbe44c6b81a99ba5eb | e69cf133a4bdccf5d440327b1f4f2c58c12cbe7d (rond ; ne pas utiliser 64bc527e…, logo d'une université) |
| Associations, Les Ombres (`3859:8710`) | 774f1e769f66a47afdac5cb96d868e8837aaac1a | 44e48e400ef76d6426a0f8a01aa037c9985684a1 | 04 8ad21329e688e9039ac5e6817f4c27472ccf7154 | 515f5cca96c890961227411faf8e02f763bba469 |
| Associations, Impulsions (`3859:8710`) | 02144dd7dc861d50dc4be00c68674a3d59c781dc | f9b1e1b8fcd9105f9fbbeaad29c06689cf0184c8 | 04-v2 08188f68f8c4ca20be028eb234c0e66fb270dbe2 | 95f47f39112cb2502424e0c1bfaa502ec8f3f8ac |
| Production, Dim Sum (`3859:8744`) | 21289a637373259287bb63b0d1be50bf293c0230 | dfed7dc823a315aad372d410455b0fdcc56dc44b | visuel-4 c9a523971755a08edebc673dc7075a8c0f6c11bc | 42d1c176f47e35801d1a3fd4b712fedaa0e9f3f7 |
| Agences, 24 Degrés (`3859:9926`) | b31a49e53989fd5e01753cb3f8647c1954bd7f3c | 1c6d50159686e6ba9f9aa4c3908bbf95ef029fc0 | b-bonus d19897263831eeb80772abbe3af3f723fd05b5ba | — |
| Agences, Orem (`3859:9926`) | aecc4b40af7dacd6b6d1dbd047e2424637002194 | 3edb013469cec679c33c3866ba2ab9d2430e0bb8 | 9c43bdd54060cdb2c9bf4a85a46bca1595d47ba3 (recomposé, l'étude n'a pas de mockup de site) | — |

Portrait d'avis Mathéo Lamblin (JUWA) : c2d647fc4407bc8ebf451ab26f43bf42188a90eb.

### Visuels de DA des pages identité visuelle (octobre 2026)

Chaque frame `sources-visuels/branding-<slug>` contient tous les imports nommés. Principaux hash :

| Client | Visuels |
|---|---|
| Huchet-Demorge | affiches métro 13 5c0da98828754301cfb30883a09ee6184fa2e4c4 ; affiche en gare 23 26cf0472601d69876693e8c51577861d2126b508 ; pictogrammes 16 b63c8e13af090c14129309ca1e0eba3c371b96eb ; montre 26 b4fa35a1d7f6534c82a673e9d4ed927e71e3a1c2 ; affiche murale 9 d2161193b4ef11be5731cafa1d4ecf0205f53109 ; stand 20 b72d3d386541d89e947addb91528b741790dbcc8 ; monogramme 25 c812114b257837857dd29337f8ab8d013c48a40f |
| Le Crayon | typographie aec36b4d5ef7a7000bc903681c69f806eed549c0 ; logo mural b5f92402759753ff26f66f7c1a36703340c425bb ; manifeste 31ca15462516dd19b6784dba800c60f36ca27201 ; affiche fondateur bf408379b07d2c117c2973c884f8fd94bf1e2a1a ; trois filiales 3b0f3c94e4847dddb87dad19ef3d0c35540c87bb |
| Riskintel | palette 530c4cd8d5063ba2c30c12d155f3262ece7e146f ; badge c30ada3ce28a60b0d06022e48d6b912fd98cafeb ; enveloppe b3a6ff31698a3b672917230326d414af3bbef515 ; typographie 75f5605ad2b6babca97cd83e6965733e2edef30d |
| Aktionnaire | logo 2e6f7d2208a18a9f13b67b3a05154c7cb34c5877 ; tote bag cad3ab056a1a6548ed119d489ae57a61bba6eb50 |
| Concilium et Le Recruteur | symbole 22c5d0445cf6d740e327ac350523cf3a26a76354 ; logo Concilium 27041c869656389b5cc09d16ead1fd999cfc1565 ; cartes de visite 99c5c2ebc6ce9f339efa41e1f2c3c84248951762 ; typographie b90c9aabad5ca5308916f4eb3866d7da62dca420 ; logo sur ciel a449de3a4614b1ba6abbbca81b36d8397b701afa ; signalétique cceeb3ac6345b939656df447b0b2e1d9ea4c458e ; palette 955974efc20147b9050bef231f5ad4f56ee3ad45 ; logo Le Recruteur 95fb1d4156f2ac43075f214d0044bffd4b8fdab3 ; support de formation 963de1bf56d79e519595b03a517ae419a3e3819c ; affichage 7858b8810708be906d8218e797216afa69b4b14e |
| Logical Conseils | bâche ec7a35d3478a7d6ed10622892a9a2abd84c52837 ; expertises 458a0bf98967bdb7ac140949ce2e3cec52fdce2d ; métiers e635e5a0c9170b4704343657d32fc4f0b41e1c87 ; story 5e1c2a7460a91f4b1a7fcf3fd6043941d99fb305 ; section CTA (visuel 3) c8740f87fec33aa165fa736ee240d4de20d95ac8 |
| SforSales Academy | logo 6b843cdd29b3a514344d2529ff0d0a927d8427b9 ; palette efbf001b71713bec649cbfd2ed38b10a5f13cf0e ; typographie f5bfe6d3361ac126f182403108d124d87a680294 ; logo mural 7b1f7496ee5bfeb47dc714451810123a08ac161f ; accroche 116cc61794a8763d78df65d1ed57329313797d2c ; affiches b1e2e9440b90a48351f09f30f9c996e913354f1e ; motif baab3ea2d5e663acbdef2114d7694d1291ac53b4 ; playbooks e4ea18a8cf1c5e3ee5d47e4c9bd07724f3df6e8c |
| Dipita | logo fa5d2f82588131df1bbdb905271cc4aed8baca97 ; palette c4409cd3aa9ec2cf269111048112a7ef6fcf92c6 ; typographie 03101a3e73ce449194432c52e3fb6a2ff51180e1 ; salle de spectacle d4bdc2141d9c1759361f8f97c6518e0950497501 ; carnet 76767b84e1680a1544aec332e86d61c041ad5a72 |
| Les Ombres | logotype 46152170b004e32e513f6070c16f87f0bd461dab ; palette 910dc2ff0116837d47c1ef6cdab16c74899bdc9f ; typographie b1ee93377f62db1c49c428a92fdb1c8ad8ce1fca ; « Tous ont en eux » c76d3fd0b1d8a13f675d35048daf01e86c957280 ; chevalet b921ea996a0540d8570292bd8d15537c278df519 ; stop-trottoir 4c672b61075a2621a15e8ad079e938bc3a65652c |
| Impulsions Métropole Sud | logotype 86e2680d19ac57b74f727bff1e1bc7cba0ffd9b7 ; palette 296f650da1bf25e81f649104515cf827f05aa901 ; typographie c45f0e2ef3be04c18270ea54ebaccdfd85b006b3 ; iconographie a7a724575928a2907c63b25646140448bbb7e093 |
| Dim Sum | mascotte a5c9a70ae97fa7952cc419d9b4b9aac3a39cba29 ; pictogrammes 371364cd6f2decc79df98eb93b897bde1ca55ce7 ; fiche graphique da21cc04e383fb7d0bb258ceeb2441eaab108732 ; typographie 90cfda3bc421bc377f0259eff1b80a0e05b1609c ; stories Plan Cut ca0fa4c2b124fff65053f919717c5b7c0e1f1985 |
| 24 Degrés | logo 01644195e7d60056b8736a4be72e4829f1cff2d9 ; palette eaafa79fbb3a1fb83327d21a62417c70f1c721a6 ; typographies de8f50b524036804c94d545fbb50acd7e43eee19 ; campagne Terre f2ef27ced00b020ffc749894258fd11a6a1ab9fe ; affichage a9db71f20d1ddce206905aaa6600fe251faa48f8 ; offres 5a80858647641096320b39d39991513fa5bc3127 ; carte de visite 8ff64546d5b86aea6cbc0974747d10935ac9aa1b ; pictogramme météo 88c299218f1f35664fe015a91fd054fcaeb144db |
| Orem | logo sur nuit bleue 7eb85d69b0de17453360ca7d23e4b82efece837f (l'illustration « Représenter », blanche, se pose sur fond encre) |
