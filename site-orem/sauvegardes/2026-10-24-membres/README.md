# Pages Membres (2026-10-24)

Modèle Membres (`6a759ac144dc0178f0b2fc7b`).
- Head : `avant-head-modele-membres.html` → `apres-head-modele-membres.html`.
  Avant : au chargement, le script rouvrait la modale globale (popstate) : blocage du body (décalage 1,0),
  re-téléchargement de la page elle-même et remplacement du contenu par une copie, puis re-initialisation de Webflow.
  Après : le panneau (déjà affiché ouvert dans le HTML) reste tel quel ; les flèches et ←/→ mènent à la page du membre
  précédent / suivant (ordre de la liste CMS cachée `[data-slug]`) ; fermeture inchangée.
- Photo du membre (élément `de04cbbd-b304-6607-767f-a63b96fd15bb`) : attributs `loading="eager"` et `fetchpriority="high"` ajoutés.
Retour : remettre le head « avant », retirer les 2 attributs.
