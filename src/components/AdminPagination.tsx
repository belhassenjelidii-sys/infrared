import Link from "next/link";

export default function AdminPagination({ currentPage, totalPages, filter, query, sort }: { currentPage: number; totalPages: number; filter?: string; query?: string; sort?: string }) {
  if (totalPages <= 1) return null;
  const href = (page: number) => {
    const p = new URLSearchParams();
    if (filter) p.set("filter", filter);
    if (query) p.set("q", query);
    if (sort && sort !== "recent") p.set("sort", sort);
    if (page > 1) p.set("page", String(page));
    const q = p.toString();
    return q ? `/admin?${q}` : "/admin";
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-4 py-4 text-sm">
      {currentPage > 1 ? <Link href={href(currentPage - 1)} className="rounded-full border border-line px-3.5 py-2 hover:border-red hover:text-red">← Précédent</Link> : <span />}
      <span className="text-stone">Page {currentPage} / {totalPages}</span>
      {currentPage < totalPages ? <Link href={href(currentPage + 1)} className="rounded-full border border-line px-3.5 py-2 hover:border-red hover:text-red">Suivant →</Link> : <span />}
    </div>
  );
}
