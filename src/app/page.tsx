import Link from "next/link";
import { ArrowRight, ShieldCheck, Glasses, Award, MessageCircle } from "lucide-react";
import {
  categories,
  brands,
  stores,
  shopInfo,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import ProductHighlightCard from "@/components/ProductHighlightCard";
import BrandMarquee from "@/components/BrandMarquee";
import AnimatedSection from "@/components/AnimatedSection";
import HeroVisual from "@/components/HeroVisual";
import Image from "next/image";
import { getDbProducts } from "@/lib/catalogue-db";

export const revalidate = 0;

export default async function HomePage() {
  const [featured, nouveautes, promos] = await Promise.all([
    getDbProducts({ featured: true }, { createdAt: "desc" }).then((x) => x.slice(0, 4)),
    getDbProducts({ isNew: true }, { createdAt: "desc" }).then((x) => x.slice(0, 4)),
    getDbProducts({ isPromotion: true }, { discount: "desc" }).then((x) => x.slice(0, 4)),
  ]);

  // Editable from /admin/parametres — falls back to the default copy below
  // if no row exists yet (first run, before an admin saves settings).
  const [settings, dbBrands] = await Promise.all([
    prisma.storeSettings.findFirst().catch(() => null),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }).catch(() => []),
  ]);
  const heroTitle = settings?.heroTitle || "Découvrez votre prochaine paire.";
  const [heroTitleLine1, heroTitleLine2] = heroTitle.includes(" ")
    ? [heroTitle.slice(0, heroTitle.lastIndexOf(" ")), heroTitle.slice(heroTitle.lastIndexOf(" ") + 1)]
    : [heroTitle, ""];
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Montures solaires et optiques des plus grandes marques, montées sur mesure par nos opticiens diplômés, dans nos 3 boutiques à Tunis.";
  const heroCtaLabel = settings?.heroCtaLabel || "Découvrir nos lunettes";
  const heroImageUrl = settings?.heroImageUrl || null;
  const categoryTitles = {
    solaires: settings?.categoryTitleSolaires || "Lunettes solaires",
    optiques: settings?.categoryTitleOptiques || "Lunettes optiques",
    nouveautes: settings?.categoryTitleNouveautes || "Nouveautés",
  };
  const homeCategories = categories.filter((c) => ["solaires", "optiques", "nouveautes", "promotions"].includes(c.slug));
  const accentColor = settings?.accentColor || undefined;

  return (
    <>
      {/* HERO — grande affiche + 2 articles mis en avant, comme un vrai site d'opticien */}
      <section className="bg-mist">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:px-8 lg:grid-cols-[1.7fr_1fr] lg:py-14">
          {/* Grande affiche */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-mist to-[#f0e2e0]">
            <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14 lg:py-16">
              <p className="eyebrow text-red">InfraRed Optic-Store</p>
              <h1 className="font-display mt-4 max-w-md text-4xl leading-[1.05] sm:text-5xl">
                {heroTitleLine1}
                {heroTitleLine2 && (
                  <>
                    <br />
                    <span className="text-red" style={accentColor ? { color: accentColor } : undefined}>
                      {heroTitleLine2}
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-5 max-w-sm text-stone">{heroSubtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/catalogue"

                  className="inline-flex items-center gap-2 rounded-full bg-red px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-red-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red/25"
                >
                  {heroCtaLabel} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/promotions"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-6 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:border-red hover:text-red hover:-translate-y-0.5"
                >
                  Voir les promotions
                </Link>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] items-center justify-center sm:flex">
              <HeroVisual imageUrl={heroImageUrl} />
            </div>
          </div>

          {/* 2 articles à côté */}
          <div className="flex flex-col gap-5">
            {featured.slice(0, 2).map((p) => (
              <ProductHighlightCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <AnimatedSection className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-red">Catégories</p>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl">Trouvez votre style</h2>
          </div>
        </AnimatedSection>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {homeCategories.map((c, i) => (
            <AnimatedSection key={c.slug} delay={i * 0.08}>
              <Link
                href={`/catalogue?category=${c.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-mist"
              >
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-lg text-ink transition-colors duration-300 group-hover:text-white">
                    {categoryTitles[c.slug as keyof typeof categoryTitles] ?? c.name}
                  </p>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* SÉLECTION DU MOMENT */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <AnimatedSection className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-red">Sélection du moment</p>
              <h2 className="font-display mt-2 text-2xl sm:text-3xl">Nos incontournables</h2>
            </div>
            <Link
              href="/catalogue"
              className="group hidden items-center gap-1.5 text-sm font-medium text-red hover:text-red-dark sm:inline-flex"
            >
              Tout voir <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </AnimatedSection>

          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {featured.map((p, i) => (
              <AnimatedSection key={p.id} delay={i * 0.06}>
                <ProductCard product={p} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* NOUVEAUTÉS */}
      <section className="border-t border-line bg-mist">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <AnimatedSection className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-red">Fraîchement arrivé</p>
              <h2 className="font-display mt-2 text-2xl sm:text-3xl">Nouveautés</h2>
            </div>
            <Link
              href="/nouveautes"
              className="group hidden items-center gap-1.5 text-sm font-medium text-red hover:text-red-dark sm:inline-flex"
            >
              Tout voir <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </AnimatedSection>

          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {nouveautes.map((p, i) => (
              <AnimatedSection key={p.id} delay={i * 0.06}>
                <ProductCard product={p} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOTIONS */}
      {promos.length > 0 && (
        <section className="bg-red-soft">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <AnimatedSection className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-red">Offre en cours</p>
                <h2 className="font-display mt-2 text-2xl sm:text-3xl">Promotions</h2>
              </div>
              <Link
                href="/promotions"
                className="group hidden items-center gap-1.5 text-sm font-medium text-red hover:text-red-dark sm:inline-flex"
              >
                Tout voir <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </AnimatedSection>

            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
              {promos.map((p, i) => (
                <AnimatedSection key={p.id} delay={i * 0.06}>
                  <ProductCard product={p} />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MARQUES */}
      <section className="border-t border-line bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <AnimatedSection className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-red">Nos marques</p>
              <h2 className="font-display mt-2 text-2xl sm:text-3xl">Les maisons que nous distribuons</h2>
            </div>
            <Link
              href="/marques"
              className="group hidden items-center gap-1.5 text-sm font-medium text-red hover:text-red-dark sm:inline-flex"
            >
              Tout voir <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </AnimatedSection>
        </div>
        <div className="mt-8">
          <BrandMarquee />
        </div>
        <div className="mx-auto mt-8 grid max-w-7xl grid-cols-2 gap-4 px-5 sm:px-8 md:grid-cols-5">
          {(dbBrands.length ? dbBrands : brands).map((b, i) => (
            <AnimatedSection key={b.slug} delay={i * 0.06}>
              <Link
                href={`/catalogue?brand=${b.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-red hover:shadow-lg hover:shadow-ink/5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-soft font-display text-lg text-red">
                  {b.name.charAt(0)}
                </span>
                <span className="text-sm font-medium">{b.name}</span>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* PRÉSENTATION INFRARED */}
      <section className="border-t border-line bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-3">
          <AnimatedSection>
            <p className="eyebrow text-red">Depuis 2012</p>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl">
              L&apos;opticien InfraRed, à Tunis
            </h2>
            <p className="mt-4 max-w-sm text-sm text-white/65">
              Plus de 10 ans d&apos;expertise optique, une sélection exigeante
              des plus grandes marques et un conseil personnalisé dans
              chacune de nos 3 boutiques.
            </p>
          </AnimatedSection>
          {[
            { icon: Award, title: "10+ ans d'expertise", text: "Une maison reconnue à Tunis depuis 2012." },
            { icon: Glasses, title: "Grandes marques", text: "Carrera, Ray-Ban, Vogue, Polaroid, Emporio Armani…" },
            { icon: ShieldCheck, title: "Opticiens diplômés", text: "Examen de vue et montage sur mesure en boutique." },
          ].map((b, i) => (
            <AnimatedSection key={b.title} delay={0.1 + i * 0.1} className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-red">
                <b.icon size={19} />
              </div>
              <div>
                <p className="font-display text-sm">{b.title}</p>
                <p className="mt-1 text-xs text-white/55">{b.text}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* NOS BOUTIQUES */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <AnimatedSection>
          <p className="eyebrow text-red">Nos boutiques</p>
          <h2 className="font-display mt-2 text-2xl sm:text-3xl">3 adresses à Tunis</h2>
        </AnimatedSection>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stores.map((s, i) => (
            <AnimatedSection
              key={s.id}
              delay={i * 0.1}
              className="rounded-2xl border border-line p-6 transition-all duration-300 hover:-translate-y-1 hover:border-red hover:shadow-lg hover:shadow-ink/5"
            >
              <p className="font-display text-lg">{s.name}</p>
              <p className="mt-2 text-sm text-stone">{s.address}</p>
              <p className="mt-3 text-sm">{s.mobile}</p>
            </AnimatedSection>
          ))}
        </div>
        <AnimatedSection className="mt-4 text-center sm:text-right">
          <Link href="/boutique" className="text-sm font-medium text-red hover:text-red-dark">
            Voir toutes les boutiques →
          </Link>
        </AnimatedSection>
      </section>

      {/* CONTACT / WHATSAPP / INSTAGRAM */}
      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="eyebrow text-red">Une question ?</p>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl">
              Contactez-nous, ou suivez @infraredopticstore
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${shopInfo.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-red px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-red-dark hover:-translate-y-0.5"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href={shopInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-white hover:-translate-y-0.5"
            >
              Instagram <ArrowRight size={16} />
            </a>
            <a
              href={shopInfo.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-white hover:-translate-y-0.5"
            >
              Facebook <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
