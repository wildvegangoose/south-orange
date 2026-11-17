/* Home page: Time Machine wiring */
document.addEventListener("DOMContentLoaded", () => {
  const MW = window.MW;
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const startYear = +params.get("year") || 1905;

  const scene = MW.Scene($("#scene"));
  MW.leaves($("#hero"), 16);
  const sc = $("#scene");
  if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = 0;
  sc.addEventListener("scroll", () => { const h = $("#swipeHint"); if (h) h.remove(); }, { once: true });

  const placeName = y =>
    y < 1666 ? "Lenapehoking, the Lenape homeland" :
    y < 1798 ? "Newark's mountain farms & North Farms" :
    y < 1830 ? "Jefferson Village & North Farms" :
    y < 1860 ? "Jefferson Village & Middleville" :
    y < 1861 ? "Jefferson Village, with a new \"Maplewood\" station" :
    y < 1904 ? "South Orange Township (Maplewood, Hilton & South Orange village)" :
    y < 1922 ? "South Orange Township (after South Orange village left)" :
    y === 1922 ? "Township of Maplewood (renamed Nov. 7, 1922)" : "Township of Maplewood";

  // population sparkline
  const spark = $("#spark");
  const pts = MW.census.map(([y, p]) => [(y - 1870) / (2024 - 1870) * 300, 66 - p / 27000 * 60]);
  spark.innerHTML = `<path d="M${pts.map(p => p.map(n => n.toFixed(1)).join(" ")).join(" L")}" fill="none" stroke="#b8381e" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
    <path d="M0 70 L${pts.map(p => p.map(n => n.toFixed(1)).join(" ")).join(" L")} L300 70Z" fill="rgba(184,56,30,.12)"/>
    <line id="sparkNow" x1="0" x2="0" y1="0" y2="70" stroke="#1f3a2e" stroke-width="2" vector-effect="non-scaling-stroke" stroke-dasharray="3 3"/>`;

  let lastEra = null;
  function update(y) {
    scene.setYear(y);
    history.replaceState(null, "", "?year=" + y);
    const era = MW.eraFor(y);
    $("#statYear").textContent = y;
    const pop = MW.populationFor(y);
    if (pop.value) { MW.countTo($("#statPop"), pop.value, 500); $("#statPop").classList.remove("small-v"); $("#statPopNote").textContent = MW.census.some(c => c[0] === y) ? "U.S. Census count" : "Estimated between census counts"; }
    else { $("#statPop").textContent = pop.label; $("#statPop").dataset.v = 0; $("#statPop").classList.add("small-v"); $("#statPopNote").textContent = "No census for today's boundaries yet"; }
    const x = Math.max(0, Math.min(300, (y - 1870) / (2024 - 1870) * 300));
    const now = $("#sparkNow"); now.setAttribute("x1", x); now.setAttribute("x2", x); now.style.opacity = y < 1870 ? 0 : 1;
    MW.countTo($("#statStanding"), MW.places.filter(p => p.year <= y && (!p.end || p.end >= y)).length, 400);
    $("#statName").textContent = placeName(y);

    if (era !== lastEra) {
      lastEra = era;
      const box = $(".era-story");
      box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
      $("#eraRange").textContent = `${era.from < 1600 ? "Before 1666" : era.from + "–" + (era.id === "today" ? "today" : era.to)}`;
      $("#eraName").textContent = era.name;
      $("#eraTag").textContent = era.tagline;
      $("#eraBody").innerHTML = era.story.map(p => `<p>${MW.esc(p)}</p>`).join("");
      $("#eraSources").innerHTML = "Sources: " + MW.sourceLinks(era.sources);
      const ms = MW.places.filter(p => p.year >= Math.max(era.from, 1500) && p.year <= era.to);
      $("#moments").innerHTML = ms.map((p, i) => `<button class="moment reveal" style="transition-delay:${i * 40}ms" data-y="${p.year}" data-id="${p.id}">
          <span class="m-year">${p.year < 1600 ? "Pre-1666" : p.year}</span><span class="tag ${p.kind}">${MW.kindLabel[p.kind]}</span>
          <strong>${MW.esc(p.title)}</strong><span class="small muted">${MW.esc(p.address)}</span></button>`).join("") || `<p class="muted">No dated places in this era yet.</p>`;
      MW.observeReveals($("#moments"));
    }
    document.querySelectorAll(".moment").forEach(m => m.classList.toggle("now", +m.dataset.y === y));
  }

  const slider = MW.timeSlider($("#slider"), {
    min: 1600, max: 2026, value: startYear,
    ticks: [1666, 1743, 1806, 1838, 1860, 1904, 1922, 1950, 1996, 2026],
    onChange: update
  });
  update(startYear);

  $("#moments").addEventListener("click", e => {
    const b = e.target.closest(".moment"); if (!b) return;
    slider.set(+b.dataset.y);
    const p = MW.places.find(p => p.id === b.dataset.id);
    const r = b.getBoundingClientRect();
    MW.popover(MW.placeCard(p), r.left + r.width / 2, r.bottom);
    e.stopPropagation();
  });

  $("#labelsBtn").onclick = e => {
    const on = $("#scene").classList.toggle("show-labels");
    e.currentTarget.setAttribute("aria-pressed", on);
    e.currentTarget.textContent = on ? "Hide labels" : "Show labels";
  };

  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight") slider.set(slider.get() + (e.shiftKey ? 10 : 1));
    if (e.key === "ArrowLeft") slider.set(slider.get() - (e.shiftKey ? 10 : 1));
  });

  // door icons
  const art = {
    map: `<svg viewBox="0 0 120 80"><path d="M10 14 L40 6 L80 16 L110 8 V66 L80 74 L40 64 L10 72Z" fill="#f6efdf" stroke="#e3a33a" stroke-width="3"/><path d="M40 6V64M80 16V74" stroke="#e3a33a" stroke-width="2" stroke-dasharray="4 4"/><path d="M20 50 Q50 20 96 40" stroke="#b8381e" stroke-width="3" fill="none" stroke-dasharray="6 5"/><circle cx="60" cy="32" r="8" fill="#b8381e"/><circle cx="60" cy="32" r="3" fill="#fff"/></svg>`,
    house: `<svg viewBox="0 0 120 80"><path d="M24 74 V38 L60 12 L96 38 V74Z" fill="#f6efdf" stroke="#e3a33a" stroke-width="3"/><rect x="52" y="50" width="16" height="24" fill="#b8381e"/><rect x="34" y="44" width="12" height="12" fill="#e3a33a"/><rect x="74" y="44" width="12" height="12" fill="#e3a33a"/><path d="M76 20 V8 h8 v18" fill="#e3a33a"/></svg>`,
    time: `<svg viewBox="0 0 120 80"><circle cx="60" cy="40" r="32" fill="#f6efdf" stroke="#e3a33a" stroke-width="3"/><path d="M60 18 V40 L76 50" stroke="#b8381e" stroke-width="4" stroke-linecap="round" fill="none"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${60 + Math.cos(i * Math.PI / 6) * 26}" cy="${40 + Math.sin(i * Math.PI / 6) * 26}" r="1.8" fill="#1f3a2e"/>`).join("")}</svg>`
  };
  document.querySelectorAll("[data-art]").forEach(d => d.innerHTML = art[d.dataset.art]);

  // facts
  const facts = [
    ["1847", "The face on the first U.S. stamps", "Asher B. Durand, born in Jefferson Village in 1796, made engravings of Washington and Franklin that were used on the first U.S. postage stamps.", 1847, ["dhPost"]],
    ["1855", "Strawberries with a famous name", "Inventor Seth Boyden retired to Middleville, later Hilton, and grew the celebrated \"Hilton Strawberries.\"", 1855, ["hmHist", "dhMtn"]],
    ["1921", "Tee time", "Dr. William Lowell, a Maplewood dentist and golfer, began making the wooden \"Reddy Tee\" that changed golf.", 1921, ["lowell"]],
    ["132 yrs", "The longest wait for a post office", "Jefferson Village asked for a post office around 1815. Maplewood finally got first-class status in July 1947.", 1947, ["dhPost"]],
    ["1941", "Porgy and Bess, reborn", "Cheryl Crawford's revival of Gershwin's opera was staged at the Maplewood Theatre before going to Broadway.", 1941, ["crawford", "cinema"]],
    ["1968", "Ultimate Frisbee is born", "Columbia High School students invented the sport. A plaque in the parking lot marks the birthplace.", 1968, ["wiki"]]
  ];
  $("#facts").innerHTML = facts.map(([big, h, t, y, s], i) => `<article class="fact card reveal d${i % 3}" data-y="${y}">
    <div class="fact-big">${big}</div><h3>${h}</h3><p>${t}</p><div class="sources">${MW.sourceLinks(s)}</div><button class="go linkish">See it in ${y} →</button></article>`).join("");
  $("#facts").addEventListener("click", e => {
    const a = e.target.closest(".fact"); if (!a || e.target.closest(".sources a")) return;
    slider.set(+a.dataset.y); $("#hero").scrollIntoView({ behavior: "smooth" });
  });
  MW.observeReveals();
});
