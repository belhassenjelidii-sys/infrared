import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeTndPaymentSession } from "@/lib/tnd-payment-finalization";

const TEMPORARY_DATABASE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "P2034"]);

function isTemporaryFailure(error: unknown) {
  if (!(error instanceof Error)) return false;
  const details = error as Error & { code?: unknown; cause?: unknown };
  if (typeof details.code === "string" && TEMPORARY_DATABASE_CODES.has(details.code)) return true;
  const cause = details.cause && typeof details.cause === "object"
    ? details.cause as { code?: unknown; message?: unknown }
    : null;
  const text = [
    details.name,
    details.message,
    typeof cause?.code === "string" ? cause.code : "",
    typeof cause?.message === "string" ? cause.message : "",
  ].join(" ");
  return /TimeoutError|AbortError|fetch failed|network|ECONN|ENOTFOUND|EAI_AGAIN|socket|HTTP (?:408|425|429|500|502|503|504)\b/i.test(text);
}

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
    if (isTemporaryFailure(error)) {
      return NextResponse.json({ error: "Traitement temporairement indisponible." }, { status: 503 });
    }
    return NextResponse.json({ error: "Notification de paiement invalide." }, { status: 400 });
  }
}

export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  return handle(request, body);
}
