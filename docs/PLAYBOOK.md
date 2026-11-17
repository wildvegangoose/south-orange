# Playbook: building a "Through Time" history site for a town

This is how *Maplewood Through Time* was built. Follow it to make the same site for another town, for example South Orange. It covers the order of work, the sources, the tools in this repo, the decisions you'll need to make, and the mistakes we already made so you don't have to.

> **Shortcut for South Orange:** the city directories Maplewood used are the *Oranges* directories, which also list South Orange residents with the town code `SO`. Pointing `tools/town.json` at the code `SO` (and at South Orange's own library archive, if it has one) gets you most of the way there.

---

## 0. What you end up with

| Page | File | What it needs |
|---|---|---|
| Time Machine (animated panorama + year slider) | `index.html`, `js/scene.js`, `js/home.js` | Era stories + dated places (`js/data.js`) |
| Explore the Map | `explore.html`, `js/explore.js` | Places, township boundary, historic map overlays |
| Your House's Story | `house.html`, `js/house.js`, `js/archive.js` | Geocoder, neighborhood sections, library archive index |
| Landmarks | `landmarks.html`, `landmark.html`, `js/landmark.js`, `js/landmarks-data.js` | Researched landmark histories, photos, "through the ages" crops |
| Notable People | `people.html`, `js/people.js`, `js/people-data.js` | People list + verified directory matches |
| Timeline / Research & Sources | `timeline.html`, `research.html` | Same data as above |

It is a static site (no build step), hosted on GitHub Pages. To preview it, run `python3 -m http.server`.

## 1. Set up the repo for the new town

1. Copy this repository (or fork it) to a new repo, e.g. `south-orange`.
2. Edit **`tools/town.json`**: name, bounding boxes, the library's Digifind slug and collection ids, directory town codes, map layers. Each key is commented.
3. Replace **`data/boundary.js`** with the town's boundary from OpenStreetMap:
   ```bash
   curl -A "your-site/0.1" "https://nominatim.openstreetmap.org/search?city=South+Orange&county=Essex+County&state=New+Jersey&country=USA&format=json&limit=1&polygon_geojson=1&polygon_threshold=0.0002"
   ```
   Make sure the result is `class: boundary`; the first try for Maplewood returned a road called "Maplewood Avenue". Then write it as `window.MW_BOUNDARY = {...}`.
4. In the front end, replace the remaining hard-coded town values:
   - `js/house.js`: the `BBOX` constant and the Photon `bbox=`
   - `js/explore.js`: the `BOUNDS` of the map overlays (printed by `tools/maps/build_topos.py`)
   - the site title and brand in `js/common.js`
   - page `<title>`s and the hero text

## 2. Research the town's history first

Do this before writing any code. Everything on the site cites a source, and every fact lives in `js/data.js` (`MW.sources`, `MW.eras`, `MW.places`, `MW.sections`, `MW.oldRoads`).

**Sources that were gold for Maplewood, with likely South Orange equivalents:**

| Kind | Maplewood | South Orange |
|---|---|---|
| Historical society blog/posts | durandhedden.org (also covers South Orange) | Durand-Hedden, South Orange Historical & Preservation Society |
| Preservation commission + **designation report PDFs** | historicmaplewood.com `/wp-content/uploads/*Designation-Report.pdf` | South Orange Historic Preservation Commission |
| Wikipedia town article + "People from …" category | ✓ | ✓ |
| National Register (NPGallery, Wikipedia NRHP list for Essex County) | Memorial Park, Municipal Bldg, Village HD | check the same list |
| Library history panels / digital archive | maplewoodlibrary.org → digifind-it.com/maplewood | South Orange Public Library |
| Club/institution histories (PDFs) | Maplewood Country Club history PDF | Seton Hall, Orange Lawn Tennis Club, etc. |

**How we worked:**
- **Read whole pages in parallel.** Use parallel "web-fetch" research tasks, one per source, and ask each for dated facts with addresses, as JSON Lines where possible.
- **Download big PDFs directly.** Designation reports, NRHP nominations and exhibit panels are often too large for the reading tool. Fetch them with `curl -C -` (resumable) and read them with `pdftotext`.
- **Check the town.** The 40 South News "Maplewood History" column is about **Maplewood, Missouri**. Make sure every source is about the right state.
- **Write down conflicts** (e.g., when the town was named, or the name of a station) in the text rather than picking one silently.

**Content checklist for `js/data.js`:**
- `MW.eras`: about 10 eras with 2–3 paragraph stories, each with sources. Narrative passages are labeled as synthesis on the site.
- `MW.places`: 50+ dated places/events with lat/lon. Geocode with Nominatim (1 request/second, real User-Agent) or Photon, and record the coordinates.
- `MW.sections`: historic neighborhoods with a "colonial" and a "growth" paragraph. The house page uses whichever is nearest.
- `MW.oldRoads`: polylines of historic roads, with the date each appears.
- `MW.census`: population by census year (Wikipedia infobox/demographics).

## 3. The Time Machine panorama (`js/scene.js`)

This is an illustrated SVG where every building is an `item(x, y, fromYear, toYear, drawing, {place})`. For a new town:
- Keep the drawing kit (the `B`, `tree`, `V` and `T` objects) and change the `front` and `back` arrays to the new town's landmarks and their years.
- The ridge, river and railroad are generic. Move or remove them to match the town's geography.
- Clickable items reference `MW.places` ids.
- The panorama is an artistic interpretation, and the site says so. Don't present it as a record.

## 4. The library archive pipeline (`tools/archive/`)

This only works if the town's library uses **Digifind-IT** (digifind-it.com/<slug>). Open its `views/view.php?id=N` pages to find the collection ids, then put them in `town.json`.

```bash
cd tools/archive
python3 realestate.py     # real-estate listing cards: index + render page 1/2 to JPEG (about 6,000 cards: ~1.5 h)
python3 trim_cards.py     # trim the white margins of full-page scans
python3 directories.py    # city directories -> residents with town code, plus crops of the scanned lines (19 years: ~2 h)
python3 scrapbooks.py     # newspaper scrapbooks -> address mentions + cropped clippings
python3 shrink_cards.py   # resize/grayscale cards so the site stays under GitHub Pages' 1 GB
python3 build_index.py    # merge -> archive/data/street_index.json + archive/data/streets/<street>.json
```

**What we learned:**
- **Directories have a text layer.** Entries end with `h|r|bds <number> <street> <TOWNCODE>`, and wrapped lines must be re-joined. `pdftotext -bbox-layout` gives word positions, which is how we crop the scanned line.
- **Before about 1908, houses had no numbers** ("Baker n Maplewood av"), so those years can't be matched to an address.
- **OCR problems and how we handle them:**
  - Spaced-out letters ("V A LLE Y" → Valley): fixed in `build_index.py` by matching letters only against the real-estate street list.
  - Dropped ditto dashes, which assign the wrong surname: fixed by harmonizing surnames across years for the same given name at an address.
  - Directory headings mistaken for surnames ("Oranges", "Ampere"): handled by `not_surnames` in `town.json`.
- **Real-estate cards** are photos *or* typed sale cards, and the text layer is just the address. Render them and show the image.
- **Scrapbooks:**
  - The files are 40 MB+ and the server resets connections, so download with `curl -C -` in a retry loop.
  - Address mentions found this way are public news stories.
- **Be polite:** 2–5 connections and short pauses. When the server stalls, a 30-second timeout beats a 3-minute one; switching cut the card render from about 10/min to about 115/min.
- **Size:** about 940 MB of archive data at first. GitHub Pages limits a site to **1 GB**, so run `python3 shrink_cards.py` before publishing. It resizes card images to 780 px and converts them to grayscale (780 MB → 584 MB).

**Decisions we made, which you should revisit with the site owner:**
- **Names up to 1950 only**, from `town.json` `name_cutoff_year`. Public news stories are the exception.
- **The library's permission.** The data is public on the library's site, but ask them before publishing their scans. Credit them on every card.

## 5. Historic map overlays (`tools/maps/build_topos.py`)

1. **Find the USGS historical topo quads covering the town:**
   ```bash
   curl "https://tnmaccess.nationalmap.gov/api/v1/products?datasets=Historical%20Topographic%20Maps&bbox=W,S,E,N&max=150&outputFormat=JSON"
   ```
   Use the `urls.GeoTIFF` of each item. Towns near a quad corner need 2–4 quads per year.
2. **Check every edition's real date.** Open the item's `metaUrl` (ScienceBase) and read the `End` date. A sheet titled "1955" can be a 1972 or 1982 photo-revision (ours showed I-78). We picked the edition whose End date matches the survey year.
3. Put the quads in `town.json` → `topo_layers`, then run `python3 tools/maps/build_topos.py` (needs `apt-get install gdal-bin`).
4. **New Jersey aerials** stream live from the NJ Office of GIS WMS (`https://img.nj.gov/imagerywms/<Layer>`): BlackWhite1930, Infrared1995, Infrared2002, Natural2007/2010/2012/2015/2017/2020. Other states have similar services.
5. In `js/explore.js`, edit the `HIST` list (year, file or WMS layer, caption) and `BOUNDS`.

## 6. Landmark pages (`js/landmarks-data.js`, `tools/landmarks/`)

- **Research each landmark separately** (see the sources in §2). The preservation commission's designation reports gave exact addresses, owner chains and dates. Each entry has `sections`, `facts`, `timeline`, `photos`, `photoLinks` and `sources`.
- **Photos:** only public domain or Creative Commons.
  - Historic American Buildings Survey (HABS) photos on Wikimedia Commons are public domain; search "<town> HABS".
  - For Commons photos, record the author and license.
  - Download through `tools/landmarks/fetch_photos.sh` (slow retries: Commons answers bursts with HTTP 429), listing files in `photos.tsv`.
  - Copyrighted photos (historical society, Cinema Treasures) go in `photoLinks` as links, never copies.
- **"Through the ages" crops:**
  ```bash
  TOPO_DIR=archive/_tmp/topo python3 tools/landmarks/ages.py id:lat:lon ...
  ```
  This writes 11 images per landmark (USGS maps + NJ aerials) to `img/ages/<id>/`.
- Link landmarks from map pins by giving a landmark `place: "<MW.places id>"`.

## 7. House stories from the web (`js/webstories.js`)

- **Collect published stories that name a street address.** Sources: historical-society posts, preservation news (Village Green-type local news, often paywalled), Matters Magazine, Queer Places (elisarolle.com, which lists addresses in page headers), NJ news sites.
- **Keep only stories with real historical significance or a genuinely interesting event**, tagged Landmark, Notable person, Remarkable event, Architecture or Everyday life.
- **Summaries are in your own words**, and every card links to the original.

## 8. Notable people (`tools/archive/notables.py`, `js/people-data.js`)

1. **Gather the people:** the Wikipedia town article's "Notable people" section plus the "People from <Town>, New Jersey" category, with names, links, birth/death years and a one-line description.
2. **Cross-check with the directories:**
   ```bash
   python3 tools/archive/notables.py   # writes archive/data/notable_candidates.json
   ```
   The matcher only considers people born before 1946, since nobody younger can appear in 1908–1950 directories. Each candidate gets a confidence: `direct`, `initial` or `family`.
3. **Review every candidate by hand** against the biography (parents' names, occupation, employer town). Examples from Maplewood:
   - "Igor J. Karassik, mech eng, Harrison" matched his employer, Worthington, which was in Harrison, NJ. Accept.
   - A 1934 "William Lowell, salesman" is not the dentist. Reject.
   - Paul Ehrlich's father was William, and no William Ehrlich is listed. Reject.
   - A surname-only match for someone's childhood home is labeled "probably".
4. **Privacy rule:** only verified, pre-1950, deceased people get a house link. Living people and anyone who lived there after 1950 are listed without addresses. We also left out people notable mainly for extremism or crimes. That was an editorial choice; record yours.

## 9. Publish

- Run `git add -A` and push. Pages: Settings → Pages → Deploy from a branch → the branch, `/ (root)`. A `.nojekyll` file makes Pages serve files as-is.
- Keep the published site under 1 GB: run `tools/archive/shrink_cards.py`.
- **Geocoding** runs in the visitor's browser: Nominatim first, Photon as the fallback. Both rate-limit heavy use from one IP, which is why testing from one machine all day eventually fails.

## 10. Order of work and rough effort (Maplewood)

| Step | Effort |
|---|---|
| Research + `data.js` | 1–2 h |
| Site pages | 2–3 h |
| Map overlays | 1 h |
| Card render | ~1.5 h unattended |
| Directories | ~2 h unattended |
| Scrapbooks | ~1 h unattended |
| Landmarks research + pages | 2 h |
| Web stories + notable-people cross-check | 2 h |

**Run long jobs in the background with an auto-commit loop,** because a cloud session that goes idle loses anything not pushed:
```bash
while pgrep -f "directories.py|realestate.py" >/dev/null; do sleep 900; python3 tools/archive/build_index.py; git add -A; git commit -qm "Archive auto-save"; git push; done
```

## Known gaps to improve next time

- The Lenape-trail description: Ridgewood Road and Valley Street run parallel to the coast. The routes toward Newark Bay were the east–west trails (South Orange Avenue, Clinton Avenue, Springfield Avenue), plus Boyden Avenue, "the road to the Harbor". Map those instead of implying the ridge roads reached the bay.
- Five landmark houses have only street-level coordinates, because the geocoders lacked their house numbers.
- People who lived in town after 1950 need other sources (obituaries) to say more than "lived here".
