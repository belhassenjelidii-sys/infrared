-- Safe on databases where a previous interrupted attempt created one or more
-- columns before failing. Prisma's resolve --rolled-back command can then
-- replay this migration cleanly.
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "homeTrendEyebrow" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "homeTrendTitle" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "homeTrendProductIds" TEXT;
