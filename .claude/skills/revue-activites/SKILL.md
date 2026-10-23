---
name: revue-activites
description: Revue rapide des activités Pipedrive de Louis — liste compacte des tâches du jour / en retard / de la semaine, puis Louis dit en vrac ce qui est fait, pas fait, sans nouvelles, à décaler ; Claude décale intelligemment (jours ouvrés, fériés, chaînes de tâches liées, heure de Paris), clôt, relance, et ne passe à Shannen (skill maj-deal-shannen) que les deals où il y a une vraie décision commerciale. À utiliser dès que Louis dit « revue des activités », « mes tâches Pipedrive », « point tâches », « tri des activités », « qu'est-ce que j'ai aujourd'hui / cette semaine », « décale mes tâches », « nettoie mes activités ».
---

# Revue des activités Pipedrive

Objectif : faire gagner du temps à Louis. Il parle en vrac (souvent en dictée vocale) ; Claude comprend, propose un plan court, applique. **Claude gère seul le mécanique** (fait, décaler, pas de nouvelles, doublons) et **passe à Shannen uniquement ce qui demande un jugement commercial** (`references/quand-shannen.md`).

Fichiers :
- `references/quand-shannen.md` — qui décide quoi (Claude seul / Shannen / question à Louis). **À relire avant chaque plan.**
- `references/regles-dates.md` — jours ouvrés, chaînes de tâches, cadences par défaut, heures UTC.
- `scripts/jours.py` — **tout calcul de date passe par ce script**, jamais de tête (jour de semaine, fériés, +N jours ouvrés, « lundi », « début novembre », cascade, heure UTC ↔ Paris). Sans Python : calcule, puis vérifie chaque date avec son jour de semaine.
- Clés de champs, ID d'étapes, types d'activité : ceux du skill `maj-deal-shannen` (`../maj-deal-shannen/references/champs.md` et `architecture.md`).

## 0. Particularités du compte (constatées)

- Toutes les activités sont sur le compte **ICONOKOM** (`owner_id 26495388`). Le préfixe du sujet dit qui exécute : `[Louis]`, `[Théo]`/`[Theo]`, `[Clément]` ; sans préfixe = Louis.
- **Les activités en retard sont ramenées chaque matin à la date du jour** (toutes ont `update_time` ≈ 7h56). Donc `due_date` = aujourd'hui ne veut pas dire « prévu aujourd'hui ». La vraie date prévue se lit dans la note (« Mercredi 21/10 à 9h », « la semaine du 19/10 », « si pas de réponse au mail du 19/10 ») ou, à défaut, se déduit de `add_time`. Affiche-la avec ⏳ et le retard en jours ouvrés.
- `due_time` est en **UTC** (`07:00` = 9h à Paris en heure d'été, 8h en hiver). Toujours afficher l'heure de Paris (`jours.py heure`).
- Les RDV synchronisés depuis l'agenda arrivent parfois **en double** : une activité sans deal (`deal_id null`, `public_description` « Deal Pipedrive #306 ») + l'activité du deal. Regroupe-les, traite-les ensemble.
- **Ne jamais toucher aux activités liées à une invitation d'agenda** (`conference_meeting_client` ou `conference_meeting_url` renseigné) : ni date, ni sujet, ni description, ni statut, ni rattachement. Toute modification peut renvoyer une invitation mise à jour au prospect. Les signaler seulement (« doublon agenda »), Louis s'en occupe.
- Proposition « prête » envoyée par Louis (PDF) : lire la page d'investissement, mettre la **valeur HT** dans le deal et une note résumant le périmètre et le prix (options comprises). Client hors de France (ex. Belgique) : pas de TVA, ne jamais calculer de TTC.
- **Jamais d'heure sur une activité** (règle ultra importante de Louis) : `due_time` et `duration` vides, l'activité est « toute la journée », sinon l'agenda devient illisible. Exceptions seulement : visios / RDV programmés avec une heure, et quand Louis donne lui-même une heure. Au décalage d'une tâche qui a une heure sans être un RDV, retirer l'heure.
- **Toujours une priorité** sur chaque activité créée ou décalée (24 Basse, 25 Moyen, 26 Haute), décidée par Claude : plus l'action est susceptible de rapporter de l'argent vite, plus elle est haute. Haute = proposition, signature, RDV ou relance d'un deal chaud, encaissement, client signé qui attend ; Moyen = prospection qualifiée, relances courantes, production client ; Basse = nurture, administratif, réactivations lointaines. Question à Louis seulement en cas de vrai doute.
- Beaucoup de notes contiennent un **message prêt à envoyer** et des dates écrites en clair (« demain », « mercredi 21/10 »). Quand l'activité bouge, ces mentions deviennent fausses → à corriger (§5).

## 1. Collecter

Fenêtre selon la demande : par défaut **aujourd'hui** (donc tout le retard) ; « semaine » = jusqu'à J+5 ouvrés ; « tout » = sans limite. Filtre éventuel : « seulement les miennes » → sans préfixe ou `[Louis]` ; « celles de Théo » → `[Théo]`.

1. `getActivities` : `owner_id 26495388`, `done false`, `sort_by due_date`, `sort_direction asc`, `limit 500` ; pagine (`cursor`) tant que `due_date` ≤ fin de fenêtre.
2. Pour chaque `deal_id` distinct : `getDeal` → titre, pipeline, étape, statut, organisation. Deal `won`/`lost` avec activité ouverte → à signaler (souvent à clore).
3. Ne charge les autres activités d'un deal (`getActivities deal_id`, hors fenêtre) que si une cascade le demande (§4).

## 2. Afficher (compact, une ligne par activité)

Groupé par deal, deals triés : commerciaux d'abord (P4/P6/P7, puis P5 55-58), puis projets clients (P5 53-54), puis activités sans deal. Lettre par deal, numéro par activité :

```
📋 Revue du ven 23/10 — 41 activités (dont 33 en retard)

A · Liber Pater #306 — P5 Client actif
  A1 RDV visio  Validation finale + mise en ligne + solde   ⏳ mer 21/10 9h (−2j)  [doublon agenda #1876]
  A2 Tâche      [Louis] Préparer la visio                  ⏳ mar 20/10 (−3j)
  A3 Tâche      [Louis] Confirmer la visio à Loïc          ⏳ mar 20/10 (−3j)
B · Melchior / … #31 — P6 43 Nouveau lead
  B1 Relance    Relance WhatsApp pour caler la visio       ⏳ mar 20/10
  B2 Tâche      Vérifier réponse à la relance du 20/10     ⏳ jeu 22/10
…
Z · Sans deal
  Z1 RDV        Visio Orem x HPA Développement             ven 23/10 15h
```

Puis, en 3 à 6 lignes max, **ce que tu as déjà repéré** (sans rien appliquer) :
- RDV dont la date est passée → « A1 a eu lieu ? »
- tâches devenues sans objet (« préparer la visio de demain » alors que la visio est passée, doublons) ;
- chaînes : « B2 dépend de B1 (vérifier 2 j ouvrés après) » ;
- deals clos avec activités ouvertes, activités en retard de plus de 15 jours ouvrés.

Termine par : « Dis-moi en vrac ce qui a bougé. Ce que tu ne cites pas reste tel quel. »

## 3. Comprendre la réponse de Louis

Il peut citer un code (`A1`, `A` = tout le deal), un nom (« Liber Pater », « César », « le truc de Tim »), ou une règle globale (« le reste → lundi », « tout Théo → semaine pro »). Vocabulaire :

| Louis dit | Intention |
|---|---|
| ok, fait, c'est bon, envoyé, réglé | **fait** |
| fait + info (« fait, il veut un devis ») | **fait** + info nouvelle → voir `quand-shannen.md` |
| rien, pas de news, pas de réponse, silence radio | **sans nouvelles** (l'action de notre côté est faite ou à refaire, pas de retour) |
| pas fait, pas eu le temps, décale, plus tard, lundi, +3, semaine pro, début novembre | **décaler** (date via `jours.py quand`) ; « décale » sans date = prochain jour ouvré peu chargé |
| annule, laisse tomber, sert à rien, doublon | **annuler** |
| c'est Théo, passe à Théo / à moi | **réaffecter** (changer le préfixe du sujet) |
| ajoute…, faut que je… | **créer** une tâche |
| texte libre sur le deal (« il part en vacances jusqu'au 10 », « elle a signé ») | info nouvelle → `quand-shannen.md` |

Un nombre seul (« +3 », « 2 jours ») = **jours ouvrés**. Une date tombant un week-end, un férié ou un jour de congés est repoussée au jour ouvré suivant et **signalée**. Ce qui est ambigu (quelle activité, quelle date, le RDV a-t-il eu lieu ?) → **une seule question groupée** à Louis, jamais à Shannen.

## 4. Construire le plan

Pour chaque deal touché :
1. Classe chaque élément : **Claude seul**, **Shannen** ou **question à Louis** (`references/quand-shannen.md`).
2. **Deal qui part chez Shannen** : tu n'appliques que les faits (activités que Louis dit faites → `done`, avec le résultat dans la note). Tu ne replanifies rien d'autre sur ce deal : Shannen le fera, avec les infos de Louis.
3. **Décalages** : identifie les chaînes du deal (`references/regles-dates.md` §2), puis lance `jours.py cascade` avec un fichier JSON dans le dossier scratchpad/temp (jamais dans le dépôt). RDV avec le prospect = `fixe` : jamais déplacé mécaniquement ; conflit → question à Louis.
4. **Sans nouvelles** : applique la cadence de `regles-dates.md` §3 (relance suivante créée, ou passage à Shannen à la 3e relance sans réponse).
5. **Après le plan**, tout deal commercial qui n'aurait plus aucune activité ouverte → Shannen (« quelle suite ? »). Deal projet client sans activité ouverte → signale-le simplement.
6. Équilibre la charge : un décalage sans date précise évite les jours qui ont déjà ≥ 12 activités ouvertes ou un agenda plein (Google Calendar si disponible) ; regarde le jour ouvré suivant.

## 5. Valider (obligatoire, court)

```
## Je fais (Pipedrive)
✅ Fait        A1 Visio validation finale · A2 · A3 (sans objet, visio passée) · #1876 (doublon agenda)
📅 Décalé      C1 Relance Franck              ven 23/10 → lun 26/10
               C2 └ Vérifier réponse (+2 j)   ven 23/10 → mer 28/10
               D1 RDV visio Hugo 9h           ⚠ heure UTC 07:00 → 08:00 (heure d'hiver), 9h Paris conservé
🔁 Relance     E1 pas de réponse (relance 2/3) → nouvelle relance mar 27/10
❌ Annulé      F2 doublon de F1
✏️ Notes       C1 : « lundi 19/10 » → « lundi 26/10 » dans le message
👤 Réaffecté   G1 [Théo] → [Louis]

## Je passe à Shannen (après application)
• Melchior #31 — « il a répondu, pas le bon timing avant janvier » → nurture ? (B1, B2 marquées faites)
• César #1280 — 3 relances sans réponse → suite ?

## J'ai besoin de toi
• H1 RDV CineDesign de vendredi : il a eu lieu ?

ok ? (ou corrige : « C1 plutôt mardi », « pas Shannen pour César »)
```

Toutes les dates avec leur jour de semaine. Pas d'autre texte. Attends la réponse ; applique les corrections de Louis sans redemander.

## 6. Appliquer

Dans cet ordre, en t'arrêtant pour signaler toute erreur d'API :

1. **Fait** : `updateActivity` `done: true` ; note += `<br><b>Revue <JJ/MM></b> : <résultat en mots de Louis>` (si Louis a dit quelque chose). Activité « sans nouvelles » : note += `… : pas de réponse`.
2. **Décaler** : `updateActivity` `due_date` (+ `due_time` UTC recalculé seulement pour un RDV / une visio à heure fixe ; une tâche ordinaire n'a pas d'heure, §0). Dans la note, remplace les dates devenues fausses (« demain », « lundi 19/10 », « la veille ») par les nouvelles, et ajoute `Revue <JJ/MM> : décalée du <ancienne> au <nouvelle>`. Un message prêt à envoyer dont seule la date change → corrige la date ; si c'est le fond qui ne tient plus → Shannen.
3. **Annuler** : `updateActivity` `done: true`, sujet préfixé `[ANNULÉE] `, raison en fin de note (comme `maj-deal-shannen`, pas de suppression).
4. **Réaffecter** : `updateActivity` `subject` avec le nouveau préfixe.
5. **Créer** (relances de cadence, tâches dictées) : `addActivity` `type`, `subject`, `due_date` (sans `due_time`, §0), `priority` (toujours, §0), `note`, `deal_id`, `participants:[{person_id, primary:true}]`, `org_id` — repris de l'activité d'origine.
6. **Champs deal** (seulement s'ils sont déjà remplis sur le deal, pour rester cohérent) : `Date prochaine action` = date de la prochaine activité ouverte ; si quelque chose a été fait : `Dernière action` (texte court) + `Date dernière action` = aujourd'hui.
7. **Shannen** : pour chaque deal de la liste, déroule le skill `maj-deal-shannen` (avec sa propre validation), en passant en `INFOS DE LOUIS` ses mots exacts + une ligne `Revue activités <date> — déjà appliqué : <liste>`. Un deal à la fois ; Louis peut dire « stop » ou « plus tard » (→ dans ce cas crée une tâche `[Louis] Passer <deal> à Shannen` pour le jour ouvré suivant).

Fin : `✅ <n> faites · <n> décalées · <n> relances · <n> annulées · <n> deals passés à Shannen` + erreurs éventuelles. Rien d'autre.

## Règles

- Ne jamais rien envoyer au prospect toi-même (messages = notes / activités, comme `maj-deal-shannen`).
- Ne jamais supprimer une activité.
- Ne jamais placer une activité un samedi, un dimanche, un férié ou un jour de congés de Louis (`scripts/conges.txt`).
- Ne jamais déplacer un RDV avec un prospect/client sans date donnée par Louis.
- En cas de doute entre « Claude seul » et « Shannen » : Shannen pour ce qui touche le prospect, Claude pour l'interne.
