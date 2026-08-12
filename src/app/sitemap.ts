import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infrared-optic-store.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/catalogue",
    "/marques",
    "/promotions",
    "/nouveautes",
    "/boutique",
    "/contact",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));

  const products = await prisma.product.findMany({
    where: { archived: false, published: true },
    select: { slug: true, updatedAt: true },
  }).catch(() => []);

  const productRoutes = products.map((p) => ({
    url: `${BASE_URL}/produit/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...productRoutes];
}
