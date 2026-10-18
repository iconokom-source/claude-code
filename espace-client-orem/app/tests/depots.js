/* Dépôts sans limite : gros fichier par morceaux avec reprise, dossier entier avec ses sous-dossiers,
   une seule notification par dossier, export ZIP64. node tests/depots.js [dossier] (serveur sur le port 3123, données neuves) */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const B = 'http://127.0.0.1:3123', OUT = process.argv[2] || os.tmpdir();
const R = []; const ok = (l, v, x) => R.push(`${v ? '✔' : '✘'} ${l}${!v && x ? ' → ' + x : ''}`);
(async () => {
  const br = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const errs = [];
  async function login(email) {
    const p = await (await br.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(B); await p.fill('#em', email); await p.locator('form[data-form=login]').evaluate((f) => f.requestSubmit());
    await p.waitForSelector('.devcode b'); await p.fill('#o1', await p.textContent('.devcode b')); await p.locator('form[data-form=verify]').evaluate((f) => f.requestSubmit());
    await p.waitForSelector('#main'); await p.waitForTimeout(300); if (await p.$('.ob')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
    return p;
  }
  const claire = await login('claire@maisonlumen.fr');
  // 1. Envoi par morceaux, coupure simulée au milieu, reprise au bon endroit
  const big = await claire.evaluate(async () => {
    const H = { 'Content-Type': 'application/json', 'X-Orem': '1' }, size = 70 * 1024 * 1024;
    const blob = new Blob([new Uint8Array(size).map((_, i) => i % 251)]);
    const st = await (await fetch('/api/projects/p_lumen/uploads', { method: 'POST', headers: H, body: JSON.stringify({ name: 'Film de marque (rush).mov', size, cat: 'Vidéos' }) })).json();
    const put = (off, b) => fetch(`/api/uploads/${st.id}?offset=${off}`, { method: 'PUT', headers: { 'X-Orem': '1' }, body: b });
    const C = 32 * 1024 * 1024;
    const r1 = await (await put(0, blob.slice(0, C))).json();
    const wrong = await put(0, blob.slice(0, C));               // la connexion a coupé, le navigateur renvoie le même morceau
    const status = await (await fetch('/api/uploads/' + st.id)).json();
    let off = status.received, last;
    while (off < size) { last = await (await put(off, blob.slice(off, Math.min(size, off + C)))).json(); off = last.received; }
    return { r1: r1.received, wrong: wrong.status, resume: status.received, done: !!(last && last.done), name: last && last.file && last.file.name, size: last && last.file && last.file.size };
  });
  ok('Gros fichier : le serveur reprend au bon endroit après une coupure (409 puis reprise)', big.wrong === 409 && big.resume === big.r1, JSON.stringify(big));
  ok('Gros fichier : 70 Mo enregistrés en entier', big.done && big.size === 70 * 1024 * 1024, JSON.stringify(big));
  const db = () => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'db.json'), 'utf8'));
  await claire.waitForTimeout(400);
  const rec = db().projects.find((p) => p.id === 'p_lumen').files.find((f) => f.name === 'Film de marque (rush).mov');
  ok('Gros fichier : identique octet pour octet sur le disque', rec && fs.statSync(path.join(__dirname, '..', 'data', rec.path)).size === 70 * 1024 * 1024);
  // 2. Gros fichier par l'interface (bascule automatique sur l'envoi par morceaux)
  await claire.evaluate(() => document.querySelector('[data-go=fichiers]').click()); await claire.waitForTimeout(300);
  await claire.setInputFiles('#file-in', { name: 'Photos HD.zip', mimeType: 'application/zip', buffer: Buffer.alloc(40 * 1024 * 1024, 7) });
  await claire.waitForFunction(() => /Photos HD\.zip/.test(document.querySelector('#main').innerText) && !document.querySelector('.up-state'), null, { timeout: 60000 });
  ok('Interface : un fichier de 40 Mo part par morceaux et apparaît dans la liste', true);
  // 3. Dossier entier avec sous-dossiers (fichiers système ignorés)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orem-')), root = path.join(dir, 'Photos atelier');
  fs.mkdirSync(path.join(root, 'Portraits'), { recursive: true });
  fs.writeFileSync(path.join(root, 'facade.jpg'), Buffer.alloc(2000, 1)); fs.writeFileSync(path.join(root, 'Portraits', 'claire.jpg'), Buffer.alloc(3000, 2)); fs.writeFileSync(path.join(root, '.DS_Store'), 'x');
  await claire.waitForTimeout(800);
  const before = db().notifications.length;
  await claire.setInputFiles('#dir-in', root);
  await claire.waitForFunction(() => /claire\.jpg/.test(document.querySelector('#main').innerText) && !document.querySelector('.up-state'), null, { timeout: 30000 });
  await claire.screenshot({ path: OUT + '/depot-dossier.png', fullPage: true });
  await claire.waitForTimeout(600);
  const files = db().projects.find((p) => p.id === 'p_lumen').files;
  ok('Dossier : les sous-dossiers sont conservés', files.some((f) => f.name === 'claire.jpg' && f.folder === 'Photos atelier/Portraits') && files.some((f) => f.name === 'facade.jpg' && f.folder === 'Photos atelier'), JSON.stringify(files.filter((f) => f.folder).map((f) => f.folder + '/' + f.name)));
  ok('Dossier : les fichiers système (.DS_Store) sont ignorés', !files.some((f) => f.name === '.DS_Store'));
  const notes = db().notifications.slice(0, db().notifications.length - before).filter((n) => n.userId === 'u_louis');
  ok('Dossier : une seule notification pour Louis', notes.length === 1 && /dossier «\sPhotos atelier\s» \(2 fichiers/.test(notes[0].text), JSON.stringify(notes.map((n) => n.text)));
  ok('Liste : le dossier s’affiche sur chaque fichier', /Photos atelier › Portraits/.test(await claire.locator('#main').innerText()));
  // 4. Export ZIP64 de l'espace, relu par deux outils
  const louis = await login('louis@agence-orem.fr');
  const zipPath = path.join(dir, 'export.zip');
  const resp = await louis.context().request.get(B + '/api/projects/p_lumen/export', { timeout: 120000 });
  fs.writeFileSync(zipPath, await resp.body());
  let py = ''; try { py = execFileSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip() or "ok");print("\\n".join(z.namelist()))', zipPath]).toString(); } catch (e) { py = String(e); }
  ok('Export ZIP64 : archive valide (Python)', /^ok/.test(py) && /Fichiers déposés\/Photos atelier\/Portraits\/claire\.jpg/.test(py), py.slice(0, 300));
  let uz = ''; try { uz = execFileSync('unzip', ['-t', zipPath]).toString(); } catch (e) { uz = String(e.stdout || e); }
  ok('Export ZIP64 : archive valide (unzip)', /No errors detected/.test(uz), uz.slice(-200));
  ok('Aucune erreur JavaScript', !errs.length, errs.join(' | '));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(R.join('\n')); await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
