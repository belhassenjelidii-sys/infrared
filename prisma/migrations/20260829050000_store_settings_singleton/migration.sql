-- StoreSettings is logically a singleton. Keep one row before enforcing uniqueness.
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "singletonKey" TEXT NOT NULL DEFAULT 'main';

DELETE FROM "store_settings"
WHERE "id" NOT IN (SELECT MIN("id") FROM "store_settings");

CREATE UNIQUE INDEX IF NOT EXISTS "store_settings_singletonKey_key" ON "store_settings"("singletonKey");
