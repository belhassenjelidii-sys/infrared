"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteLocalUpload } from "@/lib/uploads";

async function requireStaff() {
  const s = await getSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "COMMERCIAL")) throw new Error("Non autorisé");
}

// Commercial scope on purpose: price, availability, and photos only — no
// name/description/brand/category edits, no delete (Admin-only per the
// role separation defined in prisma/schema.prisma).
export async function updateProductCommercialAction(id: string, formData: FormData) {
  await requireStaff();
  const price = Number(formData.get("price"));
  const available = formData.get("available") === "on";
  await prisma.product.update({ where: { id }, data: { price, available } });
  revalidatePath("/commercial");
}

export async function addProductImageCommercialAction(productId: string, formData: FormData) {
  await requireStaff();
  const url = String(formData.get("url") || "").trim();
  if (!url) return;
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({ data: { productId, url, sortOrder: count } });
  revalidatePath("/commercial");
}

export async function removeProductImageCommercialAction(productId: string, imageId: string) {
  await requireStaff();
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteLocalUpload(image?.url);
  revalidatePath("/commercial");
}
