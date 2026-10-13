# Fiche complète (sur demande uniquement)

À utiliser seulement si Louis demande « fiche complète », « tout le détail » ou le détail d'une section (dans ce cas, n'affiche que cette section).

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
