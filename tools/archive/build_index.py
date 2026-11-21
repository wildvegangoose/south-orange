"""Merge real-estate cards + directory listings + scrapbooks + LOC newspapers into per-street JSON files.

archive/data/street_index.json   {slug: {name, houses, first, last}}
archive/data/streets/<slug>.json {name, houses: {number: {cards:[...], listings:[...], news:[...]}}}
Only directory years <= CUTOFF are included (names after 1950 are left out by design).
"""
import os, re, json, glob, collections, difflib, urllib.parse
from common import OUT, slug, SLUG, TOWN, canon_street, normalize_raw_street, _split_street, _edit_dist, SUFFIX

CUTOFF = TOWN["directories"]["name_cutoff_year"]
VIEWER = "https://www.digifind-it.com/IDIViewer/web/viewer.html?file="
CONF = json.load(open(os.path.join(OUT, "data", "streets.json")))
houses = collections.defaultdict(lambda: collections.defaultdict(lambda: {"cards": [], "listings": [], "news": []}))

def norm_num(n):
    n = (n or "").strip().upper()
    m = re.match(r"^(\d+)", n)
    return m.group(1) if m else n

def expand_card_numbers(label, existing_num=None):
    clean = urllib.parse.unquote(label or "").strip()
    m = re.match(r"^(\d+(?:-[A-Z]|[A-Z])?(?:\s*(?:[-,&]|\()\s*\d+[A-Z]?\)?)*)\s+", clean)
    prefix = m.group(1).strip() if m else (existing_num or "")
    if not prefix:
        return []
    raw_nums = re.findall(r"\d+", prefix)
    if not raw_nums:
        return []
    out, seen = [], set()
    first = raw_nums[0]
    for tok in raw_nums:
        val = tok
        if len(tok) < len(first) and int(first[:len(first) - len(tok)] + tok) > int(first):
            val = first[:len(first) - len(tok)] + tok
        if val not in seen:
            seen.add(val)
            out.append(val)
    return out

# --- 1. Real-estate cards (when present) ------------------------------------
rp = os.path.join(OUT, "data", "realestate.json")
if os.path.exists(rp):
    re_cards = json.load(open(rp))
    re_dirty = False
    for c in re_cards:
        img = c.get("img")
        if not img or not os.path.exists(os.path.join(OUT, img)):
            continue
        dec_label = urllib.parse.unquote(c.get("label") or "")
        if dec_label != c.get("label"):
            c["label"] = dec_label
            re_dirty = True
        if not c.get("back") and img.endswith("-1.jpg"):
            cand_back = img[:-6] + "-2.jpg"
            if os.path.exists(os.path.join(OUT, cand_back)):
                c["back"] = cand_back
                re_dirty = True
        nums = expand_card_numbers(dec_label, c.get("number"))
        if nums and not c.get("number"):
            c["number"] = nums[0]
            re_dirty = True
        for n in nums:
            houses[c["street"]][n]["cards"].append(
                {"img": img, "back": c.get("back"), "label": dec_label, "src": VIEWER + c["pdf"]})
    if re_dirty:
        json.dump(re_cards, open(rp, "w"))

# --- 2. Directory street resolution & OCR field repair ----------------------
GIVEN = set("""Albert Alfred Alice Ann Anna Anne Arthur Barbara Benjamin Bertha Betty Carl Carrie Catherine Charles Clara Daniel David Donald
Dorothy Edith Edna Edward Edwin Eleanor Elizabeth Ella Ellen Emily Emma Ernest Esther Ethel Eugene Evelyn Florence Frances Francis Frank
Fred Frederick George Gertrude Grace Harold Harriet Harry Helen Henry Herbert Howard Ida Irene Isabel Jacob James Jane Jean Jennie John
Joseph Josephine Julia Katherine Kenneth Laura Lawrence Leo Leonard Lillian Louis Louise Lucy Mabel Margaret Marie Marion Martha Mary
Mildred Minnie Nellie Norman Patrick Paul Peter Philip Ralph Raymond Richard Robert Rose Ruth Samuel Sarah Stanley Theodore Thomas Victor
Viola Walter William Willard""".split())

OCC_STOP = set("""wid elk clk mgr eng ins emp tchr slsman pres sec acct mech elec arch atty lwyr carp pntr mach rest tel real est oil gas
auto bank asst supv foreman driver dentist lawyer writer student nurse artist tailor butcher grocer baker barber janitor fireman policeman
broker printer chemist doctor author editor painter plumber mason cook maid widow in of at and for h r res bds rms""".split())

DITTO_RE = re.compile(r"^(?:[•■▪◦*.,'’‘`]+\s*)?(?:[—\-–_~]{1,3}|[“\"”]{1,2})\s*")
CODES = TOWN["directories"]["codes"]
def _code_pat(c): return rf"{re.escape(c[0])}\s*[O0]" if len(c) == 2 and c[1] == "O" else re.escape(c)
TOWN_RE = "(" + "|".join(_code_pat(c) for c in sorted(CODES, key=len, reverse=True)) + ")"
ADDR_RE = re.compile(rf"\b(h|r|bds|rms|res|bd)\.?\s+(?:\([0-9A-Za-z]{{1,4}}\)\s+)?(\d{{1,4}}[A-Za-z]?(?:-\d+)?)\s+([A-Z0-9][A-Za-z0-9.'’]*(?:\s[A-Za-z0-9.'’]+){{0,4}}?)\s+{TOWN_RE}\.?$")

def loose_street(raw):
    s = normalize_raw_street(raw)
    w = s.split()
    if not w or len("".join(w)) < 3: return None
    if w[-1].lower() in SUFFIX: w[-1] = SUFFIX[w[-1].lower()]
    elif len(w) == 1 or (len(w) == 2 and w[0].upper() in ("NORTH", "SOUTH", "EAST", "WEST")):
        w.append("Street")
    return "~" + " ".join(w).upper()

def _rejoin_spaced_word(s):
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
        sp = _rejoin_spaced_word(sp)
        sp = re.sub(r"\b([A-Z])\s+([a-z]{2,})\b", r"\1\2", sp)
        sp = re.sub(r"^([A-Z][a-z]+)\s+0$", r"\1 O", sp)
        spouse = sp or None
    pre_ns = re.sub(r"\([^)]*\)", " ", pre)
    pre_ns = re.sub(r"^[\s'’‘“”`\"^.,:;!*~_\-–—•■\[\]]+", "", pre_ns)
    pre_ns = _rejoin_spaced_word(pre_ns)
    pre_ns = re.sub(r"^([A-Z][a-z]+)\s+0(?=\s|$)", r"\1 O", pre_ns)
    g = re.match(r"^((?:[A-Z][a-z]+\.?|[A-Z]\.?)(?:\s(?:[A-Z][a-z]+\.?|[A-Z]\.?|Jr|Sr|Mrs|Miss|Rev|Dr))*)", pre_ns)
    given = g.group(1).strip() if g else ""
    occ = re.split(r"\s(?:r|h|bds|res)\s\d", pre_ns[len(given):])[0].strip(" ,;")
    return given, spouse, occ[:80]

def format_surname(raw_tok):
    s = raw_tok.strip(" ,.;:'’‘\"“”`")
    s = re.sub(r"^O['’‘]([A-Za-z])", lambda m: "O’" + m.group(1).upper(), s)
    if re.match(r"^(?:Mac|Mc|De|Di|Du|La|Le|Vander|Van|Von|St|O['’])[A-Z]", s):
        return s
    return s.title()

def repair_row(r):
    t = re.sub(r"\s+", " ", r.get("text") or "").strip()
    surname = (r.get("surname") or "").strip(" ,.;:'’‘\"“”`")
    given = r.get("given") or ""
    spouse = r.get("spouse")
    occ = r.get("occ") or ""
    a = ADDR_RE.search(t)
    is_ditto = bool(DITTO_RE.match(t))
    direct = False
    if a:
        if is_ditto:
            rest = DITTO_RE.sub("", t)
            pre = rest[: max(0, len(rest) - (len(t) - a.start()))]
            given, spouse, occ = clean_person_fields(pre)
            direct = False
        else:
            t_sur = re.sub(r"^(O['’])\s+([A-Z][a-z]+)", r"\1\2", t)
            t_sur = re.sub(r"^(Mc|Mac)\s+([A-Z][a-z]{2,})", r"\1\2", t_sur)
            t_sur = re.sub(r"^(?:van\s+der|vander)\s+([A-Z][a-z]{2,})", r"Vander\1", t_sur, flags=re.I)
            w = t_sur.split(" ", 1)
            w0 = w[0].rstrip(",")
            rest_after_w0 = w[1] if len(w) > 1 else ""
            w1 = rest_after_w0.split(" ", 1)[0].rstrip(".,") if rest_after_w0 else ""
            if w0 in GIVEN and surname.lower() != w0.lower():
                same_alpha = bool(surname and w0[0].lower() == surname[0].lower() and surname.lower() <= w0.lower())
                w1_is_given = bool(re.match(r"^[A-Z][a-z]+$", w1)) and w1 not in {"Jr", "Sr", "Inc", "Co", "St", "Rd", "Av", "Pl", "Ter", "Dr"}
                if same_alpha and w1_is_given:
                    surname = format_surname(w0)
                    pre = rest_after_w0[: max(0, len(rest_after_w0) - (len(t_sur) - (ADDR_RE.search(t_sur) or a).start()))]
                    given, spouse, occ = clean_person_fields(pre)
                    direct = True
                else:
                    pre = t_sur[: (ADDR_RE.search(t_sur) or a).start()]
                    given, spouse, occ = clean_person_fields(pre)
                    direct = False
            elif re.match(r"^[A-Z][A-Za-z'’]+$", w0):
                surname = format_surname(w0)
                a2 = ADDR_RE.search(t_sur) or a
                pre = rest_after_w0[: max(0, len(rest_after_w0) - (len(t_sur) - a2.start()))]
                given, spouse, occ = clean_person_fields(pre)
                direct = True
    elif spouse:
        spouse = _rejoin_spaced_word(re.sub(r"\s+", " ", spouse).strip())
    return surname, given, spouse, occ, direct

dir_files = sorted(glob.glob(os.path.join(OUT, "data", "dir_*.json")))
parsed_rows = []
ucount, uyears = collections.Counter(), collections.defaultdict(set)

# Map (dir, base_no_space) -> confirmed suffixed streets so suffix-stripping ONLY runs when unambiguous
by_base_dir = collections.defaultdict(list)
for c in CONF:
    d, b, sf = _split_street(c)
    if sf:
        by_base_dir[(d, b.replace(" ", ""))].append(c)

for f in dir_files:
    y = int(re.search(r"dir_(\d+)", f).group(1))
    if y > CUTOFF: continue
    for r in json.load(open(f)):
        raw_st = r.get("raw_street") or ""
        st = canon_street(raw_st, CONF) if raw_st else None
        if not st:
            st = loose_street(raw_st) if raw_st else r.get("street")
        if st and st.startswith("~"):
            ucount[st] += 1
            uyears[st].add(r["year"])
        parsed_rows.append((r, st))

def resolve(st):
    if not st or not st.startswith("~"): return st
    d, b, sf = _split_street(st[1:])
    b_ns = b.replace(" ", "")
    cands = by_base_dir.get((d, b_ns), [])
    if len(cands) == 1:
        _, _, c_sf = _split_street(cands[0])
        if not sf or sf == c_sf or (sf == "STREET" and c_sf != "STREET" and ucount[st] < 15):
            return cands[0]
    return st if ucount[st] >= 15 and len(uyears[st]) >= 3 else None

HEADINGS = {"Oranges", "Orange", "Directory", "Co", "Inc", "The", "Eo", "So", "Wo", "Newark", "Irvington", "Arlington",
            "Maplewood", "Hilton", "South", "Seton", "Street", "Avenue", "Road", "Place", "Terrace", "Mrs", "Miss",
            "Rev", "Dr", "Ampere", "Th", "Name", "Motor", "Sum", "Su", "Sm", "In", "Ck", "Low", "Her", "Al", "St", "La"}

def _split_echoed_surname(surname, given, direct, text):
    if direct or DITTO_RE.match((text or "").strip()):
        return surname, given, direct
    m_v = re.match(r"^(Vander|Van|Von|De|Di|Du|La|Le)\s+([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,}.*)$", given or "")
    if m_v:
        return m_v.group(1) + m_v.group(2), m_v.group(3), True
    gtoks = (given or "").split()
    if len(gtoks) >= 2 and surname:
        w0 = gtoks[0].rstrip(".,")
        w1 = gtoks[1].rstrip(".,")
        if (
            len(w0) >= 4
            and re.match(r"^[A-Z][a-z]+$", w0)
            and w0 not in GIVEN
            and len(w1) >= 3
            and re.match(r"^[A-Z][a-z]+$", w1)
            and w1 not in {"Mrs", "Miss", "Inc", "Corp"}
            and w0.lower() != surname.lower()
            and (
                difflib.SequenceMatcher(None, w0.lower(), surname.lower()).ratio() >= 0.62
                or (len(surname) >= 4 and w0[:4].lower() == surname[:4].lower())
            )
        ):
            return format_surname(w0), " ".join(gtoks[1:]), True
    return surname, given, direct

for r, st in parsed_rows:
    st = resolve(st)
    if not st: continue
    if "direct" in r:
        surname = r.get("surname") or ""
        given = re.sub(r"^([A-Z][a-z]+)\s+0(?=\s|$)", r"\1 O", r.get("given") or "")
        spouse = r.get("spouse")
        occ = r.get("occ") or ""
        direct = bool(r["direct"])
        old_sur = surname
        m_caps = re.match(r"^([A-Z]{3,})\s+([A-Z]{2,}(?:\s+[A-Z]\.?)*)\s+(?:\(([A-Za-z .'’]+)\)\s+)?([a-z].*)$", (r.get("text") or "").strip())
        if m_caps and m_caps.group(1).title() not in HEADINGS:
            surname = format_surname(m_caps.group(1).title())
            given = " ".join(w.title() for w in m_caps.group(2).split())
            if m_caps.group(3) and not spouse:
                spouse = m_caps.group(3).strip()
            occ = re.split(r"\s(?:r|h|bds|res)\s+(?:\([0-9A-Za-z]+\)\s+)?\d", m_caps.group(4))[0].strip(" ,;")[:80]
            direct = True
        else:
            surname, given, direct = _split_echoed_surname(surname, given, direct, r.get("text"))
    else:
        old_sur = r.get("surname") or ""
        surname, given, spouse, occ, direct = repair_row(r)
    entry = {
        "year": r["year"], "surname": surname, "given": given, "spouse": spouse, "occ": occ,
        "tenure": r["tenure"], "town": r["town"], "crop": r.get("crop"),
        "src": f"{VIEWER}{r['src']}#page={r['page']}", "text": r["text"], "_direct": direct}
    if old_sur and surname != old_sur:
        entry["surname_ocr"] = old_sur
    houses[st][norm_num(r["number"])]["listings"].append(entry)

# --- 3. Scrapbooks (when present) -------------------------------------------
SB_ADDR = re.compile(r"\b(\d{1,4})\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(road|Road|avenue|Avenue|ave|Ave|av|street|Street|place|Place|terrace|Terrace|drive|Drive|lane|Lane|court|Court|parkway|Parkway|Rd|St|Pl)\b\.?")
OTHER_TOWN_AFTER = re.compile(
    r"^\s*[,.;:\-–—]*\s*(?:Box\s+\S+\s+)?(?:Newark|Millburn|Short Hills|East Orange|West Orange|Orange|"
    r"Irvington|Union(?:\s+City)?|Springfield|Summit|Livingston|Montclair|Bloomfield|Elizabeth|Chatham|Madison|"
    r"Morristown|Jersey City|New York|Manhattan|Brooklyn|Bronxville|Boston|Lowell|Scituate|Malden|N\.?\s*Y\.?(?:\s*C\.?)?)\b",
    re.I,
)

def sb_year_label(book_path, fallback):
    m = re.search(r"/(\d{4}(?:-\d{4})?)", book_path or "")
    if not m: return str(fallback)
    y = m.group(1)
    return f"{y[:4]}–{y[7:9]}" if "-" in y else y

sb_kept, sb_dropped = 0, 0
sp = os.path.join(OUT, "data", "scrapbooks.json")
if os.path.exists(sp):
    for c in json.load(open(sp)):
        if c.get("none") or not c.get("crop"): continue
        snip = re.sub(r"\s+", " ", c.get("snippet") or "")
        matched_st = None
        for m in SB_ADDR.finditer(snip):
            if m.group(1) != str(c["number"]): continue
            if OTHER_TOWN_AFTER.match(snip[m.end(): m.end() + 45]): continue
            cand = canon_street(f"{m.group(2)} {m.group(3)}", CONF)
            if cand == c["street"]:
                matched_st = cand; break
        if not matched_st or str(c["number"]).startswith("0"):
            sb_dropped += 1; continue
        houses[matched_st][norm_num(c["number"])]["news"].append(
            {"year": sb_year_label(c.get("book"), c["year"]), "crop": c["crop"], "src": c["src"], "snippet": snip[:400]})
        sb_kept += 1

# newspaper mentions from the Library of Congress (news_loc.py); public domain, so kept beyond the name cutoff
np_ = os.path.join(OUT, "data", "news_loc.json")
if os.path.exists(np_):
    seen = set()
    for c in json.load(open(np_)):
        k = (c["street"], norm_num(c["number"]), c["page"])
        if k in seen or not c.get("region") or not c.get("alto_wh") or not c["alto_wh"][0]: continue
        seen.add(k)
        pw, ph = c["alto_wh"]; x, y, w, h = c["region"]
        pad = 0.01
        pct = [max(0, x / pw - pad), max(0, y / ph - pad), min(1, w / pw + 2 * pad), min(1, h / ph + 2 * pad)]
        houses[c["street"]][norm_num(c["number"])]["news"].append({
            "year": int(c["date"][:4]), "date": c["date"], "paper": c.get("paper"), "kind": c.get("kind"),
            "snippet": c["snippet"][:500], "src": c["page"],
            "iiif": c["iiif"] + "/pct:" + ",".join(f"{v * 100:.2f}" for v in pct) + "/500,/0/default.jpg"})

# --- 4. Safe surname harmonization ------------------------------------------
# Only true headings / town / non-surname words (NEVER real family surnames that also name streets!)
HEADINGS = {"Oranges", "Orange", "Directory", "Co", "Inc", "The", "Eo", "So", "Wo", "Newark", "Irvington", "Arlington",
            "Maplewood", "Hilton", "South", "Seton", "Street", "Avenue", "Road", "Place", "Terrace", "Mrs", "Miss",
            "Rev", "Dr", "Ampere", "Th", "Name", "Motor", "Sum", "Su", "Sm", "In", "Ck", "Low", "Her", "Al", "St", "La"}

def _mid_initial(given):
    parts = [p.rstrip(".") for p in (given or "").split() if p.rstrip(".") not in {"Jr", "Sr", "Mrs", "Miss", "Rev", "Dr"}]
    return parts[1][0].upper() if len(parts) >= 2 and parts[1] else ""

def _spouse_first(spouse):
    parts = (spouse or "").split()
    return parts[0].rstrip(".").lower() if parts else ""

def _wid_husband(occ):
    m = re.search(r"\bwid\s+([A-Z][a-z]+)", occ or "")
    return m.group(1).lower() if m else ""

def harmonize(ls):
    """Fix OCR-garbled or dropped-ditto surnames using the same person's listings in other years,
    WITHOUT ever overwriting an unrelated explicitly printed family surname."""
    direct_counts = collections.Counter(l["surname"] for l in ls if l.get("_direct") and l["surname"] not in HEADINGS and len(l["surname"]) >= 3)
    house_surnames = collections.Counter(l["surname"] for l in ls if l["surname"] not in HEADINGS and len(l["surname"]) >= 3)

    groups = collections.defaultdict(list)
    for l in ls:
        g = (l["given"] or "").split()
        if g and len(g[0].rstrip(".")) > 1:
            groups[g[0].rstrip(".")].append(l)

    for first_name, g in groups.items():
        if len(g) < 2:
            continue
        votes = collections.Counter()
        for l in g:
            s = l["surname"]
            if not s or s in HEADINGS or len(s) <= 2:
                continue
            if not l.get("_direct") and s in GIVEN:
                continue
            votes[s] += 1
        if not votes:
            continue

        for l in g:
            cur = l["surname"]
            candidates = [(s, cnt) for s, cnt in votes.most_common() if s != cur]
            if not candidates:
                continue

            cur_mid = _mid_initial(l["given"])
            cur_sp = _spouse_first(l["spouse"])
            cur_wid = _wid_husband(l["occ"])

            chosen = None
            for top, n in candidates:
                top_rows = [x for x in g if x["surname"] == top]
                if not top_rows:
                    continue
                top_mids = {_mid_initial(x["given"]) for x in top_rows if _mid_initial(x["given"])}
                top_sps = {_spouse_first(x["spouse"]) for x in top_rows if _spouse_first(x["spouse"])}
                top_wids = {_wid_husband(x["occ"]) for x in top_rows if _wid_husband(x["occ"])}
                mid_conflict = bool(cur_mid and top_mids and cur_mid not in top_mids)
                sp_conflict = bool(cur_sp and top_sps and cur_sp not in top_sps)
                wid_conflict = bool(cur_wid and top_wids and cur_wid not in top_wids)
                if mid_conflict or sp_conflict or wid_conflict:
                    continue

                ratio = difflib.SequenceMatcher(None, cur.lower(), top.lower()).ratio()
                ed = _edit_dist(cur.lower(), top.lower())
                same_sp = bool(cur_sp and cur_sp in top_sps)
                same_wid = bool(cur_wid and cur_wid in top_wids)
                same_mid = bool(cur_mid and cur_mid in top_mids)

                if l.get("_direct"):
                    if (cur in HEADINGS or len(cur) <= 2) and (n >= 2 or same_sp or same_wid):
                        chosen = top; break
                    if (ed <= 2 and ratio >= 0.72) and (n >= 2 or direct_counts[top] >= 2) and direct_counts[cur] <= 1:
                        chosen = top; break
                    if same_sp and ratio >= 0.55 and (n >= 2 or direct_counts[top] >= 2) and direct_counts[cur] <= 1:
                        chosen = top; break
                else:
                    cur_is_confirmed_family = direct_counts[cur] >= 1 or (
                        house_surnames[cur] >= 2 and cur not in GIVEN and cur not in HEADINGS
                        and not ((direct_counts[top] >= 1 or house_surnames[top] >= 3) and (same_sp or same_wid or same_mid))
                    )
                    if cur_is_confirmed_family:
                        if ed <= 2 and ratio >= 0.72 and house_surnames[top] > house_surnames[cur]:
                            chosen = top; break
                        continue
                    if cur in HEADINGS or len(cur) <= 3 or cur in GIVEN:
                        if n >= 2 or direct_counts[top] >= 1 or same_sp or same_wid:
                            chosen = top; break
                    if ratio >= 0.62 and (n >= 2 or direct_counts[top] >= 1):
                        chosen = top; break
                    min_ygap = min(abs(l["year"] - x["year"]) for x in top_rows)
                    if (same_sp or same_wid) and min_ygap <= 10 and (ratio >= 0.45 or (n >= 1 and house_surnames[top] >= 2 and house_surnames[cur] <= 1)):
                        chosen = top; break
                    if same_mid and min_ygap <= 4 and n >= 2 and ratio >= 0.55:
                        chosen = top; break

            if chosen:
                l["surname_ocr"] = cur
                l["surname"] = chosen

    male_by_first = collections.defaultdict(collections.Counter)
    for l in ls:
        s = l["surname"]
        if not s or s in HEADINGS or len(s) <= 2 or (not l.get("_direct") and s in GIVEN):
            continue
        g = (l["given"] or "").split()
        if g and len(g[0].rstrip(".")) >= 3:
            male_by_first[g[0].rstrip(".").lower()][s] += 1
    for l in ls:
        if l.get("_direct"):
            continue
        cur = l["surname"]
        if direct_counts[cur] >= 1:
            continue
        wid_h = _wid_husband(l["occ"])
        if wid_h and (cur in HEADINGS or cur in GIVEN or len(cur) <= 3 or house_surnames[cur] <= 1):
            best_s, best_n = None, 0
            for mf, ctr in male_by_first.items():
                if mf == wid_h or mf.startswith(wid_h) or wid_h.startswith(mf):
                    s, n = ctr.most_common(1)[0]
                    if n > best_n:
                        best_s, best_n = s, n
            if best_s and best_s != cur and (direct_counts[best_s] >= 1 or best_n >= 2):
                l["surname_ocr"] = cur
                l["surname"] = best_s

    by_page = collections.defaultdict(list)
    for l in ls:
        by_page[(l["year"], l["src"])].append(l)
    for grp in by_page.values():
        header_fixes = {}
        for l in grp:
            old_s = l.get("surname_ocr")
            new_s = l.get("surname")
            if old_s and new_s and old_s != new_s:
                if l.get("_direct") or difflib.SequenceMatcher(None, old_s.lower(), new_s.lower()).ratio() >= 0.65:
                    header_fixes[old_s] = new_s
        if header_fixes:
            for l in grp:
                if not l.get("_direct") and not l.get("surname_ocr") and l["surname"] in header_fixes:
                    l["surname_ocr"] = l["surname"]
                    l["surname"] = header_fixes[l["surname"]]

    for l in ls:
        if l["surname"] in HEADINGS:
            l["surname_ocr"] = l["surname"]
            l["surname"] = ""
        l.pop("_direct", None)

streets_dir = os.path.join(OUT, "data", "streets")
os.makedirs(streets_dir, exist_ok=True)
for old_f in glob.glob(os.path.join(streets_dir, "*.json")):
    os.remove(old_f)

index = {}
for street, hs in houses.items():
    clean = street.lstrip("~")
    s = slug(clean)
    for h in hs.values():
        harmonize(h["listings"])
        h["listings"].sort(key=lambda l: (l["year"], l["tenure"] != "householder", l["surname"]))
        seen = set(); h["listings"] = [l for l in h["listings"] if not ((k := (l["year"], l["surname"], l["given"])) in seen or seen.add(k))]
    years = [l["year"] for h in hs.values() for l in h["listings"]]
    prev = index.get(s)
    data = {"name": clean, "confirmed": not street.startswith("~"), "houses": hs}
    if prev:
        old = json.load(open(os.path.join(streets_dir, s + ".json")))
        for n, h in hs.items():
            o = old["houses"].setdefault(n, {"cards": [], "listings": [], "news": []})
            o["cards"] += h["cards"]; o["listings"] += h["listings"]; o.setdefault("news", []).extend(h["news"])
        data = old
        years = [l["year"] for h in data["houses"].values() for l in h["listings"]]
    json.dump(data, open(os.path.join(streets_dir, s + ".json"), "w"))
    index[s] = {"name": clean, "houses": len(data["houses"]), "first": min(years) if years else None, "last": max(years) if years else None}
json.dump(index, open(os.path.join(OUT, "data", "street_index.json"), "w"))
print(f"{len(index)} streets, {sum(v['houses'] for v in index.values())} addresses, "
      f"{sum(len(h['cards']) for hs in houses.values() for h in hs.values())} cards, "
      f"{sum(len(h['listings']) for hs in houses.values() for h in hs.values())} listings, "
      f"{sb_kept} scrapbook hits kept ({sb_dropped} dropped)")
