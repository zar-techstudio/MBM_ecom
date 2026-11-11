"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STATUS_TEXT, api, refreshMe, setMe, signOut, useAccount, type Address, type Me, type Order } from "@/lib/account";
import { formatINR } from "@/lib/site";
import { AddressForm } from "./AddressForm";
import { SignIn } from "./SignIn";

/** My account: profile, addresses, orders, loyalty points (when available) and sign out. */
export function AccountView() {
  const { status, me } = useAccount();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "signed") return;
    let live = true;
    api<Order[]>("orders")
      .then((o) => live && setOrders(o ?? []))
      .catch(() => live && setOrders([]));
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
      setMe(await api<Me>("profile", { name: profile.name, email: profile.email }));
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

        {me.points != null ? (
          <section className="ord-box acc-points">
            <h2>Loyalty points</h2>
            <p>
              <strong>{me.points}</strong> points · use them online or at the showroom
            </p>
          </section>
        ) : null}

        <section className="ord-box">
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
              <label className="field">
                <span>Email (optional, for invoices)</span>
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value.slice(0, 120) })} />
              </label>
              <div className="addr-actions">
                <button className="co-btn">Save</button>
                <button type="button" className="co-link" onClick={() => setProfile(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="co-small">
              {me.name ?? "—"} · +91 {me.phone.replace(/\D/g, "").slice(-10)}
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
              defaultPhone={me.phone}
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
