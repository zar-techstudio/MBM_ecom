"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Look } from "@/lib/catalogue";
import { shop, toSaved, useShop } from "@/lib/shop-store";
import { formatINR, imageUrl } from "@/lib/site";

const ADVANCE_MS = 6000;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === "left" ? "M14.5 6 8.5 12l6 6" : "M9.5 6l6 6-6 6"} />
    </svg>
  );
}

/** Home page "Shop by ceremony": one MAHIB look at a time in a gold arch on a pedestal, with its
 * pieces, total, Shop the look (everything into the bag) and Add to wishlist. Moves on every few
 * seconds unless the shopper is looking at it; the photo opens that look on the MAHIB runway. */
export function HomeLooks({ looks }: { looks: Look[] }) {
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  const { wish } = useShop();
  const router = useRouter();
  const count = looks.length;
  const look = looks[Math.min(at, count - 1)];
  const go = (step: number) => setAt((i) => (((i + step) % count) + count) % count);

  useEffect(() => {
    if (hold || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setAt((i) => (i + 1) % count), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [at, hold, count]);

  if (!look) return null;
  const pieces = look.pieces.filter((p) => p.product.slug);
  const total = pieces.reduce((n, p) => n + (p.product.price_min_paise ?? 0), 0);
  const saved = pieces.length > 0 && pieces.every((p) => wish.some((w) => w.slug === p.product.slug));
  const runway = `/mahib?look=${encodeURIComponent(look.slug)}#runway`;

  const shopLook = () => {
    pieces.filter((p) => !p.product.sold_out).forEach((p) => shop.add(toSaved(p.product), null, 1, look.name));
    router.push("/bag");
  };
  const saveLook = () => {
    if (saved) return router.push("/wishlist");
    pieces.filter((p) => !wish.some((w) => w.slug === p.product.slug)).forEach((p) => shop.toggleWish(toSaved(p.product)));
  };

  return (
    <section
      className="ls"
      aria-label="Shop by ceremony"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div className="container">
        <div className="ls-head">
          <div className="ls-label">Shop by ceremony</div>
          <h2 className="ls-title">Complete looks, head to toe.</h2>
          <p className="ls-sub">Every piece chosen to go together, from the Nikah to the reception.</p>
        </div>

        <div className="ls-body">
          <div className="ls-stage">
            {count > 1 ? (
              <button type="button" className="ls-arrow is-prev" aria-label="Previous look" onClick={() => go(-1)}>
                <Chevron dir="left" />
              </button>
            ) : null}
            <Link href={runway} className="ls-arch" aria-label={`See ${look.name} on the MAHIB runway`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={look.slug} src={imageUrl(look.image) ?? ""} alt={look.image_alt ?? look.name} loading="lazy" />
              <span className="ls-pedestal" aria-hidden="true" />
            </Link>
            {count > 1 ? (
              <button type="button" className="ls-arrow is-next" aria-label="Next look" onClick={() => go(1)}>
                <Chevron dir="right" />
              </button>
            ) : null}
            {count > 1 ? (
              <div className="ls-dots" role="tablist" aria-label="Looks">
                {looks.map((l, i) => (
                  <button
                    key={l.slug}
                    type="button"
                    role="tab"
                    aria-selected={i === at}
                    aria-label={l.name}
                    className={i === at ? "on" : undefined}
                    onClick={() => setAt(i)}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="ls-info" aria-live="polite">
            <h3 className="ls-name" key={look.slug}>
              {look.name}
            </h3>
            <p className="ls-meta">
              {pieces.length} {pieces.length === 1 ? "Piece" : "Pieces"}
              {total ? (
                <>
                  <i aria-hidden="true">|</i>
                  <b>{formatINR(total)}</b>
                </>
              ) : null}
            </p>
            <p className="ls-desc">
              {look.occasion
                ? `Put together for the ${look.occasion}: every piece chosen to go together.`
                : "Every piece chosen to go together. Buy the whole look, or just the pieces you need."}
            </p>
            <div className="ls-includes">
              <span className="ls-includes-label">Includes</span>
              <ul>
                {pieces.map((p, n) => (
                  <li key={`${p.role}-${n}`}>
                    <Link href={`/product/${p.product.slug}`} className="ls-piece">
                      <span className="ls-piece-img">
                        {p.product.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl(p.product.thumbnail, "card") ?? ""} alt="" loading="lazy" />
                        ) : null}
                      </span>
                      <span className="ls-piece-role">{p.role}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ls-actions">
              <button type="button" className="ls-shop" onClick={shopLook}>
                Shop the look <span aria-hidden="true">&rarr;</span>
              </button>
              <button type="button" className={`ls-wish${saved ? " is-on" : ""}`} onClick={saveLook}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" />
                </svg>
                {saved ? "In your wishlist" : "Add to wishlist"}
              </button>
            </div>
            <Link href="/mahib#runway" className="ls-all">
              All looks <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
