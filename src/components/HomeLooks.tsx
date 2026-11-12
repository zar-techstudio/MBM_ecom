import Link from "next/link";
import type { Look } from "@/lib/catalogue";
import { formatINR, imageUrl } from "@/lib/site";

/** Home page row: the MAHIB complete looks, one per ceremony. Each card opens that outfit in the runway. */
export function HomeLooks({ looks }: { looks: Look[] }) {
  return (
    <section className="hl" aria-label="Complete looks">
      <div className="container">
        <div className="hl-head">
          <div>
            <div className="section-label">Shop by ceremony</div>
            <h2 className="hl-title">Complete looks, head to toe</h2>
          </div>
          <Link href="/mahib" className="view-all-link">
            <span>All looks</span>
            <span>&rarr;</span>
          </Link>
        </div>
        <div className="hl-row">
          {looks.map((l) => {
            const total = l.pieces.reduce((n, p) => n + (p.product.price_min_paise ?? 0), 0);
            return (
              <Link key={l.slug} href={`/mahib?look=${encodeURIComponent(l.slug)}#runway`} className="hl-card">
                <span className="hl-arch">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(l.image) ?? ""} alt={l.image_alt ?? l.name} loading="lazy" />
                </span>
                <span className="hl-name">{l.name}</span>
                <span className="hl-meta">
                  {l.pieces.length} pieces{total ? ` · ${formatINR(total)}` : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
