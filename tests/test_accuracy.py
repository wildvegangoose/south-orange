"""Automated ground-truth and structural accuracy regression suite for South Orange Through Time.

Run with:
    python3 -m unittest discover -s tests -v
or:
    python3 tests/test_accuracy.py
"""
import json
import os
import pathlib
import re
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "archive"
STREETS_DIR = ARCHIVE / "data" / "streets"
sys.path.insert(0, str(ROOT / "tools" / "archive"))
import common  # noqa: E402


def _load_street(slug_name):
    p = STREETS_DIR / f"{slug_name}.json"
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _eval_js_data():
    script = f"""
    global.window = global;
    global.MW = {{}};
    require({json.dumps(str(ROOT / "js/data.js"))});
    require({json.dumps(str(ROOT / "js/landmarks-data.js"))});
    require({json.dumps(str(ROOT / "js/people-data.js"))});
    require({json.dumps(str(ROOT / "js/webstories.js"))});
    console.log(JSON.stringify({{
      eras: MW.eras,
      seats: MW.seats,
      places: MW.places,
      landmarks: MW.landmarks,
      people: MW.people,
      stories: MW.webStories,
      storyNorthRidgewood: MW.storiesFor("305", "N Ridgewood Rd").length,
      storySouthRidgewood: MW.storiesFor("305", "South Ridgewood Road").length,
      storyCentre: MW.storiesFor("602", "Center St").length,
      storySouthCentre: MW.storiesFor("602", "South Centre Street").length
    }}));
    """
    out = subprocess.check_output(["node", "-e", script], text=True)
    return json.loads(out)


# 60 hand-verified ground-truth directory cases across 1908-1950 covering:
# - 1908 Baldwin +23pt hanging-indent dittos & 1910-1918 spaced 'S O' / 'S 0' town codes
# - top-of-column guidewords & dropped/garbled ditto dashes (e.g. 170 Scotland & 214 Thornden 1950 Whitney vs Hebert)
# - kerning-split boldface headers, compound Dutch/Scottish surnames, directional streets, and crops
GROUND_TRUTH_CASES = [
    # (street_slug, number, year, expected_surname, expected_given_prefix, expected_spouse, require_crop, forbidden_surname)
    ("centre-street", "602", 1910, "Bamberger", "Louis", None, True, None),
    ("centre-street", "602", 1910, "Fuld", "Felix", None, True, None),
    ("centre-street", "602", 1914, "Bamberger", "Louis", None, True, None),
    ("centre-street", "602", 1920, "Bamberger", "Louis", None, False, None),
    ("centre-street", "602", 1922, "Fuld", "Felix", None, True, None),
    ("centre-street", "602", 1929, "Bamberger", "Louis", None, True, None),
    ("centre-street", "602", 1929, "Fuld", "Carolina", None, False, None),
    ("centre-street", "602", 1936, "Bamberger", "Louis", None, True, None),
    ("centre-street", "602", 1940, "Bamberger", "Louis", None, False, None),
    ("centre-street", "602", 1942, "Fuld", "Carolina", None, False, None),
    ("centre-street", "413", 1908, "VanderKieft", "Antonio B", None, False, "Vanderhoof"),
    ("centre-street", "413", 1910, "VanderKieft", "Antonio B", None, True, "Vanderhoof"),
    ("charlton-avenue", "262", 1916, "Fort", "John Franklin", None, False, None),
    ("charlton-avenue", "262", 1920, "Fort", "John Franklin", None, False, None),
    ("charlton-avenue", "262", 1922, "Fort", "J Franklin", None, True, None),
    ("charlton-avenue", "262", 1936, "Field", "William T", "Amy L", True, None),
    ("charlton-avenue", "262", 1950, "Field", "William T", "Amy L", True, None),
    ("charlton-avenue", "274", 1950, "Cortwright", "Effie", None, False, "Courter"),
    ("halsey-place", "6", 1934, "Monroe", "Jay", None, False, None),
    ("scotland-road", "180", 1914, "Allen", "William F", None, True, None),
    ("scotland-road", "180", 1916, "Allen", "William F", None, False, None),
    ("scotland-road", "180", 1918, "Allen", "Caroline P", None, False, None),
    ("scotland-road", "180", 1929, "Allen", "Caroline P", None, True, None),
    ("scotland-road", "273", 1922, "Kinkead", "Eugene F", None, True, None),
    ("scotland-road", "273", 1932, "Kinkead", "Eugene F", "Ann O", False, None),
    ("scotland-road", "273", 1948, "Kinkead", "Eugene F", "Ann O", False, None),
    ("scotland-road", "460", 1910, "Johnson", "Hallett", None, False, None),
    ("scotland-road", "460", 1914, "Johnson", "Hallett", None, False, None),
    ("scotland-road", "170", 1950, "Whitney", "Mildred", None, True, "Hebert"),
    ("thornden-street", "214", 1950, "Whitney", "William H", "Helene Y", True, "Hebert"),
    ("thornden-street", "214", 1950, "Whitney", "Carol", None, False, "Hebert"),
    ("thornden-street", "373", 1936, "Abbe", "Paul O", "Henrietta", True, None),
    ("stanley-road", "66", 1918, "Smith", "Peter A", None, False, None),
    ("stanley-road", "66", 1934, "Smith", "Peter A", "Josephine C", False, None),
    ("stanley-road", "66", 1934, "Smith", "Anthony P", None, False, None),
    ("stanley-road", "66", 1942, "Smith", "Anthony P", None, False, None),
    ("roland-avenue", "102", 1910, "Kinsey", "Alfred S", None, True, None),
    ("roland-avenue", "102", 1916, "Kinsey", "Alfred C", None, False, None),
    ("roland-avenue", "102", 1918, "Kinsey", "Alfred C", None, False, None),
    ("hartford-road", "335", 1910, "McCoy", "Walter I", None, True, None),
    ("college-place", "163", 1932, "Scheuerle", "Joe G", "Carolyn", False, None),
    ("college-place", "163", 1948, "Scheuerle", "Joe G", "Carolyn", False, None),
    ("west-end-road", "44", 1910, "Gutmann", "Hellmuth", None, True, None),
    ("west-end-road", "378", 1932, "Gutmann", "Hellmuth", "Bessie P", False, None),
    ("west-end-road", "378", 1942, "Gutmann", "Hellmuth", "Bessie P", True, None),
    ("west-end-road", "307", 1936, "Lasser", "Jacob K", "Theresa R", True, None),
    ("west-end-road", "307", 1950, "Lasser", "Jacob K", "Theresa R", True, None),
    ("summit-avenue", "445", 1922, "Adams", "Platt", None, True, None),
    ("summit-avenue", "445", 1929, "Adams", "Platt", None, True, None),
    ("mayhew-court", "480", 1936, "Havill", "Clinton H", "Katherine R", True, None),
    ("mayhew-court", "480", 1950, "Havill", "Clinton H", "Katherine R", True, None),
    ("massel-terrace", "62", 1948, "Lozowick", "Louis", "Adele", False, None),
    ("massel-terrace", "62", 1950, "Lozowick", "Louis", "Adele", True, None),
    ("hillside-place", "387", 1950, "VanAmeringen", "Arnold", "Hedwig", True, None),
    ("hillside-place", "387", 1950, "VanAmeringen", "Henry", None, False, None),
    ("walton-avenue", "263", 1950, "Satz", "David M Jr", None, False, None),
    ("crest-circle", "2", 1950, "Sagner", "Alan L", "Ruth L", True, None),
    ("ralston-avenue", "154", 1914, "Garey", "Willis L", None, True, None),
    ("second-street", "74", 1908, "Brainard", "Henry M", None, False, None),
    ("montrose-avenue", "55", 1936, "Sloane", "T O", "Alice", True, None),
]


class SouthOrangeAccuracyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.street_cache = {}
        cls.js = _eval_js_data()
        cls.conf_streets = json.loads((ARCHIVE / "data" / "streets.json").read_text(encoding="utf-8"))

    def _house_listings(self, st_slug, num):
        if st_slug not in self.street_cache:
            self.street_cache[st_slug] = _load_street(st_slug)
        return self.street_cache[st_slug]["houses"].get(str(num), {}).get("listings", [])

    def test_ground_truth_directory_cases(self):
        self.assertGreaterEqual(len(GROUND_TRUTH_CASES), 50)
        for st_slug, num, yr, exp_sur, exp_giv, exp_sp, req_crop, forbid_sur in GROUND_TRUTH_CASES:
            with self.subTest(address=f"{num} {st_slug}", year=yr, person=f"{exp_sur}, {exp_giv}"):
                yr_rows = [r for r in self._house_listings(st_slug, num) if r["year"] == yr]
                self.assertTrue(yr_rows, f"No {yr} listings found at {num} {st_slug}")
                if forbid_sur:
                    for r in yr_rows:
                        self.assertNotEqual(r["surname"], forbid_sur, f"Forbidden poisoned surname {forbid_sur} at {num} {st_slug} ({yr})")
                matches = [
                    r for r in yr_rows
                    if r["surname"] == exp_sur and (r.get("given") or "").startswith(exp_giv)
                ]
                self.assertTrue(
                    matches,
                    f"Expected ({exp_sur}, {exp_giv}*) at {num} {st_slug} in {yr}, got: {[(r['surname'], r.get('given'), r.get('spouse')) for r in yr_rows]}",
                )
                hit = matches[0]
                if exp_sp is not None:
                    self.assertEqual(hit.get("spouse"), exp_sp)
                if req_crop:
                    self.assertTrue(hit.get("crop"), f"Missing crop path on householder {exp_sur} at {num} {st_slug} ({yr})")
                    crop_file = ARCHIVE / hit["crop"]
                    self.assertTrue(crop_file.is_file(), f"Crop JPEG missing on disk: {crop_file}")
                    self.assertGreater(crop_file.stat().st_size, 500)

    def test_zero_crop_collisions_and_zero_missing_jpegs(self):
        crop_owners = {}
        missing = []
        collisions = []
        total_listings = 0
        for p in sorted(STREETS_DIR.glob("*.json")):
            data = json.loads(p.read_text(encoding="utf-8"))
            st = data["name"]
            for num, rec in data["houses"].items():
                for r in rec.get("listings", []):
                    total_listings += 1
                    self.assertLessEqual(r["year"], 1950, f"Post-1950 directory listing leaked at {num} {st}")
                    c = r.get("crop")
                    if c:
                        if not (ARCHIVE / c).is_file():
                            missing.append((st, num, r["year"], c))
                        owner = (st, num, r["year"])
                        if c in crop_owners and crop_owners[c] != owner:
                            collisions.append((c, crop_owners[c], owner))
                        crop_owners[c] = owner
        self.assertGreater(total_listings, 80000)
        self.assertEqual(missing, [], f"Missing crop JPEGs: {missing[:5]}")
        self.assertEqual(collisions, [], f"Colliding crop JPEGs: {collisions[:5]}")

    def test_zero_split_names_and_digit_middle_initials(self):
        split_sp, split_gv, mid_digit, edge_quote = [], [], [], []
        for p in sorted(STREETS_DIR.glob("*.json")):
            data = json.loads(p.read_text(encoding="utf-8"))
            st = data["name"]
            for num, rec in data["houses"].items():
                for r in rec.get("listings", []):
                    sur = r.get("surname") or ""
                    gv = r.get("given") or ""
                    sp = r.get("spouse") or ""
                    if sur != sur.strip(" ,.;:'’‘\"“”`"):
                        edge_quote.append((st, num, r["year"], sur))
                    if re.search(r"(?:^|\s)[A-Z]\s+[a-z]{2,}", sp):
                        split_sp.append((st, num, r["year"], sp))
                    if re.search(r"(?:^|\s)[A-Z]\s+[a-z]{2,}", gv):
                        split_gv.append((st, num, r["year"], gv))
                    if re.search(r"(?:^|\s)[01](?:\s|$)", gv) or re.search(r"(?:^|\s)[01](?:\s|$)", sp):
                        mid_digit.append((st, num, r["year"], gv, sp))
        self.assertEqual(edge_quote, [])
        self.assertEqual(split_sp, [])
        self.assertEqual(split_gv, [])
        self.assertEqual(mid_digit, [])

    def test_directional_and_ordinal_street_canonicalization(self):
        self.assertEqual(common.canon_street("S Orange av", self.conf_streets), "SOUTH ORANGE AVENUE")
        self.assertEqual(common.canon_street("W S Orange av", self.conf_streets), "WEST SOUTH ORANGE AVENUE")
        self.assertEqual(common.canon_street("S Orange avW", self.conf_streets), "WEST SOUTH ORANGE AVENUE")
        self.assertEqual(common.canon_street("Centre", self.conf_streets), "CENTRE STREET")
        self.assertEqual(common.canon_street("S Centre", self.conf_streets), "SOUTH CENTRE STREET")
        self.assertEqual(common.canon_street("Ridgewood rdS", self.conf_streets), "SOUTH RIDGEWOOD ROAD")
        self.assertEqual(common.canon_street("Ridgewood rd", self.conf_streets), "RIDGEWOOD ROAD")
        self.assertEqual(common.canon_street("2d", self.conf_streets), "SECOND STREET")
        self.assertEqual(common.canon_street("3d", self.conf_streets), "THIRD STREET")
        self.assertEqual(common.canon_street("W Ward pl", self.conf_streets), "WARD PLACE")

    def test_curated_historical_facts_and_privacy_rules(self):
        seats = {s["id"]: s for s in self.js.get("seats", [])}
        self.assertEqual(seats["seat-newark"]["to"], 1806)

        for person in self.js["people"]:
            if person.get("living"):
                self.assertFalse(person.get("homes"), f"Living person has home address attached: {person['name']}")
            elif not person.get("died") and person.get("homes"):
                # Pre-1910 National Register / historic estate figures without recorded lifespan dates may omit `died`
                years_txt = " ".join(h.get("years", "") for h in person["homes"])
                yrs = [int(y) for y in re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", years_txt)]
                self.assertTrue(yrs and max(yrs) <= 1910, f"Undated/living person has modern home attached: {person['name']}")
            url = person.get("url") or ""
            self.assertEqual(url.count("("), url.count(")"), f"Truncated URL on {person['name']}: {url}")

        lms = self.js["landmarks"].values() if isinstance(self.js["landmarks"], dict) else self.js["landmarks"]
        for lm in lms:
            if isinstance(lm, dict) and lm.get("photo") and not lm["photo"].startswith("http"):
                self.assertTrue((ROOT / lm["photo"]).is_file(), f"Missing landmark photo: {lm['photo']}")

        self.assertEqual(self.js["storyNorthRidgewood"], 1)
        self.assertEqual(self.js["storySouthRidgewood"], 0)
        self.assertEqual(self.js["storyCentre"], 1)
        self.assertEqual(self.js["storySouthCentre"], 0)

    def test_seo_metadata_sitemap_and_static_landmarks(self):
        import html as html_lib
        import xml.etree.ElementTree as ET

        cfg = json.loads((ROOT / "tools" / "town.json").read_text(encoding="utf-8"))
        site_url = cfg["site_url"].rstrip("/") + "/"

        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("User-agent: *", robots)
        self.assertIn("Allow: /", robots)
        self.assertIn(f"Sitemap: {site_url}sitemap.xml", robots)

        tree = ET.parse(ROOT / "sitemap.xml")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [el.text for el in tree.getroot().findall("sm:url/sm:loc", ns)]
        self.assertEqual(len(locs), len(set(locs)), "Duplicate URLs in sitemap.xml")
        expected_count = 7 + len(self.js["landmarks"])
        self.assertEqual(len(locs), expected_count)
        self.assertNotIn(f"{site_url}landmark.html", locs)

        lm_shell = (ROOT / "landmark.html").read_text(encoding="utf-8")
        self.assertIn('content="noindex, follow"', lm_shell)

        titles, descs = set(), set()
        for loc in locs:
            self.assertTrue(loc.startswith(site_url), f"Unexpected domain in sitemap: {loc}")
            rel = loc[len(site_url) :] or "index.html"
            fpath = ROOT / rel
            self.assertTrue(fpath.is_file(), f"Sitemap URL missing on disk: {fpath}")
            txt = fpath.read_text(encoding="utf-8")
            self.assertIn('content="index, follow"', txt, f"Missing index, follow on {rel}")
            self.assertIn(f'<link rel="canonical" href="{html_lib.escape(loc, quote=True)}">', txt, f"Canonical mismatch on {rel}")

            tm = re.search(r"<title>([\s\S]*?)</title>", txt)
            dm = re.search(r'<meta name="description" content="([^"]+)"', txt)
            om = re.search(r'<meta property="og:image" content="([^"]+)"', txt)
            jm = re.search(r'<script type="application/ld\+json">([\s\S]*?)</script>', txt)
            self.assertTrue(tm and tm.group(1).strip(), f"Missing <title> on {rel}")
            self.assertTrue(dm and 50 <= len(html_lib.unescape(dm.group(1))) <= 165, f"Bad meta description on {rel}")
            self.assertTrue(om, f"Missing og:image on {rel}")
            self.assertTrue(jm, f"Missing JSON-LD on {rel}")

            t_val, d_val = tm.group(1).strip(), dm.group(1).strip()
            self.assertNotIn(t_val, titles, f"Duplicate <title> across pages: {t_val}")
            self.assertNotIn(d_val, descs, f"Duplicate meta description across pages: {d_val}")
            titles.add(t_val)
            descs.add(d_val)

            og_img = html_lib.unescape(om.group(1))
            self.assertTrue(og_img.startswith(site_url), f"og:image not absolute on {rel}: {og_img}")
            og_file = ROOT / og_img[len(site_url) :]
            self.assertTrue(og_file.is_file() and og_file.stat().st_size > 1000, f"Missing og:image file {og_file} on {rel}")

            ld = json.loads(jm.group(1))
            self.assertEqual(ld.get("@context"), "https://schema.org")
            self.assertTrue(ld.get("@graph"), f"Empty JSON-LD @graph on {rel}")
            if rel.startswith("landmarks/"):
                self.assertRegex(txt, r"<h1>[^<]+</h1>", f"Static landmark missing <h1> on {rel}")

        house_html = (ROOT / "house.html").read_text(encoding="utf-8")
        self.assertEqual(len(re.findall(r'href="house\.html\?q=[^"]+"', house_html)), 184)
        idx_txt = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("https://wildvegangoose.github.io/maplewood/", idx_txt)
        if cfg.get("google_site_verification"):
            self.assertIn(
                f'<meta name="google-site-verification" content="{cfg["google_site_verification"]}"',
                idx_txt,
            )
        self.assertIn("https://wildvegangoose.github.io/maplewood/people.html", (ROOT / "people.html").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
