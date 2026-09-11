import "server-only";
import { unlink, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { deleteImageFromSupabase } from "./supabase-storage";

/**
 * Deletes an image regardless of where it was stored:
 *  - Supabase Storage public URL → deleted via the Storage REST API.
 *  - Legacy local `/uploads/...` URL (pre-Supabase-migration data, or a
 *    dev-mode fallback upload — see {@link saveImageLocally}) → removed
 *    from disk if still present, so old installs don't accumulate orphans.
 * Always best-effort: a delete failure here must never block the caller's
 * own action (product/image/store deletion, settings update, etc).
 */
export async function deleteUploadedImage(url: string | null | undefined) {
  if (!url) return;

  const managedPrefixes = [
    "/uploads/",
    "/images/catalogue-real/",
    "/images/catalogue-local/",
    "/images/products/",
  ];
  const managedPrefix = managedPrefixes.find((prefix) => url.startsWith(prefix));
  if (managedPrefix) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const relativePath = url.slice(1).replaceAll("/", path.sep);
    const absolutePath = path.resolve(publicRoot, relativePath);
    // Keep runtime deletion inside public/ and inside one of the explicit
    // product/upload roots above. Query strings, traversal and directories
    // are rejected instead of normalized into a broader target.
    if (
      url.includes("?")
      || url.includes("#")
      || url.includes("..")
      || !absolutePath.startsWith(`${publicRoot}${path.sep}`)
      || path.basename(absolutePath) === ""
    ) return;
    try {
      await unlink(absolutePath);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code !== "ENOENT") console.error("Suppression du fichier image impossible", absolutePath, error);
    }
    await clearNextImageCache();
    return;
  }

  if (await deleteImageFromSupabase(url)) await clearNextImageCache();
}

/**
 * Next.js keeps generated image variants below this exact project-local
 * directory. Clearing it after a managed source is removed prevents deleted
 * product photos from continuing to consume local server disk space. Browser
 * caches are outside the server's control, but their URL no longer has a
 * backing source after storage deletion.
 */
async function clearNextImageCache() {
  const cachePath = path.resolve(/* turbopackIgnore: true */ process.cwd(), ".next", "cache", "images");
  if (!cachePath.endsWith(path.join(".next", "cache", "images"))) return;
  try {
    await rm(cachePath, { recursive: true, force: true });
  } catch (error) {
    console.error("Nettoyage du cache image Next.js impossible", error);
  }
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/**
 * DEV-ONLY convenience fallback used solely when Supabase Storage isn't
 * configured yet (no NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in
 * .env) — so the admin/commercial upload UI still works while you're setting
 * Supabase up locally, instead of hard-failing on every image. Same auth,
 * size and magic-byte checks as the Supabase path (see /api/uploads) — only
 * the storage destination differs. Never used when NODE_ENV === "production".
 */
export async function saveImageLocally(buffer: Buffer, mime: string): Promise<string> {
  const ext = EXT_BY_MIME[mime] ?? "jpg";
  const filename = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}


/**
 * Delete a stored asset only when it is no longer referenced by the database.
 * This protects against the same public storage URL being reused by two
 * product images or by a Hero setting and another record.
 */
export async function deleteUploadedImageIfUnreferenced(url: string | null | undefined, excludedImageId?: string) {
  if (!url) return;
  const { prisma } = await import("@/lib/prisma");
  const [imageRef, settingsRef, brandRef, categoryRef, storeRef] = await Promise.all([
    prisma.productImage.findFirst({
      where: { url, ...(excludedImageId ? { id: { not: excludedImageId } } : {}) },
      select: { id: true },
    }),
    prisma.storeSettings.findFirst({
      where: { OR: [{ heroImageUrl: url }, { heroVideoUrl: url }, { logoUrl: url }, { homeContentJson: { contains: url } }] },
      select: { id: true },
    }),
    prisma.brand.findFirst({ where: { logo: url }, select: { id: true } }),
    prisma.category.findFirst({ where: { image: url }, select: { id: true } }),
    prisma.store.findFirst({ where: { photo: url }, select: { id: true } }),
  ]);
  if (imageRef || settingsRef || brandRef || categoryRef || storeRef) return;
  await deleteUploadedImage(url);
}
