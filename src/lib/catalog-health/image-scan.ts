import "server-only";
import { prisma } from "@/lib/prisma";
import { headSafeRemote } from "@/lib/security/remote-url";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { ImageIssueDetail } from "./types";

const HEAVY_THRESHOLD_BYTES = 800 * 1024; // 800 KB — our own pipeline optimizes well under this; anything above suggests a pre-pipeline or externally-added file
const HEAD_TIMEOUT_MS = 6_000;
const MAX_CONCURRENT = 6;
const MAX_IMAGES_PER_SCAN = 500; // hard cap so a very large catalog can't turn one scan into thousands of outbound requests

async function checkOne(image: { id: string; url: string; productId: string; productName: string }): Promise<ImageIssueDetail | null> {
  try {
    let size: number | null;
    if (image.url.startsWith("/")) {
      const pathname = decodeURIComponent(image.url.split("?", 1)[0]);
      const publicRoot = path.resolve(process.cwd(), "public");
      const filePath = path.resolve(publicRoot, `.${pathname}`);
      if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) {
        throw new Error("Chemin local invalide");
      }
      size = (await stat(filePath)).size;
    } else {
      const res = await headSafeRemote(image.url, { timeoutMs: HEAD_TIMEOUT_MS });
      if (res.contentLength === null) size = null;
      else size = res.contentLength;
    }
    if (size && size > HEAVY_THRESHOLD_BYTES) {
      return { productId: image.productId, productName: image.productName, imageId: image.id, imageUrl: image.url, issue: "heavy", sizeBytes: size };
    }
    return null;
  } catch {
    // Missing local file, timeout, DNS failure or connection refusal: the
    // asset isn't reliably available to the storefront.
    return { productId: image.productId, productName: image.productName, imageId: image.id, imageUrl: image.url, issue: "broken" };
  }
}

/** Simple bounded-concurrency runner — avoids firing hundreds of requests at once. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Runs the expensive image checks (broken link / oversized file) — the
 * only part of catalog-health that makes network calls. Deliberately NOT
 * called on every dashboard render (see snapshot.ts, which caches this
 * result in the DB and only re-runs it when explicitly triggered).
 */
export async function scanProductImages(): Promise<{ imagesChecked: number; details: ImageIssueDetail[] }> {
  const images = await prisma.productImage.findMany({
    where: { product: { archived: false } },
    select: { id: true, url: true, product: { select: { id: true, name: true } } },
    take: MAX_IMAGES_PER_SCAN,
  });

  const flat = images.map((i) => ({ id: i.id, url: i.url, productId: i.product.id, productName: i.product.name }));
  const results = await mapWithConcurrency(flat, MAX_CONCURRENT, checkOne);
  const details = results.filter((r): r is ImageIssueDetail => r !== null);

  return { imagesChecked: flat.length, details };
}
