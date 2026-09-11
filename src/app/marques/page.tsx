/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import AnimatedSection from "@/components/AnimatedSection";

export const metadata: Metadata = {
  title: "Marques",
  description: "Ray-Ban, Prada, Gucci, Saint Laurent, Miu Miu, Carrera et d’autres marques disponibles chez InfraRed Optic-Store.",
  alternates: { canonical: "/marques" },
};

// No searchParams usage here, so Next could otherwise statically cache this
// page — force fresh rendering so brand/product changes in the admin show
// up immediately instead of depending on every mutation remembering the
// exact right revalidatePath calls.
export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({ where: { active: true }, include: { _count: { select: { products: { where: { archived: false, published: true, available: true } } } } }, orderBy: { name: "asc" } });
  return (
    <div className="vf-container vf-section">
      <div className="text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-black/45">InfraRed Optic-Store</p>
      <h1 className="mt-3 text-3xl font-medium sm:text-4xl">Nos marques</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone">
        Une sélection de marques reconnues, disponibles dans nos 3 boutiques
        et montées sur mesure par nos opticiens.
      </p></div>

      <div className="mt-12 grid grid-cols-2 gap-px bg-black/10 lg:grid-cols-3">
        {brands.map((b, i) => {
          const count = b._count.products;
          return (
            <AnimatedSection key={b.slug} delay={i * 0.07}>
              <Link
                href={`/marques/${b.slug}`}
                className="group relative block min-h-52 overflow-hidden bg-white p-6 transition-colors duration-300 hover:bg-[#f7f7f7] sm:p-9"
              >
                <div className="flex items-start justify-between">
                  {b.logo ? (
                    <div className="flex h-14 w-32 items-center justify-center overflow-hidden bg-white px-3 py-2">
                      <img src={b.logo} alt={`${b.name} — logo`} className="max-h-9 w-full object-contain" loading="lazy" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center bg-red-soft text-xl text-red">
                      {b.name.charAt(0)}
                    </div>
                  )}
                  <ArrowUpRight
                    size={20}
                    className="text-stone transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red"
                  />
                </div>
                <p className="mt-6 text-lg font-medium">{b.name}</p>
                <p className="mt-1 text-sm text-stone">
                  {count} modèle{count > 1 ? "s" : ""} disponible{count > 1 ? "s" : ""}
                </p>
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-black transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </AnimatedSection>
          );
        })}
      </div>

    </div>
  );
}
