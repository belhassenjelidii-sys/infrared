import { can, type Permission } from "./permissions";
import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./auth";
import type { SessionPayload } from "./session-edge";

export class UnauthorizedError extends Error {
  status: number;
  constructor(message = "Non autorisé") {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

/**
 * Single source of truth for "who can do what" on the server.
 * Every Server Action / Route Handler that mutates data MUST go through
 * this — never rely on the client hiding a button as protection.
 *
 * Role scope (kept in one place so ADMIN and DEVELOPER never drift apart
 * — see prisma/schema.prisma Role enum and README for the intended scope):
 *  - ADMIN / DEVELOPER: full back-office access (identical scope).
 *  - COMMERCIAL: price, availability, photos, boutiques & site content.
 */
export const ROLE_GROUPS = {
  /** Full back-office: products, brands, categories, promotions, users, settings. */
  FULL_ADMIN: ["SUPER_ADMIN", "ADMIN", "DEVELOPER"] as const,
  /** Boutiques + paramètres — content editable by commercial staff too. */
  CONTENT: ["SUPER_ADMIN", "ADMIN", "DEVELOPER", "COMMERCIAL", "MARKETING"] as const,
  /** /commercial space: price, availability, photos. */
  STAFF: ["SUPER_ADMIN", "ADMIN", "DEVELOPER", "COMMERCIAL", "MARKETING"] as const,
  /** Any authenticated + active back-office account. */
  ANY: ["SUPER_ADMIN", "ADMIN", "DEVELOPER", "COMMERCIAL", "MARKETING"] as const,
} as const;

/**
 * Verifies there is a valid session AND the session role is one of
 * `allowedRoles`. Throws UnauthorizedError otherwise. Always call this
 * as the first line of any Server Action or Route Handler that touches
 * protected data — never trust the caller.
 *
 * Use this variant (rather than the *OrRedirect wrappers below) in Route
 * Handlers, where a thrown error is caught and turned into a JSON response
 * — redirecting an API caller would not make sense there.
 */
export async function requireRole(
  allowedRoles: readonly string[]
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !allowedRoles.includes(session.role)) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * Same check as {@link requireRole}, but for Server Actions bound to a
 * `<form>` (admin/commercial pages): a missing/expired session just sends
 * the user back to /login instead of surfacing a raw error overlay. A
 * *wrong* role (logged in, but not permitted) still throws — that's a real
 * authorization failure, not something to silently redirect past.
 */
async function requireRoleOrRedirect(
  allowedRoles: readonly string[]
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!allowedRoles.includes(session.role)) {
    throw new UnauthorizedError();
  }
  return session;
}

/** Convenience wrapper for the common "full admin" check. */
/** Page-level guard: redirects unauthenticated/inactive accounts and rejects wrong roles. */
export async function requirePageRole(allowedRoles: readonly string[]) {
  return requireRoleOrRedirect(allowedRoles);
}

export async function requireAdmin() {
  return requireRoleOrRedirect(ROLE_GROUPS.FULL_ADMIN);
}

/** Convenience wrapper for the "content editor" check (boutiques, paramètres). */
export async function requireContentAccess() {
  return requirePermission("content.manage");
}

/** Convenience wrapper for the /commercial space. */
export async function requireStaff() {
  return requireRoleOrRedirect(ROLE_GROUPS.STAFF);
}

export async function requirePermission(permission: Permission): Promise<SessionPayload> {
  const session=await getSession();
  if(!session) throw new UnauthorizedError("Connectez-vous pour continuer.");
  if(!can(session,permission)) throw new UnauthorizedError("Vous ne disposez pas de cette permission.");
  return session;
}
export async function requirePagePermission(permission: Permission) {
  const session=await getSession();
  if(!session) redirect("/login");
  if(!can(session,permission)) redirect("/admin/acces-refuse");
  return session;
}
