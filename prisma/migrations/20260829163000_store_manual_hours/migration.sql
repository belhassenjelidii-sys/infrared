-- Per-boutique manual opening hours. Google synchronization is no longer required.
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "hoursJson" TEXT;

-- Preserve the hours users already saw on the site as the initial value.
UPDATE "stores"
SET "hoursJson" = (
  SELECT "hoursJson" FROM "store_settings"
  WHERE "singletonKey" = 'main'
  LIMIT 1
)
WHERE "hoursJson" IS NULL;
