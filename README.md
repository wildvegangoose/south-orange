# South Orange Through Time

An unofficial fan history site for **South Orange, New Jersey**, built from the same template as
[Maplewood Through Time](https://wildvegangoose.github.io/maplewood/).

**Status:** first full build. Pages: Time Machine, Explore the Map, Your House's Story, Landmarks (8), People (146),
Timeline, Research & Sources.

What is special about this site:

* **The town's name and boundary follow the year.** Before 1904 South Orange was part of Newark Township,
  Orange Township, Clinton Township and South Orange Township (which included today's Maplewood). The Explore map
  draws each era's outline, approximated from today's town lines (`tools/boundaries/build_eras.py` →
  `data/boundaries.js`), and pins that era's seat of government (`MW.seats` in `js/data.js`).
* **House stories only for today's Village.** Addresses outside it (for example in Maplewood) are pointed to the
  Maplewood site. Shared-township places outside the Village appear on the map only for 1861–1903.
* Editorial decisions are recorded in [docs/DECISIONS.md](docs/DECISIONS.md); the research behind every fact is in
  [docs/research](docs/research).

Not yet done: the city-directory pipeline with the "SO" town code, the SOPL real-estate file (no text layer; OCR and
permission needed), a Sanborn 1912/1949 overlay, and more landmark photos (Wikimedia rate-limits this container).

* How it's built: [docs/PLAYBOOK.md](docs/PLAYBOOK.md)
* Town settings for the data tools: [tools/town.json](tools/town.json)
