"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Look } from "@/lib/catalogue";
import { imageUrl, priceText, whatsappLink } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

/** Where a look sits relative to the one in front: 0 centre, -1 left, 1 right, else hidden. */
function offsetOf(i: number, active: number, count: number) {
  let d = (i - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

/** Thin gold outline of a Hyderabadi pointed arch, stretched to its box. */
function ArchLine() {
  return (
    <svg className="runway-arch-line" viewBox="0 0 200 400" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1 400 V150 C1 78 58 46 100 2 C142 46 199 78 199 150 V400" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** MAHIB runway: the top complete outfits, each standing in a courtyard arch. Swipe, use the arrows
 * or the tabs; "View the look" lists every piece, each of which is a product that can be bought alone. */
export function MahibRunway({ looks, whatsappNumber, pageUrl }: { looks: Look[]; whatsappNumber: string; pageUrl: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const count = looks.length;
  const look = looks[active];

  const go = useCallback((step: number) => setActive((a) => (a + step + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!count) return null;

  const productUrl = (slug: string) => `${pageUrl.replace(/\/mahib$/, "")}/product/${slug}`;
  const order = whatsappLink(
    whatsappNumber,
    [
      `Hello, I'd like the complete MAHIB look "${look.name}":`,
      ...look.pieces.map((p) => `- ${p.role}: ${p.product.title}${p.product.slug ? ` (${productUrl(p.product.slug)})` : ""}`),
    ].join("\n"),
  );

  return (
    <section
      className={`mahib-runway${open ? " is-open" : ""}`}
      id="runway"
      aria-roledescription="carousel"
      aria-label="MAHIB complete looks"
      onKeyDown={(e) => {
        if (open) return;
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div className="container runway-head">
        <div className="runway-label">The MAHIB Edit</div>
        <h2 className="runway-title">Complete looks for every night of the wedding</h2>
        <p className="runway-sub">Take the whole outfit, or just the piece you love.</p>
      </div>

      <div
        className="runway-stage"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" || open) return;
          drag.current = { x: e.clientX, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="runway-floor" aria-hidden="true" />
        {looks.map((l, i) => {
          const off = offsetOf(i, active, count);
          const pos = off === 0 ? "center" : off === -1 ? "left" : off === 1 ? "right" : "away";
          return (
            <button
              key={l.slug}
              type="button"
              className={`runway-model is-${pos}`}
              aria-hidden={pos === "away"}
              tabIndex={pos === "away" ? -1 : 0}
              aria-label={off === 0 ? `View the pieces in ${l.name}` : `Show ${l.name}`}
              onClick={() => (off === 0 ? setOpen(true) : setActive(i))}
            >
              <span className="runway-arch">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(l.image) ?? ""} alt={l.image_alt ?? l.name} loading={i === 0 ? "eager" : "lazy"} draggable={false} />
              </span>
              <ArchLine />
            </button>
          );
        })}

        <button type="button" className="runway-arrow is-prev" aria-label="Previous look" onClick={() => go(-1)}>
          &larr;
        </button>
        <button type="button" className="runway-arrow is-next" aria-label="Next look" onClick={() => go(1)}>
          &rarr;
        </button>

        <div className="runway-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
        <div
          ref={panelRef}
          className="runway-panel"
          role="dialog"
          aria-label={`In this look: ${look.name}`}
          aria-hidden={!open}
          tabIndex={-1}
          inert={!open}
        >
          <button type="button" className="runway-close" aria-label="Close" onClick={() => setOpen(false)}>
            &times;
          </button>
          <div className="runway-label">In this look</div>
          <h3 className="runway-panel-title">{look.name}</h3>
          <ul className="runway-pieces">
            {look.pieces.map((p) => {
              const thumb = imageUrl(p.product.thumbnail, "card");
              const price = priceText(p.product);
              const body = (
                <>
                  <span className="runway-piece-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
                  </span>
                  <span className="runway-piece-text">
                    <span className="runway-piece-role">{p.role}</span>
                    <span className="runway-piece-name">{p.product.title}</span>
                    <span className="runway-piece-price">
                      {p.product.sold_out ? "Sold out" : price}
                      {p.product.slug ? <span className="runway-piece-buy">Buy alone &rarr;</span> : null}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={`${p.role}-${p.product.title}`}>
                  {p.product.slug ? (
                    <Link href={`/product/${p.product.slug}`} className="runway-piece">
                      {body}
                    </Link>
                  ) : (
                    <div className="runway-piece">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <a className="runway-order" href={order} target="_blank" rel="noopener noreferrer">
            Order the full look on WhatsApp
          </a>
          <p className="runway-panel-note">Every piece is fitted to you. We confirm sizes and price on WhatsApp before you pay.</p>
        </div>
      </div>

      <div className="container runway-caption" aria-live="polite">
        <span className="runway-num" aria-hidden="true">
          {pad(active + 1)}
        </span>
        <div className="runway-caption-text">
          <h3 className="runway-name" key={look.slug}>
            {look.name}
          </h3>
          {look.occasion ? <p className="runway-occasion">{look.occasion}</p> : null}
        </div>
        <button type="button" className="runway-view" onClick={() => setOpen(true)}>
          View the look &middot; {look.pieces.length} pieces
        </button>
      </div>

      <nav className="container runway-tabs" aria-label="Choose a look">
        {looks.map((l, i) => (
          <button
            key={l.slug}
            type="button"
            className={`runway-tab${i === active ? " active" : ""}`}
            aria-current={i === active}
            onClick={() => {
              setActive(i);
              setOpen(false);
            }}
          >
            <span className="runway-tab-num">{pad(i + 1)}</span>
            <span className="runway-tab-name">{l.name.replace(/^The /, "")}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
