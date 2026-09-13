import { AUDIT_CATEGORIES, AUDIT_RESULTS, type AuditCategory, type AuditResult } from "@/lib/audit-log";

export const AUDIT_TABS = {
  all: { label: "Tous" },
  auth: { label: "Connexions", categories: ["AUTH"] },
  orders: { label: "Commandes", categories: ["ORDERS"] },
  catalog: { label: "Catalogue", categories: ["CATALOG"] },
  stock: { label: "Stocks", categories: ["STOCK"] },
  pricing: { label: "Prix", categories: ["PRICING"] },
  payments: { label: "Paiements", categories: ["PAYMENTS"] },
  users: { label: "Utilisateurs", categories: ["USERS", "ROLES"] },
  security: { label: "Sécurité", categories: ["SECURITY"] },
  system: { label: "Système", categories: ["SYSTEM", "SETTINGS"] },
} as const satisfies Record<string, { label: string; categories?: readonly AuditCategory[] }>;

export type AuditJournalFilters = {
  tab?: string;
  from?: string;
  to?: string;
  actorId?: string;
  role?: string;
  storeId?: string;
  category?: string;
  action?: string;
  result?: string;
  entityId?: string;
  q?: string;
};

const date = (value: string | undefined, end = false) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export function normalizeAuditFilters(input: AuditJournalFilters) {
  const tab = input.tab && input.tab in AUDIT_TABS ? input.tab as keyof typeof AUDIT_TABS : "all";
  const category = AUDIT_CATEGORIES.includes(input.category as AuditCategory) ? input.category as AuditCategory : undefined;
  const result = AUDIT_RESULTS.includes(input.result as AuditResult) ? input.result as AuditResult : undefined;
  return { ...input, tab, category, result, from: date(input.from), to: date(input.to, true) };
}

/** Pure Prisma-shaped filter builder, shared by the immutable journal interface and tests. */
export function buildAuditWhere(input: AuditJournalFilters) {
  const filters = normalizeAuditFilters(input);
  const tab = AUDIT_TABS[filters.tab];
  const tabCategories = "categories" in tab ? tab.categories : undefined;
  const categories = filters.category ? [filters.category] : tabCategories;
  const q = filters.q?.trim().slice(0, 160);
  return {
    ...(categories?.length ? { category: { in: [...categories] } } : {}),
    ...(filters.actorId ? { actorId: filters.actorId } : {}),
    ...(filters.role ? { actorRole: filters.role } : {}),
    ...(filters.storeId ? { storeId: filters.storeId } : {}),
    ...(filters.action ? { action: { contains: filters.action, mode: "insensitive" as const } } : {}),
    ...(filters.result ? { result: filters.result } : {}),
    ...(filters.entityId ? { entityId: { contains: filters.entityId, mode: "insensitive" as const } } : {}),
    ...(filters.from || filters.to ? { createdAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {}),
    ...(q ? { OR: [
      { action: { contains: q, mode: "insensitive" as const } },
      { entityType: { contains: q, mode: "insensitive" as const } },
      { entityId: { contains: q, mode: "insensitive" as const } },
      { actorName: { contains: q, mode: "insensitive" as const } },
      { actorEmail: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
  };
}
