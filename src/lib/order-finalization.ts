import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getOrderableCart(cartId: string) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: { include: { variant: { include: { brand: true, productModel: true } } } } } });
  if (!cart?.items.length) throw new Error("Votre panier est vide.");
  for (const item of cart.items) {
    if (!item.variant.available || item.variant.archived || !item.variant.published || (item.variant.stock !== null && item.variant.stock < item.quantity)) throw new Error(`${item.variant.name} n’est plus disponible dans la quantité demandée.`);
  }
  return cart;
}

export function cartSubtotal(cart: Awaited<ReturnType<typeof getOrderableCart>>) {
  return cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
}

export function orderConfirmationPath(orderNumber: string, publicToken: string) {
  return `/commande/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(publicToken)}`;
}

export async function finalizeOrderFromCart(input: { cartId: string; customerSnapshot: Prisma.InputJsonObject; fulfillmentSnapshot: Prisma.InputJsonObject; paymentMethod: string; paymentStatus?: string; externalPaymentId?: string; deliveryFee: number }) {
  const cart = await getOrderableCart(input.cartId);
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
    await tx.order.create({ data: { number: orderNumber, publicToken, status: "NEW", customerSnapshot: input.customerSnapshot, fulfillmentSnapshot: input.fulfillmentSnapshot, paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, externalPaymentId: input.externalPaymentId, total, items: { create: cart.items.map((item) => ({ variantId: item.variantId, productName: item.variant.name, brandName: item.variant.brand.name, modelCode: item.variant.productModel?.code ?? null, reference: item.variant.variantReference ?? item.variant.reference, size: item.variant.size, frameColor: item.variant.frameColorFamily ?? item.variant.frameColorLabel ?? item.variant.color, lensColor: item.variant.lensColorFamily ?? item.variant.lensColorLabel, unitPrice: item.unitPrice, quantity: item.quantity })) } } });
    await tx.auditLog.create({ data: { action: "order.create", entityType: "Order", entityId: orderNumber, after: { number: orderNumber, total, payment: input.paymentMethod } } });
    await tx.cart.delete({ where: { id: cart.id } });
  });
  return { orderNumber, publicToken, total };
}
