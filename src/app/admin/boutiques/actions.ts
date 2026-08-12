"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireContentAccess() {
  const s = await getSession();
  if (!s || !["ADMIN", "DEVELOPER", "COMMERCIAL"].includes(s.role)) throw new Error("Non autorisé");
}

export async function createStoreAction(formData: FormData) {
  await requireContentAccess();
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  if (!name || !address || !mobile) return;
  const count = await prisma.store.count();
  await prisma.store.create({
    data: {
      name,
      address,
      mobile,
      landline: String(formData.get("landline") || "") || null,
      mapsUrl: String(formData.get("mapsUrl") || "") || null,
      mapsEmbedQuery: String(formData.get("mapsEmbedQuery") || "") || address,
      photo: String(formData.get("photo") || "") || null,
      sortOrder: count,
    },
  });
  revalidatePath("/admin/boutiques");
  revalidatePath("/boutique");
}

export async function updateStoreAction(id: string, formData: FormData) {
  await requireContentAccess();
  await prisma.store.update({
    where: { id },
    data: {
      name: String(formData.get("name") || ""),
      address: String(formData.get("address") || ""),
      mobile: String(formData.get("mobile") || ""),
      landline: String(formData.get("landline") || "") || null,
      mapsUrl: String(formData.get("mapsUrl") || "") || null,
      mapsEmbedQuery: String(formData.get("mapsEmbedQuery") || "") || undefined,
      photo: String(formData.get("photo") || "") || null,
    },
  });
  revalidatePath("/admin/boutiques");
  revalidatePath("/boutique");
}

export async function deleteStoreAction(id: string) {
  await requireContentAccess();
  await prisma.store.delete({ where: { id } });
  revalidatePath("/admin/boutiques");
  revalidatePath("/boutique");
}
