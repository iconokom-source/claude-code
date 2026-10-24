import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const pg of ['', 'agence-web-lille', 'a-propos', 'realisations', 'contact', 'offres/site-web']) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; const vids = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => { if (['media'].includes(r.resourceType()) || /\.(mp4|webm)/.test(r.url())) vids.push(r.url().split('/').pop().slice(0, 45)); });
  await p.goto('https://orem.webflow.io/' + pg, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const atLoad = [...vids];
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
  await p.waitForTimeout(2500);
  const st = await p.evaluate(() => [...document.querySelectorAll('video')].map(v => (v.id || v.parentElement.className).slice(0, 25) + ':' + (v.paused ? 'pause' : 'lecture') + ':' + v.readyState));
  console.log(pg || 'accueil', '| au chargement:', atLoad.length, atLoad.join(' '), '| après défilement:', vids.length, '| états:', st.join(' '), '| erreurs:', errs.length);
  await p.close();
}
await b.close();
