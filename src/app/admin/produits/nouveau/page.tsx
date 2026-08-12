import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ImageUploadField from "@/components/ImageUploadField";
import { createProductAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getSession();
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminShell active="/admin" name={session?.name} email={session?.email} role={session?.role}>
      <Link href="/admin" className="text-sm text-stone hover:text-red">← Retour aux produits</Link>
      <p className="eyebrow mt-5 text-red">Catalogue</p>
      <h1 className="font-display mt-2 text-3xl">Ajouter une lunette</h1>

      <form action={createProductAction} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
          <div>
            <label className="text-sm font-medium">Nom du modèle</label>
            <input name="name" required placeholder="Ex. Carrera 1023/S" className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Référence</label>
            <input name="reference" required placeholder="Ex. IR-CARRERA1023S" className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea name="description" required rows={5} placeholder="Description du modèle…" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Prix (DT)</label><input type="number" step="0.01" name="price" required className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div><label className="text-sm font-medium">Ancien prix (promotion)</label><input type="number" step="0.01" name="oldPrice" className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div><label className="text-sm font-medium">Couleur</label><input name="color" className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div><label className="text-sm font-medium">Forme</label><select name="shape" className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm">{["Rectangle","Carrée","Ronde","Ovale","Vintage"].map(x => <option key={x}>{x}</option>)}</select></div>
            <div><label className="text-sm font-medium">Cible</label><select name="target" defaultValue="MIXTE" className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm">{["HOMME","FEMME","MIXTE","ENFANT"].map(x => <option key={x}>{x}</option>)}</select></div>
            <div><label className="text-sm font-medium">Catégorie</label><select name="categoryId" required className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm">{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium">Marque</label><select name="brandId" required className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm">{brands.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
          </div>

          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="available" defaultChecked /> Disponible</label>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="featured" /> Mis en avant</label>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="isNew" /> Nouveauté</label>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg">Photo principale</h2>
            <div className="mt-4">
              <ImageUploadField name="imageUrl" label="Importer / coller l'image" />
            </div>
            <input name="imageAlt" placeholder="Texte alternatif" className="mt-3 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <button className="min-h-12 w-full rounded-full bg-red px-6 text-sm font-medium text-white hover:bg-red-dark">Créer le produit</button>
        </div>
      </form>
    </AdminShell>
  );
}
