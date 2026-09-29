---
name: content-manager
description: Content manager du personal branding de Louis Montagne (ICONOKOM). Croise veille US/FR, nouveautés Webflow, verbatims Fireflies, posts LinkedIn performants et stats GA4/Search Console des clients pour produire des fiches d'idées de posts (objectif, angle, hooks, déclinaisons, recyclage). Utiliser quand Louis demande des idées de posts, un brief éditorial, un sujet LinkedIn, ou tape /content-manager.
argument-hint: "[complet | rapide | recycler | sujet \"<thème>\"] [période, ex: 14j]"
---

# /content-manager

Tu orchestres 5 agents spécialisés puis tu fais la **synthèse éditoriale**. La valeur n'est pas dans la collecte, elle est dans le **croisement** : une bonne idée naît quand un signal US, une douleur client et une donnée terrain racontent la même histoire.

## 0. Préparation
1. Lis `CLAUDE.md`, `config/positionnement.md`, `templates/fiche-idee.md`, `data/backlog.md`.
2. Détermine le mode depuis les arguments (défaut : `complet`) et la période (défaut : 14 jours pour la veille, 30 jours pour Fireflies et data).
3. Crée `outputs/<AAAA-MM-JJ>/sources/`.

## 1. Collecte (selon le mode)

| Mode | Agents lancés | Nb d'idées en sortie |
|---|---|---|
| `complet` | les 5 | 10 à 12 |
| `rapide` | veille-marche, veille-webflow, voix-client | 5 |
| `recycler` | performance-posts uniquement + lecture du backlog | 5 retravails |
| `sujet "<thème>"` | les 5, avec consigne de se concentrer sur le thème | 1 fiche approfondie + 6 déclinaisons |

Lance les agents **en parallèle** avec l'outil Agent (`subagent_type` = `veille-marche`, `veille-webflow`, `voix-client`, `performance-posts`, `data-clients`). Passe à chacun : la date du jour, la période, le chemin de sortie, et le thème en mode `sujet`.

Appels Composio : maximum 3 outils par `COMPOSIO_MULTI_EXECUTE_TOOL` (au-delà, timeout à 60 s). Pour analyser plusieurs transcripts, passer par `COMPOSIO_REMOTE_WORKBENCH` (`run_composio_tool` + `invoke_llm` en parallèle).

Si un agent échoue (connecteur KO, pas de données), continue avec les autres et note-le dans la section "Santé des sources" du brief.

## 2. Synthèse
1. Lis tous les fichiers de `outputs/<date>/sources/`.
2. **Croise** : pour chaque signal, cherche des confirmations dans les autres sources. Construis une matrice rapide signal x source.
3. **Génère** les idées au format `templates/fiche-idee.md`. Priorités :
   - Idées confirmées par 2+ sources dont au moins une donnée propre (Fireflies ou clients) : c'est ce que personne d'autre ne peut écrire.
   - Signaux US "Pas encore en FR" : fenêtre de 6 mois, à prendre en premier.
   - Nouveautés Webflow avec impact client réel.
   - Retravail des posts performants.
4. **Anti-doublon** : compare chaque idée avec `data/backlog.md`. Si la thèse existe déjà, transforme-la en variante (nouvel angle ou nouvelle donnée) ou écarte-la.
5. **Équilibre** : respecte le mix piliers et objectifs de `config/positionnement.md`. Maximum 3 idées sur un même pilier.
6. **Score** chaque idée (grille dans le template). Écarte sous 12/20. Marque "Prêt à écrire" à partir de 14/20.
7. **Déclinaisons** : 3 à 4 variantes par idée avec dates de recyclage (J+45, J+90, J+180), chacune avec un angle réellement différent.
8. Relis : aucun "—", aucune donnée client ou prospect identifiable, chaque idée sourcée, pas de généralité.

## 3. Livrables
1. `outputs/<date>/brief.md` :

```markdown
# Brief éditorial du <date>

## En 30 secondes
Les 3 idées à écrire cette semaine, et pourquoi.

## Calendrier suggéré (2 semaines)
| Jour | Idée | Objectif | Format |

## Fiches idées
(fiches complètes, triées par score)

## Recyclage dû
Idées du backlog dont une variante arrive à échéance.

## Santé des sources
| Source | Statut | Volume analysé | Remarque |
```

2. Ajoute chaque nouvelle idée et ses variantes datées dans `data/backlog.md` (tableau "Idées", statut `proposée`).
3. Mets à jour le tableau "Recyclage" du backlog.
4. Si Louis le demande, pousse les fiches dans sa base Notion (outil Notion MCP) ou en Google Doc.

## 4. Réponse finale
Dans le chat : les 3 idées prioritaires (titre, objectif, hook n°1, score), le chemin du brief, et les sources en échec. Pas plus.
