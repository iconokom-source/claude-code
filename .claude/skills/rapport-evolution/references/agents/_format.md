# Format commun des analyses

Chaque agent écrit un fichier Markdown avec exactement ces sections :

```
# <Domaine> · <Client> · <Mois>

## Verdict
Une phrase. Ce qu'un dirigeant doit retenir de ce domaine ce mois-ci.

## Constats
### [critique|important|à surveiller|positif] <Titre-affirmation>
- Chiffres : <valeur> (`<chemin.dans.kpi.json>`), <valeur> (`<chemin>`)
- Lecture : <ce que ça veut dire pour l'activité du client, 2 phrases max>
- Piste : <action concrète, qui peut la faire, effort S/M/L>

(4 à 8 constats, du plus grave au plus positif)

## Chiffres pour le deck
Tableau `Indicateur | M | vs M-1 | vs N-1 | chemin`, uniquement des valeurs lues dans les fichiers.

## Limites et questions
Ce que les données ne permettent pas de dire, et les questions à poser au client ou à Louis.
```

Règles :
- Chaque chiffre est suivi de son chemin JSON entre backticks. Un chiffre sans chemin sera supprimé par le relecteur.
- Pas de moyenne sectorielle inventée. Un repère externe n'est cité que s'il figure dans tes consignes.
- Distinguer le fait (le chiffre) de l'hypothèse (« probablement », « à vérifier »).
- Français, vouvoiement du client, pas de tiret long.
