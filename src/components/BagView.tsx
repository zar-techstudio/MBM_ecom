"use client";

import Link from "next/link";
import { useEffect } from "react";
import { shop, useShop, type BagLine } from "@/lib/shop-store";
import { formatINR, imageUrl, whatsappLink } from "@/lib/site";
import { pickable, priceOf, useLive, type Live } from "@/lib/use-live";
import { RecentlyViewed } from "./RecentlyViewed";

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
export function BagView({ whatsappNumber, siteUrl }: { whatsappNumber: string; siteUrl: string }) {
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
      <main className="sf-bag">
        <div className="container">
          <h1 className="sf-bag-title">Your bag is empty</h1>
          <p className="sf-bag-sub">Find something you love in the collection or the MAHIB edit.</p>
          <div className="sf-bag-empty-links">
            <Link href="/shop" className="btn-primary">
              <span>Shop the collection</span>
            </Link>
            <Link href="/mahib" className="btn-outline">
              <span>Discover MAHIB</span>
            </Link>
          </div>
          <RecentlyViewed />
        </div>
      </main>
    );

  return (
    <main className="sf-bag">
      <div className="container">
        <h1 className="sf-bag-title">
          Your bag <span>({bag.reduce((n, l) => n + l.qty, 0)})</span>
        </h1>
        <div className="sf-bag-grid">
          <ul className="sf-bag-lines">
            {rows.map(({ line, sizes, size, unit, issue }) => (
              <li key={`${line.slug}-${line.size ?? ""}`} className={`sf-bag-line${issue ? " has-issue" : ""}`}>
                <Link href={`/product/${line.slug}`} className="sf-bag-img">
                  {line.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(line.thumbnail, "card") ?? ""} alt="" loading="lazy" />
                  ) : null}
                </Link>
                <div className="sf-bag-info">
                  {line.look ? <span className="sf-bag-look">From the look &ldquo;{line.look}&rdquo;</span> : null}
                  <Link href={`/product/${line.slug}`} className="sf-bag-name">
                    {line.title}
                  </Link>
                  <span className="sf-bag-price">{unit != null ? formatINR(unit * line.qty) : ""}</span>
                  {sizes.some((s) => s.size) ? (
                    <div className="size-chips" role="group" aria-label={`Size for ${line.title}`}>
                      {sizes.map((s) => (
                        <button
                          key={s.size ?? "one"}
                          type="button"
                          className={`size-chip${s.size === size ? " active" : ""}`}
                          onClick={() => s.size && s.size !== line.size && shop.setSize(line.slug, line.size, s.size)}
                        >
                          {s.size}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="sf-bag-row">
                    <div className="qty" aria-label="Quantity">
                      <button type="button" aria-label="One less" onClick={() => shop.setQty(line.slug, line.size, line.qty - 1)} disabled={line.qty <= 1}>
                        &minus;
                      </button>
                      <span>{line.qty}</span>
                      <button type="button" aria-label="One more" onClick={() => shop.setQty(line.slug, line.size, line.qty + 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="sf-bag-link" onClick={() => shop.saveForLater(line.slug, line.size)}>
                      Save for later
                    </button>
                    <button type="button" className="sf-bag-link" onClick={() => shop.remove(line.slug, line.size)}>
                      Remove
                    </button>
                  </div>
                  {issue ? <p className="sf-bag-issue">{issue}</p> : null}
                </div>
              </li>
            ))}
          </ul>

          <aside className="sf-bag-summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <div className="sf-bag-sum-row">
              <span>
                {items} {items === 1 ? "piece" : "pieces"}
              </span>
              <span>{ready ? formatINR(subtotal) : "…"}</span>
            </div>
            <div className="sf-bag-sum-row">
              <span>Delivery</span>
              <span>Worked out at checkout</span>
            </div>
            <div className="sf-bag-sum-row is-total">
              <span>Total</span>
              <span>{ready ? formatINR(subtotal) : "…"}</span>
            </div>
            <Link
              href="/checkout"
              className={`sf-bag-order${!ready || blocked || !items ? " is-off" : ""}`}
              aria-disabled={!ready || blocked || !items}
            >
              Checkout
            </Link>
            <p className="sf-bag-note">
              {blocked ? "Fix the pieces marked above to continue. " : ""}
              Pay online or cash on delivery. Prefer to chat?{" "}
              <a href={ready && !blocked && items ? order : undefined} target="_blank" rel="noopener noreferrer">
                Order on WhatsApp
              </a>
            </p>
            <ul className="sf-bag-trust">
              <li>Cash on delivery available</li>
              <li>Delivered across India and abroad</li>
              <li>Online orders are not exchanged: check your size, or ask us first</li>
            </ul>
          </aside>
        </div>
        <RecentlyViewed />
      </div>
    </main>
  );
}
