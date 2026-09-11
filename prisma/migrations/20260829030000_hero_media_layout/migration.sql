ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "heroMediaScale" INTEGER NOT NULL DEFAULT 125,
  ADD COLUMN IF NOT EXISTS "heroMediaX" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "heroMediaY" INTEGER NOT NULL DEFAULT 0;

UPDATE "store_settings"
SET "heroMediaScale" = LEAST(160, GREATEST(80, "heroMediaScale")),
    "heroMediaX" = LEAST(60, GREATEST(-60, "heroMediaX")),
    "heroMediaY" = LEAST(60, GREATEST(-60, "heroMediaY"));
