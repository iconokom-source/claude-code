// Captures prod vs orem.webflow.io (polices du sous-domaine servies depuis la sauvegarde : le domaine fastly est bloqué dans la session). Comparer ensuite avec PIL.
import { chromium } from 'playwright-core'; import fs from 'fs';
const D='/home/user/claude-code/site-orem/sauvegardes/2026-10-23-polices/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const HIDE='[id^=axeptio],[class*=axeptio],video,iframe{visibility:hidden!important} *{animation:none!important;transition:none!important;caret-color:transparent!important}';
for (const pg of ['mentions-legales','contact','a-propos','']) for (const w of [1440,768,390]) for (const [n,host] of [['prod','https://www.agence-orem.fr/'],['sd','https://orem.webflow.io/']]) {
 const c = await b.newContext({ viewport:{width:w,height:900} });
 await c.route(/fastly\.net\/.*\/fonts\//, r => r.fulfill({status:200,contentType:'font/woff2',body:fs.readFileSync(D+(r.request().url().includes('Lexend')?'LexendDeca-latin.woff2':'Trykker-latin.woff2'))}));
 const p = await c.newPage(); await p.goto(host+pg,{waitUntil:'load'}); await p.waitForTimeout(3500); await p.addStyleTag({content:HIDE}); await p.waitForTimeout(500);
 await p.screenshot({path:`polices/px-${n}-${pg||'accueil'}-${w}.png`}); await c.close(); }
await b.close();
