import type { Metadata } from "next";
import { formatDT } from "@/lib/currency";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle, MapPin, Phone } from "lucide-react";
import { getDbProductBySlug, getDbProducts } from "@/lib/catalogue-db";
import { shopInfo } from "@/lib/data";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getDbProductBySlug(slug);
  if (!product) return {};
  const brand = await prisma.brand.findUnique({ where: { slug: product.brandSlug } });
  return {
    title: `${product.name} — ${brand?.name}`,
    description: product.description,
    openGraph: {
      title: `${product.name} — ${brand?.name}`,
      images: [product.images[0]?.url],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getDbProductBySlug(slug);
  if (!product) notFound();

  const brand = await prisma.brand.findUnique({ where: { slug: product.brandSlug } });
  const settings = await prisma.storeSettings.findFirst();
  const showPrices = settings?.showPrices ?? true;
  const related = (await getDbProducts({ category: { slug: product.categorySlug } })).filter((p) => p.id !== product.id).slice(0, 4);

  const waMessage = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par le modèle ${product.name} (réf. ${product.reference}).`
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <nav className="mb-6 text-xs text-stone">
        <Link href="/catalogue" className="hover:text-red">Catalogue</Link>
        <span className="mx-1.5">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} isNew={product.isNew} discount={product.discount} />

        <div>
          <p className="eyebrow text-red">{brand?.name}</p>
          <h1 className="font-display mt-2 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-1 text-xs text-stone">Référence {product.reference}</p>

          {showPrices && (
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-2xl">{formatDT(product.price)}</span>
              {product.oldPrice && (
                <span className="text-base text-stone line-through">{formatDT(product.oldPrice)}</span>
              )}
              {product.discount && (
                <span className="rounded-full bg-red-soft px-2.5 py-1 text-xs font-semibold text-red">
                  -{product.discount}%
                </span>
              )}
            </div>
          )}

          <p className="mt-6 leading-relaxed text-ink/80">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
            <div>
              <dt className="text-stone">Couleur</dt>
              <dd className="mt-1 font-medium">{product.color}</dd>
            </div>
            <div>
              <dt className="text-stone">Cible</dt>
              <dd className="mt-1 font-medium">{product.target}</dd>
            </div>
            <div>
              <dt className="text-stone">Disponibilité</dt>
              <dd className={`mt-1 font-medium ${product.available ? "text-emerald-700" : "text-stone"}`}>
                {product.available ? "En stock en boutique" : "Indisponible"}
              </dd>
            </div>
            <div>
              <dt className="text-stone">Catégorie</dt>
              <dd className="mt-1 font-medium capitalize">{product.categorySlug}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${shopInfo.whatsapp}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-red-dark"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-sm font-medium hover:border-red hover:text-red"
            >
              <Phone size={16} /> Contacter la boutique
            </Link>
            <Link
              href="/boutique"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-sm font-medium hover:border-red hover:text-red"
            >
              <MapPin size={16} /> Voir la boutique
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <p className="eyebrow text-red">À découvrir aussi</p>
          <h2 className="font-display mt-2 text-2xl">Vous pourriez aussi aimer</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
