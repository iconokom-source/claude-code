// Tests P-01 v2 : fermeture de la page projet (arrivée directe, flèches, Échap, rechargement depuis une page du site).
// Usage : REEL=1 node fermeture-projet.mjs <largeur>   (sans REEL : injecte head-v2.html du dossier courant à la place du head en ligne)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const base = 'https://orem.webflow.io';
const newHead = fs.readFileSync('head-v2.html','utf8');
const width = +(process.argv[2]||1440); const mobile = width<500;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const out=[]; const ok=(n,c,d='')=>out.push(`${c?'✓':'✗'} ${n}${d?' — '+d:''}`);
async function ctx(){
  const c = await b.newContext({ viewport:{width,height:mobile?844:900}, isMobile:mobile, hasTouch:mobile });
  if (!process.env.REEL) await c.route(u=>/\/realisations\/[^/]+$/.test(new URL(u).pathname), async (route)=>{
    if (route.request().resourceType()!=='document') return route.continue();
    let html = execFileSync('curl',['-sS',route.request().url()],{maxBuffer:5e7}).toString();
    const i = html.indexOf('<style>\n  /* P-01'); const j = html.indexOf('</script>', i)+9;
    if (i<0) throw new Error('head introuvable');
    html = html.slice(0,i)+newHead+html.slice(j);
    route.fulfill({ status:200, contentType:'text/html; charset=utf-8', body: html });
  });
  const p = await c.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  return {p,errs};
}
const st = p => p.evaluate(() => ({ path: location.pathname, open: !!document.querySelector('[data-project-modal]')?.classList.contains('is-open'), vraiePage: !document.querySelector('.projet-statique'), title: document.title.slice(0,40) }));
const W=ms=>new Promise(r=>setTimeout(r,ms));
// 1 arrivée directe + croix
{ const {p,errs}=await ctx(); await p.goto(base+'/realisations/les-ombres',{waitUntil:'load'}); await W(2500);
  const a=await st(p); ok('direct : panneau ouvert', a.open && a.path==='/realisations/les-ombres');
  await p.locator('.close-modale:visible').first().click(); await p.waitForLoadState('load'); await W(2000);
  const c=await st(p); ok('direct + croix : vrai accueil', c.path==='/' && c.vraiePage && !c.open, JSON.stringify(c));
  await p.goBack().catch(()=>{}); await W(1000); ok('direct + croix + précédent : ne revient pas sur le projet', !(p.url().includes('/realisations/')), p.url());
  ok('direct : pas d’erreur JS', !errs.length, errs.join(' | ')); await p.context().close(); }
// 2 arrivée directe + flèche + Echap
{ const {p,errs}=await ctx(); await p.goto(base+'/realisations/huchet-demorge',{waitUntil:'load'}); await W(2500);
  await p.locator('[data-project-modal-content] .change-modale.suivant').first().click().catch(()=>{}); await W(1800);
  const n=await st(p); ok('direct + flèche : change de projet', n.open && n.path!=='/realisations/huchet-demorge', n.path);
  await p.keyboard.press('Escape'); await p.waitForLoadState('load'); await W(2000);
  const c=await st(p); ok('direct + flèche + Échap : vrai accueil', c.path==='/' && c.vraiePage && !c.open, JSON.stringify(c));
  ok('pas d’erreur JS', !errs.length, errs.join(' | ')); await p.context().close(); }
// 3 depuis une page du site, puis rechargement, puis croix -> retour sur la page d'origine
for (const from of ['/','/realisations','/a-propos']) { const {p,errs}=await ctx(); await p.goto(base+from,{waitUntil:'load'}); await W(1500);
  const t=p.locator('[data-modal-trigger][href^="/realisations/"]').first(); if (!(await t.count())) { ok(from+' : pas de carte', true); await p.context().close(); continue; }
  await t.scrollIntoViewIfNeeded(); await W(400); const y0=await p.evaluate(()=>scrollY); await t.click(); await W(2000);
  await p.reload({waitUntil:'load'}); await W(2500);
  const r=await st(p); ok(from+' > carte > rechargement : panneau ouvert', r.open);
  await p.locator('.close-modale:visible').first().click(); await p.waitForLoadState('load'); await W(2500);
  const c=await st(p); const y=await p.evaluate(()=>scrollY);
  ok(from+' > carte > rechargement > croix : retour sur '+from, c.path===from && c.vraiePage && !c.open, JSON.stringify(c)+' scroll '+y0+'→'+y);
  ok('pas d’erreur JS', !errs.length, errs.join(' | ')); await p.context().close(); }
await b.close(); console.log(`@${width}\n`+out.join('\n'));
