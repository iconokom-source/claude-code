#!/usr/bin/env sh
# Prépare un dossier de livrable Orem avec le gabarit et tous ses assets, chemins déjà corrigés.
#   sh new_deck.sh dossier/            → dossier/deck.html (+ orem-deck.css, fonts/, backgrounds/, logo/)
#   sh new_deck.sh dossier/ document   → dossier/document.html (A4, + orem.css)
#   sh new_deck.sh dossier/ app        → dossier/app.html (+ orem.css)
set -eu
DEST="${1:?usage : new_deck.sh dossier [deck|document|app]}"
KIND="${2:-deck}"
A="$(cd "$(dirname "$0")/../assets" && pwd)"
mkdir -p "$DEST/logo"
cp -R "$A/fonts" "$A/backgrounds" "$DEST/"
cp -R "$A/logo/png" "$DEST/logo/"
cp "$A"/logo/*.svg "$DEST/logo/"
case "$KIND" in
  deck)     cp "$A/orem-deck.css" "$DEST/"; SRC="$A/templates/deck.html"; OUT="$DEST/deck.html"
            cp "$A/templates/qr-exemple.svg" "$DEST/" ;;
  document) cp "$A/orem.css" "$DEST/"; SRC="$A/templates/document-a4.html"; OUT="$DEST/document.html" ;;
  app)      cp "$A/orem.css" "$DEST/"; SRC="$A/templates/app.html"; OUT="$DEST/app.html" ;;
  *) echo "type inconnu : $KIND (deck|document|app)"; exit 1 ;;
esac
sed 's#\.\./##g' "$SRC" > "$OUT"
echo "Prêt : $OUT  →  rendu : node $(dirname "$0")/render_pdf.cjs $OUT ${OUT%.html}.pdf --png $DEST/apercus/"
