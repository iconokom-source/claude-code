#!/usr/bin/env python3
"""Contrôles chiffrés des messages de prospection Orem (règles Miria).

Usage : python3 verifier.py messages.json
Sortie : une ligne par constat (ERREUR bloque la validation, ALERTE est à juger).
Code retour : 0 si aucune ERREUR, 1 sinon.
"""
import json
import re
import sys

# Formulaires à ne jamais écrire (comparaison en minuscules, sans accents normalisés).
FORMULES_INTERDITES = [
    "je me permets",
    "dans l'éventualité",
    "nous serions ravis",
    "serions ravis",
    "n'hésitez pas",
    "je reviens vers vous",
    "comme convenu",
    "suite à notre échange",
    "suite à notre conversation",
    "je vous relance",
    "petit up",
    "je me permets de relancer",
    "nous sommes une agence",
    "on est une agence",
    "notre agence",
    "nous accompagnons",
    "notre solution",
    "notre expertise",
    "dans un monde où",
    "cordialement",
    "bien à vous",
]

# Vocabulaire marketé ou tic d'IA.
MOTS_MARKETING = [
    "opportunité exceptionnelle",
    "boostez",
    "booster",
    "innovant",
    "innovante",
    "révolutionn",
    "transformer vos résultats",
    "levier",
    "synergie",
    "incontournable",
    "véritable",
    "optimiser",
    "webflow",
    "refonte",
    "offre site",
]

# Tournures de cold mail usées (retour de Louis du 2026-10-12).
CLICHES_COLD = [
    "j'ai vu votre post",
    "par curiosité",
    "on le voit souvent",
    "si c'est utile",
    "dernier message de ma part",
    "loom de 2 min",
    "merci pour la connexion",
    "un autre détail",
]

CTA_LOOM = ["loom", "vidéo", "video"]

VARIABLES_NATIVES = {"firstName", "lastName", "companyName", "jobTitle", "companyDomain"}

LIMITES = {
    # type: (mots_min, mots_max, lignes_min, lignes_max, caracteres_max)
    "email": (50, 120, 3, 6, None),
    "linkedin": (30, 80, 2, 5, None),
    "linkedin_invite": (None, None, None, None, 200),
    "objet": (1, 6, None, None, 50),
    "script_call": (150, 300, None, None, None),
    "tache": (15, 150, None, None, None),
}

# Les 17 livrables attendus (voir references/sequence.md) : variable -> (type, cta).
LIVRABLES = {
    "oremObjet1": ("objet", "aucun"),
    "oremEmail1": ("email", "reponse"),
    "oremObjet2": ("objet", "aucun"),
    "oremEmail2": ("email", "reponse"),
    "oremObjet2Solo": ("objet", "aucun"),
    "oremEmail2Solo": ("email", "reponse"),
    "oremLinkedinInvite": ("linkedin_invite", "aucun"),
    "oremLinkedinMessage": ("linkedin", "reponse"),
    "oremObjet3Loom": ("objet", "aucun"),
    "oremEmail3Loom": ("email", "loom"),
    "oremObjet3Rdv": ("objet", "aucun"),
    "oremEmail3Rdv": ("email", "rdv"),
    "oremObjetBreakup": ("objet", "aucun"),
    "oremEmailBreakup": ("email", "reponse"),
    "oremScriptCall": ("script_call", "rdv"),
    "oremTacheEvaluer": ("tache", "aucun"),
    "oremTacheWarmCall": ("tache", "aucun"),
}


def mots(texte):
    return re.findall(r"[\wÀ-ÿ'’{}-]+", texte)


def lignes_utiles(texte):
    lignes = [l.strip() for l in texte.splitlines() if l.strip()]
    if lignes and re.match(r"^(bonjour|hello|salut)\b", lignes[0], re.I):
        lignes = lignes[1:]
    return lignes


def phrases(texte):
    return [p for p in re.split(r"(?<=[.!?])\s+|\n+", texte) if p.strip()]


def verifier_message(msg, variables_ok):
    constats = []
    var, typ, texte = msg["variable"], msg["type"], msg["texte"]
    cta_attendu = msg.get("cta", "aucun")
    bas = texte.lower()

    def err(t):
        constats.append(("ERREUR", var, t))

    def alerte(t):
        constats.append(("ALERTE", var, t))

    if not texte.strip():
        err("texte vide")
        return constats

    mn, mx, lmin, lmax, cmax = LIMITES.get(typ, (None,) * 5)
    n_mots = len(mots(texte))
    n_lignes = len(lignes_utiles(texte))
    if mn is not None and n_mots < mn:
        err(f"{n_mots} mots (< {mn})")
    if mx is not None and n_mots > mx:
        err(f"{n_mots} mots (> {mx})")
    if lmin is not None and n_lignes < lmin:
        err(f"{n_lignes} lignes (< {lmin})")
    if lmax is not None and n_lignes > lmax:
        err(f"{n_lignes} lignes (> {lmax})")
    if cmax is not None and len(texte) > cmax:
        err(f"{len(texte)} caractères (> {cmax})")

    if typ == "tache":
        return constats

    for f in FORMULES_INTERDITES:
        if f in bas:
            err(f"formule interdite : « {f} »")
    for m in MOTS_MARKETING:
        if m in bas:
            err(f"vocabulaire marketé / pitch : « {m} »")

    for c in CLICHES_COLD:
        if c in bas.replace("’", "'"):
            err(f"tournure de cold mail usée : « {c} » (voir retours.md)")

    if "—" in texte or "–" in texte:
        err("tiret long « — » (tic d'IA) : utiliser une virgule, un point ou deux-points")
    if "!" in texte:
        alerte("point d'exclamation : à éviter en cold")
    if re.search(r"[\U0001F300-\U0001FAFF]", texte):
        err("emoji")

    for p in phrases(texte):
        if len(mots(p)) > 22:
            alerte(f"phrase longue ({len(mots(p))} mots) : « {p.strip()[:60]}… »")

    for v in re.findall(r"\{\{\s*([^}]+?)\s*\}\}", texte):
        if v not in variables_ok:
            err(f"variable lemlist inconnue : {{{{{v}}}}}")
    if re.search(r"\{[^{]|[^}]\}", re.sub(r"\{\{[^}]*\}\}", "", texte)):
        err("accolade orpheline (variable mal formée ?)")

    if typ == "objet":
        if texte.isupper() or sum(c.isupper() for c in texte) > 4:
            alerte("trop de majuscules dans l'objet")
        if "?" in texte and len(mots(texte)) > 5:
            alerte("objet-question long")
        return constats

    nous = len(re.findall(r"\b(nous|notre|nos|orem)\b", bas))
    vous = len(re.findall(r"\b(vous|votre|vos)\b", bas))
    if typ != "script_call" and nous > 1 and nous >= vous:
        err(f"parle plus de nous ({nous}) que du prospect ({vous})")

    if texte.count("?") > 2 and typ != "script_call":
        alerte(f"{texte.count('?')} questions : risque de demandes multiples")

    if typ == "script_call":
        if not re.search(r"30 min", bas):
            err("le script de call doit proposer un RDV de 30 min")
        if not re.search(r"messagerie|répondeur", bas):
            err("le script de call doit contenir une version messagerie")
        return constats

    # Le CTA est la dernière ligne : c'est là qu'on cherche l'objectif.
    cta = (lignes_utiles(texte) or [""])[-1].lower()
    parle_loom = any(k in bas for k in CTA_LOOM)
    parle_rdv = bool(re.search(r"30 min|rendez-vous|\brdv\b|visio|\bcall\b|appel|échange de", bas))
    if cta_attendu == "aucun":
        if parle_loom or parle_rdv:
            err("ce message ne doit proposer ni Loom ni RDV")
    elif cta_attendu == "reponse":
        if parle_loom or parle_rdv:
            err("avant l'Email 3, on demande une réponse : ni Loom ni RDV")
        if "?" not in cta:
            err("le CTA (dernière ligne) doit être une question simple")
    elif cta_attendu == "loom":
        if parle_rdv:
            err("branche Loom : aucune mention de RDV / appel")
        if not any(k in cta for k in CTA_LOOM):
            err("branche Loom : la dernière ligne doit proposer la vidéo")
    elif cta_attendu == "rdv":
        if parle_loom:
            err("branche RDV : aucune mention de Loom / vidéo")
        if "30 min" not in cta:
            err("branche RDV : la dernière ligne doit proposer 30 min")

    return constats


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    with open(sys.argv[1], encoding="utf-8") as f:
        data = json.load(f)

    variables_ok = VARIABLES_NATIVES | set(data.get("variables_lead", []))

    tous = []
    vus = {m["variable"] for m in data.get("messages", [])}
    for var in LIVRABLES:
        if var not in vus:
            tous.append(("ERREUR", var, "livrable manquant"))
    for msg in data.get("messages", []):
        attendu = LIVRABLES.get(msg["variable"])
        if attendu and (msg.get("type"), msg.get("cta", "aucun")) != attendu:
            tous.append(("ERREUR", msg["variable"], f"type/cta attendus : {attendu}"))
        tous += verifier_message(msg, variables_ok)

    for niveau, var, texte in tous:
        print(f"{niveau} · {var} · {texte}")
    nb_err = sum(1 for c in tous if c[0] == "ERREUR")
    print(f"\n{nb_err} erreur(s), {len(tous) - nb_err} alerte(s)")
    sys.exit(1 if nb_err else 0)


if __name__ == "__main__":
    main()
