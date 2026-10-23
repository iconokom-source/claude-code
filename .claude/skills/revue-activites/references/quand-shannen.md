# Qui décide quoi

Principe : **Claude applique ce qui est mécanique** (un fait, une date, un doublon). **Shannen décide ce qui change la lecture commerciale du deal** (où il en est, quoi dire au prospect, quelle suite). **Louis répond aux faits que lui seul connaît.**

Pipelines « commerciales » : P4, P6, P7, et P5 étapes 55 à 58 (opportunité chez un client). Pipelines « projet » : P5 étapes 53-54 (client actif, suivi), 61, 62.

## Claude seul

| Situation | Action |
|---|---|
| Fait, sans information nouvelle venant du prospect | `done` + résultat en note |
| Tâche interne (préparer, rédiger, vérifier, produire, mettre en ligne, wireframes, compta…) faite, décalée, réaffectée | mécanique |
| Décaler avec une date donnée ou implicite (« pas eu le temps », « lundi ») | nouvelle date + cascade des tâches liées |
| Sans nouvelles, relance n° 1 ou 2 de la séquence | `done` « pas de réponse » + relance suivante (cadence `regles-dates.md` §3) |
| Sans nouvelles, mais la suite est déjà planifiée sur le deal | `done` « pas de réponse », la suite reste |
| Doublon (agenda / deal, deux tâches identiques) | annuler le doublon |
| Tâche devenue sans objet par un fait déjà connu (« préparer la visio de demain » alors que la visio a eu lieu, « confirmer le RDV » après le RDV) | annuler, raison en note |
| Annulation explicite par Louis, et il reste une activité ouverte sur le deal | annuler |
| RDV / point **projet** tenu chez un client actif (P5 53-54) sans sujet commercial | `done` ; tâches de suite dictées par Louis créées telles quelles |
| RDV déplacé, nouvelle date donnée par Louis | nouvelle date, heure de Paris conservée, tâches de préparation / confirmation recalées (veille) |
| Message prêt à envoyer dont seule la date mentionnée change | corriger la date dans le texte |
| Ajout d'une tâche interne dictée (« ajoute : envoyer la facture lundi ») | créer |

## Shannen (via `maj-deal-shannen`, après application du mécanique)

| Situation | Pourquoi |
|---|---|
| Information nouvelle venant du prospect : réponse, intérêt, refus, objection, budget, délai, vacances, décideur, concurrent, demande de devis / proposition | change le diagnostic |
| RDV **commercial** tenu, annulé, ou no-show (diagnostic, restitution, présentation de proposition, visio offre, déjeuner d'affaires) | change d'étape, suite à décider |
| Changement implicite d'étape, de pipeline ou de statut : RDV calé, proposition envoyée, accord verbal, signé, acompte reçu, perdu, « on met en pause » | architecture Pipedrive |
| Prospect qui reporte **sans date** | quoi proposer, quand relancer |
| 3e relance sans réponse sur la même séquence (compter les activités relance/suivi faites avec « pas de réponse » en note), ou activité commerciale en retard de plus de 15 jours ouvrés | nurture, lost ou autre angle |
| Activité de décision (« statuer sur… », « décider go/no-go » commercial, « bascule nurture ? ») | c'est un jugement |
| Deal commercial qui n'aurait plus aucune activité ouverte après la revue | quelle suite |
| Message au prospect à réécrire sur le fond (le contexte a changé, pas juste la date) | texte commercial |
| Opportunité / upsell repérée chez un client | nouveau sujet commercial |
| Deal `won`/`lost` avec des activités commerciales encore ouvertes | cohérence de clôture |

Sur un deal qui part chez Shannen : Claude applique seulement les faits (activités faites → `done` + note), rien d'autre ; Shannen replanifie.

## Question à Louis (ni Claude ni Shannen ne peuvent savoir)

- Le RDV passé a-t-il eu lieu ? Le message prévu a-t-il été envoyé ?
- Activité ou deal ambigu dans ce qu'il a dit.
- Nouvelle date d'un RDV avec un prospect (jamais inventée).
- Conflit de cascade avec un RDV fixe.
- Activité conditionnelle (« si pas de réponse… », « si éléments reçus… ») dont la condition est inconnue et que Louis n'a pas citée → la lister dans « J'ai besoin de toi », sinon elle reste telle quelle.

Toutes les questions en un seul bloc, numérotées, réponses courtes possibles (« 1 oui, 2 non »).
