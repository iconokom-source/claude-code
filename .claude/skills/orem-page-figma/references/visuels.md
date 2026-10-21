# Visuels : d'où ils viennent et comment les importer

`use_figma` ne lit pas les URL : une image ne peut être posée qu'avec un `imageHash` déjà présent dans le fichier. On importe donc les visuels avec l'outil `upload_assets`, puis on réutilise leurs hash.

## Règle de choix des visuels

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
Le texte de la page (contexte, solution, chiffres) se récupère en retirant les balises : c'est la **seule** source autorisée pour les chiffres de résultat.

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
