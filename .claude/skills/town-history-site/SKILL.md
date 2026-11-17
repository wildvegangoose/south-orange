---
name: town-history-site
description: Build or extend a "Through Time" local-history website for a town (Maplewood, South Orange, or another town). Use it to start a site for a new town, run the library-archive pipeline (city directories, real-estate cards, scrapbooks), build historic map overlays, write landmark pages, or cross-check notable residents against old directories.
---

# Town history site

This repository is a working example (Maplewood, NJ) and a template for other towns.

1. **Read `docs/PLAYBOOK.md` first.** It has the order of work, the sources, the tools, the decisions to confirm with the user, and the pitfalls we already hit.
2. **Town-specific settings for the data tools live in `tools/town.json`.** The front end still needs the edits listed in PLAYBOOK §1.
3. **Before publishing anything, confirm with the user:**
   - the name cutoff year (Maplewood used 1950),
   - whether they have the library's permission to show its scans,
   - which notable people to exclude.
4. **Cite every fact** (`MW.sources`, landmark `sources`). Label narrative synthesis and illustrations as such. Use only public-domain or Creative Commons photos, credited.
5. **Long jobs** (archive pipeline, map downloads): run them in the background and auto-commit and push regularly. Cloud sessions lose unpushed files when idle.
6. **Verify by rendering:** serve with `python3 -m http.server` and screenshot each page with Playwright before telling the user it works.
