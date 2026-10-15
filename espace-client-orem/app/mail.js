/* Envoi des e-mails : Brevo (API) ou SMTP (Google Workspace, Gmail…), sans dépendance.
   Deux expéditeurs :
   - générique (MAIL_FROM, par défaut contact@agence-orem.fr) : codes de connexion, récaps, relances ;
   - personnel (louis@, theophile@, clement@agence-orem.fr) : ce qu'un membre de l'équipe envoie en son nom
     (invitation, message, vidéo, validation demandée). La réponse du client lui revient directement.
   Version de test (TEST_MODE=1) : les e-mails ne partent qu'aux adresses de MAIL_ALLOW (par défaut le domaine
   agence-orem.fr) ; les autres restent dans « E-mails envoyés », marqués « non envoyé (version de test) ». */
const net = require('node:net');
const tls = require('node:tls');
const crypto = require('node:crypto');

function config(env) {
  const provider = (env.MAIL_PROVIDER || (env.BREVO_API_KEY ? 'brevo' : env.SMTP_HOST ? 'smtp' : '')).toLowerCase();
  const ready = provider === 'brevo' ? !!env.BREVO_API_KEY : provider === 'smtp' ? !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) : false;
  const from = (env.MAIL_FROM || 'contact@agence-orem.fr').toLowerCase();
  const test = env.TEST_MODE === '1';
  const allow = String(env.MAIL_ALLOW || (test ? from.split('@')[1] : '')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return { provider, enabled: env.MAIL_ENABLED === '1' && ready, from, fromName: env.MAIL_FROM_NAME || 'Orem', personal: env.MAIL_PERSONAL !== '0', test, allow };
}
const allowed = (cfg, to) => { const t = String(to || '').toLowerCase(); return !cfg.allow.length || cfg.allow.some((a) => (a.includes('@') ? t === a : t.endsWith('@' + a))); };
/* Expéditeur retenu : l'adresse personnelle seulement si elle est du même domaine que l'adresse générique (authentifiée). */
function sender(cfg, from) {
  const dom = cfg.from.split('@')[1];
  if (cfg.personal && from && from.email && String(from.email).toLowerCase().endsWith('@' + dom)) return { email: String(from.email).toLowerCase(), name: from.name || cfg.fromName };
  return { email: cfg.from, name: cfg.fromName };
}

/* ---------- Brevo ---------- */
async function viaBrevo(env, m, from) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: from, replyTo: from, to: [{ email: m.to, name: m.name || undefined }], subject: m.subject, htmlContent: m.html, textContent: m.text || undefined }) });
  if (!r.ok) { let d = ''; try { d = (await r.json()).message || ''; } catch {} throw new Error(`Brevo a refusé l’envoi (HTTP ${r.status}${d ? ' : ' + d : ''}).`); }
}

/* ---------- SMTP (STARTTLS sur 587, TLS direct sur 465) ---------- */
const b64 = (s) => Buffer.from(String(s), 'utf8').toString('base64');
const word = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
const wrap = (s) => s.replace(/.{1,76}/g, '$&\r\n');
function mime(m, from) {
  const id = crypto.randomBytes(12).toString('hex'), dom = from.email.split('@')[1], bd = 'orem-' + id;
  const head = [`From: ${word(from.name)} <${from.email}>`, `Reply-To: ${from.email}`, `To: ${m.name ? word(m.name) + ' ' : ''}<${m.to}>`, `Subject: ${word(m.subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`, `Message-ID: <${id}@${dom}>`, 'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${bd}"`];
  const part = (type, body) => [`--${bd}`, `Content-Type: ${type}; charset=UTF-8`, 'Content-Transfer-Encoding: base64', '', wrap(b64(body))].join('\r\n');
  return [...head, '', part('text/plain', m.text || m.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()), part('text/html', m.html), `--${bd}--`, ''].join('\r\n');
}
function viaSmtp(env, m, from) {
  const host = env.SMTP_HOST, port = Number(env.SMTP_PORT || 587), implicit = port === 465;
  return new Promise((resolve, reject) => {
    let sock = implicit ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    let buf = '', waiting = null; const timer = setTimeout(() => fail(new Error('Le serveur SMTP ne répond pas.')), 30000);
    const fail = (e) => { clearTimeout(timer); try { sock.destroy(); } catch {} reject(e); };
    const onData = (d) => { buf += d.toString('utf8'); const lines = buf.split('\r\n'); const last = lines.length > 1 ? lines[lines.length - 2] : ''; if (/^\d{3} /.test(last) && waiting) { const w = waiting; waiting = null; const txt = buf; buf = ''; w(txt); } };
    const read = () => new Promise((ok) => { waiting = ok; });
    const cmd = async (line, expect) => { if (line !== null) sock.write(line + '\r\n'); const r = await read(); if (!r.startsWith(String(expect))) throw new Error('SMTP : ' + r.trim().split('\r\n').pop()); return r; };
    sock.on('data', onData); sock.on('error', fail);
    (async () => {
      await cmd(null, 220);
      await cmd('EHLO orem-espace', 250);
      if (!implicit) {
        await cmd('STARTTLS', 220);
        sock.removeListener('data', onData);
        sock = tls.connect({ socket: sock, servername: host }); sock.on('data', onData); sock.on('error', fail);
        await new Promise((ok, ko) => { sock.once('secureConnect', ok); sock.once('error', ko); });
        await cmd('EHLO orem-espace', 250);
      }
      await cmd('AUTH PLAIN ' + b64('\0' + env.SMTP_USER + '\0' + env.SMTP_PASSWORD), 235);
      await cmd(`MAIL FROM:<${env.SMTP_USER}>`, 250);
      await cmd(`RCPT TO:<${m.to}>`, 250);
      await cmd('DATA', 354);
      await cmd(mime(m, from).replace(/\r\n\./g, '\r\n..') + '\r\n.', 250);
      sock.write('QUIT\r\n'); clearTimeout(timer); sock.end(); resolve();
    })().catch(fail);
  });
}

/* Envoie un e-mail ; renvoie { sent, blocked, from, error }. Ne lève jamais. */
async function send(env, m) {
  const cfg = config(env), from = sender(cfg, m.from);
  if (!cfg.enabled) return { sent: false, from, error: 'Envoi désactivé (local).' };
  if (!allowed(cfg, m.to)) return { sent: false, blocked: true, from, error: 'Non envoyé : version de test, adresse hors de la liste autorisée.' };
  try { await (cfg.provider === 'smtp' ? viaSmtp : viaBrevo)(env, m, from); return { sent: true, from }; }
  catch (e) { return { sent: false, from, error: e.message }; }
}
/* Vérifie que le compte d'envoi répond, sans rien envoyer. */
async function check(env) {
  const cfg = config(env);
  if (!cfg.provider) return { ok: false, message: 'Aucun service d’envoi configuré (BREVO_API_KEY, ou SMTP_HOST, SMTP_USER et SMTP_PASSWORD).' };
  if (cfg.provider === 'brevo') {
    try { const r = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': env.BREVO_API_KEY || '', accept: 'application/json' } }); if (!r.ok) return { ok: false, message: `Brevo refuse la clé (HTTP ${r.status}).` }; const d = await r.json(); return { ok: true, message: `Brevo : compte « ${d.companyName || d.email || 'Orem'} »` }; }
    catch (e) { return { ok: false, message: 'Brevo injoignable : ' + e.message }; }
  }
  return { ok: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD), message: `SMTP ${env.SMTP_HOST || '?'}:${env.SMTP_PORT || 587} avec ${env.SMTP_USER || '?'} (vérifié au premier envoi)` };
}
function describe(env) {
  const c = config(env);
  return { provider: c.provider || null, enabled: c.enabled, from: c.from, personal: c.personal, test: c.test, allow: c.allow };
}
module.exports = { config, send, check, describe, sender, allowed, mime };
