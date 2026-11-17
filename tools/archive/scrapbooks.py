"""Find the town's street addresses mentioned in the library's newspaper-clipping scrapbooks (1922-1980)
and crop the clipping around each mention. These are public news stories, so they are kept even after
1950 (the 1950 cutoff applies to directory listings of private residents)."""
import os, re, sys, json, html, subprocess, time
from common import BASE, OUT, slug, load_streets, canon_street, SLUG, DIG, UA

STREETS = load_streets()
TMP = os.path.join(OUT, "_tmp"); os.makedirs(TMP, exist_ok=True)
ADDR = re.compile(r"\b(\d{1,4})\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(road|Road|avenue|Avenue|ave|Ave|av|street|Street|place|Place|terrace|Terrace|drive|Drive|lane|Lane|court|Court|parkway|Parkway|Rd|St|Pl)\b\.?")
BLOCK = re.compile(r'<block xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</block>', re.S)
PAGE = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', re.S)
WORD = re.compile(r"<word[^>]*>(.*?)</word>", re.S)

def download(url, dst):
    for _ in range(25):
        r = subprocess.run(["curl", "-sS", "-m", "300", "-C", "-", "-A", UA, "-o", dst, BASE + url])
        if r.returncode == 0: return dst
        time.sleep(4)
    raise RuntimeError("download failed " + url)

h = subprocess.run(["curl", "-sS", "-m", "60", f"{BASE}/{SLUG}/views/view.php?id={DIG['scrapbooks_id']}"], capture_output=True, text=True).stdout
books = re.findall(rf"file=(/{SLUG}/data/scrapbooks/[^\"&]+\.pdf)", h)
out_path = os.path.join(OUT, "data", "scrapbooks.json")
found = json.load(open(out_path)) if os.path.exists(out_path) else []
done = {f["book"] for f in found}
for b in books:
    year = re.search(r"/(\d{4})", b).group(1)
    if b in done: continue
    pdf = os.path.join(TMP, os.path.basename(b))
    download(b, pdf)
    bb = subprocess.run(["pdftotext", "-bbox-layout", pdf, "-"], capture_output=True, text=True, errors="ignore").stdout
    hits = []
    for pno, (pw, ph, body) in enumerate(PAGE.findall(bb), 1):
        for x0, y0, x1, y1, inner in BLOCK.findall(body):
            text = html.unescape(" ".join(WORD.findall(inner)))
            for m in ADDR.finditer(text):
                st = canon_street(f"{m.group(2)} {m.group(3)}", STREETS)
                if not st: continue
                hits.append({"book": b, "year": year, "page": pno, "number": m.group(1), "street": st,
                             "snippet": text[max(0, m.start() - 220): m.end() + 220], "bbox": [float(x0), float(y0), float(x1), float(y1)], "pw": float(pw), "ph": float(ph)})
    # crop each hit: the text block, padded, capped to a readable size
    from PIL import Image
    pages = {}
    for k, hit in enumerate(hits):
        p = hit["page"]
        if p not in pages:
            base = os.path.join(TMP, f"sb_{year}_{p}")
            subprocess.run(["pdftoppm", "-r", "110", "-gray", "-jpeg", "-singlefile", "-f", str(p), "-l", str(p), pdf, base], check=True)
            pages = {p: Image.open(base + ".jpg")}; os.remove(base + ".jpg")
        im = pages[p]; s = 110 / 72
        x0, y0, x1, y1 = hit["bbox"]; pad = 30
        box = (max(0, int((x0 - pad) * s)), max(0, int((y0 - pad) * s)), min(im.width, int((x1 + pad) * s)), min(im.height, int((y1 + pad) * s)))
        if box[3] - box[1] > 900: box = (box[0], box[1], box[2], box[1] + 900)
        rel = os.path.join("docs", "scrapbook", year, f"{slug(hit['street'])}-{hit['number']}-p{p}-{k}.jpg")
        os.makedirs(os.path.dirname(os.path.join(OUT, rel)), exist_ok=True)
        im.crop(box).save(os.path.join(OUT, rel), quality=72)
        hit["crop"] = rel; hit["src"] = f"https://www.digifind-it.com/IDIViewer/web/viewer.html?file={b}#page={p}"
        del hit["bbox"]
    found += hits or [{"book": b, "year": year, "none": True}]
    json.dump(found, open(out_path, "w"))
    os.remove(pdf)
    print(f"{year}: {len(hits)} address mentions", file=sys.stderr)
