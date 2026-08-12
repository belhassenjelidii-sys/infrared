import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import ImageUploadField from "@/components/ImageUploadField";
import {
  updateProductAction,
  addProductImageAction,
  removeProductImageAction,
  deleteProductFullAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <AdminShell active="/admin" name={session?.name} email={session?.email} role={session?.role}>
      <Link href="/admin" className="text-sm text-stone hover:text-red">← Retour aux produits</Link>
      <h1 className="font-display mt-2 text-3xl">{product.name}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form action={updateProductAction.bind(null, product.id)} className="space-y-4 rounded-2xl border border-line bg-white p-6">
          <div>
            <label className="text-sm font-medium">Nom</label>
            <input name="name" defaultValue={product.name} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea name="description" defaultValue={product.description} rows={4} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Prix (DT)</label>
              <input type="number" step="0.01" name="price" defaultValue={Number(product.price)} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Ancien prix (promo, optionnel)</label>
              <input type="number" step="0.01" name="oldPrice" defaultValue={product.oldPrice ? Number(product.oldPrice) : ""} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Couleur</label>
              <input name="color" defaultValue={product.color ?? ""} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Forme</label>
              <select name="shape" defaultValue={product.shape ?? "Rectangle"} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm">
                {["Rectangle", "Carrée", "Ronde", "Ovale", "Vintage"].map((shape) => <option key={shape} value={shape}>{shape}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Cible</label>
              <select name="target" defaultValue={product.target} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm">
                {["HOMME", "FEMME", "MIXTE", "ENFANT"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Catégorie</label>
              <select name="categoryId" defaultValue={product.categoryId} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Marque</label>
              <select name="brandId" defaultValue={product.brandId} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm">
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 pt-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="available" defaultChecked={product.available} /> Disponible</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product.featured} /> Mis en avant</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="isNew" defaultChecked={product.isNew} /> Nouveauté</label>
          </div>
          <button className="rounded-full bg-red px-6 py-2.5 text-sm font-medium text-white hover:bg-red-dark">Enregistrer</button>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-display text-lg">Photos</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {product.images.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-mist">
                  <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" />
                  <form action={removeProductImageAction.bind(null, product.id, img.id)} className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-opacity group-hover:bg-ink/50 group-hover:opacity-100">
                    <button className="rounded-full bg-white px-2 py-1 text-[10px] font-medium">Retirer</button>
                  </form>
                </div>
              ))}
            </div>
            <form action={addProductImageAction.bind(null, product.id)} className="mt-4 space-y-3">
              <ImageUploadField name="url" label="Nouvelle photo" compact />
              <input name="alt" placeholder="Texte alternatif (optionnel)" className="min-h-11 w-full rounded-lg border border-line px-3 py-2 text-xs" />
              <button className="min-h-11 w-full rounded-full border border-line py-2 text-xs font-medium hover:border-red hover:text-red">+ Ajouter cette photo</button>
            </form>
          </div>

          <form action={deleteProductFullAction.bind(null, product.id)}>
            <ConfirmSubmitButton confirmMessage={`Supprimer définitivement "${product.name}" ?`} className="w-full rounded-full border border-red/30 py-2.5 text-sm text-red hover:bg-red hover:text-white">
              Supprimer ce produit
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
