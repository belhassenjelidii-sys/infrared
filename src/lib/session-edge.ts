// Edge-safe session verification — no Prisma/bcrypt imports here, so this
// file can be used from middleware.ts (Edge runtime). src/lib/auth.ts
// re-exports the same constants for use in Server Actions / Route Handlers.
import { jwtVerify } from "jose";
import { getAuthSecret } from "./auth-secret";

export const COOKIE_NAME = "infrared_session";

const secret = getAuthSecret();

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "GESTIONNAIRE" | "COMMERCIAL" | "MARKETING" | "DEVELOPER";
  authVersion: number;
  permissions?: string[];
  twoFactorSetupRequired?: boolean;
};

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
