# Espace client Orem

Le nouvel espace client d'Orem : une seule app web, à nos couleurs, qui remplace le trio Notion + Google Drive + liens éparpillés.

- **Côté client** : où en est le projet, la prochaine étape, ce qu'on attend de lui, les validations (feu vert horodaté), le dépôt de fichiers (sans compte Google), les devis, factures et le RIB, l'équipe.
- **Côté agence** : la liste des clients avec ce qui attend une action, et pour chaque client le pilotage (étape, prochaine étape, note de la semaine, livrables), les validations, les fichiers reçus et partagés, les factures, les accès, l'historique.
- **Maquettes en direct** (Figma), **messages et vidéos** de l'équipe (Loom), **boîte à outils** (fiche teaser de bien, kit de marque, signature e-mail, demande d'évolution, vidéos Webflow) et **bibliothèque** des visuels et cas d'étude.
- **Accueil guidé** à la première connexion, adapté au moment du projet (démarrage, en cours, livré).
- **Connexion** : par e-mail, avec un lien ou un code à 6 chiffres. Pas de mot de passe, pas de compte Google, pas de Notion.

> **Statut : version de travail, en local uniquement.** Rien n'est en ligne et rien ne doit l'être sur un nom de domaine avant validation.

## Lancer en local

Il faut seulement Node.js 20 ou plus récent (aucune dépendance à installer).

```bash
cd espace-client-orem/app
node server.js
```

Puis ouvrir http://localhost:3000.

Comptes d'exemple (recréés si on supprime `app/data/`). Maison Lumen et Cabinet Varenne sont fictifs. L'espace Huchet-Demorge reprend les contenus publics du cas client Orem ; sa facturation et ses messages sont des exemples.

| Rôle | E-mail |
|---|---|
| Agence | `louis@agence-orem.fr` (aussi `theophile@…`, `clement@…`) |
| Client | `julie@cabinet-varenne.fr` (démarrage) · `claire@maisonlumen.fr` (en cours) · `hugo@huchet-demorge.fr` (livré, tutoiement) |

En local, aucun e-mail n'est envoyé : le code de connexion s'affiche dans le terminal et sur l'écran de connexion.

Pour repartir de zéro : supprimer le dossier `app/data/` (base `db.json` et fichiers déposés).

## Version de test en ligne

Guide pas à pas : [`docs/MISE-EN-LIGNE-TEST.md`](docs/MISE-EN-LIGNE-TEST.md) (DNS, e-mails Brevo ou Google Workspace, installation en une commande sur le VPS avec `app/deploy/installer.sh`, tests à faire). En version de test, un bandeau reste affiché et les e-mails ne partent qu'aux adresses @agence-orem.fr.

## Organisation

```
app/
├── server.js          serveur HTTP sans dépendance : connexion, droits, API, dépôt et téléchargement de fichiers
├── public/
│   ├── core.js        logique métier partagée (offres en 4 temps O.R.E.M., validations, relances, droits par rôle)
│   ├── app.js         interface (vue client et vue agence)
│   ├── styles.css     DA Orem adaptée à une app
│   └── index.html
└── data/              (non versionné) db.json + uploads/
docs/
├── conception.md      choix UX, DA, sécurité et chemin vers la mise en ligne
└── captures/
```

Voir [docs/conception.md](docs/conception.md) pour le détail des choix et la suite, et [docs/simulation-parcours.md](docs/simulation-parcours.md) pour la simulation de 5 parcours clients.

Démo autonome (sans serveur) : `node build-demo.js` produit `dist/espace-client-demo.html`.
