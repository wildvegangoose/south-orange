/* Landmark pages: researched histories (docs/research, landmarks section and notes/landmarks_and_registers.md).
   Facts come from the sources listed with each landmark; where sources disagree the text says so. */
var MW = window.MW = window.MW || {};
(function () {
  const S = {
    nr: (name, id) => ({ label: `National Register nomination: ${name}`, url: `https://npgallery.nps.gov/GetAsset/${id}` }),
    nris: (name, n) => ({ label: `NPGallery record: ${name} (NRIS ${n})`, url: `https://npgallery.nps.gov/AssetDetail/NRIS/${n}` }),
    wiki: (title, slug) => ({ label: `Wikipedia: ${title}`, url: `https://en.wikipedia.org/wiki/${slug}` }),
    sopl: (title, slug) => ({ label: `South Orange Public Library: ${title}`, url: `https://localhistory.sopl.org/wiki/${slug}` }),
    hpcLetter: { label: "Historic Preservation Commission letter to the Trustees (Sept. 2, 2014)", url: "https://villagegreennj.com/wp-content/uploads/2014/09/HPC-Ltr-to-Trustees.pdf" },
    vh101: { label: "Village of South Orange: 101 South Orange Avenue, Village Hall", url: "https://southorange.org/856/101-South-Orange-Avenue-Village-Hall" },
    sohps: { label: "South Orange Historical & Preservation Society: Old Stone House", url: "https://sohps.org/?p=7" },
    stationSurvey: { label: "Railroad station survey: South Orange Station", url: "https://npgallery.nps.gov/GetAsset/9a4e511d-181e-4493-80cd-21d265a8e65f" },
    mtnSurvey: { label: "Railroad station survey: Mountain Station", url: "https://npgallery.nps.gov/GetAsset/5a4d691c-88b5-47ff-8127-e451775926df" }
  };
  const NR_MONTROSE = S.nr("Montrose Park Historic District", "2b0c9ff9-6014-40a7-b3b7-c1ab7eede3dd");

  MW.landmarks = {
    stonehouse: {
      name: "Old Stone House", type: "Colonial stone house", kind: "house", place: "stonehouse", built: 1680, builtLabel: "before 1680; stone wing 1773–91",
      address: "201 South Orange Avenue (formerly 219)", lat: 40.74500, lon: -74.25361,
      designation: "National Register 1991 · NJ Register 1991 · local landmark",
      photos: [{ src: "img/landmarks/stonehouse.jpg", hero: true, year: 2016, caption: "The Stone House by the Stone House Brook", credit: "Jerrye & Roy Klotz / Wikimedia Commons", license: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:STONE_HOUSE_BY_THE_STONE_BROOK,_SOUTH_ORANGE,_ESSEX_COUNTY,_NJ.jpg" }],
      tagline: "The house the town grew up around: named in a 1680 land grant, enlarged by Bethuel Pierson, and the only pre-1800 building left in the Village.",
      sections: [
        { h: "\"Near the Stone House\"", p: [
          "On September 27, 1680, Newark's town meeting granted Nathaniel Wheeler, Edward Riggs and Joseph Riggs land \"upon the upper Chesnut hill by Raway River, near the Stone House.\" The National Register nomination takes this to mean the oldest part of the house already stood. It calls it \"the first dwelling to have been built in what is now South Orange.\"",
          "The sources disagree on the house's age. The nomination says before 1680, the Montrose Park nomination says c. 1670, the Historical & Preservation Society says between 1666 and 1680, and the Village's preservation timeline says built in 1680. A 2009 local essay argues that the 1680 \"Stone House\" was the Brown brothers' house at Tillou and Ridgewood Roads. The safest wording is: first mentioned in 1680."] },
        { h: "Pierson's stone addition", p: [
          "The first house was a 1½-story rubble-stone building in the Dutch rural tradition. Dr. Bethuel Pierson owned it from 1773. On January 11, 1773 he mortgaged 100 acres \"by a certain brook called Stone House Brook\", then added a stone wing, which he \"caused to be dedicated by religious ceremonies.\" The nomination dates this hall-and-parlor wing to 1773–91.",
          "Three of the original stone walls are visible outside and a fourth survives inside."] },
        { h: "A long chain of owners", p: [
          "After Pierson came Nathaniel Condit (1793), the Lindsley family (1804–1850), Alexander Bell, Philip Kingsley and, at a sheriff's sale, Ebenezer Deas. In September 1866 John Gorham Vose, the developer of Montrose, bought it, and the same year he sold it to William A. Brewer Jr.",
          "Brewer, president of the Washington Life Insurance Company, moved in in 1867 and named the house \"Aldworth.\" As village president in 1877–80 he pushed for roads, bridges, sidewalks, gas lighting, street signs and sewers. Queen Anne and Shingle-style additions followed in 1877 and before 1896."] },
        { h: "Village property, and a long rescue", p: [
          "Dr. George C. and Mary Albee bought the house on January 12, 1916 (Wikipedia says 1915) and added a rear office in 1937. The Village bought it on July 1, 1953. Part of the land became the police station, and the house was the school board's headquarters until 1983. It has stood empty since.",
          "Archaeologists dug here in June 1990 and found a trash scatter and a midden. The New Jersey Historic Trust paid for stabilization in 2001 and 2002, and in May 2020 Preservation New Jersey put the house on its Ten Most Endangered list. The Historical & Preservation Society is raising money to restore it."] }
      ],
      facts: ["Grove Park, bought by citizens in 1908, was once part of the Stone House farm.", "The Village's police headquarters (1972) stands on former Stone House land, in front of the house.", "The house's National Register record lists its styles as Queen Anne and Shingle, for the 19th-century additions."],
      timeline: [{ y: 1680, t: "Named in Newark's land grant" }, { y: "1773–91", t: "Bethuel Pierson's stone addition" }, { y: 1866, t: "Vose, then Brewer (\"Aldworth\")" }, { y: 1916, t: "Sold to the Albees" }, { y: 1953, t: "Bought by the Village" }, { y: 1991, t: "National Register" }, { y: 2020, t: "Ten Most Endangered" }],
      sources: [S.nr("Stone House by the Stone House Brook", "d73c09bc-36a7-496d-9bdb-84704a0a48c3"), S.nris("Stone House by the Stone House Brook", "87001333"), S.wiki("Stone House by the Stone House Brook", "Stone_House_by_the_Stone_House_Brook"), S.sohps, "shaw", NR_MONTROSE]
    },

    villagehall: {
      name: "Village Hall", type: "Civic building", kind: "civic", place: "villagehall", built: 1895, builtLabel: "1894–95",
      address: "101 South Orange Avenue at Scotland Road", lat: 40.74611, lon: -74.25833,
      designation: "National Register 1976 · NJ Register 1975 · local landmark", architect: "Rossiter & Wright",
      photos: [{ src: "img/landmarks/villagehall.jpg", hero: true, year: 2009, caption: "Village Hall and its clock tower on South Orange Avenue", credit: "Jim.henderson / Wikimedia Commons", license: "Public domain", link: "https://commons.wikimedia.org/wiki/File:So_Orange_Av_tower_jeh.JPG" }],
      tagline: "The half-timbered hall the citizens insisted on, home to the trustees, the firemen and the police for over a century.",
      sections: [
        { h: "Twenty-five years in rented rooms", p: [
          "For their first 25 years the Village trustees met in rented rooms: first upstairs in the Smith & Lum building, which they shared with the library, then in the Becker Building at 6 and 8 South Orange Avenue. The village clerk kept the records at his house.",
          "On December 15, 1892 Trustee Timothy Barrett proposed $5,000 in bonds for a building for the trustees, the clerk and the fire and water departments."] },
        { h: "The citizens choose the site", p: [
          "In February 1894 the trustees chose a church-owned lot at Prospect and Irvington Avenues. At a hearing on March 13, 1894, about 90 percent of the citizens present opposed it: they wanted their hall on South Orange Avenue, where everyone would see it. The trustees bought the Roth property at Scotland Street instead, facing the Columbian School across the avenue.",
          "Final plans by Rossiter & Wright of New York were accepted on July 23, 1894, and contracts worth $12,171 were let on August 6. Mr. Wright lived in South Orange. The bell went up on January 17, 1895, and the hall opened at the trustees' meeting of March 18, 1895."] },
        { h: "Hall, firehouse and police station", p: [
          "The building combined offices with a firehouse. A 50-foot tower carried a belfry, and fire hose was hung inside it to dry. The firemen stayed until 1930. Around then the belfry was probably removed and the 1,000-pound bell \"disappeared\". The police and court used the building until 1972.",
          "The National Register nomination describes brick lower walls under stucco and half-timbering, a slate roof, and an octagonal clock tower with a copper dome. The only exterior change it found was the enclosure of the three arches at the entrance."] },
        { h: "A second life", p: [
          "Village offices moved to 76 South Orange Avenue in October 2013. In 2014 the Historic Preservation Commission urged the trustees to keep the building in Village hands, but in 2016 it was sold to Landmark Hospitality for $1.2 million. The restaurant and beer garden opened in November 2022.",
          "Local legend says the hall's clock inspired The Secret of the Old Clock, the first Nancy Drew book (1930). The Stratemeyer Syndicate that produced the series was based in neighboring Maplewood. No source confirms the story."] }
      ],
      facts: ["A box of documents is sealed behind the bronze tablet at the entrance.", "Edward Self gave the dedication address in 1895; Self Place is named for him.", "Around 1975 the hall's history noted that only one other New Jersey municipality, Loch Arbour, was incorporated as a village."],
      timeline: [{ y: 1892, t: "Bonds proposed" }, { y: 1894, t: "Citizens reject the Irvington Avenue site" }, { y: 1895, t: "Opens March 18" }, { y: 1930, t: "Firemen leave" }, { y: 1976, t: "National Register" }, { y: 2013, t: "Offices move out" }, { y: 2022, t: "Reopens as a restaurant" }],
      sources: ["soplVH", S.nr("South Orange Village Hall", "7b7019c2-f7e2-43db-aec9-ce246907eaca"), S.wiki("South Orange Village Hall", "South_Orange_Village_Hall"), S.hpcLetter, S.vh101]
    },

    station1916: {
      name: "South Orange Station", type: "Railroad station", kind: "transport", place: "station1916", built: 1916, builtLabel: "1916",
      address: "19 Sloan Street (Wikipedia: 17)", lat: 40.74583, lon: -74.26083,
      designation: "National Register 1984 · local landmark", architect: "Frank J. Nies",
      photos: [{ src: "img/landmarks/station1916.jpg", hero: true, year: 2010, caption: "South Orange station from Sloan Street", credit: "Jim.henderson / Wikimedia Commons", license: "CC0", link: "https://commons.wikimedia.org/wiki/File:So_Orange_sta_Sloan_sunny_jeh.jpg" }],
      tagline: "The elevated station that lifted the Lackawanna above the streets, where Edison drove the first electric train.",
      sections: [
        { h: "The railroad arrives", p: [
          "The Morris & Essex Railroad reached South Orange in September 1837: a preliminary trip on the 17th and regular service from the 28th. Local histories also mention a horse-drawn line in 1836 and a first run on October 2, 1837. The railroad made South Orange \"a suburb of Newark and a summer resort.\"",
          "In 1901 the old ground-level station on this site handled 87 trains a day."] },
        { h: "Up on the embankment", p: [
          "In 1914 the Delaware, Lackawanna & Western began raising its tracks above the streets through town. Frank J. Nies's new station opened on February 1, 1916. It was the first on the line to be raised on cylindrical concrete piers, ahead of the East Orange and Brick Church stations.",
          "The station survey calls the style Renaissance Revival with Prairie-style elements, and notes that its big east window echoes the firehouse across the street."] },
        { h: "Edison's train and Midtown Direct", p: [
          "In September 1930 \"a frail Thomas Edison\" inaugurated electric service between Hoboken and South Orange; sources give the 3rd or the 22nd. Traffic peaked at 112 trains a day in 1940.",
          "Midtown Direct service began on June 10, 1996. It cut the trip to Midtown Manhattan from about 50 to 35 minutes and set off the station-area apartment building of the 2000s."] }
      ],
      facts: ["The station's centennial was celebrated in 2016.", "The NR record gives 19 Sloan Street; Wikipedia gives 17."],
      timeline: [{ y: 1837, t: "Railroad reaches South Orange" }, { y: 1916, t: "Elevated station opens" }, { y: 1930, t: "Edison's electric train" }, { y: 1940, t: "Peak: 112 trains a day" }, { y: 1984, t: "National Register" }, { y: 1996, t: "Midtown Direct" }],
      sources: ["station", S.stationSurvey, S.nris("South Orange Station", "84002669"), "hpcTime", "wiki"]
    },

    mountainstation: {
      name: "Mountain Station", type: "Railroad station", kind: "transport", place: "mountainstation", built: 1915, builtLabel: "1870s; rebuilt 1915",
      address: "449 Vose Avenue", lat: 40.75530, lon: -74.25284,
      designation: "National Register 1984 · key property, Montrose Park HD", architect: "Frank J. Nies or his staff",
      photos: [{ src: "img/landmarks/mountainstation.jpg", hero: true, year: 2014, caption: "Mountain Station platform", credit: "Adam Moss / Wikimedia Commons", license: "CC BY-SA 2.0", link: "https://commons.wikimedia.org/wiki/File:Mountain_Station_-_platform.jpg" }],
      tagline: "Montrose's own station, first built by its developers and rebuilt in 1915, with a waiting-room landscape in tile.",
      sections: [
        { h: "A developers' depot", p: [
          "John Gorham Vose and Henry A. Page, who laid out Montrose in 1867–74, \"built the depot at Montrose station… at their own expense.\" The stop was first called Montrose. Telephones arrived here and at the South Orange station on December 6, 1879.",
          "In 1901 the original station on the site handled 74 trains a day."] },
        { h: "The 1915 station", p: [
          "The present Renaissance Revival station dates from 1915, by Frank J. Nies or his staff. (The Montrose Park nomination says c. 1910.) It is the only place where the Lackawanna did not change the level of the roadbed, so Montrose Avenue was raised onto a bridge instead.",
          "Over the water fountain in the main waiting room is a tile panel of a forest scene with a stream, hills and a waterfall, meant \"to recall a Tiffany-like art glass window.\""] }
      ],
      facts: ["Traffic peaked at 96 trains a day in 1940.", "It is one of the 40 key properties of the Montrose Park Historic District."],
      timeline: [{ y: "1870s", t: "Vose & Page build the depot" }, { y: 1879, t: "First telephones" }, { y: 1915, t: "Present station" }, { y: 1984, t: "National Register" }, { y: 1997, t: "Key property in the historic district" }],
      sources: ["mtnStation", S.mtnSurvey, S.nris("Mountain Station", "84002656"), "whittemore", NR_MONTROSE]
    },

    firehq: {
      name: "Fire Headquarters", type: "Firehouse", kind: "civic", place: "firehq", built: 1926, builtLabel: "1925–26",
      address: "First & Sloan Streets", lat: 40.74528, lon: -74.26083,
      designation: "National Register 1998 · NJ Register 1998 · local landmark", architect: "Arthur Dillon (with Henry L. Beadel)",
      photos: [{ src: "img/landmarks/firehq.jpg", hero: true, year: 2009, caption: "The 1926 firehouse at First and Sloan Streets", credit: "Jim.henderson / Wikimedia Commons", license: "Public domain", link: "https://commons.wikimedia.org/wiki/File:So_Orange_Fire_sta_jeh.JPG" }],
      tagline: "A Norman-style firehouse set on the diagonal, built for a department that began in a railroad roundhouse.",
      sections: [
        { h: "From roundhouse to Village Hall", p: [
          "The volunteer fire department organized on February 2, 1891, and was first housed in the railroad roundhouse at the foot of Lackawanna Place. (The library's history says a stable on Vose Avenue.) In 1895 it moved into the new Village Hall."] },
        { h: "A Norman firehouse", p: [
          "Construction began in 1925 and the building was finished by December 1926. It is a three-story masonry firehouse in the French Eclectic or Norman Revival style, set on a 45-degree diagonal to Sloan and First Streets. Most sources say the firemen moved over from Village Hall in 1930, which leaves a puzzling gap after the 1926 completion.",
          "The building closed on April 22, 2002 because of asbestos and was later renovated. Since 2022 it has served the South Essex Fire Department, which merged the South Orange and Maplewood departments."] }
      ],
      facts: ["The firehouse nomination says Arthur Dillon also designed the Connett library; the library's own 1896 report credits Stephenson & Greene.", "The station survey notes the firehouse and the 1916 station were designed to face each other."],
      timeline: [{ y: 1891, t: "Fire department organized" }, { y: 1895, t: "Moves into Village Hall" }, { y: 1926, t: "Firehouse completed" }, { y: 1930, t: "Firemen move in" }, { y: 1998, t: "National Register" }, { y: 2022, t: "South Essex Fire Department" }],
      sources: ["nrFire", S.nris("South Orange Fire Department", "98000255"), S.wiki("South Orange Fire House", "South_Orange_Fire_House"), "soplVH", "hpcTime"]
    },

    kelly: {
      name: "Kelly Carriage House", type: "Estate carriage house", kind: "house", place: "kelly", built: 1887, builtLabel: "1887",
      address: "Seton Hall University, South Orange Avenue", lat: 40.7425, lon: -74.2462, approx: true,
      designation: "National Register 1975 · NJ Register 1980 · local landmark", architect: "John E. Baker",
      photos: [{ src: "img/landmarks/kelly.jpg", hero: true, year: 2020, caption: "The Kelly Carriage House, now the Monella Art Center", credit: "Marielouiseleone / Wikimedia Commons", license: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Eugene_V._Kelly_Carriage_House_front_view.jpg" }],
      tagline: "All that is left of a banker's Queen Anne estate: a brick carriage house with a romantic stair turret, now an art gallery.",
      sections: [
        { h: "A banker's country place", p: [
          "Eugene Kelly was born in County Tyrone, Ireland, went into dry goods and banking in San Francisco in 1850, and founded banks in San Francisco and New York in 1861. He married Margaret Hughes, a niece of Archbishop John Hughes, and became a Seton Hall trustee and patron from 1879. He was also a founder of the Catholic University of America.",
          "Kelly bought this property, once Baldwin land, in 1867. In 1887 he enlarged the house in the Queen Anne style. The house is now demolished."] },
        { h: "The carriage house", p: [
          "Kelly moved the old barns and had local architect John E. Baker design a brick carriage house with terra-cotta panels and a stair turret. It originally had mahogany horse stalls with brass nameplates, and grooms' rooms upstairs.",
          "Seton Hall bought the Kelly estate in 1901 for the bishop's residence. The carriage house became the Father Vincent Monella Art Center, with a glass entry wall set inside its main arch."] }
      ],
      facts: ["The nomination calls it \"Eugene V. Kelly\"; that may be the banker's son.", "It is Seton Hall's only building on the National Register."],
      timeline: [{ y: 1867, t: "Kelly buys the estate" }, { y: 1887, t: "Carriage house built" }, { y: 1901, t: "Seton Hall buys the estate" }, { y: 1975, t: "National Register" }],
      sources: ["nrKelly", S.nris("Eugene V. Kelly Carriage House", "75001136"), S.wiki("Eugene V. Kelly Carriage House", "Eugene_V._Kelly_Carriage_House"), NR_MONTROSE]
    },

    montrosepark: {
      name: "Montrose Park Historic District", type: "Historic district", kind: "house", place: "montrosepark", built: 1867, builtLabel: "1867–1930",
      address: "South Orange Avenue to the Orange line, the railroad to the Newark line", lat: 40.74917, lon: -74.24778,
      designation: "National Register 1997 · NJ Register 1997 · local historic district",
      tagline: "Two developers' visions, 1,129 buildings, gaslight and bluestone: the Village's first historic district.",
      sections: [
        { h: "Vose's Montrose (1867–74)", p: [
          "John Gorham Vose assembled more than 175 acres, beginning with the 70-acre H. M. Graham farm. With Henry A. Page he laid out streets \"to attract wealthy New York businessmen to rural South Orange.\" His deeds allowed one house per lot \"appropriate for a gentleman's country residence.\" Lewis P. Taylor's May 1873 map shows Vose's lots, on Montrose, Raymond, Ralston, Charlton, Irving and Grove.",
          "Vose drowned himself at Atlantic City on March 17, 1874, aged 45, perhaps under the strain of the Panic of 1873."] },
        { h: "Kingman's Montrose Park (1891)", p: [
          "On February 10, 1891 the Village annexed the land east of Centre Street. Thomas S. Kingman's syndicate, with Henry Finlay and William F. Havemeyer, developed the old Aaron Bishop Baldwin farm there. They built Hartford, Stanley and Kingman Roads, graded Centre Street, and required lots of at least 100 by 200 feet. By 1896 there were about forty houses costing $6,000 to $25,000.",
          "Seton Hall sold its last dairy tract in 1922, and by 1928 it was built up as University, Fielding, Elm, Warren and Marshall Courts."] },
        { h: "The district today", p: [
          "Listed in 1997, the district has 1,129 buildings plus Grove Park, including 40 key properties. The nomination calls its streets \"lit by Victorian gaslight,\" with bluestone sidewalks and Belgian-block gutters. The styles run from Vose-era Italianate and Second Empire through Queen Anne, Shingle, Colonial Revival and Tudor.",
          "As of October 2024 the 40 key properties were the only houses in the Village designated as historic."] }
      ],
      facts: ["Stanley Road is named for the explorer Henry M. Stanley.", "\"Hilltop\" at 140 Raymond Avenue (1866–68) had an elevator.", "The Prairie School architect George W. Maher designed a house here in 1899; it has been demolished."],
      timeline: [{ y: 1867, t: "Vose & Page begin Montrose" }, { y: 1873, t: "Taylor's map" }, { y: 1891, t: "Annexation; Kingman syndicate" }, { y: 1922, t: "Seton Hall farm courts" }, { y: 1997, t: "National Register" }],
      sources: [NR_MONTROSE, S.nris("Montrose Park Historic District", "97000978"), "mpWiki", "whittemore", "ordinance"]
    },

    setonhall: {
      name: "Seton Hall's Chapel and Presidents Hall", type: "College buildings", kind: "culture", place: "chapel", built: 1863, builtLabel: "1860–1870",
      address: "400 South Orange Avenue", lat: 40.74221, lon: -74.24789,
      designation: "Chapel: local landmark (2016 ordinance)", architect: "Jeremiah O'Rourke (search snippets only)",
      photos: [{ src: "img/landmarks/setonhall.jpg", hero: true, year: 1997, caption: "Presidents Hall, Seton Hall University", credit: "Bmzuckerman / Wikimedia Commons", license: "CC BY 4.0", link: "https://commons.wikimedia.org/wiki/File:Victorian_Gothic_-_South_Orange,_NJ_-_Seton_Hall_University_(Presidents_Hall)_(1).jpg" }],
      tagline: "The college that moved to a 60-acre estate in 1860 and grew into a university around its chapel.",
      sections: [
        { h: "From Madison to South Orange", p: [
          "Bishop James Roosevelt Bayley founded Seton Hall in Madison on September 1, 1856. In April 1860 he bought about 60 acres on both sides of South Orange Avenue from the Elphinstone family, including \"a marble villa, farmhouse, and stables.\" The first college building opened that September.",
          "The 2021 Master Plan's statement that Seton Hall bought the tract \"in 1856\" confuses the founding with the move."] },
        { h: "The chapel and the seminary", p: [
          "The Chapel of the Immaculate Conception has three dates: built in 1862 according to Whittemore, cornerstone laid May 21, 1863 according to the university, and dedicated in 1870. Presidents Hall, the seminary building, was completed in 1867.",
          "The main building burned on March 9, 1886, and another fire in 1909 destroyed a classroom building and several dormitories."] },
        { h: "A university", p: [
          "Seton Hall became a university in 1950, won the NIT in 1953 and became fully coeducational in 1968. Walsh Gymnasium opened in 1941 and the Walsh Library in 1994.",
          "On January 19, 2000 an arson fire in Boland Hall killed three students."] }
      ],
      facts: ["Seton Hall's radio station WSOU has broadcast from campus since 1948.", "The Pirates lost the 1989 NCAA final 79–80 in overtime."],
      timeline: [{ y: 1856, t: "Founded in Madison" }, { y: 1860, t: "Moves to South Orange" }, { y: 1863, t: "Chapel cornerstone" }, { y: 1867, t: "Presidents Hall" }, { y: 1950, t: "University" }, { y: 2000, t: "Boland Hall fire" }],
      sources: ["seton", "nrMontrose", "whittemore", "pirates", "boland", "ordinance"]
    }
  };
})();
