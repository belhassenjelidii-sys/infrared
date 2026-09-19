"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { ActionResult } from "@/components/ActionForm";
import { resolveDirectoryAddress } from "@/lib/address-directory";
import { CART_COOKIE, getCommerceSettings } from "@/lib/commerce";
import { defaultCheckoutPayment, isCheckoutPaymentCompatible, type CheckoutFulfillment } from "@/lib/checkout-options";
import { CartPriceUpdatedError, cartSubtotal, finalizeOrderFromCart, getOrderableCart, orderConfirmationPath, updatedCartPricing } from "@/lib/order-finalization";
import { createTndPayment, getTndPaymentConfig, getTndPaymentPublicStatus } from "@/lib/tnd-payment";
import { prisma } from "@/lib/prisma";

function requiredText(value: FormDataEntryValue | null, label: string, max = 180) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} est obligatoire.`);
  if (text.length > max) throw new Error(`${label} est trop long.`);
  return text;
}

function normalizeTunisianPhone(value: FormDataEntryValue | null) {
  const raw = requiredText(value, "Le téléphone", 20);
  const compact = raw.replace(/[\s.-]/g, "");
  const normalized = compact.replace(/^(?:\+216|00216)/, "");
  if (!/^\d{8}$/.test(normalized) || /^(\d)\1{7}$/.test(normalized)) {
    throw new Error("Le téléphone doit contenir 8 chiffres valides.");
  }
  return normalized;
}


async function requestOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL doit être configurée en production pour le paiement en ligne.");
  }
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
    const fulfillment = String(formData.get("fulfillment") ?? "") as CheckoutFulfillment;
    const cart = await getOrderableCart(cartId);
    const deliveryFee = fulfillment === "DELIVERY" ? features.deliveryFee : 0;
    if (cart.priceUpdated) {
      return { error: "Le prix de certains articles a été mis à jour. Vérifiez votre panier avant de continuer.", priceUpdate: updatedCartPricing(cart, deliveryFee) };
    }
    if (fulfillment === "DELIVERY" && !features.delivery) throw new Error("La livraison est désactivée.");
    if (fulfillment === "PICKUP" && !features.storePickup) throw new Error("Le retrait en boutique est désactivé.");
    if (!["DELIVERY", "PICKUP"].includes(fulfillment)) throw new Error("Choisissez un mode de remise.");
    const gatewayStatus = features.onlinePayment ? await getTndPaymentPublicStatus() : null;
    const onlineAvailable = Boolean(features.onlinePayment && gatewayStatus?.ready);
    const submittedPayment = String(formData.get("paymentMethod") ?? "");
    const payment = onlineAvailable
      ? submittedPayment
      : defaultCheckoutPayment({ fulfillment, cashOnDelivery: features.cashOnDelivery, onlineAvailable });
    if (!payment || !isCheckoutPaymentCompatible({ fulfillment, payment, cashOnDelivery: features.cashOnDelivery, onlineAvailable })) {
      throw new Error("Le mode de paiement choisi est incompatible avec le mode de remise.");
    }
    const name = requiredText(formData.get("name"), "Le nom", 120);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error("L’adresse e-mail est invalide.");
    const phone = normalizeTunisianPhone(formData.get("phone"));
    const address = fulfillment === "DELIVERY" ? requiredText(formData.get("address"), "L’adresse exacte", 240) : null;
    const structuredAddress = fulfillment === "DELIVERY" ? await resolveDirectoryAddress({
      governorate: requiredText(formData.get("governorate"), "Le gouvernorat", 100),
      delegation: requiredText(formData.get("delegation"), "La zone ou délégation", 120),
      locality: requiredText(formData.get("locality"), "La localité ou le quartier", 160),
      postalCode: String(formData.get("postalCode") ?? "").trim() || null,
    }) : null;
    const notes = String(formData.get("notes") ?? "").trim().slice(0, 500) || null;
    const storeId = fulfillment === "PICKUP" ? requiredText(formData.get("storeId"), "La boutique", 80) : null;
    const store = storeId ? await prisma.store.findFirst({ where: { id: storeId, active: true }, select: { id: true, name: true, address: true } }) : null;
    if (fulfillment === "PICKUP" && !store) throw new Error("La boutique choisie est indisponible.");
    const customerSnapshot = { name, email: email || null, phone } as Prisma.InputJsonObject;
    const fulfillmentSnapshot = (fulfillment === "DELIVERY" ? {
      method: "DELIVERY",
      address,
      city: [structuredAddress?.locality, structuredAddress?.delegation, structuredAddress?.governorate].filter(Boolean).join(", "),
      governorate: structuredAddress?.governorate,
      delegation: structuredAddress?.delegation,
      locality: structuredAddress?.locality,
      postalCode: structuredAddress?.postalCode,
      notes,
      fee: deliveryFee,
    } : { method: "PICKUP", store, notes }) as Prisma.InputJsonObject;

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
      destination = orderConfirmationPath(result.orderNumber, result.publicToken);
    }
  } catch (error) {
    if (error instanceof CartPriceUpdatedError) return { error: error.message, priceUpdate: error.pricing };
    return { error: error instanceof Error ? error.message : "Impossible de créer la commande." };
  }
  redirect(destination);
}
