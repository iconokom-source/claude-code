# Données LinkedIn de Louis

L'API LinkedIn (et donc Composio) ne permet pas de lister les posts d'un profil personnel ni d'en lire les impressions. Deux options fiables :

## Option 1 : export natif (10 min / mois)
1. LinkedIn > Profil > Analytics > **Contenu** > période "365 derniers jours" > **Exporter**.
2. Dépose le fichier ici tel quel (ex : `Content_2026-09-29.xlsx`). L'agent lit le plus récent.

## Option 2 : fichier `posts.csv` tenu à jour
Colonnes :

```
date,url,texte_debut,pilier,angle,format,impressions,reactions,commentaires,republications,clics_profil,dm_generes
```

Les colonnes `pilier`, `angle`, `dm_generes` sont précieuses : elles permettent de mesurer ce qui génère du business, pas seulement de la portée.

## Option 3 (automatisable plus tard)
Outil tiers avec API (Shield, Taplio, AuthoredUp) ou scénario Make qui alimente `posts.csv` chaque semaine.
