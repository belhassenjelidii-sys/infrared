import "server-only";
import type { SupportedInputFormat, ValidatedImage } from "./types";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const MIN_DIMENSION = 150; // px — below this, not useful as a product photo
export const MAX_DIMENSION = 8000; // px — above this, almost certainly abuse/mistake, not a real product photo

const ALLOWED_MIME: Record<string, "jpeg" | "png" | "webp"> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Confirms the buffer's real content matches the declared image format by
 * checking magic bytes — the browser-sent Content-Type is never trusted
 * alone. Fast, cheap, first line of defense before the heavier sharp
 * decode below.
 */
function sniffFormat(buffer: Buffer): SupportedInputFormat | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return "image/png";
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return "image/webp";
  return null;
}

/**
 * VALIDATION stage. Checks, in order (cheapest first, so obviously-bad
 * input never reaches the expensive steps):
 *  1. Buffer isn't empty and doesn't exceed MAX_UPLOAD_BYTES.
 *  2. Magic bytes actually match a supported image format (JPG/PNG/WEBP)
 *     — never trusts a declared Content-Type alone.
 *  3. `sharp` can genuinely decode it (catches corrupt/truncated files
 *     that happen to start with valid magic bytes) — `limitInputPixels`
 *     caps the decoded pixel count so a maliciously crafted file can't
 *     force an enormous in-memory bitmap even if its compressed size is
 *     small (a classic "decompression bomb").
 *  4. Dimensions are within a sane product-photo range.
 *
 * Throws a clear, French error message on any failure — never returns a
 * partially-valid result.
 */
export async function validateImage(buffer: Buffer): Promise<ValidatedImage> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Fichier vide.");
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Fichier trop volumineux (${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} Mo max).`);
  }

  const sniffed = sniffFormat(buffer);
  if (!sniffed) {
    throw new Error("Le fichier n'est pas une image JPG, PNG ou WEBP valide.");
  }

  const sharp = (await import("sharp")).default;
  let metadata: { width?: number; height?: number; format?: string };
  try {
    metadata = await sharp(buffer, { limitInputPixels: 40_000 * 40_000 }).metadata();
  } catch {
    throw new Error("Impossible de décoder l'image — fichier corrompu ou format non supporté.");
  }

  const { width, height } = metadata;
  if (!width || !height) {
    throw new Error("Impossible de déterminer les dimensions de l'image.");
  }
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(`Image trop petite (minimum ${MIN_DIMENSION}×${MIN_DIMENSION}px).`);
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`Image trop grande (maximum ${MAX_DIMENSION}×${MAX_DIMENSION}px).`);
  }

  return {
    buffer,
    declaredMimeType: sniffed,
    width,
    height,
  };
}

export function mimeToFormatLabel(mime: SupportedInputFormat): "jpeg" | "png" | "webp" {
  return ALLOWED_MIME[mime];
}
