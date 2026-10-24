# P-02 — 2026-10-21 : préchargement à l'intention

Code global du site, bloc footer (freeform).
- `avant-site-footer.html` : 46 415 caractères (identique à `audits/code-2026-10-20/site-footer.html` et au HTML publié avant l'opération).
- `apres-site-footer.html` : 46 490 caractères ; seul le bloc « Préchargement » change (voir `propositions/P-02-avant.js` → `P-02-apres.js`).
Vérification : le HTML publié sur orem.webflow.io contient exactement `apres-site-footer.html` (comparaison caractère par caractère).
Retour arrière : réécrire `avant-site-footer.html` dans le bloc footer du site (set_site_freeform_code), publier.
