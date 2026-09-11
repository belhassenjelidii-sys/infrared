import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { createCategoryAction, updateCategoryAction, toggleCategoryActiveAction, deleteCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await requirePagePermission("categories.manage");
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell active="/admin/categories" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Catégories</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-mist text-left text-xs uppercase tracking-wide text-stone">
              <tr><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Produits</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <form action={updateCategoryAction.bind(null, c.id)} className="grid min-w-[340px] gap-2 sm:grid-cols-2">
                      <input name="name" defaultValue={c.name} className="min-h-10 rounded-lg border border-line px-3 text-sm" />
                      <input name="description" defaultValue={c.description ?? ""} placeholder="Description" className="min-h-10 rounded-lg border border-line px-3 text-xs" />
                      <input name="image" defaultValue={c.image ?? ""} placeholder="Image URL" className="min-h-10 rounded-lg border border-line px-3 text-xs sm:col-span-2" />
                      <button className="min-h-10 rounded-lg border border-line px-3 text-xs hover:border-red hover:text-red sm:col-span-2">Enregistrer</button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-stone">{c._count.products}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-mist text-stone"}`}>
                      {c.active ? "Active" : "Masquée"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <form action={toggleCategoryActiveAction.bind(null, c.id, c.active)}>
                        <button className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-red hover:text-red">{c.active ? "Masquer" : "Activer"}</button>
                      </form>
                      <form action={deleteCategoryAction.bind(null, c.id)}>
                        <ConfirmSubmitButton confirmMessage={`Supprimer la catégorie "${c.name}" ?`} className="rounded-full border border-red/30 px-3 py-1.5 text-xs text-red hover:bg-red hover:text-white">
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

        <form action={createCategoryAction} className="h-fit space-y-3 rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-lg">+ Nouvelle catégorie</h3>
          <input name="name" placeholder="Nom (ex: Lunettes de sport)" required className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <textarea name="description" placeholder="Description (optionnel)" rows={3} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <input name="image" placeholder="URL de la photo (optionnel)" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <button className="w-full rounded-full bg-red py-2.5 text-sm font-medium text-white hover:bg-red-dark">Ajouter</button>
        </form>
      </div>
    </AdminShell>
  );
}
