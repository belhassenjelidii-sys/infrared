"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidateProductViews } from "@/lib/revalidate";
import { computeImageFingerprint } from "@/lib/product-intelligence/duplicate-detector";
import { findSimilarExistingImages, distanceToSimilarityPercent } from "@/lib/product-intelligence/similarity-lookup";
import {
  getProductColor,
  getProductShape,
  getRequiredText,
  getTarget,
  LIMITS,
  parseMoney,
  validateStoredAssetUrl,
} from "@/lib/validation";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string) {
  const clean = slugify(base) || `produit-${Date.now()}`;
  let slug = clean;
  let i = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${clean}-${i++}`;
  }
  return slug;
}

export async function createProductAction(formData: FormData) {
  await requirePermission("prices.edit");
  await requirePermission("stock.edit");
  await requirePermission("products.create");

  const name = getRequiredText(formData, "name", "Nom du modèle", LIMITS.productName);
  const reference = getRequiredText(formData, "reference", "Référence", LIMITS.reference);
  const description = getRequiredText(formData, "description", "Description", LIMITS.description);
  const price = parseMoney(formData.get("price"), "Prix", { allowZero: true }) as number;
  const oldPrice = parseMoney(formData.get("oldPrice"), "Ancien prix", { required: false });
  const brandId = getRequiredText(formData, "brandId", "Marque", 100);
  const categoryId = getRequiredText(formData, "categoryId", "Catégorie", 100);
  const target = getTarget(formData.get("target"));
  const color = getProductColor(formData.get("color"));
  const shape = getProductShape(formData.get("shape"));

  if (price === 0 && oldPrice !== null) {
    throw new Error("Un ancien prix ne peut pas être défini quand le prix est « en boutique » (0 DT).");
  }
  if (oldPrice !== null && oldPrice <= price) {
    throw new Error("L'ancien prix doit être supérieur au prix actuel.");
  }
  const [brand, category, referenceExists] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } }),
    prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }),
    prisma.product.findUnique({ where: { reference }, select: { id: true } }),
  ]);
  if (!brand) throw new Error("La marque sélectionnée n'existe pas.");
  if (!category) throw new Error("La catégorie sélectionnée n'existe pas.");
  if (referenceExists) throw new Error("Cette référence produit existe déjà.");

  const discount = oldPrice !== null ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
  const slug = await uniqueSlug(name);
  const imageUrlRaw = String(formData.get("imageUrl") || "").trim();
  const imageUrl = imageUrlRaw ? validateStoredAssetUrl(imageUrlRaw, "Image") : "";
  const imageAlt = String(formData.get("imageAlt") || name).trim().slice(0, LIMITS.imageAlt);

  // Perceptual fingerprint + similarity check happen BEFORE creating, so a
  // strong match can be surfaced right after redirect — nothing here ever
  // blocks or auto-cancels the creation, it's purely advisory.
  const fingerprint = imageUrl ? await computeImageFingerprint(imageUrl).catch(() => null) : null;
  const similarMatches = fingerprint ? await findSimilarExistingImages(fingerprint.hash) : [];
  const topMatch = similarMatches[0];

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      reference,
      description,
      price,
      oldPrice,
      discount,
      categoryId,
      brandId,
      color,
      shape,
      target,
      available: formData.get("available") === "on",
      featured: formData.get("featured") === "on",
      isNew: formData.get("isNew") === "on",
      isPromotion: Boolean(oldPrice && oldPrice > price),
      images: imageUrl
        ? { create: [{ url: imageUrl, alt: imageAlt || name, sortOrder: 0, phash: fingerprint?.hash ?? null }] }
        : undefined,
    },
  });

  revalidatePath("/admin");
  revalidateProductViews(product.slug);

  if (topMatch) {
    const similarity = distanceToSimilarityPercent(topMatch.distance);
    redirect(`/admin/produits/${product.id}?similarName=${encodeURIComponent(topMatch.productName)}&similarSlug=${encodeURIComponent(topMatch.productSlug)}&similarPercent=${similarity}`);
  }
  redirect(`/admin/produits/${product.id}`);
}
