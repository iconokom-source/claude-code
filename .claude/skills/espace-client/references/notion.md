# Remplissage de l'espace Notion

Toujours `fetch` la page dupliquée avant d'écrire (les IDs des sous-pages et de la base Programme & Livrables changent à chaque duplication). Modèle de rendu : l'espace Groupe Verdon (`ids.md`).

## Page principale

- Titre : `Espace client <Client>`.
- Propriétés : `Étapes` = `["Onboarding et préparation"]` (ou `Cadrage & architecture` si la visio de cadrage a déjà eu lieu), `Date` = début → fin prévue.
- **Ma checklist** (colonne gauche) :
  - `J'ai rempli le formulaire de démarrage` → **supprimer la ligne** (on fait toujours une visio de cadrage).
  - `J'ai créé mon compte Webflow…` → lien tutoriel (`ids.md`) ; supprimer si pas de Webflow ; corriger « créer » → « créé ».
  - `J'ai déposé mes contenus dans le Drive` → lien `02-CONTENUS CLIENT`.
  - `J'ai réglé l'acompte de X %` → `Accéder à la facture [ici](<PDF>) · Coordonnées bancaires [ici](<page Documents administratifs>)` ; adapter le pourcentage / « 1er versement (1/4) ». Cocher si payée (Qonto `list_transactions` ou dire de Louis).
  - Supprimer le callout rouge « To do setup » à la fin.
- **Roadmap** (toggles) :
  - Onboarding et lancement : remplacer la ligne « Remplir le formulaire de démarrage » par `Visio de cadrage : <jour date à heure>` (ou « date à caler ensemble »).
  - Cadrage & design : « Accéder aux maquettes → [Ici](<lien Figma>) ».
  - Intégration & mise en ligne : laisser tel quel.

## Documents administratifs (sous-page)

Un callout bleu par document, format Verdon :
```
Devis D-2026-0117, version finale envoyée le 21 septembre 2026 → [Accéder au devis](<lien Drive>)
Proposition présentée le 15 septembre 2026 → [Accéder à la proposition](<lien Drive>)
Facture F-2026-0111 : acompte de 30 % à la commande (4 464,00 € HT), envoyée le 30 septembre 2026 → [Accéder à la facture](<lien Drive>)
```
- Ajouter un toggle `## Contrat signé & bon de commande` (après Proposition commerciale) s'il y a un contrat/BC.
- Factures : remplir le 1er callout, laisser les suivants vides pour les prochaines factures.
- **Toujours** ajouter, après Factures :
  ```
  ## Coordonnées bancaires {toggle="true"}
  	<callout color="blue_bg">
  		**Titulaire** : ICONOKOM, 34 place du Général de Gaulle, Bureau 3, 59000 Lille<br>**IBAN** : FR76 1695 8000 0188 1420 4296 259<br>**BIC** : QNTOFRP1XXX (banque Qonto)
  		→ [Télécharger le RIB](<lien du IBAN ICONOKOM.pdf copié dans 01-ADMIN>)
  	</callout>
  ```
- Liens : toujours vers le **fichier** PDF, jamais vers un dossier. Document sans fichier → texte sans lien, et le signaler dans le récap.
- Ne pas toucher au Brief ni au Formulaire de fin de projet.

## Liens utiles (sous-page)

- Supprimer toute la section « Formulaire de cadrage - Brief » (toggle + callout + bloc lié).
- « Ajouter mes documents » : remplacer le texte du callout par `Dépose ici tous les contenus nécessaires au projet : photos, images, vidéos, textes, logos, charte graphique… → [Accéder au Drive](<lien 02-CONTENUS CLIENT>)` (une seule ligne, format Verdon).
- « Design & Site internet » : « Maquette du site » → lien Figma. Le reste (Prévisualisation Webflow, DA, Arborescence) plus tard.

## Programme & Livrables (base inline)

Re-`fetch` l'espace pour obtenir la data source de la base dupliquée, puis `query` ses lignes. Propriétés : `Nom`, `Étapes` (Étape 01…06), `État` (Pas commencé / En cours / Livré), `Personne` (Louis / Théo / Clément), `Date de livraison`.

Lignes standard (référence Verdon) et état au démarrage :

| Nom | Étape | État au démarrage | Date |
|---|---|---|---|
| Proposition commerciale | 01 | Livré | date d'envoi |
| Devis | 01 | Livré | date du devis final |
| Contrat | 01 | Livré si signé ; si seul le devis est signé, renommer « Devis signé (vaut contrat) » | date de signature |
| Brief | 01 | Pas commencé (Livré si formulaire rempli) | — |
| Arborescence du site | 02 | Pas commencé | — |
| Fiche de style graphique | 02 | Pas commencé | — |
| Maquettes du site | 02 | Pas commencé | — |
| Intégration Webflow | 03 | Pas commencé | — |
| Remise des accès · Formation Webflow | 04 | Pas commencé | — |
| Livraison finale du site | 05 | Pas commencé | — |
| Suivis technique ou évolutif si applicable | 06 | Pas commencé | — |

- Créer les lignes manquantes, mettre à jour celles qui existent (ne pas dupliquer).
- `Personne` : selon la répartition donnée dans la fiche de démarrage (défaut : admin = Louis + Théo, design = Clément, intégration = Louis).
- Ajouter les livrables spécifiques au devis (ex. entretiens, étude de marché, vidéo) s'ils figurent dans la proposition.
