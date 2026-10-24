# Mode 1 — Audit complet (lecture seule)

Aucune écriture sur Webflow pendant l'audit. Le résultat : un rapport chiffré et une liste de modifications numérotées, classées par gain et risque, prêtes à être validées une par une.

L'audit est long : avancer phase par phase, enregistrer les résultats bruts dans le scratchpad, et écrire l'avancement dans `site-orem/journal.md` à la fin de chaque phase pour pouvoir reprendre dans une autre session. Pour aller plus vite, les phases B et C peuvent être réparties entre des sous-agents (un par groupe de pages), chacun avec son propre `agent_id` et le même `session_id`, qui rendent un inventaire structuré.

## Accès réseau nécessaire pour la mesure

La mesure réelle (phase D) a besoin d'atteindre : `agence-orem.fr`, `www.agence-orem.fr`, `orem.webflow.io`, `cdn.prod.website-files.com`, `assets-global.website-files.com`, `www.googletagmanager.com`, `app.iclosed.io`, `fonts.googleapis.com`, `fonts.gstatic.com`, `www.googleapis.com` (API PageSpeed), plus les domaines tiers trouvés dans le code. Tester d'abord avec `curl -sS -o /dev/null -w "%{http_code}" https://www.agence-orem.fr/`. Si le proxy répond 403 : demander d'ajouter ces domaines dans l'accès réseau de l'environnement cloud (menu de l'environnement > Modifier > Accès réseau), et faire en attendant les phases A à C, qui passent par le MCP.

## Phase A — Contexte

1. `get_site` : domaines, locales, dernière publication.
2. `list_pages` (toutes, pagination), `get_collection_list` puis `get_collection_details` pour chaque collection (champs, nombre d'items via `list_collection_items` `limit:1`).
3. Si disponible : `data_analyze_tool > get_top_pages_report` sur 90 jours pour savoir quelles pages comptent le plus. Les optimisations commencent par elles.
4. Veille : vérifier les nouveautés Webflow des derniers mois touchant la performance et les interactions (sources officielles), noter dans le journal.

## Phase B — Inventaire du custom code (le cœur de l'audit)

Pour chaque morceau de code, où qu'il soit :

| Où chercher | Comment |
|---|---|
| Code global head / footer | `get_site_freeform_code` |
| Scripts appliqués au site | `get_site_scripts` |
| Scripts enregistrés | `get_registered_scripts` puis télécharger la source des hébergés (`curl` sur `hostedLocation`) |
| Code de chaque page | `get_page_freeform_code` + `get_page_scripts` pour **chaque** page (pages modèles CMS comprises) |
| Embeds dans les pages et composants | `query_elements` avec `element_filter.type: "HtmlEmbed"` (et `DOM`) sur chaque page, puis `get_settings` |
| Code dans des champs CMS riches | repérer les embeds dans les champs RichText des articles |

Découper chaque bloc en unités (un `<style>`, un `<script>`, une bibliothèque) et remplir pour chacune une ligne du **registre du code** (`site-orem/audits/registre-code-<date>.md`) :

`ID | emplacement | type (CSS/JS/lib/tracking) | taille (octets, gzip estimé) | ce que ça fait | pages concernées | sélecteurs et data-* visés | ces éléments existent-ils ? | dépendances (GSAP, jQuery, Finsweet…) | bloquant le rendu ? | doublon de | remplaçable par (natif / CSS / à garder) | risque`

Contrôles à faire sur ce registre :
- **Code mort** : sélecteurs ou `data-*` absents de toutes les pages, scripts enregistrés jamais appliqués, versions remplacées (V1…V8 quand V9 est appliquée).
- **Code chargé partout mais utile sur une page** : à déplacer au niveau de la page.
- **Doublons** : même bibliothèque chargée deux fois, deux versions d'un même script, CSS qui redéfinit ce que fait déjà une classe Webflow.
- **CSS inline dans le head** : peut-il devenir des classes Webflow (servies dans le CSS du site, mis en cache) ?
- **Bibliothèques** : version, poids, chargement (`async`/`defer`/module), utilité réelle.
- **Tiers** (GTM et ce qu'il charge, iClosed, polices externes, vidéos) : poids et moment de chargement.

## Phase C — Structure Webflow

Pour chaque page (en commençant par les plus visitées) :
- Arbre d'éléments (`get_all_elements`, profondeur adaptée) : nombre d'éléments, profondeur, wrappers inutiles, éléments masqués (`display:none`) mais chargés, sections dupliquées au lieu de composants.
- Sémantique : un seul `h1`, hiérarchie des titres, `section`/`nav`/`main`/`footer`, liens et boutons réels, textes alternatifs.
- Images : format (WebP/AVIF ?), dimensions réelles vs affichées, poids (`data_assets_tool`), chargement lazy/eager, image du haut de page (LCP) en lazy par erreur, images de fond CSS (pas de `srcset`) qui devraient être des `<img>`.
- Vidéos : poids, autoplay, poster, chargement hors écran.
- Interactions existantes (`list_interactions`) et animations faites en JS qui pourraient passer en IX3.
- Classes (`get_styles` filtré) : doublons, classes inutilisées, valeurs en dur au lieu de variables, convention de nommage. Noter la convention réelle dans `references/site.md`.
- Composants : lesquels existent, lesquels devraient l'être.
- CMS : listes de collection trop longues sans pagination, listes imbriquées, images CMS non optimisées.
- Polices (`data_fonts_tool`) : nombre de fichiers et de graisses, format, `font-display`.
- SEO technique : titres, descriptions, Open Graph, JSON-LD, canonical, sitemap, redirections, 404.

## Phase D — Mesure réelle

Pour les pages principales (accueil, réalisations, une réalisation, une offre, blog, un article, contact, agence web Lille), en mobile et en desktop :
1. **Lighthouse** en local avec le Chromium préinstallé : `npx -y lighthouse <url> --chrome-path=/opt/pw-browsers/chromium… --form-factor=mobile --output=json --output-path=…` (chercher le binaire exact sous `/opt/pw-browsers`). Trois passages, garder la médiane.
2. **PageSpeed Insights API** pour les données terrain (CrUX) si une clé Google est disponible (skill `cles-api`) ; sans clé, l'API répond vite 429.
3. **Playwright** : liste des requêtes (domaine, type, poids transféré, moment), poids total par type, scripts longs (Long Tasks), erreurs console, captures à 1440 / 991 / 767 / 390 px. Ces captures servent de référence visuelle pour toutes les modifications futures : les garder dans `site-orem/audits/captures-<date>/` (pas dans git si trop lourdes ; dans ce cas le scratchpad et le dire).
4. Indicateurs à relever : LCP, CLS, INP (ou TBT en laboratoire), FCP, poids total, poids JS, poids CSS, nombre de requêtes, requêtes tierces, temps de blocage du rendu.

## Phase E — Rapport

Écrire `site-orem/audits/audit-<AAAA-MM-JJ>.md`, puis proposer d'en faire une page Artifact privée pour le partager à l'équipe.

Structure :
1. **Synthèse** (10 lignes) : scores actuels, les 3 causes principales de lenteur, gain réaliste attendu.
2. **Mesures** : tableau page × indicateur (mobile et desktop).
3. **Carte du custom code** : résumé du registre (poids par emplacement, code mort, doublons).
4. **Constats et recommandations**, numérotés `P-01`, `P-02`… Chaque fiche :
   - Constat (avec preuve : extrait de code, octets, ms, capture)
   - Impact (quel indicateur, combien)
   - Proposition (natif Webflow / CSS / JS allégé / suppression / déplacement)
   - Risque de casse et ce qu'il faut vérifier
   - Retour arrière prévu
   - Effort (S / M / L) et priorité
5. **Plan d'action** : lots ordonnés. D'abord les gains sûrs sans changement visuel (code mort, déplacement page par page, `defer`, images), puis les remplacements par du natif, puis les refontes.
6. **Hors performance** : problèmes SEO, accessibilité, maintenabilité relevés au passage.

Mettre à jour `site-orem/journal.md` (audit fait, lien du rapport, liste des P-xx avec statut « à valider »), committer et pousser.
