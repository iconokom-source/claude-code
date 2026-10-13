---
name: fiche-deal
model: sonnet
description: Affiche absolument toutes les informations d'une affaire (deal) Pipedrive en lecture seule — deal, champs personnalisés, pipeline/étape, contacts, organisation, activités (faites et à faire), notes, mails, produits, lead d'origine, autres deals liés. À utiliser dès que Louis demande « toutes les infos du deal X », « fiche deal X », « montre-moi l'affaire X », « où en est X dans Pipedrive », « résume-moi le deal X » ou veut consulter une affaire sans la modifier.
---

# Fiche deal complète (lecture seule)

Rôle de Claude : **tout récupérer dans Pipedrive et tout afficher**. Aucune écriture (pas de `add*`, `update*`, `convert*`), aucune analyse commerciale, aucun conseil — sauf si Louis le demande ensuite.

Outil : Pipedrive uniquement. Connecteur absent → dis-le en une ligne et arrête.

## 1. Trouver le deal

- Louis donne un ID ou un lien `…/deal/<id>` → `getDeal` directement.
- Sinon `searchDeals` (`term` = nom donné, `fields: ["title"]`) ; aucun résultat → relance sans `fields` ; toujours rien → `searchOrganization` / `searchPersons` puis `getDeals` avec `org_id` / `person_id`.
- Plusieurs résultats → liste-les (ID, titre, organisation, statut, étape) et demande lequel. Aucun → dis-le et arrête.

## 2. Tout collecter

Lance en parallèle tout ce qui ne dépend que de l'ID du deal :

1. `getAccountContext` → noms des pipelines/étapes, noms des champs personnalisés (deal, personne, organisation, activité), noms des utilisateurs.
2. `getDeal` avec :
   - `include_option_labels: true`, `include_labels: true` ;
   - `include_fields` = **toute la liste** : `next_activity_id, last_activity_id, first_won_time, products_count, files_count, notes_count, followers_count, email_messages_count, activities_count, done_activities_count, undone_activities_count, participants_count, last_incoming_mail_time, last_outgoing_mail_time, smart_bcc_email, source_lead_id`.
   - Ne passe **pas** `custom_fields` (sinon seuls 15 champs reviennent).
3. `getActivities` `deal_id`, `include_fields: ["attendees"]`, `limit: 500`, `sort_by: due_date`, sans filtre `done` (faites ET à faire) ; suis le `cursor` jusqu'au bout.
4. `getNotes` `deal_id`, `sort: "add_time DESC"`, `limit: 500` ; pagine avec `start` tant qu'il y a une page suivante.
5. `getDealMailMessages` `id`, `include_body: 1`, `limit: 50` ; pagine avec `start` jusqu'au bout.
6. `getDealProducts` `id`.
7. `getPersons` `deal_id` (tous les participants du deal), `include_option_labels: true`.

Puis, selon le résultat de `getDeal` :

8. Personne principale → `getPerson` (`include_option_labels`, `include_labels`, tous les `include_fields` sauf `marketing_status` et `doi_status`).
9. Organisation → `getOrganization` (`include_option_labels`, `include_labels`, tous les `include_fields`) + `getPersons` `org_id` (autres contacts de l'organisation).
10. Autres deals liés → `getDeals` `org_id` (sinon `person_id`), `status: ["open","won","lost"]` ; exclure le deal courant.
11. `source_lead_id` présent → `getLead`.
12. Notes de la personne et de l'organisation non rattachées au deal → `getNotes` `person_id` et `getNotes` `org_id`, garde celles dont `deal_id` est vide ou différent.

Erreur sur un appel → réessaie une fois, puis continue et signale-le dans la section « Données manquantes ». Ne t'arrête jamais à cause d'un appel secondaire.

**Exhaustivité** : chaque champ non vide renvoyé par l'API doit apparaître dans la fiche. Remplace chaque clé de champ personnalisé (hash de 40 caractères) par son nom via `getAccountContext` ; si une clé reste inconnue, affiche-la telle quelle. Les ID d'options sont remplacés par leur libellé. Les IDs d'utilisateurs → noms.

## 3. Afficher la fiche

Format ci-dessous, en français, champs vides omis, dates `JJ/MM/AAAA` (+ jour de la semaine pour les activités à venir), montants avec devise. Corps HTML des mails et notes converti en texte brut, signatures et citations d'anciens messages (`> …`, « Le … a écrit : ») retirées. Pas de troncature : tout le contenu des notes, descriptions d'activités et mails est affiché intégralement.

```
# 💼 <titre> — #<id>
<lien https://<domaine>.pipedrive.com/deal/<id>>

## Synthèse
Statut · Pipeline › Étape (depuis le <date>) · Valeur · Probabilité · Date de gain attendue · Propriétaire · Étiquettes
Créé le · Dernière mise à jour · Gagné/perdu le (+ raison de perte) · Visibilité
Compteurs : activités (faites / à faire) · notes · mails · fichiers · produits · abonnés · participants
Dernier mail reçu / envoyé · Prochaine activité · Dernière activité · Adresse Smart BCC

## Champs personnalisés
| Champ | Valeur |   ← tous, dans l'ordre de getAccountContext

## Contact principal
Nom · Poste · Emails (tous, avec libellé) · Téléphones (tous) · Organisation · Propriétaire · Étiquettes · champs personnalisés · compteurs (deals ouverts/gagnés/perdus, activités, mails)

## Autres participants du deal
Une ligne par personne : nom — poste — email — téléphone

## Organisation
Nom · Adresse complète · Propriétaire · Étiquettes · champs personnalisés · compteurs
Autres contacts : une ligne par personne (nom — poste — email — téléphone)

## Lead d'origine (si source_lead_id)
Titre · Source · Valeur · Date de création · Étiquettes

## Produits
| Produit | Qté | Prix unitaire | Remise | TVA | Total |   + total général

## Activités à faire (par date croissante)
- #<id> | <type> | <sujet> | <jour JJ/MM/AAAA HH:MM> | durée | priorité | assigné à | participants | lieu / lien visio
  Note : <texte intégral>
  ⚠ en retard si la date est passée

## Activités faites (plus récentes d'abord)
même format, + « faite le <date> »

## Notes (plus récentes d'abord)
### <date> — <auteur> <📌 si épinglée>
<texte intégral>

## Notes de la personne / de l'organisation hors deal
même format

## Mails (fil par fil, plus récents d'abord)
### <objet> — <n> messages
- <date> | <de> → <à> (cc …) | <ouvert/cliqué si dispo>
  <corps intégral, nettoyé>

## Autres deals de l'organisation / du contact
| # | Titre | Pipeline › Étape | Statut | Valeur | Mis à jour |

## Données manquantes
Appels en échec, fichiers (nombre seulement : le connecteur ne permet pas de les lire), champs dont la clé n'a pas pu être traduite.
```

Si la fiche dépasse ~30 000 caractères : affiche tout jusqu'à « Notes » inclus, puis demande à Louis s'il veut la suite (mails, autres deals) plutôt que de tronquer en silence.

Fin : rien d'autre que la fiche. Pas de recommandations, pas de résumé ajouté.
