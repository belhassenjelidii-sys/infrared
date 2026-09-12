import { NextResponse } from "next/server";
import { requirePermission, UnauthorizedError } from "@/lib/authz";
import {
  MAX_VIDEO_BYTES,
  isAllowedDeclaredVideoType,
  sniffVideoType,
  uploadImageToSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase-storage";
import { saveImageLocally } from "@/lib/uploads";
import { processImage } from "@/lib/image-pipeline/pipeline";
import { storePipelineOutput, storeTransparentProductImage } from "@/lib/image-pipeline/storage";
import { analyzeTransparency, hasReusableAlpha, removeBackground } from "@/lib/image-pipeline/background-remover";
import { MAX_UPLOAD_BYTES, validateImage } from "@/lib/image-pipeline/validator";
import { fetchSafeRemoteBytes } from "@/lib/security/remote-url";
import { consumeRateLimit, requestFingerprint } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS = new Set(["products", "brands", "categories", "stores", "settings"]);


async function storeVideo(buffer: Buffer, mime: "video/mp4" | "video/webm", folder: string) {
  if (isSupabaseConfigured() || process.env.NODE_ENV === "production") {
    return uploadImageToSupabase(buffer, mime, folder);
  }
  const url = await saveImageLocally(buffer, mime);
  return { url, path: url };
}

/**
 * Runs an uploaded image through the full local processing pipeline
 * (validate → normalize → optimize → crop/center → generate versions →
 * store — see src/lib/image-pipeline/) and returns the result. Product
 * photos get the subject-centering crop; other folders (stores, brands,
 * categories, hero/settings images) keep their original composition.
 */
async function handleImage(buffer: Buffer, folder: string, preserveBackground = false, preserveOriginal = false) {
  if (folder === "products") {
    await validateImage(buffer);
    // Editorial product views featuring a person/mannequin are the one
    // intentional exception to the transparent-cutout rule. Staff must opt
    // into it explicitly: this avoids both a destructive face cutout and a
    // silent fallback that would let ordinary product photos keep a white
    // rectangle when background removal fails.
    if (preserveBackground) {
      const result = await storePipelineOutput(
        await processImage(buffer, { folder, centerSubject: false }),
        folder
      );
      return {
        ok: true,
        url: result.optimized,
        original: result.original,
        avif: result.avif,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size,
        backgroundPreserved: true,
      };
    }

    let transparentBuffer = buffer;
    const transparency = await analyzeTransparency(buffer);
    if (!hasReusableAlpha(transparency)) {
      const cutout = await removeBackground(buffer);
      if (!cutout.success) {
        throw new Error(`Le fond n'a pas pu être retiré automatiquement : ${cutout.reason} L'original n'a pas été enregistré. Utilisez une photo nette sur fond clair et uni, ou cochez « personne / mannequin » pour conserver volontairement le fond.`);
      }
      transparentBuffer = cutout.buffer;
    }
    let result;
    try {
      result = await storeTransparentProductImage(transparentBuffer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "canal alpha invalide";
      throw new Error(`Le détourage a échoué : ${reason} L'original n'a pas été enregistré.`);
    }
    return { ok: true, url: result.optimized, ...result };
  }
  const result = await storePipelineOutput(
    await processImage(buffer, { folder, centerSubject: folder === "products" }),
    folder
  );
  // `url` is the field every existing caller (ImageUploadField, product
  // forms) already reads — points at the optimized display version.
  return {
    ok: true,
    url: preserveOriginal ? result.original : result.optimized,
    original: result.original,
    avif: result.avif,
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.size,
  };
}

/**
 * POST /api/uploads — image (processed through the local pipeline) and,
 * for the homepage hero only, video upload for Admin/Commercial/Developer.
 *
 * Security checklist enforced below (see AGENTS/CLAUDE brief §4-5):
 *  1. Authenticated session required.
 *  2. Role must be ADMIN, DEVELOPER or COMMERCIAL.
 *  3. Real content is validated (magic bytes + sharp decode), not just the
 *     declared Content-Type — see image-pipeline/validator.ts.
 *  4. File size capped (8 Mo images, 40 Mo hero video) before any decode,
 *     and decoded-pixel count is capped too (limitInputPixels), so a small
 *     malicious file can't force a huge in-memory bitmap.
 *  5. Filenames are fully server-generated — no user input reaches the
 *     storage path, so there's no path traversal / overwrite vector.
 *  6. Only the *processed* image is ever stored — the raw original upload
 *     is never written to disk or Supabase as-is.
 */
export async function POST(request: Request) {
  try {
    await requirePermission("images.manage");
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: "Authentification requise." }, { status: 401 });
    }
    throw error;
  }
  const limit = await consumeRateLimit(`upload:${requestFingerprint(request)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Trop d'uploads. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }


  try {
    const formData = await request.formData();
    const folderRaw = String(formData.get("folder") || "products");
    const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : "products";
    if (folder !== "products") await requirePermission(folder === "settings" ? "content.manage" : folder === "stores" ? "stores.manage" : folder === "categories" ? "categories.manage" : "content.manage");
    const kind = String(formData.get("kind") || "image") === "video" ? "video" : "image";
    const preserveBackground = folder === "products" && formData.get("preserveBackground") === "true";
    const preserveOriginal = folder === "settings" && formData.get("preserveOriginal") === "true";

    // Option A — direct file upload
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      if (kind === "video") {
        if (file.size > MAX_VIDEO_BYTES) {
          return NextResponse.json({ ok: false, error: "Vidéo trop volumineuse (40 Mo max)." }, { status: 400 });
        }
        const declaredType = file.type.toLowerCase().split(";")[0];
        if (!isAllowedDeclaredVideoType(declaredType)) {
          return NextResponse.json({ ok: false, error: "Format vidéo accepté : MP4 ou WEBM." }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const realType = sniffVideoType(buffer);
        if (!realType) {
          return NextResponse.json({ ok: false, error: "Le fichier n'est pas une vidéo valide." }, { status: 400 });
        }
        const { url } = await storeVideo(buffer, realType, folder);
        return NextResponse.json({ ok: true, url, size: buffer.byteLength, type: realType });
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ ok: false, error: "Fichier trop volumineux (8 Mo max)." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await handleImage(buffer, folder, preserveBackground, preserveOriginal);
      return NextResponse.json(result);
    }

    // Option B — import from an external URL (still staff-only, still
    // re-validated byte-for-byte after download and run through the same
    // pipeline — the source URL is not trusted just because it looks like
    // an image link). Video-by-URL isn't supported — the hero video is
    // upload-only, kept simple.
    const sourceUrl = String(formData.get("url") || "").trim();
    if (!sourceUrl) {
      return NextResponse.json({ ok: false, error: "Ajoutez un fichier ou une URL." }, { status: 400 });
    }
    let buffer: Buffer;
    try {
      ({ buffer } = await fetchSafeRemoteBytes(sourceUrl, {
        maxBytes: MAX_UPLOAD_BYTES,
        timeoutMs: 20_000,
        userAgent: "InfraRed-Optic-Store/1.0",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "URL image non valide.";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    const result = await handleImage(buffer, folder, preserveBackground, preserveOriginal);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
