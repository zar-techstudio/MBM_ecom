import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "@/components/OrderView";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/orders/[code]">) {
  const { code } = await params;
  return (
    <Suspense>
      <OrderView code={code.toUpperCase().slice(0, 20)} />
    </Suspense>
  );
}
