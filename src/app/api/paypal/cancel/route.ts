import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session");
  if (sessionId) await prisma.onlinePaymentSession.deleteMany({ where: { id: sessionId } });
  return NextResponse.redirect(new URL("/checkout?paypal=cancelled", url.origin));
}
