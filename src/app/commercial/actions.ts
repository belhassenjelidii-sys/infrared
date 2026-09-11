"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";
import { revalidateProductViews } from "@/lib/revalidate";
import { computeImageFingerprint } from "@/lib/product-intelligence/duplicate-detector";
import { findSimilarExistingImages, distanceToSimilarityPercent } from "@/lib/product-intelligence/similarity-lookup";
import type { SimilarProductWarning } from "@/app/admin/produits/[id]/actions";
import { parseMoney, validateStoredAssetUrl } from "@/lib/validation";

// Commercial scope on purpose: price, availability, and photos only — no
// name/description/brand/category edits, no delete (Admin-only per the
// role separation defined in prisma/schema.prisma).
export async function updateProductCommercialAction(id: string, formData: FormData) {
  await requirePermission("stock.edit");
  await requirePermission("prices.edit");
  const price = parseMoney(formData.get("price"), "Prix") as number;
  const available = formData.get("available") === "on";
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error("Produit introuvable.");
  const product = await prisma.product.update({ where: { id }, data: { price, available } });
  revalidatePath("/commercial");
  revalidateProductViews(product.slug);
}

export async function addProductImageCommercialAction(productId: string, formData: FormData): Promise<{ duplicates: SimilarProductWarning[] }> {
  await requirePermission("images.manage");
  const urlRaw = String(formData.get("url") || "").trim();
  if (!urlRaw) return { duplicates: [] };
  const url = validateStoredAssetUrl(urlRaw, "Image");
  const [count, product] = await Promise.all([
    prisma.productImage.count({ where: { productId } }),
    prisma.product.findUnique({ where: { id: productId }, select: { slug: true } }),
  ]);
  const fingerprint = await computeImageFingerprint(url).catch(() => null);
  if (!product) throw new Error("Produit introuvable.");
  await prisma.productImage.create({ data: { productId, url, sortOrder: count, phash: fingerprint?.hash ?? null } });
  revalidatePath("/commercial");
  revalidateProductViews(product?.slug);

  if (!fingerprint) return { duplicates: [] };
  const matches = await findSimilarExistingImages(fingerprint.hash, productId);
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

export async function removeProductImageCommercialAction(productId: string, imageId: string) {
  await requirePermission("images.manage");
  const [image, product] = await Promise.all([
    prisma.productImage.findUnique({ where: { id: imageId } }),
    prisma.product.findUnique({ where: { id: productId }, select: { slug: true } }),
  ]);
  if (!image || image.productId !== productId) throw new Error("Cette image n'appartient pas à ce produit.");
  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteUploadedImageIfUnreferenced(image.url, imageId);
  revalidatePath("/commercial");
  revalidateProductViews(product?.slug);
}

/** "Utiliser le résultat" (background removal review) — commercial variant. */
export async function replaceProductImageCommercialAction(productId: string, imageId: string, newUrl: string) {
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
  revalidatePath("/commercial");
  revalidateProductViews(product?.slug);
}

/** "Conserver l'original" (background removal review) — commercial variant. */
export async function discardGeneratedImageCommercialAction(url: string) {
  await requirePermission("images.manage");
  await deleteUploadedImageIfUnreferenced(url);
}
