# API Abby — devis

Source : SDK officiel `@abby-inc/node` 2.5.0 (types générés depuis l'OpenAPI) · doc : https://docs.abby.fr

- Base : `https://api.abby.fr` (surcharge possible : `ABBY_BASE_URL`)
- Auth : `Authorization: Bearer $ABBY_API_KEY` (clés `suk_…`)
- Montants : **en centimes**. Dates : timestamps Unix **en secondes** (vérifié le 14/10/2026).
- Le `title` du devis n'est **pas imprimé** sur le PDF : le script le recopie en `headerNote` (« Objet : … ») si aucune note d'en-tête n'est fournie.
- Le PDF reprend automatiquement l'émetteur (ICONOKOM SARL), le RIB Qonto, les pénalités de retard et le bloc « Bon pour accord » : ne pas les répéter dans les notes.
- SIRET obligatoire pour une organisation française : le chercher avant de créer le client (mentions légales du site, annuaire-entreprises.data.gouv.fr).

## Endpoints utilisés

| Action | Méthode | Chemin | Corps |
|---|---|---|---|
| Chercher organisations | GET | `/organizations?page=1&limit=10&search=` | — → `{docs:[{id,name,emails,siret}]}` |
| Chercher contacts | GET | `/contacts?page=1&limit=10&search=` | — → `{docs:[{id,fullname,emails,organization,defaultContact}]}` |
| Contacts d'une organisation | GET | `/organization/{id}/contacts` | — |
| Créer organisation | POST | `/organization` | `{name, emails?, siret?, vatNumber?, billingAddress?}` |
| Créer contact | POST | `/contact` | `{firstname, lastname, emails?, phone?, billingAddress?}` |
| Créer devis (brouillon) | POST | `/v2/billing/estimate/{customerId}` | `{estimateType: "estimate" \| "purchase_order"}` |
| Lignes | PATCH | `/v2/billing/{id}/lines` | `{lines:[UpdateLineDto], discount?}` |
| Infos générales | PATCH | `/v2/billing/estimate/{id}/general-informations` | voir plus bas |
| Titre | PATCH | `/v2/billing/{id}/title` | `{title}` |
| Validité / délai | PATCH | `/v2/billing/estimate/{id}/timeline` | `{emittedAt, paymentDelay, expiredAt}` |
| Finaliser | PATCH | `/v2/billing/{id}/finalize` | — |
| Lire | GET | `/v2/billing/{id}` | — |
| PDF | GET | `/v2/billing/{id}/download?locale=fr` | — → binaire PDF |
| Supprimer | DELETE | `/v2/billing/{id}` | — |
| Signé / refusé | PATCH | `/v2/billing/estimate/{id}/sign` · `/refuse` (et `unsign`, `unrefuse`) | — |
| Facture d'acompte / finale | POST | `/v2/billing/estimate/{id}/advance` · `/final-invoice` | — |

`billingAddress` : `{address, complement?, zipCode, city, country: "FR"}`.

## Spec lue par `abby.sh create`

```json
{
  "customerId": "<id organisation ou contact>",
  "estimateType": "estimate",
  "title": "Refonte site Webflow",
  "validityDays": 30,
  "paymentDelay": "thirty_days",
  "finalize": false,
  "lines": [
    {
      "designation": "Design UI — 5 pages",
      "description": "Maquettes Figma desktop + mobile, 2 allers-retours",
      "quantity": 1,
      "quantityUnit": "fixed_rate",
      "unitPrice": 250000,
      "type": "service_delivery",
      "vatCode": "FR_2000"
    }
  ],
  "discount": { "mode": "PERCENTAGE", "amount": 1000 },
  "generalInformations": {
    "headerNote": "…",
    "footerNote": "Acompte de 30 % à la signature.",
    "paymentMethods": ["transfer"]
  }
}
```

Seuls `customerId` et `lines` sont obligatoires. Pour chaque ligne, `designation`, `quantity`, `quantityUnit`, `unitPrice` et `type` sont obligatoires, et `vatCode` l'est sans `productId`.

`discount` (global ou par ligne) : `{mode: "PERCENTAGE" | "AMOUNT", amount}`, où `1000` = 10 % ou 10,00 €.

## Valeurs possibles

- `quantityUnit` : `unit`, `hour`, `day`, `week`, `month`, `year`, `fixed_rate` (forfait), `page`, `word`, `license`, `article`, `person`, `minute`…
- `type` : `service_delivery` (prestation de services), `commercial_or_craft_services`, `sale_of_goods`, `sale_of_manufactured_goods`, `disbursement` (débours, TVA 0).
- `vatCode` : `FR_2000` (20 %), `FR_1000` (10 %), `FR_550` (5,5 %), `FR_210` (2,1 %), `FR_00HT` (0 % / hors taxe), `FR_00UE`, `FR_0HUE`.
- `paymentDelay` : `at_reception`, `end_of_month`, `seven_days`, `ten_days`, `fifteen_days`, `thirty_days`, `thirty_days_end_of_month`, `forty_five_days`, `forty_five_days_end_of_month`, `sixty_days`, `sixty_days_end_of_month`, `ninety_days`, `ninety_days_end_of_month`, `one_hundred_and_twenty_days`, `other` (avec `customDueDate`).
- `paymentMethods` : `transfer`, `direct_debit`, `credit_card`, `cheque`, `cash`, `paypal`, `stripe`, `other`.
- `state` d'un devis : `draft`, `finalized`, `signed`, `refused`.
- `locale` du PDF : `fr`, `en`, `de`, `it`, `nl`, `pt`, `es`.

## Erreurs

- 401 → clé invalide ou révoquée. 404 → id inconnu.
- Finalisation refusée → lire `finalizeRequirements[].message` (ex. `hasLineDesignation`, `hasValidAmount`, `validateEmittedDate`).
