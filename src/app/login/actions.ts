"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { clientIp, consumeRateLimit } from "@/lib/security/rate-limit";
import { authenticate, createSessionToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const rate = await consumeRateLimit(`login:${ip}:${email}`, 10, 10 * 60 * 1000);

  if (!rate.ok) {
    await writeAuditLog(prisma, { category: "SECURITY", action: "auth.login.rate_limited", entityType: "Auth", result: "DENIED", metadata: { email } });
    return { error: `Trop de tentatives. Réessayez dans ${Math.max(1, rate.retryAfterSec)} seconde(s).` };
  }
  if (!email || !password) {
    await writeAuditLog(prisma, { category: "AUTH", action: "auth.login.denied", entityType: "Auth", result: "DENIED", metadata: { email, reason: "missing_credentials" } });
    return { error: "Email et mot de passe requis." };
  }
  const user = await authenticate(email, password);
  if (!user) {
    await writeAuditLog(prisma, { category: "AUTH", action: "auth.login.denied", entityType: "Auth", result: "DENIED", metadata: { email, reason: "invalid_credentials" } });
    return { error: "Identifiants incorrects." };
  }
  await writeAuditLog(prisma, { actor: user, category: "AUTH", action: "auth.login.success", entityType: "User", entityId: user.userId });
  const token = await createSessionToken(user);
  await setSessionCookie(token);
  redirect("/admin");
}

export async function logoutAction() {
  const actor = await getSession();
  if (actor) await writeAuditLog(prisma, { actor, category: "AUTH", action: "auth.logout", entityType: "User", entityId: actor.userId });
  await clearSessionCookie();
  redirect("/login");
}