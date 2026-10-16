# Conception de l'espace client Orem

## 1. Le problème avec l'espace actuel

L'espace actuel (galerie Notion « Espace client ‹Client› » + dossier Google Drive partagé) fonctionne pour l'agence, beaucoup moins pour le client :

- **Trois outils à apprendre** : Notion, Google Drive, puis WhatsApp et cal.com. Une partie des clients ne maîtrise pas Notion.
- **Des comptes imposés** : Drive marche mal sans compte Google, Notion demande une invitation et un compte.
- **Rien n'est à nous** : l'adresse est notion.so ou drive.google.com, avec les interfaces de ces outils.
- **Beaucoup de maintenance manuelle** : chaque espace est rempli à la main (le skill `espace-client` applique une vingtaine de corrections au template à chaque création).
- **Des validations fragiles** : une case cochée dans Notion vaut feu vert, mais rien ne prévient l'équipe et rien ne garde la trace des remarques.

## 2. Ce que recommandent les spécialistes des portails clients

Synthèse des bonnes pratiques publiées par les éditeurs de portails clients (Noloco, Copilot/Assembly, Moxo, Softr, SuiteDash, Jetadmin), recoupées entre elles. Ce sont surtout des contenus d'éditeurs, donc à lire comme des pratiques du marché plutôt que comme des études indépendantes.

1. **Un seul endroit**, à la marque de l'agence, sur son propre domaine, avec des e-mails envoyés depuis ce domaine.
2. **Un point de départ clair** : le client arrive et voit tout de suite ce qu'on attend de lui.
3. **Peu de rubriques, des mots simples** : « Fichiers », « À valider », pas de jargon interne.
4. **Connexion sans mot de passe** (lien magique, code par e-mail) pour les clients peu à l'aise avec les outils. C'est le standard des portails clients d'agence.
5. **Validations explicites** : un bouton « Je valide » et un bouton « Demander des modifications », avec trace écrite.
6. **Mobile d'abord** pour les actions fréquentes (déposer une photo, valider).
7. **Chacun ne voit que ses données**, rôles séparés client / agence.
8. **Ne pas lancer avec trop de fonctions** : fichiers, étapes, validations, factures, contact. Le reste après.

Sources : [Noloco](https://noloco.io/blog/client-portal-best-practices) · [Jetadmin](https://www.jetadmin.io/blog/client-portal-design-how-to-build-a-secure-intuitive-portal-in-2026/) · [Softr](https://softr.io/blog/best-white-label-client-portals) · [Assembly](https://assembly.com/blog/white-label-portal) · [Moxo](https://moxo.com/blog/customize-white-label-client-portal) · [Copilot, liens magiques](https://copilot.app/guide/magic-links) · [SuiteDash, liens magiques](https://help.suitedash.com/article/359-magic-link-login)

## 3. Les choix UX

| Principe | Comment c'est appliqué |
|---|---|
| Une chose à la fois | Un seul grand bloc sombre par écran : **« Prochaine étape »**, avec un seul bouton. Tout le reste est en surfaces neutres. |
| Savoir où on en est | Les 4 temps de la méthode O.R.E.M. (Orienter, Représenter, Exécuter, Mesurer), avec un gabarit par offre (Site web, Direction artistique, Conseil, Évolution) choisi à la création de l'espace. Un livrable lié à une validation reste « À valider » tant que le client n'a pas donné son feu vert. |
| Ce qu'on attend du client | « Vos actions » regroupe automatiquement les validations en attente, les fichiers manquants et les actions ajoutées par l'agence. |
| Feu vert écrit | « À valider » : « Je valide » ou « Demander des modifications » (commentaire obligatoire). Chaque décision est horodatée, l'agence la voit dans son tableau de bord. |
| Déposer sans compte Google | Glisser-déposer de fichiers et de dossiers entiers, sans limite de taille (envoi par morceaux qui reprend tout seul après une coupure), rangement automatique (images, vidéos, textes), et une liste « Ce qu'il nous manque » avec un bouton « Déposer » par élément. |
| Argent clair | Montant HT et TTC, déjà réglé, reste à payer, statut de chaque facture, IBAN copiable. |
| Humain | Photos de l'équipe, WhatsApp, réservation de visio, note « Cette semaine » signée par le chef de projet. |
| Tu ou vous | Réglé par client à la création de l'espace (jamais deviné). |
| Mobile | Barre d'onglets en bas (5 entrées), cibles tactiles de 44 px minimum, aucun défilement horizontal. |
| Accessibilité | Contrastes AA, focus visible, libellés sur tous les champs, navigation clavier, mouvement réduit respecté. |

Côté agence, la liste des clients affiche d'abord ce qui attend une action (« 2 nouveaux fichiers », « Modifications demandées »). Le bouton **« Voir comme le client »** affiche exactement son espace, actions désactivées.

## 4. La DA : Orem, adaptée à une app

La DA des documents Orem (slides 1920×1080, titres à 64 px) ne se transpose pas telle quelle dans une app qu'on consulte tous les jours. Ce qui est gardé et ce qui change :

**Gardé**
- Trykker (serif) pour les titres et les montants, Lexend Deca pour tout le reste. Les deux sont servies en local.
- Encre `#000012`, fond `#f8f8f7` légèrement réchauffé, filets fins.
- La **règle des deux accents** : bleu `#092482` sur fond clair, orange `#ff6200` sur fond sombre. Elle sert aussi au **mode sombre** de l'app : l'accent passe tout seul du bleu à l'orange.
- Le dégradé nuit vers ciel, réservé à un seul objet : la carte « Prochaine étape » et l'écran de connexion.
- Le logo Orem et la signature « Orem, marque d'ICONOKOM ».

**Adapté pour l'app**
- Une échelle de texte d'interface (15 px pour le texte courant, 13 px pour les légendes, 21 à 34 px pour les titres) au lieu de l'échelle des slides.
- **Couleurs d'état** (vert « fait / payé », ambre « à valider / nouveau »), indispensables dans une app et absentes de la palette des documents. Elles ne servent qu'aux pastilles d'état, jamais comme accent.
- Coins arrondis et pastilles, absents des slides, pour rendre les zones cliquables évidentes.
- Un mode sombre complet.

## 5. Sécurité, version locale

- Connexion par code à 6 chiffres ou lien, valable 15 minutes, 5 essais maximum, 5 demandes par adresse et par quart d'heure. La réponse est identique qu'un compte existe ou non.
- Session dans un cookie `HttpOnly`, `SameSite=Lax` (et `Secure` en production), valable 30 jours.
- Toute écriture exige un en-tête propre à l'app (protection contre les requêtes d'un autre site).
- Droits vérifiés côté serveur pour chaque action : un client ne voit que son projet et ne peut que valider, demander des modifications, cocher ses actions et déposer des fichiers. Tout le reste est réservé à l'agence.
- Fichiers stockés hors du dossier public, renommés par un identifiant aléatoire, téléchargés seulement après contrôle des droits.
- Le serveur n'écoute que sur `127.0.0.1` par défaut.

## 6. Ce qui manque avant une mise en ligne (à valider ensemble)

Rien de tout cela n'est fait, volontairement : on valide d'abord l'usage en local.

1. **Envoi réel des e-mails** de connexion et des notifications (nouveau fichier, validation, remarque) depuis une adresse `@agence-orem.fr` (Brevo, déjà utilisé).
2. **Hébergement et sous-domaine**, par exemple `espace.agence-orem.fr`, avec HTTPS. Une fois validé seulement.
3. **Base de données et stockage durables** : remplacer `db.json` par une vraie base (Postgres) et les fichiers par un stockage objet, avec sauvegardes. Option : continuer à copier les fichiers reçus dans le dossier Drive du client pour que l'équipe garde ses habitudes.
4. **Connexions aux outils** : factures depuis Abby, paiements détectés dans Qonto, étape du deal Pipedrive, création automatique de l'espace à la signature.
5. **Reprise des clients en cours** depuis la galerie Notion.
6. Tests utilisateurs avec 2 ou 3 clients avant de généraliser.

## 7. Côté équipe (Louis, Théophile, Clément)

**Tout ajouter, depuis n'importe où.** Le bouton « Ajouter pour un client » (barre latérale, fiche client, barre du bas sur mobile) ouvre une seule fenêtre. On choisit le client, puis ce qu'on ajoute :

| Type | Ce que voit le client |
|---|---|
| Message ou vidéo Loom | Un bandeau sur son accueil, la vidéo dans « Messages », un e-mail |
| Fichier (livrable, devis, facture, contrat, RIB) | Le fichier dans « Fichiers » ou « Documents », un e-mail pour les livrables |
| Validation | La prochaine étape de son accueil, un e-mail |
| Bibliothèque (image ou lien) | Le visuel dans « Bibliothèque » |
| Liens Figma et site | Les maquettes en direct et le bouton « Voir le site » |
| Point de la semaine | La note « Cette semaine » et le prochain rendez-vous |

Chaque ajout est signé (« Ajouté par Clément ») et prévient les autres membres de l'équipe du projet.

**Tout recevoir.**
- **Boîte de réception** commune à l'agence, propre à chacun : dépôts de fichiers, messages, validations, remarques et demandes d'évolution des clients de ses projets. Un clic ouvre la fiche du client sur le bon onglet.
- **Équipe par projet** (onglet « Accès et infos ») : qui est sur le projet et qui est chef de projet. Seuls les membres sont prévenus. Le chef de projet est présenté au client comme son interlocuteur principal.
- **E-mails**, réglables par chacun dans « Réglages » : à chaque nouveauté, un récap par jour à 18 h, ou jamais ; et pour quels événements.
- Le client reçoit aussi un e-mail quand l'équipe lui envoie une vidéo, un livrable ou une validation (s'il l'a accepté pendant son accueil guidé).

**Envoi des e-mails.** En local, rien ne part : chaque e-mail est rangé dans « Réglages › E-mails envoyés », avec un aperçu. Pour envoyer pour de vrai (après validation seulement) :

```bash
MAIL_ENABLED=1 BREVO_API_KEY=… MAIL_FROM=espace@agence-orem.fr BASE_URL=https://espace.agence-orem.fr node server.js
```

La clé Brevo est dans le coffre Notion. Le domaine d'envoi doit être authentifié dans Brevo (SPF et DKIM sur agence-orem.fr) pour éviter les spams.

**Tests.** `node tests/equipe.js` rejoue le circuit complet (dépôt client, boîte de réception, vidéo Loom, bibliothèque, équipe, récap) : 14 vérifications.

## 8. Fin de projet (lot 4)

- **Mise en ligne** (onglet « Mise en ligne » de la fiche client) : fixe la date, passe les trois premiers temps en « Terminé », ouvre « Mesurer », bascule l'accueil du client sur le projet livré et lui envoie un e-mail. La validation « Réception du site » sert de procès-verbal ; l'onglet signale si elle manque. Résultats, marque, outils et vidéos de formation s'y renseignent.
- **Checklist de remise** (accès Webflow, sources Figma, guide, formation, Analytics) visible par le client sur « Mon projet ».
- **Avis** demandé sur l'accueil du client 7 jours après la mise en ligne ; à partir de 4 sur 5, proposition de le publier sur Google (lien dans Réglages). Le témoignage n'est publiable qu'avec l'accord explicite du client.
- **Archivage** : l'espace reste consultable en lecture seule. **Export ZIP** (récapitulatif + fichiers) pour le client comme pour l'agence.
- **Relances automatiques** (une fois chacune) : validation en attente depuis 3 jours ouvrés, facture à régler depuis 10 jours. Le client reçoit un rappel dans son registre, l'équipe le voit dans sa boîte de réception.
- Le point de la semaine part par e-mail au client qui l'a demandé dans son accueil guidé (la promesse WhatsApp, jamais tenue, est retirée).

## 9. Connecteurs (lot 5)

Rien n'est appelé tant que les clés ne sont pas fournies au lancement du serveur. Les clés sont dans le coffre Notion de Louis (skill `cles-api`) et ne sont jamais écrites dans le dépôt. **Aucun branchement sur les vrais comptes sans l'accord de Louis.**

| Outil | Variables | Ce que ça fait |
|---|---|---|
| Pipedrive | `PIPEDRIVE_API_KEY`, `PIPEDRIVE_WEBHOOK_SECRET` | Webhook « Deal mis à jour » vers `/api/hooks/pipedrive` (authentification HTTP `orem` / secret). Un deal gagné prépare l'espace en brouillon (client, montant, contact, chef de projet). L'équipe choisit l'offre et le registre, puis l'accès du client est créé. |
| Abby | `ABBY_API_KEY` | Import du devis signé et des factures, avec leurs PDF, pour les projets dont l'identifiant client Abby est renseigné (« Accès et infos »). Toutes les 6 heures, ou bouton « Synchroniser ». Chemins de l'API à confirmer avec la documentation Abby avant le premier branchement. |
| Qonto | `QONTO_LOGIN`, `QONTO_SECRET_KEY` (option `QONTO_IBAN`) | Chaque heure : un virement reçu du montant TTC d'une facture « À régler », citant son numéro ou le nom du client, la passe en « Payée », coche l'acompte et remercie le client dans son registre. Une seule fois par virement. |
| Google Drive | `GOOGLE_SERVICE_ACCOUNT_JSON` | Copie de chaque fichier déposé par le client dans son dossier Drive (renseigné dans « Accès et infos », partagé avec le compte de service). |
| Paiement en ligne | aucune | Lien de paiement collé par facture (onglet Factures) : le client voit « Payer en ligne ». |

Planning : une validation en retard de plus d'un jour décale tout ce qui vient après (livrables, temps, mise en ligne) et l'équipe est prévenue. Toute synchronisation est « tout ou rien » : si l'outil répond mal, rien n'est modifié.

Tests : `node tests/connecteurs.js` lance un faux serveur local qui imite les quatre outils et une instance de l'app avec de fausses clés de test (28 vérifications, aucun appel hors de la machine).

## 10. Moments waouh (lot 7)

- **Proposition avant signature** : le client la lit dans son espace (détail, HT, TVA, TTC, acompte, validité), l'accepte en cochant et en écrivant son nom ; l'acceptation est horodatée, le devis passe en signé et la facture d'acompte se crée. Il peut aussi poser une question ou décliner avec un mot. L'équipe prépare les propositions dans l'onglet Factures.
- **Devis d'un clic depuis une demande d'évolution** : bouton « Proposer un devis » dans l'onglet Demandes, formulaire prérempli, même parcours d'acceptation pour le client. Les montants des exemples sont fictifs. **Les formules Évolution et leurs prix restent à valider avec Louis** : rien n'est affiché tant que ce n'est pas fait.
- **Mise en ligne mise en scène** : compte à rebours les trois dernières semaines, célébration une fois, kit de lancement pendant 60 jours (avant/après, post LinkedIn prêt à copier, visuels, signature e-mail), puis demande d'avis.
- **Bilan mensuel** depuis Google Analytics 4 et Search Console (propriété et site renseignés par projet), comparé au mois précédent.
- **Versions V1, V2** des maquettes et **commentaires épinglés** sur les écrans : le client clique à l'endroit voulu, l'équipe les marque traités.
- **Assistant** (API Claude, SDK `@anthropic-ai/sdk` en dépendance facultative, clé `ANTHROPIC_API_KEY` dans le coffre) : répond seulement à partir des données du projet, dans le registre du client, renvoie vers l'équipe sinon. Modèle `claude-opus-5-5` par défaut (`ASSISTANT_MODEL` pour en changer), effort bas, repli automatique côté serveur en cas de refus. Sans clé, le panneau s'appelle « Réponses rapides ».
- Vidéo de bienvenue dans l'accueil guidé, prénoms sous les photos, confettis contenus dans le bandeau.

## 11. Demandes du 15 octobre 2026

**Équipe sans hiérarchie.** Louis, Théophile et Clément sont sur tous les projets (création, Pipedrive, données d'exemple). Chacun est présenté par sa fonction, reprise du site (collection « Membres » du Webflow Orem) : Louis Montagne, développeur Webflow ; Théophile Lamouret, stratège ; Clément Saint-Hilaire, directeur de création. Plus de « cofondateur ». Le message de bienvenue, l'invitation et la visite guidée sont signés « L'équipe Orem : Louis, Théophile et Clément ». Un message peut être signé au nom de l'équipe (case dans « Ajouter » et dans l'onglet Messages). Le « chef de projet » devient « contact principal du client ».

**Bien démarrer.** Les trois priorités du client à son arrivée (offre Site web) : régler l'acompte (se coche seul à réception du virement), créer l'espace Webflow de l'entreprise et y inviter l'agence (adresse réglable : `webflowInvite`), donner l'accès au nom de domaine. Le client déclare, l'équipe vérifie (« Vérifié » ou « À reprendre » avec un mot). Pour le domaine, trois voies :
- accès délégué, recommandé, sans mot de passe (consignes par registraire : OVHcloud, Gandi, IONOS, GoDaddy, Squarespace Domains ; à relire par Louis, et renseigner l'identifiant OVH de l'agence dans `ovhNic`) ;
- coffre chiffré : identifiant et mot de passe chiffrés en AES-256-GCM avant d'être écrits (clé `VAULT_KEY` ou `data/vault.key`, à garder hors des sauvegardes), jamais renvoyés dans un projet, un export, un e-mail ou une notification, lisibles par l'équipe seulement, chaque lecture inscrite dans l'historique du client, effacés à la vérification ou au bout de 30 jours ;
- « je ne sais pas qui le gère » : le client donne le nom de domaine, l'équipe retrouve le registraire.

**Bibliothèque.** Uniquement des visuels à télécharger (présentation « bento », planches du cas d'étude), libres d'usage pour la communication du client, sans renvoi vers agence-orem.fr. « Tout télécharger » produit un ZIP des visuels. Connecteur Figma (`FIGMA_TOKEN`, jeton personnel en lecture seule) : il lit le fichier du projet (Outils de l'agence, ou le lien Figma du projet), prend les cadres des pages « Bento… » et « Cas d'étude » dans l'ordre de lecture, les exporte en PNG à 2x et les range dans la bibliothèque. Une nouvelle version du fichier remplace les anciens visuels Figma.

**Vignettes de fichiers.** Partout dans l'appli : l'image elle-même pour les photos, sinon une petite page au format du fichier (PDF rouge, Word bleu, Excel vert, ZIP, vidéo, fichiers de création).

**Logo du client.** Ajouté dans « Accès et infos » (SVG ou PNG transparent) ; affiché dans la barre latérale, l'en-tête de l'accueil et la visite guidée, recoloré en blanc sur fond sombre et en noir sur fond clair (ou laissé dans ses couleurs).

**Qui fait quoi sur chaque étape.** Chaque livrable dit en phrases qui s'en occupe et ce que le client a à faire (« Théophile rédige la proposition », « Vous la lisez et l'acceptez en ligne »), avec un bouton vers l'élément concerné (proposition, devis, créneau, validation, maquettes). Les rôles par défaut suivent la fonction de chacun et se modifient par projet (« Qui fait quoi, lien »). Fiches de l'équipe : Louis, chef de projet et développeur Webflow ; Théophile, stratège, contenus et référencement ; Clément, directeur de création, chacun avec « Contactez-le pour… ». À relire par Louis.

**Avis.** 4 ou 5 étoiles : invitation à publier sur Google (le texte est copié, Google s'ouvre). 3 ou moins : questionnaire de bilan (ce qui n'a pas marché, ce qui a marché, note par point, moment où ça a coincé, ce qu'il aurait fallu), jamais publié, et un appel proposé ; l'équipe reçoit une action « Appeler le client ».

**Signature en ligne.** Propositions et documents (devis, contrat, offre Évolution) : case de consentement, nom tapé et signature tracée facultative. Le serveur ajoute la date, l'adresse IP, le navigateur et l'empreinte SHA-256 du fichier ; un certificat imprimable accompagne chaque document signé. C'est une signature électronique simple (eIDAS, article 25), adaptée aux devis et propositions ; pour un contrat à fort enjeu, un prestataire qualifié reste préférable.

**Évolution.** Pendant le projet, l'entrée « Évolution » est visible dans la navigation mais verrouillée (« l'étape supérieure, après la mise en ligne »). Après la livraison, sans abonnement : ce que comprend l'Évolution et la proposition à signer. Avec l'abonnement (activé par une proposition « offre Évolution » signée, ou par l'équipe) : la prochaine visio de pilotage et « Demander un autre créneau », les axes d'amélioration (responsable, échéance, avancement, priorité du mois), les bilans mensuels (l'essentiel, les chiffres, le travail réalisé, le PDF complet) et les mois suivants. L'accueil du client montre la visio, le dernier bilan et les axes en cours, plus de chiffres en vrac.
