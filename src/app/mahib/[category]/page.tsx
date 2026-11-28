import type { Metadata } from "next";
import { CatalogueListing } from "@/components/CatalogueListing";
import { MahibLead } from "@/components/MahibLead";
import { getCategories } from "@/lib/catalogue";

export async function generateMetadata({ params }: PageProps<"/mahib/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = (await getCategories("mahib")).find((x) => x.slug === category);
  if (!c) return {};
  return {
    title: `${c.name} in Hyderabad${" · MAHIB"}`,
    description: `${c.description ? `${c.description.replace(/\.?$/, ".")} ` : ""}Shop ${c.name.toLowerCase()} at MAQDOOM'S Big Mall near Charminar, Hyderabad, since 1895: in our showroom today, delivered across India.`,
    alternates: { canonical: `/mahib/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/mahib/[category]">) {
  const { category } = await params;
  return <CatalogueListing section="mahib" category={category} lead={<MahibLead />} />;
}
