# Fonctions utilitaires à exécuter dans le bac à sable Composio (COMPOSIO_REMOTE_WORKBENCH).
# Coller tout le fichier dans une première cellule : les fonctions restent ensuite disponibles
# pour les cellules suivantes (l'état du bac à sable est persistant).
# `run_composio_tool` est fourni par le bac à sable, il ne faut pas l'importer.

import base64
import io
import re
import subprocess
import sys

import requests


def _data(res):
    """Renvoie le contenu utile d'une réponse run_composio_tool (souvent imbriqué sous data)."""
    d = (res or {}).get("data") or {}
    return d.get("response_data") or d


# ---------- Recherche Gmail ----------

def gmail_search(query, max_results=25):
    """Liste les messages Gmail correspondant à une requête (syntaxe Gmail).
    Renvoie une liste compacte : id, sujet, expéditeur, date, pièces jointes."""
    res, err = run_composio_tool("GMAIL_FETCH_EMAILS", {
        "query": query, "max_results": max_results, "verbose": True, "include_payload": True,
    })
    if err:
        return {"error": str(err)}
    out = []
    for m in _data(res).get("messages") or []:
        out.append({
            "message_id": m.get("messageId"),
            "thread_id": m.get("threadId"),
            "subject": m.get("subject"),
            "sender": m.get("sender"),
            "date": m.get("messageTimestamp"),
            "attachments": [
                {"attachment_id": a.get("attachmentId"), "filename": a.get("filename"), "mime": a.get("mimeType")}
                for a in (m.get("attachmentList") or [])
            ],
            "preview": (m.get("preview") or {}).get("body", "")[:300] if isinstance(m.get("preview"), dict) else "",
        })
    return out


def gmail_message(message_id):
    """Message complet : renvoie (html, texte, pièces jointes)."""
    res, err = run_composio_tool("GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID", {"message_id": message_id, "format": "full"})
    if err:
        raise RuntimeError(err)
    msg = _data(res)
    html, text = [], []

    def walk(part):
        mime = part.get("mimeType", "")
        body = (part.get("body") or {}).get("data")
        if body and not part.get("filename"):
            raw = base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)).decode("utf-8", "replace")
            (html if mime == "text/html" else text).append(raw)
        for p in part.get("parts") or []:
            walk(p)

    walk(msg.get("payload") or {})
    atts = msg.get("attachmentList") or []
    if not atts:
        found = []

        def walk_att(part):
            b = part.get("body") or {}
            if part.get("filename") and b.get("attachmentId"):
                found.append({"attachmentId": b["attachmentId"], "filename": part["filename"],
                              "mimeType": part.get("mimeType")})
            for p in part.get("parts") or []:
                walk_att(p)

        walk_att(msg.get("payload") or {})
        atts = found
    return "\n".join(html), "\n".join(text) or msg.get("messageText", ""), atts


def invoice_links(html):
    """Liens de téléchargement de facture présents dans un email (Stripe, Paddle, etc.)."""
    links = re.findall(r'href="([^"]+)"', html or "")
    keep = []
    for url in links:
        url = url.replace("&amp;", "&")
        low = url.lower()
        if any(k in low for k in ("invoice", "receipt", "facture", "billing", "pay.stripe.com", "invoice.stripe.com")):
            if url not in keep:
                keep.append(url)
    return keep


# ---------- Récupération du fichier ----------

def download_gmail_attachment(message_id, attachment_id, filename):
    """Télécharge une pièce jointe Gmail et renvoie ses octets."""
    res, err = run_composio_tool("GMAIL_GET_ATTACHMENT", {
        "message_id": message_id, "attachment_id": attachment_id, "file_name": filename,
    })
    if err:
        raise RuntimeError(err)
    d = _data(res)
    f = d.get("file") or d
    url = (f.get("s3url") or f.get("s3_url") or "").replace("&amp;", "&")
    if not url:
        raise RuntimeError(f"Pas d'URL de téléchargement dans la réponse : {list(d)}")
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.content


def download_url(url):
    """Télécharge un fichier depuis un lien (ex. lien « Télécharger la facture » d'un email Stripe).
    Pour une page Stripe hébergée (invoice.stripe.com/i/...), essayer aussi url + '/pdf'."""
    r = requests.get(url, timeout=60, allow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "")


def html_to_pdf(html):
    """Convertit un reçu HTML (email Apple, Uber, etc.) en PDF. Installe xhtml2pdf au besoin."""
    try:
        from xhtml2pdf import pisa
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "xhtml2pdf"], check=True)
        from xhtml2pdf import pisa
    buf = io.BytesIO()
    # Les images distantes ralentissent ou font échouer la conversion : on les retire.
    html = re.sub(r"<img[^>]*>", "", html or "", flags=re.I)
    res = pisa.CreatePDF(html, dest=buf, encoding="utf-8")
    if res.err:
        raise RuntimeError("Conversion HTML vers PDF échouée")
    return buf.getvalue()


# ---------- Vérification du contenu ----------

def pdf_text(data):
    """Texte d'un PDF (pypdf), pour vérifier montant, fournisseur et date."""
    try:
        from pypdf import PdfReader
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pypdf"], check=True)
        from pypdf import PdfReader
    try:
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception as e:  # PDF scanné ou protégé
        return f"__ERREUR_LECTURE__ {e}"


def amount_variants(amount):
    """Écritures possibles d'un montant : 1347.35 -> 1 347,35 / 1,347.35 / 1347,35 / 1347.35 ..."""
    entier, dec = "{:.2f}".format(abs(float(amount))).split(".")
    groupe = "{:,}".format(int(entier))  # 1,347
    v = {entier + "," + dec, entier + "." + dec, groupe + "." + dec}
    for sep in (" ", " ", " ", "."):
        v.add(groupe.replace(",", sep) + "," + dec)
    if dec == "00":
        v |= {entier, groupe.replace(",", " ")}
    return v


def amount_in_text(amount, text):
    """Vrai si le montant apparaît dans le texte, en évitant les faux positifs (2,99 dans 12,99)."""
    for v in amount_variants(amount):
        if re.search(r"(?<![\d.,])" + re.escape(v) + r"(?![\d])", text or ""):
            return True
    return False


# ---------- Envoi vers Qonto ----------

def put_to_qonto(upload_url, data, content_type="application/pdf"):
    """Envoie les octets sur l'URL renvoyée par request_attachment_upload (valable 15 min).
    Renvoie le code HTTP : 200 = OK, on peut appeler upload_attachment."""
    r = requests.put(upload_url, data=data, headers={"Content-Type": content_type}, timeout=60)
    return r.status_code


# Mémoire de travail : les fichiers prêts à envoyer, indexés par id de transaction Qonto.
READY = {}
