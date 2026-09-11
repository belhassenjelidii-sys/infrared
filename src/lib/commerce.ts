import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { commerceSettings, type CommerceSettings } from "@/lib/features";

export const CART_COOKIE = "infrared_cart";

export async function getCommerceSettings(): Promise<CommerceSettings> {
  const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } }).catch(() => null);
  return commerceSettings(row?.features);
}

export async function getCurrentCart() {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  return prisma.cart.findUnique({ where: { id }, include: { items: { orderBy: { id: "asc" }, include: { variant: { include: { brand: true, productModel: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } } } } } });
}

export async function getCartCount() {
  const cart = await getCurrentCart();
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export async function getOrCreateCart() {
  const jar = await cookies();
  const existingId = jar.get(CART_COOKIE)?.value;
  if (existingId) {
    const existing = await prisma.cart.findUnique({ where: { id: existingId }, select: { id: true } });
    if (existing) return existing.id;
  }
  const cart = await prisma.cart.create({ data: {}, select: { id: true } });
  jar.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return cart.id;
}
