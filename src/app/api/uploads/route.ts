import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isSafeRemoteUrl(value: string) {
  try {
    const u = new URL(value);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Option A — direct file upload
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ ok: false, error: "Fichier trop volumineux (15 Mo max)." }, { status: 400 });
      }
      const type = file.type.toLowerCase().split(";")[0];
      if (!ALLOWED_TYPES.includes(type)) {
        return NextResponse.json({ ok: false, error: "Format accepté : JPG, PNG, WEBP ou GIF." }, { status: 400 });
      }
      const ext = type.split("/")[1].replace("jpeg", "jpg");
      const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
      return NextResponse.json({ ok: true, url: `/uploads/${filename}`, size: file.size, type });
    }

    // Option B — URL
    const url = String(formData.get("url") || "").trim();
    if (!url) {
      return NextResponse.json({ ok: false, error: "Ajoutez un fichier ou une URL." }, { status: 400 });
    }
    if (!isSafeRemoteUrl(url)) {
      return NextResponse.json({ ok: false, error: "URL image non valide." }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "InfraRed-Optic-Store/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Impossible de télécharger l'image (${res.status}).` }, { status: 400 });
    }
    const ct = (res.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!ct.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "L'URL ne pointe pas vers une image." }, { status: 400 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "Image trop volumineuse (15 Mo max)." }, { status: 400 });
    }

    const ext = ct.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({ ok: true, url: `/uploads/${filename}`, size: buffer.byteLength, type: ct });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
