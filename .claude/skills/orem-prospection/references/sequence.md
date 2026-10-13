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
- apporte **une information nouvelle** (un autre insight, une conséquence chiffrée, une
  comparaison, une preuve), jamais le même fait reformulé ;
- reste **compréhensible seul** grâce à son fait nouveau, **sans répéter le constat de l'Email 1**
  (test ICP : le constat répété dans chaque message est le premier motif de non-réponse) ;
- ne contient **aucune date relative figée** (« il y a dix jours ») : la variable part plus tard ;
- ne répète pas mot pour mot ce qui a déjà été dit, **y compris la phrase de rappel du
  constat** : chaque email la formule autrement.

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

### Règle de décision (identique dans les tâches 16 et 17, évaluée dans cet ordre)

0. **Revérifier le constat** (le site du prospect) avant tout Email 3, appel ou breakup. S'il
   n'est plus vrai → arrêter les envois automatiques, Louis écrit à la main.
1. **Le prospect a répondu, quoi qu'il dise** → sortir le lead de la séquence, Louis répond à la
   main. Jamais d'Email 3 automatique après une réponse.
2. **Signaux d'intérêt** → warm call. Seuil unique : au moins 3 ouvertures d'un même email, OU un
   clic, OU LinkedIn accepté sans réponse au message LinkedIn depuis 3 jours ouvrés.
3. **Au moins une ouverture, sans signal** → Email 3. Loom pertinent = oui si l'observation se
   montre mieux à l'écran (page, parcours, comparaison) ; non (RDV) si ce n'est plus montrable à
   l'écran ou si le sujet est stratégique par nature. Critère observable, jamais « au feeling ». La tâche donne la recommandation pour CE prospect et pourquoi.
4. **Aucune ouverture** → relance simple = Email breakup.

### Les textes

- **Tâche « Évaluer »** : 4 à 10 lignes. Reprend la règle ci-dessus, appliquée à CE prospect.
- **Tâche « Warm call si signaux »** : 4 à 8 lignes. Mêmes déclencheurs que la règle (étape 2),
  revérification du constat, quand appeler, phrase d'ouverture, renvoi au script, et **chaque issue
  de l'appel** : RDV → sortir de la séquence ; refus → clore ; rappel convenu → mettre le lead en
  pause dans lemlist (pas de breakup avant le rappel) ; échange sans RDV ni refus → sortir de la
  séquence, suite à la main ; messagerie → laisser le message, puis Email breakup quelques jours
  plus tard.
- **Script de warm call** : à dire, pas à lire. Ouverture qui dit **qui appelle : prénom, nom et
  Orem** (le prospect ne nous connaît pas), pourquoi j'appelle, lien avec les mails ; demande de
  permission ; le constat ; une question ouverte ; proposition de RDV 30 min ; 2 à 4 objections
  probables pour CE prospect (dont celle que le constat provoque, ex. « c'est déjà prévu / on le
  fait en interne », et les peurs n°5, 17, 22, 30 de `orem-contexte.md`) avec une réponse courte ;
  une version messagerie de 20 secondes. 150 à 300 mots.
- **Ne jamais promettre ce que la séquence ne tient pas** (ex. « je vous envoie une idée par
  mail » sur la messagerie, alors que le mail suivant est le breakup).
