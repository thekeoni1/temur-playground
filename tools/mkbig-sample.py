#!/usr/bin/env python3
"""Write two VALID near-16-MiB office documents: big.pdf and big.xlsx.

THE POINT OF THIS FILE. The file-panel caps went from 8 MiB to 16 MiB per
file, and the one real risk in that is the 128 MB guest running out of
memory while temur's office reader extracts a document near the new cap.
Measuring that needs a file that actually reaches the extraction path, so
random bytes are useless: temur refuses a malformed PDF before it parses
anything, and an unreadable zip never inflates. These two are hand-built
the way tools/mkdocs-sample.py builds the small ones, padded to size, and
they extract.

Each carries a distinctive FIRST line so a clean read can be matched
exactly rather than by resemblance:

    big.pdf    page 1, line 1   BIG-PDF-PAGE-ONE-MARKER
    big.xlsx   sheet bulk, A1   BIG-XLSX-ROW-ONE-MARKER

THE TWO FORMATS COST DIFFERENT THINGS, which is the whole reason both are
measured.

  PDF   is read page at a time and stops once the caller's window is full
        (src/tools/office.rs, pdf_pages), so the extracted text stays
        small. What the guest pays is loading and parsing the document:
        the file bytes, plus lopdf's object map over all of them.

  XLSX  has no early stop. It goes through calamine, which inflates the
        workbook and builds every cell in memory, and the text of every
        row of every sheet is then concatenated into one String. So a
        deflated spreadsheet costs the guest its UNCOMPRESSED size and
        more, which is why the ratio is reported below and not left
        implicit.

COMPRESSIBILITY IS CONTROLLED ON PURPOSE. A spreadsheet padded with one
repeated word would deflate 50x, so 15.5 MiB on disk would mean something
absurd in RAM and the measurement would be of a decompression bomb rather
than of a large workbook. Cells here carry pseudo-random tokens from a
seeded PRNG, so the ratio lands in the range a real sheet full of unique
IDs and names gives, and the whole file is reproducible byte for byte.

Usage: python3 tools/mkbig-sample.py <outdir> [target_mib]
"""
import os
import random
import sys
import zipfile

PDF_MARKER = "BIG-PDF-PAGE-ONE-MARKER"
XLSX_MARKER = "BIG-XLSX-ROW-ONE-MARKER"

# Just under the 16 MiB per-file cap. The page refuses at > 16777216, so
# the file has to be under it to be droppable at all, and near it to be
# worth measuring.
DEFAULT_TARGET = 15.6

LINES_PER_PAGE = 45
ALPHABET = "abcdefghijklmnopqrstuvwxyz"


def words(rnd, n):
    """n pseudo-random lowercase words, 3-9 letters each."""
    return " ".join(
        "".join(rnd.choice(ALPHABET) for _ in range(rnd.randint(3, 9)))
        for _ in range(n)
    )


def esc(s):
    return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


# ------------------------------------------------------------------ PDF


def make_pdf(path, target_bytes):
    """A multi-page text PDF with UNCOMPRESSED content streams.

    Uncompressed is deliberate: it makes the on-disk size equal the text
    size, so padding to a target is arithmetic rather than a search, and
    it keeps the file readable by any conforming parser with no filter
    support needed. It also means the bytes the guest loads really are
    the bytes of text it will walk, which is the honest version of this
    measurement.
    """
    rnd = random.Random(20260911)

    def page_stream(first):
        out = []
        y = 760
        for i in range(LINES_PER_PAGE):
            if first and i == 0:
                text = PDF_MARKER
            elif first and i == 1:
                text = "A large PDF still reads on the 32-bit sandbox."
            else:
                text = words(rnd, 42)
            out.append("BT /F1 9 Tf 54 %d Td (%s) Tj ET" % (y, esc(text)))
            y -= 16
            if y < 40:
                y = 760
        return ("\n".join(out) + "\n").encode("ascii")

    # Object layout: 1 catalog, 2 pages node, 3 font, then for each page a
    # page object and its content stream. The Kids array is built first so
    # the pages node can be written with the real ids.
    streams = []
    size_so_far = 0
    # A rough per-page cost (page object + stream + xref entries) measured
    # from the first page, used only to decide when to stop adding pages.
    first = True
    while True:
        s = page_stream(first)
        first = False
        streams.append(s)
        size_so_far += len(s) + 320
        if size_so_far >= target_bytes:
            break

    n_pages = len(streams)
    page_ids = [4 + 2 * i for i in range(n_pages)]
    stream_ids = [5 + 2 * i for i in range(n_pages)]

    objs = {}
    objs[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    kids = b" ".join(b"%d 0 R" % i for i in page_ids)
    objs[2] = b"<< /Type /Pages /Kids [" + kids + b"] /Count %d >>" % n_pages
    objs[3] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    for i in range(n_pages):
        objs[page_ids[i]] = (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 3 0 R >> >> /Contents %d 0 R >>"
            % stream_ids[i]
        )
        objs[stream_ids[i]] = (
            b"<< /Length %d >>\nstream\n" % len(streams[i]) + streams[i] + b"endstream"
        )

    top = max(objs) + 1
    out = bytearray(b"%PDF-1.4\n")
    offsets = {}
    for i in range(1, top):
        if i not in objs:
            continue
        offsets[i] = len(out)
        out += b"%d 0 obj\n" % i + objs[i] + b"\nendobj\n"
    xref_at = len(out)
    out += b"xref\n0 %d\n" % top
    out += b"0000000000 65535 f \n"
    for i in range(1, top):
        out += b"%010d 00000 n \n" % offsets[i]
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (
        top,
        xref_at,
    )
    open(path, "wb").write(bytes(out))
    return {"pages": n_pages, "bytes": len(out)}


# ----------------------------------------------------------------- XLSX

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
<sheets><sheet name="bulk" sheetId="1" r:id="rId1"/></sheets></workbook>"""

WB_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>"""

SHEET_HEAD = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n'
    "<sheetData>"
)
SHEET_TAIL = "</sheetData></worksheet>"


def col(n):
    """0 -> A, 25 -> Z, 26 -> AA."""
    s = ""
    n += 1
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(ord("A") + r) + s
    return s


def make_xlsx(path, target_bytes):
    """A one-sheet workbook padded with rows until the DEFLATED file is at
    the target size.

    Rows are written straight into the open zip entry and the growing
    output file is watched, so the size is hit in a single pass instead of
    by generating a whole workbook and guessing again. The compressor
    buffers, so writing stops short of the target and the final size is
    reported rather than assumed.
    """
    rnd = random.Random(20260912)
    # Leave room for the four small parts and the central directory, plus
    # whatever the deflate buffer has not flushed yet.
    stop_at = target_bytes - 64 * 1024
    raw = 0
    rows = 0

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name, data in (
            ("[Content_Types].xml", CT_XLSX),
            ("_rels/.rels", RELS_XLSX),
            ("xl/workbook.xml", WB_XLSX),
            ("xl/_rels/workbook.xml.rels", WB_RELS),
        ):
            zi = zipfile.ZipInfo(name, date_time=(2026, 9, 11, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o600 << 16
            z.writestr(zi, data)

        zi = zipfile.ZipInfo(
            "xl/worksheets/sheet1.xml", date_time=(2026, 9, 11, 0, 0, 0)
        )
        zi.compress_type = zipfile.ZIP_DEFLATED
        zi.external_attr = 0o600 << 16
        with z.open(zi, "w") as sheet:

            def w(s):
                nonlocal raw
                b = s.encode("utf-8")
                raw += len(b)
                sheet.write(b)

            w(SHEET_HEAD)
            # Row 1 is the marker row, so a clean extraction is provable by
            # an exact string and not by a row count.
            w(
                '<row r="1">'
                '<c r="A1" t="inlineStr"><is><t>%s</t></is></c>'
                '<c r="B1" t="inlineStr"><is><t>region</t></is></c>'
                '<c r="C1" t="inlineStr"><is><t>units</t></is></c>'
                "</row>" % XLSX_MARKER
            )
            rows = 1
            batch = []
            while True:
                rows += 1
                cells = [
                    '<c r="A%d" t="inlineStr"><is><t>%s</t></is></c>'
                    % (rows, words(rnd, 3)),
                    '<c r="B%d" t="inlineStr"><is><t>%s</t></is></c>'
                    % (rows, words(rnd, 2)),
                    '<c r="C%d"><v>%d</v></c>' % (rows, rnd.randint(1, 999999)),
                ]
                for c in range(3, 8):
                    cells.append(
                        '<c r="%s%d" t="inlineStr"><is><t>%s</t></is></c>'
                        % (col(c), rows, words(rnd, 2))
                    )
                batch.append('<row r="%d">%s</row>' % (rows, "".join(cells)))
                if len(batch) >= 400:
                    w("".join(batch))
                    batch = []
                    sheet.flush()
                    if os.path.getsize(path) >= stop_at:
                        break
            if batch:
                w("".join(batch))
            w(SHEET_TAIL)

    return {
        "rows": rows,
        "bytes": os.path.getsize(path),
        "raw_sheet_bytes": raw,
        "ratio": round(raw / float(os.path.getsize(path)), 2),
    }


if __name__ == "__main__":
    d = sys.argv[1] if len(sys.argv) > 1 else "."
    target_mib = float(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_TARGET
    target = int(target_mib * 1024 * 1024)
    os.makedirs(d, exist_ok=True)

    pdf = make_pdf(os.path.join(d, "big.pdf"), target)
    xlsx = make_xlsx(os.path.join(d, "big.xlsx"), target)

    cap = 16 * 1024 * 1024
    print(
        "big.pdf    %10d B  %5.2f MiB  %d pages"
        % (pdf["bytes"], pdf["bytes"] / 1048576.0, pdf["pages"])
    )
    print(
        "big.xlsx   %10d B  %5.2f MiB  %d rows, sheet XML %d B (%.2fx)"
        % (
            xlsx["bytes"],
            xlsx["bytes"] / 1048576.0,
            xlsx["rows"],
            xlsx["raw_sheet_bytes"],
            xlsx["ratio"],
        )
    )
    bad = False
    for name, info in (("big.pdf", pdf), ("big.xlsx", xlsx)):
        if info["bytes"] > cap:
            print("FAIL %s is OVER the 16 MiB page cap, it could not be dropped" % name)
            bad = True
    sys.exit(1 if bad else 0)
