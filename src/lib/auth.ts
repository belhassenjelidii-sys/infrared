import { resolvePermissions } from "./permissions";
import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { getAuthSecret } from "./auth-secret";
import { prisma } from "./prisma";
import { COOKIE_NAME, verifySessionToken, type SessionPayload } from "./session-edge";
import { mustEnrollTwoFactor } from "./two-factor";

const secret = getAuthSecret();

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // The JWT itself stays valid for up to 7 days regardless of DB state, so
  // a deactivated account could otherwise keep working until the token
  // expires. Re-check `active` here (Node runtime, not edge middleware —
  // Prisma isn't available there) so a deactivation takes effect on the
  // very next page load / action, not up to a week later.
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { active: true, authVersion: true, role: true, name: true, email: true, permissionOverrides: true, twoFactorEnabled: true } });
  if (!user?.active || user.authVersion !== payload.authVersion) return null;

  const policy = await prisma.rolePolicy.findUnique({ where: { role: user.role } });
  return { ...payload, role: user.role, name: user.name, email: user.email, permissions: resolvePermissions(user.role, policy?.permissions, user.permissionOverrides), twoFactorSetupRequired: mustEnrollTwoFactor(user) };
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await prisma.user.update({ where: {id: user.id}, data: {lastLoginAt: new Date()} });
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    authVersion: user.authVersion,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

export { COOKIE_NAME };
