import "server-only";
import { uploadImageToSupabase, isSupabaseConfigured } from "../supabase-storage";
import { getUploadStorageDriver, saveImageLocally } from "../uploads";
import { prepareTransparentProductPng } from "./transparent-product";
import type { GeneratedAsset, PipelineOutput, ProcessedImageResult } from "./types";

const MIME_BY_FORMAT: Record<GeneratedAsset["format"], "image/jpeg" | "image/png" | "image/webp" | "image/avif"> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/**
 * STOCKAGE stage. Uploads one generated asset to Supabase Storage — or,
 * or to the explicit local driver, mounted in production at
 * `/app/public/uploads`. A future R2 driver belongs in this boundary.
 */
async function storeAsset(asset: GeneratedAsset, folder: string): Promise<string> {
  const mime = MIME_BY_FORMAT[asset.format];
  if (getUploadStorageDriver() === "supabase") {
    if (!isSupabaseConfigured()) throw new Error("Le stockage Supabase n'est pas configuré.");
    const { url } = await uploadImageToSupabase(asset.buffer, mime, folder);
    return url;
  }
  return saveImageLocally(asset.buffer, mime);
}

/** Stores a true RGBA product cutout as PNG, preserving transparency. */
export async function storeTransparentProductImage(buffer: Buffer): Promise<ProcessedImageResult> {
  const asset = await prepareTransparentProductPng(buffer);
  const url = await storeAsset(asset, "products");
  return { original: url, optimized: url, width: asset.width, height: asset.height, format: "png", size: asset.size, avif: null };
}

/**
 * Uploads every asset produced by the pipeline (archival, optimized, and
 * the AVIF variant if one was kept) and returns the result shape the
 * admin UI / ProductImage record needs. `optimized` is what should be
 * stored as the product's display image URL; `original` is kept for
 * archival/zoom purposes.
 */
export async function storePipelineOutput(output: PipelineOutput, folder: string): Promise<ProcessedImageResult> {
  const [originalUrl, optimizedUrl, avifUrl] = await Promise.all([
    storeAsset(output.archival, folder),
    storeAsset(output.optimized, folder),
    output.avif ? storeAsset(output.avif, folder) : Promise.resolve(null),
  ]);

  return {
    original: originalUrl,
    optimized: optimizedUrl,
    width: output.optimized.width,
    height: output.optimized.height,
    format: output.optimized.format,
    size: output.optimized.size,
    avif: avifUrl,
  };
}
