/* Sanborn fire-insurance maps: find the sheet(s) that show an address, and render them.
   Data: js/sanborn-data.js (Library of Congress, public domain). */
(function () {
  const MW = window.MW;
  const SUF = { RD: "ROAD", AV: "AVENUE", AVE: "AVENUE", ST: "STREET", PL: "PLACE", TER: "TERRACE", DR: "DRIVE", CT: "COURT", LN: "LANE" };
  const DIR = { N: "NORTH", S: "SOUTH", E: "EAST", W: "WEST" };
  const norm = r => {
    if (!r) return "";
    const w = r.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean).map((x, i, a) => (i === a.length - 1 && SUF[x]) || (i === 0 && a.length > 2 && DIR[x]) || x);
    return w.join(" ");
  };
  const bare = s => s.replace(/\s+(ROAD|AVENUE|STREET|PLACE|TERRACE|DRIVE|COURT|LANE|WAY)$/, "");

  /* -> [{ year, label, sheets: [n], exact, range: "101–183", note }] */
  MW.sanbornFor = function (number, road) {
    if (!MW.sanborn || !road) return [];
    const st = norm(road), n = parseInt(number, 10);
    return Object.entries(MW.sanborn).map(([y, v]) => {
      let rows = v.rows.filter(r => r[0] === st);
      if (!rows.length && bare(st) === st) rows = v.rows.filter(r => bare(r[0]) === st);  // only when no suffix was given
      if (!rows.length) return null;
      let hit = n ? rows.filter(r => r[1] != null && n >= r[1] && n <= r[2]) : [];
      if (hit.length > 1) { const same = hit.filter(r => r[1] % 2 === n % 2); if (same.length) hit = same; }
      const exact = hit.length > 0;
      const use = exact ? hit : rows;
      const sheets = [...new Set(use.flatMap(r => r[3]))].filter(s => v.sheets[s]);
      if (!sheets.length) return null;
      return { year: y, label: v.label, item: v.item, sheets, exact, range: exact && hit[0][1] != null ? `${hit[0][1]}–${hit[0][2]}` : "", street: rows[0][0] };
    }).filter(Boolean)
      // Both volumes share one sheet numbering (the 1949 volume is the 1912 survey with pasted-over updates),
      // so an exact match in one volume locates the address in the other.
      .map((h, i, all) => {
        if (h.exact) return h;
        const ref = all.find(o => o.exact);
        if (!ref) return h;
        const v = MW.sanborn[h.year], same = ref.sheets.filter(s => v.sheets[s]);
        return same.length ? Object.assign({}, h, { sheets: same, exact: true, range: "", via: ref.year }) : h;
      });
  };

  const img = (v, s, w) => `https://tile.loc.gov/image-services/iiif/service:gmd:gmd381m:g3814m:g3814sm:${v.svc}:${v.sheets[s][1]}/full/${w},/0/default.jpg`;
  const page = (v, s) => `https://www.loc.gov/resource/${v.res}/?sp=${v.sheets[s][0]}`;
  const nice = s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  MW.sanbornHTML = function (number, road, opts = {}) {
    const hits = MW.sanbornFor(number, road);
    if (!hits.length) return "";
    const cards = hits.flatMap(h => {
      const v = MW.sanborn[h.year];
      return h.sheets.slice(0, h.exact ? 2 : 3).map(s => `<figure class="sb-card">
        <a href="${page(v, s)}" target="_blank" rel="noopener"><img src="${img(v, s, 640)}" alt="Sanborn map ${h.year}, sheet ${s}" loading="lazy"></a>
        <figcaption><b>${h.year === "1912" ? "1912" : "1949"}</b> · sheet ${s}${h.via ? ` · same sheet as ${h.via === "1912" ? "1912" : "1949"}` : h.exact ? ` · covers ${h.range} ${esc(nice(h.street))}` : ` · one of the sheets for ${esc(nice(h.street))}`}
          <a href="${page(v, s)}" target="_blank" rel="noopener">Zoom in at the Library of Congress ↗</a></figcaption></figure>`);
    }).join("");
    const exact = hits.some(h => h.exact);
    return `<div class="eyebrow">Fire-insurance maps</div><h2>${opts.title || "This street on the Sanborn maps"}</h2>
      <p class="muted">Sanborn maps were drawn for fire insurers and show every building: yellow for wood frame, pink for brick, blue for stone, with porches, stories and outbuildings. ${exact ? "We matched this address to the sheet in each volume's street index." : "The index doesn't give a number range here, so these are the sheets for this street."} ${number ? "House numbers mostly match today's, but check the numbers written along the street." : ""}</p>
      <div class="sb-grid">${cards}</div>
      <p class="small muted">${MW.sanbornCredit || "Sanborn Map Company"}. Library of Congress, Geography and Map Division, Sanborn Maps Collection (public domain).</p>`;
  };
  const esc = s => MW.esc(s);
})();
