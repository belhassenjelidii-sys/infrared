import { PrismaClient, Role, Target } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { categories, brands, products, stores } from "../src/lib/data";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://infrared:infrared_dev_password@localhost:5432/infrared";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function toTarget(t: string): Target {
  const up = t.toUpperCase() as Target;
  if (up === "HOMME" || up === "FEMME" || up === "MIXTE" || up === "ENFANT") return up;
  return "MIXTE";
}

async function main() {
  console.log("Seeding categories…");
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, image: c.image, active: c.active },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        active: c.active,
      },
    });
  }

  console.log("Seeding brands…");
  for (const b of brands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, logo: b.logo, active: b.active },
      create: { id: b.id, name: b.name, slug: b.slug, logo: b.logo, active: b.active },
    });
  }

  console.log("Seeding products…");
  for (const p of products) {
    const cat = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    const br = await prisma.brand.findUnique({ where: { slug: p.brandSlug } });
    if (!cat || !br) {
      console.log("Skip (missing category/brand):", p.slug);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        reference: p.reference,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: p.discount,
        color: p.color,
        shape: p.shape ?? "Rectangle",
        target: toTarget(p.target),
        available: p.available,
        featured: p.featured,
        isNew: p.isNew,
        isPromotion: p.isPromotion,
        categoryId: cat.id,
        brandId: br.id,
      },
      create: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        reference: p.reference,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: p.discount,
        color: p.color,
        shape: p.shape ?? "Rectangle",
        target: toTarget(p.target),
        available: p.available,
        featured: p.featured,
        isNew: p.isNew,
        isPromotion: p.isPromotion,
        createdAt: new Date(p.createdAt),
        categoryId: cat.id,
        brandId: br.id,
      },
    });

    // Real photos only — placeholder entries in src/lib/data.ts are a
    // front-end-only concept (ProductImage has no isPlaceholder column in
    // the DB), so they're simply not written here.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    for (const img of p.images) {
      if (img.isPlaceholder) continue;
      await prisma.productImage.create({
        data: {
          id: img.id,
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
          productId: product.id,
        },
      });
    }
  }

  console.log("Seeding boutiques…");
  for (let i = 0; i < stores.length; i++) {
    const st = stores[i];
    const existing = await prisma.store.findFirst({ where: { name: st.name } });
    const data = {
      name: st.name,
      address: st.address,
      mobile: st.mobile,
      landline: st.landline,
      mapsUrl: st.mapsUrl,
      mapsEmbedQuery: st.mapsEmbedQuery,
      photo: st.photo,
      sortOrder: i,
      active: true,
    };
    if (existing) {
      await prisma.store.update({ where: { id: existing.id }, data });
    } else {
      await prisma.store.create({ data });
    }
  }

  console.log("Seeding settings…");
  if (!(await prisma.storeSettings.findFirst())) {
    await prisma.storeSettings.create({
      data: {
        heroTitle: "Découvrez votre prochaine paire.",
        heroSubtitle: "Montures solaires et optiques des plus grandes marques, dans nos boutiques InfraRed.",
        heroCtaLabel: "Découvrir nos lunettes",
        accentColor: "#E0122C",
        categoryTitleSolaires: "Lunettes solaires",
        categoryTitleOptiques: "Lunettes optiques",
        categoryTitleNouveautes: "Nouveautés",
        showPrices: true,
      },
    });
  }

  console.log("Seeding users…");
  const adminHash = await bcrypt.hash("Infrared2026!", 10);
  const marketingHash = await bcrypt.hash("Marketing2026!", 10);
  const devHash = await bcrypt.hash("Developer2026!", 10);

  // Single ADMIN account — no second admin is ever created by this app.
  await prisma.user.upsert({
    where: { email: "admin@infrared.tn" },
    update: { passwordHash: adminHash, role: Role.ADMIN, active: true },
    create: { name: "Admin InfraRed", email: "admin@infrared.tn", passwordHash: adminHash, role: Role.ADMIN, active: true },
  });

  // Marketing Digital & Commercial — pricing/photos/availability (/commercial)
  // plus site content (Boutiques, Paramètres) under /admin.
  await prisma.user.upsert({
    where: { email: "marketing@infrared.tn" },
    update: { passwordHash: marketingHash, role: Role.COMMERCIAL, active: true },
    create: { name: "Marketing Digital & Commercial", email: "marketing@infrared.tn", passwordHash: marketingHash, role: Role.COMMERCIAL, active: true },
  });

  // Développeur — full back-office access, same scope as Admin.
  await prisma.user.upsert({
    where: { email: "dev@infrared.tn" },
    update: { passwordHash: devHash, role: Role.DEVELOPER, active: true },
    create: { name: "Développeur", email: "dev@infrared.tn", passwordHash: devHash, role: Role.DEVELOPER, active: true },
  });

  console.log("Seed OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
