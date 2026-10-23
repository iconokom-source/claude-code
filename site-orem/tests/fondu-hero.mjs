import { chromium } from 'playwright-core';
import fs from 'fs';
const CSS = fs.readFileSync(process.argv[2], 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const v of ['actuel', 'css']) for (let run = 0; run < 2; run++) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  if (v === 'css') await p.route('https://orem.webflow.io/', async r => { const res = await r.fetch(); let h = await res.text(); h = h.replace('</head>', CSS + '</head>'); r.fulfill({ response: res, body: h }); });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await p.addInitScript(() => { window.__lcp = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__lcp.push([Math.round(e.startTime), e.element && e.element.tagName]))).observe({ type: 'largest-contentful-paint', buffered: true }); });
  await p.goto('https://orem.webflow.io/', { waitUntil: 'commit' });
  const samples = [];
  for (const t of [800, 1500, 3000, 6000, 12000]) { await p.waitForTimeout(t - (samples.length ? [800, 1500, 3000, 6000, 12000][samples.length - 1] : 0)); samples.push(await p.evaluate(() => { const h = document.querySelector('h1'); if (!h) return 'pas de h1'; const c = getComputedStyle(h); return (+c.opacity).toFixed(2) + '/' + c.transform.replace('matrix(1, 0, 0, 1, ', '').replace(')', ''); }).catch(() => 'nav')); }
  const lcp = await p.evaluate(() => window.__lcp);
  const fin = await p.evaluate(() => ['c7dee749', 'f6eb1637', 'e817c46e', '105590a1'].map(id => { const e = document.querySelector(`[data-w-id^="${id}"]`); const c = getComputedStyle(e); return id + ':' + c.opacity + ':' + c.transform; }));
  console.log(v, run, 'h1 (opacité/translation) à 0,8/1,5/3/6/12 s :', samples.join(' | '), '\n   LCP:', JSON.stringify(lcp), '\n   final:', fin.join(' '), 'erreurs', errs.length);
  await ctx.close();
}
await b.close();
