"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteLocalUpload } from "@/lib/uploads";

async function requireContentAccess() {
  const s = await getSession();
  if (!s || !["ADMIN", "DEVELOPER", "COMMERCIAL"].includes(s.role)) throw new Error("Non autorisé");
}

export async function updateSettingsAction(formData: FormData) {
  await requireContentAccess();
  const existing = await prisma.storeSettings.findFirst();

  const heroImageUrl = String(formData.get("heroImageUrl") || "").trim() || null;
  const data = {
    heroTitle: String(formData.get("heroTitle") || "") || null,
    heroSubtitle: String(formData.get("heroSubtitle") || "") || null,
    heroCtaLabel: String(formData.get("heroCtaLabel") || "") || null,
    accentColor: String(formData.get("accentColor") || "") || null,
    heroImageUrl,
    categoryTitleSolaires: String(formData.get("categoryTitleSolaires") || "") || null,
    categoryTitleOptiques: String(formData.get("categoryTitleOptiques") || "") || null,
    categoryTitleNouveautes: String(formData.get("categoryTitleNouveautes") || "") || null,
    showPrices: formData.get("showPrices") === "on",
    phone: String(formData.get("phone") || "") || null,
    whatsapp: String(formData.get("whatsapp") || "") || null,
    instagram: String(formData.get("instagram") || "") || null,
    facebook: String(formData.get("facebook") || "") || null,
    address: String(formData.get("address") || "") || null,
    mapsUrl: String(formData.get("mapsUrl") || "") || null,
    logoUrl: String(formData.get("logoUrl") || "") || null,
  };

  if (existing && existing.heroImageUrl && existing.heroImageUrl !== heroImageUrl) {
    await deleteLocalUpload(existing.heroImageUrl);
  }

  if (existing) {
    await prisma.storeSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.storeSettings.create({ data });
  }

  revalidatePath("/admin/parametres");
  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/promotions");
  revalidatePath("/nouveautes");
}
