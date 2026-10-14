# Trame du deck Évolution (fixe)

14 slides, toujours dans cet ordre. Modèles = catalogue `orem-da` (`template/index.html`). Un titre de slide est **une affirmation tirée des chiffres du mois** (« Google vous montre davantage, mais vous classe mal sur votre propre nom »), jamais une étiquette (« Search Console »). Le `.sub` à droite donne la période et la source.

| # | Slide | Modèle | Contenu | Source |
|---|---|---|---|---|
| 1 | Couverture | P01 | Surtitre « Évolution · <Mois AAAA> ». Titre : nom du client. Sous-titre : le verdict du mois en une phrase. | stratège |
| 2 | L'essentiel du mois | P07 (chiffres + citation) | 4 chiffres : visites (sessions), clics Google, conversions (ou « non mesurées »), visites venues des IA. Sous chaque chiffre : vs M-1 et vs N-1. À droite, à la place de la citation : 3 phrases « ce qu'il faut retenir ». | `kpi.json` |
| 3 | Ce que nous avons fait | P06 (chronologie) ou P03 | Colonnes Livré / En cours / Prévu, issues de Programme & Livrables. Recommandations du mois précédent : faites, décalées (avec la raison). | `notion.json`, M-1 |
| 4 | Ce qui change chez vous | P03 | Actualité du client (offre, recrutement, saison, campagne) et ce qu'elle implique pour le site. **Slide retirée si `notion.json` ne contient rien.** | `notion.json` |
| 5 | Intercalaire « Ce que disent les chiffres » | P02 | | |
| 6 | Audience | P05 (split) | Gauche : courbe 13 mois des sessions (SVG). Droite : carte canaux (sessions M, écart M-1, taux d'engagement), canal qui progresse le plus mis en avant. | `ga4.tendance`, `ga4.canaux` |
| 7 | Qualité des visites | P03 | 3 points : engagement, pages d'entrée qui portent le site (top 5), page qui décroche (fort trafic, faible engagement). | `ga4.totaux`, `ga4.pages_entree` |
| 8 | Conversions | P04 (sombre) | Événements clés par canal et par page. **Si la mesure est cassée, la slide devient « Ce que nous ne voyons pas encore »** : ce qui manque et ce que ça coûte en décision. | `ga4`, `analyses/mesure.md` |
| 9 | Visibilité dans Google | P07 | Clics, impressions, CTR, position moyenne (M, vs M-1, vs N-1). Part marque / hors marque. Mention des propriétés additionnées si plusieurs. | `gsc.totaux`, `gsc.marque` |
| 10 | Requêtes et pages | P09 (tableau 3 colonnes) | Colonnes : « Ce qui monte », « Ce qui baisse », « À portée de main » (positions 4 à 15). 4 à 5 lignes chacune, chiffres exacts. | `gsc.requetes_*`, `gsc.opportunites_position` |
| 11 | Visibilité dans les IA | P05 | Sessions venues de ChatGPT, Perplexity, Gemini… (M, vs M-1), engagement comparé à la moyenne du site, pages d'arrivée. Ce que nous faisons pour être cités. | `ga4.ia`, `analyses/seo-geo.md` |
| 12 | Fiabilité de la mesure | P03 (3 points numérotés) | Les 3 alertes les plus graves de l'expert mesure, chacune avec son effet concret (« les réservations D-Edge ne remontent pas : impossible de savoir quel canal remplit l'hôtel »). Tout va bien → une seule ligne de validation et la slide passe en P11. | `analyses/mesure.md` |
| 13 | Nos recommandations | P08 (3 cartes, la priorité cerclée d'accent) | Niveau 1 : 1 priorité + 3 à 4 secondaires. Niveau 2 : 2 priorités + 6 à 8 secondaires (P08 + une carte liste). Chaque carte : action, pourquoi (un chiffre), effet attendu, responsable (Orem ou client), échéance. | `recommandations.md` |
| 14 | Prochaine visio | P16 | Date de la prochaine visio de pilotage si connue, sinon CTA de réservation, contact du porteur du dossier. | fiche client |

Si le niveau 2 impose plus de recommandations que P08 n'en contient : ajouter une slide P03 « Et aussi » juste après la 13.

## Chiffres

- Format français : `1 838`, `17,8 %`, `+0,1 pt` pour un taux, position `8,7`. Durée en `2 min 21 s`.
- Écart : flèche + valeur (`↑ 17,8 %`, `↓ 23,7 %`). Pas de vert ni de rouge (hors palette) : hausse en accent (`var(--hl)`), baisse en `--muted` / `--light-muted`. Pour une position, une baisse du chiffre est une amélioration : écrire « gagne 1,2 place ».
- N-1 absent ou antérieur à la mise en ligne : « N-1 : avant le nouveau site » en `.sub`, pas de pourcentage.
- Jamais plus de 4 chiffres en `.display` sur une slide.

## Graphiques (SVG inline)

- Barres verticales pour la tendance 13 mois : barres `var(--ink)` sur clair (ou blanc à 60 % sur sombre), **mois analysé en `var(--hl)`**, étiquettes mois en `.label` (17px) `--muted`, valeur seulement sur le mois analysé et le plus haut.
- Barres horizontales pour les canaux et les sources IA, triées, valeur au bout de la barre.
- Pas de camembert, pas de légende séparée, pas de grille. Hauteur max 520px.

## Ton

- Orienté décision : chaque slide de chiffres se termine par un bloc « Ce que nous en faisons » (une phrase, renvoi à une recommandation).
- Pas de jargon non expliqué : « CTR » → « taux de clic », « événement clé » → « conversion (réservation, demande de contact) ».
