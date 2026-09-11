import { PrismaClient, Role, Target } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { categories, brands, products, stores, seedShopDefaults } from "../src/lib/data";

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
  const isSeedManagedBrandLogo = (url: string | null) => {
    if (!url) return true;
    if (url.startsWith("/images/brands/") || url.includes("placeholder")) return true;
    try {
      const host = new URL(url).hostname.toLowerCase();
      return [
        "commons.wikimedia.org",
        "upload.wikimedia.org",
        "visionsourceshowcase.luxottica.com",
      ].includes(host);
    } catch {
      return false;
    }
  };

  for (const b of brands) {
    const existingBrand = await prisma.brand.findUnique({
      where: { slug: b.slug },
      select: { id: true, logo: true },
    });
    const shouldRefreshLogo = !existingBrand || isSeedManagedBrandLogo(existingBrand.logo);

    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        active: b.active,
        heroWomenImage: b.heroWomenImage,
        heroMenImage: b.heroMenImage,
        ...(b.logo && shouldRefreshLogo ? { logo: b.logo } : {}),
      },
      create: { id: b.id, name: b.name, slug: b.slug, logo: b.logo, heroWomenImage: b.heroWomenImage, heroMenImage: b.heroMenImage, active: b.active },
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

    const existingProduct = await prisma.product.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });
    const refreshPrices = ["1", "true", "yes"].includes(
      (process.env.SEED_REFRESH_PRODUCT_PRICES || "").trim().toLowerCase(),
    );

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        reference: p.reference,
        description: p.description,
        color: p.color,
        shape: p.shape ?? "Rectangle",
        target: toTarget(p.target),
        available: p.available,
        featured: p.featured,
        isNew: p.isNew,
        categoryId: cat.id,
        brandId: br.id,
        ...(refreshPrices
          ? { price: p.price, oldPrice: p.oldPrice, discount: p.discount, isPromotion: p.isPromotion }
          : {}),
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

    // Seed images are refreshed automatically only when the product has no
    // photos yet or still uses the old bundled SVG placeholders. This avoids
    // deleting real photos an admin may already have uploaded manually. Set
    // SEED_REFRESH_PRODUCT_IMAGES=true to intentionally replace them.
    const currentImages = await prisma.productImage.findMany({
      where: { productId: product.id },
      select: { id: true, url: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    });
    const refreshImages = ["1", "true", "yes"].includes(
      (process.env.SEED_REFRESH_PRODUCT_IMAGES || "").trim().toLowerCase(),
    );
    const isSeedManagedImage = (url: string) => {
      if (url.startsWith("/images/products/") || url.startsWith("/images/catalogue-local/") || url.startsWith("/images/catalogue-real/") || url.includes("placeholder")) return true;
      try {
        const host = new URL(url).hostname.toLowerCase();
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
        ].includes(host);
      } catch {
        return false;
      }
    };
    const onlySeedManagedImages =
      currentImages.length === 0 || currentImages.every(({ url }) => isSeedManagedImage(url));

    if (!existingProduct || refreshImages || onlySeedManagedImages) {
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
    } else if (currentImages.length < 3) {
      // Keep real photos uploaded from the dashboard and only complete the
      // gallery up to three views with verified seed images.
      const usedUrls = new Set(currentImages.map((img) => img.url));
      const usedIds = new Set(currentImages.map((img) => img.id));
      let nextSortOrder = currentImages.reduce((max, img) => Math.max(max, img.sortOrder), -1) + 1;
      let count = currentImages.length;

      for (const img of p.images) {
        if (count >= 3) break;
        if (img.isPlaceholder || usedUrls.has(img.url)) continue;

        let imageId = `${p.id}-seed-extra-${img.sortOrder + 1}`;
        let suffix = 2;
        while (usedIds.has(imageId)) imageId = `${p.id}-seed-extra-${img.sortOrder + 1}-${suffix++}`;

        await prisma.productImage.create({
          data: {
            id: imageId,
            url: img.url,
            alt: img.alt,
            sortOrder: nextSortOrder++,
            productId: product.id,
          },
        });
        usedUrls.add(img.url);
        usedIds.add(imageId);
        count += 1;
      }
      console.log(`  ↳ ${p.slug}: galerie complétée à ${count} photo(s) sans écraser les uploads existants`);
    } else {
      console.log(`  ↳ ${p.slug}: 3+ photos existantes conservées (SEED_REFRESH_PRODUCT_IMAGES=false)`);
    }
  }

  console.log("Seeding boutiques…");
  for (let i = 0; i < stores.length; i++) {
    const st = stores[i];
    const existing = await prisma.store.findFirst({ where: { name: st.name } });
    const data = {
      name: st.name,
      slug: st.id, // data.ts ids are already slug-friendly ("kram", "tunisia-mall", "el-aouina")
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
  const existingSettings = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } });
  if (!existingSettings) {
    await prisma.storeSettings.create({
      data: {
        singletonKey: "main",
        phone: seedShopDefaults.phone,
        whatsapp: seedShopDefaults.whatsapp,
        instagram: seedShopDefaults.instagram,
        facebook: seedShopDefaults.facebook,
        address: seedShopDefaults.address,
        mapsUrl: seedShopDefaults.mapsUrl,
        hoursJson: JSON.stringify(seedShopDefaults.hours),
        heroTitle: "Découvrez votre prochaine paire.",
        heroSubtitle: "Montures solaires et optiques des plus grandes marques, dans nos boutiques InfraRed.",
        heroCtaLabel: "Découvrir nos lunettes",
        heroMediaType: "image",
        accentColor: "#E0122C",
        categoryTitleSolaires: "Lunettes solaires",
        categoryTitleOptiques: "Lunettes optiques",
        categoryTitleNouveautes: "Nouveautés",
        showPrices: true,
        aboutEnabled: true,
        aboutEyebrow: "Depuis 2012",
        aboutTitle: "L'opticien InfraRed, à Tunis",
        aboutText:
          "Plus de 10 ans d'expertise optique, une sélection exigeante des plus grandes marques et un conseil personnalisé dans chacune de nos boutiques.",
        aboutStatsJson: JSON.stringify([
          { title: "10+ ans d'expertise", text: "Une maison reconnue à Tunis." },
          { title: "Grandes marques", text: "Carrera, Ray-Ban, Vogue, Polaroid, Emporio Armani…" },
          { title: "Opticiens diplômés", text: "Examen de vue et montage sur mesure en boutique." },
        ]),
      },
    });
  } else {
    // Preserve every value entered from the dashboard, but repair older
    // local databases where the initial contact fields were left empty.
    await prisma.storeSettings.update({
      where: { id: existingSettings.id },
      data: {
        phone: existingSettings.phone?.trim() ? existingSettings.phone : seedShopDefaults.phone,
        whatsapp: existingSettings.whatsapp?.trim() ? existingSettings.whatsapp : seedShopDefaults.whatsapp,
        instagram: existingSettings.instagram?.trim() ? existingSettings.instagram : seedShopDefaults.instagram,
        facebook: existingSettings.facebook?.trim() ? existingSettings.facebook : seedShopDefaults.facebook,
        address: existingSettings.address?.trim() ? existingSettings.address : seedShopDefaults.address,
        mapsUrl: existingSettings.mapsUrl?.trim() ? existingSettings.mapsUrl : seedShopDefaults.mapsUrl,
        hoursJson: existingSettings.hoursJson?.trim()
          ? existingSettings.hoursJson
          : JSON.stringify(seedShopDefaults.hours),
      },
    });
  }

  console.log("Seeding users…");
  async function upsertUser(envVar: string, data: { name: string; email: string; role: Role }) {
    const configured = process.env[envVar]?.trim();
    const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true, passwordHash: true } });

    if (existing) {
      const update: { name: string; role: Role; active: boolean; passwordHash?: string } = {
        name: data.name,
        role: data.role,
        active: true,
      };
      // Re-running the seed must NOT rotate an existing password unless an
      // explicit password was provided through the environment.
      if (configured && configured.length >= 8) update.passwordHash = await bcrypt.hash(configured, 10);
      await prisma.user.update({ where: { id: existing.id }, data: update });
      return;
    }

    let password = configured;
    if (!password || password.length < 8) {
      password = crypto.randomBytes(12).toString("base64url");
      console.warn(`⚠️  ${envVar} n'est pas défini (ou trop court) — mot de passe temporaire généré pour ${data.email} : ${password}`);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { ...data, passwordHash, active: true } });
  }

  await upsertUser("SEED_ADMIN_PASSWORD", { name: "Admin InfraRed", email: "admin@infrared.tn", role: Role.SUPER_ADMIN });
  await upsertUser("SEED_COMMERCIAL_PASSWORD", { name: "Marketing Digital & Commercial", email: "marketing@infrared.tn", role: Role.COMMERCIAL });
  await upsertUser("SEED_DEVELOPER_PASSWORD", { name: "Développeur", email: "dev@infrared.tn", role: Role.DEVELOPER });

  console.log("Seed OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
