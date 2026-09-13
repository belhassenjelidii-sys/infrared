import { execFileSync } from "node:child_process";
import test from "node:test";

test("les statuts et transitions de commande sont stricts", () => {
  const source = `
    import assert from "node:assert/strict";
    import { OrderStatus } from "@prisma/client";
    import { assertOrderStatusTransition, canTransitionOrderStatus, isOrderStatus, ORDER_STATUS_LABELS } from "./src/lib/order-status.ts";

    assert.equal(isOrderStatus("NEW"), true);
    assert.equal(isOrderStatus("ARBITRARY"), false);
    assert.equal(canTransitionOrderStatus(OrderStatus.NEW, OrderStatus.CONFIRMED), true);
    assert.equal(canTransitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.NEW), false);
    assert.equal(canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.NEW), false);
    assert.doesNotThrow(() => assertOrderStatusTransition(OrderStatus.NEW, "CONFIRMED"));
    assert.throws(() => assertOrderStatusTransition(OrderStatus.NEW, "ARBITRARY"));
    assert.throws(() => assertOrderStatusTransition(OrderStatus.CANCELLED, "NEW"));
    assert.equal(ORDER_STATUS_LABELS[OrderStatus.DRAFT], "Brouillon");
  `;

  execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", source], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
});
