/* Crée le serveur de la VERSION DE TEST chez Hetzner Cloud, sans terminal : tout s'installe au premier démarrage (cloud-init).
   Usage : HCLOUD_TOKEN=… GITHUB_TOKEN=… SECRETS_FILE=fichier.env node deploy/hetzner-creer.js [--dry]
   SECRETS_FILE : lignes CLE=valeur (BREVO_API_KEY, PIPEDRIVE_API_KEY, ABBY_API_KEY, FIGMA_TOKEN, ANTHROPIC_API_KEY…), jamais dans git.
   Le serveur :
   - installe Node.js 22, Caddy (HTTPS automatique), l'application (branche de travail, dossier espace-client-orem/app) ;
   - écrit /etc/espace-orem.env (droits 640), lance le service systemd « espace-orem » ;
   - vérifie toutes les 3 minutes s'il y a du nouveau code sur la branche et redémarre l'application si besoin ;
   - n'ouvre que les ports 80 et 443 (pare-feu Hetzner « espace-orem-web » ; pas de SSH). */
const fs = require('fs'), crypto = require('crypto');
const NAME = process.env.NAME || 'espace-orem-test', TYPE = process.env.TYPE || 'cx23', LOC = process.env.LOCATION || 'nbg1';
const DOMAIN = process.env.DOMAIN || 'espace.agence-orem.fr', BRANCH = process.env.BRANCH || 'claude/blissful-pasteur-u33w5x';
const REPO = 'github.com/iconokom-source/claude-code', PORT = 3100;
const dry = process.argv.includes('--dry');
const need = (k) => { if (!process.env[k]) { console.error(`Il manque ${k}.`); process.exit(1); } return process.env[k]; };
const HC = dry ? '' : need('HCLOUD_TOKEN'), GH = need('GITHUB_TOKEN');
const secrets = fs.readFileSync(need('SECRETS_FILE'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => /^[A-Z_][A-Z0-9_]*=/.test(l));

const env = [
  '# Espace client Orem : version de test. Fichier secret (droits 640), jamais dans git.',
  `PORT=${PORT}`, 'HOST=127.0.0.1', `BASE_URL=https://${DOMAIN}`, 'TRUST_PROXY=1', 'DATA_DIR=/var/lib/espace-orem',
  `VAULT_KEY=${crypto.randomBytes(32).toString('hex')}`,
  'TEST_MODE=1', 'MAIL_ALLOW=agence-orem.fr',
  'MAIL_ENABLED=1', 'MAIL_PROVIDER=brevo', 'MAIL_FROM=contact@agence-orem.fr', 'MAIL_FROM_NAME=Orem', 'MAIL_PERSONAL=1',
  `PIPEDRIVE_WEBHOOK_SECRET=${crypto.randomBytes(16).toString('hex')}`,
  ...secrets
].join('\n') + '\n';

const update = `#!/bin/bash
# Mise à jour automatique : nouveau code sur la branche → installation et redémarrage.
set -e
cd /opt/espace-orem
git fetch -q origin '${BRANCH}' || exit 0
if [ "$(git rev-parse HEAD)" != "$(git rev-parse FETCH_HEAD)" ]; then
  git reset -q --hard FETCH_HEAD
  cd espace-client-orem/app && npm install --omit=dev --no-audit --no-fund --loglevel=error || true
  systemctl restart espace-orem
  logger -t espace-maj "mise à jour : $(git rev-parse --short HEAD)"
fi
`;
const caddy = `${DOMAIN} {
\tencode gzip
\trequest_body {
\t\tmax_size 100MB
\t}
\treverse_proxy 127.0.0.1:${PORT} {
\t\ttransport http {
\t\t\tread_timeout 2h
\t\t\twrite_timeout 2h
\t\t}
\t}
}
# Par l'adresse IP : seulement l'état du service, le reste renvoie vers l'adresse officielle.
http:// {
\thandle /api/health {
\t\treverse_proxy 127.0.0.1:${PORT}
\t}
\thandle {
\t\tredir https://${DOMAIN}{uri}
\t}
}
`;
const unit = `[Unit]
Description=Espace client Orem (version de test)
After=network-online.target
Wants=network-online.target
[Service]
User=espace-orem
Group=espace-orem
WorkingDirectory=/opt/espace-orem/espace-client-orem/app
EnvironmentFile=/etc/espace-orem.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/espace-orem
[Install]
WantedBy=multi-user.target
`;
const timer = `[Unit]
Description=Mise à jour automatique de l'espace client
[Timer]
OnBootSec=2min
OnUnitActiveSec=3min
[Install]
WantedBy=timers.target
`;
const svcMaj = `[Unit]
Description=Mise à jour automatique de l'espace client
[Service]
Type=oneshot
ExecStart=/usr/local/bin/espace-maj
`;
const file = (path, content, perm) => `  - path: ${path}\n    permissions: '${perm}'\n    encoding: b64\n    content: ${Buffer.from(content).toString('base64')}\n`;
const userData = `#cloud-config
package_update: true
packages: [git, curl, gnupg, debian-keyring, debian-archive-keyring, apt-transport-https]
write_files:
${file('/etc/espace-orem.env', env, '0640')}${file('/usr/local/bin/espace-maj', update, '0755')}${file('/root/Caddyfile', caddy, '0644')}${file('/etc/systemd/system/espace-orem.service', unit, '0644')}${file('/etc/systemd/system/espace-maj.service', svcMaj, '0644')}${file('/etc/systemd/system/espace-maj.timer', timer, '0644')}runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  - apt-get install -y nodejs
  - curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  - curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  - apt-get update -q && apt-get install -y caddy
  - useradd --system --home /var/lib/espace-orem --shell /usr/sbin/nologin espace-orem
  - mkdir -p /var/lib/espace-orem && chown espace-orem:espace-orem /var/lib/espace-orem && chmod 750 /var/lib/espace-orem
  - chown root:espace-orem /etc/espace-orem.env
  - git clone -q --depth 50 --branch '${BRANCH}' --filter=blob:none --sparse 'https://x-access-token:${GH}@${REPO}.git' /opt/espace-orem
  - git -C /opt/espace-orem sparse-checkout set espace-client-orem/app
  - chmod 700 /opt/espace-orem/.git
  - cd /opt/espace-orem/espace-client-orem/app && npm install --omit=dev --no-audit --no-fund --loglevel=error || true
  - cp /root/Caddyfile /etc/caddy/Caddyfile
  - systemctl daemon-reload
  - systemctl enable --now espace-orem espace-maj.timer
  - systemctl restart caddy
`;
if (Buffer.byteLength(userData) > 32 * 1024) { console.error('Configuration trop longue pour Hetzner (32 Ko).'); process.exit(1); }
if (dry) { console.log(userData.replace(/content: [A-Za-z0-9+/=]+/g, 'content: (masqué)').replace(/x-access-token:[^@]+@/, 'x-access-token:(masqué)@')); process.exit(0); }

const api = async (method, path, body) => {
  const r = await fetch('https://api.hetzner.cloud/v1' + path, { method, headers: { Authorization: 'Bearer ' + HC, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} : HTTP ${r.status} ${(d.error && d.error.message) || ''}`);
  return d;
};
(async () => {
  const existing = (await api('GET', '/servers?name=' + NAME)).servers;
  if (existing.length) { console.log(`Le serveur ${NAME} existe déjà : ${existing[0].public_net.ipv4.ip}`); return; }
  let fw = (await api('GET', '/firewalls?name=espace-orem-web')).firewalls[0];
  if (!fw) fw = (await api('POST', '/firewalls', { name: 'espace-orem-web', rules: [80, 443].map((p) => ({ direction: 'in', protocol: 'tcp', port: String(p), source_ips: ['0.0.0.0/0', '::/0'] })) })).firewall;
  const r = await api('POST', '/servers', { name: NAME, server_type: TYPE, location: LOC, image: 'ubuntu-24.04', user_data: userData, firewalls: [{ firewall: fw.id }], labels: { app: 'espace-orem', env: 'test' }, public_net: { enable_ipv4: true, enable_ipv6: true } });
  console.log(`Serveur ${NAME} créé (${TYPE}, ${LOC}) : IPv4 ${r.server.public_net.ipv4.ip}`);
  console.log('Installation automatique en cours (5 à 10 minutes).');
})().catch((e) => { console.error('Échec : ' + e.message); process.exit(1); });
