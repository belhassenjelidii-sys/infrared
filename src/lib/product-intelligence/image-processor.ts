import "server-only";
import type { ImageFetchResult } from "./types";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchSafeRemoteBytes } from "@/lib/security/remote-url";

/**
 * Resolves a possibly-relative image URL (e.g. `/uploads/xxx.jpg` from the
 * local dev storage fallback) to an absolute one — Node's fetch (undici)
 * throws "Failed to parse URL" on relative paths, unlike a browser, which
 * silently resolves them against the current page.
 */
export function resolveImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Fetches an image's raw bytes. The image itself may live on Supabase
 * Storage or on local disk (`/uploads/...` in dev) — either way, this is
 * just a byte fetch; any actual pixel work (e.g. perceptual hashing in
 * duplicate-detector.ts) runs locally afterwards via `sharp`.
 */
export async function fetchImageBytes(url: string): Promise<ImageFetchResult> {
  if (url.startsWith("/uploads/")) {
    const filename = path.basename(url.slice("/uploads/".length));
    if (!filename || filename !== url.slice("/uploads/".length)) {
      throw new Error("Chemin d'image local invalide.");
    }
    const buffer = await readFile(path.join(process.cwd(), "public", "uploads", filename));
    return { buffer, contentType: "application/octet-stream" };
  }

  const { buffer, contentType } = await fetchSafeRemoteBytes(resolveImageUrl(url), {
    maxBytes: 8 * 1024 * 1024,
    timeoutMs: 15_000,
    userAgent: "InfraRed-Optic-Store/1.0",
  });
  return { buffer, contentType };
}
