#!/usr/bin/env node
/* Serveur MCP de l'espace client Orem : piloter les espaces depuis Claude Code, en langage naturel
   (« nouveau client Atelier Neuf, vouvoiement, site web, contact Marie… voici la proposition »).
   Sans dépendance, transport stdio. Il parle à l'API de l'espace avec un jeton personnel de l'équipe.
   Installation (une fois, depuis espace-client-orem/app) :
     node jeton.js prenom@agence-orem.fr            → jeton à ranger dans le coffre Notion
     claude mcp add orem-espace -e OREM_URL=http://localhost:3000 -e OREM_TOKEN=<jeton> -- node "$(pwd)/mcp.js"
   Rien n'est envoyé ailleurs qu'à OREM_URL. */
const fs = require('node:fs');
const path = require('node:path');

const BASE = String(process.env.OREM_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN = process.env.OREM_TOKEN || '';
const OFFERS = ['site', 'da', 'conseil', 'evolution'];

async function api(p, opts = {}) {
  if (!TOKEN) throw new Error('OREM_TOKEN manquant : créez un jeton avec « node jeton.js <e-mail> ».');
  const r = await fetch(BASE + p, { ...opts, headers: { authorization: 'Bearer ' + TOKEN, 'x-orem': '1', ...(opts.body && !opts.raw ? { 'content-type': 'application/json' } : {}), ...(opts.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error('Jeton refusé ou expiré : recréez-le avec « node jeton.js <e-mail> ».');
  if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`);
  return d;
}
const act = (id, a) => api(`/api/projects/${encodeURIComponent(id)}/action`, { method: 'POST', body: JSON.stringify(a) });
const project = async (id) => (await api('/api/projects/' + encodeURIComponent(id))).project;
async function findProject(ref) {
  const { projects } = await api('/api/projects');
  const n = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hit = projects.find((p) => p.id === ref) || projects.find((p) => n(p.client) === n(ref)) || projects.filter((p) => n(p.client).includes(n(ref)));
  if (Array.isArray(hit)) { if (hit.length === 1) return hit[0].id; throw new Error(hit.length ? `Plusieurs clients correspondent : ${hit.map((p) => p.client).join(', ')}` : `Aucun client « ${ref} ».`); }
  return hit.id;
}
const str = { type: 'string' }, num = { type: 'number' }, bool = { type: 'boolean' };
const client = { type: 'string', description: 'Nom du client ou identifiant de l’espace (p_…)' };

const TOOLS = [
  { name: 'lister_clients', description: 'Liste les espaces clients avec leur offre, le temps O.R.E.M. en cours et ce qui attend.', inputSchema: { type: 'object', properties: {} },
    run: async () => (await api('/api/projects')).projects },
  { name: 'voir_client', description: 'Détail d’un espace : étapes, validations, fichiers attendus, factures, messages récents, priorités « Bien démarrer ».', inputSchema: { type: 'object', properties: { client }, required: ['client'] },
    run: async ({ client: c }) => { const p = await project(await findProject(c)); return { id: p.id, client: p.client, projet: p.projet, offre: p.offer, registre: p.registre, temps: p.phase, prochaineEtape: p.next, aFaire: p.tasks, fichiersAttendus: p.missing, validations: p.validations.map((v) => ({ id: v.id, t: v.t, statut: v.status })), factures: p.invoices, propositions: (p.proposals || []).map((x) => ({ id: x.id, titre: x.title, statut: x.status })), messages: p.messages.slice(0, 5).map((m) => ({ at: m.at, text: m.text })) }; } },
  { name: 'creer_client', description: 'Crée un espace client. Le registre (tu ou vous) est obligatoire et ne se devine jamais : demandez-le s’il n’est pas donné. Avec un e-mail, le client reçoit son invitation.',
    inputSchema: { type: 'object', properties: { client: { type: 'string', description: 'Nom de l’entreprise' }, projet: { type: 'string', description: 'Intitulé du projet, ex. « Refonte atelier-neuf.fr »' }, offre: { type: 'string', enum: OFFERS }, registre: { type: 'string', enum: ['tu', 'vous'] }, contact: { type: 'string', description: 'Prénom du contact' }, email: { type: 'string', description: 'E-mail du contact (facultatif : sans e-mail, aucune invitation)' }, debut: { type: 'string', description: 'Date de démarrage AAAA-MM-JJ' }, montantHT: num }, required: ['client', 'offre', 'registre'] },
    run: async (a) => api('/api/projects', { method: 'POST', body: JSON.stringify({ client: a.client, projet: a.projet || a.client, offer: a.offre, registre: a.registre, contactName: a.contact, email: a.email, start: a.debut, amountHT: a.montantHT }) }) },
  { name: 'proposition', description: 'Prépare (et envoie si envoyer=true) une proposition commerciale que le client accepte en ligne. Lignes en euros HT.',
    inputSchema: { type: 'object', properties: { client, titre: str, intro: str, lignes: { type: 'array', items: { type: 'object', properties: { t: str, ht: num }, required: ['t', 'ht'] } }, acomptePct: num, valableJusquau: str, devis: { type: 'string', description: 'Numéro du devis' }, envoyer: bool }, required: ['client', 'titre', 'lignes'] },
    run: async (a) => { const id = await findProject(a.client); const r = await act(id, { type: 'proposal.save', title: a.titre, intro: a.intro, lines: a.lignes, depositPct: a.acomptePct, validUntil: a.valableJusquau, quote: a.devis }); if (a.envoyer) await act(id, { type: 'proposal.send', prid: r.prid }); return { ok: true, proposition: r.prid, envoyee: !!a.envoyer }; } },
  { name: 'deposer_fichier', description: 'Dépose un fichier local dans l’espace du client (proposition PDF, livrable, devis…). Catégories : Livrable, Devis, Facture, Contrat, Bibliothèque, Documents.',
    inputSchema: { type: 'object', properties: { client, chemin: { type: 'string', description: 'Chemin du fichier sur cet ordinateur' }, categorie: str }, required: ['client', 'chemin'] },
    run: async (a) => { const id = await findProject(a.client), f = path.resolve(a.chemin); const buf = fs.readFileSync(f);
      return api(`/api/projects/${id}/files?name=${encodeURIComponent(path.basename(f))}&cat=${encodeURIComponent(a.categorie || 'Livrable')}`, { method: 'POST', raw: true, body: buf, headers: { 'content-type': 'application/octet-stream' } }); } },
  { name: 'message', description: 'Écrit au client dans son espace (avec une vidéo Loom facultative). Le registre du client doit être respecté dans le texte.',
    inputSchema: { type: 'object', properties: { client, texte: str, loom: { type: 'string', description: 'Lien https://www.loom.com/share/…' }, titreVideo: str, auNomDeLEquipe: bool }, required: ['client', 'texte'] },
    run: async (a) => act(await findProject(a.client), { type: 'msg.post', text: a.texte, asTeam: a.auNomDeLEquipe !== false, loom: a.loom ? { url: a.loom, title: a.titreVideo || 'Vidéo' } : undefined }) },
  { name: 'prochaine_etape', description: 'Fixe la prochaine étape affichée en grand sur l’accueil du client.',
    inputSchema: { type: 'object', properties: { client, titre: str, texte: str, bouton: { type: 'string', enum: ['accueil', 'cal', 'valider', 'fichiers', 'projet', 'documents', 'equipe'] } }, required: ['client', 'titre'] },
    run: async (a) => act(await findProject(a.client), { type: 'next.set', title: a.titre, text: a.texte || '', go: a.bouton || 'accueil' }) },
  { name: 'liens', description: 'Enregistre les liens du projet : Figma, prototype, site en préparation, site actuel.',
    inputSchema: { type: 'object', properties: { client, figma: str, prototype: str, preparation: str, ancienSite: str }, required: ['client'] },
    run: async (a) => act(await findProject(a.client), { type: 'links.set', figma: a.figma, proto: a.prototype, preview: a.preparation, old: a.ancienSite }) },
  { name: 'fichier_attendu', description: 'Ajoute un fichier que le client doit déposer (relancé tout seul après 5 jours ouvrés).',
    inputSchema: { type: 'object', properties: { client, quoi: str, precision: str }, required: ['client', 'quoi'] },
    run: async (a) => act(await findProject(a.client), { type: 'missing.add', t: a.quoi, sub: a.precision || '' }) },
  { name: 'temps', description: 'Passe le projet au temps O.R.E.M. donné (1 Orienter, 2 Représenter, 3 Exécuter, 4 Mesurer).',
    inputSchema: { type: 'object', properties: { client, numero: num }, required: ['client', 'numero'] },
    run: async (a) => act(await findProject(a.client), { type: 'phase.set', n: a.numero }) },
  { name: 'inviter', description: 'Donne accès à l’espace à une personne de plus chez le client (elle reçoit l’invitation).',
    inputSchema: { type: 'object', properties: { client, email: str, prenom: str }, required: ['client', 'email'] },
    run: async (a) => act(await findProject(a.client), { type: 'user.add', email: a.email, name: a.prenom }) },
  { name: 'action', description: 'Toute autre action de l’espace, au format de l’API (type + champs), pour ce que les autres outils ne couvrent pas.',
    inputSchema: { type: 'object', properties: { client, action: { type: 'object', description: 'ex. { "type": "val.request", "vid": "…" }' } }, required: ['client', 'action'] },
    run: async (a) => act(await findProject(a.client), a.action) }
];

/* ---------- Protocole MCP (JSON-RPC 2.0 sur stdin/stdout, une ligne par message) ---------- */
const out = (m) => process.stdout.write(JSON.stringify(m) + '\n');
async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') return out({ jsonrpc: '2.0', id, result: { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'orem-espace', version: '1.0.0' },
    instructions: 'Espace client de l’agence Orem. Registre tu ou vous choisi par client, jamais deviné : le demander s’il manque. Écrire en français, sans tiret long, avec « » et une espace avant : ; ! ?. Dire « agence », jamais « studio ». Ne jamais écrire le mot « suivi ».' } });
  if (method === 'tools/list') return out({ jsonrpc: '2.0', id, result: { tools: TOOLS.map(({ run, ...t }) => t) } });
  if (method === 'tools/call') {
    const t = TOOLS.find((x) => x.name === (params && params.name));
    if (!t) return out({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Outil inconnu' } });
    try { const r = await t.run((params && params.arguments) || {}); return out({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] } }); }
    catch (e) { return out({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: e.message }] } }); }
  }
  if (method === 'ping') return out({ jsonrpc: '2.0', id, result: {} });
  if (id !== undefined) out({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Méthode inconnue' } });
}
let buf = '';
process.stdin.on('data', (c) => { buf += c; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line) { let m; try { m = JSON.parse(line); } catch { continue; } handle(m); } } });
