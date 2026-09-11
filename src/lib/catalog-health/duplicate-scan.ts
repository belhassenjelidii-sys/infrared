import "server-only";
import { prisma } from "@/lib/prisma";
import { hammingDistance } from "@/lib/product-intelligence/duplicate-detector";
import type { DuplicateGroup } from "./types";

const SIMILARITY_MAX_DISTANCE = 10; // ~84% similarity floor — tighter than the single-upload check, to keep this dashboard signal high-confidence

/**
 * Groups product images whose perceptual hash is close enough to look
 * like duplicates or near-duplicates — same mechanism as the single-photo
 * check in product-intelligence/similarity-lookup.ts, applied catalog-wide.
 *
 * Scalability: only reads `id, url, phash, productId/name/slug` — never
 * full product rows, never re-decodes any image. The pairwise comparison
 * below is O(n²) over the number of hashed images, which is fine at a
 * boutique catalog's scale (hundreds to low thousands of photos); for a
 * catalog large enough to matter, the pool could be pre-bucketed by hash
 * prefix before the pairwise pass — not built here since it isn't needed
 * yet, consistent with how similarity-lookup.ts documents the same
 * decision.
 */
export async function findPotentialDuplicates(): Promise<DuplicateGroup[]> {
  const images = await prisma.productImage.findMany({
    where: { phash: { not: null }, product: { archived: false } },
    select: { id: true, url: true, phash: true, product: { select: { id: true, name: true, slug: true } } },
  });

  const withHash = images.filter((i): i is typeof i & { phash: string } => Boolean(i.phash));

  const visited = new Set<string>();
  const groups: DuplicateGroup[] = [];

  // A 64-bit hash is represented by 16 hexadecimal nibbles. If two hashes
  // differ by at most 10 bits, at least one nibble must be identical (16
  // nibbles × one differing bit would already exceed the threshold). Index
  // each image into all 16 nibble buckets, then compare only candidates that
  // share at least one bucket. Random/unrelated images therefore avoid most
  // pairwise distance calculations while preserving the same threshold.
  const byId = new Map(withHash.map((image) => [image.id, image]));
  const buckets = Array.from({ length: 16 }, () => new Map<string, typeof withHash>());
  for (const image of withHash) {
    const hash = image.phash.toLowerCase().padStart(16, "0").slice(-16);
    for (let pos = 0; pos < 16; pos++) {
      const key = hash[pos];
      const bucket = buckets[pos].get(key);
      if (bucket) bucket.push(image);
      else buckets[pos].set(key, [image]);
    }
  }

  for (let i = 0; i < withHash.length; i++) {
    if (visited.has(withHash[i].id)) continue;
    const cluster = [withHash[i]];
    visited.add(withHash[i].id);
    const hash = withHash[i].phash.toLowerCase().padStart(16, "0").slice(-16);
    const candidateIds = new Set<string>();
    for (let pos = 0; pos < 16; pos++) {
      for (const candidate of buckets[pos].get(hash[pos]) ?? []) candidateIds.add(candidate.id);
    }

    for (const candidateId of candidateIds) {
      if (visited.has(candidateId) || candidateId === withHash[i].id) continue;
      const candidate = byId.get(candidateId);
      if (!candidate) continue;
      if (hammingDistance(withHash[i].phash, candidate.phash) <= SIMILARITY_MAX_DISTANCE) {
        cluster.push(candidate);
        visited.add(candidate.id);
      }
    }

    // Only a "potential duplicate" if it involves more than one product —
    // multiple photos of the SAME product are expected, not a duplicate.
    const distinctProducts = new Set(cluster.map((c) => c.product.id));
    if (distinctProducts.size > 1) {
      groups.push({
        hashPrefix: withHash[i].phash.slice(0, 4),
        items: cluster.map((c) => ({
          productId: c.product.id,
          productName: c.product.name,
          productSlug: c.product.slug,
          imageId: c.id,
          imageUrl: c.url,
        })),
      });
    }
  }

  return groups;
}
