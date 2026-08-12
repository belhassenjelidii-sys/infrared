import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { createBrandAction, updateBrandAction, toggleBrandActiveAction, deleteBrandAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const session = await getSession();
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell active="/admin/marques" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Marques</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-mist text-left text-xs uppercase tracking-wide text-stone">
              <tr><th className="px-4 py-3">Marque</th><th className="px-4 py-3">Produits</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <form action={updateBrandAction.bind(null, b.id)} className="flex min-w-[260px] gap-2">
                      <input name="name" defaultValue={b.name} className="min-h-10 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm" />
                      <input name="logo" defaultValue={b.logo ?? ""} placeholder="Logo URL" className="hidden w-32 rounded-lg border border-line px-2 text-xs xl:block" />
                      <button className="rounded-lg border border-line px-3 text-xs hover:border-red hover:text-red">Enregistrer</button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-stone">{b._count.products}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${b.active ? "bg-emerald-50 text-emerald-700" : "bg-mist text-stone"}`}>
                      {b.active ? "Active" : "Masquée"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <form action={toggleBrandActiveAction.bind(null, b.id, b.active)}>
                        <button className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-red hover:text-red">{b.active ? "Masquer" : "Activer"}</button>
                      </form>
                      <form action={deleteBrandAction.bind(null, b.id)}>
                        <ConfirmSubmitButton confirmMessage={`Supprimer la marque "${b.name}" ?`} className="rounded-full border border-red/30 px-3 py-1.5 text-xs text-red hover:bg-red hover:text-white">
                          Supprimer
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createBrandAction} className="h-fit space-y-3 rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-lg">+ Nouvelle marque</h3>
          <input name="name" placeholder="Nom (ex: Dior)" required className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <input name="logo" placeholder="URL du logo (optionnel)" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <button className="w-full rounded-full bg-red py-2.5 text-sm font-medium text-white hover:bg-red-dark">Ajouter</button>
        </form>
      </div>
    </AdminShell>
  );
}
