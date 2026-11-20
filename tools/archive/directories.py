"""Extract the town's residents (directory town codes in tools/town.json) from the library's digitized city directories.

For each volume (1908-1950) and each part PDF: download, read the OCR text layer with word
positions (pdftotext -bbox-layout), segment columns strictly left-to-right / top-to-bottom,
rejoin kerning-split boldface words, track per-column surname headers without guideword poisoning,
keep entries whose residence is in the target town (including 1908-1918 spaced 'S O' / 'S 0' codes),
and (for selected "document" years) crop the scanned line — including the surname header strip for
ditto-dash ("—") entries.
The downloaded PDF is deleted after processing; only extracted facts and small crops are kept.
"""
import os, re, sys, json, html, subprocess, collections
from concurrent.futures import ThreadPoolExecutor
from common import BASE, OUT, fetch, slug, load_streets, canon_street, normalize_raw_street, SUFFIX, SLUG, DIG, TOWN

CROP_YEARS = set(TOWN["directories"]["crop_years"])
CODES = TOWN["directories"]["codes"]   # e.g. {"SO": "South Orange"} or {"M": "Maplewood", "H": "Hilton"}
TMP = os.path.join(OUT, "_tmp"); os.makedirs(TMP, exist_ok=True)
STREETS = load_streets()

def parts_for(y):
    for _ in range(4):
        h = fetch(f"{BASE}/{SLUG}/views/view.php?id={DIG['city_directories_id']}&yr={y}").decode("utf-8", "ignore")
        ps = sorted(set(re.findall(rf"/{SLUG}/data/city-directories/{y}/[^\"&]+\.pdf", h)), key=lambda s: int(re.search(r"_p(\d+)", s).group(1)))
        if ps: return ps
    return []

PAGE_RE = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', re.S)
LINE_RE = re.compile(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', re.S)
WORD_RE = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', re.S)

DITTO_CORE = r"(?:[—\-–_~]{1,3}|[“\"”]{1,2})"
DITTO_START = re.compile(rf"^(?:[•■▪◦*.,'’‘`]+\s*)?{DITTO_CORE}\s*(.*)$")
EARLY_QUOTE_DITTO = re.compile(r"^(?:u|\(\s*t|\*{1,2}|44|1“)\s+([A-Z][a-z].*)$")
PURE_NOISE = re.compile(r"^[\s•■▪◦*.,'’‘`—\-–_~“\"”»«<>^|=+:;/\\()0-9]{1,4}$")

# Build town-code regex; for two-letter codes ending in 'O' (e.g. "SO", "EO", "WO"), also match
# 1908-1918 spaced/OCR-zero forms like "S O", "S 0", "S0"!
def _code_pat(c):
    if len(c) == 2 and c[1] == "O":
        return rf"{re.escape(c[0])}\s*[O0]"
    return re.escape(c)

TOWN_RE = "(" + "|".join(_code_pat(c) for c in sorted(CODES, key=len, reverse=True)) + ")"
TEN_RE = r"(h|r|bds|rms|res|bd)"
APT_RE = r"(?:\([0-9A-Za-z]{1,4}\)\s+)?"
NUM_RE = r"(\d{1,4}[A-Za-z]?(?:-\d+)?)"
STR_RE = r"([A-Z0-9][A-Za-z0-9.'’]*(?:\s[A-Za-z0-9.'’]+){0,5}?)"

ADDR_STD = re.compile(rf"\b{TEN_RE}\.?\s+{APT_RE}{NUM_RE}\s+{STR_RE}\s+{TOWN_RE}\.?$")
ADDR_DO = re.compile(rf"\b{NUM_RE}\s+{STR_RE}\s+{TOWN_RE}\s+{TEN_RE}\.?\s+do\.?$")

ABBR_PAIRS = {"WO", "EO", "SO", "NY", "NJ", "US", "PA"}
DITTO_CHARS = set("—-–_~“\"”•■▪◦*")

GIVEN = set("""Albert Alfred Alice Ann Anna Anne Arthur Barbara Benjamin Bertha Betty Carl Carrie Catherine Charles Clara Daniel David Donald
Dorothy Edith Edna Edward Edwin Eleanor Elizabeth Ella Ellen Emily Emma Ernest Esther Ethel Eugene Evelyn Florence Frances Francis Frank
Fred Frederick George Gertrude Grace Harold Harriet Harry Helen Henry Herbert Howard Ida Irene Isabel Jacob James Jane Jean Jennie John
Joseph Josephine Julia Katherine Kenneth Laura Lawrence Leo Leonard Lillian Louis Louise Lucy Mabel Margaret Marie Marion Martha Mary
Mildred Minnie Nellie Norman Patrick Paul Peter Philip Ralph Raymond Richard Robert Rose Ruth Samuel Sarah Stanley Theodore Thomas Victor
Viola Walter William Willard""".split())

OCC_STOP = set("""wid elk clk mgr eng ins emp tchr slsman pres sec treas acct mech elec arch archt atty lwyr carp pntr mach rest tel real est
oil gas auto bank asst supv foreman driver dentist lawyer writer student nurse artist tailor butcher grocer baker barber janitor fireman
policeman broker printer chemist doctor author editor painter plumber mason cook maid widow housekpr bkkpr steno chauf lab drsmkr seamstress
rem died see inc co corp bros sons and in of at for h r res bds rms bd do""".split())

HEADING_WORDS = {"Oranges", "Orange", "Directory", "Price", "Lee", "Baldwin", "Maplewood", "Hilton", "Newark", "Irvington",
                 "Sales", "Service", "Parts", "Phone", "Tel", "Telephone", "Co", "Inc", "Corp", "Ltd", "See"}

TEN = {"h": "householder", "r": "resident", "res": "resident", "bds": "boarder", "bd": "boarder", "rms": "rooms"}


def norm_town_code(raw_code):
    return re.sub(r"\s+", "", raw_code).replace("0", "O").upper()


def join_words(words):
    """Join word boxes on a single line, fusing intra-word OCR kerning splits (gap <= 2.0pt) while keeping real spaces."""
    if not words:
        return None
    x0 = words[0][0]
    y0 = min(w[1] for w in words)
    x1 = words[-1][2]
    y1 = max(w[3] for w in words)
    out = words[0][4]
    prev_x1 = words[0][2]
    prev_txt = words[0][4]
    for wx0, wy0, wx1, wy1, txt in words[1:]:
        gap = wx0 - prev_x1
        fuse = False
        if -1.5 <= gap <= 2.0:
            if prev_txt and prev_txt[-1].isalpha() and txt and (txt[0].islower() or txt[0] in "\xad-"):
                fuse = True
            elif prev_txt.isdigit() and txt.isdigit():
                fuse = True
            elif txt in (")", ",", "."):
                fuse = True
            elif prev_txt == "(":
                fuse = True
            elif gap <= 1.6 and len(prev_txt) == 1 and len(txt) == 1 and (prev_txt + txt) in ABBR_PAIRS:
                fuse = True
            elif all(c in DITTO_CHARS for c in prev_txt) and all(c in DITTO_CHARS for c in txt):
                fuse = True
        if not fuse:
            out += " " + txt
        else:
            out += txt
        prev_x1 = wx1
        prev_txt = txt
    out = re.sub(rf"^((?:[•■▪◦*.,'’‘`]+\s*)?{DITTO_CORE})([A-Za-z(])", r"\1 \2", out)
    return [out.strip(), x0, y0, x1, y1]


def raw_pages(bbox_html):
    for pw_s, ph_s, body in PAGE_RE.findall(bbox_html):
        pw, ph = float(pw_s), float(ph_s)
        raw_lines = []
        for lx0, ly0, lx1, ly1, inner in LINE_RE.findall(body):
            ws = []
            for wx0, wy0, wx1, wy1, wtxt in WORD_RE.findall(inner):
                t = html.unescape(wtxt).strip()
                if t:
                    ws.append((float(wx0), float(wy0), float(wx1), float(wy1), t))
            if ws:
                ws.sort(key=lambda w: w[0])
                raw_lines.append(ws)
        yield pw, ph, raw_lines


def detect_columns(pw, ph, raw_lines):
    header_y = 0.0
    for ws in raw_lines:
        y0 = min(w[1] for w in ws)
        if y0 < ph * 0.16:
            line_txt = " ".join(w[4].replace(" ", "") for w in ws)
            if re.search(r"D\s*I\s*R\s*E\s*C\s*T\s*O\s*R\s*Y|PRICE\s*&\s*LEE", line_txt, re.I):
                header_y = max(header_y, max(w[3] for w in ws))

    x_votes = collections.Counter()
    for ws in raw_lines:
        y0 = min(w[1] for w in ws)
        if y0 <= header_y + 1:
            continue
        for idx, (wx0, wy0, wx1, wy1, wt) in enumerate(ws[:4]):
            if idx > 0 and wx0 - ws[idx - 1][2] < 10:
                continue
            if DITTO_START.match(wt) or wt in ("“", "\"", "—", "-", "_"):
                b = round(wx0 / 2) * 2
                x_votes[b] += 2
                break
            if re.match(r"^[A-Z][a-z]{1,}$", wt) and len(ws) - idx >= 3:
                b = round(wx0 / 2) * 2
                x_votes[b] += 1
                break

    if not x_votes:
        return [], header_y

    clusters = []
    for x in sorted(x_votes):
        if clusters and x - clusters[-1][-1][0] <= 12:
            clusters[-1].append((x, x_votes[x]))
        else:
            clusters.append([(x, x_votes[x])])

    cols = []
    for cl in clusters:
        total = sum(v for _, v in cl)
        if total < 8:
            continue
        peak = max(v for _, v in cl)
        thresh = min(peak, max(2, peak * 0.25))
        left_edge = min(x for x, v in cl if v >= thresh)
        if cols and left_edge - cols[-1] < 110:
            continue
        cols.append(float(left_edge))

    return cols, header_y


def column_entries(pw, ph, raw_lines, y_vol):
    cols, header_y = detect_columns(pw, ph, raw_lines)
    if not cols:
        return

    if len(cols) >= 2:
        col_w = min(cols[i + 1] - cols[i] for i in range(len(cols) - 1))
    else:
        col_w = pw - cols[0] - 10
    max_col_w = col_w + 8

    per_col = [[] for _ in cols]
    for ws in raw_lines:
        ly0 = min(w[1] for w in ws)
        if ly0 <= header_y + 1:
            continue
        for ci, edge in enumerate(cols):
            right_lim = (cols[ci + 1] - 8) if ci + 1 < len(cols) else min(pw, edge + max_col_w)
            cws = [w for w in ws if edge - 8 <= w[0] < right_lim and w[2] <= right_lim + 12]
            if not cws:
                continue
            joined = join_words(cws)
            if not joined:
                continue
            t, x0, y0, x1, y1 = joined
            if PURE_NOISE.match(t) and not re.match(r"^\d+$", t):
                continue
            per_col[ci].append((t, x0, y0, x1, y1))

    for ci, edge in enumerate(cols):
        clines = sorted(per_col[ci], key=lambda item: (round(item[2], 1), item[1]))
        cur = None
        for t, x0, y0, x1, y1 in clines:
            d = x0 - edge
            if -8 <= d <= 9:
                kind = "start"
            elif 9 < d <= 48:
                kind = "cont"
            else:
                continue
            is_new = (
                cur is None
                or (kind == "start" and not cur[0].endswith(("-", "\xad")))
                or y0 < cur[2] - 5
                or (y0 - cur[4]) > 18
            )
            if is_new:
                if cur:
                    yield ci, edge, cur[0], cur[1], cur[2], cur[3], cur[4], cur[5]
                cur = [t, x0, y0, x1, y1, [x0, y0, x1, y1]]
            else:
                if cur[0].endswith(("-", "\xad")):
                    stem = cur[0][:-1]
                    if stem and stem[-1].islower() and re.match(r"^Hn\b", t):
                        t = "lin" + t[2:]
                    cur[0] = stem + t
                else:
                    cur[0] = cur[0] + " " + t
                cur[1] = min(cur[1], x0)
                cur[2] = min(cur[2], y0)
                cur[3] = max(cur[3], x1)
                cur[4] = max(cur[4], y1)
        if cur:
            yield ci, edge, cur[0], cur[1], cur[2], cur[3], cur[4], cur[5]


def format_surname(raw_tok):
    s = raw_tok.strip(" ,.;:")
    s = re.sub(r"^O['’‘]([A-Za-z])", lambda m: "O’" + m.group(1).upper(), s)
    if re.match(r"^(?:Mac|Mc|De|Di|Du|La|Le|Van|Von|St|O’)[A-Z]", s):
        return s
    return s.title()


def extract_header_surname(t):
    s = re.sub(r"^[\s•■▪◦*.,'’‘“”`^\[\]]+", "", t)
    if not s:
        return None, ""
    toks = s.split()
    if len(toks) >= 2 and all(w.isupper() and len(w) >= 2 for w in toks[:2]):
        return None, ""

    s = re.sub(r"^O\s*['’‘]\s*([A-Z][A-Za-z-]+)", lambda m: "O’" + m.group(1).replace("-", ""), s)
    s = re.sub(r"^(Mc|Mac)\s+([A-Z][a-z]{2,})", r"\1\2", s)
    m_pfx = re.match(r"^(Van|Von|De|Di|Du|La|Le|St)\.?[\s]+([A-Z][a-z]{1,})\b(.*)$", s)
    if m_pfx:
        rem = m_pfx.group(3).strip()
        if rem and re.match(r"^(?:[A-Z]|\(|wid\b|rem\b|died\b)", rem):
            s = m_pfx.group(1) + m_pfx.group(2) + m_pfx.group(3)

    parts = s.split()
    if not parts or not re.match(r"^[A-Z][A-Za-z'’‘-]*,?$", parts[0]):
        return None, ""
    sur = parts[0].rstrip(",").replace("-", "")
    idx = 1
    while idx < len(parts) and not parts[0].endswith(","):
        nxt = parts[idx].rstrip(",")
        if re.match(r"^[a-z'’]{1,8}$", nxt) and nxt.lower() not in OCC_STOP:
            if len(sur) >= 4 and len(nxt) > 3:
                break
            sur += nxt
            idx += 1
            if parts[idx - 1].endswith(","):
                break
        else:
            break

    if len(sur) < 2 or sur.title() in HEADING_WORDS:
        return None, ""
    rest = " ".join(parts[idx:])
    return format_surname(sur), rest


def _rejoin_spaced_given(s):
    toks = s.split()
    if len(toks) < 2 or not re.match(r"^[A-Z][a-z]{0,4}$", toks[0]):
        return s
    stop = OCC_STOP - {"r", "h"}
    word = toks[0]
    i = 1
    while i < len(toks):
        t = toks[i]
        if not re.match(r"^[a-z]{1,10}$", t) or t in stop:
            break
        if len(word) >= 4 and len(t) > 2:
            break
        if len(word) == 1 and len(t) == 1:
            if not (i + 1 < len(toks) and re.match(r"^[a-z]{1,5}$", toks[i + 1]) and toks[i + 1] not in stop):
                break
        word += t
        i += 1
    return " ".join([word] + toks[i:])


def clean_person_fields(pre):
    spouse_m = re.search(r"\(([A-Za-z .'’‘]+)\)", pre)
    spouse = None
    if spouse_m:
        sp = re.sub(r"\s+", " ", spouse_m.group(1)).strip(" '’‘")
        sp = _rejoin_spaced_given(sp)
        sp = re.sub(r"\b([A-Z])\s+([a-z]{2,})\b", r"\1\2", sp)
        sp = re.sub(r"^([A-Z][a-z]+)\s+0$", r"\1 O", sp)
        spouse = sp or None
    pre_ns = re.sub(r"\([^)]*\)", " ", pre)
    pre_ns = re.sub(r"^[\s'’‘“”`\"^.,:;!*~_\-–—•■\[\]]+", "", pre_ns)
    pre_ns = _rejoin_spaced_given(pre_ns)
    pre_ns = re.sub(r"^([A-Z][a-z]+)\s+0(?=\s|$)", r"\1 O", pre_ns)
    g = re.match(r"^((?:[A-Z][a-z]+\.?|[A-Z]\.?)(?:\s(?:[A-Z][a-z]+\.?|[A-Z]\.?|Jr|Sr|Mrs|Miss|Rev|Dr))*)", pre_ns)
    given = g.group(1).strip() if g else ""
    occ = re.split(r"\s(?:r|h|bds|res)\s\d", pre_ns[len(given):])[0].strip(" ,;")
    return given, spouse, occ[:80]


def loose_street(raw):
    s = normalize_raw_street(raw)
    w = s.split()
    if not w or len("".join(w)) < 3:
        return None
    if w[-1].lower() in SUFFIX:
        w[-1] = SUFFIX[w[-1].lower()]
    elif len(w) == 1 or (len(w) == 2 and w[0].upper() in ("NORTH", "SOUTH", "EAST", "WEST")):
        w.append("Street")
    return "~" + " ".join(w).upper()


def is_ditto_entry(t, x0, col_edge, y_vol):
    t_clean = re.sub(r"^[A-Z0-9]{1,2}\s+(?=[—\-–_~“\"”])", "", t)
    m = DITTO_START.match(t_clean)
    if m:
        return True, m.group(1)
    if y_vol <= 1924 and 3.0 <= (x0 - col_edge) <= 9.5:
        m2 = EARLY_QUOTE_DITTO.match(t_clean)
        if m2:
            return True, m2.group(1)
    return False, ""


def parse_pdf_file(y, pdf, path_url, do_crop=False):
    bb = subprocess.run(["pdftotext", "-bbox-layout", pdf, "-"], capture_output=True, text=True, errors="ignore").stdout
    out = []
    surname = None
    surname_hdr = None  # (pno, col_idx, [hx0, hy0, hx1, hy1])

    for pno, (pw, ph, rlines) in enumerate(raw_pages(bb), 1):
        col_ents = list(column_entries(pw, ph, rlines, y))
        by_col = collections.defaultdict(list)
        for item in col_ents:
            by_col[item[0]].append(item)

        for ci in sorted(by_col):
            ents = by_col[ci]
            for idx, (col_i, edge, t, x0, y0, x1, y1, first_bbox) in enumerate(ents):
                t = re.sub(r"\s+", " ", t).strip()
                if not t:
                    continue

                ditto, ditto_rest = is_ditto_entry(t, x0, edge, y)
                if not ditto and idx <= 1 and len(t.split()) == 1:
                    cand_sur, _ = extract_header_surname(t)
                    if cand_sur:
                        if idx + 1 < len(ents):
                            nxt_ditto, _ = is_ditto_entry(ents[idx + 1][2], ents[idx + 1][3], edge, y)
                            if nxt_ditto:
                                surname = cand_sur
                                surname_hdr = (pno, ci, first_bbox)
                    continue

                if ditto:
                    rest = ditto_rest
                    is_direct = False
                else:
                    cand_sur, cand_rest = extract_header_surname(t)
                    if not cand_sur:
                        continue
                    w1_tok = cand_rest.split(" ", 1)[0].rstrip(".,") if cand_rest else ""
                    same_alpha_real = (
                        surname
                        and cand_sur[0].lower() == surname[0].lower()
                        and surname.lower() <= cand_sur.lower()
                        and bool(re.match(r"^[A-Z][a-z]+$", w1_tok))
                        and w1_tok not in {"Jr", "Sr", "Inc", "Co", "Mrs", "Miss"}
                    )
                    starts_lower_occ = bool(cand_rest and re.match(r"^[a-z]+\b", cand_rest))
                    dropped_ditto = bool(
                        surname
                        and not same_alpha_real
                        and (
                            (cand_sur in GIVEN and cand_rest and re.match(r"^[A-Z]\b|^\(|^(?:Jr|Sr|Mrs|Miss|Rev|Dr)\b|^[a-z]+\b", cand_rest))
                            or (starts_lower_occ and cand_sur[0].lower() != surname[0].lower())
                        )
                    )
                    if dropped_ditto:
                        rest = cand_sur + (" " + cand_rest if cand_rest else "")
                        is_direct = False
                    else:
                        surname = cand_sur
                        surname_hdr = (pno, ci, first_bbox)
                        rest = cand_rest
                        is_direct = True

                if not surname:
                    continue

                a_std = ADDR_STD.search(t)
                a_do = None if a_std else ADDR_DO.search(t)
                if a_std:
                    ten_code, num, raw_st, raw_town = a_std.group(1), a_std.group(2), a_std.group(3), a_std.group(4)
                    addr_start = a_std.start()
                elif a_do:
                    num, raw_st, raw_town, ten_code = a_do.group(1), a_do.group(2), a_do.group(3), a_do.group(4)
                    addr_start = a_do.start()
                else:
                    continue

                town_key = norm_town_code(raw_town)
                if town_key not in CODES:
                    continue

                if re.search(r"\b(?:Church|School|Club|Hospital|Bank|Company|Corp)\b", rest[:40]):
                    continue

                street = canon_street(raw_st, STREETS) or loose_street(raw_st)
                pre = rest[: max(0, len(rest) - (len(t) - addr_start))]
                if a_do:
                    pre = re.sub(r"\band\s*$", "", pre).strip()
                given, spouse, occ = clean_person_fields(pre)

                hdr_box = None
                if not is_direct and surname_hdr and surname_hdr[0] == pno:
                    hdr_box = [round(v) for v in surname_hdr[2]]

                row = {
                    "year": y,
                    "surname": surname,
                    "given": given,
                    "spouse": spouse,
                    "occ": occ,
                    "tenure": TEN.get(ten_code, ten_code),
                    "number": num,
                    "raw_street": raw_st,
                    "street": street,
                    "town": CODES[town_key],
                    "direct": is_direct,
                    "src": path_url,
                    "page": pno,
                    "bbox": [round(x0), round(y0), round(x1), round(y1)],
                    "pw": pw,
                    "ph": ph,
                    "text": t[:200],
                }
                if hdr_box:
                    row["hdr_bbox"] = hdr_box
                out.append(row)

    if do_crop:
        crop(pdf, y, out)
    return out


def parse_part(y, path_url):
    pdf = os.path.join(TMP, f"{y}_{os.path.basename(path_url)}")
    fetch(BASE + path_url, pdf, pause=0.4)
    try:
        return parse_pdf_file(y, pdf, path_url, do_crop=(y in CROP_YEARS))
    finally:
        if os.path.exists(pdf):
            os.remove(pdf)


def crop(pdf, y, rows):
    from PIL import Image, ImageDraw, ImageFile, ImageStat
    ImageFile.LOAD_TRUNCATED_IMAGES = True
    by_page = collections.defaultdict(list)
    for r in rows:
        if r["tenure"] != "householder" or not r["street"]:
            continue
        by_page[r["page"]].append(r)

    dpi = 150
    k = dpi / 72.0
    pm = re.search(r"_p(\d+)", rows[0]["src"]) if rows else None
    pid = pm.group(1) if pm else "0"

    for p, rs in sorted(by_page.items()):
        base = os.path.join(TMP, f"pg_{y}_{os.getpid()}_{pid}_{p}")
        subprocess.run(
            ["pdftoppm", "-r", str(dpi), "-gray", "-jpeg", "-singlefile", "-f", str(p), "-l", str(p), pdf, base],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        im = Image.open(base + ".jpg")
        for r in rs:
            x0, y0, x1, y1 = r["bbox"]
            hdr = r.get("hdr_bbox")
            if hdr:
                hx0, hy0, hx1, hy1 = hdr
                same_col = abs(hx0 - x0) <= 25
                if same_col and 0 <= (y0 - hy1) <= 22 and hy0 < y0:
                    box = (
                        max(0, int((min(hx0, x0) - 6) * k)),
                        max(0, int((hy0 - 4) * k)),
                        min(im.width, int((max(hx1, x1) + 6) * k)),
                        min(im.height, int((y1 + 4) * k)),
                    )
                    cropped = im.crop(box)
                else:
                    hbox = (
                        max(0, int((hx0 - 6) * k)),
                        max(0, int((hy0 - 3) * k)),
                        min(im.width, int((hx1 + 6) * k)),
                        min(im.height, int((min(hy1, hy0 + 10) + 1) * k)),
                    )
                    rbox = (
                        max(0, int((x0 - 6) * k)),
                        max(0, int((y0 - 1) * k)),
                        min(im.width, int((x1 + 6) * k)),
                        min(im.height, int((y1 + 4) * k)),
                    )
                    top_im = im.crop(hbox)
                    bot_im = im.crop(rbox)
                    w_out = max(top_im.width, bot_im.width)
                    sep_h = 6
                    bg = int(ImageStat.Stat(bot_im).median[0])
                    cropped = Image.new("L", (w_out, top_im.height + sep_h + bot_im.height), color=bg)
                    cropped.paste(top_im, (0, 0))
                    cropped.paste(bot_im, (0, top_im.height + sep_h))
                    draw = ImageDraw.Draw(cropped)
                    mid_y = top_im.height + sep_h // 2
                    line_col = max(60, bg - 75)
                    for dx in range(4, w_out - 4, 8):
                        draw.line([(dx, mid_y), (min(dx + 4, w_out - 4), mid_y)], fill=line_col, width=1)
            else:
                box = (
                    max(0, int((x0 - 6) * k)),
                    max(0, int((y0 - 4) * k)),
                    min(im.width, int((x1 + 6) * k)),
                    min(im.height, int((y1 + 4) * k)),
                )
                cropped = im.crop(box)

            rel = os.path.join("docs", "directory", str(y), f"{slug(r['street'])}-{slug(r['number'])}-p{pid}-{p}-{x0}-{y0}.jpg")
            dst = os.path.join(OUT, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            cropped.save(dst, quality=72)
            r["crop"] = rel
        im.close()
        if os.path.exists(base + ".jpg"):
            os.remove(base + ".jpg")


if __name__ == "__main__":
    force = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    years = [int(y) for y in args[0].split(",")] if args else TOWN["directories"]["years"]
    for y in years:
        dst = os.path.join(OUT, "data", f"dir_{y}.json")
        if os.path.exists(dst) and not force:
            print(f"{y}: already done", file=sys.stderr)
            continue
        if y in CROP_YEARS:
            yr_crop_dir = os.path.join(OUT, "docs", "directory", str(y))
            if os.path.isdir(yr_crop_dir):
                for fn in os.listdir(yr_crop_dir):
                    if fn.endswith(".jpg"):
                        os.remove(os.path.join(yr_crop_dir, fn))
        ps = parts_for(y)
        rows = []
        with ThreadPoolExecutor(2) as ex:
            for part_rows in ex.map(lambda u: parse_part(y, u), ps):
                rows += part_rows
        tmp_dst = dst + ".tmp"
        json.dump(rows, open(tmp_dst, "w"))
        os.replace(tmp_dst, dst)
        matched = sum(1 for r in rows if r["street"] and not r["street"].startswith("~"))
        print(
            f"{y}: {len(ps)} parts, {len(rows)} town entries, {matched} confirmed street matches, {sum(1 for r in rows if r.get('crop'))} crops",
            file=sys.stderr,
            flush=True,
        )
