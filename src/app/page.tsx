import { Fragment, type ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import BrandMarquee from "@/components/BrandMarquee";
import HomeHero from "@/components/HomeHero";
import NewArrivalsTabs from "@/components/NewArrivalsTabs";
import ProductCard from "@/components/ProductCard";
import { inspirationSvgUrl } from "@/lib/inspiration";
import { getDbProducts } from "@/lib/catalogue-db";
import { getHomeContent, type HomeSectionId } from "@/lib/home-content";
import { getDbStores, getSiteSettings } from "@/lib/site-data";
import { homeSeoGraph } from "@/lib/local-seo";
import { safeJsonLd } from "@/lib/safe-json-ld";
import { buildWhatsAppLink, generateGeneralWhatsAppMessage } from "@/lib/whatsapp";
import type { CatalogProduct } from "@/types";

export const revalidate = 0;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  title: { absolute: "Opticien en Tunisie | Le Kram, Tunisia Mall et El Aouina" },
  description: "InfraRed Optic-Store : opticien au Kram, à Tunisia Mall et à El Aouina. Lunettes optiques, lunettes solaires et grandes marques.",
  alternates: { canonical: "/" },
};

function uniqueProducts(products: CatalogProduct[]) {
  return products.filter((product, index) => products.findIndex((candidate) => candidate.id === product.id) === index);
}

function pickProducts(slugs: string[], pool: CatalogProduct[], fallback: CatalogProduct[], count: number) {
  const configured = slugs
    .map((slug) => pool.find((product) => product.slug === slug))
    .filter((product): product is CatalogProduct => Boolean(product));
  return uniqueProducts([...configured, ...fallback]).slice(0, count);
}

export default async function HomePage() {
  const [settings, home, stores] = await Promise.all([
    getSiteSettings(),
    getHomeContent(),
    getDbStores(),
  ]);
  const [featured, newest, pool] = await Promise.all([
    getDbProducts({ featured: true, available: true }, [{ createdAt: "desc" }, { id: "asc" }], { includePrices: settings.showPrices, take: 12 }),
    getDbProducts({ isNew: true, available: true }, [{ createdAt: "desc" }, { id: "asc" }], { includePrices: settings.showPrices, take: 24 }),
    getDbProducts({ available: true }, [{ createdAt: "desc" }, { id: "asc" }], { includePrices: settings.showPrices, take: 100 }),
  ]);

  const arrivalProducts = pickProducts(home.newProductSlugs, pool, newest, 12);
  const solar = arrivalProducts.filter((product) => product.categorySlug === "solaires");
  const optical = arrivalProducts.filter((product) => product.categorySlug === "optiques");
  const selectionProducts = pickProducts(home.selectionProductSlugs, pool, featured, 4);
  const solarFallback = pool.find((product) => product.categorySlug === "solaires")?.images[0]?.url ?? "";
  const opticalFallback = pool.find((product) => product.categorySlug === "optiques")?.images[0]?.url ?? "";
  const solarImage = home.solarImage || solarFallback;
  const opticalImage = home.opticalImage || opticalFallback;
  const trendFallbacks = uniqueProducts([...newest, ...featured, ...pool]).map((product) => product.images[0]?.url).filter((url): url is string => Boolean(url));
  const trendProducts = Array.from({ length: 3 }, (_, index) => pool.find((product) => product.slug === home.trendProductSlugs[index]));
  const trendImage1 = home.trendImage1 || trendProducts[0]?.images[0]?.url || trendFallbacks[0] || "";
  const trendImage2 = home.trendImage2 || trendProducts[1]?.images[0]?.url || trendFallbacks[1] || trendImage1;
  const trendVideo = home.trendVideo || (settings.heroMediaType === "video" ? settings.heroVideoUrl || "" : "");
  const trendImage3 = trendProducts[2]?.images[0]?.url || trendFallbacks[2] || trendImage2;
  const trendLinks = Array.from({ length: 3 }, (_, index) => home.trendLinks[index] || (trendProducts[index] ? `/produit/${trendProducts[index].slug}` : home.trendLink || "/nouveautes"));
  const homeWaLink = buildWhatsAppLink(settings.whatsapp, generateGeneralWhatsAppMessage());
  const inspirationItems = home.inspirationItems.filter((item) => item.visible);

  const sections: Record<HomeSectionId, ReactNode> = {
    intro: (
      <section className="vf-container vf-section text-center">
        <p className="text-[10px] uppercase tracking-[0.14em] text-black/60">{home.introEyebrow}</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-xl font-semibold leading-tight sm:text-2xl">{home.introTitle}</h2>
      </section>
    ),
    brands: (
      <section className="border-y border-black/10 py-10 sm:py-14">
        <div className="vf-container mb-7 flex items-end justify-between gap-5">
          <h2 className="vf-rule-title">{home.brandsTitle}</h2>
          <Link href="/marques" className="text-xs uppercase tracking-[0.14em] text-black/55 hover:text-red">{home.brandsLinkLabel}</Link>
        </div>
        <BrandMarquee speedSeconds={home.brandsSpeed} />
      </section>
    ),
    categories: (
      <section className="vf-container vf-section">
        <div className="grid gap-2 md:grid-cols-2">
          {[
            { slug: "solaires", title: home.solarTitle, image: solarImage },
            { slug: "optiques", title: home.opticalTitle, image: opticalImage },
          ].map((category) => (
            <Link key={category.slug} href={`/catalogue?category=${category.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-[#f1f1f1]">
              {category.image && <Image src={category.image} alt={category.title} fill quality={100} sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-[7%] transition-transform duration-700 group-hover:scale-105" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent p-7 pt-28 text-white sm:p-10 sm:pt-36">
                <p className="text-2xl font-medium sm:text-3xl">{category.title}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em]">{home.categoryCta} <ArrowRight size={14} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    ),
    new: solar.length || optical.length ? (
      <section className="border-t border-black/10 bg-white">
        <div className="vf-container vf-section">
          <div className="mb-9 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">{home.newEyebrow}</p>
            <h2 className="vf-rule-title mt-3">{home.newTitle}</h2>
          </div>
          <NewArrivalsTabs solar={solar} optical={optical} />
          <div className="mt-9 text-center"><Link href="/nouveautes" className="inline-flex border border-black px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black hover:text-white">Voir toutes les nouveautés</Link></div>
        </div>
      </section>
    ) : null,
    trends: trendImage1 || trendImage2 || trendVideo ? (
      <section className="border-t border-black/10 bg-white">
        <div className="vf-container vf-section">
          <div className="mb-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">{home.trendsEyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">{home.trendsTitle}</h2>
          </div>
          <div className="mx-auto grid max-w-[1100px] gap-1 md:grid-cols-2">
            <span className="grid min-h-[520px] grid-rows-2 gap-1 sm:min-h-[680px]">
              {[trendImage1, trendImage2].map((src, index) => <Link key={index} href={trendLinks[index]} className="group relative block overflow-hidden bg-[#eceeed]">{src && <Image src={src} alt={trendProducts[index] ? `${trendProducts[index]?.brandName} ${trendProducts[index]?.name}` : `${home.trendsTitle} ${index + 1}`} fill quality={100} sizes="(max-width: 768px) 100vw, 550px" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />}<span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black opacity-0 transition-opacity group-hover:opacity-100">Découvrir →</span></Link>)}
            </span>
            <Link href={trendLinks[2]} className="group relative block min-h-[520px] overflow-hidden bg-[#e9e9e9] sm:min-h-[680px]">
              {trendVideo ? <video src={trendVideo} autoPlay muted loop playsInline className="h-full w-full object-cover" /> : trendImage3 ? <Image src={trendImage3} alt={trendProducts[2] ? `${trendProducts[2]?.brandName} ${trendProducts[2]?.name}` : home.trendsTitle} fill quality={100} sizes="(max-width: 768px) 100vw, 550px" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" /> : null}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-7 pb-7 pt-28 text-white">
                <span className="flex items-center justify-between gap-5 text-xs font-semibold uppercase tracking-[0.15em]"><span>{home.trendsTitle}</span><span>Découvrir →</span></span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    ) : null,
    selection: selectionProducts.length ? (
      <section className="border-t border-black/10 bg-white">
        <div className="vf-container vf-section">
          <div className="mb-9 flex items-end justify-between gap-5"><h2 className="vf-rule-title">{home.selectionTitle}</h2><Link href="/catalogue" className="text-xs uppercase tracking-[0.14em] text-black/55 hover:text-red">{home.selectionLinkLabel}</Link></div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-6 lg:grid-cols-4">{selectionProducts.map((product) => <ProductCard key={product.id} product={product} home />)}</div>
        </div>
      </section>
    ) : null,
    inspiration: home.inspirationEnabled ? (
      <section className="bg-white" aria-labelledby="inspiration-title">
        <div className="mx-auto max-w-[1920px] px-5 pb-10 pt-10 sm:px-[4%]">
          <h2 id="inspiration-title" className="text-xl font-semibold leading-7">{home.inspirationTitle}</h2>
          <p className="mt-1 text-sm leading-5 text-black">{home.inspirationText}</p>
          {inspirationItems.length > 0 && (
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:flex lg:justify-around lg:gap-x-0">
              {inspirationItems.map((item) => (
                <div key={item.id} className="flex flex-col items-center text-center lg:min-w-0 lg:flex-1">
                  {/* SVG is isolated in an image, including custom dashboard SVGs. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={inspirationSvgUrl(item.svg)} alt="" width={50} height={50} className={item.id === "service-1" ? "my-[10px] h-[30px] w-[30px] object-contain" : "h-[50px] w-[50px] object-contain"} />
                  <p className="mt-1 whitespace-pre-line text-sm font-normal leading-5 text-black">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    ) : null,
    contact: (
      <section className="bg-black text-white">
        <div className="vf-container flex flex-col justify-between gap-8 py-14 md:flex-row md:items-center">
          <div><p className="text-xs uppercase tracking-[0.18em] text-white/50">{home.contactEyebrow}</p><h2 className="mt-3 text-2xl font-medium sm:text-3xl">{home.contactTitle}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{home.contactText}</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/contact" className="inline-flex bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black hover:bg-red hover:text-white">Nous contacter</Link>{homeWaLink && <a href={homeWaLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/35 px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] hover:border-white"><MessageCircle size={15} /> WhatsApp</a>}</div>
        </div>
      </section>
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(homeSeoGraph(stores, settings, SITE_URL)) }} />
      <HomeHero title={settings.heroTitle || "Les collections qui signent votre regard"} subtitle={settings.heroSubtitle || "Lunettes solaires et optiques de grandes maisons, sélectionnées par nos opticiens à Tunis."} cta={settings.heroCtaLabel || "Découvrir la collection"} imageUrl={settings.heroImageUrl} videoUrl={settings.heroVideoUrl} mediaType={settings.heroMediaType} scale={settings.heroMediaScale} x={settings.heroMediaX} y={settings.heroMediaY} />
      {home.sectionOrder.map((id) => <Fragment key={id}>{sections[id]}</Fragment>)}
    </>
  );
}
