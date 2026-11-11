import type { Metadata } from "next";
import { getSettings } from "@/lib/catalogue";
import { MAPS_EMBED, MAPS_URL, SITE_NAME, STORE, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & store location",
  description: `Visit ${STORE.name} near Charminar, Hyderabad, or reach us on WhatsApp or phone.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <main className="sf-doc">
      <div className="container sf-doc-inner">
        <div className="section-label">We&rsquo;re here to help</div>
        <h1 className="sf-doc-title">Contact &amp; store location</h1>
        <div className="sf-contact-grid">
          <div className="sf-contact-card">
            <h2>Visit the showroom</h2>
            <address>
              {STORE.name}
              <br />
              {STORE.street}
              <br />
              {STORE.city}
            </address>
            <p>{STORE.hours}</p>
            <a className="btn-primary" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <span>Get directions</span>
              <span className="btn-arrow">&rarr;</span>
            </a>
          </div>
          <div className="sf-contact-card">
            <h2>Talk to us</h2>
            <p>
              Orders, sizes, custom tailoring and appointments: message us on WhatsApp or call. We reply during showroom
              hours, 9 am to 11 pm.
            </p>
            <p>
              <a href={whatsappLink(settings.whatsapp_number, `Hello ${SITE_NAME}, I have a question.`)} target="_blank" rel="noopener noreferrer">
                WhatsApp us
              </a>
              <br />
              <a href={STORE.phoneHref}>{STORE.phone}</a>
            </p>
          </div>
        </div>
        <iframe
          className="sf-map"
          title={`Map: ${STORE.name}`}
          src={MAPS_EMBED}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <p className="sf-doc-small">
          {STORE.instagram.map((i) => (
            <a key={i.href} href={i.href} target="_blank" rel="noopener noreferrer" className="sf-insta">
              {i.handle}
            </a>
          ))}
        </p>
        <p className="sf-doc-small">
          {STORE.legalName} &middot; GSTIN {STORE.gstin}
        </p>
      </div>
    </main>
  );
}
