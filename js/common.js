/* Shared UI: nav, footer, leaves, reveal-on-scroll, time slider, popovers */
(function () {
  const MW = window.MW;

  MW.leafSVG = (color = "#b8381e") =>
    `<svg viewBox="0 0 100 100" aria-hidden="true"><path fill="${color}" d="M50 4l8 20 14-8-4 20 18-4-10 16 16 6-20 10 4 10-22-4-2 26h-4l-2-26-22 4 4-10-20-10 16-6-10-16 18 4-4-20 14 8z"/></svg>`;

  MW.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  MW.sourceLinks = ids => (ids || []).map(id => {
    const s = MW.sources[id]; if (!s) return "";
    return `<a href="${s.url}" target="_blank" rel="noopener">${MW.esc(s.label)}</a>`;
  }).filter(Boolean).join(" · ");

  MW.kindLabel = { house: "House", civic: "Civic", transport: "Transport", nature: "Park & Land", culture: "Culture", event: "Event", commerce: "Commerce" };

  /* ---------- Nav & footer ---------- */
  const pages = [
    ["index.html", "Time Machine"],
    ["explore.html", "Explore the Map"],
    ["house.html", "Your House's Story"],
    ["landmarks.html", "Landmarks"],
    ["people.html", "People"],
    ["timeline.html", "Timeline"],
    ["research.html", "Research & Sources"]
  ];
  const here = (location.pathname.split("/").pop() || "index.html").replace("landmark.html", "landmarks.html");

  function injectChrome() {
    const nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.innerHTML = `<div class="wrap">
      <a class="brand" href="index.html" aria-label="Maplewood Through Time home">${MW.leafSVG()}<span>Maplewood Through Time<small>A fan history of Maplewood, NJ</small></span></a>
      <button class="nav-toggle" aria-label="Menu">☰</button>
      <ul class="nav-links">${pages.map(([h, t]) => `<li><a href="${h}"${h === here ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul>
    </div>`;
    document.body.prepend(nav);
    nav.querySelector(".nav-toggle").onclick = () => nav.querySelector(".nav-links").classList.toggle("open");

    const foot = document.createElement("footer");
    foot.className = "site-footer";
    foot.innerHTML = `<div class="wrap cols">
      <div><h4>Maplewood Through Time</h4>
        <p>An unofficial fan site celebrating the history of Maplewood, New Jersey. It is not affiliated with the Township, the Maplewood Memorial Library, the Durand-Hedden House &amp; Garden Association or the Historic Preservation Commission. Their research made this possible, so please support them.</p>
        <p class="small">Scene illustrations are artistic interpretations, not historical records. Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors.</p></div>
      <div><h4>Explore</h4><ul>${pages.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>
      <div><h4>The real archives</h4><ul>
        <li><a href="https://www.maplewoodlibrary.org/research-maplewood-local-history" target="_blank" rel="noopener">Maplewood Memorial Library</a></li>
        <li><a href="https://durandhedden.org/history-center" target="_blank" rel="noopener">Grasmere Local History Center</a></li>
        <li><a href="https://www.durandhedden.org" target="_blank" rel="noopener">Durand-Hedden House &amp; Garden</a></li>
        <li><a href="https://www.historicmaplewood.com" target="_blank" rel="noopener">Historic Preservation Commission</a></li>
      </ul></div>
    </div>`;
    document.body.append(foot);
  }

  /* ---------- Falling leaves ---------- */
  MW.leaves = function (host, count = 14) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    count = Math.round(count * Math.min(1, innerWidth / 1200)) + 3;
    const layer = document.createElement("div");
    layer.className = "leaves";
    const colors = ["#b8381e", "#d9622b", "#e3a33a", "#c2471f", "#9e2f18", "#f0b44c"];
    for (let i = 0; i < count; i++) {
      const l = document.createElement("div");
      l.className = "leaf";
      const size = 14 + Math.random() * 18;
      l.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${9 + Math.random() * 12}s;animation-delay:${-Math.random() * 20}s;--drift:${(Math.random() - .5) * 260}px;--spin:${(Math.random() > .5 ? 1 : -1) * (300 + Math.random() * 500)}deg;--fall:${(host.offsetHeight || 800) + 80}px`;
      l.innerHTML = MW.leafSVG(colors[i % colors.length]);
      l.firstChild.style.animationDuration = 1.5 + Math.random() * 2 + "s";
      layer.append(l);
    }
    host.append(layer);
    return layer;
  };

  /* ---------- Reveal on scroll ---------- */
  MW.observeReveals = function (root = document) {
    const io = MW._io || (MW._io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: "0px 0px -40px 0px" }));
    root.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
  };

  /* ---------- Time slider component ----------
     MW.timeSlider(container, {min, max, value, onChange, ticks:[years], chips:true, play:true}) */
  MW.timeSlider = function (host, opts) {
    const o = Object.assign({ min: 1650, max: 2026, value: 1900, ticks: [1700, 1750, 1800, 1850, 1900, 1950, 2000], chips: true, play: true }, opts);
    host.innerHTML = `
      <div class="timebar">
        <div style="display:flex;align-items:center;gap:1rem">
          ${o.play ? `<button class="icon-btn" data-play aria-label="Play time-lapse"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg></button>` : ""}
          <div class="yearbox" aria-live="polite">${o.value}</div>
        </div>
        <div class="slider-wrap">
          <div class="ticks">${o.ticks.map(t => `<span data-y="${t}" style="left:${(t - o.min) / (o.max - o.min) * 100}%">${t}</span>`).join("")}</div>
          <input class="range" type="range" min="${o.min}" max="${o.max}" step="1" value="${o.value}" aria-label="Choose a year">
        </div>
      </div>
      ${o.chips ? `<div class="era-chips">${MW.eras.filter(e => e.to >= o.min).map(e => `<button class="chip" data-y="${Math.max(e.from, o.min) + (e.id === "today" ? 26 : Math.min(10, Math.round((e.to - e.from) / 2)))}" data-era="${e.id}">${e.name}</button>`).join("")}</div>` : ""}`;
    const range = host.querySelector(".range"), box = host.querySelector(".yearbox");
    let year = o.value, shown = o.value, raf, playing = false, playTimer;

    function animateBox() { // odometer-style count toward target
      cancelAnimationFrame(raf);
      const step = () => {
        const d = year - shown;
        if (Math.abs(d) < 1) { shown = year; box.textContent = year; return; }
        shown += d * .25; box.textContent = Math.round(shown);
        raf = requestAnimationFrame(step);
      };
      step();
    }
    function set(y, src) {
      y = Math.max(o.min, Math.min(o.max, Math.round(y)));
      year = y; range.value = y;
      const pct = (y - o.min) / (o.max - o.min) * 100;
      range.style.setProperty("--pct", pct + "%");
      animateBox();
      host.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", MW.eraFor(y).id === c.dataset.era));
      if (src !== "silent") o.onChange && o.onChange(y);
    }
    range.addEventListener("input", () => { stop(); set(+range.value); });
    host.querySelectorAll("[data-y]").forEach(el => el.addEventListener("click", () => { stop(); set(+el.dataset.y); }));
    const playBtn = host.querySelector("[data-play]");
    const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>';
    const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
    function stop() { playing = false; clearInterval(playTimer); if (playBtn) { playBtn.innerHTML = playIcon; playBtn.setAttribute("aria-label", "Play time-lapse"); } }
    function play() {
      if (year >= o.max) set(o.min);
      playing = true; playBtn.innerHTML = pauseIcon; playBtn.setAttribute("aria-label", "Pause time-lapse");
      playTimer = setInterval(() => { if (year >= o.max) return stop(); set(year + (year < 1800 ? 3 : year < 1900 ? 2 : 1)); }, 140);
    }
    if (playBtn) playBtn.onclick = () => playing ? stop() : play();
    set(o.value, "silent");
    return { set, get: () => year, stop, play };
  };

  /* ---------- Popover ---------- */
  MW.popover = function (html, x, y) {
    MW.closePop();
    const p = document.createElement("div");
    p.className = "pop";
    p.innerHTML = `<button class="x" aria-label="Close">×</button>${html}`;
    document.body.append(p);
    const w = p.offsetWidth, h = p.offsetHeight;
    let left = Math.min(window.innerWidth - w - 12, Math.max(12, x - w / 2));
    let top = y + 14; if (top + h > window.innerHeight - 12) top = Math.max(12, y - h - 14);
    p.style.left = left + "px"; p.style.top = top + "px";
    p.querySelector(".x").onclick = MW.closePop;
    setTimeout(() => document.addEventListener("click", MW._outside = e => { if (!p.contains(e.target)) MW.closePop(); }), 0);
    MW._pop = p;
  };
  MW.closePop = function () {
    if (MW._pop) { MW._pop.remove(); MW._pop = null; }
    if (MW._outside) { document.removeEventListener("click", MW._outside); MW._outside = null; }
  };
  document.addEventListener("keydown", e => { if (e.key === "Escape") MW.closePop(); });

  MW.placeCard = p => `<span class="tag ${p.kind}">${MW.kindLabel[p.kind]} · ${p.year < 1600 ? "Pre-colonial" : p.year}${p.end ? "–" + p.end : ""}</span>
    <h3>${MW.esc(p.title)}</h3><div class="small muted" style="margin-bottom:.5rem">📍 ${MW.esc(p.address)}</div>
    <p>${MW.esc(p.text)}</p>${MW.landmarkFor && MW.landmarkFor(p.id) ? `<p class="lm-link"><a href="landmark.html?id=${MW.landmarkFor(p.id)}">Read the full history, with pictures through the ages →</a></p>` : ""}<div class="sources">Sources: ${MW.sourceLinks(p.sources)}</div>`;

  MW.landmarkFor = id => { const L = MW.landmarks || {}; if (L[id]) return id; const k = Object.keys(L).find(k => L[k].place === id); return k || null; };

  /* Count-up number animation */
  MW.countTo = function (el, to, dur = 900) {
    const from = +el.dataset.v || 0; el.dataset.v = to;
    const t0 = performance.now();
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString();
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  document.addEventListener("DOMContentLoaded", () => {
    injectChrome();
    MW.observeReveals();
  });
})();
