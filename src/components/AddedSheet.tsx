"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type SavedProduct, useShop } from "@/lib/shop-store";
import { formatINR, imageUrl } from "@/lib/site";

type Added = { p: SavedProduct; size: string | null };

/**
 * "Added to your bag": slides in after Add to bag and stays until the shopper chooses Continue
 * shopping or View bag, so they keep their place and know it worked (Nielsen Norman Group: never
 * pull shoppers away from shopping, and don't let the confirmation vanish). A bottom sheet on
 * phones, a card under the header on desktop. Closes on another page, Escape or the close button.
 */
export function AddedSheet() {
  const [item, setItem] = useState<Added | null>(null);
  const { bag } = useShop();
  const path = usePathname();

  useEffect(() => {
    const on = (e: Event) => setItem((e as CustomEvent<Added>).detail);
    window.addEventListener("mbm:added", on);
    return () => window.removeEventListener("mbm:added", on);
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => setItem(null), 0);
    return () => window.clearTimeout(t);
  }, [path]);
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setItem(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item]);

  if (!item) return null;
  const { p, size } = item;
  const pieces = bag.reduce((n, l) => n + l.qty, 0);
  const thumb = imageUrl(p.thumbnail, "card");
  const price = p.price_min_paise != null ? formatINR(p.price_min_paise) : "";
  const close = () => setItem(null);

  return (
    <>
      <button type="button" className="added-scrim" aria-label="Close" tabIndex={-1} onClick={close} />
      <div className="added" role="dialog" aria-modal="false" aria-labelledby="added-title">
        <div className="added-head">
          <p id="added-title" className="added-title">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            Added to your bag
          </p>
          <button type="button" className="added-x" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="added-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb ? <img src={thumb} alt="" /> : <span className="added-noimg" />}
          <div>
            <p className="added-name">{p.title}</p>
            <p className="added-meta">{size ? `Size ${size}` : p.kind === "garment" ? "Choose your size in the bag" : ""}</p>
            {price ? <p className="added-price">{price}</p> : null}
          </div>
        </div>
        <div className="added-actions">
          <button type="button" className="added-keep" onClick={close}>
            Continue shopping
          </button>
          <Link href="/bag" className="added-go" onClick={close}>
            View bag{pieces ? ` (${pieces})` : ""} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </>
  );
}
