import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STORE, STORE_ADDRESS } from "@/lib/site";

/**
 * Store policies. DRAFT wording written from the showroom's bill terms (exchange within 2 days,
 * no refund) — the owner should review it before card payments go live.
 */
const UPDATED = "11 November 2026";
const CONTACT = `${STORE.phone} (call or WhatsApp), ${STORE.name}, ${STORE_ADDRESS}`;

type Policy = { title: string; intro: string; sections: { h: string; p: string[] }[] };

const POLICIES: Record<string, Policy> = {
  shipping: {
    title: "Shipping & delivery",
    intro: "We deliver across India and abroad. Pay online or with cash on delivery.",
    sections: [
      {
        h: "Confirming your order",
        p: [
          "After you place an order we confirm availability, your size or fit, the delivery charge and the expected delivery date with you before payment.",
          "Custom-tailored pieces are made to your measurements; we share the making time when you order.",
        ],
      },
      {
        h: "Delivery",
        p: [
          "We tell you the dispatch date when we confirm your order. Delivery time depends on the destination and the courier.",
          "You receive the courier name and tracking number on WhatsApp once your order is dispatched.",
          "International orders may attract customs duties and taxes in the destination country; these are paid by the receiver.",
        ],
      },
      {
        h: "Cash on delivery",
        p: ["Cash on delivery is available. Pay the courier in cash or UPI when your order arrives."],
      },
      {
        h: "Collect from the showroom",
        p: [`You can also collect your order from the showroom at ${STORE_ADDRESS}.`],
      },
    ],
  },
  returns: {
    title: "Exchanges & returns",
    intro: "Please check sizes and details before you order online: online purchases are not exchanged.",
    sections: [
      {
        h: "Online orders",
        p: [
          "Online orders cannot be exchanged or returned. Ask us on WhatsApp about sizes and fit before you order; we are happy to help.",
          "If your order arrives damaged, or is not what you ordered, tell us as soon as you receive it, with photos. We will replace the piece or refund you in full.",
        ],
      },
      {
        h: "Showroom purchases",
        p: [
          "Ready-made pieces bought in the showroom can be exchanged within 2 days, unused, unwashed and with their tags and bill. There are no refunds.",
          "Custom-tailored or altered pieces and fabric cut to length cannot be exchanged.",
        ],
      },
      {
        h: "How to reach us",
        p: [`Message us on WhatsApp or call ${STORE.phone} with your order or bill number.`],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: `This policy explains how ${STORE.name} (${STORE.legalName}) uses the details you share with us.`,
    sections: [
      {
        h: "What we collect",
        p: [
          "Your name, mobile number, delivery address and the orders you place, when you buy from us online or in the showroom.",
          "Basic, anonymous information about how the website is used, so we can keep it fast and working.",
        ],
      },
      {
        h: "How we use it",
        p: [
          "To confirm, deliver and support your orders; to run your loyalty points; and to send order updates and, if you agree, occasional offers on WhatsApp or SMS.",
          "Payments are handled by our payment provider. We never see or store your full card details.",
        ],
      },
      {
        h: "Sharing",
        p: [
          "We share only what is needed with the courier delivering your order and the payment provider processing it. We never sell your details.",
        ],
      },
      {
        h: "Your choices",
        p: [
          "You can ask us to correct or delete your details, or to stop sending offers, at any time by contacting us.",
        ],
      },
      { h: "Grievances", p: [`For any concern about your data or an order, contact: ${CONTACT}.`] },
    ],
  },
  terms: {
    title: "Terms of use",
    intro: `By using this website you agree to these terms. The website is run by ${STORE.legalName} (GSTIN ${STORE.gstin}).`,
    sections: [
      {
        h: "Products and prices",
        p: [
          "Prices are in Indian rupees and include GST. Colours can look slightly different on screens; embroidery and handwork vary a little from piece to piece.",
          "Pieces shown are subject to availability. If something is no longer available after you order, we will tell you before you pay.",
        ],
      },
      {
        h: "Orders",
        p: [
          "An order is accepted once we confirm it and you pay. We may decline an order, for example if a price was shown incorrectly.",
          "Online orders are not exchanged; see our Exchanges & returns policy.",
        ],
      },
      {
        h: "Website content",
        p: ["Photos, designs and text on this website belong to us and may not be copied for commercial use."],
      },
      { h: "Law", p: ["These terms are governed by Indian law; the courts at Hyderabad, Telangana have jurisdiction."] },
      { h: "Contact", p: [CONTACT] },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const p = POLICIES[(await params).slug];
  return p ? { title: p.title, description: p.intro, alternates: { canonical: `/policies/${(await params).slug}` } } : {};
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const p = POLICIES[slug];
  if (!p) notFound();
  return (
    <main className="sf-doc">
      <div className="container sf-doc-inner">
        <nav className="sf-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{p.title}</span>
        </nav>
        <h1 className="sf-doc-title">{p.title}</h1>
        <p className="sf-doc-intro">{p.intro}</p>
        {p.sections.map((s) => (
          <section key={s.h} className="sf-doc-section">
            <h2>{s.h}</h2>
            {s.p.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </section>
        ))}
        <p className="sf-doc-small">Last updated {UPDATED}.</p>
      </div>
    </main>
  );
}
