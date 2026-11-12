import type { Metadata } from "next";
import { InvoiceView } from "@/components/InvoiceView";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default async function InvoicePage({ params }: PageProps<"/orders/[code]/invoice">) {
  const { code } = await params;
  return <InvoiceView code={code.toUpperCase().slice(0, 20)} />;
}
