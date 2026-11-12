import { getProducts } from "@/lib/catalogue";
import { LensError, lensSearch } from "@/lib/lens";

const MAX = 3 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 12; // searches per device per 10 minutes (per server instance)
const seen = new Map<string, number[]>();

/** POST /api/lens, body = a photo (JPEG/WebP/PNG, resized in the browser). Answers
 * { description, products } with the closest pieces from the catalogue. */
export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (!/^image\/(jpeg|webp|png)$/.test(type)) return Response.json({ error: "Send a photo" }, { status: 415 });
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const times = (seen.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_WINDOW)
    return Response.json({ error: "Too many photo searches. Please wait a few minutes." }, { status: 429 });
  seen.set(ip, [...times, now]);
  if (seen.size > 5000) seen.clear();
  try {
    const image = await request.arrayBuffer();
    if (!image.byteLength || image.byteLength > MAX) throw new LensError("That photo is too large. Try another one.");
    const result = await lensSearch(image, type, await getProducts());
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e instanceof LensError ? e : new LensError("Photo search didn't work. Please try again.", 500);
    return Response.json({ error: err.message }, { status: err.status });
  }
}
