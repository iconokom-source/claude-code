# lemlist : lecture du prospect et écriture des variables

Le prospect est **déjà dans une campagne, en attente** (ajouté en amont par Louis).
Le skill ne crée pas de lead, ne lance rien, ne reprend rien : il remplit des variables.

## 1. Retrouver le prospect

- Louis donne un email, un nom ou un ID `lea_…` → `search_campaign_leads` (email ou id).
- Louis donne un nom de campagne → `get_campaigns` (search) puis `search_campaign_leads`
  (campaignId) pour lister les leads en attente.
- Garder : `leadId`, `campaignId`, firstName, lastName, jobTitle, companyName, companyDomain,
  linkedinUrl, et toutes les variables déjà présentes (dont `oremObjectif` et d'éventuelles notes).

## 2. Lire la séquence

`get_campaign_sequences` (campaignId). Pour chaque étape, repérer les variables `{{…}}` utilisées
dans l'objet et le corps. **Ce sont exactement ces variables qu'il faut remplir.**
Si la campagne utilise la convention ci-dessous, parfait ; sinon, s'aligner sur ses noms.

## 3. Convention de variables Orem (par défaut)

| Variable | Étape | Contenu |
|---|---|---|
| `oremObjectif` | - | `rdv` ou `loom` (lu, pas écrit, sauf si Louis le fixe) |
| `oremObjet1` | Mail 1 | Objet |
| `oremMail1` | Mail 1 | Corps, de « Bonjour {{firstName}}, » au CTA inclus, sans signature |
| `oremLinkedinInvite` | Invitation LinkedIn | Note ≤ 200 caractères (ou vide si invitation sans note) |
| `oremRelance1` | Relance mail (même fil) | Corps |
| `oremLinkedin1` | Message LinkedIn (si connecté) | Corps |
| `oremRelance2` | Dernier mail | Corps |

Séquence type si Louis n'en a pas d'autre : J0 Mail 1 · J2 Invitation LinkedIn · J4 Relance 1 ·
J7 Message LinkedIn · J11 Relance 2.

Dans la séquence lemlist, chaque étape contient seulement la variable (ex. corps = `{{oremMail1}}`)
et la signature de l'expéditeur.

## 4. Variables lemlist natives dans les textes

On peut laisser `{{firstName}}` et `{{companyName}}` dans les textes : lemlist les remplace.
N'utiliser **que** des variables qui existent sur le lead (les vérifier à l'étape 1). En cas de
doute, écrire la valeur en dur (ex. le prénom). Ne jamais laisser une variable inconnue.

Mise en forme : lemlist garde les retours à la ligne. Une ligne vide entre chaque idée.

## 5. Écrire (après validation de Louis uniquement)

`update_lead_variables` avec `leadId` et `{ "oremObjet1": "…", "oremMail1": "…", … }`.
- Valeurs non vides uniquement (lemlist refuse les chaînes vides : omettre la variable).
- Ne jamais passer de champ standard (email, firstName, companyName…) : refusé.
- Écrire **uniquement** les messages que Louis a validés. S'il en valide 3 sur 5, on écrit 3.
- Ensuite, relire le lead (`search_campaign_leads` par id) et confirmer à Louis ce qui est en place.
- Ne pas modifier l'état du lead ni de la campagne. Louis relance lui-même.
