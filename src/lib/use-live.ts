"use client";

import { useEffect, useState } from "react";
import type { SizeOption } from "./catalogue";

export type Live = { slug: string; found: boolean; kind: "garment" | "fabric" | "empty"; sold_out: boolean; sizes: SizeOption[] };

/** Live sizes, prices and stock for a list of products (bag, wishlist). null while loading. */
export function useLive(slugs: string[]) {
  const key = [...new Set(slugs)].sort().join(",");
  const [data, setData] = useState<{ key: string; map: Record<string, Live> } | null>(null);
  useEffect(() => {
    if (!key) return;
    const ctl = new AbortController();
    fetch(`/api/products?slugs=${encodeURIComponent(key)}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((list: Live[]) => setData({ key, map: Object.fromEntries(list.map((l) => [l.slug, l])) }))
      .catch(() => {});
    return () => ctl.abort();
  }, [key]);
  if (!key) return {} as Record<string, Live>;
  if (data?.key === key) return data.map;
  // A piece was removed: what we already know still covers every product, so keep showing it.
  if (data && key.split(",").every((slug) => slug in data.map)) return data.map;
  return null;
}

/** Sizes a shopper can pick (named, with pieces left). One unnamed size means "one size". */
export const pickable = (l: Live | undefined) => (l ? l.sizes.filter((s) => s.left > 0) : []);
export const priceOf = (l: Live | undefined, size: string | null) =>
  l?.sizes.find((s) => s.size === size)?.price_paise ?? null;
