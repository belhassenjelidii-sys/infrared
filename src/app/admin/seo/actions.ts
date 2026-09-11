"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ActionForm";
import { adminError } from "@/lib/admin-errors";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function updateSeoAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("seo.manage");
  try {
    const title = String(formData.get("seoTitle") ?? "").trim();
    const description = String(formData.get("seoDescription") ?? "").trim();
    if (title.length < 10 || title.length > 120) throw new Error("Le titre SEO doit contenir entre 10 et 120 caractères.");
    if (description.length < 40 || description.length > 320) throw new Error("La description SEO doit contenir entre 40 et 320 caractères.");
    const current = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } });
    const previous = current?.features && typeof current.features === "object" && !Array.isArray(current.features) ? current.features as Record<string,unknown> : {};
    const next = { ...previous, seoTitle: title, seoDescription: description, seoIndexing: formData.get("seoIndexing") === "on" } as Prisma.InputJsonObject;
    await prisma.$transaction(async (tx) => {
      await tx.storeSettings.upsert({ where: { singletonKey: "main" }, create: { singletonKey: "main", features: next }, update: { features: next } });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "settings.seo.update", entityType: "StoreSettings", entityId: "main", before: previous as Prisma.InputJsonObject, after: next } });
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/seo");
    return { success: "Paramètres SEO enregistrés." };
  } catch (error) { return { error: adminError(error) }; }
}
