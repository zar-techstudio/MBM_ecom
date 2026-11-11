export const SITE_NAME = "MAQDOOM'S BIG MALL";
/**
 * The public address of the site, used for share previews (WhatsApp, Google), the sitemap and
 * canonical links. Set NEXT_PUBLIC_SITE_URL once a custom domain is live; until then Vercel's own
 * production address is used automatically.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

/** E-commerce photos live in the shared public bucket; grid cards use the small copy. */
export function imageUrl(path: string | null | undefined, size: "large" | "card" = "large") {
  if (!path) return null;
  // Full URLs and site files (sample data in local development) are used as they are.
  if (/^(https?:)?\//.test(path)) return path;
  const target = size === "card" ? path.replace(/(\.[a-z]+)$/, ".card$1") : path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ecommerce-images/${target
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export function formatINR(paise: number | null | undefined) {
  if (paise == null) return "";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  }).format(rupees);
}

export function priceText(p: {
  kind: string;
  price_min_paise: number | null;
  price_max_paise: number | null;
  price_from_paise_per_m: number | null;
}) {
  if (p.kind === "fabric")
    return p.price_from_paise_per_m ? `from ${formatINR(p.price_from_paise_per_m)} / m` : "Price on enquiry";
  if (p.price_min_paise == null) return "";
  return p.price_min_paise === p.price_max_paise || p.price_max_paise == null
    ? formatINR(p.price_min_paise)
    : `${formatINR(p.price_min_paise)} – ${formatINR(p.price_max_paise)}`;
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function sectionPath(section: "main" | "mahib", category?: string) {
  const base = section === "mahib" ? "/mahib" : "/shop";
  return category ? `${base}/${category}` : base;
}

/** The showroom (from the ERP's bill details). Used by the footer, contact page and policies. */
export const STORE = {
  name: "MAQDOOM'S Big Mall",
  legalName: "BIG BOSS CLOTHIERS",
  gstin: "36AIAPM2102M2ZI",
  street: "22-7-176, Moghalpura, Charminar East",
  city: "Hyderabad, Telangana 500002",
  phone: "+91 96104 15415",
  phoneHref: "tel:+919610415415",
  hours: "Open every day, 9 am – 11 pm",
  instagram: [
    { label: "MAQDOOM'S Big Mall on Instagram", handle: "@maqdooms_bigmall", href: "https://www.instagram.com/maqdooms_bigmall/" },
    { label: "MAHIB on Instagram", handle: "@mahib_by_moghnymaqdoom", href: "https://www.instagram.com/mahib_by_moghnymaqdoom/" },
  ],
};
export const STORE_ADDRESS = `${STORE.street}, ${STORE.city}`;
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STORE.name}, ${STORE_ADDRESS}`)}`;
export const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(`${STORE.name}, ${STORE_ADDRESS}`)}&output=embed`;
