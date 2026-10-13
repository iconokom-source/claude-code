# Format du bloc deal (à envoyer à Shannen)

Texte brut, une ligne par élément, champs vides omis. Pas de JSON (plus court).

```
DATE DU JOUR : AAAA-MM-JJ
DEAL #<id> « <titre> » | Pipeline <id> <nom> | Étape <id> <nom> | Statut <open/won/lost> | Valeur <x €> | Créé <date> | Changement d'étape <date>
CHAMPS : <Nom champ>=<valeur> ; <Nom champ>=<valeur> ; …
CONTACT : <nom> — <poste> — <email> — <tél> — LinkedIn <url>
ORGANISATION : <nom> — <secteur/ville/taille si renseignés>
ACTIVITÉS :
- #<id> | <type> | <sujet> | <date> | faite: oui/non | <note ≤ 300 car.>
NOTES (récentes d'abord) :
- <date> | <texte ≤ 600 car.>
MAILS (5 derniers) :
- <date> | <de → à> | <objet> | <extrait ≤ 200 car.>
INFOS DE LOUIS :
<texte fourni par Louis, intégral>
```

Règles :
- Champs personnalisés : convertis la clé en nom via `champs.md`. Exclure : ID internes, compteurs, dates système, champs vides.
- Retirer HTML et signatures des notes/mails.
- Notes `🔄 Sync Shannen` : n'envoyer que la plus récente.
- Suivi (conversation existante) : bloc `NOUVEAU` = notes/activités/mails dont la date de création ou de mise à jour est postérieure à la dernière synchro + infos de Louis ; bloc `ETAT` = ligne DEAL + activités à faire (ID, sujet, date).
- Budget : 8 000 caractères par message au total.
