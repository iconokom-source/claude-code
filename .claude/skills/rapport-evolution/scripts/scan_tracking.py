#!/usr/bin/env python3
"""Audit de mesure sans accès à l'API Tag Manager.

Lit ce que le navigateur reçoit : redirections des variantes de domaine, conteneurs
GTM / gtag chargés, contenu public de ces conteneurs (balises, événements, domaines
croisés), bandeau de consentement, autres traceurs, canonique, hreflang, robots, sitemap,
et domaines externes vers lesquels le site envoie (moteur de réservation, prise de RDV…).

Usage : python3 scan_tracking.py https://www.exemple.fr tracking.json [--pages /contact /en]
"""
import argparse, json, re, urllib.request
from urllib.parse import urljoin, urlsplit

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
CMP = {"Axeptio": r"axeptio", "Didomi": r"didomi", "Cookiebot": r"cookiebot", "OneTrust": r"onetrust|optanon",
       "Tarteaucitron": r"tarteaucitron", "Finsweet Cookie Consent": r"fs-cc|finsweet.*cookie", "Iubenda": r"iubenda",
       "Usercentrics": r"usercentrics", "CookieYes": r"cookieyes", "Complianz": r"complianz", "Sirdata": r"sirdata"}
TRACEURS = {"Meta Pixel": r"fbq\(|connect\.facebook\.net", "LinkedIn Insight": r"snap\.licdn\.com|_linkedin_partner_id",
            "Microsoft Clarity": r"clarity\.ms", "Hotjar": r"hotjar", "Matomo": r"matomo|piwik", "TikTok Pixel": r"analytics\.tiktok",
            "Google Ads": r"AW-\d{6,}", "Plausible": r"plausible\.io", "HubSpot": r"js\.hs-scripts|hs-analytics"}
IGNORE = re.compile(r"website-files\.com|webflow\.(com|io)|googleapis|gstatic|googletagmanager|google-analytics|jsdelivr|cloudflare|"
                    r"unpkg|jquery|fonts\.|w3\.org|schema\.org|youtube|vimeo|instagram|facebook|linkedin|twitter|x\.com|tiktok|"
                    r"maps\.app\.goo\.gl|google\.com/maps|wa\.me|agence-orem|iconokom|apple\.com|cdn\.", re.I)


def get(url, follow=True):
    """Renvoie (statut, url finale, chaîne de redirections, texte)."""
    chaine, cur = [], url
    for _ in range(8):
        req = urllib.request.Request(cur, headers={"User-Agent": UA})
        opener = urllib.request.build_opener(NoRedirect)
        try:
            r = opener.open(req, timeout=20)
            body = r.read().decode("utf-8", "replace")
            chaine.append({"url": cur, "statut": r.status})
            return r.status, cur, chaine, body
        except urllib.error.HTTPError as e:
            chaine.append({"url": cur, "statut": e.code})
            if e.code in (301, 302, 303, 307, 308) and follow:
                cur = urljoin(cur, e.headers.get("Location", ""))
                continue
            return e.code, cur, chaine, ""
        except Exception as e:  # réseau, TLS
            chaine.append({"url": cur, "erreur": str(e)[:200]})
            return None, cur, chaine, ""
    return None, cur, chaine, ""


def balises(html, nom):
    """Attributs de chaque balise <nom ...>, quel que soit l'ordre ou la casse (Webflow écrit content avant name)."""
    return [{k.lower(): v for k, v in re.findall(r'([\w:-]+)\s*=\s*"([^"]*)"', t)}
            for t in re.findall(rf"<{nom}\b[^>]*>", html, re.I)]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def conteneur(id_):
    """Lit le conteneur public (gtm.js ou gtag/js) et en extrait la configuration."""
    url = f"https://www.googletagmanager.com/{'gtm.js' if id_.startswith('GTM-') else 'gtag/js'}?id={id_}"
    st, _, _, js = get(url)
    if not js:
        return {"id": id_, "erreur": f"conteneur illisible ({st})"}
    i = js.find('"resource"')
    res = js[i:i + 400000] if i >= 0 else js
    fonctions = re.findall(r'"function":"(__[a-zA-Z0-9_]+)"', res)
    return {
        "id": id_,
        "balises": sorted(set(f for f in fonctions)),
        "nb_balises": len(re.findall(r'"tag_id":\d+', res)),
        "evenements": sorted(set(re.findall(r'"vtp_eventName":"([^"]+)"', res))),
        "destinations": sorted(set(re.findall(r'\b(G-[A-Z0-9]{6,}|AW-\d{6,})\b', res))),
        "mesure_amelioree": {k: True for k in ("form", "scroll", "outbound_click", "download", "video", "site_search")
                             if f"__ccd_em_{k}" in res},
        "consent_mode": bool(re.search(r"consent", res)) and "vtp_consent" in res,
        "_texte": js,  # retiré avant écriture
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url"); ap.add_argument("sortie")
    ap.add_argument("--pages", nargs="*", default=[])
    a = ap.parse_args()
    base = urlsplit(a.url)
    nu = base.netloc.removeprefix("www.")
    out = {"site": a.url, "variantes": {}, "pages": [], "conteneurs": [], "alertes": []}
    alerte = lambda niveau, code, texte: out["alertes"].append({"niveau": niveau, "code": code, "texte": texte})

    # 1. Variantes de domaine : toutes doivent finir sur la même URL en une seule 301
    finales = set()
    for v in (f"http://{nu}/", f"https://{nu}/", f"http://www.{nu}/", f"https://www.{nu}/"):
        st, fin, ch, _ = get(v)
        out["variantes"][v] = {"finale": fin, "statut": st, "chaine": ch}
        finales.add(fin)
        if len(ch) > 2:
            alerte("attention", "redirections_en_chaine", f"{v} passe par {len(ch) - 1} redirections avant {fin}.")
        if any(x.get("statut") in (302, 307) for x in ch):
            alerte("attention", "redirection_temporaire", f"{v} utilise une redirection temporaire (302/307) au lieu d'une 301.")
    if len(finales) > 1:
        alerte("critique", "variantes_non_unifiees", "Les variantes du domaine n'aboutissent pas à la même URL : " + ", ".join(sorted(finales)))
    canon_host = urlsplit(sorted(finales)[0]).netloc if len(finales) == 1 else base.netloc

    # 2. Pages
    ids, externes, html_total = set(), {}, ""
    for chemin in ["/"] + a.pages:
        url = urljoin(f"https://{canon_host}", chemin)
        st, fin, _, html = get(url)
        html_total += html
        p = {"url": url, "statut": st}
        links, metas = balises(html, "link"), balises(html, "meta")
        p["canonique"] = next((l.get("href") for l in links if l.get("rel", "").lower() == "canonical"), None)
        p["hreflang"] = [l.get("hreflang") for l in links if l.get("rel", "").lower() == "alternate" and l.get("hreflang")]
        p["noindex"] = any(m.get("name", "").lower() == "robots" and "noindex" in m.get("content", "").lower() for m in metas)
        p["title"] = (re.search(r"<title>(.*?)</title>", html, re.S) or [None, None])[1]
        p["meta_description"] = next((m.get("content") for m in metas if m.get("name", "").lower() == "description"), None)
        out["pages"].append(p)
        if st and st >= 400:
            alerte("critique", "page_erreur", f"{url} répond {st}.")
        if p["canonique"] and urlsplit(p["canonique"]).netloc != canon_host:
            alerte("critique", "canonique_autre_hote", f"{url} déclare une canonique sur un autre hôte : {p['canonique']}.")
        if not p["canonique"]:
            alerte("attention", "sans_canonique", f"{url} n'a pas de balise canonique.")
        if p["noindex"]:
            alerte("critique", "noindex", f"{url} est en noindex.")
        if not p["meta_description"]:
            alerte("info", "sans_meta_description", f"{url} n'a pas de meta description.")
        ids |= set(re.findall(r"\b(GTM-[A-Z0-9]{4,}|G-[A-Z0-9]{6,})\b", html))
        for u in re.findall(r'(?:href|src|action)="(https?://[^"]+)"', html):
            h = urlsplit(u).netloc.lower()
            if h and nu not in h and not IGNORE.search(u):
                externes.setdefault(h, set()).add(u[:160])

    out["identifiants"] = sorted(ids)
    out["cmp"] = [n for n, rx in CMP.items() if re.search(rx, html_total, re.I)]
    out["traceurs"] = [n for n, rx in TRACEURS.items() if re.search(rx, html_total)]
    out["consent_mode_default_inline"] = bool(re.search(r"""gtag\(\s*['"]consent['"]\s*,\s*['"]default""", html_total))
    out["domaines_externes"] = {h: sorted(v)[:5] for h, v in externes.items()}

    if not ids:
        alerte("critique", "aucun_tag_google", "Aucun conteneur Google Tag Manager ni balise GA4 détecté dans le HTML.")
    if not any(i.startswith("GTM-") for i in ids):
        alerte("info", "sans_gtm", "Pas de Google Tag Manager : la mesure passe par gtag.js en direct (moins souple pour ajouter des événements).")
    if len([i for i in ids if i.startswith("G-")]) > 1:
        alerte("attention", "plusieurs_ga4", "Plusieurs identifiants GA4 sur le site : " + ", ".join(sorted(i for i in ids if i.startswith("G-"))))
    if not out["cmp"]:
        alerte("attention", "sans_cmp", "Aucun bandeau de consentement reconnu : conformité RGPD et Consent Mode à vérifier.")

    # 3. Conteneurs publics
    for i in sorted(ids):
        c = conteneur(i)
        texte = c.pop("_texte", "")
        c["domaines_externes_lies"] = [h for h in externes if h in texte]
        out["conteneurs"].append(c)
    textes_ok = {h for c in out["conteneurs"] for h in c.get("domaines_externes_lies", [])}
    for h, urls in externes.items():
        if re.search(r"book|booking|reserv|resa|hotel|checkout|pay|stripe|calendly|iclosed|rdv|doctolib|typeform|tally|hubspot|shop",
                     h + " ".join(urls), re.I) and h not in textes_ok:
            alerte("critique", "parcours_externe_non_suivi",
                   f"Le site envoie vers {h} (réservation, paiement ou prise de RDV) mais aucun conteneur ne le déclare en domaine croisé : "
                   "la conversion finale échappe à GA4.")

    # 4. robots.txt et sitemap
    st, _, _, robots = get(f"https://{canon_host}/robots.txt")
    out["robots"] = {"statut": st, "sitemaps": re.findall(r"(?im)^sitemap:\s*(\S+)", robots), "disallow_all": bool(re.search(r"(?im)^disallow:\s*/\s*$", robots))}
    if out["robots"]["disallow_all"]:
        alerte("critique", "robots_bloque", "robots.txt bloque tout le site (Disallow: /).")
    for sm in out["robots"]["sitemaps"]:
        if urlsplit(sm).netloc != canon_host:
            alerte("attention", "sitemap_autre_hote", f"robots.txt déclare un sitemap sur un autre hôte : {sm}.")

    json.dump(out, open(a.sortie, "w"), ensure_ascii=False, indent=1)
    print(json.dumps({"identifiants": out["identifiants"], "cmp": out["cmp"], "traceurs": out["traceurs"], "alertes": out["alertes"]},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
