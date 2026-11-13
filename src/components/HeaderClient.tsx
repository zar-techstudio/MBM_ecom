"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FeelTheFabric } from "./FeelTheFabric";
import { ShopIcons } from "./ShopIcons";

export type NavLink = { href: string; label: string };
export type NavItem = NavLink & { mahib?: boolean; children?: NavLink[] };

/** A menu item is active on its own page, its sub-pages and any of its drop-down pages. */
function isActive(item: NavItem, path: string) {
  if (item.href.includes("#")) return false;
  if (path === item.href || path.startsWith(`${item.href}/`)) return true;
  return !!item.children?.some((c) => path === c.href);
}

const WA_ICON =
  "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z";

/* Line icons for the phone menu (gold strokes, set in screens.css). */
const DM_ICON = {
  jacket: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3 5 5.5 3.5 11l2.5 1V21h12v-9l2.5-1L19 5.5 15 3l-3 4-3-4Z" />
      <path d="M12 7v14M9 3l3 4 3-4" />
    </svg>
  ),
  turban: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 15c0-5 3.6-9 8-9s8 4 8 9" />
      <path d="M4 15c2 3 14 3 16 0M5 11.5c3-2 11-2 14 0M7.5 7.8c2.5 1.8 6.5 4.5 8.5 8.2" />
      <path d="M12 6c.6-1.6 2-2.4 3.5-2" />
    </svg>
  ),
  scissors: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <path d="M7.8 16 17 3M16.2 16 7 3" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8.5 12 4l9 4.5-9 4.5z" />
      <path d="m3 12.5 9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.3l8.5 4.5" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" />
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v10h16V10M3 10l1.5-6h15L21 10" />
      <path d="M3 10c0 1.5 1.3 2.5 3 2.5S9 11.5 9 10c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5M9.5 20v-5h5v5" />
    </svg>
  ),
  chevron: (
    <svg className="dm-chev" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
};

/** Header with drop-down menus, the Feel the Fabric button, the phone menu and the WhatsApp button. */
export function HeaderClient({
  nav,
  whatsappHref,
  fabricsHref,
}: {
  nav: NavItem[];
  whatsappHref: string;
  fabricsHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const path = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close any open menu after moving to another page
  useEffect(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const t = window.setTimeout(() => {
      setMenu(null);
      setOpen(false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={`site-header${scrolled ? " scrolled" : ""}`} id="siteHeader">
        <div className="container nav-inner">
          <Link href="/" className="brand-link" aria-label="MAQDOOM'S BIG MALL Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/header_navbar.webp" alt="MAQDOOM'S BIG MALL" className="header-logo-img" />
          </Link>
          <nav className="main-nav" aria-label="Primary Navigation">
            {nav.map((item) =>
              item.children?.length ? (
                <div
                  key={item.href}
                  className={`nav-drop${menu === item.href ? " open" : ""}`}
                  onMouseEnter={() => setMenu(item.href)}
                  onMouseLeave={() => setMenu(null)}
                  onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setMenu(null)}
                >
                  <Link
                    href={item.href}
                    className={`nav-link${item.mahib ? " nav-link-mahib" : ""}${isActive(item, path) ? " active" : ""}`}
                    aria-current={path === item.href ? "page" : undefined}
                    aria-haspopup="true"
                    aria-expanded={menu === item.href}
                    onFocus={() => setMenu(item.href)}
                  >
                    {item.label}
                    <svg className="nav-caret" viewBox="0 0 10 6" aria-hidden="true">
                      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  </Link>
                  <div className={`nav-panel${item.mahib ? " nav-panel-mahib" : ""}`}>
                    <p className="nav-panel-title">{item.mahib ? "The MAHIB Edit" : "Shop by category"}</p>
                    <ul className="nav-panel-list">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className={path === c.href ? "active" : undefined}>
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href={item.href} className="nav-panel-all">
                      View all &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${item.mahib ? " nav-link-mahib" : ""}${isActive(item, path) ? " active" : ""}`}
                  aria-current={isActive(item, path) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="nav-actions">
            <FeelTheFabric fabricsHref={fabricsHref} />
            <ShopIcons />
            <button className="icon-btn mobile-menu-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`drawer-backdrop${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div className="drawer-panel dm">
          <div className="drawer-header dm-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/header_navbar.webp" alt="MAQDOOM'S BIG MALL" className="dm-logo" />
            <button className="dm-close" aria-label="Close menu" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="drawer-body dm-body">
            <nav aria-label="Menu">
              {nav
                .filter((item) => item.children?.length)
                .map((item) => (
                  <details key={item.href} className="dm-group" open={!item.mahib}>
                    <summary>
                      <span className="dm-icon">{item.mahib ? DM_ICON.turban : DM_ICON.jacket}</span>
                      <span className="dm-group-text">
                        <span className="dm-group-name">{item.label}</span>
                        {item.mahib ? <span className="dm-group-sub">Complete Looks &amp; Accessories</span> : null}
                      </span>
                      <svg className="dm-caret" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </summary>
                    <ul>
                      <li>
                        <Link href={item.href} onClick={() => setOpen(false)}>
                          {item.mahib ? "All of MAHIB" : "All products"}
                          {DM_ICON.chevron}
                        </Link>
                      </li>
                      {item.children!.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className={path === c.href ? "active" : undefined} onClick={() => setOpen(false)}>
                            {c.label}
                            {DM_ICON.chevron}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              <ul className="dm-rows">
                {[
                  ...nav.filter((item) => !item.children?.length).map((item) => ({
                    href: item.href,
                    label: item.label,
                    icon: /tailor/i.test(item.label) ? DM_ICON.scissors : DM_ICON.layers,
                  })),
                  { href: "/account", label: "My Account & Orders", icon: DM_ICON.box },
                  { href: "/wishlist", label: "Wishlist", icon: DM_ICON.heart },
                  { href: "/contact", label: "Contact & Store", icon: DM_ICON.store },
                ].map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} onClick={() => setOpen(false)}>
                      <span className="dm-row-icon">{r.icon}</span>
                      <span>{r.label}</span>
                      {DM_ICON.chevron}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <a className="dm-wa" href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={WA_ICON} fill="currentColor" />
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Help button. Not on product pages (their order bar sits there on phones) or the contact
          page (it lists WhatsApp and phone itself). */}
      {path.startsWith("/product/") || ["/contact", "/bag", "/checkout"].includes(path) ? null : (
        <a className="wa-float" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={WA_ICON} fill="currentColor" />
          </svg>
          <span className="wa-float-label">Chat with us</span>
        </a>
      )}
    </>
  );
}
