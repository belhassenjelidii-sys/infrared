"use server";
import { can } from "@/lib/permissions";


import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";
import {
  getOptionalText,
  LIMITS,
  validateAccentColor,
  validateEmail,
  validateOptionalAssetUrl,
  validateOptionalUrl,
  validateStoredAssetUrl,
  parseIntRange,
} from "@/lib/validation";
import { encryptSecret } from "@/lib/secrets";
import { sendEmail, type SmtpProvider } from "@/lib/email";

export async function updateSettingsAction(formData: FormData) {
  const actor = await requirePermission("content.manage");
  const existing = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } });

  const heroImageUrl = validateOptionalAssetUrl(formData.get("heroImageUrl"), "Image du Hero", LIMITS.imageUrl);

  const hoursWeekdays = String(formData.get("hoursWeekdays") || "").trim();
  const hoursSunday = String(formData.get("hoursSunday") || "").trim();
  const hoursJson =
    hoursWeekdays || hoursSunday
      ? JSON.stringify(
          [
            hoursWeekdays ? { day: "Lundi – Samedi", hours: hoursWeekdays } : null,
            hoursSunday ? { day: "Dimanche", hours: hoursSunday } : null,
          ].filter(Boolean)
        )
      : null;

  const aboutStats = [0, 1, 2]
    .map((i) => ({
      title: String(formData.get(`aboutStatTitle${i}`) || "").trim(),
      text: String(formData.get(`aboutStatText${i}`) || "").trim(),
    }))
    .filter((stat) => stat.title || stat.text);
  const aboutStatsJson = aboutStats.length > 0 ? JSON.stringify(aboutStats) : null;

  const data = {
    hoursJson,
    aboutEyebrow: getOptionalText(formData, "aboutEyebrow", 160),
    aboutTitle: getOptionalText(formData, "aboutTitle", 200),
    aboutText: getOptionalText(formData, "aboutText", 3000),
    aboutStatsJson,
    aboutEnabled: formData.get("aboutEnabled") === "on",
    heroTitle: getOptionalText(formData, "heroTitle", 200),
    heroSubtitle: getOptionalText(formData, "heroSubtitle", 500),
    heroCtaLabel: getOptionalText(formData, "heroCtaLabel", 100),
    accentColor: validateAccentColor(formData.get("accentColor")),
    heroImageUrl,
    heroVideoUrl: validateOptionalAssetUrl(formData.get("heroVideoUrl"), "Vidéo du Hero", LIMITS.mapsUrl),
    heroMediaType: String(formData.get("heroMediaType") || "image") === "video" ? "video" : "image",
    heroMediaScale: parseIntRange(formData.get("heroMediaScale"), "Taille du média Hero", 80, 160, 125),
    heroMediaX: parseIntRange(formData.get("heroMediaX"), "Position horizontale du Hero", -60, 60, 0),
    heroMediaY: parseIntRange(formData.get("heroMediaY"), "Position verticale du Hero", -60, 60, 0),
    categoryTitleSolaires: getOptionalText(formData, "categoryTitleSolaires", 160),
    categoryTitleOptiques: getOptionalText(formData, "categoryTitleOptiques", 160),
    categoryTitleNouveautes: getOptionalText(formData, "categoryTitleNouveautes", 160),
    homeTrendEyebrow: getOptionalText(formData, "homeTrendEyebrow", 160),
    homeTrendTitle: getOptionalText(formData, "homeTrendTitle", 200),
    homeTrendProductIds: JSON.stringify(String(formData.get("homeTrendProductIds") || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 2)),
    ...(can(actor,"prices.edit") ? { showPrices: formData.get("showPrices") === "on" } : {}),
    phone: getOptionalText(formData, "phone", LIMITS.phone),
    whatsapp: getOptionalText(formData, "whatsapp", LIMITS.phone),
    instagram: getOptionalText(formData, "instagram", 500),
    facebook: getOptionalText(formData, "facebook", 500),
    address: getOptionalText(formData, "address", LIMITS.address),
    mapsUrl: validateOptionalUrl(formData.get("mapsUrl"), "Lien Google Maps"),
    logoUrl: validateOptionalAssetUrl(formData.get("logoUrl"), "Logo", LIMITS.imageUrl),
    logoHeight: parseIntRange(formData.get("logoHeight"), "Taille du logo", 28, 80, 42),
  };

  try {
    if (existing) {
      await prisma.storeSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.storeSettings.create({ data: { singletonKey: "main", ...data } });
    }
  } catch (error) {
    console.error("updateSettingsAction failed:", error);
    throw new Error(
      "Échec de l'enregistrement des paramètres — la base de données n'est probablement pas à jour. " +
        "Exécutez `npx prisma migrate deploy` puis réessayez."
    );
  }

  const referencedAfterSave = new Set([data.heroImageUrl, data.heroVideoUrl].filter(Boolean));
  if (existing?.heroImageUrl && existing.heroImageUrl !== heroImageUrl && !referencedAfterSave.has(existing.heroImageUrl)) {
    await deleteUploadedImageIfUnreferenced(existing.heroImageUrl);
  }
  if (existing?.heroVideoUrl && existing.heroVideoUrl !== data.heroVideoUrl && !referencedAfterSave.has(existing.heroVideoUrl)) {
    await deleteUploadedImageIfUnreferenced(existing.heroVideoUrl);
  }

  revalidatePath("/admin/parametres");
  revalidatePath("/", "layout");
  revalidatePath("/catalogue");
  revalidatePath("/promotions");
  revalidatePath("/nouveautes");
  revalidatePath("/boutique");
  revalidatePath("/contact");
  revalidatePath("/produit", "layout");
}

export async function updateHeroMediaLayoutAction(input: { scale: number; x: number; y: number }) {
  await requirePermission("content.manage");
  const scale = Number.isInteger(input.scale) ? input.scale : NaN;
  const x = Number.isInteger(input.x) ? input.x : NaN;
  const y = Number.isInteger(input.y) ? input.y : NaN;
  if (!Number.isSafeInteger(scale) || scale < 80 || scale > 160) throw new Error("Taille du média Hero invalide.");
  if (!Number.isSafeInteger(x) || x < -60 || x > 60) throw new Error("Position horizontale du Hero invalide.");
  if (!Number.isSafeInteger(y) || y < -60 || y > 60) throw new Error("Position verticale du Hero invalide.");

  const existing = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } });
  if (existing) {
    await prisma.storeSettings.update({
      where: { id: existing.id },
      data: { heroMediaScale: scale, heroMediaX: x, heroMediaY: y },
    });
  } else {
    await prisma.storeSettings.create({ data: { singletonKey: "main", heroMediaScale: scale, heroMediaX: x, heroMediaY: y } });
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");
}

export async function updateHeroMediaAction(mediaType: "image" | "video", url: string) {
  await requirePermission("content.manage");
  if (mediaType !== "image" && mediaType !== "video") throw new Error("Type de média Hero invalide.");
  const safeUrl = url ? validateStoredAssetUrl(url, "Média du Hero") : "";
  const existing = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } });
  const data =
    mediaType === "video"
      ? { heroMediaType: "video", heroVideoUrl: safeUrl || null }
      : { heroMediaType: "image", heroImageUrl: safeUrl || null };

  const oldUrl = mediaType === "video" ? existing?.heroVideoUrl : existing?.heroImageUrl;

  try {
    if (existing) {
      await prisma.storeSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.storeSettings.create({ data: { singletonKey: "main", ...data } });
    }
  } catch (error) {
    console.error("updateHeroMediaAction failed:", error);
    throw new Error(
      "Échec de l'enregistrement du média du Hero — la base de données n'est probablement pas à jour. " +
        "Exécutez `npx prisma migrate deploy` puis réessayez."
    );
  }

  if (oldUrl && oldUrl !== safeUrl) await deleteUploadedImageIfUnreferenced(oldUrl);

  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");
}

const SMTP_PROVIDER_DEFAULTS: Record<Exclude<SmtpProvider, "custom">, { host: string; port: number; secure: boolean }> = {
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  microsoft365: { host: "smtp.office365.com", port: 587, secure: false },
};

function parseSmtpProvider(value: FormDataEntryValue | null): SmtpProvider {
  const provider = typeof value === "string" ? value : "";
  if (provider === "gmail" || provider === "microsoft365" || provider === "custom") return provider;
  throw new Error("Fournisseur e-mail invalide.");
}

function parseSmtpPort(raw: FormDataEntryValue | null): number {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!/^\d{1,5}$/.test(value)) throw new Error("Port SMTP invalide.");
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port SMTP invalide.");
  return port;
}

function validateSmtpHost(raw: FormDataEntryValue | null): string {
  const host = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!host || host.length > 253 || /\s/.test(host) || /[\\/:?#@]/.test(host)) {
    throw new Error("Serveur SMTP invalide.");
  }
  if (!/^[a-z0-9](?:[a-z0-9-\.]*[a-z0-9])?$/.test(host)) {
    throw new Error("Serveur SMTP invalide.");
  }
  return host;
}

export type SmtpActionState = { ok?: boolean; error?: string; message?: string };

export async function updateSmtpSettingsAction(_previousState: SmtpActionState, formData: FormData): Promise<SmtpActionState> {
  await requirePermission("settings.critical");
  try {
    const provider = parseSmtpProvider(formData.get("smtpProvider"));
    const defaults = provider === "custom" ? null : SMTP_PROVIDER_DEFAULTS[provider];
    const host = defaults?.host ?? validateSmtpHost(formData.get("smtpHost"));
    const port = defaults?.port ?? parseSmtpPort(formData.get("smtpPort"));
    const secure = defaults?.secure ?? formData.get("smtpSecure") === "on";
    const user = validateEmail(formData.get("smtpUser"));
    const fromEmailRaw = typeof formData.get("smtpFromEmail") === "string" ? String(formData.get("smtpFromEmail")).trim() : "";
    const fromEmail = fromEmailRaw ? validateEmail(fromEmailRaw) : user;
    const fromNameRaw = typeof formData.get("smtpFromName") === "string" ? String(formData.get("smtpFromName")).trim() : "";
    if (fromNameRaw.length > 120) throw new Error("Nom d'expéditeur trop long.");
    if (/[\r\n]/.test(fromNameRaw)) throw new Error("Nom d'expéditeur invalide.");

    const existing = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { id: true, smtpPasswordEncrypted: true } });
    const password = typeof formData.get("smtpPassword") === "string" ? String(formData.get("smtpPassword")) : "";
    if (!password && !existing?.smtpPasswordEncrypted) {
      throw new Error("Mot de passe SMTP obligatoire lors de la première configuration.");
    }

    const data = {
      smtpProvider: provider,
      smtpHost: host,
      smtpPort: port,
      smtpSecure: secure,
      smtpUser: user,
      smtpPasswordEncrypted: password ? encryptSecret(password) : existing?.smtpPasswordEncrypted ?? null,
      smtpFromEmail: fromEmail,
      smtpFromName: fromNameRaw || "InfraRed Optic-Store",
    };

    if (existing) {
      await prisma.storeSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.storeSettings.create({ data: { singletonKey: "main", ...data } });
    }

    revalidatePath("/admin/parametres");
    return { ok: true, message: "Configuration e-mail enregistrée." };
  } catch (error) {
    console.error("updateSmtpSettingsAction failed:", error);
    return { error: error instanceof Error ? error.message : "Impossible d'enregistrer la configuration e-mail." };
  }
}

export async function sendSmtpTestEmailAction(): Promise<SmtpActionState> {
  const session = await requirePermission("settings.critical");
  await sendEmail({
    to: session.email,
    subject: "Test SMTP — InfraRed Optic-Store",
    html: "<h2>Test réussi</h2><p>La configuration SMTP du site InfraRed Optic-Store fonctionne correctement.</p>",
  });
  return { ok: true, message: `E-mail de test envoyé à ${session.email}.` };
}
