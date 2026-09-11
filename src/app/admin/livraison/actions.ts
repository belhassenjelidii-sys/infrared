"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ActionForm";
import { adminError } from "@/lib/admin-errors";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const text = (data: FormData, key: string, max: number, required = false) => {
  const value = String(data.get(key) ?? "").trim();
  if (required && !value) throw new Error(`${key} est obligatoire.`);
  if (value.length > max) throw new Error(`${key} est trop long.`);
  return value || null;
};

export async function updateDeliveryOptionsAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.critical");
  try {
    const delivery = formData.get("delivery") === "on";
    const storePickup = formData.get("storePickup") === "on";
    const deliveryFee = Number(formData.get("deliveryFee") ?? 0);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 1000) throw new Error("Prix de livraison invalide.");
    const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } });
    const previous = row?.features && typeof row.features === "object" && !Array.isArray(row.features) ? row.features as Record<string, unknown> : {};
    if (previous.checkout === true && !delivery && !storePickup) throw new Error("Le checkout actif nécessite la livraison ou le retrait en boutique.");
    if (delivery && previous.cashOnDelivery !== true && previous.onlinePayment !== true) throw new Error("Activez un mode de paiement avant la livraison.");
    const features = { ...previous, delivery, storePickup, deliveryFee } as Prisma.InputJsonObject;
    await prisma.$transaction([
      prisma.storeSettings.upsert({ where: { singletonKey: "main" }, create: { singletonKey: "main", features }, update: { features } }),
      prisma.auditLog.create({ data: { actorId: actor.userId, action: "settings.delivery.update", entityType: "StoreSettings", entityId: "main", after: { delivery, storePickup, deliveryFee } } }),
    ]);
    revalidatePath("/admin", "layout");
    return { success: "Options de livraison enregistrées." };
  } catch (error) { return { error: adminError(error) }; }
}

export async function saveDeliveryCompanyAction(companyId: string | null, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.critical");
  try {
    const name = text(formData, "name", 120, true)!;
    const phone = text(formData, "phone", 40);
    const website = text(formData, "website", 500);
    const accountCode = text(formData, "accountCode", 120);
    if (website) { const url = new URL(website); if (!["http:", "https:"].includes(url.protocol)) throw new Error("Lien du transporteur invalide."); }
    const company = companyId
      ? await prisma.deliveryCompany.update({ where: { id: companyId }, data: { name, phone, website, accountCode, active: formData.get("active") === "on" } })
      : await prisma.deliveryCompany.create({ data: { name, phone, website, accountCode, active: true } });
    await prisma.auditLog.create({ data: { actorId: actor.userId, action: companyId ? "delivery-company.update" : "delivery-company.create", entityType: "DeliveryCompany", entityId: company.id, after: { name, active: company.active } } });
    revalidatePath("/admin/livraison");
    revalidatePath("/admin/commandes");
    return { success: companyId ? "Transporteur mis à jour." : "Transporteur ajouté." };
  } catch (error) { return { error: adminError(error) }; }
}

export async function deleteDeliveryCompanyAction(companyId: string, _state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.critical");
  try {
    if (String(formData.get("confirmation") ?? "") !== "SUPPRIMER") throw new Error("Confirmation invalide.");
    const company = await prisma.deliveryCompany.delete({ where: { id: companyId } });
    await prisma.auditLog.create({ data: { actorId: actor.userId, action: "delivery-company.delete", entityType: "DeliveryCompany", entityId: companyId, before: { name: company.name } } });
    revalidatePath("/admin/livraison");
    return { success: "Transporteur supprimé." };
  } catch (error) { return { error: adminError(error) }; }
}
