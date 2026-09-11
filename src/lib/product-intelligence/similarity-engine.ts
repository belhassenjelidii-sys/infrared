import { parseColorValue } from "../glasses-attributes";
import { hammingDistance } from "./image-hash";
import type { AnalyzableProduct, SimilarProduct, SimilarityFactors } from "./types";

// similarityScore = brandMatch + categoryMatch + shapeMatch + colorMatch
//                 + targetMatch + priceProximity + visualSimilarity
// (+ a small freshnessBonus for nouveauté/promotion, used only as a
// tie-breaker among otherwise close scores — never enough on its own to
// outrank a genuinely more relevant match).
const WEIGHTS = {
  sameBrand: 0.22,
  sameCategory: 0.2,
  sameShape: 0.16,
  colorOverlap: 0.16,
  sameTarget: 0.1,
  priceProximity: 0.1,
  visualSimilarity: 0.06,
} as const;
const FRESHNESS_BONUS = 0.02; // isNew or isPromotion — small nudge, not a real "match"

function colorOverlap(colorA: string | null, colorB: string | null): number {
  const a = new Set(parseColorValue(colorA));
  const b = new Set(parseColorValue(colorB));
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((c) => b.has(c)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function priceProximity(priceA: number, priceB: number): number {
  const maxPrice = Math.max(priceA, priceB, 1);
  return Math.max(0, 1 - Math.abs(priceA - priceB) / maxPrice);
}

/** 0–1 from perceptual hash Hamming distance; 0 when either side has no hash yet (never fabricated). */
function visualSimilarity(hashA: string | null, hashB: string | null): number {
  if (!hashA || !hashB) return 0;
  return Math.max(0, 1 - hammingDistance(hashA, hashB) / 64);
}

/**
 * Scores how similar two products are for the "Vous pourriez également
 * aimer" recommendation, per the weighted formula:
 *
 *   similarityScore = brandMatch + categoryMatch + shapeMatch +
 *                      colorMatch + targetMatch + priceProximity +
 *                      visualSimilarity  (+ small freshness tie-breaker)
 *
 * Every factor is either a real attribute match, a continuous 0–1
 * proximity measure, or a perceptual-hash-based visual similarity — never
 * an AI guess. No external call.
 */
export function scoreSimilarity(a: AnalyzableProduct, b: AnalyzableProduct): SimilarProduct {
  const factors: SimilarityFactors = {
    sameBrand: a.brandName === b.brandName,
    sameCategory: a.categoryName === b.categoryName,
    sameShape: Boolean(a.shape) && a.shape === b.shape,
    sameTarget: a.target === b.target,
    colorOverlap: colorOverlap(a.color, b.color),
    priceProximity: priceProximity(a.price, b.price),
    visualSimilarity: visualSimilarity(a.mainImageHash, b.mainImageHash),
    freshnessBonus: b.isNew || b.isPromotion ? 1 : 0,
  };

  const score =
    (factors.sameBrand ? WEIGHTS.sameBrand : 0) +
    (factors.sameCategory ? WEIGHTS.sameCategory : 0) +
    (factors.sameShape ? WEIGHTS.sameShape : 0) +
    (factors.sameTarget ? WEIGHTS.sameTarget : 0) +
    factors.colorOverlap * WEIGHTS.colorOverlap +
    factors.priceProximity * WEIGHTS.priceProximity +
    factors.visualSimilarity * WEIGHTS.visualSimilarity +
    factors.freshnessBonus * FRESHNESS_BONUS;

  return { productId: b.id, score, factors };
}

/** Ranks candidates against a reference product, most similar first. Never includes the reference itself. */
export function rankSimilarProducts(
  reference: AnalyzableProduct,
  candidates: AnalyzableProduct[],
  limit = 4
): SimilarProduct[] {
  return candidates
    .filter((c) => c.id !== reference.id)
    .map((c) => scoreSimilarity(reference, c))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
