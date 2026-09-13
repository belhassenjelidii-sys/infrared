import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { CART_COOKIE } from "@/lib/commerce";
import { finalizeOrderFromCart, getOrderableCart, orderConfirmationPath } from "@/lib/order-finalization";
import { capturePayPalOrder, getPayPalConfig } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

function jsonObject(value: Prisma.JsonValue): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Données de paiement invalides.");
  return value as Prisma.InputJsonObject;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") ?? "";
  const paypalOrderId = url.searchParams.get("token") ?? "";
  try {
    if (!sessionId || !paypalOrderId) throw new Error("Retour PayPal invalide.");
    const alreadyCreated = await prisma.order.findFirst({ where: { externalPaymentId: paypalOrderId }, select: { number: true, publicToken: true } });
    if (alreadyCreated) return NextResponse.redirect(new URL(orderConfirmationPath(alreadyCreated.number, alreadyCreated.publicToken), url.origin));
    const session = await prisma.onlinePaymentSession.findUnique({ where: { id: sessionId } });
    if (!session || session.paypalOrderId !== paypalOrderId || session.expiresAt < new Date()) throw new Error("La session de paiement a expiré.");
    const cart = await getOrderableCart(session.cartId);
    if (cart.priceUpdated) throw new Error("Le prix d’un article a changé. Votre panier a été actualisé, aucun ordre n’a été créé.");
    const config = await getPayPalConfig();
    if (config.currency !== session.currency) throw new Error("La devise PayPal a changé pendant le paiement.");
    const capture = await capturePayPalOrder(config, paypalOrderId);
    if (capture.currency !== session.currency || Math.abs(Number(capture.amount) - Number(session.amountPayPal)) > 0.001) throw new Error("Le montant confirmé par PayPal ne correspond pas à la commande.");
    const fulfillment = jsonObject(session.fulfillmentSnapshot ?? {});
    const deliveryFee = fulfillment.method === "DELIVERY" ? Number(fulfillment.fee ?? 0) : 0;
    const result = await finalizeOrderFromCart({ cartId: session.cartId, customerSnapshot: jsonObject(session.customerSnapshot), fulfillmentSnapshot: fulfillment, paymentMethod: "PAYPAL", paymentStatus: "PAID", externalPaymentId: paypalOrderId, deliveryFee });
    await prisma.onlinePaymentSession.deleteMany({ where: { id: session.id } });
    (await cookies()).delete(CART_COOKIE);
    return NextResponse.redirect(new URL(orderConfirmationPath(result.orderNumber, result.publicToken), url.origin));
  } catch (error) {
    console.error("PayPal return failed:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL("/checkout?paypal=error", url.origin));
  }
}
