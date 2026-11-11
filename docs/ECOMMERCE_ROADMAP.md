# MAQDOOM'S Big Mall: e-commerce roadmap (website)

Updated 12 Nov 2026. Goal: a complete shop where only the payment gateway and courier keys are
left to plug in. This file tracks the **website** (`MBM_03`). Items that need the ERP
(`mbm_inv_v2`, which owns the database) are marked **[ERP]**; the ERP keeps its own records.
How the site is built: `STOREFRONT_RULES.md`. The ERP's API: `mbm_inv_v2/docs/STOREFRONT_API.md`.

---

## 1. Principles (from Amazon, Myntra, Flipkart, Blinkit, Zepto and the reels we studied)

1. **Browse freely, sign in only to pay.** No login wall, no popup on arrival.
2. **Phone number is the identity**, the same customer as at the showroom, so loyalty works in both.
3. **Fewest steps to pay:** bag → mobile + code → address → pay.
4. **Answer doubts before they become questions:** size and fit, real photos and video, trust
   signals beside the buy button.
5. **Thumb-reachable actions on phones:** sticky order bar, swipe galleries, big tap targets.
6. **Instant feedback:** counts on the bag and wishlist icons; no blocking alerts.
7. **Give before you ask** (scratch-card offer before asking for a number).
8. **Raise order value with outfits:** complete looks, "Complete the look", bundles.
9. **Bring people back:** wishlist, recently viewed, WhatsApp updates (with consent), loyalty.

---

## 2. Status

### Done and live

**Look and browsing**
- Home: hero outfits change by themselves (no counter); gold wordmark header; minimal footer
  (address with map pin, phone, hours, Instagram for Maqdoom's and MAHIB, Shop / Help / About).
- MAHIB outfit runway on `/mahib` and every MAHIB category page: fixed courtyard arches, cut-out
  outfits slide over them, pulsing dots per piece with a product card, combined price, Buy the look,
  View the look (side panel), 5-second auto-advance that pauses while browsing.
- Product cards: catalogue style, hairline grid, wishlist heart, hold/hover shows the 2nd photo or
  video, one-time "Hold to preview" tip. Grids show 12 and load more on scroll; sort by price,
  price ranges, in stock only.
- Product page: swipe photos, hold-to-zoom (phone), hover zoom (desktop), full-screen pinch and
  double-tap; size, Add to bag, Buy now, wishlist; trust row (cash on delivery, delivery across
  India and abroad, online orders not exchanged); Complete the look; Recently viewed.
- Search with instant suggestions and a results page.
- Contact page with map; Shipping, Exchanges & returns, Privacy, Terms (grievance officer
  Moghny Maqdoom). **Wording is a draft: the owner should read it once.**

**Shopping (Phase A)**
- Wishlist and bag on the device, without an account; Buy the look adds every piece.
- Bag: live prices and stock, size choice (single sizes picked automatically), quantity, save for
  later, remove; Checkout button; WhatsApp ordering kept as a link.

**Accounts and checkout (Phase B, website side)**
- Sign in with a mobile number and a one-time code (name asked once for new numbers).
- Bag and wishlist merge into the account on sign-in and stay in sync.
- Checkout: saved or new address (state decides GST), quote from the ERP (lines, problems,
  coupon, discount, delivery, GST included, total), online or cash on delivery.
- Order page: status in plain words, progress, tracking, items, totals, history; Pay now while
  awaiting payment; Cancel before packing. Account page: orders, profile, addresses, points.

### Waiting on settings or keys (no website work needed)
- **Cash on delivery is switched off** in the ERP's checkout settings: turn it on (optionally with
  a limit). Until then checkout shows "Not available for this order".
- **Delivery charge is ₹0** and no free-delivery amount is set: the owner decides both.
- **Sign-in codes are in test mode** [ERP]: switch on WhatsApp/SMS sending.
- **Razorpay keys** [ERP]: until set, online payment says it isn't available yet.
- **Courier (Shiprocket)** [ERP]: tracking numbers then appear on the order page by themselves.

### Not done yet (website)
- Size and fit block (model height, size worn) and a size guide: needs these fields from the [ERP].
- Delivery-date estimate by PIN code: needs the courier API [ERP].
- Loyalty points: the account shows points once the ERP sends them; "use points" at checkout to
  be added when loyalty (C1) is live [ERP first].
- Reviews: `/review/<token>` page and stars on product pages, once reviews (C2) exist [ERP first].
- Use `storefront_products_page` for very large catalogues (the site pages in the browser today,
  fine for hundreds of products).
- Share button on product pages; filters by size and colour (need size/colour data).
- Phase D ideas: size finder, outfit builder, scratch-card welcome offer, family matching sets,
  gift cards, showroom fitting appointments, analytics with consent.

---

## 3. Owner decisions

| Question | Decision |
|---|---|
| Cash on delivery | **Yes** (turn it on in the ERP's checkout settings) |
| Free delivery amount | To be confirmed with the owner |
| Online exchanges | **None** (damaged or wrong items replaced or refunded); showroom: 2 days |
| Loyalty | **Both showroom and online**, linked by mobile number |
| Sign-in codes | **WhatsApp and SMS** both |
| Payment and courier | Razorpay and courier keys added last, before launch |
| Grievance officer | **Moghny Maqdoom**, +91 96104 15415 (call or WhatsApp) |
| Instagram | @maqdooms_bigmall and @mahib_by_moghnymaqdoom |
| Showroom hours | Every day, 9 am – 11 pm |

Still open: loyalty rates (points per ₹100, value, expiry), international delivery charges.

## 4. Easy to forget before launch
- Read and approve the policy pages.
- Place and cancel one cash-on-delivery test order, then one small online payment.
- GST invoice for online orders and HSN codes per product [ERP].
- Google Business profile and Search Console (product structured data is already on product pages).
- Uptime and error alerts for the website (the ERP already has them).
