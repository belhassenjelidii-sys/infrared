"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteLocalUpload } from "@/lib/uploads";

async function requireAdmin() {
  const s = await getSession();
  if (!s || !["ADMIN", "DEVELOPER"].includes(s.role)) throw new Error("Non autorisé");
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();
  const price = Number(formData.get("price"));
  const oldPriceRaw = String(formData.get("oldPrice") || "").trim();
  const oldPrice = oldPriceRaw ? Number(oldPriceRaw) : null;
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  await prisma.product.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      price,
      oldPrice,
      discount,
      color: String(formData.get("color") || ""),
      shape: String(formData.get("shape") || "") || null,
      target: formData.get("target") as "HOMME" | "FEMME" | "MIXTE" | "ENFANT",
      categoryId: String(formData.get("categoryId")),
      brandId: String(formData.get("brandId")),
      available: formData.get("available") === "on",
      featured: formData.get("featured") === "on",
      isNew: formData.get("isNew") === "on",
      isPromotion: !!oldPrice,
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/produits/${id}`);
}

export async function addProductImageAction(productId: string, formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") || "").trim();
  const alt = String(formData.get("alt") || "").trim();
  if (!url) return;
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url, alt: alt || null, sortOrder: count },
  });
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/");
}

export async function removeProductImageAction(productId: string, imageId: string) {
  await requireAdmin();
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteLocalUpload(image?.url);
  revalidatePath(`/admin/produits/${productId}`);
}

export async function deleteProductFullAction(productId: string) {
  await requireAdmin();
  const images = await prisma.productImage.findMany({ where: { productId } });
  await prisma.productImage.deleteMany({ where: { productId } });
  for (const image of images) await deleteLocalUpload(image.url);
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin");
  redirect("/admin");
}
