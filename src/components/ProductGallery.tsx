"use client";

import ManagedImage from "@/components/ManagedImage";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { ProductImage } from "@/types";
import PlaceholderMedia from "./PlaceholderMedia";
import { useShowPrices } from "@/components/PriceVisibilityProvider";

export default function ProductGallery({
  images,
  isNew,
  discount,
}: {
  images: ProductImage[];
  isNew: boolean;
  discount: number | null;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<number | null>(null);
  const showPrices = useShowPrices();
  // A product can have zero photos (not yet photographed) — never assume
  // images[0] exists, or this crashes the whole product page.
  const current: ProductImage = images[active] ?? images[0] ?? {
    id: "placeholder",
    url: "",
    alt: "Photo à venir",
    sortOrder: 0,
    isPlaceholder: true,
  };

  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden bg-[#f6f6f6]"
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current == null || images.length < 2) return;
          const delta = event.changedTouches[0]?.clientX - touchStart.current;
          if (Math.abs(delta) > 45) setActive((currentIndex) => (currentIndex + (delta < 0 ? 1 : -1) + images.length) % images.length);
          touchStart.current = null;
        }}
      >
        {current.isPlaceholder ? (
          <PlaceholderMedia label="Photo à venir" />
        ) : (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="group absolute inset-0 h-full w-full cursor-zoom-in"
            aria-label="Agrandir la photo"
          >
            <ManagedImage
              src={current.url}
              alt={current.alt}
              fill
              priority
              quality={100}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-[7%] transition-transform duration-500 group-hover:scale-[1.025]"
            />
            <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-white/90 text-ink">
              <ZoomIn size={16} />
            </span>
          </button>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isNew && (
            <span className="rounded-full bg-ink px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
              Nouveau
            </span>
          )}
          {showPrices && discount != null && (
            <span className="rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
              -{discount}%
            </span>
          )}
        </div>
        {images.length > 1 && <>
          <button type="button" onClick={() => setActive((active - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/70 text-black/55 hover:bg-white" aria-label="Photo précédente"><ChevronLeft size={21} /></button>
          <button type="button" onClick={() => setActive((active + 1) % images.length)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/70 text-black/55 hover:bg-white" aria-label="Photo suivante"><ChevronRight size={21} /></button>
        </>}
      </div>

      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`Voir la photo ${i + 1}`}
              className={`relative aspect-[4/3] overflow-hidden border transition-colors ${
                i === active ? "border-black" : "border-transparent bg-[#f7f7f7]"
              }`}
            >
              {img.isPlaceholder ? (
                <PlaceholderMedia />
              ) : (
                <ManagedImage src={img.url} alt={img.alt} fill sizes="64px" className="object-contain p-1" />
              )}
            </button>
          ))}
        </div>
      )}

      {zoomed && !current.isPlaceholder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-6"
          onClick={() => setZoomed(false)}
        >
          <button
            aria-label="Fermer le zoom"
            onClick={() => setZoomed(false)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-3xl">
            <ManagedImage src={current.url} alt={current.alt} fill quality={100} sizes="90vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
