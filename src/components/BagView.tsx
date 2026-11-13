"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Look, ProductCard } from "@/lib/catalogue";
import { shop, useShop, type BagLine } from "@/lib/shop-store";
import { formatINR, imageUrl, priceText, whatsappLink } from "@/lib/site";
import { pickable, priceOf, useLive, type Live } from "@/lib/use-live";
import { AddToBag } from "./ProductCard";
import { RecentlyViewed } from "./RecentlyViewed";
import { WishHeart } from "./WishHeart";

/* Line icons used on the bag page (strokes set in screens.css). */
const I = {
  arrow: (
    <svg className="bx-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10 10.5v6.5M14 10.5v6.5" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7" />
      <circle cx="6.5" cy="17" r="1.8" />
      <circle cx="17" cy="17" r="1.8" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.3l8.5 4.5" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5h16v10H10l-4.5 4v-4H4z" />
      <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
    </svg>
  ),
  info: (
    <svg className="bx-info" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.6v.01" />
    </svg>
  ),
};

/** Why a line can't be ordered as it is, or null when it's fine. */
function problem(line: BagLine, l: Live | undefined) {
  if (!l) return null;
  if (!l.found || l.sold_out) return "Sold out";
  if (l.kind === "fabric") return "Fabric is cut to length in the showroom: ask us on WhatsApp";
  const sizes = pickable(l);
  if (line.size === null && sizes.some((s) => s.size)) return "Choose a size";
  const s = l.sizes.find((x) => x.size === line.size);
  if (!s || s.left <= 0) return "This size is sold out";
  if (s.left < line.qty) return `Only ${s.left} left in this size`;
  return null;
}

/**
 * The bag: every line is checked against live prices and stock. Ordering happens on WhatsApp
 * until online checkout (phone + OTP, payment) is connected; see docs/ECOMMERCE_ROADMAP.md.
 */
export function BagView({
  whatsappNumber,
  siteUrl,
  looks = [],
  suggest = [],
  browseHref = "/mahib",
}: {
  whatsappNumber: string;
  siteUrl: string;
  looks?: Look[];
  /** Pieces to suggest ("You may also like"), newest first. */
  suggest?: ProductCard[];
  /** Where "Continue shopping" and "View all" go (the section that has products). */
  browseHref?: string;
}) {
  const { bag } = useShop();
  const live = useLive(bag.map((l) => l.slug));
  const ready = live !== null;

  const rows = bag.map((line) => {
    const l = live?.[line.slug];
    const sizes = pickable(l);
    // only one size left: it is chosen for the shopper
    const size = line.size ?? (sizes.length === 1 ? sizes[0]!.size : null);
    const unit = priceOf(l, size) ?? line.price_min_paise;
    return { line, l, sizes, size, unit, issue: problem({ ...line, size }, l) };
  });
  const okRows = rows.filter((r) => !r.issue);
  const items = okRows.reduce((n, r) => n + r.line.qty, 0);
  const subtotal = okRows.reduce((n, r) => n + (r.unit ?? 0) * r.line.qty, 0);
  const blocked = rows.some((r) => r.issue);

  // Save sizes that were picked automatically (only one left), so checkout orders the right one.
  const autoSized = rows.filter((r) => r.line.size === null && r.size !== null).map((r) => `${r.line.slug}:${r.size}`).join(",");
  useEffect(() => {
    if (!autoSized) return;
    autoSized.split(",").forEach((pair) => {
      const [slug, size] = pair.split(":");
      if (slug && size) shop.setSize(slug, null, size);
    });
  }, [autoSized]);

  const order = whatsappLink(
    whatsappNumber,
    [
      "Hello, I'd like to order:",
      ...okRows.map(
        (r) =>
          `- ${r.line.title}${r.size ? ` · Size ${r.size}` : ""} × ${r.line.qty} — ${formatINR((r.unit ?? 0) * r.line.qty)}\n  ${siteUrl}/product/${r.line.slug}`,
      ),
      `Total: ${formatINR(subtotal)} (${items} ${items === 1 ? "piece" : "pieces"})`,
      "Payment: online / cash on delivery",
    ].join("\n"),
  );

  if (!bag.length)
    return (
      <main className="sf-bag bx">
        <div className="container bx-wrap">
          <div className="bx-empty">
            <span className="bx-empty-art" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <path className="bx-empty-arch" d="M14 118V62C14 30 36 10 60 2c24 8 46 28 46 60v56" />
                <path className="bx-empty-bag" d="M34 58h52l-4 46H38zM46 58v-6a14 14 0 0 1 28 0v6" />
              </svg>
            </span>
            <h1 className="bx-title">Your Bag is Empty</h1>
            <p className="bx-sub">Your next favourite look is waiting to be discovered.</p>
            <div className="bx-empty-links">
              <Link href="/shop" className="bx-btn">
                Shop the Collection {I.arrow}
              </Link>
              <Link href="/mahib" className="bx-btn is-outline">
                Discover MAHIB {I.arrow}
              </Link>
            </div>
            <div className="bx-divider" aria-hidden="true">
              <span>&#10022;</span>
            </div>
          </div>
          <RecentlyViewed variant="cards" />
          <AlsoLike title="You May Also Like" products={suggest} href={browseHref} />
        </div>
      </main>
    );

  const count = bag.reduce((n, l) => n + l.qty, 0);
  const off = !ready || blocked || !items;
  return (
    <main className="sf-bag bx">
      <div className="container bx-wrap">
        <div className="bx-head">
          <h1 className="bx-title">
            Your Bag <span>({count})</span>
          </h1>
          <Link href={browseHref} className="bx-more">
            Continue Shopping {I.arrow}
          </Link>
        </div>
        <div className="bx-grid">
          <ul className="bx-lines">
            {rows.map(({ line, sizes, size, unit, issue }) => (
              <li key={`${line.slug}-${line.size ?? ""}`} className={`bx-line${issue ? " has-issue" : ""}`}>
                <Link href={`/product/${line.slug}`} className="bx-line-img">
                  {line.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(line.thumbnail, "card") ?? ""} alt="" loading="lazy" />
                  ) : null}
                </Link>
                <div className="bx-line-info">
                  {line.look ? <span className="bx-line-look">From the look &ldquo;{line.look}&rdquo;</span> : null}
                  <Link href={`/product/${line.slug}`} className="bx-line-name">
                    {line.title}
                  </Link>
                  <span className="bx-line-price">{unit != null ? formatINR(unit * line.qty) : ""}</span>
                  {sizes.some((s) => s.size) ? (
                    <label className="bx-size">
                      <span>Size:</span>
                      <select
                        value={size ?? ""}
                        aria-label={`Size for ${line.title}`}
                        onChange={(e) => e.target.value && e.target.value !== line.size && shop.setSize(line.slug, line.size, e.target.value)}
                      >
                        {size ? null : <option value="">Choose</option>}
                        {sizes.map((s) => (
                          <option key={s.size ?? "one"} value={s.size ?? ""}>
                            {s.size}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="bx-line-row">
                    <div className="bx-qty" aria-label="Quantity">
                      <button type="button" aria-label="One less" onClick={() => shop.setQty(line.slug, line.size, line.qty - 1)} disabled={line.qty <= 1}>
                        &minus;
                      </button>
                      <span>{line.qty}</span>
                      <button type="button" aria-label="One more" onClick={() => shop.setQty(line.slug, line.size, line.qty + 1)}>
                        +
                      </button>
                    </div>
                    <span className="bx-line-acts">
                      <button type="button" className="bx-act" onClick={() => shop.saveForLater(line.slug, line.size)}>
                        {I.bookmark}
                        <span>Save for Later</span>
                      </button>
                      <button type="button" className="bx-act" onClick={() => shop.remove(line.slug, line.size)}>
                        {I.trash}
                        <span>Remove</span>
                      </button>
                    </span>
                  </div>
                  {issue ? <p className="bx-issue">{issue}</p> : null}
                </div>
              </li>
            ))}
          </ul>

          <div className="bx-side">
            <aside className="bx-card bx-summary" aria-label="Order summary">
              <h2>Order Summary</h2>
              <div className="bx-sum-row">
                <span>
                  Subtotal ({items} {items === 1 ? "item" : "items"})
                </span>
                <span>{ready ? formatINR(subtotal) : "…"}</span>
              </div>
              <div className="bx-sum-row">
                <span title="Worked out from your address at checkout">Delivery {I.info}</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="bx-sum-row is-total">
                <span>Total</span>
                <span>{ready ? formatINR(subtotal) : "…"}</span>
              </div>
              <Link href="/checkout" className={`bx-btn is-block${off ? " is-off" : ""}`} aria-disabled={off}>
                {I.lock}
                {blocked ? "Fix your bag to continue" : "Proceed to Checkout"} {I.arrow}
              </Link>
              <p className="bx-note">
                Prefer to chat?{" "}
                <a href={off ? undefined : order} target="_blank" rel="noopener noreferrer">
                  Order on WhatsApp
                </a>
              </p>
            </aside>
            <ul className="bx-trust">
              <li>
                {I.truck}
                <span>Cash on Delivery Available</span>
              </li>
              <li>
                {I.box}
                <span>Delivered Across India &amp; Abroad</span>
              </li>
              <li>
                {I.chat}
                <span>Size Help &amp; Support</span>
              </li>
            </ul>
          </div>
        </div>
        <CompleteYourLook looks={looks} inBag={bag.map((l) => l.slug)} suggest={suggest} href={browseHref} />
      </div>
    </main>
  );
}

/** A row of product cards with a heart and Add to bag (bag page). */
function AlsoLike({ title, products, href }: { title: string; products: ProductCard[]; href: string }) {
  if (!products.length) return null;
  return (
    <section className="bx-section" aria-label={title}>
      <div className="bx-section-head">
        <h2>{title}</h2>
        <Link href={href} className="bx-more">
          View All {I.arrow}
        </Link>
      </div>
      <div className="bx-cards">
        {products.slice(0, 6).map((p) => (
          <article key={p.slug} className="bx-pcard">
            <Link href={`/product/${p.slug}`} className="bx-pcard-img" aria-label={p.title}>
              {p.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(p.thumbnail, "card") ?? ""} alt="" loading="lazy" />
              ) : null}
            </Link>
            <WishHeart product={p} />
            <Link href={`/product/${p.slug}`} className="bx-pcard-name">
              {p.title}
            </Link>
            <span className="bx-pcard-price">{priceText(p)}</span>
            <AddToBag product={p} />
          </article>
        ))}
      </div>
    </section>
  );
}

/** Pieces from outfits that a bag item belongs to, which are not in the bag yet; else other
 * pieces the shopper may like. */
function CompleteYourLook({ looks, inBag, suggest, href }: { looks: Look[]; inBag: string[]; suggest: ProductCard[]; href: string }) {
  const have = new Set(inBag);
  const seen = new Set<string>();
  const picks: ProductCard[] = [];
  for (const l of looks) {
    if (!l.pieces.some((p) => have.has(p.product.slug))) continue;
    for (const p of l.pieces) {
      const slug = p.product.slug;
      if (!slug || have.has(slug) || seen.has(slug) || p.product.sold_out) continue;
      seen.add(slug);
      picks.push(p.product);
    }
  }
  // Fewer than three pieces from the outfit: other pieces fill the row.
  const more = suggest.filter((p) => !have.has(p.slug) && !seen.has(p.slug));
  if (picks.length) return <AlsoLike title="Complete Your Look" products={[...picks, ...more].slice(0, Math.max(3, picks.length))} href={href} />;
  return <AlsoLike title="You May Also Like" products={suggest.filter((p) => !have.has(p.slug))} href={href} />;
}
