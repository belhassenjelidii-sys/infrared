import { NextResponse } from "next/server";
import { requirePermission, UnauthorizedError } from "@/lib/authz";
import { removeBackground } from "@/lib/image-pipeline/background-remover";
import { storeTransparentProductImage } from "@/lib/image-pipeline/storage";
import { resolveImageUrl } from "@/lib/product-intelligence/image-processor";
import { fetchSafeRemoteBytes } from "@/lib/security/remote-url";
import { readFile } from "node:fs/promises";
import { consumeRateLimit, requestFingerprint } from "@/lib/security/rate-limit";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/image-pipeline/remove-background — { imageUrl } → { ok, url }
 * or { ok:false, error }.
 *
 * Never touches the original: this only fetches its bytes and, on
 * success, stores the cutout as a brand-new file. The admin UI shows
 * Original vs. Résultat side by side and the person explicitly chooses
 * "Utiliser le résultat" (which then replaces the product's image
 * reference — see replaceProductImageAction) or "Conserver l'original"
 * (the new file this route created is discarded). Nothing here mutates
 * the database.
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
  const limit = await consumeRateLimit(`background:${requestFingerprint(request)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Trop de traitements d'image. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }


  try {
    const body = await request.json().catch(() => null);
    const imageUrl = body?.imageUrl;
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ ok: false, error: "imageUrl manquant." }, { status: 400 });
    }

    let buffer: Buffer;
    if (imageUrl.startsWith("/uploads/")) {
      const filename = path.basename(imageUrl.slice("/uploads/".length));
      if (!filename || filename !== imageUrl.slice("/uploads/".length)) {
        return NextResponse.json({ ok: false, error: "Chemin d'image local invalide." }, { status: 400 });
      }
      try {
        buffer = await readFile(path.join(process.cwd(), "public", "uploads", filename));
      } catch {
        return NextResponse.json({ ok: false, error: "Image locale introuvable." }, { status: 404 });
      }
    } else {
      try {
        ({ buffer } = await fetchSafeRemoteBytes(resolveImageUrl(imageUrl), {
          maxBytes: 8 * 1024 * 1024,
          timeoutMs: 15_000,
          userAgent: "InfraRed-Optic-Store/1.0",
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de récupérer l'image.";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
      }
    }

    const result = await removeBackground(buffer);
    if (!result.success) {
      // Fallback: no file is produced, nothing is stored — the caller
      // keeps the original untouched.
      return NextResponse.json({ ok: false, error: result.reason }, { status: 422 });
    }

    const stored = await storeTransparentProductImage(result.buffer);

    return NextResponse.json({ ok: true, url: stored.optimized, width: stored.width, height: stored.height });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
