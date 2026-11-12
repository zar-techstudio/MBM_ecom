import Link from "next/link";
import {
  getCategories,
  getHomeFeatured,
  getLooks,
  getProducts,
  getSettings,
  type Category,
} from "@/lib/catalogue";
import { SITE_NAME, imageUrl, sectionPath, whatsappLink } from "@/lib/site";
import { HeroCycler } from "@/components/HeroCycler";
import { CategoryRing } from "@/components/CategoryRing";
import { GoldenThread } from "@/components/GoldenThread";
import { HERO_OUTFITS } from "@/lib/hero";
import { FeaturedRail } from "@/components/FeaturedRail";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { HomeLooks } from "@/components/HomeLooks";

/* Design artwork for categories until the e-commerce team adds banners in the ERP. */
const DESIGN_ART: [RegExp, string][] = [
  [/kurta/, "/images/section_2_kurtas.webp"],
  [/sherwani/, "/images/section_2_sherwanis.webp"],
  [/waistcoat|jacket|coat/, "/images/section_2_waistcoats.webp"],
  [/fabric|thaan|cloth/, "/images/section_2_fabrics.webp"],
  [/accessor|stole|safa|shoe|mojri/, "/images/section_2_accessories.webp"],
];
function categoryArt(c: Category) {
  if (c.banner) return imageUrl(c.banner, "card") ?? "";
  const key = `${c.slug} ${c.name}`.toLowerCase();
  return (
    DESIGN_ART.find(([re]) => re.test(key))?.[1] ??
    "/images/section_2_fabrics.webp"
  );
}

/* Custom tailoring, step by step (line icons drawn to match the gold outlines). */
const TAILORING_STEPS = [
  {
    label: "Select fabric",
    icon: (
      <>
        <path d="M3 8.5 12 4l9 4.5-9 4.5z" />
        <path d="m3 12.5 9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
      </>
    ),
  },
  {
    label: "Choose style",
    icon: (
      <>
        <path d="M8 3.5 4 6v4l2.5-1V20h11V9L20 10V6l-4-2.5" />
        <path d="M8 3.5c.6 1.6 2.1 2.6 4 2.6s3.4-1 4-2.6" />
      </>
    ),
  },
  {
    label: "Take measurements",
    icon: (
      <>
        <rect
          x="2.5"
          y="8.5"
          width="19"
          height="7"
          rx="1"
          transform="rotate(-35 12 12)"
        />
        <path d="m7.2 13.1 1.2 1.7M9.6 11.4l.7 1M12 9.7l1.2 1.7M14.4 8l.7 1M16.8 6.3 18 8" />
      </>
    ),
  },
  {
    label: "Perfect fit",
    icon: (
      <>
        <path d="M12 4a2 2 0 1 1 2 2c-1 0-2 .7-2 1.7V9" />
        <path d="m12 9 9 6.5c.6.5.3 1.5-.5 1.5H3.5c-.8 0-1.1-1-.5-1.5z" />
      </>
    ),
  },
];

const isFabric = (c: Category) =>
  /fabric|thaan/.test(`${c.slug} ${c.name}`.toLowerCase());

export default async function HomePage() {
  const [main, chosen, settings, looks] = await Promise.all([
    getCategories("main"),
    getHomeFeatured(),
    getSettings(),
    getLooks("mahib"),
  ]);
  // Until staff pick enough "home featured" pieces in the ERP, the row is filled with the newest.
  const featured =
    chosen.length >= 4
      ? chosen
      : [
          ...chosen,
          ...(await getProducts()).filter(
            (p) => !p.sold_out && !chosen.some((c) => c.slug === p.slug),
          ),
        ].slice(0, 8);
  const fabrics = main.find(isFabric);
  const fabricsHref = fabrics ? sectionPath("main", fabrics.slug) : "/shop";
  const tailoringHref = whatsappLink(
    settings.whatsapp_number,
    `Hello ${SITE_NAME}, I'd like to book a custom tailoring appointment.`,
  );

  return (
    <main className="home">
      {/* 1. HERO */}
      <section
        className="hero-section"
        id="heroSection"
        aria-label="Hero Showcase"
      >
        <div className="hero-background-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-bg-img"
            src="/images/hero_bg.webp"
            alt=""
            fetchPriority="high"
          />
          <div className="hero-overlay" />
        </div>
        <div className="container hero-container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span>TRADITION</span>
                <span className="divider-dash" />
                <span>CRAFTSMANSHIP</span>
                <span className="divider-dash" />
                <span>A TIMELESS PRESENCE</span>
              </div>
              <div className="hero-title-group">
                <h1 className="sr-only">{SITE_NAME}</h1>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/name.webp"
                  alt=""
                  className="hero-name-img"
                  fetchPriority="high"
                />
                <div className="hero-brand-words" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/BIG.webp"
                    alt=""
                    className="hero-word-big"
                    fetchPriority="high"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/Mall.webp"
                    alt=""
                    className="hero-word-mall"
                    fetchPriority="high"
                  />
                </div>
              </div>
              <p className="hero-description">
                Premium Indian menswear, fine fabrics and bespoke tailoring —
                crafted for every chapter of your life.
              </p>
              <div className="hero-actions">
                <Link
                  href="/shop"
                  className="btn-primary"
                  id="exploreCollectionBtn"
                >
                  <span>Explore Collection</span>
                  <span className="btn-arrow">&rarr;</span>
                </Link>
                <Link href="/mahib" className="btn-outline" id="watchFilmBtn">
                  <span>Discover MAHIB</span>
                </Link>
              </div>
              <HeroCycler />
            </div>
            <div className="hero-model-stage" aria-live="polite">
              <div className="model-cutout-wrap">
                {HERO_OUTFITS.map((o, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={o.src}
                    className={`model-outfit${i === 0 ? " active" : ""}`}
                    src={o.src}
                    alt={o.alt}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                ))}
                {/* gold edge of the curtain: the same cutout, tinted gold, shown only as a thin band */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="model-outfit curtain-glow"
                  src={HERO_OUTFITS[0].src}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="hero-editorial-col">
              <div className="editorial-pillars">
                <span>HERITAGE</span>
                <span>FABRICS</span>
                <span>MODERN FITS</span>
                <span>TIMELESS</span>
                <span>OCCASIONS</span>
              </div>
              <Link
                href={fabricsHref}
                className="editorial-floating-card"
                aria-label="A closer look at our fabrics"
              >
                <div className="floating-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/section_2_fabrics.webp"
                    alt="Curated thaans and brocades"
                    loading="lazy"
                  />
                </div>
                <p className="floating-card-caption">
                  A CLOSER LOOK AT OUR FABRICS
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES (from the ERP) */}
      {main.length ? (
        <section className="categories-section" aria-label="Product Categories">
          <div className="container">
            <div className="section-header-row">
              <div>
                <div className="section-label">CURATED WARDROBE</div>
                <h2 className="section-title-light">CATEGORIES</h2>
              </div>
            </div>
            <CategoryRing
              cards={main.map((c) => ({
                href: sectionPath("main", c.slug),
                name: c.name,
                img: categoryArt(c),
                desc: c.description,
              }))}
            />
          </div>
        </section>
      ) : null}

      {/* 3. THE GOLDEN THREAD: the Maqdoom story since 1895 (same family, confirmed by the owner) */}
      <GoldenThread
        knots={[
          {
            mark: "1895",
            title: "Where it began",
            text: "The Maqdoom family opens its doors in Hyderabad.",
          },
          {
            mark: "MAHIB",
            title: "Couture by hand",
            text: "Our in-house label: hand-embroidered, minutely detailed pieces.",
            href: "/mahib",
          },
          {
            mark: "4 HRS",
            title: "Stitched to you",
            text: "Measured in store and tailored to your fit, the same day.",
            href: tailoringHref,
            external: true,
          },
          {
            mark: "WORLDWIDE",
            title: "Grooms abroad",
            text: "Clients from around the world shop with us. Ask us on WhatsApp.",
            href: whatsappLink(
              settings.whatsapp_number,
              `Hello ${SITE_NAME}, I'm shopping from abroad and have a question.`,
            ),
            external: true,
          },
        ]}
      />

      {/* 4. MAHIB */}
      <section
        className="mahib-section"
        id="mahib"
        aria-label="MAHIB Exclusive Premium Division"
      >
        <div className="mahib-bg-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mahib-bg-img"
            src="/images/section_3_bg.webp"
            alt=""
            loading="lazy"
          />
          <div className="mahib-gradient-overlay" />
        </div>
        <div className="container mahib-container">
          <div className="mahib-grid">
            <div className="mahib-content">
              <div className="mahib-badge">A MAQDOOM&rsquo;S EXCLUSIVE</div>
              <h2 className="mahib-title">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/mahib.webp" alt="MAHIB" loading="lazy" />
              </h2>
              <p className="mahib-desc">
                Elevated designs. Exceptional fabrics. A refined selection for
                those who appreciate the extraordinary.
              </p>
              <Link href="/mahib" className="btn-mahib">
                <span>Explore MAHIB</span>
                <span>&rarr;</span>
              </Link>
            </div>
            <div />
            <div className="mahib-editorial-col">
              <div className="mahib-pillars">
                <span>EXCLUSIVE</span>
                <span>DESIGNS</span>
                <span>FINEST FABRICS</span>
                <span>ELEVATED</span>
                <span>CRAFTSMANSHIP</span>
              </div>
              <Link
                href="/mahib"
                className="mahib-floating-card"
                aria-label="Explore MAHIB"
              >
                <div className="mahib-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/hero_section_person_c_1.3.webp"
                    alt="MAHIB couture sherwani detail"
                    loading="lazy"
                  />
                  <div className="mahib-arrow-badge">&rarr;</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4b. COMPLETE LOOKS: the MAHIB outfits, one per ceremony (each opens in the runway) */}
      {looks.length ? <HomeLooks looks={looks} /> : null}

      {/* 5. FABRICS */}
      <section
        className="fabrics-section"
        id="fabrics"
        aria-label="Fabric Collection"
      >
        <div className="fabrics-bg-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="fabrics-bg-img"
            src="/images/section_4_bg.webp"
            alt=""
            loading="lazy"
          />
          <div className="fabrics-gradient-overlay" />
        </div>
        <div className="container fabrics-container">
          <div className="fabrics-grid">
            <div className="fabrics-content">
              <div className="fabrics-label home-label-lined">OUR FABRICS</div>
              <h2 className="fabrics-title">
                THAANS
                <br />
                THAT INSPIRE
              </h2>
              <p className="fabrics-desc">
                Explore a curated range of premium fabrics in rich textures,
                elegant patterns and timeless colours.
              </p>
              <Link href={fabricsHref} className="btn-fabrics">
                <span>Explore Fabrics</span>
                <span>&rarr;</span>
              </Link>
            </div>
            <div />
            <div className="fabrics-editorial-col">
              <div className="fabrics-type-list">
                <span>COTTON</span>
                <span>SILK</span>
                <span>LINEN</span>
                <span>JACQUARD</span>
                <span>BLENDS</span>
                <span>&amp; MORE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED — one home-featured product per category, chosen in the ERP */}
      <section
        className="featured-section"
        id="featured-products"
        aria-label="Featured Products"
      >
        <div className="container">
          <div className="featured-header-row">
            <div className="featured-heading-wrap">
              <h2 className="featured-title">FEATURED PRODUCTS</h2>
              <span className="heading-line" />
            </div>
            <Link href="/shop" className="view-all-link">
              <span>View All</span>
              <span>&rarr;</span>
            </Link>
          </div>
          {featured.length ? (
            <FeaturedRail products={featured} />
          ) : (
            <p className="sf-empty">
              New arrivals are being photographed. Visit again soon.
            </p>
          )}
          <RecentlyViewed />
        </div>
      </section>

      {/* 7. CUSTOM TAILORING */}
      <section
        className="tailoring-section"
        id="tailoring"
        aria-label="Custom Tailoring"
      >
        <div className="tailoring-bg-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="tailoring-bg-img"
            src="/images/section_6_tailoring_image.webp"
            alt=""
            loading="lazy"
          />
          <div className="tailoring-overlay" />
        </div>
        <div className="container tailoring-container">
          <div className="tailoring-grid">
            <div className="tailoring-content">
              <div className="tailoring-label home-label-lined">
                Custom experience
              </div>
              <h2 className="tailoring-title">
                CUSTOM
                <br />
                TAILORING
              </h2>
              <p className="tailoring-desc">
                Your fabric. Your measurements.
                <br />
                Our craftsmanship.
              </p>
              <a
                href={tailoringHref}
                className="btn-tailoring"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-wa">
                  <path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.1L3.3 20.8l4.6-1.2A8.7 8.7 0 1 0 12 3.2z" />
                  <path d="M8.9 7.9c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.3 0 .6.6 1 1.4 1.8 2.4 2.3.3.2.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .5-.2 1.1-.6 1.4-.5.4-1.4.7-2.3.5-1-.2-2.4-.8-3.7-2-1.3-1.2-2.1-2.6-2.3-3.5-.2-.9 0-1.7.4-2.1z" />
                </svg>
                <span>Book on WhatsApp</span>
                <span>&rarr;</span>
              </a>
            </div>
            <div />
            <ol className="tailoring-steps" aria-label="How it works">
              {TAILORING_STEPS.map((s) => (
                <li key={s.label}>
                  <span className="tailoring-step-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {s.icon}
                    </svg>
                  </span>
                  <span>{s.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
