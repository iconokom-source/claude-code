"""Planche contact des captures : python3 sheet.py DOSSIER_CAPTURES  -> DOSSIER/sheetN.png (4 slides par planche)."""
import sys, glob
from PIL import Image
d = sys.argv[1]; fs = sorted(glob.glob(f'{d}/s*.png')); W, H = 960, 540
for k in range(0, len(fs), 4):
    sh = Image.new('RGB', (W*2, H*2), 'white')
    for n, f in enumerate(fs[k:k+4]):
        sh.paste(Image.open(f).resize((W, H)), ((n % 2)*W, (n//2)*H))
    sh.save(f'{d}/sheet{k//4}.png'); print(f'{d}/sheet{k//4}.png')
