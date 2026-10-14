/* Construit une démo autonome (un seul fichier HTML, données d'exemple en mémoire, aucun serveur).
   node build-demo.js  →  dist/espace-client-demo.html */
const fs = require('node:fs');
const path = require('node:path');
const pub = (f) => path.join(__dirname, 'public', f);
const b64 = (f, type) => `data:${type};base64,${fs.readFileSync(pub(f)).toString('base64')}`;

const css = fs.readFileSync(pub('styles.css'), 'utf8')
  .replace('url(assets/fonts/trykker-latin.woff2)', `url(${b64('assets/fonts/trykker-latin.woff2', 'font/woff2')})`)
  .replace('url(assets/fonts/lexend-deca-latin.woff2)', `url(${b64('assets/fonts/lexend-deca-latin.woff2', 'font/woff2')})`);
const html = fs.readFileSync(pub('index.html'), 'utf8');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script src="core.js">'));
const img = { logo: b64('assets/logo-black.png', 'image/png'), louis: b64('assets/louis.jpg', 'image/jpeg'), theophile: b64('assets/theophile.jpg', 'image/jpeg'), clement: b64('assets/clement.jpg', 'image/jpeg') };

const out = `<title>Espace client Orem</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
${body}
<script>window.DEMO = true; window.IMG = ${JSON.stringify(img)};</script>
<script>
${fs.readFileSync(pub('core.js'), 'utf8')}
</script>
<script>
${fs.readFileSync(pub('app.js'), 'utf8')}
</script>
`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const dest = path.join(__dirname, 'dist', 'espace-client-demo.html');
fs.writeFileSync(dest, out);
console.log(dest, Math.round(out.length / 1024) + ' Ko');
