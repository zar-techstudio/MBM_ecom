"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export type GuideKind = "garment" | "footwear" | "headwear";

/** Which guide a category needs, from its name. */
export function guideFor(category: string): GuideKind {
  const c = category.toLowerCase();
  if (/foot|mojri|jutti|shoe|sandal|chappal|kolhapuri/.test(c)) return "footwear";
  if (/head|safa|pagdi|pagri|turban|cap|topi/.test(c)) return "headwear";
  return "garment";
}

/**
 * A general size guide (the same for every product until the ERP keeps a chart per category).
 * Fits vary a little by design, so it always points to WhatsApp for a confirmation.
 */
export function SizeGuide({ kind, onClose, ask }: { kind: GuideKind; onClose: () => void; ask: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Drawn on the page body: inside the buy box it sat in a lower layer than the photo's buttons.
  return createPortal(
    <div className="sg-back" role="dialog" aria-modal="true" aria-label="Size guide" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sg">
        <div className="sg-head">
          <h2>Size guide</h2>
          <button type="button" className="sg-close" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>

        {kind === "garment" ? (
          <>
            <p className="co-small">
              Sherwanis, kurtas, waistcoats and suits are sized by <strong>chest</strong> in inches. Measure around the
              fullest part of the chest, under the arms, over a thin shirt, and pick that size (or the next one up for a
              relaxed fit).
            </p>
            <table className="sg-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Also called</th>
                  <th>Your chest (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["36", "S", "35–36"],
                  ["38", "M", "37–38"],
                  ["40", "L", "39–40"],
                  ["42", "XL", "41–42"],
                  ["44", "XXL", "43–44"],
                  ["46", "3XL", "45–46"],
                ].map(([a, b, c]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td>{b}</td>
                    <td>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="co-small">
              Between sizes, or want it made to your measurements? We also stitch to order: ask about custom tailoring.
            </p>
          </>
        ) : kind === "footwear" ? (
          <>
            <p className="co-small">
              Mojris and juttis use <strong>UK/India sizes</strong>. Stand on paper, mark your heel and longest toe, and
              measure the length.
            </p>
            <table className="sg-table">
              <thead>
                <tr>
                  <th>UK / India</th>
                  <th>Foot length (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["6", "24.5"],
                  ["7", "25.4"],
                  ["8", "26.2"],
                  ["9", "27.1"],
                  ["10", "27.9"],
                  ["11", "28.8"],
                ].map(([a, b]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="co-small">Leather mojris ease a little with wear; if you are between sizes, take the larger one.</p>
          </>
        ) : (
          <>
            <p className="co-small">
              Safas and pagdis are sized by <strong>head size</strong>. Wrap a tape around your head just above the
              eyebrows and ears, where the safa sits.
            </p>
            <table className="sg-table">
              <thead>
                <tr>
                  <th>Head (inches)</th>
                  <th>Head (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["21½", "55"],
                  ["22", "56"],
                  ["22½", "57"],
                  ["23", "58"],
                  ["23½", "60"],
                  ["24", "61"],
                ].map(([a, b]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <p className="sg-note">
          This is a general guide; fits vary a little by design. Online orders are not exchanged, so if you&rsquo;re unsure,{" "}
          <a href={ask} target="_blank" rel="noopener noreferrer">
            send us your measurements on WhatsApp
          </a>{" "}
          and we&rsquo;ll confirm the size.
        </p>
      </div>
    </div>,
    document.body,
  );
}
