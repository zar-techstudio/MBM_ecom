import type { Metadata } from "next";
import { BagView } from "@/components/BagView";
import { getLooks, getSettings } from "@/lib/catalogue";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default async function BagPage() {
  const [settings, mahib, main] = await Promise.all([getSettings(), getLooks("mahib"), getLooks("main")]);
  return <BagView whatsappNumber={settings.whatsapp_number} siteUrl={SITE_URL} looks={[...mahib, ...main]} />;
}
