---
name: qonto-justificatifs
description: Retrouve les factures et reçus (dans Gmail et les applications reliées via Composio, comme Lemlist ou les SaaS facturés par Stripe) et les rattache aux bonnes opérations bancaires Qonto qui n'ont pas encore de justificatif. Utilise ce skill dès que l'utilisateur parle de justificatifs manquants, de factures à rattacher ou à attacher sur Qonto, de rapprochement factures/opérations, de pièces jointes Qonto, de préparer la compta pour l'expert-comptable, ou dit simplement « mets mes factures sur Qonto », « il me manque des justificatifs » ou « fais le ménage dans mes opérations Qonto », même sans citer le mot « facture ».
---

# Rattacher les factures aux opérations Qonto

Le but : chaque dépense Qonto du dernier mois porte sa facture, sans que l'utilisateur ait à
chercher dans ses emails. Le skill attache seul les correspondances **sûres** et soumet les
cas douteux à l'utilisateur. Un mauvais justificatif sur une opération est pire qu'une
absence, car l'expert-comptable lui fait confiance. Dans le doute, demander plutôt
qu'attacher.

Outils utilisés :
- **Qonto MCP** (`mcp__Qonto__*`) : opérations, pièces jointes, envoi des fichiers.
- **Composio** (`mcp__Composio__*`) : Gmail (recherche, téléchargement des pièces jointes) et
  le bac à sable `COMPOSIO_REMOTE_WORKBENCH`, où tout le travail sur les fichiers se fait
  (téléchargement, conversion HTML vers PDF, lecture du texte, envoi vers Qonto).
  Le connecteur Gmail natif (`mcp__Gmail__*`) sert à chercher mais ne donne pas les octets
  des pièces jointes : pour les fichiers, passer par Composio.

Si un outil manque (Qonto ou Composio non connecté), le dire tout de suite et s'arrêter
plutôt que de produire un rapport à moitié vide.

## Étape 1 : lister les opérations à traiter

Par défaut, les **débits des 30 derniers jours sans pièce jointe**, sur tous les comptes.
Si l'utilisateur donne une autre période, un compte ou demande les crédits, suivre sa demande.

1. `list_bank_accounts` pour les comptes actifs.
2. Pour chaque compte, `list_transactions` avec `side: debit`, `with_attachments: false`,
   `settled_at_from` = aujourd'hui − 30 jours, `per_page: 100`, en parcourant les pages.
3. Garder les champs utiles : `id`, `label`, `clean_counterparty_name`, `amount`, `currency`,
   `local_amount`/`local_currency` (paiement en devise), `emitted_at`, `operation_type`,
   `reference`, `card_last_digits`, `attachment_required`.

## Étape 2 : trier avant de chercher

Lire `references/fournisseurs.md`. Il liste les opérations qui n'ont pas de facture (salaires,
virements internes, URSSAF et retraite, frais Qonto, frais de change) et donne, pour les
fournisseurs courants, où se trouve la facture. Ranger tout de suite les opérations sans
facture attendue dans la section du rapport prévue pour elles : chercher une facture pour un
salaire fait perdre du temps et risque un faux rattachement.

## Étape 3 : chercher les candidats

### 3a. D'abord dans Qonto (factures fournisseurs)

Certains fournisseurs envoient leurs factures directement dans Qonto (e-facturation, transfert
d'email). C'est la source la plus fiable : montant et fournisseur y sont déjà structurés.
Appeler `list_supplier_invoices` avec `filter_matched_transactions: false` (et
`filter_created_at_from` = début de période − 30 jours), puis comparer fournisseur et
montant TTC aux opérations restantes. Une facture déjà rapprochée d'une autre opération
n'est pas candidate. Si une facture non rapprochée correspond, télécharger son fichier
(`get_attachment` sur sa pièce jointe, URL `url` à récupérer dans le bac à sable) et la
traiter comme les autres candidats.

### 3b. Puis dans Gmail

Ouvrir le bac à sable (session Composio : appeler d'abord `COMPOSIO_SEARCH_TOOLS` avec
« download an email attachment file from gmail message » pour obtenir un `session_id`), puis
exécuter le contenu de `scripts/workbench_helpers.py` dans une première cellule. Il définit :
`gmail_search`, `gmail_window`, `gmail_message`, `html_to_text`, `invoice_links`,
`download_gmail_attachment`, `download_url`, `html_to_pdf`, `pdf_text`, `amount_in_text`,
`put_to_qonto`.

Deux règles pour le bac à sable :
- Finir chaque cellule par une variable `output` (texte compact) plutôt que par des `print` en
  série. Les helpers font déjà taire les logs de Composio ; ne pas rediriger `sys.stdout`
  soi-même, surtout dans des threads : ça coupe tout l'affichage suivant.
- N'afficher que ce qui sert à décider (sujet, expéditeur, date, pièces jointes, extrait court) :
  les boîtes mail contiennent des échanges sans rapport qui n'ont rien à faire dans le contexte.

**Vérifier la boîte mail.** La réponse de `COMPOSIO_SEARCH_TOOLS` indique l'adresse Gmail
connectée (`toolkit_connection_statuses`). L'annoncer dans le rapport. Si plusieurs comptes
Gmail sont connectés, chercher dans chacun (paramètre `account`). Si beaucoup de reçus restent
introuvables, signaler que les factures arrivent peut-être sur une autre adresse, à connecter
dans Composio.

Pour chaque opération restante, chercher dans Gmail avec une fenêtre de **−10 à +5 jours**
autour de `emitted_at` (les factures d'abonnement arrivent souvent juste avant le débit).
`gmail_window(emitted_at)` construit ces bornes et empêche `before:` de tomber dans le futur :
Gmail via Composio refuse alors la requête et renvoie une liste vide, qu'on prendrait à tort
pour « rien trouvé ». Si `gmail_search` renvoie `{"empty": True, "warning": ...}` avec un
avertissement, corriger la requête avant de conclure.

```
(<nom du fournisseur>) (facture OR invoice OR receipt OR reçu OR "votre commande") -from:qonto.com <gmail_window>
```

`-from:qonto.com` est indispensable : les notifications de Qonto (« Vous avez effectué un
paiement à Apple… ») contiennent le nom du marchand et le mot « reçu ». Ce sont les premiers
résultats, et ce ne sont jamais des justificatifs.

- Nom du fournisseur : `clean_counterparty_name`, sinon le `label` nettoyé (« APPLE.COM/BILL »
  devient « apple »). Essayer aussi le domaine (`from:apple.com`) et les marques connues du
  fournisseur (Orange → `(orange OR sosh)`).
- Un numéro de facture dans la `reference` Qonto est l'indice le plus fort : le chercher tel quel.
- Si rien ne sort, élargir une fois (sans `has:attachment`, sans mots-clés, fenêtre de ±20 jours),
  puis essayer une application reliée (voir `references/fournisseurs.md`). Au-delà, classer
  « Introuvable » : mieux vaut un rapport honnête qu'une recherche sans fin.

Regrouper les recherches dans peu de cellules du bac à sable (une boucle sur toutes les
opérations) plutôt qu'un appel par opération : c'est plus rapide et ça garde le contexte léger.

## Étape 4 : récupérer le fichier et vérifier son contenu

Pour chaque candidat, obtenir un PDF, dans cet ordre de préférence :
1. Pièce jointe PDF ou image de l'email (`download_gmail_attachment`). S'il y a *Invoice* et
   *Receipt*, prendre *Invoice*.
2. Lien de facture dans l'email (`invoice_links` puis `download_url` ; pour une page
   `invoice.stripe.com/i/...`, ajouter `/pdf`). Vérifier que la réponse est bien un PDF
   (commence par `%PDF`) et pas une page de connexion.
3. Reçu au format HTML sans pièce jointe (Apple, Uber, etc.) : `html_to_pdf(html)` sur le corps
   de l'email. Seulement si l'email **est** le reçu (détail de l'achat, montant TTC, TVA ou
   numéro de commande). Une simple notification (« Votre facture est disponible dans votre
   espace client ») n'est pas un justificatif : classer l'opération « Introuvable », avec
   « à télécharger dans l'espace client ».

Puis lire le texte (`pdf_text`, ou `html_to_text` du corps pour un reçu HTML : les entités
`&nbsp;` et `&#8364;` empêcheraient de trouver le montant) et vérifier les
critères ci-dessous. Garder les octets en mémoire dans `READY[transaction_id]`.

## Étape 5 : décider (sûr, douteux, introuvable)

Une correspondance est **sûre** seulement si toutes ces conditions sont vraies :
- **Montant** : `amount_in_text(amount, texte)` est vrai pour le montant TTC de l'opération.
  Pour un paiement en devise, accepter `local_amount` dans la devise de la facture.
- **Fournisseur** : le nom du fournisseur figure dans le document ou dans l'expéditeur de l'email.
- **Date** : date de facture comprise entre −10 et +5 jours de `emitted_at`.
- **Unicité** : ce document ne correspond qu'à une seule opération, et cette opération qu'à un
  seul document. Deux prélèvements du même fournisseur au même montant (abonnements mensuels)
  se départagent par la date ou le numéro de facture de la `reference` ; sinon le cas est douteux.
- **Lisibilité** : le texte a pu être lu (pas `__ERREUR_LECTURE__`). Un PDF scanné illisible
  devient un cas douteux même si tout le reste concorde.

Tout le reste est **douteux** : montant proche mais différent (HT au lieu de TTC, remise),
facture groupée couvrant plusieurs opérations, échéancier, devis au lieu d'une facture, plusieurs
candidats, PDF illisible. Ne rien attacher ; montrer le candidat à l'utilisateur.

## Étape 6 : attacher les correspondances sûres

Pour chaque opération sûre :
1. Revérifier juste avant que l'opération n'a toujours pas de pièce jointe
   (`list_transaction_attachments`). Si elle en a une entre-temps, passer à la suivante :
   l'utilisateur ou Qonto l'a déjà fait.
2. `request_attachment_upload` avec un nom clair, `AAAA-MM-JJ_fournisseur_montant.pdf`,
   le bon `content_type` et `size_bytes`.
3. Dans le bac à sable : `put_to_qonto(upload_url, READY[id], content_type)`, qui doit
   renvoyer 200. L'URL expire au bout de 15 minutes : demander l'URL puis envoyer
   immédiatement, une opération à la fois.
4. `upload_attachment` avec `target: transaction`, le `blob_ref`, le `transaction_id`, et un
   `idempotency_key` (un UUID par opération) pour qu'une nouvelle tentative ne crée pas de doublon.
5. Ne déclarer l'opération « attachée » que si `upload_attachment` a réussi.

## Étape 7 : rapport

Terminer par ce rapport, en français, opérations identifiées par fournisseur, montant et date
(jamais par UUID) :

```
## Justificatifs Qonto : <période>

Boîte(s) mail consultée(s) : <adresse(s)>

**Bilan** : X opérations sans justificatif → A attachées, D à valider, I introuvables, N sans facture attendue.

### ✅ Attachées
| Date | Fournisseur | Montant | Fichier | Source |

### 🤔 À valider (rien n'a été attaché)
| Date | Fournisseur | Montant | Candidat trouvé | Pourquoi ce n'est pas sûr |
→ Terminer par une question : « Veux-tu que j'attache ces N factures ? »

### ❓ Introuvables
| Date | Fournisseur | Montant | Où chercher |

### ➖ Pas de facture attendue
| Date | Libellé | Montant | Raison / justificatif à fournir |
```

Si l'utilisateur valide des cas douteux, les attacher avec l'étape 6. S'il donne une astuce
sur un fournisseur (« Orange, c'est dans l'espace client », « Lemlist envoie à
compta@… »), proposer de l'ajouter dans la section « Astuces ajoutées au fil des passages »
de `references/fournisseurs.md`.

## Ce que le skill ne fait jamais

- Supprimer ou remplacer une pièce jointe existante.
- Attacher un document dont le montant n'a pas été vérifié dans le texte.
- Afficher les URL présignées (Qonto ou Gmail) dans la réponse : ce sont des accès temporaires.
- Modifier quoi que ce soit dans Gmail (libellés, lu/non lu) sans demande explicite.
