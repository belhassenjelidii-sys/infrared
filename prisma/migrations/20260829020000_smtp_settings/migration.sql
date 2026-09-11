-- SMTP settings managed from the admin dashboard.
ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "smtpProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "smtpHost" TEXT,
  ADD COLUMN IF NOT EXISTS "smtpPort" INTEGER,
  ADD COLUMN IF NOT EXISTS "smtpSecure" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "smtpUser" TEXT,
  ADD COLUMN IF NOT EXISTS "smtpPasswordEncrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "smtpFromEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "smtpFromName" TEXT;
