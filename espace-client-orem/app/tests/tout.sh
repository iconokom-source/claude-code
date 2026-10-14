#!/bin/sh
# Rejoue les deux tests sur des données neuves : ./tests/tout.sh [dossier des captures]
# axe-core : NODE_PATH doit contenir playwright et axe-core (ex. NODE_PATH=$(npm root -g):/chemin/node_modules).
cd "$(dirname "$0")/.." || exit 1
OUT=${1:-${TMPDIR:-/tmp}/orem-tests}; mkdir -p "$OUT"
pkill -f "^node server.js" 2>/dev/null; sleep 0.3
rm -rf data
PORT=3123 MAIL_BATCH_MS=300 node server.js > "$OUT/server.log" 2>&1 &
SRV=$!; sleep 1
NODE_PATH=${NODE_PATH:-$(npm root -g)} node tests/simulation.js "$OUT" > "$OUT/simulation.txt" 2>&1; S=$?
NODE_PATH=${NODE_PATH:-$(npm root -g)} node tests/equipe.js "$OUT" > "$OUT/equipe.txt" 2>&1; E=$?
kill $SRV
echo "== simulation (sortie $S) : $(grep -c '✔' "$OUT/simulation.txt") réussies, $(grep -c '✘' "$OUT/simulation.txt") échouées"
grep '✘\|Error\|ERRS \[.\|axe' "$OUT/simulation.txt" | head -20
echo "== equipe (sortie $E) : $(grep -c '✔' "$OUT/equipe.txt") réussies, $(grep -c '✘' "$OUT/equipe.txt") échouées"
grep '✘\|Error\|ERRS \[.' "$OUT/equipe.txt" | head -20
