"use client";

import ManagedImage from "@/components/ManagedImage";
import Link from "next/link";
import { formatDT } from "@/lib/currency";
import type { CatalogProduct } from "@/types";
import { useShowPrices } from "@/components/PriceVisibilityProvider";
import { productCardLabel } from "@/lib/product-card-label";

export default function ProductCard({ product, home = false }: { product: CatalogProduct; home?: boolean }) {
  const showPrices = useShowPrices();
  const cover = product.images[0];
  const hover = product.images[1] ?? cover;
  const { title, model } = productCardLabel(product);

  return (
    <Link href={`/produit/${product.slug}`} className={`group block ${home ? "bg-white" : "bg-[#f7f7f7] p-4 sm:p-6"}`}>
      <div className={`relative overflow-hidden bg-[#f1f1f1] ${home ? "aspect-[1.12/1]" : "aspect-[4/3]"}`}>
        {cover?.url ? (
          <>
            <ManagedImage src={cover.url} alt={cover.alt} fill quality={100} unoptimized={home} sizes="(max-width: 700px) 50vw, 33vw" className={`object-contain transition-all duration-500 group-hover:scale-[1.045] group-hover:opacity-0 ${home ? "p-[6%]" : ""}`} />
            <ManagedImage src={hover?.url ?? cover.url} alt={hover?.alt ?? cover.alt} fill quality={100} unoptimized={home} sizes="(max-width: 700px) 50vw, 33vw" className={`object-contain opacity-0 transition-all duration-500 group-hover:scale-[1.045] group-hover:opacity-100 ${home ? "p-[6%]" : ""}`} />
          </>
        ) : <div className="flex h-full items-center justify-center text-xs uppercase tracking-wider text-stone">Photo à venir</div>}
        <div className={`absolute flex gap-2 text-xs italic uppercase text-black/40 ${home ? "left-7 top-7" : "left-0 top-0"}`}>
          {product.isNew ? <span>#Nouveauté</span> : product.featured ? <span>#Best</span> : null}
          {showPrices && product.isPromotion && <span>#Promo</span>}
        </div>
        {home && <span className="absolute bottom-0 left-0 right-0 translate-y-full bg-black px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-transform duration-300 group-hover:translate-y-0">Voir le modèle</span>}
      </div>

      <div className={home ? "px-5 pb-4 pt-5 text-sm leading-5 text-black" : "pt-5 text-sm leading-5 text-black"}>
        <p className="font-semibold">{title}</p>
        {model && <p className="font-normal">{model}</p>}
        {showPrices && "price" in product && product.price != null && (
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-normal">{product.price > 0 ? formatDT(product.price) : "Prix en boutique"}</span>
            {product.oldPrice && product.oldPrice > product.price && <span className="text-xs text-black/40 line-through">{formatDT(product.oldPrice)}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
