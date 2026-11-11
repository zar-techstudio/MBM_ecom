"use client";

/** Opens Razorpay Checkout with what the ERP returned for the order. The ERP learns about the
 * payment from Razorpay directly, so this only reports that the popup closed. */
export type PayInfo = {
  key_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; contact?: string; email?: string };
};

type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

let script: Promise<void> | null = null;
function loadScript() {
  script ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => {
      script = null;
      reject(new Error("Couldn't open the payment window. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return script;
}

export async function openRazorpay(info: PayInfo, onClosed: (paid: boolean) => void) {
  await loadScript();
  if (!window.Razorpay) throw new Error("Couldn't open the payment window. Please try again.");
  new window.Razorpay({
    key: info.key_id,
    order_id: info.razorpay_order_id,
    amount: info.amount,
    currency: info.currency,
    name: info.name,
    description: info.description,
    prefill: info.prefill,
    theme: { color: "#14110E" },
    handler: () => onClosed(true),
    modal: { ondismiss: () => onClosed(false) },
  }).open();
}
