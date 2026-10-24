import { chromium } from 'playwright-core'; import fs from 'fs';
const env=JSON.parse(fs.readFileSync('gtm/env.json')).environment.find(e=>e.type==='latest'); const TEST=process.argv[2]==='test';
const H='https://www.agence-orem.fr/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
async function run(choix){
  const c = await b.newContext({ viewport:{width:1440,height:900} }); if(TEST) await c.route(/googletagmanager\.com\/gtm\.js\?id=GTM-TD7C9Z42/, r=>r.continue({url:r.request().url()+`&gtm_auth=${env.authorizationCode}&gtm_preview=env-${env.environmentId}&gtm_cookies_win=x`}));
  const p=await c.newPage(); let h=[]; const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  p.on('request',r=>{const u=r.url(); if(/clarity\.ms|g\/collect/.test(u)) h.push(u.slice(8,40));});
  const step=async(t,l)=>{await p.waitForTimeout(t); console.log(`[${choix}] ${l}`, h.splice(0).join(' ; ')||'—');};
  await p.goto(H+'?v='+Date.now(),{waitUntil:'load'}); await step(5000,'arrivée :');
  await p.mouse.wheel(0,300); await p.waitForTimeout(1500); await p.getByText(choix).click(); await step(4000,'après choix :');
  await p.goto(H+'a-propos',{waitUntil:'load'}); await step(4000,'page suivante :');
  console.log(`[${choix}] dataLayer:`, await p.evaluate(()=>dataLayer.slice(0,4).map(e=>e[0]?e[0]+':'+e[1]+':'+(e[2]&&e[2].analytics_storage||''):e.event).join(' | ')));
  console.log(`[${choix}] erreurs JS:`, errs.filter(e=>!/Dropped/.test(e)).length); await c.close();
}
await run('OK pour moi'); await run('Non merci'); await b.close();
