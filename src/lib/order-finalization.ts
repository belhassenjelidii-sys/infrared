import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

export function revalidateCartLines<T extends { unitPrice: number | Prisma.Decimal; quantity: number; variant: { price: number | Prisma.Decimal; available: boolean; archived: boolean; published: boolean; stock: number | null; name: string } }>(items: T[]) {
  if (!items.length) throw new Error("Votre panier est vide.");
  for (const item of items) {
      if (!item.variant.available || item.variant.archived || !item.variant.published || (item.variant.stock !== null && item.variant.stock < item.quantity)) throw new Error(`${item.variant.name} n’est plus disponible dans la quantité demandée.`);
  }
  const changed = items.filter((item) => Number(item.unitPrice) !== Number(item.variant.price));
  return { priceUpdated: changed.length > 0, items: items.map((item) => ({ ...item, unitPrice: item.variant.price })) };
}

export async function getOrderableCart(cartId: string) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: { include: { variant: { include: { brand: true, productModel: true } } } } } });
  if (!cart) throw new Error("Votre panier est vide.");
  const pricing = revalidateCartLines(cart.items);
  const changed = cart.items.filter((item) => Number(item.unitPrice) !== Number(item.variant.price));
  if (changed.length) {
    await prisma.$transaction(changed.map((item) => prisma.cartItem.update({ where: { id: item.id }, data: { unitPrice: item.variant.price } })));
  }
  return {
    ...cart,
    priceUpdated: pricing.priceUpdated,
    // The current Product row is the server source of truth. CartItem.unitPrice
    // is synchronized only for display and is never trusted for an order.
    items: pricing.items,
  };
}

export function cartSubtotal(cart: Awaited<ReturnType<typeof getOrderableCart>>) {
  return cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
}

export type FrozenOrderItem = {
  variantId: string;
  productName: string;
  brandName: string;
  modelCode: string | null;
  reference: string;
  size: string | null;
  frameColor: string | null;
  lensColor: string | null;
  unitPrice: string;
  quantity: number;
};

export type OrderCartSnapshot = { version: 1; subtotal: string; items: FrozenOrderItem[] };

export function createOrderCartSnapshot(cart: Awaited<ReturnType<typeof getOrderableCart>>): OrderCartSnapshot {
  const items = cart.items.map((item) => ({
    variantId: item.variantId,
    productName: item.variant.name,
    brandName: item.variant.brand.name,
    modelCode: item.variant.productModel?.code ?? null,
    reference: item.variant.variantReference ?? item.variant.reference,
    size: item.variant.size,
    frameColor: item.variant.frameColorFamily ?? item.variant.frameColorLabel ?? item.variant.color,
    lensColor: item.variant.lensColorFamily ?? item.variant.lensColorLabel,
    unitPrice: new Prisma.Decimal(item.unitPrice).toFixed(3),
    quantity: item.quantity,
  }));
  const subtotal = items.reduce((sum, item) => sum.plus(new Prisma.Decimal(item.unitPrice).mul(item.quantity)), new Prisma.Decimal(0));
  return { version: 1, subtotal: subtotal.toFixed(3), items };
}

export function parseOrderCartSnapshot(value: Prisma.JsonValue): OrderCartSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Snapshot panier invalide.");
  const raw = value as Record<string, Prisma.JsonValue>;
  if (raw.version !== 1 || !Array.isArray(raw.items) || raw.items.length === 0 || typeof raw.subtotal !== "string") throw new Error("Snapshot panier invalide.");
  const items = raw.items.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Ligne du snapshot panier invalide.");
    const item = entry as Record<string, Prisma.JsonValue>;
    const required = ["variantId", "productName", "brandName", "reference", "unitPrice"] as const;
    if (required.some((key) => typeof item[key] !== "string" || !String(item[key]).trim())) throw new Error("Ligne du snapshot panier invalide.");
    const quantity = item.quantity;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) throw new Error("Quantité du snapshot panier invalide.");
    let unitPrice: Prisma.Decimal;
    try { unitPrice = new Prisma.Decimal(String(item.unitPrice)); } catch { throw new Error("Prix du snapshot panier invalide."); }
    if (unitPrice.isNegative() || unitPrice.decimalPlaces() > 3) throw new Error("Prix du snapshot panier invalide.");
    const nullable = (key: "modelCode" | "size" | "frameColor" | "lensColor") => {
      if (item[key] === null) return null;
      if (typeof item[key] === "string") return item[key];
      throw new Error("Ligne du snapshot panier invalide.");
    };
    return {
      variantId: String(item.variantId), productName: String(item.productName), brandName: String(item.brandName),
      modelCode: nullable("modelCode"), reference: String(item.reference), size: nullable("size"),
      frameColor: nullable("frameColor"), lensColor: nullable("lensColor"), unitPrice: unitPrice.toFixed(3), quantity,
    };
  });
  const calculated = items.reduce((sum, item) => sum.plus(new Prisma.Decimal(item.unitPrice).mul(item.quantity)), new Prisma.Decimal(0));
  let storedSubtotal: Prisma.Decimal;
  try { storedSubtotal = new Prisma.Decimal(raw.subtotal); } catch { throw new Error("Sous-total du snapshot panier invalide."); }
  if (!calculated.equals(storedSubtotal)) throw new Error("Le sous-total du snapshot panier est incohérent.");
  return { version: 1, subtotal: calculated.toFixed(3), items };
}

export function orderCartSnapshotTotal(snapshot: OrderCartSnapshot, deliveryFee: number | Prisma.Decimal) {
  return new Prisma.Decimal(snapshot.subtotal).plus(deliveryFee);
}

export type UpdatedCartPricing = { items: { id: string; quantity: number; unitPrice: number }[]; subtotal: number; total: number };
export function updatedCartPricing(cart: Awaited<ReturnType<typeof getOrderableCart>>, deliveryFee: number): UpdatedCartPricing {
  const subtotal = cartSubtotal(cart);
  return { items: cart.items.map((item) => ({ id: item.id, quantity: item.quantity, unitPrice: Number(item.unitPrice) })), subtotal, total: subtotal + deliveryFee };
}

export class CartPriceUpdatedError extends Error {
  constructor(public readonly pricing: UpdatedCartPricing) {
    super("Le prix de certains articles a été mis à jour. Vérifiez votre panier avant de continuer.");
  }
}

export function orderConfirmationPath(orderNumber: string, publicToken: string) {
  return `/commande/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(publicToken)}`;
}

export async function finalizeOrderFromCart(input: { cartId: string; customerSnapshot: Prisma.InputJsonObject; fulfillmentSnapshot: Prisma.InputJsonObject; paymentMethod: string; paymentStatus?: string; externalPaymentId?: string; deliveryFee: number }) {
  const cart = await getOrderableCart(input.cartId);
  if (cart.priceUpdated) throw new CartPriceUpdatedError(updatedCartPricing(cart, input.deliveryFee));
  const total = cartSubtotal(cart) + input.deliveryFee;
  const orderNumber = `IR-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
  const publicToken = randomBytes(32).toString("base64url");
  await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      if (item.variant.stock !== null) {
        const changed = await tx.product.updateMany({ where: { id: item.variantId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (changed.count !== 1) throw new Error(`Stock insuffisant pour ${item.variant.name}.`);
      }
    }

    const currentProducts = await tx.product.findMany({
      where: { id: { in: cart.items.map((item) => item.variantId) } },
      select: { id: true, price: true },
    });
    const currentPrices = new Map(currentProducts.map((product) => [product.id, product.price]));
    for (const item of cart.items) {
      if (!currentPrices.has(item.variantId)) throw new Error(`${item.variant.name} n’est plus disponible.`);
    }
    const priceChanged = cart.items.some((item) => !new Prisma.Decimal(item.unitPrice).equals(currentPrices.get(item.variantId)!));
    if (priceChanged) {
      const repricedItems = cart.items.map((item) => ({ id: item.id, quantity: item.quantity, unitPrice: Number(currentPrices.get(item.variantId)!) }));
      const repricedSubtotal = cart.items.reduce((sum, item) => sum.plus(currentPrices.get(item.variantId)!.mul(item.quantity)), new Prisma.Decimal(0));
      throw new CartPriceUpdatedError({ items: repricedItems, subtotal: Number(repricedSubtotal), total: Number(repricedSubtotal.plus(input.deliveryFee)) });
    }

    await tx.order.create({ data: { number: orderNumber, publicToken, status: "NEW", customerSnapshot: input.customerSnapshot, fulfillmentSnapshot: input.fulfillmentSnapshot, paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, externalPaymentId: input.externalPaymentId, total, items: { create: cart.items.map((item) => ({ variantId: item.variantId, productName: item.variant.name, brandName: item.variant.brand.name, modelCode: item.variant.productModel?.code ?? null, reference: item.variant.variantReference ?? item.variant.reference, size: item.variant.size, frameColor: item.variant.frameColorFamily ?? item.variant.frameColorLabel ?? item.variant.color, lensColor: item.variant.lensColorFamily ?? item.variant.lensColorLabel, unitPrice: item.unitPrice, quantity: item.quantity })) } } });
    await writeAuditLog(tx, { category: "ORDERS", action: "order.create", entityType: "Order", entityId: orderNumber, after: { number: orderNumber, total, payment: input.paymentMethod } });
    await tx.cart.delete({ where: { id: cart.id } });
  });
  return { orderNumber, publicToken, total };
}

export async function finalizeOrderFromSnapshot(input: { cartId: string; snapshot: OrderCartSnapshot; customerSnapshot: Prisma.InputJsonObject; fulfillmentSnapshot: Prisma.InputJsonObject; paymentMethod: string; paymentStatus: string; externalPaymentId: string; total: Prisma.Decimal }) {
  const orderNumber = `IR-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
  const publicToken = randomBytes(32).toString("base64url");
  await prisma.$transaction(async (tx) => {
    for (const item of input.snapshot.items) {
      const variant = await tx.product.findUnique({ where: { id: item.variantId }, select: { stock: true } });
      if (!variant) throw new Error(`${item.productName} n’est plus disponible.`);
      if (variant.stock !== null) {
        const changed = await tx.product.updateMany({ where: { id: item.variantId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (changed.count !== 1) throw new Error(`Stock insuffisant pour ${item.productName}.`);
      }
    }
    await tx.order.create({ data: { number: orderNumber, publicToken, status: "NEW", customerSnapshot: input.customerSnapshot, fulfillmentSnapshot: input.fulfillmentSnapshot, paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, externalPaymentId: input.externalPaymentId, total: input.total, items: { create: input.snapshot.items } } });
    await writeAuditLog(tx, { category: "ORDERS", action: "order.create", entityType: "Order", entityId: orderNumber, after: { number: orderNumber, total: input.total.toString(), payment: input.paymentMethod } });
    await tx.cart.deleteMany({ where: { id: input.cartId } });
  });
  return { orderNumber, publicToken, total: input.total };
}
