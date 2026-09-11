import type { Metadata } from "next";
import { formatDT } from "@/lib/currency";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle, MapPin, Phone, ShoppingBag } from "lucide-react";
import { getDbProductBySlug } from "@/lib/catalogue-db";
import { getSimilarProducts } from "@/lib/product-intelligence/recommendation-engine";
import { prisma } from "@/lib/prisma";
import { getSiteSettings, getDbStores } from "@/lib/site-data";
import { buildWhatsAppLink, generateProductWhatsAppMessage, generateAvailabilityWhatsAppMessage } from "@/lib/whatsapp";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import { getCommerceSettings } from "@/lib/commerce";
import { addToCartAction } from "@/app/panier/actions";
import ProductVariantOptions from "@/components/ProductVariantOptions";
import ProductTechnicalDetails from "@/components/ProductTechnicalDetails";

import { safeJsonLd } from "@/lib/safe-json-ld";
export const dynamicParams = true;
export const dynamic = "force-dynamic"; // always reflect the latest DB state — no stale route cache

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getDbProductBySlug(slug);
  if (!product) return {};
  // Local Product Intelligence metadata (see src/lib/product-intelligence/
  // metadata-generator.ts) takes priority when the admin has generated
  // and saved it — falls back to the auto-built title/description
  // otherwise. Fetched separately since these columns aren't part of the
  // shared catalogue Product type (src/types/index.ts).
  const seoOverrides = await prisma.product.findFirst({ where: { slug }, select: { metaTitle: true, metaDescription: true } });
  const title = seoOverrides?.metaTitle || `${product.name} — ${product.brandName}`;
  const description =
    seoOverrides?.metaDescription ||
    product.description ||
    `${product.name} par ${product.brandName}, disponible chez InfraRed Optic-Store.`;
  return {
    // Suggestions saved by Product Intelligence already contain the site
    // name. Mark them as absolute so the root metadata template does not
    // append "InfraRed Optic-Store" a second time.
    title: title.toLowerCase().includes("infrared optic-store") ? { absolute: title } : title,
    description,
    alternates: { canonical: `/produit/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = await getSiteSettings();
  const product = await getDbProductBySlug(slug, { includePrices: settings.showPrices });
  if (!product) notFound();

  const currentDetails = await prisma.product.findUnique({
    where: { id: product.id },
    include: { brand: true, productModel: true, images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!currentDetails) notFound();

  const [stores, related, variants, commerce] = await Promise.all([
    getDbStores(),
    getSimilarProducts(product.id, 4, { includePrices: settings.showPrices }),
    currentDetails.productModelId ? prisma.product.findMany({
      where: { productModelId: currentDetails.productModelId, archived: false, published: true },
      include: { brand: true, productModel: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ variantReference: "asc" }, { size: "asc" }],
    }) : Promise.resolve([currentDetails]),
    getCommerceSettings(),
  ]);

              const waLink = buildWhatsAppLink(
    settings.whatsapp,
    // When we know the piece is out of stock, ask about restocking rather
    // than reusing the "confirm availability" wording verbatim.
    product.available ? generateProductWhatsAppMessage(product) : generateAvailabilityWhatsAppMessage(product)
              );
              // A null stock means that stock is managed in a physical shop.  It is
              // still sellable online when the variant is marked available.  Only an
              // explicit zero makes the variant unavailable.
              const hasSalePrice = Number(currentDetails.price) > 0;
              const isSellable = currentDetails.available && currentDetails.stock !== 0;
              const cartLabel = !hasSalePrice ? "Prix à renseigner" : isSellable ? "Ajouter au panier" : "Indisponible";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.reference,
    brand: { "@type": "Brand", name: product.brandName },
    image: product.images.map((i) => i.url),
    offers:
      settings.showPrices && "price" in product && product.price != null && product.price > 0
        ? {
            "@type": "Offer",
            priceCurrency: "TND",
            price: product.price,
            availability: product.available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/produit/${product.slug}`,
          }
        : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catalogue", item: `${SITE_URL}/catalogue` },
      { "@type": "ListItem", position: 2, name: product.categoryName || "Lunettes", item: `${SITE_URL}/catalogue?category=${product.categorySlug}` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}/produit/${product.slug}` },
    ],
  };

  return (
    <div className="vf-container py-7 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      <nav className="mb-7 text-[10px] uppercase tracking-[0.12em] text-black/40">
        <Link href="/catalogue" className="hover:text-red">Catalogue</Link>
        <span className="mx-1.5">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)] lg:gap-14">
        <ProductGallery images={product.images} isNew={product.isNew} discount={"discount" in product ? product.discount ?? null : null} />

        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Choix et disponibilité de l’article">
          <div className="border-b border-black/15 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{product.brandName}</p>
            <h1 className="mt-3 text-2xl font-normal leading-[1.08] tracking-[-0.02em] sm:text-[2rem]">{product.name}</h1>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-black/45">Référence {product.reference}</p>

            {settings.showPrices && "price" in product && product.price != null && (
              <div className="mt-5 flex items-baseline gap-3">
              {product.price > 0 ? (
                <>
                  <span className="font-display text-2xl">{formatDT(product.price)}</span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-base text-stone line-through">{formatDT(product.oldPrice)}</span>
                  )}
                  {product.discount && product.discount > 0 && (
                    <span className="rounded-full bg-red-soft px-2.5 py-1 text-xs font-semibold text-red">
                      -{product.discount}%
                    </span>
                  )}
                </>
              ) : (
                <span className="font-display text-2xl text-red">Prix en boutique</span>
              )}
              </div>
            )}
          </div>

          <ProductVariantOptions current={currentDetails} variants={variants} showPrices={settings.showPrices}/>

                      <div className={`mt-5 flex items-center gap-2 border border-current/15 px-4 py-3 text-sm font-semibold ${isSellable ? "bg-emerald-50 text-emerald-700" : "bg-[#fafafa] text-stone"}`}><span className="h-2 w-2 rounded-full bg-current"/>{!hasSalePrice ? "Prix à confirmer en boutique" : isSellable ? "Produit en stock dans nos boutiques" : "Produit actuellement indisponible"}</div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
                        {commerce.cart && <form action={addToCartAction.bind(null, currentDetails.id)} className="sm:col-span-2"><button disabled={!isSellable || !hasSalePrice} className="inline-flex min-h-13 w-full items-center justify-center gap-2 bg-black px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-red disabled:cursor-not-allowed disabled:bg-stone disabled:hover:bg-stone"><ShoppingBag size={17}/>{cartLabel}</button></form>}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-red px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-dark"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-black/20 px-5 py-4 text-xs font-semibold uppercase tracking-wider hover:border-black"
            >
              <Phone size={16} /> Contacter la boutique
            </Link>
            <Link
              href="/boutique"
              className="inline-flex items-center justify-center gap-2 border border-black/20 px-5 py-4 text-xs font-semibold uppercase tracking-wider hover:border-black sm:col-span-2"
            >
              <MapPin size={16} /> Essayer en boutique
            </Link>
          </div>

          {stores.length > 0 && (
            <div className="mt-8 border border-black/10 bg-[#fafafa] p-5">
              <p className="text-sm font-medium">
                {settings.showPrices && "price" in product && product.price === 0
                  ? "Renseignez-vous dans nos boutiques"
                  : "Disponible dans nos boutiques"}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink/75">
                {stores.map((s) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-red" />
                    <span>
                      <span className="font-medium text-ink">{s.name}</span> — {s.address}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <ProductTechnicalDetails product={currentDetails}/>

      {related.length > 0 && (
        <section className="mt-20 border-t border-black/15 pt-12">
          <p className="text-xs uppercase tracking-[0.18em] text-black/45">À découvrir aussi</p>
          <h2 className="mt-3 text-2xl font-medium">Vous pourriez également aimer</h2>
          <div className="mt-8 grid grid-cols-2 gap-1 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
