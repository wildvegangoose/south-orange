/* Explore page: time-traveling Leaflet map */
document.addEventListener("DOMContentLoaded", () => {
  const MW = window.MW, L = window.L;
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  let year = +params.get("year") || 1922;
  const focus = params.get("place");
  const kinds = Object.keys(MW.kindLabel);
  const active = new Set(kinds);
  const colors = { house: "#b8381e", civic: "#2f4f5a", transport: "#5a4c40", nature: "#2d5240", culture: "#c98a1e", event: "#4f3b4a", commerce: "#8e2914" };
  const glyph = { house: "⌂", civic: "★", transport: "⛟", nature: "♣", culture: "♪", event: "✦", commerce: "$" };

  if (!L) { $("#map").innerHTML = '<p style="padding:2rem">The map library could not load. Check your connection.</p>'; return; }

  const map = L.map("map", { zoomControl: false, scrollWheelZoom: true, minZoom: 11, maxZoom: 18 }).setView(MW.town.center, 15);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // ---------- Boundaries as they were in the selected year ----------
  // Outlines for older eras are unions of today's towns (approximate); see data/boundaries.js.
  const rings = g => (g.type === "MultiPolygon" ? g.coordinates : [g.coordinates]).map(p => p[0].map(([lon, lat]) => [lat, lon]));
  const today = window.MW_BOUNDARY ? L.polygon(rings(MW_BOUNDARY), { interactive: false }) : null;
  if (today) map.fitBounds(today.getBounds(), { padding: [20, 20] });
  map.createPane("jur").style.zIndex = 380;
  map.getPane("jur").style.pointerEvents = "none";
  const jurStyle = j => j.to >= 2026 && !j.inner ? { color: "#b8381e", weight: 3, dashArray: "8 6" }
    : j.inner ? { color: MW.town.innerColor || "#b8381e", weight: 2.5, dashArray: "2 6" }
    : { color: "#4f3b4a", weight: 3.5, dashArray: "10 7" };
  const jurLayers = {};
  const jurLayer = j => jurLayers[j.id] || (jurLayers[j.id] = (() => {
    const g = L.layerGroup();
    const r = rings(j.geometry);
    L.polygon([[[41.2, -75], [41.2, -73.4], [40.3, -73.4], [40.3, -75]], ...r], { pane: "jur", stroke: false, fillColor: "#f6efdf", fillOpacity: j.to >= 2026 ? .45 : .3, interactive: false }).addTo(g);
    const poly = L.polygon(r, Object.assign({ pane: "jur", fill: false, interactive: false, className: "jur-line" }, jurStyle(j))).addTo(g);
    g._poly = poly;
    return g;
  })());
  const refToday = today ? L.polygon(rings(MW_BOUNDARY), { pane: "jur", color: "#7a6e62", weight: 2, dashArray: "2 6", fill: false, interactive: false }) : null;
  let jurShown = [];
  function setJurisdictions(y) {
    // Draw only the outermost outline as a mask; inner (village) outlines as lines only.
    const js = MW.jurisdictionsFor(y);
    jurShown.forEach(j => { if (!js.includes(j)) jurLayer(j).remove(); });
    js.forEach((j, i) => {
      const g = jurLayer(j); g.addTo(map);
      g.eachLayer(l => { if (l !== g._poly) l.setStyle({ fillOpacity: i === 0 ? (j.id.startsWith("village") ? .45 : .3) : 0 }); });
    });
    jurShown = js;
    if (refToday) { if (js.length) refToday.remove(); else refToday.addTo(map); }
    return js;
  }

  // Seats of government for the year (square pins). Off-map seats are described in the side box.
  const seatIcon = L.divIcon({ className: "seat-wrap", html: '<div class="seat-pin"><span>★</span></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
  const seatMarkers = MW.seats.filter(s => s.lat).map(s => ({ s, m: L.marker([s.lat, s.lon], { icon: seatIcon, title: s.title, zIndexOffset: 500 })
    .bindPopup(`<div class="mpop"><span class="tag civic">Seat of government · ${s.from}–${s.to >= 2100 ? "today" : s.to}</span><h3>${MW.esc(s.title)}</h3><div class="small muted" style="margin-bottom:.5rem">📍 ${MW.esc(s.place)}</div><p>${MW.esc(s.text)}</p><div class="sources">Sources: ${MW.sourceLinks(s.sources)}</div></div>`, { maxWidth: 360, className: "mw-popup" }) }));

  function renderJurBox(y, js) {
    const n = MW.nameFor(y), seats = MW.seatsFor(y);
    $("#townName").textContent = n.name;
    $("#townSub").textContent = n.sub;
    if (y < 1666) { $("#jurBox").innerHTML = `<div class="jb-k">Who governed here</div><p>No colonial government yet. This was Lenapehoking, the Lenape homeland. The faint dotted line shows ${MW.esc(MW.town.todayLabel || "today's town")} for reference.</p>`; return; }
    const outer = js[0];
    $("#jurBox").innerHTML = `<div class="jb-k">Who governed here in ${y}</div>
      ${js.map(j => `<h3>${MW.esc(j.name)}</h3><p class="small muted">${MW.esc(j.note)}</p>`).join("")}
      ${seats.map(s => `<p class="jb-seat small"><b>★ ${MW.esc(s.title)}</b>: ${MW.esc(s.place)}.${s.lat ? ` <button data-seat="${s.id}">Show on map</button>` : ""}</p>`).join("")}
      <div class="jb-actions">${outer && outer.to < 2026 ? `<button data-fit="${outer.id}">See all of ${MW.esc(outer.name)}</button>` : ""}<button data-fit="today">Back to ${MW.esc(MW.town.todayLabel || "today's town")}</button></div>
      <p class="small muted">Older outlines are approximate: they are drawn from today's town lines. <span class="sources">${MW.sourceLinks(["tiger"])}</span></p>`;
  }
  $("#jurBox").addEventListener("click", e => {
    const f = e.target.closest("[data-fit]"), st = e.target.closest("[data-seat]");
    if (f) map.flyToBounds(f.dataset.fit === "today" ? today.getBounds() : jurLayer(MW.jurisdictionsFor(year).find(j => j.id === f.dataset.fit))._poly.getBounds(), { padding: [20, 20], duration: .8 });
    if (st) { const o = seatMarkers.find(o => o.s.id === st.dataset.seat); map.flyTo(o.m.getLatLng(), o.s.offmap ? 14 : 16, { duration: .8 }); setTimeout(() => o.m.openPopup(), 850); }
  });

  // ---------- Historic maps: real dated maps under the pins ----------
  const BOUNDS = [[40.708, -74.300], [40.778, -74.215]];
  const USGS = 'Historical topographic maps: <a href="https://www.usgs.gov/programs/national-geospatial-program/historical-topographic-maps-preserving-past" target="_blank" rel="noopener">U.S. Geological Survey</a>';
  const NJ = 'Aerial imagery: <a href="https://njgin.nj.gov/" target="_blank" rel="noopener">NJ Office of GIS</a>';
  const HIST = [
    { year: 1888, type: "img", file: "topo1888", name: "USGS survey map, 1888", note: "Plainfield, Morristown & Paterson sheets, 1:62,500. South Orange is a village strung along the railroad and South Orange Avenue.", attr: USGS },
    { year: 1898, type: "img", file: "topo1898", name: "USGS survey map, 1898", note: "1:62,500 survey sheets.", attr: USGS },
    { year: 1905, type: "img", file: "topo1906", name: "USGS survey map, 1905–06", note: "Plainfield (1905), Morristown (1906), Paterson (1906 printing) & Staten Island sheets, 1:62,500. The first map after the Village left the township.", attr: USGS },
    { year: 1921, type: "img", file: "topo1921", name: "USGS survey map, 1921", note: "1:62,500 survey sheets (the Paterson sheet is a 1924 printing), just before the 1920s boom.", attr: USGS },
    { year: 1930, type: "wms", layer: "BlackWhite1930", name: "Aerial photograph, 1930", note: "New Jersey's statewide 1930 aerial survey, the year Edison's electric trains arrived. The 1916 elevated station sits on its embankment.", attr: NJ },
    { year: 1947, type: "img", file: "topo1947", name: "USGS topographic map, 1947", note: "Orange, Caldwell, Roselle & Elizabeth quadrangles, 1:24,000. Individual buildings are shown.", attr: USGS },
    { year: 1955, type: "img", file: "topo1958", name: "USGS topographic map, 1955", note: "1:24,000 quadrangles surveyed in 1954–55 (printed 1956–58).", attr: USGS },
    { year: 1972, type: "img", file: "topo1972", name: "USGS topographic map, 1972 revision", note: "Photo-revised 1:24,000 quadrangles (Orange 1972; the southeast corner is the 1964 Elizabeth sheet).", attr: USGS },
    { year: 1995, type: "wms", layer: "Infrared1995", name: "Color-infrared aerial, 1995", note: "In infrared photos, healthy trees and lawns show up red.", attr: NJ },
    { year: 2007, type: "wms", layer: "Natural2007", name: "Aerial photograph, 2007", note: "Statewide natural-color aerial imagery.", attr: NJ },
    { year: 2020, type: "wms", layer: "Natural2020", name: "Aerial photograph, 2020", note: "The most recent statewide aerial imagery.", attr: NJ }
  ];
  map.createPane("hist").style.zIndex = 250;
  let histOn = true, histOpacity = 1, histCur = null;
  const histLayer = h => h._l || (h._l = h.type === "img"
    ? L.imageOverlay(`img/maps/${h.file}.webp`, BOUNDS, { pane: "hist", opacity: 0, attribution: h.attr, className: "hist-img" })
    : L.tileLayer.wms(`https://img.nj.gov/imagerywms/${h.layer}`, { layers: h.layer, format: "image/jpeg", version: "1.1.1", pane: "hist", opacity: 0, attribution: h.attr, maxZoom: 19, bounds: [[40.69, -74.33], [40.79, -74.20]] }));
  function histFor(y) { return y < 1800 ? null : [...HIST].reverse().find(h => h.year <= y) || HIST[0]; }
  function setHist(y) {
    const h = histOn ? histFor(y) : null;
    if (h !== histCur) {
      const old = histCur; histCur = h;
      if (h) { const l = histLayer(h); l.addTo(map); requestAnimationFrame(() => l.setOpacity(histOpacity)); }
      if (old) { const l = histLayer(old); l.setOpacity(0); setTimeout(() => { if (histCur !== old) l.remove(); }, 700); }
    } else if (h) histLayer(h).setOpacity(histOpacity);
    document.documentElement.classList.toggle("hist-showing", !!h);
    const full = HIST.find(x => x === h);
    $("#histName").textContent = h ? h.name : (histOn ? "Today's streets" : "Today's streets (historic maps off)");
    $("#histNote").innerHTML = h ? (y < h.year ? `<b>No surveyed map from ${y}.</b> This is the earliest one, from ${h.year}. ` : "") + h.note
      : histOn ? "No maps exist from this era, so you're seeing today's streets, tinted." : "Turn historic maps on to see dated maps and aerial photos under the pins.";
    document.querySelectorAll("#histYears .hy").forEach(b => b.classList.toggle("on", full && +b.dataset.y === full.year));
    return h;
  }

  // Historic roads, revealed by date
  const roads = MW.oldRoads.map(r => {
    const line = L.polyline(r.pts, { color: "#e3a33a", weight: 7, opacity: .75, lineCap: "round", className: "oldroad" });
    line.bindTooltip(r.name + (r.from > 1500 ? ` · from ${r.from}` : " · Lenape trail tradition"), { sticky: true });
    return { line, from: r.from };
  });

  // Markers
  const markers = MW.places.map(p => {
    const icon = L.divIcon({
      className: "pin-wrap" + (p.scope ? " shared" : ""),
      html: `${p.landmark ? '<div class="pin-ring" style="--c:' + colors[p.kind] + '"></div>' : ""}<div class="pin" style="--c:${colors[p.kind]}"><span>${glyph[p.kind]}</span></div>`,
      iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -38]
    });
    const m = L.marker([p.lat, p.lon], { icon, title: p.title, riseOnHover: true });
    const act = p.scope ? `<p class="small muted">Outside today's Village: shown only while it was part of the same township.</p>`
      : `<a href="house.html?q=${encodeURIComponent(p.address.split(/[;(]/)[0] + MW.town.geocodeSuffix)}&lat=${p.lat}&lon=${p.lon}&label=${encodeURIComponent(p.title)}">Tell this spot's story →</a>`;
    m.bindPopup(`<div class="mpop">${MW.placeCard(p)}<div class="mpop-actions">${act}</div></div>`, { maxWidth: 360, className: "mw-popup" });
    return { p, m, state: "hidden" };
  });

  function update(y, boot) {
    year = y;
    $("#bigYear").textContent = y;
    const era = MW.eraFor(y);
    $("#eraLine").innerHTML = `<b>${era.name}</b>. ${era.tagline}`;
    if (!boot) history.replaceState(null, "", "?year=" + y);
    // vintage tint on tiles
    const sep = y < 1900 ? .75 : y < 1950 ? .75 - (y - 1900) / 50 * .5 : y < 2000 ? .25 - (y - 1950) / 50 * .25 : 0;
    document.documentElement.style.setProperty("--tile-filter", `sepia(${sep.toFixed(2)}) saturate(${(1 - sep * .5).toFixed(2)}) contrast(${(1 - sep * .08).toFixed(2)}) brightness(${(1 + sep * .04).toFixed(2)})`);
    const hm = setHist(y);
    const js = setJurisdictions(y);
    renderJurBox(y, js);
    seatMarkers.forEach(({ s, m }) => { if (y >= s.from && y <= s.to) m.addTo(map); else m.remove(); });
    $("#mapBadge").innerHTML = `<b>${y}</b> · ${(n => `${n} place${n === 1 ? "" : "s"}`)(MW.localPlaces().filter(p => p.year <= y && (!p.end || p.end >= y)).length)}${hm ? ` · <span class="bm">${hm.name}</span>` : ""}`;

    roads.forEach(r => { if (y >= r.from) r.line.addTo(map); else r.line.remove(); });

    markers.forEach(o => {
      const { p, m } = o;
      let st = p.year > y || !active.has(p.kind) ? "hidden" : (p.end && p.end < y ? (p.scope ? "hidden" : "ghost") : "on");
      if (st === o.state) return;
      if (st === "hidden") m.remove(); else {
        m.addTo(map);
        const el = m.getElement();
        if (el) { el.classList.toggle("ghost", st === "ghost"); if (o.state === "hidden") { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); } }
      }
      o.state = st;
    });
    renderList();
  }

  function renderList() {
    const shown = markers.filter(o => o.state !== "hidden").sort((a, b) => b.p.year - a.p.year);
    $("#list").innerHTML = shown.length ? shown.map(({ p, state }) => `<button class="li ${state}" data-id="${p.id}">
        <span class="li-year" style="color:${colors[p.kind]}">${p.year < 1600 ? "Pre-1666" : p.year}</span>
        <span class="li-body"><strong>${MW.esc(p.title)}</strong><span class="small muted">${MW.esc(p.address)}${state === "ghost" ? " · gone by " + year : ""}</span></span></button>`).join("")
      : `<p class="muted small" style="padding:1rem">Nothing on the map yet. Try a later year.</p>`;
  }

  $("#list").addEventListener("click", e => {
    const b = e.target.closest(".li"); if (!b) return;
    const o = markers.find(o => o.p.id === b.dataset.id);
    map.flyTo(o.m.getLatLng(), 17, { duration: .8 });
    setTimeout(() => o.m.openPopup(), 850);
  });

  $("#filters").innerHTML = kinds.map(k => `<button class="chip active kchip" data-k="${k}" style="--c:${colors[k]}"><i></i>${MW.kindLabel[k]}</button>`).join("");
  $("#filters").addEventListener("click", e => {
    const b = e.target.closest(".kchip"); if (!b) return;
    const k = b.dataset.k;
    if (active.has(k)) active.delete(k); else active.add(k);
    b.classList.toggle("active", active.has(k));
    update(year);
  });

  $("#histYears").innerHTML = HIST.map(h => `<button class="hy" data-y="${h.year}" title="${MW.esc(h.name)}">${h.year}</button>`).join("");
  $("#histYears").addEventListener("click", e => { const b = e.target.closest(".hy"); if (b) { if (!histOn) { histOn = true; $("#histToggle").checked = true; } slider.set(+b.dataset.y); } });
  $("#histToggle").addEventListener("change", e => { histOn = e.target.checked; $("#histBox").classList.toggle("off", !histOn); update(year); });
  $("#histOpacity").addEventListener("input", e => { histOpacity = e.target.value / 100; if (histCur) histLayer(histCur).setOpacity(histOpacity); });

  const slider = MW.timeSlider($("#slider"), {
    min: 1600, max: 2026, value: year, chips: false,
    ticks: [1666, 1806, 1861, 1950, 2026], onChange: update
  });
  update(year, true);

  if (focus) {
    const o = markers.find(o => o.p.id === focus);
    if (o) { slider.set(Math.max(year, o.p.year)); map.setView(o.m.getLatLng(), 17); setTimeout(() => o.m.openPopup(), 400); }
  }

  $("#addrForm").addEventListener("submit", e => {
    const v = e.target.q.value.trim(); if (!v) { e.preventDefault(); }
  });
});
