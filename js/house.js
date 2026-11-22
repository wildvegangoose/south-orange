/* Your House's Story: geocode an address and narrate that spot through time */
document.addEventListener("DOMContentLoaded", () => {
  const MW = window.MW, L = window.L, K = MW.SceneKit;
  const $ = s => document.querySelector(s);
  const G = MW.geo;
  const params = new URLSearchParams(location.search);
  const stations = [{ name: "South Orange station", at: [40.74583, -74.26083] }, { name: "Mountain Station", at: [40.75530, -74.25284] }];
  const BBOX = "-74.2860,40.7650,-74.2320,40.7330";
  const v1869 = (window.MW_JURISDICTIONS || []).find(j => j.id === "village1869");

  MW.leaves($(".house-hero"), 10);

  // ---------- form ----------
  const form = $("#houseForm");
  if (params.get("q")) form.q.value = params.get("q");
  if (params.get("built")) form.built.value = params.get("built");
  document.querySelectorAll(".try button").forEach(b => b.onclick = () => {
    form.q.value = b.dataset.q; form.built.value = b.dataset.b || ""; form.requestSubmit();
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const q = form.q.value.trim(), built = +form.built.value || null;
    if (!q) return;
    const u = new URLSearchParams({ q }); if (built) u.set("built", built);
    history.replaceState(null, "", "?" + u);
    locate(q, built);
  });

  function status(html, kind = "") { $("#status").innerHTML = html ? `<div class="status-box ${kind}">${html}</div>` : ""; }

  const inside = (lat, lon) => G.inTown([lat, lon]);

  async function locate(q, built, preset) {
    status(`<span class="spinner"></span> Searching old maps for <b>${MW.esc(q)}</b>…`);
    let hit = preset;
    if (!hit) {
      const query = /south orange/i.test(q) ? q : q + MW.town.geocodeSuffix;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=us&viewbox=${BBOX}&bounded=1&q=${encodeURIComponent(query)}`, { headers: { "Accept": "application/json" } });
        const d = await r.json();
        if (d && d[0]) hit = { lat: +d[0].lat, lon: +d[0].lon, label: d[0].display_name.split(",").slice(0, 2).join(",").trim(), precise: !!(d[0].address && d[0].address.house_number) || !/^\s*\d/.test(q) };
        if (!hit.precise && d[0].address && d[0].address.road) hit.label = d[0].address.road;
        if (d[0].address) { hit.road = d[0].address.road; hit.number = d[0].address.house_number; }
      } catch (err) { /* refused or offline: fall back to Photon below */ }
      if (!hit) {
        try { // Photon (komoot), also OpenStreetMap-based, as a fallback geocoder
          const r = await fetch(`https://photon.komoot.io/api/?limit=1&bbox=-74.2860,40.7330,-74.2320,40.7650&q=${encodeURIComponent(query)}`);
          const f = ((await r.json()).features || [])[0];
          if (f) {
            const pr = f.properties, [lon, lat] = f.geometry.coordinates;
            const road = pr.street || (pr.type === "street" ? pr.name : null);
            hit = { lat, lon, road, number: pr.housenumber, label: pr.housenumber ? `${pr.housenumber} ${road}` : road || pr.name,
              precise: !!pr.housenumber || !/^\s*\d/.test(q) };
          }
        } catch (err) { /* network */ }
      }
    }
    if (!hit) {
      status(`We couldn't find <b>${MW.esc(q)}</b> in South Orange. Check the spelling, try just the street name, or <button class="linkish" id="pickMap">pick the spot on a map</button>.`, "warn");
      $("#pickMap").onclick = () => pickOnMap(built);
      return;
    }
    if (!inside(hit.lat, hit.lon)) {
      // House stories cover today's Village only (docs/DECISIONS.md).
      status(`<b>${MW.esc(hit.label || q)}</b> is outside today's South Orange Village, so we can't tell its story here. If it's in Maplewood, try <a href="${MW.town.neighbor.url}house.html?q=${encodeURIComponent(q.replace(/,?\s*south orange.*$/i, ""))}">${MW.town.neighbor.name} Through Time</a>. Or <button class="linkish" id="pickMap">pick a spot in South Orange on a map</button>.`, "warn");
      $("#pickMap").onclick = () => pickOnMap(built);
      $("#story").hidden = true;
      return;
    }
    status(hit.precise === false ? `We found the street but not the exact house number, so the story uses a point on <b>${MW.esc(hit.label)}</b>.` : "");
    tell(hit, q, built);
  }

  function pickOnMap(built) {
    $("#story").hidden = false;
    $("#chapters").innerHTML = ""; $("#neighbors").innerHTML = ""; $("#researchBox").innerHTML = ""; $("#landmarkBanner").innerHTML = "";
    $("#storyTitle").textContent = "Click your spot on the map";
    $("#sectionName").textContent = "Choose a location"; $("#glance").innerHTML = "";
    const m = ensureMap(MW.town.center, 14);
    const pick = e => {
      if (!inside(e.latlng.lat, e.latlng.lng)) { status("That spot is outside today's Village. Click inside the dashed line.", "warn"); m.once("click", pick); return; }
      status(""); tell({ lat: e.latlng.lat, lon: e.latlng.lng, label: "Your chosen spot", precise: true }, "Your chosen spot", built);
    };
    m.once("click", pick);
    status("Click anywhere inside South Orange (the dashed line) on the map below.");
    $("#miniMap").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  let mini, miniLayer;
  function ensureMap(center, z) {
    if (!L) return null;
    if (!mini) {
      mini = L.map("miniMap", { zoomControl: true, scrollWheelZoom: false }).setView(center, z);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }).addTo(mini);
      if (window.MW_BOUNDARY) L.polygon(MW_BOUNDARY.coordinates[0].map(([a, b]) => [b, a]), { color: "#b8381e", weight: 2, dashArray: "6 5", fill: false, interactive: false }).addTo(mini);
    } else mini.setView(center, z);
    setTimeout(() => mini.invalidateSize(), 50);
    return mini;
  }

  // ---------- the story ----------
  function tell(hit, q, built) {
    const here = [hit.lat, hit.lon];
    const sec = MW.sections.map(s => ({ s, d: G.distM(here, [s.lat, s.lon]) })).sort((a, b) => a.d - b.d)[0].s;
    const roads = MW.oldRoads.map(r => ({ r, d: G.distToLineM(here, r.pts) })).sort((a, b) => a.d - b.d);
    const near = MW.localPlaces().filter(p => !["trail", "turnpike", "horsecar", "township", "charter", "separation", "hpc", "rename2024"].includes(p.id)).map(p => ({ p, d: G.distM(here, [p.lat, p.lon]) })).sort((a, b) => a.d - b.d);
    const landmark = near.find(n => n.p.landmark && n.d < 45);
    const colonialNear = near.filter(n => n.p.kind === "house" && n.p.year < 1800 && n.d > 45)[0];
    const st = stations.map(x => ({ x, d: G.distM(here, x.at) })).sort((a, b) => a.d - b.d)[0];
    const dStation = st.d;
    const in1869 = v1869 ? G.inPolygon(here, v1869.geometry) : true;
    const stone = MW.places.find(p => p.id === "stonehouse"), dStone = G.distM(here, [stone.lat, stone.lon]);
    const title = hit.label && hit.label !== "Your chosen spot" ? q.replace(/,?\s*south orange.*$/i, "") : "Your chosen spot";
    const prettyTitle = title.replace(/\b\w/g, c => c.toUpperCase());
    if (title !== "Your chosen spot") document.title = `${prettyTitle} — ${MW.town.name}, NJ House History · ${MW.town.siteTitle}`;
    const style = built ? MW.styleFor(built) : null;

    $("#story").hidden = false;
    $("#sectionName").textContent = "In " + sec.name;
    $("#storyTitle").textContent = prettyTitle;
    $("#glance").innerHTML = [
      ["Old road", `${roads[0].r.name.split(" (")[0]}, ${G.fmt(roads[0].d)} away`],
      ["Station", `${G.walkMin(dStation)} min walk to ${st.x.name}`],
      ["Oldest neighbor", colonialNear ? `${colonialNear.p.title} (${colonialNear.p.year}), ${G.fmt(colonialNear.d)}` : "n/a"],
      built ? ["Built", `${built} · ${style.name} era`] : ["Built", `<button class="linkish" id="addYear">Add a year →</button>`]
    ].map(([k, v]) => `<div class="g"><span>${k}</span><b>${v}</b></div>`).join("");
    const addYear = $("#addYear"); if (addYear) addYear.onclick = () => { form.built.focus(); scrollTo({ top: 0, behavior: "smooth" }); };

    $("#landmarkBanner").innerHTML = landmark ? `<div class="landmark-banner reveal"><div class="lb-badge">★ Documented landmark</div><div>${MW.placeCard(landmark.p)}</div></div>` : "";
    // published stories about this exact address
    const qm = (q || "").match(/^\s*(\d+)\s+([^,]+)/);
    const stories = MW.storiesFor ? MW.storiesFor(hit.number || (qm && qm[1]), hit.road || (qm && qm[2])) : [];
    if (stories.length) $("#landmarkBanner").insertAdjacentHTML("beforeend", `<div class="web-stories reveal"><div class="eyebrow">Stories about this house</div>
      <div class="ws-grid">${stories.map(st => `<a class="ws card" href="${st.url}" target="_blank" rel="noopener"><span class="tag event">${MW.esc(st.tag)}</span><h3>${MW.esc(st.title)}</h3><p>${MW.esc(st.summary)}</p>${st.evidence ? `<p class="ws-ev">📒 ${MW.esc(st.evidence)}</p>` : ""}<span class="small muted">${MW.esc(st.source)} ↗</span></a>`).join("")}</div></div>`);

    // historic photographs of this house (Library of Congress)
    const hp = MW.housePhotosFor ? MW.housePhotosFor(hit.number || (qm && qm[1]), hit.road || (qm && qm[2])) : [];
    if (hp.length) $("#landmarkBanner").insertAdjacentHTML("beforeend", `<div class="web-stories reveal"><div class="eyebrow">Historic photographs of this house</div>
      <div class="sb-grid">${hp.map(p => `<figure class="sb-card"><a href="${p.link}" target="_blank" rel="noopener"><img src="${p.src}" alt="${MW.esc(p.caption)}" loading="lazy"></a>
        <figcaption><b>${p.year}</b> · ${MW.esc(p.caption)}<span class="small muted" style="display:block">${MW.esc(p.credit)} · ${MW.esc(p.license)}</span></figcaption></figure>`).join("")}</div></div>`);

    // Sanborn fire-insurance map sheets for this address
    const sbHTML = MW.sanbornHTML ? MW.sanbornHTML(hit.number || (qm && qm[1]), hit.road || (qm && qm[2])) : "";
    $("#sanborn").innerHTML = sbHTML; $("#sanborn").hidden = !sbHTML;

    // mini map
    const m = ensureMap(here, 16);
    if (m) {
      if (miniLayer) miniLayer.remove();
      miniLayer = L.layerGroup().addTo(m);
      L.circleMarker(here, { radius: 11, color: "#fff", weight: 3, fillColor: "#b8381e", fillOpacity: 1 }).addTo(miniLayer).bindTooltip("You are here", { permanent: true, direction: "top", offset: [0, -10], className: "here-tip" });
      near.slice(0, 6).forEach(n => L.circleMarker([n.p.lat, n.p.lon], { radius: 6, color: "#1f3a2e", weight: 2, fillColor: "#e3a33a", fillOpacity: 1 }).addTo(miniLayer).bindTooltip(`${n.p.title} (${n.p.year < 1600 ? "pre-1666" : n.p.year})`));
      L.polyline(roads[0].r.pts, { color: "#e3a33a", weight: 6, opacity: .7, dashArray: "1 10", lineCap: "round" }).addTo(miniLayer);
    }

    // chapters
    const yb = built;
    const chapters = [
      { y: 1600, k: "Before 1666", h: "Lenape land",
        t: `Before there were lots and deeds, this ground was part of Lenapehoking, the Lenape homeland. Tradition says South Orange Avenue began as an Indian trail toward Newark Bay. This spot is about ${G.fmt(G.distToLineM(here, MW.oldRoads[0].pts))} from that old path.`, s: ["dhLenape", "soHist", "dhRoads"] },
      { y: 1690, k: "1666–1705", h: "The Newark Mountains",
        t: `Newark's settlers bought land reaching to the mountains, and this spot was in their back country. In 1680 the town granted land "upon the upper Chesnut hill by Raway River, near the Stone House." That Stone House, the Old Stone House on South Orange Avenue, is ${G.fmt(dStone)} from here. In 1705 Newark laid out the roads that became South Orange Avenue and Ridgewood Road.`, s: ["shaw", "nrStone"] },
      { y: 1770, k: "The farm years", h: sec.name.replace(/^the /, "").replace(/^\w/, c => c.toUpperCase()),
        t: sec.colonial + (colonialNear ? ` The closest early house on our map is the <b>${colonialNear.p.title}</b> (${colonialNear.p.year}) at ${colonialNear.p.address}, ${G.fmt(colonialNear.d)} from here, about a ${G.walkMin(colonialNear.d)}-minute walk.` : ""), s: sec.sources },
      { y: 1870, k: "1837–1904", h: "Railroad, township and village",
        t: `The railroad reached South Orange in 1837. Today the nearest station is ${st.x.name}, about a ${G.walkMin(dStation)}-minute walk (${G.fmt(dStation)}). From 1861 this spot was in South Orange Township, which also covered today's Maplewood. ${in1869 ? "It was inside the Village of South Orange when the Village was chartered in 1869." : "It was <b>outside</b> the Village chartered in 1869, and joined it when the land east of Centre Street was annexed on February 10, 1891."} The Village left the township on March 4, 1904.`, s: ["station", "schnell", "whittemore", "dhSep"] },
      { y: 1915, k: "1904–1930", h: "From estates to suburb",
        t: `${sec.growth} Across the Village, the population grew from 7,274 in 1920 to 13,630 in 1930.`, s: sec.sources.concat(["wiki"]) }
    ];
    if (yb) {
      const pop = MW.populationFor(yb), era = MW.eraFor(yb), nm = MW.nameFor(yb);
      const around = MW.localPlaces().filter(p => Math.abs(p.year - yb) <= 3 && p.year > 1600).slice(0, 4);
      const reported = landmark && landmark.p.year && Math.abs(landmark.p.year - yb) > 5 ? ` (The documented date for ${landmark.p.title} is ${landmark.p.year}.)` : "";
      chapters.push({ y: Math.max(yb, 1700), k: String(yb), h: `The year your house went up`,
        t: `In ${yb} this was <b>${MW.esc(nm.name)}</b>, ${MW.esc(nm.sub)}, in the era of <b>${era.name.toLowerCase()}</b>. ${pop.value ? `About ${pop.value.toLocaleString()} people lived in the Village.` : `The area held ${pop.label}.`} Houses built in South Orange around then were often <b>${style.name}</b>: ${style.desc}${reported}` +
          (around.length ? `<ul class="around">${around.map(p => `<li><b>${p.year}</b>: ${MW.esc(p.title)}</li>`).join("")}</ul>` : ""), s: ["masterPlan", "nrMontrose"].concat(era.sources.slice(0, 2)) });
    } else {
      chapters.push({ y: 1926, k: "Your house", h: "When was it built?",
        t: `About 85 percent of South Orange's houses date from the late 1800s to the 1930s. <button class="linkish" id="addYear2">Add your house's year</button> and we'll tell you what the town was called that year and which style was in fashion.`, s: ["masterPlan"] });
    }
    chapters.push({ y: 2026, k: "Today", h: "Still here, still changing",
      t: `Today about 18,700 people live in South Orange Village. ${near[0] ? `The nearest place on our map is <b>${near[0].p.title}</b>, ${G.fmt(near[0].d)} away.` : ""} Every house has its own chain of owners, builders and stories, and many can be traced through the Oranges city directories and the library's local-history wiki.`, s: ["wiki", "soplHouse"] });

    $("#chapters").innerHTML = chapters.map((c, i) => `<article class="chapter" data-y="${c.y}" data-i="${i}">
      <div class="ch-k">${c.k}</div><h3>${MW.esc(c.h)}</h3><p>${c.t}</p><div class="sources">Sources: ${MW.sourceLinks(c.s)}</div></article>`).join("");
    const add2 = $("#addYear2"); if (add2) add2.onclick = () => { form.built.focus(); scrollTo({ top: 0, behavior: "smooth" }); };

    // vignette art
    drawArt(built, sec);
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { document.querySelectorAll(".chapter").forEach(c => c.classList.toggle("active", c === e.target)); setArt(+e.target.dataset.y); }
    }), { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll(".chapter").forEach(c => io.observe(c));
    setArt(chapters[0].y);

    // neighbors
    $("#neighbors").innerHTML = near.slice(0, 6).map((n, i) => `<a class="card nb reveal d${i % 3}" href="explore.html?place=${n.p.id}&year=${Math.max(n.p.year, 1900)}">
      <div class="nb-dist">${G.fmt(n.d)} · ${G.walkMin(n.d)} min walk</div><span class="tag ${n.p.kind}">${MW.kindLabel[n.p.kind]} · ${n.p.year < 1600 ? "pre-1666" : n.p.year}</span>
      <h3>${MW.esc(n.p.title)}</h3><p class="small muted">${MW.esc(n.p.text.slice(0, 150))}…</p><span class="go">See on the map →</span></a>`).join("");

    // research checklist tailored to the year
    const y = built;
    const steps = [
      [true, "The library's house-research guide", "The South Orange Public Library's local-history wiki explains how to research a house, starting with the Oranges city directories."],
      [!y || y <= 1970, "City directories", "The Oranges directories list South Orange households (marked \"S O\"). The Maplewood Memorial Library's digital archive has them for 1908–1950. Look up your address year by year, and watch for street renumbering."],
      [true, "Maps and atlases", `The 1860 county map, Lewis P. Taylor's 1873 map of Montrose, and the Sanborn fire-insurance maps (1912, 1949) show what stood on each lot. ${y ? `For a ${y} house, compare the maps just before and after ${y}.` : ""}`],
      [true, "Historic districts", "If you're in Montrose Park, the 1997 National Register nomination describes many houses one by one. The Historic Preservation Commission can tell you whether your house is a designated key property."],
      [true, "Deeds", "A title search at the Essex County Register of Deeds traces the chain of owners."]
    ].filter(s => s[0]);
    $("#researchBox").innerHTML = `<div class="eyebrow">Make it real</div><h2>Find your house's documented history</h2>
      <p class="muted">This page tells the story of the <em>spot</em>. To learn about your <em>house</em> itself, start with the South Orange Public Library and the Historical &amp; Preservation Society. ${y ? `For a house built in ${y}, begin here:` : "Begin here:"}</p>
      <ol class="steps">${steps.map(([, h, t]) => `<li><b>${h}</b><span>${t}</span></li>`).join("")}</ol>
      <div class="sources">Sources: ${MW.sourceLinks(["soplHouse", "nrMontrose", "ordinance"])}</div>
      <a class="btn" href="research.html">Full research guide →</a>`;

    MW.observeReveals();
    $("#story").scrollIntoView({ behavior: "smooth" });
    MW.Archive && $("#archive") && MW.Archive.show(hit, q, $("#archive"), { landmark: landmark && landmark.p });
  }

  // ---------- vignette: one lot through time ----------
  let art;
  function drawArt(built, sec) {
    const host = $("#art");
    const it = K.item;
    const styleId = built ? MW.styleFor(built).id : "tudor";
    const houseFrom = built || 1925;
    const draw = {
      colonial: () => K.B.stoneHouse(), cottage: () => K.B.farmhouse("#ece4d2", 110), secondempire: () => K.B.queenAnne("#8f8a72"), queenanne: () => K.B.queenAnne("#7d9a8a"),
      colrev: () => K.B.colonialRev(), tudor: () => K.B.tudor(), ranch: () => K.B.cape(), modern: () => K.B.cape("#d8d2c4")
    }[styleId];
    const G0 = 330;
    const woods = Array.from({ length: 12 }, (_, i) => it(20 + i * 52 + (i % 2) * 14, G0 - 40 + (i % 3) * 14, 1500, 1720, K.tree.oak(.8 + (i % 3) * .2, ["#3f6b3f", "#4c7a42", "#2f5440"][i % 3]))).join("");
    const fence = `<path d="M0 ${G0 + 4} H600" stroke="#7a5a3a" stroke-width="3"/><path d="M0 ${G0 - 10} H600" stroke="#7a5a3a" stroke-width="3"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 40 + 10} ${G0 + 8} v-26" stroke="#5a3d28" stroke-width="4"/>`).join("")}`;
    host.innerHTML = `<svg class="mw-scene vignette" viewBox="0 120 600 300" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Illustration of this spot through time">
      <defs><linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop id="v0" offset="0" stop-color="#f3d9a4"/><stop id="v1" offset="1" stop-color="#f6e8c8"/></linearGradient></defs>
      <rect y="0" width="600" height="420" fill="url(#vsky)"/>
      <circle cx="470" cy="190" r="34" fill="#fff1c4" opacity=".9"/>
      <path d="M0 250 Q120 205 260 228 T600 236 V420 H0Z" fill="#6f8f6a" opacity=".8"/>
      <g class="it" data-from="1740" data-to="1925"><g class="grow"><path d="M0 300 L60 262 H560 L600 300Z" fill="#d6bd6e"/>${Array.from({ length: 6 }, (_, k) => `<path d="M${70 + k * 8} ${270 + k * 5} H${540 - k * 6}" stroke="rgba(80,60,20,.2)" stroke-width="2"/>`).join("")}</g></g>
      ${it(110, 268, 1740, 1900, ["nridgewood", "montrose"].includes(sec.id) ? K.B.stoneHouse() : K.B.farmhouse("#ece4d2", 100), { s: .55 })}
      ${it(200, 270, 1750, 1905, K.B.barn(), { s: .5 })}
      <g class="it veh" data-from="1838" data-to="1930"><g class="grow"><g class="mover train" style="animation-duration:16s"><g transform="translate(0,248) scale(.32)">${K.T.steam()}</g></g></g></g>
      <g class="it veh" data-from="1931" data-to="9999"><g class="grow"><g class="mover train" style="animation-duration:14s"><g transform="translate(0,248) scale(.32)">${K.T.njt()}</g></g></g></g>
      ${it(470, 262, 1860, 1930, K.B.queenAnne("#9a7d8a"), { s: .45 })}
      ${it(540, 264, 1903, 9999, K.B.foursquare("#c9a87a"), { s: .42 })}
      ${it(60, 262, 1920, 9999, K.B.tudor(), { s: .42 })}
      <rect y="${G0 - 4}" width="600" height="${420 - G0}" fill="#6f8f4a"/>
      ${woods}
      ${it(300, G0 + 2, 1500, 1690, K.B.wetu(), { s: .9 })}
      <g class="it" data-from="1500" data-to="1805"><g class="grow"><path d="M0 ${G0 + 50} Q200 ${G0 + 40} 300 ${G0 + 56} T600 ${G0 + 48}" stroke="#b59a6e" stroke-width="10" fill="none" stroke-dasharray="2 14" stroke-linecap="round"/></g></g>
      <g class="it" data-from="1740" data-to="1905"><g class="grow">${fence}</g></g>
      <g class="it" data-from="1806" data-to="9999"><g class="grow"><rect x="0" y="${G0 + 36}" width="600" height="34" fill="#b59a6e"/></g></g>
      <rect class="it-fade" data-from="1915" x="0" y="${G0 + 36}" width="600" height="34" fill="#5a5552"/>
      <path class="it-fade" data-from="1950" d="M0 ${G0 + 53} H600" stroke="#f3cf7a" stroke-width="2" stroke-dasharray="20 18"/>
      <path class="it-fade" data-from="1915" d="M0 ${G0 + 34} H600" stroke="#cfc6b6" stroke-width="5"/>
      ${it(300, G0 + 4, houseFrom, 9999, draw(), { s: 1.25 })}
      ${it(450, G0 + 8, houseFrom + 2, 9999, K.tree.maple(1.2, "#c8461f"), { grow: houseFrom + 2 })}
      ${it(140, G0 + 8, houseFrom + 5, 9999, K.tree.maple(1, "#e3a33a"), { grow: houseFrom + 5 })}
      <g class="it veh" data-from="1700" data-to="1860"><g class="grow"><g class="mover" style="animation-duration:26s;animation-delay:-6s"><g transform="translate(0,${G0 + 60}) scale(.8)">${K.V.oxcart()}</g></g></g></g>
      <g class="it veh" data-from="1861" data-to="1914"><g class="grow"><g class="mover" style="animation-duration:14s"><g transform="translate(0,${G0 + 60}) scale(.8)">${K.V.buggy()}</g></g></g></g>
      <g class="it veh" data-from="1915" data-to="1945"><g class="grow"><g class="mover rev" style="animation-duration:9s"><g transform="translate(0,${G0 + 60}) scale(-.8,.8)">${K.V.modelT()}</g></g></g></g>
      <g class="it veh" data-from="1946" data-to="1979"><g class="grow"><g class="mover" style="animation-duration:8s"><g transform="translate(0,${G0 + 60}) scale(.8)">${K.V.fifties()}</g></g></g></g>
      <g class="it veh" data-from="1980" data-to="9999"><g class="grow"><g class="mover rev" style="animation-duration:22s"><g transform="translate(0,${G0 + 60}) scale(-.8,.8)">${K.V.stroller()}</g></g></g></g>
    </svg><div class="vig-year" id="vigYear"></div>`;
    art = host.querySelector("svg");
  }
  const vskies = [[1600, "#f3d9a4", "#f6e8c8"], [1800, "#ecdcb4", "#f3e6c6"], [1900, "#d8d6c2", "#ece0c0"], [1950, "#a8cde0", "#eee6cc"], [2026, "#86bfe0", "#f2ead2"]];
  function setArt(y) {
    if (!art) return;
    art.querySelectorAll(".it").forEach(g => {
      const on = y >= +g.dataset.from && y <= +g.dataset.to;
      g.classList.toggle("off", !on);
      if (g.dataset.grow) g.firstChild.style.transform = on ? `scale(${Math.max(.3, Math.min(1, (y - +g.dataset.grow) / 45 + .3)).toFixed(2)})` : "";
    });
    art.querySelectorAll(".it-fade").forEach(el => el.style.opacity = y >= +el.dataset.from ? 1 : 0);
    const sk = vskies.find(s => y <= s[0]) || vskies[vskies.length - 1];
    art.querySelector("#v0").setAttribute("stop-color", sk[1]); art.querySelector("#v1").setAttribute("stop-color", sk[2]);
    art.style.filter = y < 1839 ? "sepia(.3) saturate(1.1)" : y < 1935 ? "sepia(.7) saturate(.6) contrast(1.05)" : y < 1975 ? "sepia(.1) saturate(1.25)" : "none";
    $("#vigYear").textContent = y <= 1600 ? "Before 1666" : y;
    $("#artCap").textContent = MW.eraFor(y).name;
  }

  // ---------- boot ----------
  if (params.get("lat") && params.get("lon")) {
    locate(params.get("q") || params.get("label") || "Selected place", +params.get("built") || null,
      { lat: +params.get("lat"), lon: +params.get("lon"), label: params.get("label") || "Selected place", precise: true });
  } else if (form.q.value) locate(form.q.value, +form.built.value || null);
});
