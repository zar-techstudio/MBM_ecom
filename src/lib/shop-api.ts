import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Talks to the ERP for signed-in shopping (see the ERP's docs/STOREFRONT_API.md).
 * - Database functions are called with the public key; the shopper's session is passed as an
 *   argument and checked by the ERP.
 * - The session lives only in an HttpOnly cookie on this server, never in page scripts.
 * - Two calls go to the ERP server with SHOP_API_SECRET (sending a code, starting a payment).
 */

export const ERP_URL = "https://erp.maqdoomsbigmall.com";
const COOKIE = "mbs";
const SIXTY_DAYS = 60 * 24 * 60 * 60;

/** An error the shopper can read. status 401 = "Please sign in again". */
export class ShopError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ShopError("The shop is not set up", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) {
    if (error.code === "28000") throw new ShopError("Please sign in again", 401);
    // ERP errors are written for shoppers; anything technical gets a plain fallback.
    const plain = error.message && !/(function|column|relation|syntax|permission|schema)/i.test(error.message);
    throw new ShopError(plain ? error.message : "Something went wrong. Please try again.", 400);
  }
  return data as T;
}

export async function getSession() {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function requireSession() {
  const s = await getSession();
  if (!s) throw new ShopError("Please sign in again", 401);
  return s;
}

export async function setSession(value: string, days = 60) {
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.min(days * 86400, SIXTY_DAYS),
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** POST to the ERP server with the shared secret. */
export async function erpPost<T>(path: string, body: unknown, ip?: string | null): Promise<T> {
  const secret = process.env.SHOP_API_SECRET;
  if (!secret) throw new ShopError("Online checkout is not set up yet", 503);
  const res = await fetch(`${ERP_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shop-key": secret, ...(ip ? { "x-client-ip": ip } : {}) },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    if (res.status === 503) throw new ShopError(data.error || "This is not available right now", 503);
    if (res.status === 401) throw new ShopError("Something went wrong. Please try again.", 500);
    throw new ShopError(data.error || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

/** Forward a review photo (raw image bytes) to the ERP, which stores it. */
export async function erpReviewPhoto(token: string, type: string, body: ArrayBuffer) {
  const secret = process.env.SHOP_API_SECRET;
  if (!secret) throw new ShopError("Photos can't be added right now", 503);
  const res = await fetch(`${ERP_URL}/api/shop/review-photo`, {
    method: "POST",
    headers: { "content-type": type, "x-shop-key": secret, "x-review-token": token },
    body,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { photo?: string; error?: string };
  if (!res.ok || !data.photo) throw new ShopError(data.error || "The photo couldn't be added. Try another one.", res.status === 503 ? 503 : 400);
  return { photo: data.photo };
}
