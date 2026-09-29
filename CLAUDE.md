# Content Manager : personal branding Louis Montagne (ICONOKOM)

Ce repo est un **content manager IA** qui trouve, qualifie et structure les sujets de posts LinkedIn de Louis Montagne, fondateur d'ICONOKOM (agence Webflow premium).

Il ne rédige pas les posts à la chaîne : il produit des **fiches d'idées** avec un objectif final clair, un angle, des preuves sourcées, des hooks et un plan de déclinaisons/recyclage.

## Commande principale

`/content-manager` (skill `.claude/skills/content-manager/SKILL.md`). Modes : `complet` (défaut), `rapide`, `recycler`, `sujet "<thème>"`.

## Fichiers de référence (à lire avant toute génération)

| Fichier | Rôle |
|---|---|
| `config/positionnement.md` | Qui est Louis, ICP, piliers éditoriaux, objectifs, ton, interdits |
| `config/sources.md` | Pointures US / FR, éditeurs, médias à surveiller |
| `config/clients.yaml` | Sites clients connectés (GA4, GSC, secteur, objectif, autorisation de citer) |
| `config/kpis-par-secteur.md` | Quelles stats comptent selon secteur et objectif |
| `templates/fiche-idee.md` | Format de sortie obligatoire d'une idée |
| `data/backlog.md` | Toutes les idées déjà produites + calendrier de recyclage (anti-doublon) |

## Connecteurs (via Composio MCP)

- Fireflies : `FIREFLIES_GET_TRANSCRIPTS`, `FIREFLIES_GET_TRANSCRIPT_BY_ID`, `FIREFLIES_GRAPHQL_QUERY`
- Google Analytics 4 : `GOOGLE_ANALYTICS_LIST_ACCOUNT_SUMMARIES`, `GOOGLE_ANALYTICS_BATCH_RUN_REPORTS`
- Search Console : `GOOGLE_SEARCH_CONSOLE_LIST_SITES`, `GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY`
- LinkedIn : `LINKEDIN_GET_POST_CONTENT`, `LINKEDIN_LIST_REACTIONS` (limité, voir `data/linkedin/README.md`)
- Veille web : `COMPOSIO_SEARCH_NEWS`, `COMPOSIO_SEARCH_WEB`, `COMPOSIO_SEARCH_FETCH_URL_CONTENT`
- Webflow MCP officiel pour l'état des sites clients si besoin

Toujours appeler `COMPOSIO_SEARCH_TOOLS` en début de workflow pour récupérer le plan et les pièges connus.

## Règles non négociables

1. **Jamais le caractère "—"** (tiret cadratin) dans un livrable. Utiliser ":" ou "," ou une nouvelle phrase.
2. **Aucune donnée client nominative** dans une idée si `citable: false` dans `config/clients.yaml`. Anonymiser ("un cabinet de conseil RH, 40 personnes") et arrondir les chiffres.
3. **Verbatims Fireflies** : jamais de nom de personne ni d'entreprise prospect. On garde les mots exacts, pas l'identité.
4. **Chaque idée est sourcée** : lien, date, ou référence de transcript. Pas de source = pas d'idée.
5. **Pas de généralités** ("l'IA change tout", "le SEO évolue"). Un angle doit contenir une thèse défendable, une tension ou un chiffre.
6. Français, ton de Louis (voir `config/positionnement.md`). Passer les hooks au skill `humaniser-texte` si disponible.
