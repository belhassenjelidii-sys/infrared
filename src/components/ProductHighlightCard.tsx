"use client";

import Link from "next/link";
import { formatDT } from "@/lib/currency";
import { CatalogProduct } from "@/types";
import { buildWhatsAppLink, generateProductWhatsAppMessage } from "@/lib/whatsapp";
import Image from "next/image";
import { useShowPrices } from "@/components/PriceVisibilityProvider";

export default function ProductHighlightCard({ product, whatsapp }: { product: CatalogProduct; whatsapp?: string | null }) {
  const showPrices = useShowPrices();
  const cover = product.images[0];
  const waLink = buildWhatsAppLink(whatsapp, generateProductWhatsAppMessage(product));

  return (
    <div className="group flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative aspect-[5/4] bg-mist">
        {cover?.url ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            quality={100}
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-stone">Photo à venir</div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
              Nouveau
            </span>
          )}
          {showPrices && product.isPromotion && product.discount != null && (
            <span className="rounded-full bg-red px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
              -{product.discount}%
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <p className="eyebrow text-stone">{product.brandName}</p>
          <p className="font-display text-sm leading-snug">{product.name}</p>
          {showPrices && "price" in product && product.price != null && (
            <p className="mt-1 text-sm font-medium">
              {product.price > 0 ? (
                <>
                  {formatDT(product.price)}
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="ml-1.5 text-xs text-stone line-through">{formatDT(product.oldPrice)}</span>
                  )}
                </>
              ) : (
                <span className="text-red">Prix en boutique</span>
              )}
            </p>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <Link
            href={`/produit/${product.slug}`}
            className="rounded-full border border-ink/15 py-2 text-center text-[0.7rem] font-medium uppercase tracking-wide transition-colors hover:border-red hover:text-red"
          >
            Découvrir le produit
          </Link>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink py-2 text-center text-[0.7rem] font-medium uppercase tracking-wide text-white transition-colors hover:bg-red"
            >
              Commander
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
