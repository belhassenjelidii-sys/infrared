import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDT } from "@/lib/currency";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { createPromotionAction, removePromotionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const session = await getSession();
  const [products, availableProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isPromotion: true },
      include: { brand: true, images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { discount: "desc" },
    }),
    prisma.product.findMany({
      where: { isPromotion: false, archived: false },
      include: { brand: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminShell active="/admin/promotions" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Promotions</h1>
      <p className="mt-2 text-sm text-stone">
        Pour créer une promotion, ouvrez un produit et renseignez son
        &laquo; ancien prix &raquo; — la réduction et le badge se calculent
        automatiquement.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg">Créer une promotion</h2>
        <form action={createPromotionAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <select name="productId" required className="min-h-11 rounded-lg border border-line px-3 text-sm">
            <option value="">Choisir un produit…</option>
            {availableProducts.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.brand.name} ({formatDT(p.price)})</option>)}
          </select>
          <input name="oldPrice" type="number" step="0.01" min="0" required placeholder="Ancien prix (DT)" className="min-h-11 rounded-lg border border-line px-3 text-sm" />
          <button className="min-h-11 rounded-full bg-red px-5 text-sm font-medium text-white hover:bg-red-dark">Activer</button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-mist text-left text-xs uppercase tracking-wide text-stone">
            <tr><th className="px-4 py-3">Produit</th><th className="px-4 py-3">Marque</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Réduction</th><th className="px-4 py-3 text-right">Action</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mist">
                    {p.images[0] && <Image src={p.images[0].url} alt="" fill className="object-cover" />}
                  </div>
                  {p.name}
                </td>
                <td className="px-4 py-3 text-stone">{p.brand.name}</td>
                <td className="px-4 py-3">
                  {formatDT(p.price)} <span className="text-stone line-through">{formatDT(p.oldPrice!)}</span>
                </td>
                <td className="px-4 py-3"><span className="rounded-full bg-red-soft px-2.5 py-1 text-xs font-medium text-red">-{p.discount}%</span></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/produits/${p.id}`} className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-red hover:text-red">Modifier</Link>
                    <form action={removePromotionAction.bind(null, p.id)}>
                      <ConfirmSubmitButton confirmMessage={`Retirer la promotion de "${p.name}" ?`} className="rounded-full border border-red/30 px-3 py-1.5 text-xs text-red hover:bg-red hover:text-white">Retirer</ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-stone">Aucune promotion active.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
