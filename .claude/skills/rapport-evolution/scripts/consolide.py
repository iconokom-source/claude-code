#!/usr/bin/env python3
"""Consolide la collecte brute (collecte_workbench.py) en kpi.json.

Tous les chiffres du rapport viennent de ce fichier : aucun agent ne recalcule
ni n'invente un chiffre. Les écarts sont calculés ici, une seule fois.

Usage : python3 consolide.py brut.json kpi.json --marque "eiffel segur,eiffel ségur"
"""
import argparse, json, re
from collections import defaultdict
from urllib.parse import urlsplit

IA = re.compile(r"chatgpt|openai|perplexity|claude\.ai|anthropic|gemini|bard|copilot|mistral|deepseek|you\.com|phind|grok", re.I)
# CTR moyen attendu par position (ordre de grandeur, résultats organiques classiques)
CTR_ATTENDU = {1: .28, 2: .15, 3: .10, 4: .07, 5: .05, 6: .04, 7: .03, 8: .025, 9: .02, 10: .02}


def num(v):
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return v


def ga_lignes(rep):
    """Rapport GA4 -> liste de dicts ; la période vient de la dimension dateRange."""
    if not isinstance(rep, dict) or "dimensionHeaders" not in rep and "metricHeaders" not in rep:
        return []
    dims = [d["name"] for d in rep.get("dimensionHeaders", [])]
    mets = [m["name"] for m in rep.get("metricHeaders", [])]
    out = []
    for r in rep.get("rows", []) or []:
        d = {k: v["value"] for k, v in zip(dims, r.get("dimensionValues", []))}
        d.update({k: num(v["value"]) for k, v in zip(mets, r.get("metricValues", []))})
        d["periode"] = d.pop("dateRange", "m")
        out.append(d)
    return out


def ecart(a, b, taux=False):
    """Écart de a (période analysée) par rapport à b. Taux -> points, sinon %."""
    if a is None or b in (None, 0) and not taux:
        return None
    if taux:
        return None if b is None else round((a - b) * 100, 1)
    return round((a - b) / b * 100, 1)


TAUX = {"engagementRate", "sessionKeyEventRate", "ctr"}


def avec_ecarts(par_periode, champs):
    m = par_periode.get("m") or {}
    res = {"m": m, "m1": par_periode.get("m1"), "n1": par_periode.get("n1"), "vs_m1": {}, "vs_n1": {}}
    for c in champs:
        for ref in ("m1", "n1"):
            r = par_periode.get(ref)
            res["vs_" + ref][c] = ecart(m.get(c), r.get(c), c in TAUX) if r else None
    return res


def table(lignes, cle, champs, tri, top=None):
    """Table par dimension avec colonnes m / m1 / n1 et écarts."""
    acc = defaultdict(dict)
    for l in lignes:
        k = tuple(l[c] for c in cle) if isinstance(cle, (list, tuple)) else l[cle]
        acc[k][l["periode"]] = {c: l.get(c) for c in champs}
    rows = []
    for k, per in acc.items():
        r = avec_ecarts(per, champs)
        r["cle"] = " / ".join(k) if isinstance(k, tuple) else k
        rows.append(r)
    rows.sort(key=lambda r: -(r["m"].get(tri) or 0))
    return rows[:top] if top else rows


# ---------- Search Console ----------

def gsc_rows(rep):
    return (rep or {}).get("rows") or [] if isinstance(rep, dict) else []


def agrege(rows_par_prop, nb_cles=1):
    """Additionne plusieurs propriétés : clics/impressions sommés, CTR recalculé, position pondérée."""
    acc = defaultdict(lambda: {"clicks": 0, "impressions": 0, "_w": 0.0})
    for rows in rows_par_prop:
        for r in rows:
            k = tuple(r.get("keys") or [])[:nb_cles] or ("total",)
            a = acc[k]
            a["clicks"] += r.get("clicks") or 0
            a["impressions"] += r.get("impressions") or 0
            a["_w"] += (r.get("position") or 0) * (r.get("impressions") or 0)
    out = {}
    for k, a in acc.items():
        i = a["impressions"]
        out[k] = {"clicks": a["clicks"], "impressions": i,
                  "ctr": round(a["clicks"] / i, 4) if i else 0,
                  "position": round(a["_w"] / i, 1) if i else None}
    return out


def chemin(url):
    s = urlsplit(url)
    return (s.path or "/") + (("?" + s.query) if s.query else "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("brut"); ap.add_argument("sortie")
    ap.add_argument("--marque", default="", help="termes de marque séparés par des virgules")
    ap.add_argument("--mise-en-ligne", default="", help="date de mise en ligne du site Orem (AAAA-MM-JJ)")
    a = ap.parse_args()
    b = json.load(open(a.brut))
    marque = [t.strip().lower() for t in a.marque.split(",") if t.strip()]
    k = {"client": b["config"]["client"], "mois": b["config"]["mois"], "periodes": b["periodes"],
         "collecte_le": b.get("collecte_le"), "erreurs_collecte": b.get("erreurs", []), "alertes": []}
    alerte = lambda niveau, code, texte: k["alertes"].append({"niveau": niveau, "code": code, "texte": texte})
    k["mise_en_ligne"] = a.mise_en_ligne or None
    for ref in ("m1", "n1"):
        if a.mise_en_ligne and b["periodes"][ref][1] < a.mise_en_ligne:
            alerte("info", f"{ref}_avant_site", f"La période {ref.upper()} ({b['periodes'][ref][0]} au {b['periodes'][ref][1]}) "
                   f"précède la mise en ligne du site Orem ({a.mise_en_ligne}) : la comparaison mesure l'effet de la refonte, pas l'évolution du mois.")

    # ----- GA4 -----
    g = b.get("ga4") or {}
    if g:
        tot = {l["periode"]: l for l in ga_lignes(g.get("totaux"))}
        champs = ["sessions", "totalUsers", "newUsers", "engagedSessions", "engagementRate",
                  "averageSessionDuration", "screenPageViews", "keyEvents", "sessionKeyEventRate"]
        k["ga4"] = {"totaux": avec_ecarts(tot, champs)}
        if "n1" not in tot:
            alerte("info", "ga4_sans_n1", "Pas de données GA4 sur le même mois de l'an dernier : comparaison N-1 impossible.")
        k["ga4"]["canaux"] = table(ga_lignes(g.get("canaux")), "sessionDefaultChannelGroup",
                                   ["sessions", "engagedSessions", "engagementRate", "keyEvents"], "sessions")
        k["ga4"]["pages_entree"] = table(ga_lignes(g.get("pages_entree")), "landingPage",
                                         ["sessions", "engagementRate", "keyEvents"], "sessions", 20)
        k["ga4"]["appareils"] = table(ga_lignes(g.get("appareils")), "deviceCategory",
                                      ["sessions", "engagementRate", "keyEvents"], "sessions")
        k["ga4"]["pays"] = table(ga_lignes(g.get("pays")), "country", ["sessions", "keyEvents"], "sessions", 10)
        k["ga4"]["pages_vues"] = table(ga_lignes(g.get("pages_vues")), "pagePath",
                                       ["screenPageViews", "userEngagementDuration"], "screenPageViews", 20)
        src = ga_lignes(g.get("sources"))
        k["ga4"]["sources"] = table(src, ["sessionSource", "sessionMedium"], ["sessions", "engagementRate", "keyEvents"], "sessions", 25)
        ia = [l for l in src if IA.search(l.get("sessionSource", ""))]
        k["ga4"]["ia"] = {
            "par_source": table(ia, "sessionSource", ["sessions", "engagementRate", "keyEvents"], "sessions"),
            "total": {p: sum(l["sessions"] for l in ia if l["periode"] == p) for p in ("m", "m1", "n1")},
        }
        ev = ga_lignes(g.get("evenements"))
        k["ga4"]["evenements"] = table(ev, "eventName", ["eventCount", "keyEvents", "totalUsers"], "eventCount")
        k["ga4"]["tendance"] = sorted(({"mois": l["yearMonth"], "sessions": l["sessions"], "keyEvents": l["keyEvents"]}
                                       for l in ga_lignes(g.get("tendance"))), key=lambda x: x["mois"])
        hotes = [l for l in ga_lignes(g.get("hotes")) if l["periode"] == "m"]
        k["ga4"]["hotes"] = [{"hote": l["hostName"], "sessions": l["sessions"]} for l in hotes]

        # Configuration et contrôles de la mesure
        cfg = b.get("ga4_config") or {}
        ke = [e["eventName"] for e in (cfg.get("key_events") or {}).get("keyEvents", [])]
        k["ga4"]["evenements_cles_configures"] = ke
        ev_m = {l["eventName"]: l for l in ev if l["periode"] == "m"}
        sess_m = (tot.get("m") or {}).get("sessions") or 0
        if not ke:
            alerte("critique", "aucun_evenement_cle", "Aucun événement clé configuré dans GA4 : les conversions ne sont pas mesurées.")
        else:
            muets = [e for e in ke if e not in ev_m]
            if muets:
                alerte("critique" if len(muets) == len(ke) else "attention", "evenements_cles_muets",
                       f"Événements clés configurés mais jamais déclenchés ce mois : {', '.join(muets)}.")
        if (tot.get("m") or {}).get("keyEvents", 0) == 0 and sess_m:
            alerte("critique", "zero_conversion", f"0 événement clé enregistré pour {sess_m} sessions.")
        fs = (ev_m.get("form_submit") or {}).get("eventCount", 0)
        if sess_m and fs / sess_m > .1:
            alerte("attention", "form_submit_suspect",
                   f"{fs} form_submit pour {sess_m} sessions ({fs / sess_m:.0%}) : probablement des formulaires techniques (moteur de réservation, newsletter) captés par la mesure améliorée.")
        if len(hotes) > 1:
            alerte("attention", "plusieurs_hotes", "Plusieurs noms d'hôte dans GA4 : " + ", ".join(f"{h['hote']} ({h['sessions']})" for h in k["ga4"]["hotes"]))
        if (dict((r["cle"], r["m"].get("sessions")) for r in k["ga4"]["canaux"]).get("Unassigned") or 0) > .05 * sess_m:
            alerte("attention", "unassigned", "Plus de 5 % des sessions sont « Unassigned » : paramètres UTM ou consentement à vérifier.")

    # ----- Search Console -----
    s = b.get("gsc") or {}
    if s:
        props = list(s)
        domaine = [p for p in props if p.startswith("sc-domain:")]
        retenues = domaine[:1] or props
        k["gsc"] = {"proprietes": props, "proprietes_additionnees": retenues,
                    "regle": "propriété de domaine seule" if domaine else "somme des propriétés préfixe d'URL (ensembles d'URL disjoints)"}
        par_prop = {}
        for p in props:
            par_prop[p] = {per: (gsc_rows(s[p].get(per, {}).get("totaux")) or [{}])[0] for per in ("m", "m1", "n1")}
        k["gsc"]["par_propriete"] = par_prop
        tot = {per: agrege([gsc_rows(s[p].get(per, {}).get("totaux")) for p in retenues]).get(("total",), {})
               for per in ("m", "m1", "n1")}
        tot = {p: v for p, v in tot.items() if v.get("impressions")}
        k["gsc"]["totaux"] = avec_ecarts(tot, ["clicks", "impressions", "ctr", "position"])
        if "n1" not in tot:
            alerte("info", "gsc_sans_n1", "Pas de données Search Console sur le même mois de l'an dernier.")
        actives = [p for p in props if (par_prop[p]["m"].get("impressions") or 0) > 0]
        if not domaine and len(actives) > 1:
            alerte("attention", "plusieurs_proprietes_actives",
                   "Plusieurs propriétés Search Console reçoivent des impressions : " +
                   ", ".join(f"{p} ({par_prop[p]['m'].get('clicks', 0)} clics, pos. {round(par_prop[p]['m'].get('position') or 0, 1)})" for p in actives) +
                   ". Google affiche plusieurs variantes d'URL : vérifier canonique, redirections et sitemap.")

        def joint(dim, nb=1):
            m = agrege([gsc_rows(s[p].get("m", {}).get(dim)) for p in retenues], nb)
            m1 = agrege([gsc_rows(s[p].get("m1", {}).get(dim)) for p in retenues], nb)
            rows = []
            for cle, v in m.items():
                r = {"cle": cle[0] if nb == 1 else list(cle), **v, "m1": m1.get(cle)}
                r["ecart_clics"] = v["clicks"] - (m1.get(cle) or {}).get("clicks", 0)
                r["ecart_position"] = round(v["position"] - m1[cle]["position"], 1) if cle in m1 and m1[cle]["position"] else None
                rows.append(r)
            disparues = [{"cle": c[0], **v} for c, v in m1.items() if c not in m and v["clicks"] > 0]
            return rows, disparues

        req, req_perdues = joint("query")
        pages, pages_perdues = joint("page")
        par_clics = lambda rows, n: sorted(rows, key=lambda r: -r["clicks"])[:n]
        k["gsc"]["requetes_top"] = par_clics(req, 25)
        k["gsc"]["requetes_gagnantes"] = sorted([r for r in req if r["ecart_clics"] > 0], key=lambda r: -r["ecart_clics"])[:10]
        k["gsc"]["requetes_perdantes"] = sorted([r for r in req if r["ecart_clics"] < 0], key=lambda r: r["ecart_clics"])[:10]
        k["gsc"]["requetes_disparues"] = sorted(req_perdues, key=lambda r: -r["clicks"])[:10]
        k["gsc"]["pages_top"] = par_clics(pages, 20)
        k["gsc"]["pages_perdantes"] = sorted([r for r in pages if r["ecart_clics"] < 0], key=lambda r: r["ecart_clics"])[:10]
        seuil = max(20, sorted([r["impressions"] for r in req] or [0])[int(len(req) * .75)] if req else 20)
        k["gsc"]["opportunites_position"] = sorted(
            [r for r in req if r["position"] and 4 <= r["position"] <= 15 and r["impressions"] >= seuil],
            key=lambda r: -r["impressions"])[:15]
        k["gsc"]["ctr_faible"] = sorted(
            [dict(r, ctr_attendu=CTR_ATTENDU[max(1, round(r["position"]))]) for r in req
             if r["position"] and r["position"] <= 10 and r["impressions"] >= 50
             and r["ctr"] < .5 * CTR_ATTENDU[max(1, round(r["position"]))]],
            key=lambda r: -r["impressions"])[:10]
        if marque:
            est_marque = lambda q: any(t in q.lower() for t in marque)
            mq = [r for r in req if est_marque(r["cle"])]
            hm = [r for r in req if not est_marque(r["cle"])]
            somme = lambda rs, c: sum(r[c] for r in rs)
            k["gsc"]["marque"] = {"termes": marque,
                                  "marque": {"clicks": somme(mq, "clicks"), "impressions": somme(mq, "impressions")},
                                  "hors_marque": {"clicks": somme(hm, "clicks"), "impressions": somme(hm, "impressions")},
                                  "note": "Calculé sur les requêtes visibles (Google masque les requêtes rares) : la somme est inférieure au total."}
            top_mq = sorted(mq, key=lambda r: -r["impressions"])[:3]
            for r in top_mq:
                if r["position"] and r["position"] > 2:
                    alerte("critique" if r["position"] > 4 else "attention", "marque_mal_classee",
                           f"Requête de marque « {r['cle']} » en position moyenne {r['position']} ({r['impressions']} impressions) : le site devrait être 1er sur son propre nom.")
        # Cannibalisation : une requête répartie sur plusieurs pages
        qp = defaultdict(list)
        for p in retenues:
            for r in gsc_rows(s[p].get("m", {}).get("query_page")):
                q, u = r["keys"]
                qp[q].append({"page": u, "clicks": r["clicks"], "impressions": r["impressions"], "position": round(r["position"], 1)})
        cann = []
        for q, lst in qp.items():
            t = sum(x["impressions"] for x in lst)
            fortes = [x for x in lst if x["impressions"] >= .1 * t]
            if t >= 30 and len({chemin(x["page"]) for x in fortes}) >= 2:
                cann.append({"requete": q, "impressions": t, "pages": sorted(fortes, key=lambda x: -x["impressions"])})
        k["gsc"]["cannibalisation"] = sorted(cann, key=lambda c: -c["impressions"])[:10]
        # Même page servie sous plusieurs hôtes
        hosts = defaultdict(set)
        for r in pages:
            hosts[chemin(r["cle"])].add(urlsplit(r["cle"]).netloc)
        doublons = {c: sorted(h) for c, h in hosts.items() if len(h) > 1}
        k["gsc"]["pages_multi_hotes"] = dict(list(doublons.items())[:15])
        if doublons:
            alerte("attention", "pages_multi_hotes", f"{len(doublons)} pages apparaissent dans Google sous plusieurs hôtes (avec et sans www).")
        k["gsc"]["appareils"] = [{"appareil": c[0], **v} for c, v in
                                 agrege([gsc_rows(s[p].get("m", {}).get("device")) for p in retenues]).items()]
        # Tendance mensuelle
        jours = agrege([gsc_rows(s[p].get("-", {}).get("tendance")) for p in retenues])
        mois = defaultdict(lambda: {"clicks": 0, "impressions": 0})
        for (d,), v in jours.items():
            mois[d[:7]]["clicks"] += v["clicks"]; mois[d[:7]]["impressions"] += v["impressions"]
        k["gsc"]["tendance"] = [{"mois": m, **v} for m, v in sorted(mois.items())]
        sm = []
        for p in props:
            for x in (s[p].get("-", {}).get("sitemaps") or {}).get("sitemap", []) or []:
                c = (x.get("contents") or [{}])[0]
                sm.append({"propriete": p, "path": x.get("path"), "erreurs": x.get("errors"), "avertissements": x.get("warnings"),
                           "soumises": c.get("submitted"), "indexees": c.get("indexed"), "lu_le": x.get("lastDownloaded")})
        k["gsc"]["sitemaps"] = sm
        if not sm:
            alerte("attention", "sans_sitemap", "Aucun sitemap déclaré dans Search Console.")
        for x in sm:
            if str(x["erreurs"]) not in ("0", "None"):
                alerte("attention", "sitemap_erreurs", f"Sitemap {x['path']} : {x['erreurs']} erreurs.")

    # ----- Cohérence GA4 / Search Console -----
    if g and s:
        org = next((r["m"].get("sessions") for r in k["ga4"]["canaux"] if r["cle"] == "Organic Search"), 0) or 0
        clics = k["gsc"]["totaux"]["m"].get("clicks") or 0
        k["coherence"] = {"sessions_organiques_ga4": org, "clics_gsc": clics,
                          "ratio": round(org / clics, 2) if clics else None,
                          "lecture": "Normal entre 0,8 et 1,6 (GA4 inclut Bing et les autres moteurs, perd les refus de cookies)."}
        if clics and not (.6 <= org / clics <= 2):
            alerte("attention", "ecart_ga4_gsc", f"{org} sessions organiques GA4 pour {clics} clics Search Console : écart inhabituel, vérifier la mesure.")

    json.dump(k, open(a.sortie, "w"), ensure_ascii=False, indent=1)
    print(json.dumps({"alertes": k["alertes"]}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
