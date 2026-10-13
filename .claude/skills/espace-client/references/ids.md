# IDs et structures

Relevés le 2026-10-13 sur l'espace Groupe Verdon (dernier espace créé) et le template. Si un ID ne répond plus, le rechercher puis mettre à jour ce fichier.

## Notion

| Élément | ID / URL |
|---|---|
| Page « Clients » | `285897c5a62a80f99ebffeecc06e9e70` |
| Base « Galerie des espaces clients » | data source `collection://2a1897c5-a62a-804e-a602-000b9f13ec7f` |
| **Template espace client** (template par défaut de la galerie) | `306897c5a62a80819f67ee22367f638d` — « Espace client - Nom du client » |
| Exemple de référence rempli | Espace client Groupe Verdon `3ec897c5a62a81d1a2f4e4324fd6efc6` |
| SOP Signature projet | `31a897c5a62a8160b81ee23674aee918` |
| SOP Maquettes Figma | `31a897c5a62a81d6a89bcd745e08d81d` |

Propriétés de la galerie :
- `Nom` (titre) : `Espace client <Client>`
- `Date` (plage) : début → fin prévue
- `Étapes` (multi-select) : `Prospection`, `Onboarding et préparation`, `Cadrage & architecture`, `Design des maquettes`, `Intégration sur Webflow`, `Mise en ligne & formation`, `Suivi post‑lancement`, `Off boarding`, `Suivi Partenaire Webflow`, `Archive`

Sous-pages du template (recréées à chaque duplication, IDs différents) : Introduction · Liens utiles · Documents administratifs · Formation Webflow · Contact & rendez-vous · (page « Nouvelle demande », titre vide). Base inline « Programme & Livrables » (une par espace, data source propre à re-`fetch`).

## Google Drive (compte iconokom@gmail.com)

| Élément | ID |
|---|---|
| Racine clients | `1NcUYprn-4Rj4TtXBv2KaMGZr-5ALgTPD` (contient `00_TERMINÉ`, `01_EN_COURS`, `02_À_VENIR`) |
| **01_EN_COURS** (où créer) | `1CkI9R8DVQ4e_DC_VExTpKNBJHtYBcnA6` |
| 00_TERMINÉ | `1kCrscP5Fyg46ZhWgYQNQb0O8knsW8eK_` |
| 02_À_VENIR | `12BVK7RkTaUu3liUA8GtCNDGoEIS2wU7K` |
| Modèle doc « Bienvenue 👋 - À LIRE » (Verdon, à adapter) | `1CTUsYO5Z5yM1JftIXM0vYQdqisReP32e3q9FLPxYSNo` |

Arborescence standard (nom du dossier racine : `<Client> - <Prénom Nom du contact>`, ex. `Groupe Verdon - Luc Gerodez`) :

```
<Client> - <Contact>/
├── 00 - ESPACE CLIENT/            ← partagé au client (writer), lien mis dans Notion
│   ├── Bienvenue 👋 - À LIRE      (Google Doc)
│   ├── 01-ADMIN/
│   │   ├── 01 - PROPOSITION COMMERCIALE/
│   │   ├── 02 - DEVIS/
│   │   ├── 03 - FACTURES/
│   │   └── 04 - CONTRAT SIGNÉ & BON DE COMMANDE/
│   ├── 02-CONTENUS CLIENT/
│   │   ├── 00 - COMMUN / SHARED (logos, charte, documents partagés)/
│   │   └── 0N - <PRÉNOM NOM>/     (optionnel : un par personne côté client)
│   └── 03-LIVRABLES/
├── 01 - POST-PRESTATION/          ← interne
└── 02 - ITW-VIDEOS/               ← interne
```

## Figma

- Template ICONOKOM : **à renseigner** (lien demandé à Louis au premier lancement, puis noté ici).
- Nom du fichier : `<Client> — Site web`. Pages attendues : Commençons, Identité graphique, Arborescence, Wireframes.
- Partage client : « Can view » uniquement.

## Abby

- Expéditeur des mails : `nepasrepondre@abby.fr` (copie à iconokom@gmail.com). Numérotation : devis `D-AAAA-NNNN`, factures `F-AAAA-NNNN`.
- API : voir `abby.md`.

## Autres

- Formulaire de cadrage : bloc lié dans « Liens utiles » du template (rien à faire).
- Tutoriel Webflow (checklist) : https://www.loom.com/share/8b9f66df6c52449fa0ff18afea1658b3
- Visio : https://cal.com/iconokom/rendez-vous-de-30-min
