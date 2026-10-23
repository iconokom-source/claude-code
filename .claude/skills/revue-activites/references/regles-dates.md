# Règles de dates

Tout passe par `scripts/jours.py` (lancer avec `python3 <chemin du skill>/scripts/jours.py …`).

## 1. Jours ouvrés

- Ouvré = lundi à vendredi, hors fériés français (1/1, lundi de Pâques, 1/5, 8/5, Ascension, 14/7, 15/8, 1/11, 11/11, 25/12) et hors congés de Louis listés dans `scripts/conges.txt` (`AAAA-MM-JJ` ou `AAAA-MM-JJ AAAA-MM-JJ` par ligne). Lundi de Pentecôte travaillé (modifiable en tête du script).
- Tout écart (« +3 », « 5 jours d'intervalle ») se compte en **jours ouvrés**.
- Une date demandée non ouvrée → jour ouvré suivant, signalé dans le plan. Exception : « fin de semaine / fin du mois » → jour ouvré **précédent**.
- Jamais de date passée. Jamais aujourd'hui pour un décalage (sauf si Louis le dit).
- Heures : `due_time` Pipedrive est en UTC. On conserve **l'heure de Paris** ; l'UTC change au passage heure d'été / d'hiver (dernier dimanche de mars / d'octobre) → `jours.py heure`.

## 2. Chaînes de tâches liées

Une activité dépend d'une autre quand :
- sa note ou son sujet le dit : « si pas de réponse au mail du… », « après envoi de… », « vérifier la réponse à la relance du… », « après la visio », « la veille de la visio », « une fois les éléments reçus » ;
- elle suit dans une séquence de même deal : envoi → relance → vérification → statuer ; envoi propale → suivi post-propale ; préparer / confirmer → RDV.

Pour chaque chaîne, écris le JSON de `jours.py cascade` :

```json
{"aujourdhui": "2026-10-23",
 "activites": [
  {"id": 1873, "date": "2026-10-23", "heure_utc": "07:00", "fixe": false},
  {"id": 1877, "date": "2026-10-23", "apres": 1873, "ecart": -1},
  {"id": 1894, "date": "2026-10-23", "apres": 1873, "ecart": 5}],
 "deplacer": {"1873": "2026-10-27"}}
```

- `apres` = l'activité dont elle dépend ; `ecart` = jours ouvrés après elle (négatif = avant : préparation, confirmation la veille → `-1`).
- `ecart` : celui écrit dans la note (« J+5 », « 10 jours après », « la veille ») ; sinon la cadence §3. **Ne pas** le déduire des `due_date` quand les deux sont au jour du jour : elles ont été ramenées automatiquement, l'écart d'origine est perdu.
- `fixe: true` pour un RDV avec le prospect/client (meeting, rdv_visio, déjeuner avec une personne liée) **sauf** si c'est lui que Louis déplace (alors il est dans `deplacer`).
- Une suite ne recule jamais (si elle était déjà prévue plus tard, elle y reste).
- Sortie : nouvelles dates, heures UTC recalculées, conflits « ⚠ CONFLIT » → question à Louis.

## 3. Cadences par défaut (si la note ne dit rien)

| Après… | Suite | Écart (jours ouvrés) |
|---|---|---|
| Envoi d'un message / mail / Loom | Vérifier la réponse ou relance 1 | 3 |
| Relance 1 sans réponse | Relance 2 (changer de canal si possible : mail ↔ LinkedIn ↔ appel) | 5 |
| Relance 2 sans réponse | **Shannen** (relance 3, nurture ou lost) | — |
| Envoi propale | Suivi post-propale | 3 |
| Suivi post-propale sans réponse | Relance (compte comme relance 1) | 5 |
| RDV | Préparer / confirmer | −1 |
| Tâche interne décalée sans date | Jour ouvré suivant le moins chargé | 1 |
| Attente d'éléments client (« si éléments reçus ») sans nouvelles | Re-vérifier | 3 |

Relance créée : même type que la précédente (`relance` par défaut), sujet `Relance <n> <prénom> — <objet court>`, même personne / organisation / deal, priorité de l'activité d'origine, note `Pas de réponse à <activité #id du JJ/MM>. Relance <n>/2 avant décision Shannen.` Pas de texte de message (Shannen le rédige si Louis le demande).

## 4. Charge par jour

Avant de choisir une date « libre » (décalage sans date précise), compte les activités ouvertes du jour visé (`getActivities` de la fenêtre déjà chargée) : à partir de 12, prends le jour ouvré suivant. Si Google Calendar est connecté, évite aussi les jours déjà pleins de RDV pour les tâches longues (préparation, production).
