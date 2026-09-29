# Orem Content Desk

Outil interne de content management LinkedIn pour Orem. Les agents collectent des signaux
et produisent des briefs de posts structurés (tension, structure, preuves). Ils ne rédigent jamais.

- `cockpit/index.html` : interface publiée en Artifact claude.ai (charte Orem : Trykker, Lexend Deca, noir, bleu et orange Orem).
- Données : base partagée de l'artifact (collections `briefs`, `signaux`, `posts`, `piliers`, `sources`, `memoire`, `runs`).
- Piliers : TOF Visibilité, MOF Autorité, BOF Conversion, trois thèmes chacun.
- Connexions (via Composio) : Fireflies (verbatims), Google Analytics et Search Console (preuves clients), Webflow, LinkedIn (identité seulement, les stats passent par l'export natif importé dans l'outil).
