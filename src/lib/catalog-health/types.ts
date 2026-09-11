export type CatalogIssueKey =
  | "incomplete"
  | "noImage"
  | "noDescription"
  | "noSeo"
  | "duplicates"
  | "heavyImages"
  | "brokenImages"
  | "noCategory"
  | "noBrand"
  | "noPrice"
  | "unavailable"
  | "dataErrors";

export type CatalogIssue = {
  key: CatalogIssueKey;
  label: string;
  count: number;
  /** "Corriger" (fix directly), "Examiner" (needs human review), "Optimiser" (perf/quality improvement). */
  actionLabel: string;
  /** Where the [Action] button sends the admin — a pre-filtered product list. */
  href: string;
  /** Roles allowed to see this specific check — Commercial only sees stock/photo-related items. */
  visibleTo: Array<"SUPER_ADMIN" | "ADMIN" | "DEVELOPER" | "COMMERCIAL">;
};

export type CheapCatalogStats = {
  totalActive: number;
  incomplete: number;
  noImage: number;
  noDescription: number;
  noSeo: number;
  noCategory: number;
  noBrand: number;
  noPrice: number;
  unavailable: number;
  dataErrors: number;
};

export type DuplicateGroup = {
  hashPrefix: string;
  items: { productId: string; productName: string; productSlug: string; imageId: string; imageUrl: string }[];
};

export type ImageIssueDetail = {
  productId: string;
  productName: string;
  imageId: string;
  imageUrl: string;
  issue: "broken" | "heavy";
  sizeBytes?: number;
};

export type ImageScanResult = {
  computedAt: string;
  imagesChecked: number;
  brokenImages: number;
  heavyImages: number;
  details: ImageIssueDetail[];
  /** True when this is a freshly-computed scan vs. a cached one read from the DB. */
  fresh: boolean;
};
