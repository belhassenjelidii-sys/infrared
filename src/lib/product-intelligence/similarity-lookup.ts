import "server-only";
import { prisma } from "@/lib/prisma";
import { hammingDistance, type FingerprintedImage } from "./duplicate-detector";
import type { DuplicateMatch } from "./types";

/**
 * "Produit visuellement très proche" is broader than "quasi-identique" —
 * this feature is explicitly meant to also catch the same model
 * reshot/recompressed, not just byte-for-byte duplicates. 12/64 bits ≈ 81%
 * similarity floor.
 */
const SIMILARITY_MAX_DISTANCE = 12;

export function distanceToSimilarityPercent(distance: number): number {
  return Math.round((1 - distance / 64) * 100);
}

/**
 * Finds existing product images perceptually similar to a given hash.
 *
 * Scalability: this NEVER re-fetches or re-decodes any existing image
 * file — it only reads the small precomputed `phash` string already
 * stored on each ProductImage row (see the phash column + index added in
 * prisma/schema.prisma). Comparing a few hundred/thousand 16-character
 * hex strings in memory is effectively instant; the expensive step
 * (decoding + hashing a real image) only ever happens once, for the new
 * upload, not for the whole catalog on every check.
 *
 * If this catalog ever grows into the tens/hundreds of thousands of
 * images, the next scaling step would be bucketing by hash prefix (a
 * cheap form of locality-sensitive hashing) so the SQL query itself
 * narrows the candidate set — not necessary at a boutique catalog's
 * scale, so not built prematurely here.
 */
export async function findSimilarExistingImages(
  candidateHash: string,
  excludeProductId?: string
): Promise<DuplicateMatch[]> {
  const rows = await prisma.productImage.findMany({
    where: {
      phash: { not: null },
      ...(excludeProductId ? { productId: { not: excludeProductId } } : {}),
    },
    select: {
      id: true,
      url: true,
      phash: true,
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  const candidates: FingerprintedImage[] = rows
    .filter((r) => r.phash)
    .map((r) => ({
      productId: r.product.id,
      productName: r.product.name,
      productSlug: r.product.slug,
      imageId: r.id,
      imageUrl: r.url,
      hash: r.phash as string,
    }));

  return candidates
    .map((c) => ({ c, distance: hammingDistance(candidateHash, c.hash) }))
    .filter((x) => x.distance <= SIMILARITY_MAX_DISTANCE)
    .sort((a, b) => a.distance - b.distance)
    .map(({ c, distance }) => ({
      productId: c.productId,
      productName: c.productName,
      productSlug: c.productSlug,
      imageId: c.imageId,
      imageUrl: c.imageUrl,
      distance,
    }));
}
