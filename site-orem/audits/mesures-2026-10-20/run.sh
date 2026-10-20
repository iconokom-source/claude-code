export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
B=https://www.agence-orem.fr
declare -A P=([home]=/ [realisations]=/realisations [offre-site-web]=/offres/site-web [apropos]=/a-propos [blog]=/blog [article]=/articles/choisir-agence-webflow-b2b [contact]=/contact [lille]=/agence-web-lille [mentions]=/legal/mentions-legales)
for n in home realisations offre-site-web apropos blog article contact lille mentions; do
  for i in 1 2 3; do
    [ "$n$i" = "home1" ] && continue
    timeout 200 npx lighthouse "$B${P[$n]}" --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --form-factor=mobile --output=json --output-path=$n-m$i.json --quiet
  done
  timeout 200 npx lighthouse "$B${P[$n]}" --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --preset=desktop --output=json --output-path=$n-d1.json --quiet
done
echo DONE
