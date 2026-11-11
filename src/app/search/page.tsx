import type { Metadata } from "next";
import { ProductGrid } from "@/components/ProductCard";
import { getProducts } from "@/lib/catalogue";
import { searchProducts } from "@/lib/search";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const results = q ? searchProducts(await getProducts(), q) : [];
  return (
    <main className="sf-listing">
      <section className="sf-page-head">
        <div className="container">
          <div className="section-label">Search</div>
          <h1 className="sf-page-title">{q ? `“${q}”` : "Search"}</h1>
          <p className="sf-page-intro">
            {q ? `${results.length} ${results.length === 1 ? "piece" : "pieces"} found` : "Use the search icon at the top to look for a piece."}
          </p>
        </div>
      </section>
      <section className="featured-section sf-listing-grid">
        <div className="container">
          <ProductGrid products={results} empty="Nothing matched. Try another word, or ask us on WhatsApp — we'll find it for you." />
        </div>
      </section>
    </main>
  );
}
