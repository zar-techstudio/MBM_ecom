import Link from "next/link";
import { getCategories, getSettings } from "@/lib/catalogue";
import { MAPS_URL, SITE_NAME, STORE, sectionPath, whatsappLink } from "@/lib/site";
import { HeaderClient, type NavItem } from "./HeaderClient";

const isFabric = (c: { slug: string; name: string }) => /fabric|thaan/.test(`${c.slug} ${c.name}`.toLowerCase());

export async function SiteHeader() {
  const [main, mahib, settings] = await Promise.all([getCategories("main"), getCategories("mahib"), getSettings()]);
  const fabric = main.find(isFabric);
  const fabricsHref = fabric ? sectionPath("main", fabric.slug) : "/shop";
  const nav: NavItem[] = [
    { href: "/shop", label: "Shop", children: main.map((c) => ({ href: sectionPath("main", c.slug), label: c.name })) },
    {
      href: "/mahib",
      label: "MAHIB",
      mahib: true,
      children: mahib.map((c) => ({ href: sectionPath("mahib", c.slug), label: c.name })),
    },
    ...(fabric ? [{ href: fabricsHref, label: "Fabrics" }] : []),
    { href: "/#tailoring", label: "Custom Tailoring" },
  ];
  return (
    <HeaderClient
      nav={nav}
      fabricsHref={fabricsHref}
      whatsappHref={whatsappLink(settings.whatsapp_number, `Hello ${SITE_NAME}, I have a question.`)}
    />
  );
}

/** Footer with fixed sections (it never lists categories, so it stays tidy as the catalogue grows),
 * the showroom's address and phone, and the policy links shoppers and payment providers expect. */
export async function SiteFooter() {
  const settings = await getSettings();
  const wa = whatsappLink(settings.whatsapp_number, `Hello ${SITE_NAME}, I have a question.`);
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer sf-footer" id="siteFooter">
      <div className="container">
        <div className="sf-footer-grid">
          <div className="sf-footer-brand">
            <Link href="/" aria-label={`${SITE_NAME} home`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/header_navbar.webp" alt={SITE_NAME} className="sf-footer-logo" loading="lazy" />
            </Link>
            <p className="sf-footer-tag">Groom couture from Hyderabad since 1895.</p>
            <address className="sf-footer-address">
              {STORE.street}
              <br />
              {STORE.city}
              <br />
              {STORE.hours}
            </address>
            <div className="sf-footer-contact">
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">Get directions &rarr;</a>
              <a href={STORE.phoneHref}>{STORE.phone}</a>
              <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
            </div>
            <div className="sf-footer-social">
              {STORE.instagram.map((i) => (
                <a key={i.href} href={i.href} target="_blank" rel="noopener noreferrer" aria-label={i.label}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" className="dot" />
                  </svg>
                  <span>{i.handle}</span>
                </a>
              ))}
            </div>
          </div>
          <nav className="sf-footer-col" aria-label="Shop">
            <h4 className="sf-footer-title">Shop</h4>
            <Link href="/shop">Maqdoom&rsquo;s collection</Link>
            <Link href="/mahib">MAHIB &mdash; the exclusive edit</Link>
            <Link href="/#tailoring">Custom tailoring</Link>
          </nav>
          <nav className="sf-footer-col" aria-label="Help">
            <h4 className="sf-footer-title">Help</h4>
            <Link href="/contact">Contact &amp; store location</Link>
            <Link href="/policies/shipping">Shipping &amp; delivery</Link>
            <Link href="/policies/returns">Exchanges &amp; returns</Link>
            <a href={whatsappLink(settings.whatsapp_number, "Hello, I need help with sizes.")} target="_blank" rel="noopener noreferrer">
              Size help
            </a>
          </nav>
          <nav className="sf-footer-col" aria-label="About and policies">
            <h4 className="sf-footer-title">About</h4>
            <Link href="/#heritage">Our story</Link>
            <Link href="/policies/privacy">Privacy policy</Link>
            <Link href="/policies/terms">Terms of use</Link>
          </nav>
        </div>
        <div className="sf-footer-bottom">
          <p>
            &copy; {year} {STORE.name}. All rights reserved.
          </p>
          <p>
            {STORE.legalName} &middot; GSTIN {STORE.gstin}
          </p>
        </div>
      </div>
    </footer>
  );
}
