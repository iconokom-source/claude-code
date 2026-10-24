# P-15 — logo animé du footer allégé (remplacement d'asset, natif)

- Élément : composant **footer** (`d1220ddf-2c09-baed-309f-e1f2237fd802`), Image `c2586078-f4e5-f022-d159-f5b43c452c7a`, classes `image` + `280x280px`, alt « Logo Orem animé ».
- **Avant** : asset `6a95b83444997d1adc1ebfa2` — `logo-orem-anime-transparent-hq.webp`, 720 px, 99 images, 3,27 s en boucle, 1 279 Ko. L'asset d'origine n'est **pas supprimé**.
- **Après** : nouvel asset `logo-orem-anime-560.webp`, 560 px (2× la taille affichée de 280 px), 99 images, 3,27 s en boucle, ~398 Ko, PSNR ≥ 51 dB par rapport à l'original.

Restaurer : `data_element_tool > set_image_asset` (scope_component_id = footer) avec `image_asset_id` = `6a95b83444997d1adc1ebfa2`, puis publier.
