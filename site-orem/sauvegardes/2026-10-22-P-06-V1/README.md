# Sauvegarde P-06 V-1 (vidéos du carrousel « Ce que nous faisons »), 2026-10-22

Rien n'a encore été modifié. État de départ, identique sur orem.webflow.io et agence-orem.fr :

| Élément (Background Video) | Pages | Asset actuel | MP4 servi | WebM servi |
|---|---|---|---|---|
| `efeed470-2491-a594-bb24-139d0d2d71af` (classe `image-de-marque`) | Accueil `6a7582333b9ddd4a77302d08`, Lille `6ac61124af8e2047b4ff8271` | `6a9aeb706db5e2c8d407e95a` « video-etape-conception-creation-v3.webm » (source 1124×858, 60 i/s, 17 Mo) | 3 860 Ko, 944×720 | 4 708 Ko |
| `69f255a7-ceb1-1e11-b3de-a474a3888cbc` (classe `site-web`) | Accueil, Lille | `6a9aeb6851c2695590bf38b3` « Container.webm » (source 1414×1080, 60 i/s, 27,5 Mo) | 3 449 Ko, 942×720 | 6 226 Ko |

Fichiers servis relevés : `avant-orem-webflow-io-accueil.txt`, `avant-orem-webflow-io-lille.txt` (`tests/tailles-videos.sh`).

**Retour arrière** : dans le Designer, sur chaque élément ci-dessus, Réglages › Background Video › choisir de nouveau l'asset d'origine (toujours dans le gestionnaire d'assets, ne pas le supprimer). Les fichiers servis sont liés à l’asset : Webflow devrait reprendre les mêmes (3 860 et 3 449 Ko) ; le vérifier avec `tests/tailles-videos.sh`.
