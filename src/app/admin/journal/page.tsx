import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { requirePagePermission } from "@/lib/authz";
import { AUDIT_CATEGORIES, AUDIT_RESULTS } from "@/lib/audit-log";
import { AUDIT_TABS, buildAuditWhere, normalizeAuditFilters, type AuditJournalFilters } from "@/lib/audit-journal";
import { prisma } from "@/lib/prisma";

const label: Record<string, string> = {
  AUTH: "Connexions", ORDERS: "Commandes", CATALOG: "Catalogue", STOCK: "Stocks", PRICING: "Prix", PAYMENTS: "Paiements", USERS: "Utilisateurs", ROLES: "Rôles", SETTINGS: "Paramètres", SECURITY: "Sécurité", SYSTEM: "Système",
  SUCCESS: "Réussi", DENIED: "Refusé", ERROR: "Erreur",
};
const queryString = (filters: Record<string, string | undefined>, changes: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...changes })) if (value) params.set(key, value);
  return params.toString();
};

export default async function Journal({ searchParams }: { searchParams: Promise<AuditJournalFilters & { page?: string }> }) {
  await requirePagePermission("audit.view");
  const raw = await searchParams;
  const current = Math.max(1, Math.min(100000, Number.parseInt(raw.page ?? "1", 10) || 1));
  const filters = normalizeAuditFilters(raw);
  const where = buildAuditWhere(raw);
  const [logs, actors, stores] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50, skip: (current - 1) * 50, include: { actor: { select: { name: true, email: true } } } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" }, take: 250 }),
    prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 100 }),
  ]);
  const base = { ...raw, page: undefined };
  return <AdminShell active="/admin/journal"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow text-red">Traçabilité</p><h1 className="mt-1 text-3xl font-semibold">Journal d’audit</h1><p className="mt-2 text-sm text-stone">Événements immuables du back-office et opérations sensibles.</p></div></div>
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Vues du journal">{Object.entries(AUDIT_TABS).map(([key, tab]) => <Link key={key} href={`/admin/journal?${queryString(base, { tab: key === "all" ? undefined : key })}`} className={`rounded-full border px-3 py-1.5 text-sm ${filters.tab === key ? "border-red bg-red text-white" : "bg-white hover:border-red"}`}>{tab.label}</Link>)}</nav>
    <form className="mt-5 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4 xl:grid-cols-6"><input type="hidden" name="tab" value={filters.tab === "all" ? "" : filters.tab}/><Field name="from" label="Du" type="date" value={raw.from}/><Field name="to" label="Au" type="date" value={raw.to}/><Select name="actorId" label="Utilisateur" value={raw.actorId} options={actors.map(actor => ({ value: actor.id, label: `${actor.name} · ${actor.email}` }))}/><Select name="role" label="Rôle" value={raw.role} options={["SUPER_ADMIN", "ADMIN", "COMMERCIAL", "MARKETING", "DEVELOPER"].map(value => ({ value, label: value }))}/><Select name="storeId" label="Boutique" value={raw.storeId} options={stores.map(store => ({ value: store.id, label: store.name }))}/><Select name="category" label="Catégorie" value={raw.category} options={AUDIT_CATEGORIES.map(value => ({ value, label: label[value] }))}/><Field name="action" label="Action" value={raw.action}/><Select name="result" label="Résultat" value={raw.result} options={AUDIT_RESULTS.map(value => ({ value, label: label[value] }))}/><Field name="entityId" label="Identifiant objet" value={raw.entityId}/><Field name="q" label="Recherche" value={raw.q}/><div className="flex items-end gap-2"><button className="min-h-10 rounded-lg bg-red px-4 text-sm font-semibold text-white">Filtrer</button><Link href="/admin/journal" className="min-h-10 rounded-lg border px-3 py-2 text-sm">Réinitialiser</Link></div></form>
    <div className="mt-5 overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-mist text-xs text-stone"><tr>{["Date", "Utilisateur", "Action", "Objet", "Avant → après", "Résultat", "Boutique", "Détails"].map(value => <th className="p-3" key={value}>{value}</th>)}</tr></thead><tbody className="divide-y">{logs.map(log => <tr key={log.id}><td className="whitespace-nowrap p-3 text-xs">{log.createdAt.toLocaleString("fr-TN")}</td><td className="p-3"><strong>{log.actor?.name ?? log.actorName ?? "Système"}</strong><small className="block text-stone">{log.actor?.email ?? log.actorEmail ?? log.actorRole ?? "—"}</small></td><td className="p-3"><span className="rounded bg-mist px-2 py-1 text-xs">{label[log.category]}</span><p className="mt-1 font-medium">{log.action}</p></td><td className="p-3"><strong>{log.entityType}</strong><small className="block text-stone">{log.entityId ?? "—"}</small></td><td className="max-w-xs p-3 text-xs"><details><summary className="cursor-pointer text-red">Voir</summary><pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify({ avant: log.before, après: log.after }, null, 2)}</pre></details></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${log.result === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : log.result === "DENIED" ? "bg-amber-50 text-amber-700" : "bg-red/10 text-red"}`}>{label[log.result]}</span></td><td className="p-3 text-xs">{stores.find(store => store.id === log.storeId)?.name ?? "—"}</td><td className="max-w-xs p-3"><details><summary className="cursor-pointer text-xs">Ouvrir</summary><pre className="mt-2 whitespace-pre-wrap break-words text-[11px]">{JSON.stringify({ metadata: log.metadata, ip: log.ip, userAgent: log.userAgent, requestId: log.requestId }, null, 2)}</pre></details></td></tr>)}</tbody></table>{!logs.length && <p className="p-8 text-center text-sm text-stone">Aucun événement ne correspond à ces filtres.</p>}</div>
    <div className="mt-5 flex gap-5 text-sm">{current > 1 && <Link href={`/admin/journal?${queryString(base, { page: String(current - 1) })}`}>Précédent</Link>}{logs.length === 50 && <Link href={`/admin/journal?${queryString(base, { page: String(current + 1) })}`}>Suivant</Link>}</div>
  </AdminShell>;
}
function Field({ label, name, value, type = "text" }: { label: string; name: string; value?: string; type?: string }) { return <label className="grid gap-1 text-xs font-medium">{label}<input name={name} type={type} defaultValue={value} className="min-h-10 rounded-lg border px-3 text-sm font-normal"/></label>; }
function Select({ label, name, value, options }: { label: string; name: string; value?: string; options: { value: string; label: string }[] }) { return <label className="grid gap-1 text-xs font-medium">{label}<select name={name} defaultValue={value ?? ""} className="min-h-10 rounded-lg border bg-white px-3 text-sm font-normal"><option value="">Tous</option>{options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>; }