#!/usr/bin/env python3
"""Génère un document Word (.docx) aux couleurs d'Orem.

Reprend la page « Documents » du Figma : A4, marges 32 pt (≈ 11 mm),
en-tête monogramme + mentions, titres Trykker 17 pt soulignés d'un filet,
corps Lexend Deca Light 12 pt, numéro de page « 1/2 » en bas à droite.

Usage CLI :
    python3 orem_docx.py spec.json sortie.docx
    python3 orem_docx.py --demo sortie.docx

Usage bibliothèque :
    from orem_docx import OremDoc
    doc = OremDoc(kind="Rapport mois 1", title="Un mois après la mise en ligne")
    doc.h2("Contexte"); doc.p("Texte…"); doc.bullets(["a", "b"])
    doc.kpis([("1 860", "visiteurs"), ("92", "score")])
    doc.table(["Indicateur", "Mesure"], [["LCP", "1,9 s"]])
    doc.note("À noter", "Le prochain point est à 90 jours.")
    doc.save("sortie.docx")

Spec JSON : {"kind": "...", "title": "...", "year": 2026,
             "blocks": [{"type": "h2|h3|p|bullets|numbers|kpis|table|note|pagebreak", ...}]}
  - p : {"text": "..."}  (**gras** accepté)
  - bullets / numbers : {"items": ["...", ...]}
  - kpis : {"items": [{"value": "...", "label": "..."}]}
  - table : {"columns": [...], "rows": [[...], ...]}
  - note : {"label": "À noter", "text": "..."}

Polices : Trykker et Lexend Deca doivent être installées (assets/fonts/).
Pour un PDF : `soffice --headless --convert-to pdf sortie.docx`.
"""
from __future__ import annotations

import datetime as _dt
import json
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Emu, Mm, Pt, RGBColor

ASSETS = Path(__file__).resolve().parent.parent / "assets"
LOGO = ASSETS / "logo" / "png" / "orem-monogramme-noir.png"

INK = RGBColor(0x00, 0x00, 0x12)
ORANGE = RGBColor(0xFF, 0x62, 0x00)
GREY = RGBColor(0x8E, 0x8D, 0x8D)      # #434242 à 60 % sur blanc
RULE = "DEDDDC"                          # #BCBAB9 à 25 % sur blanc, aplati
PAPER = "F8F8F7"

SERIF = "Trykker"
SANS = "Lexend Deca"
SANS_LIGHT = "Lexend Deca Light"
SANS_MEDIUM = "Lexend Deca Medium"

MARGIN = Pt(32)


def _fonts(run_or_style_font, name):
    """Applique la police à toutes les écritures (latin, ea, cs) pour éviter les substitutions."""
    run_or_style_font.name = name
    el = run_or_style_font.element if hasattr(run_or_style_font, "element") else None
    rpr = el.get_or_add_rPr() if el is not None and hasattr(el, "get_or_add_rPr") else None
    if rpr is None:
        return
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for k in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rfonts.set(qn(k), name)


def _style_font(style, name, size, color=INK, tracking=None):
    f = style.font
    f.name = name
    f.size = Pt(size)
    f.color.rgb = color
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for k in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rfonts.set(qn(k), name)
    for t in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        if rfonts.get(qn(t)) is not None:
            del rfonts.attrib[qn(t)]
    if tracking is not None:  # interlettrage en twentièmes de point
        sp = rpr.find(qn("w:spacing"))
        if sp is None:
            sp = OxmlElement("w:spacing")
            rpr.append(sp)
        sp.set(qn("w:val"), str(int(round(size * tracking * 20))))


def _border(paragraph, side="bottom", color=RULE, sz=4, space=4):
    ppr = paragraph._p.get_or_add_pPr()
    bdr = ppr.find(qn("w:pBdr"))
    if bdr is None:
        bdr = OxmlElement("w:pBdr")
        ppr.append(bdr)
    b = OxmlElement(f"w:{side}")
    b.set(qn("w:val"), "single")
    b.set(qn("w:sz"), str(sz))
    b.set(qn("w:space"), str(space))
    b.set(qn("w:color"), color)
    bdr.append(b)


def _shade(cell_or_par, fill):
    el = cell_or_par._tc.get_or_add_tcPr() if hasattr(cell_or_par, "_tc") else cell_or_par._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    el.append(shd)


def _cell_borders(cell, **sides):
    tcpr = cell._tc.get_or_add_tcPr()
    b = tcpr.find(qn("w:tcBorders"))
    if b is None:
        b = OxmlElement("w:tcBorders")
        tcpr.append(b)
    for side in ("top", "left", "bottom", "right"):
        e = OxmlElement(f"w:{side}")
        spec = sides.get(side)
        if spec:
            e.set(qn("w:val"), "single")
            e.set(qn("w:sz"), str(spec[1]))
            e.set(qn("w:color"), spec[0])
            e.set(qn("w:space"), "0")
        else:
            e.set(qn("w:val"), "nil")
        b.append(e)


def _cell_margin(cell, **pts):
    tcpr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for side, v in pts.items():
        e = OxmlElement(f"w:{side}")
        e.set(qn("w:w"), str(int(v * 20)))
        e.set(qn("w:type"), "dxa")
        mar.append(e)
    tcpr.append(mar)


def _no_table_borders(table):
    tblpr = table._tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{side}")
        e.set(qn("w:val"), "nil")
        b.append(e)
    tblpr.append(b)


def _field(run, instr):
    for kind, text in (("begin", None), ("instr", instr), ("separate", None), ("text", "1"), ("end", None)):
        if kind == "instr":
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = text
        elif kind == "text":
            el = OxmlElement("w:t")
            el.text = text
        else:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
        run._r.append(el)


def _runs(paragraph, text, font=None, size=None, color=None):
    """Ajoute du texte en gérant **gras** (rendu en Lexend Deca Medium)."""
    for i, part in enumerate(re.split(r"\*\*(.+?)\*\*", text)):
        if not part:
            continue
        r = paragraph.add_run(part)
        if i % 2 == 1:
            _fonts(r.font, SANS_MEDIUM)
        elif font:
            _fonts(r.font, font)
        if size:
            r.font.size = Pt(size)
        if color is not None:
            r.font.color.rgb = color
    return paragraph


class OremDoc:
    def __init__(self, kind: str = "", title: str = "", year: int | None = None, body_size: float = 12):
        self.d = Document()
        self.body_size = body_size
        self._setup_page()
        self._setup_styles()
        self._setup_header_footer(year or _dt.date.today().year)
        if title or kind:
            self._title_block(kind, title)

    # --- mise en place ------------------------------------------------------
    def _setup_page(self):
        s = self.d.sections[0]
        s.page_width, s.page_height = Mm(210), Mm(297)
        s.left_margin = s.right_margin = MARGIN
        s.top_margin = Pt(84)
        s.bottom_margin = Pt(56)
        s.header_distance = Pt(32)
        s.footer_distance = Pt(28)

    def _setup_styles(self):
        st = self.d.styles
        normal = st["Normal"]
        _style_font(normal, SANS_LIGHT, self.body_size, INK, tracking=-0.01)
        pf = normal.paragraph_format
        pf.line_spacing = 1.2
        pf.space_after = Pt(9)
        pf.space_before = Pt(0)

        h1 = st["Heading 1"]   # titre de section (h2 du Figma)
        _style_font(h1, SERIF, 17, INK, tracking=-0.02)
        h1.font.bold = False
        h1.paragraph_format.space_before = Pt(22)
        h1.paragraph_format.space_after = Pt(6)
        h1.paragraph_format.keep_with_next = True
        h1.paragraph_format.line_spacing = 1.2

        h2 = st["Heading 2"]
        _style_font(h2, SERIF, 13, INK, tracking=-0.02)
        h2.font.bold = False
        h2.paragraph_format.space_before = Pt(14)
        h2.paragraph_format.space_after = Pt(4)
        h2.paragraph_format.keep_with_next = True

        for name in ("List Bullet", "List Number"):
            ls = st[name]
            _style_font(ls, SANS_LIGHT, self.body_size, INK, tracking=-0.01)
            ls.paragraph_format.space_after = Pt(3)
            ls.paragraph_format.line_spacing = 1.2

        cap = st["Caption"]
        _style_font(cap, SANS_LIGHT, 9, GREY)
        cap.font.italic = False
        cap.font.bold = False

    def _setup_header_footer(self, year):
        for name in ("Header", "Footer"):  # retire les tabulations centre/droite par défaut
            try:
                self.d.styles[name].paragraph_format.tab_stops.clear_all()
            except KeyError:
                pass
        sec = self.d.sections[0]
        width = sec.page_width - sec.left_margin - sec.right_margin
        hp = sec.header.paragraphs[0]
        hp.paragraph_format.tab_stops.add_tab_stop(width, WD_TAB_ALIGNMENT.RIGHT)
        hp.add_run().add_picture(str(LOGO), width=Pt(38))
        r = hp.add_run(f"\t© {year} Orem.")
        _fonts(r.font, SANS_LIGHT)
        r.font.size = Pt(9)
        r.font.color.rgb = INK
        hp2 = sec.header.add_paragraph()
        hp2.paragraph_format.tab_stops.add_tab_stop(width, WD_TAB_ALIGNMENT.RIGHT)
        r = hp2.add_run("\tTous droits réservés.")
        _fonts(r.font, SANS_LIGHT)
        r.font.size = Pt(9)
        for p in (hp, hp2):
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1

        fp = sec.footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        for part in ("PAGE", "/", "NUMPAGES"):
            r = fp.add_run()
            _fonts(r.font, SANS)
            r.font.size = Pt(9)
            r.font.color.rgb = GREY
            if part == "/":
                r.text = "/"
            else:
                _field(r, part)

    def _title_block(self, kind, title):
        sec = self.d.sections[0]
        width = sec.page_width - sec.left_margin - sec.right_margin
        p = self.d.add_paragraph()
        p.paragraph_format.tab_stops.add_tab_stop(width, WD_TAB_ALIGNMENT.RIGHT)
        p.paragraph_format.space_after = Pt(18)
        r = p.add_run(kind)
        _fonts(r.font, SANS_LIGHT)
        r.font.size = Pt(9)
        r = p.add_run("\t" + title)
        _fonts(r.font, SERIF)
        r.font.size = Pt(17)
        _border(p, "bottom", RULE, 4, 8)

    # --- blocs --------------------------------------------------------------
    def h2(self, text):
        p = self.d.add_paragraph(text, style="Heading 1")
        _border(p, "bottom", RULE, 4, 4)
        return p

    def h3(self, text):
        return self.d.add_paragraph(text, style="Heading 2")

    def p(self, text):
        return _runs(self.d.add_paragraph(), text)

    def eyebrow(self, text):
        p = self.d.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        return _runs(p, text, SANS, 9, ORANGE)

    def bullets(self, items, numbered=False):
        style = "List Number" if numbered else "List Bullet"
        out = [_runs(self.d.add_paragraph(style=style), it) for it in items]
        if out:
            out[-1].paragraph_format.space_after = Pt(9)
        return out

    def kpis(self, items):
        items = [(i["value"], i["label"]) if isinstance(i, dict) else i for i in items]
        t = self.d.add_table(rows=1, cols=len(items))
        _no_table_borders(t)
        for cell, (value, label) in zip(t.rows[0].cells, items):
            _cell_borders(cell, left=("000012", 6))
            _cell_margin(cell, left=10)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            r = p.add_run(value)
            _fonts(r.font, SERIF)
            r.font.size = Pt(26)
            p2 = cell.add_paragraph()
            p2.paragraph_format.space_after = Pt(0)
            r = p2.add_run(label)
            _fonts(r.font, SANS_LIGHT)
            r.font.size = Pt(9)
        self.d.add_paragraph().paragraph_format.space_after = Pt(4)
        return t

    def table(self, columns, rows, widths=None):
        t = self.d.add_table(rows=1 + len(rows), cols=len(columns))
        t.alignment = WD_TABLE_ALIGNMENT.LEFT
        _no_table_borders(t)
        for j, h in enumerate(columns):
            c = t.rows[0].cells[j]
            _cell_borders(c, bottom=(RULE, 4))
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(4)
            _runs(p, str(h), SANS_LIGHT, 10, GREY)
        for i, row in enumerate(rows, start=1):
            for j, val in enumerate(row):
                c = t.rows[i].cells[j]
                if i % 2 == 1:
                    _shade(c, PAPER)
                p = c.paragraphs[0]
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                _runs(p, str(val), SANS_LIGHT, 10)
        if widths:
            for row in t.rows:
                for c, w in zip(row.cells, widths):
                    c.width = Mm(w)
        self.d.add_paragraph().paragraph_format.space_after = Pt(4)
        return t

    def note(self, label, text):
        t = self.d.add_table(rows=1, cols=1)
        _no_table_borders(t)
        c = t.rows[0].cells[0]
        _shade(c, PAPER)
        p = c.paragraphs[0]
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        _runs(p, label, SANS, 9, ORANGE)
        p2 = c.add_paragraph()
        p2.paragraph_format.space_after = Pt(6)
        _runs(p2, text, SANS_LIGHT, 10.5)
        self.d.add_paragraph().paragraph_format.space_after = Pt(4)
        return t

    def pagebreak(self):
        self.d.add_page_break()

    def save(self, out):
        # supprime les paragraphes vides en fin de document (évite une page blanche)
        body = self.d.element.body
        while True:
            last = [e for e in body if e.tag != qn("w:sectPr")][-1]
            if last.tag == qn("w:p") and not "".join(last.itertext()).strip() and last.find(".//" + qn("w:drawing")) is None and last.find(".//" + qn("w:br")) is None:
                body.remove(last)
            else:
                break
        self.d.save(str(out))
        return out


def build_doc(spec: dict, out):
    doc = OremDoc(spec.get("kind", ""), spec.get("title", ""), spec.get("year"), spec.get("body_size", 12))
    for b in spec.get("blocks", []):
        t = b["type"]
        if t == "h2": doc.h2(b["text"])
        elif t == "h3": doc.h3(b["text"])
        elif t == "p": doc.p(b["text"])
        elif t == "eyebrow": doc.eyebrow(b["text"])
        elif t == "bullets": doc.bullets(b["items"])
        elif t == "numbers": doc.bullets(b["items"], numbered=True)
        elif t == "kpis": doc.kpis(b["items"])
        elif t == "table": doc.table(b["columns"], b["rows"], b.get("widths"))
        elif t == "note": doc.note(b.get("label", "À noter"), b["text"])
        elif t == "pagebreak": doc.pagebreak()
        else: raise ValueError(f"bloc inconnu : {t!r}")
    return doc.save(out)


DEMO_SPEC = {
    "kind": "Rapport mois 1",
    "title": "Un mois après la mise en ligne",
    "blocks": [
        {"type": "h2", "text": "Contexte"},
        {"type": "p", "text": "Votre nouveau site a été mis en ligne le [JJ mois AAAA]. Un mois après la publication marque un premier jalon utile : le délai est suffisant pour que les moteurs de recherche aient exploré et indexé l’ensemble des pages."},
        {"type": "h2", "text": "Chiffres clés"},
        {"type": "kpis", "items": [{"value": "1 860", "label": "visiteurs sur la période"},
                                    {"value": "46/48", "label": "pages indexées"},
                                    {"value": "92", "label": "score de performance desktop"}]},
        {"type": "h2", "text": "Performances techniques"},
        {"type": "p", "text": "Le site répond aux standards de performance actuels. Les **Core Web Vitals** sont au vert sur la majorité des pages :"},
        {"type": "bullets", "items": ["LCP mobile : 1,9 s, sous le seuil recommandé de 2,5 s", "CLS : 0,04, bien en dessous de 0,1", "INP : 145 ms, dans la zone considérée comme bonne"]},
        {"type": "table", "columns": ["Indicateur", "Mesure", "Seuil"],
         "rows": [["LCP mobile", "1,9 s", "< 2,5 s"], ["CLS", "0,04", "< 0,1"], ["INP", "145 ms", "< 200 ms"]]},
        {"type": "h2", "text": "Synthèse et recommandations"},
        {"type": "numbers", "items": ["Enrichir régulièrement le contenu.", "Suivre les positions sur un panel de mots-clés cibles.", "Optimiser les pages dont la performance mobile reste perfectible."]},
        {"type": "note", "label": "À noter", "text": "Le prochain point d’étape est recommandé à 90 jours."},
    ],
}


def main(argv):
    if len(argv) == 3 and argv[1] == "--demo":
        build_doc(DEMO_SPEC, argv[2])
    elif len(argv) == 3:
        build_doc(json.loads(Path(argv[1]).read_text(encoding="utf-8")), argv[2])
    else:
        print(__doc__)
        return 1
    print(f"OK → {argv[2]}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
