"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Look } from "@/lib/catalogue";
import { shop, toSaved } from "@/lib/shop-store";
import { formatINR, imageUrl, priceText } from "@/lib/site";

/** On a product page: the other pieces of an outfit this product belongs to, with "Buy the full look". */
export function CompleteTheLook({ look, current }: { look: Look; current: string }) {
  const router = useRouter();
  const others = look.pieces.filter((p) => p.product.slug && p.product.slug !== current);
  if (!others.length) return null;
  const total = look.pieces.reduce((n, p) => n + (p.product.price_min_paise ?? 0), 0);
  return (
    <section className="sf-ctl" aria-label={`Complete the look: ${look.name}`}>
      <div className="sf-ctl-head">
        <div>
          <div className="section-label">Complete the look</div>
          <h2 className="sf-ctl-title">{look.name}</h2>
        </div>
        <div className="sf-ctl-buy">
          {total ? <span className="sf-ctl-total">Full look {formatINR(total)}</span> : null}
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              look.pieces
                .filter((p) => p.product.slug && !p.product.sold_out)
                .forEach((p) => shop.add(toSaved(p.product), null, 1, look.name));
              router.push("/bag");
            }}
          >
            <span>Buy the full look</span>
          </button>
        </div>
      </div>
      <div className="sf-recent-row">
        {others.map((p) => (
          <Link key={p.product.slug} href={`/product/${p.product.slug}`} className="sf-recent-item">
            <span className="sf-recent-img">
              {p.product.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(p.product.thumbnail, "card") ?? ""} alt="" loading="lazy" />
              ) : null}
            </span>
            <span className="runway-piece-role">{p.role}</span>
            <span className="sf-recent-name">{p.product.title}</span>
            <span className="sf-recent-price">{p.product.sold_out ? "Sold out" : priceText(p.product)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
