import { prisma } from "@/lib/prisma";
import { getStoreLiveStatus, storeStatusLabel, parseStoreHours } from "@/lib/store-hours";
import { stores as seedStores } from "@/lib/data";

const useLocalPreviewData = process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;

export type StoreHours = { day: string; hours: string };

export { buildWhatsAppLink } from "./whatsapp";

export type AboutStat = { title: string; text: string };

export type SiteSettings = {
  name: string;
  logoUrl: string | null;
  logoHeight: number;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  address: string | null;
  mapsUrl: string | null;
  hours: StoreHours[];
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCtaLabel: string | null;
  heroImageUrl: string | null;
  heroVideoUrl: string | null;
  heroMediaType: "image" | "video";
  heroMediaScale: number;
  heroMediaX: number;
  heroMediaY: number;
  accentColor: string | null;
  categoryTitleSolaires: string | null;
  categoryTitleOptiques: string | null;
  categoryTitleNouveautes: string | null;
  homeTrendEyebrow: string | null;
  homeTrendTitle: string | null;
  homeTrendProductIds: string[];
  showPrices: boolean;
  aboutEnabled: boolean;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutText: string;
  aboutStats: AboutStat[];
};

const DEFAULT_ABOUT_STATS: AboutStat[] = [
  { title: "10+ ans d'expertise", text: "Une maison reconnue à Tunis." },
  { title: "Grandes marques", text: "Carrera, Ray-Ban, Vogue, Polaroid, Emporio Armani…" },
  { title: "Opticiens diplômés", text: "Examen de vue et montage sur mesure en boutique." },
];

function parseHours(json: string | null | undefined): StoreHours[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseAboutStats(json: string | null | undefined): AboutStat[] {
  if (!json) return DEFAULT_ABOUT_STATS;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ABOUT_STATS;
  } catch {
    return DEFAULT_ABOUT_STATS;
  }
}

/**
 * The one place every page/component reads global site settings from.
 * Falls back to sane defaults if no StoreSettings row exists yet (first
 * run, before an admin account saves anything from /admin/parametres) —
 * this is presentation fallback only, never a second source of business
 * data (see AGENTS/CLAUDE brief §9).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const s = useLocalPreviewData
    ? null
    : await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } }).catch(() => null);
  const trend = s as (typeof s & { homeTrendEyebrow?: string | null; homeTrendTitle?: string | null; homeTrendProductIds?: string | null }) | null;
  return {
    name: "InfraRed Optic-Store",
    logoUrl: s?.logoUrl ?? null,
    logoHeight: Math.min(80, Math.max(28, s?.logoHeight ?? 42)),
    phone: s?.phone ?? null,
    whatsapp: s?.whatsapp ?? null,
    instagram: s?.instagram ?? null,
    facebook: s?.facebook ?? null,
    address: s?.address ?? null,
    mapsUrl: s?.mapsUrl ?? null,
    hours: parseHours(s?.hoursJson),
    heroTitle: s?.heroTitle ?? null,
    heroSubtitle: s?.heroSubtitle ?? null,
    heroCtaLabel: s?.heroCtaLabel ?? null,
    heroImageUrl: s?.heroImageUrl ?? null,
    heroVideoUrl: s?.heroVideoUrl ?? null,
    heroMediaType: s?.heroMediaType === "video" ? "video" : "image",
    heroMediaScale: Math.min(160, Math.max(80, s?.heroMediaScale ?? 125)),
    heroMediaX: Math.min(60, Math.max(-60, s?.heroMediaX ?? 0)),
    heroMediaY: Math.min(60, Math.max(-60, s?.heroMediaY ?? 0)),
    accentColor: s?.accentColor ?? null,
    categoryTitleSolaires: s?.categoryTitleSolaires ?? null,
    categoryTitleOptiques: s?.categoryTitleOptiques ?? null,
    categoryTitleNouveautes: s?.categoryTitleNouveautes ?? null,
    homeTrendEyebrow: trend?.homeTrendEyebrow ?? "Mode",
    homeTrendTitle: trend?.homeTrendTitle ?? "Les dernières tendances",
    homeTrendProductIds: (() => { try { const v = JSON.parse(trend?.homeTrendProductIds ?? "[]"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } })(),
    showPrices: s?.showPrices ?? true,
    aboutEnabled: s?.aboutEnabled ?? true,
    aboutEyebrow: s?.aboutEyebrow ?? "Depuis 2012",
    aboutTitle: s?.aboutTitle ?? "L'opticien InfraRed, à Tunis",
    aboutText:
      s?.aboutText ??
      "Plus de 10 ans d'expertise optique, une sélection exigeante des plus grandes marques et un conseil personnalisé dans chacune de nos boutiques.",
    aboutStats: parseAboutStats(s?.aboutStatsJson),
  };
}

export type DbStore = {
  id: string;
  slug: string;
  name: string;
  address: string;
  mobile: string;
  landline: string;
  mapsUrl: string;
  mapsEmbedQuery: string;
  photo: string | null;
  hours: StoreHours[];
  statusOverride: "auto" | "open" | "closed";
  liveStatus: "open" | "closed";
  statusLabel: "Ouverte" | "Fermée";
};

/** All active boutiques, DB-only — no static fallback (see AGENTS/CLAUDE brief §9). */
export async function getDbStores(options: { fallbackHours?: StoreHours[] } = {}): Promise<DbStore[]> {
  if (useLocalPreviewData) {
    return seedStores.map((store) => ({
      ...store,
      slug: store.id,
      hours: options.fallbackHours ?? [],
      statusOverride: "auto" as const,
      liveStatus: "closed" as const,
      statusLabel: "Fermée" as const,
    }));
  }
  const rows = await prisma.store
    .findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
    .catch(() => []);
  return rows.map((s) => {
    const ownHours = parseStoreHours(s.hoursJson);
    const hours = ownHours.length ? ownHours : options.fallbackHours ?? [];
    const statusOverride = s.statusOverride === "open" || s.statusOverride === "closed" ? s.statusOverride : "auto";
    const liveStatus = getStoreLiveStatus({ statusOverride, hours });
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      address: s.address,
      mobile: s.mobile,
      landline: s.landline ?? "",
      mapsUrl: s.mapsUrl ?? "",
      mapsEmbedQuery: s.mapsEmbedQuery ?? s.address,
      photo: s.photo,
      hours,
      statusOverride,
      liveStatus,
      statusLabel: storeStatusLabel(liveStatus),
    };
  });
}

/** A single boutique by slug — used by /boutique/[slug]. */
export async function getDbStoreBySlug(slug: string, options: { fallbackHours?: StoreHours[] } = {}): Promise<DbStore | null> {
  const s = await prisma.store.findFirst({ where: { slug, active: true } }).catch(() => null);
  if (!s) return null;
  const ownHours = parseStoreHours(s.hoursJson);
  const hours = ownHours.length ? ownHours : options.fallbackHours ?? [];
  const statusOverride = s.statusOverride === "open" || s.statusOverride === "closed" ? s.statusOverride : "auto";
  const liveStatus = getStoreLiveStatus({ statusOverride, hours });
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    address: s.address,
    mobile: s.mobile,
    landline: s.landline ?? "",
    mapsUrl: s.mapsUrl ?? "",
    mapsEmbedQuery: s.mapsEmbedQuery ?? s.address,
    photo: s.photo,
    hours,
    statusOverride,
    liveStatus,
    statusLabel: storeStatusLabel(liveStatus),
  };
}
