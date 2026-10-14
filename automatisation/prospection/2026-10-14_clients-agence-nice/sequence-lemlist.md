# Séquence Lemlist : « Site payé au mois, jamais vraiment à vous »

Campagne Lemlist « 🔑 FR - Site en location / reprise en main - Multicanal » (`cam_cDpBjZcbFcztRXsk5`), **lancée le 14/10/2026** avec 7 leads (validation automatique des nouveaux leads désactivée). Expéditeur : Louis, boîte iconokom@gmail.com (choix du 14/10, louis@iconokom.fr envisagée plus tard) + son compte LinkedIn. L'ancienne version linéaire (`cam_z37C7sANHetY9Bh4J`) est archivée.

## Cible

Les clients d'une agence web niçoise : les réalisations affichées sur son site et les entreprises identifiables parmi ses 65 avis Google (voir `avis-google.md` et `prospects.md`). Le schéma visé : site vendu en location financière (organisme de financement tiers, 48 mensualités), modifications impossibles, noms de domaine non maîtrisés, prestations prévues mais non livrées.

## Règles de rédaction

- **Ne jamais nommer l'agence ni l'organisme de financement**, ne pas parler d'« arnaque ». Citer nommément un concurrent pour le dénigrer, c'est du dénigrement fautif (art. 1240 du Code civil). Et ces prospects ont souvent laissé un avis positif : attaquer leur choix les braque. On parle d'un **schéma** (location, dépendance), pas d'une entreprise.
- **Aucune référence à Fabrice (Maison & Cinéma) ni à Olivier (CineDesign)**, même anonymisée : ils ne sont pas au courant.
- On ne prétend pas savoir combien ils paient : on pose la question.
- Pas de conseil juridique : on propose un état des lieux technique (qui détient le domaine, le site, les accès).
- Vouvoiement. Signature : Louis.

## Le fil rouge

Toute la séquence tourne autour d'une seule question : **« votre site vous appartient-il vraiment ? »**. Chaque message reprend le précédent et avance d'un cran :

| Message | Rôle dans l'histoire | Lien avec le précédent |
|---|---|---|
| Email 1 | Pose la question et la décompose en **3 sous-questions** : ce que vous payez, à qui est le domaine, pouvez-vous modifier vous-même | ouverture |
| Invitation LinkedIn | Met un visage sur l'email | « je vous ai écrit au sujet du site de… » |
| Email 2 | Montre **ce qu'il y a derrière** ces 3 questions (symptômes concrets) et notre façon de faire | « Je reviens sur mes trois questions… » |
| Appel | Pose la question de vive voix | « Je vous ai écrit cette semaine… » |
| LinkedIn 1 | Isole **la plus simple des 3 questions** (le domaine) et donne un test de 30 secondes (whois) | « Dans mon email, je vous posais trois questions… » |
| LinkedIn 2 | Demande **le résultat du test** et explique ce qu'il révèle (domaine → hébergement → accès), propose l'état des lieux | « avez-vous pu regarder qui est le titulaire… » |
| Email 3 | Donne **la vérification complète en 4 points** (le test whois en fait partie) | « Si vous ne deviez faire qu'une chose après mes messages… » |
| SMS | Rappel court | « Je vous ai écrit au sujet du site de… » |
| Email 4 | **Résume** toute la séquence en 3 principes (à votre nom, modifiable par vous, acheté pas loué) et laisse la porte ouverte | « Si je résume tout ce que je vous ai écrit… » |

## Variables par lead

| Variable | Rôle | Exemple |
|---|---|---|
| `{{firstName}}` | prénom | Jean-Marc |
| `{{companyName}}` | entreprise | JM Paysage |
| `{{segment}}` | `2023` pour les clients de 2023 (échéance 48 mois en 2027), vide sinon | 2023 |
| `{{siteObservation}}` | constat factuel sur leur site, facultatif | le formulaire de contact renvoie une erreur |
| `linkedinUrl` | déclenche la branche LinkedIn | linkedin.com/in/… |

## Arbre de la séquence

```
J0    Email 1
      ├─ Condition : a une URL LinkedIn ?
      │   ├─ OUI
      │   │   J1   Visite du profil LinkedIn
      │   │   J2   Invitation LinkedIn (avec note)
      │   │   J3   Email 2
      │   │   J4   Appel (priorité haute)
      │   │   ├─ Condition : invitation acceptée sous 3 jours ?
      │   │   │   ├─ OUI
      │   │   │   │   dès l'acceptation   LinkedIn 1 : le test du nom de domaine
      │   │   │   │   +3 j                LinkedIn 2 : « avez-vous pu regarder ? » + proposition de RDV
      │   │   │   └─ NON : rien, la suite par email
      │   └─ NON
      │       J3   Email 2
      │       J4   Appel (priorité haute)
      │
+2 j  Email 3 : vérification en 4 points          ← toutes les branches se rejoignent
+1 j  Tâche : SMS court (mobile uniquement)
+4 j  Email 4 : fin de boucle
```

Durée : environ 12 jours sans LinkedIn, jusqu'à 18 jours si l'invitation est acceptée tard.

LinkedIn trouvés via la base de données Lemlist (14/10) : Alexandre Bourion, Florian Monin, Nicolas Charbin, Allan Scheer. Pas de profil pour Francisco Martins, Joëlle Dadoune, Syril Soubilleau (chez DF Clôtures, Lemlist connaît une « Daisy M., chef d'entreprise », non rattachée à Francisco Martins : non utilisée). Aucun des 7 n'existait avant dans les contacts Lemlist.

---

## Email 1 (J0)

**Objet :** {{companyName}} : votre site vous appartient-il vraiment ?
**Objet (segment 2023) :** {{companyName}} : votre site après 2027 ?

Bonjour {{firstName}},

*[Par défaut]* On reprend en ce moment les sites de dirigeants qui payaient leur site tous les mois, sous forme de location, sans jamais en être propriétaires. Parfois plus de 10 000 € au total, pour un site qu'ils ne pouvaient pas modifier eux-mêmes et des noms de domaine qui n'étaient pas à leur nom.

*[Segment 2023]* Beaucoup de sites vitrines ont été vendus en 2023 sous forme de location sur 48 mois. Si c'est votre cas, votre engagement se termine courant 2027, et c'est maintenant qu'il faut préparer la suite : selon les contrats, il peut être reconduit tacitement, ou le site peut disparaître le jour où les loyers s'arrêtent.

*[Si `siteObservation`]* En regardant votre site, j'ai remarqué que {{siteObservation}}. (La variable doit commencer par un mot qui suit naturellement « que » : pas de « il », pas de « votre site ».)

Ce n'est peut-être pas votre situation, mais trois questions valent d'être posées :
- Combien payez-vous chaque mois pour votre site, et jusqu'à quand ?
- Le nom de domaine est-il à votre nom ?
- Pouvez-vous modifier un texte ou une photo sans passer par quelqu'un ?

Si une de ces réponses vous gêne, je vous propose un état des lieux gratuit de 15 minutes : on regarde ensemble qui détient quoi (domaine, hébergement, accès), sans rien vous vendre pendant l'appel.

Louis
Orem

---

## Invitation LinkedIn (J2, branche LinkedIn)

**Note standard (≤ 200 caractères)** : Bonjour {{firstName}}, je vous ai écrit au sujet du site de {{companyName}}. J'aide des dirigeants à reprendre la main sur leur site internet. Au plaisir d'échanger ici. Louis

**Note Premium (≤ 300 caractères)** : Bonjour {{firstName}}, je vous ai écrit au sujet du site de {{companyName}}. J'aide des dirigeants qui paient leur site au mois sans en être propriétaires à reprendre la main dessus. Au plaisir d'échanger ici. Louis

---

## Email 2 (J3, en réponse au fil)

Bonjour {{firstName}},

Je reviens sur mes trois questions avec ce qu'il y a souvent derrière. Quand un dirigeant nous montre le site qu'il paie au mois, on retrouve presque toujours :
- plusieurs sites ou noms de domaine qui se concurrencent sur Google ;
- un formulaire de contact dont les demandes finissent en spam, voire n'arrivent jamais ;
- des prestations prévues au contrat (réseaux sociaux, traduction, avis Google…) jamais livrées ;
- aucune possibilité de changer soi-même un texte ou une photo.

Notre façon de faire est l'inverse :
- un seul site, à votre nom, domaine compris ;
- un prix fixe annoncé dès le départ, payé en plusieurs fois selon les étapes du projet, pas un loyer ;
- une formation pour que vous soyez autonome ;
- vos anciens noms de domaine récupérés et redirigés quand c'est possible.

Ça vaut 15 minutes ?

Louis

---

## Appel (J4) : priorité haute

> Bonjour {{firstName}}, Louis de l'agence Orem. Je vous ai écrit cette semaine au sujet de votre site. On aide en ce moment des chefs d'entreprise qui payaient leur site au mois sans en être propriétaires. Une question simple : aujourd'hui, vous payez quelque chose tous les mois pour votre site ?
>
> **Si oui :** Vous savez jusqu'à quand, et si le nom de domaine est à votre nom ? → proposer l'état des lieux de 15 minutes, caler le créneau.
> **Si non / satisfait :** Parfait, c'est la bonne situation. Je vous laisse mon contact si un jour vous voulez refaire le site. → noter dans Pipedrive, sortir le lead de la séquence.

Branche sans LinkedIn : demander aussi s'il est sur LinkedIn. À noter dans Pipedrive : mensualité, durée restante, propriétaire du domaine, satisfaction.

---

## LinkedIn 1 (dès l'acceptation de l'invitation)

> Merci d'avoir accepté, {{firstName}}.
>
> Dans mon email, je vous posais trois questions sur le site de {{companyName}}. Je vous laisse ici la plus simple, elle prend 30 secondes : tapez votre nom de domaine sur un site « whois » et regardez qui en est le titulaire.
>
> Si c'est {{companyName}}, tant mieux. Si c'est un prestataire, l'adresse de votre site ne vous appartient pas vraiment : le jour où le contrat s'arrête, elle peut partir avec lui.
>
> Louis

## LinkedIn 2 (3 jours après)

> {{firstName}}, avez-vous pu regarder qui est le titulaire de votre nom de domaine ?
>
> C'est souvent là que tout commence : si le domaine n'est pas à votre nom, il y a de bonnes chances que l'hébergement et les accès ne le soient pas non plus.
>
> Si vous voulez en avoir le cœur net, je vous propose 15 minutes : on regarde ensemble ce que {{companyName}} détient vraiment (domaine, hébergement, accès) et ce que vous payez chaque mois. Vous repartez avec un état des lieux clair, même si on ne travaille pas ensemble.
>
> Plutôt cette semaine ou la suivante ?
>
> Louis

---

## Email 3 (en réponse au fil)

Bonjour {{firstName}},

Si vous ne deviez faire qu'une chose après mes messages, ce serait cette vérification en quatre points. Elle prend dix minutes, et elle vous sera utile même si on ne se parle jamais :

1. **Votre contrat** : est-ce un contrat de location avec un organisme de financement, distinct de l'agence ? Si oui, les loyers peuvent continuer même si l'agence ne fait plus rien.
2. **Votre nom de domaine** : tapez-le sur un site « whois ». Le titulaire doit être {{companyName}}, pas un prestataire.
3. **Vos accès** : avez-vous l'identifiant et le mot de passe de l'administration du site ?
4. **Votre formulaire de contact** : envoyez-vous une demande test. Arrive-t-elle bien dans votre boîte mail (et pas en spam) ?

Si une seule de ces vérifications coince, répondez « état des lieux » et on regarde ça ensemble.

Louis

---

## SMS (tâche, mobile uniquement)

Bonjour {{firstName}}, Louis de l'agence Orem. Je vous ai écrit au sujet du site de {{companyName}} : si vous le payez encore au mois, je vous offre 15 min pour vérifier qui en est vraiment propriétaire. Bonne journée.

---

## Email 4 : fin de boucle

**Objet :** je ferme le dossier {{companyName}}

Bonjour {{firstName}},

C'est mon dernier message sur le sujet. Si je résume tout ce que je vous ai écrit, un site devrait toujours être :
- **à votre nom**, nom de domaine compris ;
- **modifiable par vous**, sans attendre personne ;
- **acheté, pas loué** sans fin.

Si c'est déjà le cas pour {{companyName}}, tant mieux, et je vous souhaite une belle continuation.

Si ce n'est pas le cas, voici ce qu'on propose : un site livré en 30 jours, à votre nom, à prix fixe annoncé dès le départ, payé en plusieurs fois sans frais selon les étapes du projet, avec une formation pour être autonome et deux mois de suivi après la mise en ligne.

Il suffit de répondre à ce message, même dans six mois.

Louis
Orem

---

## Avant de lancer

1. Validation de Théophile.
2. Expéditeur configuré (Louis, iconokom@gmail.com) : Lemlist indique la campagne prête à lancer.
3. Remplir `{{segment}}` et `{{siteObservation}}` lead par lead : pas d'envoi en masse.
4. Ne pas importer Emeline Russier (litige en cours) ni Delphine Belleville (activité fermée).
5. RGPD : adresses professionnelles uniquement, lien de désinscription actif.
