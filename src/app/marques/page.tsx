import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import AnimatedSection from "@/components/AnimatedSection";

export const metadata: Metadata = {
  title: "Marques",
  description: "Carrera, Ray-Ban, Vogue, Polaroid, Emporio Armani — les marques disponibles chez InfraRed Optic-Store.",
};

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({ where: { active: true }, include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } });
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <p className="eyebrow text-red">Nos marques</p>
      <h1 className="font-display mt-2 text-3xl sm:text-4xl">Les maisons que nous distribuons</h1>
      <p className="mt-3 max-w-xl text-stone">
        Une sélection de marques reconnues, disponibles dans nos 3 boutiques
        et montées sur mesure par nos opticiens.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b, i) => {
          const count = b._count.products;
          return (
            <AnimatedSection key={b.slug} delay={i * 0.07}>
              <Link
                href={`/catalogue?brand=${b.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-red hover:shadow-xl hover:shadow-ink/5"
              >
                <div className="flex items-start justify-between">
                  {b.logo ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-mist">
                      <Image src={b.logo} alt={b.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-soft font-display text-xl text-red">
                      {b.name.charAt(0)}
                    </div>
                  )}
                  <ArrowUpRight
                    size={20}
                    className="text-stone transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red"
                  />
                </div>
                <p className="font-display mt-6 text-xl">{b.name}</p>
                <p className="mt-1 text-sm text-stone">
                  {count} modèle{count > 1 ? "s" : ""} disponible{count > 1 ? "s" : ""}
                </p>
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-red transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </AnimatedSection>
          );
        })}
      </div>

      <p className="mt-10 text-xs text-stone">
        Logos officiels à venir dès réception des visuels de marque — en
        attendant, chaque maison est identifiée par son nom pour rester
        fidèle sans utiliser de logo non autorisé.
      </p>
    </div>
  );
}
