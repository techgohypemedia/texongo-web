import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/ui/navbar";
import { Footer } from "../components/ui/footer";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { Preloader } from "../components/ui/preloader";
import { SmoothScroll } from "../components/ui/smooth-scroll";
import { Analytics } from "@/components/analytics";
import { SOCIAL_LINKS } from "@/lib/social-links";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Texongo Fabrics",
  url: "https://texongo.com",
  logo: "https://texongo.com/logos/logo.png",
  sameAs: SOCIAL_LINKS.map((s) => s.href),
};

export const metadata: Metadata = {
  title: "Texongo Fabrics",
  description: "Texongo fabric and clothing storefront for modern collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#F9FAFB] text-[#111111] antialiased"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <SmoothScroll />
        <Preloader />
        <Navbar />
        <CartDrawer />
        <div>
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>

    </html>
  );
}
