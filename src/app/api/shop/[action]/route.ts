import {
  ShopError,
  clearSession,
  erpPost,
  getSession,
  requireSession,
  rpc,
  setSession,
} from "@/lib/shop-api";

/**
 * POST /api/shop/<action> with a JSON body: every account and checkout call goes through here,
 * so the session cookie never reaches page scripts. Answers JSON; errors are { error } with a
 * message ready to show (401 means "sign in again").
 */
type Body = Record<string, unknown>;
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const actions: Record<string, (b: Body, req: Request) => Promise<unknown>> = {
  // ---- sign-in ----
  async otp(b, req) {
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    return erpPost("/api/shop/otp", { phone: str(b.phone, 20) }, ip);
  },
  async verify(b) {
    const r = await rpc<{ ok: boolean; session?: string; expires_in_days?: number; needs_name?: boolean; error?: string }>(
      "storefront_verify_otp",
      { p_phone: str(b.phone, 20), p_code: str(b.code, 10) },
    );
    if (!r.ok || !r.session) return { ok: false, error: r.error ?? "That code didn't work. Please try again." };
    await setSession(r.session, r.expires_in_days ?? 60);
    return { ok: true, needs_name: Boolean(r.needs_name) };
  },
  async signout() {
    const s = await getSession();
    if (s) await rpc("storefront_sign_out", { p_session: s }).catch(() => null);
    await clearSession();
    return { ok: true };
  },

  // ---- account ----
  async me() {
    const s = await getSession();
    return s ? rpc("storefront_me", { p_session: s }) : null; // null = not signed in (a normal answer)
  },
  async profile(b) {
    return rpc("storefront_upsert_profile", {
      p_session: await requireSession(),
      p_name: str(b.name, 80),
      p_email: str(b.email, 120) || null,
    });
  },
  async address(b) {
    return rpc("storefront_save_address", { p_session: await requireSession(), p_address: b.address ?? {} });
  },
  async "address-delete"(b) {
    return rpc("storefront_delete_address", { p_session: await requireSession(), p_address: str(b.id, 60) });
  },
  async sync(b) {
    const s = await requireSession();
    const replace = b.replace === true;
    const [bag, wishlist] = await Promise.all([
      Array.isArray(b.bag) ? rpc("storefront_sync_bag", { p_session: s, p_items: b.bag.slice(0, 50), p_replace: replace }) : null,
      Array.isArray(b.wishlist)
        ? rpc("storefront_sync_wishlist", { p_session: s, p_slugs: b.wishlist.slice(0, 200), p_replace: replace })
        : null,
    ]);
    return { bag, wishlist };
  },

  // ---- checkout ----
  async quote(b) {
    return rpc("storefront_quote", {
      p_session: await getSession(), // a guest gets an estimate
      p_items: Array.isArray(b.items) ? b.items.slice(0, 50) : [],
      p_address: str(b.address, 60) || null,
      p_coupon: str(b.coupon, 40) || null,
      p_use_points: b.use_points === true,
    });
  },
  async place(b) {
    return rpc("storefront_place_order", {
      p_session: await requireSession(),
      p_quote: str(b.quote, 60),
      p_method: b.method === "cod" ? "cod" : "online",
    });
  },
  async pay(b) {
    return erpPost("/api/shop/pay", { session: await requireSession(), code: str(b.code, 20) });
  },
  async order(b) {
    return rpc("storefront_order", { p_session: await requireSession(), p_code: str(b.code, 20) });
  },
  async orders() {
    return rpc("storefront_my_orders", { p_session: await requireSession() });
  },
  async cancel(b) {
    return rpc("storefront_cancel_order", { p_session: await requireSession(), p_code: str(b.code, 20) });
  },
  async invoice(b) {
    return rpc("storefront_invoice", { p_session: await requireSession(), p_code: str(b.code, 20) });
  },

  // ---- loyalty ----
  async points() {
    return rpc("storefront_points", { p_session: await requireSession() });
  },

  // ---- reviews (the link's code is the permission; no sign-in needed) ----
  async "review-form"(b) {
    return rpc("storefront_review_form", { p_token: str(b.token, 80) });
  },
  async "review-submit"(b) {
    const stars = Math.round(Number(b.stars));
    if (!(stars >= 1 && stars <= 5)) throw new ShopError("Choose 1 to 5 stars");
    return rpc("storefront_submit_review", {
      p_token: str(b.token, 80),
      p_slug: str(b.slug, 120),
      p_stars: stars,
      p_body: str(b.body, 2000) || null,
      p_photo: str(b.photo, 200) || null,
    });
  },
  async reviews(b) {
    const limit = Math.min(Math.max(Number(b.limit) || 10, 1), 30);
    return rpc("storefront_reviews", { p_slug: str(b.slug, 120), p_limit: limit, p_offset: Math.max(Number(b.offset) || 0, 0) });
  },
};

export async function POST(request: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const run = Object.hasOwn(actions, action) ? actions[action] : undefined;
  if (!run) return Response.json({ error: "Not found" }, { status: 404 });
  // JSON only: a plain cross-site form can't send this, which keeps the session cookie safe.
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({ error: "Bad request" }, { status: 415 });
  try {
    const body = ((await request.json().catch(() => ({}))) ?? {}) as Body;
    const data = await run(body, request);
    return Response.json(data ?? null, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e instanceof ShopError ? e : new ShopError("Something went wrong. Please try again.", 500);
    if (err.status === 401) await clearSession();
    return Response.json({ error: err.message }, { status: err.status, headers: { "Cache-Control": "no-store" } });
  }
}
