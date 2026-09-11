import type { DbStore, SiteSettings, StoreHours } from "@/lib/site-data";

const LOCATION_DETAILS: Record<string, {
  searchLabel: string;
  locality: string;
  region: string;
  streetAddress?: string;
  postalCode?: string;
}> = {
  kram: {
    searchLabel: "au Kram",
    locality: "Le Kram",
    region: "Tunis",
    streetAddress: "175 Avenue Habib Bourguiba",
    postalCode: "2015",
  },
  "tunisia-mall": {
    searchLabel: "à Tunisia Mall",
    locality: "Les Berges du Lac 2",
    region: "Tunis",
    streetAddress: "Tunisia Mall, 3e étage",
  },
  "el-aouina": {
    searchLabel: "à El Aouina",
    locality: "El Aouina",
    region: "Tunis",
    streetAddress: "Avenue Khaled Ibn Walid",
    postalCode: "2020",
  },
};

const DAYS: Record<string, string> = {
  lundi: "Monday",
  mardi: "Tuesday",
  mercredi: "Wednesday",
  jeudi: "Thursday",
  vendredi: "Friday",
  samedi: "Saturday",
  dimanche: "Sunday",
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function absoluteUrl(value: string | null | undefined, siteUrl: string) {
  if (!value) return undefined;
  try { return new URL(value, siteUrl).toString(); } catch { return undefined; }
}

function phoneForSchema(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("216") ? `+${digits}` : `+216${digits}`;
}

function parseTimeRange(value: string) {
  const match = value.match(/(\d{1,2})(?:\s*[:h]\s*(\d{1,2}))?\s*(?:–|—|-)\s*(\d{1,2})(?:\s*[:h]\s*(\d{1,2}))?/i);
  if (!match) return null;
  const format = (hour: string, minute?: string) => `${hour.padStart(2, "0")}:${(minute || "00").padStart(2, "0")}`;
  return { opens: format(match[1], match[2]), closes: format(match[3], match[4]) };
}

function daysForLabel(label: string) {
  const clean = normalize(label);
  const exact = DAYS[clean];
  if (exact) return [exact];
  const parts = clean.split(/\s*(?:–|—|-)\s*/).filter(Boolean);
  if (parts.length !== 2 || !DAYS[parts[0]] || !DAYS[parts[1]]) return [];
  const ordered = Object.keys(DAYS);
  const start = ordered.indexOf(parts[0]);
  const end = ordered.indexOf(parts[1]);
  if (start < 0 || end < start) return [];
  return ordered.slice(start, end + 1).map((day) => DAYS[day]);
}

export function storeSearchLabel(store: Pick<DbStore, "slug" | "name">) {
  return LOCATION_DETAILS[store.slug]?.searchLabel ?? `à ${store.name}`;
}

export function storeSeoTitle(store: Pick<DbStore, "slug" | "name">) {
  return `Opticien ${storeSearchLabel(store)} – Lunettes optiques et solaires`;
}

export function storeSeoDescription(store: Pick<DbStore, "slug" | "name" | "address">) {
  return `Opticien InfraRed ${storeSearchLabel(store)} : lunettes de vue, lunettes solaires, grandes marques, conseil et essayage. ${store.address}.`;
}

export function openingHoursJsonLd(hours: StoreHours[]) {
  return hours.flatMap((row) => {
    const interval = parseTimeRange(row.hours);
    const days = daysForLabel(row.day);
    if (!interval || days.length === 0) return [];
    return [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days.map((day) => `https://schema.org/${day}`),
      ...interval,
    }];
  });
}

export function storeJsonLd(store: DbStore, siteUrl: string) {
  const location = LOCATION_DETAILS[store.slug];
  return {
    "@type": "Optician",
    "@id": `${siteUrl}/boutique/${store.slug}#optician`,
    name: `InfraRed Optic-Store — ${store.name}`,
    url: `${siteUrl}/boutique/${store.slug}`,
    description: storeSeoDescription(store),
    image: absoluteUrl(store.photo, siteUrl),
    telephone: phoneForSchema(store.mobile),
    address: {
      "@type": "PostalAddress",
      streetAddress: location?.streetAddress ?? store.address,
      addressLocality: location?.locality ?? store.name,
      addressRegion: location?.region ?? "Tunis",
      postalCode: location?.postalCode,
      addressCountry: "TN",
    },
    hasMap: store.mapsUrl || undefined,
    openingHoursSpecification: openingHoursJsonLd(store.hours),
    parentOrganization: { "@id": `${siteUrl}/#organization` },
    currenciesAccepted: "TND",
    areaServed: ["Tunis", "Grand Tunis"],
  };
}

export function homeSeoGraph(stores: DbStore[], settings: SiteSettings, siteUrl: string) {
  const sameAs = [settings.facebook, settings.instagram].filter((value): value is string => Boolean(value));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "InfraRed Optic-Store",
        alternateName: "InfraRed Optique Tunisie",
        inLanguage: "fr-TN",
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "InfraRed Optic-Store",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description: "Opticien en Tunisie spécialisé en lunettes optiques et solaires, présent au Kram, à Tunisia Mall et à El Aouina.",
        telephone: settings.phone || undefined,
        sameAs,
        department: stores.map((store) => ({ "@id": `${siteUrl}/boutique/${store.slug}#optician` })),
      },
      ...stores.map((store) => storeJsonLd(store, siteUrl)),
    ],
  };
}
