# Contact (2026-10-23)

1. Embed iClosed `34dc8de7-faba-8e0f-4003-fe8ff60fab4c` : avant / après dans ce dossier.
2. Head de la page Contact (`6a7ed06a2e5bb1e23693d292`) : avant = seulement le bloc `<style>` des icônes d'onglets ;
   après = `<link rel="preload" as="image" … footer_gradiant 2 (1)_poster.0000000.jpg" fetchpriority="high">` ajouté devant.
   Retour : supprimer la ligne `<link rel="preload" …>` et son commentaire.
3. Logo animé du footer (composant footer `d1220ddf-…`, image `c2586078-f4e5-f022-d159-f5b43c452c7a`) : attribut `fetchpriority="low"` ajouté.
   Retour : retirer l'attribut.
