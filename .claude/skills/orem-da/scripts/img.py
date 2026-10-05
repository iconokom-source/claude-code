"""Prépare une image pour le PDF (JPEG, largeur max) : python3 img.py source.(avif|webp|png) sortie.jpg [largeur=1600]
Indispensable : Chromium embarque AVIF/WebP en flate et le PDF explose (20+ Mo)."""
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; w = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
im = Image.open(src).convert('RGB')
if im.width > w: im = im.resize((w, round(im.height*w/im.width)), Image.LANCZOS)
im.save(dst, quality=85, optimize=True); print(dst, im.size)
