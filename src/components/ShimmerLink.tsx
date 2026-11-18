"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** A link whose gold shimmer plays only while it is on screen (class "is-live"). */
export function ShimmerLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(Boolean(e?.isIntersecting)), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Link ref={ref} href={href} className={`${className}${live ? " is-live" : ""}`}>
      {children}
    </Link>
  );
}
