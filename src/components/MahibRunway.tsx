"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Look } from "@/lib/looks";
import { whatsappLink } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

/** Where a look sits relative to the one in the spotlight: 0 centre, -1 left, 1 right, else hidden. */
function offsetOf(i: number, active: number, count: number) {
  let d = (i - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

/** MAHIB runway: complete wedding looks on a dark, spotlit stage. Swipe or use the arrows;
 * "View the look" opens the list of pieces with a WhatsApp order button. */
export function MahibRunway({ looks, whatsappNumber, pageUrl }: { looks: Look[]; whatsappNumber: string; pageUrl: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const count = looks.length;
  const look = looks[active];

  const go = useCallback((step: number) => setActive((a) => (a + step + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const order = whatsappLink(
    whatsappNumber,
    [
      `Hello, I'd like the MAHIB look "${look.name}":`,
      ...look.pieces.map((p) => `- ${p.name}`),
      `${pageUrl}#runway`,
    ].join("\n"),
  );

  return (
    <section
      className={`mahib-runway${open ? " is-open" : ""}`}
      id="runway"
      aria-roledescription="carousel"
      aria-label="MAHIB wedding looks"
      onKeyDown={(e) => {
        if (open) return;
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div className="container runway-head">
        <div>
          <div className="runway-label">The MAHIB Runway</div>
          <h2 className="runway-title">Dressed for every night of the wedding</h2>
        </div>
        <div className="runway-count" aria-hidden="true">
          <span>{pad(active + 1)}</span> / {pad(count)}
        </div>
      </div>

      <div
        className="runway-stage"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" || open) return;
          drag.current = { x: e.clientX, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="runway-spotlight" aria-hidden="true" />
        <div className="runway-floor" aria-hidden="true" />

        {looks.map((l, i) => {
          const off = offsetOf(i, active, count);
          const pos = off === 0 ? "center" : off === -1 ? "left" : off === 1 ? "right" : "away";
          return (
            <button
              key={l.id}
              type="button"
              className={`runway-model is-${pos}`}
              aria-hidden={pos === "away"}
              tabIndex={pos === "away" ? -1 : 0}
              aria-label={off === 0 ? `View the pieces in ${l.name}` : `Show ${l.name}`}
              onClick={() => (off === 0 ? setOpen(true) : setActive(i))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt={l.alt} loading={i === 0 ? "eager" : "lazy"} draggable={false} />
            </button>
          );
        })}

        <div className="runway-fade" aria-hidden="true" />

        <div className="runway-caption" aria-live="polite">
          <span className="runway-num" aria-hidden="true">
            {pad(active + 1)}
          </span>
          <h3 className="runway-name">{look.name}</h3>
          <p className="runway-occasion">{look.occasion}</p>
          <button type="button" className="runway-view" onClick={() => setOpen(true)}>
            View the look <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        <button type="button" className="runway-arrow is-prev" aria-label="Previous look" onClick={() => go(-1)}>
          &larr;
        </button>
        <button type="button" className="runway-arrow is-next" aria-label="Next look" onClick={() => go(1)}>
          &rarr;
        </button>

        <div className="runway-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
        <div
          ref={panelRef}
          className="runway-panel"
          role="dialog"
          aria-modal="false"
          aria-label={`In this look: ${look.name}`}
          aria-hidden={!open}
          tabIndex={-1}
          inert={!open}
        >
          <button type="button" className="runway-close" aria-label="Close" onClick={() => setOpen(false)}>
            &times;
          </button>
          <div className="runway-label">In this look</div>
          <h3 className="runway-panel-title">{look.name}</h3>
          <ol className="runway-pieces">
            {look.pieces.map((p, i) => (
              <li key={p.name}>
                <span className="runway-piece-num">{pad(i + 1)}</span>
                <span className="runway-piece-text">
                  {p.href ? (
                    <Link href={p.href} className="runway-piece-name">
                      {p.name}
                    </Link>
                  ) : (
                    <span className="runway-piece-name">{p.name}</span>
                  )}
                  <span className="runway-piece-note">{p.note}</span>
                </span>
              </li>
            ))}
          </ol>
          <a className="runway-order" href={order} target="_blank" rel="noopener noreferrer">
            Order this look on WhatsApp
          </a>
          <p className="runway-panel-note">Every piece is fitted to you. We confirm sizes and price on WhatsApp before you pay.</p>
        </div>
      </div>

      <nav className="container runway-tabs" aria-label="Choose a look">
        {looks.map((l, i) => (
          <button
            key={l.id}
            type="button"
            className={`runway-tab${i === active ? " active" : ""}`}
            aria-current={i === active}
            onClick={() => {
              setActive(i);
              setOpen(false);
            }}
          >
            <span className="runway-tab-num">{pad(i + 1)}</span>
            <span className="runway-tab-name">{l.name.replace(/^The /, "")}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
