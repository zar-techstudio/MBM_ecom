"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProductCard } from "@/lib/catalogue";
import { bagCount, useShop } from "@/lib/shop-store";
import { imageUrl, priceText } from "@/lib/site";

const Icon = {
  search: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
};

/** Header icons: search, wishlist (desktop; on phones it is in the menu) and bag, with counts. */
export function ShopIcons() {
  const s = useShop();
  const [search, setSearch] = useState(false);
  const bag = bagCount(s);
  return (
    <>
      <button type="button" className="shop-icon" aria-label="Search" onClick={() => setSearch(true)}>
        {Icon.search}
      </button>
      <Link href="/wishlist" className="shop-icon shop-icon-wish" aria-label={`Wishlist, ${s.wish.length} items`}>
        {Icon.heart}
        {s.wish.length ? <span className="shop-count">{s.wish.length}</span> : null}
      </Link>
      <Link href="/account" className="shop-icon shop-icon-user" aria-label="My account">
        {Icon.user}
      </Link>
      <Link href="/bag" className="shop-icon" aria-label={`Bag, ${bag} items`}>
        {Icon.bag}
        {bag ? (
          <span className="shop-count" key={bag}>
            {bag}
          </span>
        ) : null}
      </Link>
      {search ? <SearchOverlay onClose={() => setSearch(false)} /> : null}
    </>
  );
}

/** Search box with instant suggestions; Enter shows all results. */
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCard[] | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d: ProductCard[]) => setResults(d))
        .catch(() => {});
    }, 180);
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  const shown = q.trim().length >= 2 ? results : null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <form
        className="search-bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          onClose();
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        {Icon.search}
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sherwanis, safas, mojris…"
          aria-label="Search products"
          enterKeyHint="search"
        />
        <button type="button" className="search-close" onClick={onClose} aria-label="Close search">
          &times;
        </button>
      </form>
      <div className="search-results">
        {shown === null ? (
          <div className="search-hints">
            <p className="search-hint-title">Popular</p>
            {["Sherwani", "Safa", "Mojri", "Kurta", "MAHIB"].map((h) => (
              <button key={h} type="button" className="sf-chip" onClick={() => setQ(h)}>
                {h}
              </button>
            ))}
          </div>
        ) : shown.length ? (
          <>
            <ul>
              {shown.map((p) => (
                <li key={p.slug}>
                  <Link href={`/product/${p.slug}`} onClick={onClose} className="search-item">
                    <span className="search-item-img">
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(p.thumbnail, "card") ?? ""} alt="" loading="lazy" />
                      ) : null}
                    </span>
                    <span className="search-item-text">
                      <span className="search-item-title">{p.title}</span>
                      <span className="search-item-meta">
                        {p.category.section === "mahib" ? "MAHIB · " : ""}
                        {p.category.name} &middot; {p.sold_out ? "Sold out" : priceText(p)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/search?q=${encodeURIComponent(q.trim())}`} onClick={onClose} className="search-all">
              See all results for &ldquo;{q.trim()}&rdquo; &rarr;
            </Link>
          </>
        ) : (
          <p className="search-empty">Nothing found for &ldquo;{q.trim()}&rdquo;. Try another word, or ask us on WhatsApp.</p>
        )}
      </div>
    </div>
  );
}
