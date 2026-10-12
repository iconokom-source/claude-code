# Ce qu'il me manque : checklist de l'audit

À passer en phase 0 et à compléter pendant tout le projet. Chaque point manquant reçoit : **une solution de repli appliquée tout de suite** (le projet continue) et **l'action attendue de l'utilisateur**. Classer par priorité :

- 🔴 **Bloquant pour la mise en ligne** : le site ne peut pas être publié en l'état.
- 🟠 **Important** : le site fonctionne, mais un élément est approximatif ou provisoire.
- ⚪ **Confort** : amélioration conseillée.

| Point à vérifier | Repli si absent | Priorité si absent |
|---|---|---|
| Polices disponibles (Google Fonts ou fichiers woff2 + licence web) | Police de repli proche dans la variable | 🔴 |
| Maquette tablette / mobile | Déduction selon `responsive.md` | ⚪ (normal, pas un manque) |
| États hover, focus, actif des boutons, liens, cartes, champs | États standard déduits (assombrir de 10 %, soulignement, contour de focus) | 🟠 |
| Variables ou styles Figma | Variables déduites des valeurs | ⚪ |
| Incohérences de valeurs (tailles ou couleurs quasi identiques) | Normalisation, liste des fusions | ⚪ |
| Images en haute définition (×2) ou exportables | Image disponible, signalée | 🟠 |
| Icônes en vectoriel (SVG) | Export PNG ×2 | 🟠 |
| Logo SVG (clair et foncé si les deux fonds existent) | Version disponible | 🔴 |
| Favicon (32×32) et webclip (256×256) | Aucun | 🟠 |
| Image de partage (Open Graph, 1200×630) | Aucun | 🟠 |
| Contenu réel (pas de lorem ipsum) | Contenu de la maquette, signalé | 🔴 si lorem |
| Destinations des liens et boutons (pages, URL externes, ancres) | `#` + liste des liens à compléter | 🔴 |
| Pages liées mais absentes de la maquette (mentions légales, politique de confidentialité, 404, CGV) | Page créée avec une mise en page simple à partir des composants | 🔴 pour les pages légales |
| Page détail d'une collection CMS | Page modèle simple (voir `cms.md`) | 🟠 |
| Formulaires : destinataire des e-mails, messages de succès et d'erreur, champs obligatoires, RGPD (case de consentement, mention) | Messages par défaut en français | 🔴 |
| Menu mobile dessiné | Menu déduit | ⚪ |
| Contenu CMS : nombre réel d'éléments, textes longs pour tester | Éléments de la maquette + texte d'exemple | 🟠 |
| SEO : titres et descriptions des pages | Déduits du contenu | 🟠 |
| Bandeau cookies, outils de mesure (Analytics, Tag Manager) | Aucun | 🔴 si mesure d'audience prévue |
| Langue du site, domaine | Français | ⚪ |
| Contrastes insuffisants (accessibilité AA) | Signalé avec la correction proposée, design conservé | 🟠 |
| Intentions d'animation | Questionnaire de la phase 10 | ⚪ |
| Plan Webflow compatible (nombre de collections, champs, pages CMS) | Signalé | 🔴 si dépassement |

Formulation dans le rapport : une ligne par point, **verbe d'action en premier**, précise et vérifiable.
- ✅ « Envoyer les fichiers woff2 de la police Satoshi (400, 500, 700) avec la licence web. »
- ❌ « Polices manquantes. »
