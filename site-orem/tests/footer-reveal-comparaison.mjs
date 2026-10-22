import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const path of ['/contact','/','/realisations','/404-test-inexistant','/membres/louis-montagne']) for (const [w,h] of [[1440,900],[991,800],[600,900],[390,844]]) for (const [name,base] of [['prod','https://www.agence-orem.fr'],['test','https://orem.webflow.io']]) {
  const c = await b.newContext({viewport:{width:w,height:h},isMobile:w<500,hasTouch:w<500});
  const p=await c.newPage(); await p.goto(base+path,{waitUntil:'load'});
  await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}}); await new Promise(r=>setTimeout(r,2000));
  await p.addStyleTag({content:'#axeptio_overlay,.axeptio_mount{display:none!important} video{visibility:hidden!important}'});
  const res=[];
  for (const [label,f] of [['debut',0.7],['milieu',0.2],['fin',null]]) {
    await p.evaluate(f=>{const m=document.querySelector('.main-wrapper'); if(!m) return; const end=m.getBoundingClientRect().bottom+scrollY; scrollTo(0, f===null? document.documentElement.scrollHeight : end - f*innerHeight);}, f);
    await new Promise(r=>setTimeout(r,600));
    res.push(await p.evaluate(()=>{const f=document.querySelector('.footer'); if(!f) return null; const r=f.getBoundingClientRect(); return Math.round(r.top)+'/'+Math.round(r.bottom);}));
    if (path==='/contact'||path==='/') await p.screenshot({path:`rv-${path.replace(/\//g,'_')}-${w}-${name}-${label}.png`});
  }
  console.log(path.padEnd(26), String(w).padEnd(5), name, res.join('  '));
  await c.close(); }
await b.close();
