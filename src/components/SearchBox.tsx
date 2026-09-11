"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ManagedImage from "@/components/ManagedImage";
import { Search, Loader2 } from "lucide-react";
import { formatDT } from "@/lib/currency";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  reference: string;
  price: number | null;
  image: string | null;
};

export default function SearchBox({
  variant = "compact",
  onNavigate,
  showPrices = true,
  autoFocus = false,
}: {
  variant?: "compact" | "full";
  onNavigate?: () => void;
  showPrices?: boolean;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced fetch of live suggestions as the person types.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Recherche indisponible");
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goToResults() {
    setOpen(false);
    router.push(query.trim() ? `/catalogue?q=${encodeURIComponent(query.trim())}` : "/catalogue");
    onNavigate?.();
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  function goToProduct(slug: string) {
    setOpen(false);
    router.push(`/produit/${slug}`);
    onNavigate?.();
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => { e.preventDefault(); goToResults(); }}
        className={
          variant === "compact"
            ? "flex items-center gap-3 border-b border-transparent py-2 text-black/70 focus-within:border-black/25 transition-colors"
            : "flex items-center gap-3 px-5 py-5 sm:px-8"
        }
      >
        <Search size={variant === "compact" ? 15 : 16} className="shrink-0 text-stone" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Rechercher…"
          aria-label="Rechercher un produit"
          className={
            variant === "compact"
              ? "w-36 bg-transparent text-[13px] outline-none placeholder:text-black/70"
              : "w-full bg-transparent text-sm outline-none"
          }
        />
        <button
          type="submit"
          aria-label="Lancer la recherche"
          className={
            variant === "compact"
              ? "sr-only"
              : "flex h-9 w-9 shrink-0 items-center justify-center text-black/65 transition-colors hover:text-red"
          }
        >
          <Search size={14} />
        </button>
      </form>

      {showDropdown && (
        <div className="absolute left-0 top-full z-40 mt-2 max-h-[460px] w-[min(92vw,430px)] overflow-y-auto border border-black/10 bg-white p-2 shadow-2xl shadow-black/10">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-stone">
              <Loader2 size={14} className="animate-spin" /> Recherche…
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => goToProduct(r.slug)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-mist"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-[#f7f7f7]">
                    {r.image && <ManagedImage src={r.image} alt={r.name} fill className="object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider">{r.brandName}</p>
                    <p className="truncate text-sm">{r.name}</p>
                    <p className="text-[11px] text-stone">Réf. {r.reference}</p>
                  </div>
                  {showPrices && r.price != null && <p className="shrink-0 text-xs font-medium text-ink">{r.price > 0 ? formatDT(r.price) : "Prix en boutique"}</p>}
                </button>
              ))}
              <button
                type="button"
                onClick={goToResults}
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-center text-sm font-medium text-red hover:bg-red-soft"
              >
                Voir tous les résultats pour « {query.trim()} »
              </button>
            </>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-stone">
              Aucun résultat pour « {query.trim()} ».
            </div>
          )}
        </div>
      )}
    </div>
  );
}
