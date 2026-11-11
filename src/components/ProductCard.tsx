"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductCard as Card } from "@/lib/catalogue";
import { imageUrl, priceText } from "@/lib/site";
import { CardMedia } from "./CardMedia";
import { WishHeart } from "./WishHeart";

/** Product card: full-bleed 4:5 photo (hold or hover shows the 2nd photo or video), wishlist heart,
 * then category, a two-line title and the price. Cards sit edge to edge in a hairline grid. */
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
          <span className={`pc-price${product.sold_out ? " is-out" : ""}`}>{priceText(product)}</span>
        </div>
      </Link>
    </article>
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

/** Product grid with sort and filters (shown once there are a few products); shows 12 cards and
 * adds 12 more as the shopper scrolls near the end. */
export function ProductGrid({ products, empty }: { products: Card[]; empty: string }) {
  const [shown, setShown] = useState(PAGE);
  const [sort, setSort] = useState("featured");
  const [range, setRange] = useState("");
  const [inStock, setInStock] = useState(false);
  const end = useRef<HTMLDivElement>(null);

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
          <span className="sf-tools-count">
            {list.length} {list.length === 1 ? "piece" : "pieces"}
          </span>
          <label className="sf-tool">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
              <option value="featured">Sort: Recommended</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
          {usable.length > 1 ? (
            <label className="sf-tool">
              <span className="sr-only">Price</span>
              <select value={range} onChange={(e) => reset(setRange)(e.target.value)}>
                <option value="">Any price</option>
                {usable.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="sf-tool sf-tool-check">
            <input type="checkbox" checked={inStock} onChange={(e) => reset(setInStock)(e.target.checked)} />
            <span>In stock only</span>
          </label>
        </div>
      ) : null}
      {list.length ? (
        <div className="pc-grid">
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
