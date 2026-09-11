/**
 * Image Processing Pipeline — shared types.
 *
 * PHOTO ORIGINALE → VALIDATION → NORMALISATION → OPTIMISATION → RECADRAGE
 * → GÉNÉRATION DES VERSIONS → STOCKAGE
 *
 * Runs entirely locally via `sharp` (native, offline). No AI, no external
 * API. See pipeline.ts for the orchestrator.
 */

export type SupportedInputFormat = "image/jpeg" | "image/png" | "image/webp";

export type ValidatedImage = {
  buffer: Buffer;
  declaredMimeType: SupportedInputFormat;
  width: number;
  height: number;
};

/** One generated file: its bytes plus what a caller needs to store/report it. */
export type GeneratedAsset = {
  buffer: Buffer;
  format: "jpeg" | "png" | "webp" | "avif";
  width: number;
  height: number;
  size: number; // bytes
};

/** Everything the pipeline produces from one source photo, before storage. */
export type PipelineOutput = {
  /** Normalized, high-quality archival version (capped dimension, not the tiny display size). */
  archival: GeneratedAsset;
  /** The primary optimized version served on the site — resized, (optionally) centered, WebP. */
  optimized: GeneratedAsset;
  /** Only present when AVIF measured meaningfully smaller than the WebP for this image. */
  avif: GeneratedAsset | null;
  /** True when a foreground bounding box was found and used to center/crop the subject. */
  centered: boolean;
};

/** Final result after uploading PipelineOutput's assets — the shape requested for the API/UI. */
export type ProcessedImageResult = {
  /** URL of the archival/original (normalized, EXIF-corrected, not aggressively resized) version. */
  original: string;
  /** URL of the optimized, primary display version. */
  optimized: string;
  width: number;
  height: number;
  format: string;
  size: number;
  /** URL of the AVIF variant, only when it was actually generated (real size benefit). */
  avif: string | null;
};

export type PipelineOptions = {
  /** Storage grouping — must match ALLOWED_FOLDERS in /api/uploads. */
  folder: string;
  /**
   * Whether to try to detect and center the product within the frame
   * (background subtraction + padded crop). Appropriate for product
   * photos on a plain background; not for store photos, brand logos, or
   * hero banners, which should keep their original composition.
   */
  centerSubject: boolean;
  /** Longest-side cap for the optimized/display version, in px. */
  optimizedMaxDimension?: number;
  /** Longest-side cap for the archival version, in px. */
  archivalMaxDimension?: number;
};

// ---------------------------------------------------------------------------
// Background removal (background-remover.ts)
// ---------------------------------------------------------------------------

export type BackgroundRemovalResult =
  | { success: true; buffer: Buffer; width: number; height: number; subjectFraction: number }
  | { success: false; reason: string };
