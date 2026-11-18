---
name: town-history-site
description: Build or extend a "Through Time" local-history website for a town (Maplewood, South Orange, or another town). Use it to start a site for a new town, run the archive pipelines (city directories, real-estate cards, scrapbooks, Library of Congress newspapers, Sanborn maps and photos), build historic map overlays and year-by-year boundaries, write landmark pages, or cross-check notable residents against old directories.
---

# Town history site

This repository is a working example and a template for other towns. The two sites built so far are Maplewood, NJ
(`wildvegangoose/maplewood`) and South Orange, NJ (`wildvegangoose/south-orange`); they share the same code and tools.

1. **Read `docs/PLAYBOOK.md` first.** It has the order of work, the sources, the tools, the decisions to confirm with the user, and the pitfalls we already hit.
2. **Research before code** (PLAYBOOK §2): a cited report covering eras, places, neighborhoods, landmarks, people, archives, and the town's *jurisdiction history* (which townships it belonged to, the name in each period, where its government met).
3. **Town-specific settings live in `tools/town.json`** (data tools) and `MW.town` in `js/data.js` (front end). The front end still needs the edits listed in PLAYBOOK §1.
4. **Sources, in order of value per hour:** neighboring towns' city directories (the Oranges directories cover five towns), Library of Congress Sanborn maps (§4c), Library of Congress newspapers (§4b) and photos (§4d), USGS topo maps and state aerials (§5), National Register nominations for landmarks (§6).
5. **Licensing:** public domain or "no known restrictions" only; omit sources with stated reproduction restrictions; link (don't copy) sources with no stated license. Check every Library of Congress item's `rights_advisory`.
6. **Before publishing anything, confirm with the user:**
   - the name cutoff year (both sites use 1950; public news stories are the exception),
   - whether to show the library's scans,
   - which notable people to exclude (Maplewood excluded crime-notable figures; South Orange includes Gerardo Catena neutrally),
   - how shared history with neighboring towns is shown (South Orange: on the map by year, never in house search).
7. **Cite every fact** (`MW.sources`, landmark `sources`). Label narrative synthesis, approximate boundaries and illustrations as such.
8. **Long jobs** (directories, newspapers, map downloads): run them in the background, commit and push regularly (cloud sessions lose unpushed files), and keep half-finished data on a side branch, not the published one.
9. **Publishing:** ask before merging into the branch GitHub Pages serves; keep the site under 1 GB.
10. **Verify by rendering:** serve with `python3 -m http.server` and screenshot each page with Playwright before telling the user it works.
