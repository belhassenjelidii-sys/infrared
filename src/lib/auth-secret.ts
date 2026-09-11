import "server-only";

export function getAuthSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET est obligatoire en production.");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-change-me");
  }
  if (value.length < 32) {
    throw new Error("AUTH_SECRET doit contenir au moins 32 caractères.");
  }
  return new TextEncoder().encode(value);
}
