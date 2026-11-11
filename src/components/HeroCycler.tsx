"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_OUTFITS } from "@/lib/hero";

const OUTFITS = HERO_OUTFITS;
const HOLD_MS = 4800;

/**
 * Changes the hero's four outfits every few seconds. Each change is a curtain reveal: the new
 * outfit is unveiled from the bottom up behind a gold line. Pauses while the tab is hidden.
 */
export function HeroCycler() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const slow = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % OUTFITS.length), slow ? 8000 : HOLD_MS);
    return () => window.clearTimeout(t);
  }, [index, visible]);

  // curtain reveal: the new outfit rises in from the bottom while the old one is cut away above it
  const prev = useRef(index);
  useEffect(() => {
    const from = prev.current;
    prev.current = index;
    if (from === index) return; // first paint: show the first outfit as it is, no animation
    document.querySelectorAll<HTMLImageElement>(".model-outfit:not(.curtain-glow)").forEach((img, i) => {
      img.classList.remove("active", "reveal", "leaving");
      if (i === index) img.classList.add("active", "reveal");
      else if (i === from) img.classList.add("leaving");
    });
    // the gold edge follows the new outfit's own outline
    const glow = document.querySelector<HTMLImageElement>(".curtain-glow");
    if (glow) {
      glow.classList.remove("run");
      glow.src = OUTFITS[index]!.src;
      void glow.offsetWidth; // restart the animation
      glow.classList.add("run");
    }
  }, [index]);

  return null; // no visible controls: the outfits simply change on their own
}
