# Abby (devis & factures)

## Clé API

- Variable d'environnement : **`ABBY_API_KEY`**. Ne jamais l'écrire dans ce dépôt, dans Notion ni dans un message.
- Absente (`printenv ABBY_API_KEY` vide) → le dire en une ligne et passer au repli Gmail. Ne pas demander la clé dans le chat.
- Où la définir :
  - Session cloud Claude Code : environnement → Edit → variables d'environnement (ou secrets réseau) `ABBY_API_KEY=…`, et autoriser le domaine de l'API Abby dans l'accès réseau.
  - Claude Code local : `~/.claude/settings.json` → `"env": { "ABBY_API_KEY": "…" }`.

## Appels

Authentification : en-tête `Authorization: Bearer $ABBY_API_KEY`.

⚠️ Base URL et chemins **non vérifiés** (réseau bloqué lors de la création du skill). Au premier lancement : consulter la doc API Abby (espace Abby → Paramètres → API / développeurs), tester, puis remplacer cette section par les endpoints réels.

Besoins :
1. Retrouver le client (par nom / email).
2. Lister ses devis → numéro `D-…`, date, statut (signé ?), montant HT/TTC.
3. Lister ses factures → numéro `F-…`, date, montant, statut (payée ?).
4. Télécharger le PDF de chaque document retenu → `create_file` Drive.

Exemple de squelette (à corriger une fois les endpoints confirmés) :
```bash
curl -sS -H "Authorization: Bearer $ABBY_API_KEY" "<BASE_URL>/<endpoint>" | jq .
curl -sS -H "Authorization: Bearer $ABBY_API_KEY" "<BASE_URL>/<endpoint-pdf>" -o "/tmp/<NUM>.pdf"
```
Erreur 401/403 → clé invalide ou expirée : le dire, repli Gmail. Erreur réseau/proxy → domaine non autorisé : le dire, repli Gmail.

## Repli Gmail

`search_threads` : `from:nepasrepondre@abby.fr (<nom client> OR <domaine client>)` puis `subject:(D-2026 OR F-2026) <client>`. Chaque mail donne numéro, objet, destinataire, date. Le PDF n'est pas téléchargeable par le connecteur Gmail → demander à Louis de le déposer dans le sous-dossier Drive (voir SKILL.md, étape 1).
