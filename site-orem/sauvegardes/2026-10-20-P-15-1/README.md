# P-15 étape 1 — retrait du préchargement du logo animé du footer

Pages : Accueil (`6a7582333b9ddd4a77302d08`) et Agence web Lille (`6ac61124af8e2047b4ff8271`), bloc **head** du code de page.

- `avant-head-accueil.html`, `avant-head-lille.html` : contenu exact avant modification (vérifié identique au HTML publié le 2026-10-20).
- `apres-head-*.html` : contenu envoyé (seule la ligne `<link rel="preload" … logo-orem-anime-transparent-hq.webp … fetchpriority="high">` est retirée).

Restaurer : `data_scripts_tool > set_page_freeform_code` (location `head`) avec le contenu `avant-head-*.html`, puis publier.
