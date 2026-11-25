# MAQDOOM'S Big Mall: the e-commerce website

The one document for the website (`MBM_03`): where it stands, what is left, what is built, how it
is built, and what it needs from the ERP. Updated 18 Nov 2026.

- Live: https://maqdoomsbigmall.com (Cloudflare Worker `mbm-website`).
- The ERP (`E:\Projects\LEADS\Maqdooms\mbm_inv_v2`, erp.maqdoomsbigmall.com) owns the database,
  the products and the orders. Its side of the contract: `mbm_inv_v2/docs/STOREFRONT_API.md`.

Contents: 1. Where things stand · 2. Before launch · 3. Owner decisions · 4. What is built ·
5. How the site is built · 6. What the ERP should add next · 7. Ideas for later

---

## 1. Where things stand

- **The website is finished and live.** Every screen is built: browsing, MAHIB runway, search
  (with photo search), bag, checkout, orders, invoices, account, loyalty points, reviews, WhatsApp
  choices. No website code is waiting.
- **It cannot take orders yet**, only because of keys and settings on the ERP side (section 2):
  sign-in codes are in test mode, and Razorpay, WhatsApp, SMS and Shiprocket keys are not in (email:
  Resend is set up, per the owner on 18 Nov 2026).
- **Catalogue today:** 32 products, all MAHIB; the main shop (Maqdoom's) has none. 5 pieces are
  picked for the home page.
- **Security: done (18 Nov 2026).** All six security headers are live and match the ERP; every
  plain-http request goes to https (Cloudflare "Always Use HTTPS", with `worker.ts` as the
  fallback); Next.js is on 16.4.6. Confirmed by the owner; nothing more is planned on security.
  The four npm warnings left are in OpenNext's build tools (only used on this computer while
  building): update `@opennextjs/cloudflare` when OpenNext releases a fix.
- **Not tested yet:** the screens that need a real signed-in shopper (adding a mobile at checkout,
  WhatsApp switches, "Tell me when it's back") and a full order. Both need the keys first.

---

## 2. Before launch

Keys are secrets on the ERP server, added by whoever has the server login (with the keys from the
Owner); settings are in the ERP. Each feature says "not set up" until its key is in. None of this
needs website work.

### Launch audit (19 Nov 2026)
Checked against the owner's launch checklist on the live site (crawl of all 51 sitemap pages and
65 internal links; 15 main pages on 340 px and 390 px phones and desktop; Cloudflare logs).
- **Blocker: Cloudflare plan.** About 1 in 10 freshly built pages fails with "Worker exceeded
  resource limits" (Cloudflare log: `exceededCpu`). A product page needs ~31 ms of CPU (up to
  56 ms); the Workers **Free** plan allows about 10 ms. Fix: Workers **Paid** plan (US$5/month,
  owner's Cloudflare account), nothing to change in the code. The edge copy hides it for most
  visits, but search engines and the first visit to a page hit it.
- **Done / fine:** no sideways scrolling, no browser errors, every form field labelled, every
  image has alt text, one h1 per page, unique titles, descriptions and canonicals, no broken
  internal links, robots.txt and sitemap, http → https, 404 returns 404, security headers,
  sign-in cookie (httpOnly, secure, SameSite=lax, 60 days), sign-in codes expire in 5 minutes
  with ERP limits on requests, images compressed and cached, edge copy of pages.
- **Fixed in this audit:** `www.maqdoomsbigmall.com` now redirects to `maqdoomsbigmall.com`
  (`worker.ts`); the 404 page is titled "Page not found" and is not indexed.
- **Not set up (owner's choice):** Google Analytics / Tag Manager / Microsoft Clarity (only
  Cloudflare's cookieless Web Analytics runs today, so no cookie banner is needed); Google Search
  Console and Bing Webmaster Tools; uptime and error alerts for the website.
- **Still to do before launch:** the items in this section (keys, settings, clean start, policy
  approval, a full test order, real iPhone and Android).

### Keys
- **Sign-in codes are in test mode.** Switch them live only after a sender has its keys, or no code
  is sent and nobody can sign in:
  - email (Resend): **set up (owner, 18 Nov 2026)**; shoppers can sign in by email once codes go live;
  - SMS (MSG91 with DLT) or WhatsApp (Meta, with templates): needed to **confirm a mobile**, and an
    order cannot be placed without one. So taking orders needs SMS or WhatsApp, not email alone.
- **Razorpay**: until set, online payment says it isn't available yet.
- **Shiprocket**: courier booking is built in the ERP; tracking then appears on the order page by
  itself.
- **WhatsApp (Meta)**: order updates, review links and back-in-stock messages go once it is in.

### Owner settings in the ERP
- Cash on delivery: **off** today; turn it on (optionally with a limit).
- Delivery charge (₹0 today) and the free-delivery amount (none set).
- Shiprocket pickup name and box size.

### Checks
1. Owner reads and approves the policy pages (shipping, returns, privacy, terms, grievance
   officer). The wording is a draft.
2. Publish Maqdoom's (main shop) products.
3. **ERP clean start** (removing test data) may unpublish the current products and looks: after it,
   publish the real MAHIB and Maqdoom's stock and looks, and pick the home-featured pieces again.
4. One full test order after the keys and settings: sign-in, adding a mobile, an address, a
   Razorpay test payment and a cash-on-delivery order (place one, cancel one), then the WhatsApp
   message, the invoice and the courier booking.
5. Look at the site on a real iPhone and a real Android phone.
6. Decide whether to hide the site from search engines until launch (it is open now).
7. Later: Google Business profile and Search Console (product structured data is already on product
   pages); uptime and error alerts for the website (the ERP already has them); HSN codes per
   product for the GST invoice [ERP].

### This computer
- Drive C: has only about 2 GB free. Builds work because their temp files go to drive E (see 5.3).
  The folder `E:\Projects\LEADS\Maqdooms\.build-tmp` can be deleted between builds.

---

## 3. Owner decisions

| Question | Decision |
|---|---|
| Cash on delivery | **Yes** (turn it on in the ERP's checkout settings) |
| Free delivery amount | To be confirmed with the Owner |
| Online exchanges | **None** (damaged or wrong items replaced or refunded; unboxing video within 48 hours); showroom: 2 days |
| Loyalty | **Both showroom and online**, linked by mobile number |
| Sign-in | Mobile (WhatsApp or SMS code) or email (email code) |
| Payment and courier | Razorpay and Shiprocket keys added last, before launch |
| Grievance officer | **Moghny Maqdoom**, +91 96104 15415 (call or WhatsApp) |
| Instagram | @maqdooms_bigmall and @mahib_by_moghnymaqdoom |
| Showroom hours | Every day, 9 am – 11 pm |

Still open: loyalty rates (points per ₹100, value, expiry), international delivery charges.

---

## 4. What is built (live)

### Look
- Colours: warm ivory, deep maroon buttons and bands, thin gold lines; serif headings.
- **Top strip** (every page, `TopStrip`): thin dark teal bar above the header, always shown (no
  close button). Strip and header slide away while scrolling down and come back on the first
  scroll up (`chrome-hidden` class on `<html>`, set in `HeaderClient`; stays near the top and while
  a menu is open; from Baymard research: +15.5% add to bag). Its text scrolls slowly right to left: "Premium Ethnic Wear · Since
  1895 · Hyderabad · MAHIB — The Exclusive Edit (link) · Delivered across India & abroad · Style.
  Tradition. You." was removed 26 Nov 2026 (slogan); pauses on hover, still for reduced motion. Only true statements go here.
  Every overlay (search, side menu, drawers, photo viewer, size guide) starts below it
  (`top: var(--strip-h)`); a new full-screen overlay must do the same.
- **Footer drawing:** the showroom line drawing (`mall-line.svg`, used as a mask so its colour can
  change) is on every footer: darker gold on the light home footer, brighter gold on the dark ones.
- **Phone tab bar** (`TabBar`, phones up to 860 px): Home · Shop · MAHIB · Bag (with count) ·
  Account along the bottom, the current one in maroon with a gold underline. Not shown on product,
  bag, checkout, review and invoice pages (they have their own buy bar). On the home page it slides
  up once the shopper scrolls, so the full-screen hero keeps both buttons. Floating WhatsApp,
  toasts and the "Added to your bag" panel sit above it (`has-tabbar` on `<html>`). From the
  research reels: visible tabs beat a hidden menu. Each place appears once: where the bar shows,
  the header has no bag icon (Amazon and Flipkart keep the cart only at the bottom); the header
  keeps ☰ (categories, tailoring, contact), the logo, search and the wishlist.
  One bar at a time while scrolling: down hides the header and keeps the tab bar, up brings the
  header back and tucks the tab bar away (`chrome-up` on `<html>`); near the top both show. The
  MAHIB tab and menu icon is the ornament above the "i" in the MAHIB logo.
- **Phone header:** menu on the left, logo, search, wishlist, bag (count shown, also 0). Desktop:
  menus, Feel the Fabric, search, wishlist, account, bag.
- **Phone menu:** slides in from the left; Shop and MAHIB as cards with icons that open and close;
  rows for Custom Tailoring, My Account & Orders, Wishlist, Contact & Store; WhatsApp button.
- **Footer:** address with map pin, phone, hours, Instagram, Shop / Help / About. On the home page
  it is light with the showroom line drawing in gold; on phones it is compact (logo | details |
  social).
- **Intro video** on phones, once per device on the home page (1.2 MB WebM, MP4 for older iPhones;
  skipped on slow data or reduced motion; Skip button).
- Every new page opens at the top; Back keeps your place.

### Home page
Shorter hero (outfits change by themselves); maroon category ring with rounded cards and arrows;
"Since 1895" story; MAHIB banner; **Shop by ceremony** (one fixed gold arch on a marble stage with
a marble floor and fabric drapes; the looks swap every 5 seconds; pieces, total, Shop the look, Add
to wishlist); fabrics; **Featured** (arch-topped cards, the pieces staff pick in the ERP, else the
newest); custom tailoring with step icons; Recently viewed.

### MAHIB
- **Runway** on `/mahib` and every MAHIB category: a palace hall photo (owner's artwork) with
  three teal niches; the outfits stand in the niches on the marble floor (soft shadow, faint
  reflection) and step from niche to niche every 5 seconds (paused only while a piece or the panel
  is open); arrows on desktop, swipe on touch; piece dots with a product card; under it a dark
  teal band with "Featured look 01 / 13", the look's name in spaced capitals, price, a gold Shop the
  look and an outlined Customize your look (side panel). Three versions of the photo: wide
  (desktops, laptops, phones sideways), 4:3 (tablets upright), tall (phones), each ~240 KB WebP in
  `public/images/mahib-bg-*.webp`; originals in `reference/mahib-bg/`. The photo and the outfits
  share one canvas with the photo's shape (`src/app/mahib/runway-photo.css`, positions measured
  from the photos), so outfits always stand in the niches; on wide screens the whole photo shows
  (chandelier to floor); on narrower ones the curtains are cropped first. **If the photos are replaced, the niche positions must be measured again.**
  Outfit photos look best as cut-outs (transparent background); a normal photo is shown as a
  framed portrait in the niche.
- Listing head: spaced label, large MAHIB, gold ornament, "Complete Looks. Timeless Details.",
  section search, category bubbles.

### Browsing
- Product cards: soft boxes with a gap, wishlist heart, Add to Bag (In Bag · View after); hold
  (0.18 s, phone) or hover (0.1 s, desktop) shows the 2nd photo or video; grid / list switch
  (remembered); 12 at a time, more on scroll; sort by price, price ranges, in stock.
- Product page: swipe photos, hold-to-zoom (0.16 s), hover zoom, full-screen pinch; rating,
  wishlist and share on the photo; size, size guide (over the whole page), Add to bag, Buy now;
  trust row; "See it live on a video call"; highlights, details, delivery & returns; Complete the
  look; More like this; Recently viewed; "Tell me when it's back" when sold out.
- **Buy the look** (product page, runway, home) adds only the pieces not already in the bag; the
  product page says "Add the other N pieces" when some are there.
- Search with suggestions, recent searches and a results page; **AI photo search** (camera: snap
  or upload a photo, Gemini picks the closest pieces).
- Contact page with map; policy pages.

### Shopping, accounts and checkout
- Bag and wishlist on the device without an account; merged into the account on sign-in and kept
  in sync.
- **Bag:** a card per piece (size drop-down, quantity, Save for Later, Remove), live prices and
  stock, Order Summary with Proceed to Checkout, trust row, Complete Your Look / You May Also Like;
  empty bag with Recently Viewed and suggestions. Fits phones down to 340 px.
- **Sign-in:** a mobile number or an email and a one-time code; WhatsApp or SMS for a mobile
  (switches to SMS by itself when a number is not on WhatsApp), email for an email; only the ways
  the ERP offers. Name asked once.
- **Checkout:** 1-2-3 tracker; step 1 sign-in, and a mobile confirmed before ordering (an email
  sign-in adds one; "Your showroom account is now linked" when it matches showroom bills); step 2
  saved or new address (state decides GST); step 3 online or cash on delivery; order card with
  coupon, points, delivery, GST, total, all from the ERP's quote.
- **Orders:** status in plain words, progress, tracking, Pay now while awaiting payment, cancel
  before packing, Buy again, printable GST invoice once shipped. `/orders` opens the list.
- **Account:** orders, loyalty points (balance, value, history), WhatsApp switches (order updates,
  reminders about my bag), profile (an email used to sign in is read-only), addresses, sign out.
- After an order is placed, the ERP is asked to send the "order confirmed" WhatsApp at once.

### Loyalty and reviews
- "Use my points" at checkout (priced by the ERP like a coupon); points in the account.
- `/review/<code>`: the one-time link for a bill: stars, comment and photo per product; showroom
  customers are then asked to review on Google.
- Product pages: average rating, verified reviews with photos; stars on cards; ratings in Google's
  structured data.

---

## 5. How the site is built

### 5.1 Hard rules
1. **Public key only.** Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never add a service-role or
   secret database key to this project, its `.env` files or Cloudflare. The one shared secret is
   `SHOP_API_SECRET` (set by the ERP), used only on this site's server (`src/lib/shop-api.ts`) to
   ask the ERP to send a code, start a payment, store a review photo or send a WhatsApp now.
2. **No migrations here.** No `supabase/` folder, no SQL. Database changes are made in the ERP repo.
3. **Storefront functions only.** Direct table reads are blocked for the public role, by design.
   - Catalogue (no sign-in): `storefront_settings`, `storefront_categories`, `storefront_products`,
     `storefront_products_page` (not used yet), `storefront_home_featured`, `storefront_product`,
     `storefront_looks` (outfits; each piece has an optional dot `x`, `y` in % of the photo).
   - Sign-in: `storefront_sign_in_options`, `storefront_verify_code`, `storefront_verify_phone`,
     `storefront_sign_out`.
   - Account, quote, orders, invoices, points: `storefront_me`, `storefront_quote`,
     `storefront_place_order`, `storefront_order`, `storefront_invoice`, `storefront_points`, …
   - WhatsApp: `storefront_whatsapp_prefs`, `storefront_set_whatsapp_prefs`,
     `storefront_notify_back_in_stock`.
   - Reviews: `storefront_review_form`, `storefront_submit_review`, `storefront_reviews`; product
     cards carry `rating`.
4. **Amounts come from the ERP.** Prices are in paise and **include GST** (the showroom selling
   price staff enter). Totals, discounts, delivery, GST split and cash-on-delivery availability
   come only from `storefront_quote`; the website never calculates a charge. Payment status comes
   only from the ERP (Razorpay tells the ERP directly).
5. **Photos** are in the public `ecommerce-images` bucket, already WebP (converted in the ERP
   before upload): large `<id>.webp` (1600×2000) and card `<id>.card.webp` (600×750). Outfit photos
   are cut-outs of any shape. Use `imageUrl(path, "large" | "card")` from `src/lib/site.ts`.
6. **The session stays on the server.** The shopper's session lives only in the HttpOnly cookie
   `mbs`, set and read by `POST /api/shop/<action>`. Never pass it to page scripts.

### 5.2 Environment

| Variable | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env` (built in) | ERP database, public key |
| `NEXT_PUBLIC_SITE_URL` | deploy command | `https://maqdoomsbigmall.com` |
| `SHOP_API_SECRET` | `.env`, and a secret on the `mbm-website` Worker | server-to-ERP calls only |
| `GEMINI_API_KEY` | `.env`, and a secret on the `mbm-website` Worker | AI photo search (same key as the ERP) |

`.env` lists every value with a note. Worker secrets: `npx wrangler secret put NAME --name mbm-website`,
listed with `npx wrangler secret list --name mbm-website`; keep `.env` and the Worker in step.

### 5.3 Hosting and deploy
- Cloudflare Workers (ZAR account), Worker `mbm-website`, at https://maqdoomsbigmall.com and www.
- Deploy: `NEXT_PUBLIC_SITE_URL=https://maqdoomsbigmall.com npm run deploy` (OpenNext; `wrangler
  login` as the ZAR account). While drive C: is nearly full, run it with `TEMP` and `TMP` pointing
  to a folder on drive E and `NODE_OPTIONS=--max-old-space-size=4096`, and stop the dev server.
- If only the upload fails (network, Cloudflare login refresh), `npx opennextjs-cloudflare deploy`
  retries it without building again.
- The build uses 3 workers (`experimental.cpus` in `next.config.ts`) so it fits in 8 GB.
- Next.js "Cache Components" are off (the Cloudflare adapter does not support them yet).
- **http → https:** Cloudflare's "Always Use HTTPS" (domain setting, on since 18 Nov 2026)
  sends every plain-http request to https with a 301, before the website runs (pages, images and
  the ERP alike). The **Worker entry `worker.ts`** (wrangler.jsonc `main`) has the same redirect as
  a fallback if that setting is ever turned off (301 for GET and HEAD, 308 for anything else),
  then runs the OpenNext build (`.open-next/worker.js`); it is left out of the app's type check
  (`tsconfig.json`).
- **www:** `www.maqdoomsbigmall.com` redirects to `maqdoomsbigmall.com` in `worker.ts` (301 for GET
  and HEAD, 308 otherwise).
- **Security headers** on every page and API answer (`next.config.ts`): HSTS (1 year, subdomains),
  `nosniff`, `X-Frame-Options: SAMEORIGIN`, CSP `frame-ancestors 'self'; base-uri 'self';
  object-src 'none'`, `strict-origin-when-cross-origin`, and a Permissions-Policy that turns off
  camera, microphone and location and allows payment only for this site and Razorpay. Photo search
  uses a file picker, so it still offers the phone camera. Checked: Razorpay Checkout opens with no
  blocked frames.
- Next.js 16.4.6 (16.4.3 had two cache advisories, which the site was not using). This version
  differs from older ones: read `node_modules/next/dist/docs/` before using an
  API (see `AGENTS.md`). After adding a route, run `npx next typegen` so `PageProps<…>` types exist.

### 5.4 How it works
- **Freshness:** catalogue content is kept in memory for a minute, settings for an hour
  (`remember()` in `src/lib/catalogue.ts`), so staff changes show within a minute without a
  deploy. Sizes and stock on product pages are read live.
- **Search engines:** each page has its own title, description and canonical link; `robots.txt`
  and `sitemap.xml` list the pages. The home page carries business details (WebSite and
  ClothingStore: name, alternate spellings, logo, address, hours, Instagram) as JSON-LD;
  product pages carry Product data. Which page Google shows is Google's choice; Google Search
  Console (owner's Google account) is where the site is verified, the sitemap submitted and
  the home page asked to be indexed.
- **Recommendations** (`src/lib/recommend.ts`, 26 Nov 2026): scored by content, no tracking.
  "More like this" (product page): same category, similar price, shared colour and style words in
  the name, same store. Bag ("Complete Your Look" / "You May Also Like"): pieces from the same
  outfits, then categories that staff put together in outfits (sherwani + safa + mojri), matching
  colours, a similar price; a second piece of a category already in the bag counts against; at
  most two per category. "Complete the look" (product page), "Recently viewed" and "Featured"
  are unchanged. Next step once real orders exist: add "often bought together" as one more score.
- **Edge copy of pages** (`worker.ts`, since 18 Nov 2026): pages are the same for every visitor, so
  Cloudflare keeps a copy in each city. A copy under a minute old is served as is; an older one is
  served at once while a fresh one is built in the background (visitors never wait for a build;
  first byte ~0.2 s instead of 1.2–2.4 s). The key includes the deployed version
  (`version_metadata` binding), so after a deploy the first visit in each city builds the page.
  Never copied: anything with a query (search, `?look=`), `/api`, `/_next`, account, bag,
  checkout, orders, invoice, review, wishlist, in-app navigation data, signed-in shoppers ("mbs"
  cookie), and any answer that is not a plain 200 HTML page. The response header `x-mbm-edge`
  says HIT, STALE or MISS. **Rule: a page must never show anything specific to one visitor in
  its HTML**; if one ever must, add its path to `SKIP` in `worker.ts`.
- **Guests browse freely.** Bag, wishlist and recently viewed are kept on the device
  (`src/lib/shop-store.ts`, localStorage key `mbm-shop-v1`). Signing in merges them into the
  account and keeps them in sync (`src/lib/account.ts`). Other device keys: `mbm-recent-searches`,
  `mbm-intro-seen`, `mbm-hold-hint-seen`, `mbm-grid-view`.
- **Ordering:** product page → `/bag` → `/checkout` (sign-in, mobile, address, payment) →
  `/orders/<code>`. Fabrics are enquire-only (the ERP refuses them in a quote). WhatsApp ordering
  stays as a link on the bag.
- **Owner settings that affect checkout** (ERP): delivery charge, free delivery from an amount,
  cash on delivery on/off with an optional limit.

### 5.5 Pages

| Path | What |
|---|---|
| `/` | Home |
| `/shop`, `/shop/<category>` | Maqdoom's collection |
| `/mahib`, `/mahib/<category>` | MAHIB: runway, then heading, category bubbles, products |
| `/product/<slug>` | Product page |
| `/search?q=` | Search results |
| `/wishlist`, `/bag`, `/checkout`, `/account` | Shopping and account |
| `/orders` | Opens the order list on `/account` (linked from WhatsApp messages) |
| `/orders/<code>`, `/orders/<code>/invoice` | One order; its GST invoice to print or save as PDF (after shipping) |
| `/review/<code>` | One-time review link for a bill |
| `/contact`, `/policies/{shipping,returns,privacy,terms}` | Store details, map, policies |

### 5.6 Server routes

| Route | What |
|---|---|
| `POST /api/shop/<action>` | All sign-in, account, checkout, WhatsApp and review calls (JSON only; `src/app/api/shop/[action]/route.ts`) |
| `GET /api/products?slugs=` | Live sizes, prices, stock for the bag and wishlist |
| `GET /api/search?q=` | Search suggestions |
| `POST /api/lens` | AI photo search (`src/lib/lens.ts`; fast model first; 12 searches per device per 10 minutes) |
| `POST /api/review-photo?token=` | A review photo (resized to ~1200 px in the browser), passed to the ERP |

### 5.7 Main pieces of code
- `MahibRunway` / `MahibLead`: the runway. `HomeLooks`: Shop by ceremony. `FeaturedRail`: Featured.
  `CategoryRing`: home categories.
- `ProductCard` / `CardMedia`: cards, hold/hover preview, Add to Bag. `ProductGallery`: photos.
- `OrderPanel`, `SizeGuide`, `NotifyBack`, `CompleteTheLook`, `PhotoActions`, `ProductRail`.
- `BagView`, `CheckoutView`, `SignIn`, `AddressForm`, `OrderView`, `InvoiceView`, `AccountView`.
- Reviews: `ReviewView`, `ProductReviews`, `Stars`.
- `SiteChrome` (header, footer), `HeaderClient` (menus, phone menu), `ShopIcons` (search, photo
  search), `SearchBar`, `ScrollToTop`, `IntroSplash`.
- Styles: `design.css` (original design), `globals.css`, `refine.css`, `shop.css` (checkout,
  orders, account), `home.css` (home page), `screens.css` (bag, checkout, phone menu and header,
  listing head), `src/app/mahib/mahib.css` (runway).
- Artwork in `public/images`: `mall-line.svg` (showroom drawing), `marble.svg`, `drape.svg`,
  `intro.webm` / `intro.mp4`.

### 5.8 Testing notes
- Sign-in codes in test mode: the code is shown in the ERP under Commerce → Orders → Customers &
  Loyalty.
- Online payment answers "not available" until the Razorpay keys are set.
- In Claude's built-in browser pane, streamed parts of a page may not appear while the pane is in
  the background. Real browsers are not affected; check on a phone.

### 5.9 Photo guide for staff
- **Outfit photo:** the complete outfit on a mannequin with a head form, full length from the top
  of the safa to the shoes, cut out on a transparent background. A normal photo also works; it then
  fills the arch.
- **Piece photos:** each item alone on a plain background, 4:5. Photo 1 the whole piece (front);
  photo 2 a close-up of embroidery or the back (shown on hold/hover); shoes at a 3/4 angle with
  space around them; safa on a head form.
- **Same light, same angle, every time** (Airbnb re-shot listings and doubled bookings): one
  setup in the showroom, light from the front, camera at chest height, so the catalogue looks like
  one collection. Photo 1 decides the click (Netflix picks the thumbnail people click most): the
  clearest, most complete view, never a detail.
- **Video (optional):** one 5–8 second clip per product, played on hold/hover.
- **Intro video:** 720×1280, no sound; send it in and it is compressed to about 1–2 MB.

### 5.10 Original design
`reference/` has the original static design (`index.html`, `app.js`, `styles.css`);
`src/app/design.css` is that stylesheet.

---

## 6. What the ERP should add next

For the ERP project (`mbm_inv_v2`). The website side of each is ready to build as soon as the ERP
sends the data; until then the website shows nothing for it. Please add each as **new keys** on
the existing storefront functions (same names and arguments).

1. **MRP and % off:** `mrp_paise` on cards and the product page (null when none). **The website
   side is built (26 Nov 2026):** when `mrp_paise` is above a single selling price, cards and the
   product page show the price in red, the MRP crossed out and "x% off"; otherwise nothing. **Rule
   (owner agreed): the MRP is the real price printed on the tag, entered by staff.** AI may suggest
   it, but a person confirms it; an invented or inflated "was" price is an unfair trade practice
   under the Consumer Protection Act and against the Legal Metrology rules.
2. **Colour variants:** `storefront_product` gets `variants: [{ slug, colour, thumbnail, sold_out }]`.
   Website: "Colour: Tan" with photo swatches.
3. **Size chart per category (or product):** `size_chart: { unit, columns, rows, note }` on
   `storefront_product`. Website: the Size guide shows it instead of the general guide.
4. **Fit details:** `fit: { model_height, model_size, fit, fabric, care }`. Website: a "Size & fit"
   line and a row in Details.
5. **Delivery date by PIN code (Shiprocket):** `storefront_delivery_check(p_pincode, p_slug?)` →
   `{ deliverable, cod, estimate_from, estimate_to }`. Website: "Deliver to 500002 · by Thu" on the
   product page and bag.
6. **Review tags:** `storefront_reviews` gets `breakdown: {5: n, …}` and `aspects: [{ name, average }]`.
   Website: star bars and aspect chips.
7. **Questions and answers** (later): shoppers ask, staff answer in the ERP, answers show publicly.
8. **Stock signal:** optional product-level `low_stock`, so cards can say "Only 2 left".
9. **Damage claims:** a place in the ERP to attach the shopper's unboxing video to the order.
10. **Occasion on looks:** fill in `occasion` for each look, so the runway shows "01 / Wedding".
11. **Filters:** size and colour data per product, for size and colour filters on listings.
12. **Product photos load slowly (18 Nov 2026):** photos in storage are 320–550 KB each and are
   served with `Cache-Control: private, no-cache`, so browsers download them again on every visit
   (0.8–3 s each on a phone). On upload, the ERP should (a) set `cacheControl` to a year
   (`31536000`; file names are unique, so a photo never changes under the same name) and (b) save
   the large photo at most ~1200 px wide, ~150–250 KB WebP. Existing photos: re-save once with
   the new settings. The website already downloads a product's other photos in the background.
   **Done in the ERP (18 Nov 2026):** every website upload (product, category and look photos,
   videos, review photos) is saved with `max-age=31536000`; the large product photo is now
   1200 × 1500 (look photos 1200 × 1800), about 150–250 KB WebP; card copies stay 600 × 750. All 214
   existing files were re-saved in place with the year cache (same names, so no links change).
   Existing large photos keep their old size until staff upload them again; the test products go
   at the clean start, and the 12 category photos can be re-uploaded from the ERP if needed.

13. **AI product text for Google (19 Nov 2026):** the ERP's AI suggestions (product editor,
   Gemini, `ai-suggest.functions.ts`) end every `seo_description` with "Order on WhatsApp", which
   is out of date now that the website sells online; change it to something like "Shop online or
   visit our Charminar showroom". One live description is cut mid-sentence ("…fitted bottoms,
   available to. Order on WhatsApp." on `/product/sherwani-3`): check the 140–155 character trim.
   After the change, staff re-run AI suggestions (or edit) for the real products after the clean
   start. The website shows `seo_title`/`seo_description` as each product page's Google title and
   description, uses `tags` for site search and product data, and lists every published product
   in `sitemap.xml` automatically.
14. **Fit from buyers (reels review, 25 Nov 2026):** ask "How did it fit? Small / True to size /
   Large" in the review form; `storefront_product` gets `fit_votes: { small, true, large }`.
   Website: "Most buyers say: true to size" next to the sizes.
15. **Free-delivery amount for the bag:** send `free_delivery_from_paise` with the public settings
   (not only in the checkout quote), so the bag can show "₹X away from free delivery" before an
   address is entered. Needs the owner's free-delivery amount first (section 3).
16. **Loyalty: scale and completeness (26 Nov 2026; design: https://claude.ai/artifact/9ffQD6jzoPtJmTpDZuMyKj).**
   Keep the 12 Nov rules. (a) `loyalty_balance()` sums the whole ledger, takes a lock and may
   insert on every read: add `loyalty_accounts` (one row per customer: available, pending,
   lifetime, next expiry) updated in the same transaction by one `loyalty_post()`; unique
   `(kind, source, ref)` for retries; spending as `UPDATE ... WHERE available >= n`. (b) Earn lots
   with `remaining` and `available_at`; FIFO by expiry. (c) Pending period: showroom 2 days,
   online 7 days after delivery. (d) Nightly expiry and 15-minute pending jobs (pg_cron, partial
   indexes); weekly ledger-vs-account check reported to the Owner. (e) Welcome 100 points after
   the first paid bill; one-time code for Counter redemptions above ₹500; Owner's daily summary
   and monthly outstanding-points figure. (f) Send `available`, `pending`, next expiry and the
   earn rate to the website, which will show "You'll earn X points" and expiry dates.
   (g) Returns, one rule for both channels: today a website return gives back points used, but a
   showroom return or exchange refund does not. Recommended: give back points used in proportion
   to what is returned (full return: all of them), keeping their original expiry; take back points
   earned on the returned part, as now. Write the rule on the shopper's rules page.
Done: home featured for both sections (staff pick any piece; the website shows exactly those).

---

## 7. Ideas for later

**Principles** (from Amazon, Myntra, Flipkart, Blinkit, Zepto): browse freely, sign in only to
pay; the phone number is the identity, the same customer as at the showroom; fewest steps to pay;
answer size and fit doubts before they become questions; thumb-reachable actions on phones;
instant feedback; give before you ask; raise order value with outfits; bring people back with the
wishlist, recently viewed, WhatsApp updates (with consent) and loyalty.

**From @levilayernn's research reels (all 33 reviewed 25 Nov 2026; Baymard, Nielsen Norman
Group, Spiegel Research Center and company tests).** Kept only what suits a premium menswear shop.
- Already on the site: size buttons, not a dropdown; checkout in named steps with progress; browse
  freely and sign in only to pay (Duolingo: value before the form); visible labels above form
  fields; sold-out pieces stay visible with "More like this" and "Tell me when it's back"; every
  review shown, 4-star ones included (buying peaks at 4.2–4.5 stars); one fixed hero, not a
  rotating banner; shop menu plus search, wishlist and bag visible on phones; delivery and COD
  stated on the product page.
- Built 25 Nov 2026: header and strip hide on scroll down, return on scroll up (Joseph Joseph,
  +15.5% add to bag); "Added to your bag" panel that slides in and stays with Continue shopping
  and View bag (NN/g: never pull shoppers away from shopping; `AddedSheet`, shown by
  `announceAdded()` from product pages, cards, wishlist and the runway; not for Buy now or Shop
  the look); skeleton screens while product, shop, MAHIB category and search pages are built
  (`Skeletons.tsx`, `loading.tsx`).
- Needs the ERP (section 6): fit from buyers next to the sizes (83% of clothing sites give too
  little size information); outcome-first highlights (+13% add to bag; item 13); 4–5 key facts
  first (item 4); MRP only as a real former price (item 1; fake "was" prices are now illegal in
  the EU); "₹X away from free delivery" in the bag once a free-delivery amount is set (more than
  half of shoppers add items to reach it, but only when they can see they are close).
- Second pass (26 Nov 2026; profile has 45 items: 35 reels, 10 photo posts; the 4 reels whose
  result is only in the video were watched): one fixed hero beats a sliding banner (almost all
  clicks on slide 1), so the MAHIB runway's 5-second auto-advance is worth reconsidering; visible
  tabs beat a hidden hamburger menu (built: phone tab bar, 26 Nov 2026); infinite scroll lowered
  Etsy's purchases, so add "Load more" once listings grow; Expedia earned $12M a year by removing
  one optional field (our Area and Landmark stay: couriers need them); a clear headline before
  the slogan (home hero top line is a slogan); real photos beat stock (+41–45%; the home hero
  models look generated; real showroom, team and customer photos are the owner's to supply).
- Search-results slides (@appbrainy) and the "AI tells" video, built 26 Nov 2026: product cards
  lead with the photo, with a round + on it (✓ once in the bag) instead of a big Add to Bag
  button, no category label, a bold price and "★ 4.7 (318)"; listing filters as one scrolling row
  of pills (Sort, Price, In stock, Clear) above the piece count; fewer "AI tells" on the home
  page: plain facts instead of slogans (hero line "Menswear — Tailoring — Hyderabad since 1895",
  side lists of what is sold, no "Style. Tradition. You." in the strip), and section labels kept
  only where they say something ("Since 1895", "A Maqdoom's exclusive", "Shop by ceremony",
  "Our fabrics", "The MAHIB Edit").
- Not used: no "₹" symbol (a restaurant-menu finding; shops need the price clear), decoy price
  plans, grey partner logos, real-estate and app-design reels.

**Ideas:** size finder, outfit builder, scratch-card welcome offer, family matching sets, gift
cards, showroom fitting appointments, analytics with consent, `storefront_products_page` for very
large catalogues (the site pages in the browser today, fine for hundreds of products).
