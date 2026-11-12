"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/account";
import { formatINR } from "@/lib/site";
import { SignIn } from "./SignIn";

type Money = string | number | null | undefined;
type Line = {
  description: string;
  classification_code: string | null;
  taxable_paise: Money;
  rate_bps: number;
  cgst_paise: Money;
  sgst_paise: Money;
  igst_paise: Money;
  gst_paise: Money;
  final_paise: Money;
};
type Invoice = {
  bill: string;
  date: string;
  order: string;
  business: { trading_name: string; legal_name: string; address: string; contact?: string | null; gstin: string };
  customer: { name: string; phone?: string | null; line1?: string | null; line2?: string | null; city?: string | null; state?: string | null; pincode?: string | null };
  supply_type: string;
  lines: Line[];
  taxable_paise: Money;
  cgst_paise: Money;
  sgst_paise: Money;
  igst_paise: Money;
  gst_paise: Money;
  discount_paise: Money;
  other_charge_paise: Money;
  final_paise: Money;
  credit_note: { code: string; date: string; reason: string; amount_paise: Money; gst_paise: Money } | null;
};

const rs = (v: Money) => formatINR(Number(v ?? 0));
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** The saved GST invoice for an order, laid out to print or save as PDF. */
export function InvoiceView({ code }: { code: string }) {
  const [inv, setInv] = useState<Invoice | null | undefined>(undefined);
  const [needSignIn, setNeedSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api<Invoice | null>("invoice", { code })
      .then((i) => {
        setInv(i);
        setNeedSignIn(false);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) setNeedSignIn(true);
        else setError((e as Error).message);
      });

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (needSignIn)
    return (
      <main className="co">
        <div className="container co-narrow">
          <SignIn title="Sign in to see your invoice" onDone={() => void load()} />
        </div>
      </main>
    );

  if (inv === undefined || inv === null)
    return (
      <main className="co">
        <div className="container co-narrow">
          <p className="co-small">
            {error ??
              (inv === null ? "The invoice is ready once your order has shipped." : "Loading the invoice…")}{" "}
            <Link href={`/orders/${code}`}>Back to the order</Link>
          </p>
        </div>
      </main>
    );

  const inter = inv.supply_type === "inter_state" || Number(inv.igst_paise) > 0;
  const c = inv.customer;
  return (
    <main className="co inv-page">
      <div className="container co-narrow">
        <div className="inv-tools no-print">
          <Link href={`/orders/${code}`} className="co-link">
            &larr; Order {code}
          </Link>
          <button type="button" className="co-btn" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>

        <article className="inv">
          <header className="inv-head">
            <div>
              <h1 className="inv-title">Tax invoice</h1>
              <p className="inv-biz">
                <strong>{inv.business.trading_name}</strong>
                <br />
                {inv.business.legal_name}
                <br />
                {inv.business.address}
                {inv.business.contact ? (
                  <>
                    <br />
                    {inv.business.contact}
                  </>
                ) : null}
                <br />
                GSTIN {inv.business.gstin}
              </p>
            </div>
            <dl className="inv-meta">
              <div>
                <dt>Invoice</dt>
                <dd>{inv.bill}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{day(inv.date)}</dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd>{inv.order}</dd>
              </div>
              <div>
                <dt>Supply</dt>
                <dd>{inter ? "Inter-state (IGST)" : "Within Telangana (CGST + SGST)"}</dd>
              </div>
            </dl>
          </header>

          <section className="inv-to">
            <h2>Billed and shipped to</h2>
            <p>
              <strong>{c.name}</strong>
              {c.phone ? ` · ${c.phone}` : ""}
              <br />
              {[c.line1, c.line2].filter(Boolean).join(", ")}
              <br />
              {[c.city, c.state, c.pincode].filter(Boolean).join(", ")}
            </p>
          </section>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>HSN</th>
                  <th className="num">Taxable</th>
                  <th className="num">GST</th>
                  {inter ? (
                    <th className="num">IGST</th>
                  ) : (
                    <>
                      <th className="num">CGST</th>
                      <th className="num">SGST</th>
                    </>
                  )}
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{l.description}</td>
                    <td>{l.classification_code ?? "—"}</td>
                    <td className="num">{rs(l.taxable_paise)}</td>
                    <td className="num">{pct(l.rate_bps)}</td>
                    {inter ? (
                      <td className="num">{rs(l.igst_paise)}</td>
                    ) : (
                      <>
                        <td className="num">{rs(l.cgst_paise)}</td>
                        <td className="num">{rs(l.sgst_paise)}</td>
                      </>
                    )}
                    <td className="num">{rs(l.final_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="co-totals inv-totals">
            <div>
              <dt>Taxable value</dt>
              <dd>{rs(inv.taxable_paise)}</dd>
            </div>
            {inter ? (
              <div>
                <dt>IGST</dt>
                <dd>{rs(inv.igst_paise)}</dd>
              </div>
            ) : (
              <>
                <div>
                  <dt>CGST</dt>
                  <dd>{rs(inv.cgst_paise)}</dd>
                </div>
                <div>
                  <dt>SGST</dt>
                  <dd>{rs(inv.sgst_paise)}</dd>
                </div>
              </>
            )}
            {Number(inv.discount_paise) ? (
              <div>
                <dt>Discount (already in the prices above)</dt>
                <dd>{rs(inv.discount_paise)}</dd>
              </div>
            ) : null}
            {Number(inv.other_charge_paise) ? (
              <div>
                <dt>Delivery (included above)</dt>
                <dd>{rs(inv.other_charge_paise)}</dd>
              </div>
            ) : null}
            <div className="is-total">
              <dt>Total</dt>
              <dd>{rs(inv.final_paise)}</dd>
            </div>
          </dl>

          {inv.credit_note ? (
            <section className="inv-credit">
              <h2>Credit note {inv.credit_note.code}</h2>
              <p>
                {day(inv.credit_note.date)} · {inv.credit_note.reason} · {rs(inv.credit_note.amount_paise)} (GST{" "}
                {rs(inv.credit_note.gst_paise)})
              </p>
            </section>
          ) : null}
          <p className="inv-foot">Prices include GST. This is a computer-generated invoice.</p>
        </article>
      </div>
    </main>
  );
}
