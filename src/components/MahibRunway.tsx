"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Look, LookPiece } from "@/lib/catalogue";
import { formatINR, imageUrl, priceText, whatsappLink } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");
const ARCH = 0.62; // width / height of an arch (matches .runway-model in mahib.css)
const MAX_W = 1.3; // a wide photo may spill this far past the arch's sides
const ADVANCE_MS = 5000;

/** Where a look sits relative to the one in front: 0 centre, -1 left, 1 right, else hidden. */
function offsetOf(i: number, active: number, count: number) {
  if (count === 2 && i !== active) return i < active ? -1 : 1; // the other look waits on its own side
  let d = (i - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

/** Size of the photo box inside the arch; the piece dots (in % of the photo) use the same box.
 * A cut-out is shown whole (never cropped). A normal photo (solid background) fills the whole arch
 * instead, like a portrait in a window, so its background never shows as a box. */
function photoBox(aspect: number, fill: boolean) {
  const w = aspect / ARCH;
  if (fill) return w >= 1 ? { width: `${w * 100}%`, height: "100%" } : { width: "100%", height: `${(1 / w) * 100}%` };
  return w <= MAX_W
    ? { width: `${w * 100}%`, height: "100%" }
    : { width: `${MAX_W * 100}%`, height: `${((MAX_W * ARCH) / aspect) * 100}%` };
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

/** Thin gold outline of a Hyderabadi pointed arch, stretched to its box. */
function ArchLine() {
  return (
    <svg className="runway-arch-line" viewBox="0 0 200 400" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1 400 V150 C1 78 58 46 100 2 C142 46 199 78 199 150 V400" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * MAHIB runway: every published outfit stands in a courtyard arch. It moves on every 5 seconds
 * (paused while the shopper is looking at something), and can be swiped or stepped with the arrows. Dots on the photo open that piece; "View the look" slides in a narrow panel from the
 * right with every piece. Each piece is a normal product that can be bought alone.
 */
export function MahibRunway({ looks, whatsappNumber, pageUrl }: { looks: Look[]; whatsappNumber: string; pageUrl: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<number | null>(null); // piece shown in the product card
  const [hovering, setHovering] = useState(false);
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [solid, setSolid] = useState<Record<string, boolean>>({}); // normal photos (not cut-outs)
  const drag = useRef<{ x: number; id: number } | null>(null);
  const swiped = useRef(false);
  const count = looks.length;
  const act = count ? Math.min(active, count - 1) : 0; // stays valid if the list gets shorter
  const look = looks[act];
  const paused = open || pick !== null || hovering || count < 2;

  const measure = useCallback((slug: string, img: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return;
    setAspects((a) => (a[slug] ? a : { ...a, [slug]: w / h }));
    if (isOpaquePhoto(img)) setSolid((o) => (o[slug] ? o : { ...o, [slug]: true }));
  }, []);
  const show = useCallback(
    (i: number) => {
      setActive(((i % count) + count) % count);
      setPick(null);
    },
    [count],
  );
  const go = useCallback((step: number) => show(act + step), [act, show]);

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

  const base = pageUrl.replace(/\/mahib$/, "");
  const link = (p: LookPiece) => (p.product.slug ? ` ${base}/product/${p.product.slug}` : "");
  const orderLook = whatsappLink(
    whatsappNumber,
    [`Hello, I'd like the complete MAHIB look "${look.name}":`, ...look.pieces.map((p) => `- ${p.role}: ${p.product.title}${link(p)}`)].join(
      "\n",
    ),
  );
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
        <div className="runway-label">The MAHIB Edit</div>
        <h2 className="runway-title">Every ceremony, styled head to toe</h2>
      </div>

      <div
        className="runway-stage"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovering(false)}
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
        <div className="runway-scene">
          <div className="runway-floor" aria-hidden="true" />
          {/* The arches stay put; the outfits move from arch to arch on top of them. */}
          <div className="runway-arches" aria-hidden="true">
            {(["left", "center", "right"] as const).map((pos) => (
              <span key={pos} className={`runway-slot is-${pos}`}>
                <span className="runway-arch" />
                <ArchLine />
              </span>
            ))}
          </div>
          {looks.map((l, i) => {
            const off = offsetOf(i, act, count);
            const pos = off === 0 ? "center" : off === -1 ? "left" : off === 1 ? "right" : "away";
            const photo = Boolean(solid[l.slug]);
            const box = photoBox(aspects[l.slug] ?? 0.5, photo);
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl(l.image) ?? ""}
                alt={l.image_alt ?? l.name}
                style={box}
                className={photo ? "runway-photo" : "runway-sticker"}
                crossOrigin="anonymous"
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
                ref={(el) => {
                  // Photo already loaded before the page became interactive: onLoad won't fire.
                  if (el?.complete && el.naturalWidth && !aspects[l.slug]) measure(l.slug, el);
                }}
                onLoad={(e) => measure(l.slug, e.currentTarget)}
              />
            );
            return (
              <div key={l.slug} className={`runway-model is-${pos}`} aria-hidden={pos === "away"}>
                {/* A cut-out stands over the arch and may rise past it (a tall safa is never cut);
                    a normal photo is kept inside the arch's shape. */}
                {photo ? <span className="runway-arch runway-arch-clip">{img}</span> : img}
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
                {pos === "center" ? (
                  <div className="runway-dots" style={box}>
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
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <button type="button" className="runway-arrow is-prev" aria-label="Previous look" onClick={() => go(-1)}>
          &larr;
        </button>
        <button type="button" className="runway-arrow is-next" aria-label="Next look" onClick={() => go(1)}>
          &rarr;
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
                <a
                  className="runway-card-btn"
                  href={whatsappLink(whatsappNumber, `Hello, I'd like this piece from "${look.name}": ${picked.product.title}${link(picked)}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy alone
                </a>
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
            <a className="runway-order" href={orderLook} target="_blank" rel="noopener noreferrer">
              Buy the look
            </a>
          </div>
        </aside>
      </div>

      <div className="container runway-caption" aria-live="polite">
        <span className="runway-num" aria-hidden="true">
          {pad(act + 1)}
        </span>
        <div className="runway-caption-text">
          <h3 className="runway-name" key={look.slug}>
            {look.name}
          </h3>
          {look.occasion ? <p className="runway-occasion">{look.occasion}</p> : null}
        </div>
        <div className="runway-buy">
          {total ? (
            <span className="runway-total">
              <span className="runway-total-label">Complete look · {look.pieces.length} pieces</span>
              <span className="runway-total-price">{total}</span>
            </span>
          ) : null}
          <span className="runway-buy-actions">
            <a className="runway-view is-dark" href={orderLook} target="_blank" rel="noopener noreferrer">
              Buy the look
            </a>
            <button type="button" className="runway-view" onClick={() => setOpen(true)}>
              View the look
            </button>
          </span>
        </div>
      </div>

      <div className="runway-tabs-spacer" />
    </section>
  );
}
