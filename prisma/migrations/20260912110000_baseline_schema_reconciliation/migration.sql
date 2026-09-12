-- Baseline reconciliation for schema changes that already exist in the
-- local database. This migration is recorded as applied on that database.
-- On a fresh database it makes the migration history converge to the same
-- schema without changing application data.

ALTER TABLE "brands"
  ADD COLUMN IF NOT EXISTS "marqueeImage" TEXT;

ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "accentColor" TEXT,
  ADD COLUMN IF NOT EXISTS "facebook" TEXT,
  ADD COLUMN IF NOT EXISTS "heroCtaLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT,
  ADD COLUMN IF NOT EXISTS "heroTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "logoHeight" INTEGER NOT NULL DEFAULT 42;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "orderNotificationsSeenAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "stores_active_sortOrder_idx"
  ON "stores"("active", "sortOrder");

-- These indexes are absent from the current database and are no longer part
-- of the intended baseline. Removing them here keeps fresh migrations and
-- the existing local database aligned.
DROP INDEX IF EXISTS "products_shape_idx";
DROP INDEX IF EXISTS "products_name_trgm_idx";
DROP INDEX IF EXISTS "products_reference_trgm_idx";
DROP INDEX IF EXISTS "brands_name_trgm_idx";
