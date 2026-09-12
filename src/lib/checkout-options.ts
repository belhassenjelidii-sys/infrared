export type CheckoutFulfillment = "DELIVERY" | "PICKUP";
export type CheckoutPayment = "CASH_ON_DELIVERY" | "CASH_IN_STORE" | "ONLINE_TND";

export function availableCheckoutPayments(input: {
  fulfillment: CheckoutFulfillment;
  cashOnDelivery: boolean;
  onlineAvailable: boolean;
}) {
  const methods: CheckoutPayment[] = [];
  if (input.fulfillment === "DELIVERY" && input.cashOnDelivery) methods.push("CASH_ON_DELIVERY");
  if (input.fulfillment === "PICKUP") methods.push("CASH_IN_STORE");
  if (input.onlineAvailable) methods.push("ONLINE_TND");
  return methods;
}

export function defaultCheckoutPayment(input: {
  fulfillment: CheckoutFulfillment;
  cashOnDelivery: boolean;
  onlineAvailable: boolean;
}) {
  return availableCheckoutPayments(input)[0] ?? null;
}

export function isCheckoutPaymentCompatible(input: {
  fulfillment: CheckoutFulfillment;
  payment: string;
  cashOnDelivery: boolean;
  onlineAvailable: boolean;
}): input is typeof input & { payment: CheckoutPayment } {
  return availableCheckoutPayments(input).includes(input.payment as CheckoutPayment);
}
