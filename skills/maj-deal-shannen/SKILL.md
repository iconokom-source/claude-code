---
name: maj-deal-shannen
description: Met à jour une affaire Pipedrive (pipeline, étape, champs, contact, activités, notes, messages) en faisant décider Shannen (expert Miria) via le connecteur Miria, après avoir rapatrié dans Pipedrive les derniers mails, RDV et transcripts. À utiliser dès que Louis demande de « mettre à jour le deal X », « passer X à Shannen », « synchro Shannen », « MAJ Pipedrive avec Shannen » ou donne des infos nouvelles sur un deal/prospect.
---

# MAJ deal via Shannen

Rôle de Claude : **collecter → archiver dans Pipedrive → transmettre → appliquer**. Aucune analyse commerciale de ta part : Shannen décide, toi tu exécutes. Pas de reformulation, pas de commentaires.

Principe : **Pipedrive contient toujours toutes les infos.** Tout ce qui vient d'ailleurs (mails, RDV, transcripts, infos de Louis) est d'abord résumé dans une note Pipedrive, puis envoyé à Shannen.

Outils : Pipedrive · Miria (`ask_expert`, expert `shannen`) · Gmail · Google Calendar · Fireflies (si connecté). Miria absent → dis-le en une ligne et arrête. Gmail/Calendar/Fireflies absents → ignore-les sans le signaler.

## 1. Collecter

1. Pipedrive : `searchDeals` (titre) → `getDeal`. Plusieurs résultats → demande lequel. Puis `getPerson`, `getOrganization`, `getActivities` du deal (faites ET à faire, avec ID), `getNotes` du deal.
2. **Dernière synchro** : la note la plus récente commençant par `🔄 Sync Shannen` → sa date et son `conv:<id>`. Aucune = première fois (fenêtre de collecte : 90 jours).
3. **Sources externes** (uniquement depuis la dernière synchro, emails du contact + domaine de l'organisation) :
   - Gmail : `search_threads` `from:<email> OR to:<email> after:<date>` → 10 fils max, lis seulement objet, date, expéditeur, extrait.
   - Google Calendar : `search_events` avec le nom/email du contact (passés depuis la synchro + à venir).
   - Fireflies : `fireflies_get_transcripts` (`participants:[<email>]`, `fromDate:<date synchro>`, `limit:5`) ; aucun résultat → `keyword:<nom de l'organisation>`, `scope:"title"`. Pour chaque réunion : `fireflies_get_summary` → **résumé et actions** + lien `https://app.fireflies.ai/view/<id>`. Jamais `fireflies_get_transcript` (transcript intégral, trop coûteux) sauf demande de Louis.
   - `getDealMailMessages` (Pipedrive) pour éviter les doublons avec Gmail.
4. **Archivage** : s'il y a du nouveau, `addNote` (deal + personne + organisation) :
   ```
   📥 Nouveautés <AAAA-MM-JJ>
   MAILS : <date> | <de → à> | <objet> | <résumé 1 ligne>
   RDV : <date> | <titre> | fait/à venir
   CALL <date> (Fireflies <lien>) : <résumé ≤ 5 lignes> | Actions : …
   INFOS LOUIS : <texte intégral>
   ```
5. Construis le **bloc deal** (`references/bloc-deal.md`).

## 2. Envoyer à Shannen (`ask_expert`, expert `shannen`)

Limite stricte : **4 000 caractères par question**. Une conversation par deal, identifiée par son `conversation_id` (stocké dans la note `🔄 Sync Shannen`).

- **`conv:<id>` connu** → 1 appel : `conversation_id=<id>`, question = `references/prompt-suivi.md` + bloc deal **en mode suivi**.
- **Inconnu** → si Louis a donné l'URL d'une conversation Miria existante (`miria.ai/shannen/chat/<uuid>`), essaie `conversation_id=<uuid>` ; si refusé, nouvelle conversation. Nouvelle conversation = 2 appels :
  1. question = `references/prompt-initial.md` (sans conversation_id) → récupère le `conversation_id` retourné ;
  2. même `conversation_id`, question = `references/prompt-suivi.md` + bloc deal **complet**.
- Bloc trop long → tronque d'abord les notes anciennes, puis les mails, puis les descriptions d'activités terminées. Jamais les infos de Louis ni les activités à faire.
- Timeout → réessaie une fois avec le même `conversation_id`. Limite d'usage atteinte → relaie le message et le lien Miria, stop.

## 3. Réponse de Shannen

- `questions` non vide → affiche-les telles quelles, récupère les réponses de Louis, renvoie-les dans la même conversation. Aucune écriture avant.
- Sinon extrais le bloc ```json``` (`references/schema-json.md`). JSON absent/invalide → redemande une fois : « Renvoie uniquement le bloc JSON conforme au format convenu. »

## 4. Validation rapide (obligatoire)

Affiche le retour **complet** de Shannen, mis en forme (pas de résumé, pas de reformulation, contenu intégral) :

```
## 1. Diagnostic
Pipeline correcte · Étape correcte · Statut réel · Avancement · Fait · Planifié seulement · Incohérences · Risque · Prochaine étape (une ligne chacun, texte de Shannen)

## 2. Mise à jour Pipedrive
Pipeline / étape : action, actuel → nouveau, justification
Champs : tableau Champ | Action | Valeur | Justification
Activités à créer : pour chacune Type, Sujet, Date (jour de la semaine), Priorité, Description intégrale
Activités à modifier : #ID, avant → après (date, sujet, description intégrale), justification
Activités à annuler : #ID sujet, raison
Notes à ajouter / modifier : texte intégral
Messages : destinataire, canal, objet, texte intégral en bloc citation

## 3. Questions de Shannen (si présentes)

## ⚠ Points à corriger avant application
Uniquement des contrôles mécaniques : jour de semaine ≠ date, date passée, registre tu/vous ≠ celui des échanges, valeur hors liste d'un champ enum, ID inconnu, éléments vides (id 0) ignorés. Pour chacun : correction proposée.

Valider ? (ok = avec corrections · ok brut = tel quel · modifier …)
```

Attends la réponse. Correction de Louis → applique-la au plan, sans rappeler Shannen sauf demande.

## 5. Appliquer (Pipedrive)

Avec `references/architecture.md` (ID) et `references/champs.md` (clés de champs) :

1. **Deal** : `updateDeal` (pipeline_id, stage_id, champs, value, expected_close_date, status/lost_reason).
2. **Contact / organisation** : `updatePerson` / `updateOrganization` si `contact` non vide.
3. **Annuler** : `updateActivity` → `done: true`, sujet préfixé `[ANNULÉE] `, raison en fin de note (pas de suppression).
4. **Modifier** : `updateActivity` (clés non vides seulement).
5. **Créer** : `addActivity` (type, subject, due_date, priority, note, deal_id, person_id, org_id).
6. **Notes** : `addNote` avec `deal_id` + `person_id` + `org_id`.
7. **Messages** : `addNote` (deal + personne + organisation, épinglée sur le deal) :
   ```
   ✉️ MESSAGE À ENVOYER — <canal> — <destinataire>
   Objet : <objet si email>
   ---
   <texte exact>
   ```
   Si `date_envoi`, l'activité correspondante reçoit le même texte dans sa note. Ne rien envoyer toi-même.
8. **Note de synchro** (toujours, en dernier, épinglée) :
   ```
   🔄 Sync Shannen — <AAAA-MM-JJ> — conv:<conversation_id>
   Statut : … | Avancement : … | Risque : … | Prochaine étape : …
   Fait : … | Planifié seulement : … | Incohérences : …
   ```

Fin : `✅ <n> modifications appliquées — <lien deal>` + erreurs éventuelles. Ne reformule pas le diagnostic.
