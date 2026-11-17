/* House page: "From the library archive" section.
   Reads the archive/ folder built by tools/archive/*.py. If that folder is absent, this section stays hidden. */
(function () {
  const MW = window.MW;
  const ROOT = "archive/";
  const SUF = { RD: "ROAD", AV: "AVENUE", AVE: "AVENUE", ST: "STREET", PL: "PLACE", TER: "TERRACE", TERR: "TERRACE", DR: "DRIVE", CT: "COURT", LN: "LANE", LA: "LANE", PKWY: "PARKWAY", BLVD: "BOULEVARD", CIR: "CIRCLE" };
  const OCC = [[/\b(clk|elk)\b/g, "clerk"], [/\bslsman\b/g, "salesman"], [/\bslswn\b/g, "saleswoman"], [/\bmgr\b/g, "manager"], [/\bacct\b/g, "accountant"],
    [/\bemp\b/g, "employee"], [/\bwid\b/g, "widow of"], [/\btchr\b/g, "teacher"], [/\bsupt\b/g, "superintendent"], [/\b(engr|eng)\b/g, "engineer"],
    [/\bmech\b/g, "mechanic"], [/\bbkpr\b/g, "bookkeeper"], [/\bsteno\b/g, "stenographer"], [/\bins\b/g, "insurance"], [/\bN ?Y\b/g, "New York"],
    [/\barcht\b/g, "architect"], [/\bphys\b/g, "physician"], [/\bcontr\b/g, "contractor"], [/\bpres\b/g, "president"], [/\btreas\b/g, "treasurer"],
    [/\bsec\b/g, "secretary"], [/\bopr\b/g, "operator"], [/\bcarp\b/g, "carpenter"], [/\blab\b/g, "laborer"], [/\bchauf\b/g, "chauffeur"],
    [/\bdom\b/g, "domestic"], [/\bstud\b/g, "student"], [/\bagt\b/g, "agent"], [/\bmfr\b/g, "manufacturer"], [/\bmkr\b/g, "maker"],
    [/\bdraftsman\b/g, "draftsman"], [/\bTelCo\b/g, "the Telephone Co."], [/\bPruInsCo\b/g, "Prudential Insurance"], [/\bhousekpr\b/g, "housekeeper"],
    [/\bsupvr?\b/g, "supervisor"], [/\bforemn\b/g, "foreman"], [/\bpntr\b/g, "painter"], [/\bplmbr\b/g, "plumber"], [/\bdrftsmn\b/g, "draftsman"]];

  const esc = MW.esc;
  const expandOcc = o => OCC.reduce((s, [re, w]) => s.replace(re, w), (o || "").replace(/\s+/g, " ").replace(/^[a-z]?[A-Z]\s(?=[A-Z])/, "").trim())
    .replace(/\s+(New York|Newark|Irvington|Orange|East Orange|South Orange|Elizabeth|Jersey City)$/, ", $1");
  const nice = s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const person = l => `${l.given ? l.given.replace(/\b([A-Z])\b(?!\.)/g, "$1.") + " " : ""}${l.surname}`;

  function normRoad(r) {
    if (!r) return null;
    const w = r.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    if (w.length && SUF[w[w.length - 1]]) w[w.length - 1] = SUF[w[w.length - 1]];
    return w.join(" ");
  }
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function getJSON(u) { const r = await fetch(u); if (!r.ok) throw new Error(r.status); return r.json(); }

  function matchStreet(index, road) {
    const n = normRoad(road); if (!n) return null;
    if (index[slug(n)]) return slug(n);
    const bare = n.replace(/\s+(ROAD|AVENUE|STREET|PLACE|TERRACE|DRIVE|COURT|LANE|PARKWAY|WAY|CIRCLE|BOULEVARD)$/, "");
    return Object.keys(index).find(k => index[k].name.replace(/\s+(ROAD|AVENUE|STREET|PLACE|TERRACE|DRIVE|COURT|LANE|PARKWAY|WAY|CIRCLE|BOULEVARD)$/, "") === bare) || null;
  }

  function story(addr, ls) {
    if (!ls.length) return "";
    const byYear = {}; ls.forEach(l => (byYear[l.year] = byYear[l.year] || []).push(l));
    const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
    const first = years[0], last = years[years.length - 1];
    const named = l => l.given && /^[A-Z][a-z]/.test(l.given);
    const firstNamed = ls.find(l => named(l) && l.tenure === "householder") || ls.find(named) || ls[0];
    const head = firstNamed;
    const spans = {};
    ls.forEach(l => { const s = spans[l.surname] = spans[l.surname] || { min: l.year, max: l.year, n: new Set() }; s.min = Math.min(s.min, l.year); s.max = Math.max(s.max, l.year); s.n.add(l.year); });
    const longest = Object.entries(spans).sort((a, b) => (b[1].max - b[1].min) - (a[1].max - a[1].min))[0];
    const fams = Object.values(spans).filter(v => v.n.size >= 2).length;
    const occs = [...new Set(ls.map(l => expandOcc(l.occ).replace(/[^A-Za-z ,.&'-]/g, "")).filter(o => o && o.length > 3 && /^[a-z]/.test(o) && !/^(r|h)\b|widow|^[a-z]{1,2}\b/.test(o)))]
      .filter((o, i, a) => !a.some((x, j) => j < i && x.replace(/\W/g, "") === o.replace(/\W/g, ""))).slice(0, 4);
    let t = `The earliest city directory in the library's archive that lists <b>${esc(addr)}</b> is from <b>${first}</b>. ` +
      `${head.year === first ? "That year" : `By ${head.year}`} ${esc(person(head))}${head.spouse ? ` and ${esc(head.spouse)}` : ""} ${head.tenure === "householder" ? "headed the household" : "lived here"}${head.occ ? `, listed as "${esc(expandOcc(head.occ))}"` : ""}. `;
    if (longest && longest[1].max > longest[1].min) t += `The <b>${esc(longest[0])}</b> name appears here from ${longest[1].min} to at least ${longest[1].max}, about ${longest[1].max - longest[1].min} years. `;
    t += fams <= 1 ? `The library has ${years.length} directory year${years.length === 1 ? "" : "s"} listing this address between ${first} and ${last}. `
      : `Across ${years.length} directory years between ${first} and ${last}, ${fams} family names appear here more than once. `;
    if (occs.length > 1) t += `Occupations recorded here include ${occs.map(o => `"${esc(o)}"`).join(", ")}.`;
    return t;
  }

  function render(el, addr, street, num, house, streetData) {
    const ls = (house && house.listings) || [], cards = (house && house.cards) || [], news = (house && house.news) || [];
    const byYear = {}; ls.forEach(l => (byYear[l.year] = byYear[l.year] || []).push(l));
    const docs = ls.filter(l => l.crop).reduce((a, l) => (a.some(x => x.year === l.year) ? a : a.concat(l)), []);
    // nearby houses on the same street that have photos (shown when this address has none)
    const nearby = !cards.length && streetData ? Object.entries(streetData.houses).filter(([n, h]) => h.cards.length && n !== num)
      .sort((a, b) => Math.abs(+a[0] - +num) - Math.abs(+b[0] - +num)).slice(0, 3) : [];

    el.innerHTML = `<div class="wrap">
      <div class="arch-head reveal">
        <div class="eyebrow">From the Maplewood Memorial Library's digital archive</div>
        <h2>The record for ${esc(addr)}</h2>
        <p class="lede">${ls.length ? story(addr, ls) : `The library's city directories don't list this exact number through 1950. The house may be newer, the number may have changed, or the scanned text may have garbled it.`}</p>
        <p class="arch-local small">Material from the Maplewood Memorial Library's digitized city directories and real-estate file, with links back to the originals. Names are shown through 1950.</p>
      </div>
      <div class="arch-grid ${cards.length ? "" : "nophoto"}">
        ${cards.length ? `<figure class="photo-card reveal">${cards.map((c, i) => `<div class="pc ${i ? "hidden" : ""}" data-i="${i}">
            <button class="flip" ${c.back ? "" : "disabled"} aria-label="Flip card"><img src="${ROOT + c.img}" alt="Real-estate listing card for ${esc(c.label)}" loading="lazy">
              ${c.back ? `<img class="back" src="${ROOT + c.back}" alt="Back of the listing card" loading="lazy">` : ""}</button>
            <figcaption>Real-estate listing card for <b>${esc(nice(c.label))}</b>, from the library's real-estate file (Board of Realtors of the Oranges and Maplewood, 1920s–1980s).
              ${c.back ? "Click the photo to see the back of the card. " : ""}<a href="${c.src}" target="_blank" rel="noopener">Original in the library viewer →</a></figcaption></div>`).join("")}
            ${cards.length > 1 ? `<div class="pc-nav">${cards.map((c, i) => `<button data-i="${i}" class="${i ? "" : "on"}">${i + 1}</button>`).join("")}</div>` : ""}</figure>`
          : nearby.length ? `<div class="nearby reveal"><h3>On your street, in the photo file</h3><div class="nb-photos">${nearby.map(([n, h]) =>
            `<a href="${h.cards[0].src}" target="_blank" rel="noopener"><img src="${ROOT + h.cards[0].img}" alt="${esc(h.cards[0].label)}" loading="lazy"><span>${esc(nice(h.cards[0].label))}</span></a>`).join("")}</div>
            <p class="small muted">No listing photo is filed for this number. These are the closest houses on the same street that have one.</p></div>` : ""}
        <div class="residents reveal d1">
          <h3>Who lived here <span class="small muted">(city directories, through 1950)</span></h3>
          ${ls.length ? `<ol class="rlist">${Object.keys(byYear).sort().map(y => `<li><span class="ry">${y}</span><div>${byYear[y].map(l =>
            `<div class="rp"><b>${esc(person(l))}</b>${l.spouse ? ` <span class="muted">(${esc(l.spouse)})</span>` : ""} · <span class="muted">${esc(l.tenure === "householder" ? "head of household" : l.tenure)}${l.occ ? ", " + esc(expandOcc(l.occ)) : ""}</span> <a class="src" href="${l.src}" target="_blank" rel="noopener" title="See the scanned page">scan ↗</a></div>`).join("")}</div></li>`).join("")}</ol>`
            : `<p class="muted">No directory listings found for this number through 1950.</p>`}
          <p class="small muted">The text was read by computer from the scans, so names can be misspelled. The scanned lines below, and the "scan ↗" links, show the originals.</p>
        </div>
      </div>
      ${news.length ? `<div class="news reveal"><h3>In the news</h3><p class="small muted">Newspaper clippings from the library's scrapbooks that mention this address. Click one to open the scrapbook page.</p>
        <div class="news-grid">${news.slice(0, 6).map(n => `<a class="clip" href="${n.src}" target="_blank" rel="noopener"><span class="doc-year">${n.year}</span><img src="${ROOT + n.crop}" alt="Newspaper clipping, ${n.year}" loading="lazy"><span class="doc-cap">Scrapbook, ${n.year}</span></a>`).join("")}</div></div>` : ""}
      ${docs.length ? `<div class="docs reveal"><h3>Documents from the era</h3><p class="small muted">The actual directory lines for this address, cropped from the library's scans. Click one to open the full page.</p>
        <div class="doc-strip">${docs.map(l => `<a class="doc" href="${l.src}" target="_blank" rel="noopener"><span class="doc-year">${l.year}</span><img src="${ROOT + l.crop}" alt="Directory line, ${l.year}" loading="lazy"><span class="doc-cap">${l.year} city directory</span></a>`).join("")}</div></div>` : ""}
    </div>`;
    el.hidden = false;
    el.querySelectorAll(".flip").forEach(b => b.onclick = () => b.classList.toggle("flipped"));
    el.querySelectorAll(".pc-nav button").forEach(b => b.onclick = () => {
      el.querySelectorAll(".pc").forEach(p => p.classList.toggle("hidden", p.dataset.i !== b.dataset.i));
      el.querySelectorAll(".pc-nav button").forEach(x => x.classList.toggle("on", x === b));
    });
    MW.observeReveals(el);
  }

  MW.Archive = {
    async show(hit, q, el) {
      el.hidden = true; el.innerHTML = "";
      let index; try { index = await getJSON(ROOT + "data/street_index.json"); } catch (e) { return; } // archive not present: stay hidden
      const m = (q || "").match(/^\s*(\d+[A-Za-z]?)\s+([^,]+)/);
      const num = String(hit.number || (m && m[1]) || "").replace(/[^0-9]/g, "");
      const road = hit.road || (m && m[2]);
      const key = matchStreet(index, road);
      if (!key || !num) return;
      let sd; try { sd = await getJSON(ROOT + "data/streets/" + key + ".json"); } catch (e) { return; }
      const house = sd.houses[num];
      render(el, `${num} ${nice(sd.name)}`, sd.name, num, house, sd);
    }
  };
})();
