import "server-only";
import crypto from "node:crypto";

function secretKey(): Buffer {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET est obligatoire en production.");
    }
    return crypto.createHash("sha256").update("dev-only-insecure-secret-change-me", "utf8").digest();
  }
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

/** Encrypts sensitive settings at rest using AES-256-GCM. */
export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded] = value.split(":");
  if (version !== "v1" || !ivEncoded || !tagEncoded || !ciphertextEncoded) {
    throw new Error("Secret chiffré invalide.");
  }
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      secretKey(),
      Buffer.from(ivEncoded, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Impossible de déchiffrer le secret configuré.");
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
