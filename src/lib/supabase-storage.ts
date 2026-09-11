import "server-only";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Supabase Storage — accessed via the plain REST API (no @supabase/supabase-js
// dependency). This keeps the dependency footprint light and avoids adding a
// heavy SDK for what is, server-side, three simple HTTP calls.
//
// SUPABASE_SERVICE_ROLE_KEY is read from process.env ONLY in this file, which
// is marked "server-only" — importing it from a Client Component fails at
// build time, so the key can never leak to the browser bundle.
// ---------------------------------------------------------------------------

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

export const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB — short hero clips only, not full films.

// Accept only the formats explicitly requested — no GIF/SVG/etc, which are
// either an attack surface (SVG can carry script) or unnecessary here.
// (Image MIME→extension mapping used by uploadImageToSupabase below —
// actual image *validation* now lives in image-pipeline/validator.ts.)
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Video is only ever used for the homepage hero background — kept separate
// from the general image path (different size limit, different sniffing).
const ALLOWED_VIDEO_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase Storage n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env)."
    );
  }
  return { url: url.replace(/\/+$/, ""), serviceKey };
}

/** True once both required Supabase env vars are set (see .env.example). */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Confirms the buffer's real content matches an allowed video container by
 * checking magic bytes — never trust the browser-declared MIME type alone.
 * (Image validation now lives in image-pipeline/validator.ts, which every
 * image upload is routed through.)
 */
export function sniffVideoType(buffer: Buffer): "video/mp4" | "video/webm" | null {
  if (buffer.length < 12) return null;
  // MP4/MOV family: bytes 4-7 are "ftyp".
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return "video/mp4";
  // WebM/Matroska: EBML header 0x1A45DFA3.
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return "video/webm";
  return null;
}

export function isAllowedDeclaredVideoType(mime: string): boolean {
  return mime.toLowerCase() in ALLOWED_VIDEO_MIME;
}

function safeFilename(mime: string) {
  const ext = ALLOWED_MIME[mime] ?? ALLOWED_VIDEO_MIME[mime] ?? "bin";
  // Server-generated name only — the original filename is never used for the
  // path, which rules out path traversal / overwrite-by-name entirely.
  const stamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString("hex");
  return `${stamp}-${random}.${ext}`;
}

/**
 * Uploads a validated image or video buffer to Supabase Storage and returns
 * its permanent public URL. `folder` groups files (e.g. "products",
 * "stores", "settings") for easier bucket housekeeping.
 */
export async function uploadImageToSupabase(
  buffer: Buffer,
  mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif" | "video/mp4" | "video/webm",
  folder: string
): Promise<{ url: string; path: string }> {
  const { url, serviceKey } = getSupabaseEnv();
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "misc";
  const path = `${safeFolder}/${safeFilename(mime)}`;

  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": mime,
      "x-upsert": "false",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Échec de l'upload vers Supabase Storage (${response.status}). ${text.slice(0, 200)}`);
  }

  return { url: `${url}/storage/v1/object/public/${BUCKET}/${path}`, path };
}

/**
 * Deletes an image from Supabase Storage given its public URL. Silently
 * no-ops for URLs that don't belong to our bucket (external/demo URLs) or
 * if the object is already gone — deletion is best-effort cleanup, never a
 * blocking step for the caller's own action (product delete, etc).
 */
export async function deleteImageFromSupabase(publicUrl: string | null | undefined): Promise<boolean> {
  if (!publicUrl) return false;
  let supabaseUrl: string;
  try {
    ({ url: supabaseUrl } = getSupabaseEnv());
  } catch {
    return false; // Not configured — nothing to delete against.
  }
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (!publicUrl.startsWith(supabaseUrl) || idx === -1) return false;
  const path = publicUrl.slice(idx + marker.length);
  if (!path) return false;

  try {
    const { serviceKey } = getSupabaseEnv();
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [path] }),
    });
    if (!response.ok && response.status !== 404) {
      const detail = await response.text().catch(() => "");
      console.error(`Suppression Supabase impossible (${response.status})`, detail.slice(0, 200));
      return false;
    }
    return true;
  } catch {
    // Best-effort — an orphaned file in storage is not worth failing the
    // caller's action (e.g. product deletion) over.
    return false;
  }
}
