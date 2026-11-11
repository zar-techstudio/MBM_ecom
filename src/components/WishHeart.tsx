"use client";

import type { ProductCard } from "@/lib/catalogue";
import { shop, toSaved, useShop } from "@/lib/shop-store";

/** Heart that saves a product to the wishlist (on cards, inside the card's link). */
export function WishHeart({ product, className = "wish-heart" }: { product: ProductCard; className?: string }) {
  const { wish } = useShop();
  const on = wish.some((w) => w.slug === product.slug);
  return (
    <button
      type="button"
      className={`${className}${on ? " on" : ""}`}
      aria-label={on ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
      aria-pressed={on}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        shop.toggleWish(toSaved(product));
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
    </button>
  );
}
