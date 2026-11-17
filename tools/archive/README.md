# Library archive pipeline

These scripts turn the Maplewood Memorial Library's digital archive (hosted by Digifind-IT) into per-address
data for the **Your House's Story** page. All output goes to `archive/`, which is committed with the site
(working files in `archive/_tmp/` are ignored).

```bash
cd tools/archive
python3 realestate.py      # index + render the real-estate listing cards (about 6,000 cards on 228 streets)
python3 trim_cards.py      # trim blank margins from rendered cards
python3 directories.py     # extract Maplewood/Hilton residents from the 1908–1950 city directories, with scanned-line crops
python3 build_index.py     # merge everything into archive/data/street_index.json + archive/data/streets/<street>.json
```

What the scripts do and don't do:

* **Directories:** only 1908–1950 are processed. Earlier volumes list houses without numbers ("Baker n Maplewood av"), and later names are left out by design.
* **No scans kept:** downloaded PDFs are deleted after processing. Only the extracted facts and small crops of the relevant directory lines remain.
* **Polite crawling:** requests are spaced out and use at most two or three connections.
* **Page behavior:** `js/archive.js` shows the archive section only when `archive/` exists.
