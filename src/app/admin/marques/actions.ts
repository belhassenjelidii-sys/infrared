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

export async function createBrandAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const logo = String(formData.get("logo") || "").trim() || null;
  if (!name) return;
  await prisma.brand.create({ data: { name, slug: slugify(name), logo, active: true } });
  revalidatePath("/admin/marques");
}

export async function updateBrandAction(id: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const logo = String(formData.get("logo") || "").trim() || null;
  if (!name) return;
  await prisma.brand.update({ where: { id }, data: { name, slug: slugify(name), logo } });
  revalidatePath("/admin/marques");
  revalidatePath("/");
}

export async function toggleBrandActiveAction(id: string, current: boolean) {
  await requireAdmin();
  await prisma.brand.update({ where: { id }, data: { active: !current } });
  revalidatePath("/admin/marques");
}

export async function deleteBrandAction(id: string) {
  await requireAdmin();
  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) return; // safety: don't orphan products
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/marques");
}
