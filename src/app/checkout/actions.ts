"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { ActionResult } from "@/components/ActionForm";
import { CART_COOKIE, getCommerceSettings } from "@/lib/commerce";
import { cartSubtotal, finalizeOrderFromCart, getOrderableCart } from "@/lib/order-finalization";
import { createTndPayment, getTndPaymentConfig } from "@/lib/tnd-payment";
import { prisma } from "@/lib/prisma";

function requiredText(value: FormDataEntryValue | null, label: string, max = 180) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} est obligatoire.`);
  if (text.length > max) throw new Error(`${label} est trop long.`);
  return text;
}

async function requestOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const values = await headers();
  const host = values.get("x-forwarded-host") ?? values.get("host") ?? "localhost:3000";
  const protocol = values.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function createOrderAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  let destination = "";
  try {
    const features = await getCommerceSettings();
    if (!features.cart || !features.checkout || !features.orders) throw new Error("La commande en ligne est désactivée.");
    const cartId = (await cookies()).get(CART_COOKIE)?.value;
    if (!cartId) throw new Error("Votre panier est vide.");
    const cart = await getOrderableCart(cartId);
    const fulfillment = String(formData.get("fulfillment") ?? "");
    if (fulfillment === "DELIVERY" && !features.delivery) throw new Error("La livraison est désactivée.");
    if (fulfillment === "PICKUP" && !features.storePickup) throw new Error("Le retrait en boutique est désactivé.");
    if (!["DELIVERY", "PICKUP"].includes(fulfillment)) throw new Error("Choisissez un mode de remise.");
    const payment = String(formData.get("paymentMethod") ?? "");
    if (payment === "CASH_ON_DELIVERY" && (!features.cashOnDelivery || fulfillment !== "DELIVERY")) throw new Error("Le paiement à la livraison n’est pas disponible.");
    if (payment === "CASH_IN_STORE" && (!features.storePickup || fulfillment !== "PICKUP")) throw new Error("Le paiement en boutique nécessite le retrait en boutique.");
    if (payment === "ONLINE_TND" && !features.onlinePayment) throw new Error("Le paiement en ligne est désactivé.");
    if (!["CASH_ON_DELIVERY", "CASH_IN_STORE", "ONLINE_TND"].includes(payment)) throw new Error("Choisissez un mode de paiement disponible.");
    const name = requiredText(formData.get("name"), "Le nom", 120);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error("L’adresse e-mail est invalide.");
    const phone = requiredText(formData.get("phone"), "Le téléphone", 20).replace(/[\s.-]/g, "");
    if (!/^(?:\+216|00216|0)?[2-9]\d{7}$/.test(phone)) throw new Error("Le téléphone doit être un numéro tunisien valide.");
    const address = fulfillment === "DELIVERY" ? requiredText(formData.get("address"), "L’adresse", 240) : null;
    const city = fulfillment === "DELIVERY" ? requiredText(formData.get("city"), "La ville ou le gouvernorat", 100) : null;
    const notes = String(formData.get("notes") ?? "").trim().slice(0, 500) || null;
    const storeId = fulfillment === "PICKUP" ? requiredText(formData.get("storeId"), "La boutique", 80) : null;
    const store = storeId ? await prisma.store.findFirst({ where: { id: storeId, active: true }, select: { id: true, name: true, address: true } }) : null;
    if (fulfillment === "PICKUP" && !store) throw new Error("La boutique choisie est indisponible.");
    const customerSnapshot = { name, email: email || null, phone } as Prisma.InputJsonObject;
    const deliveryFee = fulfillment === "DELIVERY" ? features.deliveryFee : 0;
    const fulfillmentSnapshot = (fulfillment === "DELIVERY" ? { method: "DELIVERY", address, city, notes, fee: deliveryFee } : { method: "PICKUP", store, notes }) as Prisma.InputJsonObject;

    if (payment === "ONLINE_TND") {
      const config = await getTndPaymentConfig();
      const totalTnd = cartSubtotal(cart) + deliveryFee;
      if (totalTnd <= 0) throw new Error("Le montant de la commande est invalide.");
      const sessionId = crypto.randomUUID();
      const origin = await requestOrigin();
      const returnUrl = `${origin}/api/payment/return?session=${encodeURIComponent(sessionId)}`;
      const cancelUrl = `${origin}/api/payment/cancel?session=${encodeURIComponent(sessionId)}`;
      const webhookUrl = `${origin}/api/payment/webhook`;
      const gateway = await createTndPayment({ config, amountTnd: totalTnd, reference: sessionId, customerName: name, phone, email: email || null, returnUrl, cancelUrl, webhookUrl });
      await prisma.onlinePaymentSession.create({ data: { id: sessionId, cartId, paypalOrderId: gateway.externalPaymentId, provider: config.provider, externalPaymentId: gateway.externalPaymentId, customerSnapshot, fulfillmentSnapshot, amountTnd: totalTnd, amountPayPal: totalTnd, currency: "TND", expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
      destination = gateway.approvalUrl;
    } else {
      const result = await finalizeOrderFromCart({ cartId, customerSnapshot, fulfillmentSnapshot, paymentMethod: payment, paymentStatus: "PENDING", deliveryFee });
      (await cookies()).delete(CART_COOKIE);
      destination = `/commande/${result.orderNumber}`;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de créer la commande." };
  }
  redirect(destination);
}
