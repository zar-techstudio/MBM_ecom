import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getProducts, type Section } from "@/lib/catalogue";
import { imageUrl, sectionPath } from "@/lib/site";
import { ProductGrid } from "./ProductCard";
import { SearchBar } from "./SearchBar";

export const SECTION_COPY: Record<Section, { label: string; title: string; intro: string; tagline: string; search: string }> = {
  main: {
    label: "THE COLLECTION",
    title: "SHOP ALL",
    tagline: "Every piece, in our showroom today.",
    search: "Search the collection",
    intro: "Sherwanis, kurtas, waistcoats, fabrics and more — every piece here is in our showroom today.",
  },
  mahib: {
    label: "A MAQDOOM’S EXCLUSIVE",
    title: "MAHIB",
    tagline: "Complete Looks. Timeless Details.",
    search: "Search the MAHIB collection",
    intro: "Elevated designs and exceptional fabrics, chosen for those who appreciate the extraordinary.",
  },
};

/** Section page (/shop, /mahib) or one category inside it. */
export async function CatalogueListing({
  section,
  category,
  feature,
  lead,
}: {
  section: Section;
  category?: string;
  /** Shown between the page heading and the product grid (the MAHIB runway). */
  feature?: React.ReactNode;
  /** Shown first, above the page heading (the MAHIB outfit runway). */
  lead?: React.ReactNode;
}) {
  const [categories, products, all] = await Promise.all([
    getCategories(section),
    getProducts(section, category),
    getProducts(section), // for each category's bubble photo
  ]);
  // Bubble photo: the category's banner, else its first product's photo.
  const photoOf = (slug?: string) => {
    const c = slug ? categories.find((x) => x.slug === slug) : undefined;
    const path = c?.banner ?? all.find((p) => !slug || p.category.slug === slug)?.thumbnail ?? null;
    return imageUrl(path, "card");
  };
  const current = category ? categories.find((c) => c.slug === category) : undefined;
  if (category && !current) notFound();
  const copy = SECTION_COPY[section];
  // With a runway on top, category links jump straight to the products heading.
  const jump = lead ? "#catalogue" : "";

  // Within a category, the staff-chosen featured pieces come first (by rank).
  const sorted = current
    ? [...products].sort(
        (a, b) =>
          Number(b.featured_in_category) - Number(a.featured_in_category) ||
          (a.featured_rank ?? 99) - (b.featured_rank ?? 99),
      )
    : products;

  return (
    <main className={`sf-listing lx${section === "mahib" ? " sf-listing-mahib" : ""}`}>
      {lead}
      <section className="sf-page-head" id="catalogue">
        <div className="container">
          <div className="section-label">{copy.label}</div>
          <h1 className="sf-page-title">{current ? current.name.toUpperCase() : copy.title}</h1>
          <span className="lx-ornament" aria-hidden="true">
            <svg viewBox="0 0 120 12">
              <path d="M2 6h46M72 6h46" />
              <path d="M60 1.5 64.5 6 60 10.5 55.5 6z" />
              <path d="M50 6c2.5-3 5-3 7.5 0M70 6c-2.5-3-5-3-7.5 0" />
            </svg>
          </span>
          <p className="lx-tagline">{current?.description || copy.tagline}</p>
          <p className="sf-page-intro">{copy.intro}</p>
          <SearchBar placeholder={copy.search} />
          {categories.length ? (
            <nav className="sf-bubbles" aria-label="Categories">
              {[{ slug: undefined, name: "All" }, ...categories].map((c) => {
                const active = c.slug ? c.slug === category : !current;
                const src = photoOf(c.slug);
                return (
                  <Link
                    key={c.slug ?? "all"}
                    href={sectionPath(section, c.slug) + jump}
                    className={`sf-bubble${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="sf-bubble-img">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" loading="lazy" />
                      ) : (
                        <span>{c.name.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className="sf-bubble-name">{c.name}</span>
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </section>
      {feature}
      <section className="featured-section sf-listing-grid">
        <div className="container">
          <ProductGrid products={sorted} empty="Nothing here yet — new pieces are added every week." />
        </div>
      </section>
    </main>
  );
}
