"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Look, LookPiece } from "@/lib/catalogue";
import { announceAdded, shop, toSaved } from "@/lib/shop-store";
import { formatINR, imageUrl, priceText } from "@/lib/site";
import "@/app/mahib/runway-photo.css";

const pad = (n: number) => String(n).padStart(2, "0");
const ADVANCE_MS = 5000;

/** Where a look sits relative to the one in front: 0 centre, -1 left, 1 right, else hidden. */
function offsetOf(i: number, active: number, count: number) {
  let d = (i - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

/** True when the photo has an opaque background (a normal photo, not a cut-out): its corners
 * are solid. */
function isOpaquePhoto(img: HTMLImageElement) {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const g = c.getContext("2d");
    if (!g) return false;
    g.drawImage(img, 0, 0, 16, 16);
    const d = g.getImageData(0, 0, 16, 16).data;
    const alpha = (x: number, y: number) => d[(y * 16 + x) * 4 + 3];
    return [alpha(0, 0), alpha(15, 0), alpha(0, 15), alpha(15, 15)].every((a) => a > 245);
  } catch {
    return false;
  }
}

/** "Complete look ₹X", or "from ₹X" when a piece has a price range or no price. */
function lookTotal(pieces: LookPiece[]) {
  let sum = 0;
  let from = false;
  for (const { product: p } of pieces) {
    if (p.kind !== "garment" || p.price_min_paise == null) {
      from = true;
      continue;
    }
    sum += p.price_min_paise;
    if (p.price_max_paise != null && p.price_max_paise !== p.price_min_paise) from = true;
  }
  return sum ? `${from ? "from " : ""}${formatINR(sum)}` : "";
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === "left" ? "M14.5 6 8.5 12l6 6" : "M9.5 6l6 6-6 6"} />
    </svg>
  );
}

/**
 * MAHIB runway: a palace hall photo with three teal niches (a wide, a tablet and a phone version);
 * the outfits stand in the niches and step from niche to niche every 5 seconds (paused only while a
 * piece or the panel is open), and can be swiped or stepped with the arrows. Dots on the photo open
 * that piece; "Customize your look" slides in a narrow panel from the right with every piece. Each
 * piece is a normal product that can be bought alone. Placement: runway-photo.css.
 */
export function MahibRunway({ looks }: { looks: Look[] }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<number | null>(null); // piece shown in the product card
  const router = useRouter();
  const [added, setAdded] = useState<string | null>(null); // piece just added from its card
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [solid, setSolid] = useState<Record<string, boolean>>({}); // normal photos (not cut-outs)
  const drag = useRef<{ x: number; id: number } | null>(null);
  const swiped = useRef(false);
  const count = looks.length;
  // The three arches never move and are never empty: with two looks, each also stands in the
  // third arch (the list is repeated); the outfits step from arch to arch.
  const slots = count === 2 ? [...looks, ...looks] : looks;
  const n = slots.length;
  const act = n ? Math.min(active, n - 1) : 0; // stays valid if the list gets shorter
  const look = slots[act];
  const lookNo = count ? act % count : 0;
  const paused = open || pick !== null || count < 2;

  const measure = useCallback((slug: string, img: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return;
    setAspects((a) => (a[slug] ? a : { ...a, [slug]: w / h }));
    if (isOpaquePhoto(img)) setSolid((o) => (o[slug] ? o : { ...o, [slug]: true }));
  }, []);
  const show = useCallback(
    (i: number) => {
      setActive(((i % n) + n) % n);
      setPick(null);
    },
    [n],
  );
  const go = useCallback((step: number) => show(act + step), [act, show]);

  // A link like /mahib?look=the-nikah opens on that outfit.
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("look");
    const i = want ? looks.findIndex((l) => l.slug === want) : -1;
    if (i < 0) return;
    const t = window.setTimeout(() => setActive(i), 0);
    return () => window.clearTimeout(t);
  }, [looks]);

  // Next outfit every 5 seconds, unless the shopper is looking at something or prefers less motion.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(1), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [paused, go]);

  useEffect(() => {
    if (!open && pick === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pick !== null) setPick(null);
      else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pick]);

  if (!count) return null;

  // Every available piece goes into the bag (sizes are chosen there), then the bag opens.
  const buyLook = () => {
    shop.addLook(look.pieces.map((p) => p.product), look.name);
    router.push("/bag");
  };
  const total = lookTotal(look.pieces);
  const picked = pick !== null ? look.pieces[pick] : null;

  return (
    <section
      className={`mahib-runway${open ? " is-open" : ""}`}
      id="runway"
      aria-roledescription="carousel"
      aria-label="MAHIB complete looks"
      onKeyDown={(e) => {
        if (open || pick !== null) return;
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div className="container runway-head">
        <div className="runway-label runway-label-lined">The MAHIB Edit</div>
        <h2 className="runway-title">Every ceremony, styled head to toe.</h2>
        <p className="runway-sub">Complete looks, put together piece by piece for every celebration.</p>
      </div>

      <div
        className="runway-stage rw"
        onPointerDown={(e) => {
          swiped.current = false;
          if (e.pointerType === "mouse") return;
          drag.current = { x: e.clientX, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 45) {
            swiped.current = true;
            go(dx < 0 ? 1 : -1);
          }
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {/* The hall photo and the outfits share one canvas with the photo's shape (runway-photo.css),
            so the outfits always stand in the niches. Same screen rules as the canvas CSS. */}
        <div className="rw-canvas">
          <picture className="rw-bg">
            <source media="(max-width: 767px)" srcSet="/images/mahib-bg-phone.webp" type="image/webp" />
            <source media="(min-width: 768px) and (orientation: portrait)" srcSet="/images/mahib-bg-tablet.webp" type="image/webp" />
            <img src="/images/mahib-bg-wide.webp" alt="" fetchPriority="high" decoding="async" draggable={false} />
          </picture>
          {slots.map((l, i) => {
            const off = offsetOf(i, act, n);
            const pos = off === 0 ? "center" : off === -1 ? "left" : off === 1 ? "right" : "away";
            const photo = Boolean(solid[l.slug]);
            const src = imageUrl(l.image) ?? "";
            return (
              <div key={`${l.slug}-${i}`} className={`rw-model is-${pos}`} aria-hidden={pos === "away"}>
                <span
                  className={`rw-fig ${photo ? "is-photo" : "is-cut"}`}
                  style={{ "--ar": aspects[l.slug] ?? 0.45 } as React.CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={l.image_alt ?? l.name}
                    crossOrigin="anonymous"
                    loading={i === act ? "eager" : "lazy"}
                    draggable={false}
                    ref={(el) => {
                      // Photo already loaded before the page became interactive: onLoad won't fire.
                      if (el?.complete && el.naturalWidth && !aspects[l.slug]) measure(l.slug, el);
                    }}
                    onLoad={(e) => measure(l.slug, e.currentTarget)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rw-reflect" src={src} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                  {pos === "center" ? (
                    <span className="runway-dots">
                      {l.pieces.map((p, n) =>
                        p.x != null && p.y != null ? (
                          <button
                            key={`${p.role}-${n}`}
                            type="button"
                            className={`runway-dot${pick === n ? " active" : ""}`}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            aria-label={`${p.role}: ${p.product.title}`}
                            onClick={() => setPick(pick === n ? null : n)}
                          />
                        ) : null,
                      )}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="runway-hit"
                  tabIndex={pos === "away" ? -1 : 0}
                  aria-label={off === 0 ? `View the pieces in ${l.name}` : `Show ${l.name}`}
                  onClick={() => {
                    if (swiped.current) return;
                    if (off === 0) setOpen(true);
                    else show(i);
                  }}
                />
              </div>
            );
          })}
        </div>

        <button type="button" className="runway-arrow is-prev" aria-label="Previous look" onClick={() => go(-1)}>
          <Chevron dir="left" />
        </button>
        <button type="button" className="runway-arrow is-next" aria-label="Next look" onClick={() => go(1)}>
          <Chevron dir="right" />
        </button>

        {picked ? (
          <div className="runway-card" role="dialog" aria-label={`${picked.role}: ${picked.product.title}`}>
            <button type="button" className="runway-card-close" aria-label="Close" onClick={() => setPick(null)}>
              &times;
            </button>
            <span className="runway-card-img">
              {picked.product.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(picked.product.thumbnail, "card") ?? ""} alt="" />
              ) : null}
            </span>
            <span className="runway-card-text">
              <span className="runway-piece-role">{picked.role}</span>
              <span className="runway-card-title">{picked.product.title}</span>
              <span className="runway-card-price">{picked.product.sold_out ? "Sold out" : priceText(picked.product)}</span>
              <span className="runway-card-actions">
                {picked.product.slug ? (
                  <Link href={`/product/${picked.product.slug}`} className="runway-card-btn is-dark">
                    View details
                  </Link>
                ) : null}
                {picked.product.slug && !picked.product.sold_out ? (
                  added === picked.product.slug ? (
                    <Link href="/bag" className="runway-card-btn">
                      Added &middot; View bag
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="runway-card-btn"
                      onClick={() => {
                        shop.add(toSaved(picked.product), null, 1, look.name);
                        announceAdded(toSaved(picked.product), null);
                        setAdded(picked.product.slug);
                      }}
                    >
                      Add to bag
                    </button>
                  )
                ) : null}
              </span>
            </span>
          </div>
        ) : null}

        <aside className="runway-panel" aria-label={`In this look: ${look.name}`} aria-hidden={!open} inert={!open}>
          <div className="runway-panel-head">
            <span className="runway-label">In this look</span>
            <button type="button" className="runway-close" aria-label="Close" onClick={() => setOpen(false)}>
              &times;
            </button>
          </div>
          <ul className="runway-pieces">
            {look.pieces.map((p, n) => (
              <li key={`${p.role}-${n}`}>
                <button type="button" className={`runway-piece${pick === n ? " active" : ""}`} onClick={() => setPick(n)}>
                  <span className="runway-piece-img">
                    {p.product.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl(p.product.thumbnail, "card") ?? ""} alt="" loading="lazy" />
                    ) : null}
                  </span>
                  <span className="runway-piece-text">
                    <span className="runway-piece-role">{p.role}</span>
                    <span className="runway-piece-name">{p.product.title}</span>
                    <span className="runway-piece-price">{p.product.sold_out ? "Sold out" : priceText(p.product)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="runway-panel-foot">
            {total ? <span className="runway-panel-total">{total}</span> : null}
            <button type="button" className="runway-order" onClick={buyLook}>
              Buy the look
            </button>
          </div>
        </aside>
      </div>

      {/* Dark band under the arches: the look in turn, its price and the two actions. */}
      <div className="runway-band">
        <div className="container runway-bar" aria-live="polite">
          <span className="runway-eyebrow">
            Featured look <i>&middot;</i> {pad(lookNo + 1)} / {pad(count)}
          </span>
          <h3 className="runway-name" key={look.slug}>
            {look.name}
          </h3>
          <div className="runway-buy">
            {total ? <span className="runway-total-price">{total}</span> : null}
            <button type="button" className="runway-shop" onClick={buyLook}>
              Shop the look <span aria-hidden="true">&rarr;</span>
            </button>
            <button type="button" className="runway-custom" onClick={() => setOpen(true)}>
              Customize your look
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="6" cy="18" r="2.6" />
                <circle cx="18" cy="18" r="2.6" />
                <path d="M7.8 16 17 3M16.2 16 7 3" />
              </svg>
            </button>
          </div>
        </div>
      </div>


    </section>
  );
}
