import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires an explicit driver adapter — `new PrismaClient()` alone
// throws "PrismaClientInitializationError: A driver adapter is required".
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://infrared:infrared_dev_password@localhost:5432/infrared";

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
