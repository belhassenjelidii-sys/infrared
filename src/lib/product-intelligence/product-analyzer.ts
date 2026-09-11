import "server-only";
import { computeImageFingerprint, findDuplicateMatches, type FingerprintedImage } from "./duplicate-detector";
import { rankSimilarProducts } from "./similarity-engine";
import { generateSeoSuggestion } from "./seo-generator";
import { generateTagSuggestion } from "./tag-generator";
import { validateProduct } from "./product-validator";
import type { AnalyzableProduct, ProductAnalysis } from "./types";

export type AnalyzeProductImageParams = {
  /** The photo to check for duplicates (perceptual hash). */
  imageUrl?: string | null;
  /** The product as currently drafted in the admin form (not yet saved). */
  draft: AnalyzableProduct;
  /** Other products' already-fingerprinted images, for duplicate-photo detection.
   *  Fetching + fingerprinting these is intentionally left to the caller (a
   *  future Server Action) so this module stays Prisma-free. */
  existingImages?: FingerprintedImage[];
  /** Other published products, for the "produits similaires" ranking. */
  existingProducts?: AnalyzableProduct[];
};

/**
 * Runs every local Product Intelligence module against a product draft
 * (+ optionally its main photo, for duplicate-photo detection) and
 * returns a single consolidated result. Every field here is a
 * *suggestion* for the admin/commercial screen — nothing is written to
 * the database by this function; the caller decides what (if anything)
 * to apply, and the person always confirms before saving.
 *
 * Note: this no longer includes color/shape photo analysis — that
 * feature was tried, tested against real photos, and removed as not
 * reliable enough to be useful. See the image-processing pipeline
 * (src/lib/image-pipeline/) for what actually runs on every upload now.
 */
export async function analyzeProductImage(params: AnalyzeProductImageParams): Promise<ProductAnalysis> {
  const { imageUrl, draft, existingImages = [], existingProducts = [] } = params;

  const fingerprint = imageUrl ? await computeImageFingerprint(imageUrl).catch(() => null) : null;
  const duplicates = fingerprint ? findDuplicateMatches(fingerprint.hash, existingImages) : [];
  const similar = existingProducts.length ? rankSimilarProducts(draft, existingProducts) : [];

  return {
    seo: generateSeoSuggestion(draft),
    tags: generateTagSuggestion(draft),
    validation: validateProduct(draft),
    duplicates,
    similar,
  };
}
