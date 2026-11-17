"""Build the dated historic-map overlays (img/maps/topo*.webp) from USGS historical topographic maps.

Reads tools/town.json: "map_bbox" (area to cover) and "topo_layers" (which quads make each layer).
For each quad: download the GeoTIFF, expand palette to RGB, crop to the quad's neatline (so map
collars don't overlap neighbours), then mosaic all quads of a layer into Web Mercator over map_bbox
and write a WebP with transparency. Leaflet shows it with L.imageOverlay(url, bounds).

Requires GDAL command-line tools (apt-get install gdal-bin).
Usage: python3 tools/maps/build_topos.py [workdir]
"""
import json, os, subprocess, sys, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TOWN = json.load(open(os.path.join(ROOT, "tools", "town.json")))
WORK = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "archive", "_tmp", "topo")
OUT = os.path.join(ROOT, "img", "maps")
BASE = "https://prd-tnm.s3.amazonaws.com/StagedProducts/Maps/HistoricalTopo/GeoTIFF/"
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)

def run(*a): subprocess.run(a, check=True)

def merc(lon, lat):
    r = subprocess.run(["gdaltransform", "-s_srs", "EPSG:4326", "-t_srs", "EPSG:3857", "-output_xy"],
                       input=f"{lon} {lat}\n", capture_output=True, text=True, check=True).stdout.split()
    return float(r[0]), float(r[1])

b = TOWN["map_bbox"]
x0, y0 = merc(b["west"], b["south"]); x1, y1 = merc(b["east"], b["north"])

for name, layer in TOWN["topo_layers"].items():
    if name.startswith("_"): continue
    crops = []
    for path, w, s, e, n in layer["quads"]:
        base = os.path.join(WORK, os.path.basename(path).replace("%20", "_"))
        if not os.path.exists(base):
            print("downloading", path); urllib.request.urlretrieve(BASE + path, base)
        src = base
        if "Color Table" in subprocess.run(["gdalinfo", base], capture_output=True, text=True).stdout:
            src = base[:-4] + "_rgb.tif"
            if not os.path.exists(src): run("gdal_translate", "-q", "-expand", "rgb", base, src)
        crop = base[:-4] + "_crop.tif"
        if not os.path.exists(crop):
            run("gdalwarp", "-q", "-overwrite", "-t_srs", "EPSG:4326", "-te", str(w), str(s), str(e), str(n),
                "-r", "bilinear", "-dstalpha", "-co", "COMPRESS=DEFLATE", src, crop)
        crops.append(crop)
    mosaic = os.path.join(WORK, name + ".tif")
    res = str(layer["res"])
    run("gdalwarp", "-q", "-overwrite", "-t_srs", "EPSG:3857", "-te", str(x0), str(y0), str(x1), str(y1),
        "-tr", res, res, "-r", "bilinear", *crops, mosaic)
    run("gdal_translate", "-q", "-of", "WEBP", "-co", "QUALITY=78", mosaic, os.path.join(OUT, name + ".webp"))
    print(name, "->", os.path.join("img", "maps", name + ".webp"))

print("Overlay bounds for js/explore.js:", [[b["south"], b["west"]], [b["north"], b["east"]]])
print("Landmark 'through the ages' crops: TOPO_DIR=" + WORK + " python3 tools/landmarks/ages.py id:lat:lon ...")
