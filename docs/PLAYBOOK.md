# Playbook: building a "Through Time" history site for a town

This is how *Maplewood Through Time* and *South Orange Through Time* were built. Follow it to make the same site for another town. It covers the order of work, the sources, the tools in this repo, the decisions you'll need to make, and the mistakes we already made so you don't have to.

> **Neighbors share sources.** The city directories on Maplewood's library archive are the *Oranges* directories, which list Maplewood (`M`, `H`), South Orange (`SO`), Orange (`O`), East Orange (`EO`) and West Orange (`WO`) households. A town with no archive of its own can use a neighbor's: South Orange has no Digifind archive and uses Maplewood's with the code `SO`. Likewise one Sanborn atlas often covers several towns (§4c).

**Licensing rule (owner's decision, Nov 2026): use public-domain sources and items marked "no known restrictions"; omit sources whose owners state specific reproduction restrictions** (for example Seton Hall's postcards). Sources with no stated license (a library wiki) get links, not copies.

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
3. Replace **`data/boundary.js`** with the town's boundary. The simplest source is the Census (TIGERweb county subdivisions, layer 22), which `tools/boundaries/build_eras.py` downloads anyway (§5b). Or use OpenStreetMap:
   ```bash
   curl -A "your-site/0.1" "https://nominatim.openstreetmap.org/search?city=South+Orange&county=Essex+County&state=New+Jersey&country=USA&format=json&limit=1&polygon_geojson=1&polygon_threshold=0.0002"
   ```
   Make sure the result is `class: boundary`; the first try for Maplewood returned a road called "Maplewood Avenue". Then write it as `window.MW_BOUNDARY = {...}`.
4. In `js/data.js`, set **`MW.town`** (name, siteTitle, tagline, center, geocodeSuffix, todayLabel, and `neighbor` for a linked sister site). The nav, footer, house search and Explore map read it.
5. In the front end, replace the remaining hard-coded town values:
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

**No real-estate collection?** `build_index.py` and the street matcher need `archive/data/streets.json` (normally written by `realestate.py`). South Orange built it from Census TIGER roads clipped to the town polygon (TIGERweb Transportation layer 8 "Local Roads", query by envelope, keep names whose lines intersect the boundary, expand "Ave"→"AVENUE", "1st"→"FIRST").

**What we learned:**
- **Multi-town directories (the Oranges volumes, 1920s on) need the column-aware parser** in `directories.py`. Pages have one or two text columns plus advertisements in the margins, and wrapped lines are *indented*. The parser finds each column's left edge from the ditto-dash lines: a line at the edge starts an entry, an indented line continues it, anything else (ads, running heads) is skipped. Before this fix, indented continuations like "Orange av SO" or "Franklin av WO" became fake surnames ("Orange", "Eo", "Park"), on about a third of Maplewood's listings. Re-running Maplewood with the fix gave 85,700 listings instead of 77,600, with real names.
- **Keep street directions.** "Ridgewood rd S" and "Ridgewood rd N" are different streets with separate numbering; the parser turns them into "South/North Ridgewood Road".
- **Directories have a text layer.** Entries end with `h|r|bds <number> <street> <TOWNCODE>`, and wrapped lines must be re-joined. `pdftotext -bbox-layout` gives word positions, which is how we crop the scanned line.
- **Before about 1908, houses had no numbers** ("Baker n Maplewood av"), so those years can't be matched to an address.
- **OCR problems and how we handle them:**
  - Spaced-out letters ("V A LLE Y" → Valley): fixed in `build_index.py` by matching letters only against the real-estate street list.
  - Dropped ditto dashes, which assign the wrong surname: fixed by harmonizing surnames across years for the same given name at an address.
  - Directory headings mistaken for surnames ("Oranges", "Ampere"): handled by `not_surnames` in `town.json`; `build_index.py` blanks any left over (`HEADINGS`) rather than show them as names.
  - The surname vote accepts a clear plurality (3+ votes and twice the runner-up), so one family across 8 years beats a few misreads.
  - Some page renders come back truncated; the crop step tolerates them (`ImageFile.LOAD_TRUNCATED_IMAGES`).
- **Real-estate cards** are photos *or* typed sale cards, and the text layer is just the address. Render them and show the image.
- **Scrapbooks:**
  - The files are 40 MB+ and the server resets connections, so download with `curl -C -` in a retry loop.
  - Address mentions found this way are public news stories.
- **Be polite:** 2–5 connections and short pauses. When the server stalls, a 30-second timeout beats a 3-minute one; switching cut the card render from about 10/min to about 115/min.
- **Size:** about 940 MB of archive data at first. GitHub Pages limits a site to **1 GB**, so run `python3 shrink_cards.py` before publishing. It resizes card images to 780 px and converts them to grayscale (780 MB → 584 MB).

**Decisions we made, which you should revisit with the site owner:**
- **Names up to 1950 only**, from `town.json` `name_cutoff_year`. Public news stories are the exception.
- **The library's permission.** The data is public on the library's site, but ask them before publishing their scans. Credit them on every card.

## 4b. Historic newspapers from the Library of Congress (`tools/archive/news_loc.py`)

Chronicling America (loc.gov) is public domain and searchable. `news_loc.py` searches every street in `streets.json` together with the town name (1869–1963), downloads each page's ALTO OCR, and keeps every "<number> <street>" within ~400 characters of the town name. Each mention keeps the date, paper, a snippet, the page link and the word box, which the house page turns into a crop from the LOC IIIF server (`/pct:x,y,w,h/500,/0/default.jpg`). `build_index.py` merges them into each house's `news`.

- Configure it in `town.json` → `news`: `phrases` (search term), `near` (names that must sit near the address, e.g. `["maplewood", "hilton"]`), `states` (filter for common town names like Maplewood), `skip_streets` (names too common to search).
- **ALTO text:** take the page's IIIF service id from the search result's `image_url` and fetch `https://tile.loc.gov/storage-services/service/<id with / for :>.xml`. The chroniclingamerica.loc.gov `ocr.txt` URLs are behind a bot wall.
- **It is slow.** The loc.gov search often answers in 30–60 s or with HTTP 520. Two workers (`REVERSE=1` for the second) and a cache per street make it resumable; plan on several hours per town.
- Results are labeled "Classified ad" when the snippet looks like a boarding-house or sale ad; society news is the gold (weddings, guests, deaths at a numbered address).

## 4c. Sanborn fire-insurance maps (`tools/sanborn/`)

The Library of Congress Sanborn collection is public domain. One volume can cover several towns: the 1912 "South Orange" atlas includes South Orange Township (today's Maplewood), and the 1912–1949 volume covers South Orange Village and Maplewood Township.

1. Find the volume (`https://www.loc.gov/item/sanbornNNNNN_00X/?fo=json`); record each image id in viewer order (`loc_image_ids.json`).
2. **Transcribe the street index sheet by hand** into `index_<year>.txt` (`STREET|from-to|sheets|note`, one row per range). Crop the index at 50% into columns and read them; it took about an hour per volume. Use the town's street spellings (KENDALL not KENDAL).
3. `python3 tools/sanborn/build.py` → `js/sanborn-data.js`. `js/sanborn.js` matches a house number to its sheet (same-parity range first) and shows thumbnails from the IIIF server.
4. **Both volumes share one sheet numbering** (the later one is the earlier survey with paste-over updates), so an exact match in one volume locates the address in the other.
5. Viewer links use the resource id from the item record, `https://www.loc.gov/resource/g3814sm.g3814sm_g05629YYYY/?sp=N`. A shortened id (`g3814sm.g05629YYYY`) gives "page not found". `sp` is the image's position in viewer order.
6. Sheets also show things no other source has, like Maplewood's 1912 "Township Hall" on Maplewood Avenue (sheet 47).

## 4d. Photographs from the Library of Congress (`js/housephotos.js`)

- Search `https://www.loc.gov/photos/?q=<town>+new+jersey&fo=json`. The **Gottscho-Schleisner** architectural photos (1930s–60s) name houses by owner and sometimes address; the National Photo Company has 1920s views.
- **Check each item's `rights_advisory`.** Use "No known restrictions on publication"; skip "Rights status not evaluated" and anything not digitized.
- When the title names only an owner ("E. D. Martin house"), find the owner in the directories for that year. If they are the only match in town, show it on that house as **probable** and say why.
- Owner names only for photos up to the name cutoff; later photos show the house without the name.
- Wikimedia Commons rate-limits cloud IPs hard (HTTP 429). Download slowly (`Special:FilePath/<file>?width=1400`, 45–75 s apart) in the background.

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

## 5b. Boundaries and names that change with the year (`tools/boundaries/build_eras.py`)

Older towns often belonged to larger townships before they were incorporated. South Orange was Newark Township,
then Orange Township, then split with Clinton Township, then South Orange Township (with today's Maplewood) before 1904.

* No historic boundary files exist, so `build_eras.py` builds each era's outline as a **union of today's
  municipalities** from Census TIGERweb (county subdivisions, layer 22) with shapely, plus hand clips where a
  documented line exists (South Orange: east of Centre Street, annexed 1891). Label every outline "approximate".
* `MW.names` / `MW.nameFor(year)` in `js/data.js` gives the name in use; the Explore heading, the Time Machine name
  card and the house story all read it.
* `MW.seats` lists where the town's business was done in each era (meeting houses, rented rooms, town halls). Seats
  outside the town show only while that jurisdiction existed. If the record is silent, say so (lat: null).
* Places that belong to the shared township but lie outside today's town get `scope: "township"`: they show on the
  map only for those years, never in house stories, counts or the timeline (`MW.localPlaces()`).
* Make `map_bbox` in `tools/town.json` cover the largest era you want overlays for (South Orange: the 1861 township),
  so the dated maps stay aligned under every outline.
* Outlines that sit *inside* an era's township (South Orange's 1869 Village; on the Maplewood site, the Village of South
  Orange inside the 1861 township) get `"inner": true` in `build_eras.py` (`INNER`) and are drawn as dotted lines; the
  outermost outline gets the shaded mask, and the current town is red dashed.
* When a town was split between two townships and the line is unknown (Maplewood 1806–34: Springfield and Orange),
  show today's outline dashed and say so in the note; don't invent a line.
* Research for this belongs in §2: the incorporation acts, the first town meetings and where each body met. The
  first annual meeting of Orange Township (April 13, 1807, at the Orange meeting house) is in the town records on
  archive.org; the library's Village Hall history gave the South Orange trustees' rented rooms.

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

- **Work on a side branch and ask the owner before merging into the branch that GitHub Pages serves.** Long data runs leave the tree half-written; commit them on the side branch, not on the published one. Merge with a fast-forward once the owner says yes.
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
| Era boundaries, names, seats of government | 1 h |
| Sanborn index transcription (per volume) | ~1 h |
| LOC newspapers | 3–5 h unattended |

**Run long jobs in the background with an auto-commit loop,** because a cloud session that goes idle loses anything not pushed:
```bash
while pgrep -f "directories.py|realestate.py" >/dev/null; do sleep 900; python3 tools/archive/build_index.py; git add -A; git commit -qm "Archive auto-save"; git push; done
```

## Known gaps to improve next time

- The Lenape-trail description: Ridgewood Road and Valley Street run parallel to the coast. The routes toward Newark Bay were the east–west trails (South Orange Avenue, Clinton Avenue, Springfield Avenue), plus Boyden Avenue, "the road to the Harbor". Map those instead of implying the ridge roads reached the bay.
- Five landmark houses have only street-level coordinates, because the geocoders lacked their house numbers.
- People who lived in town after 1950 need other sources (obituaries) to say more than "lived here".
- Where South Orange Township's committee met in 1861–1911 is undocumented in our sources; Shaw's 1884 county history has a township chapter that may say.
- The Sanborn sheets are shown whole; georeferencing them as a map overlay would need control points per sheet.
