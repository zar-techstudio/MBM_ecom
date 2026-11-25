"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useShop } from "@/lib/shop-store";

/* Pages with their own buy bar at the bottom (product, bag, checkout) and one-off pages don't
 * get the tab bar. */
const HIDDEN = /^\/(product|bag|checkout|review)(\/|$)|^\/orders\/[^/]+\/invoice/;

type Tab = { href: string; label: string; match: RegExp; icon: React.ReactNode | null };

const TABS: Tab[] = [
  {
    href: "/",
    label: "Home",
    match: /^\/$/,
    icon: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />,
  },
  {
    href: "/shop",
    label: "Shop",
    match: /^\/(shop|search)(\/|$)/,
    icon: <path d="M9 4c.4 1.5 1.6 2.5 3 2.5S14.6 5.5 15 4l4.5 2-1.5 4.5-2-.8V20H8V9.7l-2 .8L4.5 6z" />,
  },
  {
    href: "/mahib",
    label: "MAHIB",
    match: /^\/mahib(\/|$)/,
    // the owner's MAHIB knot (public/images/mahib-icon.svg), coloured like the other icons
    icon: null,
  },
  {
    href: "/bag",
    label: "Bag",
    match: /^\/bag(\/|$)/,
    icon: <path d="M5.5 8h13l-1 12h-11zM9 8V6.5a3 3 0 0 1 6 0V8" />,
  },
  {
    href: "/account",
    label: "Account",
    match: /^\/(account|orders|wishlist)(\/|$)/,
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
      </>
    ),
  },
];

/**
 * Phones: the main places always one tap away along the bottom (visible tabs beat a hidden
 * menu in the research reels: Spotify, Redbooth). Sets `has-tabbar` on <html> so floating buttons
 * and page bottoms make room (screens.css).
 */
export function TabBar() {
  const path = usePathname() || "/";
  const { bag } = useShop();
  const show = !HIDDEN.test(path);
  const pieces = bag.reduce((n, l) => n + l.qty, 0);
  // On the home page the bar comes up once the shopper scrolls, so it never covers the hero buttons.
  const home = path === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!home) return;
    const on = () => setScrolled(window.scrollY > 80);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [home]);

  useEffect(() => {
    document.documentElement.classList.toggle("has-tabbar", show);
    return () => document.documentElement.classList.remove("has-tabbar");
  }, [show]);

  if (!show) return null;
  return (
    <nav className={`tabbar${home && !scrolled ? " is-tucked" : ""}`} aria-label="Main">
      {TABS.map((t) => {
        const on = t.match.test(path);
        return (
          <Link key={t.href} href={t.href} className={`tabbar-tab${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined}>
            <span className="tabbar-icon">
              {t.icon ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {t.icon}
                </svg>
              ) : (
                <span className="mahib-mark" aria-hidden="true" />
              )}
              {t.href === "/bag" && pieces ? <span className="tabbar-count">{pieces > 9 ? "9+" : pieces}</span> : null}
            </span>
            <span className="tabbar-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
