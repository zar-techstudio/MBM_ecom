# Storefront rules (MAQDOOM'S Big Mall website)

This site is a read-only window onto the ERP's shared Supabase database.
The ERP (`maqdoom-s-INV`) owns the data, the schema and every migration.

## Hard rules

1. **Public key only.** Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never add a
   service-role or secret database key to this project, its `.env` files or Cloudflare.
   The one shared secret is `SHOP_API_SECRET` (set by the ERP): used only on this site's
   server (`src/lib/shop-api.ts`) to ask the ERP to send a sign-in code or start a payment.
2. **No migrations here.** No `supabase/` folder, no SQL. Schema changes are
   made in the ERP repo, tested on the test project, then applied to live.
3. **Storefront functions only.** Read data through these RPCs, nothing else:
   - `storefront_settings()` — WhatsApp number
   - `storefront_categories(p_section)` — `main` / `mahib` / null for both
   - `storefront_products(p_section, p_category)` — product cards
   - `storefront_home_featured()` — one home pick per category
   - `storefront_product(p_slug)` — product page, sizes and pieces left
   - `storefront_looks(p_section)` — complete outfits for the MAHIB runway (all published, in
     staff order; each piece has an optional dot position `x`, `y` in % of the outfit photo)
   Direct table reads are blocked for the public role, by design.
4. **Photos** come from the public `ecommerce-images` bucket. Each photo has a
   large copy `<id>.webp` (1600×2000) and a card copy `<id>.card.webp` (600×750).
   Use `imageUrl(path, "large" | "card")` from `src/lib/site.ts`.
5. **Prices** are in paise. Online price = showroom selling price, set in the ERP.

## How it works

- Content (titles, photos, categories) is kept in memory for a minute, settings for an hour
  (`remember()` in `src/lib/catalogue.ts`). Pages are built on each visit (`dynamic = "force-dynamic"`
  in the root layout), so nothing needs a rebuild when staff publish.
- Hosting: Cloudflare Workers (ZAR account), Worker `mbm-website`, at https://maqdoomsbigmall.com and
  www. Deploy: `NEXT_PUBLIC_SITE_URL=https://maqdoomsbigmall.com npm run deploy` (OpenNext adapter;
  `wrangler login` as the ZAR account). Next.js "Cache Components" are off: the Cloudflare adapter
  does not support them yet (pages hung).
- Sizes and stock on the product page are read live on every visit
  (`getProductLive`, inside `<Suspense>`).
- Ordering: bag → `/checkout` (mobile + one-time code, address, review with coupon, online or
  cash on delivery) → `/orders/<code>`. All amounts come from the ERP's quote. Every account and
  checkout call goes through `POST /api/shop/<action>` (`src/app/api/shop/[action]/route.ts`),
  which keeps the shopper's session in an HttpOnly cookie (`mbs`). The ERP's contract is
  `mbm_inv_v2/docs/STOREFRONT_API.md`. WhatsApp ordering stays as an option on the bag.
  Fabrics are enquire-only.
- Staff publish, feature and archive products in the ERP's E-commerce section.

## Outfits and card media (live in the ERP since 11 Nov 2026)

Originally specified here for the ERP; the ERP now provides all of it, plus dot positions and
cut-out outfit photos of any shape. `src/lib/sample-looks.ts` is only used by `next dev` if the
function is missing.

### 1. Complete looks (MAHIB runway, top 5)

- Tables, owned by the ERP, same row security and audit triggers as `listings`:
  - `looks`: `id`, `slug` (unique), `name` ("The Nikah"), `occasion` ("The ceremony · morning light",
    optional), `section` (`main` / `mahib`), `image_path` (full-length photo in `ecommerce-images`),
    `image_alt`, `rank`, `published`, `archived_at`, timestamps.
  - `look_pieces`: `look_id`, `listing_id`, `role` (Sherwani, Kurta, Waistcoat, Bottom, Safa, Stole,
    Shawl, Footwear, Mala…), `position`. Every piece is an ordinary listing, so it can also be bought alone.
- New function `storefront_looks(p_section text)`, `SECURITY DEFINER`, execute granted to `anon`
  like the others. Returns published, non-archived looks of that section ordered by `rank`, each:
  ```json
  { "slug": "nikah", "name": "The Nikah", "occasion": "The ceremony · morning light",
    "image": "looks/nikah.webp", "image_alt": "Ivory raw-silk sherwani…",
    "pieces": [ { "role": "Sherwani", "product": { …same JSON as storefront_product_card… } } ] }
  ```
  Leave out pieces whose listing is unpublished or archived (sold-out pieces stay, marked `sold_out`).
  The website shows at most 5 looks.
- ERP screen (E-commerce → Complete looks): create/edit a look, upload its full-length photo, add
  pieces by searching listings and choosing a role, drag to reorder looks and pieces, publish.

### 2. Hold/hover preview on product cards

- Add to the card JSON (`storefront_product_card`, used by `storefront_products`,
  `storefront_home_featured` and the look pieces):
  - `hover_image`: bucket path of the photo shown on hold/hover (default: the listing's 2nd photo;
    staff can pick another). Needs the usual `.card.webp` copy.
  - `video`: bucket path (or full URL) of a short clip, or null.
- Listing editor: upload one video per listing (shown as one of its up to 6 media). On upload,
  compress to MP4 (H.264), about 720×900, 5–8 seconds, no sound, about 1–2 MB.
  Store it in `ecommerce-images` (or a new public `ecommerce-videos` bucket).
- `storefront_product` can also return `video` so the product page gallery can play it later.

### Photo guide for staff

- **Look photo:** the complete outfit on a mannequin (or model), full length from the top of the safa
  to the shoes, plain white or light grey background, portrait 4:5 (1600×2000), same camera height,
  distance and light for all five looks. The site blends white backgrounds into the arch colour.
- **Piece photos:** each item alone on plain white, 4:5, centred with the same margin. Photo 1 the
  whole piece (front), photo 2 a close-up of embroidery or the back; shoes at a 3/4 angle;
  safa on a head form.

## Later (cart, payments, international delivery)

Add these as new ERP functions (e.g. `storefront_place_order`) that run as
`SECURITY DEFINER` and validate everything server-side, plus a Next.js route
handler for the payment provider's webhook. Keep rule 1: the storefront never
holds a secret database key.

## Original design

`reference/` has the original static design (`index.html`, `app.js`,
`styles.css`). `src/app/design.css` is that stylesheet; storefront additions
live in `src/app/globals.css`.
