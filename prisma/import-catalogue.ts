import { PrismaClient, Target } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { brands, categories, products } from "../src/lib/data";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://infrared:infrared_dev_password@localhost:5432/infrared";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function toTarget(value: string): Target {
  const target = value.toUpperCase() as Target;
  return target === "HOMME" || target === "FEMME" || target === "MIXTE" || target === "ENFANT"
    ? target
    : "MIXTE";
}

function isSeedManagedBrandLogo(url: string | null) {
  if (!url) return true;
  if (url.startsWith("/images/brands/") || url.includes("placeholder")) return true;
  try {
    return [
      "commons.wikimedia.org",
      "upload.wikimedia.org",
      "visionsourceshowcase.luxottica.com",
    ].includes(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function isSeedManagedImage(url: string) {
  if (url.startsWith("/images/products/") || url.startsWith("/images/catalogue-local/") || url.startsWith("/images/catalogue-real/") || url.includes("placeholder")) return true;
  try {
    return [
      "www.eye-oo.com",
      "img.ebdcdn.com",
      "vogue-eyewear.com",
      "d237xocrarx9cy.cloudfront.net",
      "assets.kogan.com",
      "i.ebayimg.com",
          "www.shadestation.co.uk",
          "static5.lenskart.com",
          "grandvision-media.imgix.net",
          "assets2.oliverpeoples.com",
    ].includes(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function main() {
  console.log("InfraRed — import catalogue HD");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        active: category.active,
      },
      create: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        active: category.active,
      },
    });
  }

  for (const brand of brands) {
    const existing = await prisma.brand.findUnique({
      where: { slug: brand.slug },
      select: { logo: true },
    });
    const refreshLogo = !existing || isSeedManagedBrandLogo(existing.logo);
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        active: brand.active,
        heroWomenImage: brand.heroWomenImage,
        heroMenImage: brand.heroMenImage,
        ...(brand.logo && refreshLogo ? { logo: brand.logo } : {}),
      },
      create: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        heroWomenImage: brand.heroWomenImage,
        heroMenImage: brand.heroMenImage,
        active: brand.active,
      },
    });
  }

  let created = 0;
  let updated = 0;
  let galleriesRefreshed = 0;
  let galleriesCompleted = 0;

  for (const product of products) {
    const [category, brand, existingProduct] = await Promise.all([
      prisma.category.findUnique({ where: { slug: product.categorySlug }, select: { id: true } }),
      prisma.brand.findUnique({ where: { slug: product.brandSlug }, select: { id: true } }),
      prisma.product.findUnique({ where: { slug: product.slug }, select: { id: true } }),
    ]);
    if (!category || !brand) {
      throw new Error(`Catégorie ou marque introuvable pour ${product.slug}.`);
    }

    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        reference: product.reference,
        description: product.description,
        color: product.color,
        shape: product.shape ?? "Rectangulaire",
        target: toTarget(product.target),
        available: product.available,
        featured: product.featured,
        isNew: product.isNew,
        categoryId: category.id,
        brandId: brand.id,
        // Existing shop prices, promotions, archive/publication choices are
        // intentionally NOT overwritten by the catalogue importer.
      },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        reference: product.reference,
        description: product.description,
        price: product.price,
        oldPrice: product.oldPrice,
        discount: product.discount,
        color: product.color,
        shape: product.shape ?? "Rectangulaire",
        target: toTarget(product.target),
        available: product.available,
        featured: product.featured,
        isNew: product.isNew,
        isPromotion: product.isPromotion,
        createdAt: new Date(product.createdAt),
        categoryId: category.id,
        brandId: brand.id,
      },
    });

    if (existingProduct) updated++;
    else created++;

    const currentImages = await prisma.productImage.findMany({
      where: { productId: row.id },
      select: { id: true, url: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    });
    const onlySeedManaged =
      currentImages.length === 0 || currentImages.every(({ url }) => isSeedManagedImage(url));

    if (!existingProduct || onlySeedManaged) {
      await prisma.productImage.deleteMany({ where: { productId: row.id } });
      for (const image of product.images) {
        if (image.isPlaceholder) continue;
        await prisma.productImage.create({
          data: {
            id: image.id,
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder,
            productId: row.id,
          },
        });
      }
      galleriesRefreshed++;
      continue;
    }

    if (currentImages.length < 3) {
      const usedUrls = new Set(currentImages.map(({ url }) => url));
      const usedIds = new Set(currentImages.map(({ id }) => id));
      let sortOrder = currentImages.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1;
      let count = currentImages.length;

      for (const image of product.images) {
        if (count >= 3) break;
        if (image.isPlaceholder || usedUrls.has(image.url)) continue;
        let id = `${product.id}-catalogue-extra-${image.sortOrder + 1}`;
        let suffix = 2;
        while (usedIds.has(id)) id = `${product.id}-catalogue-extra-${image.sortOrder + 1}-${suffix++}`;
        await prisma.productImage.create({
          data: {
            id,
            url: image.url,
            alt: image.alt,
            sortOrder: sortOrder++,
            productId: row.id,
          },
        });
        usedIds.add(id);
        usedUrls.add(image.url);
        count++;
      }
      galleriesCompleted++;
    }
  }

  console.log(`Import terminé : ${created} produit(s) créé(s), ${updated} mis à jour.`);
  console.log(`${galleriesRefreshed} galerie(s) seed/HD actualisée(s), ${galleriesCompleted} galerie(s) manuelle(s) complétée(s).`);
  console.log("Aucune boutique, aucun utilisateur, aucun paramètre du site n'a été modifié.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
