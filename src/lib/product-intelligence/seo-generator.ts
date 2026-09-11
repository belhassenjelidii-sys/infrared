import type { AnalyzableProduct, SeoSuggestion } from "./types";

const SITE_NAME = "InfraRed Optic-Store";
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Generates a suggested meta title/description from the product's own
 * fields — deterministic templating, not a language model. Always shown
 * as an editable suggestion in the admin form, never saved silently.
 */
export function generateSeoSuggestion(product: AnalyzableProduct): SeoSuggestion {
  const brandPart = product.brandName ? ` ${product.brandName}` : "";
  const rawTitle = `${product.name}${brandPart} — ${SITE_NAME}`;
  const metaTitle = truncate(rawTitle, TITLE_MAX);

  const descriptors = [
    product.brandName,
    product.categoryName,
    product.color,
    product.target && product.target !== "MIXTE" ? product.target.toLowerCase() : null,
  ].filter((v): v is string => Boolean(v));

  const base = product.description?.trim()
    ? product.description.trim()
    : `${product.name}${descriptors.length ? ` — ${descriptors.join(", ")}` : ""}, disponible chez ${SITE_NAME}, opticien à Tunis.`;

  const metaDescription = truncate(base, DESCRIPTION_MAX);

  return { metaTitle, metaDescription };
}
