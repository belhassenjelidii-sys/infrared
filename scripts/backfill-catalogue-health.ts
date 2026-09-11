import { prisma } from "../src/lib/prisma";
import { generateProductMetadata } from "../src/lib/product-intelligence/metadata-generator";

function buildDescription(product: { name: string; reference: string; color: string | null; shape: string | null; brand: { name: string }; category: { name: string } }) {
  const details = [product.category.name.toLowerCase(), product.color?.toLowerCase(), product.shape ? `forme ${product.shape.toLowerCase()}` : null]
    .filter(Boolean)
    .join(", ");
  const model = [product.brand.name, product.reference].filter(Boolean).join(" ") || product.name;
  return `${model} — ${details}. Contactez InfraRed Optic-Store pour confirmer la disponibilité en boutique.`;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { archived: false },
    include: { brand: true, category: true, images: { orderBy: { sortOrder: "asc" } } },
  });
  let updatedDescriptions = 0;
  let updatedMetadata = 0;

  for (const product of products) {
    const description = product.description.trim().length < 15 ? buildDescription(product) : product.description;
    const needsDescription = description !== product.description;
    const needsMetadata = !product.metaTitle && !product.metaDescription;
    if (!needsDescription && !needsMetadata) continue;

    const metadata = generateProductMetadata({
      id: product.id,
      name: product.name,
      slug: product.slug,
      reference: product.reference,
      description,
      price: Number(product.price),
      oldPrice: product.oldPrice == null ? null : Number(product.oldPrice),
      isPromotion: product.isPromotion,
      isNew: product.isNew,
      color: product.color,
      shape: product.shape,
      brandName: product.brand.name,
      categoryName: product.category.name,
      target: product.target,
      images: product.images.map((image) => ({ id: image.id, url: image.url })),
      mainImageHash: product.images[0]?.phash ?? null,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(needsDescription ? { description } : {}),
        ...(needsMetadata
          ? {
              metaTitle: metadata.seoTitle,
              metaDescription: metadata.metaDescription,
              tags: metadata.tags.join(", "),
              whatsappTitle: metadata.whatsappTitle,
            }
          : {}),
      },
    });
    if (needsDescription) updatedDescriptions += 1;
    if (needsMetadata) updatedMetadata += 1;
  }

  console.log(`Catalogue mis à jour : ${updatedDescriptions} description(s), ${updatedMetadata} fiche(s) SEO.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
