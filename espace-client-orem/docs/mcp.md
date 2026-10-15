# Piloter l'espace client depuis Claude Code (MCP)

Le serveur MCP `app/mcp.js` permet de gérer les espaces clients en langage naturel, par exemple :

> « Nouveau client Atelier Neuf, vouvoiement, offre site web, contact Marie (marie@atelier-neuf.fr), 7 600 € HT. Prépare la proposition : direction artistique 2 400 €, site Webflow 6 pages 5 200 €, acompte 50 %, et envoie-la. Dépose aussi le devis PDF qui est sur mon bureau. »

Claude Code enchaîne alors les outils : `creer_client`, `proposition`, `deposer_fichier`, puis `message`.

## Installation (une fois par personne)

Depuis `espace-client-orem/app`, avec le serveur lancé (`node server.js`) :

1. Créer son jeton personnel : `node jeton.js prenom@agence-orem.fr`. Il est valable 90 jours (`--jours 30` pour changer) et n'est affiché qu'une fois : le ranger dans le coffre Notion, jamais dans le dépôt. Le serveur ne garde que son empreinte, dans `data/api-tokens.json`.
2. Brancher le MCP dans Claude Code :
   `claude mcp add orem-espace -e OREM_URL=http://localhost:3000 -e OREM_TOKEN=<jeton> -- node "$(pwd)/mcp.js"`
3. Vérifier : `claude mcp list` doit afficher `orem-espace`.

Lister les jetons : `node jeton.js --liste` ; en retirer un : `node jeton.js --retirer <10 premiers caractères>`.

## Outils

| Outil | Ce qu'il fait |
|---|---|
| `lister_clients` | Les espaces, leur offre, le temps O.R.E.M. et ce qui attend |
| `voir_client` | Le détail d'un espace (étapes, validations, fichiers attendus, factures, propositions, messages) |
| `creer_client` | Crée l'espace ; avec un e-mail, le client reçoit son invitation. Le registre tu ou vous est obligatoire |
| `proposition` | Prépare la proposition commerciale (lignes HT, acompte, validité) et l'envoie si demandé |
| `deposer_fichier` | Dépose un fichier de l'ordinateur dans l'espace (PDF de proposition, devis, livrable…) |
| `message` | Écrit au client, avec une vidéo Loom facultative, signé « L'équipe Orem » par défaut |
| `prochaine_etape` | La prochaine étape affichée en grand sur l'accueil du client |
| `liens` | Liens Figma, prototype, site en préparation, ancien site (https seulement) |
| `fichier_attendu` | Ajoute un fichier que le client doit déposer (relance automatique) |
| `temps` | Passe le projet au temps O.R.E.M. voulu |
| `inviter` | Ajoute une personne chez le client |
| `action` | Toute autre action de l'API (type et champs), pour le reste |

## Garde-fous

- Le jeton n'ouvre que les comptes de l'agence (un client ne peut pas en avoir) et passe par les mêmes droits et contrôles que l'interface (liens en https, registre obligatoire, montants, tailles de fichiers).
- Le MCP ne parle qu'à `OREM_URL`. Tant que l'espace n'est pas en ligne, c'est le serveur local de l'ordinateur : les clients ne peuvent pas encore s'y connecter. La mise en ligne sur un sous-domaine d'agence-orem.fr attend la validation de Louis.
- Aucun e-mail réel ne part tant que `MAIL_ENABLED` n'est pas activé : les invitations restent dans la boîte d'envoi locale (Réglages).
