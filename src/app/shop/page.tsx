import type { Metadata } from "next";
import { CatalogueListing } from "@/components/CatalogueListing";

export const metadata: Metadata = {
  title: "Men's Ethnic Wear in Hyderabad",
  description:
    "Sherwanis, kurta sets, indo-westerns, suits, waistcoats and fabrics from our showroom near Charminar, Hyderabad. Every piece is in stock today; delivered across India.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <CatalogueListing section="main" />;
}
