"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function toggleMessageHandledAction(id: string, current: boolean) {
  await requirePermission("messages.manage");
  await prisma.contactMessage.update({ where: { id }, data: { handled: !current } });
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(id: string) {
  await requirePermission("messages.manage");
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
}
