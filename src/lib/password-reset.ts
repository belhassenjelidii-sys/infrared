import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { hashToken, randomToken } from "@/lib/secrets";
import bcrypt from "bcryptjs";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getPublicSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL doit être configurée en production pour les liens de réinitialisation.");
  }

  // Local-development fallback only. In production we deliberately do not
  // trust the incoming Host header when constructing password-reset links.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto === "https" ? "https" : "http";
  if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) return `${protocol}://${host}`;
  return "http://localhost:3000";
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, active: true },
  });
  if (!user?.active) return;

  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < 60_000) return;

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const created = await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  try {
    const baseUrl = await getPublicSiteUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const safeName = escapeHtml(user.name || "");
    await sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe — InfraRed Optic-Store",
      html: `<!doctype html><html lang="fr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        <h2>Mot de passe oublié</h2>
        <p>Bonjour ${safeName},</p>
        <p>Une demande de réinitialisation du mot de passe de votre compte InfraRed Optic-Store a été reçue.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#E0122C;color:#fff;text-decoration:none;border-radius:8px">Créer un nouveau mot de passe</a></p>
        <p>Ce lien est valable pendant 1 heure et ne peut être utilisé qu'une seule fois.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
      </body></html>`,
    });
  } catch (error) {
    await prisma.passwordResetToken.delete({ where: { id: created.id } }).catch(() => undefined);
    throw error;
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const tokenHash = hashToken(token);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, active: true } } },
    });

    if (!record || record.usedAt || record.expiresAt <= now || !record.user.active) {
      throw new Error("Ce lien de réinitialisation est invalide ou expiré.");
    }

    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) {
      throw new Error("Ce lien de réinitialisation est invalide ou a déjà été utilisé.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await tx.user.update({
      where: { id: record.user.id },
      data: { passwordHash, authVersion: { increment: 1 } },
    });

    await tx.passwordResetToken.deleteMany({
      where: { userId: record.user.id, id: { not: record.id } },
    });
  });
}
