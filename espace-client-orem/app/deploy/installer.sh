#!/usr/bin/env bash
# Installe (ou met à jour) la VERSION DE TEST de l'espace client Orem sur le VPS.
# À lancer en root sur le VPS :  bash installer.sh
# Ce que fait le script, dans l'ordre :
#   1. vérifie Node.js 20 ou plus (propose l'installation de Node 22 sinon) ;
#   2. récupère le code (branche de travail du dépôt GitHub) dans /opt/espace-orem ;
#   3. crée la configuration /etc/espace-orem.env (droits 600) en reprenant les clés déjà présentes sur le VPS ;
#   4. crée le service systemd « espace-orem » (redémarre tout seul) ;
#   5. branche l'adresse https://espace.agence-orem.fr (Caddy ou Nginx + Let's Encrypt) ;
#   6. vérifie que tout répond.
# Rien n'est supprimé : les données (comptes, fichiers déposés) restent dans /var/lib/espace-orem.
set -euo pipefail

DOMAIN="${DOMAIN:-espace.agence-orem.fr}"
BRANCH="${BRANCH:-claude/blissful-pasteur-u33w5x}"
REPO="${REPO:-github.com/iconokom-source/claude-code}"
APP_DIR=/opt/espace-orem
DATA_DIR=/var/lib/espace-orem
ENV_FILE=/etc/espace-orem.env
KEYS_FILE="${KEYS_FILE:-/root/pipeline/automatisation/.env}"   # clés déjà présentes sur le VPS
PORT="${PORT:-3100}"

say() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die() { printf '\n\033[31m✘ %s\033[0m\n' "$*"; exit 1; }
[ "$(id -u)" = 0 ] || die "Lancez ce script en root (sudo bash installer.sh)."

say "1. Node.js"
if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ]; then ok "Node $(node -v)";
else
  warn "Node.js 20 ou plus est nécessaire (actuel : $(node -v 2>/dev/null || echo absent))."
  read -r -p "  Installer Node.js 22 (dépôt officiel NodeSource) ? [o/N] " a; [ "$a" = o ] || die "Installation arrêtée."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs
fi

say "2. Code de l'application ($BRANCH)"
id espace-orem >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin espace-orem
mkdir -p "$DATA_DIR" && chown espace-orem: "$DATA_DIR" && chmod 750 "$DATA_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch -q origin "$BRANCH" && git -C "$APP_DIR" checkout -q -B "$BRANCH" "origin/$BRANCH" && ok "Code mis à jour ($(git -C "$APP_DIR" log -1 --format=%h))"
else
  if [ -z "${GITHUB_TOKEN:-}" ]; then read -r -s -p "  Jeton GitHub en lecture seule pour iconokom-source/claude-code (voir le guide, étape 3) : " GITHUB_TOKEN; echo; fi
  git clone -q --depth 50 --branch "$BRANCH" --filter=blob:none --sparse "https://x-access-token:${GITHUB_TOKEN}@${REPO}.git" "$APP_DIR"
  git -C "$APP_DIR" sparse-checkout set espace-client-orem/app
  git -C "$APP_DIR" remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@${REPO}.git"
  chmod 700 "$APP_DIR/.git"
  ok "Code récupéré ($(git -C "$APP_DIR" log -1 --format=%h))"
fi
APP="$APP_DIR/espace-client-orem/app"

say "3. Configuration ($ENV_FILE)"
key() { [ -f "$KEYS_FILE" ] && grep -E "^$1=" "$KEYS_FILE" | tail -1 | cut -d= -f2- | sed 's/^"//; s/"$//' || true; }
if [ ! -f "$ENV_FILE" ]; then
  umask 077
  {
    echo "# Espace client Orem : version de test. Fichier secret (droits 600), jamais dans git."
    echo "PORT=$PORT"
    echo "HOST=127.0.0.1"
    echo "BASE_URL=https://$DOMAIN"
    echo "TRUST_PROXY=1"
    echo "DATA_DIR=$DATA_DIR"
    echo "VAULT_KEY=$(openssl rand -hex 32)"
    echo
    echo "# Version de test : bandeau visible, e-mails envoyés seulement aux adresses ci-dessous (domaines ou adresses, séparés par des virgules)."
    echo "TEST_MODE=1"
    echo "MAIL_ALLOW=agence-orem.fr"
    echo
    echo "# E-mails : contact@ pour le générique, l'adresse de chacun pour ce qu'il envoie en son nom."
    echo "MAIL_ENABLED=1"
    echo "MAIL_FROM=contact@agence-orem.fr"
    echo "MAIL_FROM_NAME=Orem"
    echo "MAIL_PERSONAL=1"
    echo "# Choix 1 (recommandé) : Brevo, domaine agence-orem.fr authentifié (SPF, DKIM)."
    echo "MAIL_PROVIDER=brevo"
    echo "BREVO_API_KEY=$(key BREVO_API_KEY_OREM)"
    echo "# Choix 2 : SMTP Google Workspace (mettre MAIL_PROVIDER=smtp). Compte contact@ avec mot de passe d'application ;"
    echo "# les adresses louis@, theophile@, clement@ doivent être ajoutées en « Envoyer en tant que » sur ce compte."
    echo "SMTP_HOST=smtp.gmail.com"
    echo "SMTP_PORT=587"
    echo "SMTP_USER="
    echo "SMTP_PASSWORD="
    echo
    echo "# Connecteurs (lecture seule pour Abby et Qonto ; Pipedrive prépare un espace quand une affaire est gagnée)."
    echo "PIPEDRIVE_API_KEY=$(key PIPEDRIVE_API_KEY)"
    echo "PIPEDRIVE_WEBHOOK_SECRET=$(openssl rand -hex 16)"
    echo "ABBY_API_KEY=$(key ABBY_API_KEY)"
    echo "QONTO_LOGIN=$(key QONTO_LOGIN)"
    echo "QONTO_SECRET_KEY=$(key QONTO_SECRET_KEY)"
    echo "FIGMA_TOKEN=$(key FIGMA_API_KEY)"
    echo "ANTHROPIC_API_KEY=$(key ANTHROPIC_API_KEY)"
    echo "GOOGLE_SERVICE_ACCOUNT_JSON="
  } > "$ENV_FILE"
  chown root:espace-orem "$ENV_FILE"; chmod 640 "$ENV_FILE"
  ok "Configuration créée (clés reprises de $KEYS_FILE quand elles existent)"
else ok "Configuration existante conservée"; fi
for k in BREVO_API_KEY PIPEDRIVE_API_KEY ABBY_API_KEY QONTO_LOGIN FIGMA_TOKEN ANTHROPIC_API_KEY; do
  v=$(grep -E "^$k=" "$ENV_FILE" | cut -d= -f2- || true); [ -n "$v" ] && ok "$k présent" || warn "$k vide : à compléter dans $ENV_FILE si besoin"
done
if ! grep -qE '^BREVO_API_KEY=.+' "$ENV_FILE" && ! grep -qE '^SMTP_PASSWORD=.+' "$ENV_FILE"; then
  warn "Aucun service d'envoi : l'espace ne démarrera pas en ligne sans e-mails (les codes de connexion partent par e-mail)."
  die "Complétez BREVO_API_KEY (ou MAIL_PROVIDER=smtp avec SMTP_USER et SMTP_PASSWORD) dans $ENV_FILE, puis relancez : bash $APP/deploy/installer.sh"
fi

say "4. Service systemd « espace-orem »"
cat > /etc/systemd/system/espace-orem.service <<UNIT
[Unit]
Description=Espace client Orem (version de test)
After=network-online.target
Wants=network-online.target

[Service]
User=espace-orem
Group=espace-orem
WorkingDirectory=$APP
EnvironmentFile=$ENV_FILE
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable -q espace-orem
systemctl restart espace-orem
sleep 2
if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null; then ok "Le service répond sur le port $PORT";
else journalctl -u espace-orem -n 20 --no-pager; die "Le service ne démarre pas : voir le journal ci-dessus."; fi

say "5. Adresse https://$DOMAIN"
IP=$(curl -fsS https://api.ipify.org || true)
DNS=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)
[ -n "$DNS" ] && [ "$DNS" = "$IP" ] && ok "$DOMAIN pointe bien vers ce serveur ($IP)" || warn "$DOMAIN pointe vers « ${DNS:-rien} » au lieu de $IP : créez l'enregistrement DNS (guide, étape 1), puis relancez ce script."
if command -v caddy >/dev/null; then
  CF=/etc/caddy/Caddyfile
  if ! grep -q "^$DOMAIN" "$CF" 2>/dev/null; then
    printf '\n%s {\n\tencode gzip\n\trequest_body {\n\t\tmax_size 100MB\n\t}\n\treverse_proxy 127.0.0.1:%s\n}\n' "$DOMAIN" "$PORT" >> "$CF"
  fi
  systemctl reload caddy && ok "Caddy : $DOMAIN branché (certificat HTTPS automatique)"
elif command -v nginx >/dev/null; then
  cat > /etc/nginx/sites-available/espace-orem <<NGINX
server {
  listen 80;
  server_name $DOMAIN;
  client_max_body_size 100m;           # un morceau d'envoi fait 64 Mo au plus ; les gros fichiers partent par morceaux
  proxy_request_buffering off;
  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
  }
}
NGINX
  ln -sf /etc/nginx/sites-available/espace-orem /etc/nginx/sites-enabled/espace-orem
  nginx -t && systemctl reload nginx && ok "Nginx : $DOMAIN branché"
  if command -v certbot >/dev/null; then certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m contact@agence-orem.fr --redirect && ok "Certificat HTTPS installé";
  else warn "certbot absent : apt-get install -y certbot python3-certbot-nginx, puis relancez ce script."; fi
else
  warn "Ni Caddy ni Nginx : installation de Caddy (serveur web avec HTTPS automatique)."
  read -r -p "  Installer Caddy ? [o/N] " a; [ "$a" = o ] || die "Installation arrêtée avant l'HTTPS."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -y caddy
  exec bash "$0"
fi

say "6. Vérification"
sleep 2
if curl -fsS "https://$DOMAIN/api/health" | grep -q '"ok":true'; then ok "https://$DOMAIN répond"; else warn "https://$DOMAIN ne répond pas encore (DNS ou certificat en cours) : réessayez dans quelques minutes."; fi
echo
echo "  Espace de test : https://$DOMAIN"
echo "  Journal :        journalctl -u espace-orem -f"
echo "  Configuration :  $ENV_FILE (puis : systemctl restart espace-orem)"
echo "  Mise à jour :    bash $APP/deploy/installer.sh"
echo "  Webhook Pipedrive : https://$DOMAIN/api/hooks/pipedrive (identifiant « orem », mot de passe = PIPEDRIVE_WEBHOOK_SECRET)"
