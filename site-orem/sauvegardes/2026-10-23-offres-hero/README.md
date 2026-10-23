# Héros des pages Offres (2026-10-23)

1. Modèle Offres (`6a9138272200aeae4011d3c7`) : vidéo d'arrière-plan Webflow « conseil strat » (élément `1554e346-5dd6-5b20-a8c7-98a044b073c2`,
   classes image / 100% / cover) placée dans le conteneur `[data-hero-video]` : **masquée** (réglage Visibilité),
   car le script OffreHeroVideo la remplace toujours par la vidéo Cloudinary du CMS (les 5 offres ont un lien).
   Retour : remettre la visibilité à « visible ».
2. Script OffreHeroVideo : 1.0.0 → 1.1.0 (ajoute `poster` = première image Cloudinary, `/video/upload/so_0/…jpg`).
   Avant / après dans ce dossier. Retour : `add_site_script offreherovideo version 1.0.0`.
3. Head du modèle Offres : voir avant-head-modele-offres.html (bloc d'origine) ; ajout d'un préchargement de cette première image.
