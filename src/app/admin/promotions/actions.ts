"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const s = await getSession();
  if (!s || !["ADMIN", "DEVELOPER"].includes(s.role)) throw new Error("Non autorisé");
}

export async function createPromotionAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const oldPrice = Number(formData.get("oldPrice"));
  if (!productId || !Number.isFinite(oldPrice) || oldPrice <= 0) return;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  const price = Number(product.price);
  if (oldPrice <= price) return;

  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
  await prisma.product.update({
    where: { id: productId },
    data: { oldPrice, discount, isPromotion: true },
  });

  revalidatePath("/admin/promotions");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/promotions");
}

export async function removePromotionAction(productId: string) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data: { oldPrice: null, discount: null, isPromotion: false },
  });
  revalidatePath("/admin/promotions");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/promotions");
}
