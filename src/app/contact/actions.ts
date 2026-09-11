"use server";

import { prisma } from "@/lib/prisma";
import { validateTunisianPhone } from "@/lib/validation";

export type ContactFormState = {
  ok: boolean;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Very small in-memory throttle (best-effort — resets on redeploy/restart).
// This is not a substitute for a WAF/rate-limiter in front of the app, but
// it stops naive bots from spamming the endpoint from a single process.
const recentSubmissions = new Map<string, number>();
const THROTTLE_MS = 30_000;

export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot: real users never fill this hidden field.
  if (String(formData.get("website") || "").trim().length > 0) {
    return { ok: true }; // Pretend success so bots don't learn anything.
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  let phone = "";
  try { phone = validateTunisianPhone(formData.get("phone")); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Numéro de téléphone invalide." }; }
  const message = String(formData.get("message") || "").trim();

  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Merci d'indiquer votre nom." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Adresse email invalide." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Votre message est un peu court — dites-nous en plus." };
  }
  if (message.length > 4000) {
    return { ok: false, error: "Message trop long (4000 caractères max)." };
  }

  const throttleKey = email.toLowerCase();
  const last = recentSubmissions.get(throttleKey);
  if (last && Date.now() - last < THROTTLE_MS) {
    return { ok: false, error: "Merci de patienter quelques secondes avant de renvoyer un message." };
  }
  recentSubmissions.set(throttleKey, Date.now());

  await prisma.contactMessage.create({
    data: { name, email, phone: phone || null, message },
  });

  return { ok: true };
}
