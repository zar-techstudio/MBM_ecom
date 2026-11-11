# MAQDOOM'S Big Mall: full e-commerce roadmap

Written 11 Nov 2026. Goal: a complete shop where only the payment gateway and courier API
keys are left to plug in. Every item is marked **[Website]** (this repo, `MBM_03`) or
**[ERP]** (`mbm_inv_v2`, which owns the database). The website never holds a secret key
(see `STOREFRONT_RULES.md`), so anything that writes data goes through an ERP function.

---

## 1. Principles (from Amazon, Myntra, Flipkart, Blinkit, Zepto and the reels we studied)

1. **Browse freely, sign in only to pay.** No login wall, no popup on arrival. Wishlist and cart
   work as a guest (saved on the device) and move into the account after OTP.
2. **Phone number is the identity.** One field, then an OTP. The system decides by itself whether
   the number is new (ask name + address next) or known (go straight to address/payment). Same
   customer record as the showroom, so loyalty points work in both places.
3. **Fewest steps to pay.** Cart → phone + OTP → address (prefilled when known) → pay. One page
   per step on phones, a progress line on top, the order total always visible, editable cart.
4. **Answer doubts before they become questions** (reel: "3 doubts"): size & fit (model height,
   size worn, size finder), real photos and video, trust signals beside the buy button
   (delivery date for your pincode, easy exchange, GST invoice, secure payment).
5. **Bottom-reachable actions on phones**: sticky Add to bag / Buy now bar, filter & sort as
   bottom sheets, big tap targets, swipe galleries (done).
6. **Instant feedback**: add-to-bag animates into the bag icon with a count; toasts, not alerts.
7. **Give before you ask** (reel: scratch card): offers are revealed first, then the phone number
   is asked to claim them. Never a blocking popup on the first visit.
8. **Raise order value with outfits** (reels: "complete the look", "box of 5"): look bundles,
   "goes well with", a bundle discount that grows with each extra piece.
9. **Bring people back**: wishlist, recently viewed, back-in-stock and abandoned-cart messages
   on WhatsApp (only with consent), loyalty points on every bill.

---

## 2. Done (website)

- Outfit runway (MAHIB): fixed arches, cut-out outfits on top, dots per piece, combined price,
  side panel, auto-advance; shown on MAHIB category pages too.
- Hold/hover preview on cards (2nd photo or video), one-time "Hold to preview" tip.
- Product photos: swipe, hold-to-zoom (phone), hover zoom (desktop), full-screen pinch/double-tap.
- Products load 12 at a time as you scroll.
- Footer with fixed sections, gold logo, address, map link, phone, GSTIN; Contact page with map;
  Shipping, Exchanges & returns, Privacy, Terms pages (**draft wording: owner must review**).
- Images: the ERP already converts every upload to WebP (1600×2000 large, 600×750 card), which
  keeps pages fast and storage small. Videos are stored as short MP4s.

---

## 3. Phases

### Phase A: shopping without an account (no ERP change needed) [Website]
- Wishlist (heart on cards and product page) and bag, saved on the device.
- Bag drawer + bag page: change size/quantity, remove, move to wishlist, price summary.
- "Buy the look" adds every piece of an outfit to the bag (choose sizes in the drawer).
- Header: search with suggestions, wishlist and bag icons with counts.
- Listing: sort (new, price low/high) and filters (category, price, size, colour) as a bottom
  sheet on phones; result count.
- Product page: size & fit block (model height, size worn), size guide, trust row by the button,
  "Complete the look" / "Goes well with", "Recently viewed", share button.
- Until checkout exists, the bag's button sends the whole bag on WhatsApp.

### Phase B: accounts, checkout, orders [ERP first, then Website]
**[ERP]**
- `customers` keyed by phone, shared with the showroom (walk-in bills attach to the same record).
- OTP sign-in: Supabase Auth phone OTP with an SMS hook (MSG91) or WhatsApp OTP; rate limits.
- Addresses, orders, order items, payments, shipments, invoices (GST), coupons.
- Public functions (security definer, validated server-side; names are a proposal):
  - `storefront_me()` → profile, addresses, loyalty balance
  - `storefront_upsert_profile(name, email)`, `storefront_save_address(...)`
  - `storefront_sync_bag(items)` / `storefront_sync_wishlist(items)` (merge device lists on sign-in)
  - `storefront_quote(items, pincode, coupon, use_points)` → prices, discounts, shipping, total
  - `storefront_place_order(quote_id, address_id, payment_method)` → order + payment intent
  - `storefront_my_orders()`, `storefront_order(id)` (status + tracking)
- Stock is reserved when payment starts and released if it fails or times out.
- Also: `storefront_products` with `p_limit` / `p_offset` (the website currently pages in the
  browser, fine for hundreds of products, not thousands).

**[Website]**
- Checkout pages: phone → OTP → (new: name) → address with pincode check → review → pay → done.
- Account: orders and tracking, addresses, wishlist, loyalty points, sign out.
- Payment: Razorpay checkout (UPI, cards, net banking) + a route for its webhook.
- Courier: delivery-date estimate by pincode; tracking page (Shiprocket or Delhivery API).

### Phase C: loyalty, ratings, WhatsApp automation [ERP + Website]
- **Loyalty [ERP]**: points ledger by phone; earn on showroom and online bills; redeem at the
  counter and at checkout; tiers optional. **[Website]**: balance in account, "use points" at checkout.
- **Ratings [ERP + Website]**: after delivery (online) or after the bill (walk-in), a WhatsApp
  message with a one-time link `/review/<token>` → stars, text, optional photo. Only verified
  buyers. Reviews show on product pages with a "verified purchase" mark; walk-in customers also
  get a Google review link.
- **WhatsApp automation [ERP]** through a WhatsApp Business API provider (Interakt, WATI, AiSensy
  or Gupshup), using approved templates: order confirmed, dispatched with tracking, delivered +
  review request, points earned (showroom too), back in stock, abandoned bag (consent only).

### Phase D: growth (later)
Size finder, outfit builder (`/mahib/build`), scratch-card welcome offer, family/groomsmen
matching sets, gift cards, showroom fitting appointments, international shipping rates,
analytics (GA4 / Meta pixel with consent).

---

## 4. Decisions needed from the owner
1. Cash on delivery: yes / no / only below an amount?
2. Shipping charge and free-shipping threshold; international shipping on or off.
3. Online exchange window and rules (the draft says 2 days, same as the showroom).
4. Loyalty: points per ₹100, value of a point, expiry, tiers.
5. OTP by SMS or by WhatsApp (compare the per-message prices of the providers).
6. Payment gateway (Razorpay suggested) and courier (Shiprocket suggested) accounts.
7. A named grievance officer for the policy pages (required for Indian e-commerce sites).
8. Instagram handles for Maqdoom's and MAHIB (footer social links).
9. Showroom opening hours (contact page and Google Business profile).

## 5. Easy to forget
- Pincode serviceability and delivery-date promise on the product page.
- GST invoice PDF for online orders; HSN codes per product (ERP).
- Out-of-stock states everywhere (card, look panel, bag at checkout time).
- Order cancellation before dispatch; refunds for failed deliveries.
- Email/WhatsApp opt-in and opt-out records.
- A 404 for removed products that suggests similar ones.
- Google Business profile, Search Console, structured data (product JSON-LD exists).
- Uptime and error alerts for the website (the ERP already has Sentry/UptimeRobot).
- Backups and a staging copy of the shop to test payments safely.
