#!/usr/bin/env python3
"""Calcule les valeurs Tablet et Mobile des variables de la collection Responsive.

Usage :
  python3 echelle_responsive.py rem 24                 -> conversion px -> rem
  python3 echelle_responsive.py echelle valeurs.json   -> tableau Desktop / Tablet / Mobile

valeurs.json : liste ordonnée (du plus grand au plus petit dans chaque type) :
[
  {"name": "Heading / H1 / Size", "type": "texte", "desktop": 72},
  {"name": "Heading / H2 / Size", "type": "texte", "desktop": 48},
  {"name": "Text / Regular / Size", "type": "texte", "desktop": 16},
  {"name": "Section / Padding Large", "type": "section", "desktop": 128},
  {"name": "Global / Padding X", "type": "global", "desktop": 64},
  {"name": "Gap / Large", "type": "gap", "desktop": 64},
  {"name": "Heading / H1 / Size", "type": "texte", "desktop": 72, "mobile": 40}   <- valeur imposée par une maquette mobile
]
Valeurs en px. Une valeur "tablet" ou "mobile" fournie est conservée telle quelle.
Bibliothèque standard uniquement.
"""
import json
import sys

BASE_PX = 16
MIN_BODY_PX = 16  # texte courant jamais sous 16 px sur mobile (lisibilité, pas de zoom iOS dans les champs)


def rem(px):
    text = f"{px / BASE_PX:.3f}".rstrip("0").rstrip(".")
    return f"{text}rem"


def round_to(value, step):
    return max(step, round(value / step) * step)


def scale_text(px):
    """Réduction progressive : plus le texte est grand, plus il est réduit."""
    if px >= 56:
        tablet, mobile = px * 0.82, px * 0.62
    elif px >= 40:
        tablet, mobile = px * 0.87, px * 0.72
    elif px >= 28:
        tablet, mobile = px * 0.92, px * 0.82
    elif px >= 20:
        tablet, mobile = px, px * 0.9
    else:
        tablet, mobile = px, px
    step = 2 if px >= 24 else 1
    tablet, mobile = round_to(tablet, step), round_to(mobile, step)
    if px >= MIN_BODY_PX:
        mobile = max(mobile, MIN_BODY_PX)
    return tablet, mobile


def scale_section(px):
    return round_to(max(px * 0.75, 48 if px >= 96 else 32), 8), round_to(max(px * 0.55, 48 if px >= 96 else 24), 8)


def scale_global(px):
    return min(px, 32), min(px, 20)


def scale_gap(px):
    return round_to(max(px * 0.75, 16), 4), round_to(max(px * 0.6, 12 if px < 24 else 16), 4)


SCALERS = {"texte": scale_text, "section": scale_section, "global": scale_global, "gap": scale_gap}


def compute(entries):
    rows = []
    for e in entries:
        tablet, mobile = SCALERS[e["type"]](float(e["desktop"]))
        tablet = float(e.get("tablet", tablet))
        mobile = float(e.get("mobile", mobile))
        mobile = min(mobile, tablet)
        rows.append({**e, "tablet": tablet, "mobile": mobile})

    # La hiérarchie des textes doit rester visible : chaque niveau garde au moins 2 px d'écart avec le suivant.
    texts = [r for r in rows if r["type"] == "texte"]
    for bp in ("tablet", "mobile"):
        for bigger, smaller in zip(texts, texts[1:]):
            if bigger["desktop"] > smaller["desktop"] and bigger[bp] < smaller[bp] + 2:
                bigger[bp] = smaller[bp] + 2
    return rows


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == "rem":
        print(rem(float(sys.argv[2])))
        return
    if len(sys.argv) >= 3 and sys.argv[1] == "echelle":
        with open(sys.argv[2], encoding="utf-8") as fh:
            rows = compute(json.load(fh))
        print("| Variable | Desktop | Tablet | Mobile |")
        print("|---|---|---|---|")
        for r in rows:
            print(f"| {r['name']} | {rem(r['desktop'])} ({r['desktop']:g}px) | "
                  f"{rem(r['tablet'])} ({r['tablet']:g}px) | {rem(r['mobile'])} ({r['mobile']:g}px) |")
        return
    print(__doc__)
    sys.exit(1)


if __name__ == "__main__":
    main()
