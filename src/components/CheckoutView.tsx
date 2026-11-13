"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, signOut, useAccount, type Order, type Quote } from "@/lib/account";
import { openRazorpay, type PayInfo } from "@/lib/razorpay";
import { shop, useShop } from "@/lib/shop-store";
import { formatINR, imageUrl } from "@/lib/site";
import { AddressForm } from "./AddressForm";
import { SignIn } from "./SignIn";

const rupees = (p: number | null | undefined) => formatINR(p ?? 0);

/**
 * Checkout: 1 mobile + code (guests browse freely; this is the first time we ask), 2 address,
 * 3 review with coupon and payment method, then place. Prices, GST, delivery and cash-on-delivery
 * all come from the ERP's quote; the website never decides an amount.
 */
export function CheckoutView() {
  const router = useRouter();
  const { status, me } = useAccount();
  const { bag } = useShop();
  const signed = status === "signed" && me;
  // An order needs a confirmed mobile number (an email sign-in adds one here first).
  const phoneOk = Boolean(signed && me.phone && me.phone_verified !== false);
  const [joined, setJoined] = useState(false);

  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [couponText, setCouponText] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [method, setMethod] = useState<"online" | "cod">("online");
  const [quote, setQuote] = useState<{ key: string; q: Quote } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The chosen address: picked, else the default, else the first.
  const addresses = me?.addresses ?? [];
  const address =
    addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  const items = bag.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty }));
  const key = JSON.stringify([items, signed ? address?.id ?? null : null, coupon, usePoints, status]);

  useEffect(() => {
    if (!items.length || status === "unknown") return;
    let live = true;
    api<Quote>("quote", { items, address: signed ? address?.id ?? null : null, coupon, use_points: usePoints })
      .then((q) => {
        if (!live) return;
        setQuote({ key, q });
        setQuoteError(null);
      })
      .catch((e: Error) => live && setQuoteError(e.message));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const q = quote?.q ?? null;
  const fresh = quote?.key === key;
  const codOk = Boolean(q?.cod_available);
  const pay = method === "cod" && !codOk ? "online" : method;
  const canPlace = Boolean(signed && phoneOk && address && q && fresh && q.quote_id && !q.estimate && q.lines.length && !placing);

  const place = async () => {
    if (!q?.quote_id) return;
    setPlacing(true);
    setError(null);
    try {
      // A quote is kept for 15 minutes: ask again if it has run out.
      let quoteId = q.quote_id;
      if (q.expires_at && new Date(q.expires_at).getTime() < Date.now() + 30_000) {
        const again = await api<Quote>("quote", { items, address: address?.id, coupon, use_points: usePoints });
        setQuote({ key, q: again });
        if (!again.quote_id || again.problems.length) {
          setError("Prices or stock changed. Please check your order and try again.");
          return;
        }
        quoteId = again.quote_id;
      }
      const order = await api<Order>("place", { quote: quoteId, method: pay });
      shop.clearBag();
      if (pay === "cod") {
        router.push(`/orders/${order.code}?new=1`);
        return;
      }
      try {
        const info = await api<PayInfo>("pay", { code: order.code });
        await openRazorpay(info, () => router.push(`/orders/${order.code}?check=1`));
      } catch (e) {
        // Order is placed and held for 15 minutes; the order page lets them pay or see what happened.
        router.push(`/orders/${order.code}?payerror=${encodeURIComponent((e as Error).message)}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPlacing(false);
    }
  };

  if (!bag.length)
    return (
      <main className="co">
        <div className="container co-empty">
          <h1 className="sf-bag-title">Your bag is empty</h1>
          <Link href="/shop" className="btn-primary">
            <span>Shop the collection</span>
          </Link>
        </div>
      </main>
    );

  return (
    <main className="co ck">
      <div className="container co-grid">
        <div className="co-steps">
          <div className="ck-head">
            <h1 className="bx-title">Checkout</h1>
            <p className="ck-sub">Complete your order in three simple steps.</p>
          </div>
          <ol className="ck-track" aria-label="Steps">
            {[
              ["Mobile", phoneOk ? "done" : "on"],
              ["Address", signed && address ? "done" : signed ? "on" : ""],
              ["Payment", signed && address ? "on" : ""],
            ].map(([label, state], i) => (
              <li key={label} className={state ? `is-${state}` : undefined}>
                <span>{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>

          {/* 1. Who */}
          <section id="co-1" className={`co-step${phoneOk ? " is-done" : ""}`}>
            <div className="co-step-head">
              <span className="co-num">1</span>
              <div className="ck-step-text">
                <h2>{signed && !phoneOk ? "Add Your Mobile Number" : "Verify Your Mobile"}</h2>
                {!signed ? (
                  <p>Enter your mobile number or email to receive a one-time verification code.</p>
                ) : !phoneOk ? (
                  <p>We need your mobile number for delivery updates. Confirm it with a one-time code.</p>
                ) : null}
              </div>
            </div>
            {status === "unknown" ? (
              <p className="co-small">Loading…</p>
            ) : signed && !phoneOk ? (
              <SignIn title="" mode="phone" onDone={(i) => setJoined(Boolean(i?.joined))} />
            ) : signed ? (
              <>
                <div className="co-done">
                  <span>
                    {me.name ? `${me.name} · ` : ""}
                    {me.phone ? `+91 ${me.phone.replace(/\D/g, "").slice(-10)}` : me.email}
                  </span>
                  <button type="button" className="co-link" onClick={() => void signOut()}>
                    Not you?
                  </button>
                </div>
                {joined ? <p className="co-ok">Your showroom account is now linked: your points and past bills are here.</p> : null}
              </>
            ) : (
              <SignIn title="" />
            )}
          </section>

          {/* 2. Where */}
          <section id="co-2" className={`co-step${phoneOk ? "" : " is-locked"}`}>
            <div className="co-step-head">
              <span className="co-num">2</span>
              <div className="ck-step-text">
                <h2>Delivery Address</h2>
                <p>Add a delivery address to get your order.</p>
              </div>
              <svg className="ck-chev" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            {signed && phoneOk ? (
              adding || !addresses.length ? (
                <AddressForm
                  defaultName={me.name}
                  defaultPhone={me.phone ?? ""}
                  onSaved={(a) => {
                    setAddressId(a.id);
                    setAdding(false);
                  }}
                  onCancel={addresses.length ? () => setAdding(false) : undefined}
                />
              ) : (
                <>
                  <div className="co-addresses" role="radiogroup" aria-label="Delivery address">
                    {addresses.map((a) => (
                      <label key={a.id} className={`co-addr${address?.id === a.id ? " active" : ""}`}>
                        <input type="radio" name="addr" checked={address?.id === a.id} onChange={() => setAddressId(a.id)} />
                        <span>
                          <strong>{a.name}</strong> · {a.phone}
                          <br />
                          {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}
                          <br />
                          {a.city}, {a.state} {a.pincode}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button type="button" className="co-link" onClick={() => setAdding(true)}>
                    + Add a new address
                  </button>
                </>
              )
            ) : (
              null
            )}
          </section>

          {/* 3. Pay */}
          <section id="co-3" className={`co-step${phoneOk && address ? "" : " is-locked"}`}>
            <div className="co-step-head">
              <span className="co-num">3</span>
              <div className="ck-step-text">
                <h2>Payment</h2>
                <p>Choose your preferred payment method.</p>
              </div>
              <svg className="ck-chev" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            {phoneOk && address ? (
              <div className="co-pay" role="radiogroup" aria-label="Payment method">
                <label className={`co-addr${pay === "online" ? " active" : ""}`}>
                  <input type="radio" name="pay" checked={pay === "online"} onChange={() => setMethod("online")} />
                  <span>
                    <strong>Pay online</strong>
                    <br />
                    UPI, cards, net banking
                  </span>
                </label>
                <label className={`co-addr${pay === "cod" ? " active" : ""}${codOk ? "" : " is-off"}`}>
                  <input type="radio" name="pay" checked={pay === "cod"} disabled={!codOk} onChange={() => setMethod("cod")} />
                  <span>
                    <strong>Cash on delivery</strong>
                    <br />
                    {codOk ? "Pay in cash or UPI when it arrives" : "Not available for this order"}
                  </span>
                </label>
              </div>
            ) : (
              null
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="co-summary" aria-label="Order summary">
          <div className="ck-sum-head">
            <h2>Your Order</h2>
            <span>
              {bag.reduce((n, l) => n + l.qty, 0)} {bag.reduce((n, l) => n + l.qty, 0) === 1 ? "Item" : "Items"}
            </span>
          </div>
          <ul className="co-lines">
            {bag.map((l) => {
              const same = (x: { slug: string; size: string | null }) => x.slug === l.slug && (x.size ?? null) === (l.size ?? null);
              const line = q?.lines.find(same);
              const problem = q?.problems.find(same);
              return (
                <li key={`${l.slug}-${l.size}`} className={problem ? "has-issue" : undefined}>
                  <span className="co-line-img">
                    {l.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl(l.thumbnail, "card") ?? ""} alt="" />
                    ) : null}
                    <span className="co-qty">{l.qty}</span>
                  </span>
                  <span className="co-line-text">
                    <span className="co-line-title">{l.title}</span>
                    <span className="co-line-meta">{l.size ? `Size: ${l.size}` : "One size"}</span>
                    {problem ? <span className="co-line-issue">{problem.error}</span> : null}
                  </span>
                  <span className="co-line-price">
                    {line ? (
                      <>
                        {/* line amounts are already for the whole quantity */}
                        {line.discount_paise ? <s>{rupees(line.price_paise)}</s> : null}
                        {rupees(line.final_paise)}
                      </>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {q?.problems.length ? (
            <p className="co-error">
              Some pieces can&rsquo;t be ordered as they are. <Link href="/bag">Fix them in your bag</Link>.
            </p>
          ) : null}

          <button type="button" className="ck-coupon-toggle" aria-expanded={couponOpen || Boolean(coupon)} onClick={() => setCouponOpen(!couponOpen)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 12.5 11 5h8v8l-7.5 7.5z" />
              <circle cx="15" cy="9" r="1.4" />
            </svg>
            <span>Have a Coupon Code?</span>
            <svg className="ck-coupon-chev" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
          <form
            hidden={!couponOpen && !coupon}
            className="co-coupon"
            onSubmit={(e) => {
              e.preventDefault();
              setCoupon(couponText.trim() || null);
            }}
          >
            <input
              value={couponText}
              onChange={(e) => setCouponText(e.target.value.toUpperCase().slice(0, 30))}
              placeholder="Coupon code"
              aria-label="Coupon code"
              disabled={!signed}
            />
            {coupon && q?.coupon ? (
              <button
                type="button"
                className="co-link"
                onClick={() => {
                  setCoupon(null);
                  setCouponText("");
                }}
              >
                Remove
              </button>
            ) : (
              <button className="co-link" disabled={!signed || !couponText.trim()}>
                Apply
              </button>
            )}
          </form>
          {!signed && couponOpen ? <p className="co-small">Sign in to use a coupon or your points.</p> : null}
          {signed && (me.points ?? 0) > 0 ? (
            <label className="co-points">
              <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
              <span>
                Use my points <em>({me.points} available)</em>
                {usePoints && q?.points && fresh ? (
                  <small>
                    {q.points.used
                      ? ` · ${q.points.used} points = ${rupees(q.points.discount_paise)} off`
                      : " · this order is below the minimum for points"}
                  </small>
                ) : null}
              </span>
            </label>
          ) : null}
          {q?.coupon && fresh ? <p className="co-ok">{q.coupon.code}: {q.coupon.description} applied</p> : null}
          {q?.coupon_error && fresh ? <p className="co-error">{q.coupon_error}</p> : null}

          <dl className="co-totals">
            <div>
              <dt>Items ({bag.reduce((n, l) => n + l.qty, 0)})</dt>
              <dd>{q ? rupees(q.subtotal_paise) : "…"}</dd>
            </div>
            {q?.discount_paise ? (
              <div className="is-save">
                <dt>Discount</dt>
                <dd>&minus;{rupees(q.discount_paise)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Delivery</dt>
              <dd>{q ? (q.estimate ? "Calculated at checkout" : q.delivery_paise ? rupees(q.delivery_paise) : "Free") : "…"}</dd>
            </div>
            <div className="is-total">
              <dt>Total</dt>
              <dd>{q ? rupees(q.total_paise) : "…"}</dd>
            </div>
          </dl>
          {q ? (
            <p className="co-small">
              Includes {rupees(q.gst.total_paise)} GST.
              {q.free_delivery_from_paise && q.delivery_paise
                ? ` Free delivery on orders from ${rupees(q.free_delivery_from_paise)}.`
                : ""}
              {q.estimate && signed ? " Choose an address for the final price." : ""}
            </p>
          ) : null}
          {quoteError ? <p className="co-error">{quoteError}</p> : null}

          <button type="button" className="co-btn co-place" disabled={!canPlace} onClick={() => void place()}>
            {placing ? "Placing your order…" : pay === "cod" ? "Place order" : `Pay ${q ? rupees(q.total_paise) : ""}`}
          </button>
          {error ? (
            <p className="co-error" role="alert">
              {error}
            </p>
          ) : null}
          <p className="co-small co-terms">
            <svg className="bx-info" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v6M12 7.6v.01" />
            </svg>
            <span>
              Online orders are not exchanged. By placing the order you agree to our{" "}
              <Link href="/policies/terms">Terms</Link> and <Link href="/policies/returns">Returns Policy</Link>.
            </span>
          </p>
        </aside>
      </div>
    </main>
  );
}
