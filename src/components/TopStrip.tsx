"use client";

import Link from "next/link";

const KEY = "mbm-strip-closed";

/** Runs before the page paints: a strip the shopper closed stays closed, with no flash. */
export const TOP_STRIP_BOOT = `try{if(localStorage.getItem("${KEY}"))document.documentElement.dataset.strip="off"}catch(e){}`;

/**
 * The thin dark strip above the header on every page: three true statements on the left, the
 * MAHIB link in the middle, the line "Style. Tradition. You." and a close button on the right.
 * Phones show only the middle link. Closing is remembered on this device.
 */
export function TopStrip() {
  const close = () => {
    document.documentElement.dataset.strip = "off";
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };
  return (
    <div className="topstrip" role="region" aria-label="Announcement">
      <div className="topstrip-in">
        <p className="topstrip-side">
          <svg className="topstrip-crown" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
          </svg>
          <span>Premium Ethnic Wear</span>
          <i aria-hidden="true">|</i>
          <span>Since 1895 · Hyderabad</span>
          <i aria-hidden="true">|</i>
          <span>Delivered across India &amp; abroad</span>
        </p>
        <Link href="/mahib" className="topstrip-mid">
          <span aria-hidden="true">◆</span>
          <b>MAHIB</b> — The Exclusive Edit
          <span aria-hidden="true">◆</span>
        </Link>
        <p className="topstrip-side is-right">
          <span>Style. Tradition. You.</span>
        </p>
        <button type="button" className="topstrip-close" aria-label="Close" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
