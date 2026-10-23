# Lien iClosed : /e/ICONOKOM/rdv-30min → /e/Orem/rdv-30min (2026-10-23)

Le lien a changé côté iClosed (compte renommé « Orem »). L'ancien lien affiche « This iClosed link is not valid » dans le calendrier de Contact.

## Avant
- Contact, HtmlEmbed `34dc8de7-faba-8e0f-4003-fe8ff60fab4c` (classe `iclosed-embed`) :
  `<div class="iclosed-widget" data-url="https://app.iclosed.io/e/ICONOKOM/rdv-30min" title="Rendez-vous de découverte 🚀" style="width: 100%; height: 620px"></div>` + script widget.js
- Composants : voir la suite de ce fichier.
- Composant « Animation Button CTA » (`f3cf7fbf-…`), élément `…d1074e` (bouton calendrier, `faq-icon-btn-outer`) : attribut `data-cta-href` = `https://app.iclosed.io/e/ICONOKOM/rdv-30min`, `data-cta-target=_blank`.
- Composant « footer » (`d1220ddf-…`) : liens `…fd80c` « Réserver un appel » et `…fd819` « Prendre RDV », URL ICONOKOM, nouvel onglet.
- Composant « footer-404 » (`9a9ec921-…`) : liens `…c93f` et `…c94c`, idem.

## Après
Les 7 emplacements pointent vers `https://app.iclosed.io/e/Orem/rdv-30min` (nouvel onglet conservé). Vérifié sur orem.webflow.io : 0 ancien lien sur les 38 adresses du plan du site, 124 liens au nouveau format. Suivi GTM `book_call` inchangé (déclencheur : liens contenant `iclosed.io`).
