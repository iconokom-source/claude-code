export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
B=https://www.agence-orem.fr
declare -A P=([home]=/ [realisations]=/realisations [contact]=/contact [mentions]=/legal/mentions-legales [apropos]=/a-propos)
for n in home realisations apropos contact mentions; do
  for i in 1 2 3; do
    timeout 200 npx -y lighthouse@12 "$B${P[$n]}" --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --form-factor=mobile --output=json --output-path=$n-m$i.json --quiet
  done
done
echo DONE
