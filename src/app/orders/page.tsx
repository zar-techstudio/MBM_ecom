import { redirect } from "next/navigation";

/** /orders (linked from WhatsApp messages): the order list lives on the account page. */
export default function OrdersPage() {
  redirect("/account#orders");
}
