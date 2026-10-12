# lemlist : lecture du prospect et écriture des variables

Le prospect est **déjà dans une campagne, en attente** (ajouté en amont par Louis).
Le skill ne crée pas de lead, ne lance rien, ne reprend rien : il remplit des variables.

## 1. Retrouver le prospect

- Louis donne un email, un nom ou un ID `lea_…` → `search_campaign_leads` (email ou id).
- Louis donne un nom de campagne → `get_campaigns` (search) puis `search_campaign_leads`
  (campaignId) pour lister les leads en attente.
- Garder : `leadId`, `campaignId`, firstName, lastName, jobTitle, companyName, companyDomain,
  linkedinUrl, et toutes les variables déjà présentes (et d'éventuelles notes).

## 2. Lire la séquence

`get_campaign_sequences` (campaignId). Pour chaque étape, repérer les variables `{{…}}` utilisées
dans l'objet et le corps. **Ce sont exactement ces variables qu'il faut remplir.**
Si la campagne utilise la convention ci-dessous, parfait ; sinon, s'aligner sur ses noms.

## 3. Convention de variables Orem

Les 17 variables et leur ordre sont dans `references/sequence.md` (colonne « Variable lemlist »).
Les tâches manuelles (16, 17) et le script (15) vont dans le titre ou le contenu des étapes
« tâche manuelle » / « appel » de lemlist. Les branches (LinkedIn accepté ou non, choix à l'étape
« Évaluer ») sont des conditions de la séquence lemlist, réglées par Louis.

Dans la séquence lemlist, chaque étape contient seulement la variable (ex. corps = `{{oremEmail1}}`)
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
