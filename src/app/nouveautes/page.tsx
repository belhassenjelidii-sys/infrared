import type { Metadata } from "next";
import { getDbProducts } from "@/lib/catalogue-db";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Nouveautés",
  description: "Les derniers modèles arrivés en boutique chez InfraRed Optic-Store.",
};

export default async function NewArrivalsPage() {
  const items = await getDbProducts({ isNew: true }, { createdAt: "desc" });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="eyebrow text-red">Fraîchement arrivé</p>
      <h1 className="font-display mt-2 text-3xl sm:text-4xl">Nouveautés</h1>
      <p className="mt-3 max-w-xl text-stone">
        Les derniers modèles reçus en boutique, classés du plus récent au
        plus ancien.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
