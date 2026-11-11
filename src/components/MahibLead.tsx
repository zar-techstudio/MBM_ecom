import "@/app/mahib/mahib.css";
import { getLooks } from "@/lib/catalogue";
import { MahibRunway } from "./MahibRunway";

/** The MAHIB outfit runway, shown at the top of /mahib and of every MAHIB category page
 * (a category filter only changes the products below it). Nothing when no outfit is published. */
export async function MahibLead() {
  const looks = await getLooks("mahib");
  if (!looks.length) return null;
  return <MahibRunway looks={looks} />;
}
