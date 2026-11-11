"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductCard as Card } from "@/lib/catalogue";
import { imageUrl, priceText } from "@/lib/site";
import { CardMedia } from "./CardMedia";

/** Product grid card, using the original design's classes. Hold (phone) or hover (desktop) shows the
 * product's second photo or video when the ERP provides one. */
export function ProductCard({ product, hint }: { product: Card; hint?: boolean }) {
  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-card-link" aria-label={product.title}>
        <CardMedia
          src={imageUrl(product.thumbnail, "card")}
          alt={product.title}
          hover={imageUrl(product.hover_image, "card")}
          video={imageUrl(product.video)}
          hint={hint}
        >
          <span className="product-category-tag">{product.category.name}</span>
          {product.sold_out ? <span className="product-soldout-tag">Sold out</span> : null}
        </CardMedia>
        <div className="product-details">
          <h3 className="product-title">{product.title}</h3>
          <div className="product-price-row">
            <span className="product-price">{priceText(product)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

const PAGE = 12; // fills whole rows on 2, 3 and 4 columns

/** Product grid that shows 12 cards and adds 12 more as the shopper scrolls near the end. */
export function ProductGrid({ products, empty }: { products: Card[]; empty: string }) {
  const [shown, setShown] = useState(PAGE);
  const end = useRef<HTMLDivElement>(null);
  const more = shown < products.length;

  useEffect(() => {
    const el = end.current;
    if (!el || !more) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && setShown((n) => n + PAGE), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, shown]);

  if (!products.length) return <p className="sf-empty">{empty}</p>;
  const tipAt = products.findIndex((p) => p.hover_image || p.video);
  return (
    <>
      <div className="products-grid">
        {products.slice(0, shown).map((p, i) => (
          <ProductCard key={p.slug} product={p} hint={i === tipAt} />
        ))}
      </div>
      {more ? (
        <div ref={end} className="sf-more" aria-live="polite">
          <span className="sf-more-dot" />
          <span className="sf-more-dot" />
          <span className="sf-more-dot" />
          <span className="sr-only">Loading more pieces</span>
        </div>
      ) : products.length > PAGE ? (
        <p className="sf-end">You&rsquo;ve seen all {products.length} pieces</p>
      ) : null}
    </>
  );
}
