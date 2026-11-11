"use client";

import { useState } from "react";
import { STATES, api, refreshMe, type Address } from "@/lib/account";

/** Add or edit a delivery address. The state decides GST (Telangana: CGST+SGST, else IGST). */
export function AddressForm({
  initial,
  defaultName,
  defaultPhone,
  onSaved,
  onCancel,
}: {
  initial?: Partial<Address>;
  defaultName?: string | null;
  defaultPhone?: string | null;
  onSaved: (a: Address) => void;
  onCancel?: () => void;
}) {
  const [a, setA] = useState({
    name: initial?.name ?? defaultName ?? "",
    phone: initial?.phone ?? defaultPhone ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    landmark: initial?.landmark ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "Telangana",
    pincode: initial?.pincode ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof a) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setA((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await api<Address>("address", { address: { ...(initial?.id ? { id: initial.id } : {}), ...a } });
      await refreshMe();
      onSaved(saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="addr-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="field-row">
        <label className="field">
          <span>Full name</span>
          <input value={a.name} onChange={set("name")} autoComplete="name" required maxLength={80} />
        </label>
        <label className="field">
          <span>Mobile</span>
          <input value={a.phone} onChange={set("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" required maxLength={15} />
        </label>
      </div>
      <label className="field">
        <span>House / flat, street</span>
        <input value={a.line1} onChange={set("line1")} autoComplete="address-line1" required maxLength={120} />
      </label>
      <label className="field">
        <span>Area, colony (optional)</span>
        <input value={a.line2 ?? ""} onChange={set("line2")} autoComplete="address-line2" maxLength={120} />
      </label>
      <label className="field">
        <span>Landmark (optional)</span>
        <input value={a.landmark ?? ""} onChange={set("landmark")} maxLength={80} />
      </label>
      <div className="field-row field-row-3">
        <label className="field">
          <span>City</span>
          <input value={a.city} onChange={set("city")} autoComplete="address-level2" required maxLength={60} />
        </label>
        <label className="field">
          <span>State</span>
          <select value={a.state} onChange={set("state")} autoComplete="address-level1" required>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>PIN code</span>
          <input
            value={a.pincode}
            onChange={(e) => setA((x) => ({ ...x, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
            inputMode="numeric"
            autoComplete="postal-code"
            required
            pattern="\d{6}"
            title="6-digit PIN code"
          />
        </label>
      </div>
      {error ? (
        <p className="co-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="addr-actions">
        <button className="co-btn" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </button>
        {onCancel ? (
          <button type="button" className="co-link" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
