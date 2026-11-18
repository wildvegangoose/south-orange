"""Merge real-estate cards + directory listings into per-street JSON files the house page can load.

archive/data/street_index.json   {slug: {name, houses, first, last}}
archive/data/streets/<slug>.json {name, houses: {number: {cards:[...], listings:[...]}}}
Only directory years <= CUTOFF are included (names after 1950 are left out by design).
"""
import os, re, json, glob, collections
from common import OUT, slug, SLUG, TOWN

CUTOFF = TOWN["directories"]["name_cutoff_year"]
VIEWER = "https://www.digifind-it.com/IDIViewer/web/viewer.html?file="
houses = collections.defaultdict(lambda: collections.defaultdict(lambda: {"cards": [], "listings": [], "news": []}))

def norm_num(n):
    n = (n or "").strip().upper()
    m = re.match(r"^(\d+)", n)
    return m.group(1) if m else n

rp = os.path.join(OUT, "data", "realestate.json")
if not os.path.exists(rp):  # crawl still running: reconstruct card records from the images rendered so far
    streets = json.load(open(os.path.join(OUT, "data", "streets.json")))
    by_slug = {slug(s): s for s in streets}
    tmp = []
    for img in glob.glob(os.path.join(OUT, "realestate", "*", "*-1.jpg")):
        st = by_slug.get(os.path.basename(os.path.dirname(img)))
        m = re.match(r"^(\d+[a-z]?)-", os.path.basename(img))
        if not st or not m: continue
        label = f"{m.group(1).upper()} {st}"; back = img[:-6] + "-2.jpg"
        tmp.append({"street": st, "number": m.group(1).upper(), "label": label, "img": os.path.relpath(img, OUT),
                    "back": os.path.relpath(back, OUT) if os.path.exists(back) else None, "pdf": f"/{SLUG}/data/realestate/{st}/{label}.pdf"})
    rp = os.path.join(OUT, "_tmp", "realestate_partial.json"); json.dump(tmp, open(rp, "w"))
if os.path.exists(rp):
    for c in json.load(open(rp)):
        if not c.get("number") or not c.get("img") or not os.path.exists(os.path.join(OUT, c["img"])): continue
        houses[c["street"]][norm_num(c["number"])]["cards"].append(
            {"img": c["img"], "back": c.get("back"), "label": c["label"], "src": VIEWER + c["pdf"]})

# --- repair OCR street names the directory parser could not confirm ("~V A LLE Y" -> VALLEY STREET) ----------
import difflib
CONF = json.load(open(os.path.join(OUT, "data", "streets.json")))
SUFW = r"\b(STREET|AVENUE|ROAD|PLACE|TERRACE|DRIVE|COURT|LANE|PARKWAY|WAY|CIRCLE|BOULEVARD|AVW|RD|ST|AV|PI|P I|PL)\b"
def key(name): return re.sub(r"[^A-Z]", "", re.sub(SUFW, "", name.upper()))
CKEY = {}
for c in CONF: CKEY.setdefault(key(c), c)
ucount, uyears = collections.Counter(), collections.defaultdict(set)
for f in glob.glob(os.path.join(OUT, "data", "dir_*.json")):
    for r in json.load(open(f)):
        if (r.get("street") or "").startswith("~"): ucount[r["street"]] += 1; uyears[r["street"]].add(r["year"])
def resolve(st):
    if not st or not st.startswith("~"): return st
    k = key(st[1:])
    if k in CKEY: return CKEY[k]
    m = difflib.get_close_matches(k, list(CKEY), n=1, cutoff=0.86) if len(k) >= 5 else []
    if m: return CKEY[m[0]]
    return st if ucount[st] >= 15 and len(uyears[st]) >= 3 else None   # keep only recurring real-looking streets

for f in sorted(glob.glob(os.path.join(OUT, "data", "dir_*.json"))):
    y = int(re.search(r"dir_(\d+)", f).group(1))
    if y > CUTOFF: continue
    for r in json.load(open(f)):
        r["street"] = resolve(r.get("street"))
        if not r.get("street"): continue
        houses[r["street"]][norm_num(r["number"])]["listings"].append({
            "year": r["year"], "surname": r["surname"], "given": r["given"], "spouse": r["spouse"], "occ": r["occ"],
            "tenure": r["tenure"], "town": r["town"], "crop": r.get("crop"), "src": f"{VIEWER}{r['src']}#page={r['page']}", "text": r["text"]})

sp = os.path.join(OUT, "data", "scrapbooks.json")
if os.path.exists(sp):
    for c in json.load(open(sp)):
        if c.get("none") or not c.get("crop"): continue
        houses[c["street"]][norm_num(c["number"])]["news"].append(
            {"year": c["year"], "crop": c["crop"], "src": c["src"], "snippet": re.sub(r"\s+", " ", c["snippet"])[:400]})

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

# words that the parser sometimes takes for a surname (directory headings, town and street names, OCR junk)
BAD = set(w.title() for c in CONF for w in re.sub(r"[^A-Z ]", " ", c).split() if len(w) > 2) | set(TOWN["directories"]["not_surnames"])

def harmonize(ls):
    """Fix surnames OCR mis-assigned (dropped ditto dash) using the same person's listings in other years.
    Street/town words that slipped in as surnames don't get a vote and are replaced when a real one exists."""
    groups = collections.defaultdict(list)
    for l in ls:
        g = (l["given"] or "").split()
        if g and len(g[0].rstrip(".")) > 1: groups[g[0].rstrip(".")].append(l)
    for k, g in groups.items():
        if len(g) < 2: continue
        votes = collections.Counter(l["surname"] for l in g if l["surname"] not in BAD)
        if not votes: continue
        (top, n), second = votes.most_common(1)[0], (votes.most_common(2)[1][1] if len(votes) > 1 else 0)
        if (n >= 2 and n / len(g) >= 0.6) or n == sum(votes.values()) or (n >= 3 and n >= 2 * second):
            for l in g:
                if l["surname"] != top: l["surname_ocr"] = l["surname"]; l["surname"] = top

os.makedirs(os.path.join(OUT, "data", "streets"), exist_ok=True)
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
    if prev:  # merge a "~" variant into a confirmed street of the same name
        old = json.load(open(os.path.join(OUT, "data", "streets", s + ".json")))
        for n, h in hs.items():
            o = old["houses"].setdefault(n, {"cards": [], "listings": [], "news": []}); o["cards"] += h["cards"]; o["listings"] += h["listings"]; o.setdefault("news", []).extend(h["news"])
        data = old
    json.dump(data, open(os.path.join(OUT, "data", "streets", s + ".json"), "w"))
    index[s] = {"name": clean, "houses": len(data["houses"]), "first": min(years) if years else None, "last": max(years) if years else None}
json.dump(index, open(os.path.join(OUT, "data", "street_index.json"), "w"))
print(f"{len(index)} streets, {sum(v['houses'] for v in index.values())} addresses, "
      f"{sum(len(h['cards']) for hs in houses.values() for h in hs.values())} cards, "
      f"{sum(len(h['listings']) for hs in houses.values() for h in hs.values())} listings")
