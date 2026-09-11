"use server";

import { resetPassword } from "@/lib/password-reset";
import { validatePassword } from "@/lib/validation";

export type ResetPasswordState = { ok?: boolean; error?: string };

export async function resetPasswordAction(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const token = typeof formData.get("token") === "string" ? String(formData.get("token")) : "";
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirm = typeof formData.get("confirmPassword") === "string" ? String(formData.get("confirmPassword")) : "";

  try {
    validatePassword(password);
    if (password !== confirm) throw new Error("Les deux mots de passe ne correspondent pas.");
    await resetPassword(token, password);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de réinitialiser le mot de passe." };
  }
}
