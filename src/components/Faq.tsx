import { STORE, STORE_ADDRESS } from "@/lib/site";

/* Questions shoppers ask, answered with facts from the site's own pages (policies, contact, home).
 * Shown on the home and contact pages, with FAQPage data so Google and AI search can quote it.
 * Keep every answer true; change it here if a policy changes. */
const FAQ: { q: string; a: string }[] = [
  {
    q: "Where is MAQDOOM'S Big Mall?",
    a: `Our showroom is at ${STORE_ADDRESS}, near Charminar in Hyderabad's Old City. ${STORE.hours}.`,
  },
  {
    q: "How long has MAQDOOM'S been dressing grooms?",
    a: "Since 1895, when the Maqdoom family opened its doors in Hyderabad. For over 130 years we have dressed the city's grooms for Nikah, reception and walima.",
  },
  {
    q: "Do you tailor sherwanis the same day?",
    a: "Yes. We measure you in the showroom and tailor to your fit the same day, usually in about 4 hours. Bring your own fabric or choose from our thaans.",
  },
  {
    q: "What is MAHIB?",
    a: "MAHIB is our in-house label: hand-embroidered sherwanis, safas, mojris and jewellery, styled as complete groom looks you can buy whole or piece by piece.",
  },
  {
    q: "Do you deliver outside Hyderabad and outside India?",
    a: "Yes. We deliver across India and abroad. Pay online or with cash on delivery; international orders may have customs duties in the destination country.",
  },
  {
    q: "Can I see a piece before ordering online?",
    a: `Yes. Ask for a video call on WhatsApp (${STORE.phone}) and we will show you the fabric, embroidery and fit from the showroom.`,
  },
  {
    q: "Can I exchange or return?",
    a: "Showroom purchases of ready-made pieces can be exchanged within 2 days, unused and with tags. Online orders are not exchanged, but if a piece arrives damaged or wrong, tell us within 48 hours with an unboxing video and we replace it or refund you in full.",
  },
];

export function Faq({ tone = "light" }: { tone?: "light" | "plain" }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section className={`faq faq-${tone}`} aria-labelledby="faq-title">
      <div className="container faq-inner">
        <h2 id="faq-title" className="faq-title">
          Questions, answered
        </h2>
        <div className="faq-list">
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                <span>{f.q}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        // "<" is escaped so the text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
