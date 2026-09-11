/**
 * Product Intelligence Engine — shared types.
 *
 * Everything in `src/lib/product-intelligence/` runs 100% locally in the
 * Node.js process (no external API calls, no network dependency at
 * runtime). It exists to assist Admin/Commercial when adding or reviewing
 * a product — every suggestion it produces is just that, a suggestion:
 * nothing here writes to the database directly, and nothing here is
 * presented to the shopper. A human always confirms before anything is
 * saved.
 *
 * Note: photo color/shape auto-detection was tried, tested against real
 * product photos, and removed as not reliable enough to be useful — see
 * src/lib/image-pipeline/ for what actually runs on every upload now
 * (validation, normalization, resizing/optimization, format generation).
 */

export type ImageFetchResult = {
  buffer: Buffer;
  contentType: string;
};

// ---------------------------------------------------------------------------
// Duplicate detection (duplicate-detector.ts)
// ---------------------------------------------------------------------------

export type ImageFingerprint = {
  /** 64-bit perceptual hash (aHash), as a 16-char hex string. */
  hash: string;
};

export type DuplicateMatch = {
  productId: string;
  productName: string;
  productSlug: string;
  imageId: string;
  imageUrl: string;
  /** Hamming distance between fingerprints — 0 = identical, higher = more different. */
  distance: number;
};

// ---------------------------------------------------------------------------
// Similarity engine (similarity-engine.ts)
// ---------------------------------------------------------------------------

export type SimilarityFactors = {
  sameBrand: boolean;
  sameCategory: boolean;
  sameShape: boolean;
  sameTarget: boolean;
  colorOverlap: number; // 0–1
  priceProximity: number; // 0–1, 1 = identical price
  /** 0–1, from perceptual image hash distance — 0 when no hash is available for either side. */
  visualSimilarity: number;
  /** Small bonus signal, not a "match" per se — surfaces fresh/on-sale stock among otherwise-tied candidates. */
  freshnessBonus: number;
};

export type SimilarProduct = {
  productId: string;
  score: number; // 0–1
  factors: SimilarityFactors;
};

// ---------------------------------------------------------------------------
// SEO generation (seo-generator.ts)
// ---------------------------------------------------------------------------

export type SeoSuggestion = {
  metaTitle: string;
  metaDescription: string;
};

// ---------------------------------------------------------------------------
// Tag generation (tag-generator.ts)
// ---------------------------------------------------------------------------

export type TagSuggestion = {
  tags: string[];
};

// ---------------------------------------------------------------------------
// Validation (product-validator.ts)
// ---------------------------------------------------------------------------

export type ValidationIssue = {
  field: string;
  severity: "error" | "warning";
  message: string;
};

export type ValidationResult = {
  valid: boolean; // false only when at least one "error"-severity issue exists
  issues: ValidationIssue[];
};

// ---------------------------------------------------------------------------
// Orchestrator (product-analyzer.ts)
// ---------------------------------------------------------------------------

/** Minimal shape of a product needed by the analyzer — deliberately not the
 *  full Prisma type, so this module never depends on Prisma directly. */
export type AnalyzableProduct = {
  id: string;
  name: string;
  slug: string;
  reference: string;
  description: string;
  price: number;
  oldPrice: number | null;
  isPromotion: boolean;
  isNew: boolean;
  color: string | null;
  shape: string | null;
  brandName: string;
  categoryName: string;
  target: string;
  images: { id: string; url: string }[];
  /** Perceptual hash (aHash) of the main image, if one has been computed — see product-intelligence/duplicate-detector.ts. */
  mainImageHash: string | null;
};

export type ProductAnalysis = {
  seo?: SeoSuggestion;
  tags?: TagSuggestion;
  validation: ValidationResult;
  duplicates: DuplicateMatch[];
  similar?: SimilarProduct[];
};

// ---------------------------------------------------------------------------
// Metadata generator (metadata-generator.ts)
// ---------------------------------------------------------------------------

export type ProductMetadataSuggestion = {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  imageAlt: string;
  tags: string[];
  shortText: string;
  whatsappTitle: string;
};
