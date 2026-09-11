import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { filterDbProducts, getDbBrands, getDbCategories, type DbCatalogueFilters } from "@/lib/catalogue-db";
import ProductCard from "@/components/ProductCard";
import CatalogueControls from "@/components/CatalogueControls";
import Pagination from "@/components/Pagination";
import { getSiteSettings } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Lunettes optiques et solaires en Tunisie",
  description: "Catalogue de lunettes optiques et solaires disponible chez InfraRed au Kram, à Tunisia Mall et à El Aouina. Ray-Ban, Gucci, Prada et autres marques.",
  alternates: { canonical: "/catalogue" },
};

export const dynamic = "force-dynamic";

type Search = { [key: string]: string | string[] | undefined };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const pageParam = Number.parseInt(get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const settings = await getSiteSettings();
  const [results, brands, categories] = await Promise.all([
    filterDbProducts({
      q: get("q"),
      category: get("category"),
      brand: get("brand"),
      target: get("target"),
      shape: get("forme") ?? get("shape"),
      isNew: get("isNew") === "1",
      isPromotion: settings.showPrices && get("isPromotion") === "1",
      sort: (get("sort") as DbCatalogueFilters["sort"]) ?? "nouveautes",
    }, { includePrices: settings.showPrices, page, pageSize: 24 }),
    getDbBrands(),
    getDbCategories(),
  ]);

  return (
    <div className="vf-container py-7 sm:py-10">
      <nav className="mb-8 text-[10px] uppercase tracking-[0.12em] text-black/40"><Link href="/">Accueil</Link><span className="mx-2">/</span><span>Catalogue</span></nav>
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-black/45">InfraRed Optic-Store</p>
        <h1 className="mt-3 text-2xl font-medium sm:text-4xl">Toutes nos lunettes</h1>
      </div>

      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <aside>
          <Suspense>
            <CatalogueControls resultCount={results.total} brands={brands} categories={categories} showPrices={settings.showPrices} />
          </Suspense>
        </aside>

        <div>
          {results.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-24 text-center">
              <p className="font-display text-xl">Aucune monture ne correspond</p>
              <p className="mt-2 text-sm text-stone">
                Essayez d’élargir vos filtres ou contactez-nous, nous pouvons
                commander le modèle recherché.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 xl:grid-cols-3">
              {results.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <Pagination pathname="/catalogue" searchParams={Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, typeof v === "string" ? v : undefined]))} currentPage={results.page} totalPages={results.totalPages} />
        </div>
      </div>
    </div>
  );
}
