"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidateProductViews } from "@/lib/revalidate";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";
import { computeImageFingerprint } from "@/lib/product-intelligence/duplicate-detector";
import { findSimilarExistingImages, distanceToSimilarityPercent } from "@/lib/product-intelligence/similarity-lookup";
import {
  getOptionalText,
  getProductColor,
  getProductShape,
  getRequiredText,
  getTarget,
  LIMITS,
  parseMoney,
  validateStoredAssetUrl,
} from "@/lib/validation";

export type SimilarProductWarning = {
  productId: string;
  productName: string;
  productSlug: string;
  similarity: number;
};

export async function updateProductAction(id: string, formData: FormData) {
  await requirePermission("prices.edit");
  await requirePermission("stock.edit");
  await requirePermission("products.archive");
  await requirePermission("seo.manage");
  await requirePermission("products.edit");
  const name = getRequiredText(formData, "name", "Nom du modèle", LIMITS.productName);
  const description = getRequiredText(formData, "description", "Description", LIMITS.description);
  const price = parseMoney(formData.get("price"), "Prix", { allowZero: true }) as number;
  const oldPrice = parseMoney(formData.get("oldPrice"), "Ancien prix", { required: false });
  const categoryId = getRequiredText(formData, "categoryId", "Catégorie", 100);
  const brandId = getRequiredText(formData, "brandId", "Marque", 100);
  const target = getTarget(formData.get("target"));
  const color = getProductColor(formData.get("color"));
  const shape = getProductShape(formData.get("shape"));
  const published = formData.get("published") === "on";
  const archived = formData.get("archived") === "on";

  if (price === 0 && oldPrice !== null) {
    throw new Error("Un ancien prix ne peut pas être défini quand le prix est « en boutique » (0 DT).");
  }
  if (oldPrice !== null && oldPrice <= price) {
    throw new Error("L'ancien prix doit être supérieur au prix actuel.");
  }
  const [current, brand, category] = await Promise.all([
    prisma.product.findUnique({ where: { id }, select: { id: true } }),
    prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } }),
    prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }),
  ]);
  if (!current) throw new Error("Produit introuvable.");
  if (!brand) throw new Error("La marque sélectionnée n'existe pas.");
  if (!category) throw new Error("La catégorie sélectionnée n'existe pas.");

  const discount = oldPrice !== null ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price,
      oldPrice,
      discount,
      color,
      shape,
      target,
      categoryId,
      brandId,
      available: formData.get("available") === "on",
      featured: formData.get("featured") === "on",
      isNew: formData.get("isNew") === "on",
      published,
      archived,
      isPromotion: oldPrice !== null,
      metaTitle: getOptionalText(formData, "metaTitle", LIMITS.metaTitle),
      metaDescription: getOptionalText(formData, "metaDescription", LIMITS.metaDescription),
      tags: getOptionalText(formData, "tags", LIMITS.tags),
      whatsappTitle: getOptionalText(formData, "whatsappTitle", LIMITS.whatsappTitle),
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/produits/${id}`);
  revalidateProductViews(product.slug);
}

export async function addProductImageAction(productId: string, formData: FormData): Promise<{ duplicates: SimilarProductWarning[] }> {
  await requirePermission("images.manage");
  const urlRaw = String(formData.get("url") || "").trim();
  if (!urlRaw) return { duplicates: [] };
  const url = validateStoredAssetUrl(urlRaw, "Image");
  const alt = getOptionalText(formData, "alt", LIMITS.imageAlt);
  const [count, product] = await Promise.all([
    prisma.productImage.count({ where: { productId } }),
    prisma.product.findUnique({ where: { id: productId }, select: { slug: true, name: true } }),
  ]);

  // Perceptual fingerprint — computed once here, stored on the row, never
  // recomputed for existing images on future checks (see similarity-lookup.ts).
  const fingerprint = await computeImageFingerprint(url).catch(() => null);

  if (!product) throw new Error("Produit introuvable.");
  await prisma.productImage.create({
    data: { productId, url, alt: alt || product.name || null, sortOrder: count, phash: fingerprint?.hash ?? null },
  });
  revalidatePath(`/admin/produits/${productId}`);
  revalidateProductViews(product?.slug);

  if (!fingerprint) return { duplicates: [] };
  const matches = await findSimilarExistingImages(fingerprint.hash, productId);
  // Collapse to one entry per product (a product can have multiple similar images).
  const byProduct = new Map<string, SimilarProductWarning>();
  for (const m of matches) {
    const similarity = distanceToSimilarityPercent(m.distance);
    const existing = byProduct.get(m.productId);
    if (!existing || similarity > existing.similarity) {
      byProduct.set(m.productId, { productId: m.productId, productName: m.productName, productSlug: m.productSlug, similarity });
    }
  }
  return { duplicates: [...byProduct.values()].sort((a, b) => b.similarity - a.similarity) };
}

export async function removeProductImageAction(productId: string, imageId: string) {
  await requirePermission("images.manage");
  const [image, product] = await Promise.all([
    prisma.productImage.findUnique({ where: { id: imageId } }),
    prisma.product.findUnique({ where: { id: productId }, select: { slug: true } }),
  ]);
  if (!image) throw new Error("Image introuvable.");
  if (image.productId !== productId) throw new Error("Cette image n'appartient pas à ce produit.");
  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteUploadedImageIfUnreferenced(image.url, imageId);
  revalidatePath(`/admin/produits/${productId}`);
  revalidateProductViews(product?.slug);
}

/**
 * "Utiliser le résultat" — swaps a product image's URL for a background-
 * removed version already generated (and stored) by
 * /api/image-pipeline/remove-background. The old file is deleted only
 * now, after the swap is confirmed — never before, so a failed/rejected
 * attempt never risks the original.
 */
export async function replaceProductImageAction(productId: string, imageId: string, newUrl: string) {
  await requirePermission("images.manage");
  if (!newUrl) return;
  const safeNewUrl = validateStoredAssetUrl(newUrl, "Nouvelle image");
  const [image, product] = await Promise.all([
    prisma.productImage.findUnique({ where: { id: imageId } }),
    prisma.product.findUnique({ where: { id: productId }, select: { slug: true } }),
  ]);
  if (!image) throw new Error("Image introuvable.");
  if (image.productId !== productId) throw new Error("Cette image n'appartient pas à ce produit.");
  if (image.url === safeNewUrl) return;
  await prisma.productImage.update({ where: { id: imageId }, data: { url: safeNewUrl } });
  await deleteUploadedImageIfUnreferenced(image.url, imageId);
  revalidatePath(`/admin/produits/${productId}`);
  revalidateProductViews(product?.slug);
}

/**
 * "Conserver l'original" / an abandoned background-removal attempt — the
 * generated file was already stored (to show the preview) but the admin
 * chose not to use it. Clean it up so it doesn't linger as an orphan.
 */
export async function discardGeneratedImageAction(url: string) {
  await requirePermission("images.manage");
  await deleteUploadedImageIfUnreferenced(url);
}

export async function deleteProductFullAction(productId: string) {
  await requirePermission("products.delete");
  const images = await prisma.productImage.findMany({ where: { productId } });
  await prisma.productImage.deleteMany({ where: { productId } });
  for (const image of images) await deleteUploadedImageIfUnreferenced(image.url);
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin");
  revalidateProductViews();
  redirect("/admin");
}
