# Format du bloc deal (à envoyer à Shannen)

Texte brut, une ligne par élément, champs vides omis.

```
DATE DU JOUR : AAAA-MM-JJ
DEAL #<id> « <titre> » | P<id> <nom> | Étape <id> <nom> | <open/won/lost> | <valeur €> | Créé <date> | Étape depuis <date>
CHAMPS : <Nom>=<valeur> ; …
CONTACT : <nom> — <poste> — <email> — <tél> — <LinkedIn>
ORGA : <nom> — <secteur/ville/taille>
REGISTRE : tutoiement | vouvoiement (déduit du dernier mail échangé avec le contact ; inconnu → vouvoiement) — signature : <prénom> + <adresse d'envoi utilisée>
EXPÉDITEUR : Louis (Orem)
ACTIVITÉS :
- #<id> | <type> | <sujet> | <date> | faite:oui/non | <note ≤ 200 car.>
NOTES (récentes d'abord) :
- <date> | <texte ≤ 400 car.>
INFOS DE LOUIS : <texte intégral>
```

Modes :
- **Complet** (nouvelle conversation) : tout ci-dessus. Les notes `📥 Nouveautés` contiennent déjà mails, RDV et calls.
- **Suivi** (conversation existante) : ligne DEAL + CHAMPS modifiés + activités à faire (toutes) + activités/notes créées ou modifiées depuis la dernière synchro (dont la note `📥 Nouveautés` du jour) + INFOS DE LOUIS. Ne renvoie pas ce que Shannen a déjà reçu.

Règles :
- Clés de champs → noms via `champs.md`. Exclure ID internes, compteurs, dates système, champs vides.
- Retirer HTML et signatures. Notes `🔄 Sync Shannen` : seulement la plus récente, sans le `conv:`.
- **Budget : 4 000 caractères au total par question** (prompt-suivi ≈ 170 → bloc ≤ 3 800).
