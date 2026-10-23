import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const HIDE='[id^=axeptio],[class*=axeptio],video,iframe,.logo-client-hero{visibility:hidden!important}';
for (const w of [1440,768,390]) for (const [n,h] of [['prod','https://www.agence-orem.fr/'],['sd','https://orem.webflow.io/']]) {
 const p=await (await b.newContext({viewport:{width:w,height:900}})).newPage(); await p.goto(h,{waitUntil:'load'}); await p.waitForTimeout(4500); await p.addStyleTag({content:HIDE}); await p.waitForTimeout(300);
 await p.screenshot({path:`polices/hero-${n}-${w}.png`}); }
await b.close();
