"use server";

import { requestPasswordReset } from "@/lib/password-reset";
import { headers } from "next/headers";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { validateEmail } from "@/lib/validation";

export type ForgotPasswordState = { ok?: boolean; error?: string };

export async function forgotPasswordAction(_prevState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  let email: string;
  try {
    email = validateEmail(formData.get("email"));
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",", 1)[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
    const [ipRate, emailRate] = await Promise.all([
      consumeRateLimit(`forgot-ip:${ip}`, 5, 60 * 60 * 1000),
      consumeRateLimit(`forgot-email:${email}`, 3, 60 * 60 * 1000),
    ]);
    if (!ipRate.ok || !emailRate.ok) {
      return { ok: true };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Adresse e-mail invalide." };
  }

  try {
    await requestPasswordReset(email);
  } catch (error) {
    // Do not reveal whether the address belongs to an account. Configuration
    // failures are logged server-side and the public response stays identical.
    console.error("Forgot-password request failed:", error);
  }

  return { ok: true };
}
