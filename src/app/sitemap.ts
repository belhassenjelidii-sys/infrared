import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const staticRoutes = [
    "",
    "/catalogue",
    "/marques",
    ...(settings.showPrices ? ["/promotions"] : []),
    "/nouveautes",
    "/boutique",
    "/contact",
    "/mentions-legales",
    "/confidentialite",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));

  const [products, brands, stores] = await Promise.all([
    prisma.product.findMany({
      where: { archived: false, published: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.brand.findMany({ where: { active: true }, select: { slug: true } }).catch(() => []),
    prisma.store.findMany({ where: { active: true }, select: { slug: true } }).catch(() => []),
  ]);

  const productRoutes = products.map((p) => ({
    url: `${BASE_URL}/produit/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const brandRoutes = brands.map((brand) => ({ url: `${BASE_URL}/marques/${brand.slug}`, lastModified: new Date() }));
  const storeRoutes = stores.map((store) => ({
    url: `${BASE_URL}/boutique/${store.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...storeRoutes, ...brandRoutes, ...productRoutes];
}
