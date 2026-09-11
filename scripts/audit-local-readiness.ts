import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { analyzeTransparency, isVerifiedTransparentPng } from "../src/lib/image-pipeline/background-remover";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL est absent.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const publicRoot = path.join(process.cwd(), "public");
const allowedPeopleViews = new Set([
  "/images/catalogue-real/carrera-1014-s-003/3.jpg",
  "/images/catalogue-real/saint-laurent-sl-276-mica-025/3.webp",
]);

async function main() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { archived: false, published: true },
      select: { slug: true, price: true, images: { select: { url: true } } },
    }),
    prisma.storeSettings.findUnique({ where: { singletonKey: "main" } }),
  ]);

  const errors: string[] = [];
  const warnings: string[] = [];
  for (const product of products) {
    if (product.images.length === 0) errors.push(`${product.slug}: aucune photo`);
    if (product.images.length < 3) warnings.push(`${product.slug}: seulement ${product.images.length} photo(s)`);
    if (Number(product.price) <= 0) warnings.push(`${product.slug}: prix à confirmer`);

    for (const image of product.images) {
      if (allowedPeopleViews.has(image.url)) continue;
      if (!image.url.startsWith("/")) {
        warnings.push(`${product.slug}: image distante ${image.url}`);
        continue;
      }
      const filePath = path.join(publicRoot, ...image.url.slice(1).split("/"));
      try {
        const buffer = await fs.readFile(filePath);
        const analysis = await analyzeTransparency(buffer);
        if (!isVerifiedTransparentPng(analysis)) errors.push(`${product.slug}: transparence invalide ${image.url}`);
      } catch {
        errors.push(`${product.slug}: fichier introuvable ${image.url}`);
      }
    }
  }

  if (!settings?.phone) warnings.push("Téléphone principal absent des paramètres");
  if (!settings?.address) warnings.push("Adresse principale absente des paramètres");
  if (!settings?.mapsUrl) warnings.push("Lien Google Maps principal absent des paramètres");
  if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPasswordEncrypted) {
    warnings.push("SMTP non configuré (normal tant que le site reste local)");
  }

  console.log(`Catalogue : ${products.length} produit(s) publié(s)`);
  for (const warning of warnings) console.warn(`AVERTISSEMENT: ${warning}`);
  for (const error of errors) console.error(`ERREUR: ${error}`);
  if (errors.length) throw new Error(`${errors.length} erreur(s) locale(s) détectée(s).`);
  console.log(`Audit local réussi avec ${warnings.length} avertissement(s) de contenu/configuration.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
