import "server-only";
import type { Sharp } from "sharp";

/**
 * NORMALISATION stage. Returns a configured (not yet materialized) sharp
 * pipeline so later stages (resize/crop/optimize) can keep chaining
 * without re-decoding the image:
 *
 *  - `.rotate()` bakes in the EXIF orientation (phone photos are commonly
 *    stored "sideways" with a rotation flag) so every downstream
 *    consumer — this pipeline, `<img>`, browsers — sees the image
 *    right-side up without needing to interpret EXIF themselves.
 *  - `.flatten()` composites any transparency onto white — glasses photos
 *    with a transparent PNG background become a clean white background
 *    instead of undefined/black when later encoded to JPEG.
 *  - `.toColourspace("srgb")` forces a consistent, predictable color
 *    space regardless of the source file's embedded ICC profile (CMYK
 *    JPEGs, wide-gamut PNGs, etc.) — avoids color shifts and decoder
 *    edge cases in later stages.
 *  - Metadata (EXIF camera info, GPS location if present, ICC profile) is
 *    stripped by simply not calling `.withMetadata()` — sharp omits it
 *    from the output by default, which is exactly what we want here:
 *    no camera/location data should ever end up on a public product
 *    photo URL.
 */
export async function normalizeImage(buffer: Buffer): Promise<Sharp> {
  const sharpLib = (await import("sharp")).default;
  return sharpLib(buffer, { limitInputPixels: 40_000 * 40_000 })
    .rotate()
    .flatten({ background: "#ffffff" })
    .toColourspace("srgb");
}
