import type { Metadata } from "next";
import { getDbProducts } from "@/lib/catalogue-db";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Promotions",
  description: "Nos montures en promotion, pour un temps limité, chez InfraRed Optic-Store.",
};

export default async function PromotionsPage() {
  const promos = await getDbProducts({ isPromotion: true }, { discount: "desc" });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="rounded-2xl bg-red-soft px-6 py-8 sm:px-10">
        <p className="eyebrow text-red">Offre en cours</p>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl">Promotions</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          {promos.length} modèle{promos.length > 1 ? "s" : ""} à prix réduit,
          disponibles jusqu&apos;à épuisement des stocks en boutique.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
        {promos.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
