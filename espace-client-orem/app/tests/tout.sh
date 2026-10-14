#!/bin/sh
# Rejoue tous les tests, chacun sur des données neuves : ./tests/tout.sh [dossier des captures]
# NODE_PATH doit contenir playwright et axe-core (ex. NODE_PATH=$(npm root -g):/chemin/node_modules).
cd "$(dirname "$0")/.." || exit 1
OUT=${1:-${TMPDIR:-/tmp}/orem-tests}; mkdir -p "$OUT"
export NODE_PATH=${NODE_PATH:-$(npm root -g)}
fresh() { pkill -f "^node server.js" 2>/dev/null; sleep 0.3; rm -rf data; PORT=3123 MAIL_BATCH_MS=300 node server.js >> "$OUT/server.log" 2>&1 & sleep 1; }
run() { fresh; node "tests/$1.js" "$OUT" > "$OUT/$1.txt" 2>&1; echo "== $1 (sortie $?) : $(grep -c '✔' "$OUT/$1.txt") réussies, $(grep -c '✘' "$OUT/$1.txt") échouées"; grep '✘\|Error\|ERRS \[.' "$OUT/$1.txt" | head -20; }
node build-demo.js > /dev/null; run simulation; run equipe; run lots; run a11y
pkill -f "^node server.js" 2>/dev/null
node tests/core.js > "$OUT/core.txt" 2>&1; echo "== core (sortie $?) : $(grep -c '✔' "$OUT/core.txt") réussies, $(grep -c '✘' "$OUT/core.txt") échouées"; grep '✘\|Error' "$OUT/core.txt" | head
