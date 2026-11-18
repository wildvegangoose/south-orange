/* Historic photographs of specific South Orange houses: Gottscho-Schleisner Collection, Library of Congress
   (each item's rights statement: "No known restrictions on publication"). Owner names only for photos up to 1950. */
var MW = window.MW = window.MW || {};
MW.housePhotos = [
 {
  "address": "540 Grove Terrace",
  "src": "img/houses/540-grove-terrace-2018739688.jpg",
  "year": 1941,
  "caption": "House from the park \u00b7 residence of Mrs. C. D. Henley",
  "credit": "Gottscho-Schleisner, Inc. / Library of Congress",
  "license": "No known restrictions on publication",
  "link": "https://www.loc.gov/item/2018739688/"
 },
 {
  "address": "540 Grove Terrace",
  "src": "img/houses/540-grove-terrace-2018739689.jpg",
  "year": 1941,
  "caption": "Entrance front, from the left \u00b7 residence of Mrs. C. D. Henley",
  "credit": "Gottscho-Schleisner, Inc. / Library of Congress",
  "license": "No known restrictions on publication",
  "link": "https://www.loc.gov/item/2018739689/"
 },
 {
  "address": "540 Grove Terrace",
  "src": "img/houses/540-grove-terrace-2018741226.jpg",
  "year": 1942,
  "caption": "Stair hall \u00b7 residence of Mrs. C. D. Henley",
  "credit": "Gottscho-Schleisner, Inc. / Library of Congress",
  "license": "No known restrictions on publication",
  "link": "https://www.loc.gov/item/2018741226/"
 },
 {
  "address": "487 Berkeley Avenue",
  "src": "img/houses/487-berkeley-avenue-2018738326.jpg",
  "year": 1940,
  "caption": "Library, toward the living room \u00b7 residence of Karl Koeniger",
  "credit": "Gottscho-Schleisner, Inc. / Library of Congress",
  "license": "No known restrictions on publication",
  "link": "https://www.loc.gov/item/2018738326/"
 },
 {
  "address": "236 Crestwood Drive",
  "src": "img/houses/236-crestwood-drive-2018729349.jpg",
  "year": 1957,
  "caption": "East front",
  "credit": "Gottscho-Schleisner, Inc. / Library of Congress",
  "license": "No known restrictions on publication",
  "link": "https://www.loc.gov/item/2018729349/"
 },
 {
  "address": "236 Crestwood Drive",
  "src": "img/houses/236-crestwood-drive-2018729352.jpg",
  "year": 1957,
  "caption": "Entrance front, from the right",
  "credit": "Gottscho-Schleisner, Inc. / Library of Congress",
  "license": "No known restrictions on publication",
  "link": "https://www.loc.gov/item/2018729352/"
 }
];
MW.housePhotosFor = (number, road) => { const n = s => (s || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/\b(AVENUE|AVE|AV|ROAD|RD|STREET|ST|PLACE|PL|TERRACE|TER|DRIVE|DR|COURT|CT)\b/g, '').trim();
  return MW.housePhotos.filter(p => { const m = p.address.match(/^(\d+)\s+(.+)$/); return m && String(number) === m[1] && n(road) === n(m[2]); }); };
