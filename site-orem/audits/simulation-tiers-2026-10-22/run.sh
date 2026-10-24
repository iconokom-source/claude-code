#!/bin/bash
# Simulation en lecture seule : Lighthouse 12 mobile sur l'accueil, en bloquant un outil tiers à la fois (3 passages).
export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
U=https://www.agence-orem.fr/
declare -A B=(
 [base]=""
 [sans-iclosed]="--blocked-url-patterns=*iclosed.io* --blocked-url-patterns=*cdn.jsdelivr.net*"
 [sans-axeptio]="--blocked-url-patterns=*axept.io*"
 [sans-gtm]="--blocked-url-patterns=*googletagmanager.com*"
 [sans-webfont]="--blocked-url-patterns=*ajax.googleapis.com/ajax/libs/webfont*"
 [sans-tous]="--blocked-url-patterns=*iclosed.io* --blocked-url-patterns=*cdn.jsdelivr.net* --blocked-url-patterns=*axept.io* --blocked-url-patterns=*googletagmanager.com* --blocked-url-patterns=*ajax.googleapis.com/ajax/libs/webfont*"
)
for i in 1 2 3; do for n in base sans-iclosed sans-axeptio sans-gtm sans-webfont sans-tous; do
  timeout 200 npx -y lighthouse@12 "$U" ${B[$n]} --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --form-factor=mobile --output=json --output-path=$n-m$i.json --quiet
done; done
echo DONE
