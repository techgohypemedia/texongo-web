import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/ui/navbar";
import { Footer } from "../components/ui/footer";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { Preloader } from "../components/ui/preloader";
import { SmoothScroll } from "../components/ui/smooth-scroll";
import { Analytics } from "@/components/analytics";

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
