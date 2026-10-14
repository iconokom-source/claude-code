/* Connecteurs vers les outils de l'agence (Pipedrive, Abby, Qonto, Google, IA).
   Chaque connecteur ne s'active que si sa clé est fournie en variable d'environnement.
   Aucune clé n'est écrite dans le dépôt : elles sont dans le coffre Notion de Louis. */
const CONNECTORS = {
  pipedrive: { label: 'Pipedrive', env: ['PIPEDRIVE_API_KEY', 'PIPEDRIVE_WEBHOOK_SECRET'], does: 'Deal gagné : création automatique de l’espace client' },
  abby: { label: 'Abby', env: ['ABBY_API_KEY'], does: 'Import du devis signé et des factures, avec leur PDF' },
  qonto: { label: 'Qonto', env: ['QONTO_LOGIN', 'QONTO_SECRET_KEY'], does: 'Virements reçus : factures passées en « Payée » automatiquement' },
  google: { label: 'Google Analytics et Search Console', env: ['GOOGLE_SERVICE_ACCOUNT_JSON'], does: 'Chiffres du site mis à jour chaque mois' },
  claude: { label: 'Assistant (API Claude)', env: ['ANTHROPIC_API_KEY'], does: 'Réponses aux questions des clients, à partir de leur projet' }
};
const configured = (name, env) => CONNECTORS[name].env.every((k) => !!env[k]);

function status(env) {
  return { connectors: Object.entries(CONNECTORS).map(([id, c]) => ({ id, label: c.label, does: c.does, configured: configured(id, env), missing: c.env.filter((k) => !env[k]) })) };
}

function webhook(source, body, headers, db, env) {
  if (!CONNECTORS[source]) return { status: 404, error: 'Source inconnue.' };
  if (!configured(source, env)) return { status: 503, error: 'Connecteur non configuré.' };
  return { status: 501, error: 'Connecteur pas encore disponible.' };
}

async function sync(name, db, env) {
  if (!CONNECTORS[name]) return { error: 'Connecteur inconnu.' };
  if (!configured(name, env)) return { error: `Connecteur non configuré : ajoutez ${CONNECTORS[name].env.join(', ')} au lancement du serveur.` };
  return { error: 'Connecteur pas encore disponible.' };
}

async function ask(project, user, question) {
  return { answer: null, fallback: true };
}

module.exports = { CONNECTORS, status, webhook, sync, ask };
