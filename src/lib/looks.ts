/** MAHIB runway: one complete outfit for each night of the wedding.
 *
 * To change a look, edit it here. Photos work best as cutouts (transparent
 * background), full length or waist up, all shot at the same height and distance.
 * Give a piece an `href` (e.g. "/product/ivory-raw-silk-sherwani") once it is in the
 * catalogue and the panel will link to it. */
export type LookPiece = { name: string; note: string; href?: string };

export type Look = {
  id: string;
  name: string;
  occasion: string;
  image: string;
  alt: string;
  pieces: LookPiece[];
};

export const MAHIB_LOOKS: Look[] = [
  {
    id: "mehendi",
    name: "The Mehendi",
    occasion: "Afternoon · in the garden",
    image: "/images/hero_section_person_d_1.4.webp",
    alt: "Bottle-green zari waistcoat over an ivory kurta",
    pieces: [
      { name: "Bottle-green waistcoat", note: "Raw silk, gold zari florals" },
      { name: "Ivory kurta", note: "Cotton silk, mandarin collar" },
      { name: "Ivory churidar", note: "Cut to your length" },
      { name: "Gold pocket square", note: "Hand-folded" },
    ],
  },
  {
    id: "nikah",
    name: "The Nikah",
    occasion: "The ceremony · morning light",
    image: "/images/hero_section_person_a_1.1.webp",
    alt: "Ivory raw-silk sherwani with a maroon velvet shawl",
    pieces: [
      { name: "Ivory raw-silk sherwani", note: "Tone-on-tone hand embroidery" },
      { name: "Maroon velvet shawl", note: "Gold zari jaal, draped over one shoulder" },
      { name: "Ivory churidar", note: "Cut to your length" },
    ],
  },
  {
    id: "baraat",
    name: "The Baraat",
    occasion: "The procession · after dark",
    image: "/images/hero_section_person_c_1.3.webp",
    alt: "Black velvet sherwani with gold zardozi",
    pieces: [
      { name: "Black velvet sherwani", note: "Gold zardozi, hand-finished" },
      { name: "Gold pocket square", note: "Hand-folded" },
      { name: "Black churidar", note: "Cut to your length" },
    ],
  },
  {
    id: "reception",
    name: "The Reception",
    occasion: "The evening · black tie",
    image: "/images/hero_section_person_b_1.2.webp",
    alt: "Burgundy three-piece suit with a paisley silk tie",
    pieces: [
      { name: "Burgundy three-piece suit", note: "Jacket, waistcoat and trousers, tailored to you" },
      { name: "White dress shirt", note: "Cotton poplin" },
      { name: "Paisley silk tie", note: "Woven gold and rust" },
      { name: "Pocket square", note: "Hand-folded" },
    ],
  },
];
