import type { ProductCard as Card } from "@/lib/catalogue";
import { ProductCard } from "./ProductCard";

/** A row of product cards that scrolls sideways ("More like this"). */
export function ProductRail({ title, products }: { title: string; products: Card[] }) {
  return (
    <section className="sf-rail" aria-label={title}>
      <h2 className="sf-recent-title">{title}</h2>
      <div className="sf-rail-row">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
