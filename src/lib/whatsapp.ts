// Centralized WhatsApp integration — the ONLY place that builds wa.me
// links or composes message text. No component should hardcode a phone
// number or write its own message string; the number always comes from
// StoreSettings (or a specific Store's own number for store-contact
// messages), fetched by the caller and passed in here.
//
// No server-only dependency (safe to import from Client Components too —
// e.g. ProductHighlightCard, Header).

const SITE_NAME = "InfraRed Optic-Store";

/**
 * Builds a wa.me deep link with a pre-filled, correctly URL-encoded
 * message. Returns `null` when no number is configured — callers MUST
 * treat that as "hide the WhatsApp action", never fall back to a
 * numberless `wa.me/?text=...` link, which does not reliably open a chat
 * and is effectively a broken link.
 */
export function buildWhatsAppLink(whatsapp: string | null | undefined, message: string): string | null {
  const number = (whatsapp || "").replace(/[^0-9]/g, "");
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ---------------------------------------------------------------------------
// Message composition — plain text, gender/agreement-aware where it's
// cheap to do (colors as adjectives agreeing with "monture", feminine).
// ---------------------------------------------------------------------------

const COLOR_FEMININE: Record<string, string> = {
  Noir: "noire",
  Blanc: "blanche",
  Gris: "grise",
  Marron: "marron",
  Beige: "beige",
  Doré: "dorée",
  Argenté: "argentée",
  Écaille: "écaille",
  Bleu: "bleue",
  "Bleu marine": "bleu marine",
  Rouge: "rouge",
  Bordeaux: "bordeaux",
  Vert: "verte",
  Kaki: "kaki",
  Rose: "rose",
  Violet: "violette",
  Jaune: "jaune",
  Orange: "orange",
  Transparent: "transparente",
  Multicolore: "multicolore",
};

/** "Noir et Blanc" -> "noire et blanche" — falls back to a lowercased pass-through for any unrecognized value. */
function feminizeColor(color: string | null | undefined): string {
  if (!color) return "";
  return color
    .split(/ et /i)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => COLOR_FEMININE[c] ?? c.toLowerCase())
    .join(" et ");
}

export type WhatsAppProduct = {
  name: string;
  brandName: string;
  reference: string;
  color: string | null;
  shape?: string | null;
};

/**
 * "Message produit" — the main contextual message shown on a product
 * page / product card, e.g.:
 * "Bonjour InfraRed Optic-Store, je suis intéressé par la monture Ray-Ban
 *  RB1234 noire rectangulaire. Pouvez-vous me confirmer sa disponibilité
 *  et dans quelle boutique je peux l'essayer ?"
 */
export function generateProductWhatsAppMessage(product: WhatsAppProduct): string {
  const modelPart = [product.brandName, product.reference].filter(Boolean).join(" ") || product.name;
  const colorPart = feminizeColor(product.color);
  const shapePart = product.shape ? product.shape.toLowerCase() : "";
  const descriptors = [colorPart, shapePart].filter(Boolean).join(" ");

  return (
    `Bonjour ${SITE_NAME}, je suis intéressé par la monture ${modelPart}` +
    `${descriptors ? ` ${descriptors}` : ""}. ` +
    `Pouvez-vous me confirmer sa disponibilité et dans quelle boutique je peux l'essayer ?`
  );
}

/** "Message disponibilité" — a shorter, stock-focused variant (e.g. an "in stock?" quick-check CTA). */
export function generateAvailabilityWhatsAppMessage(product: WhatsAppProduct): string {
  const modelPart = [product.brandName, product.reference].filter(Boolean).join(" ") || product.name;
  return `Bonjour ${SITE_NAME}, la monture ${modelPart} est-elle disponible en boutique ?`;
}

/** "Message boutique" — contacting one specific store. */
export function generateStoreWhatsAppMessage(storeName: string): string {
  return `Bonjour ${SITE_NAME}, je vous contacte au sujet de la boutique ${storeName}.`;
}

/** "Message général" — no product/store context (header, footer, contact page). */
export function generateGeneralWhatsAppMessage(): string {
  return `Bonjour ${SITE_NAME}, j'ai une question.`;
}
