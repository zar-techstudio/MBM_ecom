"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ProductCard } from "./catalogue";
import { onShopChange, replaceFromAccount, shopSnapshot, toSaved, type BagLine } from "./shop-store";

/** The shopper's account in the browser: sign-in state, profile, addresses, and keeping the
 * bag and wishlist in step with the account. All calls go through /api/shop/<action>. */

export type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
};

export type Me = {
  /** Null when the shopper signed in with an email and has not added a mobile yet. */
  phone: string | null;
  name: string | null;
  email: string | null;
  /** A mobile number confirmed with a code: needed before an order can be placed. */
  phone_verified?: boolean;
  /** The email the shopper signed in with (it cannot be changed in the profile). */
  email_verified?: boolean;
  addresses: Address[];
  bag: { size: string | null; qty: number; product: ProductCard }[];
  wishlist: ProductCard[];
  points: number | null;
};

export type QuoteLine = {
  slug: string;
  title: string;
  size: string | null;
  qty: number;
  price_paise: number;
  discount_paise: number;
  final_paise: number;
  gst_paise: number;
};

export type Quote = {
  quote_id: string | null;
  expires_at: string | null;
  estimate: boolean;
  supply: "intra_state" | "inter_state";
  lines: QuoteLine[];
  problems: { slug: string; size: string | null; error: string; available?: number }[];
  subtotal_paise: number;
  discount_paise: number;
  coupon: { code: string; description: string } | null;
  coupon_error: string | null;
  delivery_paise: number;
  free_delivery_from_paise: number | null;
  total_paise: number;
  gst: { taxable_paise: number; cgst_paise: number; sgst_paise: number; igst_paise: number; total_paise: number };
  cod_available: boolean;
  /** Present when points were asked for: how many are used and what they take off (already in discount_paise). */
  points: { balance: number; used: number; discount_paise: number } | null;
};

export type Points = {
  balance: number;
  point_value_paise: number;
  earn_per_paise: number;
  min_bill_paise: number | null;
  max_share_bps: number | null;
  expiry_months: number | null;
  history: { kind: "earn" | "take_back" | "use" | "give_back" | "expire" | "adjust"; points: number; at: string; expires_at: string | null; bill: string | null; order: string | null }[];
};

export type OrderStatus =
  | "awaiting_payment"
  | "payment_not_received"
  | "paid"
  | "placed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_due"
  | "refunded"
  | "returned";

export type Order = {
  code: string;
  status: OrderStatus;
  method: "online" | "cod";
  placed_at: string;
  pay_by: string | null;
  subtotal_paise: number;
  discount_paise: number;
  delivery_paise: number;
  total_paise: number;
  address: Partial<Address> | null;
  courier: string | null;
  awb: string | null;
  bill: string | null;
  items: { title: string; size: string | null; price_paise: number; final_paise: number; product?: ProductCard }[];
  timeline: { status: OrderStatus; at: string }[];
};

/** What to tell the shopper for each order status (from the ERP's API notes). */
export const STATUS_TEXT: Record<OrderStatus, string> = {
  awaiting_payment: "Waiting for your payment",
  payment_not_received: "Payment not received",
  paid: "Order confirmed",
  placed: "Order confirmed · cash on delivery",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_due: "Cancelled · your money is being returned",
  refunded: "Cancelled · your money has been returned",
  returned: "Returned to us · nothing to pay",
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`/api/shop/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    if (res.status === 401) setState({ status: "guest", me: null });
    throw new ApiError(data.error || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

// ---- sign-in state ----
type State = { status: "unknown" | "guest" | "signed"; me: Me | null };
let state: State = { status: "unknown", me: null };
const listeners = new Set<() => void>();
function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Account state; the first component that asks loads it. */
export function useAccount() {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
  useEffect(() => {
    if (state.status === "unknown") void refreshMe();
  }, []);
  return s;
}

let loading: Promise<void> | null = null;
export function refreshMe() {
  loading ??= api<Me | null>("me")
    .then((me) => setState(me ? { status: "signed", me } : { status: "guest", me: null }))
    .catch(() => setState({ status: "guest", me: null }))
    .finally(() => (loading = null));
  return loading;
}

export const setMe = (me: Me) => setState({ status: "signed", me });

const toLines = (bag: Me["bag"]): BagLine[] =>
  bag.map((l) => ({ ...toSaved(l.product), size: l.size, qty: l.qty }));

/** After signing in: merge this device's bag and wishlist into the account, then use the account's. */
export async function mergeAfterSignIn() {
  const local = shopSnapshot();
  const r = await api<{ bag: Me["bag"] | null; wishlist: ProductCard[] | null }>("sync", {
    bag: local.bag.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty })),
    wishlist: local.wish.map((w) => w.slug),
    replace: false,
  });
  replaceFromAccount(toLines(r.bag ?? []), (r.wishlist ?? []).map(toSaved));
  await refreshMe();
}

// While signed in, every change on this device is saved to the account (shortly after).
let timer: number | undefined;
if (typeof window !== "undefined") {
  onShopChange((s) => {
    if (state.status !== "signed") return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void api("sync", {
        bag: s.bag.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty })),
        wishlist: s.wish.map((w) => w.slug),
        replace: true,
      }).catch(() => {});
    }, 700);
  });
}

export async function signOut() {
  await api("signout").catch(() => {});
  setState({ status: "guest", me: null });
}

/** Indian states and union territories, for addresses (the ERP decides GST from it). */
export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];
