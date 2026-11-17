"""Shrink rendered real-estate cards for publishing (GitHub Pages caps a site at 1 GB).
Resizes to MAX_W px wide, converts colourless scans to grayscale, recompresses. Safe to re-run."""
import glob, os
from PIL import Image, ImageStat
from common import OUT
MAX_W, QUALITY = 780, 62
before = after = 0
for p in glob.glob(os.path.join(OUT, "realestate", "*", "*.jpg")):
    before += os.path.getsize(p)
    im = Image.open(p).convert("RGB")
    if ImageStat.Stat(im.convert("HSV").split()[1]).mean[0] < 25: im = im.convert("L")
    if im.width > MAX_W: im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    im.save(p, quality=QUALITY, optimize=True, progressive=True)
    after += os.path.getsize(p)
print(f"{before/1e6:.0f} MB -> {after/1e6:.0f} MB")
