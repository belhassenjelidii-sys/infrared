import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

export const TND_PAYMENT_PROVIDERS = ["FLOUCI", "KONNECT", "CLICKTOPAY"] as const;
export type TndPaymentProvider = (typeof TND_PAYMENT_PROVIDERS)[number];

export const PAYMENT_PROVIDER_LABELS: Record<TndPaymentProvider, string> = {
  FLOUCI: "Flouci",
  KONNECT: "Konnect",
  CLICKTOPAY: "ClickToPay (SMT)",
};

type PaymentMode = "sandbox" | "live";
const PAYMENT_REQUEST_TIMEOUT_MS = 10_000;
const PAYMENT_API_HOSTS: Partial<Record<TndPaymentProvider, readonly string[]>> = {
  FLOUCI: ["developers.flouci.com"],
  KONNECT: ["api.konnect.network", "api.sandbox.konnect.network"],
};

export type TndPaymentConfig = {
  provider: TndPaymentProvider;
  mode: PaymentMode;
  publicKey: string | null;
  secret: string;
  merchantId: string | null;
  apiBaseUrl: string;
};

function isProvider(value: string | null | undefined): value is TndPaymentProvider {
  return TND_PAYMENT_PROVIDERS.includes(value as TndPaymentProvider);
}

function defaultApiBase(provider: TndPaymentProvider, mode: PaymentMode) {
  if (provider === "FLOUCI") return "https://developers.flouci.com/api/v2";
  if (provider === "KONNECT") {
    return mode === "live"
      ? "https://api.konnect.network/api/v2"
      : "https://api.sandbox.konnect.network/api/v2";
  }
  return "";
}

function validatedApiBaseUrl(provider: TndPaymentProvider, value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("L’URL de la passerelle de paiement est invalide.");
  }
  if (url.protocol !== "https:") throw new Error("La passerelle de paiement doit utiliser HTTPS.");
  const allowedHosts = PAYMENT_API_HOSTS[provider];
  if (allowedHosts && !allowedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error("Le domaine de la passerelle de paiement n’est pas autorisé.");
  }
  return url.toString().replace(/\/$/, "");
}

async function withPaymentTimeout<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("La passerelle de paiement ne répond pas. Veuillez réessayer.");
    }
    throw error;
  }
}

function configurationReady(row: {
  paymentProvider: string | null;
  paymentPublicKey: string | null;
  paymentSecretEncrypted: string | null;
  paymentMerchantId: string | null;
  paymentApiBaseUrl: string | null;
}) {
  if (!isProvider(row.paymentProvider) || !row.paymentSecretEncrypted) return false;
  if (row.paymentProvider === "FLOUCI") return Boolean(row.paymentPublicKey);
  if (row.paymentProvider === "KONNECT") return Boolean(row.paymentMerchantId);
  // ClickToPay contracts expose different API profiles. Keep the credentials
  // editable but do not take money until the bank-provided endpoint is known.
  return Boolean(row.paymentPublicKey && row.paymentMerchantId && row.paymentApiBaseUrl);
}

export async function getTndPaymentPublicStatus() {
  const row = await prisma.storeSettings.findUnique({
    where: { singletonKey: "main" },
    select: {
      paymentProvider: true,
      paymentMode: true,
      paymentPublicKey: true,
      paymentSecretEncrypted: true,
      paymentMerchantId: true,
      paymentApiBaseUrl: true,
    },
  });
  const provider = isProvider(row?.paymentProvider) ? row.paymentProvider : null;
  const configured = row ? configurationReady(row) : false;
  return {
    provider,
    label: provider ? PAYMENT_PROVIDER_LABELS[provider] : null,
    mode: row?.paymentMode === "live" ? "live" as const : "sandbox" as const,
    currency: "TND" as const,
    ready: configured && provider !== "CLICKTOPAY",
    configured,
    requiresClickToPayProfile: provider === "CLICKTOPAY" && configured,
  };
}

export async function getTndPaymentConfig(): Promise<TndPaymentConfig> {
  const row = await prisma.storeSettings.findUnique({
    where: { singletonKey: "main" },
    select: {
      paymentProvider: true,
      paymentMode: true,
      paymentPublicKey: true,
      paymentSecretEncrypted: true,
      paymentMerchantId: true,
      paymentApiBaseUrl: true,
    },
  });
  if (!row || !configurationReady(row) || !isProvider(row.paymentProvider)) {
    throw new Error("La passerelle de paiement TND n’est pas complètement configurée.");
  }
  const mode: PaymentMode = row.paymentMode === "live" ? "live" : "sandbox";
  const apiBaseUrl = validatedApiBaseUrl(
    row.paymentProvider,
    row.paymentApiBaseUrl || defaultApiBase(row.paymentProvider, mode),
  );
  if (row.paymentProvider === "CLICKTOPAY") {
    throw new Error("ClickToPay nécessite encore le profil API fourni par votre banque/SMT avant son activation.");
  }
  return {
    provider: row.paymentProvider,
    mode,
    publicKey: row.paymentPublicKey,
    secret: decryptSecret(row.paymentSecretEncrypted!),
    merchantId: row.paymentMerchantId,
    apiBaseUrl,
  };
}

async function responseJson(response: Response) {
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = body && typeof body.message === "string" ? ` : ${body.message}` : "";
    throw new Error(`Passerelle de paiement refusée (HTTP ${response.status})${message}.`);
  }
  return body;
}

export async function createTndPayment(input: {
  config: TndPaymentConfig;
  amountTnd: number;
  reference: string;
  customerName: string;
  phone: string;
  email?: string | null;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}) {
  const amountMillimes = Math.round(input.amountTnd * 1000);
  if (!Number.isSafeInteger(amountMillimes) || amountMillimes <= 0) throw new Error("Montant TND invalide.");

  if (input.config.provider === "FLOUCI") {
    const response = await withPaymentTimeout(fetch(`${input.config.apiBaseUrl}/generate_payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.config.publicKey}:${input.config.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: String(amountMillimes),
        developer_tracking_id: input.reference,
        accept_card: true,
        success_link: input.returnUrl,
        fail_link: input.cancelUrl,
        webhook: input.webhookUrl,
        client_id: input.customerName,
        session_timeout_secs: 1800,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(PAYMENT_REQUEST_TIMEOUT_MS),
    }));
    const body = await responseJson(response);
    const result = body?.result as Record<string, unknown> | undefined;
    const externalPaymentId = typeof result?.payment_id === "string" ? result.payment_id : "";
    const approvalUrl = typeof result?.link === "string" ? result.link : "";
    if (!externalPaymentId || !approvalUrl) throw new Error("Flouci n’a pas retourné de lien de paiement.");
    return { externalPaymentId, approvalUrl };
  }

  const [firstName, ...lastParts] = input.customerName.trim().split(/\s+/);
  const response = await withPaymentTimeout(fetch(`${input.config.apiBaseUrl}/payments/init-payment`, {
    method: "POST",
    headers: { "x-api-key": input.config.secret, "Content-Type": "application/json" },
    body: JSON.stringify({
      receiverWalletId: input.config.merchantId,
      token: "TND",
      amount: amountMillimes,
      type: "immediate",
      description: `Commande InfraRed ${input.reference}`,
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      lifespan: 30,
      checkoutForm: true,
      addPaymentFeesToAmount: false,
      firstName,
      lastName: lastParts.join(" ") || firstName,
      phoneNumber: input.phone.replace(/^(?:\+216|00216)/, ""),
      email: input.email || undefined,
      orderId: input.reference,
      webhook: input.webhookUrl,
      silentWebhook: true,
      successUrl: input.returnUrl,
      failUrl: input.cancelUrl,
      theme: "light",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(PAYMENT_REQUEST_TIMEOUT_MS),
  }));
  const body = await responseJson(response);
  const externalPaymentId = typeof body?.paymentRef === "string" ? body.paymentRef : "";
  const approvalUrl = typeof body?.payUrl === "string" ? body.payUrl : "";
  if (!externalPaymentId || !approvalUrl) throw new Error("Konnect n’a pas retourné de lien de paiement.");
  return { externalPaymentId, approvalUrl };
}

export async function verifyTndPayment(config: TndPaymentConfig, externalPaymentId: string) {
  if (config.provider === "FLOUCI") {
    const response = await withPaymentTimeout(fetch(`${config.apiBaseUrl}/verify_payment/${encodeURIComponent(externalPaymentId)}`, {
      headers: { Authorization: `Bearer ${config.publicKey}:${config.secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(PAYMENT_REQUEST_TIMEOUT_MS),
    }));
    const body = await responseJson(response);
    const result = body?.result as Record<string, unknown> | undefined;
    return {
      paid: body?.success === true && result?.status === "SUCCESS",
      amountMillimes: Number(result?.amount ?? NaN),
      currency: "TND" as const,
    };
  }

  const response = await withPaymentTimeout(fetch(`${config.apiBaseUrl}/payments/${encodeURIComponent(externalPaymentId)}`, {
    headers: { "x-api-key": config.secret },
    cache: "no-store",
    signal: AbortSignal.timeout(PAYMENT_REQUEST_TIMEOUT_MS),
  }));
  const body = await responseJson(response);
  const payment = body?.payment as Record<string, unknown> | undefined;
  return {
    paid: payment?.status === "completed",
    amountMillimes: Number(payment?.amount ?? payment?.reachedAmount ?? NaN),
    currency: payment?.token,
  };
}
