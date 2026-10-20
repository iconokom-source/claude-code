# Mode 2 — Appliquer une modification (une à la fois)

Chaque modification suit les sept étapes ci-dessous, sans en sauter. Une modification = une fiche `P-xx` de l'audit (ou une demande ponctuelle traitée de la même façon).

## 1. Relire l'état actuel

Relire **maintenant** (pas de mémoire ni d'après l'audit, le site a pu changer) tout ce qui est touché : bloc de code, scripts appliqués, éléments et leurs attributs, classes, interactions, items CMS. Si l'état diffère de l'audit, le dire et adapter le plan.

## 2. Présenter le plan et attendre l'accord

```
P-xx — <titre>
Ce qui change : <précis : quel bloc, quelles lignes, quels éléments, sur quelles pages>
Pourquoi : <constat chiffré>
Gain attendu : <indicateur, valeur>
Risque : <ce qui pourrait casser> → vérifications prévues : <liste>
Retour arrière : <comment, en combien de temps>
Publication : sous-domaine webflow.io pour vérification, production seulement après ton ok
Ok pour appliquer ?
```

Ne rien écrire avant un « ok » explicite.

## 3. Sauvegarder

Créer `site-orem/sauvegardes/<AAAA-MM-JJ>-P-xx/` avec, selon ce qui est touché :
- `avant-head.html`, `avant-footer.html` : blocs de code global ou de page, contenu exact ;
- `avant-scripts.json` : scripts appliqués au site / à la page (id, version, emplacement, attributs) ;
- `avant-source-<script>.js` : source des scripts hébergés concernés ;
- `avant-elements.json` : sous-arbre des éléments touchés (ids, classes, attributs, réglages) ;
- `avant-styles.json` : classes touchées, tous breakpoints et états ;
- `avant-cms.json` : items ou champs touchés ;
- `README.md` : ce qui a été sauvegardé et comment le restaurer.

Pour un lot risqué, demander en plus à l'utilisateur de créer une sauvegarde manuelle dans Webflow (réglages du site > Backups) : elle restaure tout le site en un clic.

## 4. Appliquer

- Une seule modification logique. Écrire le nouveau contenu dans un fichier, faire un `diff` avec la sauvegarde, vérifier que seul ce qui est prévu change, puis envoyer.
- Retrait de code : d'abord mettre en place et vérifier le remplaçant (natif ou allégé), ensuite retirer l'ancien code. Pour un script, préférer le désappliquer (`remove_site_script`) plutôt que le supprimer : il reste enregistré et se réapplique en une commande. La suppression définitive des versions mortes est une fiche à part.
- Déplacement de code d'un niveau site vers une page : ajouter d'abord sur la page, vérifier, puis retirer du global.

## 5. Vérifier

1. Relire ce qui a été écrit (l'outil a-t-il tout pris ? encodage, caractères spéciaux).
2. `element_snapshot_tool` sur les éléments touchés si le Designer est ouvert.
3. Publier sur le **sous-domaine Webflow uniquement** (`publish_site` avec `publishToWebflowSubdomain: true`, `customDomains: []`). Prévenir avant : cela publie aussi les autres changements en attente sur le sous-domaine.
4. Playwright sur `orem.webflow.io` pour chaque page concernée : captures à 1440 / 991 / 767 / 390 px comparées aux captures de référence, erreurs console, comportement (clic, survol, scroll, animation, formulaire, widget), requêtes réseau.
5. Mesurer : Lighthouse avant / après sur les mêmes pages, même réglage, médiane de trois passages.
6. Si quelque chose ne va pas : restaurer immédiatement depuis la sauvegarde, republier le sous-domaine, et expliquer.

## 6. Montrer le résultat et demander la mise en production

```
P-xx appliqué sur orem.webflow.io
Vérifié : <liste des contrôles, OK / écarts>
Mesure : <indicateur> avant → après
Captures : <chemins>
Publier en production (agence-orem.fr) ?
```

Publier en production seulement sur un « oui » pour cette publication. Après publication, recontrôler rapidement le domaine réel (une capture, console, un clic sur le CTA principal).

## 7. Consigner

Dans `site-orem/journal.md` : date, P-xx, ce qui a changé, mesure avant/après, chemin de la sauvegarde, statut (appliqué sous-domaine / en production / annulé). Committer et pousser `site-orem/`.

## Retour arrière

- Code global ou de page : réécrire le bloc avec `avant-*.html`.
- Script : `add_site_script` / `add_page_script` avec l'id, la version et les attributs de `avant-scripts.json`.
- Classes : `update_style` avec les valeurs de `avant-styles.json` (par breakpoint et pseudo-état).
- Éléments supprimés : impossible par l'outil → sauvegarde Webflow (Backups) ; d'où la règle de ne pas supprimer d'éléments sans sauvegarde manuelle.
- Puis republier le sous-domaine, vérifier, et la production si elle était touchée.
