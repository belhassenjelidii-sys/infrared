"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") throw new Error("Non autorisé");
}
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const image = String(formData.get("image") || "").trim() || null;
  if (!name) return;
  await prisma.category.create({ data: { name, slug: slugify(name), description, image, active: true } });
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const image = String(formData.get("image") || "").trim() || null;
  if (!name) return;
  await prisma.category.update({ where: { id }, data: { name, slug: slugify(name), description, image } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function toggleCategoryActiveAction(id: string, current: boolean) {
  await requireAdmin();
  await prisma.category.update({ where: { id }, data: { active: !current } });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
