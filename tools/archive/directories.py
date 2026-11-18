"""Extract the town's residents (directory town codes in tools/town.json) from the library's digitized city directories.

For each volume (1908-1950) and each part PDF: download, read the OCR text layer with word
positions (pdftotext -bbox-layout), rebuild wrapped entries, keep those whose address ends in
the Maplewood/Hilton town code, and (for selected "document" years) crop the scanned line.
The downloaded PDF is deleted after processing; only extracted facts and small crops are kept.
"""
import os, re, sys, json, html, subprocess
from concurrent.futures import ThreadPoolExecutor
from common import BASE, OUT, fetch, slug, load_streets, canon_street, SLUG, DIG, TOWN

YEARS = [int(y) for y in sys.argv[1].split(",")] if len(sys.argv) > 1 else TOWN["directories"]["years"]
CROP_YEARS = set(TOWN["directories"]["crop_years"])
CODES = TOWN["directories"]["codes"]   # e.g. {"M": "Maplewood", "H": "Hilton"}
TMP = os.path.join(OUT, "_tmp"); os.makedirs(TMP, exist_ok=True)
STREETS = load_streets()

def parts_for(y):
    for _ in range(4):
        h = fetch(f"{BASE}/{SLUG}/views/view.php?id={DIG['city_directories_id']}&yr={y}").decode("utf-8", "ignore")
        ps = sorted(set(re.findall(rf"/{SLUG}/data/city-directories/{y}/[^\"&]+\.pdf", h)), key=lambda s: int(re.search(r"_p(\d+)", s).group(1)))
        if ps: return ps
    return []

LINE = re.compile(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', re.S)
WORD = re.compile(r"<word[^>]*>(.*?)</word>", re.S)
PAGE = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', re.S)
DITTO = r"(?:[—\-–_~]{1,3}|[“\"”]{1,2})"
START = re.compile(rf"^(?:{DITTO}\s*\S|[A-Z][A-Za-z'’]+[,]?\s)")
TOWN_RE = "(" + "|".join(sorted(map(re.escape, CODES), key=len, reverse=True)) + ")"
ADDR = re.compile(rf"\b(h|r|bds|rms|res|bd)\.?\s+(\d{{1,4}}[A-Za-z]?(?:-\d+)?)\s+([A-Z][A-Za-z.'’]*(?:\s[A-Za-z.'’]+){{0,3}}?)\s+{TOWN_RE}\.?$")

def pages(bbox_html):
    for pw, ph, body in PAGE.findall(bbox_html):
        lines = []
        for x0, y0, x1, y1, inner in LINE.findall(body):
            t = html.unescape(" ".join(WORD.findall(inner))).strip()
            if t: lines.append([t, float(x0), float(y0), float(x1), float(y1)])
        yield float(pw), float(ph), lines

def columns(lines):
    """Left edges of the text columns: x positions where ditto-dash entries start (rounded, frequent)."""
    from collections import Counter
    c = Counter(round(x0 / 4) * 4 for t, x0, *_ in lines if re.match(rf"^{DITTO}", t))
    return sorted(x for x, n in c.items() if n >= 4)

def entries(lines):
    """Re-join wrapped entries. A line at a column's left edge starts an entry; an indented line continues it;
    lines outside every column (advertisements, running heads) are dropped. Falls back to the old heuristic
    when no columns can be found on the page."""
    cols = columns(lines)
    cur = None
    for t, x0, y0, x1, y1 in lines:
        if cols:
            edge = min(cols, key=lambda c: abs(c - x0))
            d = x0 - edge
            if -6 <= d <= 6: kind = "start"
            elif 6 < d <= 45: kind = "cont"
            else: kind = "skip"
            if kind == "skip":
                continue
            new = cur is None or kind == "start" and not cur[0].endswith(("-", "\xad")) or y0 < cur[2] - 30 or abs(y0 - cur[4]) > 40
        else:
            new = cur is None or START.match(t) and not cur[0].endswith(("-", "\xad")) or y0 < cur[2] - 30 or abs(y0 - cur[4]) > 40
        if new:
            if cur: yield cur
            cur = [t, x0, y0, x1, y1]
        else:
            cur[0] = (cur[0][:-1] if cur[0].endswith(("-", "\xad")) else cur[0] + " ") + t
            cur[1], cur[2], cur[3], cur[4] = min(cur[1], x0), min(cur[2], y0), max(cur[3], x1), max(cur[4], y1)
    if cur: yield cur

GIVEN = set("""Albert Alfred Alice Ann Anna Anne Arthur Barbara Benjamin Bertha Betty Carl Carrie Catherine Charles Clara Daniel David Donald
Dorothy Edith Edna Edward Edwin Eleanor Elizabeth Ella Ellen Emily Emma Ernest Esther Ethel Eugene Evelyn Florence Frances Francis Frank
Fred Frederick George Gertrude Grace Harold Harriet Harry Helen Henry Herbert Howard Ida Irene Isabel Jacob James Jane Jean Jennie John
Joseph Josephine Julia Katherine Kenneth Laura Lawrence Leo Leonard Lillian Louis Louise Lucy Mabel Margaret Marie Marion Martha Mary
Mildred Minnie Nellie Norman Patrick Paul Peter Philip Ralph Raymond Richard Robert Rose Ruth Samuel Sarah Stanley Theodore Thomas Victor
Viola Walter William Willard""".split())

def loose_street(raw):
    w = re.sub(r"[^A-Za-z0-9 ]", " ", raw).split()
    if not w or len("".join(w)) < 3: return None
    from common import SUFFIX
    if w[-1].lower() in SUFFIX: w[-1] = SUFFIX[w[-1].lower()]
    elif len(w) == 1: w.append("Street")
    return "~" + " ".join(w).upper()   # "~" marks a street name we could not confirm against the library's street list

TEN = {"h": "householder", "r": "resident", "res": "resident", "bds": "boarder", "bd": "boarder", "rms": "rooms"}

def parse_part(y, path_url):
    pdf = os.path.join(TMP, f"{y}_{os.path.basename(path_url)}")
    fetch(BASE + path_url, pdf, pause=0.5)
    bb = subprocess.run(["pdftotext", "-bbox-layout", pdf, "-"], capture_output=True, text=True, errors="ignore").stdout
    out, surname = [], None
    for pno, (pw, ph, lines) in enumerate(pages(bb), 1):
        for t, x0, y0, x1, y1 in entries(lines):
            t = re.sub(r"\s+", " ", t).strip()
            m = re.match(rf"^{DITTO}\s*(.*)$", t)
            if m: rest = m.group(1)
            else:
                w = t.split(" ", 1)
                if not re.match(r"^[A-Z][A-Za-z'’]+,?$", w[0]): continue
                if surname and w[0] in GIVEN and len(w) > 1 and re.match(r"^[A-Z]\b|^\(|^[A-Z][a-z]+\s", w[1]):
                    rest = t  # OCR dropped the ditto dash: "Harold G (Raetta R) ..." continues the previous surname
                else:
                    surname = w[0].rstrip(",").title(); rest = w[1] if len(w) > 1 else ""
            a = ADDR.search(t)
            if not a or not surname: continue
            raw = a.group(3).replace("pky", "pkwy")
            # keep directions: "Ridgewood rd S" -> "South Ridgewood rd", "S Orange av W" -> "West S Orange av"
            DIRS = {"N": "North", "S": "South", "E": "East", "W": "West"}
            d = re.match(r"^(.*\S)\s+([NSEW]|North|South|East|West)$", raw)
            if d: raw = DIRS.get(d.group(2), d.group(2)) + " " + d.group(1)
            raw = re.sub(r"\b([NSEW])\s+(?=[A-Z][a-z])", lambda m: DIRS[m.group(1)] + " ", raw)
            street = canon_street(raw, STREETS) or loose_street(raw)
            pre = rest[: max(0, len(rest) - (len(t) - a.start()))]
            spouse = re.search(r"\(([A-Za-z .]+)\)", pre)
            pre_ns = re.sub(r"\([^)]*\)", " ", pre)
            g = re.match(r"^((?:[A-Z][a-z]+\.?|[A-Z]\.?)(?:\s(?:[A-Z][a-z]+\.?|[A-Z]\.?|Jr|Sr|Mrs))*)", pre_ns.strip())
            given = g.group(1).strip() if g else ""
            occ = re.split(r"\s(?:r|h|bds|res)\s\d", pre_ns.strip()[len(given):])[0].strip(" ,;")
            out.append({"year": y, "surname": surname, "given": given, "spouse": spouse.group(1).strip() if spouse else None,
                        "occ": occ[:80], "tenure": TEN.get(a.group(1), a.group(1)), "number": a.group(2), "raw_street": a.group(3),
                        "street": street, "town": CODES[a.group(4)],
                        "src": path_url, "page": pno, "bbox": [round(x0), round(y0), round(x1), round(y1)], "pw": pw, "ph": ph, "text": t[:200]})
    if y in CROP_YEARS: crop(pdf, y, out)
    os.remove(pdf)
    return out

def crop(pdf, y, rows):
    from PIL import Image
    want = {}
    for r in rows:
        if r["tenure"] != "householder" or not r["street"]: continue
        key = (r["street"], r["number"])
        if key not in want: want[key] = r
    by_page = {}
    for r in want.values(): by_page.setdefault(r["page"], []).append(r)
    dpi = 150; k = dpi / 72
    for p, rs in by_page.items():
        base = os.path.join(TMP, f"pg_{y}_{os.getpid()}_{p}")
        subprocess.run(["pdftoppm", "-r", str(dpi), "-gray", "-jpeg", "-singlefile", "-f", str(p), "-l", str(p), pdf, base], check=True)
        im = Image.open(base + ".jpg")
        for r in rs:
            x0, y0, x1, y1 = r["bbox"]
            box = (max(0, int((x0 - 6) * k)), max(0, int((y0 - 4) * k)), min(im.width, int((x1 + 6) * k)), min(im.height, int((y1 + 4) * k)))
            rel = os.path.join("docs", "directory", str(y), f"{slug(r['street'])}-{slug(r['number'])}.jpg")
            dst = os.path.join(OUT, rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
            im.crop(box).save(dst, quality=72)
            r["crop"] = rel
        os.remove(base + ".jpg")

for y in YEARS:
    dst = os.path.join(OUT, "data", f"dir_{y}.json")
    if os.path.exists(dst): print(f"{y}: already done", file=sys.stderr); continue
    ps = parts_for(y)
    rows = []
    with ThreadPoolExecutor(2) as ex:
        for part_rows in ex.map(lambda u: parse_part(y, u), ps): rows += part_rows
    json.dump(rows, open(dst, "w"))
    matched = sum(1 for r in rows if r["street"])
    print(f"{y}: {len(ps)} parts, {len(rows)} town entries, {matched} matched to a known street, {sum(1 for r in rows if r.get('crop'))} crops", file=sys.stderr)
