# Storefront rules (MAQDOOM'S Big Mall website)

Updated 12 Nov 2026. This site (`MBM_03`) is the shop front of the ERP (`E:\Projects\LEADS\Maqdooms\mbm_inv_v2`,
live at erp.maqdoomsbigmall.com). The ERP owns the database, the schema and every migration. The
website reads the catalogue and places orders **only through the ERP's storefront functions**; its
contract is `mbm_inv_v2/docs/STOREFRONT_API.md`.

## Hard rules

1. **Public key only.** Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never add a service-role or
   secret database key to this project, its `.env` files or Cloudflare. The one shared secret is
   `SHOP_API_SECRET` (set by the ERP), used only on this site's server (`src/lib/shop-api.ts`) to
   ask the ERP to send a sign-in code, start a payment, or store a review photo.
2. **No migrations here.** No `supabase/` folder, no SQL. Database changes are made in the ERP repo.
3. **Storefront functions only.** Direct table reads are blocked for the public role, by design.
   - Catalogue (no sign-in): `storefront_settings`, `storefront_categories`, `storefront_products`,
     `storefront_products_page` (not used yet), `storefront_home_featured`, `storefront_product`,
     `storefront_looks` (outfits; each piece has an optional dot `x`, `y` in % of the photo).
   - Sign-in, account, quote, orders, invoices, points: see `STOREFRONT_API.md`
     (`storefront_verify_otp`, `storefront_me`, `storefront_quote`, `storefront_place_order`,
     `storefront_order`, `storefront_invoice`, `storefront_points`, …).
   - Reviews: `storefront_review_form`, `storefront_submit_review`, `storefront_reviews`;
     product cards carry `rating`.
4. **Amounts come from the ERP.** Prices are in paise and **include GST** (the showroom selling
   price staff enter). Checkout totals, discounts, delivery, GST split and cash-on-delivery
   availability come only from `storefront_quote`; the website never calculates a charge.
   Payment status comes only from the ERP (Razorpay tells the ERP directly).
5. **Photos** are in the public `ecommerce-images` bucket, already WebP (converted in the ERP before
   upload): large `<id>.webp` (1600×2000) and card `<id>.card.webp` (600×750). Outfit photos are
   cut-outs of any shape. Use `imageUrl(path, "large" | "card")` from `src/lib/site.ts`.
6. **The session stays on the server.** The shopper's session lives only in the HttpOnly cookie
   `mbs`, set and read by `POST /api/shop/<action>`. Never pass it to page scripts.

## Environment

| Variable | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env` (built in) | ERP database, public key |
| `NEXT_PUBLIC_SITE_URL` | deploy command | `https://maqdoomsbigmall.com` |
| `SHOP_API_SECRET` | `.env`, and a secret on the `mbm-website` Worker | server-to-ERP calls only |
| `GEMINI_API_KEY` | `.env`, and a secret on the `mbm-website` Worker | AI photo search (same key as the ERP) |

`.env` lists every value with a note. Secrets on the Worker are set with
`npx wrangler secret put NAME --name mbm-website` and listed with `npx wrangler secret list --name mbm-website`;
keep `.env` and the Worker in step.

## Hosting and deploy

- Cloudflare Workers (ZAR account), Worker `mbm-website`, at https://maqdoomsbigmall.com and www.
- Deploy: `NEXT_PUBLIC_SITE_URL=https://maqdoomsbigmall.com npm run deploy` (OpenNext; `wrangler login`
  as the ZAR account). If only the upload fails (network), `npx opennextjs-cloudflare deploy` retries it.
- The build uses 3 workers (`experimental.cpus` in `next.config.ts`) so it fits in 8 GB; it needs a
  few GB free on drive C:.
- Next.js "Cache Components" are off (the Cloudflare adapter does not support them yet).
- This Next.js version differs from older ones: read `node_modules/next/dist/docs/` before using an
  API (see `AGENTS.md`). After adding a route, run `npx next typegen` so `PageProps<…>` types exist.

## How the site works

- **Freshness:** catalogue content is kept in memory for a minute, settings for an hour
  (`remember()` in `src/lib/catalogue.ts`); pages are built on each visit, so staff changes show
  within a minute without a deploy. Sizes and stock on product pages are read live
  (`getProductLive` inside `<Suspense>`).
- **Guests browse freely.** Bag, wishlist and recently viewed are kept on the device
  (`src/lib/shop-store.ts`, localStorage key `mbm-shop-v1`). Signing in merges them into the account
  and keeps them in sync (`src/lib/account.ts`).
- **Ordering:** product page (size → Add to bag / Buy now) → `/bag` (live prices and stock) →
  `/checkout` (mobile + one-time code, first time a name; address; review with coupon; pay online or
  cash on delivery when the quote allows it) → `/orders/<code>` (status, pay now, cancel before
  packing, tracking, invoice once shipped). `/account` has orders, loyalty points (balance, value,
  history), profile, addresses, sign out. Checkout offers "Use my points" (priced by the quote,
  like a coupon). WhatsApp ordering
  stays as a link on the bag. Fabrics are enquire-only (the ERP refuses them in a quote).
- **Shop owner settings that affect checkout** (ERP checkout settings): delivery charge,
  free delivery from an amount, cash on delivery on/off with an optional limit.

### Pages

| Path | What |
|---|---|
| `/` | Home: hero (outfits change by themselves), categories, MAHIB, fabrics, featured, tailoring, heritage |
| `/shop`, `/shop/<category>` | Maqdoom's collection |
| `/mahib`, `/mahib/<category>` | MAHIB: outfit runway on top, then heading, category chips, products |
| `/product/<slug>` | Photos (swipe, hold or hover to zoom, full-screen pinch), size, Add to bag / Buy now, trust row, Complete the look, Recently viewed |
| `/search?q=` | Search results (header search shows suggestions as you type) |
| `/wishlist`, `/bag`, `/checkout`, `/orders/<code>`, `/account` | Shopping and account |
| `/orders/<code>/invoice` | The saved GST invoice, laid out to print or save as PDF (after shipping) |
| `/review/<code>` | One-time review link for a bill (online or showroom): stars, comment, photo; Google review link for showroom bills |
| `/contact`, `/policies/{shipping,returns,privacy,terms}` | Store details, map, policies (owner should review the wording) |

### Server routes

| Route | What |
|---|---|
| `POST /api/shop/<action>` | All sign-in, account and checkout calls (JSON only; `src/app/api/shop/[action]/route.ts`) |
| `GET /api/products?slugs=` | Live sizes, prices, stock for the bag and wishlist |
| `GET /api/search?q=` | Search suggestions (title, category, store) |
| `POST /api/lens` | AI photo search: a photo (resized in the browser) → Gemini picks the closest products from the catalogue (`src/lib/lens.ts`; fast model first; 12 searches per device per 10 minutes) |
| `POST /api/review-photo?token=` | A review photo (WebP/JPEG, resized to ~1200 px in the browser), passed to the ERP |

### Main pieces of code

- `MahibRunway` / `MahibLead`: outfit runway (fixed arches, cut-out outfits slide over them, piece
  dots, combined price, side panel, Buy the look, 5-second auto-advance that pauses while browsing).
- `ProductCard` / `CardMedia`: catalogue-style cards in a hairline grid; hold (phone) or hover
  (desktop) shows the 2nd photo or video; 12 cards at a time, more on scroll; sort and filters.
- `ProductGallery`: swipe, hold-to-zoom, hover zoom, full-screen viewer.
- `OrderPanel`, `BagView`, `CheckoutView`, `OrderView`, `InvoiceView`, `AccountView`, `SignIn`,
  `AddressForm`.
- Reviews: `ReviewView` (the review link page), `ProductReviews` (product page: average, verified
  reviews, Show more, photos), `Stars`; ratings on cards; `aggregateRating` and reviews in the
  product's structured data for Google.
- `SiteChrome`: header (search, wishlist, account, bag) and the minimal footer.
- Search: `ShopIcons` (search screen with suggestions and the camera for photo search),
  `SearchBar` (search bar at the top of listing pages), `lens-client.ts`.
- Listing pages: category bubbles (category banner, else the first product photo), filter chips
  that scroll sideways. Product pages: `PhotoActions` (rating, wishlist, share on the photo),
  `SizeGuide` (general guide until the ERP has charts), open/close sections (highlights,
  details, delivery & returns), `ProductRail` ("More like this"), two-button bar on phones.
- Styles: `design.css` (original design), `globals.css` (storefront additions), `refine.css`
  (tweaks), `shop.css` (checkout, orders, account), `src/app/mahib/mahib.css` (runway).

## Testing notes

- Sign-in codes are in test mode until WhatsApp/SMS is switched on in the ERP: the code is shown in
  the ERP under Commerce → Orders → Customers & Loyalty.
- Online payment answers "not available" until the Razorpay keys are set in the ERP.
- In Claude's built-in browser pane, streamed parts of a page (like the live stock box on product
  pages) may not appear while the pane is in the background, because it stops drawing frames. Real
  browsers are not affected; check on a phone.

## Photo guide for staff

- **Outfit photo:** the complete outfit on a mannequin with a head form, full length from the top of
  the safa to the shoes, cut out on a transparent background (a cut-out stands in front of the
  arch). A normal photo also works; it then fills the arch.
- **Piece photos:** each item alone on a plain background, 4:5. Photo 1 the whole piece (front);
  photo 2 a close-up of embroidery or the back (shown on hold/hover); shoes at a 3/4 angle with
  space around them; safa on a head form. The crop tool can fit the whole photo with matching padding.
- **Video (optional):** one 5–8 second clip per product, played on hold/hover.

## Original design

`reference/` has the original static design (`index.html`, `app.js`, `styles.css`);
`src/app/design.css` is that stylesheet.
