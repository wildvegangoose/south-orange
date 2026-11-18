"""Find South Orange street addresses in historic newspapers (Library of Congress, Chronicling America; public domain).

For every street in archive/data/streets.json: search loc.gov for pages containing "south orange" and the street
name (1869-1963), download each page's ALTO OCR, and keep every "<number> <street>" mention that sits within a few
hundred characters of "South Orange". For each mention we keep the date, paper, a text snippet, the page link and
the region of the scan (so the site can show a crop via the LOC IIIF image server). Output:
  archive/data/news_loc.json   [{street, number, date, paper, kind, snippet, page, iiif, region}, ...]
Resumable: finished streets are cached in archive/_tmp/news_loc/<street>.json.
Usage: python3 news_loc.py [max_pages_per_street]
"""
import json, os, re, sys, time, html, urllib.request, urllib.parse
from common import OUT, UA, slug, TOWN

MAXP = int(sys.argv[1]) if len(sys.argv) > 1 else 150
CACHE = os.path.join(OUT, "_tmp", "news_loc"); os.makedirs(CACHE, exist_ok=True)
STREETS = json.load(open(os.path.join(OUT, "data", "streets.json")))
if os.environ.get("ONLY"): STREETS = [s for s in STREETS if s in os.environ["ONLY"].split(",")]
if os.environ.get("REVERSE"): STREETS = STREETS[::-1]
SUF = {"AVENUE": r"(?:avenue|ave|av)", "ROAD": r"(?:road|rd)", "STREET": r"(?:street|st)", "PLACE": r"(?:place|pl)",
       "TERRACE": r"(?:terrace|ter|terr)", "DRIVE": r"(?:drive|dr)", "COURT": r"(?:court|ct)", "LANE": r"(?:lane|la|ln)", "WAY": r"way"}
NEWS = TOWN.get("news", {})
PHRASES = NEWS.get("phrases", [TOWN["name"].lower()])          # e.g. ["south orange"] or ["maplewood", "hilton"]
NEAR = re.compile("|".join(r"\s*".join(map(re.escape, p.split())) for p in NEWS.get("near", PHRASES)), re.I)
STATES = NEWS.get("states")                                     # optional loc.gov location_state filter
SKIP = set(NEWS.get("skip_streets", []))   # street names too common to search usefully

def get(url, tries=4, binary=False):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90) as r:
                d = r.read(); return d if binary else d.decode("utf-8", "ignore")
        except Exception as e:
            if i == tries - 1: print("  fail", url[:120], e, file=sys.stderr); return None
            time.sleep(8 * (i + 1))

def search(phrase):
    out, sp = [], 1
    while len(out) < MAXP:
        params = {"q": f'"{PHRASES[0]}" "{phrase}"', "dates": NEWS.get("dates", "1869/1963"), "fo": "json", "c": 100, "sp": sp}
        if STATES: params["fa"] = "location_state:" + "|location_state:".join(STATES)
        q = urllib.parse.urlencode(params)
        t = get("https://www.loc.gov/collections/chronicling-america/?" + q); time.sleep(3)
        if not t: break
        try: d = json.loads(t)
        except Exception: break
        res = d.get("results", [])
        out += res
        if not d.get("pagination", {}).get("next") or not res: break
        sp += 1
    return out[:MAXP]

def alto_for(r):
    u = (r.get("image_url") or [""])[0]
    m = re.search(r"iiif/service:(ndnp:[^/]+)/full", u)
    if not m: return None, None
    svc = m.group(1)
    return "https://tile.loc.gov/storage-services/service/" + svc.replace(":", "/") + ".xml", "https://tile.loc.gov/image-services/iiif/service:" + svc

STR = re.compile(r'<String [^>]*?HPOS="([\d.]+)"[^>]*?VPOS="([\d.]+)"[^>]*?(?:WIDTH="([\d.]+)"[^>]*?HEIGHT="([\d.]+)"[^>]*?)?CONTENT="([^"]*)"|<String [^>]*?CONTENT="([^"]*)"[^>]*?HPOS="([\d.]+)"[^>]*?VPOS="([\d.]+)"')
PAGE = re.compile(r'<Page [^>]*?WIDTH="([\d.]+)"[^>]*?HEIGHT="([\d.]+)"')

def words(alto):
    ws = []
    for m in re.finditer(r"<String ([^>]*)/?>", alto):
        a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        if "CONTENT" in a and "HPOS" in a:
            ws.append((html.unescape(a["CONTENT"]), float(a["HPOS"]), float(a["VPOS"]), float(a.get("WIDTH", 0)), float(a.get("HEIGHT", 0))))
    return ws

AD = re.compile(r"\b(for sale|to let|for rent|rooms?\b|board\b|boarders|wanted|apply|phone|telephone|tel\.|furnished|\$\s?\d|per week|per month|terms)\b", re.I)

def mentions(street, alto, iiif):
    pg = PAGE.search(alto)
    pw, ph = (float(pg.group(1)), float(pg.group(2))) if pg else (None, None)
    ws = words(alto)
    if not ws: return []
    text, idx = "", []
    for i, w in enumerate(ws):
        idx.append(len(text)); text += w[0] + " "
    core = street.rsplit(" ", 1)
    name, suf = (core[0], SUF.get(core[1], re.escape(core[1].lower()))) if len(core) == 2 and core[1] in SUF else (street, "")
    nm = r"\s+".join(re.escape(x) for x in name.lower().split())
    pats = [re.compile(rf"\b(\d{{1,4}})\s+{nm}\.?\s*{suf}\b", re.I), re.compile(rf"\b{nm}\.?\s*{suf}\.?,?\s+(?:No\.?\s*)?(\d{{1,4}})\b", re.I)]
    so = [m.start() for m in NEAR.finditer(text)]
    out = []
    for p in pats:
        for m in p.finditer(text):
            if not so or min(abs(s - m.start()) for s in so) > 400: continue
            num = m.group(1)
            if not (1 <= int(num) <= 1200): continue
            a, b = m.start(), m.end()
            snip = text[max(0, a - 320): b + 320].replace(" - ", "")
            # region: words of the mention plus a few lines around it
            i0 = max(0, next(i for i, k in enumerate(idx) if k >= a) - 40) if any(k >= a for k in idx) else 0
            i1 = min(len(ws), i0 + 110)
            xs = [w[1] for w in ws[i0:i1]] + [w[1] + w[3] for w in ws[i0:i1]]; ys = [w[2] for w in ws[i0:i1]] + [w[2] + w[4] for w in ws[i0:i1]]
            region = [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)] if pw else None
            out.append({"street": street, "number": num, "snippet": re.sub(r"\s+", " ", snip).strip(),
                        "kind": "ad" if len(AD.findall(snip)) >= 2 else "news", "iiif": iiif, "alto_wh": [pw, ph], "region": region})
    return out

all_rows = []
for st in STREETS:
    if st in SKIP or st.startswith("~"): continue
    cp = os.path.join(CACHE, slug(st) + ".json")
    if os.path.exists(cp): all_rows += json.load(open(cp)); continue
    name, suf = st.rsplit(" ", 1) if " " in st else (st, "")
    phrase = f"{name.lower()} {({'AVENUE': 'av', 'ROAD': 'road', 'STREET': 'st', 'PLACE': 'place', 'TERRACE': 'terrace', 'DRIVE': 'drive', 'COURT': 'court', 'LANE': 'lane'}).get(suf, suf.lower())}".strip()
    results = search(phrase)
    if suf == "AVENUE" and len(results) < MAXP: results += search(f"{name.lower()} avenue")
    if suf == "ROAD" and len(results) < MAXP: results += search(f"{name.lower()} rd")
    seen, rows = set(), []
    for r in results:
        if r["id"] in seen: continue
        seen.add(r["id"])
        alto_url, iiif = alto_for(r)
        if not alto_url: continue
        alto = get(alto_url); time.sleep(1)
        if not alto: continue
        for mn in mentions(st, alto, iiif):
            mn.update({"date": r.get("date"), "paper": (r.get("partof_title") or [""])[0] if isinstance(r.get("partof_title"), list) else r.get("partof_title"),
                       "page": r["id"].replace("http://", "https://")})
            rows.append(mn)
    json.dump(rows, open(cp, "w"))
    all_rows += rows
    print(f"{st}: {len(seen)} pages, {len(rows)} mentions", file=sys.stderr, flush=True)

json.dump(all_rows, open(os.path.join(OUT, "data", "news_loc.json"), "w"))
print("total mentions", len(all_rows), file=sys.stderr)
