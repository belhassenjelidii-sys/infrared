ALTER TABLE "stores"
  ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT,
  ADD COLUMN IF NOT EXISTS "hoursSource" TEXT NOT NULL DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS "googleHoursJson" TEXT,
  ADD COLUMN IF NOT EXISTS "googleHoursSyncedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "statusOverride" TEXT NOT NULL DEFAULT 'auto';

UPDATE "stores" SET "hoursSource" = 'site' WHERE "hoursSource" IS NULL OR "hoursSource" = '';
UPDATE "stores" SET "statusOverride" = 'auto' WHERE "statusOverride" IS NULL OR "statusOverride" = '';
