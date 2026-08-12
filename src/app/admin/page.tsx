import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDT } from "@/lib/currency";
import { getSession } from "@/lib/auth";
import { deleteProductAction, toggleAvailableAction } from "./actions";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      include: { brand: true, category: true, images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const promoCount = products.filter((p) => p.isPromotion).length;
  const newCount = products.filter((p) => p.isNew).length;
  const outOfStock = products.filter((p) => !p.available).length;

  return (
    <AdminShell active="/admin" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Tableau de bord</p>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display mt-2 text-3xl">Produits</h1><p className="mt-1 text-sm text-stone">Ajoutez, modifiez, archivez ou supprimez vos montures.</p></div><Link href="/admin/produits/nouveau" className="min-h-11 rounded-full bg-red px-5 py-3 text-sm font-medium text-white hover:bg-red-dark">+ Ajouter une lunette</Link></div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Produits", value: products.length },
          { label: "En promotion", value: promoCount },
          { label: "Nouveautés", value: newCount },
          { label: "Indisponibles", value: outOfStock },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-2xl font-display">{s.value}</p>
            <p className="mt-1 text-sm text-stone">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-display text-xl">Tous les produits</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-mist text-left text-xs uppercase tracking-wide text-stone">
                <tr>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Marque</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
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
                    <td className="px-4 py-3">{formatDT(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.available ? "bg-emerald-50 text-emerald-700" : "bg-mist text-stone"}`}>
                        {p.available ? "Publié" : "Indisponible"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/produits/${p.id}`} className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-red hover:text-red">
                          Modifier
                        </Link>
                        <form action={toggleAvailableAction.bind(null, p.id, p.available)}>
                          <button className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-red hover:text-red">
                            {p.available ? "Rendre indisponible" : "Rendre disponible"}
                          </button>
                        </form>
                        <form action={deleteProductAction.bind(null, p.id)}>
                          <ConfirmSubmitButton confirmMessage={`Supprimer définitivement "${p.name}" ?`} className="rounded-full border border-red/30 px-3 py-1.5 text-xs text-red hover:bg-red hover:text-white">
                            Supprimer
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-stone">Aucun produit. Lancez <code>npx prisma db seed</code>.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-display text-lg">Marques</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {brands.map((b) => (
                <li key={b.id} className="flex justify-between text-stone">
                  <span className="text-ink">{b.name}</span>
                  <span>{products.filter((p) => p.brandId === b.id).length}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-display text-lg">Catégories</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.id} className="flex justify-between text-stone">
                  <span className="text-ink">{c.name}</span>
                  <span>{products.filter((p) => p.categoryId === c.id).length}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link href="/" className="block text-center text-sm text-stone hover:text-red">← Retour au site</Link>
        </div>
      </div>
    </AdminShell>
  );
}
