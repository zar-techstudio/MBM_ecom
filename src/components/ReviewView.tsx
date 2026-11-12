"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/account";
import { imageUrl } from "@/lib/site";
import { Stars } from "./Stars";

type Item = { slug: string; title: string; thumbnail: string | null; review: { stars: number; body: string | null } | null };
type Form = { name: string; bill: string; bought_at: string; expires_at: string; google_review_url: string | null; items: Item[] };

const LABELS = ["", "Poor", "Not great", "Good", "Very good", "Excellent"];

/** Shrink a photo in the browser (longest side 1200 px) and encode it as WebP, or JPEG if WebP isn't available. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const as = (type: string) => new Promise<Blob | null>((r) => c.toBlob(r, type, 0.82));
  const webp = await as("image/webp");
  const blob = webp && webp.type === "image/webp" ? webp : await as("image/jpeg");
  if (!blob) throw new Error("This photo couldn't be read. Try another one.");
  return blob;
}

/**
 * /review/<code>: the one-time link for a bill (online order or showroom). Every product on the bill
 * gets stars, an optional comment and an optional photo. Reviews appear on the product pages as
 * verified purchases.
 */
export function ReviewView({ token }: { token: string }) {
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api<Form>("review-form", { token })
      .then((f) => live && setForm(f))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [token]);

  if (error && !form)
    return (
      <main className="co">
        <div className="container co-narrow rv-empty">
          <h1 className="sf-bag-title">Review</h1>
          <p className="co-error">{error}</p>
          <p className="co-small">
            Ask us on WhatsApp for a new link, or <Link href="/">visit the shop</Link>.
          </p>
        </div>
      </main>
    );

  if (!form)
    return (
      <main className="co">
        <div className="container co-narrow">
          <p className="co-small">Loading…</p>
        </div>
      </main>
    );

  const done = form.items.filter((i) => i.review).length;
  return (
    <main className="co">
      <div className="container co-narrow">
        <span className="section-label">Bill {form.bill}</span>
        <h1 className="sf-bag-title rv-title">
          {form.name ? `${form.name.split(" ")[0]}, how` : "How"} did we do?
        </h1>
        <p className="co-small">
          Bought on {new Date(form.bought_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
          Your review helps other grooms choose, and it shows as a verified purchase.
        </p>
        <ul className="rv-items">
          {form.items.map((it) => (
            <ReviewItem key={it.slug} token={token} item={it} onSaved={setForm} />
          ))}
        </ul>
        {done && form.google_review_url ? (
          <div className="rv-google">
            <p>Thank you! Would you also review the showroom on Google? It takes a minute.</p>
            <a className="co-btn" href={form.google_review_url} target="_blank" rel="noopener noreferrer">
              Review us on Google
            </a>
          </div>
        ) : done === form.items.length ? (
          <p className="co-ok rv-thanks">Thank you for your reviews!</p>
        ) : null}
      </div>
    </main>
  );
}

function ReviewItem({ token, item, onSaved }: { token: string; item: Item; onSaved: (f: Form) => void }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null);
  const [busy, setBusy] = useState<"photo" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const thumb = imageUrl(item.thumbnail, "card");
  if (item.review)
    return (
      <li className="rv-item is-done">
        <span className="rv-img">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" />
          ) : null}
        </span>
        <div>
          <p className="rv-name">{item.title}</p>
          <Stars value={item.review.stars} />
          {item.review.body ? <p className="rv-body">&ldquo;{item.review.body}&rdquo;</p> : null}
          <p className="co-ok">Thank you, your review is saved.</p>
        </div>
      </li>
    );

  const addPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy("photo");
    setError(null);
    try {
      const blob = await shrink(file);
      const res = await fetch(`/api/review-photo?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": blob.type },
        body: blob,
      });
      const data = (await res.json().catch(() => ({}))) as { photo?: string; error?: string };
      if (!res.ok || !data.photo) throw new Error(data.error || "The photo couldn't be added. Try another one.");
      setPhoto({ path: data.photo, preview: URL.createObjectURL(blob) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!stars) return setError("Tap the stars to rate it");
    setBusy("send");
    setError(null);
    try {
      onSaved(await api<Form>("review-submit", { token, slug: item.slug, stars, body, photo: photo?.path ?? null }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const shown = hover || stars;
  return (
    <li className="rv-item">
      <span className="rv-img">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" />
          ) : null}
        </span>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <p className="rv-name">{item.title}</p>
        <div className="rv-stars" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={n <= shown ? "on" : undefined}
              onMouseEnter={() => setHover(n)}
              onClick={() => setStars(n)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" />
              </svg>
            </button>
          ))}
          <span className="rv-label">{LABELS[shown]}</span>
        </div>
        <label className="field">
          <span>Tell others about the fabric, fit and finish (optional)</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 2000))} rows={3} />
        </label>
        <div className="rv-row">
          {photo ? (
            <span className="rv-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt="Your photo" />
              <button type="button" className="co-link" onClick={() => setPhoto(null)}>
                Remove
              </button>
            </span>
          ) : (
            <label className="rv-add">
              <input type="file" accept="image/*" onChange={(e) => void addPhoto(e.target.files?.[0])} disabled={busy !== null} />
              {busy === "photo" ? "Adding photo…" : "+ Add a photo"}
            </label>
          )}
          <button className="co-btn" disabled={busy !== null || !stars}>
            {busy === "send" ? "Saving…" : "Post review"}
          </button>
        </div>
        {error ? (
          <p className="co-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </li>
  );
}
