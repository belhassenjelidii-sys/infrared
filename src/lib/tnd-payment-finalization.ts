import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { finalizeOrderFromCart, finalizeOrderFromSnapshot, getOrderableCart, orderCartSnapshotTotal, parseOrderCartSnapshot } from "@/lib/order-finalization";
import { getTndPaymentConfig, verifyTndPayment } from "@/lib/tnd-payment";

const TEMPORARY_DATABASE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "P2034"]);

function isTemporaryDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as { code?: unknown; errorCode?: unknown };
  const code = typeof details.code === "string" ? details.code : details.errorCode;
  return typeof code === "string" && TEMPORARY_DATABASE_CODES.has(code);
}

function jsonObject(value: Prisma.JsonValue): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Données de paiement invalides.");
  return value as Prisma.InputJsonObject;
}

export async function finalizeTndPaymentSession(sessionId: string, requestedPaymentId?: string | null) {
  const session = await prisma.onlinePaymentSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("La session de paiement est introuvable.");
  const externalPaymentId = session.externalPaymentId || session.paypalOrderId;
  if (requestedPaymentId && requestedPaymentId !== externalPaymentId) throw new Error("Référence de paiement invalide.");
  const existing = await prisma.order.findFirst({ where: { externalPaymentId }, select: { number: true, publicToken: true } });
  if (existing) return { orderNumber: existing.number, publicToken: existing.publicToken };
  if (session.currency !== "TND") throw new Error("La transaction n’est pas libellée en dinars tunisiens.");
  const config = await getTndPaymentConfig();
  if (config.provider !== session.provider) throw new Error("Le fournisseur de paiement ne correspond plus à la session.");
  const verification = await verifyTndPayment(config, externalPaymentId);
  const sessionAmount = new Prisma.Decimal(session.amountTnd);
  const expectedMillimes = sessionAmount.mul(1000);
  if (!verification.paid || verification.currency !== "TND" || !expectedMillimes.isInteger() || !expectedMillimes.equals(verification.amountMillimes)) {
    throw new Error("Le paiement TND n’a pas été confirmé avec le montant attendu.");
  }
  let result;
  try {
    const fulfillment = jsonObject(session.fulfillmentSnapshot ?? {});
    const deliveryFee = fulfillment.method === "DELIVERY" ? Number(fulfillment.fee ?? 0) : 0;
    const snapshot = session.cartSnapshot === null ? null : parseOrderCartSnapshot(session.cartSnapshot);
    const snapshotTotal = snapshot ? orderCartSnapshotTotal(snapshot, deliveryFee) : sessionAmount;
    if (snapshot && !snapshotTotal.equals(sessionAmount)) throw new Error("Le montant du snapshot panier ne correspond pas à la session de paiement.");
    if (snapshot) {
      result = await finalizeOrderFromSnapshot({ cartId: session.cartId, snapshot, customerSnapshot: jsonObject(session.customerSnapshot), fulfillmentSnapshot: fulfillment, paymentMethod: "ONLINE_TND", paymentStatus: "PAID", externalPaymentId, total: snapshotTotal });
    } else {
      const cart = await getOrderableCart(session.cartId);
      const legacySubtotal = cart.items.reduce(
        (sum, item) => sum.plus(new Prisma.Decimal(item.unitPrice).mul(item.quantity)),
        new Prisma.Decimal(0),
      );
      const legacyTotal = legacySubtotal.plus(new Prisma.Decimal(deliveryFee));
      if (!legacyTotal.equals(sessionAmount)) throw new Error("Le montant du panier historique ne correspond pas au paiement confirmé.");
      if (cart.priceUpdated) throw new Error("Le prix d’un article a changé. Votre panier a été actualisé, aucun ordre n’a été créé.");
      result = await finalizeOrderFromCart({ cartId: session.cartId, customerSnapshot: jsonObject(session.customerSnapshot), fulfillmentSnapshot: fulfillment, paymentMethod: "ONLINE_TND", paymentStatus: "PAID", externalPaymentId, deliveryFee });
    }
  } catch (error) {
    const concurrentOrder = await prisma.order.findUnique({
      where: { externalPaymentId },
      select: { number: true, publicToken: true },
    }).catch(() => null);
    if (concurrentOrder) return { orderNumber: concurrentOrder.number, publicToken: concurrentOrder.publicToken };
    if (isTemporaryDatabaseError(error)) throw error;
    const reason = error instanceof Error ? error.message : "Erreur inconnue pendant la création de commande.";
    await writeAuditLog(prisma, { category: "PAYMENTS", action: "payment.needs_refund", entityType: "OnlinePaymentSession", entityId: session.id, result: "ERROR", metadata: { externalPaymentId, provider: session.provider, amountTnd: session.amountTnd.toString(), reason } }).catch(() => undefined);
    throw new Error("Le paiement est confirmé, mais la commande nécessite une intervention manuelle.");
  }
  await prisma.onlinePaymentSession.deleteMany({ where: { id: session.id } });
  return { orderNumber: result.orderNumber, publicToken: result.publicToken };
}
