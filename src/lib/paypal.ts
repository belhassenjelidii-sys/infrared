import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

export type PayPalConfig = {
  mode: "sandbox" | "live";
  clientId: string;
  clientSecret: string;
  currency: "EUR" | "USD";
  tndPerUnit: number;
};

export async function getPayPalConfig(): Promise<PayPalConfig> {
  const row = await prisma.storeSettings.findUnique({
    where: { singletonKey: "main" },
    select: { paymentProvider: true, paymentMode: true, paypalClientId: true, paypalClientSecretEncrypted: true, paypalCurrency: true, paypalTndPerUnit: true },
  });
  const rate = Number(row?.paypalTndPerUnit ?? 0);
  if (row?.paymentProvider !== "PAYPAL" || !row.paypalClientId || !row.paypalClientSecretEncrypted || !(rate > 0)) {
    throw new Error("La passerelle PayPal n’est pas complètement configurée.");
  }
  return {
    mode: row.paymentMode === "live" ? "live" : "sandbox",
    clientId: row.paypalClientId,
    clientSecret: decryptSecret(row.paypalClientSecretEncrypted),
    currency: row.paypalCurrency === "USD" ? "USD" : "EUR",
    tndPerUnit: rate,
  };
}

export async function getPayPalPublicStatus() {
  const row = await prisma.storeSettings.findUnique({
    where: { singletonKey: "main" },
    select: { paymentProvider: true, paymentMode: true, paypalClientId: true, paypalClientSecretEncrypted: true, paypalCurrency: true, paypalTndPerUnit: true },
  }).catch(() => null);
  const rate = Number(row?.paypalTndPerUnit ?? 0);
  return {
    ready: row?.paymentProvider === "PAYPAL" && Boolean(row.paypalClientId && row.paypalClientSecretEncrypted) && rate > 0,
    mode: row?.paymentMode === "live" ? "live" as const : "sandbox" as const,
    currency: row?.paypalCurrency === "USD" ? "USD" as const : "EUR" as const,
    tndPerUnit: rate,
  };
}

function apiBase(mode: PayPalConfig["mode"]) {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken(config: PayPalConfig) {
  const response = await fetch(`${apiBase(config.mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Connexion PayPal refusée (HTTP ${response.status}). Vérifiez les clés et le mode Sandbox/Live.`);
  const result = await response.json() as { access_token?: string };
  if (!result.access_token) throw new Error("PayPal n’a pas retourné de jeton d’accès.");
  return result.access_token;
}

export async function createPayPalOrder(input: { config: PayPalConfig; amount: string; reference: string; returnUrl: string; cancelUrl: string }) {
  const accessToken = await getPayPalAccessToken(input.config);
  const response = await fetch(`${apiBase(input.config.mode)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation", "PayPal-Request-Id": input.reference },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ reference_id: input.reference, custom_id: input.reference, amount: { currency_code: input.config.currency, value: input.amount } }],
      payment_source: { paypal: { experience_context: { user_action: "PAY_NOW", return_url: input.returnUrl, cancel_url: input.cancelUrl } } },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as { id?: string; links?: Array<{ rel?: string; href?: string }>; message?: string };
  const approvalUrl = result.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!response.ok || !result.id || !approvalUrl) throw new Error(`PayPal n’a pas pu préparer le paiement${result.message ? ` : ${result.message}` : "."}`);
  return { id: result.id, approvalUrl };
}

export async function capturePayPalOrder(config: PayPalConfig, paypalOrderId: string) {
  const accessToken = await getPayPalAccessToken(config);
  const response = await fetch(`${apiBase(config.mode)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: "{}",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as { status?: string; purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> } }> ; message?: string };
  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  if (!response.ok || result.status !== "COMPLETED" || capture?.status !== "COMPLETED" || !capture.id) throw new Error(`Le paiement PayPal n’a pas été confirmé${result.message ? ` : ${result.message}` : "."}`);
  return { captureId: capture.id, currency: capture.amount?.currency_code ?? "", amount: capture.amount?.value ?? "" };
}
