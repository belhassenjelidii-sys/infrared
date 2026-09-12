import "server-only";
import { prisma } from "@/lib/prisma";

type RateLimitResult = { ok: boolean; retryAfterSec: number };
type RateLimitRow = { count: number; resetAt: Date };

/**
 * PostgreSQL-backed fixed-window limiter. The UPSERT is atomic, so limits
 * remain effective across restarts and multiple application instances.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${nextReset}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."resetAt" <= ${now} THEN 1
        ELSE "rate_limit_buckets"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "rate_limit_buckets"."resetAt" <= ${now} THEN ${nextReset}
        ELSE "rate_limit_buckets"."resetAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"
  `;
  const bucket = rows[0];
  if (!bucket) throw new Error("Impossible d'appliquer la limite de requêtes.");
  return {
    ok: bucket.count <= limit,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

/**
 * The application deliberately never reads x-forwarded-for: a browser can
 * send that header itself. Set TRUST_PROXY_HEADERS=true only when the Next.js
 * process is reachable exclusively through Nginx, configured to overwrite
 * X-Real-IP with $remote_addr (not to pass the client's value through).
 */
export function clientIp(headers: Headers): string {
  if (process.env.TRUST_PROXY_HEADERS !== "true") return "unknown";
  const realIp = headers.get("x-real-ip")?.trim();
  return realIp && /^[0-9a-f:.]+$/i.test(realIp) ? realIp : "unknown";
}

export function requestFingerprint(request: Request): string {
  return clientIp(request.headers);
}
