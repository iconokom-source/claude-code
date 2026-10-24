// Tests flèches : arrivée directe sur chaque projet du plan du site, suivant puis précédent, 1 seul h1.
// Usage : REEL=1 [BASE=https://www.agence-orem.fr] node fleches-projets.mjs   (sans REEL : injecte head-v3.html)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const base = process.env.BASE || 'https://orem.webflow.io';
const head = fs.readFileSync('head-v3.html','utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const slugs = execFileSync('curl',['-sSL','https://www.agence-orem.fr/sitemap.xml']).toString().match(/\/realisations\/[^<]+/g);
const out=[]; let bad=0;
for (const s of slugs) {
  const c=await b.newContext({viewport:{width:1440,height:900}});
  if (!process.env.REEL) await c.route(u=>new URL(u).pathname===s, async route=>{ if (route.request().resourceType()!=='document') return route.continue();
    let html=execFileSync('curl',['-sS',route.request().url()],{maxBuffer:5e7}).toString(); const k=html.indexOf('/* P-01 : la page projet'); const i=html.lastIndexOf('<style>',k); const j=html.indexOf('</script>',i)+9;
    html=html.slice(0,i)+head+html.slice(j); route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}); });
  const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>{ if(!/axept|Failed to fetch/.test(e.message)) errs.push(e.message)});
  await p.goto(base+s,{waitUntil:'load'}); await new Promise(r=>setTimeout(r,2500));
  const h1=await p.evaluate(()=>document.querySelectorAll('h1').length);
  await p.locator('[data-project-modal-content] .change-modale.suivant:visible').first().click().catch(()=>{}); await new Promise(r=>setTimeout(r,1800));
  const n=await p.evaluate(()=>location.pathname);
  await p.locator('[data-project-modal-content] .change-modale:not(.suivant):visible').first().click().catch(()=>{}); await new Promise(r=>setTimeout(r,1800));
  const back=await p.evaluate(()=>location.pathname);
  const ok = n!==s && n.startsWith('/realisations/') && back===s && h1===1 && !errs.length;
  if(!ok) bad++;
  out.push(`${ok?'✓':'✗'} ${s} → ${n} → ${back} h1=${h1} ${errs.join('|')}`);
  await c.close(); }
await b.close(); console.log(out.join('\n')); console.log(`${slugs.length-bad}/${slugs.length}`);
