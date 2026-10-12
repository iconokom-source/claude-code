#!/usr/bin/env python3
"""QR code SVG aux couleurs Orem (encre #000012, fond transparent).

    python3 qr.py "https://calendly.com/…" qr.svg
Dépendance : pip install segno
"""
import sys
import segno

if len(sys.argv) != 3:
    sys.exit(__doc__)
segno.make(sys.argv[1], error="m").save(sys.argv[2], kind="svg", scale=10, border=0, dark="#000012", light=None)
print("QR →", sys.argv[2])
