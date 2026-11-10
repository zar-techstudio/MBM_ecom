import type { Metadata } from "next";
import { CatalogueListing, SECTION_COPY } from "@/components/CatalogueListing";
import { MahibRunway } from "@/components/MahibRunway";
import { getSettings } from "@/lib/catalogue";
import { MAHIB_LOOKS } from "@/lib/looks";
import { SITE_URL } from "@/lib/site";
import "./mahib.css";

export const metadata: Metadata = {
  title: "MAHIB — The Exclusive Edit",
  description: SECTION_COPY.mahib.intro,
  alternates: { canonical: "/mahib" },
};

export default async function MahibPage() {
  const settings = await getSettings();
  return (
    <CatalogueListing
      section="mahib"
      feature={<MahibRunway looks={MAHIB_LOOKS} whatsappNumber={settings.whatsapp_number} pageUrl={`${SITE_URL}/mahib`} />}
    />
  );
}
