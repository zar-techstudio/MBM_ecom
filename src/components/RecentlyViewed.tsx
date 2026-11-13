"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductCard } from "@/lib/catalogue";
import { shop, toSaved, useShop } from "@/lib/shop-store";
import { imageUrl, priceText } from "@/lib/site";

/** "Recently viewed" row (saved on this device). Hidden when there is nothing to show. */
export function RecentlyViewed({ exclude, variant }: { exclude?: string; variant?: "cards" }) {
  const { seen } = useShop();
  const [all, setAll] = useState(false);
  const list = seen.filter((p) => p.slug !== exclude).slice(0, 10);
  if (!list.length) return null;
  if (variant === "cards")
    return (
      <section className="bx-section" aria-label="Recently viewed">
        <div className="bx-section-head">
          <h2>Recently Viewed</h2>
          {list.length > 1 ? (
            <button type="button" className="bx-more" onClick={() => setAll(!all)}>
              {all ? "Show less" : "View All"}
              <svg className="bx-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12h15m-6-6 6 6-6 6" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="bx-recent">
          {(all ? list : list.slice(0, 1)).map((p) => (
            <article key={p.slug} className="bx-recent-card">
              <Link href={`/product/${p.slug}`} className="bx-recent-img" aria-label={p.title}>
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl(p.thumbnail, "card") ?? ""} alt="" loading="lazy" />
                ) : null}
              </Link>
              <div className="bx-recent-text">
                <span className="bx-chip">{p.category}</span>
                <Link href={`/product/${p.slug}`} className="bx-recent-name">
                  {p.title}
                </Link>
                <span className="bx-recent-price">{priceText({ ...p, price_from_paise_per_m: null })}</span>
                <Link href={`/product/${p.slug}`} className="bx-btn is-outline is-small">
                  View Product
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  return (
    <section className="sf-recent" aria-label="Recently viewed">
      <h2 className="sf-recent-title">Recently viewed</h2>
      <div className="sf-recent-row">
        {list.map((p) => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="sf-recent-item">
            <span className="sf-recent-img">
              {p.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(p.thumbnail, "card") ?? ""} alt="" loading="lazy" />
              ) : null}
            </span>
            <span className="sf-recent-name">{p.title}</span>
            <span className="sf-recent-price">{priceText({ ...p, price_from_paise_per_m: null })}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Remembers that this product was viewed (product pages). */
export function TrackView({ product }: { product: ProductCard }) {
  useEffect(() => {
    shop.viewed(toSaved(product));
  }, [product]);
  return null;
}
