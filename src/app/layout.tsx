import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ScrollToTop } from "@/components/ScrollToTop";
import { IntroSplash } from "@/components/IntroSplash";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./design.css";
import "./globals.css";
import "./refine.css";
import "./shop.css";
import "./home.css";
import "./screens.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-cinzel" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-jakarta" });

const DESCRIPTION =
  "Premium Indian menswear, fine fabrics and bespoke tailoring from MAQDOOM'S Big Mall. Sherwanis, kurtas, waistcoats and the MAHIB exclusive edit.";

/** Pages are built on each visit (the catalogue is kept in memory for a minute, see src/lib/catalogue.ts),
 * so new and sold-out products show without a rebuild. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Premium Indian Menswear`, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", description: DESCRIPTION },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior: page changes jump straight to the top instead of smooth-scrolling there
    <html lang="en" data-scroll-behavior="smooth" className={`${cinzel.variable} ${cormorant.variable} ${jakarta.variable}`}>
      <body>
        <a href="#content" className="sr-only">
          Skip to content
        </a>
        <SiteHeader />
        <div id="content">{children}</div>
        <SiteFooter />
        <IntroSplash />
        <ScrollToTop />
      </body>
    </html>
  );
}
