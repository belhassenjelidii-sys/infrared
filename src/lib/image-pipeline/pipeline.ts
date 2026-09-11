import "server-only";
import { validateImage } from "./validator";
import { normalizeImage } from "./normalizer";
import { centerAndResize } from "./resizer";
import { generateVersions } from "./optimizer";
import type { PipelineOptions, PipelineOutput } from "./types";

const DEFAULT_OPTIMIZED_MAX_DIMENSION = 2400;
const DEFAULT_ARCHIVAL_MAX_DIMENSION = 3200;

/**
 * The full local image-processing pipeline for one uploaded photo:
 *
 *   PHOTO ORIGINALE → VALIDATION → NORMALISATION → OPTIMISATION →
 *   RECADRAGE → GÉNÉRATION DES VERSIONS
 *
 * Pure function: takes raw bytes in, returns processed buffers out.
 * Storage (Supabase or local dev fallback) is deliberately a separate
 * step — see storage.ts — so this stays testable without any I/O beyond
 * `sharp`'s own decoding.
 *
 * Never silently degrades the photo: the archival version stays at a
 * high JPEG quality and a generous dimension cap specifically so frame
 * detail (hinges, engraving, texture) stays legible; RECADRAGE only
 * crops when a clean subject region was actually found (see resizer.ts)
 * and otherwise leaves the full composition untouched.
 *
 * @throws Error with a clear French message — see validator.ts for the
 *         specific validation failures (bad format, too large, corrupt,
 *         wrong dimensions).
 */
export async function processImage(
  buffer: Buffer,
  options: PipelineOptions
): Promise<PipelineOutput> {
  // VALIDATION
  const validated = await validateImage(buffer);

  // NORMALISATION
  const normalized = await normalizeImage(validated.buffer);
  // Re-read dimensions post-rotate: a 90°/270° EXIF rotation swaps width/height.
  const normalizedMeta = await normalized.clone().metadata();
  const width = normalizedMeta.width ?? validated.width;
  const height = normalizedMeta.height ?? validated.height;

  // RECADRAGE (+ resize) — archival keeps the full composition; optimized
  // may be cropped/centered.
  const archivalStage = normalized
    .clone()
    .resize(options.archivalMaxDimension ?? DEFAULT_ARCHIVAL_MAX_DIMENSION, options.archivalMaxDimension ?? DEFAULT_ARCHIVAL_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });

  const { pipeline: optimizedStage, centered } = await centerAndResize(normalized, width, height, {
    centerSubject: options.centerSubject,
    maxDimension: options.optimizedMaxDimension ?? DEFAULT_OPTIMIZED_MAX_DIMENSION,
  });

  // OPTIMISATION + GÉNÉRATION DES VERSIONS
  const { archival, optimized, avif } = await generateVersions(archivalStage, optimizedStage);

  return { archival, optimized, avif, centered };
}
