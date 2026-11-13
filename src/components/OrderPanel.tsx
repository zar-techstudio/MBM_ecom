"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProductCard, SizeOption } from "@/lib/catalogue";
import { shop, toSaved } from "@/lib/shop-store";
import { formatINR, whatsappLink } from "@/lib/site";
import { NotifyBack } from "./NotifyBack";
import { SizeGuide, guideFor } from "./SizeGuide";

type Props = {
  title: string;
  url: string;
  kind: "garment" | "fabric" | "empty";
  priceText: string;
  sizes: SizeOption[];
  soldOut: boolean;
  whatsappNumber: string;
  checking?: boolean;
  /** The product, for the bag and wishlist. */
  card: ProductCard;
};

type Action = { label: string; href?: string; onClick?: () => void; disabled?: boolean; dark?: boolean };

/** Size picker, Add to bag / Buy now and the wishlist heart, plus a sticky bar on phones.
 * Fabric is enquire-only (cut to length in the showroom); sold-out pieces offer a WhatsApp ask. */
export function OrderPanel({ title, url, kind, priceText, sizes, soldOut, whatsappNumber, checking, card }: Props) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [nudge, setNudge] = useState(0); // shakes the sizes when Add is tapped without one
  const [guide, setGuide] = useState(false);
  const available = sizes.filter((s) => s.left > 0);
  const named = sizes.filter((s) => s.size);
  const [picked, setPicked] = useState<string | null>(available.length === 1 ? available[0].size : null);
  const choice = sizes.find((s) => s.size === picked);
  const price = kind === "fabric" ? priceText : choice?.price_paise != null ? formatINR(choice.price_paise) : priceText;
  const sizesRef = useRef<HTMLFieldSetElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const showBar = useOutOfView(actionRef, !checking);

  const needsSize = kind !== "fabric" && named.length > 0 && !picked;
  let action: Action;
  if (kind === "fabric") {
    action = {
      label: "Enquire on WhatsApp",
      href: whatsappLink(whatsappNumber, `Hello, I'd like to know more about this fabric: ${title}\n${url}`),
    };
  } else if (soldOut) {
    action = {
      label: "Ask on WhatsApp",
      href: whatsappLink(whatsappNumber, `Hello, is this available again? ${title}\n${url}`),
      dark: true,
    };
  } else if (added) {
    action = { label: "Added · View bag", onClick: () => router.push("/bag") };
  } else {
    action = {
      label: "Add to bag",
      onClick: () => {
        if (needsSize) {
          sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          setNudge((n) => n + 1);
          return;
        }
        shop.add(toSaved(card), picked);
        setAdded(true);
      },
    };
  }
  const buyNow = () => {
    if (needsSize) {
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setNudge((n) => n + 1);
      return;
    }
    if (!added) shop.add(toSaved(card), picked);
    router.push("/bag");
  };
  const buyable = kind !== "fabric" && !soldOut;
  const ask = whatsappLink(whatsappNumber, `Hello, I have a question about: ${title}
${url}`);

  return (
    <div className="sf-order">
      <p className="sf-order-price">{price}</p>
      {kind === "fabric" ? (
        <p className="sf-order-note">Fabric is cut to your length in the showroom. Ask us for shades, width and pricing.</p>
      ) : null}
      {kind !== "fabric" && named.length ? (
        <fieldset ref={sizesRef} className={`sf-sizes${nudge ? " is-nudged" : ""}`} key={nudge} disabled={checking}>
          <legend className="sf-size-legend">
            Size
            <button type="button" className="sf-size-guide" onClick={() => setGuide(true)}>
              Size guide
            </button>
          </legend>
          <div className="sf-size-row">
            {named.map((s) => (
              <button
                key={s.size}
                type="button"
                className={`sf-size${picked === s.size ? " active" : ""}`}
                disabled={s.left <= 0}
                aria-pressed={picked === s.size}
                onClick={() => {
                  setPicked(s.size);
                  setAdded(false);
                }}
              >
                {s.size}
              </button>
            ))}
          </div>
          {choice && choice.left > 0 && choice.left <= 2 ? <p className="sf-left">Only {choice.left} left</p> : null}
        </fieldset>
      ) : null}
      {checking ? <p className="sf-order-note">Checking showroom stock…</p> : null}
      {soldOut && kind !== "fabric" ? (
        <>
          <p className="sf-order-note">Sold out for now. We can message you on WhatsApp when it&rsquo;s back.</p>
          <NotifyBack slug={card.slug} />
        </>
      ) : null}
      <div ref={actionRef} className="sf-order-actions">
        <ActionButton action={action} className="sf-order-btn" />
        {buyable ? (
          <button type="button" className="btn-outline sf-order-buy" onClick={buyNow}>
            <span>Buy now</span>
          </button>
        ) : null}
      </div>
      {buyable ? (
        <ul className="sf-order-trust">
          <li>Cash on delivery available</li>
          <li>Delivered across India and abroad</li>
          <li>
            Online orders are not exchanged. Not sure about the size?{" "}
            <a href={ask} target="_blank" rel="noopener noreferrer">
              Ask us on WhatsApp
            </a>
          </li>
        </ul>
      ) : null}
      {kind === "fabric" ? null : (
        <a
          className="sf-video-call"
          href={whatsappLink(whatsappNumber, `Hello, I'd like a video call to see this piece: ${title}
${url}`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2.5" y="6" width="13" height="12" rx="2" />
            <path d="M15.5 10.5l6-3.5v10l-6-3.5z" />
          </svg>
          <span>
            <strong>See it live on a video call</strong>
            <br />
            We&rsquo;ll show you the fabric, embroidery and fit from the showroom.
          </span>
        </a>
      )}
      {kind === "fabric" ? null : (
        <p className="sf-order-note">
          Prefer the showroom? <Link href="/contact">Visit us near Charminar</Link>, open every day 9 am – 11 pm.
        </p>
      )}

      {/* Phones: keep the order button reachable while reading the page. */}
      {showBar && !buyable ? (
        <div className="sf-order-bar" role="region" aria-label="Order">
          <div className="sf-order-bar-text">
            <span className="sf-order-bar-title">{title}</span>
            <span className="sf-order-bar-price">
              {price}
              {picked ? ` · Size ${picked}` : ""}
            </span>
          </div>
          <ActionButton action={action} className="sf-order-bar-btn" />
        </div>
      ) : null}
      {showBar && buyable ? (
        <div className="sf-order-bar sf-order-bar-2" role="region" aria-label="Buy">
          <button type="button" className="sf-bar-add" onClick={action.onClick}>
            {added ? "In your bag" : "Add to bag"}
          </button>
          <button type="button" className="sf-bar-buy" onClick={buyNow}>
            Buy now
          </button>
        </div>
      ) : null}
      {guide ? <SizeGuide kind={guideFor(card.category.name)} ask={ask} onClose={() => setGuide(false)} /> : null}
    </div>
  );
}

function ActionButton({ action, className }: { action: Action; className: string }) {
  const cls = `${action.dark ? "btn-outline sf-order-btn-dark" : "btn-primary"} ${className}`;
  if (action.href)
    return (
      <a className={cls} href={action.href} target="_blank" rel="noopener noreferrer">
        <span>{action.label}</span>
        {action.dark ? null : <span className="btn-arrow">&rarr;</span>}
      </a>
    );
  return (
    <button type="button" className={cls} disabled={action.disabled} onClick={action.onClick}>
      <span>{action.label}</span>
    </button>
  );
}

/** True while the element is scrolled out of the viewport (on any screen; CSS shows the bar on phones only). */
function useOutOfView(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOut(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled]);
  return enabled && out;
}
