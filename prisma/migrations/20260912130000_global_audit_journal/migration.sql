-- Extends the existing immutable audit log without altering historical rows.
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'ORDERS', 'CATALOG', 'STOCK', 'PRICING', 'PAYMENTS', 'USERS', 'ROLES', 'SETTINGS', 'SECURITY', 'SYSTEM');
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'DENIED', 'ERROR');

ALTER TABLE "audit_logs"
  ADD COLUMN "actorName" TEXT,
  ADD COLUMN "actorEmail" TEXT,
  ADD COLUMN "actorRole" TEXT,
  ADD COLUMN "category" "AuditCategory" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "storeId" TEXT,
  ADD COLUMN "result" "AuditResult" NOT NULL DEFAULT 'SUCCESS',
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "ip" TEXT,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "requestId" TEXT;

UPDATE "audit_logs"
SET "category" = CASE
  WHEN "action" LIKE 'order.%' THEN 'ORDERS'::"AuditCategory"
  WHEN "action" LIKE 'stock.%' THEN 'STOCK'::"AuditCategory"
  WHEN "action" LIKE 'variant.%' OR "action" LIKE 'model.%' THEN 'CATALOG'::"AuditCategory"
  WHEN "action" LIKE 'user.%' THEN 'USERS'::"AuditCategory"
  WHEN "action" LIKE 'role.%' THEN 'ROLES'::"AuditCategory"
  WHEN "action" LIKE 'settings.payment%' THEN 'PAYMENTS'::"AuditCategory"
  WHEN "action" LIKE 'settings.%' THEN 'SETTINGS'::"AuditCategory"
  ELSE 'SYSTEM'::"AuditCategory"
END;

CREATE INDEX "audit_logs_category_createdAt_idx" ON "audit_logs"("category", "createdAt");
CREATE INDEX "audit_logs_result_createdAt_idx" ON "audit_logs"("result", "createdAt");
CREATE INDEX "audit_logs_storeId_createdAt_idx" ON "audit_logs"("storeId", "createdAt");