"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, name: string, label: string, required = true) {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${label} est obligatoire.`);
  if (value.length > 120) throw new Error(`${label} est trop long.`);
  return value;
}
function refreshed() { revalidatePath("/admin/adresses"); revalidatePath("/checkout"); }

export async function createGovernorateAction(formData: FormData) { await requirePermission("settings.manage"); await prisma.addressGovernorate.create({ data: { name: text(formData, "name", "Le gouvernorat") } }); refreshed(); }
export async function updateGovernorateAction(id: string, formData: FormData) { await requirePermission("settings.manage"); await prisma.addressGovernorate.update({ where: { id }, data: { name: text(formData, "name", "Le gouvernorat") } }); refreshed(); }
export async function createDelegationAction(formData: FormData) { await requirePermission("settings.manage"); await prisma.addressDelegation.create({ data: { governorateId: text(formData, "governorateId", "Le gouvernorat"), name: text(formData, "name", "La délégation") } }); refreshed(); }
export async function updateDelegationAction(id: string, formData: FormData) { await requirePermission("settings.manage"); await prisma.addressDelegation.update({ where: { id }, data: { name: text(formData, "name", "La délégation") } }); refreshed(); }
export async function createLocalityAction(formData: FormData) { await requirePermission("settings.manage"); await prisma.addressLocality.create({ data: { delegationId: text(formData, "delegationId", "La délégation"), name: text(formData, "name", "La localité"), postalCode: text(formData, "postalCode", "Le code postal", false) || null } }); refreshed(); }
export async function updateLocalityAction(id: string, formData: FormData) { await requirePermission("settings.manage"); await prisma.addressLocality.update({ where: { id }, data: { name: text(formData, "name", "La localité"), postalCode: text(formData, "postalCode", "Le code postal", false) || null } }); refreshed(); }
