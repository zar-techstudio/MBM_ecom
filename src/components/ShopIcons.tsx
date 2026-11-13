"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProductCard } from "@/lib/catalogue";
import { lensFind, type LensAnswer } from "@/lib/lens-client";
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
  camera: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
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
  const [search, setSearch] = useState<{ photo?: File } | null>(null);
  const bag = bagCount(s);

  // Search bars elsewhere on the page (and their camera buttons) open this search.
  useEffect(() => {
    const open = (e: Event) => setSearch({ photo: (e as CustomEvent<{ photo?: File }>).detail?.photo });
    window.addEventListener("mbm-search", open);
    return () => window.removeEventListener("mbm-search", open);
  }, []);
  return (
    <>
      <button type="button" className="shop-icon" aria-label="Search" onClick={() => setSearch({})}>
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
        <span className={`shop-count${bag ? "" : " is-zero"}`} key={bag}>
          {bag}
        </span>
      </Link>
      {search ? <SearchOverlay photo={search.photo} onClose={() => setSearch(null)} /> : null}
    </>
  );
}

const RECENT_KEY = "mbm-recent-searches";
function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}
/** Remember a search on this phone (latest first, up to 6). */
function remember(term: string) {
  const t = term.trim();
  if (t.length < 2) return;
  try {
    const next = [t, ...readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

type Lens = { status: "loading" | "done" | "error"; preview: string; answer?: LensAnswer; error?: string };

/** Search box with instant suggestions (Enter shows all results), and photo search: take or pick a
 * photo and the closest pieces from the catalogue are shown. */
function SearchOverlay({ onClose, photo }: { onClose: () => void; photo?: File }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCard[] | null>(null);
  const [lens, setLens] = useState<Lens | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const t = window.setTimeout(() => setRecent(readRecent()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const byPhoto = (file: File | undefined) => {
    if (!file) return;
    setQ("");
    setLens({ status: "loading", preview: URL.createObjectURL(file) });
    lensFind(file)
      .then((answer) => setLens((l) => (l ? { ...l, status: "done", answer } : l)))
      .catch((e: Error) => setLens((l) => (l ? { ...l, status: "error", error: e.message } : l)));
  };

  useEffect(() => {
    if (!photo) return;
    const t = window.setTimeout(() => byPhoto(photo), 0);
    return () => window.clearTimeout(t);
  }, [photo]);
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
          remember(q);
          onClose();
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        {Icon.search}
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLens(null);
          }}
          placeholder="Search sherwanis, safas, mojris…"
          aria-label="Search products"
          enterKeyHint="search"
        />
        <label className="search-cam" title="Search with a photo">
          <input type="file" accept="image/*" onChange={(e) => byPhoto(e.target.files?.[0])} aria-label="Search with a photo" />
          {Icon.camera}
        </label>
        <button type="button" className="search-close" onClick={onClose} aria-label="Close search">
          &times;
        </button>
      </form>
      <div className="search-results">
        {lens ? (
          <LensResults lens={lens} onClose={onClose} />
        ) : shown === null ? (
          <div className="search-hints">
            <label className="search-photo-cta">
              <input type="file" accept="image/*" onChange={(e) => byPhoto(e.target.files?.[0])} />
              {Icon.camera}
              <span>
                <strong>Search with a photo</strong>
                <br />
                Saw an outfit you love? Snap it or pick a screenshot and we&rsquo;ll find the closest pieces.
              </span>
            </label>
            {recent.length ? (
              <>
                <p className="search-hint-title">
                  Recent
                  <button
                    type="button"
                    className="co-link search-clear"
                    onClick={() => {
                      try {
                        localStorage.removeItem(RECENT_KEY);
                      } catch {}
                      setRecent([]);
                    }}
                  >
                    Clear
                  </button>
                </p>
                {recent.map((h) => (
                  <button key={h} type="button" className="sf-chip" onClick={() => setQ(h)}>
                    {h}
                  </button>
                ))}
              </>
            ) : null}
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
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={() => {
                      remember(q);
                      onClose();
                    }}
                    className="search-item"
                  >
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
            <Link
              href={`/search?q=${encodeURIComponent(q.trim())}`}
              onClick={() => {
                remember(q);
                onClose();
              }}
              className="search-all"
            >
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

function LensResults({ lens, onClose }: { lens: Lens; onClose: () => void }) {
  return (
    <div className="lens">
      <div className="lens-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lens.preview} alt="Your photo" className={lens.status === "loading" ? "is-scanning" : undefined} />
        <div>
          <p className="search-hint-title">Photo search</p>
          <p className="lens-desc">
            {lens.status === "loading"
              ? "Looking at your photo… this takes a few seconds"
              : lens.status === "error"
                ? lens.error
                : lens.answer?.description || "Here is what we found"}
          </p>
        </div>
      </div>
      {lens.status === "done" ? (
        lens.answer?.products.length ? (
          <ul>
            {lens.answer.products.map((p) => (
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
                      {p.category.name} &middot; {priceText(p)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="search-empty">Nothing close in the shop right now. Send the photo to us on WhatsApp and we&rsquo;ll help.</p>
        )
      ) : null}
    </div>
  );
}
