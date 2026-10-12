#!/usr/bin/env node
// Rend un deck ou un document HTML Orem en PDF (et en aperçus PNG) avec Chromium.
//
//   node render_pdf.cjs deck.html deck.pdf                 → slides 1920×1080 (PDF 1440×810 pt)
//   node render_pdf.cjs doc.html doc.pdf --a4              → document A4
//   node render_pdf.cjs deck.html deck.pdf --png apercus/  → + une PNG par slide (contrôle visuel)
//
// Playwright : `npm i playwright` (ou une install globale). Le script attend le chargement
// des polices (Trykker, Lexend Deca) avant d'imprimer : vérifier les PNG, pas seulement le PDF.
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  const tries = ['playwright', '/opt/node-tools/node_modules/playwright', 'playwright-core'];
  for (const t of tries) { try { return require(t); } catch (_) {} }
  console.error('Playwright introuvable : npm i playwright');
  process.exit(1);
}

(async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) { console.error('usage : node render_pdf.cjs page.html sortie.pdf [--a4] [--png dossier/]'); process.exit(1); }
  const [input, output] = args;
  const a4 = args.includes('--a4');
  const pngIdx = args.indexOf('--png');
  const pngDir = pngIdx > -1 ? args[pngIdx + 1] : null;

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: a4 ? { width: 794, height: 1123 } : { width: 1920, height: 1080 } });
  await page.emulateMedia({ media: 'print' });
  await page.goto('file://' + path.resolve(input), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() => ['Trykker', 'Lexend Deca'].filter(f => !document.fonts.check(`16px "${f}"`)));
  if (missing.length) console.warn('⚠ polices non chargées :', missing.join(', '), '→ rendu de substitution');

  await page.pdf(a4
    ? { path: output, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } }
    : { path: output, width: '1920px', height: '1080px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

  if (pngDir) {
    fs.mkdirSync(pngDir, { recursive: true });
    const sel = a4 ? '.page' : '.slide';
    const n = await page.locator(sel).count();
    for (let i = 0; i < n; i++) {
      await page.locator(sel).nth(i).screenshot({ path: path.join(pngDir, `${String(i + 1).padStart(2, '0')}.png`), scale: 'css' });
    }
    console.log(`${n} aperçu(s) → ${pngDir}`);
  }
  await browser.close();
  console.log('PDF →', output);
})();
