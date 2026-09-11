import Link from "next/link";
import type { Prisma } from "@prisma/client";
import AdminShell from "@/components/AdminShell";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function Models({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requirePagePermission("models.view");
  const { q = "", page = "1" } = await searchParams;
  const query = q.slice(0, 100);
  const where: Prisma.ProductModelWhereInput = query ? { OR: [{ code: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }, { brand: { name: { contains: query, mode: "insensitive" } } }] } : {};
  const count = await prisma.productModel.count({ where });
  const current = Math.min(Math.max(1, parseInt(page) || 1), Math.max(1, Math.ceil(count / 30)));
  const rows = await prisma.productModel.findMany({ where, include: { brand: true, _count: { select: { variants: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 30, skip: (current - 1) * 30 });
  return <AdminShell active="/admin/modeles">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold">Modèles</h1><p className="mt-2 text-sm text-stone">Les caractéristiques communes à chaque famille d’articles.</p></div>{can(user, "models.create") && <Link href="/admin/modeles/nouveau" className="rounded-lg bg-red px-5 py-3 text-sm font-semibold text-white">Ajouter un modèle</Link>}</div>
    <form className="my-6 flex gap-3"><input name="q" defaultValue={query} placeholder="Marque, code ou nom du modèle" aria-label="Rechercher un modèle" className="min-h-11 w-full max-w-md rounded-lg border bg-white px-3 text-sm"/><button className="rounded-lg bg-ink px-4 text-sm text-white">Rechercher</button></form>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs text-stone"><tr>{["Marque","Code","Modèle","Type","Forme","Matière","Variantes","Statut","Actions"].map((label) => <th key={label} className="p-4">{label}</th>)}</tr></thead><tbody className="divide-y">{rows.map((model) => <tr key={model.id}><td className="p-4">{model.brand.name}</td><td className="p-4 font-semibold">{model.code}</td><td className="p-4">{model.name}</td><td className="p-4">{model.type === "SUNGLASSES" ? "Solaire" : "Optique"}</td><td className="p-4">{model.shape ?? "—"}</td><td className="p-4">{model.materialLabel ?? "—"}</td><td className="p-4">{model._count.variants}</td><td className="p-4">{model.active ? "Actif" : "Inactif"}</td><td className="p-4"><div className="flex min-w-64 flex-wrap gap-2">{can(user, "models.edit") && <Link className="admin-action-button border-red/40 text-red" href={`/admin/modeles/${model.id}`}>Modifier</Link>}<Link className="admin-action-button" href={`/admin/articles?model=${model.id}`}>Variantes</Link>{can(user, "products.create") && <><Link className="admin-action-button" href={`/admin/produits/nouveau?model=${model.id}`}>Ajouter variante</Link><Link className="admin-action-button" href={`/admin/produits/nouveau?model=${model.id}&mode=color`}>Coloris</Link><Link className="admin-action-button" href={`/admin/produits/nouveau?model=${model.id}&mode=size`}>Taille</Link></>}</div></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-8 text-center text-sm text-stone">Aucun modèle. Créez le premier pour y ajouter des variantes.</p>}</div>
    <div className="mt-5 flex justify-between text-sm"><span>{count} modèles · Page {current}</span><div className="flex gap-4">{current > 1 && <Link href={`?q=${encodeURIComponent(query)}&page=${current - 1}`}>Précédent</Link>}{current * 30 < count && <Link href={`?q=${encodeURIComponent(query)}&page=${current + 1}`}>Suivant</Link>}</div></div>
  </AdminShell>;
}
