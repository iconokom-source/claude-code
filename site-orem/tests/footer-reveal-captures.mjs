import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
const OLDCSS = `<style>\n  .footer {\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    min-height: 100vh;\n    z-index: 1;\n    will-change: transform;\n  }\n  .main-wrapper {\n    position: relative;\n    z-index: 2;\n    background: #f2f2f0;\n  }\n</style>`;
const VARIANTS = {
  actuel: null,
  A: `<style>.footer{position:relative;min-height:0}.main-wrapper{position:relative;z-index:2;background:#f2f2f0}</style>`,
  B: `<style>.footer{position:sticky;bottom:min(0px,calc(100vh - 968px));min-height:100vh;z-index:1}@media (max-width:767px){.footer{bottom:min(0px,calc(100vh - 1034px))}}@media (max-width:479px){.footer{bottom:min(0px,calc(100vh - 1660px))}}.main-wrapper{position:relative;z-index:2;background:#f2f2f0}</style>`,
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const out = {};
for (const path of ['/contact','/']) for (const [w,h] of [[1440,900],[390,844]]) for (const [name,css] of Object.entries(VARIANTS)) {
  const c = await b.newContext({viewport:{width:w,height:h},isMobile:w<500,hasTouch:w<500});
  if (css) await c.route(u=>true, async route=>{ const r=route.request(); if (r.resourceType()!=='document'||!r.url().startsWith('https://www.agence-orem.fr')) return route.continue();
    let html=execFileSync('curl',['-sS',r.url()],{maxBuffer:5e7}).toString();
    if(!html.includes(OLDCSS)) throw new Error('css introuvable');
    html=html.replace(OLDCSS,css);
    const s=html.indexOf("<script>\n  (function () {\n    const main = document.querySelector('.main-wrapper');"); const e=html.indexOf('</script>',s)+9;
    if(s<0) throw new Error('js introuvable'); html=html.slice(0,s)+html.slice(e);
    route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}); });
  const p=await c.newPage(); await p.goto('https://www.agence-orem.fr'+path,{waitUntil:'load'});
  await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}}); await new Promise(r=>setTimeout(r,2000));
  await p.addStyleTag({content:'#axeptio_overlay,.axeptio_mount{display:none!important}'});
  const shots=[];
  for (const [label,f] of [['debut',0.7],['milieu',0.2],['fin',null]]) {
    await p.evaluate(f=>{const m=document.querySelector('.main-wrapper'); const end=m.getBoundingClientRect().bottom+scrollY; scrollTo(0, f===null? document.documentElement.scrollHeight : end - f*innerHeight);}, f);
    await new Promise(r=>setTimeout(r,700));
    const file=`fc-${path.replace(/\//g,'_')||'_'}-${w}-${name}-${label}.png`; await p.screenshot({path:file}); shots.push(file);
  }
  const m = await p.evaluate(()=>{const f=document.querySelector('.footer').getBoundingClientRect(); return {footerTop:Math.round(f.top), footerBottom:Math.round(f.bottom), vh:innerHeight};});
  console.log(path,w,name,'à la fin :',JSON.stringify(m));
  await c.close(); }
await b.close();
