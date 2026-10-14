# Séquence Lemlist : « Site payé au mois, jamais vraiment à vous »

Préparée le 14/10/2026. Campagne Lemlist « 🔑 FR - Site en location / reprise en main - Multicanal » (`cam_cDpBjZcbFcztRXsk5`), **en brouillon**, 7 leads, en attente de validation par Théophile. Expéditeur (boîte email + compte LinkedIn de Louis) à configurer avant lancement.

L'ancienne version linéaire sans LinkedIn (`cam_z37C7sANHetY9Bh4J`, « … Côte d'Azur ») est toujours en brouillon avec les mêmes 7 leads : à archiver.

## Cible

Les clients d'une agence web niçoise : les 11 réalisations affichées sur son site et les entreprises identifiables parmi ses 65 avis Google (voir `avis-google.md`). Le schéma visé : site vendu en location financière (organisme de financement tiers, 48 mensualités), modifications impossibles, noms de domaine non maîtrisés, prestations prévues mais non livrées.

## Règles de rédaction

- **Ne jamais nommer l'agence ni l'organisme de financement**, ne pas parler d'« arnaque ». Citer nommément un concurrent pour le dénigrer, c'est du dénigrement fautif (art. 1240 du Code civil). Et ces prospects ont souvent laissé un avis positif : attaquer leur choix les braque. On parle d'un **schéma** (location, dépendance), pas d'une entreprise.
- **Aucune référence à Fabrice (Maison & Cinéma) ni à Olivier (CineDesign)**, même anonymisée : ils ne sont pas au courant.
- On ne prétend pas savoir combien ils paient : on pose la question.
- Pas de conseil juridique : on propose un état des lieux technique (qui détient le domaine, le site, les accès).
- Vouvoiement. Signature : Louis.
- Téléphone gardé dans les deux branches : cette cible décroche plus qu'elle ne répond sur LinkedIn.

## Variables par lead

| Variable | Rôle | Exemple |
|---|---|---|
| `{{firstName}}` | prénom | Jean-Marc |
| `{{companyName}}` | entreprise | JM Paysage |
| `{{segment}}` | `2023` pour les clients de 2023 (échéance 48 mois en 2027), vide sinon | 2023 |
| `{{siteObservation}}` | constat factuel sur leur site, facultatif | le formulaire de contact renvoie une erreur |

## Structure (arbre Lemlist, 12 à 15 jours)

```
J0   Email 1
     ├─ Condition : a une URL LinkedIn ?
     │   ├─ OUI
     │   │   J1  Visite du profil LinkedIn
     │   │   J2  Invitation LinkedIn (avec note)
     │   │   J3  Email 2
     │   │   J4  Appel (priorité haute)
     │   │   ├─ Condition : invitation acceptée sous 3 jours ?
     │   │   │   ├─ OUI : message LinkedIn
     │   │   │   └─ NON : rien (la suite par email)
     │   └─ NON
     │       J3  Email 2
     │       J4  Appel (priorité haute)
     │
+2 j  Email 3 : checklist en 4 questions        ← les deux branches se rejoignent
+1 j  Tâche : SMS court (mobile uniquement)
+4 j  Email 4 : fin de boucle
```

LinkedIn trouvés via la base de données Lemlist (14/10) : Alexandre Bourion, Florian Monin, Nicolas Charbin, Allan Scheer. Pas de profil pour Francisco Martins, Joëlle Dadoune, Syril Soubilleau (chez DF Clôtures, Lemlist connaît une « Daisy M., chef d'entreprise », non rattachée à Francisco Martins : non utilisée). Aucun des 7 n'existait avant dans les contacts Lemlist.

## Messages LinkedIn

**Invitation (note standard, ≤ 200 caractères)** : Bonjour {{firstName}}, je vous ai écrit au sujet du site de {{companyName}}. J'aide des dirigeants à reprendre la main sur leur site internet. Au plaisir d'échanger ici. Louis

**Invitation (note Premium, ≤ 300 caractères)** : Bonjour {{firstName}}, je vous ai écrit au sujet du site de {{companyName}}. J'aide des dirigeants qui paient leur site au mois sans en être propriétaires à reprendre la main dessus. Au plaisir d'échanger ici. Louis

**Message après acceptation** :

> Merci d'avoir accepté, {{firstName}}.
>
> Je vous ai écrit par email au sujet du site de {{companyName}}, je fais court ici : beaucoup de sites vitrines sont payés au mois, sur plusieurs années, sans que le dirigeant soit propriétaire ni du site, ni du nom de domaine.
>
> Si c'est votre cas, ou si vous n'êtes pas sûr, je vous propose 15 minutes pour faire le point sur qui détient quoi. Sans engagement, et sans rien vous vendre pendant l'appel.
>
> Louis

---

## Email 1 (J0)

**Objet :** {{companyName}} : votre site vous appartient-il vraiment ?
**Objet (segment 2023) :** {{companyName}} : votre site après 2027 ?

Bonjour {{firstName}},

*[Par défaut]* On reprend en ce moment les sites de dirigeants qui payaient leur site tous les mois, sous forme de location, sans jamais en être propriétaires. Parfois plus de 10 000 € au total, pour un site qu'ils ne pouvaient pas modifier eux-mêmes et des noms de domaine qui n'étaient pas à leur nom.

*[Segment 2023]* Beaucoup de sites vitrines ont été vendus en 2023 sous forme de location sur 48 mois. Si c'est votre cas, votre engagement se termine courant 2027, et c'est maintenant qu'il faut préparer la suite : selon les contrats, il peut être reconduit tacitement, ou le site peut disparaître le jour où les loyers s'arrêtent.

*[Si `siteObservation`]* En regardant le site de {{companyName}}, j'ai remarqué que {{siteObservation}}.

Ce n'est peut-être pas votre situation, mais trois questions valent d'être posées :
- Combien payez-vous chaque mois pour votre site, et jusqu'à quand ?
- Le nom de domaine est-il à votre nom ?
- Pouvez-vous modifier un texte ou une photo sans passer par quelqu'un ?

Si une de ces réponses vous gêne, je vous propose un état des lieux gratuit de 15 minutes : on regarde ensemble qui détient quoi (domaine, hébergement, accès), sans rien vous vendre pendant l'appel.

Louis
Orem

---

## Email 2 (J3, en réponse au fil)

Bonjour {{firstName}},

Pour être plus concret, voici ce qu'on retrouve le plus souvent quand un dirigeant nous montre le site qu'il paie au mois :
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

À noter dans Pipedrive : mensualité, durée restante, propriétaire du domaine, satisfaction.

---

## Email 3 (J7, en réponse au fil)

Bonjour {{firstName}},

Je vous laisse une checklist rapide, à garder même si on ne se parle pas :

1. **Votre contrat** : est-ce un contrat de location avec un organisme de financement, distinct de l'agence ? Si oui, les loyers peuvent continuer même si l'agence ne fait plus rien.
2. **Votre nom de domaine** : tapez-le sur un site « whois ». Le titulaire doit être {{companyName}}, pas un prestataire.
3. **Vos accès** : avez-vous l'identifiant et le mot de passe de l'administration du site ?
4. **Votre formulaire de contact** : envoyez-vous une demande test. Arrive-t-elle bien dans votre boîte mail (et pas en spam) ?

Si une seule de ces vérifications coince, répondez « état des lieux » et on regarde ça ensemble.

Louis

---

## SMS (J8) : tâche, seulement sur un mobile

Bonjour {{firstName}}, Louis de l'agence Orem. Je vous ai écrit au sujet du site de {{companyName}} : si vous le payez encore au mois, je vous offre 15 min pour vérifier qui en est vraiment propriétaire. Bonne journée.

---

## Email 4 (J12) : fin de boucle

**Objet :** je ferme le dossier {{companyName}}

Bonjour {{firstName}},

Je n'insiste pas davantage. Si votre site vous appartient et vous donne satisfaction, tant mieux, c'est ce qu'on souhaite à tout le monde.

Et si un jour vous voulez sortir d'un abonnement ou reprendre la main sur votre site, voici ce qu'on propose :
- un site livré en 30 jours, à votre nom, prix fixe annoncé dès le départ ;
- paiement échelonné sans frais, calé sur les étapes du projet ;
- formation incluse pour être autonome, et deux mois de suivi après la mise en ligne.

Il suffit de répondre à ce message.

Louis
Orem

---

## Avant de lancer

1. Validation de Théophile.
2. Remplir `{{segment}}` et `{{siteObservation}}` lead par lead. La campagne est petite (30 à 40 entreprises) : pas d'envoi en masse.
3. Ne pas importer Emeline Russier (litige en cours) ni Delphine Belleville (activité fermée).
4. RGPD : adresses professionnelles uniquement, lien de désinscription actif.
