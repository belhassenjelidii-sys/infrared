import { parseColorValue } from "../glasses-attributes";
import type { AnalyzableProduct, TagSuggestion } from "./types";

function slugishWord(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Generates a set of searchable tags from a product's own attributes —
 * brand, category, colors, shape, target audience. Deterministic, not an
 * AI-generated summary. Intended to seed the (future) search index /
 * on-page keyword hints without any manual retyping of what's already on
 * the product form.
 */
export function generateTagSuggestion(product: AnalyzableProduct): TagSuggestion {
  const tags = new Set<string>();

  if (product.brandName) tags.add(slugishWord(product.brandName));
  if (product.categoryName) tags.add(slugishWord(product.categoryName));
  if (product.shape) tags.add(slugishWord(product.shape));
  if (product.target) tags.add(slugishWord(product.target));
  for (const color of parseColorValue(product.color)) tags.add(slugishWord(color));

  // A couple of compound tags people actually search for.
  if (product.brandName && product.categoryName) {
    tags.add(`${slugishWord(product.brandName)} ${slugishWord(product.categoryName)}`);
  }
  if (product.shape && product.categoryName) {
    tags.add(`lunettes ${slugishWord(product.shape)}`);
  }

  return { tags: [...tags].filter(Boolean) };
}
