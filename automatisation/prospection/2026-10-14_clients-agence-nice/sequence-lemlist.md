# Séquence Lemlist : « Site payé au mois, jamais vraiment à vous »

Préparée le 14/10/2026. Statut : brouillon, rien créé dans Lemlist, aucun lead importé.

## Cible

Les clients affichés en référence par une agence web niçoise (11 réalisations publiques, 7 avis Google datés de juin à novembre 2023). C'est le même schéma que Maison & Cinéma et CineDesign : site vendu sous forme de location financière (organisme de financement tiers, loyers mensuels sur plusieurs années), prestations facturées mais non livrées, modifications impossibles, noms de domaine non maîtrisés, plus de 10 000 € payés au total.

La liste des prospects (site, décideur, contacts) est dans `prospects.md`.

## Règles de rédaction (à respecter)

- **Ne jamais nommer l'agence ni l'organisme de financement**, et ne pas parler d'« arnaque » ou d'« escroquerie ». En B2B, citer un concurrent nommément en le dénigrant, c'est du dénigrement fautif (art. 1240 du Code civil). Et ces prospects ont laissé un avis positif en 2023 : les attaquer sur leur propre choix les braque. On parle d'un **schéma** (location, abonnement, dépendance), pas d'une entreprise.
- On ne prétend pas savoir combien ils ont payé : on pose la question.
- Maison & Cinéma et CineDesign sont cités **anonymement** tant que Fabrice et Olivier n'ont pas donné leur accord par écrit pour être cités.
- Pas de conseil juridique : on renvoie vers leur avocat, on propose seulement un état des lieux technique (qui détient le domaine, le site, les accès).
- Vouvoiement (artisans, restaurateurs, professions libérales de la Côte d'Azur).
- Téléphone en priorité : la cible décroche plus vite qu'elle ne répond sur LinkedIn.

## Variables par lead

| Variable | Exemple |
|---|---|
| `{{firstName}}` | Jean-Marc |
| `{{companyName}}` | JM Paysage |
| `{{metier}}` | paysagiste |
| `{{siteObservation}}` | le formulaire de contact renvoie une erreur / le site n'a pas bougé depuis 2023 / la page Réalisations est vide |

## Structure (12 jours)

| J | Canal | Étape |
|---|---|---|
| 0 | Email | Email 1 : la question qui fâche (qui possède votre site ?) |
| 1 | LinkedIn | Visite de profil (si URL) |
| 3 | Email | Email 2 : le cas anonymisé de deux dirigeants qu'on accompagne |
| 4 | Téléphone | Appel (tâche manuelle, priorité haute) |
| 7 | Email | Email 3 : la checklist en 4 questions |
| 8 | SMS / tâche | Message court si numéro mobile et pas de réponse |
| 12 | Email | Email 4 : fin de boucle |

---

## Email 1 (J0)

**Objet A :** {{companyName}} : votre site vous appartient-il vraiment ?
**Objet B :** une question sur le site de {{companyName}}

Bonjour {{firstName}},

Je vous écris pour une raison précise : on accompagne en ce moment deux dirigeants de la région qui payaient leur site internet tous les mois depuis des années, sous forme de location, sans jamais en être propriétaires.

Au total, plus de 10 000 € chacun. Pour un site qu'ils ne pouvaient pas modifier eux-mêmes (même pas changer un logo), des prestations prévues au contrat jamais livrées, et des noms de domaine qui n'étaient pas à leur nom.

En regardant {{companyName}}, j'ai remarqué que {{siteObservation}}. Ce n'est peut-être pas votre situation, mais la question vaut d'être posée :

- Combien payez-vous chaque mois pour votre site, et jusqu'à quand ?
- Le nom de domaine est-il à votre nom ?
- Pouvez-vous modifier un texte ou une photo sans passer par quelqu'un ?

Si une de ces réponses vous gêne, je vous propose un état des lieux gratuit de 15 minutes. On regarde ensemble qui détient quoi (domaine, hébergement, accès), sans rien vous vendre pendant l'appel.

Théophile
Orem

### Variante pour les clients de 2023 (variable `{{segment}}` = `2023`)

Les contrats de ce type durent souvent 48 mois : signé en 2023, il arrive à échéance en 2027. On remplace le premier paragraphe par :

> Beaucoup de sites vitrines de la région ont été vendus en 2023 sous forme de location sur 48 mois. Si c'est votre cas, votre engagement se termine courant 2027, et c'est maintenant qu'il faut préparer la suite : selon les contrats, il peut être reconduit tacitement, ou le site peut disparaître le jour où les loyers s'arrêtent.

Objet : **{{companyName}} : votre site après 2027 ?**

---

## Email 2 (J3, en réponse au fil)

Bonjour {{firstName}},

Pour vous donner une idée concrète de ce que je voyais derrière ma question.

L'un des deux dirigeants dont je vous parlais conçoit des salles de cinéma privées haut de gamme. Il payait environ 600 € par mois. Résultat après un an : trois sites différents qui se concurrençaient sur Google, 15 visiteurs par mois à eux trois, et zéro demande de contact depuis le site.

Ce qu'on a fait avec lui :
- un seul site, à son nom, avec ses vrais chantiers mis en avant ;
- un prix fixe, payé en plusieurs fois **selon les étapes du projet** (maquette validée, mise en ligne, 30 jours après), pas un loyer sans fin ;
- une formation pour qu'il modifie lui-même ses textes et ses photos ;
- ses anciens noms de domaine récupérés et redirigés.

Son ami, dans la même situation, a pu se faire rembourser avec l'aide de son avocat. On n'est pas juristes, mais on peut vous aider à y voir clair sur la partie technique.

Ça vaut 15 minutes ?

Théophile

---

## Appel (J4) : tâche manuelle, priorité haute

**Titre :** Appel {{companyName}} : site en location ?

Script :

> Bonjour {{firstName}}, Théophile de l'agence Orem. Je vous ai écrit cette semaine au sujet de votre site. Je vous appelle parce qu'on aide en ce moment des chefs d'entreprise qui payaient leur site au mois, sans en être propriétaires. Une question simple : aujourd'hui, vous payez quelque chose tous les mois pour votre site ?
>
> **Si oui :** Vous savez jusqu'à quand, et si le nom de domaine est à votre nom ? → proposer l'état des lieux de 15 minutes, caler le créneau.
> **Si non / satisfait :** Parfait, c'est la bonne situation. Si un jour vous voulez refaire le site, je vous laisse mon contact. → noter dans Pipedrive, sortir le lead de la séquence.

À noter dans Pipedrive : mensualité, durée restante, propriétaire du domaine, niveau de satisfaction.

---

## Email 3 (J7, en réponse au fil)

Bonjour {{firstName}},

Je vous laisse une checklist rapide, à garder même si on ne se parle pas :

1. **Votre contrat** : est-ce un contrat de location avec un organisme de financement, distinct de l'agence ? Si oui, les loyers peuvent continuer même si l'agence ne fait plus rien.
2. **Votre nom de domaine** : tapez-le sur un site « whois ». Le titulaire doit être {{companyName}}, pas l'agence.
3. **Vos accès** : avez-vous l'identifiant et le mot de passe de l'administration du site ?
4. **Votre formulaire de contact** : envoyez-vous une demande test. Arrive-t-elle bien dans votre boîte mail (et pas en spam) ?

Si une seule de ces vérifications coince, répondez « état des lieux » et on regarde ça ensemble.

Théophile

---

## SMS (J8) : tâche manuelle, seulement sur un mobile

Bonjour {{firstName}}, Théophile de l'agence Orem. Je vous ai écrit au sujet du site de {{companyName}} : si vous le payez encore au mois, je vous offre 15 min pour vérifier qui en est vraiment propriétaire. Bonne journée.

---

## Email 4 (J12) : fin de boucle

**Objet :** je ferme le dossier {{companyName}}

Bonjour {{firstName}},

Je n'insiste pas davantage. Si votre site vous appartient et vous donne satisfaction, tant mieux, c'est exactement ce qu'on souhaite à tout le monde.

Et si un jour vous voulez sortir d'un abonnement ou reprendre la main sur votre site, voici ce qu'on propose :
- un site livré en 30 jours, à votre nom, prix fixe annoncé dès le départ ;
- paiement échelonné sans frais, calé sur les étapes du projet ;
- formation incluse pour être autonome, et deux mois de suivi après la mise en ligne.

Il suffit de répondre à ce message.

Théophile
Orem

---

## À valider avant de lancer

1. **Accord de Fabrice et d'Olivier** pour l'Email 2, même anonymisé : les détails (salles de cinéma, 600 €/mois, remboursement) les rendent reconnaissables auprès de leur ancienne agence. Sans accord, remplacer par « un artisan haut de gamme » et retirer le remboursement.
2. **Expéditeur** : signé Théophile (il a suivi Fabrice), à basculer sur Louis si la boîte d'envoi est la sienne.
3. **Volume** : 11 entreprises et 7 auteurs d'avis, donc une campagne à traiter presque à la main. Remplir `{{siteObservation}}` lead par lead, ne pas l'envoyer en masse.
4. **RGPD** : prospection B2B sur adresses professionnelles, avec lien de désinscription et mention de la source des données, ça passe. Pas d'adresses perso (gmail) sans contact préalable.
