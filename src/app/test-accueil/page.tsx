import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { getDbBrands, getDbCategories, getDbProducts } from "@/lib/catalogue-db";
import { formatDT } from "@/lib/currency";
import { getDbStores, getSiteSettings } from "@/lib/site-data";
import type { CatalogProduct } from "@/types";

export const dynamic = "force-dynamic";

const SHAPE_LINKS = ["Ronde", "Ovale", "Carrée", "Rectangulaire", "Aviateur", "Papillon", "Géométrique", "Wayfarer"];

function ProductImage({ product, className = "" }: { product: CatalogProduct; className?: string }) {
  const image = product.images[0];
  if (!image) return <div className={`bg-mist ${className}`} />;
  return (
    // Product media can come from external catalogues, so this preview avoids a hostname allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image.url} alt={image.alt} className={`object-contain ${className}`} />
  );
}

function CatalogueTile({ product, showPrices }: { product: CatalogProduct; showPrices: boolean }) {
  const price = "price" in product ? product.price : null;
  return (
    <Link href={`/produit/${product.slug}`} className="group block min-w-0 border-l border-line px-4 first:border-l-0 sm:px-5">
      <div className="relative aspect-[5/4] overflow-hidden bg-[#eff3f0]">
        <ProductImage product={product} className="h-full w-full p-7 transition-transform duration-500 group-hover:scale-105" />
        {product.isNew && <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Nouveau</span>}
      </div>
      <div className="py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone">{product.brandName}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h3 className="font-display text-base leading-snug text-ink">{product.name}</h3>
          {showPrices && price != null && <span className="shrink-0 text-sm font-semibold text-ink">{formatDT(price)}</span>}
        </div>
        <p className="mt-2 text-xs text-stone">{product.shape || "Monture"} · {product.target}</p>
      </div>
    </Link>
  );
}

export default async function TestHomePage() {
  const settings = await getSiteSettings();
  const [products, categories, brands, stores] = await Promise.all([
    getDbProducts({ available: true }, [{ featured: "desc" }, { isNew: "desc" }, { createdAt: "desc" }], { includePrices: settings.showPrices, take: 12 }),
    getDbCategories(),
    getDbBrands(),
    getDbStores({ fallbackHours: settings.hours }),
  ]);
  const heroProduct = products[0];
  const latestProducts = products.slice(0, 4);
  const curatedProducts = products.slice(4, 8);
  const moreProducts = products.slice(8, 12);

  return (
    <div className="bg-white text-ink">
      <div className="border-b border-line bg-[#f4f6f3]">
        <nav aria-label="Navigation de prévisualisation" className="mx-auto flex max-w-7xl items-center gap-x-6 overflow-x-auto px-5 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-ink/75 sm:px-8">
          <Link href="/catalogue?category=solaires" className="shrink-0 hover:text-red">Lunettes solaires</Link>
          <Link href="/catalogue?category=optiques" className="shrink-0 hover:text-red">Lunettes optiques</Link>
          <Link href="/catalogue?target=Femme" className="shrink-0 hover:text-red">Femme</Link>
          <Link href="/catalogue?target=Homme" className="shrink-0 hover:text-red">Homme</Link>
          <Link href="/nouveautes" className="shrink-0 text-red">Nouveautés</Link>
          <Link href="/marques" className="shrink-0 hover:text-red">Marques</Link>
        </nav>
      </div>

      <section className="relative min-h-[620px] overflow-hidden border-b border-line bg-ink sm:min-h-[680px]">
        {settings.heroMediaType === "video" && settings.heroVideoUrl ? (
          <video src={settings.heroVideoUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
        ) : <Image src="/images/campaigns/homepage-preview-editorial.png" alt="Collection de lunettes solaires InfraRed" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-y-0 left-0 w-full bg-white/92 lg:w-[49%]" />
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-between px-5 py-10 sm:min-h-[680px] sm:px-8 lg:px-12 lg:py-14">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red">InfraRed Optic-Store, votre opticien en ligne</p>
            <h1 className="font-display mt-5 text-5xl leading-[1.02] sm:text-6xl">Les plus belles collections de lunettes</h1>
            <p className="mt-6 text-base leading-7 text-stone">Découvrez une sélection de montures solaires et optiques, choisies avec exigence par nos opticiens.</p>
          </div>
          <div className="flex max-w-xl flex-wrap gap-3">
            <Link href="/catalogue" className="inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red">Découvrir la collection <ArrowRight size={16} /></Link>
            <Link href="/boutique" className="inline-flex items-center gap-2 border border-ink bg-white/80 px-5 py-3 text-sm font-semibold transition-colors hover:border-red hover:text-red"><MapPin size={16} /> Nos boutiques</Link>
          </div>
          {heroProduct && <Link href={`/produit/${heroProduct.slug}`} className="w-fit border-l-2 border-red bg-white/90 px-4 py-3 backdrop-blur"><p className="text-xs text-stone">Pièce du moment · {heroProduct.brandName}</p><p className="font-display text-lg">{heroProduct.name}</p></Link>}
        </div>
      </section>

      {brands.length > 0 && <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:gap-10">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-stone">Nos maisons</p>
          <div className="grid flex-1 grid-cols-3 border-l border-t border-line sm:grid-cols-5 lg:grid-cols-8">
            {brands.slice(0, 8).map((brand) => <Link key={brand.id} href={`/catalogue?brand=${brand.slug}`} className="group flex h-16 items-center justify-center border-b border-r border-line bg-white p-3 transition-colors hover:bg-[#f1f4f1]">
              {brand.logo ? (
                // Brand URLs are managed in the dashboard and may be hosted externally.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brand.name} className="max-h-7 max-w-full object-contain grayscale transition group-hover:grayscale-0" />
              ) : <span className="text-center text-xs font-semibold text-ink">{brand.name}</span>}
            </Link>)}
          </div>
        </div>
      </section>}

      <section className="border-b border-line bg-[#f4f6f3]">
        <div className="mx-auto grid max-w-7xl divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-5 sm:px-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-red">Conseil d&apos;opticien</p><p className="mt-1 text-sm text-stone">Une sélection pensée pour votre visage et votre style.</p></div>
          <div className="px-5 py-5 sm:px-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-red">Grandes marques</p><p className="mt-1 text-sm text-stone">Des maisons choisies avec exigence par InfraRed.</p></div>
          <div className="px-5 py-5 sm:px-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-red">Nos boutiques à Tunis</p><p className="mt-1 text-sm text-stone">Retrouvez-nous en boutique pour vos réglages.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-b border-line">
        <div className="flex items-end justify-between gap-4 px-5 py-8 sm:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red">Explorer</p><h2 className="font-display mt-2 text-3xl">Choisir par univers</h2></div>
          <Link href="/catalogue" className="hidden text-sm font-semibold text-red sm:inline-flex sm:items-center">Toutes les lunettes <ArrowRight size={15} className="ml-1" /></Link>
        </div>
        <div className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
          {categories.slice(0, 4).map((category, index) => {
            const product = products.find((item) => item.categorySlug === category.slug) ?? products[index];
            return (
              <Link key={category.id} href={`/catalogue?category=${category.slug}`} className="group relative min-h-64 overflow-hidden border-b border-r border-line bg-[#f7f7f5] last:border-r-0 lg:min-h-80 lg:border-b-0">
                {product && <ProductImage product={product} className="absolute inset-0 h-full w-full p-8 transition-transform duration-500 group-hover:scale-105" />}
                <div className="absolute inset-x-0 bottom-0 border-t border-ink/10 bg-white/90 p-4 backdrop-blur"><p className="text-xs text-stone">Collection {String(index + 1).padStart(2, "0")}</p><p className="font-display mt-1 text-xl">{category.name}</p></div>
              </Link>
            );
          })}
        </div>
      </section>

      {latestProducts.length > 0 && <section className="border-b border-line bg-[#fbfbfa]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red">Nouveautés</p><h2 className="font-display mt-2 text-3xl">Les arrivages du moment</h2></div><Link href="/nouveautes" className="text-sm font-semibold text-red">Tout voir</Link></div>
          <div className="mt-5 flex items-center gap-4 border-t border-line pt-4 text-sm font-semibold">
            <Link href="/catalogue?category=solaires" className="text-red">Solaires</Link>
            <Link href="/catalogue?category=optiques" className="text-ink hover:text-red">Optiques</Link>
            <Link href="/nouveautes" className="text-red">Tout voir</Link>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-2 border-t border-line lg:grid-cols-4">
          {latestProducts.map((product) => <CatalogueTile key={product.id} product={product} showPrices={settings.showPrices} />)}
        </div>
      </section>}

      {curatedProducts.length > 0 && <section className="mx-auto max-w-7xl border-b border-line">
        <div className="grid lg:grid-cols-[.72fr_1.28fr]">
          <div className="flex min-h-72 flex-col justify-between border-b border-line bg-red px-5 py-10 text-white sm:px-8 lg:min-h-full lg:border-b-0 lg:border-r lg:border-white/25 lg:px-12 lg:py-12">
            <div><Sparkles size={22} /><p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">La sélection InfraRed</p><h2 className="font-display mt-3 text-4xl leading-tight">Des montures qui ont du caractère.</h2></div>
            <Link href="/catalogue" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold">Voir la sélection <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4">{curatedProducts.map((product) => <CatalogueTile key={product.id} product={product} showPrices={settings.showPrices} />)}</div>
        </div>
      </section>}

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red">Trouver la bonne ligne</p><h2 className="font-display mt-2 text-3xl">Choisir par forme</h2></div><Link href="/catalogue" className="text-sm font-semibold text-red">Voir toutes les formes</Link></div>
          <div className="mt-7 grid grid-cols-2 border-l border-t border-line sm:grid-cols-4 lg:grid-cols-8">
            {SHAPE_LINKS.map((shape) => <Link key={shape} href={`/catalogue?forme=${encodeURIComponent(shape)}`} className="border-b border-r border-line px-3 py-4 text-center text-sm font-medium transition-colors hover:bg-red hover:text-white">{shape}</Link>)}
          </div>
        </div>
      </section>

      {moreProducts.length > 0 && <section className="border-b border-line bg-[#fbfbfa]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red">À découvrir</p><h2 className="font-display mt-2 text-3xl">Encore plus de modèles</h2></div><Link href="/catalogue" className="text-sm font-semibold text-red">Tout le catalogue</Link></div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-2 border-t border-line lg:grid-cols-4">
          {moreProducts.map((product) => <CatalogueTile key={product.id} product={product} showPrices={settings.showPrices} />)}
        </div>
      </section>}

      {stores.length > 0 && <section className="border-b border-line bg-[#f4f6f3]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red">L&apos;expérience InfraRed</p><h2 className="font-display mt-2 text-3xl">Venez nous rencontrer</h2></div><Link href="/boutique" className="text-sm font-semibold text-red">Voir toutes les boutiques</Link></div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.slice(0, 3).map((store) => <Link key={store.id} href={`/boutique/${store.slug}`} className="group border border-line bg-white transition-colors hover:border-red">
              <div className="relative aspect-[16/8] overflow-hidden bg-mist">{store.photo && (
                // Store photos may be managed as local or external assets.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.photo} alt={store.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}</div>
              <div className="flex items-start justify-between gap-3 p-4"><div><p className="font-display text-xl">{store.name}</p><p className="mt-1 text-sm text-stone">{store.address}</p></div><ArrowRight size={17} className="mt-1 shrink-0 text-red" /></div>
            </Link>)}
          </div>
        </div>
      </section>}
    </div>
  );
}
