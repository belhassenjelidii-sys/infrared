import { resolveCharacteristics } from "./catalogue-fields";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { Product, PublicProduct, CatalogProduct, Brand, Category } from "@/types";
import { brands as seedBrands, categories as seedCategories, products as seedProducts } from "@/lib/data";

const useLocalPreviewData = process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;

function previewProducts(where: Prisma.ProductWhereInput, includePrices: boolean, take?: number): CatalogProduct[] {
  const simpleWhere = where as {
    featured?: boolean;
    available?: boolean;
    isNew?: boolean;
    isPromotion?: boolean;
    brand?: { slug?: string };
  };
  const rows = seedProducts
    .filter((product) => simpleWhere.featured === undefined || product.featured === simpleWhere.featured)
    .filter((product) => simpleWhere.available === undefined || product.available === simpleWhere.available)
    .filter((product) => simpleWhere.isNew === undefined || product.isNew === simpleWhere.isNew)
    .filter((product) => simpleWhere.isPromotion === undefined || product.isPromotion === simpleWhere.isPromotion)
    .filter((product) => !simpleWhere.brand?.slug || product.brandSlug === simpleWhere.brand.slug)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selected = take ? rows.slice(0, take) : rows;

  if (includePrices) return selected;
  return selected.map(({ price, oldPrice, discount, isPromotion, ...product }) => {
    void price;
    void oldPrice;
    void discount;
    void isPromotion;
    return product as PublicProduct;
  });
}

const targetLabels = {
  HOMME: "Homme",
  FEMME: "Femme",
  MIXTE: "Mixte",
  ENFANT: "Enfant",
} as const;

const include = {
  productModel: true,
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof include }>;

function mapProduct(p: ProductWithRelations, includePrices = true): CatalogProduct {
  const effective = resolveCharacteristics(p, p.productModel);
  const base = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    reference: p.reference,
    description: p.description || p.productModel?.description || "",
    categorySlug: p.category?.slug ?? "",
    categoryName: p.category?.name ?? "",
    brandSlug: p.brand?.slug ?? "",
    brandName: p.brand?.name ?? "",
    color: p.frameColorFamily ?? p.frameColorLabel ?? p.color ?? "",
    shape: effective.shape,
    target: targetLabels[effective.gender as keyof typeof targetLabels] ?? "Mixte",
    available: p.available,
    featured: p.featured,
    isNew: p.isNew,
    createdAt: p.createdAt.toISOString(),
    images: (p.images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? p.name,
      sortOrder: img.sortOrder,
      isPlaceholder: false,
    })),
  };

  if (!includePrices) {
    return base as PublicProduct;
  }

  return {
    ...base,
    price: Number(p.price),
    oldPrice: p.oldPrice == null ? null : Number(p.oldPrice),
    discount: p.discount,
    isPromotion: p.isPromotion,
  } as Product;
}

export async function getDbProducts(
  where: Prisma.ProductWhereInput = {},
  orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [
    { createdAt: "desc" },
    { id: "asc" },
  ],
  options: { includePrices?: boolean; take?: number } = {}
) {
  const includePrices = options.includePrices ?? true;
  if (useLocalPreviewData) return previewProducts(where, includePrices, options.take);
  const stableOrderBy: Prisma.ProductOrderByWithRelationInput[] = Array.isArray(orderBy)
    ? (orderBy.some((entry) => Object.prototype.hasOwnProperty.call(entry, "id")) ? orderBy : [...orderBy, { id: "asc" }])
    : [orderBy, { id: "asc" }];
  const rows = await prisma.product.findMany({
    where: { archived: false, published: true, ...where },
    include,
    orderBy: stableOrderBy,
    ...(options.take ? { take: Math.min(Math.max(options.take, 1), 100) } : {}),
  });
  return rows.map((row) => mapProduct(row as ProductWithRelations, includePrices));
}

export type DbProductPage = {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getDbProductsPage(
  where: Prisma.ProductWhereInput = {},
  orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [
    { createdAt: "desc" },
    { id: "asc" },
  ],
  options: { includePrices?: boolean; page?: number; pageSize?: number } = {}
): Promise<DbProductPage> {
  const includePrices = options.includePrices ?? true;
  const pageSize = Math.min(Math.max(options.pageSize ?? 24, 1), 48);
  const page = Math.max(options.page ?? 1, 1);

  const total = await prisma.product.count({ where: { archived: false, published: true, ...where } });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = await prisma.product.findMany({
    where: { archived: false, published: true, ...where },
    include,
    orderBy,
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });

  return { items: rows.map((row) => mapProduct(row, includePrices)), total, page: safePage, pageSize, totalPages };
}

export async function getDbProductBySlug(slug: string, options: { includePrices?: boolean } = {}) {
  const row = await prisma.product.findFirst({
    where: { slug, archived: false, published: true },
    include,
  });
  return row ? mapProduct(row, options.includePrices ?? true) : null;
}

export async function getDbBrands(): Promise<Brand[]> {
  if (useLocalPreviewData) return seedBrands;
  return prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export async function getDbCategories(): Promise<Category[]> {
  if (useLocalPreviewData) return seedCategories;
  const rows = await prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: c.image,
    active: c.active,
  }));
}

export type DbCatalogueFilters = {
  q?: string;
  category?: string;
  brand?: string;
  target?: string;
  shape?: string;
  isNew?: boolean;
  isPromotion?: boolean;
  sort?: "nouveautes" | "prix-asc" | "prix-desc" | "popularite" | "marque-asc" | "marque-desc" | "reference-asc" | "reference-desc";
};

export async function filterDbProducts(
  filters: DbCatalogueFilters,
  options: { includePrices?: boolean; page?: number; pageSize?: number } = {}
): Promise<DbProductPage> {
  const includePrices = options.includePrices ?? true;
  const AND: Prisma.ProductWhereInput[] = [
    { archived: false },
    { published: true },
    { available: true },
  ];

  if (filters.q) {
    const q = filters.q.trim().slice(0, 100);
    if (q) {
      AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { reference: { contains: q, mode: "insensitive" } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
        ],
      });
    }
  }
  if (filters.category) AND.push({ category: { slug: filters.category } });
  if (filters.brand) AND.push({ brand: { slug: filters.brand } });
  if (filters.target) AND.push({ target: filters.target.toUpperCase() as Prisma.EnumTargetFilter["equals"] });
  if (filters.shape) AND.push({ shape: { equals: filters.shape } });
  if (filters.isNew) AND.push({ isNew: true });
  if (includePrices && filters.isPromotion) AND.push({ isPromotion: true, oldPrice: { gt: 0 }, discount: { gt: 0 } });

  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }];
  if (filters.sort === "nouveautes") orderBy = [{ createdAt: "desc" }, { id: "asc" }];
  if (includePrices && filters.sort === "prix-asc") orderBy = [{ price: "asc" }, { id: "asc" }];
  if (includePrices && filters.sort === "prix-desc") orderBy = [{ price: "desc" }, { id: "asc" }];
  if (filters.sort === "marque-asc") orderBy = [{ brand: { name: "asc" } }, { name: "asc" }, { id: "asc" }];
  if (filters.sort === "marque-desc") orderBy = [{ brand: { name: "desc" } }, { name: "asc" }, { id: "asc" }];
  if (filters.sort === "reference-asc") orderBy = [{ reference: "asc" }, { id: "asc" }];
  if (filters.sort === "reference-desc") orderBy = [{ reference: "desc" }, { id: "asc" }];

  return getDbProductsPage({ AND }, orderBy, { includePrices, page: options.page, pageSize: options.pageSize });
}
