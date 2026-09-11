"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { optionalNumber } from "@/lib/catalogue-fields";
import { adminError } from "@/lib/admin-errors";
import type { ActionResult } from "@/components/ActionForm";
import { DEFAULT_FEATURES } from "@/lib/features";
import type { Prisma } from "@prisma/client";
import { encryptSecret } from "@/lib/secrets";
import { getTndPaymentConfig, PAYMENT_PROVIDER_LABELS, TND_PAYMENT_PROVIDERS, type TndPaymentProvider } from "@/lib/tnd-payment";

export async function updateLowStockThresholdAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.manage");
  try {
    const threshold = optionalNumber(formData.get("lowStockThreshold"), "Seuil de stock faible", 0, 1000);
    if (threshold === null) throw new Error("Renseignez le seuil de stock faible.");
    const previous = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { lowStockThreshold: true } });
    await prisma.$transaction(async (tx) => {
      await tx.storeSettings.upsert({ where: { singletonKey: "main" }, create: { singletonKey: "main", lowStockThreshold: threshold }, update: { lowStockThreshold: threshold } });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "settings.lowStockThreshold.update", entityType: "StoreSettings", entityId: "main", before: { lowStockThreshold: previous?.lowStockThreshold ?? 5 }, after: { lowStockThreshold: threshold } } });
    });
    revalidatePath("/admin", "layout");
    return { success: "Seuil de stock faible enregistré." };
  } catch (error) {
    return { error: adminError(error) };
  }
}

export async function updateCommerceSettingsAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.critical");
  try {
    const features = Object.fromEntries(Object.keys(DEFAULT_FEATURES).map((key) => [key, formData.get(key) === "on"]));
    const deliveryFee = optionalNumber(formData.get("deliveryFee"), "Prix de livraison", 0, 1000) ?? 0;
    if (features.checkout && (!features.cart || !features.orders)) throw new Error("Le checkout nécessite le panier et les commandes.");
    if (features.checkout && !features.delivery && !features.storePickup) throw new Error("Activez la livraison ou le retrait en boutique pour le checkout.");
    if (features.checkout && !features.cashOnDelivery && !features.storePickup && !features.onlinePayment) throw new Error("Activez au moins un mode de paiement.");
    if (features.delivery && !features.cashOnDelivery && !features.onlinePayment) throw new Error("La livraison nécessite un mode de paiement actif.");
    const previous = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true, paymentProvider: true, paymentPublicKey: true, paymentSecretEncrypted: true, paymentMerchantId: true, paymentApiBaseUrl: true } });
    if (features.onlinePayment && !paymentGatewayReady(previous)) throw new Error("Configurez d’abord une passerelle TND dans Paiement.");
    const previousObject = previous?.features && typeof previous.features === "object" && !Array.isArray(previous.features) ? previous.features as Record<string,unknown> : {};
    const next = { ...previousObject, ...features, deliveryFee } as Prisma.InputJsonObject;
    await prisma.$transaction(async (tx) => {
      await tx.storeSettings.upsert({ where: { singletonKey: "main" }, create: { singletonKey: "main", features: next }, update: { features: next } });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "settings.commerce.update", entityType: "StoreSettings", entityId: "main", before: previousObject as Prisma.InputJsonObject, after: next } });
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    return { success: "Configuration e-commerce enregistrée." };
  } catch (error) {
    return { error: adminError(error) };
  }
}

function paymentMode(value: FormDataEntryValue | null) {
  if (value === "sandbox" || value === "live") return value;
  throw new Error("Environnement de paiement invalide.");
}

function paymentGatewayReady(row: { paymentProvider: string | null; paymentPublicKey: string | null; paymentSecretEncrypted: string | null; paymentMerchantId: string | null; paymentApiBaseUrl: string | null } | null) {
  if (!row || !TND_PAYMENT_PROVIDERS.includes(row.paymentProvider as TndPaymentProvider) || !row.paymentSecretEncrypted) return false;
  if (row.paymentProvider === "FLOUCI") return Boolean(row.paymentPublicKey);
  if (row.paymentProvider === "KONNECT") return Boolean(row.paymentMerchantId);
  return false;
}

export async function updatePaymentGatewayAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("payments.manage");
  try {
    const provider = String(formData.get("paymentProvider") ?? "") as TndPaymentProvider;
    if (!TND_PAYMENT_PROVIDERS.includes(provider)) throw new Error("Choisissez Flouci, Konnect ou ClickToPay.");
    const mode = paymentMode(formData.get("paymentMode"));
    const publicKey = String(formData.get("paymentPublicKey") ?? "").trim() || null;
    const merchantId = String(formData.get("paymentMerchantId") ?? "").trim() || null;
    const apiBaseUrl = String(formData.get("paymentApiBaseUrl") ?? "").trim() || null;
    const secret = String(formData.get("paymentSecret") ?? "").trim();
    if (publicKey && publicKey.length > 500) throw new Error("Clé publique trop longue.");
    if (merchantId && merchantId.length > 500) throw new Error("Identifiant marchand trop long.");
    if (apiBaseUrl) { try { const url = new URL(apiBaseUrl); if (url.protocol !== "https:") throw new Error(); } catch { throw new Error("URL API HTTPS invalide."); } }
    if (secret.length > 1000) throw new Error("Clé secrète trop longue.");
    const existing = await prisma.storeSettings.findUnique({
      where: { singletonKey: "main" },
      select: { id: true, paymentProvider: true, paymentMode: true, paymentPublicKey: true, paymentMerchantId: true, paymentApiBaseUrl: true, paymentSecretEncrypted: true },
    });
    const switchingProvider = existing?.paymentProvider && existing.paymentProvider !== provider;
    if (!secret && (!existing?.paymentSecretEncrypted || switchingProvider)) throw new Error("La clé secrète/API est obligatoire pour ce fournisseur.");
    if (provider === "FLOUCI" && !publicKey) throw new Error("La clé publique Flouci est obligatoire.");
    if (provider === "KONNECT" && !merchantId) throw new Error("Le Receiver Wallet ID Konnect est obligatoire.");
    if (provider === "CLICKTOPAY" && (!publicKey || !merchantId || !apiBaseUrl)) throw new Error("ClickToPay nécessite l’identifiant API, le terminal marchand et l’URL fournis par votre banque.");
    const data = {
      paymentProvider: provider,
      paymentMode: mode,
      paymentPublicKey: publicKey,
      paymentMerchantId: merchantId,
      paymentApiBaseUrl: apiBaseUrl,
      paymentSecretEncrypted: secret ? encryptSecret(secret) : existing?.paymentSecretEncrypted ?? null,
    };
    await prisma.$transaction(async (tx) => {
      await tx.storeSettings.upsert({ where: { singletonKey: "main" }, create: { singletonKey: "main", ...data }, update: data });
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "settings.paymentGateway.update",
          entityType: "StoreSettings",
          entityId: "main",
          before: existing ? { provider: existing.paymentProvider, mode: existing.paymentMode, publicKey: existing.paymentPublicKey, merchantId: existing.paymentMerchantId, apiBaseUrl: existing.paymentApiBaseUrl, secretConfigured: Boolean(existing.paymentSecretEncrypted) } : undefined,
          after: { provider, mode, publicKey, merchantId, apiBaseUrl, currency: "TND", secretConfigured: true },
        },
      });
    });
    revalidatePath("/admin/configuration");
    return { success: `${PAYMENT_PROVIDER_LABELS[provider]} ${mode === "sandbox" ? "Sandbox" : "Live"} enregistré en TND. La clé secrète est chiffrée.` };
  } catch (error) {
    return { error: adminError(error) };
  }
}

export async function testPaymentGatewayAction(): Promise<ActionResult> {
  await requirePermission("payments.manage");
  try {
    const config = await getTndPaymentConfig();
    return { success: `${PAYMENT_PROVIDER_LABELS[config.provider]} est prêt en ${config.mode === "live" ? "Live" : "Sandbox"}, devise TND. Aucun paiement n’a été effectué.` };
  } catch (error) {
    return { error: adminError(error) };
  }
}

export async function updatePaymentOptionsAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("payments.manage");
  try {
    const cashOnDelivery = formData.get("cashOnDelivery") === "on";
    const onlinePayment = formData.get("onlinePayment") === "on";
    const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true, paymentProvider: true, paymentPublicKey: true, paymentSecretEncrypted: true, paymentMerchantId: true, paymentApiBaseUrl: true } });
    const previous = row?.features && typeof row.features === "object" && !Array.isArray(row.features) ? row.features as Record<string, unknown> : {};
    if (onlinePayment && !paymentGatewayReady(row)) throw new Error("Enregistrez une passerelle Flouci ou Konnect complète avant d’activer le paiement en ligne.");
    const next = { ...previous, cashOnDelivery, onlinePayment } as Prisma.InputJsonObject;
    await prisma.$transaction(async (tx) => {
      await tx.storeSettings.upsert({ where: { singletonKey: "main" }, create: { singletonKey: "main", features: next }, update: { features: next } });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "settings.paymentOptions.update", entityType: "StoreSettings", entityId: "main", before: { cashOnDelivery: previous.cashOnDelivery === true, onlinePayment: previous.onlinePayment === true }, after: { cashOnDelivery, onlinePayment } } });
    });
    revalidatePath("/admin", "layout");
    return { success: "Modes de paiement enregistrés." };
  } catch (error) { return { error: adminError(error) }; }
}

function optionalText(formData: FormData, name: string, max: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > max) throw new Error(`${name} est trop long.`);
  return value || null;
}

export async function updateDeliverySettingsAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.critical");
  try {
    const delivery = formData.get("delivery") === "on";
    const storePickup = formData.get("storePickup") === "on";
    const deliveryFee = optionalNumber(formData.get("deliveryFee"), "Prix de livraison", 0, 1000) ?? 0;
    const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } });
    const previous = row?.features && typeof row.features === "object" && !Array.isArray(row.features) ? row.features as Record<string, unknown> : {};
    if (previous.checkout === true && !delivery && !storePickup) throw new Error("Le checkout actif nécessite la livraison ou le retrait en boutique.");
    if (delivery && previous.cashOnDelivery !== true && previous.onlinePayment !== true) throw new Error("Activez un mode de paiement avant la livraison.");
    const website = optionalText(formData, "deliveryCompanyWebsite", 500);
    if (website) { try { const url = new URL(website); if (!['http:','https:'].includes(url.protocol)) throw new Error(); } catch { throw new Error("Lien de la société de livraison invalide."); } }
    const data = { deliveryCompanyName: optionalText(formData, "deliveryCompanyName", 120), deliveryCompanyPhone: optionalText(formData, "deliveryCompanyPhone", 40), deliveryCompanyWebsite: website, deliveryCompanyAccount: optionalText(formData, "deliveryCompanyAccount", 120) };
    const next = { ...previous, delivery, storePickup, deliveryFee } as Prisma.InputJsonObject;
    await prisma.$transaction(async (tx) => {
      await tx.storeSettings.upsert({ where: { singletonKey: "main" }, create: { singletonKey: "main", features: next, ...data }, update: { features: next, ...data } });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "settings.delivery.update", entityType: "StoreSettings", entityId: "main", after: { delivery, storePickup, deliveryFee, company: data.deliveryCompanyName } } });
    });
    revalidatePath("/admin", "layout");
    return { success: "Livraison et société de livraison enregistrées." };
  } catch (error) { return { error: adminError(error) }; }
}
