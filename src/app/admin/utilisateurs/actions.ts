"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

async function requireAdmin() {
  const s = await getSession();
  if (!s || !(s.role === "ADMIN" || s.role === "DEVELOPER")) throw new Error("Non autorisé");
}

// Only COMMERCIAL (Marketing Digital & Commercial) and DEVELOPER accounts
// can be created here — a single ADMIN account is enforced, matching the
// "one admin only" requirement. Creating role=ADMIN is rejected even if
// someone tampers with the form.
export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "COMMERCIAL") as Role;
  if (!name || !email || password.length < 8) return;
  if (role === "ADMIN") return;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role, active: true } });
  revalidatePath("/admin/utilisateurs");
}

export async function toggleUserActiveAction(id: string, current: boolean) {
  await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "ADMIN") return; // never deactivate the single admin
  await prisma.user.update({ where: { id }, data: { active: !current } });
  revalidatePath("/admin/utilisateurs");
}
