"""'Through the ages' images for landmark pages: crops of the dated historic maps and NJ aerial photos
centred on each landmark. Usage: python3 ages.py id:lat:lon [id:lat:lon ...]
Topo crops come from the georeferenced overlays (GeoTIFFs in TOPO_DIR, built by the map pipeline);
aerials are requested from the NJ Office of GIS WMS."""
import os, sys, math, subprocess, urllib.request, urllib.parse
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "img", "ages")
TOPO_DIR = os.environ.get("TOPO_DIR", "")
TOPOS = [("1888", "topo1888"), ("1898", "topo1898"), ("1906", "topo1906"), ("1921", "topo1921"), ("1947", "topo1947"), ("1955", "topo1958"), ("1972", "topo1972")]
AERIALS = [("1930", "BlackWhite1930"), ("1995", "Infrared1995"), ("2007", "Natural2007"), ("2020", "Natural2020")]
W, H = 640, 440  # output px
HALF = {"62500": 700, "24000": 380, "aerial": 260}  # half-width of window in metres, by source scale
FORCE = os.environ.get("FORCE") == "1"

def merc(lat, lon):
    x = lon * 20037508.34 / 180
    y = math.log(math.tan((90 + lat) * math.pi / 360)) * 20037508.34 / math.pi
    return x, y

for arg in sys.argv[1:]:
    lid, lat, lon = arg.split(":"); lat, lon = float(lat), float(lon)
    x, y = merc(lat, lon); k = 1 / math.cos(math.radians(lat))  # metres -> mercator units
    d = os.path.join(OUT, lid); os.makedirs(d, exist_ok=True)
    for label, name in TOPOS:
        half = HALF["62500" if int(label) < 1940 else "24000"]; hw, hh = half * k, half * k * H / W
        src = os.path.join(TOPO_DIR, name + ".tif"); dst = os.path.join(d, f"{label}-map.jpg")
        if not os.path.exists(src) or (os.path.exists(dst) and not FORCE): continue
        subprocess.run(["gdal_translate", "-q", "-projwin", str(x - hw), str(y + hh), str(x + hw), str(y - hh), "-outsize", str(W), str(H),
                        "-b", "1", "-b", "2", "-b", "3", "-of", "JPEG", "-co", "QUALITY=80", src, dst], check=True)
        for ext in (".aux.xml",):
            if os.path.exists(dst + ext): os.remove(dst + ext)
    for label, layer in AERIALS:
        hw, hh = HALF["aerial"] * k, HALF["aerial"] * k * H / W
        dst = os.path.join(d, f"{label}-aerial.jpg")
        if os.path.exists(dst) and not FORCE: continue
        q = urllib.parse.urlencode({"SERVICE": "WMS", "VERSION": "1.1.1", "REQUEST": "GetMap", "LAYERS": layer, "STYLES": "", "SRS": "EPSG:3857",
                                    "BBOX": f"{x-hw},{y-hh},{x+hw},{y+hh}", "WIDTH": W, "HEIGHT": H, "FORMAT": "image/jpeg"})
        data = urllib.request.urlopen(f"https://img.nj.gov/imagerywms/{layer}?{q}", timeout=60).read()
        open(dst, "wb").write(data)
    print(lid, len(os.listdir(d)), "images")
