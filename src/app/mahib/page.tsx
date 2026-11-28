import type { Metadata } from "next";
import { CatalogueListing } from "@/components/CatalogueListing";
import { MahibLead } from "@/components/MahibLead";

export const metadata: Metadata = {
  title: "MAHIB — Groom Wear & Complete Wedding Looks, Hyderabad",
  description:
    "MAHIB, MAQDOOM'S in-house label: hand-embroidered sherwanis, safas, mojris and jewellery styled as complete groom looks for Nikah, reception and walima. Hyderabad, near Charminar.",
  alternates: { canonical: "/mahib" },
};

export default function MahibPage() {
  return <CatalogueListing section="mahib" lead={<MahibLead />} />;
}
