#!/usr/bin/env python3
"""Analyse la sortie de data_style_tool > get_styles (include_properties: true).

Usage : python3 -I doublons_styles.py <styles.json> [--json]

Sort : convention de nommage, classes strictement identiques (mêmes propriétés
sur tous les breakpoints et états), classes vides, classes presque identiques
(une seule propriété d'écart) et valeurs en dur récurrentes qui mériteraient
une variable.
"""
import collections
import json
import re
import sys


def charger(chemin):
    with open(chemin, encoding="utf-8") as f:
        data = json.load(f)
    # Formats possibles : {"result": [...]}, [{"type":"text","text":"{...}"}], [...]
    if isinstance(data, list) and data and isinstance(data[0], dict) and "text" in data[0]:
        data = json.loads(data[0]["text"])
    if isinstance(data, dict):
        data = data.get("result", data.get("styles", data))
    if isinstance(data, dict):
        data = data.get("styles", [])
    return data


def valeur(v):
    if isinstance(v, dict) and "id" in v:
        return "var:" + str(v["id"])
    return str(v).strip().lower()


def signature(style):
    """Ensemble figé de (contexte, propriété, valeur) couvrant breakpoints et états."""
    p = style.get("properties") or {}
    items = set()
    base = p.get("base") or {}
    for prop, v in (base.get("properties") or {}).items():
        items.add(("main", prop, valeur(v)))
    for pseudo, props in (base.get("pseudos") or {}).items():
        if pseudo == "noPseudo":
            continue
        for prop, v in (props or {}).items():
            items.add(("main:" + pseudo, prop, valeur(v)))
    for bp, contenu in (p.get("breakpoints") or {}).items():
        props = contenu.get("properties") if isinstance(contenu, dict) else None
        for prop, v in (props or {}).items():
            items.add((bp, prop, valeur(v)))
        for pseudo, pprops in ((contenu or {}).get("pseudos") or {}).items():
            if pseudo == "noPseudo":
                continue
            for prop, v in (pprops or {}).items():
                items.add((bp + ":" + pseudo, prop, valeur(v)))
    return frozenset(items)


def parent(style):
    """Sélecteur parent d'une combo (« .a.b.c » → « .a.b ») ; vide pour une classe globale."""
    if style.get("type") != "combo":
        return ""
    sel = style.get("selector") or ""
    return sel[: sel.rfind(".")] if sel.count(".") > 1 else ""


def nom_complet(style):
    sel = style.get("selector") or ""
    return sel if sel else "." + style.get("name", "?")


def convention(noms):
    seps = collections.Counter()
    prefixes = collections.Counter()
    for n in noms:
        if "__" in n:
            seps["__ (BEM)"] += 1
        if "_" in n.replace("__", ""):
            seps["_"] += 1
        if "-" in n:
            seps["-"] += 1
        if re.search(r"[A-Z]", n):
            seps["majuscules"] += 1
        m = re.match(r"([a-z0-9]+)[-_]", n)
        if m:
            prefixes[m.group(1)] += 1
    marqueurs = {
        "Client-First": ["padding-global", "container-large", "heading-style-h1", "text-size-", "padding-section-"],
        "Lumos": ["u-", "c-"],
    }
    detecte = [fw for fw, mots in marqueurs.items()
               if sum(any(n.startswith(m) or m in n for n in noms) for m in mots) >= 2]
    return seps, prefixes, detecte


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    styles = [s for s in charger(sys.argv[1]) if isinstance(s, dict)]
    styles = [s for s in styles if not s.get("isFromLibrary")]
    sortie_json = "--json" in sys.argv

    sigs = {}
    for s in styles:
        if s.get("type") == "tag":
            continue
        # Une combo ne porte que son delta : on ne la compare qu'aux combos du même parent.
        sigs.setdefault((parent(s), signature(s)), []).append(s)

    vides = [nom_complet(s) for (_, sig), groupe in sigs.items() if not sig for s in groupe]
    doublons = [[nom_complet(s) for s in g] for (_, sig), g in sigs.items() if sig and len(g) > 1]
    doublons.sort(key=len, reverse=True)

    # Presque identiques : même ensemble de propriétés, une seule valeur différente.
    globales = [(nom_complet(s), signature(s)) for s in styles
                if s.get("type") == "global" and signature(s)]
    proches = []
    par_taille = collections.defaultdict(list)
    for n, sig in globales:
        par_taille[len(sig)].append((n, sig))
    for groupe in par_taille.values():
        for i in range(len(groupe)):
            for j in range(i + 1, len(groupe)):
                a, b = groupe[i], groupe[j]
                diff = a[1] ^ b[1]
                if len(diff) == 2 and len({(c, p) for c, p, _ in diff}) == 1 and len(a[1]) >= 3:
                    c, p, _ = next(iter(diff))
                    proches.append((a[0], b[0], f"{c} {p}"))

    valeurs = collections.Counter()
    for s in styles:
        for ctx, prop, v in signature(s):
            if v.startswith("var:"):
                continue
            if re.match(r"^(#|rgb|hsl)", v) or (prop in ("font-family",)) or re.match(r"^-?\d+(\.\d+)?(px|rem|em|vw|vh|%)$", v):
                if v not in ("0px", "0%", "100%", "auto"):
                    valeurs[(prop.split("-")[0] if prop.startswith(("padding", "margin", "border")) else prop, v)] += 1

    noms = [s.get("name", "") for s in styles if s.get("type") == "global"]
    seps, prefixes, frameworks = convention(noms)

    rapport = {
        "total": len(styles),
        "par_type": dict(collections.Counter(s.get("type") for s in styles)),
        "framework_detecte": frameworks,
        "separateurs": dict(seps),
        "prefixes_frequents": prefixes.most_common(15),
        "doublons_stricts": doublons,
        "presque_identiques": proches[:40],
        "classes_vides": vides,
        "valeurs_en_dur_frequentes": [(f"{p}: {v}", n) for (p, v), n in valeurs.most_common(25) if n >= 3],
    }
    if sortie_json:
        print(json.dumps(rapport, ensure_ascii=False, indent=2))
        return

    print(f"Classes : {rapport['total']} {rapport['par_type']}")
    print(f"Framework détecté : {', '.join(frameworks) or 'convention maison'}")
    print(f"Séparateurs : {rapport['separateurs']}")
    print("Préfixes fréquents : " + ", ".join(f"{p} ({n})" for p, n in rapport["prefixes_frequents"]))
    print(f"\nDoublons stricts ({len(doublons)} groupes) :")
    for g in doublons:
        print("  = " + "  ".join(g))
    print(f"\nPresque identiques (1 propriété d'écart, {len(proches)}) :")
    for a, b, diff in proches[:40]:
        print(f"  ~ {a}  {b}  [{diff}]")
    print(f"\nClasses vides ({len(vides)}) : " + ", ".join(vides[:60]))
    print("\nValeurs en dur récurrentes (candidates à une variable) :")
    for v, n in rapport["valeurs_en_dur_frequentes"]:
        print(f"  {n:>4}× {v}")


if __name__ == "__main__":
    main()
