import "server-only";
import { fetchImageBytes } from "./image-processor";
import { hammingDistance } from "./image-hash";
import type { DuplicateMatch, ImageFingerprint } from "./types";

export { hammingDistance } from "./image-hash";

/**
 * Computes a 64-bit "average hash" (aHash) fingerprint for an image:
 * shrink to 8×8 grayscale, compare each pixel to the average brightness,
 * 1 bit per pixel. Two visually-similar photos (even re-compressed,
 * resized, or lightly cropped) end up with a small Hamming distance
 * between their hashes — this is a decades-old, fully local technique,
 * not a model and not a network call.
 */
export async function computeImageFingerprint(imageUrl: string): Promise<ImageFingerprint> {
  const { buffer } = await fetchImageBytes(imageUrl);
  const sharp = (await import("sharp")).default;
  const { data } = await sharp(buffer)
    .rotate()
    .flatten({ background: "#ffffff" })
    .toColourspace("srgb")
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data.subarray(0, 64));
  const avg = pixels.reduce((s, p) => s + p, 0) / pixels.length;

  let hash = BigInt(0);
  const one = BigInt(1);
  for (let i = 0; i < 64; i++) {
    hash = (hash << one) | (pixels[i] > avg ? one : BigInt(0));
  }
  return { hash: hash.toString(16).padStart(16, "0") };
}

export type FingerprintedImage = {
  productId: string;
  productName: string;
  productSlug: string;
  imageId: string;
  imageUrl: string;
  hash: string;
};

/**
 * Pure comparison function — deliberately has no Prisma/DB dependency of
 * its own, so it stays easy to test and reuse. The caller (the
 * product-analyzer orchestrator) is responsible for fetching candidate
 * images from the database and computing/caching their fingerprints.
 *
 * `maxDistance` of 8 (out of 64 bits) is a commonly-used aHash threshold
 * for "likely the same photo, possibly re-saved/resized/lightly cropped".
 */
export function findDuplicateMatches(
  candidateHash: string,
  existing: FingerprintedImage[],
  maxDistance = 8
): DuplicateMatch[] {
  return existing
    .map((img) => ({ img, distance: hammingDistance(candidateHash, img.hash) }))
    .filter((x) => x.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .map(({ img, distance }) => ({
      productId: img.productId,
      productName: img.productName,
      productSlug: img.productSlug,
      imageId: img.imageId,
      imageUrl: img.imageUrl,
      distance,
    }));
}
