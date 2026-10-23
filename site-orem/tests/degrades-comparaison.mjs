import { chromium } from 'playwright-core';
import fs from 'fs';
const CSS = fs.readFileSync(process.argv[2], 'utf8');
const widths = (process.argv[3] || '1440,768,390').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const HIDE = `.hero-container-section > *:not(.home-gradient-crop):not(.degrade-hero){visibility:hidden!important} .hero-container-section ~ *, .navbar-logo-left-container,#axeptio_overlay,.axeptio_mount,[class*=footer],[id^=axeptio],[class*=axeptio]{visibility:hidden!important}`;
for (const [pg, H] of [['agence-web-lille', 2310]]) for (const w of widths) for (const [v, host] of [['prod', 'https://www.agence-orem.fr/'], ['proto', 'https://orem.webflow.io/']]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(host + pg, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  await p.addStyleTag({ content: HIDE + (v === 'proto' ? CSS : '') }); await p.waitForTimeout(600);
  await p.screenshot({ path: `lot2chk/f-${v}-${pg || 'accueil'}-${w}.png`, fullPage: true, clip: { x: 0, y: 0, width: w, height: H } });
  await p.close();
}
await b.close();
