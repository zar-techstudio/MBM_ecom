"use client";

import type { ProductCard } from "./catalogue";

export type LensAnswer = { description: string; products: ProductCard[] };

/** Shrink a photo to at most 900 px on the long side (JPEG) so it uploads fast on mobile data. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("This photo couldn't be read. Try another one.");
  return blob;
}

/** Find pieces that look like the photo (AI photo search). */
export async function lensFind(file: File): Promise<LensAnswer> {
  const blob = await shrink(file);
  const res = await fetch("/api/lens", { method: "POST", headers: { "content-type": "image/jpeg" }, body: blob });
  const data = (await res.json().catch(() => ({}))) as LensAnswer & { error?: string };
  if (!res.ok) throw new Error(data.error || "Photo search didn't work. Please try again.");
  return data;
}

/** Ask the header's search to open (optionally with a photo to search by). */
export function openSearch(photo?: File) {
  window.dispatchEvent(new CustomEvent("mbm-search", { detail: { photo } }));
}
