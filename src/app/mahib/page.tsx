import type { Metadata } from "next";
import { CatalogueListing, SECTION_COPY } from "@/components/CatalogueListing";
import { MahibRunway } from "@/components/MahibRunway";
import { getLooks, getSettings } from "@/lib/catalogue";
import { SITE_URL } from "@/lib/site";
import "./mahib.css";

export const metadata: Metadata = {
  title: "MAHIB — The Exclusive Edit",
  description: SECTION_COPY.mahib.intro,
  alternates: { canonical: "/mahib" },
};

export default async function MahibPage() {
  const [settings, looks] = await Promise.all([getSettings(), getLooks("mahib")]);
  return (
    <CatalogueListing
      section="mahib"
      feature={looks.length ? <MahibRunway looks={looks} whatsappNumber={settings.whatsapp_number} pageUrl={`${SITE_URL}/mahib`} /> : null}
    />
  );
}
