import icons from "./inspiration-icons.json";

export type InspirationItem = { id: string; title: string; svg: string; visible: boolean };
export const MAX_INSPIRATION_ITEMS = 12;
export const MAX_SVG_LENGTH = 50_000;

// Pictograms from the reference supplied by the user: visiofactory.com/fr/.
export const DEFAULT_INSPIRATION_ITEMS: InspirationItem[] = [
  "Des questions ?\nConsultez notre F.A.Q.",
  "Livraison gratuite\ndès 100€ en France",
  "Retour gratuit",
  "Paiement sécurisé",
  "Remboursement\nmutuelles",
  "Produits certifiés",
].map((title, index) => ({ id: `service-${index + 1}`, title, svg: icons[index], visible: true }));

export function validateInspirationSvg(value: unknown): string {
  if (typeof value !== "string") throw new Error("Le pictogramme doit être un SVG.");
  const svg = value.trim().replace(/^<\?xml[^?]*\?>\s*/i, "");
  if (svg.length > MAX_SVG_LENGTH || !/^<svg\b[\s\S]*<\/svg>$/i.test(svg)) {
    throw new Error("Choisissez un SVG complet de moins de 50 Ko.");
  }
  if (/<\s*(?:script|foreignObject|iframe|object|embed|image|animate\w*|set)\b|<!DOCTYPE|<!ENTITY|\bon\w+\s*=|(?:href\s*=\s*["']\s*(?!#))|url\(\s*["']?(?!#)|@import/i.test(svg)) {
    throw new Error("Le SVG doit être un pictogramme autonome, sans script ni contenu externe.");
  }
  return svg;
}

export function parseInspirationItems(value: unknown): InspirationItem[] {
  if (!Array.isArray(value) || value.length > MAX_INSPIRATION_ITEMS) throw new Error("12 pictogrammes maximum.");
  const ids = new Set<string>();
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Pictogramme invalide.");
    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(entry.id) || ids.has(entry.id)) throw new Error("Identifiant de pictogramme invalide.");
    if (typeof entry.title !== "string" || !entry.title.trim() || entry.title.length > 200) throw new Error("Chaque pictogramme doit avoir un titre (200 caractères maximum).");
    ids.add(entry.id);
    return { id: entry.id, title: entry.title.trim(), svg: validateInspirationSvg(entry.svg), visible: entry.visible !== false };
  });
}

// Always render user-supplied SVG as an image, never inject it into the page DOM.
export function inspirationSvgUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
