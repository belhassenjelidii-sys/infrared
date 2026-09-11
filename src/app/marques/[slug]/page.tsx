import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getBrandEditorial } from "@/lib/brand-editorials";
import { getDbBrands, getDbProducts } from "@/lib/catalogue-db";
import { getSiteSettings } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ genre?: string }> }): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const brand = (await getDbBrands()).find((candidate) => candidate.slug === slug);
  if (!brand) return {};
  const genre = query.genre === "homme" ? "homme" : "femme";
  const title = `Lunettes ${brand.name} ${genre} en Tunisie`;
  const description = `Découvrez les lunettes ${brand.name} pour ${genre}, disponibles chez InfraRed au Kram, à Tunisia Mall et à El Aouina.`;
  return {
    title,
    description,
    alternates: { canonical: `/marques/${brand.slug}?genre=${genre}` },
    openGraph: { title, description, url: `/marques/${brand.slug}?genre=${genre}` },
  };
}

export default async function BrandPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ genre?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const genre = query.genre === "homme" ? "homme" : "femme";
  const [brands, settings] = await Promise.all([getDbBrands(), getSiteSettings()]);
  const brand = brands.find((candidate) => candidate.slug === slug);
  if (!brand) notFound();

  const products = await getDbProducts(
    { brand: { slug }, available: true, OR: [{ target: genre === "homme" ? "HOMME" : "FEMME" }, { target: "MIXTE" }] },
    [{ createdAt: "desc" }, { id: "asc" }],
    { includePrices: settings.showPrices },
  );
  const editorial = getBrandEditorial(slug);
  const heroImage = genre === "homme" ? brand.heroMenImage : brand.heroWomenImage;
  const title = genre === "homme"
    ? brand.heroMenTitle || `Lunettes ${brand.name} homme`
    : brand.heroWomenTitle || `Lunettes ${brand.name} femme`;
  const description = genre === "homme"
    ? brand.heroMenText || `Découvrez la collection de lunettes ${brand.name} pour homme disponible chez InfraRed Optic-Store.`
    : brand.heroWomenText || `Découvrez la collection de lunettes ${brand.name} pour femme disponible chez InfraRed Optic-Store.`;

  return <div>
    <div className="vf-container py-5 sm:py-7"><nav className="text-[10px] uppercase tracking-[0.12em] text-black/40"><Link href="/">Accueil</Link><span className="mx-2">/</span><Link href="/marques">Marques</Link><span className="mx-2">/</span><span>{brand.name}</span></nav></div>

    <div className="border-y border-black/10 bg-white">
      <div className="vf-container flex justify-center gap-10">
        {(["femme", "homme"] as const).map((item) => <Link key={item} href={`/marques/${brand.slug}?genre=${item}`} className={`border-b-2 px-3 py-4 text-xs font-semibold uppercase tracking-[0.16em] ${genre === item ? "border-black text-black" : "border-transparent text-black/40 hover:text-black"}`}>{item}</Link>)}
      </div>
    </div>

    {heroImage && <header className="relative w-full overflow-hidden" style={{ aspectRatio: "2500 / 780" }}>
      <Image src={heroImage} alt={editorial?.alt ?? `${title} — campagne ${brand.name}`} fill priority quality={100} sizes="100vw" className="object-cover object-center" />
    </header>}

    <section className="vf-container py-10 text-center sm:py-14"><h1 className="mx-auto max-w-4xl text-2xl font-semibold sm:text-4xl">{title}</h1><p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-black/60 sm:text-base">{description}</p></section>

    <section id="collection" className="vf-container pb-16 sm:pb-20">
      <div className="mb-5 flex items-center justify-between border-y border-black/15 py-4"><span className="text-sm"><strong>{products.length}</strong> modèle{products.length > 1 ? "s" : ""} {genre}</span><Link href={`/catalogue?brand=${brand.slug}&target=${genre === "homme" ? "Homme" : "Femme"}`} className="text-xs font-semibold uppercase tracking-wider">Tous les filtres</Link></div>
      {products.length ? <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="py-24 text-center text-black/50">Aucun modèle {genre} publié pour cette marque.</p>}
    </section>
  </div>;
}
