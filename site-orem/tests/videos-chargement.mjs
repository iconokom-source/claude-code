// Inventaire des vidéos d'une page et du moment où chacune est téléchargée (chargement / scroll).
// Usage : node videos-chargement.mjs   (pages réglées dans le script)
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const name = u => decodeURIComponent(u.split('/').pop()).replace(/^6a7582303b9ddd4a77302cc8\//,'').slice(25, 60);
for (const path of ['/', '/offres/site-web']) for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, isMobile: w < 500, hasTouch: w < 500 });
  const page = await ctx.newPage();
  const seen = new Map(); let phase = 'chargement';
  page.on('response', async r => { const u = r.url(); if (/\.(mp4|webm)/.test(u)) { const k = name(u); const len = +(r.headers()['content-length'] || 0); if (!seen.has(k)) seen.set(k, { phase, ko: Math.round(len / 1024), status: r.status() }); } });
  await page.goto('https://www.agence-orem.fr' + path, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(4000);
  const vids = await page.evaluate(() => [...document.querySelectorAll('video')].map(v => { const r = v.getBoundingClientRect(); const bg = v.closest('.w-background-video'); return { y: Math.round(r.top + scrollY), h: Math.round(r.height), vis: getComputedStyle(bg || v).display !== 'none' && r.height > 0, src: (v.currentSrc || (v.querySelector('source') || {}).src || bg?.dataset.videoUrls || '').split('/').pop().slice(25, 60), preload: v.preload, autoplay: v.autoplay, cls: (bg || v).className.slice(0, 60), sect: (v.closest('section') || {}).className?.slice?.(0, 50) }; }));
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { phase = 'scroll ' + Math.round(y / 100) * 100; await page.evaluate(yy => scrollTo(0, yy), y); await page.waitForTimeout(250); }
  await page.waitForTimeout(2000);
  console.log('=== ', path, w, 'hauteur', H);
  console.log(' vidéos dans la page :'); vids.forEach(v => console.log('   ', JSON.stringify(v)));
  console.log(' téléchargements :'); for (const [k, v] of seen) console.log('   ', k, JSON.stringify(v));
  await ctx.close();
}
await browser.close();
