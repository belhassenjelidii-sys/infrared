import test from "node:test";
import assert from "node:assert/strict";
import { availableCheckoutPayments, defaultCheckoutPayment, isCheckoutPaymentCompatible } from "../src/lib/checkout-options";
import { resolveTunisianAddress } from "../src/lib/tunisia-addresses";

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

test("l’adresse tunisienne est résolue depuis une proposition officielle", () => {
  assert.deepEqual(resolveTunisianAddress({ governorate: "Tunis", delegation: "El Kram", locality: "Le Kram Est", postalCode: "2015" }), {
    governorate: "TUNIS",
    delegation: "EL KRAM",
    locality: "LE KRAM EST",
    postalCode: "2015",
  });
  assert.throws(() => resolveTunisianAddress({ governorate: "Tunis", delegation: "El Kram", locality: "Quartier inventé" }));
});
