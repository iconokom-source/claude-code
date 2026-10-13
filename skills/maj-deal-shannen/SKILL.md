---
name: maj-deal-shannen
description: Met à jour une affaire Pipedrive (pipeline, étape, champs, contact, activités, notes, messages) en faisant décider Shannen (expert Miria) via le connecteur Miria. À utiliser dès que Louis demande de « mettre à jour le deal X », « passer X à Shannen », « synchro Shannen », « MAJ Pipedrive avec Shannen » ou donne des infos nouvelles sur un deal/prospect.
---

# MAJ deal via Shannen

Rôle de Claude : **collecter → transmettre → appliquer**. Aucune analyse commerciale de ta part : Shannen décide, toi tu exécutes. Sois bref, pas de reformulation, pas de commentaires.

Outils : connecteur **Pipedrive** + connecteur **Miria** (`https://miria.ai/api/mcp`, expert Shannen). Si le connecteur Miria est absent, dis-le en une ligne et arrête.

## 1. Collecter (Pipedrive, lecture seule)

1. `searchDeals` (titre) → `getDeal`. Plusieurs résultats → demande lequel.
2. `getPerson`, `getOrganization` liés ; `getActivities` du deal (faites ET à faire, avec ID) ; `getNotes` du deal ; `getDealMailMessages` (5 derniers, extrait seulement).
3. Repère la dernière note commençant par `🔄 Sync Shannen` → sa date = **date de dernière synchro** (aucune = première fois).
4. Construis le **bloc deal** selon `references/bloc-deal.md` (champs vides exclus, plafonds de longueur).

## 2. Conversation Shannen

Nom de conversation = `DEAL - <TITRE DU DEAL EN MAJUSCULES>` (pipeline Prospection ou Growth : `PROSPECT - <TITRE>`).

- Liste les conversations Shannen et cherche ce nom (ou une conversation dont le titre contient le titre du deal, préfixe DEAL/PROSPECT).
- **Trouvée** → continue-la. Envoie : `references/prompt-suivi.md` + infos nouvelles de Louis + uniquement les éléments Pipedrive créés/modifiés **après** la dernière synchro (+ état actuel pipeline/étape/activités à faire).
- **Absente** → crée-la avec ce nom exact. Envoie : `references/prompt-initial.md` + `references/architecture.md` + bloc deal complet + infos de Louis.
- **Limite : 8 000 caractères par message** (un seul message, jamais de découpage en plusieurs conversations). Si dépassement : tronque d'abord les notes/mails les plus anciens, puis les descriptions d'activités terminées. Jamais l'architecture ni les infos de Louis.

## 3. Réponse de Shannen

- Si elle pose des questions (`questions` non vide) → affiche-les telles quelles, récupère les réponses de Louis, renvoie-les dans la **même** conversation. Aucune écriture Pipedrive avant.
- Sinon, extrais le bloc ```json``` (schéma : `references/schema-json.md`). JSON absent/invalide → redemande une fois dans la même conversation : « Renvoie uniquement le bloc JSON conforme au schéma. »

## 4. Validation rapide (obligatoire)

Affiche un récap compact, rien d'autre :

```
DEAL <titre> (#id)
Diagnostic : <diagnostic.statut_reel> — <diagnostic.prochaine_etape>
Pipeline/étape : <actuel> → <nouveau> | inchangé
Champs : <n> (<noms>)
Activités : +<n> créer | ~<n> modifier | ✕<n> annuler
Notes : +<n> | Messages : <n> (<canaux>)
⚠ <incohérences, 1 ligne chacune>
Valider ? (ok / modifier …)
```

Attends « ok ». Une correction de Louis → applique-la au plan (pas de nouvel appel à Shannen sauf demande).

## 5. Appliquer (Pipedrive)

Dans cet ordre, en t'appuyant sur `references/architecture.md` (ID pipelines/étapes) et `references/champs.md` (clés de champs) :

1. **Deal** : `updateDeal` (pipeline_id, stage_id, champs, value, expected_close_date, status/lost_reason si `lost`). Option enum → utilise le libellé exact listé dans `champs.md`.
2. **Contact / organisation** : `updatePerson` / `updateOrganization` si `contact` non vide.
3. **Activités à annuler** : `updateActivity` → `done: true`, sujet préfixé `[ANNULÉE] `, raison ajoutée en fin de note. (Pas de suppression : traçabilité.)
4. **Activités à modifier** : `updateActivity` (due_date, subject, note).
5. **Activités à créer** : `addActivity` (type, subject, due_date, priority, note, deal_id, person_id, org_id).
6. **Notes** : `addNote` avec `deal_id` + `person_id` + `org_id` (visible partout).
7. **Messages** : pour chacun, `addNote` (deal + personne + organisation, épinglée sur le deal) au format :
   ```
   ✉️ MESSAGE À ENVOYER — <canal> — <destinataire>
   Objet : <objet si email>
   ---
   <texte exact>
   ```
   Et si le message a une date d'envoi, l'activité correspondante (type Adresse mail / Relance) reçoit le même texte dans sa note. Ne rien envoyer toi-même.
8. **Note de synchro** (toujours, en dernier, épinglée) :
   ```
   🔄 Sync Shannen — <AAAA-MM-JJ>
   Statut : … | Avancement : … | Risque : … | Prochaine étape : …
   Fait : … | Planifié seulement : … | Incohérences : …
   ```

Fin : une ligne `✅ <n> modifications appliquées — <lien deal>` + erreurs éventuelles (appel, cause). Ne reformule pas le diagnostic.
