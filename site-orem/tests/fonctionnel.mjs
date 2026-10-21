// Tests de fonctionnement du site Orem (skill site-orem, references/modifications.md, étape 5).
// Usage : node fonctionnel.mjs <base-url> <dossier-sortie> [page1,page2,...]
// Exemple : node fonctionnel.mjs https://orem.webflow.io ./apres /,/agence-web-lille
// Nécessite playwright-core (npm i playwright-core) et le Chromium préinstallé.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const base = process.argv[2] || 'https://orem.webflow.io';
const out = process.argv[3] || './resultats';
const pages = (process.argv[4] || '/,/realisations,/offres/site-web,/a-propos,/blog,/contact,/agence-web-lille,/legal/mentions-legales').split(',');
const WIDTHS = [1440, 991, 767, 390];
// Erreurs dues au réseau de la session cloud, pas au site
const IGNORE = /ERR_TUNNEL_CONNECTION_FAILED|ERR_BLOCKED_BY_ORB|Failed to fetch|axept|Dropped events|clarity|google-analytics/;
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const report = [];

for (const path of pages) {
  for (const width of WIDTHS) {
    const mobile = width < 500;
    const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    const errors = [];
    const requests = [];
    page.on('pageerror', (e) => { if (!IGNORE.test(e.message)) errors.push('pageerror: ' + e.message); });
    page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('request', (r) => requests.push(r.url()));
    const res = await page.goto(base + path, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(2500);
    const checks = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      return {
        h1: document.querySelectorAll('h1').length,
        navbar: vis(q('.navbar-logo-left-container')),
        footerPresent: !!q('.footer'),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src).slice(0, 5),
        modalTriggers: document.querySelectorAll('[data-modal-trigger]').length,
        footerLogoInDom: !!document.querySelector('.footer img[src*="logo-orem-anime"]'),
      };
    });
    // Scroll jusqu'en bas pour déclencher footer, vidéos et animations, puis remonter
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
    await page.waitForTimeout(1200);
    const footerAfterScroll = await page.evaluate(() => {
      const img = document.querySelector('.footer img[src*="logo-orem-anime"]');
      return img ? { loaded: img.complete && img.naturalWidth > 0 } : null;
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const tag = path.replace(/\//g, '_') || '_';
    await page.screenshot({ path: `${out}/${tag}-${width}.png`, fullPage: false });
    // Modale projets (desktop uniquement, si présente)
    let modal = null;
    if (width === 1440 && checks.modalTriggers > 0) {
      const trig = page.locator('[data-modal-trigger]:visible').first();
      await trig.scrollIntoViewIfNeeded();
      await trig.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      modal = await page.evaluate(() => { const m = document.querySelector('[data-project-modal]'); const c = document.querySelector('[data-project-modal-content]'); return { open: !!m && m.classList.contains('is-open'), contentLength: c ? c.innerHTML.length : 0, url: location.pathname }; });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      modal.closed = await page.evaluate(() => !document.querySelector('[data-project-modal]')?.classList.contains('is-open'));
    }
    report.push({ path, width, status: res.status(), ...checks, footerAfterScroll, modal, preloadsLogoEarly: requests.slice(0, 15).some((u) => u.includes("logo-orem-anime")), errors });
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(`${out}/rapport.json`, JSON.stringify(report, null, 1));
for (const r of report) {
  const pb = [];
  if (r.status !== 200) pb.push('HTTP ' + r.status);
  if (r.h1 !== 1) pb.push(r.h1 + ' h1');
  if (!r.navbar) pb.push('navbar invisible');
  if (!r.footerPresent) pb.push('footer absent');
  if (r.horizontalOverflow) pb.push('débordement horizontal');
  if (r.brokenImages.length) pb.push('images cassées');
  if (r.footerAfterScroll && !r.footerAfterScroll.loaded) pb.push('logo footer non chargé après scroll');
  if (r.modal && (!r.modal.open || r.modal.contentLength < 500 || !r.modal.closed)) pb.push('modale KO ' + JSON.stringify(r.modal));
  if (r.errors.length) pb.push(r.errors.length + ' erreur(s) JS : ' + r.errors[0].slice(0, 120));
  console.log(`${pb.length ? '✗' : '✓'} ${r.path} @${r.width}${pb.length ? ' — ' + pb.join(' ; ') : ''}`);
}
