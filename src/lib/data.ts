import type { Brand, Category, Product } from "@/types";

// ---------------------------------------------------------------------------
// SEED CATALOGUE — bootstrap data for PostgreSQL via prisma/seed.ts.
// Live public/admin pages still read exclusively from Prisma; this file is
// not a second live database. Product photos below point to real catalogue
// imagery rather than generated/stock placeholders.
//
// IMPORTANT — before commercial publication, prefer supplier/brand-authorized
// media that InfraRed is allowed to reuse, then mirror those assets to the
// site's own storage (e.g. Supabase) instead of relying permanently on
// third-party hotlinks.
// ---------------------------------------------------------------------------

export const categories: Category[] = [
  {
    id: "cat-solaires",
    name: "Lunettes solaires",
    slug: "solaires",
    description: "Protection et style, pour toutes les saisons.",
    image: "/images/categories/solaires.svg",
    active: true,
  },
  {
    id: "cat-optiques",
    name: "Lunettes optiques",
    slug: "optiques",
    description: "Montures de vue élégantes, pour un confort quotidien.",
    image: "/images/categories/optiques.svg",
    active: true,
  },
  {
    id: "cat-nouveautes",
    name: "Nouveautés",
    slug: "nouveautes",
    description: "Les dernières arrivées en boutique.",
    image: "/images/categories/nouveautes.svg",
    active: true,
  },
  {
    id: "cat-promotions",
    name: "Promotions",
    slug: "promotions",
    description: "Une sélection à prix réduit, pour un temps limité.",
    image: "/images/categories/promotions.svg",
    active: true,
  },
];

// Seed catalogue brands. The five added designer brands were selected from
// current eyewear top-brand/trending/new-arrival listings. Brand logos use
// vector/original brand assets where available so the marquee stays crisp
// on retina/large screens; admins can still replace any logo in the dashboard.
export const brands: Brand[] = [
  { id: "b-carrera", name: "Carrera", slug: "carrera", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_carrera.svg", heroWomenImage: "/images/brand-campaigns/carrera-women.jpg", heroMenImage: "/images/brand-editorials/carrera.jpg", active: true },
  { id: "b-rayban", name: "Ray-Ban", slug: "ray-ban", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ray-Ban_logo.svg", heroWomenImage: "/images/brand-campaigns/ray-ban-women.jpg", heroMenImage: "/images/brand-editorials/ray-ban.jpg", active: true },
  { id: "b-vogue", name: "Vogue", slug: "vogue", logo: "https://visionsourceshowcase.luxottica.com/wp-content/uploads/Vogue_Logo-1024x695.jpg", heroWomenImage: "/images/brand-campaigns/vogue-women.jpg", heroMenImage: "/images/brand-editorials/vogue-eyewear.jpg", active: true },
  { id: "b-polaroid", name: "Polaroid", slug: "polaroid", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Polaroid_Logo_2023.svg", heroWomenImage: "/images/brand-editorials/polaroid.jpg", heroMenImage: "/images/brand-editorials/polaroid.jpg", active: true },
  { id: "b-armani", name: "Emporio Armani", slug: "emporio-armani", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Emporio_Armani_logo.svg", heroWomenImage: "/images/brand-campaigns/emporio-armani-women.jpg", heroMenImage: "/images/brand-editorials/emporio-armani.jpg", active: true },
  { id: "b-miu-miu", name: "Miu Miu", slug: "miu-miu", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Miu_Miu_-_logo_%28Italy%2C_1993%29.svg", heroWomenImage: "/images/brand-campaigns/miu-miu-women.jpg", heroMenImage: "/images/brand-editorials/miu-miu.jpg", active: true },
  { id: "b-prada", name: "Prada", slug: "prada", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Prada-Logo.svg", heroWomenImage: "/images/brand-campaigns/prada-women.jpg", heroMenImage: "/images/brand-editorials/prada.jpg", active: true },
  { id: "b-gucci", name: "Gucci", slug: "gucci", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Gucci_Logo.svg", heroWomenImage: "/images/brand-campaigns/gucci-women.jpg", heroMenImage: "/images/brand-editorials/gucci.jpg", active: true },
  { id: "b-saint-laurent", name: "Saint Laurent", slug: "saint-laurent", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Saint_Laurent_logo.svg", heroWomenImage: "/images/brand-campaigns/saint-laurent-women.jpg", heroMenImage: "/images/brand-campaigns/saint-laurent-men.jpg", active: true },
  { id: "b-oliver-peoples", name: "Oliver Peoples", slug: "oliver-peoples", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Oliver_Peoples_logo.svg", heroWomenImage: "/images/brand-campaigns/oliver-peoples-women.jpg", heroMenImage: "/images/brand-editorials/oliver-peoples.jpg", active: true },
];

type SeedImage = { url: string; alt?: string };

// Local, model-specific galleries bundled with this project. The catalogue
// importer prefers these verified files to fragile third-party hotlinks.
const LOCAL_CATALOGUE_IMAGES: Record<string, string[]> = {
  "armani-ea1131": ["1.png", "2.png", "3.png"],
  "armani-ea4184": ["1.png", "2.png", "3.png"],
  "carrera-1014-s-003": ["1.png", "2.png", "3.jpg"],
  "carrera-1023-s": ["1.png", "2.png", "3.png"],
  "carrera-8865": ["1.png", "2.png", "3.png"],
  "emporio-armani-ea3246-5001": ["1.png", "2.png", "3.png"],
  "gucci-gg1604s-003": ["1.png", "2.png", "3.png"],
  "gucci-gg1680s-004": ["1.png", "2.png", "3.png"],
  "gucci-gg1853s-001": ["1.png", "2.png", "3.png"],
  "miu-miu-mu-06vv-1ab1o1": ["1.png", "2.png", "3.png"],
  "miu-miu-mu-b09s-14l20v": ["1.png", "2.png", "3.png"],
  "miu-miu-mu-b11su-16k80q": ["1.png", "2.png", "3.png"],
  "oliver-peoples-etlin-ov1355t-5036": ["1.png", "2.png", "3.png"],
  "oliver-peoples-fairmont-ov5219-1465": ["1.png", "2.png", "3.png"],
  "oliver-peoples-n01-ov5528u-1731": ["1.png", "2.png", "3.png"],
  "polaroid-pld-4132": ["1.png", "2.png", "3.png"],
  "polaroid-pld-4177-s-x-807-wj": ["1.png", "2.png", "3.png"],
  "polaroid-pld-6172": ["1.png", "2.png", "3.png"],
  "prada-pr-02ys-1ab0a7": ["1.png", "2.png", "3.png"],
  "prada-pr-02zv-1ab1o1": ["1.png", "2.png", "3.png"],
  "prada-pr-c12v-20d1o1": ["1.png", "2.png", "3.png"],
  "rayban-aviator-classic": ["1.png", "2.png", "3.png"],
  "rayban-junior-1": ["1.png", "2.png", "3.png"],
  "rayban-wayfarer-opt": ["1.png", "2.png", "3.png"],
  "saint-laurent-sl-276-mica-025": ["1.png", "2.png", "3.webp"],
  "saint-laurent-sl-557-shade-001": ["1.png", "2.png", "3.png"],
  "saint-laurent-sl-596-dune-003": ["1.png", "2.png", "3.png"],
  "vogue-vo4295": ["1.png", "2.png", "3.png"],
  "vogue-vo5285": ["1.png", "2.png", "3.png"],
  "vogue-vo5411s": ["1.png", "2.png", "3.png"],
};

function makeProduct(p: {
  id: string;
  name: string;
  brandSlug: string;
  categorySlug: string;
  /** 0 = price intentionally left for the shop/admin to fill in. */
  price: number;
  oldPrice?: number;
  color: string;
  shape?: string;
  target: Product["target"];
  images: SeedImage[];
  description?: string;
  isNew?: boolean;
  featured?: boolean;
  available?: boolean;
  daysAgo?: number;
}): Product {
  const localFiles = LOCAL_CATALOGUE_IMAGES[p.id];
  const selectedImages: SeedImage[] = localFiles
    ? localFiles.map((file) => ({ url: `/images/catalogue-real/${p.id}/${file}` }))
    : p.images;
  if (selectedImages.length < 3) {
    throw new Error(`Le produit ${p.id} doit avoir au moins 3 images.`);
  }
  const discount = p.oldPrice && p.price > 0
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : null;
  const created = new Date();
  created.setDate(created.getDate() - (p.daysAgo ?? 30));
  return {
    id: p.id,
    name: p.name,
    slug: p.id,
    reference: `IR-${p.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
    description:
      p.description ??
      "Monture sélectionnée par InfraRed Optic-Store. Disponibilité, coloris et tailles à confirmer en boutique auprès de nos opticiens.",
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    discount,
    categorySlug: p.categorySlug,
    categoryName: categories.find((c) => c.slug === p.categorySlug)?.name ?? "",
    brandSlug: p.brandSlug,
    brandName: brands.find((b) => b.slug === p.brandSlug)?.name ?? "",
    color: p.color,
    shape: p.shape ?? "Rectangulaire",
    target: p.target,
    available: p.available ?? true,
    featured: p.featured ?? false,
    isNew: p.isNew ?? false,
    isPromotion: p.price > 0 && !!p.oldPrice,
    createdAt: created.toISOString(),
    images: selectedImages.map((img, i) => ({
      id: `${p.id}-img-${i + 1}`,
      url: img.url,
      alt: img.alt ?? `${p.name} — vue ${i + 1}`,
      sortOrder: i,
      isPlaceholder: false,
    })),
  };
}

export const products: Product[] = [
  makeProduct({
    id: "carrera-1023-s",
    name: "Carrera 1023/S WR7",
    brandSlug: "carrera",
    categorySlug: "solaires",
    price: 189,
    oldPrice: 239,
    color: "Noir et Écaille",
    shape: "Aviateur",
    target: "Mixte",
    featured: true,
    daysAgo: 5,
    isNew: true,
    images: [
      { url: "https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//c/a/carrera-167-s-24s-50ez-sunglasses_g_0071_1.jpg" },
      { url: "https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//c/a/carrera-167-s-24s-50ez-sunglasses_g_0069_1.jpg" },
      { url: "https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//c/a/carrera-167-s-24s-50ez-sunglasses_g_0072.jpg" },
    ],
  }),
  makeProduct({
    id: "rayban-aviator-classic",
    name: "Ray-Ban Aviator Classic RB3025 002/58",
    brandSlug: "ray-ban",
    categorySlug: "solaires",
    price: 169,
    color: "Noir et Vert",
    shape: "Aviateur",
    target: "Mixte",
    featured: true,
    daysAgo: 60,
    images: [
      { url: "/images/catalogue-real/rayban-aviator-classic/1.png" },
      { url: "/images/catalogue-real/rayban-aviator-classic/2.png" },
      { url: "/images/catalogue-real/rayban-aviator-classic/3.png" },
    ],
  }),
  makeProduct({
    id: "vogue-vo5411s",
    name: "Vogue Eyewear VO5411S",
    brandSlug: "vogue",
    categorySlug: "solaires",
    price: 129,
    oldPrice: 159,
    color: "Transparent et Vert",
    shape: "Carrée",
    target: "Femme",
    daysAgo: 10,
    images: [
      { url: "https://img.ebdcdn.com/product/frame/gray/luspl02683_0.jpg?im=Resize%2Cwidth%3D1280%2Cheight%3D640%2Caspect%3Dfill%3BUnsharpMask%2Csigma%3D1.0%2Cgain%3D1.0&q=85" },
      { url: "https://img.ebdcdn.com/product/frame/gray/luspl02683_2.jpg?im=Resize%2Cwidth%3D1280%2Cheight%3D640%2Caspect%3Dfill%3BUnsharpMask%2Csigma%3D1.0%2Cgain%3D1.0&q=85" },
      { url: "https://img.ebdcdn.com/product/frame/gray/luspl02683_1.jpg?im=Resize%2Cwidth%3D1280%2Cheight%3D640%2Caspect%3Dfill%3BUnsharpMask%2Csigma%3D1.0%2Cgain%3D1.0&q=85" },
    ],
  }),
  makeProduct({
    id: "polaroid-pld-6172",
    name: "Polaroid PLD 6172/S MR8/M9",
    brandSlug: "polaroid",
    categorySlug: "solaires",
    price: 99,
    color: "Bleu",
    shape: "Géométrique",
    target: "Mixte",
    daysAgo: 4,
    isNew: true,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//safilo/0716736697437.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto/safilo/0716736697437_2.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto/safilo/0716736697437_7.jpg" },
    ],
  }),
  makeProduct({
    id: "armani-ea1131",
    name: "Emporio Armani EA1131 3001",
    brandSlug: "emporio-armani",
    categorySlug: "optiques",
    price: 179,
    color: "Noir",
    shape: "Rectangulaire",
    target: "Homme",
    featured: true,
    daysAgo: 45,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0EA1131__3001_330Afw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0EA1131__3001_000Afw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0EA1131__3001_090Afw920fh575.png" },
    ],
  }),
  makeProduct({
    id: "rayban-wayfarer-opt",
    name: "Ray-Ban Wayfarer Optics RB5121 2000",
    brandSlug: "ray-ban",
    categorySlug: "optiques",
    price: 159,
    oldPrice: 189,
    color: "Noir",
    shape: "Carrée",
    target: "Mixte",
    daysAgo: 20,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0RX5121__2000_330Afw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0RX5121__2000_000Afw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0RX5121__2000_090Afw920fh575.png" },
    ],
  }),
  makeProduct({
    id: "vogue-vo5285",
    name: "Vogue Eyewear VO5285 2761",
    brandSlug: "vogue",
    categorySlug: "optiques",
    price: 109,
    color: "Transparent et Violet",
    shape: "Carrée",
    target: "Femme",
    daysAgo: 3,
    isNew: true,
    featured: true,
    images: [
      { url: "https://vogue-eyewear.com/cdn/shop/files/0VO5285__2761__TOP__shad__qt_1f4790e40adde85fcfff1ce50674fcffc51e1ce5ba56363a3db9c3f7e55ffea5.png?v=1787393288&width=1600" },
      { url: "https://vogue-eyewear.com/cdn/shop/files/0VO5285__2761__TOP__shad__al2_629ad3bc12b26a2054063a9cadfc7288674ee0539c33730acc397ce0923195c1.png?v=1787393289&width=1600" },
      { url: "https://vogue-eyewear.com/cdn/shop/files/0VO5285__2761__TOP__shad__cfr_2e4949a20ecc7cff10efc4daa269eba684e2998d19bf755a89961321cd0a521b.png?v=1787393292&width=1600" },
    ],
  }),
  makeProduct({
    id: "carrera-8865",
    name: "Carrera 8865 PJP",
    brandSlug: "carrera",
    categorySlug: "optiques",
    price: 149,
    color: "Bleu",
    shape: "Rectangulaire",
    target: "Homme",
    daysAgo: 90,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//safilo/0716736412405.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto/safilo/0716736412405_2.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto/safilo/0716736412405_7.jpg" },
    ],
  }),
  makeProduct({
    id: "polaroid-pld-4132",
    name: "Polaroid PLD 4132/S/X 807/M9",
    brandSlug: "polaroid",
    categorySlug: "solaires",
    price: 89,
    oldPrice: 119,
    color: "Noir",
    shape: "Rectangulaire",
    target: "Femme",
    daysAgo: 15,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//aerialvision/827886046706.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//aerialvision/827886046706_1.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//aerialvision/827886046706_2.jpg" },
    ],
  }),
  makeProduct({
    id: "armani-ea4184",
    name: "Emporio Armani EA4184 562487",
    brandSlug: "emporio-armani",
    categorySlug: "solaires",
    price: 199,
    color: "Rouge et Gris",
    shape: "Carrée",
    target: "Homme",
    daysAgo: 2,
    isNew: true,
    featured: true,
    images: [
      { url: "https://assets.kogan.com/images/smartbuyglasses/SBG-SG600851-49/1-dbe7e94a6c-600851_1689148632116.jpg?auto=webp&bg-color=fff&canvas=1200%2C800&dpr=1&enable=upscale&fit=bounds&height=800&quality=90&width=1200" },
      { url: "https://assets.kogan.com/images/smartbuyglasses/SBG-SG600851-49/2-fd55cce720-600851_side_1_1689148632117.jpg?auto=webp&bg-color=fff&canvas=1200%2C800&dpr=1&enable=upscale&fit=bounds&height=800&quality=90&width=1200" },
      { url: "https://assets.kogan.com/images/smartbuyglasses/SBG-SG600851-49/3-347ecdc8e0-600851_side_2_1689148632117.jpg?auto=webp&bg-color=fff&canvas=1200%2C800&dpr=1&enable=upscale&fit=bounds&height=800&quality=90&width=1200" },
    ],
  }),
  makeProduct({
    id: "rayban-junior-1",
    name: "Ray-Ban Kids RJ9069S 100/71",
    brandSlug: "ray-ban",
    categorySlug: "solaires",
    price: 79,
    color: "Noir et Vert",
    shape: "Carrée",
    target: "Enfant",
    daysAgo: 8,
    isNew: true,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0RJ9069S__100_71_330Afw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0RJ9069S__100_71_000Afw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/luximages/0RJ9069S__100_71_090Afw920fh575.png" },
    ],
  }),
  makeProduct({
    id: "vogue-vo4295",
    name: "Vogue Eyewear VO4295 5196S",
    brandSlug: "vogue",
    categorySlug: "optiques",
    price: 119,
    oldPrice: 149,
    color: "Noir et Rouge",
    shape: "Ronde",
    target: "Mixte",
    daysAgo: 25,
    images: [
      { url: "https://i.ebayimg.com/images/g/xHoAAOSwe-Nmh~Z5/s-l1600.webp" },
      { url: "https://i.ebayimg.com/images/g/goMAAOSwzBxmh~Z3/s-l1600.webp" },
      { url: "https://i.ebayimg.com/images/g/ve0AAOSwhA1mh~Z6/s-l1600.webp" },
    ],
  }),

  // Current/trending additions. Their local TND prices are deliberately left
  // at 0 so the storefront says “Prix en boutique” until InfraRed sets them.
  makeProduct({
    id: "miu-miu-mu-b09s-14l20v",
    name: "Miu Miu MU B09S 14L20V",
    brandSlug: "miu-miu",
    categorySlug: "solaires",
    price: 0,
    color: "Écaille et Marron",
    shape: "Ovale",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    featured: true,
    description: "Lunettes de soleil Miu Miu MU B09S 14L20V, monture ovale en acétate havane miel et verres bronze. Prix TND à renseigner dans le dashboard avant affichage.",
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Miu-miu-Sunglasses-MU-B09S-14L20V-Afw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Miu-Miu-Sunglasses-MU-B09S-14L20V-Bfw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Miu-Miu-Sunglasses-MU-B09S-14L20V-Cfw920fh575.png" },
    ],
  }),
  makeProduct({
    id: "prada-pr-c12v-20d1o1",
    name: "Prada PR C12V 20D1O1",
    brandSlug: "prada",
    categorySlug: "optiques",
    price: 0,
    color: "Écaille",
    shape: "Rectangulaire",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    featured: true,
    description: "Monture optique Prada PR C12V 20D1O1 en acétate écaille Juniper. Prix TND à renseigner dans le dashboard avant affichage.",
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0PR%20C12V%2020D1O1.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0PR%20C12V%2020D1O1_360_1.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0PR%20C12V%2020D1O1_360_2.png" },
    ],
  }),
  makeProduct({
    id: "gucci-gg1853s-001",
    name: "Gucci GG1853S 001",
    brandSlug: "gucci",
    categorySlug: "solaires",
    price: 0,
    color: "Doré et Gris",
    shape: "Géométrique",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    featured: true,
    description: "Lunettes de soleil Gucci GG1853S 001, monture géométrique métal doré et verres gris. Prix TND à renseigner dans le dashboard avant affichage.",
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/GG1853S-001-cat-xxlfw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/GG1853S-001-front-xxlfw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/GG1853S-001-zoom-xxlfw920fh575.jpg" },
    ],
  }),
  makeProduct({
    id: "saint-laurent-sl-557-shade-001",
    name: "Saint Laurent SL 557 SHADE 001",
    brandSlug: "saint-laurent",
    categorySlug: "solaires",
    price: 0,
    color: "Noir",
    shape: "Ronde",
    target: "Mixte",
    daysAgo: 1,
    isNew: true,
    featured: true,
    description: "Lunettes de soleil Saint Laurent SL 557 SHADE 001, silhouette noire au style contemporain. Prix TND à renseigner dans le dashboard avant affichage.",
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Saint-Laurent-Sunglasses-SL557SHADE-001-53fw920fh575.png" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Saint-Laurent-Sunglasses-SL-557-SHADE-001-bfw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Saint-Laurent-Sunglasses-SL-557-SHADE-001-cfw920fh575.jpg" },
    ],
  }),
  makeProduct({
    id: "oliver-peoples-etlin-ov1355t-5036",
    name: "Oliver Peoples Etlin OV1355T 5036",
    brandSlug: "oliver-peoples",
    categorySlug: "optiques",
    price: 0,
    color: "Argent et Marron",
    shape: "Ronde",
    target: "Mixte",
    daysAgo: 1,
    isNew: true,
    featured: true,
    description: "Monture optique Oliver Peoples Etlin OV1355T 5036 en titane argenté avec détails ambre. Prix TND à renseigner dans le dashboard avant affichage.",
    images: [
      { url: "https://assets2.oliverpeoples.com/cdn-record-files-pi/4679c97f-4df7-4efd-af68-b21300fac3c9/15407eed-2bfc-4ce9-aa06-b21300fac74f/0OV1355T__5036__P21__shad__qt.png" },
      { url: "https://assets2.oliverpeoples.com/cdn-record-files-pi/4679c97f-4df7-4efd-af68-b21300fac3c9/acf4635f-70dd-4641-b8e8-b21300facb19/0OV1355T__5036__P21__shad__fr.png" },
      { url: "https://assets2.oliverpeoples.com/cdn-record-files-pi/4679c97f-4df7-4efd-af68-b21300fac3c9/d042e176-a8d1-4a72-ab56-b21300fad2ba/0OV1355T__5036__P21__shad__al2.png" },
    ],
  }),

  // Catalogue HD — minimum 3 models per brand. Prices are intentionally 0
  // for newly-added models until InfraRed validates the retail price in TND.
  makeProduct({
    id: "carrera-1014-s-003",
    name: "Carrera 1014/S 003",
    brandSlug: "carrera",
    categorySlug: "solaires",
    price: 0,
    color: "Noir",
    shape: "Carrée",
    target: "Homme",
    daysAgo: 2,
    isNew: true,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Carrera-Sunglasses-1014-s-003-64fw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Carrera-Sunglasses-1014-s-003-64-sjpgfw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/716736088907-carrera-sunglasses-1014-S-model_P13fw920fh575.jpg" },
    ],
  }),
  makeProduct({
    id: "polaroid-pld-4177-s-x-807-wj",
    name: "Polaroid PLD 4177/S/X 807 WJ",
    brandSlug: "polaroid",
    categorySlug: "solaires",
    price: 0,
    color: "Noir",
    shape: "Carrée",
    target: "Femme",
    daysAgo: 2,
    isNew: true,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Polaroid-Sunglasses-PLD-4177-S-X-807WJ-P00fw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Polaroid-Sunglasses-PLD-4177-S-X-807WJ-P02fw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Polaroid-Sunglasses-PLD-4177-S-X-807WJ-P01fw920fh575.jpg" },
    ],
  }),
  makeProduct({
    id: "emporio-armani-ea3246-5001",
    name: "Emporio Armani EA3246 5001",
    brandSlug: "emporio-armani",
    categorySlug: "optiques",
    price: 0,
    color: "Noir",
    shape: "Carrée",
    target: "Mixte",
    daysAgo: 2,
    isNew: true,
    images: [
      { url: "https://grandvision-media.imgix.net/asset/fd80fbf2-fab0-4aa9-abae-01fd79405b5c/original_png/0EA3246__5001__P21__shad__fr.png" },
      { url: "https://grandvision-media.imgix.net/asset/82953c67-555c-4d03-89d8-129e746af3cd/original_png/0EA3246__5001__P21__shad__cfr.png" },
      { url: "https://grandvision-media.imgix.net/asset/a1ea3cf9-7561-4da7-bb25-bf0e2cd7fb03/original_png/0EA3246__5001__P21__shad__qt.png" },
    ],
  }),
  makeProduct({
    id: "miu-miu-mu-06vv-1ab1o1",
    name: "Miu Miu MU 06VV 1AB1O1",
    brandSlug: "miu-miu",
    categorySlug: "optiques",
    price: 0,
    color: "Noir",
    shape: "Carrée",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    featured: true,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0MU%2006VV%201AB1O1.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0MU%2006VV%201AB1O1_360_1.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0MU%2006VV%201AB1O1_360_11.png" },
    ],
  }),
  makeProduct({
    id: "miu-miu-mu-b11su-16k80q",
    name: "Miu Miu MU B11SU 16K80Q",
    brandSlug: "miu-miu",
    categorySlug: "solaires",
    price: 0,
    color: "Noir",
    shape: "Cat-eye",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    featured: true,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0MU%20B11SU%2016K80Q.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0MU%20B11SU%2016K80Q_360_1.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0MU%20B11SU%2016K80Q_360_2.png" },
    ],
  }),
  makeProduct({
    id: "prada-pr-02ys-1ab0a7",
    name: "Prada PR 02YS 1AB0A7",
    brandSlug: "prada",
    categorySlug: "solaires",
    price: 0,
    color: "Noir",
    shape: "Carrée",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0PR%2002YS%201AB0A7.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0PR%2002YS%201AB0A7_360_1.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0PR%2002YS%201AB0A7_360_2.png" },
    ],
  }),
  makeProduct({
    id: "prada-pr-02zv-1ab1o1",
    name: "Prada PR 02ZV 1AB1O1",
    brandSlug: "prada",
    categorySlug: "optiques",
    price: 0,
    color: "Noir",
    shape: "Papillon",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    images: [
      { url: "https://grandvision-media.imgix.net/asset/fe373fba-1453-47da-baf2-32e03673059b/original_png/0PR_02ZV__1AB1O1__P21__shad__fr.png" },
      { url: "https://grandvision-media.imgix.net/asset/6af39713-520e-4628-a35a-9b68af544475/original_png/0PR_02ZV__1AB1O1__P21__shad__cfr.png" },
      { url: "https://grandvision-media.imgix.net/asset/57621476-2a3f-4586-b252-beca305ced4c/original_png/0PR_02ZV__1AB1O1__P21__shad__qt.png" },
    ],
  }),
  makeProduct({
    id: "gucci-gg1680s-004",
    name: "Gucci GG1680S 004",
    brandSlug: "gucci",
    categorySlug: "solaires",
    price: 0,
    color: "Écaille et Marron",
    shape: "Cat-eye",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Gucci-Sunglasses-GG1680S-004fw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Gucci-Sunglasses-GG1680S-004-bfw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Gucci-Sunglasses-GG1680S-004-cfw920fh575.jpg" },
    ],
  }),
  makeProduct({
    id: "gucci-gg1604s-003",
    name: "Gucci GG1604S 003",
    brandSlug: "gucci",
    categorySlug: "solaires",
    price: 0,
    color: "Doré et Orange",
    shape: "Géométrique",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    featured: true,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Gucci-Sunglasses-GG1604S-003fw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Gucci-Sunglasses-GG1604S-003-bfw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Gucci-Sunglasses-GG1604S-003-cfw920fh575.jpg" },
    ],
  }),
  makeProduct({
    id: "saint-laurent-sl-596-dune-003",
    name: "Saint Laurent SL 596 DUNE 003",
    brandSlug: "saint-laurent",
    categorySlug: "solaires",
    price: 0,
    color: "Écaille et Marron",
    shape: "Rectangulaire",
    target: "Mixte",
    daysAgo: 1,
    isNew: true,
    images: [
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Saint-Laurent-Sunglasses-SL-596-DUNE-003fw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Saint-Laurent-Sunglasses-SL-596-DUNE-003-bfw920fh575.jpg" },
      { url: "https://www.shadestation.co.uk/media/thumbs/920x575/media/product_images/Saint-Laurent-Sunglasses-SL-596-DUNE-003-cfw920fh575.jpg" },
    ],
  }),
  makeProduct({
    id: "saint-laurent-sl-276-mica-025",
    name: "Saint Laurent SL 276 MICA 025",
    brandSlug: "saint-laurent",
    categorySlug: "solaires",
    price: 0,
    color: "Noir et Gris",
    shape: "Cat-eye",
    target: "Femme",
    daysAgo: 1,
    isNew: true,
    featured: true,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//kering/889652361505.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//kering/889652361505_2.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//kering/889652361505_3.png" },
    ],
  }),
  makeProduct({
    id: "oliver-peoples-fairmont-ov5219-1465",
    name: "Oliver Peoples Fairmont OV5219 1465",
    brandSlug: "oliver-peoples",
    categorySlug: "optiques",
    price: 0,
    color: "Noir",
    shape: "Ronde",
    target: "Homme",
    daysAgo: 1,
    isNew: true,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0OV5219%201465.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0OV5219%201465_360_1.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0OV5219%201465_360_2.png" },
    ],
  }),
  makeProduct({
    id: "oliver-peoples-n01-ov5528u-1731",
    name: "Oliver Peoples N.01 OV5528U 1731",
    brandSlug: "oliver-peoples",
    categorySlug: "optiques",
    price: 0,
    color: "Noir",
    shape: "Ronde",
    target: "Mixte",
    daysAgo: 1,
    isNew: true,
    featured: true,
    images: [
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0OV5528U%201731.jpg" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0OV5528U%201731_360_1.png" },
      { url: "https://d237xocrarx9cy.cloudfront.net/image/foto//luxottica/0OV5528U%201731_360_2.png" },
    ],
  }),
];

// ---------------------------------------------------------------------------
// NOTE — this file is now seed-only demo content (see prisma/seed.ts).
// Every live page reads products/brands/categories/stores/settings from
// PostgreSQL via Prisma (see src/lib/catalogue-db.ts and src/lib/site-data.ts)
// — nothing here is imported by any public or admin page anymore. Keeping
// query helpers here would just be a second, unused source of truth, so
// they were removed; only the seed arrays remain.
// ---------------------------------------------------------------------------

export type Store = {
  id: string;
  name: string;
  address: string;
  mobile: string;
  landline: string;
  mapsUrl: string;
  mapsEmbedQuery: string;
  /** Real boutique photo once available — null renders PlaceholderMedia. */
  photo: string | null;
};

export const stores: Store[] = [
  {
    id: "kram",
    name: "Le Kram",
    address: "175 Avenue Habib Bourguiba, 2015 Le Kram",
    mobile: "98 34 93 99",
    landline: "71 27 56 08",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=175+Avenue+Habib+Bourguiba+2015+Le+Kram+Tunisie",
    mapsEmbedQuery: "175 Avenue Habib Bourguiba, 2015 Le Kram, Tunisie",
    photo: "/images/stores/kram.svg",
  },
  {
    id: "tunisia-mall",
    name: "Tunisia Mall",
    address: "Tunisia Mall, Lac 2 (3ème étage)",
    mobile: "97 85 78 37",
    landline: "71 66 94 14",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tunisia+Mall+Lac+2+Tunis",
    mapsEmbedQuery: "Tunisia Mall, Lac 2, Tunis",
    photo: "/images/stores/tunisia-mall.svg",
  },
  {
    id: "el-aouina",
    name: "El Aouina",
    address: "Avenue Khaled Ibn Walid, 2020 El Aouina",
    mobile: "98 72 90 65",
    landline: "71 72 46 37",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Avenue+Khaled+Ibn+Walid+2020+El+Aouina+Tunisie",
    mapsEmbedQuery: "Avenue Khaled Ibn Walid, 2020 El Aouina, Tunisie",
    photo: "/images/stores/el-aouina.svg",
  },
];

/** Seed-only defaults for the first StoreSettings row (see prisma/seed.ts). */
export const seedShopDefaults = {
  address: stores[0].address,
  phone: stores[0].mobile,
  whatsapp: "21698349399",
  facebook: "https://www.facebook.com/Infraredopticstore",
  instagram: "https://www.instagram.com/infraredopticstore/",
  mapsUrl: stores[0].mapsUrl,
  hours: [
    { day: "Lundi – Samedi", hours: "9h30 – 19h30" },
    { day: "Dimanche", hours: "Fermé" },
  ],
};
