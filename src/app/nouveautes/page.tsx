import type { Metadata } from "next";
import { getDbProductsPage } from "@/lib/catalogue-db";
import { getSiteSettings } from "@/lib/site-data";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Nouveautés lunettes optiques et solaires",
  description: "Découvrez les nouvelles lunettes optiques et solaires arrivées dans nos boutiques InfraRed au Kram, à Tunisia Mall et à El Aouina.",
  alternates: { canonical: "/nouveautes" },
};

export const dynamic = "force-dynamic";

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const settings = await getSiteSettings();
  const sp = await searchParams;
  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const items = await getDbProductsPage({ isNew: true }, { createdAt: "desc" }, { includePrices: settings.showPrices, page, pageSize: 24 });

  return (
    <div className="vf-container vf-section">
      <div className="text-center"><p className="text-xs uppercase tracking-[0.18em] text-black/45">Fraîchement arrivé</p>
      <h1 className="mt-3 text-3xl font-medium sm:text-4xl">Nouveautés</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone">
        Les derniers modèles reçus en boutique, classés du plus récent au
        plus ancien.
      </p></div>

      <div className="mt-10 grid grid-cols-2 gap-1 lg:grid-cols-4">
        {items.items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <Pagination pathname="/nouveautes" searchParams={{}} currentPage={items.page} totalPages={items.totalPages} />
    </div>
  );
}
