# Content Manager IA : Louis Montagne / ICONOKOM

Trouve et structure les sujets de posts LinkedIn de Louis en croisant 5 sources, puis livre des fiches d'idées prêtes à rédiger.

```
                 ┌──────────────── /content-manager (orchestrateur) ────────────────┐
                 │                                                                 │
  veille-marche  veille-webflow   voix-client     performance-posts   data-clients
  (US → FR)      (produit+concu)  (Fireflies)     (LinkedIn Louis)    (GA4 + GSC)
                 │                                                                 │
                 └────────► croisement ► score ► anti-doublon ► déclinaisons ◄─────┘
                                              │
                          outputs/<date>/brief.md  +  data/backlog.md
```

## Utilisation

Dans Claude Code, à la racine du repo :

| Commande | Usage | Fréquence |
|---|---|---|
| `/content-manager` | Brief complet, 10 à 12 idées | Hebdo (lundi) |
| `/content-manager rapide` | 5 idées sur l'actu + voix client | Quand le backlog est vide |
| `/content-manager recycler` | Retravail des posts qui ont performé | Mensuel |
| `/content-manager sujet "IA et SEO"` | 1 fiche approfondie + 6 déclinaisons | À la demande |

## Ce que contient une fiche idée
Objectif final unique (notoriété, autorité, leads, RDV...), persona, insight sourcé, croisement de sources, angle et thèse, 3 hooks, squelette, CTA, format, score /20, 3 à 4 déclinaisons datées pour recycler le sujet, date de péremption. Format complet : `templates/fiche-idee.md`.

## Mise en route (30 min)

1. **Connecteurs** (Composio, déjà actifs sur le compte) : Fireflies, Google Analytics, Search Console, LinkedIn, recherche web.
2. **`config/positionnement.md`** : valider ICP, piliers, mix d'objectifs, ton (les [crochets] sont des hypothèses).
3. **`config/sources.md`** : compléter les pointures FR suivies.
4. **`config/clients.yaml`** : ajouter chaque site client (ID GA4, propriété GSC, secteur, objectif, date de mise en ligne, `citable`).
5. **`data/linkedin/`** : déposer l'export Analytics > Contenu du profil (voir le README du dossier).
6. Lancer `/content-manager`.

## Structure

```
CLAUDE.md                          règles du projet (lu automatiquement)
.claude/skills/content-manager/    orchestrateur
.claude/agents/                    5 agents spécialisés
config/                            positionnement, sources, clients, KPI par secteur
templates/fiche-idee.md            format de sortie + bibliothèque d'angles + scoring
data/backlog.md                    mémoire : idées, statuts, calendrier de recyclage
data/linkedin/, data/fireflies/    données locales (non versionnées)
outputs/<date>/brief.md            brief éditorial
```

## Confidentialité
- Verbatims Fireflies anonymisés, jamais de nom de prospect.
- Chiffres clients publiables seulement si `citable: true`, sinon descripteur anonyme et chiffres arrondis.
- Exports bruts et sorties d'agents exclus de git (`.gitignore`).
