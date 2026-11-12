import "server-only";
import type { ProductCard } from "./catalogue";

/**
 * AI photo search: Gemini looks at the shopper's photo and picks the closest products from our
 * own catalogue (it never invents products). Same models as the ERP, fastest first.
 */
// Matching a photo to our own list doesn't need the heaviest model: the fast one goes first.
const MODELS = [process.env.GEMINI_LENS_MODEL || "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
const TIMEOUT_MS = 15_000;

export class LensError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export type LensResult = { description: string; products: ProductCard[] };

function toBase64(bytes: ArrayBuffer) {
  return Buffer.from(bytes).toString("base64");
}

export async function lensSearch(image: ArrayBuffer, mime: string, catalogue: ProductCard[]): Promise<LensResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new LensError("Photo search isn't available right now", 503);
  const list = catalogue
    .filter((p) => !p.sold_out)
    .map((p) => `${p.slug} | ${p.title} | ${p.category.name} | ${p.category.section === "mahib" ? "MAHIB" : "Maqdoom's"}`)
    .join("\n");
  const prompt = [
    "You help shoppers of an Indian menswear store (sherwanis, kurtas, waistcoats, safas, mojris, accessories).",
    "Look at the photo. Describe the main clothing item in one short line (garment, colour, embroidery or pattern).",
    "Then choose up to 8 products from the CATALOGUE below that are the same or most similar (type first, then colour and style).",
    "Only use slugs exactly as written in the catalogue. If nothing in the photo is clothing or footwear, return no matches.",
    'Answer as JSON: {"description": "...", "matches": ["slug", ...]}',
    "CATALOGUE (slug | title | category | store):",
    list || "(empty)",
  ].join("\n");
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: toBase64(image) } }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  let lastStatus = 0;
  for (const model of MODELS) {
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      lastStatus = 504; // timed out: try the next model
      continue;
    }
    lastStatus = res.status;
    if (res.status === 429 || res.status === 503 || res.status === 404 || res.status >= 500) continue;
    if (!res.ok) break; // 400/403: the request itself is wrong; another model won't help
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    let parsed: { description?: string; matches?: string[] } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }
    const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
    const products = [...new Set(parsed.matches ?? [])]
      .map((s) => bySlug.get(String(s)))
      .filter((p): p is ProductCard => Boolean(p))
      .slice(0, 8);
    return { description: (parsed.description ?? "").slice(0, 200), products };
  }
  console.error(`lens: all models failed (last HTTP ${lastStatus})`);
  throw new LensError("Photo search is busy right now. Please try again in a minute.", 503);
}
