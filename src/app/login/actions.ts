"use server";

import { redirect } from "next/navigation";
import { authenticate, createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const user = await authenticate(email, password);
  if (!user) {
    return { error: "Identifiants incorrects." };
  }

  const token = await createSessionToken(user);
  await setSessionCookie(token);

  redirect(user.role === "ADMIN" || user.role === "DEVELOPER" ? "/admin" : "/commercial");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
