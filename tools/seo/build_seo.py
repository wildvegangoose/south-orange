#!/usr/bin/env python3
"""Build static SEO assets, crawlable landmark pages, JSON-LD, and pre-rendered HTML.

Reads `tools/town.json`, `js/data.js`, `js/landmarks-data.js`, `js/people-data.js`,
`js/sanborn-data.js`, `js/sanborn.js`, and `archive/data/street_index.json` to:
  1. Write `robots.txt` and `sitemap.xml` at repository root.
  2. Generate dedicated static landmark pages (`landmarks/<id>.html`) with unique
     titles, meta descriptions, canonical URLs, Open Graph / Twitter cards,
     Schema.org JSON-LD (`LandmarksOrHistoricalBuildings` + `BreadcrumbList`),
     and full pre-rendered semantic HTML inside `<main id="lm">`.
  3. Inject canonical URLs, Open Graph / Twitter metadata, JSON-LD structured data,
     and crawlable pre-rendered HTML into all 8 root `.html` templates idempotently.

Usage:
    python3 tools/seo/build_seo.py
"""
import html
import json
import pathlib
import re
import subprocess
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parents[2]

KIND_LABEL = {
    "house": "House",
    "civic": "Civic",
    "transport": "Transport",
    "nature": "Park & Land",
    "culture": "Culture",
    "event": "Event",
    "commerce": "Commerce",
}

PEOPLE_FIELDS = {
    "arts": "Film, TV & Art",
    "music": "Music",
    "lit": "Writing & Journalism",
    "sports": "Sports",
    "science": "Science & Engineering",
    "public": "Public Life & Law",
    "business": "Business & Building",
    "other": "Other",
}

AGES = [
    ("1888", "map", "USGS survey map"),
    ("1898", "map", "USGS survey map"),
    ("1906", "map", "USGS survey map"),
    ("1921", "map", "USGS survey map"),
    ("1930", "aerial", "Aerial photograph"),
    ("1947", "map", "USGS topographic map"),
    ("1955", "map", "USGS topographic map"),
    ("1972", "map", "USGS topographic map"),
    ("1995", "aerial", "Color-infrared aerial"),
    ("2007", "aerial", "Aerial photograph"),
    ("2020", "aerial", "Aerial photograph"),
]

FAVICON = (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E"
    "%3Cpath fill='%23b8381e' d='M50 4l8 20 14-8-4 20 18-4-10 16 16 6-20 10 4 10-22-4-2 26h-4"
    "l-2-26-22 4 4-10-20-10 16-6-10-16 18 4-4-20 14 8z'/%3E%3C/svg%3E"
)


def esc(val) -> str:
    return html.escape(str(val if val is not None else ""), quote=True)


def trim_desc(text: str, limit: int = 160) -> str:
    clean = re.sub(r"\s+", " ", (text or "").strip())
    if len(clean) <= limit:
        return clean
    cut = clean[: limit - 1].rsplit(" ", 1)[0].rstrip(".,;:—-")
    return cut + "…"


def nice_street(name: str) -> str:
    return re.sub(r"\b\w", lambda m: m.group(0).upper(), (name or "").lower())


def json_ld_script(data: dict) -> str:
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return f'<script type="application/ld+json">{raw}</script>'


def load_repo_data() -> dict:
    town_cfg = json.loads((ROOT / "tools" / "town.json").read_text(encoding="utf-8"))
    street_index_path = ROOT / "archive" / "data" / "street_index.json"
    street_index = (
        json.loads(street_index_path.read_text(encoding="utf-8"))
        if street_index_path.is_file()
        else {}
    )
    node_code = f"""
    global.window = global;
    global.MW = {{}};
    MW.esc = s => String(s).replace(/[&<>"']/g, c => ({{ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }}[c]));
    require({json.dumps(str(ROOT / "js/data.js"))});
    require({json.dumps(str(ROOT / "js/landmarks-data.js"))});
    require({json.dumps(str(ROOT / "js/people-data.js"))});
    require({json.dumps(str(ROOT / "js/sanborn-data.js"))});
    require({json.dumps(str(ROOT / "js/sanborn.js"))});
    const localPlaces = MW.localPlaces ? MW.localPlaces() : MW.places.filter(p => !p.scope);
    const sanbornByLm = {{}};
    for (const [k, v] of Object.entries(MW.landmarks || {{}})) {{
      const m = (v.address || "").match(/^(\\d+)\\S*\\s+([A-Za-z. ]+?)(?:\\s*[(,]|$)/);
      sanbornByLm[k] = (m && MW.sanbornHTML) ? MW.sanbornHTML(m[1], m[2], {{ title: `${{MW.esc(v.name)}} on the Sanborn maps` }}) : "";
    }}
    console.log(JSON.stringify({{
      town: MW.town,
      sources: MW.sources,
      eras: MW.eras,
      names: MW.names || [],
      places: MW.places,
      localPlaces,
      landmarks: MW.landmarks || {{}},
      people: MW.people || [],
      sanbornByLm
    }}));
    """
    out = subprocess.check_output(["node", "-e", node_code], text=True)
    js_data = json.loads(out)
    lastmod = "2026-11-21"
    try:
        git_date = subprocess.check_output(
            ["git", "log", "-1", "--format=%cs"], cwd=ROOT, text=True
        ).strip()
        if re.match(r"^\d{4}-\d{2}-\d{2}$", git_date):
            lastmod = git_date
    except Exception:
        pass
    return {
        "cfg": town_cfg,
        "streets": street_index,
        "js": js_data,
        "lastmod": lastmod,
    }


def render_source_link(s, sources: dict) -> str:
    if isinstance(s, str):
        src = sources.get(s)
        if src:
            return f'<a href="{esc(src["url"])}" target="_blank" rel="noopener">{esc(src["label"])}</a>'
        return esc(s)
    return f'<a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["label"])}</a>'


def render_source_links(ids, sources: dict) -> str:
    parts = [render_source_link(i, sources) for i in (ids or []) if i in sources]
    return " · ".join(parts)


def build_head_seo_block(
    *,
    canonical: str,
    title: str,
    description: str,
    site_title: str,
    og_image_url: str,
    og_image_alt: str,
    og_type: str = "website",
    json_ld: dict | None = None,
    robots: str = "index, follow",
) -> str:
    lines = [
        "<!-- seo:head:start -->",
        f'  <meta name="robots" content="{esc(robots)}">',
        f'  <link rel="canonical" href="{esc(canonical)}">',
        f'  <meta property="og:type" content="{esc(og_type)}">',
        f'  <meta property="og:site_name" content="{esc(site_title)}">',
        '  <meta property="og:locale" content="en_US">',
        f'  <meta property="og:title" content="{esc(title)}">',
        f'  <meta property="og:description" content="{esc(description)}">',
        f'  <meta property="og:url" content="{esc(canonical)}">',
        f'  <meta property="og:image" content="{esc(og_image_url)}">',
        f'  <meta property="og:image:alt" content="{esc(og_image_alt)}">',
        '  <meta name="twitter:card" content="summary_large_image">',
        f'  <meta name="twitter:title" content="{esc(title)}">',
        f'  <meta name="twitter:description" content="{esc(description)}">',
        f'  <meta name="twitter:image" content="{esc(og_image_url)}">',
    ]
    if json_ld is not None:
        lines.append("  " + json_ld_script(json_ld))
    lines.append("  <!-- seo:head:end -->")
    return "\n".join(lines)


def inject_head_seo(html_text: str, title: str, description: str, seo_block: str) -> str:
    html_text = re.sub(
        r"\s*<!-- seo:head:start -->[\s\S]*?<!-- seo:head:end -->",
        "",
        html_text,
    )
    html_text = re.sub(
        r"<title>[\s\S]*?</title>",
        lambda _: f"<title>{esc(title)}</title>",
        html_text,
        count=1,
    )
    meta_desc_tag = f'<meta name="description" content="{esc(description)}">'
    html_text = re.sub(
        r'<meta\s+name="description"\s+content="[^"]*">',
        lambda _: f"{meta_desc_tag}\n  {seo_block}",
        html_text,
        count=1,
    )
    return html_text


def inject_inner_by_id(html_text: str, elem_id: str, inner_html: str) -> str:
    start_mark = f"<!-- seo:inner:{elem_id} -->"
    end_mark = f"<!-- /seo:inner:{elem_id} -->"
    wrapped = f"{start_mark}{inner_html}{end_mark}"
    sentinel_re = re.compile(
        re.escape(start_mark) + r"[\s\S]*?" + re.escape(end_mark)
    )
    if sentinel_re.search(html_text):
        return sentinel_re.sub(lambda _: wrapped, html_text, count=1)
    empty_re = re.compile(
        rf'(<(?P<tag>[a-z0-9]+)\b[^>]*\bid="{re.escape(elem_id)}"[^>]*>)\s*(</(?P=tag)>)',
        re.IGNORECASE,
    )
    m = empty_re.search(html_text)
    if not m:
        raise RuntimeError(f"Could not find empty container #{elem_id} to populate")
    return html_text[: m.start()] + m.group(1) + wrapped + m.group(3) + html_text[m.end() :]


def breadcrumb_ld(items: list[tuple[str, str]]) -> dict:
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": idx + 1,
                "name": name,
                "item": url,
            }
            for idx, (name, url) in enumerate(items)
        ],
    }


def build_landmark_pages(repo: dict) -> list[str]:
    cfg = repo["cfg"]
    js = repo["js"]
    town = cfg["name"]
    state = cfg["state"]
    site_title = cfg["site_title"]
    site_url = cfg["site_url"].rstrip("/") + "/"
    sources = js["sources"]
    landmarks = js["landmarks"]
    sanborn_by_lm = js["sanbornByLm"]
    geocode_suffix = js["town"].get("geocodeSuffix", f", {town}, {state}")

    lm_dir = ROOT / "landmarks"
    lm_dir.mkdir(exist_ok=True)
    sorted_items = sorted(landmarks.items(), key=lambda kv: kv[1].get("built", 0))
    valid_files = {f"{k}.html" for k, _ in sorted_items}
    for old in lm_dir.glob("*.html"):
        if old.name not in valid_files:
            old.unlink()

    urls = []
    for lm_id, v in sorted_items:
        built_str = str(v.get("builtLabel") or v.get("built") or "")
        title = f"{v['name']} ({built_str}) — {town}, {state} Landmark · {site_title}"
        desc = trim_desc(
            f"{v['name']} ({v['address']}, {town}, {state}): {v['tagline']}"
        )
        page_url = f"{site_url}landmarks/{lm_id}.html"
        urls.append(page_url)

        photos = v.get("photos") or []
        hero = next((p for p in photos if p.get("hero")), photos[0] if photos else None)
        og_rel = hero["src"] if hero else f"img/ages/{lm_id}/1930-aerial.jpg"
        og_url = f"{site_url}{og_rel}"
        og_alt = (hero.get("caption") if hero else None) or f"{v['name']}, {town}, {state}"

        street_clean = re.split(r"[(;]", v.get("address", ""))[0].strip()
        place_entity = {
            "@type": "LandmarksOrHistoricalBuildings",
            "@id": f"{page_url}#landmark",
            "name": v["name"],
            "description": v["tagline"],
            "url": page_url,
            "image": og_url,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": street_clean,
                "addressLocality": town,
                "addressRegion": state,
                "addressCountry": "US",
            },
        }
        if v.get("lat") and v.get("lon"):
            place_entity["geo"] = {
                "@type": "GeoCoordinates",
                "latitude": v["lat"],
                "longitude": v["lon"],
            }
        ld = {
            "@context": "https://schema.org",
            "@graph": [
                place_entity,
                breadcrumb_ld(
                    [
                        (site_title, site_url),
                        ("Landmarks", f"{site_url}landmarks.html"),
                        (v["name"], page_url),
                    ]
                ),
            ],
        }
        head_seo = build_head_seo_block(
            canonical=page_url,
            title=title,
            description=desc,
            site_title=site_title,
            og_image_url=og_url,
            og_image_alt=og_alt,
            og_type="article",
            json_ld=ld,
        )

        hero_bg = f"../{hero['src']}" if hero else f"../img/ages/{lm_id}/1930-aerial.jpg"
        meta_spans = [
            f"<span>📍 {esc(v['address'])}{' (map position approximate)' if v.get('approx') else ''}</span>"
        ]
        if v.get("designation"):
            meta_spans.append(f"<span>🏛 {esc(v['designation'])}</span>")
        if v.get("architect"):
            meta_spans.append(f"<span>✏️ {esc(v['architect'])}</span>")
        hero_credit = ""
        if hero:
            parts = [esc(hero.get("caption") or "")]
            if hero.get("credit"):
                parts.append(f"· {esc(hero['credit'])}")
            if hero.get("license"):
                parts.append(f"· {esc(hero['license'])}")
            hero_credit = f'<p class="hero-credit">{" ".join(p for p in parts if p)}</p>'

        sections_html = "".join(
            f"<section><h2>{esc(s['h'])}</h2>"
            + "".join(f"<p>{esc(p)}</p>" for p in s.get("p", []))
            + "</section>"
            for s in v.get("sections", [])
        )
        facts_html = ""
        if v.get("facts"):
            facts_html = (
                "<section><h2>Did you know?</h2><ul class=\"lm-facts\">"
                + "".join(f"<li>{esc(f)}</li>" for f in v["facts"])
                + "</ul></section>"
            )
        tl_html = "".join(
            f"<li><b>{esc(t['y'])}</b><span>{esc(t['t'])}</span></li>"
            for t in v.get("timeline", [])
        )
        explore_href = (
            f"../explore.html?place={quote(str(v['place']))}&year={max(1888, int(v.get('built') or 1888))}"
            if v.get("place")
            else "../explore.html"
        )
        house_href = f"../house.html?q={quote(street_clean + geocode_suffix)}"

        ages_imgs = "".join(
            f'<img src="../img/ages/{lm_id}/{y}-{kind}.jpg" alt="{esc(label)}, {y}" '
            f'data-i="{i}" class="{"on" if i == 0 else ""}" loading="{"eager" if i < 2 else "lazy"}">'
            for i, (y, kind, label) in enumerate(AGES)
        )
        ages_btns = "".join(
            f'<button data-i="{i}">{y}</button>' for i, (y, _, _) in enumerate(AGES)
        )

        photos_sec = ""
        if photos:
            fig_items = []
            for p in photos:
                href_p = esc(p.get("link") or ("../" + p["src"]))
                src_p = esc(p["src"])
                alt_p = esc(p.get("caption") or v["name"])
                yr_part = f"<b>{esc(p['year'])}</b> · " if p.get("year") else ""
                lic_part = f" · {esc(p['license'])}" if p.get("license") else ""
                fig_items.append(
                    f'<figure class="ph"><a href="{href_p}" target="_blank" rel="noopener">'
                    f'<img src="../{src_p}" alt="{alt_p}" loading="lazy"></a>'
                    f'<figcaption>{yr_part}{esc(p.get("caption") or "")}'
                    f'<span class="credit">{esc(p.get("credit") or "")}{lic_part}</span></figcaption></figure>'
                )
            figs = "".join(fig_items)
            more = ""
            if v.get("photoLinks"):
                more_links = " · ".join(render_source_link(s, sources) for s in v["photoLinks"])
                more = f'<p class="small muted" style="margin-top:1rem">More historic photos (copyrighted, viewable at their source): {more_links}</p>'
            photos_sec = (
                f'<section class="section photos-sec"><div class="wrap">'
                f'<div class="eyebrow">Pictures</div><h2>{esc(v["name"])} in photographs</h2>'
                f'<div class="photo-grid">{figs}</div>{more}</div></section>'
            )

        clippings_sec = ""
        if v.get("clippings"):
            clips = "".join(
                f'<a class="clip" href="{esc(c["src"])}" target="_blank" rel="noopener">'
                f'<span class="doc-year">{esc(c["year"])}</span>'
                f'<img src="{esc(c["img"] if str(c["img"]).startswith("http") else "../" + str(c["img"]))}" alt="Clipping {esc(c["year"])}" loading="lazy">'
                f'<span class="doc-cap">{esc(c.get("caption") or ("Scrapbook, " + str(c["year"])))}</span></a>'
                for c in v["clippings"]
            )
            clippings_sec = (
                f'<section class="section"><div class="wrap"><div class="eyebrow">From the library\'s scrapbooks</div>'
                f'<h2>In the news</h2><div class="news-grid">{clips}</div></div></section>'
            )

        sanborn_sec = ""
        if sanborn_by_lm.get(lm_id):
            sanborn_sec = f'<section class="section sanborn"><div class="wrap">{sanborn_by_lm[lm_id]}</div></section>'

        sources_li = "".join(
            f"<li>{render_source_link(s, sources)}</li>" for s in v.get("sources", [])
        )

        page_html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  {head_seo}
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/landmark.css">
  <link rel="icon" href="{FAVICON}">
</head>
<body data-root="../" data-landmark="{esc(lm_id)}">
<main id="lm">
  <header class="lm-hero" style="background-image:url('{esc(hero_bg)}')">
    <div class="lm-hero-shade"></div>
    <div class="wrap lm-hero-in">
      <a class="back" href="../landmarks.html">← All landmarks</a>
      <div class="eyebrow">{esc(v["type"])} · {esc(built_str)}</div>
      <h1>{esc(v["name"])}</h1>
      <p class="lede">{esc(v["tagline"])}</p>
      <div class="lm-meta">{"".join(meta_spans)}</div>
      {hero_credit}
    </div>
  </header>

  <section class="section lm-story">
    <div class="wrap lm-grid">
      <article class="lm-text">
        {sections_html}
        {facts_html}
      </article>
      <aside class="lm-side">
        <div class="card lm-tl"><h3>Timeline</h3><ol>{tl_html}</ol></div>
        <div class="card"><h3>On the map</h3><div id="lmMap" class="lm-map"></div>
          <p class="small"><a href="{esc(explore_href)}">Open in Explore the Map →</a> · <a href="{esc(house_href)}">House story →</a></p></div>
      </aside>
    </div>
  </section>

  <section class="section ages-sec">
    <div class="wrap">
      <div class="eyebrow">Through the ages</div>
      <h2>The same spot, {AGES[0][0]}–{AGES[-1][0]}</h2>
      <p class="muted">Dated survey maps and aerial photographs, all centered on {esc(v["name"])}. Drag the slider or click a year. The marker shows the landmark.</p>
      <div class="ages">
        <div class="ages-frame">{ages_imgs}<div class="ages-pin"></div><div class="ages-label" id="agesLabel"><b>{AGES[0][0]}</b> · {AGES[0][2]}</div></div>
        <input type="range" id="agesRange" min="0" max="{len(AGES) - 1}" value="0" aria-label="Choose a year">
        <div class="ages-years">{ages_btns}</div>
      </div>
      <p class="small muted">Maps: U.S. Geological Survey historical topographic maps (public domain). Aerials: New Jersey Office of GIS.</p>
    </div>
  </section>
  {photos_sec}
  {clippings_sec}
  {sanborn_sec}
  <section class="section lm-sources"><div class="wrap">
    <h2>Sources</h2><ul>{sources_li}</ul>
    <p class="small muted">The narrative is our synthesis of the sources listed. Where sources disagree, the text says so.</p>
  </div></section>
</main>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script src="../js/data.js"></script>
<script src="../js/landmarks-data.js"></script>
<script src="../js/sanborn-data.js"></script>
<script src="../js/sanborn.js"></script>
<script src="../js/common.js"></script>
<script src="../js/landmark.js"></script>
</body>
</html>
"""
        (lm_dir / f"{lm_id}.html").write_text(page_html, encoding="utf-8")
    return urls


def render_landmarks_grid(landmarks: dict) -> str:
    sorted_items = sorted(landmarks.items(), key=lambda kv: kv[1].get("built", 0))
    cards = []
    for k, v in sorted_items:
        photos = v.get("photos") or []
        cover = photos[0]["src"] if photos else f"img/ages/{k}/2020-aerial.jpg"
        built_lbl = v.get("builtLabel") or v.get("built")
        cards.append(
            f'<a class="lm-card" href="landmarks/{esc(k)}.html">'
            f'<div class="lm-cover" style="background-image:url(\'{esc(cover)}\')"><span class="lm-year">{esc(built_lbl)}</span></div>'
            f'<div class="lm-body"><span class="tag {esc(v.get("kind") or "house")}">{esc(v["type"])}</span>'
            f'<h3>{esc(v["name"])}</h3><p class="small muted">📍 {esc(v["address"])}</p><p>{esc(v["tagline"])}</p></div></a>'
        )
    return "".join(cards)


def render_people_groups(people: list[dict], is_south_orange: bool) -> str:
    def group_of(p):
        b = p.get("born")
        if not b:
            return "Era unknown"
        if b < 1850:
            return "Born before 1850"
        if b < 1900:
            return "Born 1850–1899"
        return f"Born in the {(b // 10) * 10}s"

    def group_order(g):
        if g == "Era unknown":
            return 9999
        if g.startswith("Born before"):
            return 0
        m = re.search(r"\d{4}", g)
        return int(m.group(0)) if m else 9999

    def life_str(p):
        b, d = p.get("born"), p.get("died")
        if is_south_orange:
            return f"{b}–{d}" if (b and d) else (f"born {b}" if b else (f"died {d}" if d else ""))
        return f"{b}–{d or ''}" if b else ""

    def initials(name):
        words = [w for w in re.split(r"\s+", name or "") if re.match(r"^[A-Z]", w)]
        return "".join(w[0] for w in words[:2])

    groups: dict[str, list[dict]] = {}
    for p in people:
        groups.setdefault(group_of(p), []).append(p)

    sections = []
    for g in sorted(groups.keys(), key=group_order):
        cards = []
        for p in sorted(groups[g], key=lambda x: x.get("born") or 0):
            lf = life_str(p)
            field_lbl = PEOPLE_FIELDS.get(p.get("field") or "other", "Notable")
            tie_html = (
                f'<p class="pp-tie small muted">{esc(p["tie"])}</p>'
                if p.get("tie")
                else ""
            )
            homes_html = ""
            if p.get("homes"):
                links = []
                for h in p["homes"]:
                    prefix = "Probably the family home: " if h.get("probable") else "Lived at "
                    src_lbl = f"; {esc(h.get('src') or 'city directories')}" if is_south_orange else ", city directories"
                    links.append(
                        f'<a class="pp-home" href="house.html?q={quote(h["address"])}">'
                        f"⌂ {prefix}{esc(h['address'])} <span>({esc(h['years'])}{src_lbl})</span></a>"
                    )
                homes_html = "".join(links)
            cards.append(
                f'<article class="pp-card">'
                f'<div class="pp-av f-{esc(p.get("field") or "other")}">{esc(initials(p["name"]))}</div>'
                f'<div class="pp-body"><h3><a href="{esc(p["url"])}" target="_blank" rel="noopener">{esc(p["name"])}</a></h3>'
                f'<div class="pp-meta">{f"<span>{esc(lf)}</span>" if lf else ""}<span class="tag">{esc(field_lbl)}</span></div>'
                f"<p>{esc(p['desc'])}</p>{tie_html}{homes_html}"
                f"</div></article>"
            )
        sections.append(
            f'<section class="pp-group"><h2>{esc(g)}</h2><div class="pp-grid">{"".join(cards)}</div></section>'
        )
    return "".join(sections)


def render_timeline_html(js: dict) -> str:
    eras = js["eras"]
    places = js["localPlaces"]
    sources = js["sources"]
    names = js.get("names") or []
    blocks = []
    for era in eras:
        items = [
            p
            for p in places
            if p["year"] >= era["from"] and p["year"] <= era["to"]
        ]
        yr_range = (
            "Before 1666"
            if era["from"] < 1600
            else f"{era['from']}–{'today' if era['id'] == 'today' else era['to']}"
        )
        called_html = ""
        if names:
            era_names = []
            for n in names:
                if n["to"] >= era["from"] and n["from"] <= era["to"] and n["name"] not in era_names:
                    era_names.append(n["name"])
            if era_names:
                called_html = f'<p class="tl-names small"><b>Called:</b> {" → ".join(esc(x) for x in era_names)}</p>'
        cards = []
        for idx, p in enumerate(items):
            side = "r" if idx % 2 else "l"
            dot = "∞" if p["year"] < 1600 else str(p["year"])
            end_str = f" · {p['year']}–{p['end']}" if p.get("end") else ""
            yr_clamped = max(int(p["year"]), 1600)
            cards.append(
                f'<article class="tl-item {side}" data-y="{p["year"]}" id="ev-{esc(p["id"])}">'
                f'<div class="tl-dot"><span>{dot}</span></div>'
                f'<div class="tl-card card">'
                f'<span class="tag {esc(p["kind"])}">{esc(KIND_LABEL.get(p["kind"], p["kind"]))}{esc(end_str)}</span>'
                f'<h3>{esc(p["title"])}</h3><div class="small muted addr">📍 {esc(p["address"])}</div>'
                f'<p>{esc(p["text"])}</p>'
                f'<div class="tl-actions"><a href="explore.html?place={quote(str(p["id"]))}&year={yr_clamped}">On the map</a>'
                f'<a href="index.html?year={yr_clamped}#hero">In the Time Machine</a></div>'
                f'<div class="sources">Sources: {render_source_links(p.get("sources"), sources)}</div>'
                f"</div></article>"
            )
        blocks.append(
            f'<section class="tl-era-block" id="era-{esc(era["id"])}" data-y="{max(int(era["from"]), 1600)}">'
            f'<div class="tl-era-head" style="--a:{esc(era["palette"][0])};--b:{esc(era["palette"][1])}">'
            f'<div class="eyebrow">{esc(yr_range)}</div>'
            f'<h2>{esc(era["name"])}</h2><p class="tag-line">{esc(era["tagline"])}</p>{called_html}'
            f'<p>{esc(era["story"][0])}</p></div>{"".join(cards)}</section>'
        )
    return "".join(blocks)


def render_street_directory(streets: dict, town: str) -> str:
    if not streets:
        return ""
    items = sorted(streets.items(), key=lambda kv: kv[1]["name"])
    links = []
    for _, info in items:
        pretty = nice_street(info["name"])
        cnt = info.get("houses", 0)
        links.append(
            f'<a href="house.html?q={quote(pretty)}"><span>{esc(pretty)}</span><small>{cnt}</small></a>'
        )
    return (
        "<!-- seo:streets:start -->\n"
        f'  <section class="section street-dir" id="streetDirectory">\n'
        f'    <div class="wrap">\n'
        f'      <div class="eyebrow">Browse the archive</div>\n'
        f"      <h2>All {len(items)} historic streets in {esc(town)} (1908–1950)</h2>\n"
        f'      <p class="muted">Select any street in {esc(town)}, New Jersey to explore its neighborhood history, 1912 &amp; 1949 Sanborn fire-insurance map sheets, and documented house numbers from the 1908–1950 city directories.</p>\n'
        f'      <div class="street-list">{"".join(links)}</div>\n'
        f"    </div>\n"
        f"  </section>\n"
        "  <!-- seo:streets:end -->"
    )


def update_root_pages(repo: dict) -> list[str]:
    cfg = repo["cfg"]
    js = repo["js"]
    streets = repo["streets"]
    town = cfg["name"]
    state = cfg["state"]
    site_title = cfg["site_title"]
    site_url = cfg["site_url"].rstrip("/") + "/"
    og_img_url = f"{site_url}{cfg['og_image']}"
    og_img_alt = cfg["og_image_alt"]
    is_so = town.lower() == "south orange"
    landmarks = js["landmarks"]
    people = js["people"]
    local_places = js["localPlaces"]
    sources = js["sources"]
    neighbor = js["town"].get("neighbor")

    sitemap_urls = []

    # 1. index.html
    idx_path = ROOT / "index.html"
    idx_html = idx_path.read_text(encoding="utf-8")
    idx_title = f"{town}, {state} History, Historic Maps & House Lookup · {site_title}"
    idx_desc = trim_desc(
        f"Explore 360 years of {town}, {state} history: 1888–2020 historic maps, 1908–1950 house directory lookup, landmarks, notable people and timeline."
    )
    wiki_url = sources.get("wiki", {}).get("url")
    city_node = {
        "@type": "AdministrativeArea",
        "name": f"{town}, New Jersey",
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": js["town"]["center"][0],
            "longitude": js["town"]["center"][1],
        },
    }
    if wiki_url:
        city_node["sameAs"] = wiki_url
    idx_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": f"{site_url}#website",
                "name": site_title,
                "url": site_url,
                "description": idx_desc,
                "inLanguage": "en-US",
                "about": city_node,
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": f"{site_url}house.html?q={{search_term_string}}",
                    },
                    "query-input": "required name=search_term_string",
                },
            }
        ],
    }
    idx_seo = build_head_seo_block(
        canonical=site_url,
        title=idx_title,
        description=idx_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        json_ld=idx_ld,
    )
    idx_html = inject_head_seo(idx_html, idx_title, idx_desc, idx_seo)
    default_year = 1896 if is_so else 1905
    default_era = next(
        (e for e in js["eras"] if e["from"] <= default_year <= e["to"]),
        js["eras"][0],
    )
    era_body_html = "".join(f"<p>{esc(p)}</p>" for p in default_era.get("story", []))
    idx_html = inject_inner_by_id(idx_html, "eraBody", era_body_html)
    if neighbor:
        sister_block = (
            "<!-- seo:sister:start -->\n"
            f'  <section class="section" style="padding:2.2rem 0;border-top:1px solid var(--line)">\n'
            f'    <div class="wrap small muted">Next door: explore <a href="{esc(neighbor["url"])}"><b>{esc(neighbor["name"])} Through Time</b></a> — historic maps, landmarks, notable residents, and 1908–1950 house histories for {esc(neighbor["name"])}, New Jersey.</div>\n'
            f"  </section>\n"
            "  <!-- seo:sister:end -->"
        )
        idx_html = re.sub(
            r"\s*<!-- seo:sister:start -->[\s\S]*?<!-- seo:sister:end -->",
            "",
            idx_html,
        )
        idx_html = idx_html.replace("</main>", f"  {sister_block}\n</main>", 1)
    idx_path.write_text(idx_html, encoding="utf-8")
    sitemap_urls.append(site_url)

    # 2. explore.html
    exp_path = ROOT / "explore.html"
    exp_html = exp_path.read_text(encoding="utf-8")
    exp_url = f"{site_url}explore.html"
    exp_title = f"Interactive Historic Maps of {town}, {state} (1888–2020) · {site_title}"
    exp_desc = trim_desc(
        f"Compare 1888–1972 USGS survey maps, 1930–2020 aerial photos, historic boundaries and {len(local_places)} documented places in {town}, {state}."
    )
    exp_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebApplication",
                "name": exp_title,
                "url": exp_url,
                "applicationCategory": "ReferenceApplication",
                "operatingSystem": "All",
                "description": exp_desc,
            },
            breadcrumb_ld([(site_title, site_url), ("Explore the Map", exp_url)]),
        ],
    }
    exp_seo = build_head_seo_block(
        canonical=exp_url,
        title=exp_title,
        description=exp_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        json_ld=exp_ld,
    )
    exp_html = inject_head_seo(exp_html, exp_title, exp_desc, exp_seo)
    list_html = "".join(
        f'<div class="li on"><span class="li-year">{ "Pre-1666" if p["year"] < 1600 else p["year"] }</span>'
        f'<span class="li-body"><strong>{esc(p["title"])}</strong><span class="small muted">{esc(p["address"])}</span></span></div>'
        for p in sorted(local_places, key=lambda x: -x["year"])[:30]
    )
    exp_html = inject_inner_by_id(exp_html, "list", list_html)
    exp_path.write_text(exp_html, encoding="utf-8")
    sitemap_urls.append(exp_url)

    # 3. house.html
    hs_path = ROOT / "house.html"
    hs_html = hs_path.read_text(encoding="utf-8")
    hs_url = f"{site_url}house.html"
    hs_title = f"{town}, {state} House History & 1908–1950 City Directory Lookup · {site_title}"
    hs_desc = trim_desc(
        f"Look up any {town}, {state} address in 1908–1950 city directories, 1912 & 1949 Sanborn fire-insurance maps, old newspapers and neighborhood histories."
    )
    hs_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "name": hs_title,
                "url": hs_url,
                "description": hs_desc,
            },
            breadcrumb_ld([(site_title, site_url), ("Your House's Story", hs_url)]),
        ],
    }
    hs_seo = build_head_seo_block(
        canonical=hs_url,
        title=hs_title,
        description=hs_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        json_ld=hs_ld,
    )
    hs_html = inject_head_seo(hs_html, hs_title, hs_desc, hs_seo)
    hs_html = re.sub(
        r"\s*<!-- seo:streets:start -->[\s\S]*?<!-- seo:streets:end -->",
        "",
        hs_html,
    )
    street_block = render_street_directory(streets, town)
    if street_block:
        hs_html = hs_html.replace("</main>", f"\n  {street_block}\n</main>", 1)
    hs_path.write_text(hs_html, encoding="utf-8")
    sitemap_urls.append(hs_url)

    # 4. landmarks.html
    lms_path = ROOT / "landmarks.html"
    lms_html = lms_path.read_text(encoding="utf-8")
    lms_url = f"{site_url}landmarks.html"
    lms_title = f"Historic Landmarks & Architecture in {town}, {state} · {site_title}"
    lms_desc = trim_desc(
        f"Explore {len(landmarks)} historic landmarks in {town}, {state} with archival histories, timelines, photographs and 1888–2020 map comparisons."
    )
    sorted_lms = sorted(landmarks.items(), key=lambda kv: kv[1].get("built", 0))
    lms_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "name": lms_title,
                "url": lms_url,
                "description": lms_desc,
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": len(sorted_lms),
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": idx + 1,
                            "name": v["name"],
                            "url": f"{site_url}landmarks/{k}.html",
                        }
                        for idx, (k, v) in enumerate(sorted_lms)
                    ],
                },
            },
            breadcrumb_ld([(site_title, site_url), ("Landmarks", lms_url)]),
        ],
    }
    lms_seo = build_head_seo_block(
        canonical=lms_url,
        title=lms_title,
        description=lms_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        json_ld=lms_ld,
    )
    lms_html = inject_head_seo(lms_html, lms_title, lms_desc, lms_seo)
    lms_html = inject_inner_by_id(lms_html, "lmGrid", render_landmarks_grid(landmarks))
    lms_path.write_text(lms_html, encoding="utf-8")
    sitemap_urls.append(lms_url)

    # 5. people.html
    pp_path = ROOT / "people.html"
    pp_html = pp_path.read_text(encoding="utf-8")
    pp_url = f"{site_url}people.html"
    pp_title = f"Notable People from {town}, {state} — Biographies & Historic Homes · {site_title}"
    pp_desc = trim_desc(
        f"Browse {len(people)} notable artists, musicians, writers, athletes, scientists and public figures with ties to {town}, New Jersey."
    )
    pp_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "name": pp_title,
                "url": pp_url,
                "description": pp_desc,
            },
            breadcrumb_ld([(site_title, site_url), ("Notable People", pp_url)]),
        ],
    }
    pp_seo = build_head_seo_block(
        canonical=pp_url,
        title=pp_title,
        description=pp_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        json_ld=pp_ld,
    )
    pp_html = inject_head_seo(pp_html, pp_title, pp_desc, pp_seo)
    pp_html = inject_inner_by_id(pp_html, "pp", render_people_groups(people, is_so))
    pp_path.write_text(pp_html, encoding="utf-8")
    sitemap_urls.append(pp_url)

    # 6. timeline.html
    tl_path = ROOT / "timeline.html"
    tl_html = tl_path.read_text(encoding="utf-8")
    tl_url = f"{site_url}timeline.html"
    tl_title = f"{town}, {state} History Timeline (1666–Present) · {site_title}"
    tl_desc = trim_desc(
        f"Chronological history timeline of {town}, New Jersey from Lenape trails and colonial farms to the railroad, suburban boom and today."
    )
    tl_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "name": tl_title,
                "url": tl_url,
                "description": tl_desc,
            },
            breadcrumb_ld([(site_title, site_url), ("Timeline", tl_url)]),
        ],
    }
    tl_seo = build_head_seo_block(
        canonical=tl_url,
        title=tl_title,
        description=tl_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        json_ld=tl_ld,
    )
    tl_html = inject_head_seo(tl_html, tl_title, tl_desc, tl_seo)
    tl_html = inject_inner_by_id(tl_html, "tl", render_timeline_html(js))
    tl_path.write_text(tl_html, encoding="utf-8")
    sitemap_urls.append(tl_url)

    # 7. research.html
    rs_path = ROOT / "research.html"
    rs_html = rs_path.read_text(encoding="utf-8")
    rs_url = f"{site_url}research.html"
    rs_title = f"How to Research Your House History in {town}, {state} · {site_title}"
    rs_desc = trim_desc(
        f"Step-by-step guide to researching your {town}, {state} house history using tax records, permits, city directories, Sanborn maps and deeds."
    )
    steps_found = re.findall(
        r"<li[^>]*>\s*<h3>([\s\S]*?)</h3>\s*<p>([\s\S]*?)</p>\s*</li>",
        rs_html,
    )
    howto_steps = [
        {
            "@type": "HowToStep",
            "position": idx + 1,
            "name": html.unescape(re.sub(r"<[^>]+>", "", h).strip()),
            "text": html.unescape(re.sub(r"<[^>]+>", "", p).strip()),
        }
        for idx, (h, p) in enumerate(steps_found)
    ]
    rs_graph = [breadcrumb_ld([(site_title, site_url), ("Research & Sources", rs_url)])]
    if howto_steps:
        rs_graph.insert(
            0,
            {
                "@type": "HowTo",
                "name": f"How to research your {town}, {state} house history",
                "description": rs_desc,
                "step": howto_steps,
            },
        )
    rs_ld = {"@context": "https://schema.org", "@graph": rs_graph}
    rs_seo = build_head_seo_block(
        canonical=rs_url,
        title=rs_title,
        description=rs_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        json_ld=rs_ld,
    )
    rs_html = inject_head_seo(rs_html, rs_title, rs_desc, rs_seo)

    def uses_count(sid: str) -> int:
        return sum(1 for p in js["places"] if sid in (p.get("sources") or [])) + sum(
            1 for e in js["eras"] if sid in (e.get("sources") or [])
        )

    srclist_html = "".join(
        f'<li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["label"])}</a>'
        f'<span class="muted small">cited {uses_count(sid)}×</span></li>'
        for sid, s in sorted(sources.items(), key=lambda kv: -uses_count(kv[0]))
    )
    rs_html = inject_inner_by_id(rs_html, "srclist", srclist_html)
    rs_path.write_text(rs_html, encoding="utf-8")
    sitemap_urls.append(rs_url)

    # 8. landmark.html (legacy query-param shell — noindex, follow -> canonical landmarks.html)
    lm_shell_path = ROOT / "landmark.html"
    lm_shell_html = lm_shell_path.read_text(encoding="utf-8")
    lm_shell_title = f"Landmark · {site_title}"
    lm_shell_desc = f"The history of a {town}, {state} landmark, told through time."
    lm_shell_seo = build_head_seo_block(
        canonical=lms_url,
        title=lm_shell_title,
        description=lm_shell_desc,
        site_title=site_title,
        og_image_url=og_img_url,
        og_image_alt=og_img_alt,
        robots="noindex, follow",
    )
    lm_shell_html = inject_head_seo(
        lm_shell_html, lm_shell_title, lm_shell_desc, lm_shell_seo
    )
    lm_shell_path.write_text(lm_shell_html, encoding="utf-8")

    return sitemap_urls


def write_robots_and_sitemap(site_url: str, urls: list[str], lastmod: str) -> None:
    site_url = site_url.rstrip("/") + "/"
    robots_txt = f"User-agent: *\nAllow: /\n\nSitemap: {site_url}sitemap.xml\n"
    (ROOT / "robots.txt").write_text(robots_txt, encoding="utf-8")

    high_pri = {f"{site_url}house.html", f"{site_url}landmarks.html", f"{site_url}explore.html"}
    url_entries = []
    for u in urls:
        priority = "1.0" if u == site_url else ("0.9" if u in high_pri else "0.8")
        url_entries.append(
            f"  <url>\n    <loc>{esc(u)}</loc>\n    <lastmod>{lastmod}</lastmod>\n    <priority>{priority}</priority>\n  </url>"
        )
    sitemap_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(url_entries)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(sitemap_xml, encoding="utf-8")


def main() -> None:
    repo = load_repo_data()
    site_url = repo["cfg"]["site_url"]
    core_urls = update_root_pages(repo)
    lm_urls = build_landmark_pages(repo)
    all_urls = core_urls + lm_urls
    write_robots_and_sitemap(site_url, all_urls, repo["lastmod"])
    print(
        f"[{repo['cfg']['name']}] Built robots.txt, sitemap.xml ({len(all_urls)} URLs), "
        f"and {len(lm_urls)} static landmark pages."
    )


if __name__ == "__main__":
    main()
