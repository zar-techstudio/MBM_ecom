import type { Metadata } from "next";
import { ReviewView } from "@/components/ReviewView";

export const metadata: Metadata = { title: "Review your purchase", robots: { index: false } };

export default async function ReviewPage({ params }: PageProps<"/review/[token]">) {
  const { token } = await params;
  return <ReviewView token={decodeURIComponent(token).slice(0, 80)} />;
}
