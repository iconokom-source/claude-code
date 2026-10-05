#!/usr/bin/env bash
# Crée un nouveau document Orem à partir du gabarit : new_doc.sh <dossier-cible> "<Titre de l'onglet>"
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$1"; TITLE="${2:-Orem}"
[ -e "$DEST/index.html" ] && { echo "$DEST/index.html existe déjà" >&2; exit 1; }
mkdir -p "$DEST"
cp -r "$SKILL/template/assets" "$DEST/"
sed "s#@@TITRE@@#${TITLE//#/\\#}#" "$SKILL/template/index.html" > "$DEST/index.html"
echo "Créé : $DEST/index.html (16 slides modèles P01 à P16, à trier et remplir)"
