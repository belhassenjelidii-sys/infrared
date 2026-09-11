"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getOptionalText, getRequiredText, LIMITS, validateOptionalAssetUrl } from "@/lib/validation";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";

function slugify(s: string) {
  return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createCategoryAction(formData: FormData) {
  await requirePermission("categories.manage");
  const name = getRequiredText(formData, "name", "Nom de la catégorie", LIMITS.categoryName);
  const description = getOptionalText(formData, "description", LIMITS.genericDescription);
  const image = validateOptionalAssetUrl(formData.get("image"), "Image de catégorie", LIMITS.imageUrl);
  await prisma.category.create({ data: { name, slug: slugify(name), description, image, active: true } });
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await requirePermission("categories.manage");
  const name = getRequiredText(formData, "name", "Nom de la catégorie", LIMITS.categoryName);
  const description = getOptionalText(formData, "description", LIMITS.genericDescription);
  const image = validateOptionalAssetUrl(formData.get("image"), "Image de catégorie", LIMITS.imageUrl);
  const existing = await prisma.category.findUnique({ where: { id }, select: { image: true, slug: true } });
  if (!existing) throw new Error("Catégorie introuvable.");
  await prisma.category.update({ where: { id }, data: { name, slug: slugify(name), description, image } });
  if (existing.image && existing.image !== image) await deleteUploadedImageIfUnreferenced(existing.image);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function toggleCategoryActiveAction(id: string, current: boolean) {
  await requirePermission("categories.manage");
  await prisma.category.update({ where: { id }, data: { active: !current } });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await requirePermission("categories.manage");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return;
  const existing = await prisma.category.findUnique({ where: { id }, select: { image: true } });
  if (!existing) return;
  await prisma.category.delete({ where: { id } });
  if (existing.image) await deleteUploadedImageIfUnreferenced(existing.image);
  revalidatePath("/admin/categories");
}
