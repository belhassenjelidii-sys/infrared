import { GLASSES_COLOR_NAMES, GLASSES_SHAPES } from "@/lib/glasses-attributes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export const LIMITS = {
  productName: 160,
  reference: 80,
  description: 5000,
  imageUrl: 2048,
  imageAlt: 300,
  color: 80,
  shape: 40,
  metaTitle: 180,
  metaDescription: 320,
  tags: 500,
  whatsappTitle: 180,
  categoryName: 100,
  brandName: 100,
  genericDescription: 1000,
  storeName: 120,
  address: 500,
  phone: 50,
  mapsUrl: 2048,
  userName: 120,
  password: 128,
} as const;

function text(raw: FormDataEntryValue | null, label: string, max: number, required = false): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (required && !value) throw new Error(`${label} est obligatoire.`);
  if (value.length > max) throw new Error(`${label} est trop long (maximum ${max} caractères).`);
  return value;
}

export function getRequiredText(formData: FormData, field: string, label: string, max: number): string {
  return text(formData.get(field), label, max, true);
}

export function getOptionalText(formData: FormData, field: string, max: number): string | null {
  const value = text(formData.get(field), field, max);
  return value || null;
}

export function parseMoney(
  raw: FormDataEntryValue | null,
  label: string,
  options: { required?: boolean; max?: number; allowZero?: boolean } = {}
): number | null {
  const required = options.required ?? true;
  const max = options.max ?? 99_999_999.99;
  const allowZero = options.allowZero ?? false;
  const value = typeof raw === "string" ? raw.trim() : "";

  if (!value) {
    if (required) throw new Error(`${label} est obligatoire.`);
    return null;
  }
  if (!/^\d+(?:\.\d{1,3})?$/.test(value)) {
    throw new Error(`${label} doit être un nombre positif avec au maximum 3 décimales.`);
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount === 0) || amount > max) {
    throw new Error(
      allowZero
        ? `${label} doit être compris entre 0 et ${max.toFixed(2)}.`
        : `${label} doit être compris entre 0,01 et ${max.toFixed(2)}.`,
    );
  }
  return amount;
}

export function parseIntRange(
  raw: FormDataEntryValue | null,
  label: string,
  min: number,
  max: number,
  fallback: number
): number {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return fallback;
  if (!/^-?\d+$/.test(value)) throw new Error(`${label} est invalide.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} doit être compris entre ${min} et ${max}.`);
  }
  return parsed;
}

export function getTarget(raw: FormDataEntryValue | null): "HOMME" | "FEMME" | "MIXTE" | "ENFANT" {
  const value = typeof raw === "string" ? raw : "";
  if (value === "HOMME" || value === "FEMME" || value === "MIXTE" || value === "ENFANT") return value;
  throw new Error("Cible produit invalide.");
}

export function getProductColor(raw: FormDataEntryValue | null): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  const colors = value
    .split(/,| et /i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (colors.length < 1 || colors.length > 2 || colors.some((color) => !GLASSES_COLOR_NAMES.includes(color as never))) {
    throw new Error("Couleur produit invalide.");
  }
  return colors.join(" et ");
}

export function getProductShape(raw: FormDataEntryValue | null): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (!GLASSES_SHAPES.includes(value as (typeof GLASSES_SHAPES)[number])) {
    throw new Error("Forme produit invalide.");
  }
  return value;
}

export function validateStoredAssetUrl(raw: string, label = "URL du fichier"): string {
  const value = raw.trim();
  if (!value) throw new Error(`${label} est obligatoire.`);
  if (value.length > LIMITS.imageUrl) throw new Error(`${label} est trop longue.`);

  if (isSafeLocalAssetPath(value)) return value;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} est invalide.`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${label} doit utiliser HTTP ou HTTPS.`);
  }
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (supabaseBase) {
    const supabaseHost = (() => { try { return new URL(supabaseBase).host.toLowerCase(); } catch { return ""; } })();
    if (parsed.hostname.toLowerCase() !== supabaseHost) {
      throw new Error(`${label} doit provenir du stockage du site ou d'un fichier local.`);
    }
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("Le stockage des médias n'est pas configuré pour la production.");
  } else {
    throw new Error(`${label} externe non autorisée sans stockage Supabase configuré.`);
  }
  return value;
}

export function validateOptionalUrl(raw: FormDataEntryValue | null, label: string, max = LIMITS.mapsUrl): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (value.length > max) throw new Error(`${label} est trop longue.`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} est invalide.`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${label} doit utiliser HTTP ou HTTPS.`);
  }
  return value;
}

/** Optional asset URL that also accepts the local dev-storage path. */
export function validateOptionalAssetUrl(
  raw: FormDataEntryValue | null,
  label: string,
  max = LIMITS.imageUrl
): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (isSafeLocalAssetPath(value)) {
    if (value.length > max) throw new Error(`${label} est trop longue.`);
    return value;
  }
  return validateOptionalUrl(value, label, max);
}

function isSafeLocalAssetPath(value: string) {
  if (!value.startsWith("/uploads/") && !value.startsWith("/images/")) return false;
  if (value.includes("..") || value.includes("\\") || value.includes("?") || value.includes("#")) return false;
  return /^\/[a-zA-Z0-9][a-zA-Z0-9._()\-/]*$/.test(value);
}

export function validateEmail(raw: FormDataEntryValue | null): string {
  const value = text(raw, "Email", 254, true).toLowerCase();
  if (!EMAIL_RE.test(value)) throw new Error("Adresse email invalide.");
  return value;
}

export function validatePassword(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (value.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  if (value.length > LIMITS.password) throw new Error(`Le mot de passe est trop long (maximum ${LIMITS.password} caractères).`);
  return value;
}

export function validateAccentColor(raw: FormDataEntryValue | null): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (!HEX_COLOR_RE.test(value)) throw new Error("La couleur d'accent doit être au format hexadécimal, par exemple #E0122C.");
  return value.toUpperCase();
}


export function validateTunisianPhone(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) throw new Error("Le numéro de téléphone est obligatoire.");
  const compact = value.replace(/[\s().-]/g, "");
  const digits = compact.replace(/^\+216/, "");
  if (!/^\d{8}$/.test(digits)) throw new Error("Entrez un numéro tunisien valide au format +216 12 345 678.");
  if (!/^[2-9]\d{7}$/.test(digits)) throw new Error("Entrez un numéro tunisien valide au format +216 12 345 678.");
  return `+216 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}
