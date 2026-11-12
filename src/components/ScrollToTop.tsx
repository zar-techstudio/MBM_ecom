"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Every new page opens at the very top. Next.js on its own keeps the scroll position, or scrolls
 * only to the page's first element (which sits under the sticky header), so product pages could
 * open part-way down. Back / Forward keep the browser's own position, and links to a section
 * (#runway) still go to that section. */
export function ScrollToTop() {
  const path = usePathname();
  const first = useRef(true);
  const historyMove = useRef(false);

  useEffect(() => {
    const onPop = () => (historyMove.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false; // the first load is the browser's
      return;
    }
    if (historyMove.current) {
      historyMove.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [path]);

  return null;
}
