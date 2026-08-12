"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteLocalUpload } from "@/lib/uploads";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }
  return session;
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const images = await prisma.productImage.findMany({ where: { productId } });
  await prisma.productImage.deleteMany({ where: { productId } });
  for (const image of images) await deleteLocalUpload(image.url);
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin");
}

export async function toggleAvailableAction(productId: string, current: boolean) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data: { available: !current },
  });
  revalidatePath("/admin");
}
