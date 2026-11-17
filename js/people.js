/* Notable People page */
document.addEventListener("DOMContentLoaded", () => {
  const MW = window.MW, esc = MW.esc, $ = s => document.querySelector(s);
  const FIELDS = { arts: "Film, TV & Art", music: "Music", lit: "Writing & Journalism", sports: "Sports", science: "Science & Engineering", public: "Public Life & Law", business: "Business & Building" };
  let field = null, q = "";
  const groupOf = p => !p.born ? "Era unknown" : p.born < 1850 ? "Born before 1850" : p.born < 1900 ? "Born 1850–1899" : `Born in the ${Math.floor(p.born / 10) * 10}s`;
  const order = g => g === "Era unknown" ? 9999 : g.startsWith("Born before") ? 0 : +g.match(/\d{4}/)[0];
  const life = p => p.born ? `${p.born}–${p.died || ""}` : "";
  const initials = n => n.split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join("");

  $("#pf").innerHTML = `<button class="chip active" data-f="">All</button>` + Object.entries(FIELDS).map(([k, v]) => `<button class="chip" data-f="${k}">${v}</button>`).join("");
  $("#pf").onclick = e => { const b = e.target.closest(".chip"); if (!b) return; field = b.dataset.f || null; document.querySelectorAll("#pf .chip").forEach(c => c.classList.toggle("active", c === b)); render(); };
  $("#pq").oninput = e => { q = e.target.value.toLowerCase(); render(); };

  function render() {
    const list = MW.people.filter(p => (!field || p.field === field) && (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
    const groups = {};
    list.forEach(p => (groups[groupOf(p)] = groups[groupOf(p)] || []).push(p));
    $("#pp").innerHTML = Object.keys(groups).sort((a, b) => order(a) - order(b)).map(g => `<section class="pp-group">
      <h2 class="reveal">${g}</h2>
      <div class="pp-grid">${groups[g].sort((a, b) => (a.born || 0) - (b.born || 0)).map((p, i) => `<article class="pp-card reveal d${i % 3}">
        <div class="pp-av f-${p.field}">${esc(initials(p.name))}</div>
        <div class="pp-body"><h3><a href="${p.url}" target="_blank" rel="noopener">${esc(p.name)}</a></h3>
          <div class="pp-meta">${life(p) ? `<span>${life(p)}</span>` : ""}<span class="tag">${FIELDS[p.field]}</span></div>
          <p>${esc(p.desc)}</p>
          ${p.homes ? p.homes.map(h => `<a class="pp-home" href="house.html?q=${encodeURIComponent(h.address)}">⌂ ${h.probable ? "Probably the family home: " : "Lived at "}${esc(h.address)} <span>(${h.years}, city directories)</span></a>`).join("") : ""}
        </div></article>`).join("")}</div></section>`).join("") || `<p class="muted">No one matches.</p>`;
    MW.observeReveals();
  }
  render();
});
