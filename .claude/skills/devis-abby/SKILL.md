---
name: devis-abby
description: Crée un devis directement dans Abby (logiciel de facturation) via l'API, le finalise et télécharge le PDF. À utiliser dès que Louis demande de « faire un devis pour X », « créer le devis Abby de X », « devis X sur Abby », « sors-moi le devis PDF de X », ou de retélécharger un devis Abby existant.
---

# Devis Abby

Rôle de Claude : **collecter → récapituler → faire valider → créer dans Abby → télécharger le PDF**. Rien n'est envoyé au client : le skill s'arrête au PDF.

Outil : `scripts/abby.sh` (curl + jq). Détail de l'API, format de la spec et valeurs possibles : `references/api.md`.

## 0. Prérequis

- Clé : variable d'environnement **`ABBY_API_KEY`** (Abby → Paramètres → Intégrations → Clés API). Ne jamais l'écrire dans le dépôt, dans un fichier ou dans le chat, ni la demander dans le chat.
- `scripts/abby.sh check` :
  - `ABBY_API_KEY absente` → dire en une ligne de l'ajouter aux variables d'environnement de la session cloud (menu de l'environnement → Edit), ou dans `~/.claude/settings.json` → `"env"` en local, puis arrêter.
  - erreur réseau → domaine `api.abby.fr` à autoriser dans l'accès réseau de l'environnement, puis arrêter.
  - HTTP 401/403 → clé invalide ou révoquée, puis arrêter.

## 1. Collecter

1. **Client** : `scripts/abby.sh clients "<nom>"`.
   - Une organisation trouvée → utiliser son `id` (le devis est adressé à l'organisation).
   - Un particulier (contact sans organisation) → utiliser l'`id` du contact.
   - Plusieurs résultats → demander lequel. Aucun → proposer de le créer (`create-org` / `create-contact`, voir `references/api.md`) avec les infos disponibles (Pipedrive `searchOrganization` / `getOrganization` / `getPerson` si connecté : nom, email, SIRET, adresse). Ne rien créer sans accord.
2. **Contenu** : prendre ce que Louis donne (texte, proposition commerciale, deal Pipedrive). Pour chaque ligne : désignation, description, quantité, unité, prix unitaire **HT**, TVA (par défaut 20 %, `FR_2000`), type (par défaut `service_delivery`). Remise éventuelle.
3. **Options** : titre du devis, validité (défaut 30 jours), délai de paiement, note d'en-tête/de pied (acompte, planning…).
4. Ne jamais inventer un prix, une quantité ou une ligne : ce qui manque est demandé.

## 2. Récapituler et faire valider

Afficher le récap avant toute création :

```
Client : <nom> (<organisation|contact>, id …)
Titre : …            Validité : 30 j
| Désignation | Qté | Unité | PU HT | TVA | Total HT |
…
Total HT : … €   TVA : … €   Total TTC : … €
```

Puis demander en une seule fois :
- validation du contenu ;
- **brouillon ou finalisé** ? La finalisation attribue le numéro légal `D-AAAA-NNNN` et rend le devis non modifiable. Elle est **irréversible**, donc toujours demandée explicitement. Un brouillon reste modifiable dans Abby.

## 3. Créer

1. Écrire la spec JSON dans le répertoire de travail temporaire (scratchpad), **prix en centimes** (1 500,00 € → `150000`).
2. `scripts/abby.sh create <spec.json>` crée le brouillon, puis enchaîne lignes → informations → titre → validité → finalisation (si `finalize: true`). La commande affiche l'id, le numéro, l'état et les totaux.
3. Vérifier que les totaux HT/TTC renvoyés correspondent au récap. Un écart → le signaler et ne pas finaliser.
4. Si `finalizeRequirements` n'est pas vide ou si la finalisation échoue : afficher les messages tels quels. Le brouillon est conservé (id affiché). Corriger avec Louis, puis `scripts/abby.sh finalize <id>`. En cas d'abandon, `scripts/abby.sh delete <id>` supprime le brouillon (uniquement un brouillon créé par ce skill).

## 4. Télécharger

- `scripts/abby.sh download <id> "<dossier>/Devis <numéro> - <Client>.pdf"`. Pour un brouillon (sans numéro) : `Devis brouillon - <Client>.pdf`.
- Session cloud : mettre le PDF dans le répertoire de travail ou le scratchpad, puis l'envoyer à Louis (outil d'envoi de fichier si disponible). En local : `~/Downloads/`.
- Drive (optionnel, si Louis le demande) : `create_file` avec `base64Content`, `contentMimeType: application/pdf` et `disableConversionToGoogleType: true`, dans `01-ADMIN/02 - DEVIS` du dossier client.
- Pipedrive (optionnel, si un deal est connu) : `addNote` sur le deal, au format `📄 Devis <numéro> — <total HT> € HT — <état> — Abby`.

## 5. Réponse finale

Trois lignes au plus : numéro et état, total HT/TTC, chemin ou lien du PDF. Pas de commentaire commercial.

## Retélécharger un devis existant

Si Louis donne un numéro `D-AAAA-NNNN` sans id : l'API ne permet pas de chercher par numéro. Lui demander l'id, ou l'URL du devis dans Abby (l'id y figure), puis `download`.
