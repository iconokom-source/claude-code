import { chromium } from 'playwright-core';
const url = process.argv[2], label = process.argv[3], width = +(process.argv[4]||390);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const ctx = await b.newContext({ viewport:{width, height: width<500?844:900}, deviceScaleFactor: width<500?3:1, isMobile: width<500, hasTouch: width<500 });
const page = await ctx.newPage();
const reqs = []; const errors = [];
page.on('response', async r => { try { const h = await r.allHeaders(); reqs.push({url:r.url(), type:r.request().resourceType(), size:+(h['content-length']||0), t:Date.now()}); } catch{} });
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: width<500 ? 4 : 1 });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'load', timeout: 90000 });
await page.addInitScript(()=>{});
await page.evaluate(() => { window.__lt=[]; new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(e.duration))).observe({type:'longtask',buffered:true}); });
await page.waitForTimeout(6000);
const idleReqs = reqs.filter(r => r.type==='fetch' || r.type==='xhr').map(r=>r.url.replace('https://www.agence-orem.fr',''));
await page.evaluate(()=>{ window.__lt=[]; });
// scroll progressif
const H = await page.evaluate(()=>document.documentElement.scrollHeight);
const frames = await page.evaluate(async (H) => {
  return await new Promise(res => { let n=0, last=performance.now(), slow=0, y=0; const step=()=>{ const now=performance.now(); if(now-last>50) slow++; last=now; n++; y+=40; window.scrollTo(0,y); if(y<H) requestAnimationFrame(step); else res({n,slow}); }; requestAnimationFrame(step); });
}, H);
const lt = await page.evaluate(()=>window.__lt);
console.log(JSON.stringify({label, width, loadMs: Date.now()-t0, height:H, requests:reqs.length, fetchAfterLoad: idleReqs.length, fetchSample: idleReqs.slice(0,20), scrollFrames:frames.n, slowFrames:frames.slow, longTasksDuringScroll: lt.length, longTaskMs: Math.round(lt.reduce((a,b)=>a+b,0)), errors: errors.slice(0,8)}));
await b.close();
