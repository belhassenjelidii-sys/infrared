import { Suspense } from "react";
import type { Metadata } from "next";
import { filterDbProducts, type DbCatalogueFilters } from "@/lib/catalogue-db";
import ProductCard from "@/components/ProductCard";
import CatalogueControls from "@/components/CatalogueControls";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Toutes nos lunettes solaires et optiques, filtrez par marque, prix, couleur et disponibilité.",
};

type Search = { [key: string]: string | string[] | undefined };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const results = await filterDbProducts({
    q: get("q"),
    category: get("category"),
    brand: get("brand"),
    target: get("target"),
    shape: get("forme") ?? get("shape"),
    isNew: get("isNew") === "1",
    isPromotion: get("isPromotion") === "1",
    sort: (get("sort") as DbCatalogueFilters["sort"]) ?? "popularite",
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <p className="eyebrow text-red">Catalogue</p>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl">Toutes nos lunettes</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside>
          <Suspense>
            <CatalogueControls resultCount={results.length} />
          </Suspense>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-24 text-center">
              <p className="font-display text-xl">Aucune monture ne correspond</p>
              <p className="mt-2 text-sm text-stone">
                Essayez d’élargir vos filtres ou contactez-nous, nous pouvons
                commander le modèle recherché.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
