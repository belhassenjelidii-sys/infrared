"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { brands, categories } from "@/lib/data";

const TARGETS = ["Homme", "Femme", "Mixte", "Enfant"];
const SHAPES = ["Rectangle", "Carrée", "Ronde", "Ovale", "Vintage"];
const SORTS = [
  { value: "popularite", label: "Populaires" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
];

export default function CatalogueControls({ resultCount }: { resultCount: number }) {
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
    router.push(`/catalogue?${next.toString()}`, { scroll: false });
  }

  const active = {
    category: params.get("category") ?? "",
    brand: params.get("brand") ?? "",
    target: params.get("target") ?? "",
    shape: params.get("forme") ?? params.get("shape") ?? "",
    isNew: params.get("isNew") === "1",
    isPromotion: params.get("isPromotion") === "1",
    sort: params.get("sort") ?? "popularite",
  };

  const FilterBlocks = (
    <div className="space-y-7">
      <div>
        <p className="eyebrow text-stone">Catégorie</p>
        <div className="mt-3 flex flex-col gap-2">
          {categories
            .filter((c) => c.slug === "solaires" || c.slug === "optiques")
            .map((c) => (
              <button
                key={c.slug}
                onClick={() => setParam("category", c.slug)}
                className={`w-fit rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active.category === c.slug
                    ? "border-red bg-red text-white"
                    : "border-line text-ink/80 hover:border-red hover:text-red"
                }`}
              >
                {c.name}
              </button>
            ))}
        </div>
      </div>

      <div>
        <p className="eyebrow text-stone">Marque</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b.slug}
              onClick={() => setParam("brand", b.slug)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active.brand === b.slug
                  ? "border-red bg-red text-white"
                  : "border-line text-ink/80 hover:border-red hover:text-red"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow text-stone">Genre / Cible</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => setParam("target", t)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active.target === t
                  ? "border-red bg-red text-white"
                  : "border-line text-ink/80 hover:border-red hover:text-red"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>


      <div>
        <p className="eyebrow text-stone">Forme</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SHAPES.map((shape) => (
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

      <div>
        <p className="eyebrow text-stone">Disponibilité</p>
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
          <button
            onClick={() => setParam("isPromotion", active.isPromotion ? null : "1")}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              active.isPromotion
                ? "border-red bg-red text-white"
                : "border-line text-ink/80 hover:border-red hover:text-red"
            }`}
          >
            Promotions
          </button>
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
      <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
        <p className="text-sm text-stone">
          <span className="font-medium text-ink">{resultCount}</span> monture
          {resultCount > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-3">
          <select
            value={active.sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-sm outline-none"
          >
            {SORTS.map((s) => (
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
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl lg:hidden"
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
