import { NextResponse } from "next/server";
import { requirePermission, UnauthorizedError } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/product-intelligence/analyze
 *
 * Color/shape detection from a photo was removed because it was not
 * reliable enough on real catalogue images. Keep this authenticated route
 * as an explicit, non-crashing response for any stale client still calling
 * it, instead of importing the abandoned detector modules.
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

  await request.json().catch(() => null);
  return NextResponse.json(
    {
      ok: false,
      error: "Analyse automatique couleur/forme désactivée : sélectionnez ces attributs manuellement.",
    },
    { status: 410 }
  );
}
