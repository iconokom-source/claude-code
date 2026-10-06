const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage();
for(const f of process.argv.slice(2)){await p.goto('file://'+f,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.emulateMedia({media:'print'});
await p.pdf({path:f.replace('.html','.pdf'),preferCSSPageSize:true,printBackground:true});console.log('pdf',f);}
await b.close();})();
