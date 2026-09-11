"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CART_COOKIE, getCommerceSettings, getOrCreateCart } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export async function addToCartAction(productId: string, _formData: FormData) {
  void _formData;
  const features = await getCommerceSettings();
  if (!features.cart) redirect("/catalogue");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, price: true, stock: true, available: true, archived: true, published: true } });
  if (!product || product.archived || !product.published || !product.available || Number(product.price) <= 0 || product.stock === 0) redirect("/catalogue");
  const cartId = await getOrCreateCart();
  const current = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId: product.id } } });
  const quantity = product.stock === null ? (current?.quantity ?? 0) + 1 : Math.min(product.stock, (current?.quantity ?? 0) + 1);
  await prisma.cartItem.upsert({ where: { cartId_variantId: { cartId, variantId: product.id } }, create: { cartId, variantId: product.id, quantity, unitPrice: product.price }, update: { quantity, unitPrice: product.price } });
  revalidatePath("/", "layout");
  redirect("/panier");
}

export async function updateCartItemAction(itemId: string, operation: "plus" | "moins" | "remove") {
  if (!(await getCommerceSettings()).cart) redirect("/catalogue");
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) redirect("/panier");
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId }, include: { variant: { select: { stock: true } } } });
  if (!item) redirect("/panier");
  if (operation === "remove" || (operation === "moins" && item.quantity <= 1)) await prisma.cartItem.delete({ where: { id: item.id } });
  else {
    const next = operation === "plus" ? item.quantity + 1 : item.quantity - 1;
    if (item.variant.stock !== null && next <= item.variant.stock) await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: next } });
  }
  revalidatePath("/", "layout");
  revalidatePath("/panier");
}
