import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { createBrandAction, updateBrandAction, toggleBrandActiveAction, deleteBrandAction } from "./actions";
import Link from "next/link";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const session = await requirePagePermission("brands.manage");
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell active="/admin/marques" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Marques</h1>
      <p className="mt-3 text-sm text-stone">Les logos sont contenus automatiquement dans le petit format de la barre animée. <Link href="/admin/parametres/nos-maisons" className="font-medium text-red hover:text-red-dark">Régler la vitesse de la barre</Link></p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-mist text-left text-xs uppercase tracking-wide text-stone">
              <tr><th className="px-4 py-3">Barre</th><th className="px-4 py-3">Marque</th><th className="px-4 py-3">Produits</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-line bg-mist">{b.marqueeImage ? <img src={b.marqueeImage} alt={`Collection ${b.name}`} className="h-full w-full object-cover" /> : b.logo ? <img src={b.logo} alt={`Logo ${b.name}`} className="h-full w-full object-contain p-1" /> : <span className="text-[10px] text-stone">Sans image</span>}</div></td>
                  <td className="px-4 py-3">
                    <form action={updateBrandAction.bind(null, b.id)} className="flex min-w-[260px] gap-2">
                      <input name="name" defaultValue={b.name} className="min-h-10 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm" />
                      <input name="logo" defaultValue={b.logo ?? ""} placeholder="URL du logo" className="hidden w-40 rounded-lg border border-line px-2 text-xs xl:block" />
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
                      <Link href={`/admin/marques/${b.id}`} className="rounded-full bg-ink px-3 py-1.5 text-xs text-white hover:bg-red">Logo / photos</Link>
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
          <ImageUploadField name="logo" label="Logo de la marque" folder="brands" compact />
          <ImageUploadField name="marqueeImage" label="Photo carrée de la barre" folder="brands" compact />
          <button className="w-full rounded-full bg-red py-2.5 text-sm font-medium text-white hover:bg-red-dark">Ajouter</button>
        </form>
      </div>
    </AdminShell>
  );
}
