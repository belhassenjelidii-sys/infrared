import Link from "next/link";

type PaginationProps = {
  pathname: string;
  searchParams?: Record<string, string | undefined>;
  currentPage: number;
  totalPages: number;
};

function hrefFor(pathname: string, params: Record<string, string | undefined>, page: number) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") q.set(key, value);
  }
  if (page > 1) q.set("page", String(page));
  const query = q.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function Pagination({ pathname, searchParams = {}, currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = new Set<number>([1, totalPages, currentPage]);
  for (let p = currentPage - 2; p <= currentPage + 2; p++) {
    if (p > 0 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={hrefFor(pathname, searchParams, currentPage - 1)}
          className="rounded-full border border-line px-4 py-2 text-sm hover:border-red hover:text-red"
        >
          ← Précédent
        </Link>
      )}
      {sorted.map((page, index) => {
        const previous = sorted[index - 1];
        const gap = previous !== undefined && page - previous > 1;
        return (
          <span key={page} className="contents">
            {gap && <span className="px-1 text-stone">…</span>}
            <Link
              href={hrefFor(pathname, searchParams, page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`min-w-10 rounded-full border px-3 py-2 text-center text-sm ${
                page === currentPage
                  ? "border-red bg-red text-white"
                  : "border-line hover:border-red hover:text-red"
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}
      {currentPage < totalPages && (
        <Link
          href={hrefFor(pathname, searchParams, currentPage + 1)}
          className="rounded-full border border-line px-4 py-2 text-sm hover:border-red hover:text-red"
        >
          Suivant →
        </Link>
      )}
    </nav>
  );
}
