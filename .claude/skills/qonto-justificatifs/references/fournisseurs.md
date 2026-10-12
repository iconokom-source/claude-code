# Où trouver la facture, selon le type d'opération

À lire à l'étape 2 (tri des opérations) et quand une recherche Gmail ne donne rien. Ajouter
une ligne en bas de ce fichier chaque fois qu'un fournisseur demande une astuce particulière :
le skill s'améliore à chaque passage.

## Opérations sans facture attendue : ne rien chercher

Ces opérations n'ont pas de facture fournisseur. Les ranger dans « Pas de facture attendue »
du rapport, sans rien attacher, car un faux justificatif est pire qu'une absence.

Tester les lignes dans l'ordre du tableau : la première qui s'applique l'emporte (un
`qonto_fee` de 0,22 € avec `reference: fx_card` est d'abord un frais de change).

| Signe dans Qonto | Pourquoi | Quoi dire dans le rapport |
|---|---|---|
| Montant inférieur à 1 € avec `reference: fx_card` | Frais de change sur un paiement par carte | « Frais de change » |
| `operation_type: transfer` vers une personne physique **et** (catégorie *Salaires* **ou** référence contenant « salaire », « acompte », « accompte », « paie ») | Paie : le justificatif est la fiche de paie | « Salaire : joindre la fiche de paie ». Si seule la catégorie l'indique (référence neutre comme « Envoyé depuis Qonto »), ajouter « à confirmer » |
| Virement vers le dirigeant lui-même (nom de l'utilisateur) | Rémunération de gérant, remboursement de frais ou apport : la nature change le justificatif | « Virement au dirigeant : préciser rémunération ou note de frais » |
| Virement entre deux comptes Qonto de la même société (IBAN de l'organisation) | Mouvement interne | « Virement interne » |
| URSSAF, retraite (Malakoff Humanis, etc.), impôts (DGFIP) | Cotisations et impôts : avis d'échéance sur le portail de l'organisme, pas de facture | « Cotisation : avis à télécharger sur le portail de l'organisme » |
| `operation_type: qonto_fee` | Frais Qonto : les factures sont dans l'app Qonto (paramètres de l'abonnement), pas dans Gmail | « Frais Qonto : facture disponible dans l'app Qonto » |

## Fournisseurs courants et où chercher

| Fournisseur (libellé Qonto) | Où est la facture | Astuce de recherche |
|---|---|---|
| Apple (`APPLE.COM/BILL`) | Email « Votre reçu d'Apple », reçu en HTML sans PDF | `from:no_reply@email.apple.com` ; convertir le corps HTML en PDF ; le montant TTC figure dans le reçu |
| Orange / Sosh (`ORANGE SA`, `ORANGE SA-ORANGE`) | Espace client Orange ; email « Votre facture est disponible » sans PDF | Chercher `(orange OR sosh)` : le numéro de facture de la `reference` Qonto n'est pas dans l'email Sosh. L'email n'est qu'une notification avec un lien vers l'espace client (connexion requise) : mettre « à télécharger dans l'espace client », ne pas convertir la notification |
| Lemlist | Email de reçu Stripe (« Your receipt from lemlist ») avec une facture PDF jointe ou un lien | `from:(lemlist OR stripe.com) (receipt OR invoice OR facture)` |
| Logiciels payés via Stripe (ChatSEO, la plupart des SaaS) | Email « Your receipt from X » ou « Facture de X », PDF joint (Invoice-XXXX.pdf et Receipt-XXXX.pdf) | Préférer *Invoice* à *Receipt* si les deux sont joints ; sinon lien `invoice.stripe.com/i/...` (ajouter `/pdf` pour obtenir le PDF) |
| Google Workspace, Notion, Figma, Webflow… | Email mensuel de facturation avec PDF ou lien vers la console | Chercher par nom + « invoice » / « facture » ; la date de facture précède souvent de 0 à 3 jours la date de débit |
| Leasing (CM-CIC Leasing Solutions / CCLS) | E-facturation directement dans Qonto (`list_supplier_invoices`), ou échéancier annuel | Il peut y avoir plusieurs contrats à des montants proches (60,00 € et 60,34 €) : le numéro de contrat de la `reference` doit correspondre. Chercher aussi « échéancier » ; un échéancier peut justifier plusieurs prélèvements, mais seulement après accord de l'utilisateur (cas douteux) |
| Restaurants, commerces physiques (`SAS ...`, terminal carte) | Ticket papier, rarement dans Gmail | Une seule recherche rapide, sinon « ticket papier à photographier » |

## Applications reliées (Composio et autres)

Certaines applications exposent leurs factures par API. Avant de conclure « introuvable » pour un
fournisseur connecté, lancer `COMPOSIO_SEARCH_TOOLS` avec « list billing invoices in <app> ».
Si un outil renvoie un PDF ou une URL de PDF, l'utiliser comme source.

Attention : la connexion Stripe de l'utilisateur est **son propre compte Stripe** (ce que ses
clients lui paient). Elle sert aux encaissements, pas aux factures fournisseurs.

## Astuces ajoutées au fil des passages

<!-- Format : - **Fournisseur** : astuce (date d'ajout) -->
