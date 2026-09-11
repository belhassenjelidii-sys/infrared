import { AlertTriangle, CheckCircle } from "lucide-react";
import type { CatalogHealthReport } from "@/lib/catalog-health/report";

// Commercial-facing summary — informational only (no links into /admin,
// which this role can't access). Only ever receives a report already
// built with role="COMMERCIAL", which itself only exposes the checks
// relevant to Commercial's actual scope (photos, price, availability) —
// see buildCatalogHealthReport().
export default function CommercialHealthWidget({ report }: { report: CatalogHealthReport }) {
  if (report.issues.length === 0) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle size={16} className="shrink-0" />
        Aucun produit à corriger — catalogue à jour.
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
        <AlertTriangle size={16} className="shrink-0" /> À vérifier
      </p>
      <ul className="mt-2 space-y-1 text-xs text-amber-800">
        {report.issues.map((issue) => (
          <li key={issue.key}>• {issue.label}</li>
        ))}
      </ul>
    </div>
  );
}
