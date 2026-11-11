"use client";

import Link from "next/link";
import { useState } from "react";
import { shop, useShop, type SavedProduct } from "@/lib/shop-store";
import { imageUrl, priceText } from "@/lib/site";
import { pickable, useLive } from "@/lib/use-live";

/** Wishlist (saved on this device): add a piece to the bag in its size, or remove it. */
export function WishlistView() {
  const { wish } = useShop();
  const live = useLive(wish.map((w) => w.slug));
  const [choosing, setChoosing] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const add = (p: SavedProduct, size: string | null) => {
    shop.add(p, size);
    setChoosing(null);
    setAdded(p.slug);
    window.setTimeout(() => setAdded((a) => (a === p.slug ? null : a)), 2500);
  };

  return (
    <main className="sf-listing">
      <section className="sf-page-head">
        <div className="container">
          <div className="section-label">Saved on this device</div>
          <h1 className="sf-page-title">Wishlist</h1>
          <p className="sf-page-intro">
            {wish.length ? `${wish.length} saved ${wish.length === 1 ? "piece" : "pieces"}` : "Tap the heart on any piece to save it here."}
          </p>
        </div>
      </section>
      <section className="featured-section sf-listing-grid">
        <div className="container">
          {wish.length ? (
            <div className="pc-grid">
              {wish.map((p) => {
                const l = live?.[p.slug];
                const sizes = pickable(l);
                const gone = live && (!l?.found || l.sold_out);
                const one = sizes.length === 1 && !sizes[0]!.size;
                return (
                  <article key={p.slug} className="pc wish-card">
                    <Link href={`/product/${p.slug}`} className="pc-link">
                      <div className="product-media-box">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="product-img" src={imageUrl(p.thumbnail, "card") ?? ""} alt={p.title} loading="lazy" />
                        ) : null}
                        {gone ? <span className="pc-flag">Sold out</span> : null}
                      </div>
                      <div className="pc-info">
                        <span className="pc-cat">{p.category}</span>
                        <h3 className="pc-title">{p.title}</h3>
                        <span className="pc-price">{priceText({ ...p, price_from_paise_per_m: null })}</span>
                      </div>
                    </Link>
                    <button type="button" className="wish-remove" aria-label={`Remove ${p.title}`} onClick={() => shop.toggleWish(p)}>
                      &times;
                    </button>
                    <div className="wish-actions">
                      {p.kind === "fabric" ? (
                        <Link href={`/product/${p.slug}`} className="wish-btn">
                          Enquire
                        </Link>
                      ) : gone ? (
                        <span className="wish-note">Sold out for now</span>
                      ) : added === p.slug ? (
                        <Link href="/bag" className="wish-btn is-done">
                          Added &middot; View bag
                        </Link>
                      ) : choosing === p.slug ? (
                        <div className="size-chips" role="group" aria-label="Choose a size">
                          {sizes.map((s) => (
                            <button key={s.size ?? "one"} type="button" className="size-chip" onClick={() => add(p, s.size)}>
                              {s.size ?? "One size"}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="wish-btn"
                          disabled={!live}
                          onClick={() => (one ? add(p, null) : setChoosing(p.slug))}
                        >
                          Add to bag
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="sf-empty">
              Nothing saved yet. <Link href="/shop">Browse the collection</Link> or <Link href="/mahib">MAHIB</Link>.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
