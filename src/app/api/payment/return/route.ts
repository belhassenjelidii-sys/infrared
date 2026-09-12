import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { finalizeTndPaymentSession } from "@/lib/tnd-payment-finalization";
import { orderConfirmationPath } from "@/lib/order-finalization";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") ?? "";
  const paymentId = url.searchParams.get("payment_ref") ?? url.searchParams.get("payment_id");
  try {
    if (!sessionId) throw new Error("Retour de paiement invalide.");
    if (paymentId) {
      const existing = await prisma.order.findFirst({ where: { externalPaymentId: paymentId }, select: { number: true, publicToken: true } });
      if (existing) return NextResponse.redirect(new URL(orderConfirmationPath(existing.number, existing.publicToken), url.origin));
    }
    const result = await finalizeTndPaymentSession(sessionId, paymentId);
    (await cookies()).delete(CART_COOKIE);
    return NextResponse.redirect(new URL(orderConfirmationPath(result.orderNumber, result.publicToken), url.origin));
  } catch (error) {
    console.error("TND payment return failed:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL("/checkout?payment=error", url.origin));
  }
}
