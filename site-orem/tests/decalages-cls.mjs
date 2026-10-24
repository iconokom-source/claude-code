// Mesure des décalages de mise en page (CLS) en direct, par page et largeur, avec la source de chaque décalage.
// Usage : node decalages-cls.mjs https://www.agence-orem.fr
import { chromium } from 'playwright-core';
const base = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const path of ['/', '/contact', '/legal/mentions-legales', '/realisations', '/a-propos']) {
  for (const [w, h, cpu] of [[412, 823, 4], [1440, 900, 1]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__shifts.push({ v: e.value, t: Math.round(e.startTime), src: (e.sources || []).map(s => (s.node && (s.node.className || s.node.nodeName)) + ' ' + Math.round(s.previousRect.y) + '→' + Math.round(s.currentRect.y)).slice(0, 2) }); }).observe({ type: 'layout-shift', buffered: true });
      window.__footerSeen = null;
      const iv = setInterval(() => { const f = document.querySelector('.footer'); if (f) { const r = f.getBoundingClientRect(); if (r.top < innerHeight && !window.__footerSeen) window.__footerSeen = { t: Math.round(performance.now()), top: Math.round(r.top) }; } }, 50);
      setTimeout(() => clearInterval(iv), 15000);
    });
    await page.goto(base + path, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(5000);
    const r = await page.evaluate(() => ({ cls: window.__shifts.reduce((a, s) => a + s.v, 0).toFixed(3), big: window.__shifts.filter(s => s.v > 0.05).slice(0, 3), footerSeen: window.__footerSeen }));
    console.log(path, w, JSON.stringify(r));
    await ctx.close();
  }
}
await browser.close();
