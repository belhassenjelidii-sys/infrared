"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const s = await getSession();
  if (!s || !["ADMIN", "DEVELOPER"].includes(s.role)) throw new Error("Non autorisé");
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string) {
  const clean = slugify(base) || `produit-${Date.now()}`;
  let slug = clean;
  let i = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${clean}-${i++}`;
  }
  return slug;
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const reference = String(formData.get("reference") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price"));
  const oldPriceRaw = String(formData.get("oldPrice") || "").trim();
  const oldPrice = oldPriceRaw ? Number(oldPriceRaw) : null;
  const brandId = String(formData.get("brandId") || "");
  const categoryId = String(formData.get("categoryId") || "");
  if (!name || !reference || !description || !brandId || !categoryId || !Number.isFinite(price)) throw new Error("Champs produit invalides.");

  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
  const slug = await uniqueSlug(name);

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      reference,
      description,
      price,
      oldPrice,
      discount,
      categoryId,
      brandId,
      color: String(formData.get("color") || "").trim() || null,
      shape: String(formData.get("shape") || "").trim() || null,
      target: (String(formData.get("target") || "MIXTE") as "HOMME" | "FEMME" | "MIXTE" | "ENFANT"),
      available: formData.get("available") === "on",
      featured: formData.get("featured") === "on",
      isNew: formData.get("isNew") === "on",
      isPromotion: Boolean(oldPrice && oldPrice > price),
      images: String(formData.get("imageUrl") || "").trim()
        ? { create: [{ url: String(formData.get("imageUrl")).trim(), alt: String(formData.get("imageAlt") || name).trim(), sortOrder: 0 }] }
        : undefined,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/catalogue");
  redirect(`/admin/produits/${product.id}`);
}
