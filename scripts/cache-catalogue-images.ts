import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { products } from "../src/lib/data";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://infrared:infrared_dev_password@localhost:5432/infrared";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const root = process.cwd();
const publicDir = path.join(root, "public");
const maxBytes = 14 * 1024 * 1024;

const seedHosts = new Set([
  "www.shadestation.co.uk",
  "static5.lenskart.com",
  "d237xocrarx9cy.cloudfront.net",
  "grandvision-media.imgix.net",
  "assets2.oliverpeoples.com",
  "img.ebdcdn.com",
  "vogue-eyewear.com",
  "assets.kogan.com",
  "i.ebayimg.com",
]);

function isSeedManagedImage(url: string) {
  if (
    url.startsWith("/images/catalogue-local/") ||
    url.startsWith("/images/catalogue-real/") ||
    url.startsWith("/images/products/") ||
    url.includes("placeholder")
  ) return true;
  try {
    return seedHosts.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function extensionFromContentType(contentType: string | null, sourceUrl: string) {
  const clean = (contentType || "").split(";")[0].trim().toLowerCase();
  if (clean === "image/png") return ".png";
  if (clean === "image/webp") return ".webp";
  if (clean === "image/avif") return ".avif";
  if (clean === "image/gif") return ".gif";
  if (clean === "image/jpeg" || clean === "image/jpg") return ".jpg";
  const ext = path.extname(new URL(sourceUrl).pathname).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"].includes(ext) ? ext : ".jpg";
}

async function fetchImage(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type");
    if (!contentType?.toLowerCase().startsWith("image/")) {
      throw new Error(`contenu non image (${contentType || "inconnu"})`);
    }
    const declared = Number(response.headers.get("content-length") || 0);
    if (declared > maxBytes) throw new Error("image trop volumineuse");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > maxBytes) throw new Error("taille image invalide");
    return { bytes, contentType };
  } finally {
    clearTimeout(timer);
  }
}

async function ensureBundledLocalImage(url: string) {
  const diskPath = path.join(publicDir, url.replace(/^\//, ""));
  const bytes = await readFile(diskPath);
  if (!bytes.length) throw new Error(`fichier local vide: ${url}`);
  return url;
}

async function cacheProduct(product: (typeof products)[number]) {
  if (product.images.length !== 3) {
    throw new Error(`${product.slug}: ${product.images.length} images au lieu de 3`);
  }

  const dbProduct = await prisma.product.findUnique({
    where: { slug: product.slug },
    select: { id: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!dbProduct) {
    console.log(`  - ${product.slug}: absent de la base (lance d'abord catalogue:import)`);
    return { status: "skipped" as const };
  }

  if (dbProduct.images.length > 0 && !dbProduct.images.every((image) => isSeedManagedImage(image.url))) {
    console.log(`  - ${product.slug}: galerie manuelle conservée`);
    return { status: "manual" as const };
  }

  const localUrls: string[] = [];
  const dir = path.join(publicDir, "images", "catalogue-real", product.slug);
  await mkdir(dir, { recursive: true });

  for (let index = 0; index < product.images.length; index++) {
    const sourceUrl = product.images[index].url;
    if (sourceUrl.startsWith("/")) {
      localUrls.push(await ensureBundledLocalImage(sourceUrl));
      continue;
    }

    const { bytes, contentType } = await fetchImage(sourceUrl);
    const ext = extensionFromContentType(contentType, sourceUrl);
    const filename = `${index + 1}${ext}`;
    await writeFile(path.join(dir, filename), bytes);
    localUrls.push(`/images/catalogue-real/${product.slug}/${filename}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: dbProduct.id } });
    for (let index = 0; index < localUrls.length; index++) {
      await tx.productImage.create({
        data: {
          id: `${dbProduct.id}-real-${index + 1}`,
          productId: dbProduct.id,
          url: localUrls[index],
          alt: `${product.name} — vue ${index + 1}`,
          sortOrder: index,
        },
      });
    }
  });

  console.log(`  ✓ ${product.name}: 3 photos locales`);
  return { status: "cached" as const };
}

async function main() {
  console.log("InfraRed — téléchargement des vraies photos catalogue (3 par modèle)\n");
  let cached = 0;
  let manual = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const result = await cacheProduct(product);
      if (result.status === "cached") cached++;
      if (result.status === "manual") manual++;
    } catch (error) {
      failed++;
      console.error(`  ✗ ${product.name}:`, error instanceof Error ? error.message : error);
      console.error("    La galerie distante existante est conservée pour ce modèle.");
    }
  }

  console.log(`\nTerminé: ${cached} galerie(s) mises en local, ${manual} galerie(s) manuelle(s) conservée(s), ${failed} échec(s).`);
  if (failed) {
    console.log("Relance ce script après avoir vérifié ta connexion Internet; aucun produit en échec n'est écrasé.");
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
