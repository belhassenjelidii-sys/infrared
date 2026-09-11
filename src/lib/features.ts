export const DEFAULT_FEATURES = { cart: false, checkout: false, orders: false, onlinePayment: false, cashOnDelivery: false, delivery: false, storePickup: false } as const;
export type Features = { [K in keyof typeof DEFAULT_FEATURES]: boolean };
export type CommerceSettings = Features & { deliveryFee: number };

export function effectiveFeatures(config: unknown): Features {
  const value = config && typeof config === "object" && !Array.isArray(config) ? config as Record<string,unknown> : {};
  return Object.fromEntries(Object.keys(DEFAULT_FEATURES).map((key) => [key, value[key] === true])) as Features;
}

export function commerceSettings(config: unknown): CommerceSettings {
  const value = config && typeof config === "object" && !Array.isArray(config) ? config as Record<string,unknown> : {};
  const fee = typeof value.deliveryFee === "number" && Number.isFinite(value.deliveryFee) ? value.deliveryFee : 0;
  return { ...effectiveFeatures(value), deliveryFee: Math.max(0, Math.min(1000, fee)) };
}

export function featureLabel(active: boolean) { return active ? "Activé" : "Désactivé"; }

export type SeoSettings = { title: string; description: string; indexing: boolean };
export function seoSettings(config: unknown): SeoSettings {
  const value = config && typeof config === "object" && !Array.isArray(config) ? config as Record<string,unknown> : {};
  return {
    title: typeof value.seoTitle === "string" && value.seoTitle.trim() ? value.seoTitle.trim().slice(0, 120) : "Opticien en Tunisie | Le Kram, Tunisia Mall et El Aouina",
    description: typeof value.seoDescription === "string" && value.seoDescription.trim() ? value.seoDescription.trim().slice(0, 320) : "InfraRed Optic-Store, votre opticien en Tunisie au Kram, à Tunisia Mall et à El Aouina. Lunettes optiques, solaires et grandes marques.",
    indexing: value.seoIndexing !== false,
  };
}
