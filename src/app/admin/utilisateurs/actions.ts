"use server";
import { isSystemAdmin } from "@/lib/permissions";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getRequiredText, LIMITS, validateEmail, validatePassword } from "@/lib/validation";

// Legacy entry point kept for compatibility. Only the root account may use it.
export async function createUserAction(formData: FormData) {
  const actor = await requirePermission("users.create");
  if (!isSystemAdmin(actor)) throw new Error("Utilisez la nouvelle gestion des utilisateurs.");
  const name = getRequiredText(formData, "name", "Nom", LIMITS.userName);
  const email = validateEmail(formData.get("email"));
  const password = validatePassword(formData.get("password"));
  const roleValue = String(formData.get("role") || "COMMERCIAL");
  if (roleValue !== "COMMERCIAL" && roleValue !== "DEVELOPER") {
    throw new Error("Rôle utilisateur invalide.");
  }
  const role = roleValue as Role;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existing) throw new Error("Cette adresse email est déjà utilisée.");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role, active: true } });
  revalidatePath("/admin/utilisateurs");
}

export async function toggleUserActiveAction(id: string, current: boolean) {
  const actor = await requirePermission("users.edit");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("Utilisateur introuvable.");
  if (target.role === "SUPER_ADMIN") throw new Error("Un compte Super Admin ne peut pas être désactivé.");
  if (target.id === actor.userId) throw new Error("Vous ne pouvez pas désactiver votre propre compte.");
  if (target.active !== current) return;
  await prisma.user.update({ where: { id }, data: { active: !current } });
  revalidatePath("/admin/utilisateurs");
}


export async function changeUserPasswordAction(id: string, formData: FormData) {
  await requirePermission("users.edit");
  const password = validatePassword(formData.get("password"));
  const confirmation = validatePassword(formData.get("passwordConfirmation"));
  if (password !== confirmation) throw new Error("Les deux mots de passe ne correspondent pas.");
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) throw new Error("Utilisateur introuvable.");
  if (target.role === "SUPER_ADMIN") throw new Error("Le mot de passe d’un Super Admin se modifie uniquement depuis son espace Sécurité.");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { passwordHash, authVersion: { increment: 1 } } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
  ]);
  revalidatePath("/admin/utilisateurs");
}
