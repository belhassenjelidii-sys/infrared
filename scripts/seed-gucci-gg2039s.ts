import "dotenv/config";
import { PrismaClient, ProductType, Target } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://infrared:infrared_dev_password@localhost:5432/infrared";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const variants = [
  { code: "001", color: "Noir", family: "Noir", price: 313, stock: 1, solarIndex: 3, gradient: false, slug: "gucci-gg2039s-001-51-19-noir" },
  { code: "002", color: "Écaille", family: "Écaille", price: 269, stock: 0, solarIndex: 2, gradient: true, slug: "gucci-gg2039s-002-51-19-havane" },
  { code: "004", color: "Havane", family: "Écaille", price: 269, stock: 5, solarIndex: 2, gradient: true, slug: "gucci-gg2039s-004-51-19-havane" },
] as const;

async function main() {
  const [brand, category, actor] = await Promise.all([
    prisma.brand.findUnique({ where: { slug: "gucci" } }),
    prisma.category.findUnique({ where: { slug: "solaires" } }),
    prisma.user.findUnique({ where: { email: "admin@infrared.tn" } }),
  ]);
  if (!brand || !category) throw new Error("La marque Gucci ou la catégorie solaires est absente.");

  const model = await prisma.productModel.upsert({
    where: { brandId_code_type: { brandId: brand.id, code: "GG2039S", type: ProductType.SUNGLASSES } },
    update: { name: "GG2039S", collection: "Gucci Eyewear", shape: "Œil de chat", materialLabel: "Acétate recyclé", materialFamily: "Acétate", gender: Target.FEMME, frameType: "Cerclée", style: "Élégant", active: true },
    create: { brandId: brand.id, categoryId: category.id, type: ProductType.SUNGLASSES, code: "GG2039S", name: "GG2039S", collection: "Gucci Eyewear", shape: "Œil de chat", materialLabel: "Acétate recyclé", materialFamily: "Acétate", gender: Target.FEMME, frameType: "Cerclée", style: "Élégant", description: "Lunettes de soleil Gucci GG2039S pour femme, forme œil de chat en acétate recyclé. Modèle proposé en plusieurs coloris avec sélection automatique.", active: true },
  });

  for (const variant of variants) {
    const product = await prisma.product.upsert({
      where: { slug: variant.slug },
      update: {
        productModelId: model.id, type: ProductType.SUNGLASSES, variantReference: variant.code,
        frameColorLabel: variant.color, frameColorFamily: variant.family, lensColorLabel: "Gris", lensColorFamily: "Gris",
        size: "51-19", lensWidth: 51, bridgeWidth: 19, templeLength: 130, lensHeight: 47, totalWidth: 137, commercialSize: "Medium", solarIndex: variant.solarIndex,
        polarized: false, gradient: variant.gradient, photochromic: false, mirrored: false, prescriptionCompatible: true, weight: 58,
        name: `Gucci GG2039S ${variant.code} 51-19 ${variant.color}`, reference: `GG2039S ${variant.code} 51-19`,
        description: `Lunettes de soleil Gucci GG2039S ${variant.code}, taille Medium 51-19, monture ${variant.color.toLowerCase()} et verres gris.`,
        price: variant.price, brandId: brand.id, categoryId: category.id, color: variant.color, shape: "Œil de chat", target: Target.FEMME,
        available: variant.stock > 0, stock: variant.stock, featured: false, isNew: true, archived: false, published: true,
      },
      create: {
        productModelId: model.id, type: ProductType.SUNGLASSES, sku: `GUCCI-GG2039S-${variant.code}-51-19`, variantReference: variant.code,
        frameColorLabel: variant.color, frameColorFamily: variant.family, lensColorLabel: "Gris", lensColorFamily: "Gris",
        size: "51-19", lensWidth: 51, bridgeWidth: 19, templeLength: 130, lensHeight: 47, totalWidth: 137, commercialSize: "Medium", solarIndex: variant.solarIndex,
        polarized: false, gradient: variant.gradient, photochromic: false, mirrored: false, prescriptionCompatible: true, weight: 58,
        name: `Gucci GG2039S ${variant.code} 51-19 ${variant.color}`, slug: variant.slug, reference: `GG2039S ${variant.code} 51-19`,
        description: `Lunettes de soleil Gucci GG2039S ${variant.code}, taille Medium 51-19, monture ${variant.color.toLowerCase()} et verres gris.`,
        price: variant.price, categoryId: category.id, brandId: brand.id, color: variant.color, shape: "Œil de chat", target: Target.FEMME,
        available: variant.stock > 0, stock: variant.stock, featured: false, isNew: true, archived: false, published: true,
      },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({ data: [1, 2, 3].map((number, sortOrder) => ({ productId: product.id, url: `/uploads/source-gucci-gg2039s-${variant.code}-${number}.jpg`, alt: `Gucci GG2039S ${variant.code} 51-19 ${variant.color} — vue ${number}`, sortOrder })) });
  }

  const marketingPolicy = await prisma.rolePolicy.findUnique({ where: { role: "MARKETING" } });
  if (marketingPolicy && !marketingPolicy.permissions.includes("products.edit")) {
    await prisma.rolePolicy.update({ where: { role: "MARKETING" }, data: { permissions: [...marketingPolicy.permissions, "products.edit"] } });
  }
  await prisma.auditLog.create({ data: { actorId: actor?.id, action: "model.import", entityType: "ProductModel", entityId: model.id, after: { code: model.code, variants: variants.length, source: "visiofactory.com" } } });
  console.log(JSON.stringify({ modelId: model.id, slugs: variants.map((variant) => variant.slug) }, null, 2));
}

main().finally(() => prisma.$disconnect());
