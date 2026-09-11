"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

// Forme mini-icons — SVG outlines matching the shape names in GLASSES_SHAPES (src/lib/glasses-attributes.ts)
const FORME_ICONS: Record<string, React.ReactNode> = {
  Rectangulaire: <svg viewBox="0 0 40 14" className="w-10 h-4"><rect x="1" y="3" width="16" height="8" rx="1" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><rect x="23" y="3" width="16" height="8" rx="1" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Carrée: <svg viewBox="0 0 40 14" className="w-10 h-4"><rect x="1" y="2" width="16" height="10" rx="1.5" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><rect x="23" y="2" width="16" height="10" rx="1.5" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Ovale: <svg viewBox="0 0 40 14" className="w-10 h-4"><ellipse cx="9" cy="7" rx="8" ry="5" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><ellipse cx="31" cy="7" rx="8" ry="5" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Ronde: <svg viewBox="0 0 40 14" className="w-10 h-4"><circle cx="9" cy="7" r="6" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><circle cx="31" cy="7" r="6" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Aviateur: <svg viewBox="0 0 40 14" className="w-10 h-4"><path d="M1 3.5 Q1 11 9 11 L16 9 L16 3.5Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><path d="M39 3.5 Q39 11 31 11 L24 9 L24 3.5Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Papillon: <svg viewBox="0 0 40 14" className="w-10 h-4"><path d="M1 2 L16 2 L15 9 Q14 11 8 11 Q1 11 1 2Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><path d="M39 2 L24 2 L25 9 Q26 11 32 11 Q39 11 39 2Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Wayfarer: <svg viewBox="0 0 40 14" className="w-10 h-4"><path d="M1 2 H16 V5 H1Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><path d="M24 2 H39 V5 H24Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><circle cx="8.5" cy="8.5" r="3.5" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><circle cx="31.5" cy="8.5" r="3.5" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  "Cat-eye": <svg viewBox="0 0 40 14" className="w-10 h-4"><path d="M1 5 L3 2 L16 4.5 L14 10 Q12 11 6 11 Q1 11 1 5Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><path d="M39 5 L37 2 L24 4.5 L26 10 Q28 11 34 11 Q39 11 39 5Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Géométrique: <svg viewBox="0 0 40 14" className="w-10 h-4"><path d="M4 2 L12 2 L16 7 L12 12 L4 12 L0 7Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><path d="M28 2 L36 2 L40 7 L36 12 L28 12 L24 7Z" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
  Autre: <svg viewBox="0 0 40 14" className="w-10 h-4"><rect x="1" y="3" width="16" height="8" rx="4" fill="none" stroke="#9ca3af" strokeWidth="1.2"/><rect x="23" y="3" width="16" height="8" rx="4" fill="none" stroke="#9ca3af" strokeWidth="1.2"/></svg>,
};

function MiniForme({ label }: { label: string }) {
  return FORME_ICONS[label] ?? FORME_ICONS["Rectangulaire"];
}

export type MegaColumn = { title: string; links: { label: string; href: string }[] };

type Product = { id: string; slug: string; image?: string | null; isNew?: boolean; brand?: string; name: string; price: number | string | null };

type Props = {
  open: boolean;
  columns: MegaColumn[];
  previewProducts?: Product[];
  previewLabel?: string;
  showPrices?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
};

export default function MegaMenu({ open, columns, previewProducts, previewLabel, showPrices = true, onEnter, onLeave }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });

  const formeCol = columns.find((c) => c.title === "Forme");
  const otherCols = columns.filter((c) => c.title !== "Forme");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="absolute left-1/2 top-full w-screen -translate-x-1/2 z-40 bg-white border-t border-line shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
        >
          <div className="mx-auto max-w-7xl px-8 py-6 grid grid-cols-12 gap-6">
            <div className={`col-span-9 grid ${otherCols.length >= 4 ? "grid-cols-4" : "grid-cols-3"} gap-8`}>
              {otherCols.map((col) => (
                <div key={col.title}>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink mb-3">{col.title}</p>
                  <ul className="space-y-2">
                    {col.links.map((l) => (
                      <li key={l.label + l.href}>
                        <Link href={l.href} className="text-sm text-stone hover:text-ink uppercase tracking-wide">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {previewProducts && previewProducts.length > 0 && (
              <div className="col-span-3 border-l border-line pl-6">
                <p className="text-xs font-bold uppercase tracking-widest text-ink mb-3">{previewLabel}</p>
                <div className="grid grid-cols-2 gap-3">
                  {previewProducts.slice(0, 2).map((p) => (
                    <Link key={p.id} href={`/produit/${p.slug}`} className="group block">
                      <div className="relative bg-mist rounded-xl p-2 aspect-square overflow-hidden">
                        <Image
                          src={p.image || "/placeholder.png"}
                          alt={p.name}
                          fill
                          quality={100}
                          sizes="160px"
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        {p.isNew && (
                          <span className="absolute top-2 left-2 bg-ink text-white text-[9px] px-2 py-0.5 rounded-full uppercase">Nouveau</span>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-[10px] text-stone uppercase tracking-widest">{p.brand}</p>
                        <p className="text-xs font-medium leading-tight line-clamp-2">{p.name}</p>
                        {showPrices && p.price != null && <p className="text-sm font-bold mt-1 text-red">{Number(p.price) > 0 ? `${Number(p.price).toFixed(3)} DT` : "Prix en boutique"}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {formeCol && (
            <div className="border-t border-line bg-[#fcfcfc] px-8 py-4 flex items-center gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-ink min-w-fit">Forme</p>
              <button
                onClick={() => scroll(-1)}
                className="w-7 h-7 shrink-0 rounded-full border border-line bg-white flex items-center justify-center hover:bg-ink hover:text-white hover:border-ink transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <div ref={scrollRef} className="flex gap-8 overflow-x-auto scrollbar-hide flex-1 scroll-smooth py-1">
                {formeCol.links.map((f) => (
                  <Link key={f.label} href={f.href} className="flex flex-col items-center gap-1.5 shrink-0 group">
                    <div className="group-hover:scale-110 transition-transform">
                      <MiniForme label={f.label} />
                    </div>
                    <span className="text-[11px] text-stone group-hover:text-ink whitespace-nowrap">{f.label}</span>
                  </Link>
                ))}
              </div>
              <button
                onClick={() => scroll(1)}
                className="w-7 h-7 shrink-0 rounded-full border border-line bg-white flex items-center justify-center hover:bg-ink hover:text-white hover:border-ink transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
