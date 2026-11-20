/* Published stories about specific South Orange addresses (from docs/research, notable-people and
   landmark sections). Only deceased people with pre-1951 ties are linked to an address.
   Summaries are our own words; follow the link for the full story. */
window.MW = window.MW || {};
MW.webStories = [
  { address: "201 South Orange Avenue", title: "Stone House by the Stone House Brook", source: "National Register nomination (1991)", url: "https://npgallery.nps.gov/GetAsset/d73c09bc-36a7-496d-9bdb-84704a0a48c3",
    summary: "The full chain of owners, from Nathaniel Wheeler's 1680 grant through the Piersons, Lindsleys, Vose and Brewer to the Village in 1953, plus the 1990 archaeology that found a midden.", tag: "Landmark" },
  { address: "262 Charlton Avenue", title: "Governor John Franklin Fort dies at home", source: "New Jersey Law Journal (1920); Oranges city directories (1916–1922)", url: "https://books.google.com/books?id=-2tKAAAAYAAJ&pg=PA353",
    summary: "New Jersey's 33rd governor lived at 262 Charlton Avenue (confirmed in the 1916 and 1920 Oranges city directories; the 1920 journal obituary spelled it \"Charleton\") and died here in November 1920.", tag: "Notable person" },
  { address: "6 Halsey Place", title: "\"Toad Hall\" and the Monroe organ", source: "National Register nomination: Montrose Park; Wikipedia", url: "https://en.wikipedia.org/wiki/Jay_Randolph_Monroe_III",
    summary: "Calculator maker Jay Randolph Monroe bought this 1916–18 house in 1926 and installed a 55-stop Skinner pipe organ. He died here in 1937.", tag: "Notable person" },
  { address: "457 Centre Street", title: "The Kingman house", source: "National Register nomination: Montrose Park", url: "https://npgallery.nps.gov/GetAsset/2b0c9ff9-6014-40a7-b3b7-c1ab7eede3dd",
    summary: "Home of Thomas Sewall Kingman, whose syndicate developed Montrose Park after the 1891 annexation. It is now Seton Hall's George M. Ring Building.", tag: "Notable person" },
  { address: "432 Scotland Road", title: "The Kip-Riker mansion becomes a temple", source: "Temple Sharey Tefilo-Israel", url: "https://tsti.org/about/tsti-history/",
    summary: "Temple Israel formed in April 1948 with 229 families and within a year bought this Montrose mansion. It is a local landmark under the 2016 preservation ordinance.", tag: "Landmark" },
  { address: "321 Scotland Road", title: "\"Pleasant Home\" by George W. Maher", source: "Wikipedia: Montrose Park Historic District", url: "https://en.wikipedia.org/wiki/Montrose_Park_Historic_District",
    summary: "Arthur Burtis Leach's 1899 house by the Prairie School architect George W. Maher once stood here. It has been demolished.", tag: "Architecture" },
  { address: "602 Centre Street", title: "South Orange's merchant prince", source: "Oranges city directories (1910–1942); Patch (2009)", url: "https://patch.com/new-jersey/southorange/local-history-south-oranges-merchant-prince",
    summary: "Louis Bamberger, founder of Bamberger's and co-founder of the Institute for Advanced Study, lived here with his sister Caroline Bamberger Fuld and brother-in-law Felix Fuld (confirmed in Oranges city directories from 1910 through 1942) and died here in 1944.", tag: "Notable person" },
  { address: "101 South Orange Avenue", title: "Village Hall History", source: "South Orange Public Library", url: "https://localhistory.sopl.org/wiki/Village_Hall_History",
    summary: "How citizens overruled the trustees' Irvington Avenue site in 1894, and how the hall, its firehouse and its vanished bell served the Village for over a century.", tag: "Landmark" },
  { address: "305 North Ridgewood Road", title: "Orange Lawn Tennis Club", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Orange_Lawn_Tennis_Club",
    summary: "William Redmond's brownstone \"Hillside\" (1850) has been the clubhouse of the Orange Lawn Tennis Club, organized in 1880, since 1917.", tag: "Landmark" }
];

MW.storiesFor = function (number, road) {
  if (!number || !road) return [];
  const norm = r => r.toUpperCase().replace(/[^A-Z ]/g, "")
    .replace(/\bN\b/g, "NORTH").replace(/\bS\b/g, "SOUTH").replace(/\bE\b/g, "EAST").replace(/\bW\b/g, "WEST")
    .replace(/\bCENTER\b/g, "CENTRE")
    .replace(/\b(ROAD|RD|AVENUE|AVE|AV|STREET|ST|PLACE|PL|TERRACE|TER|DRIVE|DR|LANE|LN|COURT|CT)\b/g, "")
    .replace(/\s+/g, " ").trim();
  return MW.webStories.filter(s => {
    const m = s.address.match(/^(\d+)\s+(.+)$/);
    return m && m[1] === String(number) && norm(m[2]) === norm(road);
  });
};
