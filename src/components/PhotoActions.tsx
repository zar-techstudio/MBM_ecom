"use client";

import { useState } from "react";
import type { ProductCard } from "@/lib/catalogue";
import { Stars } from "./Stars";
import { WishHeart } from "./WishHeart";

/** On the product photo: rating badge (bottom left), wishlist and share (top right). */
export function PhotoActions({ product, url }: { product: ProductCard; url: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const data = { title: product.title, text: `${product.title} at MAQDOOM'S Big Mall`, url };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // closed the share sheet: nothing to do
    }
  };
  return (
    <>
      <div className="pa-side">
        <WishHeart product={product} className="wish-heart pa-btn" />
        <button type="button" className="wish-heart pa-btn" aria-label="Share" onClick={() => void share()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 3L10 14" />
            <path d="M21 3l-7 18-4-7-7-4z" />
          </svg>
        </button>
        {copied ? <span className="pa-copied">Link copied</span> : null}
      </div>
      {product.rating?.count ? (
        <a href="#reviews" className="pa-rating" aria-label={`Rated ${product.rating.average.toFixed(1)} from ${product.rating.count} reviews`}>
          <strong>{product.rating.average.toFixed(1)}</strong>
          <Stars value={1} size={12} />
          <span>| {product.rating.count}</span>
        </a>
      ) : null}
    </>
  );
}
