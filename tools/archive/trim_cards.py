"""Trim the blank margins around rendered real-estate cards (some are full-page scans with a small card)."""
import glob, os, sys
from PIL import Image, ImageOps
from common import OUT

done = os.path.join(OUT, "_tmp", "trimmed.txt")
seen = set(open(done).read().split("\n")) if os.path.exists(done) else set()
n = 0
with open(done, "a") as log:
    for p in glob.glob(os.path.join(OUT, "realestate", "*", "*.jpg")):
        if p in seen: continue
        im = Image.open(p); g = ImageOps.grayscale(im)
        mask = g.point(lambda v: 255 if v < 215 else 0)
        bb = mask.getbbox()
        if bb:
            w, h = im.size; pad = int(0.015 * max(w, h))
            bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(w, bb[2] + pad), min(h, bb[3] + pad))
            if (bb[2] - bb[0]) * (bb[3] - bb[1]) < 0.8 * w * h:
                im.crop(bb).save(p, quality=80); n += 1
        log.write(p + "\n")
print(f"trimmed {n} images", file=sys.stderr)
