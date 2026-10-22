// ============================================================================
// Boîte à outils Orem pour use_figma : à coller EN TÊTE de chaque script.
// Remplacer __ROOT_ID__ par l'ID de la frame de la nouvelle page (renvoyé par
// l'étape « Créer la frame »). Toutes les valeurs viennent du fichier Figma
// Orem (aVKI9kfuXoWvQsiRsajLXD), onglet Site : ne pas les inventer.
// Validé en production sur /secteurs/hotellerie (nœud 3815:1702).
// ============================================================================
const SITE_PAGE_ID = '2028:1326';
const ROOT_ID = '__ROOT_ID__';
const sitePage = await figma.getNodeByIdAsync(SITE_PAGE_ID);
await figma.setCurrentPageAsync(sitePage);
const ROOT = ROOT_ID.startsWith('__') ? null : await figma.getNodeByIdAsync(ROOT_ID);

// Garde-fou : refuser toute écriture hors de la nouvelle page.
function assertInRoot(node) {
  let p = node;
  while (p && p.id !== ROOT_ID) p = p.parent;
  if (!p) throw new Error('Refus : ' + node.id + ' est hors de la nouvelle page');
}

// --- Couleurs (collection « Couleurs » du fichier) ---------------------------
const hex = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const COL = {
  ink: '#000012',    // typography/primary, aussi fond des sections « nuit »
  grey: '#434242',   // typography/secondary (0.6), tertiary (0.35), quaternary (0.2)
  accent: '#092482', // accent : eyebrows, points, carte vedette sur fond clair
  orange: '#ff6200', // UNIQUEMENT sur fond sombre (eyebrow, CTA, point actif)
  bg: '#f8f8f7',     // background/secondary (fond de page)
  white: '#ffffff',  // background/primary (cartes, sections blanches)
  dot: '#e4e4e3',    // points de coin sur fond clair
  black: '#000000',  // sections noires (méthode, footer)
  night: '#161617',  // cartes sur fond noir
  line: '#cdcdcd',   // stroke/primary (filets de listes)
};
const solid = (h, opacity = 1) => ({ type: 'SOLID', color: hex(h), opacity });
const GREY60 = solid(COL.grey, 0.6), GREY35 = solid(COL.grey, 0.35);

// --- Styles de texte locaux (IDs) ---------------------------------------------
const TS = {
  display: 'S:8b6a16afcb62d9dca77b3851c0bcc010c4181284,', // Trykker 94 (lettres O.R.E.M., chiffres géants)
  h1: 'S:118d3e3a1947a2c81902814557c68d1152a07504,',      // Trykker 54 / 110 % / -3 %
  h2: 'S:783829c6e9958614d2f1153ff90adf6a3693e420,',      // Lexend Deca Regular 43 / 110 % / -3 %
  h3: 'S:b865ee92f7c526f6539b1c858bb41a7f96fd3357,',      // Trykker 34 / 130 % (citations, titres de carte forts)
  h4: 'S:a5415a380b0e5defaaece8a10ff034c766951df0,',      // Trykker 27 / 120 % (H3 de cartes et de listes)
  h5: 'S:d55b86a5b7c20e3546423a3fba8895e13586a30a,',      // Lexend Deca Regular 22
  h6: 'S:a548dc88e15160008e9b1e95f3cb299a3b02c010,',      // Trykker 18 (nav, petites citations)
  h6sans: 'S:dffc689cd851a80a0fc85b1203468bb01f5cb44c,',  // Lexend Deca Regular 18 (questions FAQ)
  p: 'S:ac973929b371a9f946a5824872109c1803d48a4c,',       // Lexend Deca Light 14 / 120 % / -1 %
  button: 'S:d05e8ae8f6535ab1d431fcb1f652a32d65ac1a7f,',  // Lexend Deca Medium 14
  caption: 'S:e09fef4a9774239e32303f72e73f1d47446bb40c,', // Lexend Deca Light 11 (eyebrows, légendes)
};
const FX = {};
for (const s of await figma.getLocalEffectStylesAsync()) FX[s.name] = s.id;
// FX['light-elevations/primary-elevation' | 'secondary-elevation' | 'tertiary-elevation'], FX['board shadow']…

await Promise.all([['Trykker', 'Regular'], ['Lexend Deca', 'Light'], ['Lexend Deca', 'Regular'], ['Lexend Deca', 'Medium']]
  .map(([family, style]) => figma.loadFontAsync({ family, style })));

// --- Fabriques ---------------------------------------------------------------
function al(dir = 'VERTICAL', props = {}) {
  const f = figma.createAutoLayout(dir, props);
  f.fills = [];
  return f;
}
// Ajoute puis applique FILL/HUG (l'ordre compte : jamais avant appendChild).
function add(parent, child, { w, h } = {}) {
  parent.appendChild(child);
  if (w) child.layoutSizingHorizontal = w;
  if (h) child.layoutSizingVertical = h;
  return child;
}
// Largeur fixe d'un conteneur auto-layout SANS figer sa hauteur.
// (resize() fige les deux axes : sans la 2e ligne, la frame reste à 10 px de haut.)
function fixWidth(frame, w) {
  frame.resize(w, frame.height);
  frame.layoutSizingHorizontal = 'FIXED';
  frame.layoutSizingVertical = 'HUG';
}
// Texte stylé. width => bloc à largeur fixe ; fillW => occupe la largeur du parent.
async function txt(parent, chars, style, fill = solid(COL.ink), { width, name, align, fillW } = {}) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS[style]);
  t.characters = chars;
  t.fills = [fill];
  if (name) t.name = name;
  if (align) t.textAlignHorizontal = align;
  parent.appendChild(t);
  if (width) { t.textAutoResize = 'HEIGHT'; t.resize(width, t.height); }
  if (fillW) { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; }
  return t;
}
// Titre deux tons : ligne 1 encre, ligne 2 grise (signature des titres Orem).
async function twoTone(parent, l1, l2, style = 'h2', dark = false, opts = {}) {
  const t = await txt(parent, l1 + '\n' + l2, style, solid(dark ? COL.white : COL.ink), opts);
  t.setRangeFills(l1.length + 1, l1.length + 1 + l2.length, [dark ? solid(COL.white, 0.5) : GREY60]);
  return t;
}
const eyebrow = (parent, label, dark = false) => txt(parent, label, 'caption', solid(dark ? COL.orange : COL.accent));

// Point Orem : clone du vecteur « Union » officiel (forme organique), jamais une ellipse.
async function dot(parent, color = COL.dot, size = 12) {
  const d = (await figma.getNodeByIdAsync('2856:2082')).clone();
  parent.appendChild(d);
  d.fills = [solid(color)];
  if (size !== 12) d.resize(size, Math.round(size * 11 / 12));
  return d;
}
// Rangée de deux points gauche/droite : en haut ET en bas de chaque section et carte.
async function dotsRow(parent, color = COL.dot, { inset = 24, size = 12 } = {}) {
  const r = al('HORIZONTAL', { name: 'dots' });
  r.primaryAxisAlignItems = 'SPACE_BETWEEN';
  r.counterAxisAlignItems = 'CENTER';
  r.paddingLeft = r.paddingRight = inset;
  add(parent, r, { w: 'FILL' });
  await dot(r, color, size); await dot(r, color, size);
  return r;
}
// Section pleine largeur (1500) + conteneur centré 1300 + points de coin.
// Les sections sont ajoutées à la fin de ROOT : penser à renvoyer le footer en dernier.
async function section(name, { bg = COL.bg, dark = false, pt = 128, pb = 128, gap = 64 } = {}) {
  const s = al('VERTICAL', { name });
  s.counterAxisAlignItems = 'CENTER';
  s.fills = bg ? [solid(bg)] : [];
  s.paddingTop = 32; s.paddingBottom = 32;
  add(ROOT, s, { w: 'FILL' });
  await dotsRow(s, dark ? '#333333' : COL.dot, { inset: 32 });
  const inner = al('VERTICAL', { name: 'container', itemSpacing: gap });
  inner.paddingTop = pt - 44; inner.paddingBottom = pb - 44;
  s.appendChild(inner);
  fixWidth(inner, 1300);
  await dotsRow(s, dark ? '#333333' : COL.dot, { inset: 32 });
  return { s, inner };
}
// Image : uniquement des imageHash déjà présents dans le fichier (voir references/visuels.md).
function img(parent, w, h, hash, { r = 12, name = 'image', mode = 'FILL' } = {}) {
  const f = figma.createFrame();
  f.name = name; f.resize(w, h); f.cornerRadius = r;
  f.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: mode }];
  parent.appendChild(f);
  return f;
}
// Boutons pilule. Sur fond clair : 'primary' (noir). Sur fond sombre : 'light' ou 'orange'.
// Le composant animation-cta (2180:6481) est un bouton verre réservé aux fonds sombres.
async function pill(parent, label, kind = 'primary', { arrow = false } = {}) {
  const b = al('HORIZONTAL', { name: 'btn-' + label, itemSpacing: 10 });
  b.paddingTop = b.paddingBottom = 16;
  b.paddingLeft = b.paddingRight = kind.startsWith('link') ? 0 : 22;
  b.cornerRadius = 9999; b.counterAxisAlignItems = 'CENTER';
  const map = { primary: [COL.black, COL.white], light: [COL.white, COL.ink], orange: [COL.orange, COL.white], link: [null, COL.ink], linkLight: [null, COL.white] };
  const [bg, fg] = map[kind];
  b.fills = bg ? [solid(bg)] : [];
  parent.appendChild(b);
  if (arrow) await txt(b, '↳', 'button', solid(fg));
  await txt(b, label, 'button', solid(fg));
  if (kind.startsWith('link')) await txt(b, '›', 'button', solid(fg));
  return b;
}
// Pastille flottante (preuve chiffrée réelle, notification) posée sur un visuel.
async function chip(parent, label, sub, dotColor, x, y) {
  const c = al('HORIZONTAL', { name: 'chip', itemSpacing: 12 });
  c.paddingTop = c.paddingBottom = 14; c.paddingLeft = c.paddingRight = 18;
  c.cornerRadius = 16; c.counterAxisAlignItems = 'CENTER'; c.fills = [solid(COL.white)];
  parent.appendChild(c);
  const d = figma.createEllipse(); d.resize(8, 8); d.fills = [solid(dotColor)]; c.appendChild(d);
  const col = al('VERTICAL', { itemSpacing: 2 }); c.appendChild(col);
  await txt(col, label, 'button'); await txt(col, sub, 'caption', GREY60);
  c.x = x; c.y = y;
  await c.setEffectStyleIdAsync(FX['light-elevations/secondary-elevation']);
  return c;
}
// Bandeau de logos clients en niveaux de gris (logos importés, voir visuels.md).
function logoStrip(parent, logos /* [[name, hash, ratio]] */) {
  for (const [n, h, ratio] of logos) {
    const H = ratio > 6 ? 18 : ratio < 1.2 ? 40 : ratio < 2.5 ? 32 : 26;
    const f = figma.createFrame();
    f.name = 'logo-' + n; f.resize(Math.round(H * ratio), H);
    f.fills = [{ type: 'IMAGE', imageHash: h, scaleMode: 'FIT', filters: { saturation: -1, contrast: 0.1 } }];
    f.opacity = 0.7;
    parent.appendChild(f);
  }
}
// Nav claire officielle (texte encre). Le clone est en position absolue : le remettre en flux.
async function navLight(parent) {
  const nav = (await figma.getNodeByIdAsync('2856:2147')).clone();
  parent.appendChild(nav);
  nav.layoutPositioning = 'AUTO';
  nav.name = 'navbar';
  return nav;
}
// Footer officiel : clone de « footer content », toujours dernier enfant de ROOT.
async function footer() {
  const f = (await figma.getNodeByIdAsync('2158:2237')).clone();
  ROOT.appendChild(f); f.name = 'footer'; f.layoutSizingHorizontal = 'FILL';
  return f;
}
const footerLast = () => { const f = ROOT.children.find(n => n.name === 'footer'); if (f) ROOT.appendChild(f); };

// Passe typographique finale : espace insécable avant : ; ! ? » et après «,
// et remplacement de ↗ (absent des polices, rendu en emoji carré bleu) par →.
async function typoPass(root) {
  let n = 0;
  for (const t of root.findAll(k => k.type === 'TEXT')) {
    for (const f of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(f.fontName);
    if (t.characters.includes('↗')) t.characters = t.characters.replace(/↗/g, '→');
    const c = t.characters;
    for (let i = c.length - 1; i > 0; i--) {
      const before = c[i] === ' ' && /[:;!?»]/.test(c[i + 1] || '');
      const after = c[i] === ' ' && c[i - 1] === '«';
      if (before || after) { t.insertCharacters(i, ' ', 'BEFORE'); t.deleteCharacters(i + 1, i + 2); n++; }
    }
  }
  return n;
}

// --- Visuels de sites (pages « agence web » : uniquement des visuels de sites) ---
// Capture desktop 1440 x 900 dans un cadre navigateur : affichée entière, jamais recadrée.
async function browser(parent, w, hash, url) {
  const f = al('VERTICAL', { name: 'site-navigateur' });
  f.fills = [solid(COL.white)]; f.cornerRadius = 14; f.clipsContent = true;
  f.strokes = [solid(COL.dot)]; f.strokeWeight = 1;
  parent.appendChild(f); fixWidth(f, w);
  const bar = al('HORIZONTAL', { name: 'barre', itemSpacing: 6 });
  add(f, bar, { w: 'FILL' });
  bar.paddingLeft = bar.paddingRight = 14; bar.paddingTop = bar.paddingBottom = 10; bar.counterAxisAlignItems = 'CENTER';
  for (const c of ['#ff736a', '#febc2e', '#19c332']) { const e = figma.createEllipse(); e.resize(9, 9); e.fills = [solid(c)]; bar.appendChild(e); }
  const u = al('HORIZONTAL', { name: 'url' }); add(bar, u, { w: 'FILL' }); u.primaryAxisAlignItems = 'CENTER';
  const pillUrl = al('HORIZONTAL'); u.appendChild(pillUrl);
  pillUrl.fills = [solid('#f2f2f2')]; pillUrl.cornerRadius = 6;
  pillUrl.paddingTop = pillUrl.paddingBottom = 3; pillUrl.paddingLeft = pillUrl.paddingRight = 16;
  await txt(pillUrl, url, 'caption', GREY60);
  img(f, w, Math.round(w * 900 / 1440), hash, { r: 0, name: 'capture' });
  await f.setEffectStyleIdAsync(FX['light-elevations/secondary-elevation']);
  return f;
}
// Capture mobile 780 x 1688 dans un cadre téléphone.
async function phone(parent, w, hash) {
  const pad = Math.round(w * 0.04);
  const f = al('VERTICAL', { name: 'site-mobile' });
  f.fills = [solid(COL.ink)]; f.cornerRadius = Math.round(w * 0.17);
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = pad;
  parent.appendChild(f);
  const iw = w - 2 * pad;
  img(f, iw, Math.round(iw * 1688 / 780), hash, { r: Math.round(w * 0.13), name: 'capture' });
  await f.setEffectStyleIdAsync(FX['light-elevations/secondary-elevation']);
  return f;
}
// Visuel d'étude de cas (mockups 2160 x 1460 du site agence-orem.fr) : ratio respecté, pas de recadrage.
const caseImg = (parent, w, hash, name = 'visuel-cas') => img(parent, w, Math.round(w * 1460 / 2160), hash, { r: 16, name });
