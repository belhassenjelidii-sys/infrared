import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("order pricing always comes from the current product row", () => {
  const code = `
    import assert from "node:assert/strict";
    import { revalidateCartLines, updatedCartPricing } from "./src/lib/order-finalization.ts";
    const variant = (price, state = {}) => ({ price, available: true, archived: false, published: true, stock: 3, name: "Monture", ...state });
    const total = (items) => items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const normal = revalidateCartLines([{ unitPrice: 120, quantity: 2, variant: variant(120) }]);
    assert.equal(normal.priceUpdated, false); assert.equal(total(normal.items), 240);
    const changed = revalidateCartLines([{ id: "cart-line", unitPrice: 120, quantity: 2, variant: variant(150) }]);
    assert.equal(changed.priceUpdated, true); assert.equal(total(changed.items), 300);
    const update = updatedCartPricing({ items: changed.items }, 8);
    assert.deepEqual(update, { items: [{ id: "cart-line", quantity: 2, unitPrice: 150 }], subtotal: 300, total: 308 });
    const forged = revalidateCartLines([{ unitPrice: 1, quantity: 1, variant: variant(199) }]);
    assert.equal(forged.items[0].unitPrice, 199);
    assert.throws(() => revalidateCartLines([{ unitPrice: 120, quantity: 1, variant: variant(120, { available: false }) }]));
    assert.throws(() => revalidateCartLines([{ unitPrice: 120, quantity: 1, variant: variant(120, { archived: true }) }]));
  `;
  assert.doesNotThrow(() => execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { cwd: process.cwd(), stdio: "pipe" }));
});
