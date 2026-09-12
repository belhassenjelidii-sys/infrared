import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { finalizeOrderFromCart, getOrderableCart } from "@/lib/order-finalization";
import { getTndPaymentConfig, verifyTndPayment } from "@/lib/tnd-payment";

function jsonObject(value: Prisma.JsonValue): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Données de paiement invalides.");
  return value as Prisma.InputJsonObject;
}

export async function finalizeTndPaymentSession(sessionId: string, requestedPaymentId?: string | null) {
  const session = await prisma.onlinePaymentSession.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) throw new Error("La session de paiement a expiré.");
  const externalPaymentId = session.externalPaymentId || session.paypalOrderId;
  if (requestedPaymentId && requestedPaymentId !== externalPaymentId) throw new Error("Référence de paiement invalide.");
  const existing = await prisma.order.findFirst({ where: { externalPaymentId }, select: { number: true, publicToken: true } });
  if (existing) return { orderNumber: existing.number, publicToken: existing.publicToken };
  if (session.currency !== "TND") throw new Error("La transaction n’est pas libellée en dinars tunisiens.");
  const config = await getTndPaymentConfig();
  if (config.provider !== session.provider) throw new Error("Le fournisseur de paiement ne correspond plus à la session.");
  const verification = await verifyTndPayment(config, externalPaymentId);
  const expectedMillimes = Math.round(Number(session.amountTnd) * 1000);
  if (!verification.paid || verification.currency !== "TND" || verification.amountMillimes !== expectedMillimes) {
    throw new Error("Le paiement TND n’a pas été confirmé avec le montant attendu.");
  }
  await getOrderableCart(session.cartId);
  const fulfillment = jsonObject(session.fulfillmentSnapshot ?? {});
  const deliveryFee = fulfillment.method === "DELIVERY" ? Number(fulfillment.fee ?? 0) : 0;
  const result = await finalizeOrderFromCart({
    cartId: session.cartId,
    customerSnapshot: jsonObject(session.customerSnapshot),
    fulfillmentSnapshot: fulfillment,
    paymentMethod: session.provider,
    paymentStatus: "PAID",
    externalPaymentId,
    deliveryFee,
  });
  await prisma.onlinePaymentSession.deleteMany({ where: { id: session.id } });
  return { orderNumber: result.orderNumber, publicToken: result.publicToken };
}
