import { parseColorValue } from "../glasses-attributes";
import { formatDT } from "../currency";
import { generateSeoSuggestion } from "./seo-generator";
import { generateTagSuggestion } from "./tag-generator";
import type { AnalyzableProduct, ProductMetadataSuggestion } from "./types";

const SITE_NAME = "InfraRed Optic-Store";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a *suggested* slug from brand + reference + color + shape —
 * e.g. "ray-ban-rb1234-noir-rectangulaire". This is informational only:
 * the product's actual saved slug is still derived from its name with a
 * guaranteed-unique suffix (see prisma/schema.prisma's @unique constraint
 * and uniqueSlug() in produits/nouveau/actions.ts) — changing the live
 * URL slug of an existing product is a routing/SEO decision outside this
 * generator's scope, so this value is shown for reference/copy, not
 * auto-applied to the saved product.
 */
function generateSlugSuggestion(product: AnalyzableProduct): string {
  const parts = [product.brandName, product.reference, ...parseColorValue(product.color), product.shape]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map(slugify)
    .filter(Boolean);
  return parts.length ? parts.join("-") : slugify(product.name);
}

/** e.g. "Ray-Ban RB1234 noir, monture rectangulaire" — only known fields, nothing invented. */
function generateImageAlt(product: AnalyzableProduct): string {
  const colorPart = parseColorValue(product.color).join(" et ").toLowerCase();
  const bits = [
    [product.brandName, product.reference].filter(Boolean).join(" ") || product.name,
    colorPart || null,
  ].filter(Boolean);
  let alt = bits.join(" ");
  if (product.shape) alt += `, monture ${product.shape.toLowerCase()}`;
  return alt;
}

/**
 * A short (1–2 sentence) description built strictly from known fields —
 * brand, reference, category, color, shape, target, price/promotion. No
 * material, technology, origin, certification, or availability claims
 * are ever added, since none of those are guaranteed to be present or
 * accurate for a given product.
 */
function generateShortText(product: AnalyzableProduct): string {
  const colorPart = parseColorValue(product.color).join(" et ");
  const descriptors = [
    product.categoryName,
    colorPart || null,
    product.shape ? `forme ${product.shape.toLowerCase()}` : null,
    product.target && product.target !== "MIXTE" ? `pour ${product.target.toLowerCase()}` : null,
  ].filter((v): v is string => Boolean(v));

  const namePart = [product.brandName, product.reference].filter(Boolean).join(" ") || product.name;
  let text = `${namePart}${descriptors.length ? ` — ${descriptors.join(", ")}` : ""}.`;

  if (product.price <= 0) {
    text += " Prix à confirmer en boutique.";
  } else if (product.isPromotion && product.oldPrice) {
    text += ` En promotion à ${formatDT(product.price)} (au lieu de ${formatDT(product.oldPrice)}).`;
  } else {
    text += ` ${formatDT(product.price)}.`;
  }
  return text;
}

/** Short line meant for a WhatsApp message context — matches the format already used in buildWhatsAppLink() call sites. */
function generateWhatsappTitle(product: AnalyzableProduct): string {
  const namePart = [product.brandName, product.reference].filter(Boolean).join(" ") || product.name;
  const colorPart = parseColorValue(product.color).join("/");
  const bits = [namePart, colorPart || null, product.price > 0 ? formatDT(product.price) : "Prix en boutique"].filter(Boolean);
  return bits.join(" – ");
}

/**
 * Generates every piece of product metadata this admin form needs, from
 * fields already present on the product (brand, reference, category,
 * shape, color, target, price/promotion) or typed by the user (name,
 * description) — never from an external source, and never inventing
 * material, technology, origin, certification, availability, or specs
 * not already on the record. Always a suggestion: shown pre-filled but
 * editable, with "Régénérer" to recompute and "Modifier" to hand-edit.
 */
export function generateProductMetadata(product: AnalyzableProduct): ProductMetadataSuggestion {
  const seo = generateSeoSuggestion(product);
  const tags = generateTagSuggestion(product);

  return {
    slug: generateSlugSuggestion(product),
    seoTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    imageAlt: generateImageAlt(product),
    tags: tags.tags,
    shortText: generateShortText(product),
    whatsappTitle: generateWhatsappTitle(product),
  };
}

export { SITE_NAME };
