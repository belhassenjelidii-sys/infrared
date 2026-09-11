import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { products } from "../src/lib/data";
import {
  analyzeTransparency,
  hasReusableAlpha,
  isVerifiedTransparentPng,
  removeBackground,
} from "../src/lib/image-pipeline/background-remover";
import { prepareTransparentProductPng } from "../src/lib/image-pipeline/transparent-product";

const connectionString = process.env.DATABASE_URL || "postgresql://infrared:infrared_dev_password@localhost:5432/infrared";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const projectRoot = process.cwd();
const publicRoot = path.join(projectRoot, "public");
const stageRoot = path.join(projectRoot, ".transparent-stage", "migration");
const MAX_BYTES = 14 * 1024 * 1024;
const UNTOUCHED_PEOPLE_VIEWS = new Set([
  "carrera-1014-s-003:2",
  "saint-laurent-sl-276-mica-025:2",
]);

type PreparedImage = {
  productSlug: string;
  sortOrder: number;
  targetUrl: string;
  stagedPath: string;
  finalPath: string;
};

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchImage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "InfraRed-Optic-Store/1.0",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!type.toLowerCase().startsWith("image/")) throw new Error("la ressource distante n'est pas une image");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) throw new Error("taille d'image distante invalide");
    return bytes;
  } finally {
    clearTimeout(timeout);
  }
}

async function findLocalSource(directory: string, index: number, includePng = true) {
  const entries: string[] = await fs.readdir(directory).catch(() => [] as string[]);
  const extensions = includePng ? ["jpg", "jpeg", "webp", "avif", "png"] : ["jpg", "jpeg", "webp", "avif"];
  const candidates = extensions
    .map((extension) => path.join(directory, `${index}.${extension}`));
  return candidates.find((candidate) => entries.includes(path.basename(candidate))) ?? null;
}

async function prepareSource(buffer: Buffer, label: string) {
  const analysis = await analyzeTransparency(buffer);
  let cutout = buffer;
  if (!hasReusableAlpha(analysis)) {
    const removed = await removeBackground(buffer);
    if (!removed.success) throw new Error(`${label}: ${removed.reason}`);
    cutout = removed.buffer;
  }
  const prepared = await prepareTransparentProductPng(cutout);
  const finalAnalysis = await analyzeTransparency(prepared.buffer);
  if (!isVerifiedTransparentPng(finalAnalysis)) {
    throw new Error(`${label}: le PNG final ne possède pas une transparence alpha vérifiable`);
  }
  return prepared.buffer;
}

async function prepareCatalogueImages() {
  const prepared: PreparedImage[] = [];
  for (const product of products) {
    const directory = path.join(publicRoot, "images", "catalogue-real", product.slug);
    await fs.mkdir(directory, { recursive: true });

    for (let sortOrder = 0; sortOrder < 3; sortOrder++) {
      const index = sortOrder + 1;
      if (UNTOUCHED_PEOPLE_VIEWS.has(`${product.slug}:${sortOrder}`)) {
        console.log(`  ↷ ${product.slug} — vue ${index} avec personne conservée sans modification`);
        continue;
      }
      const targetUrl = `/images/catalogue-real/${product.slug}/${index}.png`;
      const finalPath = path.join(publicRoot, ...targetUrl.slice(1).split("/"));
      let localSource: string | null = null;
      if (await exists(finalPath)) {
        const currentPng = await fs.readFile(finalPath);
        if (hasReusableAlpha(await analyzeTransparency(currentPng))) localSource = finalPath;
      }
      localSource ??= await findLocalSource(directory, index, false);
      localSource ??= await findLocalSource(directory, index, true);
      const sourceUrl = product.images[sortOrder]?.url;
      let source: Buffer;

      if (localSource) {
        source = await fs.readFile(localSource);
      } else if (sourceUrl?.startsWith("http://") || sourceUrl?.startsWith("https://")) {
        source = await fetchImage(sourceUrl);
      } else if (sourceUrl?.startsWith("/")) {
        source = await fs.readFile(path.join(publicRoot, ...sourceUrl.slice(1).split("/")));
      } else {
        throw new Error(`${product.slug} vue ${index}: aucune source disponible`);
      }

      const output = await prepareSource(source, `${product.slug} vue ${index}`);
      const stagedPath = path.join(stageRoot, "catalogue", product.slug, `${index}.png`);
      await fs.mkdir(path.dirname(stagedPath), { recursive: true });
      await fs.writeFile(stagedPath, output);
      prepared.push({ productSlug: product.slug, sortOrder, targetUrl, stagedPath, finalPath });
      console.log(`  ✓ ${product.slug} — vue ${index}`);
    }
  }
  return prepared;
}

async function prepareProductUploads() {
  const rows = await prisma.productImage.findMany({
    where: { url: { startsWith: "/uploads/" } },
    select: { id: true, url: true, product: { select: { slug: true } } },
  });
  const updates: { id: string; targetUrl: string; stagedPath: string; finalPath: string }[] = [];

  for (const row of rows) {
    const sourcePath = path.join(publicRoot, ...row.url.slice(1).split("/"));
    if (!(await exists(sourcePath))) throw new Error(`${row.product.slug}: upload introuvable ${row.url}`);
    const output = await prepareSource(await fs.readFile(sourcePath), `${row.product.slug} upload`);
    const basename = path.basename(row.url, path.extname(row.url)).replace(/-transparent$/, "");
    const filename = `${basename}-transparent.png`;
    const targetUrl = `/uploads/${filename}`;
    const stagedPath = path.join(stageRoot, "uploads", filename);
    const finalPath = path.join(publicRoot, "uploads", filename);
    await fs.mkdir(path.dirname(stagedPath), { recursive: true });
    await fs.writeFile(stagedPath, output);
    updates.push({ id: row.id, targetUrl, stagedPath, finalPath });
    console.log(`  ✓ ${row.product.slug} — upload`);
  }
  return updates;
}

async function commitFilesAndDatabase(catalogue: PreparedImage[], uploads: Awaited<ReturnType<typeof prepareProductUploads>>) {
  for (const image of catalogue) {
    await fs.mkdir(path.dirname(image.finalPath), { recursive: true });
    await fs.copyFile(image.stagedPath, image.finalPath);
  }
  for (const image of uploads) await fs.copyFile(image.stagedPath, image.finalPath);

  await prisma.$transaction(async (tx) => {
    for (const image of catalogue) {
      const product = await tx.product.findUnique({ where: { slug: image.productSlug }, select: { id: true } });
      if (!product) throw new Error(`Produit absent de Prisma : ${image.productSlug}`);
      await tx.productImage.updateMany({
        where: { productId: product.id, sortOrder: image.sortOrder },
        data: { url: image.targetUrl, phash: null },
      });
    }
    for (const image of uploads) {
      await tx.productImage.update({ where: { id: image.id }, data: { url: image.targetUrl, phash: null } });
    }
  });
}

async function main() {
  await fs.rm(stageRoot, { recursive: true, force: true });
  await fs.mkdir(stageRoot, { recursive: true });
  console.log("Préparation des PNG transparents du catalogue…");
  const catalogue = await prepareCatalogueImages();
  console.log("Préparation des uploads produits…");
  const uploads = await prepareProductUploads();
  console.log("Validation terminée, copie des fichiers et mise à jour Prisma…");
  await commitFilesAndDatabase(catalogue, uploads);
  console.log(`Migration terminée : ${catalogue.length} images catalogue et ${uploads.length} upload(s) produit.`);
}

main()
  .catch((error) => {
    console.error("Migration annulée :", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
