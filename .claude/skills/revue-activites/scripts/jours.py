#!/usr/bin/env python3
"""Calculs de dates pour la revue des activités Pipedrive (jours ouvrés France, heure de Paris).

Usage :
  jours.py info DATE                     jour de la semaine, ouvré ou non
  jours.py ouvre DATE                    premier jour ouvré >= DATE
  jours.py plus DATE N                   DATE + N jours ouvrés (N peut être négatif)
  jours.py ecart DATE1 DATE2             nombre de jours ouvrés de DATE1 à DATE2
  jours.py quand "EXPRESSION" [--depuis DATE]
                                         « demain », « lundi », « semaine pro », « +3 », « j+5 »,
                                         « dans 2 semaines », « fin de semaine », « début novembre »,
                                         « mi-novembre », « fin du mois », « 5/11 », « 5 nov », AAAA-MM-JJ
  jours.py heure DATE HH:MM [--vers-utc] UTC (Pipedrive) -> Paris, ou Paris -> UTC
  jours.py cascade FICHIER.json          replanifie une chaîne d'activités (voir references/regles-dates.md)

Toujours en sortie : AAAA-MM-JJ + jour en français. Jours fériés français inclus ;
congés de Louis lus dans conges.txt (à côté de ce script), une date ou « DATE1 DATE2 » par ligne.
"""
import json
import re
import sys
from datetime import date, datetime, timedelta, time
from pathlib import Path
from zoneinfo import ZoneInfo

PARIS = ZoneInfo("Europe/Paris")
UTC = ZoneInfo("UTC")
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]
# Lundi de Pentecôte : journée de solidarité, travaillée chez Orem par défaut.
LUNDI_PENTECOTE_FERIE = False


def paques(annee):
    a, b, c = annee % 19, annee // 100, annee % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mois = (h + l - 7 * m + 114) // 31
    jour = (h + l - 7 * m + 114) % 31 + 1
    return date(annee, mois, jour)


def feries(annee):
    p = paques(annee)
    jours = {
        date(annee, 1, 1): "Jour de l'an",
        p + timedelta(days=1): "Lundi de Pâques",
        date(annee, 5, 1): "Fête du travail",
        date(annee, 5, 8): "Victoire 1945",
        p + timedelta(days=39): "Ascension",
        date(annee, 7, 14): "Fête nationale",
        date(annee, 8, 15): "Assomption",
        date(annee, 11, 1): "Toussaint",
        date(annee, 11, 11): "Armistice",
        date(annee, 12, 25): "Noël",
    }
    if LUNDI_PENTECOTE_FERIE:
        jours[p + timedelta(days=50)] = "Lundi de Pentecôte"
    return jours


def conges():
    fichier = Path(__file__).with_name("conges.txt")
    off = set()
    if not fichier.exists():
        return off
    for ligne in fichier.read_text().splitlines():
        ligne = ligne.split("#")[0].strip()
        if not ligne:
            continue
        bornes = [date.fromisoformat(x) for x in ligne.split()]
        debut, fin = bornes[0], bornes[-1]
        while debut <= fin:
            off.add(debut)
            debut += timedelta(days=1)
    return off


CONGES = conges()


def raison_non_ouvre(d):
    if d.weekday() >= 5:
        return JOURS[d.weekday()]
    if d in feries(d.year):
        return "férié (" + feries(d.year)[d] + ")"
    if d in CONGES:
        return "congés"
    return None


def ouvre(d):
    while raison_non_ouvre(d):
        d += timedelta(days=1)
    return d


def plus(d, n):
    pas = 1 if n >= 0 else -1
    d = ouvre(d) if n >= 0 else d
    while n:
        d += timedelta(days=pas)
        if not raison_non_ouvre(d):
            n -= pas
    return d


def ecart(d1, d2):
    signe = 1
    if d2 < d1:
        d1, d2, signe = d2, d1, -1
    n, d = 0, d1
    while d < d2:
        d += timedelta(days=1)
        if not raison_non_ouvre(d):
            n += 1
    return n * signe


def fmt(d):
    return f"{d.isoformat()} {JOURS[d.weekday()]} {d.day} {MOIS[d.month - 1]}"


def num_mois(txt):
    txt = txt.strip(". ").lower()
    for i, m in enumerate(MOIS):
        if m.startswith(txt[:3]) or m.replace("é", "e").replace("û", "u").startswith(txt[:3]):
            return i + 1
    raise ValueError(f"mois inconnu : {txt}")


def annee_future(depuis, mois, jour):
    d = date(depuis.year, mois, jour)
    return d if d >= depuis else date(depuis.year + 1, mois, jour)


def dernier_jour_mois(annee, mois):
    suivant = date(annee + mois // 12, mois % 12 + 1, 1)
    return suivant - timedelta(days=1)


def quand(expr, depuis):
    """Renvoie (date brute, date ouvrée). Les expressions relatives visent toujours après `depuis`."""
    e = expr.strip().lower().replace("’", "'")
    e = re.sub(r"\s+", " ", e)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", e):
        brut = date.fromisoformat(e)
        return brut, ouvre(brut)
    if e in ("aujourd'hui", "auj", "ce jour"):
        return depuis, ouvre(depuis)
    if e == "demain":
        brut = depuis + timedelta(days=1)
        return brut, ouvre(brut)
    if e in ("après-demain", "apres-demain", "après demain", "apres demain"):
        brut = depuis + timedelta(days=2)
        return brut, ouvre(brut)
    m = re.fullmatch(r"(?:\+|j\+|dans )?(\d+) ?(?:j|jours?|jours? ouvrés?)?", e)
    if m and (e.startswith(("+", "j+", "dans")) or "j" in e):
        brut = plus(depuis, int(m.group(1)))
        return brut, brut
    m = re.fullmatch(r"(?:dans |\+)?(\d+) ?sem(?:aines?)?", e)
    if m:
        brut = depuis + timedelta(weeks=int(m.group(1)))
        return brut, ouvre(brut)
    if e in ("semaine pro", "semaine prochaine", "la semaine pro", "la semaine prochaine", "début de semaine prochaine"):
        brut = depuis + timedelta(days=7 - depuis.weekday())
        return brut, ouvre(brut)
    if e in ("fin de semaine", "fin de la semaine", "cette fin de semaine"):
        brut = depuis + timedelta(days=(4 - depuis.weekday()) % 7 or 7)
        return brut, ouvre(brut) if not raison_non_ouvre(brut) else plus(brut, -1)
    if e in ("fin de semaine prochaine", "fin de semaine pro"):
        brut = depuis + timedelta(days=7 - depuis.weekday() + 4)
        return brut, brut if not raison_non_ouvre(brut) else plus(brut, -1)
    for i, j in enumerate(JOURS):
        if e in (j, j + " prochain", "ce " + j, j + " pro"):
            # « lundi », « lundi prochain » : la prochaine occurrence, jamais aujourd'hui
            delta = (i - depuis.weekday()) % 7 or 7
            brut = depuis + timedelta(days=delta)
            return brut, ouvre(brut)
    m = re.fullmatch(r"(mois pro(?:chain)?|le mois prochain)", e)
    if m:
        brut = date(depuis.year + depuis.month // 12, depuis.month % 12 + 1, 1)
        return brut, ouvre(brut)
    if e in ("fin du mois", "fin de mois"):
        brut = dernier_jour_mois(depuis.year, depuis.month)
        return brut, brut if not raison_non_ouvre(brut) else plus(brut, -1)
    m = re.fullmatch(r"(début|debut|mi|fin)[ -](?:de |d')?([a-zéû]+)", e)
    if m:
        mois = num_mois(m.group(2))
        annee = depuis.year if mois >= depuis.month else depuis.year + 1
        if m.group(1) in ("début", "debut"):
            brut = date(annee, mois, 1)
            return brut, ouvre(brut)
        if m.group(1) == "mi":
            brut = date(annee, mois, 15)
            return brut, ouvre(brut)
        brut = dernier_jour_mois(annee, mois)
        return brut, brut if not raison_non_ouvre(brut) else plus(brut, -1)
    m = re.fullmatch(r"(?:le )?(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?", e)
    if m:
        j, mo, a = int(m.group(1)), int(m.group(2)), m.group(3)
        brut = date(int(a) + (2000 if len(a) == 2 else 0), mo, j) if a else annee_future(depuis, mo, j)
        return brut, ouvre(brut)
    m = re.fullmatch(r"(?:le )?(?:[a-z]+ )?(\d{1,2}|1er) ([a-zéû.]+)(?: (\d{4}))?", e)
    if m:
        j = 1 if m.group(1) == "1er" else int(m.group(1))
        mo = num_mois(m.group(2))
        brut = date(int(m.group(3)), mo, j) if m.group(3) else annee_future(depuis, mo, j)
        return brut, ouvre(brut)
    raise ValueError(f"expression non reconnue : « {expr} » — donner une date AAAA-MM-JJ")


def heure(d, hhmm, vers_utc=False):
    h = time.fromisoformat(hhmm)
    src, dst = (PARIS, UTC) if vers_utc else (UTC, PARIS)
    return datetime.combine(d, h, tzinfo=src).astimezone(dst).strftime("%H:%M")


def cascade(plan):
    """Replanifie une chaîne.

    plan = {"aujourdhui": "AAAA-MM-JJ",
            "activites": [{"id": 1, "date": "AAAA-MM-JJ", "heure_utc": "07:00"|null,
                           "fixe": false, "apres": <id>|null, "ecart": <jours ouvrés>|null}],
            "deplacer": {"<id>": "AAAA-MM-JJ", ...}}
    Une activité avec `apres` est placée à (nouvelle date du prédécesseur + ecart jours ouvrés),
    jamais avant sa date actuelle si elle est déjà plus tard, jamais avant aujourd'hui.
    `ecart` négatif = avant le prédécesseur (préparation, confirmation la veille).
    Une activité `fixe` (RDV avec le prospect) ne bouge jamais : un conflit est signalé.
    L'heure de Paris est conservée ; l'heure UTC est recalculée (changement d'heure).
    """
    today = date.fromisoformat(plan["aujourdhui"])
    acts = {str(a["id"]): a for a in plan["activites"]}
    depl = {str(k): date.fromisoformat(v) for k, v in plan.get("deplacer", {}).items()}
    nouv, sortie = {}, []

    def resoudre(aid, pile=()):
        if aid in nouv:
            return nouv[aid]
        if aid in pile:
            raise ValueError(f"dépendance circulaire sur #{aid}")
        a = acts[aid]
        actuelle = date.fromisoformat(a["date"])
        note = []
        if aid in depl:
            cible = depl[aid]
            d = ouvre(cible)
            if d != cible:
                note.append(f"{fmt(cible)} non ouvré ({raison_non_ouvre(cible)}) → reporté")
        elif a.get("apres") and str(a["apres"]) in acts:
            pred = str(a["apres"])
            dp = resoudre(pred, pile + (aid,))
            e = a.get("ecart")
            if e is None:
                e = ecart(date.fromisoformat(acts[pred]["date"]), actuelle) if actuelle != date.fromisoformat(acts[pred]["date"]) else 1
            d = plus(dp, e)
            if e >= 0:
                # une suite ne recule jamais : si elle était déjà prévue plus tard, elle y reste
                d = max(d, actuelle)
        else:
            d = actuelle
        if d < today and not a.get("fixe"):
            d = ouvre(today)
            note.append("ramené à aujourd'hui")
        if a.get("fixe") and d != actuelle:
            note.append(f"⚠ CONFLIT : RDV fixe le {fmt(actuelle)}, la chaîne voudrait {fmt(d)}")
            d = actuelle
        nouv[aid] = d
        a["_note"] = note
        return d

    for aid in acts:
        resoudre(aid)
    for aid, a in acts.items():
        actuelle = date.fromisoformat(a["date"])
        ligne = {"id": a["id"], "avant": fmt(actuelle), "apres": fmt(nouv[aid]), "change": nouv[aid] != actuelle}
        if a.get("heure_utc"):
            paris = heure(actuelle, a["heure_utc"])
            ligne["heure_paris"] = paris
            ligne["heure_utc"] = heure(nouv[aid], paris, vers_utc=True)
        if a.get("_note"):
            ligne["remarques"] = a["_note"]
        sortie.append(ligne)
    return sortie


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    cmd, args = argv[1], argv[2:]
    depuis = date.today()
    if "--depuis" in args:
        i = args.index("--depuis")
        depuis = date.fromisoformat(args[i + 1])
        args = args[:i] + args[i + 2:]
    if cmd == "info":
        d = date.fromisoformat(args[0])
        r = raison_non_ouvre(d)
        print(fmt(d), "— NON OUVRÉ : " + r if r else "— ouvré")
    elif cmd == "ouvre":
        print(fmt(ouvre(date.fromisoformat(args[0]))))
    elif cmd == "plus":
        print(fmt(plus(date.fromisoformat(args[0]), int(args[1]))))
    elif cmd == "ecart":
        print(ecart(date.fromisoformat(args[0]), date.fromisoformat(args[1])), "jours ouvrés")
    elif cmd == "quand":
        brut, d = quand(" ".join(args), depuis)
        print(fmt(d) + ("" if brut == d else f"   (demandé : {fmt(brut)} — {raison_non_ouvre(brut) or 'ajusté'})"))
    elif cmd == "heure":
        vers_utc = "--vers-utc" in args
        args = [a for a in args if a != "--vers-utc"]
        d = date.fromisoformat(args[0])
        print(heure(d, args[1], vers_utc), "UTC" if vers_utc else "Paris")
    elif cmd == "cascade":
        plan = json.loads(Path(args[0]).read_text() if args[0] != "-" else sys.stdin.read())
        print(json.dumps(cascade(plan), ensure_ascii=False, indent=1))
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except ValueError as err:
        print("ERREUR :", err)
        sys.exit(2)
