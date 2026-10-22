// Poids réellement téléchargé (15 s) des vidéos du haut des pages Offres (Cloudinary) et leur définition.
// Usage : node videos-hero-offres.mjs
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
for (const s of ['site-web', 'image-de-marque', 'evolution', 'conseil']) for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, isMobile: w < 500 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable');
  let bytes = 0; const ids = new Set();
  cdp.on('Network.responseReceived', e => { if (/cloudinary/.test(e.response.url)) ids.add(e.requestId); });
  cdp.on('Network.dataReceived', e => { if (ids.has(e.requestId)) bytes += e.encodedDataLength || e.dataLength; });
  const t0 = Date.now();
  await page.goto('https://www.agence-orem.fr/offres/' + s, { waitUntil: 'load', timeout: 90000 });
  const tl = Date.now() - t0;
  await page.waitForTimeout(15000);
  const v = await page.evaluate(() => { const v = document.querySelector('[data-hero-video] video'); if (!v) return null; const r = v.getBoundingClientRect(); return { w: v.videoWidth, h: v.videoHeight, dur: Math.round(v.duration), box: [Math.round(r.width), Math.round(r.height)], vis: r.height > 0 && getComputedStyle(v).display !== 'none' }; });
  console.log(s, w, 'load', tl, 'ms', 'Cloudinary téléchargé en 15 s :', Math.round(bytes / 1024), 'Ko', JSON.stringify(v));
  await ctx.close();
}
await browser.close();
