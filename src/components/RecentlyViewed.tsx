"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ProductCard } from "@/lib/catalogue";
import { shop, toSaved, useShop } from "@/lib/shop-store";
import { imageUrl, priceText } from "@/lib/site";

/** "Recently viewed" row (saved on this device). Hidden when there is nothing to show. */
export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const { seen } = useShop();
  const list = seen.filter((p) => p.slug !== exclude).slice(0, 10);
  if (!list.length) return null;
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
