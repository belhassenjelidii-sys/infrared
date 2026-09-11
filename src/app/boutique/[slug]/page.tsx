import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Clock, MessageCircle, Navigation, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { getDbStoreBySlug, getDbStores, getSiteSettings } from "@/lib/site-data";
import { buildWhatsAppLink, generateStoreWhatsAppMessage } from "@/lib/whatsapp";
import { storeJsonLd, storeSearchLabel, storeSeoDescription, storeSeoTitle } from "@/lib/local-seo";

import { safeJsonLd } from "@/lib/safe-json-ld";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const STORE_360_EMBEDS: Record<string, string> = {
  "kram": "https://www.google.com/maps/embed?pb=!4v1789064630322!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ0U0OS1oZ2dF!2m2!1d36.83297262476452!2d10.31612871316821!3f100!4f0!5f0.7820865974627469",
  "tunisia-mall": "https://www.google.com/maps/embed?pb=!4v1789063431965!6m8!1m7!1sCAoSFkNJSE0wb2dLRUlDQWdJQ0U0OS1oWmc.!2m2!1d36.84821944133287!2d10.27877983991743!3f331.59466865746475!4f-0.6865421402864342!5f0.7820865974627469",
};
const STORE_COVER_IMAGES: Record<string, string> = { "el-aouina": "/images/stores/el-aouina.png" };

function mapsHref(store: { mapsUrl: string; mapsEmbedQuery: string; address: string }) {
  return store.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapsEmbedQuery || store.address)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getDbStoreBySlug(slug);
  if (!store) return {};
  const title = storeSeoTitle(store);
  const openGraphImage = STORE_COVER_IMAGES[store.slug] || store.photo;
  return {
    title: { absolute: `${title} | InfraRed` },
    description: storeSeoDescription(store),
    alternates: { canonical: `/boutique/${store.slug}` },
    openGraph: {
      title,
      description: storeSeoDescription(store),
      url: `/boutique/${store.slug}`,
      images: openGraphImage ? [{ url: openGraphImage, alt: `Boutique InfraRed ${store.name}` }] : undefined,
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = await getSiteSettings();
  const [store, allStores] = await Promise.all([
    getDbStoreBySlug(slug, { fallbackHours: settings.hours }),
    getDbStores({ fallbackHours: settings.hours }),
  ]);
  if (!store) notFound();

  const otherStores = allStores.filter((s) => s.id !== store.id);
  const waLink = buildWhatsAppLink(settings.whatsapp, generateStoreWhatsAppMessage(store.name));
  const virtualTourUrl = STORE_360_EMBEDS[store.slug];
  const coverImage = STORE_COVER_IMAGES[store.slug] || store.photo || "/images/stores/kram.svg";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      storeJsonLd(store, SITE_URL),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Nos boutiques", item: `${SITE_URL}/boutique` },
          { "@type": "ListItem", position: 3, name: `Opticien ${storeSearchLabel(store)}`, item: `${SITE_URL}/boutique/${store.slug}` },
        ],
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <section className={`relative w-full overflow-hidden bg-ink ${virtualTourUrl ? "h-[min(72vh,680px)] min-h-[360px]" : "h-72 sm:h-96"}`}>
        {virtualTourUrl ? (
          <iframe
            title={`Visite virtuelle 360° — InfraRed Optic-Store ${store.name}`}
            src={virtualTourUrl}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <>
            <Image
              src={coverImage}
              alt={`InfraRed Optic-Store — ${store.name}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-ink/10 to-transparent">
          <div className="mx-auto w-full max-w-5xl px-5 pb-8 sm:px-8">
            <Link href="/boutique" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white">
              <ArrowLeft size={14} /> Toutes nos boutiques
            </Link>
            <p className="eyebrow text-red">InfraRed Optic-Store</p>
            <div className="flex flex-wrap items-center gap-3"><h1 className="font-display mt-2 text-3xl text-white sm:text-4xl">Opticien {storeSearchLabel(store)}</h1><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${store.liveStatus === "open" ? "bg-emerald-400 text-emerald-950" : store.liveStatus === "closed" ? "bg-red text-white" : "bg-white/15 text-white"}`}>{store.liveStatus === "open" ? <CheckCircle2 size={13} /> : store.liveStatus === "closed" ? <XCircle size={13} /> : null}{store.statusLabel}</span></div>
          </div>
        </div>
          </>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <ul className="space-y-4 text-sm text-ink/80">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-red" />
                <span>{store.address}</span>
              </li>
              <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Phone size={18} className="shrink-0 text-red" />
                <a href={`tel:+216${store.mobile.replace(/\s/g, "")}`} className="hover:text-red">
                  {store.mobile}
                </a>
                {store.landline && (
                  <>
                    <span className="text-stone">/</span>
                    <a href={`tel:+216${store.landline.replace(/\s/g, "")}`} className="hover:text-red">
                      {store.landline}
                    </a>
                  </>
                )}
              </li>
              {store.hours.length > 0 ? (
                <li className="flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 shrink-0 text-red" />
                  <div>
                    <p className="mb-1 font-medium">Horaires</p>
                    {store.hours.map((h) => <p key={h.day} className="flex gap-4"><span className="w-32 text-ink/60">{h.day}</span><span>{h.hours}</span></p>)}
                  </div>
                </li>
              ) : null}
            </ul>

            <div className="mt-8 border-t border-line pt-7">
              <h2 className="text-xl font-semibold">Lunettes optiques et solaires {storeSearchLabel(store)}</h2>
              <p className="mt-3 text-sm leading-7 text-ink/70">
                L&apos;équipe InfraRed vous accompagne pour choisir une monture adaptée à votre style et à votre correction. Découvrez en boutique nos lunettes de vue, lunettes solaires et collections de grandes marques, avec essayage et conseil personnalisé.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mapsHref(store)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-red-dark"
              >
                <Navigation size={16} /> Itinéraire
              </a>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-sm font-medium hover:border-red hover:text-red"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              )}
            </div>

            <Link
              href="/catalogue"
              className="mt-4 inline-block text-sm font-medium text-red hover:text-red-dark"
            >
              Voir le catalogue disponible en boutique →
            </Link>
          </div>

          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line">
            <iframe
              title={`InfraRed Optic-Store — ${store.name}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(store.mapsEmbedQuery || store.address)}&output=embed`}
              className="h-full w-full"
              loading="lazy"
            />
          </div>
        </div>

        {otherStores.length > 0 && (
          <div className="mt-16 border-t border-line pt-8">
            <p className="eyebrow text-red">Nos autres boutiques</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {otherStores.map((s) => (
                <Link
                  key={s.id}
                  href={`/boutique/${s.slug}`}
                  className="rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-red hover:text-red"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
