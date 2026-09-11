import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { rankSimilarProducts } from "./similarity-engine";
import type { AnalyzableProduct } from "./types";
import type { Product, PublicProduct, CatalogProduct } from "@/types";

const include = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
} satisfies Prisma.ProductInclude;

type Row = Prisma.ProductGetPayload<{ include: typeof include }>;

function toAnalyzable(row: Row): AnalyzableProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    reference: row.reference,
    description: row.description,
    price: Number(row.price),
    oldPrice: row.oldPrice == null ? null : Number(row.oldPrice),
    isPromotion: row.isPromotion,
    isNew: row.isNew,
    color: row.color,
    shape: row.shape,
    brandName: row.brand?.name ?? "",
    categoryName: row.category?.name ?? "",
    target: row.target,
    images: row.images.map((i) => ({ id: i.id, url: i.url })),
    mainImageHash: row.images[0]?.phash ?? null,
  };
}

function toPublicProduct(row: Row, includePrices = true): CatalogProduct {
  const targetLabels: Record<string, Product["target"]> = { HOMME: "Homme", FEMME: "Femme", MIXTE: "Mixte", ENFANT: "Enfant" };
  const base = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    reference: row.reference,
    description: row.description,
    categorySlug: row.category?.slug ?? "",
    categoryName: row.category?.name ?? "",
    brandSlug: row.brand?.slug ?? "",
    brandName: row.brand?.name ?? "",
    color: row.color ?? "",
    shape: row.shape ?? null,
    target: targetLabels[row.target] ?? "Mixte",
    available: row.available,
    featured: row.featured,
    isNew: row.isNew,
    createdAt: row.createdAt.toISOString(),
    images: row.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt ?? row.name, sortOrder: img.sortOrder, isPlaceholder: false })),
  };
  if (!includePrices) return base as PublicProduct;
  return {
    ...base,
    price: Number(row.price),
    oldPrice: row.oldPrice == null ? null : Number(row.oldPrice),
    discount: row.discount,
    isPromotion: row.isPromotion,
  } as Product;
}

/**
 * "Vous pourriez également aimer" — recommends products similar to
 * `productId` using the weighted local scoring in similarity-engine.ts
 * (brand, category, shape, color, target, price proximity, visual
 * similarity via perceptual hash). No AI, no external call.
 *
 * Query strategy (avoids scanning the whole catalog):
 *  1. Fetch the reference product once.
 *  2. Fetch ONE bounded candidate pool via indexed columns — WHERE
 *     available/published/not-archived AND (same category OR same
 *     brand), ordered by a cheap heuristic (featured, then recent) and
 *     capped at CANDIDATE_POOL_SIZE. `categoryId` and `brandId` both
 *     already have @@index in prisma/schema.prisma, so this is an
 *     indexed lookup, not a table scan.
 *  3. If that pool is too thin (a product with a rare brand+category
 *     combination), broaden with one more indexed query on `target`
 *     alone, still capped and still filtered by availability.
 *  4. Score the (small, bounded) in-memory candidate list and return the
 *     top `limit` — the expensive-ish scoring work only ever runs over
 *     dozens of rows, never the full catalog, regardless of how large
 *     the catalog grows.
 *
 * Never recommends the product itself (enforced both by the WHERE clause
 * and again defensively in rankSimilarProducts). Never returns an
 * unavailable product — filtered at the SQL level, not in JS.
 */
export async function getSimilarProducts(productId: string, limit = 4, options: { includePrices?: boolean } = {}): Promise<CatalogProduct[]> {
  const CANDIDATE_POOL_SIZE = 60;

  const reference = await prisma.product.findUnique({ where: { id: productId }, include });
  if (!reference) return [];

  const baseWhere: Prisma.ProductWhereInput = {
    id: { not: productId },
    available: true,
    published: true,
    archived: false,
  };

  let rows = await prisma.product.findMany({
    where: {
      ...baseWhere,
      OR: [{ categoryId: reference.categoryId }, { brandId: reference.brandId }],
    },
    include,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: CANDIDATE_POOL_SIZE,
  });

  if (rows.length < limit) {
    const more = await prisma.product.findMany({
      where: { ...baseWhere, target: reference.target, id: { notIn: [reference.id, ...rows.map((r) => r.id)] } },
      include,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: CANDIDATE_POOL_SIZE - rows.length,
    });
    rows = [...rows, ...more];
  }

  if (rows.length === 0) return [];

  const referenceAnalyzable = toAnalyzable(reference);
  const rowsById = new Map(rows.map((r) => [r.id, r]));
  const ranked = rankSimilarProducts(referenceAnalyzable, rows.map(toAnalyzable), limit);

  return ranked
    .map((r) => rowsById.get(r.productId))
    .filter((r): r is Row => Boolean(r))
    .map((row) => toPublicProduct(row, options.includePrices ?? true));
}
