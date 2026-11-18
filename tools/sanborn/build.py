"""Build js/sanborn-data.js: address -> Sanborn fire-insurance map sheet, from the hand-transcribed street indexes
of the two Library of Congress volumes for South Orange Village (public domain, "free to use and reuse"):
  1912:      https://www.loc.gov/item/sanborn05629_001/   (index_1912.txt)
  1912-1949: https://www.loc.gov/item/sanborn05629_002/   (index_1949.txt, the "New Index, January 1947")
loc_image_ids.json lists each volume's IIIF image ids in viewer order (from the item's ?fo=json record)."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, "..", "..")
IDS = json.load(open(os.path.join(HERE, "loc_image_ids.json")))
VOLS = {"1912": {"label": "1912", "item": "https://www.loc.gov/item/sanborn05629_001/", "res": "g3814sm.g056291912", "svc": "g3814sm_g056291912"},
        "1949": {"label": "1912–1949 (index of 1947)", "item": "https://www.loc.gov/item/sanborn05629_002/", "res": "g3814sm.g056291949", "svc": "g3814sm_g056291949"}}
out = {}
for y, v in VOLS.items():
    rows = []
    for line in open(os.path.join(HERE, f"index_{y}.txt")):
        if not line.strip() or line.startswith("#"): continue
        st, rng, sheets, note = (line.rstrip("\n").split("|") + [""])[:4]
        lo, hi = (map(int, rng.split("-")) if rng else (None, None))
        rows.append([st, lo, hi, [int(s) for s in sheets.split(",")], note])
    # sheet number -> position in the LOC viewer (sp) and IIIF id
    sheets = {}
    for i, iid in enumerate(IDS[y], 1):
        m = re.search(r"-(\d{4})$", iid)
        if m: sheets[int(m.group(1))] = [i, iid]
    out[y] = dict(v, rows=rows, sheets=sheets)
js = ("/* Sanborn fire-insurance maps of South Orange Village (Library of Congress, public domain). Built by tools/sanborn/build.py. */\n"
      "var MW = window.MW = window.MW || {};\nMW.sanbornCredit = \"Sanborn Map Company, <i>South Orange Village</i>, 1912 and 1912–1949 volumes\";\nMW.sanborn = " + json.dumps(out, separators=(",", ":")) + ";\n")
open(os.path.join(ROOT, "js", "sanborn-data.js"), "w").write(js)
print({y: (len(o["rows"]), len(o["sheets"])) for y, o in out.items()})
