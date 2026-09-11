// Fixed eyewear color palette. Keeping this list shared between the picker
// UI and the AI detection prompt guarantees the AI can only ever suggest a
// value that's actually selectable — no mismatch, no free-text drift.
// "Multicolore" is a special case handled by the detector itself (see
// product-intelligence/ modules that consume it) rather than a single hex swatch.
export const GLASSES_COLORS = [
  { name: "Noir", hex: "#111111" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Gris", hex: "#9CA3AF" },
  { name: "Marron", hex: "#6B4226" },
  { name: "Beige", hex: "#D8C3A5" },
  { name: "Doré", hex: "#C9A227" },
  { name: "Argenté", hex: "#C0C0C0" },
  { name: "Écaille", hex: "#8B5E34" },
  { name: "Bleu", hex: "#2563EB" },
  { name: "Bleu marine", hex: "#1E3A5F" },
  { name: "Rouge", hex: "#DC2626" },
  { name: "Bordeaux", hex: "#7F1D1D" },
  { name: "Vert", hex: "#16A34A" },
  { name: "Kaki", hex: "#6B7A3A" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Jaune", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Transparent", hex: "#F3F4F6" },
  { name: "Multicolore", hex: "conic-gradient" },
] as const;

export const GLASSES_COLOR_NAMES = GLASSES_COLORS.map((c) => c.name);

/** Palette entries the pixel-level detector actually classifies pixels into
 *  (excludes "Multicolore", which is a derived verdict, not a paintable hex). */
export const DETECTABLE_GLASSES_COLORS = GLASSES_COLORS.filter((c) => c.name !== "Multicolore");

export const GLASSES_SHAPES = [
  "Ronde",
  "Ovale",
  "Carrée",
  "Rectangulaire",
  "Aviateur",
  "Papillon",
  "Géométrique",
  "Wayfarer",
  "Cat-eye",
  "Autre",
] as const;

/** Splits a stored "Noir et Blanc" / "Noir, Blanc" value back into a color-name array. */
export function parseColorValue(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/,| et /i)
    .map((s) => s.trim())
    .filter((s) => GLASSES_COLOR_NAMES.includes(s as (typeof GLASSES_COLOR_NAMES)[number]));
}

/** Joins up to 2 selected color names into the single stored string, e.g. "Noir et Blanc". */
export function joinColorValue(names: string[]): string {
  return names.slice(0, 2).join(" et ");
}
