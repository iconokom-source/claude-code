# Orem : decks (propositions commerciales, recommandations, ateliers, présentations)

Les decks Orem sont des **pages HTML 1920×1080 rendues en PDF par Chromium** (PDF de
1440×810 pt, une slide par page). C'est la méthode qui produit les decks validés par l'équipe
(Terrebrune, FIDEwine, Huchet-Demorge, Au P'tit Louis, Oh My Run) : elle seule rend fidèlement
les dégradés, la trame de points, les formes et la typographie.

## Méthode (par défaut, quel que soit le format demandé « PDF », « deck », « présentation », « document »)
1. `sh scripts/new_deck.sh dossier-du-livrable/` : copie `deck.html` (20 mises en page),
   `orem-deck.css`, `fonts/`, `backgrounds/`, `logo/` avec des chemins déjà corrects.
2. Dans `deck.html`, garder les `<section class="slide">` utiles, les réordonner, réécrire le
   contenu, supprimer le reste. **Ne pas réinventer les styles** : n'utiliser que les classes du
   kit, et des `style=""` seulement pour placer. **Tout texte entre [crochets] et tous les chiffres
   du gabarit sont des exemples** : les remplacer par le brief ou `contenus-orem.md`, sinon
   écrire `[à compléter]`. Ne jamais livrer un chiffre, un délai ou une modalité d'exemple.
3. Rendre : `node scripts/render_pdf.cjs deck.html deck.pdf --png apercus/`.
4. **Ouvrir les PNG et vérifier chaque slide** : pas de texte qui déborde ou se chevauche, pas
   de mot ou de chiffre isolé sur une ligne (raccourcir le titre ou forcer `<br>`), titres sur 2
   lignes maximum, polices chargées (le script prévient sinon). Le grand vide de certaines mises en
   page (chiffres, affirmation, projection) est voulu : ne pas le « remplir ». Corriger, re-rendre.
5. QR codes : `python3 scripts/qr.py "https://…" qr.svg` (dépend de `pip install segno`). Le lien
   de réservation (Calendly…) n'est pas connu du skill : le demander, sinon pointer vers
   agence-orem.fr et adapter la légende.
6. Images : le cas client (11) et le split avec visuels attendent des captures du site livré.
   Utiliser celles fournies par l'utilisateur ; sans image, remplacer les blocs `.ph` par une
   seconde référence en carte papier avec ses chiffres, jamais par des rectangles gris.

PowerPoint (`scripts/orem_pptx.py`) seulement si un **.pptx éditable** est explicitement
demandé : rendu correct mais moins riche (pas de cartes complexes ni de trames vectorielles).

## La grammaire visuelle (à respecter sur chaque slide)
- **Cadre** : 1920×1080, marges 64 px ; panneau latéral 653 px avec marge interne 24 px.
- **Titre de slide** : Trykker 64 px, en haut à gauche (x 64, y ≈ 62), 1–2 lignes, phrase
  complète qui dit l'idée (« Une projection prudente, fondée sur vos chiffres réels »).
- **Étiquette en haut à droite** (`.tag`) : Lexend 20 px, contexte de la slide (« Projection de
  performance », « Planning indicatif, calé ensemble au lancement »).
- **Surtitre** (`.eyebrow`) : **orange `#FF6200` sur fond sombre, dégradé ou couverture ; bleu
  `#092482` sur fond clair et dans les cartes blanches/papier.** Formats : « Le contexte »,
  « 03 · Notre proposition », « Levier 1 · Acquisition », « Cas client · Secteur ».
- **Hiérarchie** : Trykker 94 (couverture) / 64 (titres, grands chiffres) / 48 (énoncés) /
  37 (titres de blocs, phrases fortes, numéros) ; Lexend 24 (texte) / 20 (légendes) / 17 (labels).
- **Texte secondaire** : `#434242` à 60 % sur clair, `#F2F2F2` à 60 % sur sombre (`.muted`).
- **Conclusion de bloc** : filet fin, puis label bleu « Le résultat » / « L'effet combiné » /
  « En une phrase » + phrase Trykker 37. C'est une signature : la mettre dès qu'un bloc argumente.
- **Numérotation** : « 01 02 03 » en Trykker bleu (clair) ou orange (sombre) ; « A B C D » pour un
  diagnostic.
- **Listes** : `.checks` (rond plein + coche) pour les bénéfices et livrables ; `.dots-list`
  (puce fine, texte gris) pour le détail.
- **Blocs** : carte blanche rayon 24 sur dégradé (`.card`), papier `#F8F8F7` à angle droit sur
  fond à points (`.paper`), bloc marine `#050C1C` rayon 24 pour la mise en avant sur fond clair
  (`.navy`), colonnes à filet vertical (`.ruled`), chiffres à filet (`.kpi`).
- **Mot clé coloré** dans une phrase Trykker : bleu `.hl` sur clair, orange `.hl-or` sur sombre
  (« Chacun doit avoir une bonne raison de dire <span>oui</span>. »). Une fois par slide au plus.
- **Fonds** : alterner noir à points, blanc (à points ou uni), dégradé bleu, split dégradé/blanc,
  forme organique. Couverture et dernière slide ont toujours un fond « image ».

## Catalogue (`assets/templates/deck.html`, références `assets/reference/deck/NN-*.jpg`)
| # | Mise en page | Usage |
|---|---|---|
| 01 | Couverture : dégradé flou, « Préparé par Orem pour X / date » en haut à gauche, symbole noir en haut à droite, surtitre orange, titre 94, sous-titre 24 | Toujours en premier |
| 02 | Contexte : titre 64 + phrase en bas à gauche ; 3 constats numérotés à filet à droite | Ouvrir sur ce qui existe |
| 03 | Diagnostic : noir à points, 4 colonnes à filet, repères A–D orange, textes ancrés en bas à hauteurs variables | Constat, analyse |
| 04 | Chiffres : titre à gauche, 4 chiffres Trykker à filet avec libellé à droite, source en gris | KPI de départ |
| 05 | Split leviers : panneau dégradé (titre + conclusion en bas) + 2 cartes papier sur points avec coches et « Le résultat » | Deux axes d'action |
| 06 | Affirmation sombre : 2 enjeux numérotés + grande phrase finale avec mots orange | Recommandation |
| 07 | Périmètre : grille 4×2 de cartes papier + un bloc marine « 2 mois offerts » | Ce que comprend l'offre |
| 08 | Méthode : split dégradé + lignes 01–05 (verbe Trykker + complément gris) | Process, fonctionnement |
| 09 | Projection : dégradé, 3 cartes blanches (aujourd'hui / après / potentiel), carte centrale bordée de bleu | Chiffrage d'impact |
| 10 | Phases : 5 colonnes à filet (numéro, titre, puces grises) + « Le résultat » | Planning |
| 11 | Cas client : texte + 3 colonnes Avant / Ce que nous avons fait / Le résultat + chiffres ; visuels + encart marine « Le parallèle avec votre projet » | Preuve, référence |
| 12 | Investissement : prix Trykker 94 + TTC + modalités ; bloc marine du potentiel | Prix d'un projet |
| 13 | Offre mensuelle : colonnes à filet de ce qui est inclus ; carte prix blanche sur forme sombre | Abonnement, suivi |
| 14 | Témoignages : dégradé, 6 cartes blanches (étoiles, citation, nom) | Avis clients |
| 15 | Engagements : « ce que nous ne promettons pas » (gris) / « ce sur quoi nous nous engageons » (bloc marine à coches) | Réassurance honnête |
| 16 | Question finale : forme organique, phrase Trykker 48 centrée | Avant la conclusion |
| 17 | Énoncé sur forme : symbole blanc en haut à gauche, phrase 64, texte gris | Phrase de synthèse |
| 18 | Prochaine étape : carte blanche sur dégradé, CTA pilule, QR, deux contacts, symbole dégradé, « agence-orem.fr · Orem, marque d'ICONOKOM » | Toujours en dernier |
| 19 | Architecture cible : noir à points, deux panneaux verre listant les pages (nom + requête visée en gris) | Plan de site |
| 20 | Objectifs 3 / 6 / 12 mois : ligne de temps pleine largeur, valeurs Trykker 64 par jalon | Objectifs chiffrés |

Adapter le nombre de colonnes : changer `cols-5` en `cols-4`, `cols-3`… (phases, diagnostic,
périmètre) et supprimer les blocs en trop ; les colonnes se redistribuent seules.

D'autres compositions vues dans les decks validés, à construire avec les mêmes classes :
deux cibles côte à côte (B2C / B2B) en cartes papier et marine ; questions numérotées 01–10 en
deux colonnes (atelier) ; « avant → après » en deux cartes reliées par une flèche ; architecture
de site en deux listes de pages sur fond noir (nom de page + requête SEO en gris) ; tableau de
KPI « Comprendre / Convertir / Acquérir / Cibler / Piloter » ; maquette du site dans un écran
(capture rayon 24) avec légende.

## Trame d'une proposition commerciale Orem (12 à 22 slides)
1. **Couverture** : « Faire du site X un vrai canal de vente », sous-titre de la promesse.
2. **Contexte** : ce qui existe déjà et fonctionne (on part du réel, jamais de zéro).
3. **Constat / diagnostic** : 3 à 4 points, chiffrés si possible.
4. **Chiffres de départ** (sources citées, valeurs « ~ » quand estimées).
5. **Notre lecture** : les leviers, avec « Le résultat » pour chacun.
6. **Recommandation** : l'enjeu en une phrase forte.
7. **Ce que comprend le projet** (périmètre) puis **architecture cible** si site.
8. **Objectifs à 3, 6, 12 mois** et **projection prudente** (jamais de promesse chiffrée garantie).
9. **Références / cas clients** avec le parallèle explicite avec le prospect.
10. **Comment nous limitons le risque**, **phases** et validations.
11. **Investissement** (HT, TTC, modalités) et ce qu'il couvre.
12. **Témoignages**, **engagements honnêtes**, **question finale**.
13. **Prochaine étape** : un appel de 30 minutes, QR, contacts.

## Écriture des slides
- Ton des decks : « nous » pour l'agence, « on » accepté dans les phrases orales fortes
  (« On ne refond pas le site pour… »). Vouvoiement du client.
- Citations et témoignages : guillemets anglais typographiques “ ” comme dans les decks validés ;
  « » pour citer une question ou une expression dans le texte courant.
- Titres = l'idée complète, pas un mot-clé (« Le site freine X sur quatre niveaux », pas « Constat »).
- Une affirmation par bloc, puis la preuve, puis la conséquence (« Autrement dit : … »).
- Chiffres prudents et sourcés ; jamais de chiffre inventé : laisser `[à compléter]` si inconnu.
- Ton direct, honnête, sans superlatif (« Ce ne serait pas honnête. »).
- Contacts par défaut : Louis Montagne (cofondateur, louis@agence-orem.fr, 07 50 37 15 72) et
  Théophile Lamouret (cofondateur, theophile@agence-orem.fr, 07 71 67 39 47) ; pied de page
  « agence-orem.fr · Orem, marque d'ICONOKOM ».

## Pièges
- Dégradé : toujours la classe `.bg-gradient` / `.panel-gradient` (20 paliers relevés) ou
  `backgrounds/degrade-bleu.png` ; ne jamais composer un dégradé « à la main » à 3 couleurs.
- Couverture : l'image `backgrounds/couverture-hero.jpg` (ou `-2`), pas un dégradé CSS.
- Formes organiques : `backgrounds/blob-sombre.jpg`, pas de cercles flous improvisés.
- Surtitre orange sur fond blanc : non (bleu). Orange en titre, en fond ou en paragraphe : non.
- Texte sombre sur la moitié haute d'un dégradé, texte clair sur sa moitié basse : illisible.
- PowerPoint : pas de ↗ ni de ᵉ (glyphes absents des polices).
