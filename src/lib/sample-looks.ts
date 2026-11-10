import type { Look, ProductCard } from "./catalogue";

/** Sample outfits for local development only (`next dev`), used while the ERP has no
 * `storefront_looks` function. The live site never shows these: real outfits come from the ERP. */
function piece(role: string, title: string): { role: string; product: ProductCard } {
  return {
    role,
    product: {
      slug: "",
      title,
      thumbnail: null,
      category: { slug: "", name: role, section: "mahib" },
      kind: "garment",
      price_min_paise: null,
      price_max_paise: null,
      price_from_paise_per_m: null,
      sold_out: false,
      featured_in_category: false,
      featured_rank: null,
      home_featured: false,
    },
  };
}

export const SAMPLE_LOOKS: Look[] = [
  {
    slug: "mehendi",
    name: "The Mehendi",
    occasion: "Afternoon · in the garden",
    image: "/images/hero_section_person_d_1.4.webp",
    image_alt: "Bottle-green zari waistcoat over an ivory kurta",
    pieces: [
      piece("Waistcoat", "Bottle-green zari waistcoat"),
      piece("Kurta", "Ivory cotton-silk kurta"),
      piece("Bottom", "Ivory churidar"),
      piece("Footwear", "Gold embroidered mojri"),
    ],
  },
  {
    slug: "nikah",
    name: "The Nikah",
    occasion: "The ceremony · morning light",
    image: "/images/hero_section_person_a_1.1.webp",
    image_alt: "Ivory raw-silk sherwani with a maroon velvet shawl",
    pieces: [
      piece("Sherwani", "Ivory raw-silk sherwani"),
      piece("Shawl", "Maroon velvet zari shawl"),
      piece("Safa", "Ivory and gold safa"),
      piece("Bottom", "Ivory churidar"),
      piece("Footwear", "Ivory mojri"),
    ],
  },
  {
    slug: "baraat",
    name: "The Baraat",
    occasion: "The procession · after dark",
    image: "/images/hero_section_person_c_1.3.webp",
    image_alt: "Black velvet sherwani with gold zardozi",
    pieces: [
      piece("Sherwani", "Black velvet zardozi sherwani"),
      piece("Safa", "Gold tissue safa"),
      piece("Mala", "Pearl kalgi mala"),
      piece("Footwear", "Black velvet mojri"),
    ],
  },
  {
    slug: "reception",
    name: "The Reception",
    occasion: "The evening · black tie",
    image: "/images/hero_section_person_b_1.2.webp",
    image_alt: "Burgundy three-piece suit with a paisley silk tie",
    pieces: [
      piece("Suit", "Burgundy three-piece suit"),
      piece("Shirt", "White poplin shirt"),
      piece("Tie", "Paisley silk tie"),
      piece("Footwear", "Oxblood oxfords"),
    ],
  },
];
