"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductCard as Card } from "@/lib/catalogue";
import { announceAdded, shop, toSaved, useShop } from "@/lib/shop-store";
import { formatINR, imageUrl, priceText } from "@/lib/site";
import { CardMedia } from "./CardMedia";
import { WishHeart } from "./WishHeart";

/** The saving, when the real MRP (from the ERP) is above a single selling price; else null. */
export function saving(p: { mrp_paise?: number | null; price_min_paise: number | null; price_max_paise: number | null }) {
  const price = p.price_min_paise;
  if (!p.mrp_paise || price == null || (p.price_max_paise != null && p.price_max_paise !== price)) return null;
  if (p.mrp_paise <= price) return null;
  const off = Math.round(((p.mrp_paise - price) / p.mrp_paise) * 100);
  return off >= 1 ? { mrp: p.mrp_paise, off } : null;
}

/** Product card: 4:5 photo (hold or hover shows the 2nd photo or video) with the wishlist heart
 * and a round + to add it, then the name, the price and the rating. No big button under every
 * card, so the photo leads and more pieces fit on a phone screen. */
export function ProductCard({ product, hint }: { product: Card; hint?: boolean }) {
  const sale = product.sold_out ? null : saving(product);
  return (
    <article className="pc">
      <Link href={`/product/${product.slug}`} className="pc-link" aria-label={product.title}>
        <CardMedia
          src={imageUrl(product.thumbnail, "card")}
          alt={product.title}
          hover={imageUrl(product.hover_image, "card")}
          video={imageUrl(product.video)}
          hint={hint}
        >
          <WishHeart product={product} />
          {product.sold_out ? <span className="pc-flag">Sold out</span> : sale ? <span className="pc-flag pc-off">{sale.off}% off</span> : null}
        </CardMedia>
        <div className="pc-info">
          <h3 className="pc-title">{product.title}</h3>
          <span className="pc-prices">
            <span className={`pc-price${product.sold_out ? " is-out" : sale ? " is-sale" : ""}`}>{priceText(product)}</span>
            {sale ? <s className="pc-mrp">{formatINR(sale.mrp)}</s> : null}
          </span>
          <span className="pc-orn" aria-hidden="true" />
          {product.rating?.count ? (
            <span className="pc-rating" aria-label={`Rated ${product.rating.average.toFixed(1)} from ${product.rating.count} reviews`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />
              </svg>
              {product.rating.average.toFixed(1)} <span>({product.rating.count})</span>
            </span>
          ) : null}
        </div>
      </Link>
      <span className="pc-zone">
        <QuickAdd product={product} />
      </span>
    </article>
  );
}

/** The round + on the photo: adds a garment (the bag asks for the size) and turns into a tick; tapping
 * the tick takes the piece out of the bag again. Fabric (sold by length) and sold-out pieces have
 * none. */
function QuickAdd({ product }: { product: Card }) {
  const { bag } = useShop();
  if (product.sold_out || product.kind !== "garment") return null;
  const lines = bag.filter((l) => l.slug === product.slug);
  if (lines.length)
    return (
      <button
        type="button"
        className="pc-quick is-in"
        aria-label={`Remove ${product.title} from bag`}
        aria-pressed="true"
        onClick={() => lines.forEach((l) => shop.remove(l.slug, l.size))}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </button>
    );
  return (
    <button
      type="button"
      className="pc-quick"
      aria-label={`Add ${product.title} to bag`}
      onClick={() => {
        shop.add(toSaved(product), null);
        announceAdded(toSaved(product), null);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 8h13l-1 12h-11zM9 8V6.5a3 3 0 0 1 6 0V8" />
        <path className="pc-quick-plus" d="M12 11.5v5M9.5 14h5" />
      </svg>
    </button>
  );
}

/** Adds the piece with no size yet (the bag asks for it, and picks a single size by itself).
 * Fabric is sold by length, so it opens the product page instead. */
export function AddToBag({ product }: { product: Card }) {
  const { bag } = useShop();
  if (product.sold_out) return <span className="pc-add is-off">Sold out</span>;
  if (product.kind !== "garment")
    return (
      <Link href={`/product/${product.slug}`} className="pc-add">
        Choose length
      </Link>
    );
  if (bag.some((l) => l.slug === product.slug))
    return (
      <Link href="/bag" className="pc-add is-in">
        In Bag &middot; View
      </Link>
    );
  return (
    <button type="button" className="pc-add" onClick={() => { shop.add(toSaved(product), null); announceAdded(toSaved(product), null); }}>
      Add to Bag
    </button>
  );
}

const PAGE = 12; // fills whole rows on 2, 3 and 4 columns

const RANGES = [
  { id: "u2", label: "Under ₹2,000", min: 0, max: 200000 },
  { id: "2-10", label: "₹2,000 – ₹10,000", min: 200000, max: 1000000 },
  { id: "10-50", label: "₹10,000 – ₹50,000", min: 1000000, max: 5000000 },
  { id: "50+", label: "Above ₹50,000", min: 5000000, max: Infinity },
];
const priceOf = (p: Card) => p.price_min_paise ?? p.price_from_paise_per_m ?? null;
const VIEW_KEY = "mbm-grid-view"; // "grid" or "list", remembered on the device

/** Product grid with sort and filters (shown once there are a few products); shows 12 cards and
 * adds 12 more as the shopper scrolls near the end. */
export function ProductGrid({ products, empty }: { products: Card[]; empty: string }) {
  const [shown, setShown] = useState(PAGE);
  const [sort, setSort] = useState("featured");
  const [range, setRange] = useState("");
  const [inStock, setInStock] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(VIEW_KEY);
    } catch {}
    if (saved !== "list") return;
    const t = window.setTimeout(() => setView("list"), 0);
    return () => window.clearTimeout(t);
  }, []);
  const pickView = (v: "grid" | "list") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  let list = products;
  if (inStock) list = list.filter((p) => !p.sold_out);
  const r = RANGES.find((x) => x.id === range);
  if (r) list = list.filter((p) => { const v = priceOf(p); return v != null && v >= r.min && v < r.max; });
  if (sort !== "featured")
    list = [...list].sort((a, b) => {
      const va = priceOf(a);
      const vb = priceOf(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      return sort === "low" ? va - vb : vb - va;
    });
  const more = shown < list.length;
  const usable = RANGES.filter((x) => products.some((p) => { const v = priceOf(p); return v != null && v >= x.min && v < x.max; }));
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setShown(PAGE);
  };

  useEffect(() => {
    const el = end.current;
    if (!el || !more) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && setShown((n) => n + PAGE), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, shown]);

  if (!products.length) return <p className="sf-empty">{empty}</p>;
  const tipAt = list.findIndex((p) => p.hover_image || p.video);
  return (
    <>
      {products.length > 4 ? (
        // One scrolling row of pills: Sort and Price open the phone's own picker, In stock toggles.
        <div className="sf-tools sf-pills">
          <label className={`sf-pill${sort !== "featured" ? " on" : ""}`}>
            <PillIcon d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
            <span>{sort === "low" ? "Price ↑" : sort === "high" ? "Price ↓" : "Sort"}</span>
            <Chevron />
            <select aria-label="Sort" value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
              <option value="featured">Recommended</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
          {usable.length > 1 ? (
            <label className={`sf-pill${range ? " on" : ""}`}>
              <PillIcon d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5zM8 8.5h.01" />
              <span>{RANGES.find((x) => x.id === range)?.label ?? "Price"}</span>
              <Chevron />
              <select aria-label="Price" value={range} onChange={(e) => reset(setRange)(e.target.value)}>
                <option value="">Any price</option>
                {usable.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            className={`sf-pill${inStock ? " on" : ""}`}
            aria-pressed={inStock}
            onClick={() => reset(setInStock)(!inStock)}
          >
            <PillIcon d="M12 3 20 7.5v9L12 21l-8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9" />
            In stock
          </button>
          {sort !== "featured" || range || inStock ? (
            <button
              type="button"
              className="sf-pill sf-pill-clear"
              onClick={() => {
                setSort("featured");
                setRange("");
                setInStock(false);
                setShown(PAGE);
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
      {products.length > 4 ? (
        <div className="sf-count-row">
          <p className="sf-tools-count">
            {list.length} {list.length === 1 ? "Piece" : "Pieces"}
          </p>
          <div className="sf-view" role="group" aria-label="Layout">
            <button type="button" className={view === "grid" ? "on" : undefined} aria-pressed={view === "grid"} aria-label="Grid" onClick={() => pickView("grid")}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
                <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" />
                <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" />
                <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" />
              </svg>
            </button>
            <button type="button" className={view === "list" ? "on" : undefined} aria-pressed={view === "list"} aria-label="List" onClick={() => pickView("list")}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7 5h10M7 10h10M7 15h10" />
                <circle cx="3.6" cy="5" r="1" />
                <circle cx="3.6" cy="10" r="1" />
                <circle cx="3.6" cy="15" r="1" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
      {list.length ? (
        <div className={`pc-grid${view === "list" ? " is-list" : ""}`}>
          {list.slice(0, shown).map((p, i) => (
            <ProductCard key={p.slug} product={p} hint={i === tipAt} />
          ))}
        </div>
      ) : (
        <p className="sf-empty">Nothing matches these filters.</p>
      )}
      {more ? (
        <div ref={end} className="sf-more" aria-live="polite">
          <span className="sf-more-dot" />
          <span className="sf-more-dot" />
          <span className="sf-more-dot" />
          <span className="sr-only">Loading more pieces</span>
        </div>
      ) : list.length > PAGE ? (
        <p className="sf-end">You&rsquo;ve seen all {list.length} pieces</p>
      ) : null}
    </>
  );
}

function Chevron() {
  return (
    <svg className="sf-pill-chev" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function PillIcon({ d }: { d: string }) {
  return (
    <svg className="sf-pill-ic" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
