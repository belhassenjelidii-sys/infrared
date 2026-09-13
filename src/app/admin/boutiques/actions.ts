"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";
import { getOptionalText, getRequiredText, LIMITS, validateOptionalAssetUrl, validateOptionalUrl } from "@/lib/validation";

function optionalEmail(formData: FormData) {
  const value = getOptionalText(formData, "email", 254);
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("E-mail de la boutique invalide.");
  return value?.toLowerCase() ?? null;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

function revalidateStoreViews(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/boutique");
  if (slug) revalidatePath(`/boutique/${slug}`);
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueStoreSlug(base: string, excludeId?: string) {
  const clean = slugify(base) || `boutique-${Date.now()}`;
  let slug = clean;
  let i = 2;
  while (await prisma.store.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined } })) {
    slug = `${clean}-${i++}`;
  }
  return slug;
}

function manualHoursJson(formData: FormData) {
  const rows = DAYS.map((day) => ({
    day,
    hours: String(formData.get(`hours_${day.toLowerCase()}`) || "").trim().slice(0, 80),
  })).filter((row) => row.hours);
  return rows.length ? JSON.stringify(rows) : null;
}

export async function createStoreAction(formData: FormData) {
  await requirePermission("stores.manage");
  const name = getRequiredText(formData, "name", "Nom de la boutique", LIMITS.storeName);
  const address = getRequiredText(formData, "address", "Adresse", LIMITS.address);
  const mobile = getRequiredText(formData, "mobile", "Téléphone mobile", LIMITS.phone);
  const [count, slug] = await Promise.all([prisma.store.count(), uniqueStoreSlug(name)]);
  await prisma.store.create({
    data: {
      name,
      slug,
      address,
      mobile,
      email: optionalEmail(formData),
      landline: getOptionalText(formData, "landline", LIMITS.phone),
      mapsUrl: validateOptionalUrl(formData.get("mapsUrl"), "Lien Google Maps"),
      mapsEmbedQuery: getOptionalText(formData, "mapsEmbedQuery", LIMITS.address) || address,
      photo: validateOptionalAssetUrl(formData.get("photo"), "Photo", LIMITS.imageUrl),
      sortOrder: count,
      hoursJson: manualHoursJson(formData),
      statusOverride: "auto",
    },
  });
  revalidatePath("/admin/boutiques");
  revalidateStoreViews(slug);
}

export async function updateStoreAction(id: string, formData: FormData) {
  await requirePermission("stores.manage");
  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) throw new Error("Boutique introuvable.");
  const photo = validateOptionalAssetUrl(formData.get("photo"), "Photo", LIMITS.imageUrl);
  const name = getRequiredText(formData, "name", "Nom de la boutique", LIMITS.storeName);
  const requestedSlug = String(formData.get("slug") || "").trim();
  const slug = requestedSlug ? await uniqueStoreSlug(requestedSlug, id) : existing.slug || (await uniqueStoreSlug(name, id));

  await prisma.store.update({
    where: { id },
    data: {
      name,
      slug,
      address: getRequiredText(formData, "address", "Adresse", LIMITS.address),
      mobile: getRequiredText(formData, "mobile", "Téléphone mobile", LIMITS.phone),
      email: optionalEmail(formData),
      landline: getOptionalText(formData, "landline", LIMITS.phone),
      mapsUrl: validateOptionalUrl(formData.get("mapsUrl"), "Lien Google Maps"),
      mapsEmbedQuery: getOptionalText(formData, "mapsEmbedQuery", LIMITS.address),
      photo,
      hoursJson: manualHoursJson(formData),
    },
  });

  if (existing.photo && existing.photo !== photo) await deleteUploadedImageIfUnreferenced(existing.photo);
  revalidatePath("/admin/boutiques");
  revalidateStoreViews(existing.slug);
  if (existing.slug !== slug) revalidateStoreViews(slug);
}

export async function deleteStoreAction(id: string) {
  await requirePermission("stores.manage");
  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) throw new Error("Boutique introuvable.");
  await prisma.store.delete({ where: { id } });
  if (existing.photo) await deleteUploadedImageIfUnreferenced(existing.photo);
  revalidatePath("/admin/boutiques");
  revalidateStoreViews(existing.slug);
}

export async function setStoreStatusOverrideAction(id: string, override: "auto" | "open" | "closed") {
  await requirePermission("stores.manage");
  if (!["auto", "open", "closed"].includes(override)) throw new Error("Statut boutique invalide.");
  const existing = await prisma.store.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throw new Error("Boutique introuvable.");
  await prisma.store.update({ where: { id }, data: { statusOverride: override } });
  revalidatePath("/admin/boutiques");
  revalidateStoreViews(existing.slug);
}
