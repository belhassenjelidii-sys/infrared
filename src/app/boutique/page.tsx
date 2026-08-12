import type { Metadata } from "next";
import { MapPin, Phone, Clock, MessageCircle, Navigation } from "lucide-react";
import { shopInfo, stores as staticStores } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Nos boutiques",
  description: "InfraRed Optic-Store — 3 boutiques à Tunis : Le Kram, Tunisia Mall et El Aouina.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  // Editable from /admin/boutiques — falls back to the static list in
  // src/lib/data.ts until an admin/marketing account adds stores in DB.
  const dbStores = await prisma.store.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }).catch(() => []);
  const stores =
    dbStores.length > 0
      ? dbStores.map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          mobile: s.mobile,
          landline: s.landline ?? "",
          mapsUrl: s.mapsUrl ?? "",
          mapsEmbedQuery: s.mapsEmbedQuery ?? s.address,
          photo: s.photo,
        }))
      : staticStores;

  return (
    <div>
      <section className="relative h-64 w-full overflow-hidden bg-ink sm:h-80">
        <Image
          src="/images/stores/kram.svg"
          alt="InfraRed Optic-Store"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-ink/10 to-transparent">
          <div className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8">
            <p className="eyebrow text-red">3 boutiques à Tunis</p>
            <h1 className="font-display mt-2 text-3xl text-white sm:text-4xl">
              InfraRed Optic-Store
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="max-w-xl leading-relaxed text-ink/75">
          Nos opticiens vous accueillent dans nos 3 boutiques pour un examen
          de vue, un conseil personnalisé et l&apos;essayage de nos
          collections solaires et optiques.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {stores.map((s, i) => (
            <AnimatedSection
              key={s.id}
              delay={i * 0.1}
              className="overflow-hidden rounded-2xl border border-line transition-shadow duration-300 hover:shadow-xl hover:shadow-ink/5"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={s.photo || "/images/stores/kram.svg"}
                  alt={`InfraRed Optic-Store — ${s.name}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              <div className="p-5">
                <p className="font-display text-lg">{s.name}</p>
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

                <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-line">
                  <iframe
                    title={`InfraRed Optic-Store — ${s.name}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(s.mapsEmbedQuery || s.address)}&output=embed`}
                    className="h-full w-full"
                    loading="lazy"
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    href={s.mapsUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-red-dark"
                  >
                    <Navigation size={13} /> Itinéraire
                  </a>
                  <a
                    href={`https://wa.me/216${s.mobile.replace(/\s/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-xs font-medium transition-colors hover:border-red hover:text-red"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="mt-10 flex items-start gap-3 rounded-2xl bg-mist p-5 text-sm">
          <Clock size={18} className="mt-0.5 shrink-0 text-red" />
          <div>
            <p className="font-medium">Horaires</p>
            <ul className="mt-1 space-y-1 text-stone">
              {shopInfo.hours.map((h) => (
                <li key={h.day} className="flex gap-6">
                  <span className="w-32">{h.day}</span>
                  <span>{h.hours}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-stone">
              Horaires à confirmer boutique par boutique — modifiables depuis le dashboard admin une fois branché.
            </p>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
