import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Navigation, ArrowRight, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { getDbStores, getSiteSettings } from "@/lib/site-data";
import { buildWhatsAppLink, generateStoreWhatsAppMessage } from "@/lib/whatsapp";
import AnimatedSection from "@/components/AnimatedSection";
import { storeJsonLd, storeSearchLabel } from "@/lib/local-seo";

import { safeJsonLd } from "@/lib/safe-json-ld";
export const metadata: Metadata = {
  title: { absolute: "Opticien à Tunis : Le Kram, Tunisia Mall et El Aouina | InfraRed" },
  description: "Trouvez votre opticien InfraRed au Kram, à Tunisia Mall Lac 2 ou à El Aouina : lunettes optiques et solaires, horaires, téléphones et itinéraires.",
  alternates: { canonical: "/boutique" },
  openGraph: {
    title: "Nos opticiens au Kram, à Tunisia Mall et à El Aouina",
    description: "Trois boutiques d'optique dans le Grand Tunis pour vos lunettes de vue et solaires.",
    url: "/boutique",
  },
};

export const dynamic = "force-dynamic";
const STORE_360_EMBEDS: Record<string, string> = {
  "kram": "https://www.google.com/maps/embed?pb=!4v1789064630322!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ0U0OS1oZ2dF!2m2!1d36.83297262476452!2d10.31612871316821!3f100!4f0!5f0.7820865974627469",
  "tunisia-mall": "https://www.google.com/maps/embed?pb=!4v1789063431965!6m8!1m7!1sCAoSFkNJSE0wb2dLRUlDQWdJQ0U0OS1oWmc.!2m2!1d36.84821944133287!2d10.27877983991743!3f331.59466865746475!4f-0.6865421402864342!5f0.7820865974627469",
};
const STORE_COVER_IMAGES: Record<string, string> = { "el-aouina": "/images/stores/el-aouina.png" };

function mapsHref(store: { mapsUrl: string; mapsEmbedQuery: string; address: string }) {
  return store.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapsEmbedQuery || store.address)}`;
}

export default async function ShopPage() {
  const settings = await getSiteSettings();
  const stores = await getDbStores({ fallbackHours: settings.hours });
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "InfraRed Optic-Store",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        sameAs: [settings.facebook, settings.instagram].filter(Boolean),
      },
      {
        "@type": "ItemList",
        name: "Boutiques InfraRed Optic-Store dans le Grand Tunis",
        itemListElement: stores.map((store, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/boutique/${store.slug}`,
          name: `Opticien ${storeSearchLabel(store)}`,
        })),
      },
      ...stores.map((store) => storeJsonLd(store, SITE_URL)),
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="relative h-64 w-full overflow-hidden bg-ink sm:h-80">
        <Image
          src={stores[0]?.photo || "/images/stores/kram.svg"}
          alt="InfraRed Optic-Store"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-ink/10 to-transparent">
          <div className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8">
            <p className="eyebrow text-red">{stores.length} boutique{stores.length > 1 ? "s" : ""} à Tunis</p>
            <h1 className="font-display mt-2 text-3xl text-white sm:text-4xl">
              Nos opticiens au Kram, à Tunisia Mall et à El Aouina
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="max-w-xl leading-relaxed text-ink/75">
          Nos trois boutiques d&apos;optique dans le Grand Tunis vous accueillent pour un examen de vue,
          un conseil personnalisé et l&apos;essayage de lunettes optiques et solaires de grandes marques.
        </p>

        {stores.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-stone">
            Aucune boutique publiée pour le moment — ajoutez-en une depuis l&apos;espace admin (/admin/boutiques).
          </p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {stores.map((s, i) => {
              const waLink = buildWhatsAppLink(settings.whatsapp, generateStoreWhatsAppMessage(s.name));
              return (
              <AnimatedSection
                key={s.id}
                delay={i * 0.1}
                className="overflow-hidden rounded-2xl border border-line transition-shadow duration-300 hover:shadow-xl hover:shadow-ink/5"
              >
                {STORE_360_EMBEDS[s.slug] ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-mist">
                    <iframe
                      title={`Visite virtuelle 360° — InfraRed Optic-Store ${s.name}`}
                      src={STORE_360_EMBEDS[s.slug]}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={STORE_COVER_IMAGES[s.slug] || s.photo || "/images/stores/kram.svg"}
                      alt={`InfraRed Optic-Store — ${s.name}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/boutique/${s.slug}`} className="font-display text-lg hover:text-red">{s.name}</Link>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.liveStatus === "open" ? "bg-emerald-50 text-emerald-700" : s.liveStatus === "closed" ? "bg-red-soft text-red" : "bg-mist text-stone"}`}>
                      {s.liveStatus === "open" ? <CheckCircle2 size={12} /> : s.liveStatus === "closed" ? <XCircle size={12} /> : null}{s.statusLabel}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2.5 text-sm text-ink/75">
                    <li className="flex items-start gap-2">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-red" />
                      {s.address}
                    </li>
                    <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Phone size={15} className="shrink-0 text-red" />
                      <a href={`tel:+216${s.mobile.replace(/\s/g, "")}`} className="hover:text-red">
                        {s.mobile}
                      </a>
                      {s.landline && (
                        <>
                          <span className="text-stone">/</span>
                          <a href={`tel:+216${s.landline.replace(/\s/g, "")}`} className="hover:text-red">
                            {s.landline}
                          </a>
                        </>
                      )}
                    </li>
                  </ul>
                  {s.hours.length ? (
                    <div className="mt-4 rounded-xl bg-mist p-3 text-xs text-stone">
                      {s.hours.map((row) => (
                        <p key={row.day} className="flex justify-between gap-4"><span>{row.day}</span><span className="text-ink/70">{row.hours}</span></p>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-line">
                    <iframe
                      title={`InfraRed Optic-Store — ${s.name}`}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(s.mapsEmbedQuery || s.address)}&output=embed`}
                      className="h-full w-full"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/boutique/${s.slug}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-xs font-medium transition-colors hover:border-red hover:text-red"
                    >
                      Voir la boutique <ArrowRight size={13} />
                    </Link>
                    <a
                      href={mapsHref(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-red-dark"
                    >
                      <Navigation size={13} /> Itinéraire
                    </a>
                  </div>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-xs font-medium transition-colors hover:border-red hover:text-red"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </AnimatedSection>
              );
            })}
          </div>
        )}

      </section>
    </div>
  );
}
