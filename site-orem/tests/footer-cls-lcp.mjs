// Compare prod et orem.webflow.io : CLS, élément LCP (footer ou page), hauteur de page et position du footer en fin de page.
// Usage : node footer-cls-lcp.mjs
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const path of ['/', '/realisations', '/a-propos', '/contact', '/legal/mentions-legales', '/offres/site-web', '/blog', '/404']) for (const [w, h] of [[1440, 900], [800, 1000], [390, 844]]) {
  const row = [];
  for (const base of ['https://www.agence-orem.fr', 'https://orem.webflow.io']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 }); const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page); if (w < 500) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => { window.__cls = 0; window.__lcp = '';
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { const e = l.getEntries().pop(); window.__lcp = e.element && e.element.closest('.footer') ? 'FOOTER' : 'page'; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
    await page.goto(base + path, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    const r = await page.evaluate(() => ({ cls: window.__cls.toFixed(3), lcp: window.__lcp, D: document.documentElement.scrollHeight }));
    const pos = [];
    for (const d of [600, 300, 0]) { await page.evaluate(y => scrollTo(0, y), Math.max(0, r.D - h - d)); await page.waitForTimeout(150);
      pos.push(await page.evaluate(() => { const f = document.querySelector('.footer-sticky') || document.querySelector('.footer'); const m = document.querySelector('.main-wrapper'); return f ? Math.round(f.getBoundingClientRect().top) + '/' + Math.round(m.getBoundingClientRect().bottom) : 'pas de footer'; })); }
    row.push(`CLS ${r.cls} LCP ${r.lcp} D ${r.D} pos ${pos.join(' ')}`);
    await ctx.close();
  }
  console.log(path.padEnd(24), String(w).padEnd(4), 'prod :', row[0], '\n' + ' '.repeat(29) + 'test :', row[1]);
}
await browser.close();
