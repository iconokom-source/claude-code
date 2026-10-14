# Collecte GA4 + Search Console, à exécuter dans COMPOSIO_REMOTE_WORKBENCH.
# Remplacer le bloc CONFIG, exécuter, puis télécharger l'URL imprimée (curl -o brut.json).
# Toujours les mêmes requêtes : les chiffres du rapport sont comparables d'un mois à l'autre.
import json, calendar, datetime as dt
from concurrent.futures import ThreadPoolExecutor

CONFIG = {
    "client": "eiffel-segur",
    "mois": "2026-09",                      # mois analysé (AAAA-MM)
    "ga4": "properties/542995587",          # une propriété GA4 (ou None)
    "gsc": ["https://paris-hotel-eiffel-segur.com/", "https://www.paris-hotel-eiffel-segur.com/"],
}

def bornes(aaaa_mm, decalage_mois=0, decalage_an=0):
    a, m = map(int, aaaa_mm.split("-"))
    m -= decalage_mois; a -= decalage_an
    while m < 1: m += 12; a -= 1
    fin = calendar.monthrange(a, m)[1]
    return f"{a:04d}-{m:02d}-01", f"{a:04d}-{m:02d}-{fin:02d}"

P = {"m": bornes(CONFIG["mois"]), "m1": bornes(CONFIG["mois"], 1), "n1": bornes(CONFIG["mois"], 0, 1)}
RANGES = [{"name": k, "startDate": v[0], "endDate": v[1]} for k, v in P.items()]
# 13 mois glissants pour la courbe de tendance
debut_13, _ = bornes(CONFIG["mois"], 12)

def ga(dims, mets, limit=None, order=None, ranges=RANGES):
    r = {"dateRanges": ranges, "dimensions": [{"name": d} for d in dims], "metrics": [{"name": m} for m in mets]}
    if limit: r["limit"] = limit
    if order: r["orderBys"] = [{"desc": True, "metric": {"metricName": order}}]
    return r

GA4_REQ = {
    "totaux": ga([], ["sessions", "totalUsers", "newUsers", "engagedSessions", "engagementRate",
                      "averageSessionDuration", "screenPageViews", "keyEvents", "sessionKeyEventRate"]),
    "canaux": ga(["sessionDefaultChannelGroup"], ["sessions", "engagedSessions", "engagementRate", "keyEvents"]),
    "pages_entree": ga(["landingPage"], ["sessions", "engagementRate", "keyEvents"], 60, "sessions"),
    "evenements": ga(["eventName"], ["eventCount", "keyEvents", "totalUsers"], 100, "eventCount"),
    "appareils": ga(["deviceCategory"], ["sessions", "engagementRate", "keyEvents"]),
    "sources": ga(["sessionSource", "sessionMedium"], ["sessions", "engagementRate", "keyEvents"], 80, "sessions"),
    "hotes": ga(["hostName"], ["sessions"], 20, "sessions"),
    "pays": ga(["country"], ["sessions", "keyEvents"], 15, "sessions"),
    "tendance": ga(["yearMonth"], ["sessions", "keyEvents"], 24, None,
                   [{"startDate": debut_13, "endDate": P["m"][1]}]),
    "pages_vues": ga(["pagePath"], ["screenPageViews", "userEngagementDuration"], 60, "screenPageViews"),
}

out = {"config": CONFIG, "periodes": P, "ga4": {}, "ga4_config": {}, "gsc": {}, "erreurs": []}

def run(slug, args):
    res, err = run_composio_tool(slug, args)
    if err:
        return {"_erreur": str(err)[:500]}
    d = res.get("data", res)
    return d.get("response_data", d) if isinstance(d, dict) else d

jobs = {}
if CONFIG["ga4"]:
    for k, req in GA4_REQ.items():
        jobs[("ga4", k)] = ("GOOGLE_ANALYTICS_RUN_REPORT", {"property": CONFIG["ga4"], **req})
    jobs[("ga4_config", "key_events")] = ("GOOGLE_ANALYTICS_LIST_KEY_EVENTS", {"parent": CONFIG["ga4"]})
    jobs[("ga4_config", "propriete")] = ("GOOGLE_ANALYTICS_GET_PROPERTY", {"name": CONFIG["ga4"]})

for site in CONFIG["gsc"]:
    for per in ("m", "m1", "n1"):
        s, e = P[per]
        base = {"site_url": site, "start_date": s, "end_date": e}
        jobs[("gsc", site, per, "totaux")] = ("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY", {**base, "dimensions": []})
        if per != "n1":
            for dim in ("query", "page"):
                jobs[("gsc", site, per, dim)] = ("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY",
                                                 {**base, "dimensions": [dim], "row_limit": 1000})
        if per == "m":
            jobs[("gsc", site, per, "device")] = ("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY", {**base, "dimensions": ["device"]})
            jobs[("gsc", site, per, "query_page")] = ("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY",
                                                      {**base, "dimensions": ["query", "page"], "row_limit": 2000})
    jobs[("gsc", site, "-", "tendance")] = ("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY",
                                           {"site_url": site, "start_date": debut_13, "end_date": P["m"][1], "dimensions": ["date"], "row_limit": 500})
    jobs[("gsc", site, "-", "sitemaps")] = ("GOOGLE_SEARCH_CONSOLE_LIST_SITEMAPS", {"site_url": site})

with ThreadPoolExecutor(8) as ex:
    futs = {k: ex.submit(run, *v) for k, v in jobs.items()}
    for k, f in futs.items():
        r = f.result()
        if isinstance(r, dict) and "_erreur" in r:
            out["erreurs"].append({"requete": list(k), "erreur": r["_erreur"]})
        if k[0] == "gsc":
            out["gsc"].setdefault(k[1], {}).setdefault(k[2], {})[k[3]] = r
        else:
            out[k[0]][k[1]] = r

out["collecte_le"] = dt.datetime.now(dt.timezone.utc).isoformat()
chemin = f"/home/user/brut-{CONFIG['client']}-{CONFIG['mois']}.json"
json.dump(out, open(chemin, "w"), ensure_ascii=False)
up, err = upload_local_file(chemin)
print("RESULTAT", json.dumps({"url": (up or {}).get("s3_url"), "erreur_upload": err or None,
                              "erreurs": out["erreurs"][:10], "nb_requetes": len(jobs)}, ensure_ascii=False))
