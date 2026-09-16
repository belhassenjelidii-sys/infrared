"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import type { Brand, Category } from "@/types";
import { GLASSES_SHAPES } from "@/lib/glasses-attributes";

const TARGETS = ["Homme", "Femme", "Mixte", "Enfant"];
const SORTS = [
  { value: "nouveautes", label: "Nouveautés" },
  { value: "marque-asc", label: "Marque A–Z" },
  { value: "marque-desc", label: "Marque Z–A" },
  { value: "reference-asc", label: "Référence A–Z" },
  { value: "reference-desc", label: "Référence Z–A" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
];

export default function CatalogueControls({
  resultCount,
  brands,
  categories,
  showPrices,
}: {
  resultCount: number;
  brands: Brand[];
  categories: Category[];
  showPrices: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "" || next.get(key) === value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== "page") next.delete("page");
    router.push(`/catalogue?${next.toString()}`, { scroll: false });
  }

  const active = {
    category: params.get("category") ?? "",
    brand: params.get("brand") ?? "",
    target: params.get("target") ?? "",
    shape: params.get("forme") ?? params.get("shape") ?? "",
    isNew: params.get("isNew") === "1",
    isPromotion: showPrices && params.get("isPromotion") === "1",
    sort: params.get("sort") ?? "nouveautes",
  };

  const FilterBlocks = (
    <div className="divide-y divide-black/10 border-y border-black/15">
      <div className="py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Catégorie</p>
        <div className="mt-4 flex flex-col gap-3">
          {categories
            .filter((c) => c.slug === "solaires" || c.slug === "optiques")
            .map((c) => (
              <button
                key={c.slug}
                onClick={() => setParam("category", c.slug)}
                className={`w-fit border-b text-sm transition-colors ${
                  active.category === c.slug
                    ? "border-black text-black"
                    : "border-transparent text-ink/65 hover:border-black"
                }`}
              >
                {c.name}
              </button>
            ))}
        </div>
      </div>

      <div className="py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Marque</p>
        <div className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto">
          {brands.map((b) => (
            <button
              key={b.slug}
              onClick={() => setParam("brand", b.slug)}
              className={`w-fit border-b text-sm transition-colors ${
                active.brand === b.slug
                  ? "border-black text-black"
                  : "border-transparent text-ink/65 hover:border-black"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div className="py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Genre</p>
        <div className="mt-4 flex flex-col gap-3">
          {TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => setParam("target", t)}
              className={`w-fit border-b text-sm transition-colors ${
                active.target === t
                  ? "border-black text-black"
                  : "border-transparent text-ink/65 hover:border-black"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>


      <div className="py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Forme</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {GLASSES_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => setParam("forme", active.shape === shape ? null : shape)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active.shape === shape
                  ? "border-red bg-red text-white"
                  : "border-line text-ink/80 hover:border-red hover:text-red"
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>

      <div className="py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Sélection</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setParam("isNew", active.isNew ? null : "1")}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              active.isNew
                ? "border-red bg-red text-white"
                : "border-line text-ink/80 hover:border-red hover:text-red"
            }`}
          >
            Nouveautés
          </button>
          {showPrices && <button
            onClick={() => setParam("isPromotion", active.isPromotion ? null : "1")}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              active.isPromotion
                ? "border-red bg-red text-white"
                : "border-line text-ink/80 hover:border-red hover:text-red"
            }`}
          >
            Promotions
          </button>}
        </div>
      </div>

      {(active.category || active.brand || active.target || active.shape || active.isNew || active.isPromotion) && (
        <button
          onClick={() => router.push("/catalogue")}
          className="text-sm font-medium text-red hover:text-red-dark"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-y border-black/20 py-4">
        <p className="text-sm text-stone">
          <span className="font-medium text-ink">{resultCount}</span> monture
          {resultCount > 1 ? "s" : ""}
        </p>
        <div className="flex min-w-0 items-center gap-3">
          <select
            value={active.sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="min-w-0 max-w-[150px] border-0 bg-white px-2 py-2 text-xs font-semibold uppercase tracking-wider outline-none sm:max-w-none"
          >
            {SORTS.filter((s) => showPrices || !s.value.startsWith("prix-")).map((s) => (
              <option key={s.value} value={s.value}>
                Trier — {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filtres
          </button>
        </div>
      </div>

      <div className="mt-8 hidden lg:block">{FilterBlocks}</div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-ink/50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-10 rounded-full bg-line" />
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <p className="font-display text-lg">Filtres</p>
                <button onClick={() => setMobileOpen(false)} className="rounded-full border border-line p-2">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-4">{FilterBlocks}</div>
              <button
                onClick={() => setMobileOpen(false)}
                className="m-5 rounded-full bg-red py-3.5 text-sm font-medium text-white"
              >
                Voir {resultCount} résultat{resultCount > 1 ? "s" : ""}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
