import test from "node:test";
import assert from "node:assert/strict";
import { availableCheckoutPayments, defaultCheckoutPayment, isCheckoutPaymentCompatible } from "../src/lib/checkout-options";
import { getDelegations, getGovernorates, getLocalities } from "../src/data/tunisia-addresses";

test("livraison et retrait choisissent le paiement hors ligne compatible", () => {
  assert.equal(defaultCheckoutPayment({ fulfillment: "DELIVERY", cashOnDelivery: true, onlineAvailable: false }), "CASH_ON_DELIVERY");
  assert.equal(defaultCheckoutPayment({ fulfillment: "PICKUP", cashOnDelivery: true, onlineAvailable: false }), "CASH_IN_STORE");
  assert.equal(isCheckoutPaymentCompatible({ fulfillment: "DELIVERY", payment: "CASH_IN_STORE", cashOnDelivery: true, onlineAvailable: false }), false);
  assert.equal(isCheckoutPaymentCompatible({ fulfillment: "PICKUP", payment: "CASH_ON_DELIVERY", cashOnDelivery: true, onlineAvailable: false }), false);
});

test("les paiements en ligne réellement disponibles complètent chaque mode de remise", () => {
  assert.deepEqual(availableCheckoutPayments({ fulfillment: "DELIVERY", cashOnDelivery: true, onlineAvailable: true }), ["CASH_ON_DELIVERY", "ONLINE_TND"]);
  assert.deepEqual(availableCheckoutPayments({ fulfillment: "PICKUP", cashOnDelivery: true, onlineAvailable: true }), ["CASH_IN_STORE", "ONLINE_TND"]);
  assert.equal(defaultCheckoutPayment({ fulfillment: "PICKUP", cashOnDelivery: true, onlineAvailable: true }), "CASH_IN_STORE");
});

test("le référentiel local expose les adresses tunisiennes par niveaux", () => {
  const tunis = getGovernorates().find((name) => name.toLocaleLowerCase("fr-TN") === "tunis");
  assert.ok(tunis);
  const kram = getDelegations(tunis).find((entry) => entry.name.toLocaleLowerCase("fr-TN") === "el kram");
  assert.ok(kram);
  const kramEst = getLocalities(tunis, kram.name).find((entry) => entry.name.toLocaleLowerCase("fr-TN") === "le kram est");
  assert.equal(kramEst?.postalCode, "2015");
  assert.deepEqual(getLocalities(tunis, "Délégation inventée"), []);
});
