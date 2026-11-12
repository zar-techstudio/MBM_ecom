"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductCard as Card } from "@/lib/catalogue";
import { shop, toSaved, useShop } from "@/lib/shop-store";
import { imageUrl, priceText } from "@/lib/site";
import { CardMedia } from "./CardMedia";
import { Stars } from "./Stars";
import { WishHeart } from "./WishHeart";

/** Product card: 4:5 photo (hold or hover shows the 2nd photo or video), wishlist heart, then
 * category, a two-line title, the price and Add to bag. */
export function ProductCard({ product, hint }: { product: Card; hint?: boolean }) {
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
          {product.sold_out ? <span className="pc-flag">Sold out</span> : null}
        </CardMedia>
        <div className="pc-info">
          <span className="pc-cat">{product.category.name}</span>
          <h3 className="pc-title">{product.title}</h3>
          <span className="pc-bottom">
            <span className={`pc-price${product.sold_out ? " is-out" : ""}`}>{priceText(product)}</span>
            {product.rating?.count ? (
              <span className="pc-rating" aria-label={`Rated ${product.rating.average.toFixed(1)} from ${product.rating.count} reviews`}>
                <Stars value={product.rating.average} size={11} />
                <span>({product.rating.count})</span>
              </span>
            ) : null}
          </span>
        </div>
      </Link>
      <AddToBag product={product} />
    </article>
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
        In bag &middot; View
      </Link>
    );
  return (
    <button type="button" className="pc-add" onClick={() => shop.add(toSaved(product), null)}>
      Add to bag
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
        <div className="sf-tools">
          <label className="sf-tool">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
              <option value="featured">Sort: Recommended</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
          <button
            type="button"
            className={`sf-fchip${inStock ? " on" : ""}`}
            aria-pressed={inStock}
            onClick={() => reset(setInStock)(!inStock)}
          >
            In stock
          </button>
          {usable.length > 1
            ? usable.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  className={`sf-fchip${range === x.id ? " on" : ""}`}
                  aria-pressed={range === x.id}
                  onClick={() => reset(setRange)(range === x.id ? "" : x.id)}
                >
                  {x.label}
                </button>
              ))
            : null}
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
