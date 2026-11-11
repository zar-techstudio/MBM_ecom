import "@/app/mahib/mahib.css";
import { getLooks, getSettings } from "@/lib/catalogue";
import { SITE_URL } from "@/lib/site";
import { MahibRunway } from "./MahibRunway";

/** The MAHIB outfit runway, shown at the top of /mahib and of every MAHIB category page
 * (a category filter only changes the products below it). Nothing when no outfit is published. */
export async function MahibLead() {
  const [settings, looks] = await Promise.all([getSettings(), getLooks("mahib")]);
  if (!looks.length) return null;
  return <MahibRunway looks={looks} whatsappNumber={settings.whatsapp_number} pageUrl={`${SITE_URL}/mahib`} />;
}
