import { prisma } from "@/lib/prisma";
import { DEFAULT_INSPIRATION_ITEMS, parseInspirationItems, type InspirationItem } from "@/lib/inspiration";

export const HOME_SECTION_IDS = ["intro", "brands", "categories", "new", "trends", "selection", "inspiration", "contact"] as const;
export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export type HomeContent = {
  introEyebrow: string;
  introTitle: string;
  brandsTitle: string;
  brandsLinkLabel: string;
  brandsSpeed: number;
  solarTitle: string;
  solarImage: string;
  opticalTitle: string;
  opticalImage: string;
  categoryCta: string;
  newEyebrow: string;
  newTitle: string;
  newProductSlugs: string[];
  trendsEyebrow: string;
  trendsTitle: string;
  trendImage1: string;
  trendImage2: string;
  trendVideo: string;
  trendLink: string;
  trendProductSlugs: string[];
  trendLinks: string[];
  selectionTitle: string;
  selectionLinkLabel: string;
  selectionProductSlugs: string[];
  inspirationEnabled: boolean;
  inspirationTitle: string;
  inspirationText: string;
  inspirationImages: string[];
  inspirationItems: InspirationItem[];
  contactEyebrow: string;
  contactTitle: string;
  contactText: string;
  sectionOrder: HomeSectionId[];
};

export const DEFAULT_HOME_CONTENT: HomeContent = {
  introEyebrow: "InfraRed Optic-Store, votre opticien en ligne",
  introTitle: "Les plus belles collections de lunettes",
  brandsTitle: "Nos maisons",
  brandsLinkLabel: "Toutes les marques",
  brandsSpeed: 22,
  solarTitle: "Lunettes de soleil",
  solarImage: "",
  opticalTitle: "Lunettes de vue",
  opticalImage: "",
  categoryCta: "Découvrir",
  newEyebrow: "La sélection du moment",
  newTitle: "Nouveautés",
  newProductSlugs: [],
  trendsEyebrow: "Mode",
  trendsTitle: "Les dernières tendances",
  trendImage1: "",
  trendImage2: "",
  trendVideo: "",
  trendLink: "/nouveautes",
  trendProductSlugs: [],
  trendLinks: ["", "", ""],
  selectionTitle: "Notre sélection",
  selectionLinkLabel: "Voir le catalogue",
  selectionProductSlugs: [],
  inspirationEnabled: true,
  inspirationItems: DEFAULT_INSPIRATION_ITEMS,
  inspirationTitle: "Inspirez-moi",
  inspirationText: "Adopte les dernières tendances et partage toi aussi ton nouveau look en mentionnant @infrared dans tes publications.",
  inspirationImages: [
    "/images/brand-campaigns/miu-miu-women.jpg",
    "/images/brand-campaigns/gucci-women.jpg",
    "/images/brand-campaigns/prada-women.jpg",
    "/images/brand-campaigns/saint-laurent-men.jpg",
    "/images/brand-campaigns/ray-ban-women.jpg",
    "/images/brand-campaigns/oliver-peoples-women.jpg",
  ],
  contactEyebrow: "Conseil personnalisé",
  contactTitle: "Une question sur une monture ?",
  contactText: "Notre équipe vous renseigne et vous accueille dans nos boutiques à Tunis.",
  sectionOrder: [...HOME_SECTION_IDS],
};

export function parseHomeContent(raw: string | null | undefined): HomeContent {
  try {
    const saved = raw ? JSON.parse(raw) : {};
    // Photos used to be stored here, independently from the Brand record.
    // Discard that legacy field during every read/save so it can no longer
    // override a logo managed from Admin → Marques.
    const savedContent = { ...(saved as Record<string, unknown>) };
    delete savedContent.brandPhotos;
    const savedOrder = Array.isArray(saved.sectionOrder)
      ? saved.sectionOrder.filter((x: unknown): x is HomeSectionId => HOME_SECTION_IDS.includes(x as HomeSectionId))
      : [];
    const mergedOrder = [...savedOrder, ...HOME_SECTION_IDS].filter((x, i, a) => a.indexOf(x) === i);
    // Existing installations do not know the new section yet. Place it just
    // before the dark contact band instead of appending it after the footer-
    // like ending of the home page.
    const order = savedOrder.includes("inspiration")
      ? mergedOrder
      : [
          ...mergedOrder.filter((id) => id !== "inspiration" && id !== "contact"),
          "inspiration" as const,
          ...(mergedOrder.includes("contact") ? ["contact" as const] : []),
        ];
    const inspirationImages = Array.isArray(saved.inspirationImages)
      ? saved.inspirationImages.filter((value: unknown): value is string => typeof value === "string").slice(0, 6)
      : DEFAULT_HOME_CONTENT.inspirationImages;
    let inspirationItems = DEFAULT_INSPIRATION_ITEMS;
    if (Array.isArray(saved.inspirationItems)) {
      try { inspirationItems = parseInspirationItems(saved.inspirationItems); } catch { /* Keep other saved sections when old icon data is invalid. */ }
    }
    return {
      ...DEFAULT_HOME_CONTENT,
      ...savedContent,
      inspirationImages,
      inspirationItems,
      sectionOrder: order,
    };
  } catch {
    return DEFAULT_HOME_CONTENT;
  }
}

export async function getHomeContent(): Promise<HomeContent> {
  if (process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL) return DEFAULT_HOME_CONTENT;
  const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } }).catch(() => null);
  return parseHomeContent((row as (typeof row & { homeContentJson?: string | null }) | null)?.homeContentJson);
}
