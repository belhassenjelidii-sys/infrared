import "server-only";
import type { AnalyzableProduct, ValidationIssue, ValidationResult } from "./types";

/**
 * Rule-based checks for product completeness and sanity — the kind of
 * thing a careful human reviewer would flag, made consistent and instant.
 * Nothing here is AI-generated; it's a fixed list of rules over the
 * product's own fields. `valid` is false only when an "error"-severity
 * issue exists — "warning"s are surfaced to staff but don't block saving.
 */
export function validateProduct(product: AnalyzableProduct): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!product.name || product.name.trim().length < 3) {
    issues.push({ field: "name", severity: "error", message: "Le nom du produit est trop court ou manquant." });
  }
  if (!product.description || product.description.trim().length < 15) {
    issues.push({
      field: "description",
      severity: "warning",
      message: "La description est très courte — une description plus détaillée aide le SEO et le client.",
    });
  }
  if (!Number.isFinite(product.price) || product.price <= 0) {
    issues.push({ field: "price", severity: "error", message: "Le prix doit être un nombre supérieur à 0." });
  }
  if (!product.brandName) {
    issues.push({ field: "brandId", severity: "error", message: "Aucune marque sélectionnée." });
  }
  if (!product.categoryName) {
    issues.push({ field: "categoryId", severity: "error", message: "Aucune catégorie sélectionnée." });
  }
  if (product.images.length === 0) {
    issues.push({ field: "images", severity: "warning", message: "Aucune photo — le produit s'affichera avec un visuel générique." });
  }
  if (!product.color) {
    issues.push({ field: "color", severity: "warning", message: "Couleur non renseignée." });
  }
  if (!product.shape) {
    issues.push({ field: "shape", severity: "warning", message: "Forme non renseignée." });
  }

  return { valid: !issues.some((i) => i.severity === "error"), issues };
}
