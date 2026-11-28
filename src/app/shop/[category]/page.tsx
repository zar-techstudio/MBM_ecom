import type { Metadata } from "next";
import { CatalogueListing } from "@/components/CatalogueListing";
import { getCategories } from "@/lib/catalogue";

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = (await getCategories("main")).find((x) => x.slug === category);
  if (!c) return {};
  return {
    title: `${c.name} in Hyderabad${""}`,
    description: `${c.description ? `${c.description.replace(/\.?$/, ".")} ` : ""}Shop ${c.name.toLowerCase()} at MAQDOOM'S Big Mall near Charminar, Hyderabad, since 1895: in our showroom today, delivered across India.`,
    alternates: { canonical: `/shop/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/shop/[category]">) {
  const { category } = await params;
  return <CatalogueListing section="main" category={category} />;
}
