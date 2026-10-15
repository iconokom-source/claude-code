/* Fabrique les bilans mensuels d'exemple (PDF 16:9, DA Orem) à partir des données de démonstration :
   node tools/bilans-exemple.js → public/assets/bilans/<client>-<mois>.pdf
   Même structure que les bilans présentés en visio : couverture, l'essentiel du mois, le travail réalisé. */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const Core = require('../public/core.js');
const PUB = path.join(__dirname, '..', 'public'), OUT = path.join(PUB, 'assets', 'bilans');
const b64 = (f) => fs.readFileSync(path.join(PUB, f)).toString('base64');
const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const mois = (m) => { const [y, n] = m.split('-').map(Number); return `${MOIS[n - 1]} ${y}`; };
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function html(p, r) {
  const next = mois(new Date(Date.UTC(+r.month.slice(0, 4), +r.month.slice(5, 7), 1)).toISOString().slice(0, 7));
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
@font-face{font-family:T;src:url(data:font/woff2;base64,${b64('assets/fonts/trykker-latin.woff2')}) format('woff2')}
@font-face{font-family:L;font-weight:100 900;src:url(data:font/woff2;base64,${b64('assets/fonts/lexend-deca-latin.woff2')}) format('woff2')}
@page{size:1920px 1080px;margin:0}*{box-sizing:border-box;margin:0}body{font-family:L;color:#000012}
.pg{width:1920px;height:1080px;position:relative;overflow:hidden;page-break-after:always;padding:72px 64px}
.cover{background:radial-gradient(120% 90% at 85% 10%,#f4f8fb 0,#9fc7e4 22%,#2a63b8 45%,#081a4a 70%,#000012 100%);color:#fff}
.cover .by{font-size:20px;line-height:1.3}.cover img{position:absolute;right:64px;top:60px;width:118px}
.cover .k{position:absolute;left:64px;bottom:300px;color:#ff6200;font-size:24px}
.cover h1{position:absolute;left:64px;bottom:170px;font-family:T;font-weight:400;font-size:112px;line-height:1}
.cover p{position:absolute;left:64px;bottom:56px;font-size:24px;max-width:1320px;line-height:1.35}
.k2{color:#092482;font-size:20px}.big{font-family:T;font-weight:400;font-size:72px;line-height:1.1;margin-top:28px;max-width:800px}
.grid{display:grid;grid-template-columns:840px 1fr;gap:64px;height:100%}
.stats{display:grid;gap:44px;align-content:start;padding-top:56px}
.st{display:grid;grid-template-columns:380px 1fr;border-left:1.5px solid #000012;padding-left:48px}
.st .v{font-family:T;font-size:84px;line-height:1}.st .l{font-family:T;font-size:40px}.st .d{color:#888;font-size:20px;margin-top:6px}.st .d b{color:#092482;font-weight:500}
.notes{position:absolute;left:64px;bottom:64px;display:grid;gap:30px;max-width:780px}.notes p{border-left:1.5px solid #000012;padding-left:42px;font-size:24px;line-height:1.3}
.done{display:grid;gap:64px;align-content:start;padding-top:8px}.done>div{border-left:1.5px solid #000012;padding-left:64px}
.done .n{font-family:T;color:#092482;font-size:34px}.done h3{font-family:T;font-weight:400;font-size:40px;margin:14px 0 8px}.done p{color:#888;font-size:22px;line-height:1.35}
.foot{position:absolute;left:64px;bottom:64px;font-family:T;font-size:40px;max-width:720px;line-height:1.25}
</style><body>
<section class="pg cover"><div class="by">Préparé par Orem pour ${esc(p.client)}<br>${cap(mois(r.at.slice(0, 7)))}</div><img src="data:image/png;base64,${b64('assets/logo-white.png')}" alt="">
<div class="k">Évolution · ${cap(mois(r.month))}</div><h1>${esc(p.client)}</h1><p>${esc(r.summary)}</p></section>
<section class="pg"><div class="grid"><div><div class="k2">L’essentiel du mois · ${mois(r.month)}</div><h2 class="big">${esc(r.title)}</h2></div>
<div class="stats">${r.stats.map(([v, l, d]) => `<div class="st"><div class="v">${esc(v)}</div><div><div class="l">${esc(l)}</div>${d ? `<div class="d"><b>${esc(d)}</b></div>` : ''}</div></div>`).join('')}</div></div>
<div class="notes">${[r.summary].map((t) => `<p>${esc(t)}</p>`).join('')}</div></section>
<section class="pg"><div class="grid"><div><div class="k2">Le travail réalisé</div><h2 class="big">Ce qui a avancé en ${mois(r.month).split(' ')[0]}</h2></div>
<div class="done">${r.done.map(([t, d], i) => `<div><div class="n">${String(i + 1).padStart(2, '0')}</div><h3>${esc(t)}</h3><p>${esc(d || '')}</p></div>`).join('')}</div></div>
<p class="foot">On en parle ensemble à la visio de ${next.split(' ')[0]}.</p></section></body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const pg = await br.newPage();
  for (const p of Core.seed().projects) for (const r of (p.evo && p.evo.reports) || []) {
    const slug = p.client.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
    await pg.setContent(html(p, r), { waitUntil: 'load' });
    const f = path.join(OUT, `${slug}-${r.month}.pdf`);
    fs.writeFileSync(f, await pg.pdf({ width: '1920px', height: '1080px', printBackground: true }));
    console.log(path.relative(PUB, f), Math.round(fs.statSync(f).size / 1024) + ' Ko');
  }
  await br.close();
})();
