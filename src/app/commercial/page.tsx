import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import Logo from "@/components/Logo";
import ImageUploadField from "@/components/ImageUploadField";
import {
  updateProductCommercialAction,
  addProductImageCommercialAction,
  removeProductImageCommercialAction,
} from "./actions";

export const metadata: Metadata = { title: "Espace commercial", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CommercialPage() {
  const session = await getSession();
  const products = await prisma.product.findMany({
    include: { brand: true, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-mist">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white lg:block">
        <div className="border-b border-line px-5 py-5"><Logo mark /></div>
        <nav className="flex flex-col gap-0.5 p-3">
          <span className="rounded-lg bg-red-soft px-3 py-2.5 text-sm font-medium text-red">Produits — Prix, Photos, Disponibilité</span>
        </nav>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-sm font-medium">Commercial — {session?.name}</p>
            <p className="text-xs text-stone">{session?.email}</p>
          </div>
          <form action={logoutAction}>
            <button className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-stone hover:border-red hover:text-red">
              <LogOut size={13} /> Déconnexion
            </button>
          </form>
        </div>

        <div className="px-5 py-8 sm:px-8">
          <p className="eyebrow text-red">Espace commercial</p>
          <h1 className="font-display mt-2 text-3xl">Mes produits</h1>
          <p className="mt-2 text-sm text-stone">
            Vous pouvez modifier le prix, la disponibilité et les photos.
            Nom, description, marque et catégorie restent réservés à
            l&apos;Admin.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="grid grid-cols-3 gap-1.5">
                  {p.images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-mist">
                      <Image src={img.url} alt="" fill className="object-cover" />
                      <form action={removeProductImageCommercialAction.bind(null, p.id, img.id)} className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:bg-ink/50 group-hover:opacity-100">
                        <button className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-medium">Retirer</button>
                      </form>
                    </div>
                  ))}
                  {p.images.length === 0 && (
                    <div className="col-span-3 flex aspect-[3/1] items-center justify-center rounded-lg bg-mist text-[11px] text-stone">Aucune photo</div>
                  )}
                </div>
                <form action={addProductImageCommercialAction.bind(null, p.id)} className="mt-3 space-y-2">
                  <ImageUploadField name="url" label="Ajouter une photo" compact />
                  <button className="min-h-11 w-full rounded-full border border-line text-xs font-medium hover:border-red hover:text-red">+ Enregistrer la photo</button>
                </form>

                <p className="mt-3 font-display">{p.name}</p>
                <p className="text-xs text-stone">{p.brand.name}</p>

                <form action={updateProductCommercialAction.bind(null, p.id)} className="mt-3 space-y-2 border-t border-line pt-3">
                  <div>
                    <label className="text-xs font-medium">Prix (DT)</label>
                    <input type="number" step="0.01" name="price" defaultValue={Number(p.price)} className="mt-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" name="available" defaultChecked={p.available} /> Disponible en boutique
                  </label>
                  <button className="w-full rounded-full bg-red py-2 text-xs font-medium text-white hover:bg-red-dark">Enregistrer</button>
                </form>
              </div>
            ))}
          </div>

          <Link href="/" className="mt-8 block text-center text-sm text-stone hover:text-red">← Retour au site</Link>
        </div>
      </div>
    </div>
  );
}
