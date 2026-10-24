// Tests P-01 : modale projets + pages projets référençables.
// Usage : node modale-seo.mjs <base-url> [largeur]
import { chromium } from 'playwright-core';

const base = process.argv[2] || 'https://orem.webflow.io';
const width = +(process.argv[3] || 1440);
const mobile = width < 500;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const out = [];
const ok = (name, cond, detail = '') => out.push(`${cond ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
const newPage = async (js = true) => {
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, javaScriptEnabled: js });
  return ctx.newPage();
};
const state = (page) => page.evaluate(() => {
  const m = document.querySelector('[data-project-modal]');
  const c = document.querySelector('[data-project-modal-content]');
  return { path: location.pathname + location.search, open: !!m && m.classList.contains('is-open'), h1InModal: (c && c.querySelector('h1') && c.querySelector('h1').textContent.trim()) || null, scrollY: Math.round(scrollY) };
});

// 1. Depuis l'accueil et la page Réalisations : ouvrir, flèches, fermer -> on reste sur la page
for (const from of ['/', '/realisations']) {
  const page = await newPage();
  await page.goto(base + from, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const trig = page.locator('[data-modal-trigger][href^="/realisations/"]').first();
  await trig.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const before = await state(page);
  await trig.click();
  await page.waitForTimeout(2000);
  const opened = await state(page);
  ok(`${from} : la modale s'ouvre sur un projet`, opened.open && opened.path.startsWith('/realisations/') && !!opened.h1InModal, JSON.stringify(opened));
  await page.locator('[data-project-modal-content] .change-modale.suivant').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  const next = await state(page);
  ok(`${from} : la flèche « suivant » change de projet`, next.open && next.path !== opened.path && next.h1InModal !== opened.h1InModal, `${opened.h1InModal} → ${next.h1InModal}`);
  await page.locator('[data-project-modal-content] .close-modale').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  const closed = await state(page);
  ok(`${from} : la croix ferme et on reste sur ${from}`, !closed.open && closed.path === from && Math.abs(closed.scrollY - before.scrollY) < 50, JSON.stringify(closed));
  await page.context().close();
}

// 2. Arrivée directe sur une page projet
for (const slug of ['huchet-demorge', 'le-crayon']) {
  const url = `${base}/realisations/${slug}`;
  // a) sans JavaScript (ce que lit un robot sans rendu)
  const raw = await newPage(false);
  const res = await raw.goto(url, { waitUntil: 'load' });
  const seo = await raw.evaluate(() => ({
    h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
    canonical: document.querySelector('link[rel=canonical]')?.href,
    title: document.title,
    htmlHidden: getComputedStyle(document.documentElement).visibility === 'hidden',
    redirectScript: [...document.scripts].some((s) => /\/\?p=/.test(s.textContent)),
  }));
  ok(`/realisations/${slug} : HTTP 200, un seul h1, canonique, pas de masquage ni de redirection`, res.status() === 200 && seo.h1.length === 1 && /\/realisations\//.test(seo.canonical || '') && !seo.htmlHidden && !seo.redirectScript, JSON.stringify(seo));
  await raw.context().close();
  // b) avec JavaScript (visiteur, Google avec rendu)
  const page = await newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const st = await state(page);
  const visible = await page.evaluate(() => { const h = document.querySelector('[data-project-modal-content] h1'); if (!h) return false; const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(document.documentElement).visibility !== 'hidden'; });
  ok(`/realisations/${slug} : l'adresse reste la même et le projet est affiché dans le panneau`, st.path === `/realisations/${slug}` && st.open && visible, JSON.stringify(st));
  await page.locator('[data-project-modal-content] .change-modale.suivant').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  const n = await state(page);
  ok(`/realisations/${slug} : la flèche « suivant » change de projet`, n.open && n.path !== st.path && n.path.startsWith('/realisations/'), `${st.path} → ${n.path}`);
  await page.locator('[data-project-modal-content] .close-modale').first().click().catch(() => {});
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  const c = await state(page);
  const vraieAccueil = await page.evaluate(() => !document.querySelector('.projet-statique'));
  ok(`/realisations/${slug} : la croix ferme et mène au vrai accueil (pas de faux fond)`, !c.open && c.path === '/' && vraieAccueil, JSON.stringify(c));
  await page.context().close();
}
await browser.close();
console.log(out.join('\n'));
