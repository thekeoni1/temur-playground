#!/usr/bin/env python3
"""Write three tiny office-format samples: sample.pdf, sample.docx, sample.xlsx.

Hand-built rather than produced by an office suite so the bytes are small,
deterministic and reviewable. Each carries one distinctive sentence so the
extracted text can be matched exactly.
"""
import sys, os, zipfile, zlib

PDF_LINE1 = "Temur reads PDF files now."
PDF_LINE2 = "Ship it on the 32-bit sandbox."
DOCX_LINE = "Word documents become plain text."
XLSX_CELLS = [["region", "units"], ["north", 42], ["south", 17]]

def esc(s):
    return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")

def make_pdf(path):
    content = (
        "BT /F1 14 Tf 72 700 Td (%s) Tj ET\n"
        "BT /F1 14 Tf 72 680 Td (%s) Tj ET\n" % (esc(PDF_LINE1), esc(PDF_LINE2))
    ).encode("ascii")
    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n" % len(content) + content + b"endstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
    xref_at = len(out)
    out += b"xref\n0 %d\n" % (len(objs) + 1)
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (
        len(objs) + 1, xref_at)
    open(path, "wb").write(bytes(out))

def zipw(path, entries):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in entries:
            zi = zipfile.ZipInfo(name, date_time=(2026, 9, 10, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o600 << 16
            z.writestr(zi, data)

CT_DOCX = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

RELS_DOCX = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

def make_docx(path):
    doc = ("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body><w:p><w:r><w:t>%s</w:t></w:r></w:p></w:body></w:document>""" % DOCX_LINE)
    zipw(path, [("[Content_Types].xml", CT_DOCX),
                ("_rels/.rels", RELS_DOCX),
                ("word/document.xml", doc)])

CT_XLSX = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>"""

RELS_XLSX = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""

WB_XLSX = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="sales" sheetId="1" r:id="rId1"/></sheets></workbook>"""

WB_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>"""

def make_xlsx(path):
    rows = []
    for r, row in enumerate(XLSX_CELLS, start=1):
        cells = []
        for c, v in enumerate(row):
            ref = "%s%d" % (chr(ord("A") + c), r)
            if isinstance(v, str):
                cells.append('<c r="%s" t="inlineStr"><is><t>%s</t></is></c>' % (ref, v))
            else:
                cells.append('<c r="%s"><v>%d</v></c>' % (ref, v))
        rows.append('<row r="%d">%s</row>' % (r, "".join(cells)))
    sheet = ("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>%s</sheetData></worksheet>""" % "".join(rows))
    zipw(path, [("[Content_Types].xml", CT_XLSX),
                ("_rels/.rels", RELS_XLSX),
                ("xl/workbook.xml", WB_XLSX),
                ("xl/_rels/workbook.xml.rels", WB_RELS),
                ("xl/worksheets/sheet1.xml", sheet)])

if __name__ == "__main__":
    d = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(d, exist_ok=True)
    make_pdf(os.path.join(d, "sample.pdf"))
    make_docx(os.path.join(d, "sample.docx"))
    make_xlsx(os.path.join(d, "sample.xlsx"))
    for n in ("sample.pdf", "sample.docx", "sample.xlsx"):
        p = os.path.join(d, n)
        print("%-14s %6d B" % (n, os.path.getsize(p)))
