import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("la boutique de préparation reste une relation Store dynamique, sans effet sur le stock", () => {
  const code = `
    import assert from "node:assert/strict";
    import { OrderStatus } from "@prisma/client";
    import { canChangePreparationStore, shouldNotifyPreparationStore } from "./src/lib/order-preparation.ts";
    assert.equal(canChangePreparationStore(OrderStatus.NEW), true);
    assert.equal(canChangePreparationStore(OrderStatus.CONFIRMED), true);
    assert.equal(canChangePreparationStore(OrderStatus.PREPARING), true);
    assert.equal(canChangePreparationStore(OrderStatus.SHIPPED), false);
    assert.equal(canChangePreparationStore(OrderStatus.DELIVERED), false);
    assert.equal(canChangePreparationStore(OrderStatus.CANCELLED), false);
    assert.equal(shouldNotifyPreparationStore(OrderStatus.CONFIRMED), true);
    assert.equal(shouldNotifyPreparationStore(OrderStatus.PREPARING), true);
    assert.equal(shouldNotifyPreparationStore(OrderStatus.NEW), false);
  `;
  execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { cwd: process.cwd(), stdio: "pipe" });
});

test("le schéma prépare une relation optionnelle Store sans introduire de stock par boutique", async () => {
  const { readFile } = await import("node:fs/promises");
  const schema = await readFile("prisma/schema.prisma", "utf8");
  const migration = await readFile("prisma/migrations/20260913110000_order_preparation_store/migration.sql", "utf8");
  assert.match(schema, /preparationStoreId String\?/);
  assert.match(schema, /preparationStore Store\? @relation\("PreparationStore"/);
  assert.match(migration, /REFERENCES "stores"\("id"\)/);
  assert.doesNotMatch(schema, /model StoreStock/);
  assert.doesNotMatch(schema, /model StockTransfer/);
});

test("la notification boutique est idempotente et limite son contenu aux données de préparation", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile("src/lib/order-preparation.ts", "utf8");
  assert.match(source, /preparationEmailSentAt: null/);
  assert.match(source, /preparationEmailClaimedAt: null/);
  assert.match(source, /updateMany/);
  assert.match(source, /order\.preparation_email\.sent/);
  assert.match(source, /order\.preparation_email\.error/);
  assert.doesNotMatch(source, /customer\.email/);
  assert.doesNotMatch(source, /publicToken/);
  assert.doesNotMatch(source, /password|twoFactorSecret|recoveryCode/);
});
