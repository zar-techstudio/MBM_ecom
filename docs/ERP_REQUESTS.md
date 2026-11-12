# What the website needs from the ERP next

Written 12 Nov 2026 by the website project (`MBM_03`) for the ERP project (`mbm_inv_v2`), after
studying Flipkart, Amazon and Myntra product and listing pages. The website side of each item is
ready to be built as soon as the ERP sends the data; until then the website shows nothing for it.
Please add each as **new keys** on the existing storefront functions (same names and arguments).

## 1. Original price and discount (MRP)
- Staff can enter an MRP above the selling price. Product card and product page get
  `mrp_paise` (null when there is none).
- Website: shows ~~₹3,999~~ **₹2,999** and "25% off" on cards and the product page.

## 2. Colour variants
- Link products that are the same design in different colours (a variant group), each with a
  colour name. `storefront_product` gets `variants: [{ slug, colour, thumbnail, sold_out }]`.
- Website: "Colour: Tan" with photo swatches on the product page, switching between them.

## 3. Size chart per category (or per product)
- A size chart table staff fill in per category, optionally overridden per product:
  `size_chart: { unit: "in" | "cm", columns: [...], rows: [[...]], note }` on `storefront_product`.
- Website: the "Size guide" button shows this chart instead of the general guide it shows today.

## 4. Fit details
- Optional fields per product: model's height, size the model wears, fit (slim / regular / relaxed),
  fabric, care. `storefront_product` gets `fit: { model_height, model_size, fit, fabric, care }`.
- Website: a "Size & fit" line under the size buttons and a row in Details.

## 5. Delivery date by PIN code (with Shiprocket)
- `storefront_delivery_check(p_pincode, p_slug?)` → `{ deliverable, cod, estimate_from, estimate_to }`.
- Website: "Deliver to 500002 · by Thu, 20 Nov" on the product page and in the bag; "Not
  deliverable to this PIN code" before checkout instead of at the end.

## 6. Review tags
- Optional aspect ratings in reviews (Fabric quality, Fit, Colour, Comfort, Finish), and a
  breakdown of stars: `storefront_reviews` gets `breakdown: {5: n, 4: n, …}` and
  `aspects: [{ name, average }]`.
- Website: star bars and aspect chips above the reviews (like Flipkart).

## 7. Questions and answers (later)
- Shoppers ask a question on a product; staff answer in the ERP; answers show publicly.

## 8. Stock signals
- `left` already exists per size. Optional: a product-level `low_stock` flag or threshold so cards
  can say "Only 2 left".

## 9. Damage claims (returns)
- The website now tells shoppers to send an unboxing video within 48 hours for damaged or wrong
  items. The ERP may want a place to attach that video to the order when staff record the claim.

## 10. Home featured for MBM and MAHIB
- Staff should be able to tick "Show on home page" on **any** product, from the main shop (MBM)
  or from MAHIB, and set its order on the home page.
- `storefront_home_featured()` should return **every** ticked product (any section, in staff
  order, sold-out ones left out), not one per category. Same card shape as `storefront_products`.
- Checked on 12 Nov 2026: it returns an empty list, and none of the 6 live products (all MAHIB)
  is ticked. The website shows exactly what this function returns; while it is empty, the
  newest pieces stand in so the row is never blank.
