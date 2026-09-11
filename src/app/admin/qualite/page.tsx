import { requirePagePermission } from "@/lib/authz";
import AdminShell from "@/components/AdminShell";
import { redirect } from "next/navigation";
import { buildCatalogHealthReport } from "@/lib/catalog-health/report";
import { findPotentialDuplicates } from "@/lib/catalog-health/duplicate-scan";
import { getImageHealthSnapshot } from "@/lib/catalog-health/snapshot";
import { refreshImageScanAction, removeAllProductBackgroundsAction } from "./actions";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function fmtKB(bytes: number) {
  return `${Math.round(bytes / 1024)} Ko`;
}

export default async function AdminQualitePage() {
  const session = await requirePagePermission("products.view");
  if (!session || !["SUPER_ADMIN", "ADMIN", "DEVELOPER"].includes(session.role)) redirect("/admin");

  const [report, duplicates, imageScan] = await Promise.all([
    buildCatalogHealthReport(session.role === "COMMERCIAL" || session.role === "MARKETING" ? "COMMERCIAL" : "ADMIN"),
    findPotentialDuplicates(),
    getImageHealthSnapshot(false),
  ]);

  const brokenDetails = imageScan.details.filter((d) => d.issue === "broken");
  const heavyDetails = imageScan.details.filter((d) => d.issue === "heavy");

  return (
    <AdminShell active="/admin/qualite" name={session.name} email={session.email} role={session.role}>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow text-red">Centre de contrôle</p>
          <h1 className="font-display mt-1 text-3xl">Qualité du catalogue</h1>
        </div>
        <Link href="/admin" className="text-sm text-stone hover:text-red">← Retour au dashboard</Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Produits actifs", value: report.totalActive, ok: true },
          { label: "Complets", value: report.completeCount, ok: true },
          { label: "Problèmes détectés", value: report.issues.length, ok: report.issues.length === 0 },
          { label: "Images analysées", value: imageScan.imagesChecked, ok: true },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.ok ? "border-line bg-white" : "border-amber-300 bg-amber-50"}`}>
            <p className="text-xs font-medium text-stone">{s.label}</p>
            <p className={`mt-1 font-display text-3xl ${!s.ok ? "text-amber-800" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl">Actions recommandées</h2>
        {report.issues.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            <CheckCircle size={20} className="shrink-0" />
            <span>Aucun problème détecté. Catalogue en bonne santé ✓</span>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {report.issues.map((issue) => (
              <div key={issue.key} className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                  <span className="text-sm text-amber-900">{issue.label}</span>
                </div>
                <Link href={issue.href} className="shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:border-amber-500">
                  {issue.actionLabel}
                </Link>
              </div>
            ))}
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-800">
              <CheckCircle size={16} className="shrink-0" />
              <span>{report.completeCount} produit{report.completeCount === 1 ? "" : "s"} complet{report.completeCount === 1 ? "" : "s"}</span>
            </div>
          </div>
        )}
      </section>

      <section id="images" className="mt-10 border-t border-line pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Images</h2>
          <div className="flex items-center gap-3">
            {imageScan.computedAt && (
              <p className="text-xs text-stone">Analyse du {fmtDate(imageScan.computedAt)}</p>
            )}
            <form action={refreshImageScanAction}>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-red hover:text-red">
                <RefreshCw size={12} /> Relancer l&apos;analyse
              </button>
            </form>
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-red/20 bg-red-soft/30 p-5 sm:flex-row sm:items-center">
          <div><p className="text-sm font-semibold">Photos produit sans fond</p><p className="mt-1 text-xs text-stone">Transforme les anciennes photos sur fond uni en PNG transparent. Les nouvelles photos sont détourées automatiquement dès l’import.</p></div>
          <form action={removeAllProductBackgroundsAction}><button className="shrink-0 rounded-full bg-red px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-dark">Détourer toutes les anciennes photos</button></form>
        </div>

        {brokenDetails.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-red">{brokenDetails.length} image{brokenDetails.length === 1 ? "" : "s"} cassée{brokenDetails.length === 1 ? "" : "s"}</p>
            <div className="mt-2 space-y-2">
              {brokenDetails.map((d) => (
                <div key={d.imageId} className="flex items-center gap-3 rounded-xl border border-red/20 bg-red-soft/30 px-4 py-2.5 text-sm">
                  <Link href={`/admin/produits/${d.productId}`} className="font-medium hover:text-red">{d.productName}</Link>
                  <span className="truncate text-xs text-stone">{d.imageUrl}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {heavyDetails.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-amber-700">{heavyDetails.length} image{heavyDetails.length === 1 ? "" : "s"} trop lourde{heavyDetails.length === 1 ? "" : "s"}</p>
            <div className="mt-2 space-y-2">
              {heavyDetails.map((d) => (
                <div key={d.imageId} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mist">
                    <Image src={d.imageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <Link href={`/admin/produits/${d.productId}`} className="font-medium hover:text-red">{d.productName}</Link>
                  {d.sizeBytes && <span className="ml-auto text-xs text-stone">{fmtKB(d.sizeBytes)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {brokenDetails.length === 0 && heavyDetails.length === 0 && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle size={16} /> Toutes les images sont accessibles et légères.</p>
        )}
      </section>

      {duplicates.length > 0 && (
        <section id="doublons" className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-xl">{duplicates.length} doublon{duplicates.length === 1 ? "" : "s"} potentiel{duplicates.length === 1 ? "" : "s"}</h2>
          <div className="mt-4 space-y-4">
            {duplicates.map((group, gi) => (
              <div key={gi} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-700">Groupe {gi + 1} — images visuellement proches</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {group.items.map((item) => (
                    <div key={item.imageId} className="flex items-center gap-2">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                        <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" unoptimized />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{item.productName}</p>
                        <Link href={`/admin/produits/${item.productId}`} className="text-[10px] text-red hover:underline">Voir →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </AdminShell>
  );
}
