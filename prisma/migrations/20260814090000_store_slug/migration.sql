-- Add slug, backfilled from the existing name for any pre-existing rows
-- (safe no-op on a fresh empty table), then enforce NOT NULL + uniqueness.
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "stores"
SET "slug" = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
WHERE "slug" IS NULL OR "slug" = '';

-- De-duplicate any slugs that collided after the backfill above (e.g. two
-- stores with the same name) by suffixing the row id.
UPDATE "stores" s
SET "slug" = s."slug" || '-' || substr(s.id, 1, 6)
WHERE s."slug" IN (
  SELECT "slug" FROM "stores" GROUP BY "slug" HAVING count(*) > 1
);

ALTER TABLE "stores" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "stores_slug_key" ON "stores"("slug");
