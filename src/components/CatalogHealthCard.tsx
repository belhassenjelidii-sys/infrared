"use client";
import Link from "next/link";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import type { CatalogHealthReport } from "@/lib/catalog-health/report";

export default function CatalogHealthCard({ report }: { report: CatalogHealthReport }) {
  const topIssues = report.issues.slice(0, 6);
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Qualité du catalogue</h2>
        <Link href="/admin/qualite" className="text-xs text-red hover:underline">Voir tout →</Link>
      </div>

      {report.issues.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle size={16} className="shrink-0" />
          Catalogue en bonne santé — {report.totalActive} produit{report.totalActive === 1 ? "" : "s"} actif{report.totalActive === 1 ? "" : "s"}.
        </div>
      ) : (
        <div className="mt-4 space-y-1.5">
          {topIssues.map((issue) => (
            <Link
              key={issue.key}
              href={issue.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 hover:border-amber-400 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                <span className="truncate text-xs text-amber-900">{issue.label}</span>
              </div>
              <span className="shrink-0 flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[10px] font-medium text-amber-900">
                {issue.actionLabel} <ChevronRight size={10} />
              </span>
            </Link>
          ))}
          {report.completeCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
              <CheckCircle size={14} className="shrink-0" />
              {report.completeCount} produit{report.completeCount === 1 ? "" : "s"} complet{report.completeCount === 1 ? "" : "s"}
            </div>
          )}
          {report.issues.length > 6 && (
            <Link href="/admin/qualite" className="block rounded-xl border border-line px-4 py-2.5 text-center text-xs text-stone hover:border-red hover:text-red">
              +{report.issues.length - 6} autre{report.issues.length - 6 === 1 ? "" : "s"} problème{report.issues.length - 6 === 1 ? "" : "s"} — Voir tout
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
