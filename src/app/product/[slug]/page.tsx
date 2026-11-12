import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLooks, getProduct, getProductLive, getProducts, getReviews, getSettings, type Product, type Reviews } from "@/lib/catalogue";
import { SITE_NAME, SITE_URL, imageUrl, priceText } from "@/lib/site";
import { ProductGallery } from "@/components/ProductGallery";
import { OrderPanel } from "@/components/OrderPanel";
import { CompleteTheLook } from "@/components/CompleteTheLook";
import { ProductReviews } from "@/components/ProductReviews";
import { Stars } from "@/components/Stars";
import { PhotoActions } from "@/components/PhotoActions";
import { ProductRail } from "@/components/ProductRail";
import { RecentlyViewed, TrackView } from "@/components/RecentlyViewed";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const image = imageUrl(p.thumbnail ?? p.images[0], "large");
  const description = p.seo_description || p.description?.slice(0, 160) || `${p.title} at ${SITE_NAME}.`;
  // The layout adds " | MAQDOOM'S BIG MALL"; drop it if staff or AI already typed the store name.
  const title = (p.seo_title || p.title).replace(/\s*[|\-–—:]\s*maqdoom['’]?s(\s+big\s+mall)?\s*$/i, "").trim() || p.title;
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, images: image ? [{ url: image, width: 1600, height: 2000 }] : [] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const [product, settings, mahibLooks, mainLooks, reviews] = await Promise.all([
    getProduct(slug),
    getSettings(),
    getLooks("mahib"),
    getLooks("main"),
    getReviews(slug),
  ]);
  if (!product) notFound();
  // "More like this": other pieces in the same category, in stock first.
  const similar = (await getProducts(product.category.section, product.category.slug))
    .filter((p) => p.slug !== slug)
    .sort((a, b) => Number(a.sold_out) - Number(b.sold_out))
    .slice(0, 12);
  // Outfits this piece belongs to: their other pieces are offered as "Complete the look".
  const looks = [...mahibLooks, ...mainLooks].filter((l) => l.pieces.some((p) => p.product.slug === slug));

  const url = `${SITE_URL}/product/${product.slug}`;
  // Thumbnail (the starred photo) first, then the rest in staff order.
  const paths = product.thumbnail ? [product.thumbnail, ...product.images.filter((i) => i !== product.thumbnail)] : product.images;
  const images = paths.map((p) => ({ large: imageUrl(p, "large")!, card: imageUrl(p, "card")! }));
  const section = product.category.section;
  const panel = (p: Product, checking = false) => (
    <OrderPanel
      title={p.title}
      url={url}
      kind={p.kind}
      priceText={priceText(p)}
      sizes={p.sizes}
      soldOut={p.sold_out}
      whatsappNumber={settings.whatsapp_number}
      checking={checking}
      card={p}
    />
  );

  return (
    <main className={`sf-product${section === "mahib" ? " sf-listing-mahib" : ""}`}>
      <div className="container">
        <div className="sf-product-grid">
          <ProductGallery
            images={images}
            title={product.title}
            overlay={<PhotoActions product={{ ...product, rating: reviews.rating ?? product.rating }} url={url} />}
          />
          <div className="sf-product-info">
            <div className="section-label">{product.category.name.toUpperCase()}</div>
            <h1 className="sf-product-title">{product.title}</h1>
            {reviews.rating?.count ? (
              <a href="#reviews" className="sf-product-rating">
                <Stars value={reviews.rating.average} size={16} />
                <span>
                  {reviews.rating.average.toFixed(1)} · {reviews.rating.count} {reviews.rating.count === 1 ? "review" : "reviews"}
                </span>
              </a>
            ) : null}
            <Suspense fallback={panel(product, true)}>
              <LivePanel slug={product.slug} render={panel} />
            </Suspense>
            <div className="sf-sections">
              {product.highlights?.length ? (
                <details open>
                  <summary>Product highlights</summary>
                  <ul className="sf-highlights" aria-label="Highlights">
                    {product.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {product.description ? (
                <details open={!product.highlights?.length}>
                  <summary>Details</summary>
                  <div className="sf-product-desc">
                    {product.description.split(/\n{2,}/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </details>
              ) : null}
              <details>
                <summary>Delivery &amp; returns</summary>
                <ul className="sf-highlights">
                  <li>Delivered across India and abroad; cash on delivery where available.</li>
                  <li>Online orders are not exchanged. Check the size guide, or ask us before you order.</li>
                  <li>Arrived damaged or not what you ordered? Tell us with an unboxing video and we&rsquo;ll replace it or refund you.</li>
                  <li>
                    Or collect it from the showroom near Charminar. <Link href="/policies/returns">Full policy</Link>
                  </li>
                </ul>
              </details>
            </div>
            {/* Tags are not shown: they feed search and the structured data below. */}
          </div>
        </div>
        <ProductReviews slug={slug} initial={reviews} />
        {looks.map((l) => (
          <CompleteTheLook key={l.slug} look={l} current={slug} />
        ))}
        {similar.length ? <ProductRail title="More like this" products={similar} /> : null}
        <RecentlyViewed exclude={slug} />
        <TrackView product={product} />
      </div>
      <script
        type="application/ld+json"
        // JSON-LD for search engines; "<" is escaped so text can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(product, url, images[0]?.large, reviews)).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}

/** Reads sizes and pieces left at request time, so stock is never stale. */
async function LivePanel({ slug, render }: { slug: string; render: (p: Product) => React.ReactNode }) {
  const live = await getProductLive(slug);
  if (!live) return <p className="sf-order-note">This piece is no longer available.</p>;
  return render(live);
}

function jsonLd(p: Product, url: string, image?: string, reviews?: Reviews) {
  const prices = p.sizes.map((s) => s.price_paise).filter((x): x is number => x != null);
  const availability = p.sold_out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";
  const offers =
    p.kind === "fabric"
      ? undefined
      : prices.length > 1 && Math.min(...prices) !== Math.max(...prices)
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: Math.min(...prices) / 100,
            highPrice: Math.max(...prices) / 100,
            offerCount: prices.length,
            availability,
          }
        : p.price_min_paise != null
          ? { "@type": "Offer", priceCurrency: "INR", price: p.price_min_paise / 100, availability, url }
          : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.seo_description || p.description || undefined,
    image: image ? [image] : undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: p.category.name,
    keywords: p.tags.length ? p.tags.join(", ") : undefined,
    // Verified buyers' ratings (Google can show stars in search results).
    aggregateRating: reviews?.rating?.count
      ? { "@type": "AggregateRating", ratingValue: reviews.rating.average.toFixed(1), reviewCount: reviews.rating.count, bestRating: 5, worstRating: 1 }
      : undefined,
    review: reviews?.reviews.length
      ? reviews.reviews.slice(0, 5).map((v) => ({
          "@type": "Review",
          author: { "@type": "Person", name: v.name },
          datePublished: v.at.slice(0, 10),
          reviewRating: { "@type": "Rating", ratingValue: v.stars, bestRating: 5, worstRating: 1 },
          reviewBody: v.body || undefined,
        }))
      : undefined,
    additionalProperty: p.highlights?.length
      ? p.highlights.map((h) => ({ "@type": "PropertyValue", name: "Highlight", value: h }))
      : undefined,
    url,
    offers,
  };
}
