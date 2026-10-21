import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const OLD=fs.readFileSync('p02-old.txt','utf8'), NEW=fs.readFileSync('p02-new.txt','utf8');
const inject = process.argv[2]==='new';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const W=ms=>new Promise(r=>setTimeout(r,ms));
for (const [w,m] of [[1440,false],[390,true]]) for (const path of ['/','/realisations','/a-propos']) {
  const c = await b.newContext({viewport:{width:w,height:900},isMobile:m,hasTouch:m});
  await c.route(u=>true, async route=>{ const r=route.request(); if (r.resourceType()!=='document' || !inject || !r.url().startsWith('https://www.agence-orem.fr')) return route.continue();
    let html=execFileSync('curl',['-sS',r.url()],{maxBuffer:5e7}).toString(); if(!html.includes(OLD)) throw new Error('bloc introuvable'); html=html.replace(OLD,NEW);
    route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}); });
  const p=await c.newPage(); let n=0; const errs=[];
  p.on('pageerror',e=>{ if(!/axept|Failed to fetch/.test(e.message)) errs.push(e.message)});
  p.on('request', r=>{ const u=new URL(r.url()); if (r.resourceType()==='fetch' && /^\/(realisations|membres)\//.test(u.pathname)) n++; });
  await p.goto('https://www.agence-orem.fr'+path,{waitUntil:'load'}); await W(6000);
  const preload=n;
  const t=p.locator('[data-modal-trigger]:visible').first(); await t.scrollIntoViewIfNeeded(); await W(300);
  if (m) await t.tap(); else { await t.hover(); await W(150); await t.click(); }
  const t0=Date.now(); await p.waitForFunction(()=>{const c=document.querySelector('[data-project-modal-content]'); return c && c.querySelector('h1,h2');},null,{timeout:10000}); const open=Date.now()-t0;
  await W(800);
  const t1=Date.now(); const before=await p.evaluate(()=>location.pathname);
  await p.locator('[data-project-modal-content] .change-modale.suivant:visible').first().click(); await p.waitForFunction(b=>location.pathname!==b,before,{timeout:10000}); await p.waitForFunction(()=>getComputedStyle(document.querySelector('[data-project-modal-content]')).opacity==='1'); const arrow=Date.now()-t1;
  console.log(inject?'NOUVEAU':'ACTUEL', w, path, `préchargées au chargement: ${preload}`, `ouverture: ${open} ms`, `flèche: ${arrow} ms`, errs.length?'ERR '+errs[0]:'');
  await c.close(); }
await b.close();
