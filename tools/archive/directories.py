"""Extract the town's residents (directory town codes in tools/town.json) from the library's digitized city directories.

For each volume (1908-1950) and each part PDF: download, read the OCR text layer with word
positions (pdftotext -bbox-layout), merge same-baseline boldface glyph fragments, segment columns
with skew-aware local margins strictly left-to-right / top-to-bottom, build a global monotonic
alphabetical surname spine (weighted LNDS) across the part so dropped dittos / OCR noise / ads
never corrupt active family surnames, keep entries whose residence is in the target town, and
(for selected "document" years) crop the scanned line — including the surname header strip
(same-page or cross-page) for ditto entries.
The downloaded PDF is deleted after processing; only extracted facts and small crops are kept.
"""
import os, re, sys, json, html, bisect, subprocess, collections
from concurrent.futures import ThreadPoolExecutor
from common import BASE, OUT, fetch, slug, load_streets, canon_street, normalize_raw_street, SUFFIX, SLUG, DIG, TOWN

CROP_YEARS = set(TOWN["directories"]["crop_years"])
CODES = TOWN["directories"]["codes"]   # e.g. {"M": "Maplewood", "H": "Hilton"} or {"SO": "South Orange"}
TMP = os.path.join(OUT, "_tmp"); os.makedirs(TMP, exist_ok=True)
STREETS = load_streets()


def parts_for(y):
    for _ in range(4):
        h = fetch(f"{BASE}/{SLUG}/views/view.php?id={DIG['city_directories_id']}&yr={y}").decode("utf-8", "ignore")
        ps = sorted(
            set(re.findall(rf"/{SLUG}/data/city-directories/{y}/[^\"&]+\.pdf", h)),
            key=lambda s: int(re.search(r"_p(\d+)", s).group(1)),
        )
        if ps:
            return ps
    return []


PAGE_RE = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', re.S)
LINE_RE = re.compile(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', re.S)
WORD_RE = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', re.S)

DITTO_CORE = r"(?:[—\-–_~]{1,3}|[“\"”]{1,2})"
DITTO_START = re.compile(rf"^(?:[•■▪◦*.,'’‘`^]+\s*)?(?:{DITTO_CORE}|\^\s+|[Il1|!]{{1,2}}[-—–])\s*(.*)$")
EARLY_QUOTE_DITTO = re.compile(r"^(?:[uwtvfIl1*“\"]|cc|\(\s*t|\*{1,2}|44|1“)\s+([A-Z][a-z].*)$")
PURE_NOISE = re.compile(r"^[\s•■▪◦*.,'’‘`—\-–_~“\"”»«<>^|=+:;/\\()0-9]{1,4}$")


def _code_pat(c):
    if len(c) == 2 and c[1] == "O":
        return rf"{re.escape(c[0])}\s*[O0]"
    return re.escape(c)


TOWN_RE = "(" + "|".join(_code_pat(c) for c in sorted(CODES, key=len, reverse=True)) + ")"
TEN_RE = r"(h|r|bds|rms|res|bd)"
APT_RE = r"(?:\([0-9A-Za-z]{1,4}\)\s+)?"
NUM_RE = r"(\d{1,4}[A-Za-z]?(?:-\d+)?)"
STR_RE = r"([A-Z0-9][A-Za-z0-9.'’]*(?:\s[A-Za-z0-9.'’]+){0,5}?)"

# 1) "... h 36 Oberlin M" or "... h (2B) 14 Highland pl M"
ADDR_STD = re.compile(rf"\b{TEN_RE}\.?\s+{APT_RE}{NUM_RE}\s+{STR_RE}\s+{TOWN_RE}\.?$")
# 2) "... archt Newark and 36 Oberlin M h do" / "... builder 41 Oberlin M h do"
ADDR_DO = re.compile(rf"\b{NUM_RE}\s+{STR_RE}\s+{TOWN_RE}\s+{TEN_RE}\.?\s+do\.?$")

# Matches any completed directory entry ending (across all Oranges towns) so subsequent lines never glue onto a finished entry
COMPLETE_END = re.compile(
    r"(?:\b(?:h|r|bds|rms|res|bd)\.?\s+(?:at\s+[A-Z][A-Za-z .]+|do\.?|"
    r"(?:\([0-9A-Za-z]+\)\s+)?\d+[A-Za-z-]*\s+[A-Za-z0-9.'’ ]+\s(?:O|0|EO|E\s*[O0]|WO|W\s*[O0]|SO|S\s*[O0]|M|H)\.?)"
    r"|\brem\s+to\s+[A-Z][A-Za-z .]+"
    r"|\bdied\s+[A-Z][a-z]+\s+\d+.*)"
    r"(?:\s*[—\-–]+\s*See\b.*)?$",
    re.I,
)
SEE_TAIL_RE = re.compile(r"\s*[—\-–]+\s*See\b.*$", re.I)
CONT_TAIL_RE = re.compile(r"\s*(?:[—\-–]+\s*|\(\s*)Continued\)?.*$", re.I)

ABBR_PAIRS = {"WO", "EO", "SO", "NY", "NJ", "US", "PA"}
DITTO_CHARS = set("—-–_~“\"”•■▪◦*")

OCC_STOP = set("""wid elk clk mgr eng ins emp tchr slsman pres sec treas acct mech elec arch archt atty lwyr carp pntr mach rest tel real est
oil gas auto bank asst supv foreman driver dentist lawyer writer student nurse artist tailor butcher grocer baker barber janitor fireman
policeman broker printer chemist doctor author editor painter plumber mason cook maid widow housekpr bkkpr steno chauf lab drsmkr seamstress
rem died see inc co corp bros sons and in of at for h r res bds rms bd do""".split())

HEADING_WORDS = {"Oranges", "Orange", "Directory", "Price", "Lee", "Baldwin", "Maplewood", "Hilton", "Newark", "Irvington",
                 "Sales", "Service", "Parts", "Phone", "Tel", "Telephone", "Co", "Inc", "Corp", "Ltd", "See", "Continued"}

TEN = {"h": "householder", "r": "resident", "res": "resident", "bds": "boarder", "bd": "boarder", "rms": "rooms"}

OCR_FIRST = {
    "a": set("lra"),
    "b": set("rjpehb"),
    "c": set("ogqdce"),
    "d": set("oqd"),
    "g": set("cqog"),
    "h": set("nbh"),
    "m": set("nm"),
    "n": set("mnu"),
    "r": set("pbkr"),
    "s": set("fs"),
    "w": set("vw"),
}


def norm_town_code(raw_code):
    return re.sub(r"\s+", "", raw_code).replace("0", "O").upper()


def alpha_key(sur):
    if not sur:
        return ""
    s = re.sub(r"^St([A-Z])", r"Saint\1", sur.strip())
    return re.sub(r"[^a-z]", "", s.lower())


def join_words(words):
    """Join word boxes on a single visual baseline, fusing intra-word OCR kerning splits while keeping real spaces."""
    if not words:
        return None
    words = sorted(words, key=lambda w: w[0])
    x0 = words[0][0]
    y0 = min(w[1] for w in words)
    x1 = max(w[2] for w in words)
    y1 = max(w[3] for w in words)
    out = words[0][4]
    prev_x0, prev_x1, prev_txt = words[0][0], words[0][2], words[0][4]
    for wx0, wy0, wx1, wy1, txt in words[1:]:
        if wx1 <= prev_x1 + 0.5 and txt == prev_txt:
            continue
        gap = wx0 - prev_x1
        fuse = False
        if (-6.0 <= gap <= 2.2 and wx0 > prev_x0 + 1.5) or (-1.5 <= gap <= 2.2):
            # 1) Letter followed by lowercase fragment ("P"+"o"+"llitt", "W"+"illiam", "D"+"u"+"n"+"n")
            if prev_txt and prev_txt[-1].isalpha() and txt and (txt[0].islower() or txt[0] in "\xad-"):
                fuse = True
            # 2) Split digits ("5"+"6"+"3" -> "563")
            elif prev_txt.isdigit() and txt.isdigit() and gap >= -1.5:
                fuse = True
            # 3) Closing paren/comma/period ("(Margaret V" + ")" -> "(Margaret V)")
            elif txt in (")", ",", "."):
                fuse = True
            # 4) Opening paren fused to first letter ("(" + "Lillian" -> "(Lillian")
            elif prev_txt == "(":
                fuse = True
            # 5) Split town/state two-letter codes ("W" + "O" -> "WO")
            elif -1.5 <= gap <= 1.6 and len(prev_txt) == 1 and len(txt) == 1 and (prev_txt + txt) in ABBR_PAIRS:
                fuse = True
            # 6) Consecutive ditto punctuation ("-" + "—" -> "-—")
            elif all(c in DITTO_CHARS for c in prev_txt) and all(c in DITTO_CHARS for c in txt):
                fuse = True
        elif -6.0 <= gap <= 2.7 and len(prev_txt) == 1 and prev_txt.isupper() and txt and txt[0].islower() and txt not in ("h", "r"):
            # Slightly wider kerning split after initial capital in 1928-1934 fonts ("R" + "ichard", "D" + "uncan")
            fuse = True

        if not fuse:
            out += " " + txt
        else:
            out += txt
        prev_x0, prev_x1, prev_txt = wx0, max(prev_x1, wx1), txt

    # Normalize "-—Alice" or "—Mary" so ditto prefix separates cleanly
    out = re.sub(rf"^((?:[•■▪◦*.,'’‘`^]+\s*)?{DITTO_CORE})([A-Za-z(])", r"\1 \2", out)
    return [out.strip(), x0, y0, x1, y1]


def raw_pages(bbox_html):
    """Yield (pw, ph, raw_lines) where each raw_line is a list of (wx0, wy0, wx1, wy1, text) word tuples."""
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


def detect_columns(pw, ph, raw_lines, y_vol=1950):
    """Detect column left-edge x coordinates on a directory page (supports 2-column and 3-column layouts)."""
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
                x_votes[round(wx0 / 2) * 2] += 2
                break
            if re.match(r"^[A-Z][a-z]{1,}$", wt) and len(ws) - idx >= 2:
                x_votes[round(wx0 / 2) * 2] += 1
                break

    if not x_votes:
        return [], header_y

    cluster_gap = 28 if y_vol == 1908 else (18 if y_vol <= 1924 else 14)
    clusters = []
    for x in sorted(x_votes):
        if clusters and x - clusters[-1][-1][0] <= cluster_gap:
            clusters[-1].append((x, x_votes[x]))
        else:
            clusters.append([(x, x_votes[x])])

    cols = []
    for cl in clusters:
        total = sum(v for _, v in cl)
        if total < 10:
            continue
        peak = max(v for _, v in cl)
        thresh = min(peak, max(2, peak * (0.10 if y_vol == 1908 else 0.22)))
        left_edge = float(min(x for x, v in cl if v >= thresh))
        if left_edge > pw - 125:
            continue
        if cols and left_edge - cols[-1] < 115:
            continue
        cols.append(left_edge)

    return cols, header_y


def column_entries(pw, ph, raw_lines, y_vol):
    """Segment a page into columns sorted strictly left-to-right, top-to-bottom, merge same-baseline words,
    track skew-aware local column margins, and join wrapped continuation lines per column.
    Yields (col_idx, loc_edge, d_indent, text, x0, y0, x1, y1, first_line_bbox)."""
    cols, header_y = detect_columns(pw, ph, raw_lines, y_vol)
    if not cols:
        return

    col_w = min(cols[i + 1] - cols[i] for i in range(len(cols) - 1)) if len(cols) >= 2 else (pw - cols[0] - 10)
    max_col_w = col_w + 10

    per_col_words = [[] for _ in cols]
    for ws in raw_lines:
        ly0 = min(w[1] for w in ws)
        if ly0 <= header_y + 1:
            continue
        for ci, edge in enumerate(cols):
            right_lim = (cols[ci + 1] - 8) if ci + 1 < len(cols) else min(pw, edge + max_col_w)
            cws = [w for w in ws if edge - 12 <= w[0] < right_lim and w[2] <= right_lim + 12]
            if cws:
                ymid = sum((w[1] + w[3]) * 0.5 for w in cws) / len(cws)
                per_col_words[ci].append((ymid, cws))

    # Era-specific start vs wrapped-continuation indent boundary (in pt relative to surname column margin):
    # - 1908 (Baldwin 2-col): surname=0pt, ditto=+23pt, wrapped=+46pt -> start_max = 31pt, cont_max = 62pt
    # - 1910-1924 (Price & Lee 2-col quote-ditto): surname=0pt, quote=+5.5pt, dropped-quote=+17pt, wrapped=+25pt -> start_max = 19.5pt
    # - 1928-1950 (Price & Lee em-dash): surname/em-dash=0pt, dropped-em-dash=+10pt, wrapped=+17..30pt -> start_max = 13.8pt
    if y_vol == 1908:
        start_max, cont_max = 31.0, 62.0
    elif y_vol <= 1924 and len(cols) == 2:
        start_max, cont_max = 19.5, 54.0
    else:
        start_max, cont_max = 13.8, 54.0

    for ci, edge in enumerate(cols):
        # Merge <line> fragments in the same column that share the same printed baseline (within 2.6pt)
        groups = sorted(per_col_words[ci], key=lambda g: (g[0], g[1][0][0]))
        merged_lines = []
        for ymid, cws in groups:
            if merged_lines and abs(ymid - merged_lines[-1][0]) <= 2.6:
                _, prev_ws = merged_lines[-1]
                comb = prev_ws + cws
                new_ymid = sum((w[1] + w[3]) * 0.5 for w in comb) / len(comb)
                merged_lines[-1] = (new_ymid, comb)
            else:
                merged_lines.append((ymid, list(cws)))

        clines = []
        for _, cws in merged_lines:
            joined = join_words(cws)
            if not joined:
                continue
            t, x0, y0, x1, y1 = joined
            if PURE_NOISE.match(t) and not re.match(r"^\d+$", t):
                continue
            clines.append((t, x0, y0, x1, y1))

        if not clines:
            continue

        # Skew-aware local left margin per line using a wide +-25-line window anchored to flush surname headers
        near_lim = edge + (8.0 if y_vol == 1908 else 14.0)
        local_edges = []
        for i in range(len(clines)):
            near = [clines[j][1] for j in range(max(0, i - 25), min(len(clines), i + 26)) if clines[j][1] < near_lim]
            if len(near) >= 2:
                near_s = sorted(near)
                local_edges.append(near_s[max(0, len(near_s) // 6)])
            else:
                local_edges.append(edge)

        cur = None
        for (t, x0, y0, x1, y1), loc_edge in zip(clines, local_edges):
            d = x0 - loc_edge
            explicit_ditto = bool(DITTO_START.match(t)) and not re.match(r"^[—\-–]+\s*Continued\b", t, re.I)
            if explicit_ditto and -10 <= d <= 14:
                kind = "start"
            elif -10 <= d <= start_max:
                kind = "start"
            elif start_max < d <= cont_max:
                kind = "cont"
            else:
                continue

            prev_hyph = bool(cur and cur[0].endswith(("-", "\xad")) and not explicit_ditto and 0 <= (y0 - cur[4]) <= 10)
            prev_complete = bool(cur and not prev_hyph and COMPLETE_END.search(cur[0]))
            is_see_line = bool(re.match(r"^[—\-–]+\s*See\b", t, re.I))

            is_new = (
                cur is None
                or (kind == "start" and not prev_hyph and not is_see_line)
                or (prev_complete and not is_see_line)
                or y0 < cur[2] - 5
                or (y0 - cur[4]) > 18
            )
            if is_new:
                if cur:
                    yield ci, cur[6], cur[7], cur[0], cur[1], cur[2], cur[3], cur[4], cur[5]
                cur = [t, x0, y0, x1, y1, [x0, y0, x1, y1], loc_edge, d]
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
            yield ci, cur[6], cur[7], cur[0], cur[1], cur[2], cur[3], cur[4], cur[5]


def format_surname(raw_tok):
    s = raw_tok.strip(" ,.;:")
    s = re.sub(r"^O['’‘]([A-Za-z])", lambda m: "O’" + m.group(1).upper(), s)
    if re.match(r"^(?:Mac|Mc|De|Di|Du|La|Le|Vander|Van|Von|St|O’)[A-Z]", s):
        return s
    return s.title()


def extract_header_surname(t):
    """Extract (surname, rest) from a non-ditto entry line, rejoining any remaining OCR-split surname prefixes/fragments."""
    t_nc = CONT_TAIL_RE.sub("", t).strip()
    s = re.sub(r"^[\s•■▪◦*.,'’‘“”`^\[\]]+", "", t_nc)
    if not s:
        return None, ""
    toks = s.split()
    if len(toks) >= 2 and all(w.isupper() and len(w) >= 2 for w in toks[:2]):
        # Allow bold ALL-CAPS advertiser residential listings like "POLLITT WESLEY P (Edith) real estate ... r 36 Oberlin M"
        m_caps = re.match(r"^([A-Z][A-Z'’\-]{2,})\s+([A-Z]{2,}(?:\s+[A-Z]\.?)*)(\s+(?:\([A-Za-z .'’]+\)\s+)?[a-z].*)$", s)
        if m_caps and m_caps.group(1).title() not in HEADING_WORDS:
            s = m_caps.group(1).title() + " " + " ".join(w.title() for w in m_caps.group(2).split()) + m_caps.group(3)
        else:
            return None, ""

    # Rejoin split Irish/Scottish/Dutch/French surname prefixes ("O ’ Toole", "Mc Donald", "Van Ness", "Vander Kieft")
    s = re.sub(r"^O\s*['’‘]\s*([A-Z][A-Za-z-]+)", lambda m: "O’" + m.group(1).replace("-", ""), s)
    s = re.sub(r"^(Mc|Mac)\s+([A-Z][a-z]{2,})", r"\1\2", s)
    m_pfx = re.match(r"^(Vander|Van|Von|De|Di|Du|La|Le|St)\.?[\s]+([A-Z][a-z]{1,})\b(.*)$", s)
    if m_pfx:
        rem = m_pfx.group(3).strip()
        if not rem or re.match(r"^(?:[A-Z]|\(|wid\b|rem\b|died\b|see\b)", rem):
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


def build_alphabetical_spine(items, y_vol):
    """Build a global monotonic alphabetical surname spine (weighted LNDS) across all column entries in a PDF part.
    Returns (accepted_indices_set, repaired_surname_dict)."""
    cands = []  # (item_idx, key, sur, rest, weight, is_guide)
    for idx, it in enumerate(items):
        t, d = it["t"], it["d"]
        t_clean = re.sub(r"^[A-Z0-9]{1,2}\s+(?=[—\-–_~“\"”])", "", t)
        m_dit = DITTO_START.match(t_clean)
        if m_dit and not re.match(r"^[—\-–]+\s*Continued\b", t_clean, re.I):
            it["ditto"] = (True, m_dit.group(1))
            continue
        if y_vol <= 1924 and 3.2 <= d <= 12.5:
            m_eq = EARLY_QUOTE_DITTO.match(t_clean)
            if m_eq:
                it["ditto"] = (True, m_eq.group(1))
                continue
        it["ditto"] = (False, "")

        t_nocont = CONT_TAIL_RE.sub("", t).strip()
        is_guide = (it["idx_in_col"] <= 2 and len(t_nocont.split()) == 1 and d <= 6.5)
        sur, rest = extract_header_surname(t)
        if not sur:
            continue

        # Reject 2-cap OCR ditto artifacts ("SClarence", "HAlbert", "SLuther") unless genuine compound surname prefix
        raw_first = re.sub(r"^[\s•■▪◦*.,'’‘“”`^\[\]]+", "", t_nocont).split()[0].rstrip(",")
        if re.match(r"^[A-Z]{2}[a-z]{2,}", raw_first) and not re.match(r"^(?:Mc|Mac|De|Di|Du|La|Le|Van|Von|St|Fitz)", raw_first):
            continue

        key = alpha_key(sur)
        if len(key) < 2:
            continue
        it["cand"] = (sur, rest, key, is_guide)

        max_sur_d = 2.8 if y_vol <= 1924 else 3.8
        if d > max_sur_d:
            continue  # Indented lines are dropped dittos or ad copy, never spine anchors
        if is_guide:
            if idx + 1 < len(items):
                nxt_t = items[idx + 1]["t"]
                if DITTO_START.match(nxt_t) or items[idx + 1]["d"] >= 3.2:
                    cands.append((idx, key, sur, rest, 8, True))
            continue
        if not rest:
            continue
        if not (re.match(r"^[A-Z]", rest) or rest.startswith("see ")):
            continue
        if re.search(r"\b(?:Tel\.?|Phone|ORange|OR\.|SO\s*\d-\d{4}|Market\s+\d|Inc\.|Co\.,)\b", t):
            w = 1
        elif re.search(
            r"\b(?:h|r|bds|rms|res|bd)\.?\s+(?:\([0-9A-Za-z]+\)\s+)?\d+\s+[A-Z0-9]"
            r"|\bh\.?\s+do\b|\br\.?\s+do\b|\bbds\.?\s+do\b|\bdied\b|\brem\s+to\b|\bmarried\b|\bwid\b|^see\s+[A-Z]",
            rest,
        ):
            w = 10
        else:
            w = 3
        cands.append((idx, key, sur, rest, w, False))

    if not cands:
        return set(), {}

    # Exact O(K log K) maximum-weight Longest Non-Decreasing Subsequence via Fenwick tree
    uniq_keys = sorted(set(c[1] for c in cands))
    key_rank = {k: i + 1 for i, k in enumerate(uniq_keys)}
    n_rk = len(uniq_keys)
    bit_val = [0] * (n_rk + 1)
    bit_idx = [-1] * (n_rk + 1)
    parent = [-1] * len(cands)
    best_end = (0, -1)

    for ci_pos, (_, key, _, _, w, _) in enumerate(cands):
        rk = key_rank[key]
        bv, bi = 0, -1
        x = rk
        while x > 0:
            if bit_val[x] > bv:
                bv, bi = bit_val[x], bit_idx[x]
            x -= x & -x
        tot = bv + w
        parent[ci_pos] = bi
        if tot > best_end[0]:
            best_end = (tot, ci_pos)
        x = rk
        while x <= n_rk:
            if tot >= bit_val[x]:
                bit_val[x], bit_idx[x] = tot, ci_pos
            x += x & -x

    spine_pos = []
    cur_p = best_end[1]
    while cur_p != -1:
        spine_pos.append(cur_p)
        cur_p = parent[cur_p]
    spine_pos.reverse()

    # Trim isolated boundary ad outliers >2 letters away from interior spine
    while len(spine_pos) >= 4 and ord(cands[spine_pos[2]][1][0]) - ord(cands[spine_pos[0]][1][0]) > 2:
        spine_pos.pop(0)
    while len(spine_pos) >= 4 and ord(cands[spine_pos[-1]][1][0]) - ord(cands[spine_pos[-3]][1][0]) > 2:
        spine_pos.pop()

    accepted = {cands[p][0] for p in spine_pos}
    repaired = {}
    spine_items = [(cands[p][0], cands[p][1], cands[p][2]) for p in spine_pos]
    spine_indices = [s[0] for s in spine_items]

    # Second pass: rescue genuine flush-left direct surnames with a 1-char OCR confusion that fit [prev_k, next_k]
    for idx, it in enumerate(items):
        if idx in accepted or "cand" not in it:
            continue
        sur, rest, key, is_guide = it["cand"]
        if it["d"] > (2.8 if y_vol <= 1924 else 3.8):
            continue
        pos = bisect.bisect_left(spine_indices, idx)
        prev_k = spine_items[pos - 1][1] if pos > 0 else None
        next_k = spine_items[pos][1] if pos < len(spine_items) else None
        if not (prev_k and next_k):
            continue
        has_full_given = bool(re.match(r"^[A-Z][a-z]{2,}\b", rest)) and rest.split()[0] not in ("Mrs", "Miss", "Inc", "Corp")
        nxt_explicit_ditto = idx + 1 < len(items) and bool(DITTO_START.match(items[idx + 1]["t"]))
        if not (has_full_given or nxt_explicit_ditto or is_guide):
            continue
        if prev_k <= key <= next_k:
            accepted.add(idx)
            continue
        if prev_k[0] == next_k[0]:
            target_c = prev_k[0]
            if key[0] in OCR_FIRST.get(target_c, set()):
                alt_key = target_c + key[1:]
                if prev_k <= alt_key <= next_k:
                    accepted.add(idx)
                    repaired[idx] = target_c.upper() + sur[1:]
                    continue
        if key[0] == prev_k[0] == next_k[0]:
            for old_s, new_s in (("l", "i"), ("i", "l"), ("m", "rn"), ("rn", "m"), ("u", "n"), ("n", "u"), ("e", "c"), ("c", "e"), ("a", "o"), ("o", "a"), ("v", "y"), ("y", "v"), ("o", "e"), ("e", "o")):
                if old_s in key[1:]:
                    alt_key = key[0] + key[1:].replace(old_s, new_s, 1)
                    if prev_k <= alt_key <= next_k:
                        accepted.add(idx)
                        # Auto-repair impossible consonant+l+consonant ("Glbbins"->"Gibbins") or "ek"->"ck" ("Wiekman"->"Wickman")
                        if old_s == "l" and new_s == "i" and re.match(r"^[BCDFGHJKLMNPQRSTVWXYZ]l[bcdfghjklmnpqrstvwxyz]", sur):
                            repaired[idx] = sur[0] + "i" + sur[2:]
                        elif old_s == "e" and new_s == "c" and "ek" in sur and (prev_k.startswith(alt_key[:4]) or next_k.startswith(alt_key[:4])):
                            repaired[idx] = sur.replace("ek", "ck", 1)
                        break
        # Also accept flush-left direct surname sharing >=3-letter prefix with prev_k or next_k when prev_k had an OCR typo (e.g. "Makowzchik" before "Makowski")
        if len(key) >= 4 and (key[:3] == prev_k[:3] or key[:3] == next_k[:3]) and (prev_k[:3] <= key[:3] <= next_k[:3]):
            accepted.add(idx)

    return accepted, repaired


def parse_pdf_file(y, pdf, path_url, do_crop=False):
    bb = subprocess.run(["pdftotext", "-bbox-layout", pdf, "-"], capture_output=True, text=True, errors="ignore").stdout
    items = []
    page_dims = {}
    for pno, (pw, ph, rlines) in enumerate(raw_pages(bb), 1):
        page_dims[pno] = (pw, ph)
        col_ents = list(column_entries(pw, ph, rlines, y))
        by_col = collections.defaultdict(list)
        for ce in col_ents:
            by_col[ce[0]].append(ce)
        for ci in sorted(by_col):
            ents = by_col[ci]
            for idx_c, (_, loc_edge, d, t, x0, y0, x1, y1, fb) in enumerate(ents):
                t_norm = re.sub(r"\s+", " ", t).strip()
                if t_norm:
                    items.append({
                        "pno": pno,
                        "ci": ci,
                        "idx_in_col": idx_c,
                        "loc_edge": loc_edge,
                        "d": d,
                        "t": t_norm,
                        "x0": x0,
                        "y0": y0,
                        "x1": x1,
                        "y1": y1,
                        "fb": fb,
                    })

    accepted, repaired = build_alphabetical_spine(items, y)

    out = []
    surname = None
    surname_hdr = None  # (pno, col_idx, [hx0, hy0, hx1, hy1])

    for idx, it in enumerate(items):
        t = it["t"]
        pno = it["pno"]
        pw, ph = page_dims[pno]

        if idx in accepted:
            sur, rest, _, is_guide = it["cand"]
            surname = repaired.get(idx, sur)
            surname_hdr = (pno, it["ci"], it["fb"])
            if is_guide or not rest:
                continue
            is_direct = True
        else:
            if not surname:
                continue
            is_direct = False
            if it["ditto"][0]:
                rest = it["ditto"][1]
            else:
                # Non-spine entry (dropped/garbled ditto dash): preserve active spine surname and strip garbled prefix
                rest = re.sub(r"^[\s•■▪◦*.,'’‘“”`^—\-–_~]+", "", t)
                if not re.match(r"^(?:Mc|Mac|Van|Von|De|Di|Du|La|Le|St|Fitz)[A-Z]", rest):
                    rest = re.sub(r"^[A-Z](?=[A-Z][a-z]{2,}\b)", "", rest)

        t_addr = SEE_TAIL_RE.sub("", t).strip()
        a_std = ADDR_STD.search(t_addr)
        a_do = None if a_std else ADDR_DO.search(t_addr)
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

        # Skip church/institution headers ("St George's Episcopal Church ... pastor Rev ...")
        if re.search(r"\b(?:Church|School|Club|Hospital|Bank|Company|Corp)\b", rest[:40]):
            continue

        street = canon_street(raw_st, STREETS) or loose_street(raw_st)
        rest_addr = SEE_TAIL_RE.sub("", rest).strip()
        pre = rest_addr[: max(0, len(rest_addr) - (len(t_addr) - addr_start))]
        if a_do:
            pre = re.sub(r"\band\s*$", "", pre).strip()
        given, spouse, occ = clean_person_fields(pre)

        hdr_box = None
        hdr_page = None
        if not is_direct and surname_hdr and 0 <= (pno - surname_hdr[0]) <= 2:
            hdr_box = [round(v) for v in surname_hdr[2]]
            hdr_page = surname_hdr[0]

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
            "bbox": [round(it["x0"]), round(it["y0"]), round(it["x1"]), round(it["y1"])],
            "pw": pw,
            "ph": ph,
            "text": t[:200],
        }
        if hdr_box:
            row["hdr_bbox"] = hdr_box
            row["hdr_page"] = hdr_page
        out.append(row)

    if do_crop:
        crop(pdf, y, out)
    return out


def parse_part(y, path_url):
    pdf = os.path.join(TMP, f"{y}_{os.getpid()}_{os.path.basename(path_url)}")
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

    if not by_page:
        return

    dpi = 150
    k = dpi / 72.0
    pm = re.search(r"_p(\d+)", rows[0]["src"]) if rows else None
    pid = pm.group(1) if pm else "0"

    page_cache = collections.OrderedDict()

    def get_page_im(pno):
        if pno in page_cache:
            page_cache.move_to_end(pno)
            return page_cache[pno]
        base = os.path.join(TMP, f"pg_{y}_{os.getpid()}_{pid}_{pno}")
        subprocess.run(
            ["pdftoppm", "-r", str(dpi), "-gray", "-jpeg", "-singlefile", "-f", str(pno), "-l", str(pno), pdf, base],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        im = Image.open(base + ".jpg")
        im.load()
        im.close_path = base + ".jpg"
        if os.path.exists(base + ".jpg"):
            os.remove(base + ".jpg")
        page_cache[pno] = im
        while len(page_cache) > 3:
            _, old_im = page_cache.popitem(last=False)
            old_im.close()
        return im

    try:
        for p, rs in sorted(by_page.items()):
            im = get_page_im(p)
            for r in rs:
                x0, y0, x1, y1 = r["bbox"]
                hdr = r.get("hdr_bbox")
                hdr_p = r.get("hdr_page", p)
                if hdr:
                    hx0, hy0, hx1, hy1 = hdr
                    same_col_adj = (hdr_p == p) and (abs(hx0 - x0) <= 25) and (0 <= (y0 - hy1) <= 22) and (hy0 < y0)
                    if same_col_adj:
                        box = (
                            max(0, int((min(hx0, x0) - 6) * k)),
                            max(0, int((hy0 - 4) * k)),
                            min(im.width, int((max(hx1, x1) + 6) * k)),
                            min(im.height, int((y1 + 4) * k)),
                        )
                        cropped = im.crop(box)
                    else:
                        hdr_im = get_page_im(hdr_p)
                        hbox = (
                            max(0, int((hx0 - 6) * k)),
                            max(0, int((hy0 - 3) * k)),
                            min(hdr_im.width, int((hx1 + 6) * k)),
                            min(hdr_im.height, int((min(hy1, hy0 + 10) + 1) * k)),
                        )
                        rbox = (
                            max(0, int((x0 - 6) * k)),
                            max(0, int((y0 - 1) * k)),
                            min(im.width, int((x1 + 6) * k)),
                            min(im.height, int((y1 + 4) * k)),
                        )
                        top_im = hdr_im.crop(hbox)
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
    finally:
        for cached_im in page_cache.values():
            cached_im.close()


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
        with ThreadPoolExecutor(3) as ex:
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
