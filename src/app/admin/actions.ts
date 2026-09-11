"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";
import { revalidateProductViews } from "@/lib/revalidate";

export async function deleteProductAction(productId: string) {
  await requirePermission("products.delete");
  const [images, product] = await Promise.all([
    prisma.productImage.findMany({ where: { productId } }),
    prisma.product.findUnique({ where: { id: productId }, select: { slug: true } }),
  ]);
  await prisma.productImage.deleteMany({ where: { productId } });
  for (const image of images) await deleteUploadedImageIfUnreferenced(image.url);
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin");
  revalidateProductViews(product?.slug);
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
