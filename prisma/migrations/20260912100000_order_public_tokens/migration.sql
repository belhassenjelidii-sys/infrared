CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "publicToken" TEXT;

UPDATE "orders"
SET "publicToken" = encode(gen_random_bytes(32), 'hex')
WHERE "publicToken" IS NULL;

ALTER TABLE "orders"
  ALTER COLUMN "publicToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_publicToken_key"
  ON "orders"("publicToken");
