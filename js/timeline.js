/* Timeline page: scroll-linked history */
document.addEventListener("DOMContentLoaded", () => {
  const MW = window.MW;
  const $ = s => document.querySelector(s);
  const kinds = Object.keys(MW.kindLabel);
  const active = new Set(kinds);
  const scene = MW.Scene($("#tlScene"));

  function render() {
    let html = "";
    MW.eras.forEach(era => {
      const items = MW.places.filter(p => p.year >= era.from && p.year <= era.to && active.has(p.kind));
      html += `<section class="tl-era-block" id="era-${era.id}" data-y="${Math.max(era.from, 1600)}">
        <div class="tl-era-head reveal" style="--a:${era.palette[0]};--b:${era.palette[1]}">
          <div class="eyebrow">${era.from < 1600 ? "Before 1666" : era.from + "–" + (era.id === "today" ? "today" : era.to)}</div>
          <h2>${era.name}</h2><p class="tag-line">${era.tagline}</p><p>${MW.esc(era.story[0])}</p>
        </div>
        ${items.map((p, i) => `<article class="tl-item reveal ${i % 2 ? "r" : "l"}" data-y="${p.year}" id="ev-${p.id}">
          <div class="tl-dot"><span>${p.year < 1600 ? "∞" : p.year}</span></div>
          <div class="tl-card card">
            <span class="tag ${p.kind}">${MW.kindLabel[p.kind]}${p.end ? ` · ${p.year}–${p.end}` : ""}</span>
            <h3>${MW.esc(p.title)}</h3><div class="small muted addr">📍 ${MW.esc(p.address)}</div>
            <p>${MW.esc(p.text)}</p>
            <div class="tl-actions"><a href="explore.html?place=${p.id}&year=${Math.max(p.year, 1600)}">On the map</a><a href="index.html?year=${Math.max(p.year, 1600)}#hero">In the Time Machine</a></div>
            <div class="sources">Sources: ${MW.sourceLinks(p.sources)}</div>
          </div></article>`).join("")}
      </section>`;
    });
    $("#tl").innerHTML = html;
    MW.observeReveals($("#tl"));
    watch();
  }

  $("#filters").innerHTML = kinds.map(k => `<button class="chip active" data-k="${k}">${MW.kindLabel[k]}</button>`).join("");
  $("#filters").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    const k = b.dataset.k; active.has(k) ? active.delete(k) : active.add(k);
    b.classList.toggle("active", active.has(k)); render();
  });

  $("#eraJump").innerHTML = MW.eras.map(e => `<a href="#era-${e.id}" data-era="${e.id}">${e.name}</a>`).join("");

  let io, current = 0;
  function setYear(y) {
    if (y === current) return; current = y;
    $("#tlYear").textContent = y <= 1600 ? "Pre-1666" : y;
    const era = MW.eraFor(y);
    $("#tlEra").textContent = era.name;
    document.querySelectorAll("#eraJump a").forEach(a => a.classList.toggle("on", a.dataset.era === era.id));
    scene.setYear(Math.max(1600, y));
  }
  function watch() {
    if (io) io.disconnect();
    io = new IntersectionObserver(es => {
      es.filter(e => e.isIntersecting).forEach(e => {
        document.querySelectorAll(".tl-item.now").forEach(n => n.classList.remove("now"));
        if (e.target.classList.contains("tl-item")) e.target.classList.add("now");
        setYear(+e.target.dataset.y);
      });
    }, { rootMargin: "-48% 0px -48% 0px" });
    document.querySelectorAll(".tl-item, .tl-era-head").forEach(el => {
      if (el.classList.contains("tl-era-head")) el.dataset.y = el.parentElement.dataset.y;
      io.observe(el);
    });
  }

  addEventListener("scroll", () => {
    const h = document.documentElement;
    $("#progress").style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight)})`;
  }, { passive: true });

  render();
  setYear(1600);
  if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 200);
});
