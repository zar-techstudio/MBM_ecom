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

/** Footer: a cream panel (rounded gold-edged top corners, a wavy gold bottom edge) over a dark band
 * with the copyright. Brand, address (opens Google Maps), phone and hours; both Instagram
 * accounts as circles (WhatsApp is the floating button); three short link columns. It never lists categories, so it stays the same size. */
export function SiteFooter() {
  return (
    <footer className="site-footer sf-footer" id="siteFooter">
      <div className="sf-foot-panel">
        {/* Line drawing of the showroom (a CSS mask, so it takes the footer's gold). */}
        <span className="sf-footer-art" aria-hidden="true" />
        <div className="container">
          <div className="sf-footer-brand">
            <Link href="/" aria-label={`${SITE_NAME} home`} className="sf-footer-logo-link">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/header_navbar.webp" alt={SITE_NAME} className="sf-footer-logo" loading="lazy" />
            </Link>
            <div className="sf-footer-reach">
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="sf-footer-addr" aria-label="Open the showroom in Google Maps">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
                <span>{STORE.street}, Hyderabad</span>
              </a>
              <a href={STORE.phoneHref} className="sf-footer-phone">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a11.5 11.5 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6c0 1.1-.9 2-2 2A16.4 16.4 0 0 1 4.6 5.5c0-1.1.9-2 2-2z" />
                </svg>
                <span>{STORE.phone}</span>
              </a>
              <span className="sf-footer-hours">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
                <span>{STORE.hours}</span>
              </span>
            </div>
            {/* Both Instagram accounts (WhatsApp is the floating button, so it is not repeated here). */}
            <div className="sf-footer-social">
              {STORE.instagram.map((i) => (
                <a key={i.href} href={i.href} target="_blank" rel="noopener noreferrer" aria-label={i.label} title={i.handle} className="sf-social-named">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" className="dot" />
                  </svg>
                  <span>{/mahib/i.test(i.href) ? "MAHIB" : "Maqdoom’s"}</span>
                </a>
              ))}
            </div>
          </div>
          <span className="sf-foot-rule" aria-hidden="true" />
          <div className="sf-footer-cols">
            <nav className="sf-footer-col" aria-label="Shop">
              <h4 className="sf-footer-title">Shop</h4>
              <Link href="/shop">Maqdoom&rsquo;s</Link>
              <Link href="/mahib">MAHIB</Link>
              <Link href="/#tailoring">Tailoring</Link>
            </nav>
            <nav className="sf-footer-col" aria-label="Help">
              <h4 className="sf-footer-title">Help</h4>
              <Link href="/contact">Contact</Link>
              <Link href="/policies/shipping">Shipping</Link>
              <Link href="/policies/returns">Returns</Link>
              <Link href="/policies/points">Loyalty Points</Link>
            </nav>
            <nav className="sf-footer-col" aria-label="About">
              <h4 className="sf-footer-title">About</h4>
              <Link href="/#heritage">Our Story</Link>
              <Link href="/policies/privacy">Privacy</Link>
              <Link href="/policies/terms">Terms</Link>
            </nav>
          </div>
        </div>
        <svg className="sf-foot-wave" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
          <path className="fill" d="M0 0H400V30C330 6 250 4 170 20S50 40 0 18Z" />
          <path className="line" d="M400 30C330 6 250 4 170 20S50 40 0 18" />
        </svg>
      </div>
      <p className="sf-footer-copy">
        &copy; {new Date().getFullYear()} {STORE.name.toUpperCase().replace("BIG MALL", "Big Mall")}. All rights reserved.
      </p>
    </footer>
  );
}
