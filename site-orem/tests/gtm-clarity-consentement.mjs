// Usage : node gtm-clarity-consentement.mjs <environments.json de l API GTM> — charge la version "Latest" (non publiée) du conteneur sur orem.webflow.io.
import { chromium } from 'playwright-core'; import fs from 'fs';
const env=JSON.parse(fs.readFileSync(process.argv[2])).environment.find(e=>e.type==='latest');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c = await b.newContext({ viewport:{width:1440,height:900} });
await c.route(/googletagmanager\.com\/gtm\.js\?id=GTM-TD7C9Z42/, r=>{ const u=r.request().url()+`&gtm_auth=${env.authorizationCode}&gtm_preview=env-${env.environmentId}&gtm_cookies_win=x`; r.continue({url:u}); });
const p = await c.newPage(); let hits=[];
p.on('request', r=>{const u=r.url(); if(/clarity\.ms\/tag|c\.clarity\.ms|g\/collect|gtm\.js/.test(u)) hits.push(u.slice(8,60)+(u.includes('gtm_preview')?' [VERSION TEST]':''));});
const step=async(t,l)=>{await p.waitForTimeout(t); console.log(l, hits.splice(0).join(' ; '));};
await p.goto('https://orem.webflow.io/',{waitUntil:'load'}); await step(5000,'1. arrivée, sans choix :');
await p.mouse.wheel(0,300); await p.waitForTimeout(3500); await p.getByText('OK pour moi').click(); await step(4000,'2. après « OK pour moi » :');
await p.goto('https://orem.webflow.io/a-propos',{waitUntil:'load'}); await step(5000,'3. page suivante (consentement déjà donné) :');
const c2 = await b.newContext(); await c2.route(/googletagmanager\.com\/gtm\.js\?id=GTM-TD7C9Z42/, r=>r.continue({url:r.request().url()+`&gtm_auth=${env.authorizationCode}&gtm_preview=env-${env.environmentId}&gtm_cookies_win=x`}));
const p2=await c2.newPage(); let h2=[]; p2.on('request',r=>{if(/clarity/.test(r.url())) h2.push(r.url().slice(8,50))});
await p2.goto('https://orem.webflow.io/',{waitUntil:'load'}); await p2.waitForTimeout(3000); await p2.mouse.wheel(0,300); await p2.waitForTimeout(3500); await p2.getByText('Non merci').click(); await p2.waitForTimeout(4000);
console.log('4. autre visiteur, « Non merci » : clarity =', h2.length? h2.join(' ; ') : 'aucune requête');
await b.close();
