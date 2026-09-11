import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_INSPIRATION_ITEMS, inspirationSvgUrl, parseInspirationItems, validateInspirationSvg } from "../src/lib/inspiration";
import { parseHomeContent } from "../src/lib/home-content";
import { productCardLabel } from "../src/lib/product-card-label";

test("existing home settings receive the six reference icons without losing other sections", () => {
  const home = parseHomeContent(JSON.stringify({ inspirationTitle: "Notre inspiration", introTitle: "Mon accueil" }));
  assert.equal(home.introTitle, "Mon accueil");
  assert.equal(home.inspirationTitle, "Notre inspiration");
  assert.equal(parseInspirationItems(home.inspirationItems).length, 6);
});

test("edited SVG and title, hidden items and deletion survive serialization", () => {
  const items = [{ ...DEFAULT_INSPIRATION_ITEMS[0], title: "Besoin d’aide ?", visible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="2" /></svg>' }];
  const saved = parseHomeContent(JSON.stringify({ inspirationItems: items }));
  assert.deepEqual(saved.inspirationItems, items);
  assert.equal(saved.inspirationItems.filter((item) => item.visible).length, 0);
  assert.deepEqual(parseHomeContent(JSON.stringify({ inspirationItems: [] })).inspirationItems, []);
});

test("SVG validation rejects scripts, handlers, external resources and oversized input", () => {
  for (const svg of ['<svg><script>alert(1)</script></svg>', '<svg onload="alert(1)"></svg>', '<svg><use href="https://example.com/x" /></svg>', '<svg><foreignObject /></svg>', '<svg>' + ' '.repeat(50_000) + '</svg>']) assert.throws(() => validateInspirationSvg(svg));
  assert.throws(() => parseInspirationItems([...DEFAULT_INSPIRATION_ITEMS, DEFAULT_INSPIRATION_ITEMS[0]]));
  assert.ok(inspirationSvgUrl(DEFAULT_INSPIRATION_ITEMS[0].svg).startsWith("data:image/svg+xml;charset=utf-8,%3Csvg"));
});

test("cards separate brand and collection from supplier model references", () => {
  assert.deepEqual(productCardLabel({ brandName: "Miu Miu", name: "Miu Miu Logo MU A54S 5AK04O", reference: "MU A54S 5AK04O 51-20", color: "" }), { title: "Miu Miu Logo", model: "MU A54S 5AK04O 51-20" });
  assert.deepEqual(productCardLabel({ brandName: "Prada", name: "Prada PR C12V 20D1O1", reference: "IR-PRADAPRC12V20D1O1", color: "" }), { title: "Prada", model: "PR C12V 20D1O1" });
  assert.deepEqual(productCardLabel({ brandName: "Ray-Ban", name: "Ray-Ban Aviator Classic RB3025 002/58 Noir", reference: "IR-RAYBAN", color: "Noir" }), { title: "Ray-Ban Aviator Classic", model: "RB3025 002/58" });
});
