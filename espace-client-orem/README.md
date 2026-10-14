# Espace client Orem

Le nouvel espace client d'Orem : une seule app web, à nos couleurs, qui remplace le trio Notion + Google Drive + liens éparpillés.

- **Côté client** : où en est le projet, la prochaine étape, ce qu'on attend de lui, les validations (feu vert horodaté), le dépôt de fichiers (sans compte Google), les devis, factures et le RIB, l'équipe.
- **Côté agence** : la liste des clients avec ce qui attend une action, et pour chaque client le pilotage (étape, prochaine étape, note de la semaine, livrables), les validations, les fichiers reçus et partagés, les factures, les accès, l'historique.
- **Connexion** : par e-mail, avec un lien ou un code à 6 chiffres. Pas de mot de passe, pas de compte Google, pas de Notion.

> **Statut : version de travail, en local uniquement.** Rien n'est en ligne et rien ne doit l'être sur un nom de domaine avant validation.

## Lancer en local

Il faut seulement Node.js 20 ou plus récent (aucune dépendance à installer).

```bash
cd espace-client-orem/app
node server.js
```

Puis ouvrir http://localhost:3000.

Comptes d'exemple (données fictives, recréées si on supprime `app/data/`) :

| Rôle | E-mail |
|---|---|
| Agence | `louis@agence-orem.fr` (aussi `theophile@…`, `clement@…`) |
| Client | `claire@maisonlumen.fr` · `hugo@atelier-nord.fr` (tutoiement) · `julie@cabinet-varenne.fr` |

En local, aucun e-mail n'est envoyé : le code de connexion s'affiche dans le terminal et sur l'écran de connexion.

Pour repartir de zéro : supprimer le dossier `app/data/` (base `db.json` et fichiers déposés).

## Organisation

```
app/
├── server.js          serveur HTTP sans dépendance : connexion, droits, API, dépôt et téléchargement de fichiers
├── public/
│   ├── core.js        logique métier partagée (modèle de projet, 5 étapes, validations, droits par rôle)
│   ├── app.js         interface (vue client et vue agence)
│   ├── styles.css     DA Orem adaptée à une app
│   └── index.html
└── data/              (non versionné) db.json + uploads/
docs/
├── conception.md      choix UX, DA, sécurité et chemin vers la mise en ligne
└── captures/
```

Voir [docs/conception.md](docs/conception.md) pour le détail des choix et la suite.
