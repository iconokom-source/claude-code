---
name: rapport-evolution
description: Produit le rapport mensuel de l'offre Évolution (le « M » d'O.R.E.M.) d'un site client géré par Orem, au format deck orem-da 16:9 : collecte GA4 et Search Console (plusieurs propriétés additionnées), audit de la mesure (gtag / Tag Manager / consentement / domaines croisés), analyses par agents spécialistes (GA4, SEO / GEO, mesure, stratégie, relecture), recommandations priorisées selon le niveau 1 ou 2, lecture de l'espace client Notion. À utiliser dès que Louis demande le « rapport Évolution », le « rapport du mois », le « reporting » ou la « préparation de la visio de pilotage » d'un client, ou les stats GA / Search Console / Tag Manager d'un site sous gestion.
---

# Rapport Évolution

Rôle de Claude : **collecter → consolider → faire analyser par les spécialistes → décider → mettre en page → contrôler → livrer**. La trame est fixe (`references/trame.md`) : seuls les chiffres, les constats et les recommandations changent d'un mois à l'autre.

Principe de l'offre : « Pas de mouvement sans lecture, pas de lecture sans mouvement. » Chaque constat débouche sur une décision, chaque recommandation s'appuie sur un chiffre.

Règles absolues :
- **Aucun chiffre hors de `kpi.json` ou `tracking.json`.** Les agents citent le chemin du champ (`gsc.totaux.vs_m1.clicks`). Pas de calcul de tête, pas d'arrondi inventé.
- **DA et vocabulaire `orem-da`** (charger le skill `anthropic-skills:orem-da` avant la mise en page). Rappel : jamais le mot « suivi », jamais de tiret long, vouvoiement, « agence ».
- **Une donnée manquante se dit** (« pas de données N-1 : site mis en ligne en juin ») ; elle ne se comble pas.

## 0. Cadrage (1 message)

1. Client et mois. Par défaut : le dernier mois complet. Une collecte avant le 4 du mois suivant donne des chiffres Search Console incomplets : le signaler.
2. Lire la fiche du client dans `references/clients.md`. Absente → la construire et la faire valider avant de continuer :
   - GA4 : `GOOGLE_ANALYTICS_LIST_ACCOUNT_SUMMARIES` (Composio) ;
   - Search Console : `GOOGLE_SEARCH_CONSOLE_LIST_SITES`, garder **toutes** les variantes du domaine (avec et sans www, `sc-domain:`) ;
   - espace client Notion : `notion-search` « Espace client <Client> » → data source « Programme & Livrables » ;
   - termes de marque, date de mise en ligne du site Orem, niveau Évolution (1 ou 2), porteur du dossier.
3. Dossier de travail : `rapports-evolution/<client>/<AAAA-MM>/` (données brutes dans `data/`, **jamais commitées**, cf. `.gitignore`).

## 1. Collecte (déterministe, aucun agent)

1. **GA4 + Search Console** : `COMPOSIO_REMOTE_WORKBENCH` avec le contenu de `scripts/collecte_workbench.py`, bloc `CONFIG` rempli depuis la fiche client. Le script lance toujours les mêmes requêtes (mois M, M-1, N-1, 13 mois de tendance) et imprime `RESULTAT {"url": …}`. Télécharger : `curl -sSL -o data/brut.json <url>`. Erreurs listées → les corriger, relancer ; jamais de rapport sur une collecte partielle sans le dire.
2. **Consolidation** : `python3 scripts/consolide.py data/brut.json data/kpi.json --marque "<termes>" --mise-en-ligne <AAAA-MM-JJ>`. Additionne les propriétés Search Console (règle dans `kpi.json > gsc.regle`), calcule écarts, opportunités, CTR faibles, cannibalisation, marque / hors marque, alertes.
3. **Mesure** : `python3 scripts/scan_tracking.py <url canonique> data/tracking.json --pages <5 pages d'entrée principales de kpi.json>`. Lit redirections, conteneurs GTM / gtag publics (balises, mesure améliorée, domaines croisés), consentement, traceurs, canonique, hreflang, robots, sitemap.
4. **Espace client Notion** : `notion-query-data-sources` sur la data source Programme & Livrables de la fiche → `data/notion.json` avec trois listes : livré pendant le mois M, en cours, pas commencé (nom, personne, date). Relever aussi les pages de l'espace modifiées pendant le mois (demandes, actualité du client). Rien trouvé → la slide « actualité » est retirée, pas inventée.

## 2. Analyses spécialistes (en parallèle)

Lancer **dans un seul message** trois agents `general-purpose`, chacun avec son fichier de consignes, le chemin du dossier et le contexte client (secteur, objectif du site, niveau) :

| Agent | Consignes | Lit | Écrit |
|---|---|---|---|
| Analyste GA4 | `references/agents/analyste-ga4.md` | `kpi.json > ga4`, `coherence` | `analyses/ga4.md` |
| Expert SEO / GEO | `references/agents/expert-seo-geo.md` | `kpi.json > gsc`, `ga4.ia`, `tracking.json > pages, variantes, robots` | `analyses/seo-geo.md` |
| Expert mesure | `references/agents/expert-mesure.md` | `tracking.json`, `kpi.json > alertes, ga4.evenements*, ga4.hotes, coherence` | `analyses/mesure.md` |

Prompt type : « Tu es <rôle>. Lis d'abord `<consignes>` et suis-les à la lettre. Dossier : `<chemin>`. Client : <fiche>. Écris ton analyse dans `<sortie>` et réponds seulement "ok" ou la liste de tes blocages. »

Puis l'agent **Stratège** (`references/agents/stratege.md`) : il lit les trois analyses, `notion.json`, les recommandations du mois précédent (`rapports-evolution/<client>/<M-1>/recommandations.md` si présent) et le niveau du client → `recommandations.md`.

## 3. Validation par Louis (obligatoire avant le deck)

Afficher, sans reformuler :
```
## <Client> · <Mois> : lecture du mois
Verdict : <1 phrase du stratège>
Chiffres clés : <4 indicateurs, M, vs M-1, vs N-1>
Alertes critiques : <liste>
Recommandations : Priorité 1 … · Secondaires …
Points incertains : <questions des agents>
Valider ? (ok · modifier …)
```
Les corrections de Louis s'appliquent aux analyses **et** à `recommandations.md`.

## 4. Deck

1. `$SKILL_DIR_OREM/scripts/new_doc.sh rapports-evolution/<client>/<AAAA-MM> "Évolution <Client> <Mois>"` (`$SKILL_DIR_OREM` = dossier du skill `orem-da`, affiché comme « Base directory » à son chargement).
2. Construire les slides **exactement** selon `references/trame.md` (ordre, modèle P-xx, contenu). Graphiques en SVG inline avec les seuls tokens de la palette (`references/trame.md` > Graphiques).
3. Rendu et contrôle visuel `orem-da` (render.js, planches, zéro alerte).
4. **Relecteur** : agent `general-purpose` avec `references/agents/relecteur.md` → `analyses/relecture.md`. Corriger chaque point, relancer le rendu.
5. Export PDF : `Client-Evolution-AAAA-MM-Orem.pdf` (< 5 Mo, autant de pages que de slides).

## 5. Livraison

1. Commit du dossier du deck (HTML, assets, PDF, `recommandations.md`, `analyses/`), **sans `data/`**, sur la branche de travail.
2. `SendUserFile` du PDF.
3. Sur demande : dépôt dans le dossier Drive du client (méthode `orem-da` > « Déposer un document dans le Google Drive », sous-dossier client de `02_CLIENTS` ou `01_EN_COURS`).
4. **Après la visio et accord explicite de Louis** : créer les recommandations retenues dans « Programme & Livrables » de l'espace client (`Nom`, `Personne`, `Date de livraison`, `État` = « Pas commencé »). Ne jamais écrire dans l'espace client sans ce feu vert : le client le voit.
5. Mettre à jour la fiche du client (`references/clients.md`) si un identifiant a changé, et noter la date du rapport.

## Pièges connus

- Search Console : réutiliser l'URL de propriété **exactement** (protocole, www, `/` final). Une propriété de domaine (`sc-domain:`) contient déjà toutes les variantes : ne jamais l'additionner aux propriétés préfixe.
- Search Console masque les requêtes rares : la somme des requêtes est inférieure au total. Toujours citer les totaux pour les volumes, les requêtes pour les tendances.
- GA4 compte `form_submit` sur tout formulaire (moteurs de réservation, newsletter) : ce n'est pas une conversion tant que ce n'est pas un événement clé vérifié.
- Un mois M-1 ou N-1 antérieur à la mise en ligne mesure l'effet de la refonte, pas la tendance : l'écrire sur la slide.
- Un `averageSessionDuration` qui baisse n'est pas mauvais en soi (le visiteur trouve plus vite) : le lire avec l'engagement et les conversions.
