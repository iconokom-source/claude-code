# Installation sur Mac — skill « maj-deal-shannen » avec une clé API Anthropic

Objectif : utiliser le skill dans **Claude Code** (terminal) en payant à l'usage via une clé API, sans consommer les limites de ton abonnement claude.ai.

Durée : ~30 min. Tout se fait une seule fois.

---

## 1. Créer la clé API Anthropic

1. Va sur https://platform.claude.com → connecte-toi (ou crée un compte « Agence Orem »).
2. **Billing** → ajoute un moyen de paiement et un crédit (ex. 20 €).
3. **Limits** (de l'organisation ou du workspace) → fixe une **limite de dépense mensuelle** (ex. 30 €).
4. **API Keys** → **Create Key** → nomme-la `claude-code-mac` → copie la clé (`sk-ant-…`). Elle ne sera plus affichée.

> Alternative sans clé à copier : à l'étape 3, tape `/login` dans Claude Code et choisis **« Sign in with your Console account »**. La facturation passe aussi par la Console (workspace « Claude Code » créé automatiquement, sur lequel tu peux fixer une limite).

## 2. Installer Claude Code

Ouvre l'app **Terminal** et colle :

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Vérifie : `claude --version`.

## 3. Brancher Claude Code sur la clé API

Ajoute la clé à ton profil (remplace `sk-ant-…`) :

```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-…"' >> ~/.zshrc
source ~/.zshrc
```

Puis lance `claude`. Il te demande une fois si tu veux utiliser cette clé API → réponds **Oui** (modifiable ensuite dans `/config` → « Use custom API key »).
Si tu étais déjà connecté avec ton abonnement : tape `/logout` dans Claude Code, quitte, relance `claude`.

Vérifie avec `/status` : la ligne d'authentification doit indiquer la **clé API** (et non « Claude Pro/Max »).

Modèle : le skill force automatiquement **Sonnet** pendant son exécution (bon rapport qualité/prix). Pour en faire ton modèle par défaut : `/model` → choisis Sonnet → Entrée.

⚠️ Avec une clé API, les connecteurs claude.ai (Pipedrive, Gmail, Miria…) **ne sont plus chargés** dans Claude Code : c'est normal, on les ajoute à l'étape 4.

## 4. Ajouter les connecteurs

Les connecteurs de claude.ai ne suivent pas une connexion par clé API : il faut les ajouter dans Claude Code. Dans le Terminal (hors de Claude Code) :

```bash
# Shannen / Miria (connexion par ton compte Miria)
claude mcp add --scope user --transport http Miria https://miria.ai/api/mcp

# Pipedrive (serveur officiel Pipedrive, connexion par ton compte Pipedrive)
claude mcp add --scope user --transport http Pipedrive https://mcp.pipedrive.ai/mcp

# Fireflies (serveur hébergé Fireflies, connexion par ton compte Fireflies)
claude mcp add --scope user --transport http Fireflies https://api.fireflies.ai/mcp
```

Puis lance `claude`, tape **`/mcp`**, et pour chaque serveur choisis **Authenticate** : une page s'ouvre dans ton navigateur → connecte-toi → autorise. Chaque serveur doit ensuite apparaître **connected**.

> Les noms `Miria`, `Pipedrive`, `Fireflies` doivent être écrits exactement ainsi : le skill y fait référence.

### Gmail et Google Agenda (optionnel)

Google exige de créer un « client OAuth » dans Google Cloud : c'est la seule étape un peu technique. Si tes mails sont déjà synchronisés dans Pipedrive (onglet E-mail du deal), **tu peux sauter cette partie** : le skill lira les mails via Pipedrive.

Sinon : voir la section « Annexe Google » en bas.

## 5. Installer le skill

```bash
mkdir -p ~/.claude/skills
cd ~/Downloads && unzip -o maj-deal-shannen.zip -d ~/.claude/skills/
ls ~/.claude/skills/maj-deal-shannen   # doit afficher SKILL.md et references/
```

## 6. Utilisation

```bash
claude
```

Puis écris simplement :

> mets à jour le deal Sundis avec Shannen — Marie a répondu hier que…

Le skill : collecte (Pipedrive, mails, Fireflies) → archive les nouveautés dans Pipedrive → interroge Shannen → **t'affiche le retour complet** → attend ton « ok » → met à jour Pipedrive.

Coût de la session : tape `/cost`. Facturation réelle : https://platform.claude.com/usage

---

## Dépannage

| Problème | Solution |
|---|---|
| `/status` affiche encore ton abonnement | `/logout`, quitte, vérifie `echo $ANTHROPIC_API_KEY`, relance `claude` |
| Un connecteur reste « failed » dans `/mcp` | Choisis **Authenticate** à nouveau ; sinon `claude mcp remove <Nom>` puis réajoute-le |
| Shannen ne répond pas (timeout) | Le skill réessaie une fois ; sinon relance la demande quelques minutes plus tard |
| Limite Miria atteinte | 100 questions/jour pour Shannen ; remise à zéro le lendemain |
| Le skill ne se déclenche pas | Tape `/maj-deal-shannen` suivi du nom du deal |

---

## Annexe Google (Gmail + Agenda)

1. https://console.cloud.google.com → crée un projet `orem-claude`.
2. **API et services → Bibliothèque** → active **Gmail API**, **Google Calendar API**, **Gmail MCP API** et **Calendar MCP API**.
3. **Écran de consentement OAuth** → type *Externe* → ajoute ton adresse en utilisateur test.
4. **Identifiants → Créer → ID client OAuth** → type *Application Web* → URI de redirection : `http://localhost:8765/callback` → copie l'**ID client** et le **secret**.
5. Envoie-moi un message quand tu as l'ID client : je te donne les deux commandes exactes à coller (l'ajout d'un serveur Google avec un client OAuth demande des options précises que je préfère vérifier avec toi au moment de le faire).
