import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeTndPaymentSession } from "@/lib/tnd-payment-finalization";

async function handle(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("payment_ref")
    ?? url.searchParams.get("payment_id")
    ?? (typeof body?.payment_ref === "string" ? body.payment_ref : null)
    ?? (typeof body?.payment_id === "string" ? body.payment_id : null);
  if (!paymentId) return NextResponse.json({ error: "Référence absente." }, { status: 400 });
  const session = await prisma.onlinePaymentSession.findFirst({
    where: { OR: [{ externalPaymentId: paymentId }, { paypalOrderId: paymentId }] },
    select: { id: true },
  });
  if (!session) {
    const existing = await prisma.order.findFirst({ where: { externalPaymentId: paymentId }, select: { id: true } });
    return existing ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Session inconnue." }, { status: 404 });
  }
  try {
    await finalizeTndPaymentSession(session.id, paymentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("TND payment webhook failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}

export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  return handle(request, body);
}
