"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getOptionalText, getRequiredText, LIMITS, validateOptionalAssetUrl } from "@/lib/validation";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";

function slugify(s: string) {
  return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createBrandAction(formData: FormData) {
  await requirePermission("brands.manage");
  const name = getRequiredText(formData, "name", "Nom de la marque", LIMITS.brandName);
  const logo = validateOptionalAssetUrl(formData.get("logo"), "Logo", LIMITS.imageUrl);
  const marqueeImage = validateOptionalAssetUrl(formData.get("marqueeImage"), "Image de la barre", LIMITS.imageUrl);
  await prisma.brand.create({ data: { name, slug: slugify(name), logo, marqueeImage, active: true } });
  revalidatePath("/admin/marques");
}

export async function updateBrandAction(id: string, formData: FormData) {
  await requirePermission("brands.manage");
  const name = getRequiredText(formData, "name", "Nom de la marque", LIMITS.brandName);
  const logo = validateOptionalAssetUrl(formData.get("logo"), "Logo", LIMITS.imageUrl);
  const existing = await prisma.brand.findUnique({ where: { id }, select: { logo: true, marqueeImage: true } });
  if (!existing) throw new Error("Marque introuvable.");
  await prisma.brand.update({ where: { id }, data: { name, slug: slugify(name), logo } });
  if (existing.logo && existing.logo !== logo) await deleteUploadedImageIfUnreferenced(existing.logo);
  revalidatePath("/admin/marques");
  revalidatePath("/");
}

export async function updateBrandEditorialAction(id: string, formData: FormData) {
  await requirePermission("brands.manage");
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new Error("Marque introuvable.");
  const data = {
    logo: validateOptionalAssetUrl(formData.get("logo"), "Logo", LIMITS.imageUrl),
    marqueeImage: validateOptionalAssetUrl(formData.get("marqueeImage"), "Image de la barre", LIMITS.imageUrl),
    heroWomenImage: validateOptionalAssetUrl(formData.get("heroWomenImage"), "Photo Femme", LIMITS.imageUrl),
    heroMenImage: validateOptionalAssetUrl(formData.get("heroMenImage"), "Photo Homme", LIMITS.imageUrl),
    heroWomenTitle: getOptionalText(formData, "heroWomenTitle", 220),
    heroMenTitle: getOptionalText(formData, "heroMenTitle", 220),
    heroWomenText: getOptionalText(formData, "heroWomenText", 1200),
    heroMenText: getOptionalText(formData, "heroMenText", 1200),
  };
  await prisma.brand.update({ where: { id }, data });
  for (const [oldUrl, newUrl] of [[existing.logo, data.logo], [existing.marqueeImage, data.marqueeImage], [existing.heroWomenImage, data.heroWomenImage], [existing.heroMenImage, data.heroMenImage]]) {
    if (oldUrl && oldUrl !== newUrl) await deleteUploadedImageIfUnreferenced(oldUrl);
  }
  revalidatePath(`/admin/marques/${id}`);
  revalidatePath(`/marques/${existing.slug}`);
  revalidatePath("/marques");
  revalidatePath("/");
}

export async function toggleBrandActiveAction(id: string, current: boolean) {
  await requirePermission("brands.manage");
  await prisma.brand.update({ where: { id }, data: { active: !current } });
  revalidatePath("/admin/marques");
}

export async function deleteBrandAction(id: string) {
  await requirePermission("brands.manage");
  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) return; // safety: don't orphan products
  const existing = await prisma.brand.findUnique({ where: { id }, select: { logo: true, marqueeImage: true } });
  if (!existing) return;
  await prisma.brand.delete({ where: { id } });
  if (existing.logo) await deleteUploadedImageIfUnreferenced(existing.logo);
  if (existing.marqueeImage) await deleteUploadedImageIfUnreferenced(existing.marqueeImage);
  revalidatePath("/admin/marques");
}
