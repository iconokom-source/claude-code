#!/usr/bin/env python3
"""Analyse le registre des styles : doublons, utilitaires équivalents, quasi-doublons, valeurs en dur.

Usage : python3 registre_styles.py registre-styles.json [--json]

Format du registre : voir references/registre-styles.md.
Bibliothèque standard uniquement.
"""
import itertools
import json
import re
import sys
from collections import defaultdict

BASE_PX = 16

# Propriétés dont la valeur doit venir d'une variable.
TOKEN_PROPS = (
    "color", "background-color", "border-top-color", "border-right-color",
    "border-bottom-color", "border-left-color", "font-size", "font-family",
    "border-top-left-radius", "border-top-right-radius",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding-top", "padding-right", "padding-bottom", "padding-left",
    "row-gap", "column-gap",
)
# Valeurs acceptées en dur sur ces propriétés.
NEUTRAL_VALUES = {"0", "auto", "inherit", "transparent", "currentcolor", "none", "initial", "unset"}
# Propriétés gardées en px (pas de conversion en rem).
KEEP_PX = ("border-top-width", "border-right-width", "border-bottom-width",
           "border-left-width", "outline-width", "outline-offset")

PX_RE = re.compile(r"(-?\d*\.?\d+)px")
HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")


def to_rem(match):
    value = float(match.group(1)) / BASE_PX
    text = f"{value:.3f}".rstrip("0").rstrip(".")
    return "0" if text in ("0", "-0") else f"{text}rem"


def normalize_value(prop, value):
    value = str(value).strip()
    if value.startswith("var(") or value.startswith("var:"):
        inner = value[4:].rstrip(")") if value.startswith("var(") else value[4:]
        return "var(" + " / ".join(p.strip() for p in inner.split("/")) + ")"
    value = re.sub(r"\s+", " ", value)
    value = HEX_RE.sub(lambda m: m.group(0).lower(), value)
    if prop not in KEEP_PX:
        value = PX_RE.sub(to_rem, value)
    if value in ("0px", "0rem", "0%", "0em"):
        value = "0"
    return value


def normalize_styles(styles):
    """Retourne un dict figé {(breakpoint, pseudo): frozenset((prop, valeur))}."""
    out = {}
    for bp, pseudos in (styles or {}).items():
        for pseudo, props in (pseudos or {}).items():
            items = frozenset(
                (p.strip().lower(), normalize_value(p.strip().lower(), v))
                for p, v in (props or {}).items()
            )
            if items:
                out[(bp, pseudo)] = items
    return out


def fingerprint(norm):
    return tuple(sorted((k, tuple(sorted(v))) for k, v in norm.items()))


def label(cls):
    return f"{cls['parent']} + {cls['name']}" if cls.get("parent") else cls["name"]


def analyse(registry):
    classes = registry.get("classes", [])
    for c in classes:
        c["_norm"] = normalize_styles(c.get("styles"))

    report = {"doublons": [], "remplacables_par_utilitaires": [],
              "quasi_doublons": [], "valeurs_en_dur": [], "vides": []}

    # 1. Doublons exacts (comparés à parent identique ; les combos ne se comparent qu'entre elles).
    groups = defaultdict(list)
    for c in classes:
        if not c["_norm"]:
            if c.get("kind") not in ("utility", "structure") or c.get("parent"):
                report["vides"].append(label(c))
            continue
        groups[(c.get("parent"), fingerprint(c["_norm"]))].append(label(c))
    report["doublons"] = [names for names in groups.values() if len(names) > 1]

    # 2. Classes personnalisées équivalentes à 1–3 utilitaires (desktop, sans état).
    utilities = []
    for c in classes:
        n = c["_norm"]
        if c.get("kind") == "utility" and set(n) == {("main", "noPseudo")}:
            utilities.append((label(c), n[("main", "noPseudo")]))
    for c in classes:
        n = c["_norm"]
        if c.get("kind") != "custom" or set(n) != {("main", "noPseudo")}:
            continue
        target = n[("main", "noPseudo")]
        candidates = [u for u in utilities if u[1] <= target]
        found = None
        for size in (1, 2, 3):
            for combo in itertools.combinations(candidates, size):
                union = frozenset().union(*(u[1] for u in combo))
                props = [p for p, _ in union]
                if union == target and len(props) == len(set(props)):
                    found = [u[0] for u in combo]
                    break
            if found:
                break
        if found:
            report["remplacables_par_utilitaires"].append({"classe": label(c), "utilitaires": found})

    # 3. Quasi-doublons : même parent, mêmes clés, une seule propriété différente au total.
    comparable = [c for c in classes if c["_norm"] and c.get("kind") in ("custom", "combo")]
    for a, b in itertools.combinations(comparable, 2):
        if a.get("parent") != b.get("parent") or set(a["_norm"]) != set(b["_norm"]):
            continue
        diffs = []
        for key in a["_norm"]:
            da, db = dict(a["_norm"][key]), dict(b["_norm"][key])
            for prop in set(da) | set(db):
                if da.get(prop) != db.get(prop):
                    diffs.append({"etat": f"{key[0]}/{key[1]}", "propriete": prop,
                                  label(a): da.get(prop), label(b): db.get(prop)})
        if len(diffs) == 1:
            report["quasi_doublons"].append({"classes": [label(a), label(b)], "difference": diffs[0]})

    # 4. Valeurs en dur sur les propriétés de design.
    for c in classes:
        for (bp, pseudo), items in c["_norm"].items():
            for prop, value in items:
                if prop in TOKEN_PROPS and not value.startswith("var(") and value.lower() not in NEUTRAL_VALUES:
                    if prop.startswith(("margin", "padding")) and value.endswith("%"):
                        continue
                    report["valeurs_en_dur"].append(
                        {"classe": label(c), "etat": f"{bp}/{pseudo}", "propriete": prop, "valeur": value})
    return report


def print_markdown(report):
    def section(title, rows):
        print(f"## {title} ({len(rows)})")
        if not rows:
            print("Aucun.\n")
            return
        for row in rows:
            print(f"- {row}")
        print()

    section("Doublons exacts à fusionner", [" = ".join(g) for g in report["doublons"]])
    section("Classes remplaçables par des utilitaires",
            [f"{r['classe']} → {' + '.join(r['utilitaires'])}" for r in report["remplacables_par_utilitaires"]])
    section("Quasi-doublons (une propriété d'écart)",
            [f"{' / '.join(r['classes'])} : {r['difference']}" for r in report["quasi_doublons"]])
    section("Valeurs en dur à relier à une variable",
            [f"{r['classe']} [{r['etat']}] {r['propriete']}: {r['valeur']}" for r in report["valeurs_en_dur"]])
    section("Classes ou combos sans aucun style", report["vides"])
    bloquants = len(report["doublons"]) + len(report["valeurs_en_dur"]) + len(report["remplacables_par_utilitaires"])
    print("RÉSULTAT :", "registre propre" if bloquants == 0 else f"{bloquants} point(s) à corriger avant création")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    with open(sys.argv[1], encoding="utf-8") as fh:
        registry = json.load(fh)
    report = analyse(registry)
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_markdown(report)


if __name__ == "__main__":
    main()
