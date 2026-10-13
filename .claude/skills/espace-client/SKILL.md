---
name: espace-client
description: Crée tout l'espace d'un nouveau client ICONOKOM après signature (SOP « Signature projet ») — espace client Notion depuis le template, dossier Google Drive avec l'arborescence standard, fichier Figma depuis le template, récupération et rangement des documents administratifs (proposition commerciale, devis et factures Abby, contrat), mise à jour des étapes (Notion, Programme & Livrables, roadmap, checklist, Pipedrive) et brouillon du mail de bienvenue. À utiliser dès que Louis ou Théophile dit « crée l'espace client de X », « onboarding X », « X a signé », « nouveau client X », « lance le projet X ».
---

# Espace client ICONOKOM

Rôle de Claude : **interroger → collecter → créer → ranger → mettre à jour → préparer le mail**. Rien n'est envoyé au client : le skill s'arrête à un brouillon Gmail.

IDs, chemins et structures : `references/ids.md`. Ne jamais deviner un ID : s'il manque, chercher puis le noter dans `references/ids.md`.

Outils : Notion · Google Drive · Gmail · Google Calendar · Pipedrive · Abby (API, `references/abby.md`). Figma : duplication manuelle (pas d'API de duplication).

## 0. Interrogatoire (obligatoire, avant toute création)

1. Demande le **nom du client** (ou du deal). Puis pré-remplis tout ce que tu peux trouver seul :
   - Pipedrive : `searchDeals` → `getDeal`, `getPerson`, `getOrganization` (contact, email, téléphone, montant, notes).
   - Gmail : derniers échanges avec le contact (`from:<email> OR to:<email>`), et en particulier la **confirmation écrite** (devis signé, « on y va », bon de commande).
   - Abby + Gmail : devis, factures (étape 1).
2. Affiche une **fiche de démarrage** pré-remplie et pose **en une seule fois, avant toute création**, toutes les questions sur ce qui manque ou reste incertain (outil de questions si disponible, sinon liste numérotée). Ne rien créer tant que la fiche n'est pas complète.
   - **Tutoiement ou vouvoiement : toujours demander explicitement**, même si les mails semblent l'indiquer. Ne jamais le déduire. Tout l'espace, le doc Drive et le mail suivent cette réponse.
   - Fichiers à demander s'ils ne sont pas trouvés : proposition commerciale (PDF), devis signé, facture d'acompte, contrat/BC, logo du client (pour la couverture).
   - Liens à demander : Figma du projet (après duplication du template, étape 4), lien de réservation de la visio de cadrage (1 h).

```
## Fiche de démarrage — <Client>
Client (raison sociale) : …            Nom affiché espace : …
Contact principal : Prénom Nom — email — tél
E-mails à inviter (accès éditeur Drive + Notion) : contact principal + …
Projet : <nom du projet>               Type : site vitrine / refonte / e-commerce / autre
Offre & montant HT : …                 Échéancier : acompte X % / en N fois
Confirmation écrite : <lien mail ou ✗>
Date de démarrage : …                  Fin prévue : …
Équipe : Louis / Théo / Clément (qui fait quoi)
Tutoiement ou vouvoiement : ❓ (à demander, jamais déduit)
Webflow : compte client à créer ? (oui/non)
Visio de cadrage : déjà fixée (date) ou 2 créneaux à proposer
Documents : Proposition ✓/✗ · Devis ✓/✗ · Facture acompte ✓/✗ · Contrat/BC ✓/✗
Lien Figma (après duplication, cf. étape 4) : …
Lien de réservation visio de cadrage (1 h) : …
Logo du client (couverture) : …
```

3. **Ne démarre pas sans confirmation écrite** du client (règle du SOP). Si elle manque : demande-la (lien mail ou capture).
4. Attends la validation de la fiche (« ok » ou corrections) avant l'étape 1.

## 1. Documents administratifs

Pour chaque document : trouver → télécharger → déposer dans Drive (étape 3) → lier dans Notion (étape 2).

| Document | Où chercher (dans l'ordre) | Nom de fichier Drive |
|---|---|---|
| Proposition commerciale | Drive (`title contains '<client>'`, PDF) → Gmail (envoyés au contact : date, objet, lien du mail) → **demander** | `Proposition commerciale - <Client>.pdf` |
| Devis | Abby API → Drive (`title contains '<client>'`) → Gmail `from:nepasrepondre@abby.fr` (objet `D-AAAA-NNNN`) → **demander** | `Devis D-AAAA-NNNN - <Client>.pdf` |
| Factures (acompte…) | Abby API → Drive (`title contains '<client>'`) → Gmail `from:nepasrepondre@abby.fr` (objet `F-AAAA-NNNN`) → **demander** | `Facture F-AAAA-NNNN - <Client>.pdf` |
| Contrat signé / bon de commande | Gmail (réponse du client avec PJ) → **demander** | nom d'origine |

- **Fichier donné dans la conversation** (PDF glissé par Louis) : c'est la source prioritaire.
  - Notion : `notion-create-file-upload` puis `curl -X POST <upload_url>` avec les en-têtes renvoyés et `-F "file=@<chemin>"` → place le `markdown_source` dans le callout du document. Si le réseau refuse `api.notion.com` (403), dis-le et passe à la suite.
  - Drive : le connecteur ne prend que du base64 dans l'appel, impossible pour un PDF de plusieurs Mo. Donne à Louis le lien du sous-dossier cible et demande-lui d'y glisser le fichier (10 s), puis retrouve-le (`search_files`, `parentId`) et lie-le dans Notion. Ne mets jamais de lien vers un dossier vide.
- **PDF déjà dans Drive** (ancien dossier client, etc.) → `copy_file` vers le bon sous-dossier, renommé. C'est la voie la plus fiable.
- **PDF** : sinon seule l'API Abby permet de télécharger le PDF d'un devis/facture → `create_file` (`base64Content`, `contentMimeType: application/pdf`, `disableConversionToGoogleType: true`). Le connecteur Gmail ne télécharge pas les pièces jointes : il sert à **identifier** les documents (numéro, date, montant, lien du mail).
- Document identifié mais PDF non récupérable (API Abby indisponible, PJ client) → donne à Louis le lien du sous-dossier Drive cible (`01-ADMIN/02 - DEVIS`, etc.) et demande-lui d'y glisser le PDF ; ensuite retrouve-le par `search_files` (`parentId = '<dossier>'`) pour le lier dans Notion.
- **Facture d'acompte inexistante** : ne la crée pas toi-même. Dis-le, rappelle le montant exact de la proposition signée, et demande à Louis de l'émettre sur Abby (ou de confirmer qu'elle viendra plus tard). Le montant doit être **strictement** celui de la proposition signée.
- Plusieurs candidats (plusieurs devis/versions) → liste-les et demande lequel est la version finale.

## 2. Espace client Notion

Détail : `references/notion.md`.

1. **Jamais `notion-duplicate-page`** sur le template : la copie devient un deuxième *modèle* de la galerie (bandeau « Vous modifiez un modèle »). Créer la page avec `notion-create-pages`, parent `data_source_id` de la galerie, `template_id` = template (`ids.md`), et directement les propriétés : `Nom` = `Espace client <Client>`, `Étapes` = `["Onboarding et préparation"]`, `Date` = début → fin prévue.
2. `fetch` la page créée et relève les IDs des sous-pages et la data source de Programme & Livrables (tous nouveaux).
3. Remplir (liens réels uniquement, jamais de lien inventé) :
   - Le template est déjà au bon format (octobre 2026) : remplacer chaque repère `[...]` par la vraie valeur (liens, montants, dates), et passer tous les textes au vouvoiement si la fiche dit « vous ». Détails : `references/notion.md`.
   - Appliquer **tout** `references/notion.md` : bloc « 👉 Ta prochaine étape » en haut, checklist à 3 actions non cochées, roadmap, bloc « Ton équipe », Programme & Livrables (phases, noms clairs, dates indicatives), Documents administratifs (HT/TTC, coordonnées bancaires, sans Brief ni formulaire de fin), Liens utiles, Introduction réécrite, sous-pages corrigées. Un seul registre partout.
   - **Programme & Livrables** : voir `references/notion.md`.
   - Supprimer le callout rouge **« To do setup »** une fois tout fait.

## 3. Dossier Google Drive

Arborescence exacte dans `references/ids.md`. Dans `01_EN_COURS` :

1. Vérifie qu'aucun dossier `<Client>` n'existe déjà (sinon : le réutiliser, ne rien dupliquer).
2. Crée `<Client> - <Prénom Nom du contact>` puis toute l'arborescence (`create_file`, `mimeType` folder).
3. Crée le doc `Bienvenue 👋 - À LIRE` dans `00 - ESPACE CLIENT` avec `create_file` (`contentMimeType: text/plain`, converti en Google Doc) et le texte standard de `ids.md` (adapter nom du client et tu/vous). Ne pas partir du doc Verdon (exception : sous-dossiers par personne).
4. Dépose les documents de l'étape 1 dans `01-ADMIN/…` et **copie toujours le RIB Qonto** (`ids.md`) dans `01-ADMIN` sous le nom `IBAN ICONOKOM.pdf`.
5. **Accès (obligatoire, sans attendre)** : tout doit être accessible directement depuis les e-mails de la fiche.
   - Drive : `share_file` en `writer` sur `00 - ESPACE CLIENT` pour **chaque** e-mail de la fiche (contact principal + personnes listées). Vérifier avec `get_file_permissions`.
   - Notion : le client a toujours un accès en **modification** (il coche sa checklist et ses validations). Le connecteur Notion ne sait pas inviter quelqu'un : afficher à Louis, dans le récap, la marche exacte (Partager → coller chaque e-mail → « Peut modifier » → Inviter) avec la liste des e-mails.
   - Figma : lien « Can view » (le client peut commenter) partagé par lien dans l'espace ; jamais « Can edit ».
   - Le récap final contient un bloc `Accès` : Drive ✓ (e-mails) · Notion à inviter (e-mails) · Figma lien ✓/✗.

## 4. Figma (manuel guidé)

Affiche :
```
🎨 Figma — à faire toi-même (30 s)
1. Ouvre le template : <lien template, ids.md>
2. Duplique-le dans le workspace ICONOKOM
3. Renomme : <Client> — Site web
4. Partage → lien « Can view » (jamais « Can edit »)
5. Colle-moi le lien ici
```
Template absent de `ids.md` → demande le lien et enregistre-le dans `ids.md`. Tant que le lien n'est pas collé, continue le reste et laisse « Figma » en ✗ dans le récap. Ne cherche pas le lien dans les mails de notification Figma : ils ne contiennent que des liens de redirection `click.figma.com` inexploitables.

## 5. Mettre les étapes à jour

- **Notion** : propriétés de l'espace (étape 2) + Programme & Livrables (`references/notion.md`).
- **Pipedrive** (après validation de Louis) : deal → `status: won` si pas déjà fait (ou étape « Signé » de la pipeline si elle existe : `getStages`) ; `addNote` (deal + personne + organisation) :
  ```
  🚀 Espace client créé — <AAAA-MM-JJ>
  Notion : <lien> · Drive : <lien> · Figma : <lien>
  Devis : D-… · Facture acompte : F-… (<montant> HT) · Contrat : ✓/✗
  Visio de cadrage : <date ou créneaux proposés>
  ```
- **Qonto** (acompte) : `list_transactions` sur les crédits depuis l'envoi de la facture ; une transaction dont le montant = TTC de l'acompte et dont la contrepartie correspond au client → cocher « J'ai réglé l'acompte » dans la checklist, et ajouter « réglée le <date> » au callout de la facture. Aucune transaction → ne rien cocher.
- **Calendar** : si la visio est déjà fixée et pas encore dans l'agenda → proposer de créer `<Projet> — Visio de cadrage ICONOKOM` (Google Meet). Sinon, chercher 2 créneaux libres dans les 3 jours ouvrés (`suggest_time`).

## 6. Brouillon du mail de bienvenue

`create_draft` Gmail en **`htmlBody`** (liens cliquables, pas d'URL brute), au contact principal. **Pas de pièces jointes** : le connecteur exige le PDF en base64, ce qui fait transiter des Mo dans la conversation. Liens Drive vers le devis, la facture et le RIB, **plus l'IBAN en clair** dans le corps. Louis peut joindre les PDF à la main avant d'envoyer. Modèle : `references/mail-bienvenue.md` (respecter tu/vous). Ne jamais envoyer : Louis relit et envoie.

## 7. Validation et récap

Avant toute écriture visible du client (partage Drive, invitation agenda, Pipedrive won) : montre le plan et attends « ok ». Les créations internes (page Notion, dossiers Drive non partagés) peuvent se faire directement après la validation de la fiche.

Fin :
```
✅ Espace client <Client> prêt
Notion : <lien> · Drive : <lien> · Figma : <lien ou ✗>
Documents : Proposition ✓ · Devis D-… ✓ · Facture F-… ✓ · Contrat ✓/✗
Étapes : Notion ✓ · Programme & Livrables ✓ · Pipedrive ✓
Brouillon mail : <lien>
Reste à faire : …
```
