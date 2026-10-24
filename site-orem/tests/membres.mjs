// Tests P-01 membres : SEO sans JS, arrivée directe (flèches, croix → /a-propos), depuis À propos, rechargement.
// Usage : REEL=1 node membres.mjs <largeur>   (sans REEL : injecte head-membres.html du dossier courant)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const base = process.env.BASE || 'https://orem.webflow.io';
const newHead = fs.readFileSync('head-membres.html','utf8');
const width = +(process.argv[2]||1440); const mobile = width<500;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const out=[]; const ok=(n,c,d='')=>out.push(`${c?'✓':'✗'} ${n}${d?' — '+d:''}`);
const IGN=/ERR_TUNNEL|ERR_BLOCKED|Failed to fetch|axept|Dropped events|clarity|google-analytics/;
async function ctx(js=true){
  const c = await b.newContext({ viewport:{width,height:mobile?844:900}, isMobile:mobile, hasTouch:mobile, javaScriptEnabled:js });
  if (!process.env.REEL) await c.route(u=>/^\/membres\/[^/]+$/.test(new URL(u).pathname), async (route)=>{
    if (route.request().resourceType()!=='document') return route.continue();
    let html = execFileSync('curl',['-sS',route.request().url()],{maxBuffer:5e7}).toString();
    const k = html.indexOf('/* P-01 : la page membre'); const i = html.lastIndexOf('<style>', k); const j = html.indexOf('</script>', i)+9;
    if (k<0) throw new Error('head introuvable');
    html = html.slice(0,i)+newHead+html.slice(j);
    route.fulfill({ status:200, contentType:'text/html; charset=utf-8', body: html });
  });
  const p = await c.newPage(); const errs=[];
  p.on('pageerror',e=>{ if(!IGN.test(e.message)) errs.push(e.message+' @'+p.url()+' '+(e.stack||'').split('\n').slice(0,3).join(' / '))});
  return {p,errs};
}
const st = p => p.evaluate(() => ({ path: location.pathname, open: !!document.querySelector('[data-project-modal]')?.classList.contains('is-open'), vraiePage: !document.querySelector('.projet-statique'), h: document.querySelector('[data-project-modal] h1, [data-project-modal] h2')?.textContent.trim().slice(0,40)||null }));
const W=ms=>new Promise(r=>setTimeout(r,ms));
const slugs=['louis-montagne','theophile-lamouret','clement-saint-hilaire'];
// SEO sans JS
for (const s of slugs) { const {p}=await ctx(false); const r=await p.goto(base+'/membres/'+s,{waitUntil:'load'});
  const seo=await p.evaluate(()=>({h1:[...document.querySelectorAll('h1')].map(h=>h.textContent.trim()), canon:document.querySelector('link[rel=canonical]')?.href, hidden:getComputedStyle(document.documentElement).visibility==='hidden', redir:[...document.scripts].some(x=>/\?p=/.test(x.textContent)), title:document.title}));
  ok(`/membres/${s} sans JS : 200, lisible, canonique, pas de redirection`, r.status()===200 && seo.h1.length===1 && !seo.hidden && !seo.redir && /\/membres\//.test(seo.canon||''), JSON.stringify(seo)); await p.context().close(); }
// arrivée directe : panneau, flèches, fermeture -> /a-propos
for (const s of slugs) { const {p,errs}=await ctx(); await p.goto(base+'/membres/'+s,{waitUntil:'load'}); await W(2500);
  const a=await st(p); ok(`direct ${s} : panneau ouvert`, a.open && a.path==='/membres/'+s, JSON.stringify(a));
  const fl = p.locator('[data-project-modal] .change-modale:visible');
  ok(`direct ${s} : flèches visibles`, await fl.count()>0, String(await fl.count()));
  await p.locator('[data-project-modal] .change-modale.suivant:visible').first().click().catch(()=>{}); await W(1800);
  const n=await st(p); ok(`direct ${s} : flèche change de membre`, n.open && n.path!==a.path && n.path.startsWith('/membres/'), a.path+' → '+n.path);
  await p.locator('[data-project-modal] .close-modale:visible').first().click(); await p.waitForLoadState('load'); await W(2000);
  const c=await st(p); ok(`direct ${s} : croix → vraie page À propos`, c.path==='/a-propos' && c.vraiePage && !c.open, JSON.stringify(c));
  ok(`direct ${s} : pas d'erreur JS`, !errs.length, errs.join(' | ')); await p.context().close(); }
// depuis À propos : ouvrir, flèche, fermer -> reste, puis rechargement
{ const {p,errs}=await ctx(); await p.goto(base+'/a-propos',{waitUntil:'load'}); await W(1500);
  const t=p.locator('[data-modal-trigger][href^="/membres/"]').first(); await t.scrollIntoViewIfNeeded(); await W(400); const y0=await p.evaluate(()=>scrollY);
  await t.click(); await W(2000); const o=await st(p); ok('À propos : ouvre un membre', o.open && o.path.startsWith('/membres/'), JSON.stringify(o));
  await p.locator('[data-project-modal-content] .close-modale:visible').first().click(); await W(1500);
  const c=await st(p); const y=await p.evaluate(()=>scrollY); ok('À propos : croix, on reste au même endroit', !c.open && c.path==='/a-propos' && Math.abs(y-y0)<50, JSON.stringify(c)+' '+y0+'→'+y);
  await t.click(); await W(2000); await p.reload({waitUntil:'load'}); await W(2500);
  const r=await st(p); ok('À propos > membre > rechargement : panneau ouvert', r.open, JSON.stringify(r));
  await p.locator('.close-modale:visible').first().click(); await p.waitForLoadState('load'); await W(2500);
  const c2=await st(p); ok('À propos > membre > rechargement > croix : retour sur À propos', c2.path==='/a-propos' && c2.vraiePage && !c2.open, JSON.stringify(c2));
  ok("pas d'erreur JS", !errs.length, errs.join(' | ')); await p.context().close(); }
await b.close(); console.log(`@${width}\n`+out.join('\n'));
