# La séquence Orem : 17 livrables, un seul fil rouge

## Les livrables (toujours les 17, dans cet ordre)

| # | Livrable | Variable lemlist | Type (verifier.py) | CTA |
|---|---|---|---|---|
| 1 | Objet Email 1 | `oremObjet1` | objet | - |
| 2 | Email 1 | `oremEmail1` | email | réponse |
| 3 | Objet Email 2 | `oremObjet2` | objet | - |
| 4 | Email 2 (branche LinkedIn) | `oremEmail2` | email | réponse |
| 5 | Objet Email 2 si branche email-only | `oremObjet2Solo` | objet | - |
| 6 | Variante Email 2 si branche email-only | `oremEmail2Solo` | email | réponse |
| 7 | Invitation LinkedIn | `oremLinkedinInvite` | linkedin_invite | aucun |
| 8 | Message LinkedIn après acceptation | `oremLinkedinMessage` | linkedin | réponse |
| 9 | Objet Email 3 si Loom pertinent = oui | `oremObjet3Loom` | objet | - |
| 10 | Email 3 si Loom pertinent = oui | `oremEmail3Loom` | email | loom |
| 11 | Objet Email 3 si Loom pertinent = non | `oremObjet3Rdv` | objet | - |
| 12 | Email 3 si Loom pertinent = non | `oremEmail3Rdv` | email | rdv |
| 13 | Objet Email breakup | `oremObjetBreakup` | objet | - |
| 14 | Email breakup | `oremEmailBreakup` | email | réponse |
| 15 | Script de warm call | `oremScriptCall` | script_call | rdv |
| 16 | Tâche manuelle « Évaluer : Email 3 / call / relance simple » | `oremTacheEvaluer` | tache | aucun |
| 17 | Tâche manuelle « Warm call si signaux » | `oremTacheWarmCall` | tache | aucun |

## Le déroulé et les branches

```
Email 1 ──► Invitation LinkedIn
              ├─ acceptée ──► Message LinkedIn ──► Email 2
              └─ pas de LinkedIn / non acceptée ──► Email 2 (variante email-only)
                     │
                     ▼
        Tâche « Évaluer : Email 3 / call / relance simple »  (Louis décide)
              ├─ Loom pertinent = oui ──► Email 3 Loom   (la suite vise le Loom)
              ├─ Loom pertinent = non ──► Email 3 RDV    (la suite vise le RDV 30 min)
              ├─ call ──► script de warm call
              └─ relance simple ──► Email breakup
                     │
        Tâche « Warm call si signaux » (ouvertures répétées, clic, visite, acceptation LinkedIn)
                     │
                     ▼
                Email breakup
```

## Règle de CTA (décision de Louis, 2026-10-12)

L'objectif est **fixé à l'Email 3**, pas avant :
- **Emails 1, 2, 2 email-only, message LinkedIn, breakup** : CTA = une question légère qui appelle
  une **réponse** (pas de RDV, pas de Loom). Le but d'un cold mail, c'est une réponse.
- **Invitation LinkedIn** : aucun CTA.
- **Email 3 Loom** : CTA Loom (proposer une courte vidéo). Aucune mention de RDV.
- **Email 3 RDV** : CTA RDV de 30 min. Aucune mention de Loom ni de vidéo.
- **Warm call** : objectif RDV de 30 min.
- On ne mélange jamais Loom et RDV dans un même message.

## Le fil rouge (obligatoire)

Avant d'écrire, le rédacteur fixe **un fil rouge** : un seul sujet, tiré d'une observation réelle,
qui avance d'un cran à chaque message. Chaque message :
- part du **même sujet** que l'Email 1 (pas de nouveau problème sorti du chapeau) ;
- apporte **un cran de plus** (conséquence, idée, preuve, proposition) ;
- reste **compréhensible seul** (le prospect n'a peut-être pas lu le précédent) ;
- ne répète pas mot pour mot ce qui a déjà été dit.

Progression type :
| Étape | Rôle dans le fil rouge |
|---|---|
| Email 1 | Le constat précis + sa conséquence business |
| Invitation LinkedIn | Raison humaine de se connecter, liée au sujet |
| Message LinkedIn | Version orale et courte du sujet, un angle que l'Email 1 n'a pas pris |
| Email 2 | Un cran de plus : une idée concrète ou un deuxième signe du même problème. Peut faire allusion à LinkedIn |
| Email 2 email-only | Même cran, sans aucune allusion à LinkedIn |
| Email 3 Loom | Propose de montrer en vidéo ce qui a été évoqué |
| Email 3 RDV | Propose 30 min pour en parler, en s'appuyant sur ce qui a été évoqué |
| Breakup | Referme le sujet sans culpabiliser, porte ouverte |
| Warm call | Reprend le sujet à l'oral, vise 30 min |

## Écrits « internes » (16, 17 et le script 15)

Ils sont pour Louis, pas pour le prospect : ils ne suivent pas les règles de longueur des emails.

- **Tâche « Évaluer »** : 4 à 8 lignes. Les signaux à regarder (ouvertures, clics, LinkedIn
  accepté, réponse), la recommandation pour CE prospect (Email 3 Loom / Email 3 RDV / call /
  relance simple) et pourquoi, et le critère « Loom pertinent » : oui si l'observation se montre
  mieux à l'écran (page, parcours, comparaison), non si le sujet est plutôt stratégique.
- **Tâche « Warm call si signaux »** : 3 à 6 lignes. Quels signaux déclenchent l'appel, quand
  appeler, la phrase d'ouverture, renvoi au script.
- **Script de warm call** : à dire, pas à lire. Ouverture (qui, pourquoi j'appelle, lien avec les
  mails), demande de permission, le constat, une question ouverte, proposition de RDV 30 min,
  2 ou 3 objections probables (peurs n°5, 17, 22, 30 de `orem-contexte.md`) avec une réponse
  courte, et une version messagerie de 20 secondes. 150 à 300 mots.
