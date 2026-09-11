"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { getImageHealthSnapshot } from "@/lib/catalog-health/snapshot";
import { prisma } from "@/lib/prisma";
import { analyzeTransparency, hasReusableAlpha, removeBackground } from "@/lib/image-pipeline/background-remover";
import { storeTransparentProductImage } from "@/lib/image-pipeline/storage";
import { fetchSafeRemoteBytes } from "@/lib/security/remote-url";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function refreshImageScanAction() {
  await requirePermission("products.view");
  await getImageHealthSnapshot(true);
  revalidatePath("/admin");
  revalidatePath("/admin/qualite");
}

async function loadImage(url: string) {
  if (url.startsWith("/")) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const resolved = path.resolve(publicRoot, `.${url.split("?")[0]}`);
    if (!resolved.startsWith(`${publicRoot}${path.sep}`)) throw new Error("Chemin local invalide.");
    return readFile(resolved);
  }
  return (await fetchSafeRemoteBytes(url, { maxBytes: 8 * 1024 * 1024, timeoutMs: 20_000, userAgent: "InfraRed-Optic-Store/1.0" })).buffer;
}

export async function removeAllProductBackgroundsAction() {
  await requirePermission("products.view");
  const images = await prisma.productImage.findMany({ orderBy: [{ productId: "asc" }, { sortOrder: "asc" }] });
  for (let start = 0; start < images.length; start += 4) {
    await Promise.all(images.slice(start, start + 4).map(async (image) => {
      try {
        const buffer = await loadImage(image.url);
        const transparency = await analyzeTransparency(buffer);
        const prepared = hasReusableAlpha(transparency) ? buffer : await (async () => {
          const cutout = await removeBackground(buffer);
          return cutout.success ? cutout.buffer : null;
        })();
        if (!prepared) return;
        const stored = await storeTransparentProductImage(prepared);
        await prisma.productImage.update({ where: { id: image.id }, data: { url: stored.optimized, phash: null } });
      } catch (error) { console.error(`Background removal failed for ${image.id}:`, error); }
    }));
  }
  revalidatePath("/", "layout");
  revalidatePath("/catalogue");
  revalidatePath("/nouveautes");
  revalidatePath("/produit", "layout");
  revalidatePath("/admin/qualite");
}
