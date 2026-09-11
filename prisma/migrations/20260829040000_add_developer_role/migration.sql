-- Add the DEVELOPER role that already exists in prisma/schema.prisma.
-- Safe for both fresh and existing databases.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER';
