import "server-only";

import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { clientIp } from "@/lib/security/rate-limit";

export const AUDIT_CATEGORIES = [
  "AUTH", "ORDERS", "CATALOG", "STOCK", "PRICING", "PAYMENTS",
  "USERS", "ROLES", "SETTINGS", "SECURITY", "SYSTEM",
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_RESULTS = ["SUCCESS", "DENIED", "ERROR"] as const;
export type AuditResult = (typeof AUDIT_RESULTS)[number];

type AuditDb = { auditLog: { create: (args: Prisma.AuditLogCreateArgs) => Promise<unknown> } };
type AuditActor = { userId: string; name?: string; email?: string; role?: string };
export type AuditRequestContext = { ip?: string; userAgent?: string; requestId?: string };

const SENSITIVE_KEY = /(?:password|secret|token|cookie|authorization|api[_-]?key|publictoken|session|card|cvv|iban|bank|hash)/i;
const MAX_STRING_LENGTH = 2_000;
const MAX_COLLECTION_LENGTH = 50;

/** Removes secrets and bounds untrusted metadata before it reaches the immutable audit store. */
export function sanitizeAuditData(value: unknown, depth = 0): Prisma.JsonValue | undefined {
  if (value === undefined || depth > 8) return undefined;
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, MAX_COLLECTION_LENGTH).map((item) => sanitizeAuditData(item, depth + 1) ?? null);
  if (typeof value === "object") {
    const result: Record<string, Prisma.JsonValue> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, MAX_COLLECTION_LENGTH)) {
      result[key] = SENSITIVE_KEY.test(key) ? "[masqué]" : sanitizeAuditData(item, depth + 1) ?? null;
    }
    return result;
  }
  return String(value).slice(0, MAX_STRING_LENGTH);
}

/** Request attributes are optional because jobs and payment callbacks can run without a browser request. */
export async function getAuditRequestContext(): Promise<AuditRequestContext> {
  try {
    const requestHeaders = await headers();
    const requestId = requestHeaders.get("x-request-id")?.trim();
    return {
      ip: clientIp(requestHeaders),
      userAgent: requestHeaders.get("user-agent")?.slice(0, 500) || undefined,
      requestId: requestId && /^[a-zA-Z0-9._:-]{1,128}$/.test(requestId) ? requestId : undefined,
    };
  } catch {
    return {};
  }
}

export type WriteAuditLogInput = {
  actor?: AuditActor | null;
  category: AuditCategory;
  action: string;
  entityType: string;
  entityId?: string | null;
  storeId?: string | null;
  result?: AuditResult;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  request?: AuditRequestContext;
};

/**
 * The only write path for audit events. Audit rows have no dashboard mutation
 * action; sensitive values are stripped here before Prisma receives them.
 */
export async function writeAuditLog(db: AuditDb, input: WriteAuditLogInput): Promise<void> {
  const request = input.request ?? await getAuditRequestContext();
  const before = sanitizeAuditData(input.before);
  const after = sanitizeAuditData(input.after);
  const metadata = sanitizeAuditData(input.metadata);
  await db.auditLog.create({
    data: {
      actorId: input.actor?.userId,
      actorName: input.actor?.name?.slice(0, 160),
      actorEmail: input.actor?.email?.slice(0, 320),
      actorRole: input.actor?.role?.slice(0, 80),
      category: input.category,
      action: input.action.slice(0, 160),
      entityType: input.entityType.slice(0, 120),
      entityId: input.entityId?.slice(0, 191),
      storeId: input.storeId?.slice(0, 191),
      result: input.result ?? "SUCCESS",
      ...(before === undefined ? {} : { before }),
      ...(after === undefined ? {} : { after }),
      ...(metadata === undefined ? {} : { metadata }),
      ip: request.ip && request.ip !== "unknown" ? request.ip.slice(0, 64) : undefined,
      userAgent: request.userAgent,
      requestId: request.requestId,
    } as Prisma.AuditLogCreateInput,
  });
}
