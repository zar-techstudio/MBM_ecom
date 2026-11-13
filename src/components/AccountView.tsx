"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STATUS_TEXT, api, refreshMe, setMe, signOut, useAccount, type Address, type Me, type Order, type Points } from "@/lib/account";
import { formatINR } from "@/lib/site";
import { AddressForm } from "./AddressForm";
import { SignIn } from "./SignIn";

/** My account: profile, addresses, orders, loyalty points (when available) and sign out. */
export function AccountView() {
  const { status, me } = useAccount();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [points, setPoints] = useState<Points | null>(null);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "signed") return;
    let live = true;
    api<Order[]>("orders")
      .then((o) => live && setOrders(o ?? []))
      .catch(() => live && setOrders([]));
    api<Points>("points")
      .then((p) => live && setPoints(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [status]);

  if (status === "unknown")
    return (
      <main className="co">
        <div className="container co-narrow">
          <p className="co-small">Loading…</p>
        </div>
      </main>
    );

  if (status === "guest" || !me)
    return (
      <main className="co">
        <div className="container co-narrow">
          <h1 className="sf-bag-title">My account</h1>
          <SignIn title="Sign in to see your orders" />
          <p className="co-small">Your bag and wishlist come with you, and showroom purchases on the same number are linked.</p>
        </div>
      </main>
    );

  const saveProfile = async () => {
    if (!profile) return;
    setError(null);
    try {
      setMe(await api<Me>("profile", { name: profile.name, email: me?.email_verified ? null : profile.email }));
      setProfile(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (a: Address) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      await api("address-delete", { id: a.id });
      await refreshMe();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="co">
      <div className="container co-narrow">
        <div className="acc-head">
          <div>
            <span className="section-label">My account</span>
            <h1 className="sf-bag-title">{me.name ? `Hello, ${me.name.split(" ")[0]}` : "Hello"}</h1>
          </div>
          <button type="button" className="co-link" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>

        {points ? <PointsBox p={points} /> : null}

        <section className="ord-box" id="orders">
          <h2>Orders</h2>
          {orders === null ? (
            <p className="co-small">Loading…</p>
          ) : orders.length ? (
            <ul className="acc-orders">
              {orders.map((o) => (
                <li key={o.code}>
                  <Link href={`/orders/${o.code}`}>
                    <span>
                      <strong>{o.code}</strong> ·{" "}
                      {new Date(o.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      <br />
                      <span className={`acc-status is-${o.status}`}>{STATUS_TEXT[o.status]}</span>
                    </span>
                    <span>{formatINR(o.total_paise)} &rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="co-small">
              No online orders yet. <Link href="/shop">Start shopping</Link>
            </p>
          )}
        </section>

        <WhatsAppPrefs />

        <section className="ord-box">
          <h2>Profile</h2>
          {profile ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveProfile();
              }}
            >
              <label className="field">
                <span>Name</span>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value.slice(0, 80) })} required />
              </label>
              {me.email_verified ? (
                <p className="field">
                  <span>Email</span>
                  <span className="acc-readonly">{me.email} · used to sign in, so it can&rsquo;t be changed here</span>
                </p>
              ) : (
                <label className="field">
                  <span>Email (optional, for invoices)</span>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value.slice(0, 120) })} />
                </label>
              )}
              <div className="addr-actions">
                <button className="co-btn">Save</button>
                <button type="button" className="co-link" onClick={() => setProfile(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="co-small">
              {me.name ?? "—"}
              {me.phone ? ` · +91 ${me.phone.replace(/\D/g, "").slice(-10)}` : ""}
              {me.email ? ` · ${me.email}` : ""}{" "}
              <button type="button" className="co-link" onClick={() => setProfile({ name: me.name ?? "", email: me.email ?? "" })}>
                Edit
              </button>
            </p>
          )}
        </section>

        <section className="ord-box">
          <h2>Addresses</h2>
          {editing ? (
            <AddressForm
              initial={editing}
              defaultName={me.name}
              defaultPhone={me.phone ?? ""}
              onSaved={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <>
              {me.addresses.length ? (
                <ul className="acc-addresses">
                  {me.addresses.map((a) => (
                    <li key={a.id}>
                      <span>
                        <strong>{a.name}</strong> · {a.phone}
                        {a.is_default ? <em> · default</em> : null}
                        <br />
                        {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}, {a.city}, {a.state} {a.pincode}
                      </span>
                      <span className="acc-addr-actions">
                        <button type="button" className="co-link" onClick={() => setEditing(a)}>
                          Edit
                        </button>
                        <button type="button" className="co-link" onClick={() => void remove(a)}>
                          Remove
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="co-small">No saved addresses yet.</p>
              )}
              <button type="button" className="co-link" onClick={() => setEditing({})}>
                + Add an address
              </button>
            </>
          )}
        </section>
        {error ? (
          <p className="co-error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="co-small">
          <Link href="/wishlist">My wishlist</Link> · <Link href="/bag">My bag</Link>
        </p>
      </div>
    </main>
  );
}

const KIND: Record<Points["history"][number]["kind"], string> = {
  earn: "Earned",
  take_back: "Taken back (return)",
  use: "Used",
  give_back: "Given back",
  expire: "Expired",
  adjust: "Adjusted",
};

/** Loyalty points: the same balance online and at the showroom. */
function PointsBox({ p }: { p: Points }) {
  const worth = p.balance * p.point_value_paise;
  return (
    <section className="ord-box acc-points">
      <h2>Loyalty points</h2>
      <p className="acc-points-bal">
        <strong>{p.balance}</strong> points{worth ? <span> · worth {formatINR(worth)}</span> : null}
      </p>
      <p className="co-small">
        Earn 1 point for every {formatINR(p.earn_per_paise)} you spend, online or at the showroom. Use them at checkout
        {p.min_bill_paise ? ` on orders from ${formatINR(p.min_bill_paise)}` : ""}
        {p.max_share_bps ? `, for up to ${p.max_share_bps / 100}% of the order` : ""}.
        {p.expiry_months ? ` Points last ${p.expiry_months} months.` : ""}
      </p>
      {p.history.length ? (
        <ul className="acc-points-hist">
          {p.history.slice(0, 12).map((h, i) => (
            <li key={i}>
              <span>
                {KIND[h.kind] ?? h.kind}
                {h.order ? ` · order ${h.order}` : h.bill ? ` · bill ${h.bill}` : ""}
                <br />
                <time dateTime={h.at}>{new Date(h.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
              </span>
              <span className={h.points < 0 ? "is-minus" : "is-plus"}>
                {h.points > 0 ? "+" : ""}
                {h.points}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Two switches: order updates on WhatsApp, and reminders about a bag left behind. */
function WhatsAppPrefs() {
  const [prefs, setPrefs] = useState<{ order_updates: boolean; offers: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    api<{ order_updates: boolean; offers: boolean }>("wa-prefs")
      .then((p) => live && setPrefs(p))
      .catch(() => live && setPrefs(null));
    return () => {
      live = false;
    };
  }, []);
  if (!prefs) return null;
  const change = async (next: { order_updates: boolean; offers: boolean }) => {
    const before = prefs;
    setPrefs(next);
    setSaving(true);
    setError(null);
    try {
      setPrefs(await api<{ order_updates: boolean; offers: boolean }>("wa-prefs-set", next));
    } catch (e) {
      setPrefs(before);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="ord-box acc-wa">
      <h2>WhatsApp messages</h2>
      <label className="acc-switch">
        <input
          type="checkbox"
          role="switch"
          checked={prefs.order_updates}
          disabled={saving}
          onChange={(e) => void change({ ...prefs, order_updates: e.target.checked, offers: e.target.checked && prefs.offers })}
        />
        <span>
          <strong>Order updates on WhatsApp</strong>
          <small>Order confirmed, shipped with tracking, delivered. Off means no WhatsApp messages at all.</small>
        </span>
      </label>
      <label className={`acc-switch${prefs.order_updates ? "" : " is-off"}`}>
        <input
          type="checkbox"
          role="switch"
          checked={prefs.offers}
          disabled={saving || !prefs.order_updates}
          onChange={(e) => void change({ ...prefs, offers: e.target.checked })}
        />
        <span>
          <strong>Reminders about my bag</strong>
          <small>A message if you leave pieces in your bag.</small>
        </span>
      </label>
      <p className="co-small">You can also reply STOP on WhatsApp at any time.</p>
      {error ? <p className="co-error">{error}</p> : null}
    </section>
  );
}
