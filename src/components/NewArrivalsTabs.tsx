"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import type { CatalogProduct } from "@/types";

export default function NewArrivalsTabs({ solar, optical }: { solar: CatalogProduct[]; optical: CatalogProduct[] }) {
  const first = solar.length ? "solar" : "optical";
  const [tab, setTab] = useState<"solar" | "optical">(first);
  const products = tab === "solar" ? solar : optical;
  return (
    <div>
      <div className="mb-8 flex justify-center border-b border-black/15">
        {solar.length > 0 && <button type="button" onClick={() => setTab("solar")} className={`min-w-32 border-b-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${tab === "solar" ? "border-black text-black" : "border-transparent text-black/40"}`}>Solaires</button>}
        {optical.length > 0 && <button type="button" onClick={() => setTab("optical")} className={`min-w-32 border-b-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${tab === "optical" ? "border-black text-black" : "border-transparent text-black/40"}`}>Optiques</button>}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-6 lg:grid-cols-4">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} home />)}</div>
    </div>
  );
}
