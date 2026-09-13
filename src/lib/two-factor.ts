import "server-only";

import crypto from "node:crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, hashToken, randomToken } from "@/lib/secrets";

const ISSUER = "InfraRed Optic Store";
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "DEVELOPER"]);
export const TWO_FACTOR_CHALLENGE_COOKIE = "infrared_2fa_challenge";

export function requireAdminTwoFactor() { return process.env.REQUIRE_ADMIN_2FA === "true"; }
export function isTwoFactorProtectedRole(role: string) { return ADMIN_ROLES.has(role); }
export function shouldRequireTwoFactorLogin(user: { twoFactorEnabled: boolean }) { return user.twoFactorEnabled; }
export function mustEnrollTwoFactor(user: { role: string; twoFactorEnabled: boolean }) {
  return requireAdminTwoFactor() && isTwoFactorProtectedRole(user.role) && !user.twoFactorEnabled;
}
function normalizeCode(value: string) { return value.replace(/\s+/g, ""); }
function totp(secret: string, label: string) {
  return new OTPAuth.TOTP({ issuer: ISSUER, label, algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
}
export function generateTotpSecret() { return new OTPAuth.Secret({ size: 20 }).base32; }
export function verifyTotp(secret: string, label: string, code: string) {
  const value = normalizeCode(code);
  return /^\d{6}$/.test(value) && totp(secret, label).validate({ token: value, window: 1 }) !== null;
}
export async function qrCodeForTotp(secret: string, email: string) {
  return QRCode.toDataURL(totp(secret, email).toString(), { errorCorrectionLevel: "M", margin: 1, width: 280 });
}
function normalizedRecoveryCode(code: string) { return code.replace(/[^a-z0-9]/gi, "").toUpperCase(); }
function recoveryHash(code: string) { return hashToken(`two-factor-recovery:${normalizedRecoveryCode(code)}`); }
export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}
export function hashRecoveryCodes(codes: string[]) { return codes.map(recoveryHash); }
export function verifyRecoveryCode(hashes: unknown, code: string) {
  if (!Array.isArray(hashes)) return { valid: false, remaining: [] as string[] };
  const candidate = recoveryHash(code);
  const index = hashes.findIndex((hash) => typeof hash === "string" && hash.length === candidate.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate)));
  return { valid: index >= 0, remaining: index >= 0 ? hashes.filter((_, current) => current !== index).filter((hash): hash is string => typeof hash === "string") : hashes.filter((hash): hash is string => typeof hash === "string") };
}
export async function beginTwoFactorSetup(user: { userId: string; email: string }) {
  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: user.userId }, data: { twoFactorPendingSecretEncrypted: encryptSecret(secret) } });
  return { manualKey: secret, qrCode: await qrCodeForTotp(secret, user.email) };
}
export async function confirmTwoFactorSetup(user: { userId: string; email: string }, code: string) {
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.userId }, select: { twoFactorPendingSecretEncrypted: true } });
  if (!row.twoFactorPendingSecretEncrypted) throw new Error("Démarrez d’abord l’activation du 2FA.");
  const secret = decryptSecret(row.twoFactorPendingSecretEncrypted);
  if (!verifyTotp(secret, user.email, code)) throw new Error("Code d’authentification invalide.");
  const recoveryCodes = generateRecoveryCodes();
  await prisma.user.update({ where: { id: user.userId }, data: { twoFactorEnabled: true, twoFactorSecretEncrypted: encryptSecret(secret), twoFactorPendingSecretEncrypted: null, twoFactorRecoveryCodes: hashRecoveryCodes(recoveryCodes) } });
  return recoveryCodes;
}
export async function createTwoFactorChallenge(userId: string) {
  const token = randomToken(32);
  const now = new Date();
  await prisma.$transaction([
    prisma.twoFactorLoginChallenge.deleteMany({ where: { userId } }),
    prisma.twoFactorLoginChallenge.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + 5 * 60 * 1000) } }),
  ]);
  return token;
}
export async function verifyTwoFactorChallenge(token: string, code: string) {
  const challenge = await prisma.twoFactorLoginChallenge.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date() || challenge.attempts >= 5 || !challenge.user.active || !challenge.user.twoFactorEnabled || !challenge.user.twoFactorSecretEncrypted) throw new Error("Étape d’authentification expirée. Reconnectez-vous.");
  const secret = decryptSecret(challenge.user.twoFactorSecretEncrypted);
  const recovery = verifyRecoveryCode(challenge.user.twoFactorRecoveryCodes, code);
  const validTotp = verifyTotp(secret, challenge.user.email, code);
  if (!validTotp && !recovery.valid) {
    await prisma.twoFactorLoginChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    throw new Error("Code d’authentification invalide.");
  }
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.twoFactorLoginChallenge.updateMany({ where: { id: challenge.id, usedAt: null }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) throw new Error("Cette étape a déjà été utilisée.");
    if (recovery.valid) await tx.user.update({ where: { id: challenge.userId }, data: { twoFactorRecoveryCodes: recovery.remaining } });
  });
  return { user: challenge.user, usedRecoveryCode: recovery.valid };
}
export async function disableTwoFactor(user: { userId: string; email: string; passwordHash: string; twoFactorSecretEncrypted: string | null; twoFactorRecoveryCodes: unknown }, passwordValid: boolean, code: string) {
  if (!passwordValid || !user.twoFactorSecretEncrypted) throw new Error("Mot de passe ou code d’authentification invalide.");
  const recovery = verifyRecoveryCode(user.twoFactorRecoveryCodes, code);
  const validTotp = verifyTotp(decryptSecret(user.twoFactorSecretEncrypted), user.email, code);
  if (!validTotp && !recovery.valid) throw new Error("Mot de passe ou code d’authentification invalide.");
  await prisma.user.update({ where: { id: user.userId }, data: { twoFactorEnabled: false, twoFactorSecretEncrypted: null, twoFactorPendingSecretEncrypted: null, twoFactorRecoveryCodes: Prisma.JsonNull, authVersion: { increment: 1 } } });
  return { usedRecoveryCode: recovery.valid };
}
