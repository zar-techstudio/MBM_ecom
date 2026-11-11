"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Img = { large: string; card: string };

const SWIPE_PX = 40; // a finger moving further than this sideways changes the photo
const TAP_PX = 10; // ...and less than this counts as a tap
const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;

/**
 * Product photos. Swipe (phones), arrows or thumbnails change the photo. On desktop the photo zooms
 * in under the cursor; a tap or click opens it full screen, where it can be pinched, double-tapped
 * (or clicked) to zoom, dragged when zoomed, and swiped to the next photo. URLs are built on the server.
 */
export function ProductGallery({ images, title }: { images: Img[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false); // desktop hover zoom
  const [viewer, setViewer] = useState(false);
  const main = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = images.length;

  const step = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  if (!count) return <div className="sf-gallery-main sf-gallery-empty" aria-hidden="true" />;
  const at = Math.min(index, count - 1);
  const current = images[at];

  return (
    <div className="sf-gallery">
      <div
        ref={main}
        className={`sf-gallery-main${zoom ? " is-zoom" : ""}`}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") touch.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const t = touch.current;
          touch.current = null;
          if (e.pointerType === "mouse") return setViewer(true);
          if (!t) return;
          const dx = e.clientX - t.x;
          const dy = e.clientY - t.y;
          if (count > 1 && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
          else if (Math.hypot(dx, dy) < TAP_PX) setViewer(true);
        }}
        onPointerCancel={() => (touch.current = null)}
        onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
          e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.large}
          alt={`${title} — photo ${at + 1} of ${count}`}
          width={1600}
          height={2000}
          fetchPriority="high"
          draggable={false}
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              className="sf-gallery-arrow is-prev"
              aria-label="Previous photo"
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => step(-1)}
            >
              &larr;
            </button>
            <button
              type="button"
              className="sf-gallery-arrow is-next"
              aria-label="Next photo"
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => step(1)}
            >
              &rarr;
            </button>
            <span className="sf-gallery-count" aria-hidden="true">
              {at + 1} / {count}
            </span>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="sf-gallery-thumbs" role="tablist" aria-label="Product photos">
          {images.map((img, i) => (
            <button
              key={img.large}
              type="button"
              role="tab"
              aria-selected={i === at}
              aria-label={`Photo ${i + 1}`}
              className={`sf-thumb${i === at ? " active" : ""}`}
              onClick={() => setIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.card} alt="" width={120} height={150} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
      {viewer ? <Viewer images={images} title={title} index={at} onIndex={setIndex} onClose={() => setViewer(false)} /> : null}
    </div>
  );
}

/** Full-screen photo with pinch, double-tap/click zoom, drag to look around, and swipe. */
function Viewer({
  images,
  title,
  index,
  onIndex,
  onClose,
}: {
  images: Img[];
  title: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const [moving, setMoving] = useState(false);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; vx: number; vy: number; s: number; d: number } | null>(null);
  const lastTap = useRef(0);
  const stage = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (d: number) => {
      onIndex((index + d + count) % count);
      setView({ s: 1, x: 0, y: 0 });
    },
    [count, index, onIndex],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && count > 1) go(-1);
      if (e.key === "ArrowRight" && count > 1) go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, go, onClose]);

  /** Zoom to scale s keeping the screen point (px, py) under the finger/cursor. */
  const zoomAt = (s: number, px: number, py: number) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r || s <= 1) return setView({ s: 1, x: 0, y: 0 });
    const cx = px - (r.left + r.width / 2);
    const cy = py - (r.top + r.height / 2);
    setView({ s, x: (1 - s) * cx, y: (1 - s) * cy });
  };

  const spread = () => {
    const [a, b] = [...pts.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  return (
    <div className="sf-viewer" role="dialog" aria-modal="true" aria-label={`${title} photos`}>
      <div
        ref={stage}
        className="sf-viewer-stage"
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId); // keep getting moves if the finger leaves the photo
          } catch {}
          pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          setMoving(true);
          gesture.current = {
            x: e.clientX,
            y: e.clientY,
            vx: view.x,
            vy: view.y,
            s: view.s,
            d: pts.current.size === 2 ? spread() : 0,
          };
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g || !pts.current.has(e.pointerId)) return;
          pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pts.current.size === 2 && g.d) {
            const s = Math.min(MAX_ZOOM, Math.max(1, (g.s * spread()) / g.d));
            setView((v) => (s === 1 ? { s: 1, x: 0, y: 0 } : { ...v, s }));
          } else if (pts.current.size === 1 && view.s > 1) {
            setView((v) => ({ ...v, x: g.vx + e.clientX - g.x, y: g.vy + e.clientY - g.y }));
          }
        }}
        onPointerUp={(e) => {
          const g = gesture.current;
          const many = pts.current.size > 1;
          pts.current.delete(e.pointerId);
          if (pts.current.size) {
            // One finger lifted from a pinch: carry on with the other as a drag.
            const [p] = [...pts.current.values()];
            gesture.current = { x: p.x, y: p.y, vx: view.x, vy: view.y, s: view.s, d: 0 };
            return;
          }
          setMoving(false);
          gesture.current = null;
          if (!g || many) return;
          const dx = e.clientX - g.x;
          const dy = e.clientY - g.y;
          const tap = Math.hypot(dx, dy) < TAP_PX;
          if (view.s === 1 && count > 1 && Math.abs(dx) > SWIPE_PX * 1.5 && Math.abs(dx) > Math.abs(dy)) return go(dx < 0 ? 1 : -1);
          if (!tap) return;
          const now = Date.now();
          const double = now - lastTap.current < 320;
          lastTap.current = double ? 0 : now;
          // Mouse: one click zooms in or out. Touch: a double tap does.
          if (e.pointerType === "mouse" || double) zoomAt(view.s > 1 ? 1 : TAP_ZOOM, e.clientX, e.clientY);
        }}
        onPointerCancel={(e) => {
          pts.current.delete(e.pointerId);
          if (!pts.current.size) {
            setMoving(false);
            gesture.current = null;
          }
        }}
        onWheel={(e) => zoomAt(Math.min(MAX_ZOOM, Math.max(1, view.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2))), e.clientX, e.clientY)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index].large}
          alt={`${title} — photo ${index + 1} of ${count}`}
          draggable={false}
          className={moving ? "is-moving" : undefined}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, cursor: view.s > 1 ? "zoom-out" : "zoom-in" }}
        />
      </div>
      <button type="button" className="sf-viewer-close" aria-label="Close" onClick={onClose}>
        &times;
      </button>
      {count > 1 ? (
        <>
          <button type="button" className="sf-gallery-arrow is-prev" aria-label="Previous photo" onClick={() => go(-1)}>
            &larr;
          </button>
          <button type="button" className="sf-gallery-arrow is-next" aria-label="Next photo" onClick={() => go(1)}>
            &rarr;
          </button>
        </>
      ) : null}
      <p className="sf-viewer-hint">
        {count > 1 ? `${index + 1} / ${count} · ` : ""}
        <span className="sf-viewer-touch">Pinch or double-tap to zoom</span>
        <span className="sf-viewer-mouse">Click or scroll to zoom</span>
      </p>
    </div>
  );
}
