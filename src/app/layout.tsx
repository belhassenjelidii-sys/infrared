import { headers } from "next/headers";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import SiteFrame from "@/components/SiteFrame";
import { getDbBrands, getDbProducts } from "@/lib/catalogue-db";
import { getDbStores, getSiteSettings } from "@/lib/site-data";
import { prisma } from "@/lib/prisma";
import { seoSettings } from "@/lib/features";
import { getCartCount, getCommerceSettings } from "@/lib/commerce";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } }).catch(() => null);
  const seo = seoSettings(row?.features);
  return {
  metadataBase: new URL(SITE_URL),
  title: {
    default: seo.title,
    template: "%s — InfraRed Optic-Store",
  },
  description: seo.description,
  robots: {
    index: seo.indexing,
    follow: seo.indexing,
    googleBot: {
      index: seo.indexing,
      follow: seo.indexing,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    title: "Opticien en Tunisie | InfraRed Optic-Store",
    description:
      "Lunettes optiques et solaires au Kram, à Tunisia Mall et à El Aouina.",
    url: "/",
    siteName: "InfraRed Optic-Store",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/logo-mark.png", alt: "InfraRed Optic-Store — Opticien en Tunisie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Opticien en Tunisie | InfraRed Optic-Store",
    description: "Lunettes optiques et solaires dans nos trois boutiques du Grand Tunis.",
    images: ["/logo-mark.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
  };
}

// Header/Footer read StoreSettings, Store, Brand and highlighted products —
// force fresh rendering on every request so admin changes (settings,
// boutiques, brands) never depend on remembering the exact right
// revalidatePath calls in every single action.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  if (requestHeaders.get("x-infrared-admin") === "1") return <html lang="fr"><body className="antialiased">{children}</body></html>;
  const settings = await getSiteSettings();
  const [brands, stores, newProducts, promoProducts, commerce, cartCount] = await Promise.all([
    getDbBrands(),
    getDbStores({ fallbackHours: settings.hours }),
    getDbProducts({ isNew: true }, { createdAt: "desc" }, { includePrices: settings.showPrices, take: 4 }),
    settings.showPrices
      ? getDbProducts({ isPromotion: true }, { discount: "desc" }, { includePrices: true, take: 4 })
      : Promise.resolve([]),
    getCommerceSettings(),
    getCartCount(),
  ]);

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className="overflow-x-hidden antialiased">
        <SiteFrame
          showPrices={settings.showPrices}
          header={<Header brands={brands} stores={stores} newProducts={newProducts} promoProducts={promoProducts} showPrices={settings.showPrices} whatsapp={settings.whatsapp} cartEnabled={commerce.cart} cartCount={cartCount} logoUrl={settings.logoUrl} logoHeight={settings.logoHeight} />}
          footer={<Footer />}
          backToTop={<BackToTop />}
        >
          {children}
        </SiteFrame>
      </body>
    </html>
  );
}
