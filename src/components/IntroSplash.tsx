"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SEEN_KEY = "mbm-intro-seen";
const SPEED = 1.5; // the 10-second drawing plays in about 7 seconds

/**
 * Opening animation (public/images/intro.webm: the showroom drawn in line art), shown once per
 * phone, only when a visit starts on the home page. Never on desktops, for shoppers who prefer
 * less motion, on data saver or a slow connection. The video file is only requested on phones.
 */
export function IntroSplash() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const close = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setLeaving(true);
    window.setTimeout(() => setShow(false), 600);
  }, []);

  useEffect(() => {
    if (path !== "/") return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const phone = window.matchMedia("(max-width: 767px) and (orientation: portrait)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slow = conn?.saveData || /(^|-)2g|3g/.test(conn?.effectiveType ?? "");
    let seen = false;
    try {
      seen = Boolean(localStorage.getItem(SEEN_KEY));
    } catch {}
    if (!phone || calm || slow || seen) return;
    const t = window.setTimeout(() => setShow(true), 0);
    return () => window.clearTimeout(t);
    // only when the visit starts here, not when coming back to the home page later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const skip = window.setTimeout(() => setCanSkip(true), 800);
    const safety = window.setTimeout(() => close(), 12_000); // never stay stuck on the intro
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(skip);
      window.clearTimeout(safety);
    };
  }, [show, close]);

  if (!show) return null;
  return (
    <div className={`intro${leaving ? " is-leaving" : ""}`} aria-hidden="true">
      <video
        ref={video}
        src="/images/intro.webm"
        muted
        playsInline
        autoPlay
        preload="auto"
        onLoadedMetadata={(e) => (e.currentTarget.playbackRate = SPEED)}
        onEnded={close}
        onError={close}
      />
      {canSkip ? (
        <button type="button" className="intro-skip" onClick={close}>
          Skip
        </button>
      ) : null}
    </div>
  );
}
