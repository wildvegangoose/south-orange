/* ==========================================================================
   The Time Machine scene: an illustrated SVG panorama of Maplewood that
   rebuilds itself for any year. Composite and impressionistic: buildings are
   placed for storytelling, not surveyed positions.
   West (South Mountain & Ridgewood Road farms) is on the left; the Village
   center, Memorial Park, and the Valley Street / Hilton side run to the right.
   ========================================================================== */
(function () {
  const MW = window.MW;
  const W = 1600, H = 640, GROUND = 548, BACK = 468;

  /* ---------- tiny drawing kit ---------- */
  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(42);
  const win = (x, y, w = 14, h = 20, c = "#f6e3a8") =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="#3b2f26" stroke-width="1.5"/><path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="#3b2f26" stroke-width="1"/>`;
  const door = (x, y, w = 14, h = 26, c = "#6b3d26") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${c}" stroke="#2a1e16" stroke-width="1.5"/><circle cx="${x + w - 4}" cy="${y + h / 2}" r="1.3" fill="#e3c27a"/>`;
  const chimney = (x, y, h = 22, c = "#8a4b35") => `<rect x="${x}" y="${y - h}" width="11" height="${h + 6}" fill="${c}" stroke="#3b2f26" stroke-width="1.5"/>`;
  const smoke = (x, y) => `<g class="smoke">${[0, 1, 2].map(i => `<circle cx="${x}" cy="${y}" r="${5 + i * 2}" style="animation-delay:${i * 1.1}s"/>`).join("")}</g>`;
  const label = (txt, y = -10) => `<g class="lbl" transform="translate(0,${y})"><rect x="${-txt.length * 3.4 - 8}" y="-15" width="${txt.length * 6.8 + 16}" height="20" rx="10"/><text y="0" text-anchor="middle">${txt}</text></g>`;

  // Item wrapper: appears between years `from` and `to`; optional place id for hotspot
  function item(x, y, from, to, body, o = {}) {
    const cls = ["it", o.cls || ""].join(" ");
    const hit = o.place ? ` data-place="${o.place}" tabindex="0" role="button" aria-label="${MW.esc(o.name || o.place)}"` : "";
    return `<g class="${cls}" data-from="${from}" data-to="${to}"${o.grow ? ` data-grow="${o.grow}"` : ""}${hit} transform="translate(${x},${y})${o.s ? ` scale(${o.s})` : ""}"><g class="grow">${body}${o.place ? `<circle class="beacon" cx="0" cy="${o.by || -110}" r="6"/>` : ""}${o.lbl ? label(o.lbl, (o.by || -110) - 16) : ""}</g></g>`;
  }

  /* ---------- buildings (origin = bottom centre) ---------- */
  const B = {
    wetu: () => `<path d="M-34 0 Q-34 -46 0 -50 Q34 -46 34 0Z" fill="#9b7b52" stroke="#4a3622" stroke-width="2"/>
      ${[-24, -12, 0, 12, 24].map(x => `<path d="M${x} 0 Q${x * .8} -30 ${x * .3} -48" stroke="#5e4530" stroke-width="1.4" fill="none"/>`).join("")}
      <path d="M-30 -18 Q0 -24 30 -18M-33 -6 Q0 -12 33 -6" stroke="#5e4530" stroke-width="1.2" fill="none"/>
      <path d="M-7 0 v-18 a7 7 0 0 1 14 0 v18z" fill="#3a2a1c"/>`,
    fire: () => `<g class="flicker"><path d="M-8 0 L0 -18 L8 0Z" fill="#f0a030"/><path d="M-4 0 L0 -10 L4 0Z" fill="#ffe08a"/></g><path d="M-12 0h24" stroke="#4a3622" stroke-width="3"/>${smoke(0, -24)}`,
    cabin: () => `<rect x="-40" y="-40" width="80" height="40" fill="#8a5d3b" stroke="#3b2618" stroke-width="2"/>
      ${[-32, -24, -16, -8].map(y => `<path d="M-40 ${y}h80" stroke="#5c3b24" stroke-width="2"/>`).join("")}
      <path d="M-48 -38 L0 -72 L48 -38Z" fill="#6b4a2e" stroke="#3b2618" stroke-width="2"/>${chimney(22, -50, 14, "#8f8573")}${door(-7, -26, 14, 26)}${win(16, -30, 14, 12)}${smoke(28, -70)}`,
    stoneHouse: (inn) => `<rect x="-70" y="-58" width="140" height="58" fill="#b49a78" stroke="#4a3a2a" stroke-width="2"/>
      ${Array.from({ length: 26 }, (_, i) => `<rect x="${-66 + (i % 7) * 19 + (Math.floor(i / 7) % 2) * 8}" y="${-54 + Math.floor(i / 7) * 13}" width="14" height="9" rx="2" fill="#a68b68" opacity=".75"/>`).join("")}
      <path d="M-78 -56 L0 -100 L78 -56Z" fill="#5b4636" stroke="#2f241b" stroke-width="2"/>
      ${chimney(-58, -82, 26, "#9c8466")}${chimney(46, -82, 26, "#9c8466")}
      ${win(-52, -46)}${win(-24, -46)}${win(12, -46)}${win(40, -46)}${door(-8, -30, 16, 30, "#5a3320")}
      <rect x="-3" y="-60" width="6" height="4" fill="#d8c8a8"/>`,
    innAdds: () => `${[-40, 0, 40].map(x => `<path d="M${x - 11} -70 h22 v-12 l-11 -8 l-11 8z" fill="#efe6d2" stroke="#2f241b" stroke-width="1.5"/>`).join("")}
      <path d="M-22 -36 h44 l-22 -12z" fill="#f4eee0" stroke="#2f241b" stroke-width="1.5"/><path d="M-18 -36v36M18 -36v36" stroke="#f4eee0" stroke-width="4"/>
      <g transform="translate(92,0)"><path d="M0 0v-44" stroke="#3b2f26" stroke-width="3"/><rect x="-28" y="-62" width="56" height="20" rx="3" fill="#1f3a2e"/><text x="0" y="-48" text-anchor="middle" font-size="8.5" fill="#f3cf7a" font-family="Fraunces,serif">OLD WASHINGTON INN</text></g>`,
    farmhouse: (c = "#e9e1cf", w = 110, roof = "#5d4636") => `<rect x="${-w / 2}" y="-54" width="${w}" height="54" fill="${c}" stroke="#3b2f26" stroke-width="2"/>
      ${Array.from({ length: 7 }, (_, i) => `<path d="M${-w / 2} ${-46 + i * 7}h${w}" stroke="rgba(0,0,0,.08)"/>`).join("")}
      <path d="M${-w / 2 - 8} -52 L0 -92 L${w / 2 + 8} -52Z" fill="${roof}" stroke="#2f241b" stroke-width="2"/>${chimney(-6, -84, 18, "#8a4b35")}
      ${win(-w / 2 + 12, -44)}${win(-w / 2 + 36, -44)}${win(w / 2 - 26, -44)}${door(6, -28)}`,
    wing: (c = "#efe8d8") => `<rect x="0" y="-42" width="62" height="42" fill="${c}" stroke="#3b2f26" stroke-width="2"/><path d="M-4 -40 L31 -66 L66 -40Z" fill="#6a5240" stroke="#2f241b" stroke-width="2"/>${win(10, -32)}${win(38, -32)}`,
    barn: (c = "#9e3a24") => `<path d="M-50 0 V-50 L-30 -76 H30 L50 -50 V0Z" fill="${c}" stroke="#3b2018" stroke-width="2"/>
      <path d="M-50 -50 H50" stroke="#3b2018" stroke-width="2"/><rect x="-18" y="-40" width="36" height="40" fill="#7c2c1a" stroke="#f1e3c4" stroke-width="2"/><path d="M-18 -40 L18 0 M18 -40 L-18 0" stroke="#f1e3c4" stroke-width="2"/>
      <rect x="-8" y="-66" width="16" height="12" fill="#f1e3c4"/>`,
    chapel: () => `<rect x="-36" y="-56" width="72" height="56" fill="#f1ebdc" stroke="#3b2f26" stroke-width="2"/><path d="M-44 -54 L0 -84 L44 -54Z" fill="#4f4038" stroke="#2f241b" stroke-width="2"/>
      <rect x="-10" y="-112" width="20" height="30" fill="#f1ebdc" stroke="#3b2f26" stroke-width="2"/><path d="M-13 -110 L0 -134 L13 -110Z" fill="#4f4038" stroke="#2f241b" stroke-width="2"/>
      <path d="M-22 -40 a6 6 0 0 1 12 0 v18 h-12z M10 -40 a6 6 0 0 1 12 0 v18 h-12z" fill="#cfe2ea" stroke="#3b2f26" stroke-width="1.5"/>${door(-8, -26, 16, 26)}`,
    store: (name, c = "#d9c9a6") => `<rect x="-50" y="-56" width="100" height="56" fill="${c}" stroke="#3b2f26" stroke-width="2"/><rect x="-56" y="-72" width="112" height="18" fill="${c}" stroke="#3b2f26" stroke-width="2"/>
      <text x="0" y="-59" text-anchor="middle" font-size="9" font-family="Fraunces,serif" font-weight="700" fill="#3b2f26">${name}</text>
      <path d="M-50 -38 h100" stroke="#3b2f26"/><path d="M-50 -38 l8 -8 h84 l8 8" fill="#b8381e" opacity=".85"/>
      ${win(-40, -32, 22, 22, "#e8eef0")}${win(18, -32, 22, 22, "#e8eef0")}${door(-8, -28, 16, 28)}<path d="M-50 0 h100 v4 h-100z" fill="#8b7a62"/>`,
    depot: () => `<rect x="-46" y="-36" width="92" height="36" fill="#c9a36b" stroke="#3b2f26" stroke-width="2"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${-42 + i * 8.4} -36v36" stroke="rgba(0,0,0,.15)"/>`).join("")}
      <path d="M-62 -34 L-40 -58 H40 L62 -34Z" fill="#7a3b26" stroke="#2f241b" stroke-width="2"/>${win(-34, -28, 12, 18)}${win(22, -28, 12, 18)}${door(-8, -28, 16, 28)}
      <rect x="-26" y="-50" width="52" height="11" fill="#f1e3c4" stroke="#3b2f26"/><text x="0" y="-41.5" text-anchor="middle" font-size="8" font-family="Fraunces,serif" font-weight="700" fill="#3b2f26">MAPLEWOOD</text>`,
    station: () => `<rect x="-78" y="-46" width="156" height="46" fill="#a9573a" stroke="#3b2018" stroke-width="2"/>
      ${Array.from({ length: 5 }, (_, i) => `<path d="M-78 ${-38 + i * 8}h156" stroke="rgba(0,0,0,.12)"/>`).join("")}
      <path d="M-96 -44 L-70 -72 H70 L96 -44Z" fill="#3e4a44" stroke="#1e2420" stroke-width="2"/><path d="M-96 -44 H96" stroke="#1e2420" stroke-width="3"/>
      ${[-62, -36, 24, 50].map(x => `<path d="M${x} -36 a7 7 0 0 1 14 0 v26 h-14z" fill="#f3e3b2" stroke="#3b2018" stroke-width="1.5"/>`).join("")}${door(-9, -34, 18, 34, "#4a2a1a")}
      <rect x="-34" y="-66" width="68" height="13" rx="2" fill="#f4eee0" stroke="#3b2018"/><text x="0" y="-56" text-anchor="middle" font-size="9" font-family="Fraunces,serif" font-weight="700" fill="#3b2018">MAPLEWOOD</text>`,
    queenAnne: (c = "#7d9a8a", trim = "#f4ead2") => `<rect x="-46" y="-78" width="92" height="78" fill="${c}" stroke="#2f241b" stroke-width="2"/>
      <rect x="20" y="-104" width="34" height="104" fill="${c}" stroke="#2f241b" stroke-width="2"/><path d="M16 -104 L37 -142 L58 -104Z" fill="#6c3a2a" stroke="#2f241b" stroke-width="2"/>
      <path d="M-54 -76 L-8 -118 L36 -76Z" fill="#6c3a2a" stroke="#2f241b" stroke-width="2"/>
      ${Array.from({ length: 5 }, (_, i) => `<path d="M${-38 + i * 7} -${86 + i * 5} h${60 - i * 14}" stroke="${trim}" stroke-width="2" stroke-dasharray="3 2"/>`).join("")}
      ${win(-36, -66)}${win(-12, -66)}${win(28, -90, 18, 22)}${win(28, -56, 18, 22)}
      <path d="M-52 -28 h76 v4 h-76z" fill="${trim}"/>${[-48, -28, -8, 14].map(x => `<path d="M${x} -24 v24" stroke="${trim}" stroke-width="3"/>`).join("")}
      ${door(-26, -26, 14, 26)}${win(-6, -22, 14, 16)}${chimney(-30, -106, 14)}`,
    foursquare: (c = "#d4b483", roof = "#4d4038") => `<rect x="-52" y="-92" width="104" height="92" fill="${c}" stroke="#2f241b" stroke-width="2"/>
      <path d="M-62 -90 L-22 -122 H22 L62 -90Z" fill="${roof}" stroke="#2f241b" stroke-width="2"/><path d="M-12 -104 h24 v-12 l-12 -6 l-12 6z" fill="${c}" stroke="#2f241b" stroke-width="1.5"/>${win(-6, -116, 12, 10)}
      ${win(-38, -80, 18, 22)}${win(20, -80, 18, 22)}${win(-38, -40, 18, 22)}${win(20, -40, 18, 22)}
      <path d="M-60 -32 h120 l-6 -10 h-108z" fill="${roof}" stroke="#2f241b" stroke-width="1.5"/>${[-52, -18, 18, 52].map(x => `<path d="M${x} -32 v32" stroke="#f1e8d4" stroke-width="5"/>`).join("")}
      ${door(-8, -30, 16, 30)}${chimney(30, -118, 12)}`,
    tudor: (c = "#efe5cf") => `<rect x="-58" y="-62" width="116" height="62" fill="${c}" stroke="#2f241b" stroke-width="2"/>
      <path d="M-66 -60 L-16 -116 L18 -78 L34 -94 L66 -60Z" fill="#4b3b33" stroke="#2f241b" stroke-width="2"/>
      <path d="M-44 -60 L-16 -100 L12 -60Z" fill="${c}" stroke="#2f241b" stroke-width="2"/>
      <path d="M-30 -60 v-20 M-16 -60 v-40 M-2 -60 v-20 M-38 -70 L-16 -96 L6 -70" stroke="#3a2a20" stroke-width="3" fill="none"/>
      ${win(-36, -48, 26, 18, "#d8e4e0")}${win(26, -48, 24, 18, "#d8e4e0")}<path d="M-2 0 v-26 a10 10 0 0 1 20 0 v26z" fill="#6b3d26" stroke="#2a1e16" stroke-width="1.5"/>
      ${chimney(40, -96, 22, "#9a4a32")}<rect x="38" y="-102" width="15" height="6" fill="#7c3a28"/>`,
    colonialRev: (c = "#a14a32") => `<rect x="-60" y="-80" width="120" height="80" fill="${c}" stroke="#2f241b" stroke-width="2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M-60 ${-72 + i * 8}h120" stroke="rgba(0,0,0,.1)"/>`).join("")}
      <path d="M-66 -78 L0 -112 L66 -78Z" fill="#3e3a38" stroke="#2f241b" stroke-width="2"/>
      ${[-46, -22, 10, 34].map(x => win(x, -68, 14, 20, "#f4ead2")).join("")}${win(-46, -34, 14, 20, "#f4ead2")}${win(34, -34, 14, 20, "#f4ead2")}
      <path d="M-16 -40 L0 -50 L16 -40Z" fill="#f4eee0" stroke="#2f241b"/>${door(-8, -38, 16, 38, "#1f3a2e")}${chimney(-52, -100, 12)}${chimney(42, -100, 12)}`,
    cape: (c = "#c9d6dd") => `<rect x="-52" y="-40" width="104" height="40" fill="${c}" stroke="#2f241b" stroke-width="2"/><path d="M-58 -38 L0 -84 L58 -38Z" fill="#4c4a48" stroke="#2f241b" stroke-width="2"/>
      ${[-24, 12].map(x => `<path d="M${x} -54 h16 v-12 l-8 -6 l-8 6z" fill="${c}" stroke="#2f241b" stroke-width="1.5"/>`).join("")}${win(-40, -30)}${win(26, -30)}${door(-7, -28)}`,
    shops: () => `${[["#c6a27a", "BAKERY", -110], ["#9aa98f", "DRUGS", -36], ["#d3b6a0", "HARDWARE", 38]].map(([c, n, x]) => `<g transform="translate(${x},0)"><rect x="0" y="-70" width="72" height="70" fill="${c}" stroke="#2f241b" stroke-width="2"/><rect x="-2" y="-76" width="76" height="8" fill="#5a4a3c"/>
      <path d="M0 -40 l6 -8 h60 l6 8" fill="${["#b8381e", "#1f3a2e", "#e3a33a"][(x + 110) / 74]}"/><text x="36" y="-54" text-anchor="middle" font-size="8.5" font-family="Fraunces,serif" font-weight="700" fill="#2f241b">${n}</text>
      ${win(6, -34, 26, 24, "#e5eef0")}${door(44, -30, 16, 30)}${win(10, -66, 12, 12)}${win(48, -66, 12, 12)}</g>`).join("")}`,
    theater: () => `<rect x="-62" y="-112" width="124" height="112" fill="#d9b98a" stroke="#2f241b" stroke-width="2"/><rect x="-62" y="-118" width="124" height="10" fill="#8a5a3a"/>
      <rect x="-14" y="-170" width="28" height="70" fill="#b8381e" stroke="#2f241b" stroke-width="2"/>${"MAPLEWOOD".split("").map((ch, i) => `<text x="0" y="${-160 + i * 7.4}" text-anchor="middle" font-size="7" font-weight="800" fill="#ffe8a8" font-family="Inter,sans-serif">${ch}</text>`).join("")}
      <path d="M-58 -62 h116 l-8 16 h-100z" fill="#1f3a2e" stroke="#2f241b" stroke-width="1.5"/><g class="bulbs">${Array.from({ length: 15 }, (_, i) => `<circle cx="${-52 + i * 7.4}" cy="-64" r="2" fill="#ffd86b" style="animation-delay:${(i % 3) * .3}s"/>`).join("")}</g>
      <text x="0" y="-50" text-anchor="middle" font-size="8" font-weight="700" fill="#ffe8a8" font-family="Inter,sans-serif" class="marquee-txt">NOW SHOWING</text>
      ${[-42, 22].map(x => win(x, -98, 20, 26, "#f4ead2")).join("")}${[-36, -12, 12].map(x => `<rect x="${x}" y="-38" width="22" height="38" fill="#6b3d26" stroke="#2a1e16" stroke-width="1.5"/>`).join("")}`,
    townhall: () => `<rect x="-110" y="-74" width="220" height="74" fill="#a64b33" stroke="#2f241b" stroke-width="2"/>${Array.from({ length: 8 }, (_, i) => `<path d="M-110 ${-66 + i * 8}h220" stroke="rgba(0,0,0,.1)"/>`).join("")}
      <path d="M-118 -72 H118 L104 -86 H-104Z" fill="#efe8d8" stroke="#2f241b" stroke-width="2"/><path d="M-40 -86 L0 -112 L40 -86Z" fill="#efe8d8" stroke="#2f241b" stroke-width="2"/>
      <rect x="-14" y="-140" width="28" height="30" fill="#f4eee0" stroke="#2f241b" stroke-width="2"/><rect x="-9" y="-154" width="18" height="14" fill="#f4eee0" stroke="#2f241b" stroke-width="2"/><path d="M-11 -154 L0 -178 L11 -154Z" fill="#3e4a44" stroke="#2f241b" stroke-width="2"/><circle cx="0" cy="-126" r="7" fill="#fff" stroke="#2f241b"/>
      ${[-96, -72, -48, 34, 58, 82].map(x => win(x, -62, 14, 22, "#f4ead2")).join("")}${[-28, -10, 8, 26].map(x => `<rect x="${x - 2}" y="-74" width="5" height="74" fill="#f4eee0" stroke="#2f241b"/>`).join("")}${door(-8, -34, 16, 34, "#1f3a2e")}`,
    highschool: () => `<rect x="-150" y="-70" width="300" height="70" fill="#b05a3c" stroke="#2f241b" stroke-width="2"/>${Array.from({ length: 13 }, (_, i) => win(-138 + i * 22, -58, 12, 16, "#f1e3c4")).join("")}${Array.from({ length: 13 }, (_, i) => win(-138 + i * 22, -30, 12, 16, "#f1e3c4")).join("")}
      <rect x="-26" y="-150" width="52" height="150" fill="#b8634a" stroke="#2f241b" stroke-width="2"/><path d="M-30 -150 L0 -186 L30 -150Z" fill="#3e4a44" stroke="#2f241b" stroke-width="2"/>
      ${win(-12, -134, 24, 30, "#f1e3c4")}<circle cx="0" cy="-88" r="10" fill="#f4eee0" stroke="#2f241b"/><path d="M0 -88 v-6 M0 -88 h5" stroke="#2f241b" stroke-width="1.5"/>${door(-10, -36, 20, 36, "#3a2418")}`,
    mill: () => `<rect x="-56" y="-80" width="88" height="80" fill="#9c7454" stroke="#3b2618" stroke-width="2"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${-56 + i * 8.8} -80v80" stroke="rgba(0,0,0,.18)"/>`).join("")}
      <path d="M-64 -78 L-12 -116 L40 -78Z" fill="#5b3a24" stroke="#2f1d12" stroke-width="2"/>${win(-42, -64)}${win(-8, -64)}${door(-30, -30, 18, 30)}
      <g class="wheel" transform="translate(52,-26)"><circle r="30" fill="none" stroke="#4b3020" stroke-width="5"/><circle r="5" fill="#4b3020"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 0 L${Math.cos(i * Math.PI / 4) * 30} ${Math.sin(i * Math.PI / 4) * 30}" stroke="#4b3020" stroke-width="3"/><rect x="${Math.cos(i * Math.PI / 4) * 30 - 4}" y="${Math.sin(i * Math.PI / 4) * 30 - 4}" width="8" height="8" fill="#6d4a33"/>`).join("")}</g>`,
    cooper: () => `<rect x="-40" y="-44" width="80" height="44" fill="#a89a84" stroke="#3b2f26" stroke-width="2"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${-36 + (i % 5) * 15 + (Math.floor(i / 5) % 2) * 6}" y="${-40 + Math.floor(i / 5) * 13}" width="11" height="9" rx="2" fill="#968770"/>`).join("")}
      <path d="M-48 -42 L0 -72 L48 -42Z" fill="#5b4636" stroke="#2f241b" stroke-width="2"/>${door(-8, -26, 16, 26)}${win(18, -32, 12, 12)}
      <g transform="translate(-58,0)"><ellipse cx="0" cy="-12" rx="10" ry="12" fill="#a0683c" stroke="#3b2618" stroke-width="1.5"/><path d="M-10 -16 h20 M-10 -8 h20" stroke="#3b2618" stroke-width="2"/></g>`,
    boulder: () => `<path d="M-30 0 Q-34 -26 -10 -34 Q14 -40 28 -24 Q36 -10 30 0Z" fill="#8f8a80" stroke="#3b3a36" stroke-width="2"/><rect x="-10" y="-22" width="20" height="12" fill="#6e6656"/><path d="M0 -34 v-40" stroke="#3b3a36" stroke-width="2.5"/><path d="M0 -74 h22 v12 h-22z" fill="#b8381e" class="flag"/>`,
    postOffice: () => `<rect x="-70" y="-46" width="140" height="46" fill="#c9b9a2" stroke="#2f241b" stroke-width="2"/><rect x="-74" y="-52" width="148" height="8" fill="#6d6458"/>
      <text x="0" y="-36" text-anchor="middle" font-size="7.5" font-weight="700" fill="#2f241b" font-family="Inter,sans-serif">UNITED STATES POST OFFICE</text>
      ${[-60, -36, 24, 48].map(x => win(x, -28, 14, 18, "#dfe8ea")).join("")}${door(-9, -28, 18, 28, "#2f4f5a")}<path d="M84 0 v-60" stroke="#555" stroke-width="2"/><path d="M84 -60 h22 v12 h-22z" fill="#2f4f5a" class="flag"/>`,
    strawberries: () => `${Array.from({ length: 4 }, (_, r) => `<path d="M${-60 + r * 6} ${-4 - r * 6} h${120 - r * 12}" stroke="#3f7a3a" stroke-width="6" stroke-linecap="round"/>${Array.from({ length: 8 - r }, (_, i) => `<circle cx="${-54 + r * 6 + i * 15}" cy="${-4 - r * 6}" r="2.6" fill="#d8262a"/>`).join("")}`).join("")}
      <g transform="translate(70,0)"><rect x="-10" y="-30" width="20" height="30" fill="#e9e1cf" stroke="#3b2f26" stroke-width="1.5"/><text x="0" y="-12" text-anchor="middle" font-size="6" font-weight="800" fill="#b8381e">HILTON</text></g>`
  };

  /* ---------- vegetation ---------- */
  const tree = {
    oak: (s = 1, c = "#3f6b3f") => `<g transform="scale(${s})"><path d="M-4 0 v-30 h8 v30z" fill="#5a3d28"/><circle cx="0" cy="-48" r="24" fill="${c}"/><circle cx="-16" cy="-38" r="16" fill="${c}"/><circle cx="16" cy="-38" r="16" fill="${c}"/><circle cx="-6" cy="-58" r="14" fill="rgba(255,255,255,.08)"/></g>`,
    pine: (s = 1, c = "#2f5440") => `<g transform="scale(${s})"><path d="M-3 0 v-14 h6 v14z" fill="#4a3322"/><path d="M0 -70 L18 -30 H-18Z M0 -54 L22 -14 H-22Z" fill="${c}"/></g>`,
    maple: (s = 1, c = "#c8461f") => `<g transform="scale(${s})"><path d="M-4 0 v-34 h8 v34z" fill="#4e3424"/><path d="M0 -34 l-12 -10 M0 -38 l12 -12" stroke="#4e3424" stroke-width="3"/>
      <circle cx="0" cy="-58" r="26" fill="${c}"/><circle cx="-18" cy="-46" r="17" fill="${c}"/><circle cx="18" cy="-46" r="17" fill="${c}"/><circle cx="6" cy="-68" r="14" fill="rgba(255,220,120,.25)"/><circle cx="-10" cy="-52" r="9" fill="rgba(120,20,0,.2)"/></g>`,
    apple: (s = 1) => `<g transform="scale(${s})"><path d="M-3 0 v-18 h6 v18z" fill="#5a3d28"/><circle cx="0" cy="-30" r="16" fill="#5e8a3e"/>${[[-7, -32], [5, -26], [2, -38], [-2, -24], [9, -34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#d23a2a"/>`).join("")}</g>`
  };

  /* ---------- vehicles (drawn facing right) ---------- */
  const V = {
    walker: c => `<g class="bob"><circle cx="0" cy="-36" r="5" fill="#7a4a2a"/><path d="M0 -31 v16 M0 -15 l-5 15 M0 -15 l5 15 M0 -27 l-6 8 M0 -27 l7 6" stroke="${c || "#6b4a2a"}" stroke-width="3.5" stroke-linecap="round"/></g>`,
    oxcart: () => `<rect x="-40" y="-30" width="44" height="18" fill="#8a5d3b" stroke="#3b2618" stroke-width="2"/><circle cx="-18" cy="-8" r="10" fill="none" stroke="#3b2618" stroke-width="3"/>
      <g class="bob"><ellipse cx="30" cy="-24" rx="20" ry="11" fill="#a07850"/><circle cx="50" cy="-28" r="7" fill="#a07850"/><path d="M18 -14 v14 M40 -14 v14" stroke="#6b4a2a" stroke-width="4"/></g><path d="M4 -22 h12" stroke="#3b2618" stroke-width="2"/>`,
    stagecoach: () => `<g class="bob"><ellipse cx="62" cy="-30" rx="20" ry="10" fill="#5b3a24"/><path d="M78 -34 l10 -10 l4 4 l-8 10z" fill="#5b3a24"/><path d="M48 -22 v20 M58 -22 l4 20 M70 -22 v20 M76 -22 l-4 20" stroke="#3b2618" stroke-width="3.5"/></g>
      <path d="M-44 -64 h70 l6 12 v30 h-82 v-30z" fill="#7c2c1a" stroke="#2a1410" stroke-width="2"/><rect x="-30" y="-54" width="20" height="14" fill="#f1e3c4"/><rect x="0" y="-54" width="18" height="14" fill="#f1e3c4"/>
      <rect x="-40" y="-74" width="62" height="10" fill="#3b2618"/><circle cx="-28" cy="-10" r="12" fill="none" stroke="#2a1410" stroke-width="3.5"/><circle cx="16" cy="-10" r="12" fill="none" stroke="#2a1410" stroke-width="3.5"/><path d="M26 -40 h22" stroke="#3b2618" stroke-width="2"/>`,
    buggy: () => `<g class="bob"><ellipse cx="44" cy="-30" rx="18" ry="9" fill="#2b2420"/><path d="M58 -33 l9 -9 l4 4 l-7 9z" fill="#2b2420"/><path d="M32 -22 v20 M42 -22 l3 20 M54 -22 v20 M58 -22 l-3 20" stroke="#2b2420" stroke-width="3"/></g>
      <path d="M-26 -30 h34 v-6 h-30 q-10 -30 6 -30" fill="#1f1a17" stroke="#1f1a17" stroke-width="2"/><circle cx="-10" cy="-12" r="12" fill="none" stroke="#1f1a17" stroke-width="2.5"/><path d="M8 -30 L30 -30" stroke="#1f1a17" stroke-width="2"/>
      <circle cx="-6" cy="-46" r="5" fill="#d8b48a"/><path d="M-11 -52 h10 v-4 h-10z" fill="#1f1a17"/>`,
    bicycle: () => `<circle cx="-16" cy="-12" r="12" fill="none" stroke="#2a221c" stroke-width="2.5"/><circle cx="16" cy="-12" r="12" fill="none" stroke="#2a221c" stroke-width="2.5"/><path d="M-16 -12 L-4 -30 H12 L16 -12 M-4 -30 L0 -12 L12 -30" stroke="#b8381e" stroke-width="2.5" fill="none"/>
      <g class="bob"><circle cx="2" cy="-54" r="5" fill="#d8b48a"/><path d="M0 -48 L-4 -32 L4 -18 M-2 -44 L12 -34" stroke="#1f3a2e" stroke-width="4" stroke-linecap="round" fill="none"/></g>`,
    trolley: () => `<path d="M10 -86 L-30 -120" stroke="#2a221c" stroke-width="2"/><rect x="-70" y="-80" width="150" height="66" rx="10" fill="#c99b2e" stroke="#3b2618" stroke-width="2"/><rect x="-70" y="-30" width="150" height="10" fill="#7c2c1a"/>
      ${Array.from({ length: 7 }, (_, i) => `<rect x="${-62 + i * 20}" y="-72" width="14" height="22" rx="2" fill="#f4ead2" stroke="#3b2618"/>`).join("")}<rect x="-74" y="-86" width="158" height="8" rx="4" fill="#5b3a24"/>
      <circle cx="-40" cy="-10" r="9" fill="#2a221c"/><circle cx="50" cy="-10" r="9" fill="#2a221c"/><text x="5" y="-38" text-anchor="middle" font-size="7" fill="#f4ead2" font-weight="800">SPRINGFIELD AVE</text>`,
    modelT: () => `<path d="M-40 -20 v-14 h18 v-22 h34 v22 h24 l6 14z" fill="#1d1b19"/><rect x="-18" y="-52" width="24" height="16" fill="#cfe0e6"/><circle cx="-26" cy="-10" r="11" fill="#2a221c" stroke="#777" stroke-width="2"/><circle cx="30" cy="-10" r="11" fill="#2a221c" stroke="#777" stroke-width="2"/><circle cx="40" cy="-28" r="3" fill="#ffe08a"/>`,
    fifties: () => `<path d="M-60 -16 q0 -14 14 -16 l20 -18 h46 l22 18 h20 q14 2 14 16 z" fill="#4fa0a0" stroke="#1f3a3a" stroke-width="2"/><path d="M-22 -32 l12 -14 h36 l14 14z" fill="#dff1f3" stroke="#1f3a3a"/><path d="M-60 -16 h136" stroke="#f4f4f4" stroke-width="3"/><circle cx="-34" cy="-10" r="10" fill="#222"/><circle cx="46" cy="-10" r="10" fill="#222"/><circle cx="-34" cy="-10" r="4" fill="#ddd"/><circle cx="46" cy="-10" r="4" fill="#ddd"/>`,
    modern: () => `<path d="M-56 -14 q0 -16 16 -18 l18 -16 h44 l22 16 h12 q14 2 14 18 z" fill="#b8381e" stroke="#5a1a0c" stroke-width="2"/><path d="M-18 -32 l10 -12 h28 l16 12z" fill="#cfe4ea" stroke="#5a1a0c"/><circle cx="-30" cy="-10" r="10" fill="#222"/><circle cx="40" cy="-10" r="10" fill="#222"/><circle cx="-30" cy="-10" r="4" fill="#bbb"/><circle cx="40" cy="-10" r="4" fill="#bbb"/><rect x="62" y="-24" width="6" height="4" fill="#fff3b0"/>`,
    jogger: () => `<g class="bob"><circle cx="0" cy="-40" r="5" fill="#8a5a3a"/><path d="M0 -35 L-2 -18 M-2 -18 l-8 18 M-2 -18 l9 16 M0 -30 l-8 6 M0 -30 l9 2" stroke="#e3a33a" stroke-width="4" stroke-linecap="round" fill="none"/></g>`,
    stroller: () => `<g class="bob"><circle cx="-14" cy="-40" r="5" fill="#d8b48a"/><path d="M-14 -35 v17 l-5 18 M-14 -18 l5 18 M-14 -30 l14 4" stroke="#1f3a2e" stroke-width="4" stroke-linecap="round" fill="none"/></g><path d="M0 -26 h22 a10 10 0 0 1 -22 0z M0 -26 q2 -16 18 -16" fill="#e3a33a" stroke="#2a221c" stroke-width="1.5"/><circle cx="4" cy="-6" r="5" fill="#2a221c"/><circle cx="20" cy="-6" r="5" fill="#2a221c"/>`
  };

  /* ---------- trains ---------- */
  const T = {
    steam: () => `<g class="train-body"><rect x="0" y="-36" width="70" height="26" rx="4" fill="#26221f"/><rect x="50" y="-58" width="26" height="48" fill="#3a2f28"/><rect x="18" y="-56" width="10" height="20" fill="#26221f"/><path d="M14 -60 h18 l-4 6 h-10z" fill="#26221f"/>
      <rect x="54" y="-52" width="16" height="12" fill="#f3cf7a"/><path d="M-6 -12 L-14 0 H0z" fill="#b8381e"/>${[12, 34, 58].map(x => `<circle cx="${x}" cy="-8" r="9" fill="#b8381e" stroke="#26221f" stroke-width="3"/>`).join("")}
      ${[0, 1, 2].map(c => `<g transform="translate(${90 + c * 92},0)"><rect x="0" y="-48" width="84" height="38" rx="3" fill="${["#6b2a1a", "#7c3a24", "#6b2a1a"][c]}" stroke="#26221f" stroke-width="2"/>${[8, 26, 44, 62].map(x => `<rect x="${x}" y="-42" width="12" height="14" fill="#f3e3b2"/>`).join("")}<circle cx="16" cy="-8" r="7" fill="#26221f"/><circle cx="68" cy="-8" r="7" fill="#26221f"/></g>`).join("")}</g>
      <g class="puffs">${[0, 1, 2, 3, 4].map(i => `<circle cx="23" cy="-66" r="${8 + i * 3}" style="animation-delay:${i * .45}s"/>`).join("")}</g>`,
    electric: () => `<g class="train-body">${[0, 1, 2, 3].map(c => `<g transform="translate(${c * 108},0)"><rect x="0" y="-56" width="102" height="46" rx="6" fill="#4c5a3e" stroke="#1e241a" stroke-width="2"/>${[10, 32, 54, 76].map(x => `<rect x="${x}" y="-48" width="14" height="16" rx="2" fill="#f3e3b2"/>`).join("")}<circle cx="18" cy="-8" r="7" fill="#1e241a"/><circle cx="84" cy="-8" r="7" fill="#1e241a"/></g>`).join("")}<path d="M380 -56 l10 -14 l10 14" stroke="#1e241a" stroke-width="2" fill="none"/></g>`,
    njt: () => `<g class="train-body"><path d="M0 -10 V-50 q0 -10 14 -12 h30 v52z" fill="#d9dde0" stroke="#3a4046" stroke-width="2"/>${[0, 1, 2, 3].map(c => `<g transform="translate(${44 + c * 112},0)"><rect x="0" y="-62" width="108" height="52" rx="4" fill="#d9dde0" stroke="#3a4046" stroke-width="2"/><rect x="0" y="-30" width="108" height="5" fill="#e36b1e"/><rect x="0" y="-25" width="108" height="5" fill="#7a2b84"/><rect x="0" y="-20" width="108" height="5" fill="#1f4e9c"/>${[10, 34, 58, 82].map(x => `<rect x="${x}" y="-54" width="18" height="16" rx="2" fill="#2a3640"/>`).join("")}<circle cx="18" cy="-8" r="7" fill="#2a2a2a"/><circle cx="90" cy="-8" r="7" fill="#2a2a2a"/></g>`).join("")}<rect x="6" y="-50" width="20" height="14" fill="#2a3640"/></g>`
  };

  /* ---------- compose the scene ---------- */
  function build() {
    const ridgeTrees = Array.from({ length: 70 }, (_, i) => {
      const x = i * 24 + rnd() * 18 - 10;
      const y = ridgeY(x) + 6 + rnd() * 10;
      return `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${(.38 + rnd() * .25).toFixed(2)})">${rnd() > .45 ? tree.oak(1, "#3c5e4a") : tree.pine(1, "#2c4a3b")}</g>`;
    }).join("");

    const woods = Array.from({ length: 46 }, (_, i) => {
      const x = i * 36 + rnd() * 20; const y = 470 + rnd() * 26;
      return `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${(.6 + rnd() * .5).toFixed(2)})">${rnd() > .3 ? tree.oak(1, ["#3f6b3f", "#4c7a42", "#5d8a45"][i % 3]) : tree.pine(1)}</g>`;
    }).join("");

    const fields = [[-20, 410, 260], [230, 425, 220], [470, 418, 240], [720, 428, 260], [990, 420, 230], [1220, 426, 220], [1440, 414, 200]]
      .map(([x, y, w], i) => `<path d="M${x} ${y + 40} L${x + 30} ${y} H${x + w - 20} L${x + w} ${y + 40}Z" fill="${["#d8c27a", "#a9b768", "#c9a95a", "#9fb35e", "#d6bd6e", "#b3b96a", "#ceb767"][i]}"/>
        ${Array.from({ length: 5 }, (_, k) => `<path d="M${x + 20 + k * 4} ${y + 8 + k * 7} H${x + w - 14 - k * 2}" stroke="rgba(80,60,20,.18)" stroke-width="2"/>`).join("")}`).join("");

    const streetMaples = [40, 200, 330, 560, 680, 1000, 1210, 1340, 1470, 1580].map((x, i) =>
      item(x, GROUND + 6, 1880 + (i % 4) * 6, 9999, tree.maple(1, ["#c8461f", "#d9622b", "#e3a33a", "#b8381e"][i % 4]), { grow: 1880 + (i % 4) * 6, cls: "streettree" })).join("");

    const orchard = [1040, 1080, 1120, 1160, 1200].map((x, i) => item(x, BACK + 52 + (i % 2) * 6, 1750, 1905, tree.apple(.9 + (i % 2) * .15))).join("");
    const parkTrees = [1010, 1060, 1180, 1240].map((x, i) => item(x, BACK + 44 + (i % 2) * 8, 1923, 9999, tree.oak(1.15, ["#4c7a42", "#d9622b", "#3f6b3f", "#e3a33a"][i]), { grow: 1923 })).join("");

    const back = [
      item(800, BACK, 1860, 1901, B.depot(), { place: "station1860", name: "First Maplewood Station, 1860", by: -70, lbl: "Maplewood Station, 1860" }),
      item(800, BACK - 18, 1902, 9999, B.station(), { place: "station1902", name: "Maplewood Station", by: -84, lbl: "Maplewood Station" }),
      item(1120, BACK - 6, 1931, 9999, B.townhall(), { place: "townhall", name: "Municipal Building", by: -186, lbl: "Town Hall" }),
      item(1430, BACK - 22, 1927, 9999, B.highschool(), { place: "chs", name: "Columbia High School", by: -196, lbl: "Columbia High School" }),
    ].join("");
    const mill = item(1330, BACK + 30, 1831, 1899, B.mill(), { place: "pierson", name: "Pierson's Mill", by: -124, lbl: "Pierson's Mill" });

    const front = [
      // Lenape homeland
      item(170, GROUND - 4, 1500, 1690, B.wetu(), { place: "trails", name: "Lenape trail", by: -64, lbl: "Lenape wetu" }),
      item(250, GROUND - 2, 1500, 1690, B.fire()),
      item(330, GROUND - 6, 1500, 1690, B.wetu()),
      // Ridgewood Road farms
      item(370, GROUND, 1680, 1765, B.cabin(), { name: "Settler's cabin" }),
      item(130, GROUND, 1743, 9999, B.stoneHouse(), { place: "tball", name: "Timothy Ball House, 1743", by: -116, lbl: "Timothy Ball House 1743" }),
      item(130, GROUND, 1919, 1952, B.innAdds()),
      item(285, GROUND, 1745, 1904, B.barn()),
      item(285, GROUND, 1905, 9999, B.foursquare("#d4b483"), { place: "balch", name: "Balch foursquare", by: -136, lbl: "Foursquare (Balch era)" }),
      item(400, GROUND, 1885, 1929, B.queenAnne("#7d9a8a"), { name: "Queen Anne house" }),
      item(400, GROUND, 1930, 9999, B.queenAnne("#9a7d8a")),
      item(520, GROUND, 1790, 9999, B.farmhouse("#ece4d2", 100), { place: "durand", name: "Durand-Hedden House", by: -112, lbl: "Durand-Hedden House" }),
      item(572, GROUND, 1850, 9999, B.wing()),
      // Village center
      item(680, GROUND, 1811, 1889, B.chapel(), { place: "babel", name: "Babel Chapel", by: -150, lbl: "Babel Chapel" }),
      item(672, GROUND, 1890, 1915, B.queenAnne("#b08a5a")),
      item(690, GROUND, 1916, 9999, B.tudor(), { place: "dalzell", name: "Dalzell-era Tudor", by: -130, lbl: "Tudor Revival (Dalzell era)" }),
      item(830, GROUND, 1841, 1883, B.store("CLINTON VALLEY STORE"), { place: "store", name: "Clinton Valley Store", by: -90, lbl: "Clinton Valley Store" }),
      item(830, GROUND, 1884, 1925, B.store("BAKER'S STORE · P.O.", "#e2d1ac"), { place: "store", name: "Baker's Store", by: -90, lbl: "Baker's Store & Post Office" }),
      item(840, GROUND, 1926, 1957, B.shops(), { place: "po1910", name: "Maplewood Avenue shops", by: -96, lbl: "Maplewood Avenue" }),
      item(840, GROUND, 1958, 9999, B.postOffice(), { place: "po1947", name: "Post Office, 1958", by: -76, lbl: "Post Office 1958" }),
      item(960, GROUND, 1927, 9999, B.theater(), { place: "theater", name: "Maplewood Theatre", by: -186, lbl: "Maplewood Theatre" }),
      item(1085, GROUND + 4, 1923, 9999, B.boulder(), { place: "mpark", name: "Memorial Park", by: -92, lbl: "Memorial Park" }),
      // East: Valley Street & Hilton
      item(1490, GROUND, 1750, 9999, B.cooper(), { place: "jball", name: "Jonas Ball House, 1750", by: -90, lbl: "Jonas Ball House 1750" }),
      item(1330, GROUND + 2, 1855, 1889, B.strawberries(), { place: "boyden", name: "Seth Boyden's strawberries", by: -50, lbl: "Hilton strawberries" }),
      item(1330, GROUND, 1925, 1945, B.tudor("#e6d8c0")),
      item(1330, GROUND, 1946, 9999, B.cape(), { name: "Postwar Cape Cod" }),
      item(1590, GROUND, 1868, 1919, B.farmhouse("#d9c4a0", 90, "#4d3a2e")),
      item(1590, GROUND, 1920, 9999, B.colonialRev(), { name: "Colonial Revival" })
    ].join("");

    const people = [
      // [from, to, drawing, duration, delay, direction, lane]
      [1500, 1665, V.walker(), 34, 0, 1, 0], [1500, 1665, V.walker("#8a5a32"), 34, -5, 1, 0],
      [1666, 1840, V.oxcart(), 40, -10, 1, 0], [1700, 1900, V.walker("#4a3a2a"), 30, -18, -1, 1],
      [1806, 1865, V.stagecoach(), 16, -4, -1, 1], [1840, 1920, V.buggy(), 20, -8, 1, 0],
      [1890, 9999, V.bicycle(), 22, -14, -1, 1], [1908, 1930, V.trolley(), 24, -2, 1, 0],
      [1912, 1940, V.modelT(), 12, -6, -1, 1], [1946, 1979, V.fifties(), 11, -3, 1, 0],
      [1975, 9999, V.modern(), 10, -7, -1, 1], [1975, 9999, V.jogger(), 30, -12, 1, 0],
      [1990, 9999, V.stroller(), 40, -20, -1, 1], [1946, 1979, V.walker("#2f4f5a"), 36, -25, -1, 1]
    ].map(([f, t, svg, dur, del, dir, lane]) =>
      `<g class="it veh" data-from="${f}" data-to="${t}"><g class="grow"><g class="mover ${dir < 0 ? "rev" : ""}" style="animation-duration:${dur}s;animation-delay:${del}s"><g transform="translate(0,${GROUND + 34 + lane * 22})${dir < 0 ? " scale(-1,1)" : ""}">${svg}</g></g></g></g>`).join("");

    const trains = [
      [1838, 1930, T.steam(), 13], [1931, 1983, T.electric(), 11], [1984, 9999, T.njt(), 10]
    ].map(([f, t, svg, dur]) => `<g class="it veh" data-from="${f}" data-to="${t}"><g class="grow"><g class="mover train" style="animation-duration:${dur}s"><g transform="translate(0,${BACK - 16})">${svg}</g></g></g></g>`).join("");

    const frisbee = `<g class="it" data-from="1968" data-to="9999" data-place="frisbee" tabindex="0" role="button" aria-label="Ultimate Frisbee"><g class="grow">
      <g transform="translate(1150,${GROUND + 76})">${V.jogger()}</g><g transform="translate(1290,${GROUND + 76}) scale(-1,1)">${V.jogger()}</g>
      <ellipse class="disc" cx="1160" cy="${GROUND + 30}" rx="9" ry="3" fill="#fff" stroke="#b8381e" stroke-width="2"/>${label("Ultimate Frisbee, 1968", GROUND + 6).replace('translate(0,', 'translate(1220,')}</g></g>`;

    return `<svg class="mw-scene" viewBox="0 175 ${W} ${H - 175}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Illustrated panorama of Maplewood">
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop id="sk0" offset="0"/><stop id="sk1" offset=".65"/><stop id="sk2" offset="1"/></linearGradient>
        <radialGradient id="sunG"><stop offset="0" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffe2a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
        <linearGradient id="ridgeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f7e7a"/><stop offset="1" stop-color="#3d5a4c"/></linearGradient>
        <linearGradient id="hillG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f9a5a"/><stop offset="1" stop-color="#5d7c44"/></linearGradient>
        <linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f8f4a"/><stop offset="1" stop-color="#4e6e36"/></linearGradient>
        <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#skyG)"/>
      <circle class="sun" cx="1220" cy="300" r="150" fill="url(#sunG)"/><circle class="sun" cx="1220" cy="300" r="38" fill="#fff1c4"/>
      <g class="clouds">${[[100, 250, 1], [520, 215, .8], [900, 270, 1.2], [1350, 225, .9], [1800, 255, 1]].map(([x, y, s], i) =>
        `<g class="cloud" style="animation-duration:${80 + i * 25}s;animation-delay:${-i * 30}s"><g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="70" ry="20" fill="#fff" opacity=".8"/><ellipse cx="-30" cy="-12" rx="34" ry="20" fill="#fff" opacity=".85"/><ellipse cx="22" cy="-16" rx="40" ry="24" fill="#fff" opacity=".85"/></g></g>`).join("")}</g>
      <g class="birds">${[0, 1, 2, 3].map(i => `<path class="bird" style="animation-delay:${-i * 4}s;animation-duration:${26 + i * 3}s" d="M0 0 q6 -6 12 0 q6 -6 12 0" transform="translate(0,${120 + i * 22})" stroke="#2a221c" stroke-width="2" fill="none"/>`).join("")}</g>
      <path d="M0 ${ridgeY(0)} ${Array.from({ length: 33 }, (_, i) => `L${i * 50} ${ridgeY(i * 50).toFixed(0)}`).join(" ")} L1600 640 L0 640Z" fill="url(#ridgeG)"/>
      <g class="ridge-trees">${ridgeTrees}</g>
      <path d="M0 440 Q200 400 420 420 T860 418 T1300 410 T1600 420 V640 H0Z" fill="url(#hillG)"/>
      <g class="fields" data-k="fields">${fields}</g>
      <g class="woods" data-k="woods">${woods}</g>
      <path class="river" d="M1180 470 Q1260 480 1290 500 T1380 530 T1420 560" stroke="#7fb0c4" stroke-width="14" fill="none" stroke-linecap="round" opacity=".9"/>
      ${orchard}${parkTrees}
      <g class="it" data-from="1902" data-to="9999"><g class="grow"><path d="M0 ${BACK - 14} H1600 V${BACK + 8} H0Z" fill="#8a7a66"/>${Array.from({ length: 40 }, (_, i) => `<path d="M${i * 40} ${BACK - 14} v22" stroke="rgba(0,0,0,.15)"/>`).join("")}</g></g>
      <g class="it" data-from="1838" data-to="9999"><g class="grow"><path class="rails" d="M0 ${BACK - 16} H1600" stroke="#3a3330" stroke-width="4"/><path d="M0 ${BACK - 12} H1600" stroke="#6b5a48" stroke-width="5" stroke-dasharray="4 8"/></g></g>
      <g class="it" data-from="1931" data-to="9999"><g class="grow">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 200 + 40} ${BACK - 16} v-76 M${i * 200 + 28} ${BACK - 86} h24" stroke="#4a4440" stroke-width="3"/>`).join("")}<path d="M0 ${BACK - 82} H1600" stroke="#4a4440" stroke-width="1.5"/></g></g>
      ${back}
      ${trains}
      ${mill}
      <rect x="0" y="${GROUND - 2}" width="${W}" height="${H - GROUND}" fill="url(#grassG)"/>
      <g class="it" data-from="1923" data-to="9999"><g class="grow"><path d="M990 ${GROUND + 60} Q1120 ${GROUND + 50} 1300 ${GROUND + 62} V640 H990Z" fill="#7ea653"/></g></g>
      ${front}
      ${streetMaples}
      <g class="road">
        <rect class="road-dirt" x="0" y="${GROUND + 18}" width="${W}" height="44" fill="#b59a6e"/>
        <rect class="road-paved it-fade" data-from="1910" x="0" y="${GROUND + 18}" width="${W}" height="44" fill="#6f6862"/>
        <rect class="road-asphalt it-fade" data-from="1950" x="0" y="${GROUND + 18}" width="${W}" height="44" fill="#4a4746"/>
        <path class="it-fade" data-from="1950" d="M0 ${GROUND + 40} H${W}" stroke="#f3cf7a" stroke-width="2.5" stroke-dasharray="26 22"/>
        <g class="it-fade" data-from="2018">${["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa"].map((c, i) => `<rect x="${900 + i * 12}" y="${GROUND + 18}" width="10" height="44" fill="${c}"/>`).join("")}</g>
        <path class="it-fade" data-from="1910" d="M0 ${GROUND + 16} H${W}" stroke="#cfc6b6" stroke-width="4"/>
      </g>
      ${people}
      ${frisbee}
      <rect width="${W}" height="${H}" fill="url(#vig)" pointer-events="none"/>
    </svg>
    <div class="scene-grain"></div>
    <div class="scene-medium"><span></span></div>`;
  }

  function ridgeY(x) { // South Mountain: high in the west (left), falling east
    return 300 + x * 0.06 + Math.sin(x / 140) * 14 + Math.sin(x / 47) * 5;
  }

  /* ---------- per-year styling ---------- */
  const skies = [
    [1500, ["#f6d9a8", "#f3c48a", "#e8b07a"]],
    [1700, ["#f2dcae", "#efd09a", "#e2b886"]],
    [1800, ["#e9dcb8", "#efd8a8", "#e7c690"]],
    [1860, ["#d9d3bc", "#e8d6ae", "#e2c79a"]],
    [1920, ["#c9d6d2", "#e5dcbc", "#e6cfa2"]],
    [1950, ["#9fc7dc", "#d6e4e6", "#f0dcb4"]],
    [2000, ["#86bfe0", "#cfe6f0", "#f4e2bf"]],
    [2026, ["#7ab8e2", "#cde7f3", "#f6e4c0"]]
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (h1, h2, t) => "#" + hex(h1).map((v, i) => Math.round(lerp(v, hex(h2)[i], t)).toString(16).padStart(2, "0")).join("");
  function skyFor(y) {
    for (let i = 0; i < skies.length - 1; i++) {
      const [y0, c0] = skies[i], [y1, c1] = skies[i + 1];
      if (y <= y1) { const t = Math.max(0, (y - y0) / (y1 - y0)); return c0.map((c, k) => mix(c, c1[k], t)); }
    }
    return skies[skies.length - 1][1];
  }
  function mediumFor(y) {
    if (y < 1666) return ["Imagined", "Before written records"];
    if (y < 1839) return ["As if painted", "in the Hudson River School manner, like Asher Durand"];
    if (y < 1900) return ["As if photographed", "albumen print"];
    if (y < 1935) return ["As if on a postcard", "real-photo postcard"];
    if (y < 1975) return ["As if on Kodachrome", "color slide"];
    return ["Today-ish", "full color"];
  }
  function filterFor(y) {
    if (y < 1666) return "sepia(.25) saturate(1.1) contrast(.95) brightness(1.02)";
    if (y < 1839) return "sepia(.3) saturate(1.15) contrast(.95) brightness(1.03)";
    if (y < 1900) return `sepia(.85) saturate(.55) contrast(1.05) brightness(.97)`;
    if (y < 1935) return `sepia(${(.7 - (y - 1900) / 35 * .35).toFixed(2)}) saturate(${(.6 + (y - 1900) / 35 * .35).toFixed(2)}) contrast(1.04)`;
    if (y < 1975) return "sepia(.12) saturate(1.3) contrast(1.06) hue-rotate(-6deg)";
    return "none";
  }

  MW.SceneKit = { B, tree, V, T, item, label };

  MW.Scene = function (host) {
    host.classList.add("scene-host");
    host.innerHTML = build();
    const svg = host.querySelector("svg");
    const items = [...svg.querySelectorAll(".it")];
    const fades = [...svg.querySelectorAll(".it-fade")];
    const fields = svg.querySelector(".fields"), woods = svg.querySelector(".woods");
    const medium = host.querySelector(".scene-medium span"), grain = host.querySelector(".scene-grain");
    const [s0, s1, s2] = ["#sk0", "#sk1", "#sk2"].map(s => svg.querySelector(s));

    svg.addEventListener("click", e => {
      const g = e.target.closest("[data-place]"); if (!g || g.classList.contains("off")) return;
      const p = MW.places.find(p => p.id === g.dataset.place); if (!p) return;
      e.stopPropagation(); MW.popover(MW.placeCard(p), e.clientX, e.clientY);
    });
    svg.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest("[data-place]"); if (!g) return;
      const p = MW.places.find(p => p.id === g.dataset.place); const r = g.getBoundingClientRect();
      e.preventDefault(); MW.popover(MW.placeCard(p), r.left + r.width / 2, r.top + r.height / 2);
    });

    function setYear(y) {
      items.forEach(g => {
        const on = y >= +g.dataset.from && y <= +g.dataset.to;
        g.classList.toggle("off", !on);
        if (g.dataset.place) g.setAttribute("tabindex", on ? "0" : "-1");
        if (on && g.dataset.grow) { // trees grow over ~45 years
          const k = Math.max(.3, Math.min(1, (y - +g.dataset.grow) / 45 + .3));
          g.firstChild.style.transform = `scale(${k.toFixed(3)})`;
        } else if (g.dataset.grow) g.firstChild.style.transform = "";
      });
      fades.forEach(el => el.style.opacity = y >= +el.dataset.from ? 1 : 0);
      // farmland: rises 1680–1750, fades 1868–1930; woods: thin 1680–1790
      const farm = y < 1680 ? 0 : y < 1750 ? (y - 1680) / 70 : y < 1868 ? 1 : y < 1930 ? 1 - (y - 1868) / 62 : 0;
      const wood = y < 1680 ? 1 : y < 1790 ? 1 - (y - 1680) / 110 * .8 : y < 1900 ? .2 : Math.min(.75, .2 + (y - 1900) / 120);
      fields.style.opacity = farm.toFixed(2); woods.style.opacity = wood.toFixed(2);
      const [a, b, c] = skyFor(y); s0.setAttribute("stop-color", a); s1.setAttribute("stop-color", b); s2.setAttribute("stop-color", c);
      svg.style.filter = filterFor(y);
      grain.style.opacity = y >= 1839 && y < 1975 ? .5 : y < 1839 ? .18 : 0;
      const [m, sub] = mediumFor(y); medium.innerHTML = `<b>${m}</b> · ${sub}`;
      host.dataset.era = MW.eraFor(y).id;
    }
    return { setYear };
  };
})();
