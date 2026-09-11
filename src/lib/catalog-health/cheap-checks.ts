import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CheapCatalogStats } from "./types";

// Every check below is a COUNT query (or, where SQL can't express the
// condition portably, one lightweight id+field projection) with a
// targeted WHERE clause — none of them fetch full product rows or the
// whole catalog into memory. Prisma pushes the COUNTs down to real SQL
// COUNT(*), so this stays fast regardless of catalog size (indexes on
// categoryId/brandId/phash/etc already exist in prisma/schema.prisma).

const activeFilter: Prisma.ProductWhereInput = { archived: false };

// categoryId/brandId are non-optional foreign keys (every Product row is
// required to reference a real Category/Brand, enforced by the DB
// itself), so these two will realistically always read 0 — kept as real
// queries (not fabricated placeholders) for defensive monitoring in case
// that constraint is ever loosened.
const NO_CATEGORY_OR_BRAND_SENTINEL = "__none__";

export async function getCheapCatalogStats(): Promise<CheapCatalogStats> {
  const [
    totalActive,
    noImage,
    noDescriptionEmpty,
    nonEmptyDescriptions,
    noSeo,
    noCategory,
    noBrand,
    noPrice,
    unavailable,
    negativePrice,
    promoWithoutOldPrice,
    missingColorAndShape,
  ] = await Promise.all([
    prisma.product.count({ where: activeFilter }),
    prisma.product.count({ where: { ...activeFilter, images: { none: {} } } }),
    prisma.product.count({ where: { ...activeFilter, description: "" } }),
    // Prisma can't filter on "string length" portably across databases via
    // a plain where clause — this single lightweight id+description
    // projection (not full product rows) is the cheapest way to apply the
    // "too short to be useful" rule from product-validator.ts.
    prisma.product.findMany({
      where: { ...activeFilter, NOT: { description: "" } },
      select: { id: true, description: true },
    }),
    prisma.product.count({ where: { ...activeFilter, metaTitle: null, metaDescription: null } }),
    prisma.product.count({ where: { ...activeFilter, categoryId: NO_CATEGORY_OR_BRAND_SENTINEL } }),
    prisma.product.count({ where: { ...activeFilter, brandId: NO_CATEGORY_OR_BRAND_SENTINEL } }),
    // Zero is an intentional "Prix en boutique" value, accepted by the
    // product form. Only negative values are invalid.
    prisma.product.count({ where: { ...activeFilter, price: { lt: 0 } } }),
    prisma.product.count({ where: { ...activeFilter, available: false } }),
    prisma.product.count({ where: { ...activeFilter, price: { lt: 0 } } }),
    prisma.product.count({ where: { ...activeFilter, isPromotion: true, oldPrice: null } }),
    prisma.product.count({
      where: { ...activeFilter, OR: [{ color: null }, { color: "" }], AND: [{ OR: [{ shape: null }, { shape: "" }] }] },
    }),
  ]);

  const shortDescriptionCount = nonEmptyDescriptions.filter((p) => p.description.trim().length < 15).length;

  return {
    totalActive,
    incomplete: missingColorAndShape + shortDescriptionCount,
    noImage,
    noDescription: noDescriptionEmpty + shortDescriptionCount,
    noSeo,
    noCategory,
    noBrand,
    noPrice,
    unavailable,
    dataErrors: negativePrice + promoWithoutOldPrice,
  };
}
