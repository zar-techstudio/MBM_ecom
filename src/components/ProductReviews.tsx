"use client";

import { useState } from "react";
import { api } from "@/lib/account";
import type { Review, Reviews } from "@/lib/catalogue";
import { imageUrl } from "@/lib/site";
import { Stars } from "./Stars";

const PAGE = 10;

/** Verified reviews on a product page: average, count, then reviews with "Show more". */
export function ProductReviews({ slug, initial }: { slug: string; initial: Reviews }) {
  const [list, setList] = useState<Review[]>(initial.reviews);
  const [more, setMore] = useState(initial.reviews.length >= PAGE);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const r = initial.rating;

  const loadMore = async () => {
    setBusy(true);
    try {
      const next = await api<Reviews>("reviews", { slug, offset: list.length, limit: PAGE });
      setList((l) => [...l, ...next.reviews]);
      setMore(next.reviews.length >= PAGE);
    } catch {
      setMore(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="pr" id="reviews" aria-label="Reviews">
      <div className="pr-head">
        <h2 className="pr-title">Reviews</h2>
        {r && r.count ? (
          <p className="pr-summary">
            <span className="pr-avg">{r.average.toFixed(1)}</span>
            <Stars value={r.average} size={20} />
            <span className="pr-count">
              {r.count} verified {r.count === 1 ? "review" : "reviews"}
            </span>
          </p>
        ) : null}
      </div>
      {list.length ? (
        <ul className="pr-list">
          {list.map((v, i) => (
            <li key={i} className="pr-item">
              <div className="pr-meta">
                <Stars value={v.stars} size={15} />
                <strong>{v.name}</strong>
                {v.verified ? <span className="pr-verified">Verified purchase</span> : null}
                <time dateTime={v.at}>{new Date(v.at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</time>
              </div>
              {v.body ? <p className="pr-body">{v.body}</p> : null}
              {v.photo ? (
                <button type="button" className="pr-photo" onClick={() => setZoom(imageUrl(v.photo, "large"))} aria-label="See the photo larger">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(v.photo, "large") ?? ""} alt={`Photo from ${v.name}`} loading="lazy" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="co-small">No reviews yet. Reviews come only from customers who bought this piece.</p>
      )}
      {more ? (
        <button type="button" className="co-link pr-more" onClick={() => void loadMore()} disabled={busy}>
          {busy ? "Loading…" : "Show more reviews"}
        </button>
      ) : null}
      {zoom ? (
        <div className="pr-zoom" role="dialog" aria-modal="true" aria-label="Review photo" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" />
        </div>
      ) : null}
    </section>
  );
}
