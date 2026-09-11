import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login?from=/admin/notifications/commandes", request.url));
  if (!can(user, "orders.view")) return NextResponse.redirect(new URL("/admin/acces-refuse", request.url));
  await prisma.user.update({
    where: { id: user.userId },
    data: { orderNotificationsSeenAt: new Date() },
  });
  return NextResponse.redirect(new URL("/admin/commandes?status=NEW", request.url));
}
