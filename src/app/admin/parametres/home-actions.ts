"use server";

import { revalidatePath } from "next/cache";
import { requireContentAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { DEFAULT_HOME_CONTENT, HOME_SECTION_IDS, parseHomeContent, type HomeContent, type HomeSectionId } from "@/lib/home-content";
import { getOptionalText, LIMITS, validateOptionalAssetUrl, validateOptionalUrl } from "@/lib/validation";
import { parseInspirationItems } from "@/lib/inspiration";

const text = (data: FormData, key: string, fallback: string, max = 200) => String(data.get(key) ?? fallback).trim().slice(0, max);
const asset = (data: FormData, key: string, label: string) => validateOptionalAssetUrl(data.get(key), label, LIMITS.imageUrl) ?? "";
const productSlots = (data: FormData, count: number) => Array.from({ length: count }, (_, i) => String(data.get(`product${i}`) ?? "").trim()).filter(Boolean);

export async function saveInspirationSectionAction(_previous: { error: string; saved: boolean }, formData: FormData) {
  await requireContentAccess();
  try {
    parseInspirationItems(JSON.parse(String(formData.get("inspirationItems") ?? "null")));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Vérifiez les pictogrammes.", saved: false };
  }
  try {
    await saveHomeSectionAction("inspiration", formData);
    return { error: "", saved: true };
  } catch {
    return { error: "L’enregistrement a échoué. Vos modifications sont conservées dans le formulaire ; réessayez.", saved: false };
  }
}

export async function saveHomeSectionAction(section: string, formData: FormData) {
  await requireContentAccess();
  const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } });
  const current = parseHomeContent((row as (typeof row & { homeContentJson?: string | null }) | null)?.homeContentJson);
  let next: HomeContent = { ...current };

  if (section === "hero") {
    const heroData = {
      heroTitle: getOptionalText(formData, "heroTitle", 200),
      heroSubtitle: getOptionalText(formData, "heroSubtitle", 500),
      heroCtaLabel: getOptionalText(formData, "heroCtaLabel", 100),
    };
    if (row) await prisma.storeSettings.update({ where: { id: row.id }, data: heroData });
    else await prisma.storeSettings.create({ data: { singletonKey: "main", ...heroData } });
    revalidatePath("/");
    revalidatePath("/admin/parametres/hero");
    return;
  }

  if (section === "introduction") next = { ...next, introEyebrow: text(formData, "introEyebrow", current.introEyebrow), introTitle: text(formData, "introTitle", current.introTitle) };
  if (section === "nos-maisons") {
    next = { ...next, brandsSpeed: Math.min(80, Math.max(6, Number(formData.get("brandsSpeed")) || 22)) };
  }
  if (section === "categories") next = { ...next, solarTitle: text(formData, "solarTitle", current.solarTitle), solarImage: asset(formData, "solarImage", "Image solaires"), opticalTitle: text(formData, "opticalTitle", current.opticalTitle), opticalImage: asset(formData, "opticalImage", "Image optiques"), categoryCta: text(formData, "categoryCta", current.categoryCta, 80) };
  if (section === "nouveautes") next = { ...next, newEyebrow: text(formData, "newEyebrow", current.newEyebrow), newTitle: text(formData, "newTitle", current.newTitle), newProductSlugs: productSlots(formData, 12) };
  if (section === "tendances") next = {
    ...next,
    trendsEyebrow: text(formData, "trendsEyebrow", current.trendsEyebrow),
    trendsTitle: text(formData, "trendsTitle", current.trendsTitle),
    trendImage1: asset(formData, "trendImage1", "Image tendance 1"),
    trendImage2: asset(formData, "trendImage2", "Image tendance 2"),
    trendVideo: validateOptionalAssetUrl(formData.get("trendVideo"), "Vidéo tendance", LIMITS.mapsUrl) ?? "",
    trendLink: current.trendLink,
    trendProductSlugs: Array.from({ length: 3 }, (_, i) => String(formData.get(`product${i}`) ?? "").trim()),
    trendLinks: Array.from({ length: 3 }, (_, i) => text(formData, `trendLink${i}`, "", 500)),
  };
  if (section === "notre-selection") next = { ...next, selectionTitle: text(formData, "selectionTitle", current.selectionTitle), selectionLinkLabel: text(formData, "selectionLinkLabel", current.selectionLinkLabel), selectionProductSlugs: productSlots(formData, 4) };
  if (section === "inspiration") next = {
    ...next,
    inspirationEnabled: formData.get("inspirationEnabled") === "on",
    inspirationTitle: text(formData, "inspirationTitle", current.inspirationTitle, 120),
    inspirationText: text(formData, "inspirationText", current.inspirationText, 600),
    inspirationItems: parseInspirationItems(JSON.parse(String(formData.get("inspirationItems") ?? "null"))),
  };
  if (section === "footer") next = { ...next, contactEyebrow: text(formData, "contactEyebrow", current.contactEyebrow), contactTitle: text(formData, "contactTitle", current.contactTitle), contactText: text(formData, "contactText", current.contactText, 1000) };
  if (section === "classement") {
    const requested = Array.from({ length: HOME_SECTION_IDS.length }, (_, i) => String(formData.get(`section${i}`) ?? "")).filter((x): x is HomeSectionId => HOME_SECTION_IDS.includes(x as HomeSectionId));
    next = { ...next, sectionOrder: [...requested, ...DEFAULT_HOME_CONTENT.sectionOrder].filter((x, i, a) => a.indexOf(x) === i) };
  }

  const data = {
    homeContentJson: JSON.stringify(next),
    ...(section === "footer" ? {
      phone: getOptionalText(formData, "phone", LIMITS.phone),
      whatsapp: getOptionalText(formData, "whatsapp", LIMITS.phone),
      instagram: getOptionalText(formData, "instagram", 500),
      facebook: getOptionalText(formData, "facebook", 500),
      address: getOptionalText(formData, "address", LIMITS.address),
      mapsUrl: validateOptionalUrl(formData.get("mapsUrl"), "Lien Google Maps"),
      hoursJson: JSON.stringify([
        { day: "Lundi – Samedi", hours: text(formData, "hoursWeekdays", "", 120) },
        { day: "Dimanche", hours: text(formData, "hoursSunday", "", 120) },
      ].filter((item) => item.hours)),
    } : {}),
  } as never;
  if (row) await prisma.storeSettings.update({ where: { id: row.id }, data });
  else await prisma.storeSettings.create({ data: { singletonKey: "main", homeContentJson: JSON.stringify(next) } as never });
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath(`/admin/parametres/${section}`);
}
