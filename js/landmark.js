/* Landmark pages: landmark.html?id=<id>, plus the landmarks index (landmarks.html) */
document.addEventListener("DOMContentLoaded", () => {
  const MW = window.MW, esc = MW.esc;
  const $ = s => document.querySelector(s);
  const id = new URLSearchParams(location.search).get("id");
  const L = MW.landmarks || {};
  const AGES = [["1888", "map", "USGS survey map"], ["1898", "map", "USGS survey map"], ["1906", "map", "USGS survey map"], ["1921", "map", "USGS survey map"],
    ["1930", "aerial", "Aerial photograph"], ["1947", "map", "USGS topographic map"], ["1955", "map", "USGS topographic map"], ["1972", "map", "USGS topographic map"],
    ["1995", "aerial", "Color-infrared aerial"], ["2007", "aerial", "Aerial photograph"], ["2020", "aerial", "Aerial photograph"]];
  const link = s => typeof s === "string" ? (MW.sources[s] ? `<a href="${MW.sources[s].url}" target="_blank" rel="noopener">${esc(MW.sources[s].label)}</a>` : esc(s))
    : `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a>`;

  // ---------- index page ----------
  if (document.body.dataset.page === "landmarks") {
    const list = Object.entries(L).sort((a, b) => a[1].built - b[1].built);
    $("#lmGrid").innerHTML = list.map(([k, v], i) => {
      const cover = (v.photos && v.photos[0]) ? v.photos[0].src : `img/ages/${k}/2020-aerial.jpg`;
      return `<a class="lm-card reveal d${i % 3}" href="landmark.html?id=${k}">
        <div class="lm-cover" style="background-image:url('${cover}')"><span class="lm-year">${esc(v.builtLabel || v.built)}</span></div>
        <div class="lm-body"><span class="tag ${v.kind || "house"}">${esc(v.type)}</span><h3>${esc(v.name)}</h3><p class="small muted">📍 ${esc(v.address)}</p><p>${esc(v.tagline)}</p></div></a>`;
    }).join("");
    MW.observeReveals();
    return;
  }

  const v = L[id];
  if (!v) { $("#lm").innerHTML = `<section class="section"><div class="wrap"><h1>Landmark not found</h1><p><a href="landmarks.html">See all landmarks →</a></p></div></section>`; return; }
  document.title = `${v.name} · Maplewood Through Time`;
  const hero = (v.photos && v.photos.find(p => p.hero)) || (v.photos && v.photos[0]);
  const ages = AGES.map(([y, kind, label]) => ({ y: +y, kind, label, src: `img/ages/${id}/${y}-${kind}.jpg` }));

  $("#lm").innerHTML = `
  <header class="lm-hero" style="${hero ? `background-image:url('${hero.src}')` : `background-image:url('img/ages/${id}/1930-aerial.jpg')`}">
    <div class="lm-hero-shade"></div>
    <div class="wrap lm-hero-in">
      <a class="back" href="landmarks.html">← All landmarks</a>
      <div class="eyebrow">${esc(v.type)} · ${esc(v.builtLabel || String(v.built))}</div>
      <h1>${esc(v.name)}</h1>
      <p class="lede">${esc(v.tagline)}</p>
      <div class="lm-meta"><span>📍 ${esc(v.address)}${v.approx ? " (map position approximate)" : ""}</span>${v.designation ? `<span>🏛 ${esc(v.designation)}</span>` : ""}${v.architect ? `<span>✏️ ${esc(v.architect)}</span>` : ""}</div>
      ${hero ? `<p class="hero-credit">${esc(hero.caption || "")} ${hero.credit ? `· ${esc(hero.credit)}` : ""}${hero.license ? ` · ${esc(hero.license)}` : ""}</p>` : ""}
    </div>
  </header>

  <section class="section lm-story">
    <div class="wrap lm-grid">
      <article class="lm-text">
        ${v.sections.map(s => `<section class="reveal"><h2>${esc(s.h)}</h2>${s.p.map(p => `<p>${esc(p)}</p>`).join("")}</section>`).join("")}
        ${v.facts && v.facts.length ? `<section class="reveal"><h2>Did you know?</h2><ul class="lm-facts">${v.facts.map(f => `<li>${esc(f)}</li>`).join("")}</ul></section>` : ""}
      </article>
      <aside class="lm-side">
        <div class="card lm-tl reveal"><h3>Timeline</h3><ol>${v.timeline.map(t => `<li><b>${esc(String(t.y))}</b><span>${esc(t.t)}</span></li>`).join("")}</ol></div>
        <div class="card reveal"><h3>On the map</h3><div id="lmMap" class="lm-map"></div>
          <p class="small"><a href="${v.place ? `explore.html?place=${v.place}&year=${Math.max(1888, v.built)}` : "explore.html"}">Open in Explore the Map →</a> · <a href="house.html?q=${encodeURIComponent(v.address.split(/[(;]/)[0] + ", Maplewood, NJ")}">House story →</a></p></div>
      </aside>
    </div>
  </section>

  <section class="section ages-sec">
    <div class="wrap">
      <div class="eyebrow">Through the ages</div>
      <h2 class="reveal">The same spot, ${ages[0].y}–${ages[ages.length - 1].y}</h2>
      <p class="muted reveal">Dated survey maps and aerial photographs, all centered on ${esc(v.name)}. Drag the slider or click a year. The marker shows the landmark.</p>
      <div class="ages reveal">
        <div class="ages-frame">${ages.map((a, i) => `<img src="${a.src}" alt="${a.label}, ${a.y}" data-i="${i}" class="${i ? "" : "on"}" loading="${i < 2 ? "eager" : "lazy"}" onerror="this.dataset.missing=1">`).join("")}
          <div class="ages-pin"></div><div class="ages-label" id="agesLabel"></div></div>
        <input type="range" id="agesRange" min="0" max="${ages.length - 1}" value="0" aria-label="Choose a year">
        <div class="ages-years">${ages.map((a, i) => `<button data-i="${i}">${a.y}</button>`).join("")}</div>
      </div>
      <p class="small muted">Maps: U.S. Geological Survey historical topographic maps (public domain). Aerials: New Jersey Office of GIS.</p>
    </div>
  </section>

  ${v.photos && v.photos.length ? `<section class="section photos-sec"><div class="wrap">
    <div class="eyebrow">Pictures</div><h2 class="reveal">${esc(v.name)} in photographs</h2>
    <div class="photo-grid">${v.photos.map((p, i) => `<figure class="ph reveal d${i % 3}"><a href="${p.link || p.src}" target="_blank" rel="noopener"><img src="${p.src}" alt="${esc(p.caption || v.name)}" loading="lazy"></a>
      <figcaption>${p.year ? `<b>${esc(String(p.year))}</b> · ` : ""}${esc(p.caption || "")}<span class="credit">${esc(p.credit || "")}${p.license ? ` · ${esc(p.license)}` : ""}</span></figcaption></figure>`).join("")}</div>
    ${v.photoLinks && v.photoLinks.length ? `<p class="small muted" style="margin-top:1rem">More historic photos (copyrighted, viewable at their source): ${v.photoLinks.map(link).join(" · ")}</p>` : ""}
  </div></section>` : ""}

  ${v.clippings && v.clippings.length ? `<section class="section"><div class="wrap"><div class="eyebrow">From the library's scrapbooks</div><h2 class="reveal">In the news</h2>
    <div class="news-grid">${v.clippings.map(c => `<a class="clip reveal" href="${c.src}" target="_blank" rel="noopener"><span class="doc-year">${c.year}</span><img src="${c.img}" alt="Clipping ${c.year}" loading="lazy"><span class="doc-cap">${esc(c.caption || "Scrapbook, " + c.year)}</span></a>`).join("")}</div></div></section>` : ""}

  <section class="section lm-sources"><div class="wrap">
    <h2>Sources</h2><ul>${v.sources.map(s => `<li>${link(s)}</li>`).join("")}</ul>
    <p class="small muted">The narrative is our synthesis of the sources listed. Where sources disagree, the text says so.</p>
  </div></section>`;

  // newspaper clippings from the library scrapbooks that mention this address (archive data, if present)
  (async () => {
    const m = v.address.match(/^(\d+)[^ ]*\s+([A-Za-z ]+?)(?:\s*[(,]|$)/); if (!m) return;
    try {
      const slug = m[2].trim().toLowerCase().replace(/\s+/g, "-").replace(/-ave$/, "-avenue").replace(/-st$/, "-street").replace(/-rd$/, "-road");
      const r = await fetch(`archive/data/streets/${slug}.json`); if (!r.ok) return;
      const h = (await r.json()).houses[m[1]]; if (!h) return;
      const items = (h.news || []).slice(0, 6), cards = (h.cards || []).slice(0, 2);
      if (!items.length && !cards.length) return;
      document.querySelector(".lm-sources").insertAdjacentHTML("beforebegin", `<section class="section"><div class="wrap"><div class="eyebrow">From the Maplewood Memorial Library's archive</div><h2>Documents</h2>
        <div class="news-grid">${cards.map(c => `<a class="clip" href="${c.src}" target="_blank" rel="noopener"><img src="archive/${c.img}" alt="Real-estate listing card" loading="lazy"><span class="doc-cap">Real-estate listing card</span></a>`).join("")}
        ${items.map(c => `<a class="clip" href="${c.src}" target="_blank" rel="noopener"><span class="doc-year">${c.year}</span><img src="archive/${c.crop}" alt="Clipping ${c.year}" loading="lazy"><span class="doc-cap">Scrapbook clipping, ${c.year}</span></a>`).join("")}</div></div></section>`);
    } catch (e) { /* archive not present */ }
  })();

  // map
  if (window.L && v.lat) {
    const m = window.L.map("lmMap", { zoomControl: false, scrollWheelZoom: false, attributionControl: true }).setView([v.lat, v.lon], 16);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }).addTo(m);
    window.L.circleMarker([v.lat, v.lon], { radius: 10, color: "#fff", weight: 3, fillColor: "#b8381e", fillOpacity: 1 }).addTo(m);
  }

  // through-the-ages slider
  const imgs = [...document.querySelectorAll(".ages-frame img")], range = $("#agesRange");
  function show(i) {
    imgs.forEach((im, k) => im.classList.toggle("on", k === i));
    range.value = i;
    $("#agesLabel").innerHTML = `<b>${ages[i].y}</b> · ${ages[i].label}`;
    document.querySelectorAll(".ages-years button").forEach((b, k) => b.classList.toggle("on", k === i));
  }
  range.addEventListener("input", () => show(+range.value));
  document.querySelectorAll(".ages-years button").forEach(b => b.onclick = () => show(+b.dataset.i));
  imgs.forEach((im, k) => im.addEventListener("error", () => { document.querySelectorAll(".ages-years button")[k].disabled = true; }));
  show(0);
  let timer = setInterval(() => { const n = (+range.value + 1) % ages.length; show(n); }, 2600);
  ["pointerdown", "keydown"].forEach(ev => document.querySelector(".ages").addEventListener(ev, () => clearInterval(timer), { once: true }));
  MW.observeReveals();
});
