import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { PriceVisibilityProvider } from "@/components/PriceVisibilityProvider";
import { prisma } from "@/lib/prisma";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://infrared-optic-store.netlify.app"),
  title: {
    default: "InfraRed Optic-Store — Opticien premium",
    template: "%s — InfraRed Optic-Store",
  },
  description:
    "InfraRed Optic-Store, opticien premium. Lunettes solaires et optiques, grandes marques, conseil en boutique.",
  openGraph: {
    title: "InfraRed Optic-Store",
    description:
      "Lunettes solaires et optiques, grandes marques, conseil en boutique.",
    siteName: "InfraRed Optic-Store",
    locale: "fr_FR",
    type: "website",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await prisma.storeSettings.findFirst().catch(() => null);
  const showPrices = settings?.showPrices ?? true;

  return (
    <html lang="fr">
      <body className={`${fraunces.variable} ${inter.variable} antialiased overflow-x-hidden`}>
        <PriceVisibilityProvider showPrices={showPrices}>
          <Header />
          <main>{children}</main>
          <Footer />
          <BackToTop />
        </PriceVisibilityProvider>
      </body>
    </html>
  );
}
