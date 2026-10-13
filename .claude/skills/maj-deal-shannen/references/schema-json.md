# Schéma JSON attendu de Shannen → appels Pipedrive

| Clé JSON | Appel Pipedrive |
|---|---|
| `deplacement` (action=deplacer) | `updateDeal` pipeline_id + stage_id |
| `statut.valeur=lost` | `updateDeal` status=lost, lost_reason=motif_lost |
| `statut.valeur=won` | `updateDeal` status=won |
| `champs[]` | `updateDeal` clé de `champs.md` ; action `vider` → null. Champ inconnu dans `champs.md` → l'ajouter à la note « Fiche deal » |
| `contact.person` / `contact.organization` | `updatePerson` / `updateOrganization` (name, email, phone, job_title…) |
| `activites_annuler[]` | `updateActivity` done=true, subject=`[ANNULÉE] `+sujet, note += `\nAnnulée : `+raison |
| `activites_modifier[]` | `updateActivity` due_date/subject/note (seulement les clés non vides) |
| `activites_creer[]` | `addActivity` type (clé du type, voir `champs.md`), subject, due_date, priority, note=description, deal_id, person_id, org_id |
| `notes_ajouter[]` | `addNote` content, deal_id, person_id, org_id |
| `notes_modifier[]` | `updateNote` id, content |
| `messages[]` | `addNote` format ✉️ (voir SKILL.md §5.7), épinglée deal |
| `diagnostic` | note `🔄 Sync Shannen` |
| `questions[]` non vide | ne rien écrire, poser les questions à Louis |
