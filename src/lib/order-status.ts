import "server-only";
import { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Brouillon", NEW: "Nouvelle", CONFIRMED: "Confirmée", PREPARING: "En préparation", SHIPPED: "Expédiée", DELIVERED: "Livrée", CANCELLED: "Annulée",
};

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT: [OrderStatus.NEW, OrderStatus.CANCELLED],
  NEW: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return Object.values(OrderStatus).includes(value as OrderStatus);
}

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus) {
  return current === next || transitions[current].includes(next);
}

export function allowedNextOrderStatuses(current: OrderStatus) {
  return [current, ...transitions[current]];
}

export function assertOrderStatusTransition(current: OrderStatus, next: string): asserts next is OrderStatus {
  if (!isOrderStatus(next)) throw new Error("Statut invalide.");
  if (!canTransitionOrderStatus(current, next)) throw new Error("Transition de statut non autorisée.");
}
