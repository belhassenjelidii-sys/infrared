import "server-only";
import { prisma } from "@/lib/prisma";
import { scanProductImages } from "./image-scan";
import type { ImageScanResult } from "./types";

const SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000; // 6h — the image-scan result is shown "as of" its computation time regardless, so a stale cache is never presented as live

/**
 * Returns the cached image-health snapshot if one exists — the dashboard
 * always reads this instead of re-scanning on every visit. `forceRefresh`
 * (used by the "Relancer l'analyse" button) or an expired TTL triggers a
 * real re-scan; everything else is a cheap single-row DB read.
 */
export async function getImageHealthSnapshot(forceRefresh = false): Promise<ImageScanResult> {
  if (!forceRefresh) {
    const latest = await prisma.catalogHealthSnapshot.findFirst({ orderBy: { computedAt: "desc" } });
    if (latest && Date.now() - latest.computedAt.getTime() < SNAPSHOT_TTL_MS) {
      return {
        computedAt: latest.computedAt.toISOString(),
        imagesChecked: latest.imagesChecked,
        brokenImages: latest.brokenImages,
        heavyImages: latest.heavyImages,
        details: latest.detailsJson ? JSON.parse(latest.detailsJson) : [],
        fresh: false,
      };
    }
  }

  const { imagesChecked, details } = await scanProductImages();
  const brokenImages = details.filter((d) => d.issue === "broken").length;
  const heavyImages = details.filter((d) => d.issue === "heavy").length;

  const saved = await prisma.catalogHealthSnapshot.create({
    data: {
      imagesChecked,
      brokenImages,
      heavyImages,
      detailsJson: JSON.stringify(details),
    },
  });

  // Keep the snapshot table small — this is a cache, not history.
  const old = await prisma.catalogHealthSnapshot.findMany({
    orderBy: { computedAt: "desc" },
    skip: 5,
    select: { id: true },
  });
  if (old.length) {
    await prisma.catalogHealthSnapshot.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
  }

  return {
    computedAt: saved.computedAt.toISOString(),
    imagesChecked,
    brokenImages,
    heavyImages,
    details,
    fresh: true,
  };
}
