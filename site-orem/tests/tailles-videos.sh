#!/bin/bash
# Taille et définition des vidéos d'arrière-plan réellement servies sur une page (MP4 et WebM générés par Webflow).
# Usage : ./tailles-videos.sh https://orem.webflow.io/   (ou /agence-web-lille)
curl -s "$1" | grep -o 'data-video-urls="[^"]*"' | sed 's/data-video-urls="//;s/"$//' | tr ',' '\n' | sort -u | while read u; do
  s=$(curl -sI "$u" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')
  d=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$u" 2>/dev/null)
  echo "$((s/1024)) Ko  ${d}  $(basename "$u")"
done
