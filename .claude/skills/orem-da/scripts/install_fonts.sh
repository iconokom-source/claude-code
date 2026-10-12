#!/usr/bin/env sh
# Installe Trykker et Lexend Deca (statiques) pour Word, PowerPoint, LibreOffice.
# Linux : ~/.local/share/fonts · macOS : ~/Library/Fonts
set -eu
DIR="$(cd "$(dirname "$0")/../assets/fonts" && pwd)"
case "$(uname -s)" in
  Darwin) DEST="$HOME/Library/Fonts" ;;
  *)      DEST="${XDG_DATA_HOME:-$HOME/.local/share}/fonts" ;;
esac
mkdir -p "$DEST"
for f in Trykker-Regular LexendDeca-Light LexendDeca-Regular LexendDeca-Medium LexendDeca-SemiBold; do
  cp "$DIR/$f.ttf" "$DEST/"
done
command -v fc-cache >/dev/null 2>&1 && fc-cache -f "$DEST" >/dev/null 2>&1 || true
echo "Polices Orem installées dans $DEST"
