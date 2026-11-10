"use client";

import { useEffect, useRef, useState } from "react";

const HOLD_MS = 350; // phone: how long a finger rests before the preview starts
const HOVER_MS = 250; // desktop: how long the cursor rests before the preview starts
const MOVE_PX = 10; // a finger that moves further than this is scrolling, not holding
const HINT_KEY = "mbm-hold-hint-seen";

/**
 * Product card photo. If the product has a second photo or a short video, holding a finger on the
 * card (phones) or resting the cursor on it (desktop) shows it; letting go goes back. A normal tap or
 * click still opens the product. The second photo or video only loads once someone reaches for it.
 */
export function CardMedia({
  src,
  alt,
  hover,
  video,
  hint,
  children,
}: {
  src: string | null;
  alt: string;
  hover: string | null;
  video: string | null;
  /** Show the one-time "Hold to preview" tip here (first card with a preview). */
  hint?: boolean;
  children?: React.ReactNode;
}) {
  const extra = Boolean(hover || video);
  const [loaded, setLoaded] = useState(false); // second photo / video requested
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tip, setTip] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false); // a touch hold happened, so swallow the click that follows
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    if (on) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [on, loaded]);

  // One-time tip, phones only (desktop shoppers find hover on their own).
  useEffect(() => {
    if (!hint || !extra || !window.matchMedia("(hover: none)").matches) return;
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {
      return;
    }
    const show = window.setTimeout(() => {
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {}
      setTip(true);
    }, 800);
    const hide = window.setTimeout(() => setTip(false), 5800);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [hint, extra]);

  const begin = (touch: boolean) => {
    held.current = touch;
    setTip(false);
    setOn(true);
  };
  const end = () => {
    window.clearTimeout(timer.current);
    start.current = null;
    setOn(false);
    setPlaying(false);
  };

  const handlers = extra
    ? {
        onPointerEnter: (e: React.PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          setLoaded(true);
          timer.current = window.setTimeout(() => begin(false), HOVER_MS);
        },
        onPointerLeave: (e: React.PointerEvent) => {
          if (e.pointerType === "mouse") end();
        },
        onPointerDown: (e: React.PointerEvent) => {
          if (e.pointerType === "mouse") return;
          held.current = false;
          start.current = { x: e.clientX, y: e.clientY };
          setLoaded(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => begin(true), HOLD_MS);
        },
        onPointerMove: (e: React.PointerEvent) => {
          const s = start.current;
          if (!s || e.pointerType === "mouse") return;
          if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_PX) end();
        },
        onPointerUp: (e: React.PointerEvent) => {
          if (e.pointerType !== "mouse") end();
        },
        onPointerCancel: end,
        // Stops the phone's own "save image / open link" menu from covering the preview.
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        onClickCapture: (e: React.MouseEvent) => {
          if (!held.current) return;
          held.current = false;
          e.preventDefault();
          e.stopPropagation();
        },
      }
    : {};

  const showing = on && (video ? playing : true);

  return (
    <div className={`product-media-box${extra ? " has-preview" : ""}${showing ? " is-previewing" : ""}`} {...handlers}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="product-img" src={src} alt={alt} loading="lazy" width={600} height={750} draggable={false} />
      ) : null}
      {loaded && video ? (
        <video
          ref={vid}
          className="card-preview"
          src={video}
          poster={hover ?? undefined}
          muted
          playsInline
          loop
          preload="auto"
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
        />
      ) : loaded && hover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="card-preview" src={hover} alt="" aria-hidden="true" draggable={false} />
      ) : null}
      {video ? (
        <span className="card-play" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      ) : null}
      {tip ? <span className="card-hint">Hold to preview</span> : null}
      {children}
    </div>
  );
}
