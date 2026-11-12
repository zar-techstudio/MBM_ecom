"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductCard } from "@/lib/catalogue";
import { imageUrl, priceText } from "@/lib/site";
import { AddToBag } from "./ProductCard";
import { WishHeart } from "./WishHeart";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === "left" ? "M14.5 6 8.5 12l6 6" : "M9.5 6l6 6-6 6"} />
    </svg>
  );
}

/** Home page "Featured products": a sideways row of arch-topped cards with arrows (desktop),
 * swipe (phones) and page dots. */
export function FeaturedRail({ products }: { products: ProductCard[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const measure = () => {
      setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)));
      setPage(Math.round(el.scrollLeft / el.clientWidth));
    };
    const t = window.setTimeout(measure, 0);
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [products.length]);

  const go = (step: number) => {
    const el = row.current;
    if (el) el.scrollBy({ left: step * el.clientWidth, behavior: "smooth" });
  };
  const to = (i: number) => {
    const el = row.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="fr">
      {pages > 1 ? (
        <button type="button" className="fr-arrow is-prev" aria-label="Previous" disabled={page === 0} onClick={() => go(-1)}>
          <Chevron dir="left" />
        </button>
      ) : null}
      <div className="fr-row" ref={row}>
        {products.map((p) => (
          <article key={p.slug} className="fr-card">
            <Link href={`/product/${p.slug}`} className="fr-media" aria-label={p.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(p.thumbnail, "card") ?? ""} alt="" loading="lazy" />
            </Link>
            <WishHeart product={p} />
            <Link href={`/product/${p.slug}`} className="fr-title">
              {p.title}
            </Link>
            <span className="fr-meta">
              {p.category.name}
              <i aria-hidden="true">|</i>
              <b>{priceText(p)}</b>
            </span>
            <AddToBag product={p} />
          </article>
        ))}
      </div>
      {pages > 1 ? (
        <button type="button" className="fr-arrow is-next" aria-label="Next" disabled={page >= pages - 1} onClick={() => go(1)}>
          <Chevron dir="right" />
        </button>
      ) : null}
      {pages > 1 ? (
        <div className="fr-dots">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} type="button" aria-label={`Page ${i + 1}`} className={i === page ? "on" : undefined} onClick={() => to(i)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
