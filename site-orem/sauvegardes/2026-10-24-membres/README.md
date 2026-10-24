# Pages Membres (2026-10-24)

Modèle Membres (`6a759ac144dc0178f0b2fc7b`).
- Head : `avant-head-modele-membres.html` → `apres-head-modele-membres.html`.
  Avant : au chargement, le script rouvrait la modale globale (popstate) : blocage du body (décalage 1,0),
  re-téléchargement de la page elle-même et remplacement du contenu par une copie, puis re-initialisation de Webflow.
  Après : le panneau (déjà affiché ouvert dans le HTML) reste tel quel ; les flèches et ←/→ mènent à la page du membre
  précédent / suivant (ordre de la liste CMS cachée `[data-slug]`) ; fermeture inchangée.
- Photo du membre (élément `de04cbbd-b304-6607-767f-a63b96fd15bb`) : attributs `loading="eager"` et `fetchpriority="high"` ajoutés.
Retour : remettre le head « avant », retirer les 2 attributs.

## Réserve de place de la photo (2026-10-24, v3)
- Collection Membres : 2 champs Nombre ajoutés, « Largeur photo » (`largeur-photo`, id 0a237bc2…) et « Hauteur photo » (`hauteur-photo`, id 5e6ba289…),
  remplis : Louis 1506×1761, Théophile 1150×1364, Clément 725×1086.
- Photo du modèle : attributs `data-largeur` / `data-hauteur` liés à ces champs (`width`/`height` sont réservés par Webflow), en plus de loading/fetchpriority.
- Head du modèle : petit MutationObserver qui pose `aspect-ratio` sur la photo dès son insertion (avant-v3 → apres-head-modele-membres.html).
Retour : retirer le bloc « Photo du membre » du head, les 2 attributs data- et (optionnel) les 2 champs.
