# Où trouver la facture, selon le type d'opération

À lire à l'étape 2 (tri des opérations) et quand une recherche Gmail ne donne rien. Ajouter
une ligne en bas de ce fichier chaque fois qu'un fournisseur demande une astuce particulière :
le skill s'améliore à chaque passage.

## Opérations sans facture attendue : ne rien chercher

Ces opérations n'ont pas de facture fournisseur. Les ranger dans « Pas de facture attendue »
du rapport, sans rien attacher, car un faux justificatif est pire qu'une absence.

| Signe dans Qonto | Pourquoi | Quoi dire dans le rapport |
|---|---|---|
| `operation_type: transfer` vers une personne physique, catégorie *Salaires*, référence « salaire », « acompte », « accompte » | Paie : le justificatif est la fiche de paie | « Salaire : joindre la fiche de paie » |
| Virement entre deux comptes Qonto de la même société (IBAN de l'organisation) | Mouvement interne | « Virement interne » |
| URSSAF, retraite (Malakoff Humanis, etc.), impôts (DGFIP) | Cotisations et impôts : avis d'échéance sur le portail de l'organisme, pas de facture | « Cotisation : avis à télécharger sur le portail de l'organisme » |
| `operation_type: qonto_fee` | Frais Qonto : les factures sont dans l'app Qonto (paramètres de l'abonnement), pas dans Gmail | « Frais Qonto : facture disponible dans l'app Qonto » |
| Montant inférieur à 1 € avec `reference: fx_card` | Frais de change sur un paiement par carte | « Frais de change » |

## Fournisseurs courants et où chercher

| Fournisseur (libellé Qonto) | Où est la facture | Astuce de recherche |
|---|---|---|
| Apple (`APPLE.COM/BILL`) | Email « Votre reçu d'Apple », reçu en HTML sans PDF | `from:no_reply@email.apple.com` ; convertir le corps HTML en PDF ; le montant TTC figure dans le reçu |
| Orange (`ORANGE SA`) | Espace client Orange ; parfois un email « Votre facture est disponible » sans PDF | Le numéro de facture est dans la `reference` Qonto (« facture: 2444495998 ») : le chercher dans Gmail. Si l'email n'a qu'un lien vers l'espace client (connexion requise), mettre « à télécharger dans l'espace client » |
| Lemlist | Email de reçu Stripe (« Your receipt from lemlist ») avec une facture PDF jointe ou un lien | `from:(lemlist OR stripe.com) (receipt OR invoice OR facture)` |
| Logiciels payés via Stripe (ChatSEO, la plupart des SaaS) | Email « Your receipt from X » ou « Facture de X », PDF joint (Invoice-XXXX.pdf et Receipt-XXXX.pdf) | Préférer *Invoice* à *Receipt* si les deux sont joints ; sinon lien `invoice.stripe.com/i/...` (ajouter `/pdf` pour obtenir le PDF) |
| Google Workspace, Notion, Figma, Webflow… | Email mensuel de facturation avec PDF ou lien vers la console | Chercher par nom + « invoice » / « facture » ; la date de facture précède souvent de 0 à 3 jours la date de débit |
| Leasing (CM-CIC Leasing Solutions / CCLS) | Échéancier annuel unique ou facture par échéance, souvent sur portail | Chercher « échéancier » et le numéro de contrat présent dans la `reference` ; un échéancier peut justifier plusieurs prélèvements, mais seulement après accord de l'utilisateur (cas douteux) |
| Restaurants, commerces physiques (`SAS ...`, terminal carte) | Ticket papier, rarement dans Gmail | Une seule recherche rapide, sinon « ticket papier à photographier » |

## Applications reliées (Composio et autres)

Certaines applications exposent leurs factures par API. Avant de conclure « introuvable » pour un
fournisseur connecté, lancer `COMPOSIO_SEARCH_TOOLS` avec « list billing invoices in <app> ».
Si un outil renvoie un PDF ou une URL de PDF, l'utiliser comme source.

Attention : la connexion Stripe de l'utilisateur est **son propre compte Stripe** (ce que ses
clients lui paient). Elle sert aux encaissements, pas aux factures fournisseurs.

## Astuces ajoutées au fil des passages

<!-- Format : - **Fournisseur** : astuce (date d'ajout) -->
