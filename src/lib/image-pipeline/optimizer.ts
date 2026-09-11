import "server-only";
import type { Sharp } from "sharp";
import type { GeneratedAsset } from "./types";

const ARCHIVAL_JPEG_QUALITY = 100;
const OPTIMIZED_WEBP_QUALITY = 100;
const AVIF_QUALITY = 100;
/** AVIF is only worth serving if it beats the WebP by at least this fraction — otherwise the extra
 *  storage/compute/decoder-support cost isn't justified for the size saved. Measured, not assumed. */
const AVIF_MIN_SAVINGS_FRACTION = 0.12;

async function encode(
  pipeline: Sharp,
  format: "jpeg" | "webp" | "avif",
  quality: number
): Promise<GeneratedAsset> {
  const instance = pipeline.clone();
  const { data, info } =
    format === "jpeg"
      ? await instance.jpeg({ quality, mozjpeg: true }).toBuffer({ resolveWithObject: true })
      : format === "webp"
        ? await instance.webp({ quality }).toBuffer({ resolveWithObject: true })
        : await instance.avif({ quality }).toBuffer({ resolveWithObject: true });

  return { buffer: data, format, width: info.width, height: info.height, size: data.length };
}

/**
 * OPTIMISATION + GÉNÉRATION DES VERSIONS stage.
 *  - `archivalPipeline` → high-quality mozjpeg (keeps frame detail crisp;
 *    this is the "don't visibly degrade the glasses" version kept for
 *    zoom/reference).
 *  - `optimizedPipeline` → WebP at a quality tuned for product photos —
 *    high enough that acetate/metal frame texture and edges stay sharp,
 *    while still being a fraction of the original's size.
 *  - AVIF is generated from the same optimized pipeline and *measured*
 *    against the WebP output; it's only kept when it's genuinely smaller
 *    by a meaningful margin (see AVIF_MIN_SAVINGS_FRACTION). Otherwise it's
 *    discarded — no point storing/serving a third format that doesn't
 *    actually save anything.
 */
export async function generateVersions(
  archivalPipeline: Sharp,
  optimizedPipeline: Sharp
): Promise<{ archival: GeneratedAsset; optimized: GeneratedAsset; avif: GeneratedAsset | null }> {
  const [archival, optimized] = await Promise.all([
    encode(archivalPipeline, "jpeg", ARCHIVAL_JPEG_QUALITY),
    encode(optimizedPipeline, "webp", OPTIMIZED_WEBP_QUALITY),
  ]);

  let avif: GeneratedAsset | null = null;
  try {
    const avifCandidate = await encode(optimizedPipeline, "avif", AVIF_QUALITY);
    if (avifCandidate.size <= optimized.size * (1 - AVIF_MIN_SAVINGS_FRACTION)) {
      avif = avifCandidate;
    }
  } catch {
    // AVIF encoding can fail on some inputs/builds — it's a bonus format,
    // never block the pipeline over it.
  }

  return { archival, optimized, avif };
}
