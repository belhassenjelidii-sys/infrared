import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit-log";

/**
 * V1 assignment is organisational only. Keeping it distinct from inventory
 * lets a future StoreStock module attach to the same Store relation safely.
 */
export function canChangePreparationStore(status: OrderStatus) {
  return status !== OrderStatus.SHIPPED && status !== OrderStatus.DELIVERED && status !== OrderStatus.CANCELLED;
}

export function shouldNotifyPreparationStore(status: OrderStatus) {
  return status === OrderStatus.CONFIRMED || status === OrderStatus.PREPARING;
}

/**
 * Claims one notification atomically before SMTP is contacted. A successful
 * send is recorded on the order; subsequent action replays therefore no-op.
 */
export async function sendPreparationStoreEmail(orderId: string, actor?: { userId: string; name?: string; email?: string; role?: string }) {
  const claimedAt = new Date();
  const claim = await prisma.order.updateMany({
    where: {
      id: orderId,
      preparationStoreId: { not: null },
      preparationEmailSentAt: null,
      preparationEmailClaimedAt: null,
      status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
    },
    data: { preparationEmailClaimedAt: claimedAt },
  });
  if (claim.count !== 1) return { sent: false as const, reason: "already-sent-or-ineligible" as const };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { preparationStore: { select: { id: true, name: true, email: true } }, items: true },
  });
  if (!order?.preparationStore?.email) {
    await prisma.order.update({ where: { id: orderId }, data: { preparationEmailClaimedAt: null } });
    return { sent: false as const, reason: "no-store-email" as const };
  }

  const customer = object(order.customerSnapshot);
  const fulfillment = object(order.fulfillmentSnapshot);
  const deliveryLabel = fulfillment.method === "DELIVERY" ? "Livraison à domicile" : "Retrait en boutique";
  const rows = order.items.map((item) => `<li>${item.quantity} × ${escapeHtml(`${item.brandName} ${item.modelCode ?? item.productName}`)} — ${escapeHtml(item.reference)}</li>`).join("");
  try {
    await sendEmail({
      to: order.preparationStore.email,
      subject: `Préparation commande ${order.number}`,
      html: `<h1>Commande ${escapeHtml(order.number)}</h1>
        <p><strong>Client :</strong> ${escapeHtml(String(customer.name ?? "—"))}<br><strong>Téléphone :</strong> ${escapeHtml(String(customer.phone ?? "—"))}</p>
        <p><strong>Mode :</strong> ${deliveryLabel}<br><strong>Boutique de préparation :</strong> ${escapeHtml(order.preparationStore.name)}<br><strong>Total :</strong> ${Number(order.total).toFixed(3)} TND</p>
        <p><strong>Articles à préparer :</strong></p><ul>${rows}</ul>
        <p><a href="${escapeHtml(adminOrderUrl(order.id))}">Ouvrir la commande dans le back-office</a></p>`,
    });
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { preparationEmailSentAt: new Date(), preparationEmailClaimedAt: null } });
      await writeAuditLog(tx, { actor, category: "ORDERS", action: "order.preparation_email.sent", entityType: "Order", entityId: order.id, storeId: order.preparationStoreId, metadata: { storeId: order.preparationStoreId } });
    });
    return { sent: true as const };
  } catch {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { preparationEmailClaimedAt: null } });
      await writeAuditLog(tx, { actor, category: "ORDERS", action: "order.preparation_email.error", entityType: "Order", entityId: orderId, storeId: order.preparationStoreId, result: "ERROR", metadata: { storeId: order.preparationStoreId, error: "SMTP send failed" } });
    });
    return { sent: false as const, reason: "smtp-error" as const };
  }
}

function object(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function adminOrderUrl(orderId: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
  return `${origin}/admin/commandes/${encodeURIComponent(orderId)}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));
}
