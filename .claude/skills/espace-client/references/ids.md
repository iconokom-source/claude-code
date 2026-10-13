# IDs et structures

Relevés le 2026-10-13 sur l'espace Groupe Verdon (dernier espace créé) et le template. Si un ID ne répond plus, le rechercher puis mettre à jour ce fichier.

## Notion

| Élément | ID / URL |
|---|---|
| Page « Clients » | `285897c5a62a80f99ebffeecc06e9e70` |
| Base « Galerie des espaces clients » | data source `collection://2a1897c5-a62a-804e-a602-000b9f13ec7f` |
| **Template espace client** (template par défaut de la galerie, mis à jour le 13/10/2026) | `306897c5a62a80819f67ee22367f638d` — « Espace client - Nom du client » |
| Exemple de référence rempli | Espace client Groupe Verdon `3ec897c5a62a81d1a2f4e4324fd6efc6` |
| SOP Signature projet | `31a897c5a62a8160b81ee23674aee918` |
| SOP Maquettes Figma | `31a897c5a62a81d6a89bcd745e08d81d` |

Propriétés de la galerie :
- `Nom` (titre) : `Espace client <Client>`
- `Date` (plage) : début → fin prévue
- `Étapes` (multi-select) : `Prospection`, `Onboarding et préparation`, `Cadrage & architecture`, `Design des maquettes`, `Intégration sur Webflow`, `Mise en ligne & formation`, `Suivi post‑lancement`, `Off boarding`, `Suivi Partenaire Webflow`, `Archive`

Sous-pages du template (recréées à chaque création, IDs différents) : Introduction · Liens utiles · Documents administratifs · Formation Webflow · Contact & rendez-vous. Base inline « Programme & Livrables » (une par espace, data source propre à re-`fetch`).

## Google Drive (compte iconokom@gmail.com)

| Élément | ID |
|---|---|
| Racine clients | `1NcUYprn-4Rj4TtXBv2KaMGZr-5ALgTPD` (contient `00_TERMINÉ`, `01_EN_COURS`, `02_À_VENIR`) |
| **01_EN_COURS** (où créer) | `1CkI9R8DVQ4e_DC_VExTpKNBJHtYBcnA6` |
| 00_TERMINÉ | `1kCrscP5Fyg46ZhWgYQNQb0O8knsW8eK_` |
| 02_À_VENIR | `12BVK7RkTaUu3liUA8GtCNDGoEIS2wU7K` |
| **RIB Qonto ICONOKOM** (seul IBAN valide, à copier dans chaque `01-ADMIN`) | `1C1Lc4OWqayxdG095uQhmlxPxS8PaxeGq` (`iban_fr (2).pdf`) |

⚠️ Les fichiers `RIB_S_A_R_L__ICONOKOM_2876.pdf` / `RIB ICONOKOM.pdf` sont l'**ancien compte Crédit Agricole, clôturé** : ne jamais les utiliser.

Coordonnées bancaires (à afficher en clair) : titulaire ICONOKOM, 34 place du Général de Gaulle, Bureau 3, 59000 Lille · IBAN `FR76 1695 8000 0188 1420 4296 259` · BIC `QNTOFRP1XXX` (Qonto).

Arborescence standard (référence : The Rep, Sleepee By Tim ; Verdon est une exception avec un sous-dossier par personne). Nom du dossier racine : `<Client> - <Prénom Nom du contact>` :

```
<Client> - <Contact>/
├── 00 - ESPACE CLIENT/            ← partagé au client (writer), lien mis dans Notion
│   ├── Bienvenue 👋 - À LIRE      (Google Doc)
│   ├── 01-ADMIN/
│   │   ├── IBAN ICONOKOM.pdf      (copie du RIB Qonto)
│   │   ├── 01 - PROPOSITION COMMERCIALE/
│   │   ├── 02 - DEVIS/
│   │   ├── 03 - FACTURES/
│   │   └── 04 - CONTRAT/
│   ├── 02-CONTENUS CLIENT/        ← lien « déposer mes contenus » (checklist, Liens utiles, mail)
│   │   ├── 01-IMAGES/PHOTOS/
│   │   ├── 02-VIDÉOS/
│   │   └── 03-DOCUMENTS/TEXTES/
│   └── 03-LIVRABLES/
├── 01 - POST-PRESTATION/          ← interne
└── 02 - ITW-VIDEOS/               ← interne
```

Texte du doc `Bienvenue 👋 - À LIRE` (version tutoiement ; passer au vous si besoin) :

```
Bienvenue 👋

Cet espace centralise tous les éléments utiles à <projet, ex. la refonte du site du Crayon>.

01-ADMIN
→ les documents administratifs (proposition commerciale, devis, factures).

02-CONTENUS CLIENT
→ dépose ici tous les contenus nécessaires au projet :
   • 01-IMAGES/PHOTOS : photos, images, logos
   • 02-VIDÉOS : vidéos
   • 03-DOCUMENTS/TEXTES : textes, charte graphique, présentations, documents

03-LIVRABLES
→ nous y déposerons les livrables du projet (maquettes, site final, documents associés).

Un doute sur l'endroit où déposer un élément ? Écris-nous à contact@iconokom.fr, on s'en occupe.
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
