---
name: cles-api
description: Récupère automatiquement les clés API, jetons et identifiants d'Orem / ICONOKOM depuis le coffre Notion privé de Louis. À utiliser sans attendre qu'on précise où chercher, dès qu'une tâche demande une clé ou un jeton (« utilise la clé Abby », « avec l'API Pipedrive », ABBY_API_KEY, PIPEDRIVE_API_KEY, WEBFLOW_API_KEY_*, NOTION_API_KEY, LEMLIST_API_KEY, FIGMA_API_KEY, STRIPE_*, MAKE_*, OVH_*, BREVO_*, SMTP_*, ANTHROPIC_API_KEY, PHANTOMBUSTER_*, SERPAPI_KEY, GOOGLE_*, ICLOSED_API_KEY…) ou qu'une variable d'environnement de ce type manque.
---

# Clés API Orem

Toutes les clés sont dans **une seule source** : la page Notion privée « 🔐 Coffre clés API — Claude Code (ICONOKOM / Orem) ».

- ID : `3f9897c5a62a81398913ea3f87b315bd`
- URL : https://app.notion.com/p/3f9897c5a62a81398913ea3f87b315bd

Ne pas demander à Louis où se trouve une clé, ni de la recoller dans le chat : aller la chercher ici.

## Récupérer une clé

1. Si la variable est déjà dans l'environnement ou dans `~/.orem.env`, l'utiliser directement.
2. Sinon, lire la page avec le connecteur Notion (`notion-fetch` avec l'ID ci-dessus ; si l'outil n'est pas chargé, `ToolSearch` avec `select:mcp__Notion__notion-fetch`). Le contenu utile est le bloc de code au format `.env`.
3. Écrire ce bloc dans `~/.orem.env` (hors du dépôt, `chmod 600`), puis charger les variables dans la commande qui en a besoin : `set -a; . ~/.orem.env; set +a; <commande>`.
4. Sur le Mac de Louis, si Notion n'est pas disponible : `/Users/louismontagne/automatisation/.env`.

## Règles

- Ne jamais afficher la valeur d'une clé dans le chat, un log ou une sortie de commande. Pour vérifier une clé, n'indiquer que sa présence.
- Ne jamais écrire une clé dans un fichier du dépôt git, un commit, une PR, un artefact ou un message externe.
- Stripe live (`STRIPE_SK_SLEEPEE_LIVE`), Make, OVH et SMTP : lecture seule, sauf accord explicite de Louis pour l'action précise.
- `GOOGLE_SERVICE_ACCOUNT_JSON` et `CSV_PATH_*` pointent vers des fichiers du Mac ; ils ne fonctionnent pas dans une session cloud.
- Si l'appel à l'API est bloqué par le réseau de la session cloud (`host_not_allowed`), le dire à Louis en nommant le domaine à autoriser dans l'accès réseau de l'environnement.
- Quand une clé est régénérée, la mettre à jour dans la page Notion et rappeler à Louis de la changer aussi dans le `.env` du Mac et du VPS (`/root/pipeline/automatisation/.env`).
