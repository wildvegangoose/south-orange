/* ==========================================================================
   South Orange Through Time: the historical dataset.
   Every dated fact below comes from one of the sources in MW.sources, mostly via
   docs/research/South Orange NJ history.md. Where sources disagree, the text says so.
   Narrative passages ("what it was like") are our own synthesis of those facts.
   ========================================================================== */
var MW = window.MW = window.MW || {};

MW.town = {
  name: "South Orange", state: "NJ", siteTitle: "South Orange Through Time",
  tagline: "A fan history of South Orange, NJ",
  siteUrl: "https://wildvegangoose.github.io/south-orange/",
  center: [40.7490, -74.2590], geocodeSuffix: ", South Orange, NJ", todayLabel: "today's Village",
  neighbor: { name: "Maplewood", url: "https://wildvegangoose.github.io/maplewood/" }
};

const NR_MONTROSE = "https://npgallery.nps.gov/GetAsset/2b0c9ff9-6014-40a7-b3b7-c1ab7eede3dd";
MW.sources = {
  wiki:      { label: "Wikipedia: South Orange, New Jersey", url: "https://en.wikipedia.org/wiki/South_Orange,_New_Jersey" },
  soHist:    { label: "Village of South Orange: History", url: "https://southorange.org/342/History" },
  soplTime:  { label: "South Orange Public Library: Historical Timeline", url: "https://localhistory.sopl.org/wiki/Historical_Timeline" },
  schnell:   { label: "Harry Schnell, The Village of South Orange: A Brief History (SOPL)", url: "https://localhistory.sopl.org/wiki/The_Village_of_South_Orange:_A_Brief_History_by_Harry_Schnell" },
  soplVH:    { label: "South Orange Public Library: Village Hall History", url: "https://localhistory.sopl.org/wiki/Village_Hall_History" },
  soplBaird: { label: "South Orange Public Library: Baird Community Center", url: "https://localhistory.sopl.org/wiki/Baird_Community_Center" },
  soplRock:  { label: "South Orange Public Library: Memorial Rock", url: "https://localhistory.sopl.org/wiki/Memorial_Rock" },
  soplPark:  { label: "South Orange Public Library: Memorial Park", url: "https://localhistory.sopl.org/wiki/Memorial_Park" },
  soplPO:    { label: "South Orange Public Library: South Orange Post Office", url: "https://localhistory.sopl.org/wiki/South_Orange_Post_Office" },
  soplHouse: { label: "South Orange Public Library: Researching Your Historic House", url: "https://localhistory.sopl.org/wiki/Researching_Your_Historic_House" },
  soplTau:   { label: "South Orange Public Library: Tau", url: "https://localhistory.sopl.org/wiki/Tau" },
  soplConnett:{ label: "South Orange Public Library: Connett", url: "https://localhistory.sopl.org/wiki/Connett" },
  shaw:      { label: "Shaw, History of Essex and Hudson Counties (1884), vol. 2", url: "https://archive.org/details/historyofessexh02shaw" },
  whittemore:{ label: "Whittemore, The Founders and Builders of the Oranges (1896)", url: "https://archive.org/stream/foundersbuilders00whit/foundersbuilders00whit_djvu.txt" },
  hoyt:      { label: "Hoyt, The Mountain Society (1860)", url: "https://archive.org/details/themountainsociet00hoyt" },
  orangeRec: { label: "Records of the Town of Orange: first town meeting, April 13, 1807", url: "https://archive.org/details/earlyrecordsofto00oran" },
  nrMontrose:{ label: "National Register nomination: Montrose Park Historic District", url: NR_MONTROSE },
  nrStone:   { label: "National Register nomination: Stone House by the Stone House Brook", url: "https://npgallery.nps.gov/GetAsset/d73c09bc-36a7-496d-9bdb-84704a0a48c3" },
  nrFire:    { label: "National Register nomination: South Orange Fire Department", url: "https://npgallery.nps.gov/GetAsset/1c0a8af1-a768-4ade-9632-e0c9fdb7606b" },
  nrVH:      { label: "National Register nomination: South Orange Village Hall", url: "https://npgallery.nps.gov/GetAsset/7b7019c2-f7e2-43db-aec9-ce246907eaca" },
  nrKelly:   { label: "National Register nomination: Eugene V. Kelly Carriage House", url: "https://npgallery.nps.gov/GetAsset/6b724602-5940-4970-807f-05c2e049c9a5" },
  station:   { label: "Wikipedia: South Orange station", url: "https://en.wikipedia.org/wiki/South_Orange_station" },
  mtnStation:{ label: "Wikipedia: Mountain Station", url: "https://en.wikipedia.org/wiki/Mountain_Station" },
  seton:     { label: "Wikipedia: Seton Hall University", url: "https://en.wikipedia.org/wiki/Seton_Hall_University" },
  pirates:   { label: "Wikipedia: Seton Hall Pirates men's basketball", url: "https://en.wikipedia.org/wiki/Seton_Hall_Pirates_men%27s_basketball" },
  walshGym:  { label: "Wikipedia: Walsh Gymnasium", url: "https://en.wikipedia.org/wiki/Walsh_Gymnasium" },
  boland:    { label: "Wikipedia: Boland Hall fire", url: "https://en.wikipedia.org/wiki/Boland_Hall_fire" },
  oltc:      { label: "Wikipedia: Orange Lawn Tennis Club", url: "https://en.wikipedia.org/wiki/Orange_Lawn_Tennis_Club" },
  stoneWiki: { label: "Wikipedia: Stone House by the Stone House Brook", url: "https://en.wikipedia.org/wiki/Stone_House_by_the_Stone_House_Brook" },
  mpWiki:    { label: "Wikipedia: Montrose Park Historic District", url: "https://en.wikipedia.org/wiki/Montrose_Park_Historic_District" },
  masterPlan:{ label: "South Orange Master Plan (2021)", url: "https://www.southorange.org/DocumentCenter/View/6166/South-Orange-Master-Plan---Adopted-Nov-2021" },
  hpcTime:   { label: "South Orange Historic Preservation Commission: Timeline", url: "https://southorange.org/DocumentCenter/View/17290/HPC_South-Orange-Timeline" },
  ordinance: { label: "South Orange historic preservation ordinance (2016), Schedule A", url: "https://villagegreennj.com/wp-content/uploads/2024/02/2016-09-Ordinance-Establishing-a-Historic-Preservation-Commission-February-19-2016.pdf" },
  sohps:     { label: "South Orange Historical & Preservation Society: Old Stone House", url: "https://sohps.org/old-stone-house/" },
  dhSep:     { label: "Durand-Hedden: The Separation of Maplewood and South Orange", url: "https://www.durandhedden.org/post/the-separation-of-maplewood-and-south-orange" },
  dhLenape:  { label: "Durand-Hedden: The Lenape who came before us", url: "https://www.durandhedden.org/post/the-lenape-who-came-before-use" },
  dhRoads:   { label: "Durand-Hedden: History of Durand-Hedden (early roads)", url: "https://www.durandhedden.org/history-of-durand-hedden" },
  mwWiki:    { label: "Wikipedia: Maplewood, New Jersey (township dates)", url: "https://en.wikipedia.org/wiki/Maplewood,_New_Jersey" },
  clinton:   { label: "Wikipedia: Clinton Township, Essex County", url: "https://en.wikipedia.org/wiki/Clinton_Township,_Essex_County,_New_Jersey" },
  munsell:   { label: "Munsell, History of Morris County: turnpikes", url: "https://www.usgenwebsites.org/NJMorris/history/munsellhistory/h-chpt11.htm" },
  patchRev:  { label: "Patch: The American Revolution came to South Orange", url: "https://patch.com/new-jersey/southorange/american-revolution-came-to-south-orange" },
  patchTux:  { label: "Patch: Tuxedo Park marks a century", url: "https://patch.com/new-jersey/southorange/tuxedo-park-marks-a-century" },
  vanderbilt:{ label: "Nelson, Vanderbilt thesis (2014): integration in South Orange and Maplewood", url: "https://ir.vanderbilt.edu/handle/1803/13031" },
  ccr:       { label: "Wikipedia: Community Coalition on Race", url: "https://en.wikipedia.org/wiki/South_Orange/Maplewood_Community_Coalition_on_Race" },
  somsd:     { label: "Wikipedia: South Orange-Maplewood School District", url: "https://en.wikipedia.org/wiki/South_Orange-Maplewood_School_District" },
  njfuture:  { label: "New Jersey Future: Smart Growth Award, Gaslight Commons", url: "https://www.njfuture.org/?p=7492" },
  sopacNyt:  { label: "New York Times (2006): SOPAC opens", url: "https://www.nytimes.com/2006/12/31/nyregion/nyregionspecial2/31njarts.html" },
  placenj:   { label: "Place NJ: Third & Valley opens (2016)", url: "https://www.placenj.com/2016/07/photos-third-valley-development-opens.html?m=1" },
  mainst:    { label: "National Association of Realtors: South Orange village center", url: "https://www.nar.realtor/news/spaces-to-places/south-orange-village-center-commitment-to-vision-pays-off-with-a-successful-sense-of-place" },
  tsti:      { label: "Temple Sharey Tefilo-Israel: our history", url: "https://tsti.org/about/tsti-history/" },
  smr:       { label: "Wikipedia: South Mountain Reservation", url: "https://en.wikipedia.org/wiki/South_Mountain_Reservation" },
  newark:    { label: "Wikipedia: Old First Presbyterian Church, Newark (town meeting house)", url: "https://en.wikipedia.org/wiki/Old_First_Presbyterian_Church_(Newark,_New_Jersey)" },
  irvington: { label: "Irvington: History of Irvington (Camptown)", url: "https://irvington.net/township/history/" },
  directories:{ label: "Oranges city directories, 1908–1950 (Maplewood Memorial Library digital archive)", url: "https://www.digifind-it.com/maplewood/views/view.php?id=1" },
  locNews:   { label: "Library of Congress: Chronicling America historic newspapers (public domain)", url: "https://www.loc.gov/collections/chronicling-america/" },
  sanborn1912:{ label: "Sanborn Fire Insurance Map, South Orange Village, 1912 (Library of Congress, public domain)", url: "https://www.loc.gov/item/sanborn05629_001/" },
  sanborn1949:{ label: "Sanborn Fire Insurance Map, South Orange Village, 1912–1949 (Library of Congress, public domain)", url: "https://www.loc.gov/item/sanborn05629_002/" },
  gottscho:  { label: "Gottscho-Schleisner Collection, Library of Congress (no known restrictions on publication)", url: "https://www.loc.gov/pictures/collection/gsc/" },
  tiger:     { label: "U.S. Census TIGER municipal boundaries (outlines for older eras are approximations)", url: "https://tigerweb.geo.census.gov/" }
};

/* Census counts for the Village (Wikipedia, U.S. Census). No 1870 Village count exists. */
MW.census = [
  [1880, 2178], [1890, 3106], [1900, 4608], [1910, 6014], [1920, 7274], [1930, 13630],
  [1940, 13742], [1950, 15230], [1960, 16175], [1970, 16971], [1980, 15864], [1990, 16390],
  [2000, 16964], [2010, 16198], [2020, 18484], [2024, 18736]
];
MW.populationFor = function (year) {
  const c = MW.census;
  if (year < 1666) return { approx: true, label: "Lenape homeland" };
  if (year < 1806) return { approx: true, label: "a few farm families" };
  if (year < 1860) return { approx: true, label: year < 1837 ? "about 30 dwellings (1834)" : "a railroad hamlet & summer resort" };
  if (year < 1880) return { approx: true, label: "about 1,200 people (1869)" };
  if (year >= c[c.length - 1][0]) return { value: c[c.length - 1][1] };
  for (let i = 0; i < c.length - 1; i++) {
    const [y0, p0] = c[i], [y1, p1] = c[i + 1];
    if (year >= y0 && year <= y1) return { value: Math.round(p0 + (p1 - p0) * (year - y0) / (y1 - y0)) };
  }
  return { value: c[0][1] };
};

/* --------------------------------------------------------------------------
   What the place was called. The site shows the name in use at the time,
   so it changes as the slider moves (decision of Nov 18, 2026, docs/DECISIONS.md).
   -------------------------------------------------------------------------- */
MW.names = [
  { from: 1500, to: 1665, name: "Lenapehoking", sub: "the Lenape homeland" },
  { from: 1666, to: 1792, name: "Newark Mountains", sub: "the \"Chestnut Hill\" farms of Newark Township" },
  { from: 1793, to: 1806, name: "South Orange", sub: "a name for a corner of Newark Township (first in print 1793–1800)" },
  { from: 1807, to: 1834, name: "South Orange, Orange Township", sub: "the southern hamlet of Orange Township" },
  { from: 1835, to: 1860, name: "South Orange", sub: "a hamlet split between Orange Township and Clinton Township" },
  { from: 1861, to: 1868, name: "South Orange Township", sub: "today's South Orange and Maplewood, together" },
  { from: 1869, to: 1903, name: "Village of South Orange", sub: "a village inside South Orange Township" },
  { from: 1904, to: 1977, name: "Village of South Orange", sub: "independent since March 4, 1904" },
  { from: 1978, to: 2023, name: "Township of South Orange Village", sub: "the tax-law \"township\" name, adopted 1977, effective 1978" },
  { from: 2024, to: 2100, name: "South Orange Village", sub: "\"Township\" dropped from the name in April 2024" }
];
MW.nameFor = y => MW.names.find(n => y >= n.from && y <= n.to) || MW.names[MW.names.length - 1];

/* Seats of local government: where the town's business was done in each era.
   Pins outside today's Village appear only while that jurisdiction existed. */
MW.seats = [
  { id: "seat-newark", from: 1666, to: 1806, title: "Newark town meeting", place: "Newark's meeting house on Broad Street, about 6 miles east",
    lat: 40.7357, lon: -74.1714, offmap: true,
    text: "For its first 140 years this corner of the mountain was governed by Newark's town meeting. Newark voted the 1680 land grants \"near the Stone House\" and laid out today's South Orange Avenue and Ridgewood Road as roads in 1705.",
    sources: ["shaw", "newark"] },
  { id: "seat-orange", from: 1807, to: 1860, title: "Orange Township meeting house", place: "Orange meeting house (First Presbyterian Church), Main Street, Orange",
    lat: 40.7737, lon: -74.2341,
    text: "Orange Township was set off from Newark in 1806. Its first annual town meeting was held at the Orange meeting house on April 13, 1807. Later meetings sometimes moved to hotels. South Orange's farms sent their votes here until 1861.",
    sources: ["orangeRec", "hoyt"] },
  { id: "seat-clinton", from: 1834, to: 1860, title: "Clinton Township (Camptown)", place: "Camptown, renamed Irvington in 1852",
    lat: 40.7247, lon: -74.2316,
    text: "Clinton Township was created in 1834 from parts of Orange, Newark, Elizabeth and Union townships. Part of today's South Orange fell inside it until 1861. Later records call Irvington (old Camptown) the township's seat; where its first meetings were held is not documented in our sources.",
    sources: ["clinton", "irvington"] },
  { id: "seat-township", from: 1861, to: 1903, title: "South Orange Township committee", place: "meeting place not documented",
    lat: null, lon: null,
    text: "South Orange Township's committee first met on April 13, 1861. We have not found where it held its meetings. The township covered today's South Orange and Maplewood (and Vailsburg until 1894), so its business was shared until the Village left in 1904.",
    sources: ["mwWiki", "dhSep"] },
  { id: "seat-rented", from: 1869, to: 1894, title: "Village trustees' rented rooms", place: "Smith & Lum building, then the Becker Building (6–8 South Orange Avenue)",
    lat: 40.74643, lon: -74.26049,
    text: "For their first 25 years the Village trustees met in rented rooms: first upstairs in the Smith & Lum building, which they shared with the library, then in the Becker Building at 6 and 8 South Orange Avenue. The village clerk kept the records at his house.",
    sources: ["soplVH"] },
  { id: "seat-villagehall", from: 1895, to: 2013, title: "Village Hall", place: "101 South Orange Avenue at Scotland Road",
    lat: 40.74611, lon: -74.25833,
    text: "Village Hall opened at the trustees' meeting of March 18, 1895, with the fire department downstairs until 1930. It served as the seat of government until the offices moved out in October 2013.",
    sources: ["soplVH", "nrVH"] },
  { id: "seat-76soa", from: 2013, to: 2100, title: "Village offices", place: "76 South Orange Avenue",
    lat: 40.74518, lon: -74.25763,
    text: "Village offices moved to 76 South Orange Avenue in October 2013. Village Hall was sold in 2016 and reopened as a restaurant in 2022.",
    sources: ["soHist"] }
];
MW.seatsFor = y => MW.seats.filter(s => y >= s.from && y <= s.to);

/* Approximate jurisdiction outlines (data/boundaries.js, built by tools/boundaries/build_eras.py) */
MW.jurisdictionsFor = y => (window.MW_JURISDICTIONS || []).filter(j => y >= j.from && y <= j.to);

/* --------------------------------------------------------------------------
   Eras: what it was like. Narrative is our synthesis of the sourced facts.
   -------------------------------------------------------------------------- */
MW.eras = [
  {
    id: "lenape", from: 1500, to: 1665, name: "Lenapehoking",
    tagline: "A trail through the chestnut woods",
    palette: ["#f3d9a4", "#c98b5b"],
    story: [
      "Before Europeans arrived, this slope below the first Watchung ridge was part of Lenapehoking, the Lenape homeland. Durand-Hedden calls the Lenape \"the earliest residents of the Maplewood-South Orange area.\"",
      "Tradition says South Orange Avenue began as an Indian trail running down toward Newark Bay, and early Newark roads were laid out \"often along old Indian trails.\" The only Native-named path in the local records is the \"Minneesink path,\" mentioned in 1705.",
      "No archaeological report places a Lenape site inside today's Village, so this era is told through the land itself: the East Branch of the Rahway River, the Stone House Brook and the mountain above them."
    ],
    sources: ["dhLenape", "soHist", "dhRoads", "shaw"]
  },
  {
    id: "chestnut", from: 1666, to: 1739, name: "Chestnut Hill on the Newark Mountain",
    tagline: "A stone house before there was a town",
    palette: ["#f1e3bd", "#9c7a4a"],
    story: [
      "Puritan settlers founded Newark in 1666 and bought land reaching to the mountains. On September 27, 1680 the town granted Nathaniel Wheeler and Edward and Joseph Riggs land \"upon the upper Chesnut hill by Raway River, near the Stone House.\" That stone house is the first building recorded here.",
      "Joseph and Thomas Brown cleared a farm by the Stone House Brook. Wikipedia dates it to 1677, and Joseph's 1686 survey notes \"a House on it, built by Joseph Brown and Thomas Brown.\" On October 8, 1705 Newark laid out two roads: one to Joseph Riggs's house (today's Ridgewood Road) and one \"from said Riggs to town… by a path\" (today's South Orange Avenue).",
      "Most of this era's mills were in what is now Maplewood. The only one placed in South Orange is a remembered sawmill \"near the Montrose station.\""
    ],
    sources: ["shaw", "wiki"]
  },
  {
    id: "stone", from: 1740, to: 1805, name: "Stone Houses and Revolution",
    tagline: "Pierson's stone addition and a name in an advertisement",
    palette: ["#efe0c2", "#8a6a3e"],
    story: [
      "By the 1740s the neighborhood's account books list the Ball, Crowell, Pierson, Smith, Hedden, Condit, Brown, Williams, Harrison and Freeman households. Bethuel Pierson added a stone wing to his house by the Stone House Brook. The National Register dates it to 1773–91, and it still stands as the Old Stone House.",
      "Three more stone houses carry the date 1774, including Daniel and Sarah Riggs's house at today's South Orange Avenue and Ridgewood Road. A stone schoolhouse stood on the \"school-house common\" by 1787.",
      "The Revolution survives here mainly as legend: a \"Battle of Chestnut Hill\" after the Battle of Springfield in 1780, and Washington marching down South Orange Avenue. Neither has a contemporary record. The name \"South Orange\" first appears in print between 1793 and 1800; sources disagree on the earliest instance."
    ],
    sources: ["shaw", "nrStone", "patchRev", "soHist", "wiki"]
  },
  {
    id: "turnpike", from: 1806, to: 1836, name: "The Turnpike Village",
    tagline: "School, church and thirty dwellings",
    palette: ["#ecdcb7", "#7b5f39"],
    story: [
      "In 1806 Orange Township was set off from Newark, and South Orange became its southern hamlet. The Newark and Morris Turnpike, chartered in 1811, ran through South Orange along today's South Orange Avenue. Its builders found the stone school \"standing in the way.\"",
      "In 1814 about 75 families incorporated the Columbian School of South Orange. Its two-story wooden schoolhouse on the common was finished in 1815. In 1818 the trustees waived firewood fees for poor children, \"the first step toward making common-school education free to all.\"",
      "The First Presbyterian Church of South Orange was constituted on June 13, 1831. Gordon's 1834 Gazetteer counted \"about 30 dwellings, a tavern and store; a paper mill and Presbyterian church.\" In 1834 the new Clinton Township took in part of the area."
    ],
    sources: ["shaw", "munsell", "hoyt", "nrMontrose", "clinton"]
  },
  {
    id: "resort", from: 1837, to: 1860, name: "Railroad and Water Cure",
    tagline: "Summer boarders, a seminary and the first estates",
    palette: ["#e8dcc0", "#5a4c40"],
    story: [
      "The Morris & Essex Railroad reached South Orange in September 1837. It made the hamlet \"a suburb of Newark and a summer resort.\" Pattern-book cottages went up on Academy Heights, and the first post office opened in Freeman's store in 1841.",
      "The Mountain House water cure on Ridgewood Road could hold 150 guests; an 1853 report from its \"Orange Mountain Hydropathic Institution\" survives. In 1850 merchant William Redmond bought the Squier farm and built his brownstone \"Hillside.\"",
      "In April 1860 Bishop James Roosevelt Bayley bought about 60 acres from the Elphinstone family and moved Seton Hall here from Madison. Gas street lamps replaced whale-oil lamps in the center the same year."
    ],
    sources: ["station", "soHist", "nrMontrose", "whittemore", "seton", "soplTime"]
  },
  {
    id: "village", from: 1861, to: 1890, name: "Township and Village",
    tagline: "Gaslight, Montrose and the 1869 charter",
    palette: ["#e3d6b8", "#4f3b4a"],
    story: [
      "In 1861 South Orange Township was formed, taking in today's South Orange and Maplewood. Those who had \"made extensive improvements\" wanted to manage their own affairs, so in 1869 the Village of South Orange was chartered inside the township. L. L. Coudert was its first president.",
      "John Gorham Vose and Henry A. Page laid out Montrose between 1867 and 1874 \"to attract wealthy New York businessmen.\" Horse cars ran from Newark from 1865, telephones arrived at the stations in 1879, and the Orange Lawn Tennis Club was organized in 1880.",
      "In 1889 residents formed the Meadow Land Society to keep industry out of the valley, buying the land that became Meadowland Park. The South Orange Field Club followed. The Mountain House burned on August 23, 1890."
    ],
    sources: ["mwWiki", "whittemore", "nrMontrose", "wiki"]
  },
  {
    id: "montrose", from: 1891, to: 1903, name: "Montrose Park and the Civic Center",
    tagline: "Village Hall, a library and a fire company",
    palette: ["#e0d2b0", "#3f4a3a"],
    story: [
      "In February 1891 the volunteer fire department organized, and the Village annexed the land east of Centre Street. Thomas S. Kingman's syndicate laid out Montrose Park there, with lots of at least 100 by 200 feet. By 1896 about forty large houses stood on its streets.",
      "Village Hall, designed by Rossiter & Wright, opened on March 18, 1895 with the firehouse inside. The Connett library opened on May 8, 1896 on land given by Eugene V. Connett.",
      "The Village was still part of South Orange Township and \"had no control over the township tax assessor's\" valuations. That ended on March 4, 1904."
    ],
    sources: ["nrFire", "nrMontrose", "whittemore", "soplVH", "dhSep"]
  },
  {
    id: "boom", from: 1904, to: 1929, name: "The Independent Village",
    tagline: "Elevated tracks and a doubling of population",
    palette: ["#e6dcc4", "#8e2914"],
    story: [
      "Independent from 1904, the Village bought Grove Park in 1908 and dug its own wells in 1912. Tuxedo Park's first houses went up in 1911. The railroad was raised above the streets in 1914–16, and the present South Orange station opened on February 1, 1916.",
      "Between 1920 and 1930 the population nearly doubled, from 7,274 to 13,630. Seton Hall sold its dairy farm for new courts of houses, and Guilbert & Betelle designed new schools, from Marshall (1922) to South Mountain (1929). A Norman-style fire headquarters went up in 1925–26.",
      "In October 1929 Babe Ruth and Lou Gehrig played an exhibition at Cameron Field. In 1922 the township the Village had left renamed itself Maplewood."
    ],
    sources: ["nrMontrose", "patchTux", "soplTime", "station", "wiki", "nrFire", "dhSep"]
  },
  {
    id: "suburb", from: 1930, to: 1962, name: "Electric Trains and the Mountain Suburb",
    tagline: "Depression, war and Seton Hall's growth",
    palette: ["#dfe3d0", "#2f4f5a"],
    story: [
      "In September 1930 \"a frail Thomas Edison\" ran the first electric train between Hoboken and South Orange. The police moved into Village Hall when the firemen left for their new headquarters, and the Field Club clubhouse became the Baird Center.",
      "The Memorial Rock by the Duck Pond lists 70 South Orange dead: 59 in World War II, 6 in Korea and 5 in Vietnam. After the war new congregations arrived: Temple Beth-El (1946), Temple Israel in the Kip-Riker mansion (1948–49) and Oheb Shalom (1958).",
      "Seton Hall became a university in 1950 and won the NIT in 1953. Postwar ranch houses filled Newstead, the high ground west of Wyoming Avenue."
    ],
    sources: ["wiki", "soplVH", "soplBaird", "soplRock", "tsti", "seton", "pirates", "masterPlan"]
  },
  {
    id: "integration", from: 1963, to: 1995, name: "Integration and Preservation",
    tagline: "Fair housing, a paper \"Township\" and the registers",
    palette: ["#e2e6d6", "#3b3b4a"],
    story: [
      "From 1963 Black and white residents worked together to make South Orange a deliberately integrated community, countering panic selling. By 2000 the Village was about 30 percent Black.",
      "A new public library was dedicated in 1968 and Seton Hall became fully coeducational. Population peaked at 16,971 in 1970. For tax reasons the Village took the name \"Township of South Orange Village\" in 1977–78.",
      "Preservation took root. Village Hall, the two stations and the Old Stone House were placed on the National Register between 1976 and 1991. Main Street South Orange was founded in 1991 to revive a struggling downtown."
    ],
    sources: ["vanderbilt", "wiki", "seton", "mainst"]
  },
  {
    id: "today", from: 1996, to: 2026, name: "Transit Village",
    tagline: "Midtown Direct, SOPAC and apartments by the station",
    palette: ["#e2eedb", "#2d4a32"],
    story: [
      "Midtown Direct trains began on June 10, 1996, cutting the commute to Manhattan and pushing up house prices. The same year South Orange and Maplewood created what became the Community Coalition on Race.",
      "On January 19, 2000 an arson fire in Seton Hall's Boland Hall killed three students. Downtown was rebuilt around the station: Gaslight Commons (c. 2002), the South Orange Performing Arts Center (2006), Third & Valley (2016) and Vose + Taylor.",
      "The Historic Preservation Commission was established in 2012. Village Hall became a restaurant in 2022, and in 2024 the Village dropped \"Township\" from its name."
    ],
    sources: ["hpcTime", "ccr", "boland", "njfuture", "sopacNyt", "placenj", "soHist"]
  }
];
MW.eraFor = y => MW.eras.find(e => y >= e.from && y <= e.to) || MW.eras[MW.eras.length - 1];

/* --------------------------------------------------------------------------
   Places & events. Coordinates: NRHP infobox, OpenStreetMap geocode of the
   modern address, or a street-level point (noted as approx).
   kind: house | civic | transport | nature | culture | event | commerce
   scope: "township" = outside today's Village; shown only 1861–1903 and
   never used in house stories.
   -------------------------------------------------------------------------- */
MW.places = [
  { id: "trail", year: 1500, title: "The Path to Newark Bay", kind: "nature", address: "South Orange Avenue",
    lat: 40.7469, lon: -74.2617,
    text: "Tradition calls South Orange Avenue an Indian trail that \"served as the main thoroughfare.\" Newark surveyed it in 1705 as a road \"from said Riggs to town… by a path as straight as may be.\" No archaeological site has been found in the Village.",
    sources: ["soHist", "dhRoads", "shaw"] },
  { id: "brown", year: 1677, title: "Brown Brothers' Farm (site)", kind: "house", address: "Tillou Road & Ridgewood Road",
    lat: 40.75026, lon: -74.26562,
    text: "Joseph and Thomas Brown cleared a farm here; Wikipedia dates it to 1677. A 1686 survey notes \"a House on it, built by Joseph Brown and Thomas Brown.\" In 1884 the land was still in the family, owned by A. F. Tillou. Some argue this, not the Old Stone House, was the 1680 \"Stone House.\" The house is gone.",
    sources: ["shaw", "wiki"] },
  { id: "stonehouse", year: 1680, title: "Old Stone House", kind: "house", address: "201 South Orange Avenue (Block 1007 Lot 13)",
    lat: 40.74500, lon: -74.25361, landmark: true,
    text: "First mentioned in Newark's grant of September 27, 1680, land \"near the Stone House.\" Its standing stone wing is Bethuel Pierson's work of 1773–91, the only pre-1800 building left in the Village. Owners included the Lindsleys, John Gorham Vose and William A. Brewer Jr., who called it \"Aldworth\"; the Village bought it in 1953. On the National Register since 1991.",
    sources: ["nrStone", "stoneWiki", "sohps"] },
  { id: "riggs", year: 1705, title: "Riggs Homestead (site)", kind: "house", address: "South Orange Avenue & Ridgewood Road (NW corner)",
    lat: 40.74725, lon: -74.26345,
    text: "Joseph Riggs's house stood at the junction of Newark's two 1705 roads. Daniel and Sarah Riggs rebuilt it in stone with a \"D. S. R. 1774\" datestone. The Church of the Holy Communion later received the lot \"on the site of the old Riggs homestead.\"",
    sources: ["shaw", "whittemore"] },
  { id: "squier", year: 1774, title: "Squier House", kind: "house", address: "167 North Ridgewood Road",
    lat: 40.75133, lon: -74.26122,
    text: "Henry Squier's c. 1774 house had a brownstone first story. William Redmond bought the farm in 1850 and leased the house to dairyman Flood, who gave his name to Flood's Hill. It was largely rebuilt around 2021; only its two oldest rooms were kept.",
    sources: ["hpcTime", "masterPlan"] },
  { id: "common", year: 1787, title: "Stone School on the Common", kind: "civic", address: "South Orange Avenue at Irvington Avenue (approx.)",
    lat: 40.7457, lon: -74.2582,
    text: "The village's first public building: a 20-by-30-foot stone schoolhouse with an open belfry on the \"school-house common,\" where the roads to Newark met. Its earliest record is an account entry of June 20, 1787. The turnpike builders later found it \"standing in the way.\"",
    sources: ["shaw"] },
  { id: "baldwin", year: 1806, title: "\"House with the White Chimneys\"", kind: "house", address: "311 Centre Street",
    lat: 40.74636, lon: -74.24236,
    text: "The Bishop (Benjamin) Baldwin house. Its date is disputed: c. 1806 in the National Register nomination, c. 1760 in the Master Plan and 1804 elsewhere. It sits on land that joined the Village with Montrose Park in 1891.",
    sources: ["nrMontrose", "masterPlan"] },
  { id: "turnpike", year: 1811, title: "Newark and Morris Turnpike", kind: "transport", address: "South Orange Avenue",
    lat: 40.7473, lon: -74.2650,
    text: "Chartered on February 11, 1811 to run \"through South Orange to Bottle Hill (Madison) or to Morristown.\" The 1860 map still calls the avenue the \"Newark Turnpike.\"",
    sources: ["munsell", "nrMontrose"] },
  { id: "columbian", year: 1814, title: "Columbian School", kind: "civic", address: "South Orange Avenue at Irvington Avenue (approx.)",
    lat: 40.7459, lon: -74.2578,
    text: "About 75 families named their school the \"Columbian School of South Orange\" on August 3, 1814. A two-story wooden schoolhouse was finished on the common in 1815, and its upper floor hosted singing schools and shows. In 1818 the trustees waived firewood fees for poor children. A brick school replaced it in 1880.",
    sources: ["shaw", "soplTime"] },
  { id: "firstpres", year: 1831, title: "First Presbyterian Church", kind: "culture", address: "111 Irvington Avenue",
    lat: 40.74509, lon: -74.25650,
    text: "Constituted June 13, 1831 with 29 members from the Orange church, meeting first in the schoolroom. Its first frame church went up between 1841 and 1843 (sources differ), and the present brownstone church was built in 1880. It merged with Trinity in 1935.",
    sources: ["hoyt", "whittemore", "soplTime"] },
  { id: "railroad", year: 1837, title: "The Railroad Arrives", kind: "transport", address: "South Orange station",
    lat: 40.74583, lon: -74.26083,
    text: "The Morris & Essex Railroad reached South Orange in September 1837, with regular service from September 28 (some local sources say 1836 or October 2, 1837). It made the hamlet \"a suburb of Newark and a summer resort.\"",
    sources: ["station", "soHist", "whittemore"] },
  { id: "cottages", year: 1838, title: "Academy Heights Cottages", kind: "house", address: "Second Street between Valley & Prospect",
    lat: 40.7444, lon: -74.2609,
    text: "Pattern-book cottages from the late 1830s and 1840s, the first railroad houses near the station. Luther Milligan added larger houses on Milligan Place and Second Street in 1871.",
    sources: ["masterPlan"] },
  { id: "post1841", year: 1841, title: "First Post Office", kind: "commerce", address: "71 South Orange Avenue",
    lat: 40.74687, lon: -74.26129,
    text: "South Orange's first post office opened in 1841 in Freeman's store.",
    sources: ["soHist"] },
  { id: "mountainhouse", year: 1847, end: 1890, title: "Mountain House Water Cure (site)", kind: "commerce", address: "Ridgewood Road near Glenside Road (approx.)",
    lat: 40.75654, lon: -74.26092,
    text: "A hydropathic resort on the west side of Ridgewood Road that held 150 guests. In 1850 it was owned by \"Mr. Lord of Lord and Taylor's.\" An 1853 report from the \"Orange Mountain Hydropathic Institution, South Orange\" survives. Its opening date is given as c. 1830 or 1847, and its exact site may now be in West Orange. It burned on August 23, 1890.",
    sources: ["nrMontrose", "soHist", "nrFire"] },
  { id: "hillside", year: 1850, title: "\"Hillside\" (Orange Lawn Tennis Club)", kind: "house", address: "305 North Ridgewood Road",
    lat: 40.75447, lon: -74.26302,
    text: "Merchant William Redmond bought the Squier farm in 1850 and built a brownstone mansion \"extending to the top of the mountain.\" (The HPC timeline dates it to 1830.) Since 1917 it has been the clubhouse of the Orange Lawn Tennis Club.",
    sources: ["whittemore", "hpcTime", "oltc"] },
  { id: "gothic44", year: 1850, title: "Gothic Revival House", kind: "house", address: "44 South Ridgewood Road",
    lat: 40.74644, lon: -74.26433,
    text: "A c. 1850 early-Victorian Gothic house, the anchor of the potentially eligible South Ridgewood Road historic district.",
    sources: ["masterPlan"] },
  { id: "holycomm", year: 1859, title: "Church of the Holy Communion", kind: "culture", address: "160 South Orange Avenue",
    lat: 40.74713, lon: -74.26328,
    text: "The Episcopal parish was \"regularly organized\" on October 8, 1859. In 1865 it received Thomas Loundes's lot \"on the site of the old Riggs homestead.\" Today it is St. Andrew & Holy Communion.",
    sources: ["whittemore"] },
  { id: "setonhall", year: 1860, title: "Seton Hall Comes to South Orange", kind: "culture", address: "400 South Orange Avenue",
    lat: 40.7417, lon: -74.2450, landmark: true,
    text: "Founded in Madison in 1856, Seton Hall moved here in 1860 when Bishop Bayley bought about 60 acres on both sides of South Orange Avenue from the Elphinstone family, with \"a marble villa, farmhouse, and stables.\" The first college building opened that September.",
    sources: ["nrMontrose", "seton", "soplTime"] },
  { id: "township", year: 1861, title: "South Orange Township Formed", kind: "event", address: "Township-wide",
    lat: 40.7488, lon: -74.2615,
    text: "In 1861 South Orange Township was created from parts of Clinton Township and Orange. It covered today's South Orange and Maplewood, plus Vailsburg until 1894. Its committee first met on April 13, 1861.",
    sources: ["mwWiki", "dhSep"] },
  { id: "mwstation", year: 1861, end: 1903, scope: "township", title: "Maplewood Station (the township's other stop)", kind: "transport", address: "Maplewood, near Baker Street",
    lat: 40.7311, lon: -74.2754,
    text: "While the Village was part of South Orange Township, the township's second railroad stop, Maplewood station, served the farms to the south. That area is today's Maplewood, which has its own site.",
    sources: ["mwWiki"] },
  { id: "chapel", year: 1863, title: "Chapel of the Immaculate Conception", kind: "culture", address: "400 South Orange Avenue (Seton Hall)",
    lat: 40.74221, lon: -74.24789,
    text: "Seton Hall's chapel has three dates: built 1862, 1863, or dedicated 1870, depending on the source. It is a local landmark under the 2016 preservation ordinance.",
    sources: ["whittemore", "seton", "ordinance"] },
  { id: "horsecar", year: 1865, title: "Horse Cars from Newark", kind: "transport", address: "South Orange Avenue",
    lat: 40.7462, lon: -74.2560,
    text: "Horse cars began running from Newark in 1865, with Vose as president of the line. The route was electrified as a trolley in 1893.",
    sources: ["wiki", "nrMontrose"] },
  { id: "hilltop", year: 1866, title: "\"Hilltop\"", kind: "house", address: "140 Raymond Avenue",
    lat: 40.7488, lon: -74.2532,
    text: "Phineas Bartlett's Second Empire house of 1866–68, among the oldest in Montrose.",
    sources: ["nrMontrose"] },
  { id: "presidents", year: 1867, title: "Presidents Hall", kind: "culture", address: "Seton Hall campus",
    lat: 40.74239, lon: -74.24747,
    text: "Seton Hall's seminary building, completed in 1867.",
    sources: ["seton"] },
  { id: "kelly", year: 1867, title: "Kelly Carriage House", kind: "house", address: "Seton Hall campus, South Orange Avenue (approx.)",
    lat: 40.7425, lon: -74.2462, landmark: true,
    text: "Banker Eugene Kelly's estate, later part of Seton Hall. In 1887 he enlarged the house in the Queen Anne style and built the brick carriage house designed by John E. Baker. It survives as the Monella Art Center and has been on the National Register since 1975.",
    sources: ["nrKelly"] },
  { id: "montrose", year: 1867, title: "Vose's Montrose", kind: "house", address: "Montrose, Raymond, Ralston, Warwick, Charlton & Irving Avenues",
    lat: 40.7505, lon: -74.2500,
    text: "Between 1867 and 1874 John Gorham Vose and Henry A. Page laid out streets \"to attract wealthy New York businessmen to rural South Orange.\" Vose assembled more than 175 acres, and his deeds allowed one house per lot \"appropriate for a gentleman's country residence.\" Lewis P. Taylor's May 1873 map shows Vose's lots.",
    sources: ["nrMontrose"] },
  { id: "charter", year: 1869, title: "Village of South Orange Chartered", kind: "event", address: "Village center",
    lat: 40.748811, lon: -74.261512,
    text: "The village act passed on March 25 and was ratified on May 4, 1869. The township \"included a large amount of unimproved property,\" so those who had \"made extensive improvements\" sought their own charter. L. L. Coudert was the first president, and George B. Turrell \"a chief promoter.\"",
    sources: ["schnell", "whittemore", "nrMontrose"] },
  { id: "thayer", year: 1870, title: "Italianate House on the 1873 Map", kind: "house", address: "140 Montrose Avenue",
    lat: 40.7496, lon: -74.2439,
    text: "A c. 1870 Italianate house that already appears on Lewis P. Taylor's 1873 map of Montrose.",
    sources: ["nrMontrose"] },
  { id: "gould", year: 1870, title: "J. Mitchell Gould Estate", kind: "house", address: "169 Charlton Avenue",
    lat: 40.74781, lon: -74.25233,
    text: "A c. 1870 Second Empire house from the Vose years.",
    sources: ["nrMontrose"] },
  { id: "warwick257", year: 1870, title: "Mansard Italianate", kind: "house", address: "257 Warwick Avenue",
    lat: 40.75314, lon: -74.24360,
    text: "A c. 1870 mansard-roofed Italianate house the nomination calls \"typical of Vose's vision.\"",
    sources: ["nrMontrose"] },
  { id: "cottagest", year: 1872, title: "Seton Village Cottages", kind: "house", address: "Cottage Street, Riggs Place & Fairview Avenue",
    lat: 40.7440, lon: -74.2543,
    text: "Narrow-lot streets of small frame cottages, built from the early 1870s to 1900 south of the university, on lots as narrow as 25 feet.",
    sources: ["masterPlan"] },
  { id: "vosedeath", year: 1874, title: "Vose's Death", kind: "event", address: "Vose's home site, Scotland Road (now Henderson Drive)",
    lat: 40.75461, lon: -74.24962,
    text: "Vose's \"palatial home\" stood at the summit of Montrose Avenue. He drowned himself at Atlantic City on March 17, 1874, aged 45, possibly under the strain of the Panic of 1873.",
    sources: ["nrMontrose"] },
  { id: "mountainstation", year: 1874, title: "Mountain Station", kind: "transport", address: "449 Vose Avenue",
    lat: 40.75530, lon: -74.25284, landmark: true,
    text: "Vose and Page \"built the depot at Montrose station… at their own expense.\" The present station, with its tile landscape panel, dates from 1915 (the Montrose nomination says c. 1910). On the National Register since 1984.",
    sources: ["whittemore", "mtnStation", "nrMontrose"] },
  { id: "phones", year: 1879, title: "First Telephones", kind: "event", address: "South Orange & Mountain stations",
    lat: 40.7459, lon: -74.2611,
    text: "Telephones arrived on December 6, 1879, first at the South Orange and Mountain stations. The Matthews house at 425 Vose Avenue (1880) was among the first homes connected.",
    sources: ["nrMontrose"] },
  { id: "oltc1880", year: 1880, end: 1916, title: "Orange Lawn Tennis Club (first grounds)", kind: "culture", address: "Montrose & Berkeley Avenues (approx.)",
    lat: 40.7512, lon: -74.2470,
    text: "Organized October 4, 1880 on ten leased acres of Vose land. It moved to Redmond's \"Hillside\" on Ridgewood Road in 1916–17.",
    sources: ["whittemore", "nrMontrose", "oltc"] },
  { id: "allen", year: 1886, title: "William F. Allen's Villa (site)", kind: "house", address: "170 Scotland Road",
    lat: 40.74871, lon: -74.25506,
    text: "The editor of the Official Railway Guide and \"inventor of Standard Time\" built a villa here in 1886. He led the Meadow Land Society. Oheb Shalom has stood on the site since 1958.",
    sources: ["nrMontrose", "soplTime"] },
  { id: "fieldclub", year: 1889, title: "South Orange Field Club (Baird Center)", kind: "culture", address: "5 Mead Street",
    lat: 40.75017, lon: -74.25986,
    text: "Organized June 14, 1889 on valley land the Meadow Land Society bought to keep industry out. The clubhouse gained 14 rooms and the name Baird Center in 1930.",
    sources: ["whittemore", "soplBaird"] },
  { id: "meadowland", year: 1889, title: "Meadowland Park & the Duck Pond", kind: "nature", address: "Meadowland Park",
    lat: 40.75155, lon: -74.25827,
    text: "In 1889 residents bought 23 acres of valley land from E. H. Mead to keep industry out. By 1937 the park covered 40 acres. Flood's Hill, the sledding slope, is named for a dairyman who leased the Squier house.",
    sources: ["whittemore", "schnell", "hpcTime"] },
  { id: "sorrows", year: 1889, title: "Our Lady of Sorrows", kind: "culture", address: "Prospect Street",
    lat: 40.74152, lon: -74.25913,
    text: "The parish was formed in 1878 and built its first church in 1889. The present Gothic church was dedicated in 1931.",
    sources: ["soplTime"] },
  { id: "fire1891", year: 1891, title: "Volunteer Fire Department", kind: "civic", address: "Foot of Lackawanna Place (approx.)",
    lat: 40.74095, lon: -74.26437,
    text: "Organized on February 2, 1891 and first housed in the railroad roundhouse at the foot of Lackawanna Place. (The library's history says a stable on Vose Avenue.)",
    sources: ["nrFire", "soplVH"] },
  { id: "montrosepark", year: 1891, title: "Montrose Park Annexed", kind: "event", address: "East of Centre Street",
    lat: 40.74917, lon: -74.24778, landmark: true,
    text: "On February 10, 1891 the Village annexed the land east of Centre Street. Thomas S. Kingman, Henry Finlay and William F. Havemeyer developed it as \"Montrose Park,\" building Hartford, Stanley and Kingman Roads. Stanley Road honors the explorer Henry M. Stanley. The district has been on the National Register since 1997.",
    sources: ["whittemore", "nrMontrose", "mpWiki"] },
  { id: "turrell", year: 1891, title: "Turrell Avenue", kind: "house", address: "246 Turrell Avenue",
    lat: 40.74882, lon: -74.24931,
    text: "George B. Turrell, a promoter of the 1869 charter and twice village president, opened Turrell Avenue in 1891 and built his own Neoclassical house here.",
    sources: ["nrMontrose"] },
  { id: "kingman", year: 1895, title: "Kingman House", kind: "house", address: "457 Centre Street",
    lat: 40.74898, lon: -74.24112,
    text: "Thomas Sewall Kingman's house of c. 1895–1903, now Seton Hall's George M. Ring Building.",
    sources: ["nrMontrose"] },
  { id: "villagehall", year: 1895, title: "Village Hall", kind: "civic", address: "101 South Orange Avenue at Scotland Road",
    lat: 40.74611, lon: -74.25833, landmark: true,
    text: "Citizens rejected an Irvington Avenue site, and the trustees bought the Roth property on South Orange Avenue. Rossiter & Wright's Tudor Revival hall opened on March 18, 1895, with the firehouse inside until 1930. Village offices left in 2013, and it reopened as a restaurant in 2022. Legend links its clock to Nancy Drew's The Secret of the Old Clock.",
    sources: ["soplVH", "nrVH"] },
  { id: "connett", year: 1896, title: "Connett Library", kind: "culture", address: "Scotland Road at Taylor Place",
    lat: 40.74705, lon: -74.25709,
    text: "Eugene V. Connett offered a Scotland Road lot for a library if $7,500 could be raised. The library opened on May 8, 1896. The 1896 report credits the architects Stephenson & Greene; the firehouse nomination says Arthur Dillon.",
    sources: ["whittemore", "soplConnett", "nrFire"] },
  { id: "ralston166", year: 1898, title: "Tudor Revival Brownstone", kind: "house", address: "166 Ralston Avenue",
    lat: 40.74668, lon: -74.25312,
    text: "An 1898 Tudor Revival brownstone house by Stephenson & Greene.",
    sources: ["nrMontrose"] },
  { id: "leach", year: 1899, title: "\"Pleasant Home\" (demolished)", kind: "house", address: "321 Scotland Road",
    lat: 40.75127, lon: -74.25368,
    text: "Arthur Burtis Leach's house by the Prairie School architect George W. Maher, 1899. It has been demolished.",
    sources: ["mpWiki"] },
  { id: "kip", year: 1903, title: "Kip-Riker House (\"Montrose\")", kind: "house", address: "432 Scotland Road (approx.)",
    lat: 40.7528, lon: -74.2522,
    text: "A mansion of c. 1900–1903, attributed to Henry Ives Cobb. Temple Israel bought it within a year of forming in 1948; it is now Temple Sharey Tefilo-Israel and a local landmark.",
    sources: ["mpWiki", "tsti", "ordinance"] },
  { id: "separation", year: 1904, title: "The Village Goes Its Own Way", kind: "event", address: "Village-wide",
    lat: 40.7493, lon: -74.2580,
    text: "On March 4, 1904 the Village separated from South Orange Township. No source states its motive; under the old arrangement it \"had no control over the township tax assessor's\" valuations. The remaining township renamed itself Maplewood in 1922.",
    sources: ["dhSep"] },
  { id: "grovepark", year: 1908, title: "Grove Park", kind: "nature", address: "South Orange Ave, Grove Road, Park Place & Raymond Ave",
    lat: 40.74675, lon: -74.25026,
    text: "Citizens raised $8,000 in 1908 for the park and $2,000 more to landscape it, on land that was once part of the Stone House farm.",
    sources: ["nrMontrose", "nrStone"] },
  { id: "tuxedo", year: 1911, title: "Tuxedo Park", kind: "house", address: "Cameron Road area",
    lat: 40.7429, lon: -74.2404,
    text: "The first houses went up in 1911, and the neighborhood was organized in 1913. It was built mostly before World War I, with Mediterranean Revival, bungalow, Colonial Revival and Tudor houses.",
    sources: ["patchTux", "masterPlan"] },
  { id: "cameron", year: 1912, title: "Cameron Field", kind: "nature", address: "Cameron Field",
    lat: 40.74836, lon: -74.25951,
    text: "Laid out in 1912 in memory of Rev. Lewis M. Cameron, the same year the Village dug seven wells and built a pumping plant. A pool followed around 1925, and an Olympic pool in 1972.",
    sources: ["soplTime", "wiki"] },
  { id: "station1916", year: 1916, title: "South Orange Station", kind: "transport", address: "19 Sloan Street",
    lat: 40.74583, lon: -74.26083, landmark: true,
    text: "The Lackawanna raised its tracks above the streets in 1914–16, and Frank J. Nies's station opened on February 1, 1916. It had 87 trains a day in 1901 and a peak of 112 in 1940. On the National Register since 1984.",
    sources: ["station", "soplTime"] },
  { id: "toadhall", year: 1916, title: "\"Toad Hall\"", kind: "house", address: "6 Halsey Place",
    lat: 40.75458, lon: -74.24806,
    text: "Built in 1916–18. Calculator maker Jay R. Monroe bought it in 1926 and installed a 55-stop Skinner organ.",
    sources: ["nrMontrose"] },
  { id: "farmcourts", year: 1922, title: "Seton Hall's Farm Becomes Courts", kind: "house", address: "South Orange Avenue & Centre Street (NW corner)",
    lat: 40.7461, lon: -74.2473,
    text: "Seton Hall sold its last 15-acre dairy tract in 1922. By 1928 it was built up as University, Fielding, Elm, Warren and Marshall Courts.",
    sources: ["nrMontrose"] },
  { id: "marshall", year: 1922, title: "Marshall School", kind: "civic", address: "262 Grove Road",
    lat: 40.74724, lon: -74.24739,
    text: "Opened in 1922 as \"the first elementary school built in South Orange,\" designed by Guilbert & Betelle.",
    sources: ["soplTime"] },
  { id: "firehq", year: 1926, title: "Fire Headquarters", kind: "civic", address: "First & Sloan Streets",
    lat: 40.74528, lon: -74.26083, landmark: true,
    text: "Arthur Dillon's Norman-style firehouse was built in 1925–26 and occupied in 1930, when the firemen left Village Hall. On the National Register since 1998.",
    sources: ["nrFire"] },
  { id: "ruthgehrig", year: 1929, title: "Babe Ruth and Lou Gehrig Play Here", kind: "event", address: "Cameron Field",
    lat: 40.7481, lon: -74.2598,
    text: "In late October 1929 (the 27th or 29th; sources differ) Babe Ruth and Lou Gehrig played an exhibition game at Cameron Field.",
    sources: ["soplTime", "hpcTime"] },
  { id: "southmtn", year: 1929, title: "South Mountain School", kind: "civic", address: "444 South Orange Avenue at Wyoming Avenue",
    lat: 40.74725, lon: -74.27236,
    text: "Guilbert & Betelle's 1929 school, \"the last of the original slate of grade schools.\"",
    sources: ["schnell"] },
  { id: "edison", year: 1930, title: "Edison's Electric Train", kind: "transport", address: "South Orange station",
    lat: 40.7456, lon: -74.2605,
    text: "In September 1930 \"a frail Thomas Edison\" inaugurated electric service between Hoboken and South Orange. Sources give September 3 or 22.",
    sources: ["wiki", "station", "soplTime"] },
  { id: "postoffice", year: 1937, title: "Vose Avenue Post Office", kind: "civic", address: "Vose Avenue",
    lat: 40.75212, lon: -74.25461,
    text: "The post office opened in 1937. Its mural by Bernard Perlin followed in 1939.",
    sources: ["soplPO"] },
  { id: "walsh", year: 1941, title: "Walsh Gymnasium", kind: "culture", address: "Seton Hall campus",
    lat: 40.74185, lon: -74.24495,
    text: "Built in 1939–41, the home court of the Seton Hall Pirates, who won the NIT in 1953.",
    sources: ["walshGym", "pirates"] },
  { id: "memorialrock", year: 1946, title: "Memorial Rock", kind: "event", address: "By the Duck Pond, Meadowland Park",
    lat: 40.7520, lon: -74.2590,
    text: "Its plaques list 70 South Orange dead: 59 in World War II, 6 in Korea and 5 in Vietnam.",
    sources: ["soplRock"] },
  { id: "library1968", year: 1968, title: "South Orange Public Library", kind: "culture", address: "65 Scotland Road",
    lat: 40.74705, lon: -74.25709,
    text: "The new library was dedicated in November 1968, near the site of the 1896 Connett library.",
    sources: ["wiki"] },
  { id: "midtown", year: 1996, title: "Midtown Direct", kind: "transport", address: "South Orange station",
    lat: 40.7461, lon: -74.2613,
    text: "Direct trains to Midtown Manhattan began on June 10, 1996. They cut the commute from about 50 to 35 minutes and \"caused a surge in real estate prices.\"",
    sources: ["hpcTime", "wiki"] },
  { id: "boland", year: 2000, title: "Boland Hall Fire", kind: "event", address: "Seton Hall campus",
    lat: 40.7430, lon: -74.2440,
    text: "On January 19, 2000 an arson fire in Seton Hall's Boland Hall dormitory killed three students.",
    sources: ["boland"] },
  { id: "gaslightcommons", year: 2002, title: "Gaslight Commons", kind: "commerce", address: "28 West Third Street",
    lat: 40.74384, lon: -74.26327,
    text: "LCOR's 200-unit apartment building by the station won a 2002 Smart Growth Award, the start of the transit village.",
    sources: ["njfuture"] },
  { id: "sopac", year: 2006, title: "South Orange Performing Arts Center", kind: "culture", address: "One SOPAC Way",
    lat: 40.74614, lon: -74.26090,
    text: "The 415-seat theater opened on November 3, 2006 with Paula Poundstone.",
    sources: ["sopacNyt"] },
  { id: "hpc", year: 2012, title: "Historic Preservation Commission", kind: "civic", address: "Village-wide",
    lat: 40.7470, lon: -74.2560,
    text: "Established on July 23, 2012. Its 2016 ordinance lists the local landmarks: the 40 key houses of Montrose Park, Village Hall, the stations, the firehouse, the Old Stone House, the Seton Hall chapel, the Kelly carriage house and the former Riker mansion.",
    sources: ["hpcTime", "ordinance"] },
  { id: "thirdvalley", year: 2016, title: "Third & Valley", kind: "commerce", address: "Third Street & Valley Street",
    lat: 40.74348, lon: -74.26155,
    text: "A 215-unit building that opened in July 2016 on a former commuter lot and the old Rescue Squad site.",
    sources: ["placenj"] },
  { id: "rename2024", year: 2024, title: "\"South Orange Village\" Again", kind: "event", address: "Village-wide",
    lat: 40.7480, lon: -74.2575,
    text: "The Village dropped \"Township\" from its legal name, adopted March 11 and effective April 25, 2024.",
    sources: ["wiki"] }
];
MW.places.sort((a, b) => a.year - b.year);
/* Places that belong to today's Village (for house stories and counts). */
MW.localPlaces = () => MW.places.filter(p => p.scope !== "township");

/* --------------------------------------------------------------------------
   Neighborhoods, from the 2021 Master Plan. Assignment is by nearest center.
   -------------------------------------------------------------------------- */
MW.sections = [
  { id: "montrose", name: "Montrose Park", lat: 40.74917, lon: -74.24778,
    colonial: "In 1860 this was farmland: B. E. Baldwin, Deas and S. P. Smith west of Centre Street, and A. B. Baldwin, Kilburn and Wheeler to the east. The Old Stone House and the \"House with the White Chimneys\" at 311 Centre Street date from before the suburb.",
    growth: "Vose and Page laid out the streets west of Centre Street in 1867–74. Kingman's syndicate built east of it after the 1891 annexation, on lots of at least 100 by 200 feet. Seton Hall's farm courts followed in 1922–28. The district has been on the National Register since 1997.",
    sources: ["nrMontrose"] },
  { id: "westmontrose", name: "West Montrose", lat: 40.7540, lon: -74.2560,
    colonial: "This was the Mountain House resort country, and E. H. Mead's 10-acre \"Springlawn\" estate at Ridgewood Road and Vose Avenue.",
    growth: "Meeker Street was built up just after the Civil War, and Hillside Place after 1880, with Second Empire, Stick, Queen Anne, Shingle and Colonial Revival houses.",
    sources: ["masterPlan"] },
  { id: "academy", name: "Academy Heights & Prospect Street", lat: 40.7430, lon: -74.2590,
    colonial: "This was the stone school and its common. In 1834 the settlement was concentrated on Prospect Street and Irvington Avenue.",
    growth: "Pattern-book cottages went up from the late 1830s, Luther Milligan's houses in 1871, and the southern streets such as Roland Avenue later. The Prospect Street district has a state eligibility opinion.",
    sources: ["masterPlan", "nrMontrose"] },
  { id: "setonvillage", name: "Seton Village", lat: 40.7430, lon: -74.2530,
    colonial: "This was the Ward farm, whose land later became Seton Hall's grounds.",
    growth: "Cottage Street dates from the early 1870s, and Riggs Place and Fairview Avenue from 1870–1900, with small frame cottages on lots as narrow as 25 feet.",
    sources: ["masterPlan"] },
  { id: "cbd", name: "the Village center", lat: 40.7460, lon: -74.2606,
    colonial: "The school common, Freeman's store (1841) and the 1811 turnpike made this the hamlet's heart.",
    growth: "The 1916 station and 1920s commercial blocks shaped it. Since 2002, apartment buildings near the station have made it a \"transit village.\" Village Hall, the station and the firehouse are on the National Register.",
    sources: ["masterPlan", "mainst"] },
  { id: "nridgewood", name: "North Ridgewood Road & Lower Wyoming", lat: 40.7503, lon: -74.2656,
    colonial: "This is the oldest farm ground in the Village: the Brown farm (1677), Squier's house (1774), Redmond's \"Hillside\" (1850) and the Mountain House.",
    growth: "Estates went up along North Ridgewood Road from the late 1800s to about 1910. The Lower Wyoming streets (Tillou, Beech Spring, Highland) filled in from 1910 to 1930.",
    sources: ["masterPlan"] },
  { id: "southmountain", name: "South Mountain", lat: 40.7426, lon: -74.2680,
    colonial: "Early-Victorian Gothic houses stood on South Ridgewood Road, such as 44 South Ridgewood Road (c. 1850). The Fenner family built on Walton Avenue.",
    growth: "In the 1920s and 1930s Tudor houses went up on West End Road, Western Avenue and Conway Court.",
    sources: ["masterPlan"] },
  { id: "tuxedo", name: "Tuxedo Park", lat: 40.7429, lon: -74.2404,
    colonial: "On the 1860 map this was Thomas D. Kilburn's tract.",
    growth: "The first houses went up in 1911 and the neighborhood was organized in 1913. It was built mostly before World War I.",
    sources: ["patchTux", "masterPlan"] },
  { id: "upperwyoming", name: "Upper Wyoming", lat: 40.7512, lon: -74.2712,
    colonial: "No colonial-era sites are documented here. It was the wooded slope of the mountain.",
    growth: "Built in the 1920s and early 1930s, with Tudor and Colonial Revival houses, most ornate on Mayhew Court.",
    sources: ["masterPlan"] },
  { id: "newstead", name: "Newstead", lat: 40.7570, lon: -74.2750,
    colonial: "This is \"the high ground west of Wyoming Avenue,\" still undeveloped in 1930.",
    growth: "A few Tudors and Colonials went up in the late 1920s and 1930s, but most houses are 1950s ranches and split-levels, many by George H. Becker, on lots up to 150 feet wide.",
    sources: ["masterPlan", "wiki"] }
];

/* Historic roads (OpenStreetMap geometry, simplified). `from` = first dated. */
MW.oldRoads = [
  { name: "South Orange Avenue (the 1705 road to Newark; 1811 turnpike)", from: 1500,
    pts: [[40.74594, -74.27988], [40.74791, -74.27171], [40.74866, -74.26782], [40.7485, -74.26651], [40.74799, -74.26503], [40.74749, -74.26351], [40.74717, -74.26251], [40.7469, -74.26165], [40.7465, -74.25947], [40.74611, -74.25833], [40.74545, -74.2533], [40.74463, -74.24742], [40.74469, -74.24599], [40.74564, -74.24347], [40.74557, -74.2371]] },
  { name: "Ridgewood Road (the 1705 \"Valley or Freemantown road\")", from: 1705,
    pts: [[40.75874, -74.25702], [40.75434, -74.2604], [40.75292, -74.261], [40.75133, -74.2611], [40.74992, -74.2618], [40.7493, -74.2622], [40.74832, -74.26293], [40.74749, -74.26351], [40.74717, -74.2638], [40.74484, -74.26594], [40.74221, -74.27314], [40.73961, -74.2759]] },
  { name: "Scotland Road (by 1774)", from: 1774,
    pts: [[40.76114, -74.24756], [40.75341, -74.2513], [40.75101, -74.25407], [40.74909, -74.25548], [40.74741, -74.25627], [40.74609, -74.25771]] },
  { name: "Irvington Avenue (by 1834)", from: 1834,
    pts: [[40.74509, -74.2565], [40.74382, -74.25587], [40.74071, -74.25307], [40.73898, -74.25233], [40.7376, -74.25142], [40.7359, -74.25081]] },
  { name: "Prospect Street (by 1834)", from: 1834,
    pts: [[40.74501, -74.25546], [40.74452, -74.25595], [40.74419, -74.25623], [40.73922, -74.2602], [40.7379, -74.26026], [40.73556, -74.26234]] },
  { name: "the Morris & Essex rail line (1837)", from: 1837,
    pts: [[40.7311, -74.2754], [40.7365, -74.2712], [40.74095, -74.26437], [40.74583, -74.26083], [40.7508, -74.2565], [40.7553, -74.25284], [40.7669, -74.2437]] },
  { name: "Centre Street (by 1860; the 1869 village line)", from: 1860,
    pts: [[40.74654, -74.24214], [40.7497, -74.24023], [40.75182, -74.2386]] },
  { name: "Valley Street (\"Lower Trail\" in Durand-Hedden's telling)", from: 1860,
    pts: [[40.74355, -74.26061], [40.7355, -74.26791]] }
];

/* Architectural styles common in South Orange (Master Plan; NR Montrose nomination). */
MW.styles = [
  { id: "colonial", name: "Colonial Stone Farmhouse", from: 1680, to: 1836, desc: "Fieldstone and brownstone farmhouses like the Old Stone House and the Squier House." },
  { id: "cottage", name: "Railroad Cottage", from: 1837, to: 1866, desc: "Pattern-book cottages and early Gothic houses near the station, as on Academy Heights and South Ridgewood Road." },
  { id: "secondempire", name: "Italianate & Second Empire", from: 1867, to: 1884, desc: "Mansard roofs and bracketed eaves: Vose's Montrose, like 140 Montrose Avenue and 257 Warwick Avenue." },
  { id: "queenanne", name: "Queen Anne & Shingle", from: 1885, to: 1903, desc: "Towers, wraparound porches and shingled walls of the Kingman years in Montrose Park." },
  { id: "colrev", name: "Colonial Revival & Mediterranean", from: 1904, to: 1916, desc: "Symmetrical Colonial Revivals and stucco Mediterranean houses, as in Tuxedo Park." },
  { id: "tudor", name: "Tudor Revival", from: 1917, to: 1940, desc: "Steep gables, half-timbering and stone: the 1920s slopes of Wyoming and South Mountain." },
  { id: "ranch", name: "Ranch & Split-Level", from: 1941, to: 1969, desc: "Postwar houses on wide lots, especially in Newstead." },
  { id: "modern", name: "Contemporary", from: 1970, to: 2100, desc: "Infill and the apartment buildings of the transit village." }
];
MW.styleFor = y => MW.styles.find(s => y >= s.from && y <= s.to) || MW.styles[MW.styles.length - 1];

/* Geography helpers */
MW.geo = {
  distM(a, b) {
    const R = 6371000, toR = Math.PI / 180;
    const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  },
  distToLineM(p, pts) {
    const k = 111320, kx = k * Math.cos(p[0] * Math.PI / 180);
    const Q = pts.map(q => [(q[1] - p[1]) * kx, (q[0] - p[0]) * k]);
    let best = Infinity;
    for (let i = 0; i < Q.length - 1; i++) {
      const [ax, ay] = Q[i], [bx, by] = Q[i + 1];
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, (-ax * dx - ay * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
    return best;
  },
  /* point-in-polygon on a GeoJSON Polygon ([lon,lat] rings); p = [lat, lon] */
  inPolygon(p, poly) {
    if (!poly) return true;
    const rings = poly.type === "MultiPolygon" ? poly.coordinates.map(r => r[0]) : [poly.coordinates[0]];
    return rings.some(r => {
      let inside = false;
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i], [xj, yj] = r[j];
        if ((yi > p[0]) !== (yj > p[0]) && p[1] < (xj - xi) * (p[0] - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    });
  },
  inTown(p) { return MW.geo.inPolygon(p, window.MW_BOUNDARY); },
  fmt(m) {
    const mi = m / 1609.34;
    if (mi < 0.1) return Math.round(m * 3.281 / 10) * 10 + " feet";
    return mi.toFixed(mi < 1 ? 2 : 1) + " miles";
  },
  walkMin(m) { return Math.max(1, Math.round(m / 80)); }
};
