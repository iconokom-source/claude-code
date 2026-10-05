// Rendu d'un document Orem : captures PNG par slide, contrôle de débordement, export PDF.
// Usage : FILE=/abs/index.html OUT=/abs/dossier-captures [PDF=/abs/sortie.pdf] node render.js [slides "1,4,7"] [pdf]
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args:['--no-sandbox']}).catch(()=>chromium.launch());
  const p = await b.newPage({viewport:{width:1968,height:1200}});
  await p.goto('file://'+process.env.FILE, {waitUntil:'networkidle'});
  await p.addStyleTag({content:'.pdf-btn{display:none}'}); await p.evaluate(()=>document.fonts.ready);
  const slides = await p.$$('.slide');
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  if (process.env.OUT) for (let i=0;i<slides.length;i++){ if(only && !only.includes(i+1)) continue;
    await slides[i].screenshot({path: process.env.OUT+`/s${String(i+1).padStart(2,'0')}.png`}); }
  const issues = await p.evaluate(()=>{const out=[];document.querySelectorAll('.slide').forEach((s,i)=>{const r=s.getBoundingClientRect();s.querySelectorAll('*').forEach(e=>{const q=e.getBoundingClientRect(); if(q.width&&(q.bottom>r.bottom+1||q.right>r.right+1)&&e.tagName!=='IMG') out.push((i+1)+': '+e.tagName+' '+(e.textContent||'').trim().slice(0,40));}); s.querySelectorAll('p,h1,h2,h3,li,span').forEach(e=>{if(e.scrollHeight>e.clientHeight+2&&getComputedStyle(e).overflow!=='visible') out.push((i+1)+': texte rogné '+e.textContent.trim().slice(0,40));});});return out.slice(0,60)});
  const html = await p.content();
  const dash = (html.match(/[—–]/g)||[]).length;
  console.log(slides.length+' slides'); if (dash) console.log('ATTENTION : '+dash+' tiret(s) long(s) « — » ou « – » dans le document');
  console.log(issues.length ? issues.join('\n') : 'Aucun débordement détecté');
  if (process.argv[3]==='pdf' || process.argv[2]==='pdf') await p.pdf({path:process.env.PDF, width:'1920px', height:'1080px', printBackground:true, preferCSSPageSize:true});
  await b.close();
})();
