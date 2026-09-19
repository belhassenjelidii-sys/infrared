"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { clientIp, consumeRateLimit } from "@/lib/security/rate-limit";
import { authenticate, createSessionToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { TWO_FACTOR_CHALLENGE_COOKIE, createTwoFactorChallenge, shouldRequireTwoFactorLogin, verifyTwoFactorChallenge } from "@/lib/two-factor";
import { cookies } from "next/headers";

export type LoginState = { error?: string; twoFactorRequired?: boolean };

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
  if (shouldRequireTwoFactorLogin(user)) {
    const challenge = await createTwoFactorChallenge(user.userId);
    (await cookies()).set(TWO_FACTOR_CHALLENGE_COOKIE, challenge, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 5 * 60 });
    return { twoFactorRequired: true };
  }
  await prisma.user.update({ where: { id: user.userId }, data: { lastLoginAt: new Date() } });
  await writeAuditLog(prisma, { actor: user, category: "AUTH", action: "auth.login.success", entityType: "User", entityId: user.userId });
  const token = await createSessionToken(user);
  await setSessionCookie(token);
  redirect("/admin");
}

export async function verifyTwoFactorLoginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const jar = await cookies();
  const challenge = jar.get(TWO_FACTOR_CHALLENGE_COOKIE)?.value;
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const challengeKey = challenge ? createHash("sha256").update(challenge).digest("hex") : "missing";
  const rate = await consumeRateLimit(`two-factor-login:${ip}:${challengeKey}`, 5, 5 * 60 * 1000);
  if (!rate.ok) return { error: "Trop de tentatives. Reconnectez-vous dans quelques minutes.", twoFactorRequired: true };
  try {
    if (!challenge) throw new Error("Étape d’authentification expirée. Reconnectez-vous.");
    const result = await verifyTwoFactorChallenge(challenge, String(formData.get("code") ?? ""));
    jar.delete(TWO_FACTOR_CHALLENGE_COOKIE);
    const user = { userId: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, authVersion: result.user.authVersion };
    await prisma.user.update({ where: { id: user.userId }, data: { lastLoginAt: new Date() } });
    await writeAuditLog(prisma, { actor: user, category: "AUTH", action: result.usedRecoveryCode ? "auth.two_factor.recovery_code" : "auth.two_factor.success", entityType: "User", entityId: user.userId });
    await setSessionCookie(await createSessionToken(user));
  } catch (error) {
    await writeAuditLog(prisma, { category: "AUTH", action: "auth.two_factor.denied", entityType: "Auth", result: "DENIED" });
    return { error: error instanceof Error ? error.message : "Code d’authentification invalide.", twoFactorRequired: true };
  }
  redirect("/admin");
}

export async function logoutAction() {
  const actor = await getSession();
  if (actor) await writeAuditLog(prisma, { actor, category: "AUTH", action: "auth.logout", entityType: "User", entityId: actor.userId });
  await clearSessionCookie();
  redirect("/login");
}
