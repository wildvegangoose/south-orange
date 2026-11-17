"""Index + render the library's real-estate (multiple listing) cards: one photo card per house, 1920s-1980s."""
import os, re, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from common import BASE, OUT, fetch, slug, SLUG, DIG

idx_html = fetch(f"{BASE}/{SLUG}/views/view.php?id={DIG['realestate_id']}").decode("utf-8", "ignore")
lo, hi = DIG["realestate_street_id_range"]
ids = sorted(set(int(x) for x in re.findall(r"view\.php\?id=(\d+)\b", idx_html) if lo <= int(x) <= hi))
cards, streets = [], set()
for i in ids:
    h = fetch(f"{BASE}/{SLUG}/views/view.php?id={i}").decode("utf-8", "ignore")
    for f in re.findall(rf"file=(/{SLUG}/data/realestate/[^\"&]+\.pdf)", h):
        street = f.split("/")[-2]; name = f.split("/")[-1][:-4]
        m = re.match(r"^(\d+[A-Z]?(?:-\d+)?)\s+(.*)$", name)
        num, st = (m.group(1), m.group(2)) if m else (None, name)
        streets.add(street)
        cards.append({"street": street, "number": num, "label": name, "pdf": f})
    print(f"street page {i}: {len(cards)} cards so far", file=sys.stderr)

os.makedirs(os.path.join(OUT, "data"), exist_ok=True)
json.dump(sorted(streets), open(os.path.join(OUT, "data", "streets.json"), "w"))

def render(c):
    d = os.path.join(OUT, "realestate", slug(c["street"]))
    base = os.path.join(d, slug(c["label"]))
    c["img"] = os.path.relpath(base + "-1.jpg", OUT)
    if os.path.exists(base + "-1.jpg"): return c
    pdf = base + ".pdf"
    try:
        fetch(BASE + c["pdf"], pdf, pause=0.25, timeout=30, tries=6)
        subprocess.run(["pdftoppm", "-r", "130", "-jpeg", "-jpegopt", "quality=78", "-f", "1", "-l", "2", pdf, base], check=True)
        for n in ("1", "01"):  # pdftoppm pads page numbers depending on page count
            if os.path.exists(f"{base}-{n}.jpg") and n != "1": os.rename(f"{base}-{n}.jpg", base + "-1.jpg")
        for n in ("2", "02"):
            p2 = f"{base}-{n}.jpg"
            if os.path.exists(p2):
                from PIL import Image, ImageStat
                im = Image.open(p2).convert("L")
                if ImageStat.Stat(im).stddev[0] > 6: os.rename(p2, base + "-2.jpg"); c["back"] = os.path.relpath(base + "-2.jpg", OUT)
                else: os.remove(p2)
        os.remove(pdf)
    except Exception as e:
        c["error"] = str(e)[:120]
    return c

with ThreadPoolExecutor(5) as ex:
    for k, c in enumerate(ex.map(render, cards)):
        if k % 100 == 0: print(f"rendered {k}/{len(cards)}", file=sys.stderr)
json.dump(cards, open(os.path.join(OUT, "data", "realestate.json"), "w"))
print(f"done: {len(cards)} cards across {len(streets)} streets", file=sys.stderr)
