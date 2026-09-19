"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";
import { revalidateProductViews } from "@/lib/revalidate";

export async function deleteProductAction(productId: string) {
  await requirePermission("products.delete");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true, images: { select: { url: true } }, orderItems: { select: { id: true }, take: 1 } },
  });
  if (!product) throw new Error("Produit introuvable.");
  if (product.orderItems.length) {
    await prisma.product.update({ where: { id: productId }, data: { archived: true } });
    revalidatePath("/admin");
    revalidateProductViews(product.slug);
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { variantId: productId } });
    await tx.productImage.deleteMany({ where: { productId } });
    await tx.product.delete({ where: { id: productId } });
  });
  for (const image of product.images) await deleteUploadedImageIfUnreferenced(image.url);
  revalidatePath("/admin");
  revalidateProductViews(product.slug);
}

export async function toggleAvailableAction(productId: string, current: boolean) {
  await requirePermission("stock.edit");
  const product = await prisma.product.update({
    where: { id: productId },
    data: { available: !current },
  });
  revalidatePath("/admin");
  revalidateProductViews(product.slug);
}

export async function togglePublishedAction(productId: string, current: boolean) {
  await requirePermission("products.edit");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true, published: true } });
  if (!product) throw new Error("Produit introuvable.");
  if (product.published !== current) return;
  await prisma.product.update({ where: { id: productId }, data: { published: !current } });
  revalidatePath("/admin");
  revalidateProductViews(product.slug);
}

export async function toggleArchivedAction(productId: string, current: boolean) {
  await requirePermission("products.archive");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true, archived: true } });
  if (!product) throw new Error("Produit introuvable.");
  if (product.archived !== current) return;
  await prisma.product.update({ where: { id: productId }, data: { archived: !current } });
  revalidatePath("/admin");
  revalidateProductViews(product.slug);
}
