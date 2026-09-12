"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { clientIp, consumeRateLimit } from "@/lib/security/rate-limit";
import { authenticate, createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const rate = await consumeRateLimit(`login:${ip}:${email}`, 10, 10 * 60 * 1000);

  if (!rate.ok) {
    return { error: `Trop de tentatives. Réessayez dans ${Math.max(1, rate.retryAfterSec)} seconde(s).` };
  }

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const user = await authenticate(email, password);
  if (!user) {
    return { error: "Identifiants incorrects." };
  }

  const token = await createSessionToken(user);
  await setSessionCookie(token);

  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
