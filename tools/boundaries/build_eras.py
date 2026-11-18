"""Build approximate historic jurisdiction outlines (data/boundaries.js) and today's town
outline (data/boundary.js) from Census TIGERweb municipal boundaries.

No historic boundary files exist for these old townships, so each era's outline is a union of
TODAY's municipalities that grew out of it. Every outline is labelled "approximate" on the site.
The eras and their member towns are listed in ERAS below (sources: docs/research report,
"jurisdiction timeline"). Requires: pip install shapely

Usage: python3 tools/boundaries/build_eras.py [cache_dir]
"""
import json, os, sys, urllib.request, urllib.parse
from shapely.geometry import shape, mapping, Polygon, LineString
from shapely.ops import unary_union, split

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "archive", "_tmp", "boundaries")
os.makedirs(CACHE, exist_ok=True)
SRC = os.path.join(CACHE, "essex_county_subdivisions.geojson")
URL = ("https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/22/query?"
       + urllib.parse.urlencode({"where": "STATE='34' AND COUNTY='013'", "outFields": "NAME,BASENAME",
                                 "outSR": "4326", "f": "geojson"}))
if not os.path.exists(SRC):
    print("downloading TIGERweb county subdivisions"); urllib.request.urlretrieve(URL, SRC)
towns = {f["properties"]["NAME"]: shape(f["geometry"]) for f in json.load(open(SRC))["features"]}
T = lambda *names: unary_union([towns[n] for n in names]).buffer(0.0004).buffer(-0.0004)  # close slivers

SO = towns["South Orange village"]
# The 1869 Village did not yet include the land east of Centre Street (annexed Feb 10, 1891).
# Clip along Centre Street (OSM geometry, north of South Orange Avenue) — approximate.
centre = [(-74.24214, 40.74654), (-74.24189, 40.74695), (-74.2386, 40.75182)]
east_of_centre = Polygon(centre + [(-74.2386, 40.77), (-74.20, 40.77), (-74.20, 40.74654)])
village1869 = SO.difference(east_of_centre)

ERAS = [  # id, from, to, name shown, polygon, note
  ("newark", 1666, 1806, "Newark Township", T("Newark city", "East Orange city", "City of Orange township",
     "West Orange township", "South Orange village", "Maplewood township", "Irvington township", "Glen Ridge borough",
     "Bloomfield township", "Montclair township", "Belleville township", "Nutley township"),
   "Newark's lands ran from the bay to the mountain. Outline approximated from the towns later carved out of it."),
  ("orange", 1807, 1834, "Orange Township", T("City of Orange township", "East Orange city", "West Orange township",
     "South Orange village"), "Orange Township was set off from Newark in 1806 (first town meeting April 13, 1807). Approximate."),
  ("split", 1835, 1860, "Orange Township and Clinton Township", SO,
   "From 1834–35 today's South Orange was divided between Orange Township and the new Clinton Township. The dividing line is not mapped; the outline shown is today's Village."),
  ("township", 1861, 1903, "South Orange Township", T("South Orange village", "Maplewood township"),
   "South Orange Township (1861) took in today's South Orange and Maplewood, plus Vailsburg until 1894. Approximate."),
  ("village1869", 1869, 1890, "Village of South Orange", village1869,
   "The 1869 Village, before it annexed the land east of Centre Street in 1891. Approximate."),
  ("village", 1891, 2026, "Village of South Orange", SO, "Today's Village boundary (U.S. Census TIGER)."),
]

def gj(geom, tol=0.00008):
    return mapping(geom.simplify(tol, preserve_topology=True))

def rnd(o):
    if isinstance(o, (list, tuple)): return [rnd(x) for x in o]
    return round(o, 5) if isinstance(o, float) else o

INNER = {"village1869"}  # drawn as lines inside the era's township, not as its outline
out = [dict({"id": i, "from": a, "to": b, "name": n, "note": note, "geometry": rnd(gj(g))}, **({"inner": True} if i in INNER else {})) for i, a, b, n, g, note in ERAS]
with open(os.path.join(ROOT, "data", "boundaries.js"), "w") as f:
    f.write("// Approximate historic jurisdiction outlines, built by tools/boundaries/build_eras.py from U.S. Census TIGER\n"
            "// municipal boundaries (public domain). Historic lines are unions of today's towns, not surveyed lines.\n"
            "window.MW_JURISDICTIONS = " + json.dumps(out, separators=(",", ":")) + ";\n")
with open(os.path.join(ROOT, "data", "boundary.js"), "w") as f:
    f.write("// South Orange Village boundary, U.S. Census TIGER (public domain).\n"
            "window.MW_BOUNDARY = " + json.dumps(rnd(gj(SO, 0.00003)), separators=(",", ":")) + ";\n")
for e in out: print(e["id"], e["from"], e["to"], e["geometry"]["type"])
print("bounds of today's town:", [round(x, 4) for x in SO.bounds])
