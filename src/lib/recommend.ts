import type { Look, ProductCard } from "./catalogue";

/*
 * Recommendations by content (no shopper tracking needed). Every in-stock piece gets a score
 * against what the shopper is looking at, and the highest scores win. Two modes:
 *
 *  - "similar" (product page, "More like this"): alternatives to the piece being viewed.
 *    Same category matters most, then a similar price, the same colour and style words in the
 *    name, and the same store (MAHIB or Maqdoom's).
 *  - "complete" (bag, "Complete Your Look" / "You May Also Like"): pieces that go WITH what is in
 *    the bag. Categories that staff put together in outfits (sherwani + safa + mojri) count most,
 *    then pieces in the same outfit, matching colour words and a price in the same range; a
 *    second piece of a category already in the bag counts against.
 *
 * Later, once there are real orders, "often bought together" can be added as one more score.
 */

type Mode = "similar" | "complete";

/* Words in product names that say nothing about how a piece looks. */
const STOP = new Set([
  "set", "with", "and", "the", "for", "men", "mens", "piece", "pieces", "new", "design", "designer",
  "sherwani", "kurta", "suit", "suits", "shoes", "shoe", "pagdi", "safa", "waistcoat", "jacket",
  "indo", "western", "dhoti", "pajama", "bandhgala", "necklace", "mojri", "mojari", "brooch",
]);

const words = (title: string) =>
  new Set(
    title
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );

const price = (p: ProductCard) => p.price_min_paise ?? p.price_from_paise_per_m ?? null;

/** 1 when two prices are equal, falling to 0 when one is 3x the other. */
function priceMatch(a: number | null, b: number | null) {
  if (!a || !b) return 0;
  return Math.max(0, 1 - Math.abs(Math.log(a / b)) / Math.log(3));
}

/** Which categories are worn together, learned from the outfits staff build: "sherwanis" ->
 * {"headwear", "footwear", ...}. */
function wornWith(looks: Look[]) {
  const map = new Map<string, Set<string>>();
  for (const l of looks) {
    const cats = [...new Set(l.pieces.map((p) => p.product.category.slug))];
    for (const a of cats) for (const b of cats) if (a !== b) (map.get(a) ?? map.set(a, new Set()).get(a)!).add(b);
  }
  return map;
}

/** Slugs that share an outfit with any of the given pieces. */
function sameOutfit(looks: Look[], slugs: Set<string>) {
  const out = new Set<string>();
  for (const l of looks) {
    if (!l.pieces.some((p) => slugs.has(p.product.slug))) continue;
    for (const p of l.pieces) if (!slugs.has(p.product.slug)) out.add(p.product.slug);
  }
  return out;
}

/**
 * Ranks `pool` for the pieces in `basis` (the product viewed, or everything in the bag).
 * Sold-out pieces and the basis itself are left out. Returns at most `limit` pieces.
 */
export function recommend(basis: ProductCard[], pool: ProductCard[], looks: Look[], mode: Mode, limit = 12): ProductCard[] {
  if (!basis.length) return pool.filter((p) => !p.sold_out).slice(0, limit);
  const have = new Set(basis.map((b) => b.slug));
  const basisCats = new Set(basis.map((b) => b.category.slug));
  const basisSections = new Set(basis.map((b) => b.category.section));
  const basisWords = new Set(basis.flatMap((b) => [...words(b.title)]));
  const basisPrices = basis.map(price).filter((v): v is number => v != null);
  const goesWith = wornWith(looks);
  const partners = new Set([...basisCats].flatMap((c) => [...(goesWith.get(c) ?? [])]));
  const outfit = sameOutfit(looks, have);

  const scored = pool
    .filter((p) => !p.sold_out && !have.has(p.slug) && p.kind !== "empty")
    .map((p, i) => {
      const cat = p.category.slug;
      const shared = [...words(p.title)].filter((w) => basisWords.has(w)).length;
      const pm = Math.max(0, ...basisPrices.map((b) => priceMatch(price(p), b)));
      let s = 0;
      if (mode === "similar") {
        if (basisCats.has(cat)) s += 5;
        s += 2 * pm;
        s += Math.min(shared, 3);
        if (basisSections.has(p.category.section)) s += 1;
        if (outfit.has(p.slug)) s += 1;
      } else {
        if (outfit.has(p.slug)) s += 5;
        if (partners.has(cat)) s += 4;
        if (basisCats.has(cat)) s -= 3; // a second sherwani is rarely what completes the look
        s += Math.min(shared, 3) * 0.8;
        s += pm;
        if (basisSections.has(p.category.section)) s += 0.5;
      }
      if (p.rating?.count) s += (p.rating.average / 5) * 0.5;
      return { p, s, i };
    });
  // Highest score first; ties keep the store's own order (newest first).
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  if (mode === "similar") return scored.slice(0, limit).map((x) => x.p);
  // Completing a look: at most two pieces per category, so the row covers the whole outfit
  // (shoes, headwear, jewellery...) instead of four pairs of shoes.
  const perCat = new Map<string, number>();
  const out: ProductCard[] = [];
  for (const { p } of scored) {
    const n = perCat.get(p.category.slug) ?? 0;
    if (n >= 2) continue;
    perCat.set(p.category.slug, n + 1);
    out.push(p);
    if (out.length === limit) break;
  }
  return out;
}
