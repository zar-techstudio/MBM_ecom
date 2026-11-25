import type { Metadata } from "next";
import { BagView } from "@/components/BagView";
import { getLooks, getProducts, getSettings } from "@/lib/catalogue";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default async function BagPage() {
  const [settings, mahib, main, products] = await Promise.all([getSettings(), getLooks("mahib"), getLooks("main"), getProducts()]);
  // Every in-stock garment; the bag ranks them against what is in it (src/lib/recommend.ts).
  const suggest = products.filter((p) => !p.sold_out && p.kind === "garment");
  // "Continue shopping" goes to the section that has products.
  const browseHref = products.some((p) => p.category.section === "main") ? "/shop" : "/mahib";
  return (
    <BagView
      whatsappNumber={settings.whatsapp_number}
      siteUrl={SITE_URL}
      looks={[...mahib, ...main]}
      suggest={suggest}
      browseHref={browseHref}
    />
  );
}
