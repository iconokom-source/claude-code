# Remplissage de l'espace Notion

Référence validée : l'espace test Le Crayon (octobre 2026). Tant que le template n'est pas mis à jour, le skill applique toutes les adaptations ci-dessous sur chaque nouvel espace.

Toujours `fetch` la page créée avant d'écrire (les IDs des sous-pages et des bases changent à chaque création). **Un seul registre partout** (tu ou vous selon la fiche) : accueil, Introduction, FAQ, Liens utiles, Contact, Faire une demande, doc Drive, mail.

Règles générales :
- Un lien pointe toujours vers le **fichier** (PDF, Figma…), jamais vers un dossier vide.
- Pas de « Ici » sans lien : si l'élément n'existe pas encore, écrire quand il arrivera (« disponible dès la phase de design »).
- Ne montrer que ce qui sert maintenant (pas de formulaire de fin de projet au démarrage).

## Page principale

- Propriétés : `Nom` = `Espace client <Client>`, `Étapes` = `["Onboarding et préparation"]`, `Date` = date de démarrage (fin seulement si connue).
- **Tout en haut** (insert_content position start) :
  ```
  <callout icon="👉" color="yellow_bg">
  	**Ta prochaine étape : réserver ta visio de cadrage (1 h)**
  	On y cale ensemble tes objectifs, ta cible, le plan du site et les premières pistes graphiques. → [Choisir un créneau](<lien cal.com>)
  </callout>
  ```
  Si la visio est déjà fixée : « Ta prochaine étape : visio de cadrage le <jour date à heure> » + ce qu'il faut préparer. Le bloc change à chaque étape.
- **Ma checklist** : sous-titre « 3 actions pour lancer le projet. », rien de coché, dans cet ordre :
  1. `J'ai réservé ma visio de cadrage (1 h).` → `Choisir un créneau [ici](<cal.com>)`
  2. `J'ai déposé mes contenus dans le Drive.` → `[ici](<02-CONTENUS CLIENT>)`
  3. `J'ai réglé l'acompte de X %.` → `Facture [ici](<PDF>) · RIB [ici](<IBAN ICONOKOM.pdf>)`
  Supprimer : la ligne « formulaire de démarrage » et la ligne Webflow (déplacée dans la roadmap), le callout rouge « To do setup ».
- **Callout de bienvenue** : adapter au registre ; corriger « étapes du projets » → « étapes du projet ».
- **Accès rapides** : renommer la sous-page sans titre (flèche ↗) en `Faire une demande`.
- **Roadmap** (toggles) :
  - Onboarding et lancement : remplacer « Remplir le formulaire de démarrage » par `Visio de cadrage : <date>` (ou « date à caler ensemble »).
  - Cadrage & design : `Accéder aux maquettes → [Ici](<Figma>)` si le lien existe, sinon « Les maquettes Figma seront accessibles ici dès le début de la phase de design. »
  - Intégration & mise en ligne : ajouter « Avant l'intégration, tu créeras ton compte Webflow (l'hébergeur du site, abonnement à ta charge) : on t'envoie le tutoriel vidéo au bon moment et on t'aide à choisir la bonne formule. » + « Le lien de prévisualisation du site sera ajouté ici pendant l'intégration. »
  - Offboarding → titre `Livraison finale` ; Suivi partenaire Webflow → `Suivi après livraison (option)`.
- **Ton équipe** (avant Programme & Livrables) : 3 colonnes, callouts gris 👤 — Louis (chef de projet, interlocuteur principal) · Théophile (stratégie, textes et suivi) · Clément (designer UX/UI, maquettes). Rôles à confirmer par Louis.
- Sous le titre Programme & Livrables : « Dates indicatives, ajustées ensemble après la visio de cadrage. » (gris).

## Programme & Livrables (base inline)

- Titre de la base : `Programme & Livrables`. Colonne `Date de livraison` renommée `Date prévue`. Vue renommée `Planning`, triée par date.
- Options `Étapes` (remplacer Étape 01…06) : `1 · Onboarding`, `2 · Cadrage & design`, `3 · Intégration & mise en ligne`, `4 · Formation & suivi`, `5 · Livraison finale`, `6 · Suivi (option)`. Ajouter les nouvelles options, réaffecter chaque ligne, puis retirer les anciennes.
- Lignes (dates calculées à partir du démarrage et des durées de la FAQ) :

| Nom | Phase | État au démarrage | Date prévue (J = démarrage) |
|---|---|---|---|
| Proposition commerciale | 1 | Livré | date d'envoi |
| Devis | 1 | Livré | date d'envoi |
| Devis signé (ou Contrat signé) | 1 | Livré | date de signature |
| Visio de cadrage (1 h) | 1 | Pas commencé | J+2 ou date fixée |
| Arborescence du site (plan des pages) | 2 | Pas commencé | J+6 |
| Direction artistique (couleurs, typographies, style) | 2 | Pas commencé | J+8 |
| Textes du site (direction éditoriale) | 2 | Pas commencé | J+8 |
| Maquettes du site (Figma) | 2 | Pas commencé | J+15 |
| Intégration du site sur Webflow | 3 | Pas commencé | J+28 |
| Mise en ligne et remise des accès | 3 | Pas commencé | J+31 |
| Formation Webflow (visio) | 4 | Pas commencé | J+35 |
| Livraison finale du site | 5 | Pas commencé | J+38 |
| Suivi technique ou évolutif (option) | 6 | Pas commencé | — |

- Retirer les lignes internes (ex. « Bento Reveal ») : `notion-move-pages` vers le workspace (l'API ne supprime pas), puis le signaler pour suppression manuelle.
- Ajouter les livrables spécifiques au devis s'il y en a (entretiens, étude de marché, vidéo…).

## Documents administratifs (sous-page)

Format des callouts (montants HT **et** TTC, lu sur la facture) :
```
Devis signé — <objet> : <HT> € HT (<TTC> € TTC) → [Accéder au devis signé](<PDF>)
Proposition commerciale présentée le <date> → [Accéder à la proposition](<PDF>)
Facture d'acompte de 50 % : <HT> € HT (<TTC> € TTC), à régler pour lancer le projet → [Accéder à la facture](<PDF>)
<gris> Facture de solde (50 %) : envoyée à la livraison du site.
```
- Ajouter `## Contrat signé & bon de commande` si besoin.
- **Toujours** ajouter après Factures :
  ```
  ## Coordonnées bancaires {toggle="true"}
  	<callout color="blue_bg">
  		**Titulaire** : ICONOKOM, 34 place du Général de Gaulle, Bureau 3, 59000 Lille<br>**IBAN** : FR76 1695 8000 0188 1420 4296 259<br>**BIC** : QNTOFRP1XXX (banque Qonto)
  		→ [Télécharger le RIB](<IBAN ICONOKOM.pdf dans 01-ADMIN>)
  	</callout>
  ```
- **Supprimer** les sections `Brief` (base inline) et `Formulaire de fin de projet` (`allow_deleting_content: true`). Le formulaire de fin de projet revient à la livraison.

## Liens utiles (sous-page)

- Supprimer la section « Formulaire de cadrage - Brief ».
- « Ajouter mes documents » : `Dépose ici tous les contenus nécessaires au projet : photos, images, vidéos, textes, logos, charte graphique… → [Accéder au Drive](<02-CONTENUS CLIENT>)`.
- « Design & Site internet » : chaque élément avec son lien s'il existe, sinon en gras + statut gris (`**Maquette du site** · disponible dès la phase de design`, `**Prévisualisation Webflow** · disponible pendant l'intégration`, `**Direction artistique** / **Arborescence** · après la visio de cadrage`).

## Introduction (sous-page)

`replace_content` avec le texte validé (voir l'espace test Le Crayon) : 5 étapes alignées sur la roadmap (Onboarding · Cadrage & design · Intégration & mise en ligne · Formation & suivi · Livraison finale), bloc Contact avec **un seul** lien WhatsApp par personne (`wa.me`), lien visio cal.com, FAQ sans mention de « Feedbacks » (remplacée par « WhatsApp ou la page Faire une demande »). Adapter au registre.

## Autres sous-pages

- Contact & rendez-vous : « Besoin d'une visio en plus ? Réserve un créneau quand tu veux → » ; liens WhatsApp en `wa.me`.
- Faire une demande : « Une modification, une question, une nouvelle idée ? Clique sur le bouton ci-contre → ».
- Formation Webflow : titre de la base `💻 Formation pour être autonome` (faute « automne » dans le template).
