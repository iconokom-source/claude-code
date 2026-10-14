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

const hd = Object.fromEntries(fs.readdirSync(pub('assets/hd')).map((f) => ['assets/hd/' + f, b64('assets/hd/' + f, 'image/jpeg')]));

const inner = `<title>Espace client Orem</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
${body}
<script>window.DEMO = true; window.IMG = ${JSON.stringify(img)}; window.ASSETS = ${JSON.stringify(hd)};</script>
<script>
${fs.readFileSync(pub('core.js'), 'utf8')}
</script>
<script>
${fs.readFileSync(pub('app.js'), 'utf8')}
</script>
`;
// Version autonome (à ouvrir telle quelle) : doctype, langue et viewport, sinon mode quirks et 980 px sur mobile.
const out = `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">\n${inner.replace('</style>', '</style>\n</head>\n<body>')}</body>\n</html>\n`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const dest = path.join(__dirname, 'dist', 'espace-client-demo.html');
fs.writeFileSync(dest, out);
// Fragment pour l'artifact privé : le lecteur ajoute lui-même doctype, head et body.
fs.writeFileSync(path.join(__dirname, 'dist', 'espace-client-artifact.html'), inner);
console.log(dest, Math.round(out.length / 1024) + ' Ko');
