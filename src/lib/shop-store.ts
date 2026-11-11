"use client";

import { useSyncExternalStore } from "react";

/**
 * Bag, wishlist and recently viewed, kept on the shopper's device (no account needed).
 * When sign-in arrives (Phase B in docs/ECOMMERCE_ROADMAP.md) these lists are sent to the
 * ERP and merged into the account. Prices here are only for display: the bag page re-reads
 * live prices and stock before ordering.
 */

export type SavedProduct = {
  slug: string;
  title: string;
  thumbnail: string | null;
  category: string;
  kind: "garment" | "fabric" | "empty";
  price_min_paise: number | null;
  price_max_paise: number | null;
  sold_out?: boolean;
};

export type BagLine = SavedProduct & {
  size: string | null; // null until chosen (e.g. added from an outfit)
  qty: number;
  look?: string; // outfit name when added from "Buy the look"
};

type State = { bag: BagLine[]; wish: SavedProduct[]; seen: SavedProduct[] };

const KEY = "mbm-shop-v1";
const EMPTY: State = { bag: [], wish: [], seen: [] };
const listeners = new Set<() => void>();
let state: State = EMPTY;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<State>) };
  } catch {}
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      state = e.newValue ? { ...EMPTY, ...(JSON.parse(e.newValue) as Partial<State>) } : EMPTY;
    } catch {
      state = EMPTY;
    }
    listeners.forEach((l) => l());
  });
}

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
  changeListeners.forEach((l) => l(next));
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Read the lists in a component; re-renders when they change (also from other tabs). */
export function useShop() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

const pick = (p: SavedProduct): SavedProduct => ({
  slug: p.slug,
  title: p.title,
  thumbnail: p.thumbnail,
  category: p.category,
  kind: p.kind,
  price_min_paise: p.price_min_paise,
  price_max_paise: p.price_max_paise,
  sold_out: p.sold_out,
});

const sameLine = (a: BagLine, slug: string, size: string | null) => a.slug === slug && a.size === size;

export const shop = {
  /** Add to the bag (one more if the same piece and size is already there). */
  add(p: SavedProduct, size: string | null, qty = 1, look?: string) {
    load();
    const bag = [...state.bag];
    const i = bag.findIndex((l) => sameLine(l, p.slug, size));
    if (i >= 0) bag[i] = { ...bag[i], qty: Math.min(10, bag[i].qty + qty) };
    else bag.push({ ...pick(p), size, qty, look });
    set({ ...state, bag });
  },
  setQty(slug: string, size: string | null, qty: number) {
    set({
      ...state,
      bag: state.bag
        .map((l) => (sameLine(l, slug, size) ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)),
    });
  },
  /** Change a line's size; merges into an existing line of that size. */
  setSize(slug: string, from: string | null, to: string) {
    const bag = state.bag;
    const line = bag.find((l) => sameLine(l, slug, from));
    if (!line) return;
    const merged = bag.find((l) => sameLine(l, slug, to));
    set({
      ...state,
      bag: merged
        ? bag.filter((l) => l !== line).map((l) => (l === merged ? { ...l, qty: Math.min(10, l.qty + line.qty) } : l))
        : bag.map((l) => (l === line ? { ...l, size: to } : l)),
    });
  },
  remove(slug: string, size: string | null) {
    set({ ...state, bag: state.bag.filter((l) => !sameLine(l, slug, size)) });
  },
  clearBag() {
    set({ ...state, bag: [] });
  },
  toggleWish(p: SavedProduct) {
    load();
    const has = state.wish.some((w) => w.slug === p.slug);
    set({ ...state, wish: has ? state.wish.filter((w) => w.slug !== p.slug) : [pick(p), ...state.wish].slice(0, 100) });
    return !has;
  },
  /** Bag line → wishlist. */
  saveForLater(slug: string, size: string | null) {
    const line = state.bag.find((l) => sameLine(l, slug, size));
    if (!line) return;
    set({
      ...state,
      bag: state.bag.filter((l) => l !== line),
      wish: state.wish.some((w) => w.slug === slug) ? state.wish : [pick(line), ...state.wish],
    });
  },
  viewed(p: SavedProduct) {
    load();
    set({ ...state, seen: [pick(p), ...state.seen.filter((s) => s.slug !== p.slug)].slice(0, 12) });
  },
};

/** Called after every change made on this device (not for lists replaced from the account). */
const changeListeners = new Set<(s: State) => void>();
export function onShopChange(l: (s: State) => void) {
  changeListeners.add(l);
  return () => changeListeners.delete(l);
}

/** Replace the bag and wishlist with the signed-in account's (keeps "recently viewed"). */
export function replaceFromAccount(bag: BagLine[], wish: SavedProduct[]) {
  load();
  state = { ...state, bag, wish };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

export function shopSnapshot() {
  load();
  return state;
}

export const bagCount = (s: State) => s.bag.reduce((n, l) => n + l.qty, 0);

/** Card data in the shape the lists keep. */
export function toSaved(p: {
  slug: string;
  title: string;
  thumbnail: string | null;
  category: { name: string };
  kind: "garment" | "fabric" | "empty";
  price_min_paise: number | null;
  price_max_paise: number | null;
  sold_out?: boolean;
}): SavedProduct {
  return {
    slug: p.slug,
    title: p.title,
    thumbnail: p.thumbnail,
    category: p.category.name,
    kind: p.kind,
    price_min_paise: p.price_min_paise,
    price_max_paise: p.price_max_paise,
    sold_out: p.sold_out,
  };
}
