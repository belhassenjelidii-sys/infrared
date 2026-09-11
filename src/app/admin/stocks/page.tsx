import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { Field } from "@/components/AdminFields";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import { can } from "@/lib/permissions";
import { updateStockAction } from "../catalogue-actions";

export default async function Stocks({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; stock?: string }> }) {
  const user = await requirePagePermission("stock.view");
  const { q = "", page = "1", stock } = await searchParams;
  const current = Math.max(1, Math.min(100000, parseInt(page) || 1));
  const settings = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { lowStockThreshold: true } });
  const threshold = settings?.lowStockThreshold ?? 5;
  const rows = await prisma.product.findMany({
    where: { archived: false, ...(stock === "low" ? { stock: { lte: threshold } } : {}), ...(q ? { OR: [{ name: { contains: q.slice(0, 100), mode: "insensitive" as const } }, { reference: { contains: q.slice(0, 100), mode: "insensitive" as const } }] } : {}) },
    orderBy: [{ stock: "asc" }, { id: "asc" }], take: 30, skip: (current - 1) * 30,
    select: { id: true, name: true, reference: true, stock: true, size: true },
  });
  return <AdminShell active="/admin/stocks"><h1 className="text-3xl font-semibold">Stocks</h1><p className="mt-2 text-sm text-stone">Une quantité par variante et par taille. Seuil de stock faible actuel : ≤ {threshold}.</p><form className="my-6 flex gap-3"><input className="min-h-11 rounded-lg border bg-white px-3 text-sm" name="q" defaultValue={q} placeholder="Nom ou référence" aria-label="Rechercher un stock"/>{stock && <input type="hidden" name="stock" value={stock}/>}<button className="rounded-lg bg-ink px-4 text-sm text-white">Rechercher</button></form><div className="grid gap-3">{rows.map((product) => <div key={product.id} className="grid items-center gap-5 rounded-xl border bg-white p-5 md:grid-cols-[1fr_320px]"><Link href={`/admin/produits/${product.id}`}><p className="font-semibold">{product.name}</p><p className="mt-1 text-sm text-stone">{product.reference} {product.size ?? ""}</p></Link>{can(user, "stock.edit") ? <ActionForm action={updateStockAction.bind(null, product.id)} className="grid gap-3"><Field label="Quantité" name="stock" type="number" min={0} max={1000000} value={product.stock}/><SubmitButton>Enregistrer le stock</SubmitButton></ActionForm> : <p>{product.stock ?? "Non renseigné"}</p>}</div>)}</div><div className="mt-5 flex gap-5 text-sm">{current > 1 && <Link href={`?page=${current - 1}&q=${encodeURIComponent(q)}${stock ? `&stock=${stock}` : ""}`}>Précédent</Link>}{rows.length === 30 && <Link href={`?page=${current + 1}&q=${encodeURIComponent(q)}${stock ? `&stock=${stock}` : ""}`}>Suivant</Link>}</div></AdminShell>;
}
