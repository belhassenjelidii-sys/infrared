CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'NEW', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE "status"
      WHEN 'READY' THEN 'SHIPPED'
      ELSE "status"
    END
  )::"OrderStatus";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"OrderStatus";
