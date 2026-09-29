# Quelles stats comptent, selon le secteur et l'objectif du site

But : l'agent `data-clients` ne remonte **pas** "le trafic a augmenté". Il remonte la stat qui parle au persona cible, avec un angle de post.

## Matrice objectif du site → KPI "postables"

| Objectif site | KPI GA4 prioritaires | KPI GSC prioritaires | La stat qui fait un bon post |
|---|---|---|---|
| lead_gen | Taux de conversion formulaire (`form_submit` / sessions), leads par source, taux d'engagement pages services | Clics sur requêtes non-marque, positions top 3 sur requêtes transactionnelles | "x2 leads à trafic constant" = preuve que le site vend, pas qu'il attire |
| demo_booking | Conversions démo, taux page /demo, chemin avant démo (pages vues), temps avant conversion | Impressions requêtes "alternative à", "vs", "pricing" | "Les visiteurs qui lisent la page X convertissent 3x plus" : insight UX |
| trial_signup | Signups, taux pricing → signup, source des signups | Requêtes "comment faire X" (top of funnel) | Contenu qui convertit vs contenu qui attire |
| vente_en_ligne | Taux de conversion, panier moyen, abandon checkout, revenu par session | Clics fiches produit / catégories | Micro-changement UX → impact CA |
| notoriete | Visiteurs directs + marque, profondeur de visite, retour visiteurs | Requêtes de marque (croissance), impressions totales | "La marque est plus recherchée depuis la refonte" |
| recrutement | Vues page carrières, clics candidature | Requêtes "<marque> recrutement / avis" | Site = arme de marque employeur |

## Spécificités par secteur

| Secteur | Ce qui intéresse les pairs du secteur | Piège |
|---|---|---|
| saas_b2b | Démo, pricing page, comparatifs, vitesse de mise à jour par le marketing | Ne pas confondre signups et clients |
| services_b2b | Qualité des leads, pages expertise, preuves (cas clients) | Volume de leads bas : parler en taux et qualité |
| ecommerce | CA, conversion mobile, Core Web Vitals | Saisonnalité : comparer N vs N-1 |
| organisation | Accessibilité, audience, dons / adhésions | Objectifs non marchands : trouver l'équivalent "conversion" |
| startup_early | Vitesse d'itération, landing pages testées | Petits volumes : pas de % sur 12 conversions |
| industrie | Leads internationaux, pages produits techniques, SEO longue traîne | Cycles longs |

## Règles d'analyse

1. **Toujours comparer** : 90 jours après mise en ligne vs 90 jours avant (ou N vs N-1 si saisonnalité).
2. **Seuil de significativité** : pas de pourcentage si la base est < 30 conversions ou < 1 000 sessions. Donner le chiffre brut ou ne pas publier.
3. **Signaux transverses** (les plus précieux pour des posts de vision) : une même tendance sur 3+ clients, par ex. baisse du CTR organique malgré positions stables (effet AI Overviews), montée du trafic référent ChatGPT / Perplexity (`sessionSource` contenant chatgpt, perplexity, copilot, gemini), part du mobile.
4. **Anonymisation** selon `config/clients.yaml`.
