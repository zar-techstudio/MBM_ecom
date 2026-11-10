import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Read-only access to the shared ERP database through its public storefront
 * functions (see STOREFRONT_RULES.md). Public key only; no table access.
 * Product content is kept in memory for a minute (settings for an hour); availability is read live.
 */

export type Section = "main" | "mahib";

export type Category = {
  slug: string;
  name: string;
  section: Section;
  description: string | null;
  banner: string | null;
  products: number;
};

export type ProductCard = {
  slug: string;
  title: string;
  thumbnail: string | null;
  category: { slug: string; name: string; section: Section };
  kind: "garment" | "fabric" | "empty";
  price_min_paise: number | null;
  price_max_paise: number | null;
  price_from_paise_per_m: number | null;
  sold_out: boolean;
  featured_in_category: boolean;
  featured_rank: number | null;
  home_featured: boolean;
  /** Shown while a shopper holds (phone) or rests the cursor on (desktop) the card.
   * Not sent by the ERP yet; see the ERP note in STOREFRONT_RULES.md. */
  hover_image?: string | null;
  /** Short muted clip played on hold/hover instead of hover_image. Bucket path or full URL. */
  video?: string | null;
};

/** One piece of a complete outfit, e.g. role "Safa" with its product card. */
export type LookPiece = { role: string; product: ProductCard };

/** A complete outfit (MAHIB runway). Every piece is a normal product that can also be bought alone. */
export type Look = {
  slug: string;
  name: string;
  occasion: string | null;
  /** Full-length photo of the whole outfit (bucket path). */
  image: string;
  image_alt: string | null;
  pieces: LookPiece[];
};

export type SizeOption = { size: string | null; price_paise: number | null; left: number };

export type Product = ProductCard & {
  description: string | null;
  images: string[];
  tags: string[];
  /** Short bullet list (empty until staff add some; missing before ERP migration 20261030000800). */
  highlights?: string[];
  seo_title: string;
  seo_description: string | null;
  sizes: SizeOption[];
};

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Small in-memory cache (per Cloudflare Worker instance): the same question within `seconds` reuses the
 * answer instead of asking the database again. Failed answers are not kept.
 */
const memory = new Map<string, { until: number; value: Promise<unknown> }>();
function remember<T>(key: string, seconds: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && hit.until > now) return hit.value as Promise<T>;
  const value = load();
  memory.set(key, { until: now + seconds * 1000, value });
  value.catch(() => memory.delete(key));
  return value;
}
const MINUTE = 60;
const HOUR = 3600;

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

export async function getCategories(section?: Section): Promise<Category[]> {
  return remember(`categories:${section ?? ""}`, MINUTE, async () =>
    (await call<Category[]>("storefront_categories", { p_section: section ?? null })) ?? [],
  );
}

export async function getProducts(section?: Section, category?: string): Promise<ProductCard[]> {
  return remember(`products:${section ?? ""}:${category ?? ""}`, MINUTE, async () =>
    (await call<ProductCard[]>("storefront_products", {
      p_section: section ?? null,
      p_category: category ?? null,
    })) ?? [],
  );
}

export async function getHomeFeatured(): Promise<ProductCard[]> {
  return remember("home", MINUTE, async () => (await call<ProductCard[]>("storefront_home_featured")) ?? []);
}

/** Cached product content (title, photos, description, SEO). */
export async function getProduct(slug: string): Promise<Product | null> {
  return remember(`product:${slug}`, MINUTE, async () =>
    (await call<Product | null>("storefront_product", { p_slug: slug })) ?? null,
  );
}

/** Live read for sizes, pieces left and sold-out state. Never cached. */
export async function getProductLive(slug: string): Promise<Product | null> {
  return (await call<Product | null>("storefront_product", { p_slug: slug })) ?? null;
}

/** The complete outfits for a section, in staff order (top 5). Read from the ERP's
 * `storefront_looks` function. Until the ERP adds that function the runway is simply not shown;
 * local development (`next dev`) shows sample outfits instead so the design can be worked on. */
export async function getLooks(section: Section): Promise<Look[]> {
  return remember(`looks:${section}`, MINUTE, async () => {
    try {
      return ((await call<Look[]>("storefront_looks", { p_section: section })) ?? []).slice(0, 5);
    } catch (e) {
      if (!/storefront_looks/.test(String(e)) || !/(find|exist)/i.test(String(e))) throw e;
      if (process.env.NODE_ENV === "development" && section === "mahib") {
        return (await import("./sample-looks")).SAMPLE_LOOKS;
      }
      return [];
    }
  });
}

export async function getSettings(): Promise<{ whatsapp_number: string }> {
  return remember("settings", HOUR, () => call<{ whatsapp_number: string }>("storefront_settings"));
}
