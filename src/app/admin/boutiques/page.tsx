import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { createStoreAction, updateStoreAction, deleteStoreAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const session = await getSession();
  const stores = await prisma.store.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <AdminShell active="/admin/boutiques" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Nos boutiques</h1>
      <p className="mt-2 text-sm text-stone">
        Ce qui est ici s&apos;affiche directement sur la page publique{" "}
        <code>/boutique</code>.
      </p>

      <div className="mt-8 space-y-4">
        {stores.map((s) => (
          <form
            key={s.id}
            action={updateStoreAction.bind(null, s.id)}
            className="grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 flex items-center justify-between">
              <h3 className="font-display text-lg">{s.name}</h3>
              <form action={deleteStoreAction.bind(null, s.id)}>
                <ConfirmSubmitButton confirmMessage={`Supprimer la boutique "${s.name}" ?`} className="rounded-full border border-red/30 px-3 py-1 text-xs text-red hover:bg-red hover:text-white">
                  Supprimer
                </ConfirmSubmitButton>
              </form>
            </div>
            <div>
              <label className="text-xs font-medium">Nom</label>
              <input name="name" defaultValue={s.name} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Adresse</label>
              <input name="address" defaultValue={s.address} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Mobile</label>
              <input name="mobile" defaultValue={s.mobile} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Fixe (optionnel)</label>
              <input name="landline" defaultValue={s.landline ?? ""} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Lien Google Maps</label>
              <input name="mapsUrl" defaultValue={s.mapsUrl ?? ""} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Requête carte intégrée</label>
              <input name="mapsEmbedQuery" defaultValue={s.mapsEmbedQuery ?? ""} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">Photo (URL)</label>
              <input name="photo" defaultValue={s.photo ?? ""} placeholder="https://…" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <button className="rounded-full bg-red px-5 py-2 text-sm font-medium text-white hover:bg-red-dark">Enregistrer</button>
            </div>
          </form>
        ))}
      </div>

      <form action={createStoreAction} className="mt-8 grid gap-3 rounded-2xl border border-dashed border-line bg-white p-5 sm:grid-cols-2">
        <h3 className="font-display text-lg sm:col-span-2">+ Nouvelle boutique</h3>
        <input name="name" placeholder="Nom" required className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="address" placeholder="Adresse" required className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="mobile" placeholder="Mobile" required className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="landline" placeholder="Fixe (optionnel)" className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="mapsUrl" placeholder="Lien Google Maps" className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
        <input name="photo" placeholder="URL photo (optionnel)" className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
        <button className="sm:col-span-2 rounded-full bg-red py-2.5 text-sm font-medium text-white hover:bg-red-dark">Ajouter</button>
      </form>
    </AdminShell>
  );
}
