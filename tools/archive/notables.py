"""Cross-check notable Maplewood people against the 1908-1950 city directories.

Input:  tools/archive/notables.jsonl  (one person per line: name, wiki, born, died, desc, connection)
Output: archive/data/notable_candidates.json  — candidates for MANUAL review, with confidence:
  "direct"  : surname + first name match, person was an adult (>=18) in the listing year
  "initial" : surname + first initial match (weaker)
  "family"  : person was a child in Maplewood; rare surname (<= RARE households in town) — possible family home
Nothing here is published automatically; reviewed matches go into js/webstories.js.
"""
import os, re, json, glob, collections, unicodedata
HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "..", "archive")
RARE = 3

def fold(s):
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower().strip()

def split_name(full):
    parts = [p for p in re.sub(r"\(.*?\)|\".*?\"|,", " ", full).split() if p.lower().rstrip(".") not in ("jr", "sr", "ii", "iii", "iv", "dr", "rev")]
    return (parts[0], parts[-1]) if len(parts) >= 2 else (None, None)

rows = []
for f in glob.glob(os.path.join(OUT, "data", "dir_*.json")):
    rows += [r for r in json.load(open(f)) if r.get("street")]
by_surname = collections.defaultdict(list)
for r in rows: by_surname[fold(r["surname"])].append(r)

people = [json.loads(l) for l in open(os.path.join(HERE, "notables.jsonl")) if l.strip().startswith("{")]
cands = []
for p in people:
    first, last = split_name(p["name"])
    if not last: continue
    born = p.get("born") if isinstance(p.get("born"), int) else None
    died = p.get("died") if isinstance(p.get("died"), int) else None
    if born and born > 1945: continue  # too young to appear in a 1908-1950 directory, even as a child's household
    pool = by_surname.get(fold(last), [])
    if not pool: continue
    households = {(r["street"], r["number"]) for r in pool}
    hits = collections.defaultdict(list)
    for r in pool:
        g = fold(r["given"])
        adult = (born is None) or (r["year"] - born >= 18)
        alive = (died is None) or (r["year"] <= died)
        if not alive: continue
        if first and g.split(" ")[0] == fold(first) and adult: kind = "direct"
        elif first and g[:1] == fold(first)[:1] and adult and len(g.split(" ")[0]) <= 2: kind = "initial"
        elif born and r["year"] - born < 22 and len(households) <= RARE: kind = "family"
        else: continue
        hits[(kind, r["street"].lstrip("~"), r["number"])].append(r)
    for (kind, st, num), rs in hits.items():
        cands.append({"name": p["name"], "wiki": p.get("wiki"), "born": born, "died": died, "desc": p.get("desc"), "connection": p.get("connection"),
                      "confidence": kind, "address": f"{num} {st.title()}", "years": sorted({r['year'] for r in rs}),
                      "listings": sorted({f"{r['year']}: {r['given']} {r['surname']} ({r['tenure']}) {r['occ']}".strip() for r in rs})[:8],
                      "town_households_with_surname": len(households)})
order = {"direct": 0, "initial": 1, "family": 2}
cands.sort(key=lambda c: (order[c["confidence"]], c["name"]))
json.dump(cands, open(os.path.join(OUT, "data", "notable_candidates.json"), "w"), indent=1)
print(f"{len(people)} people, {len(cands)} candidate addresses:", collections.Counter(c["confidence"] for c in cands))
