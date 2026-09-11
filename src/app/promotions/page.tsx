import type { Metadata } from "next";
import { getDbProductsPage } from "@/lib/catalogue-db";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { getSiteSettings } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Promotions",
  description: "Nos montures en promotion, pour un temps limité, chez InfraRed Optic-Store.",
  alternates: { canonical: "/promotions" },
};

export const dynamic = "force-dynamic";

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const settings = await getSiteSettings();
  if (!settings.showPrices) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <p className="eyebrow text-red">Promotions</p>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl">Les offres sont momentanément masquées</h1>
        <p className="mt-3 text-sm text-stone">Les promotions seront visibles lorsque l&apos;affichage des prix sera réactivé.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const promos = await getDbProductsPage({ isPromotion: true, oldPrice: { gt: 0 }, discount: { gt: 0 } }, { discount: "desc" }, { includePrices: true, page, pageSize: 24 });

  return (
    <div className="vf-container vf-section">
      <div className="border-y border-red/25 bg-red-soft px-6 py-10 text-center sm:px-10">
        <p className="text-xs uppercase tracking-[0.18em] text-red">Offre en cours</p>
        <h1 className="mt-3 text-3xl font-medium sm:text-4xl">Promotions</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink/70">
          {promos.total} modèle{promos.total > 1 ? "s" : ""} à prix réduit,
          disponibles jusqu&apos;à épuisement des stocks en boutique.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-1 lg:grid-cols-4">
        {promos.items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <Pagination pathname="/promotions" searchParams={{}} currentPage={promos.page} totalPages={promos.totalPages} />
    </div>
  );
}
