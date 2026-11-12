"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, STATUS_TEXT, api, useAccount, type Order } from "@/lib/account";
import { openRazorpay, type PayInfo } from "@/lib/razorpay";
import { formatINR, imageUrl } from "@/lib/site";
import { SignIn } from "./SignIn";

const STEPS = ["Confirmed", "Packed", "Shipped", "Delivered"];
const stepOf = (s: Order["status"]) =>
  s === "delivered" ? 3 : s === "shipped" ? 2 : s === "packed" ? 1 : s === "paid" || s === "placed" ? 0 : -1;
const CANCELLABLE: Order["status"][] = ["awaiting_payment", "paid", "placed"];
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** One order: status in words, progress, items, address, tracking; pay, wait for payment, or cancel. */
export function OrderView({ code }: { code: string }) {
  const params = useSearchParams();
  const { status } = useAccount();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(params.get("payerror"));
  const [needSignIn, setNeedSignIn] = useState(false);
  const [checking, setChecking] = useState(params.get("check") === "1");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const o = await api<Order>("order", { code });
      setOrder(o);
      setNeedSignIn(false);
      return o;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setNeedSignIn(true);
      else setError((e as Error).message);
      return null;
    }
  }, [code]);

  useEffect(() => {
    if (status === "unknown") return;
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load, status]);

  // Just back from the payment window: Razorpay tells the ERP, so check every 2.5 s for a minute.
  useEffect(() => {
    if (!checking) return;
    let n = 0;
    const t = window.setInterval(async () => {
      n += 1;
      const o = await load();
      if (!o || o.status !== "awaiting_payment" || n >= 24) {
        window.clearInterval(t);
        setChecking(false);
      }
    }, 2500);
    return () => window.clearInterval(t);
  }, [checking, load]);

  const payNow = async () => {
    setBusy(true);
    setError(null);
    try {
      const info = await api<PayInfo>("pay", { code });
      await openRazorpay(info, () => setChecking(true));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    setError(null);
    try {
      await api("cancel", { code });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (needSignIn)
    return (
      <main className="co">
        <div className="container co-narrow">
          <SignIn title="Sign in to see your order" onDone={() => void load()} />
        </div>
      </main>
    );

  if (!order)
    return (
      <main className="co">
        <div className="container co-narrow">
          <p className="co-small">{error ?? "Loading your order…"}</p>
        </div>
      </main>
    );

  const step = stepOf(order.status);
  const stopped = ["cancelled", "refund_due", "refunded", "payment_not_received", "returned"].includes(order.status);
  const fresh = params.get("new") === "1" || params.get("check") === "1";

  return (
    <main className="co">
      <div className="container co-narrow">
        <div className="ord-head">
          <span className="section-label">Order {order.code}</span>
          <h1 className="ord-status">
            {order.status === "awaiting_payment" && checking ? "Confirming your payment…" : STATUS_TEXT[order.status]}
          </h1>
          {fresh && (order.status === "paid" || order.status === "placed") ? (
            <p className="ord-thanks">Thank you! We&rsquo;ve received your order and will message you on WhatsApp as it moves.</p>
          ) : null}
          {order.status === "awaiting_payment" && !checking ? (
            <p className="co-small">
              Please complete the payment
              {order.pay_by ? ` by ${when(order.pay_by)}` : " within 15 minutes"}; the pieces are held for you until then.
            </p>
          ) : null}
          {order.status === "payment_not_received" ? (
            <p className="co-small">
              The payment didn&rsquo;t reach us in time. Nothing was charged; <Link href="/bag">place the order again</Link>.
            </p>
          ) : null}
        </div>

        {!stopped ? (
          <ol className="ord-steps" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li key={s} className={i <= step ? "done" : undefined}>
                <span />
                {s}
              </li>
            ))}
          </ol>
        ) : null}

        {order.status === "shipped" && (order.courier || order.awb) ? (
          <p className="ord-track">
            Shipped with <strong>{order.courier ?? "our courier"}</strong>
            {order.awb ? (
              <>
                {" "}
                · tracking number <strong>{order.awb}</strong>
              </>
            ) : null}
          </p>
        ) : null}

        <div className="ord-actions">
          {order.status === "awaiting_payment" && !checking ? (
            <button type="button" className="co-btn" onClick={() => void payNow()} disabled={busy}>
              Pay {formatINR(order.total_paise)} now
            </button>
          ) : null}
          {CANCELLABLE.includes(order.status) && !checking ? (
            <button type="button" className="co-link" onClick={() => void cancel()} disabled={busy}>
              Cancel order
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="co-error" role="alert">
            {error}
          </p>
        ) : null}

        <section className="ord-box">
          <h2>Items</h2>
          <ul className="co-lines">
            {order.items.map((it, i) => (
              <li key={i}>
                <span className="co-line-img">
                  {it.product?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(it.product.thumbnail, "card") ?? ""} alt="" />
                  ) : null}
                </span>
                <span className="co-line-text">
                  {it.product?.slug ? (
                    <Link href={`/product/${it.product.slug}`} className="co-line-title">
                      {it.title}
                    </Link>
                  ) : (
                    <span className="co-line-title">{it.title}</span>
                  )}
                  <span className="co-line-meta">{it.size ? `Size ${it.size}` : "One size"}</span>
                </span>
                <span className="co-line-price">
                  {it.final_paise !== it.price_paise ? <s>{formatINR(it.price_paise)}</s> : null}
                  {formatINR(it.final_paise)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="co-totals">
            <div>
              <dt>Items</dt>
              <dd>{formatINR(order.subtotal_paise)}</dd>
            </div>
            {order.discount_paise ? (
              <div className="is-save">
                <dt>Discount</dt>
                <dd>&minus;{formatINR(order.discount_paise)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Delivery</dt>
              <dd>{order.delivery_paise ? formatINR(order.delivery_paise) : "Free"}</dd>
            </div>
            <div className="is-total">
              <dt>{order.method === "cod" ? "To pay on delivery" : "Total"}</dt>
              <dd>{formatINR(order.total_paise)}</dd>
            </div>
          </dl>
          {order.bill ? (
            <p className="co-small">
              Invoice {order.bill} · <Link href={`/orders/${order.code}/invoice`}>View or download</Link>
            </p>
          ) : null}
        </section>

        {order.address ? (
          <section className="ord-box">
            <h2>Delivering to</h2>
            <p className="co-small">
              <strong>{order.address.name}</strong> · {order.address.phone}
              <br />
              {[order.address.line1, order.address.line2, order.address.landmark].filter(Boolean).join(", ")}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          </section>
        ) : null}

        {order.timeline?.length ? (
          <section className="ord-box">
            <h2>History</h2>
            <ul className="ord-timeline">
              {[...order.timeline].reverse().map((t, i) => (
                <li key={i}>
                  <span>{STATUS_TEXT[t.status] ?? t.status}</span>
                  <time dateTime={t.at}>{when(t.at)}</time>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {order.status === "shipped" || order.status === "delivered" ? (
          <p className="co-small ord-unbox">
            Tip: record a short video while opening the parcel. If anything arrives damaged or wrong, send it to us
            within 48 hours and we&rsquo;ll replace it or refund you.
          </p>
        ) : null}
        <p className="co-small">
          Questions about this order? <Link href="/contact">Contact us</Link> with order {order.code}.{" "}
          <Link href="/account">All my orders</Link>
        </p>
      </div>
    </main>
  );
}
