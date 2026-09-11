"use server";

import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { generateProductMetadata } from "@/lib/product-intelligence/metadata-generator";
import type { ProductMetadataSuggestion } from "@/lib/product-intelligence/types";

/**
 * "Régénérer" — recomputes metadata suggestions from the product's
 * CURRENT saved fields (brand, reference, category, shape, color,
 * target, price/promotion, description). Purely local templating, no
 * external call. Never writes anything — the admin form fields are what
 * actually get saved, and only when the person submits the form.
 */
export async function regenerateProductMetadataAction(productId: string): Promise<ProductMetadataSuggestion | null> {
  await requirePermission("seo.manage");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { brand: true, category: true, images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return null;

  return generateProductMetadata({
    id: product.id,
    name: product.name,
    slug: product.slug,
    reference: product.reference,
    description: product.description,
    price: Number(product.price),
    oldPrice: product.oldPrice == null ? null : Number(product.oldPrice),
    isPromotion: product.isPromotion,
    isNew: product.isNew,
    color: product.color,
    shape: product.shape,
    brandName: product.brand?.name ?? "",
    categoryName: product.category?.name ?? "",
    target: product.target,
    images: product.images.map((i) => ({ id: i.id, url: i.url })),
    mainImageHash: product.images[0]?.phash ?? null,
  });
}
