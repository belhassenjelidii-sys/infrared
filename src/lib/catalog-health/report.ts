import "server-only";
import { getCheapCatalogStats } from "./cheap-checks";
import { findPotentialDuplicates } from "./duplicate-scan";
import { getImageHealthSnapshot } from "./snapshot";
import type { CatalogIssue } from "./types";

export type Role = "SUPER_ADMIN" | "ADMIN" | "DEVELOPER" | "COMMERCIAL";

export type CatalogHealthReport = {
  totalActive: number;
  issues: CatalogIssue[];
  completeCount: number;
  imageScanComputedAt: string;
  imageScanFresh: boolean;
};

export async function buildCatalogHealthReport(role: Role, forceImageRescan = false): Promise<CatalogHealthReport> {
  const isFullAdmin = role === "SUPER_ADMIN" || role === "ADMIN" || role === "DEVELOPER";

  const [stats, duplicateGroups, imageScan] = await Promise.all([
    getCheapCatalogStats(),
    isFullAdmin ? findPotentialDuplicates() : Promise.resolve([]),
    isFullAdmin ? getImageHealthSnapshot(forceImageRescan) : Promise.resolve(null),
  ]);

  const p = (n: number, s: string, f?: string) => `${n} ${n === 1 ? s : (f ?? s + "s")}`;

  const allIssues: CatalogIssue[] = [
    { key: "noImage", label: `${p(stats.noImage, "produit")} sans image`, count: stats.noImage, actionLabel: "Corriger", href: "/admin?filter=noImage", visibleTo: ["ADMIN", "DEVELOPER", "COMMERCIAL"] },
    { key: "unavailable", label: `${p(stats.unavailable, "produit")} indisponible`, count: stats.unavailable, actionLabel: "Examiner", href: "/admin?filter=unavailable", visibleTo: ["ADMIN", "DEVELOPER", "COMMERCIAL"] },
    { key: "noPrice", label: `${p(stats.noPrice, "prix invalide")}`, count: stats.noPrice, actionLabel: "Corriger", href: "/admin?filter=noPrice", visibleTo: ["ADMIN", "DEVELOPER", "COMMERCIAL"] },
    { key: "incomplete", label: `${p(stats.incomplete, "produit")} incomplet`, count: stats.incomplete, actionLabel: "Corriger", href: "/admin?filter=incomplete", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "noDescription", label: `${p(stats.noDescription, "produit")} sans description`, count: stats.noDescription, actionLabel: "Corriger", href: "/admin?filter=noDescription", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "noSeo", label: `${p(stats.noSeo, "produit")} sans SEO`, count: stats.noSeo, actionLabel: "Corriger", href: "/admin?filter=noSeo", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "noCategory", label: `${p(stats.noCategory, "produit")} sans catégorie`, count: stats.noCategory, actionLabel: "Corriger", href: "/admin?filter=noCategory", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "noBrand", label: `${p(stats.noBrand, "produit")} sans marque`, count: stats.noBrand, actionLabel: "Corriger", href: "/admin?filter=noBrand", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "dataErrors", label: `${p(stats.dataErrors, "erreur")} de données`, count: stats.dataErrors, actionLabel: "Examiner", href: "/admin?filter=dataErrors", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "duplicates", label: `${p(duplicateGroups.length, "doublon potentiel")}`, count: duplicateGroups.length, actionLabel: "Examiner", href: "/admin/qualite#doublons", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "brokenImages", label: `${p(imageScan?.brokenImages ?? 0, "image cassée")}`, count: imageScan?.brokenImages ?? 0, actionLabel: "Examiner", href: "/admin/qualite#images", visibleTo: ["ADMIN", "DEVELOPER"] },
    { key: "heavyImages", label: `${p(imageScan?.heavyImages ?? 0, "image trop lourde")}`, count: imageScan?.heavyImages ?? 0, actionLabel: "Optimiser", href: "/admin/qualite#images", visibleTo: ["ADMIN", "DEVELOPER"] },
  ];

  const issues = allIssues.filter((i) => i.visibleTo.includes(role) && i.count > 0);
  const directIssueKeys: Array<CatalogIssue["key"]> = ["noImage", "unavailable", "noPrice", "incomplete", "noDescription", "noSeo", "noCategory", "noBrand", "dataErrors"];
  const affectedProducts = issues.filter((i) => directIssueKeys.includes(i.key)).reduce((sum, i) => sum + i.count, 0);

  return {
    totalActive: stats.totalActive,
    issues,
    completeCount: Math.max(0, stats.totalActive - Math.min(stats.totalActive, affectedProducts)),
    imageScanComputedAt: imageScan?.computedAt ?? "",
    imageScanFresh: imageScan?.fresh ?? false,
  };
}
